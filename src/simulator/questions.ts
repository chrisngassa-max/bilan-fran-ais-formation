import type { AdminGoal, Availability, FormatPreference } from "@/shared/simulationResult";
import type { LinguisticAnswers } from "./scoring";

export type LinguisticKey = keyof LinguisticAnswers;

export type ChoiceQuestion = {
  id: string;
  type: "linguistic";
  field: LinguisticKey;
  label: string;
  help?: string;
  options: { label: string; value: number }[];
};

export type GoalQuestion = {
  id: "objectif";
  type: "goal";
  label: string;
  options: { label: string; value: AdminGoal }[];
};

export type DeadlineQuestion = {
  id: "deadline";
  type: "deadline";
  label: string;
  options: { label: string; value: number | null }[];
};

export type ProcedureQuestion = {
  id: "procedure";
  type: "procedure";
  label: string;
  options: { label: string; value: boolean }[];
};

export type ProfessionalQuestion = {
  id: "professionnel";
  type: "professional";
  label: string;
  options: { label: string; value: boolean }[];
};

export type AvailabilityQuestion = {
  id: "disponibilite";
  type: "availability";
  label: string;
  options: { label: string; value: Availability }[];
};

export type FormatQuestion = {
  id: "format";
  type: "format";
  label: string;
  options: { label: string; value: FormatPreference }[];
};

export type Question =
  | ChoiceQuestion
  | GoalQuestion
  | DeadlineQuestion
  | ProcedureQuestion
  | ProfessionalQuestion
  | AvailabilityQuestion
  | FormatQuestion;

const lvl = (l: string, v: number) => ({ label: l, value: v });

export const QUESTIONS: Question[] = [
  {
    id: "objectif",
    type: "goal",
    label: "Quel est votre objectif principal ?",
    options: [
      { label: "Carte de séjour pluriannuelle", value: "carte_pluriannuelle" },
      { label: "Carte de résident 10 ans", value: "carte_resident" },
      { label: "Naturalisation française", value: "naturalisation" },
      { label: "Emploi / français professionnel", value: "travail" },
      { label: "Vie quotidienne", value: "vie_quotidienne" },
      { label: "Remise à niveau", value: "remise_a_niveau" },
      { label: "Préparation au TCF", value: "preparation_tcf" },
    ],
  },
  {
    id: "co",
    type: "linguistic",
    field: "comprehension_orale",
    label: "Quand on vous parle en français, vous comprenez :",
    options: [
      lvl("Quasiment rien", 0),
      lvl("Quelques mots simples", 1),
      lvl("Les conversations courantes", 2),
      lvl("Presque tout, même des conversations rapides", 3),
    ],
  },
  {
    id: "ce",
    type: "linguistic",
    field: "comprehension_ecrite",
    label: "À l'écrit (mails, affiches, formulaires), vous comprenez :",
    options: [
      lvl("Très peu", 0),
      lvl("Les phrases simples", 1),
      lvl("Les textes courants", 2),
      lvl("Des textes longs ou administratifs", 3),
    ],
  },
  {
    id: "ee",
    type: "linguistic",
    field: "expression_ecrite",
    label: "À l'écrit, vous pouvez :",
    options: [
      lvl("Écrire mon nom et quelques mots", 0),
      lvl("Écrire des phrases simples", 1),
      lvl("Écrire un message ou un email court", 2),
      lvl("Rédiger un courrier ou une lettre formelle", 3),
    ],
  },
  {
    id: "eo",
    type: "linguistic",
    field: "expression_orale",
    label: "À l'oral, vous arrivez à :",
    options: [
      lvl("Dire quelques mots", 0),
      lvl("Faire des phrases simples", 1),
      lvl("Tenir une conversation du quotidien", 2),
      lvl("Discuter aisément, donner mon avis", 3),
    ],
  },
  {
    id: "voc_admin",
    type: "linguistic",
    field: "vocabulaire_admin",
    label: "Vous comprenez le vocabulaire administratif (préfecture, CAF, impôts) :",
    options: [
      lvl("Pas du tout", 0),
      lvl("Quelques mots", 1),
      lvl("La majorité avec un peu d'aide", 2),
      lvl("Très bien", 3),
    ],
  },
  {
    id: "voc_travail",
    type: "linguistic",
    field: "vocabulaire_travail",
    label: "Au travail (réunions, consignes, mails pro), vous suivez :",
    options: [
      lvl("Je ne travaille pas en français", 0),
      lvl("Difficilement", 1),
      lvl("Plutôt bien", 2),
      lvl("Sans problème", 3),
    ],
  },
  {
    id: "gram",
    type: "linguistic",
    field: "grammaire",
    label: "Conjugaisons et grammaire :",
    options: [
      lvl("Je ne maîtrise pas", 0),
      lvl("Présent uniquement", 1),
      lvl("Présent, passé, futur simples", 2),
      lvl("Temps complexes (subjonctif, conditionnel)", 3),
    ],
  },
  {
    id: "pron",
    type: "linguistic",
    field: "prononciation",
    label: "Quand vous parlez français, on vous comprend :",
    options: [
      lvl("Rarement", 0),
      lvl("Avec effort", 1),
      lvl("Bien la plupart du temps", 2),
      lvl("Toujours", 3),
    ],
  },
  {
    id: "aisance",
    type: "linguistic",
    field: "aisance",
    label: "Votre aisance globale en français :",
    options: [
      lvl("Débutant complet", 0),
      lvl("Je me débrouille un peu", 1),
      lvl("Je suis à l'aise au quotidien", 2),
      lvl("Très à l'aise", 3),
    ],
  },
  {
    id: "deadline",
    type: "deadline",
    label: "Avez-vous une échéance pour votre projet ?",
    options: [
      { label: "Moins de 3 mois", value: 2 },
      { label: "Entre 3 et 12 mois", value: 6 },
      { label: "Plus de 12 mois", value: 18 },
      { label: "Pas d'échéance précise", value: null },
    ],
  },
  {
    id: "procedure",
    type: "procedure",
    label: "Avez-vous déjà commencé une démarche administrative liée ?",
    options: [
      { label: "Oui, dossier en cours", value: true },
      { label: "Non, pas encore", value: false },
    ],
  },
  {
    id: "professionnel",
    type: "professional",
    label: "Êtes-vous actuellement salarié(e) en France ?",
    options: [
      { label: "Oui", value: true },
      { label: "Non", value: false },
    ],
  },
  {
    id: "disponibilite",
    type: "availability",
    label: "Quelles sont vos disponibilités ? (plusieurs choix possibles)",
    options: [
      { label: "Matin", value: "matin" },
      { label: "Après-midi", value: "apres_midi" },
      { label: "Soir", value: "soir" },
      { label: "Week-end", value: "weekend" },
    ],
  },
  {
    id: "format",
    type: "format",
    label: "Quel format préférez-vous ?",
    options: [
      { label: "En ligne", value: "en_ligne" },
      { label: "Présentiel", value: "presentiel" },
      { label: "Les deux", value: "les_deux" },
    ],
  },
];
