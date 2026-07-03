// ==========================================
// 1. LES IMPORTS
// ==========================================

import {chargerIdeesDepuisSupabase, enregistrerIdee, modifierIdeeEnBase, supprimerIdeeEnBase } from './api/supabase.js';
import { analyseIdees } from './api/openrouter.js'

// ==========================================
// 2. LES VARIABLES D'ÉTAT GLOBALES & DOM
// ==========================================
let idees = []; 
let ideeEnEdition = null;   
let ideeASupprimer = null;
let vueActuelle = 'grid';

const formulaire      = document.getElementById("idee-form");
const titreInput      = document.getElementById("titre");
const categorieInput  = document.getElementById("categorie");
const descriptionInput= document.getElementById("description");
const listeIdees      = document.getElementById("liste-idees");
const submitBtn       = document.getElementById("submit-btn");
const formTitle       = document.getElementById("form-title");
const searchInput     = document.getElementById("search-input");
const filterCategorie = document.getElementById("filter-categorie");
const filterTri       = document.getElementById("filter-tri");
const countBadge      = document.getElementById("count-badge");
const countHeader     = document.getElementById("count-header");
const mobileCount     = document.getElementById("mobile-count");
const CATEGORIES = {
  "Pédagogie":             { badge: "badge-pedagogie",  border: "border-pedagogie",  label: "PÉDAGOGIE" },
  "Événement":             { badge: "badge-evenement",  border: "border-evenement",  label: "ÉVÉNEMENT" },
  "Vie de campus":         { badge: "badge-campus",     border: "border-campus",     label: "VIE DE CAMPUS" },
  "Amélioration technique":{ badge: "badge-tech",       border: "border-tech",       label: "AMÉLIORATION TECH" },
};



// ==========================================
// 3. LES FONCTIONS D'AFFICHAGE (UI / DOM)
// ==========================================

// Fonction utilitaire pour adapter l'affichage des dates Supabase
function formatDate(dateValue) {
  if (!dateValue) return "À l'instant";
  const timestamp = new Date(dateValue).getTime();
  const now = Date.now();
  const diff = now - timestamp;
  const min  = Math.floor(diff / 60000);
  const h    = Math.floor(diff / 3600000);
  const d    = Math.floor(diff / 86400000);
  
  if (min < 1)  return "À l'instant";
  if (min < 60) return `Il y a ${min} min`;
  if (h < 24)   return `Il y a ${h}h`;
  if (d === 1)  return "Hier";
  
  const date = new Date(timestamp);
  return `${date.getDate()} ${date.toLocaleString('fr-FR',{month:'short'})}`;
}

function majCompteurs() {
  const n = idees.length;
  if (countBadge)  countBadge.textContent = n;
  if (mobileCount) mobileCount.textContent = n;
  if (countHeader) {
    countHeader.textContent = n;
    const statsDiv = document.getElementById("stats-header");
    if (statsDiv) statsDiv.classList.toggle("hidden", n === 0);
  }
}

function showToast(msg) {
  const toast = document.getElementById("toast");
  const toastMsg = document.getElementById("toast-msg");
  if(!toast || !toastMsg) return;
  toastMsg.textContent = msg;
  toast.classList.remove("hidden");
  toast.classList.add("flex");
  setTimeout(() => {
    toast.classList.add("hidden");
    toast.classList.remove("flex");
  }, 2500);
}

function filtrerIdees() {
  const q   = searchInput.value.toLowerCase().trim();
  const cat = filterCategorie.value;
  const tri = filterTri.value;

  let result = [...idees];
  if (q)   result = result.filter(i => i.titre.toLowerCase().includes(q) || i.description.toLowerCase().includes(q));
  if (cat) result = result.filter(i => i.categorie === cat);
  
  // Utilisation de l'ID ou de la date pour le tri
  result.sort((a, b) => tri === 'ancien' ? a.id - b.id : b.id - a.id);
  return result;
}

