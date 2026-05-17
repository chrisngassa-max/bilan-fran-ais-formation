import { createFileRoute, Link } from "@tanstack/react-router"
import { useState } from "react"
import { ChevronRight, Copy, CheckCheck, ExternalLink, HelpCircle, ArrowLeft } from "lucide-react"
import { trackCPFClic } from "../utils/tracking"

const NOM_ORGANISME = import.meta.env.VITE_ORGANISME_NOM ?? "CAPTCF Formation"
const NUMERO_CPF = import.meta.env.VITE_ORGANISME_NUMERO_CPF ?? "000000000"

export const Route = createFileRoute("/financement/cpf")({
  head: () => ({
    meta: [
      { title: "Guide CPF — Financer sa formation | Bilan Français" },
      { name: "description", content: "Guide étape par étape pour financer votre formation de français avec le Compte Personnel de Formation (CPF)." },
      { property: "og:title", content: "Guide CPF — Financer sa formation" },
      { property: "og:description", content: "Guide complet du CPF pour votre formation de français." },
    ],
  }),
  component: GuideCPFPage,
})

interface Etape {
  titre: string
  contenu: React.ReactNode
}

function GuideCPFPage() {
  const [etapeActive, setEtapeActive] = useState<number | null>(0)
  const [copied, setCopied] = useState(false)

  const copierNumero = async () => {
    try {
      await navigator.clipboard.writeText(NUMERO_CPF)
      setCopied(true)
      trackCPFClic({ etape: "numero_copie", tunnel_origine: "espace_prospect" })
      setTimeout(() => setCopied(false), 2500)
    } catch (e) {
      console.error("Clipboard error", e)
    }
  }

  const etapes: Etape[] = [
    {
      titre: "1. Créer son compte sur Mon Compte Formation",
      contenu: (
        <div className="space-y-3">
          <p className="text-sm text-on-surface-variant">
            Rendez-vous sur le portail officiel et créez votre compte avec FranceConnect ou votre numéro de sécurité sociale.
          </p>
          <a
            href="https://www.moncompteformation.gouv.fr"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-4 h-10 bg-primary text-on-primary rounded-lg font-bold text-sm hover:opacity-90"
          >
            Créer mon compte <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      ),
    },
    {
      titre: "2. Vérifier son solde CPF",
      contenu: (
        <p className="text-sm text-on-surface-variant">
          Une fois connecté, votre solde disponible s'affiche directement sur votre tableau de bord. Ce montant correspond aux droits cumulés au fil de vos années d'activité.
        </p>
      ),
    },
    {
      titre: "3. Rechercher notre formation",
      contenu: (
        <div className="space-y-3">
          <p className="text-sm text-on-surface-variant">
            Recherchez l'organisme et le code formation suivants dans le moteur de recherche du portail :
          </p>
          <div className="p-3 bg-surface-container rounded-lg border border-outline-variant space-y-2">
            <p className="text-sm">Organisme : <span className="font-bold">{NOM_ORGANISME}</span></p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-sm font-mono px-2 py-1 bg-surface rounded">{NUMERO_CPF}</code>
              <button
                id="cpf-copy-button"
                onClick={copierNumero}
                className="inline-flex items-center gap-1 px-3 h-9 rounded-md bg-primary/10 text-primary hover:bg-primary/20 text-sm font-bold transition-all"
              >
                {copied ? (
                  <><CheckCheck className="h-4 w-4" /> Copié !</>
                ) : (
                  <><Copy className="h-4 w-4" /> Copier</>
                )}
              </button>
            </div>
          </div>
          <a
            id="cpf-mcf-lien"
            href="https://www.moncompteformation.gouv.fr"
            target="_blank"
            rel="noreferrer"
            onClick={() => trackCPFClic({ etape: "mcf_lien", tunnel_origine: "espace_prospect" })}
            className="inline-flex items-center gap-2 text-sm text-primary font-bold hover:underline"
          >
            Aller sur Mon Compte Formation <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      ),
    },
    {
      titre: "4. S'inscrire à la formation",
      contenu: (
        <p className="text-sm text-on-surface-variant">
          Sur la fiche de la formation, cliquez sur « S'inscrire ». Vous validerez ensuite votre dossier directement depuis votre espace Mon Compte Formation. Aucun engagement financier n'est pris en votre nom par ce site.
        </p>
      ),
    },
    {
      titre: "5. Besoin d'aide ?",
      contenu: (
        <div className="space-y-3">
          <p className="text-sm text-on-surface-variant">
            Un conseiller peut vous accompagner gratuitement pour finaliser votre dossier CPF.
          </p>
          <a
            id="cpf-aide-conseiller"
            href="/contact"
            onClick={() => trackCPFClic({ etape: "aide_conseiller", tunnel_origine: "espace_prospect" })}
            className="inline-flex items-center gap-2 px-4 h-10 bg-surface-container border border-outline-variant rounded-lg text-sm font-bold hover:bg-surface text-on-surface"
          >
            <HelpCircle className="h-4 w-4" /> Contacter un conseiller
          </a>
        </div>
      ),
    },
  ]

  return (
    <div className="min-h-screen bg-surface">
      <div className="max-w-3xl mx-auto px-4 py-10 md:py-16">
        <Link to="/financement" className="inline-flex items-center gap-2 text-sm text-on-surface-variant hover:text-primary mb-6">
          <ArrowLeft className="h-4 w-4" /> Retour au financement
        </Link>

        <h1 className="text-3xl md:text-4xl font-bold text-on-surface mb-3">
          Guide complet : Financer votre formation avec le CPF
        </h1>
        <p className="text-on-surface-variant mb-10">
          Suivez ces 5 étapes pour utiliser votre Compte Personnel de Formation et financer votre formation de français.
        </p>

        <div className="space-y-3">
          {etapes.map((etape, idx) => {
            const open = etapeActive === idx
            return (
              <div key={idx} className="bg-surface-bright border border-outline-variant rounded-2xl overflow-hidden">
                <button
                  onClick={() => setEtapeActive(open ? null : idx)}
                  className="w-full flex items-center gap-3 p-5 text-left hover:bg-surface-container/50 transition-all"
                >
                  <ChevronRight
                    className={`h-5 w-5 text-primary shrink-0 transition-transform ${open ? "rotate-90" : ""}`}
                  />
                  <span className="font-bold text-on-surface">{etape.titre}</span>
                </button>
                {open && (
                  <div className="px-5 pb-5 pl-13 md:pl-14">
                    {etape.contenu}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="mt-10 p-6 bg-primary-container/10 border border-primary/20 rounded-2xl text-center space-y-3">
          <p className="font-bold text-on-surface">Prêt à commencer ?</p>
          <a
            id="cpf-solde-button"
            href="https://www.moncompteformation.gouv.fr"
            target="_blank"
            rel="noreferrer"
            onClick={() => trackCPFClic({ etape: "solde", tunnel_origine: "espace_prospect" })}
            className="inline-flex items-center justify-center gap-2 px-6 h-12 bg-primary text-on-primary rounded-lg font-bold hover:opacity-90 transition-all"
          >
            Vérifier mon solde CPF <ExternalLink className="h-4 w-4" />
          </a>
          <p className="text-xs text-on-surface-variant italic">
            Aucun engagement financier n'est pris en votre nom par ce site.
          </p>
        </div>
      </div>
    </div>
  )
}
