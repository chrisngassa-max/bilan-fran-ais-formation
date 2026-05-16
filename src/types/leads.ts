import { NiveauIndicatif } from "./bilan";

export type TypeDemarche =
  | "pluriannuelle"
  | "resident_10ans"
  | "naturalisation"
  | "je_ne_sais_pas"
  | "autre"

export type BlocAlerte = "A" | "B" | "C"

export type SituationPro =
  | "salarie"
  | "demandeur"
  | "independant"
  | "sans_activite"

export type FormuleExpress =
  | "Express 20h"
  | "Intensif 40h"
  | "Standard 60h"
  | "Confort 80h"

export interface LeadT2 {
  tunnel: "T2_test_rapide"
  prenom: string
  email: string
  whatsapp?: string
  niveau_estime: NiveauIndicatif
  score_brut: number            // 0-10
  rdv_prevu: boolean
  date_rdv_prefecture?: string  // ISO date
  type_titre_vise?: NiveauIndicatif
  formule_calculee?: FormuleExpress
  partenaire_consent: boolean
  whatsapp_consent: boolean
  consent_at: string            // ISO datetime
  source: "test_rapide"
}