// ─── VUE TOGGLE ─────────────────────────────────────────
function setView(v) {
  vueActuelle = v;
  const btnGrid = document.getElementById("btn-grid");
  const btnList = document.getElementById("btn-list");
  if (v === 'grid') {
    listeIdees.className = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 transition-all";
    if(btnGrid) btnGrid.classList.add("bg-white", "text-brand", "shadow-sm");
    if(btnGrid) btnGrid.classList.remove("text-slate-400");
    if(btnList) btnList.classList.remove("bg-white", "text-brand", "shadow-sm");
    if(btnList) btnList.classList.add("text-slate-400");
  } else {
    listeIdees.className = "flex flex-col gap-3 transition-all";
    if(btnList) btnList.classList.add("bg-white", "text-brand", "shadow-sm");
    if(btnList) btnList.classList.remove("text-slate-400");
    if(btnGrid) btnGrid.classList.remove("bg-white", "text-brand", "shadow-sm");
    if(btnGrid) btnGrid.classList.add("text-slate-400");
  }
  afficherListeIdee();
}

// window.setView pour que les boutons HTML gardent l'accès à la fonction avec le type="module"
window.setView = setView; 

// ─── AFFICHAGE CARTES ───────────────────────────────────
function creerCarte(idee, index) {
  const config = CATEGORIES[idee.categorie] || { badge: "bg-slate-100 text-slate-600", border: "border-slate-300", label: idee.categorie };
  
  // Remplacement de idee.id par idee.date (le timestamp de Supabase)
  const dateStr = formatDate(idee.date);

  const carte = document.createElement("article");
  carte.setAttribute("data-id", idee.id);
  carte.className = `idea-card bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden
  hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 card-enter
  border-l-4 ${config.border} flex flex-col`;
  carte.style.animationDelay = `${index * 40}ms`;

  const isListView = vueActuelle === 'list';

  carte.innerHTML = `
    <div class="p-4 flex flex-col gap-3 flex-1 ${isListView ? 'md:flex-row md:items-start md:gap-4' : ''}">
      ${isListView ? `<div class="flex-1 min-w-0">` : ''}
        <div class="flex items-center justify-between gap-2">
          <span class="inline-block text-[10px] font-bold tracking-wider px-2.5 py-1 rounded-full ${config.badge}">
            ${config.label}
          </span>
          <span class="text-xs text-slate-400 whitespace-nowrap">${dateStr}</span>
        </div>
        <h3 class="font-bold text-slate-900 text-[15px] leading-snug line-clamp-2 mt-1">
          ${escapeHtml(idee.titre)}
        </h3>
        <p class="text-slate-500 text-xs leading-relaxed line-clamp-3">
          ${escapeHtml(idee.description)}
        </p>
      ${isListView ? `</div>` : ''}

      <div class="flex items-center justify-between pt-2 border-t border-slate-50 mt-auto ${isListView ? 'md:pt-0 md:border-0 md:flex-col md:items-end md:gap-2 md:min-w-[80px]' : ''}">
        <div class="flex items-center gap-2">
          <div class="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-200 to-purple-200 flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6366F1" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </div>
          <span class="text-xs text-slate-500 font-medium">Anonyme</span>
        </div>

        <div class="flex items-center gap-1">
          <button
            onclick="ouvrirModalModifier(${idee.id})"
            title="Modifier"
            class="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-brand hover:bg-brand-light transition-all duration-150 group">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="group-hover:scale-110 transition-transform">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
          <button
            onclick="ouvrirModalSupprimer(${idee.id})"
            title="Supprimer"
            class="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all duration-150 group">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="group-hover:scale-110 transition-transform">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
              <path d="M10 11v6"/><path d="M14 11v6"/>
              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  `;

  return carte;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

// ─── ÉTAT VIDE ──────────────────────────────────────────
function afficherEtatVide(filtreActif) {
  listeIdees.innerHTML = "";
  const empty = document.createElement("div");
  empty.className = "col-span-full bg-white rounded-2xl border border-slate-100 shadow-sm p-10 text-center card-enter";

  if (filtreActif) {
    empty.innerHTML = `
      <div class="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
      </div>
      <h3 class="font-bold text-slate-900 text-base mb-2">Aucun résultat trouvé</h3>
      <p class="text-slate-500 text-sm max-w-xs mx-auto">Essayez de modifier vos critères de recherche ou de filtrage.</p>
    `;
  } else {
    empty.innerHTML = `
      <div class="w-32 h-32 mx-auto mb-5 rounded-2xl overflow-hidden bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 flex items-center justify-center">
        <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="32" cy="50" r="14" fill="white" opacity="0.7"/>
          <circle cx="32" cy="38" r="3" fill="#4F46E5"/>
          <path d="M32 28 Q32 38 32 38" stroke="#4F46E5" stroke-width="2"/>
          <path d="M24 20 Q28 10 32 14 Q36 10 40 20 Q44 28 36 30 Q32 32 28 30 Q20 28 24 20Z" fill="#4F46E5" opacity="0.15" stroke="#4F46E5" stroke-width="1.5"/>
          <circle cx="32" cy="18" r="4" fill="#FDE68A"/>
          <rect x="30" y="21" width="4" height="3" rx="1" fill="#D97706"/>
        </svg>
      </div>
      <h3 class="font-bold text-slate-900 text-xl mb-2">Aucune idée proposée pour le moment.</h3>
      <p class="text-slate-500 text-sm max-w-sm mx-auto mb-6 leading-relaxed">
        Le mur d'idées est encore vierge. C'est l'occasion idéale pour partager votre première initiative et inspirer la communauté Sunu-Idée !
      </p>
      <button onclick="document.getElementById('titre').focus()" class="inline-flex items-center gap-2 px-6 py-3 bg-brand text-white font-semibold text-sm rounded-2xl hover:bg-brand-dark transition shadow-sm">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Soyez le premier à contribuer
      </button>
    `;
  }
  listeIdees.appendChild(empty);
}

// ─── AFFICHER LISTE ─────────────────────────────────────
function afficherListeIdee() {
  const filtered = filtrerIdees();
  majCompteurs();

  if (filtered.length === 0) {
    const filtreActif = searchInput.value.trim() !== '' || filterCategorie.value !== '';
    afficherEtatVide(filtreActif);
    return;
  }

  listeIdees.innerHTML = "";
  filtered.forEach((idee, index) => {
    listeIdees.appendChild(creerCarte(idee, index));
  });
}

// ─── MODAL MODIFIER (UPDATE) ───────────────────────────
function ouvrirModalModifier(id) {
  const idee = idees.find(i => i.id === id);
  if (!idee) return;
  ideeEnEdition = id;
  document.getElementById("modal-titre").value       = idee.titre;
  document.getElementById("modal-description").value = idee.description;

  const modal = document.getElementById("modal-modifier");
  if(modal) {
    modal.classList.remove("hidden");
    modal.classList.add("flex");
  }
  setTimeout(() => document.getElementById("modal-titre").focus(), 100);
}

function fermerModalModifier() {
  const modal = document.getElementById("modal-modifier");
  if(modal) {
    modal.classList.add("hidden");
    modal.classList.remove("flex");
  }
  ideeEnEdition = null;
}

async function sauvegarderModification() {
  const nouveauTitre = document.getElementById("modal-titre").value.trim();
  const nouvelleDesc = document.getElementById("modal-description").value.trim();
  if (!nouveauTitre || !nouvelleDesc) return;

  try {
   
    await modifierIdeeEnBase(ideeEnEdition, nouveauTitre, nouvelleDesc);

    // Mise à jour de la variable locale
    idees = idees.map(idee => {
      if (idee.id === ideeEnEdition) {
        return { ...idee, titre: nouveauTitre, description: nouvelleDesc };
      }
      return idee;
    });

    afficherListeIdee();
    fermerModalModifier();
    showToast("Idée modifiée avec succès ✓");
  } catch (error) {
    console.error("Erreur d'édition :", error.message);
    showToast("Erreur lors de la modification ❌");
  }
}
// Liaison des fonctions globales aux fenêtres 
window.ouvrirModalModifier = ouvrirModalModifier;
window.fermerModalModifier = fermerModalModifier;
window.sauvegarderModification = sauvegarderModification;

// ─── MODAL SUPPRIMER (DELETE) ───────────────────────────
function ouvrirModalSupprimer(id) {
  ideeASupprimer = id;
  const modal = document.getElementById("modal-supprimer");
  if(modal) {
    modal.classList.remove("hidden");
    modal.classList.add("flex");
  }
}

function fermerModalSupprimer() {
  const modal = document.getElementById("modal-supprimer");
  if(modal) {
    modal.classList.add("hidden");
    modal.classList.remove("flex");
  }
  ideeASupprimer = null;
}



async function confirmerSuppression() {
  if (ideeASupprimer === null) return;
  
  try {
    // PROPRE : On passe la variable d'état globale "ideeASupprimer" au module
    await supprimerIdeeEnBase(ideeASupprimer);

    // Retrait du tableau local
    idees = idees.filter(i => i.id !== ideeASupprimer);
    
    afficherListeIdee();
    fermerModalSupprimer();
    showToast("Idée supprimée avec succès ✓");
  } catch (error) {
    console.error("Erreur de suppression :", error.message);
    showToast("Erreur lors de la suppression ❌");
  }
}

window.ouvrirModalSupprimer = ouvrirModalSupprimer;
window.fermerModalSupprimer = fermerModalSupprimer;
window.confirmerSuppression = confirmerSuppression;

// ─── FERMER MODALS avec la touche echap du clavier ───────────────────────────
document.addEventListener("keydown", function(e) {
  if (e.key === "Escape") {
    fermerModalModifier();
    fermerModalSupprimer();
  }
});

// Enregistrer depuis modal avec Ctrl+Enter
const modalDesc = document.getElementById("modal-description");
if(modalDesc) {
  modalDesc.addEventListener("keydown", function(e) {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) sauvegarderModification();
  });
}


