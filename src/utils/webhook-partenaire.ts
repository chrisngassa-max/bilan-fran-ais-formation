import { TypeDemarche, LeadT2 } from "../types/leads"
import { NiveauIndicatif } from "../types/bilan"
import { calculerJoursRestants } from "./calcul-formule"

interface WebhookPayload {
  type: "nouveau_lead"
  prenom: string
  whatsapp: string
  type_demarche: TypeDemarche
  niveau_estime?: NiveauIndicatif
  source_tunnel: "T1" | "T2" | "T3"
  urgence: boolean          // true si date_rdv < 30 jours
  dispense_demandee: boolean
  profil_incoherent?: boolean
  consent_at: string        // ISO datetime
  timestamp: string         // ISO datetime
}

interface LeadPartenairePayload {
  id?: string
  prenom: string
  whatsapp?: string
  type_demarche?: TypeDemarche
  niveau_estime?: NiveauIndicatif
  tunnel: "T1_administratif_direct" | "T2_test_rapide" | "T3_test_complet"
  date_rdv?: string
  dispense_demandee?: boolean
  profil_incoherent?: boolean
  consent_at: string
}

export async function notifierPartenaire(
  lead: LeadPartenairePayload,
  partenaire_consent: boolean
): Promise<void> {

  // RÈGLE ABSOLUE : ne jamais envoyer si consentement absent
  if (!partenaire_consent) {
    console.warn("Webhook partenaire bloqué : consentement absent", lead.id)
    return
  }

  const payload: WebhookPayload = {
    type: "nouveau_lead",
    prenom: lead.prenom,
    whatsapp: lead.whatsapp ?? "",
    type_demarche: lead.type_demarche ?? "autre",
    niveau_estime: lead.niveau_estime,
    source_tunnel: lead.tunnel === "T1_administratif_direct" ? "T1"
                 : lead.tunnel === "T2_test_rapide" ? "T2" : "T3",
    urgence: lead.date_rdv
      ? calculerJoursRestants(lead.date_rdv) < 30
      : false,
    dispense_demandee: lead.dispense_demandee ?? false,
    profil_incoherent: lead.profil_incoherent,
    consent_at: lead.consent_at,
    timestamp: new Date().toISOString()
  }

  console.log("Sending Webhook to Partenaire:", payload);

  // POST vers URL partenaire (à configurer en variable d'environnement)
  try {
    if (process.env.PARTENAIRE_WEBHOOK_URL) {
      await fetch(process.env.PARTENAIRE_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })
    }
  } catch (error) {
    console.error("Failed to send webhook:", error)
  }
}
