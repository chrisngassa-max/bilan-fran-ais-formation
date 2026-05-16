import { FormuleExpress } from "../types/leads"

export function calculerFormule(dateRdv: string): FormuleExpress {
  const today = new Date()
  const rdv = new Date(dateRdv)
  const diffMs = rdv.getTime() - today.getTime()
  const jours = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

  if (jours <= 14) return "Express 20h"
  if (jours <= 30) return "Intensif 40h"
  if (jours <= 60) return "Standard 60h"
  return "Confort 80h"
}

export function calculerJoursRestants(dateRdv: string): number {
  const today = new Date()
  const rdv = new Date(dateRdv)
  return Math.ceil((rdv.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

export function ordreBlocsAlerte(dateRdv?: string): Array<"A" | "B" | "C"> {
  if (!dateRdv) return ["B", "A", "C"]
  const jours = calculerJoursRestants(dateRdv)
  if (jours <= 30) return ["A", "C", "B"]   // urgence → test rapide d'abord
  if (jours <= 90) return ["B", "A", "C"]   // moyen → test complet d'abord
  return ["B", "C", "A"]                    // long → test complet puis partenaire
}
