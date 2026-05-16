import { NiveauIndicatif } from "../types/bilan"

export interface QuestionComplet {
  id: number
  section: "oral" | "ecrit" | "grammaire" | "production"
  niveau: "A1" | "A2" | "B1" | "B2"
  enonce: string
  options?: string[]       // null si production écrite
  bonne_reponse?: number   // null si production écrite
  consigne?: string        // pour production écrite uniquement
}

export const QUESTIONS_COMPLET: QuestionComplet[] = [
  // SECTION 1 — Compréhension Orale (Simplified for MVP as text-based situations)
  {
    id: 1,
    section: "oral",
    niveau: "A1",
    enonce: "Situation : Une personne vous dit : 'Excusez-moi, où se trouve la gare ?'. Que fait-elle ?",
    options: ["Elle salue", "Elle demande son chemin", "Elle achète un billet", "Elle dit au revoir"],
    bonne_reponse: 1
  },
  {
    id: 2,
    section: "oral",
    niveau: "A2",
    enonce: "Situation : Au restaurant, le serveur dit : 'Souhaitez-vous un dessert ?'. Que devez-vous répondre si vous n'avez plus faim ?",
    options: ["Oui, s'il vous plaît", "Non merci, juste l'addition", "Je voudrais une soupe", "La carte, s'il vous plaît"],
    bonne_reponse: 1
  },
  // Add more oral questions...

  // SECTION 2 — Compréhension Écrite
  {
    id: 11,
    section: "ecrit",
    niveau: "A1",
    enonce: "Panneau : 'Boulangerie fermée le lundi'. Quand pouvez-vous acheter du pain ?",
    options: ["Lundi", "Mardi", "Tous les jours", "Le soir uniquement"],
    bonne_reponse: 1
  },
  {
    id: 12,
    section: "ecrit",
    niveau: "B1",
    enonce: "Texte : 'Malgré la pluie, le festival a attiré des milliers de spectateurs.' Le festival a-t-il été un succès ?",
    options: ["Non, à cause de la pluie", "Oui, il y avait beaucoup de monde", "On ne sait pas", "Il a été annulé"],
    bonne_reponse: 1
  },

  // SECTION 3 — Grammaire / Vocabulaire
  {
    id: 21,
    section: "grammaire",
    niveau: "A2",
    enonce: "Complétez : 'Je ___ français depuis trois mois.'",
    options: ["apprends", "ai appris", "apprendrai", "apprenais"],
    bonne_reponse: 0
  },
  {
    id: 22,
    section: "grammaire",
    niveau: "B1",
    enonce: "Choisissez la forme correcte : 'Il faut que nous ___ plus tôt demain.'",
    options: ["partons", "partions", "partiront", "partirions"],
    bonne_reponse: 1
  },

  // SECTION 4 — Production Écrite
  {
    id: 31,
    section: "production",
    niveau: "A2",
    consigne: "Décrivez votre journée d'hier en quelques phrases (Passé composé).",
    enonce: "Rédigez votre réponse ici :"
  },
  {
    id: 32,
    section: "production",
    niveau: "B1",
    consigne: "Écrivez un court email pour demander un rendez-vous à la préfecture.",
    enonce: "Rédigez votre réponse ici :"
  }
]

export function calculerScoreSection(
  reponses: Record<number, number | string>,
  questions: QuestionComplet[]
): number {
  const sectionQuestions = questions.filter(q => q.section !== "production")
  if (sectionQuestions.length === 0) return 0
  
  const correct = sectionQuestions.filter(
    (q) => reponses[q.id] === q.bonne_reponse
  ).length
  return Math.round((correct / sectionQuestions.length) * 100)
}

export function calculerNiveauGlobal(scores: {
  oral: number
  ecrit: number
  grammaire: number
  production: number
}): NiveauIndicatif {
  const global = Math.round(
    (scores.oral + scores.ecrit + scores.grammaire + scores.production) / 4
  )
  if (global < 25) return "A1"
  if (global < 45) return "A2"
  if (global < 70) return "B1"
  return "B2"
}
