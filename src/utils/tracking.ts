import { NiveauIndicatif } from "../types/bilan"

export function trackAlerteAffichee(params: {
  tunnel: "T1" | "T2" | "T3"
  type_titre?: NiveauIndicatif
  jours_restants?: number
}) {
  console.log("Tracking: alerte_attestation_affichee", params);
  // posthog.capture("alerte_attestation_affichee", params)
}

export function trackAlerteClic(params: {
  bloc_choisi: "A" | "B" | "C"
  tunnel: "T1" | "T2" | "T3"
  type_titre?: NiveauIndicatif
}) {
  console.log("Tracking: alerte_attestation_clic", params);
  // posthog.capture("alerte_attestation_clic", params)
}

export function trackFormulairesSoumis(params: {
  tunnel: "T1" | "T2" | "T3"
  destination: "formation" | "partenaire" | "les_deux"
}) {
  console.log("Tracking: formulaire_soumis", params);
  // posthog.capture("formulaire_soumis", params)
}
