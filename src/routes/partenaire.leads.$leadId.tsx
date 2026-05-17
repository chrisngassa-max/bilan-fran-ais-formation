import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useEffect, useState, useCallback } from "react"
import { useServerFn } from "@tanstack/react-start"
import { z } from "zod"
import { Loader2, ArrowLeft, MessageCircle, AlertTriangle, CheckCircle2, XCircle, Save } from "lucide-react"
import {
  getLeadDetailFn,
  changerStatutLeadFn,
  ajouterNoteFn,
} from "@/lib/partenaire.functions"
import { genererLienWhatsApp, TypeDemarche } from "@/utils/whatsapp-link"

export const Route = createFileRoute("/partenaire/leads/$leadId")({
  head: () => ({
    meta: [
      { title: "Fiche lead — Espace Partenaire" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  validateSearch: (s) => z.object({ pid: z.string().uuid() }).parse(s),
  component: LeadDetailPage,
})

type Statut = "nouveau" | "en_cours" | "traite" | "sans_suite"
const STATUT_LABELS: Record<Statut, string> = {
  nouveau: "Nouveau", en_cours: "En cours", traite: "Traité", sans_suite: "Sans suite",
}

function LeadDetailPage() {
  const { leadId } = Route.useParams()
  const { pid } = Route.useSearch()
  const navigate = useNavigate()

  const detailFn = useServerFn(getLeadDetailFn)
  const statutFn = useServerFn(changerStatutLeadFn)
  const noteFn = useServerFn(ajouterNoteFn)

  const [lead, setLead] = useState<any>(null)
  const [statut, setStatut] = useState<Statut>("nouveau")
  const [note, setNote] = useState("")
  const [loading, setLoading] = useState(true)
  const [statutLoading, setStatutLoading] = useState<Statut | null>(null)
  const [noteSaving, setNoteSaving] = useState(false)
  const [noteSaved, setNoteSaved] = useState(false)

  const charger = useCallback(async () => {
    setLoading(true)
    try {
      const r = await detailFn({ data: { partenaire_id: pid, lead_id: leadId } })
      setLead(r.lead)
      setStatut(r.statut as Statut)
      setNote(r.note ?? "")
    } catch {
      navigate({ to: "/partenaire" })
    } finally {
      setLoading(false)
    }
  }, [pid, leadId, detailFn, navigate])

  useEffect(() => { charger() }, [charger])

  const changerStatut = async (s: Statut) => {
    setStatutLoading(s)
    try {
      await statutFn({ data: { partenaire_id: pid, lead_id: leadId, statut: s } })
      setStatut(s)
    } finally {
      setStatutLoading(null)
    }
  }

  const sauverNote = async () => {
    setNoteSaving(true)
    setNoteSaved(false)
    try {
      await noteFn({ data: { partenaire_id: pid, lead_id: leadId, note } })
      setNoteSaved(true)
      setTimeout(() => setNoteSaved(false), 2500)
    } finally {
      setNoteSaving(false)
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }
  if (!lead) return null

  const waLink = lead.whatsapp_phone
    ? genererLienWhatsApp(lead.whatsapp_phone, lead.prenom ?? "", (lead.type_demarche as TypeDemarche) ?? "autre")
    : null
  const urgent = lead.jours_restants_rdv !== null && lead.jours_restants_rdv <= 14
  const checklist = (lead.checklist_states ?? {}) as Record<string, boolean>
  const checklistEntries = Object.entries(checklist)
  const manquants = checklistEntries.filter(([, v]) => !v)
  const statutsRapides: Statut[] = (["nouveau", "en_cours", "traite", "sans_suite"] as Statut[]).filter((s) => s !== statut)

  return (
    <div className="min-h-screen bg-surface">
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <button onClick={() => navigate({ to: "/partenaire" })} className="inline-flex items-center gap-2 text-sm text-on-surface-variant hover:text-primary">
          <ArrowLeft className="h-4 w-4" /> Retour au tableau de bord
        </button>

        <div className="bg-surface-bright rounded-2xl border border-outline-variant p-6 space-y-4">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-bold text-on-surface">{lead.prenom || "—"}</h1>
              <p className="text-sm text-on-surface-variant">{lead.type_demarche || "Démarche non précisée"}</p>
            </div>
            {waLink ? (
              <a href={waLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-4 h-10 bg-green-600 text-white rounded-lg font-bold text-sm hover:bg-green-700">
                <MessageCircle className="h-4 w-4" /> WhatsApp
              </a>
            ) : lead.whatsapp_phone ? (
              <span className="text-sm text-on-surface-variant">Tél. : {lead.whatsapp_phone}</span>
            ) : null}
          </div>

          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            {lead.estimated_level && (
              <Info label="Niveau estimé">
                <span className="italic">{lead.estimated_level} (indicatif)</span>
              </Info>
            )}
            {lead.date_rdv_prefecture && (
              <Info label="RDV préfecture">
                <span className={urgent ? "text-red-600 font-bold" : ""}>
                  {urgent && <AlertTriangle className="inline h-4 w-4 mr-1" />}
                  {new Date(lead.date_rdv_prefecture).toLocaleDateString("fr-FR")}
                  {lead.jours_restants_rdv !== null && ` (dans ${lead.jours_restants_rdv}j)`}
                </span>
              </Info>
            )}
            {lead.situation_pro && <Info label="Situation pro">{lead.situation_pro}</Info>}
            <Info label="Dispense demandée">{lead.dispense_demandee ? "Oui" : "Non"}</Info>
            <Info label="Source">{lead.source}</Info>
            <Info label="Créé le">{new Date(lead.created_at).toLocaleDateString("fr-FR")}</Info>
            {lead.partenaire_consent_at && (
              <Info label="Consentement partenaire">
                {new Date(lead.partenaire_consent_at).toLocaleDateString("fr-FR")}
              </Info>
            )}
          </dl>
        </div>

        <div className="bg-surface-bright rounded-2xl border border-outline-variant p-6 space-y-4">
          <h2 className="font-bold text-on-surface">Checklist dossier</h2>
          {checklistEntries.length === 0 ? (
            <p className="text-sm text-on-surface-variant">Aucun élément renseigné.</p>
          ) : (
            <ul className="space-y-1.5">
              {checklistEntries.map(([k, v]) => (
                <li key={k} className="flex items-center gap-2 text-sm">
                  {v ? (
                    <><CheckCircle2 className="h-4 w-4 text-green-600" /> <span>{k}</span></>
                  ) : (
                    <><XCircle className="h-4 w-4 text-red-600" /> <span className="text-red-600">{k}</span></>
                  )}
                </li>
              ))}
            </ul>
          )}
          {manquants.length > 0 && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{manquants.length} document(s) manquant(s) — à signaler au candidat avant rendez-vous.</span>
            </div>
          )}
        </div>

        <div className="bg-surface-bright rounded-2xl border border-outline-variant p-6 space-y-4">
          <h2 className="font-bold text-on-surface">Statut</h2>
          <p className="text-sm text-on-surface-variant">Actuel : <span className="font-bold text-on-surface">{STATUT_LABELS[statut]}</span></p>
          <div className="flex flex-wrap gap-2">
            {statutsRapides.map((s) => (
              <button
                key={s}
                disabled={statutLoading !== null}
                onClick={() => changerStatut(s)}
                className="inline-flex items-center gap-2 px-3 h-9 rounded-md bg-surface-container hover:bg-surface text-sm font-bold border border-outline-variant disabled:opacity-50"
              >
                {statutLoading === s && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                → {STATUT_LABELS[s]}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-surface-bright rounded-2xl border border-outline-variant p-6 space-y-3">
          <h2 className="font-bold text-on-surface">Note interne</h2>
          <textarea
            value={note} onChange={(e) => setNote(e.target.value)} maxLength={2000} rows={5}
            className="w-full p-3 rounded-lg border border-outline-variant bg-surface focus:outline-none focus:border-primary text-sm"
            placeholder="Ajoutez une note sur ce lead…"
          />
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-on-surface-variant">{note.length} / 2000</span>
            <button
              onClick={sauverNote} disabled={noteSaving}
              className="inline-flex items-center gap-2 px-4 h-10 bg-primary text-on-primary rounded-lg font-bold text-sm hover:opacity-90 disabled:opacity-50"
            >
              {noteSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {noteSaved ? "Enregistré ✓" : "Sauvegarder"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs uppercase font-bold text-on-surface-variant tracking-wider">{label}</dt>
      <dd className="mt-0.5 text-on-surface">{children}</dd>
    </div>
  )
}
