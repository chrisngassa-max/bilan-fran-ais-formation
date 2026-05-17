/**
 * Évaluation IA d'une production écrite — SERVEUR UNIQUEMENT.
 *
 * Ce module ne doit jamais être importé côté navigateur :
 * il appelle Lovable AI Gateway avec LOVABLE_API_KEY (secret serveur).
 *
 * Garde-fous :
 *  - assertServeurUniquement() lève si exécuté côté client.
 *  - Toute sortie utilise "niveau estimé" (JAMAIS "niveau certifié").
 *  - En cas d'échec IA, on retombe sur un scoring déterministe local.
 */

import type { NiveauIndicatif } from "@/types/bilan";

export interface EvaluationIAInput {
  consigne: string;
  texte_candidat: string;
  niveau_cible: NiveauIndicatif;
}

export interface EvaluationIAOutput {
  /** Score global sur 100 (jamais présenté comme une certification). */
  score: number;
  niveau_estime: NiveauIndicatif;
  points_forts: string[];
  points_ameliorer: string[];
  commentaire: string;
  evaluated_by: "ia" | "fallback";
}

/** Lève si on est exécuté côté navigateur. */
export function assertServeurUniquement(): void {
  if (typeof window !== "undefined") {
    throw new Error(
      "evaluation-ia: ce module est réservé au serveur (LOVABLE_API_KEY).",
    );
  }
}

// --- Scoring fallback déterministe -----------------------------------------

const CONNECTEURS_LOGIQUES = [
  "donc", "car", "parce que", "puisque", "ainsi", "cependant", "néanmoins",
  "toutefois", "en effet", "par conséquent", "d'abord", "ensuite", "enfin",
  "premièrement", "deuxièmement", "de plus", "en outre", "par ailleurs",
  "mais", "or", "tandis que", "alors que", "afin de", "pour que", "bien que",
  "malgré", "en revanche", "au contraire", "finalement", "en conclusion",
  "pourtant", "puis", "aussi", "également",
];

function compterMots(texte: string): number {
  return texte
    .trim()
    .split(/\s+/)
    .filter((m) => m.length > 0).length;
}

function compterConnecteurs(texte: string): number {
  const t = ` ${texte.toLowerCase()} `;
  let n = 0;
  for (const c of CONNECTEURS_LOGIQUES) {
    const re = new RegExp(`[^a-zà-ÿ]${c.replace(/'/g, "['’]")}[^a-zà-ÿ]`, "g");
    const matches = t.match(re);
    if (matches) n += matches.length;
  }
  return n;
}

/** Cible indicative de longueur (mots) par niveau visé. */
function ciblesMots(niveau: NiveauIndicatif): { min: number; ideal: number } {
  switch (niveau) {
    case "A1": return { min: 30, ideal: 60 };
    case "A2": return { min: 60, ideal: 100 };
    case "B1":
    case "B1_nat": return { min: 100, ideal: 160 };
    case "B2": return { min: 160, ideal: 240 };
    default: return { min: 80, ideal: 140 };
  }
}

/**
 * Scoring local très simple : longueur (0–70) + connecteurs logiques (0–30).
 * Utilisé si l'IA est indisponible.
 */
export function scoringFallback(
  texte: string,
  niveau_cible: NiveauIndicatif,
): EvaluationIAOutput {
  const nbMots = compterMots(texte);
  const nbConnect = compterConnecteurs(texte);
  const { min, ideal } = ciblesMots(niveau_cible);

  // Longueur : 0 si vide, 70 si >= ideal, linéaire entre min et ideal.
  let scoreLongueur = 0;
  if (nbMots >= ideal) scoreLongueur = 70;
  else if (nbMots <= min / 2) scoreLongueur = Math.round((nbMots / (min / 2)) * 20);
  else if (nbMots < min) scoreLongueur = 20 + Math.round(((nbMots - min / 2) / (min / 2)) * 20);
  else scoreLongueur = 40 + Math.round(((nbMots - min) / Math.max(ideal - min, 1)) * 30);
  scoreLongueur = Math.max(0, Math.min(70, scoreLongueur));

  // Connecteurs : 0 si aucun, 30 si >= 6, linéaire.
  const scoreConnect = Math.max(0, Math.min(30, Math.round((nbConnect / 6) * 30)));

  const score = Math.max(0, Math.min(100, scoreLongueur + scoreConnect));

  const points_forts: string[] = [];
  const points_ameliorer: string[] = [];
  if (nbMots >= ideal) points_forts.push("Longueur de production conforme à l'attendu.");
  else if (nbMots >= min) points_forts.push("Longueur globalement suffisante.");
  else points_ameliorer.push(`Production trop courte (vise au moins ${min} mots).`);

  if (nbConnect >= 4) points_forts.push("Bon usage de connecteurs logiques.");
  else points_ameliorer.push("Articule davantage les idées avec des connecteurs (d'abord, cependant, donc…).");

  return {
    score,
    niveau_estime: niveau_cible,
    points_forts,
    points_ameliorer,
    commentaire:
      "Évaluation automatique simplifiée. Score basé sur la longueur et l'articulation logique du texte. Ce résultat constitue un niveau estimé indicatif, et non un niveau certifié.",
    evaluated_by: "fallback",
  };
}

