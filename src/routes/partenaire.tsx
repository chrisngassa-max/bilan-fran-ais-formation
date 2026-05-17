import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useEffect, useState, useCallback } from "react"
import { useServerFn } from "@tanstack/react-start"
import { Loader2, LogIn, Users, Clock, CheckCircle2, ExternalLink, MessageCircle, AlertTriangle } from "lucide-react"
import {
  loginPartenaireFn,
  getPartenaireStatsFn,
  getLeadsPartenaireFn,
  changerStatutLeadFn,
} from "@/lib/partenaire.functions"
import { genererLienWhatsApp, TypeDemarche } from "@/utils/whatsapp-link"

export const Route = createFileRoute("/partenaire")({
  head: () => ({
    meta: [
      { title: "Espace Partenaire — Tableau de bord" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: PartenaireLoginOrDashboard,
})

type Statut = "nouveau" | "en_cours" | "traite" | "sans_suite"
type FiltreStatut = "tous" | Statut

const STATUT_COULEURS: Record<Statut, string> = {
  nouveau: "bg-blue-100 text-blue-700 border-blue-200",
  en_cours: "bg-orange-100 text-orange-700 border-orange-200",
  traite: "bg-green-100 text-green-700 border-green-200",
  sans_suite: "bg-gray-100 text-gray-600 border-gray-200",
}
const STATUT_LABELS: Record<Statut, string> = {
  nouveau: "Nouveau",
  en_cours: "En cours",
  traite: "Traité",
  sans_suite: "Sans suite",
}

function PartenaireLoginOrDashboard() {
  const [session, setSession] = useState<{ id: string; nom: string } | null>(null)
  if (!session) return <LoginPartenaire onLogin={(id, nom) => setSession({ id, nom })} />
  return <Dashboard partenaireId={session.id} nom={session.nom} onLogout={() => setSession(null)} />
}

function LoginPartenaire({ onLogin }: { onLogin: (id: string, nom: string) => void }) {
  const loginFn = useServerFn(loginPartenaireFn)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErreur(null)
    try {
      const res = await loginFn({ data: { email, password } })
      if (res.ok) onLogin(res.partenaire_id, res.nom ?? email)
      else setErreur("Identifiants incorrects")
    } catch {
      setErreur("Identifiants incorrects")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4">
      <form onSubmit={submit} className="w-full max-w-md bg-surface-bright p-8 rounded-2xl border border-outline-variant shadow-sm space-y-5">
        <div className="text-center space-y-1">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-2">
            <LogIn className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold text-on-surface">Espace Partenaire</h1>
          <p className="text-sm text-on-surface-variant">Connectez-vous pour accéder à vos leads</p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-on-surface">Email</label>
          <input
            type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
            className="w-full h-11 px-3 rounded-lg border border-outline-variant bg-surface focus:outline-none focus:border-primary"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-bold text-on-surface">Mot de passe</label>
          <input
            type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)}
            className="w-full h-11 px-3 rounded-lg border border-outline-variant bg-surface focus:outline-none focus:border-primary"
          />
        </div>

        {erreur && <p className="text-sm text-red-600 font-bold">{erreur}</p>}

        <button
          type="submit" disabled={loading}
          className="w-full h-12 bg-primary text-on-primary rounded-lg font-bold hover:opacity-90 disabled:opacity-50 inline-flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Se connecter"}
        </button>
      </form>
    </div>
  )
}

interface LeadListe {
  id: string
  prenom: string | null
  whatsapp_phone: string | null
  type_demarche: string | null
  estimated_level: string | null
  date_rdv_prefecture: string | null
  partenaire_consent: boolean
  created_at: string
  source: string
  statut: Statut
  jours_restants_rdv: number | null
}

function Dashboard({ partenaireId, nom, onLogout }: { partenaireId: string; nom: string; onLogout: () => void }) {
  const navigate = useNavigate()
  const statsFn = useServerFn(getPartenaireStatsFn)
  const leadsFn = useServerFn(getLeadsPartenaireFn)
  const statutFn = useServerFn(changerStatutLeadFn)

  const [stats, setStats] = useState({ nouveaux: 0, en_cours: 0, traites_ce_mois: 0 })
  const [filtre, setFiltre] = useState<FiltreStatut>("tous")
  const [leads, setLeads] = useState<LeadListe[]>([])
  const [loading, setLoading] = useState(true)
  const [statutLoading, setStatutLoading] = useState<string | null>(null)

  const chargerDonnees = useCallback(async () => {
    setLoading(true)
    try {
      const [s, l] = await Promise.all([
        statsFn({ data: { partenaire_id: partenaireId } }),
        leadsFn({ data: { partenaire_id: partenaireId, statut_filtre: filtre, page: 1, par_page: 50 } }),
      ])
      setStats(s)
      setLeads(l.leads as LeadListe[])
    } finally {
      setLoading(false)
    }
  }, [partenaireId, filtre, statsFn, leadsFn])

  useEffect(() => { chargerDonnees() }, [chargerDonnees])

  const changerStatut = async (lead_id: string, statut: Statut) => {
    setStatutLoading(lead_id)
    try {
      await statutFn({ data: { partenaire_id: partenaireId, lead_id, statut } })
      await chargerDonnees()
    } finally {
      setStatutLoading(null)
    }
  }

  const filtres: FiltreStatut[] = ["tous", "nouveau", "en_cours", "traite", "sans_suite"]
  const filtreLabel: Record<FiltreStatut, string> = {
    tous: "Tous", nouveau: "Nouveau", en_cours: "En cours", traite: "Traité", sans_suite: "Sans suite",
  }

  return (
    <div className="min-h-screen bg-surface">
      <header className="bg-surface-bright border-b border-outline-variant">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-on-surface">Tableau de bord partenaire</h1>
            <p className="text-sm text-on-surface-variant">Connecté en tant que {nom}</p>
          </div>
          <button onClick={onLogout} className="text-sm text-on-surface-variant hover:text-primary">
            Se déconnecter
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard icon={Users} label="Nouveaux" value={stats.nouveaux} color="text-blue-600 bg-blue-50" />
          <StatCard icon={Clock} label="En cours" value={stats.en_cours} color="text-orange-600 bg-orange-50" />
          <StatCard icon={CheckCircle2} label="Traités ce mois" value={stats.traites_ce_mois} color="text-green-600 bg-green-50" />
        </div>

        <div className="flex flex-wrap gap-2">
          {filtres.map((f) => (
            <button
              key={f} onClick={() => setFiltre(f)}
              className={`px-4 h-9 rounded-full text-sm font-bold border transition-all ${
                filtre === f
                  ? "bg-primary text-on-primary border-primary"
                  : "bg-surface-bright text-on-surface-variant border-outline-variant hover:border-outline"
              }`}
            >
              {filtreLabel[f]}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {loading && <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>}
          {!loading && leads.length === 0 && (
            <div className="text-center py-12 text-on-surface-variant bg-surface-bright rounded-2xl border border-outline-variant">
              Aucun lead pour ce filtre.
            </div>
          )}
          {!loading && leads.map((lead) => {
            const waLink = lead.whatsapp_phone
              ? genererLienWhatsApp(lead.whatsapp_phone, lead.prenom ?? "", (lead.type_demarche as TypeDemarche) ?? "autre")
              : null
            const urgent = lead.jours_restants_rdv !== null && lead.jours_restants_rdv <= 14
            const statutsRapides: Statut[] = (["nouveau", "en_cours", "traite", "sans_suite"] as Statut[])
              .filter((s) => s !== lead.statut)

            return (
              <div key={lead.id} className="bg-surface-bright border border-outline-variant rounded-2xl p-5 space-y-3">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-on-surface">{lead.prenom || "—"}</h3>
                      <span className={`inline-block px-2 py-0.5 text-xs font-bold rounded-full border ${STATUT_COULEURS[lead.statut]}`}>
                        {STATUT_LABELS[lead.statut]}
                      </span>
                    </div>
                    <p className="text-sm text-on-surface-variant">
                      {lead.type_demarche || "Démarche non précisée"}
                    </p>
                    {lead.estimated_level && (
                      <p className="text-sm italic text-on-surface-variant">
                        Niveau estimé : {lead.estimated_level} (indicatif)
                      </p>
                    )}
                    {lead.jours_restants_rdv !== null && (
                      <p className={`text-sm font-bold ${urgent ? "text-red-600" : "text-on-surface-variant"}`}>
                        {urgent && <AlertTriangle className="inline h-4 w-4 mr-1" />}
                        RDV préfecture dans {lead.jours_restants_rdv} jours
                      </p>
                    )}
                  </div>
                  {waLink && (
                    <a
                      href={waLink} target="_blank" rel="noreferrer"
                      className="inline-flex items-center gap-2 px-4 h-10 bg-green-600 text-white rounded-lg font-bold text-sm hover:bg-green-700"
                    >
                      <MessageCircle className="h-4 w-4" /> WhatsApp
                    </a>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-wrap pt-3 border-t border-outline-variant">
                  {statutsRapides.map((s) => (
                    <button
                      key={s}
                      disabled={statutLoading === lead.id}
                      onClick={() => changerStatut(lead.id, s)}
                      className="px-3 h-8 rounded-md bg-surface-container hover:bg-surface text-xs font-bold border border-outline-variant disabled:opacity-50"
                    >
                      → {STATUT_LABELS[s]}
                    </button>
                  ))}
                  <button
                    onClick={() => navigate({ to: "/partenaire/leads/$leadId", params: { leadId: lead.id }, search: { pid: partenaireId } })}
                    className="ml-auto inline-flex items-center gap-1 text-sm text-primary font-bold hover:underline"
                  >
                    Voir fiche <ExternalLink className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: number; color: string }) {
  return (
    <div className="bg-surface-bright rounded-2xl border border-outline-variant p-5 flex items-center gap-4">
      <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <p className="text-sm text-on-surface-variant">{label}</p>
        <p className="text-2xl font-bold text-on-surface">{value}</p>
      </div>
    </div>
  )
}