// ==========================================
// 5. SOUMISSION DU FORMULAIRE (CREATE)
// ==========================================

formulaire.addEventListener("submit", async function(e){
    e.preventDefault();

    const titre = titreInput.value.trim();
    const description = descriptionInput.value.trim();
    let categorieFinale = categorieInput.value;

    if (!titre || !description){
        return;
    }

    // UX : Désactiver le bouton d'envoi pour éviter le double-clic
    submitBtn.disabled = true;

    try {
        document.getElementById("ia-status").classList.remove("hidden");
    
        // Appel API OpenRouter (avec Fallback en cas de crash)
        if (!categorieFinale){
            try {
              categorieFinale = await analyseIdees(description);
              categorieFinale = categorieFinale.trim();
            } catch (errorIA) {
              console.error("Crash OpenRouter, application de la catégorie par défaut :", errorIA);
              categorieFinale = "Amélioration technique"; // Fallback
            }
        }

        // Utilisation du module Supabase
        const data = await enregistrerIdee(titre,categorieFinale,description);
        
        if (data && data.length > 0) {
            idees.unshift(data[0]); // Ajout en haut de la liste locale
        }

        afficherListeIdee();
        formulaire.reset();
        showToast("Idée publiée avec succès ✓");

    } catch(error){
        console.error(error);
        alert("Erreur de communication avec la base de données.");
    } finally {
        document.getElementById("ia-status").classList.add("hidden");
        submitBtn.disabled = false; // Réactiver le bouton
    }
});


// ─── FILTRES (live) ─────────────────────────────────────
searchInput.addEventListener("input", afficherListeIdee);
filterCategorie.addEventListener("change", afficherListeIdee);
filterTri.addEventListener("change", afficherListeIdee);

// ==========================================
// 6. L'INITIALISATION (Le démarrage au chargement de la page)
// ==========================================

async function initialiserApplication() {
    const donneesRecuperees = await chargerIdeesDepuisSupabase();
    idees = donneesRecuperees;
    afficherListeIdee();
}

// On lance le chargement au démarrage de la page
initialiserApplication();