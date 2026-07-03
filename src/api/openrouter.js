const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;

// ─── ANALYSE AVEC OPENROUTER ────────────────────────────
export async function analyseIdees(description){
   try {
    
    const reponse = await fetch ('https://openrouter.ai/api/v1/chat/completions',{
            method : "POST",
            headers : { 
              "Authorization": `Bearer ${OPENROUTER_API_KEY}` ,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
            model: "openai/gpt-4o-mini", // Modele pro
            messages: [
                  {
                      role: "user",
                      content: `Tu es un classificateur de catégories.
Tu dois répondre uniquement avec UN SEUL mot :

Catégories possibles :

- Pédagogie : formation, cours, apprentissage, enseignement.
- Événement : conférence, cérémonie, mariage, compétition, activité ponctuelle.
- Vie de campus : restauration, logement, bibliothèque, transport, sécurité, espaces étudiants.
- Amélioration technique : application, site web, informatique, réseau, matériel numérique.

Exemples :

Idée : Organiser une compétition de football.
Catégorie : Événement

Idée : Ajouter un système de connexion à l'application.
Catégorie : Amélioration technique

Idée : Créer une nouvelle salle d'étude.
Catégorie : Vie de campus

Idée : Mettre en place des cours de JavaScript.
Catégorie : Pédagogie

Idée : ${description}

Réponds uniquement par :
Pédagogie
Événement
Vie de campus
Amélioration technique`
                  }
              ],
              temperature: 0
            })                
         }
    );

    if(!reponse.ok) throw new Error("Erreur HTTP OpenRouter");
    const data = await reponse.json();
    return data.choices[0].message.content;

   } catch (error) {
     console.error("Erreur dans le module OpenRouter :", error.message);
     throw error;
   }
}