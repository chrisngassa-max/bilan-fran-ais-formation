// Banque d'items d'échantillon (démo). À remplacer par la banque officielle plus tard.
import type { AnyItem, McqItem, OpenItem } from "./types";

const ce: McqItem[] = [
  {
    id: "ce-1",
    skill: "CE",
    level: "A1",
    prompt: "Lisez le panneau. Que signifie-t-il ?",
    passage: "« Sortie de secours — Ne pas obstruer »",
    choices: [
      "On peut s'asseoir devant.",
      "Il faut laisser le passage libre.",
      "C'est une entrée principale.",
    ],
    correctIndex: 1,
  },
  {
    id: "ce-2",
    skill: "CE",
    level: "A2",
    prompt: "Selon ce SMS, que demande Sarah ?",
    passage:
      "« Salut ! Tu peux passer chercher le pain en rentrant ? Merci 🙏 »",
    choices: [
      "Acheter du pain en rentrant.",
      "Préparer le dîner.",
      "Téléphoner au boulanger.",
    ],
    correctIndex: 0,
  },
  {
    id: "ce-3",
    skill: "CE",
    level: "B1",
    prompt: "Quelle est l'idée principale du texte ?",
    passage:
      "Depuis 2020, le télétravail s'est durablement installé dans les grandes entreprises françaises. Si certains salariés y voient une liberté nouvelle, d'autres regrettent le lien social du bureau.",
    choices: [
      "Le télétravail a totalement remplacé le bureau.",
      "Le télétravail est désormais courant mais perçu de façon contrastée.",
      "Le télétravail a disparu après 2020.",
    ],
    correctIndex: 1,
  },
  {
    id: "ce-4",
    skill: "CE",
    level: "B2",
    prompt: "Quelle nuance l'auteur exprime-t-il ?",
    passage:
      "Il serait pour le moins hâtif de conclure que cette mesure résoudra à elle seule la crise du logement.",
    choices: [
      "L'auteur est convaincu de l'efficacité de la mesure.",
      "L'auteur reste prudent et nuance l'efficacité de la mesure.",
      "L'auteur n'a pas d'opinion claire.",
    ],
    correctIndex: 1,
  },
];

const co: McqItem[] = [
  {
    id: "co-1",
    skill: "CO",
    level: "A1",
    prompt: "Vous écoutez une annonce en gare. Que doit faire le voyageur ?",
    audioLabel:
      "(Simulation audio) « Le train à destination de Lyon partira voie 7 à 14h12. »",
    choices: [
      "Aller voie 7 à 14h12.",
      "Attendre voie 12 à 7h.",
      "Changer de gare.",
    ],
    correctIndex: 0,
  },
  {
    id: "co-2",
    skill: "CO",
    level: "A2",
    prompt: "Que propose la personne ?",
    audioLabel:
      "(Simulation audio) « On se voit demain au café à 10h ? Si tu préfères, on peut faire 11h. »",
    choices: [
      "Un rendez-vous à 9h.",
      "Un rendez-vous à 10h ou 11h.",
      "Un rendez-vous le soir.",
    ],
    correctIndex: 1,
  },
  {
    id: "co-3",
    skill: "CO",
    level: "B1",
    prompt: "Quelle est la position du locuteur ?",
    audioLabel:
      "(Simulation audio) « Honnêtement, je ne suis pas contre l'idée, mais il faudrait d'abord en discuter avec l'équipe. »",
    choices: [
      "Il refuse fermement.",
      "Il est plutôt favorable mais veut consulter l'équipe.",
      "Il accepte sans condition.",
    ],
    correctIndex: 1,
  },
  {
    id: "co-4",
    skill: "CO",
    level: "B2",
    prompt: "Quelle est l'intention principale du locuteur ?",
    audioLabel:
      "(Simulation audio) « Loin de moi l'idée de minimiser le problème, mais relativisons : ce n'est pas la première fois et nous avons les outils pour y répondre. »",
    choices: [
      "Dramatiser la situation.",
      "Reconnaître le problème tout en rassurant.",
      "Refuser d'en parler.",
    ],
    correctIndex: 1,
  },
];

const ee: OpenItem[] = [
  {
    id: "ee-1",
    skill: "EE",
    level: "A2",
    prompt:
      "Écrivez un court message (5–8 lignes) pour vous présenter à un nouveau voisin : prénom, pays d'origine, profession, depuis quand vous habitez en France.",
    minWords: 40,
  },
  {
    id: "ee-2",
    skill: "EE",
    level: "B1",
    prompt:
      "Rédigez un e-mail à votre employeur pour demander une journée de congé exceptionnel (motif, date, organisation prévue pour vos collègues).",
    minWords: 70,
  },
  {
    id: "ee-3",
    skill: "EE",
    level: "B2",
    prompt:
      "Donnez votre avis argumenté (≈ 150 mots) sur l'affirmation : « Les écrans nuisent à la concentration des adultes au travail. »",
    minWords: 130,
  },
];

const eo: OpenItem[] = [
  {
    id: "eo-1",
    skill: "EO",
    level: "A2",
    prompt:
      "Décrivez en quelques phrases votre quotidien (matin, travail/études, soir). Vous pouvez écrire ce que vous diriez à l'oral.",
    minWords: 40,
  },
  {
    id: "eo-2",
    skill: "EO",
    level: "B1",
    prompt:
      "Racontez un voyage marquant : où, quand, avec qui, ce que vous avez aimé, ce qui était difficile. (≈ 100 mots)",
    minWords: 80,
  },
  {
    id: "eo-3",
    skill: "EO",
    level: "B2",
    prompt:
      "Présentez un sujet d'actualité qui vous tient à cœur, exposez deux arguments et concluez par votre position personnelle. (≈ 150 mots)",
    minWords: 130,
  },
];

export const ITEMS: AnyItem[] = [...ce, ...co, ...ee, ...eo];

export const ITEMS_BY_SKILL = {
  CE: ce,
  CO: co,
  EE: ee,
  EO: eo,
} as const;
