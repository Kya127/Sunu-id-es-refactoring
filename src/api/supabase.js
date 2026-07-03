// On importe la fonction { createClient } depuis le module installé via NPM.
import { createClient } from '@supabase/supabase-js';

// Récupèration des variables d'environnement sécurisées
const supabase_Url = import.meta.env.VITE_SUPABASE_URL;
const supabase_key = import.meta.env.VITE_SUPABASE_ANON_KEY;

//On crée le client supabase
const supabase = createClient(supabase_Url,supabase_key);

// Fonction pour récupérer toutes les idées triées par date

export async function chargerIdeesDepuisSupabase() {
  try {
    const { data, error } = await supabase
      .from('ideas')
      .select('*')
      .order('id', { ascending: false }); // Plus récentes en premier

    if (error) throw error;
    return data || [];
    
  } catch (error) {
    console.error("Erreur de chargement Supabase:", error.message);
    return []
    
  }
}


// Fonction pour insérer une nouvelle idée

export async function enregistrerIdee(titre, categorie,description) {
    try {
        const { data, error } = await supabase
            .from('ideas')
            .insert([{ titre, categorie,description }])
            .select();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error("Erreur lors de l'enregistrement de l'idée :", error.message);
        throw error; // On propage l'erreur pour que le main.js puisse avertir l'utilisateur
    }
}

// Requête UPDATE sur Supabase
export async function modifierIdeeEnBase(id, nouveauTitre, nouvelleDesc) {
    const { error } = await supabase
        .from('ideas')
        .update({ titre: nouveauTitre, description: nouvelleDesc })
        .eq('id', id); 

    if (error) throw error; 
}


// Dans supabase.js
export async function supprimerIdeeEnBase(id) {
    const { error } = await supabase
        .from('ideas')
        .delete()
        .eq('id', id);

    if (error) throw error;
}