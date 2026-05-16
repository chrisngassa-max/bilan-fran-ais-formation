import { NiveauIndicatif } from "../types/bilan"

export interface Question {
  id: number
  niveau: "A1" | "A2" | "B1" | "B2"
  enonce: string
  options: string[]
  bonne_reponse: number  // index 0-3
}

export const QUESTIONS: Question[] = [
  {
    id: 1,
    niveau: "A1",
    enonce: "Comment dit-on 'hello' en français ?",
    options: ["Merci", "Bonjour", "Au revoir", "Pardon"],
    bonne_reponse: 1
  },
  {
    id: 2,
    niveau: "A1",
    enonce: "Quelle phrase est correcte ?",
    options: [
      "Je suis habite Paris",
      "J'habite à Paris",
      "Moi habiter Paris",
      "Je habite Paris"
    ],
    bonne_reponse: 1
  },
  {
    id: 3,
    niveau: "A2",
    enonce: "Choisissez la bonne réponse : 'Hier, je ___ au marché.'",
    options: ["vais", "suis allé", "allais", "irai"],
    bonne_reponse: 1
  },
  {
    id: 4,
    niveau: "A2",
    enonce: "Que signifie 'un justificatif de domicile' ?",
    options: [
      "Un document pour voyager",
      "Un document qui prouve où vous habitez",
      "Un document de travail",
      "Un document scolaire"
    ],
    bonne_reponse: 1
  },
  {
    id: 5,
    niveau: "A2",
    enonce: "Complétez : 'Il faut que tu ___ ce formulaire.'",
    options: ["remplis", "remplisse", "remplir", "remplissez"],
    bonne_reponse: 1
  },
  {
    id: 6,
    niveau: "B1",
    enonce: "Quel mot convient le mieux ? 'Le dossier a été ___ en raison d'un document manquant.'",
    options: ["accepté", "rejeté", "envoyé", "archivé"],
    bonne_reponse: 1
  },
  {
    id: 7,
    niveau: "B1",
    enonce: "Transformez au passif : 'La préfecture traite les demandes.'",
    options: [
      "Les demandes sont traitées par la préfecture.",
      "Les demandes traitent la préfecture.",
      "La préfecture est traitée par les demandes.",
      "Les demandes ont traité la préfecture."
    ],
    bonne_reponse: 0
  },
  {
    id: 8,
    niveau: "B1",
    enonce: "Choisissez le connecteur logique : 'Je n'ai pas pu renouveler mon titre ___ mon dossier était incomplet.'",
    options: ["donc", "car", "cependant", "alors"],
    bonne_reponse: 1
  },
  {
    id: 9,
    niveau: "B2",
    enonce: "Quel terme juridique désigne la procédure permettant d'acquérir la nationalité française ?",
    options: ["Régularisation", "Naturalisation", "Homologation", "Certification"],
    bonne_reponse: 1
  },
  {
    id: 10,
    niveau: "B2",
    enonce: "Choisissez la formulation administrative correcte :",
    options: [
      "Je vous écris pour dire que je veux un rendez-vous.",
      "Par la présente, je sollicite un entretien afin de faire le point sur ma situation.",
      "Bonjour, est-ce que je peux avoir un RDV ?",
      "Je voudrais bien qu'on se voit pour parler de mes papiers."
    ],
    bonne_reponse: 1
  }
]

export function calculerNiveau(score: number): NiveauIndicatif {
  // score = nombre de bonnes réponses sur 10
  if (score <= 2) return "A1"
  if (score <= 4) return "A2"
  if (score <= 6) return "B1"
  if (score <= 8) return "B1"   // B1 solide
  return "B2"
}
