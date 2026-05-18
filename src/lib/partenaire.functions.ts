import { createServerFn } from "@tanstack/react-start"
import { z } from "zod"
import { supabaseAdmin } from "@/integrations/supabase/client.server"
import * as bcrypt from "bcryptjs"
import { signSession } from "./partner-session"
import { requirePartnerSession } from "./partner-session.middleware"
import { setResponseHeader } from "@tanstack/react-start/server"

// Règle absolue : chaque fonction qui lit des leads vérifie
//   1) lead_partenaire_assignments (assignment existe pour ce partenaire)
//   2) partenaire_consent = true côté base
// JAMAIS retourner le champ `email` aux partenaires.

const SELECT_LEAD_LISTE =
  "id,prenom,whatsapp_phone,type_demarche,estimated_level,date_rdv_prefecture,partenaire_consent,created_at,source"

const SELECT_LEAD_DETAIL =
  "id,prenom,whatsapp_phone,type_demarche,estimated_level,date_rdv_prefecture,dispense_demandee,checklist_states,partenaire_consent,partenaire_consent_at,source,created_at,situation_pro"

function joursRestants(date_rdv: string | null): number | null {
  if (!date_rdv) return null
  const diff = new Date(date_rdv).getTime() - Date.now()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

async function verifierAssignment(partenaire_id: string, lead_id: string): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from("lead_partenaire_assignments")
    .select("id")
    .eq("partenaire_id", partenaire_id)
    .eq("lead_id", lead_id)
    .maybeSingle()
  return !!data
}

export const loginPartenaireFn = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z.object({ email: z.string().email(), password: z.string().min(8) }).parse(input),
  )
  .handler(async ({ data }) => {
    const emailLower = data.email.toLowerCase().trim()
    const { data: compte } = await supabaseAdmin
      .from("partenaire_comptes")
      .select("id,nom,email,password_hash,actif")
      .eq("email", emailLower)
      .eq("actif", true)
      .maybeSingle()

    // Timing attack mitigation
    const dummyHash = "$2a$10$1234567890123456789012345678901234567890123456789012"
    const hashToCompare = compte ? compte.password_hash : dummyHash
    const isPasswordMatch = await bcrypt.compare(data.password, hashToCompare)

    if (!compte || !isPasswordMatch) {
      return { ok: false as const, raison: "identifiants_invalides" as const }
    }

    const token = await signSession({ partenaire_id: compte.id, email: compte.email })

    // Set HttpOnly signed session cookie
    setResponseHeader(
      "Set-Cookie",
      `bff_partner_session=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=28800`
    )

    return { ok: true as const, nom: compte.nom, email: compte.email }
  })

export const logoutPartenaireFn = createServerFn({ method: "POST" }).handler(async () => {
  setResponseHeader(
    "Set-Cookie",
    "bff_partner_session=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0",
  )
  return { ok: true }
})

export const getPartenaireStatsFn = createServerFn({ method: "POST" })
  .middleware([requirePartnerSession])
  .handler(async ({ context }) => {
    const partenaire_id = (context as { partenaire_id: string }).partenaire_id

    const { data: rows } = await supabaseAdmin
      .from("leads_partenaire_status")
      .select("statut,updated_at")
      .eq("partenaire_id", partenaire_id)

    const debutMois = new Date()
    debutMois.setDate(1)
    debutMois.setHours(0, 0, 0, 0)

    let nouveaux = 0
    let en_cours = 0
    let traites_ce_mois = 0
    for (const r of rows ?? []) {
      if (r.statut === "nouveau") nouveaux++
      else if (r.statut === "en_cours") en_cours++
      if (r.statut === "traite" && r.updated_at && new Date(r.updated_at) >= debutMois) {
        traites_ce_mois++
      }
    }
    return { nouveaux, en_cours, traites_ce_mois }
  })

