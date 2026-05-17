export type TypeDemarche =
  | "naturalisation"
  | "carte_10_ans"
  | "regroupement_familial"
  | "titre_sejour"
  | "autre"

export function normaliserNumeroWA(tel: string): string | null {
  let n = tel.replace(/\D/g, "")
  if (n.startsWith("06") || n.startsWith("07")) n = "33" + n.substring(1)
  if (n.startsWith("33") && n.length === 11) return n
  if (n.length >= 10 && n.length <= 15) return n
  return null
}

export function genererLienWhatsApp(
  whatsapp: string,
  prenom: string,
  type_demarche: TypeDemarche,
): string | null {
  const numero = normaliserNumeroWA(whatsapp)
  if (!numero) return null
  const labels: Record<TypeDemarche, string> = {
    naturalisation: "naturalisation française",
    carte_10_ans: "renouvellement carte 10 ans",
    regroupement_familial: "regroupement familial",
    titre_sejour: "titre de séjour",
    autre: "démarche administrative",
  }
  const msg = encodeURIComponent(
    `Bonjour ${prenom}, je vous contacte suite à votre demande d'accompagnement administratif pour votre démarche (${labels[type_demarche]}). Pouvez-vous me confirmer votre disponibilité ?`,
  )
  return `https://wa.me/${numero}?text=${msg}`
}