// --- Évaluation IA via Lovable AI Gateway ----------------------------------

const NIVEAUX_VALIDES: NiveauIndicatif[] = ["A1", "A2", "B1", "B1_nat", "B2", "a_verifier"];

function normaliserNiveau(v: unknown, defaut: NiveauIndicatif): NiveauIndicatif {
  if (typeof v === "string" && (NIVEAUX_VALIDES as string[]).includes(v)) {
    return v as NiveauIndicatif;
  }
  return defaut;
}

/**
 * Évalue la production avec Lovable AI Gateway.
 * En cas d'erreur (clé absente, 4xx/5xx, parsing), retombe sur scoringFallback.
 */
export async function evaluerProductionIA(
  input: EvaluationIAInput,
): Promise<EvaluationIAOutput> {
  assertServeurUniquement();

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.warn("[evaluation-ia] ANTHROPIC_API_KEY manquant — fallback déterministe.");
    return scoringFallback(input.texte_candidat, input.niveau_cible);
  }

  const systemPrompt =
    "Tu es un examinateur expert FLE (Français Langue Étrangère) formé au CECRL. " +
    "Tu évalues une production écrite de manière bienveillante mais rigoureuse. " +
    "Tu ne délivres JAMAIS de certification : tu donnes un NIVEAU ESTIMÉ indicatif. " +
    "Tu réponds STRICTEMENT en JSON valide, sans texte autour, conforme au schéma demandé.";

  const userPrompt = `Consigne donnée au candidat :
"""${input.consigne}"""

Niveau CECRL visé : ${input.niveau_cible}

Production écrite du candidat :
"""${input.texte_candidat}"""

Évalue cette production. Réponds UNIQUEMENT avec un JSON de cette forme :
{
  "score": <entier 0-100>,
  "niveau_estime": "A1"|"A2"|"B1"|"B1_nat"|"B2"|"a_verifier",
  "points_forts": [string, ...],   // 2 à 4 points concrets
  "points_ameliorer": [string, ...], // 2 à 4 points concrets et actionnables
  "commentaire": string             // 2-4 phrases, ton bienveillant, parle de "niveau estimé"
}`;

  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      console.warn(
        `[evaluation-ia] Gateway HTTP ${res.status} — fallback déterministe.`,
      );
      return scoringFallback(input.texte_candidat, input.niveau_cible);
    }

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const raw = data.choices?.[0]?.message?.content ?? "";
    const parsed = JSON.parse(raw) as Partial<EvaluationIAOutput>;

    const score = Math.max(0, Math.min(100, Math.round(Number(parsed.score ?? 0))));
    const points_forts = Array.isArray(parsed.points_forts)
      ? parsed.points_forts.filter((s) => typeof s === "string").slice(0, 6)
      : [];
    const points_ameliorer = Array.isArray(parsed.points_ameliorer)
      ? parsed.points_ameliorer.filter((s) => typeof s === "string").slice(0, 6)
      : [];

    return {
      score,
      niveau_estime: normaliserNiveau(parsed.niveau_estime, input.niveau_cible),
      points_forts,
      points_ameliorer,
      commentaire:
        typeof parsed.commentaire === "string" && parsed.commentaire.trim().length > 0
          ? parsed.commentaire
          : "Niveau estimé indicatif basé sur l'analyse de votre production.",
      evaluated_by: "ia",
    };
  } catch (err) {
    console.warn("[evaluation-ia] Échec IA, fallback déterministe :", err);
    return scoringFallback(input.texte_candidat, input.niveau_cible);
  }
}


// Alias rétrocompatible.
export const evaluerProductionEcrite = evaluerProductionIA;