export const getLeadsPartenaireFn = createServerFn({ method: "POST" })
  .middleware([requirePartnerSession])
  .inputValidator((input) =>
    z
      .object({
        statut_filtre: z.enum(["tous", "nouveau", "en_cours", "traite", "sans_suite"]),
        page: z.number().int().min(1).default(1),
        par_page: z.number().int().min(1).max(100).default(20),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const partenaire_id = (context as { partenaire_id: string }).partenaire_id

    const { data: assignments } = await supabaseAdmin
      .from("lead_partenaire_assignments")
      .select("lead_id")
      .eq("partenaire_id", partenaire_id)
    const leadIds = (assignments ?? []).map((a) => a.lead_id).filter(Boolean) as string[]
    if (leadIds.length === 0) return { leads: [], total: 0 }

    let statutQuery = supabaseAdmin
      .from("leads_partenaire_status")
      .select("lead_id,statut,note,updated_at,contacte_at")
      .eq("partenaire_id", partenaire_id)
    if (data.statut_filtre !== "tous") {
      statutQuery = statutQuery.eq("statut", data.statut_filtre)
    }
    const { data: statuts } = await statutQuery
    const statutsMap = new Map<string, { statut: string; note: string | null; updated_at: string | null }>()
    for (const s of statuts ?? []) {
      if (s.lead_id) statutsMap.set(s.lead_id, { statut: s.statut, note: s.note, updated_at: s.updated_at })
    }

    let leadsIdsFiltres = leadIds
    if (data.statut_filtre !== "tous") {
      leadsIdsFiltres = leadIds.filter((id) => statutsMap.has(id))
    }
    if (leadsIdsFiltres.length === 0) return { leads: [], total: 0 }

    const from = (data.page - 1) * data.par_page
    const to = from + data.par_page - 1

    // CRITIQUE: partenaire_consent=true vérifié côté serveur, JAMAIS le champ email
    const { data: leads, count } = await supabaseAdmin
      .from("leads")
      .select(SELECT_LEAD_LISTE, { count: "exact" })
      .in("id", leadsIdsFiltres)
      .eq("partenaire_consent", true)
      .order("created_at", { ascending: false })
      .range(from, to)

    const enrichis = (leads ?? []).map((l: any) => {
      const s = statutsMap.get(l.id)
      return {
        ...l,
        statut: s?.statut ?? "nouveau",
        jours_restants_rdv: joursRestants(l.date_rdv_prefecture),
      }
    })

    return { leads: enrichis, total: count ?? enrichis.length }
  })

export const getLeadDetailFn = createServerFn({ method: "POST" })
  .middleware([requirePartnerSession])
  .inputValidator((input) =>
    z.object({ lead_id: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const partenaire_id = (context as { partenaire_id: string }).partenaire_id

    const ok = await verifierAssignment(partenaire_id, data.lead_id)
    if (!ok) throw new Error("Accès refusé : lead non assigné")

    // CRITIQUE: partenaire_consent=true vérifié, JAMAIS le champ email
    const { data: lead, error } = await supabaseAdmin
      .from("leads")
      .select(SELECT_LEAD_DETAIL)
      .eq("id", data.lead_id)
      .eq("partenaire_consent", true)
      .maybeSingle()
    if (error || !lead) throw new Error("Lead introuvable ou consentement manquant")

    const { data: statutRow } = await supabaseAdmin
      .from("leads_partenaire_status")
      .select("statut,note,updated_at,contacte_at")
      .eq("partenaire_id", partenaire_id)
      .eq("lead_id", data.lead_id)
      .maybeSingle()

    return {
      lead: {
        ...lead,
        jours_restants_rdv: joursRestants((lead as any).date_rdv_prefecture),
      },
      statut: statutRow?.statut ?? "nouveau",
      note: statutRow?.note ?? "",
    }
  })

export const changerStatutLeadFn = createServerFn({ method: "POST" })
  .middleware([requirePartnerSession])
  .inputValidator((input) =>
    z
      .object({
        lead_id: z.string().uuid(),
        statut: z.enum(["nouveau", "en_cours", "traite", "sans_suite"]),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const partenaire_id = (context as { partenaire_id: string }).partenaire_id

    const ok = await verifierAssignment(partenaire_id, data.lead_id)
    if (!ok) throw new Error("Accès refusé : lead non assigné")
    const now = new Date().toISOString()
    const payload: Record<string, any> = {
      partenaire_id: partenaire_id,
      lead_id: data.lead_id,
      statut: data.statut,
      updated_at: now,
    }
    if (data.statut === "en_cours" || data.statut === "traite") payload.contacte_at = now

    const { error } = await supabaseAdmin
      .from("leads_partenaire_status")
      .upsert(payload, { onConflict: "lead_id,partenaire_id" })
    if (error) throw new Error("Mise à jour du statut impossible")
    return { ok: true }
  })

export const ajouterNoteFn = createServerFn({ method: "POST" })
  .middleware([requirePartnerSession])
  .inputValidator((input) =>
    z
      .object({
        lead_id: z.string().uuid(),
        note: z.string().max(2000),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const partenaire_id = (context as { partenaire_id: string }).partenaire_id

    const ok = await verifierAssignment(partenaire_id, data.lead_id)
    if (!ok) throw new Error("Accès refusé : lead non assigné")
    const { error } = await supabaseAdmin
      .from("leads_partenaire_status")
      .upsert(
        {
          partenaire_id: partenaire_id,
          lead_id: data.lead_id,
          note: data.note,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "lead_id,partenaire_id" },
      )
    if (error) throw new Error("Sauvegarde de la note impossible")
    return { ok: true }
  })
