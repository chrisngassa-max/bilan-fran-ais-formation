export interface FlagsScoring {
  PROFIL_INCOHERENT: boolean
  ALERTE_VITESSE: boolean
}

export function calculerFlags(params: {
  score_oral: number
  score_ecrit: number
  duree_secondes: number
}): FlagsScoring {

  // Écart oral/écrit trop important → profil suspect (> 40 points d'écart)
  const PROFIL_INCOHERENT =
    Math.abs(params.score_oral - params.score_ecrit) > 40

  // Test terminé en moins de 8 minutes (480s) → vitesse suspecte
  const ALERTE_VITESSE = params.duree_secondes < 480

  return { PROFIL_INCOHERENT, ALERTE_VITESSE }
}
