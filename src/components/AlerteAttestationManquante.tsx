import { AlertTriangle, ChevronRight, Zap, Target, ClipboardList, HelpCircle } from "lucide-react"
import { Link } from "@tanstack/react-router"
import { useEffect } from "react"
import { NiveauIndicatif } from "../types/bilan"
import { TypeDemarche } from "../types/leads"
import { ordreBlocsAlerte, calculerJoursRestants } from "../utils/calcul-formule"
import { trackAlerteAffichee, trackAlerteClic } from "../utils/tracking"
import { track } from "../utils/tracking-plausible"

interface Props {
  date_rdv?: string
  type_titre?: NiveauIndicatif
  tunnel: "T1" | "T2" | "T3"
  prenom?: string
  whatsapp?: string
  type_demarche?: TypeDemarche
  partenaire_consent: boolean
  onDispenseClick?: () => void
}

export function AlerteAttestationManquante({
  date_rdv,
  type_titre,
  tunnel,
  prenom,
  whatsapp,
  type_demarche,
  partenaire_consent,
  onDispenseClick
}: Props) {
  const blocsOrder = ordreBlocsAlerte(date_rdv)
  const joursRestants = date_rdv ? calculerJoursRestants(date_rdv) : undefined

  useEffect(() => {
    trackAlerteAffichee({ tunnel, type_titre, jours_restants: joursRestants })
  }, [tunnel, type_titre, joursRestants])

  const handleBlocClic = (bloc: "A" | "B" | "C") => {
    trackAlerteClic({ bloc_choisi: bloc, tunnel, type_titre })
  }

  const handleDispenseClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    track("dispense_verifiee", { tunnel: tunnel ?? "", type_titre: type_titre ?? "" })
    track("dispense_demandee", { tunnel: tunnel ?? "" })
    onDispenseClick?.()
  }

  const renderBloc = (type: "A" | "B" | "C") => {
    // Generate pre-filled search params for next steps
    const prefilledParams = new URLSearchParams()
    if (prenom) prefilledParams.append("prenom", prenom)
    if (whatsapp) prefilledParams.append("whatsapp", whatsapp)
    if (type_demarche) prefilledParams.append("type_demarche", type_demarche)
    if (date_rdv) prefilledParams.append("date_rdv", date_rdv)
    const prefillQuery = prefilledParams.toString() ? `?${prefilledParams.toString()}` : ""

    switch (type) {
      case "A":
        return (
          <Link 
            key="A"
            to="/passer-test/$token"
            params={{ token: "latest" }}
            search={{
              prenom: prenom || undefined,
              whatsapp: whatsapp || undefined,
              type_demarche: type_demarche || undefined,
              date_rdv: date_rdv || undefined,
            }}
            id="card-alerte-action-a"
            onClick={() => handleBlocClic("A")}
            className="flex items-center p-5 bg-[#eff6ff] border-2 border-blue-100 hover:border-blue-300 rounded-2xl hover:bg-blue-50/50 transition-all duration-200 group select-none"
          >
            <div className="bg-[#2563eb] p-3 rounded-xl mr-4 text-white shrink-0 shadow-sm">
              <Zap className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h4 className="font-extrabold text-blue-900 text-sm flex items-center gap-2">
                ⚡ Je veux évaluer mon niveau en ligne
              </h4>
              <p className="text-xs text-blue-700 leading-normal font-semibold mt-1">
                Test de positionnement gratuit · Première estimation instantanée + formule adaptée à votre délai de rendez-vous en préfecture.
              </p>
            </div>
            <ChevronRight className="h-5 w-5 text-blue-400 group-hover:translate-x-1 transition-transform shrink-0 ml-2" />
          </Link>
        )
      case "B":
        return (
          <Link 
            key="B"
            to="/passer-test/$token"
            params={{ token: "latest" }}
            search={{
              prenom: prenom || undefined,
              whatsapp: whatsapp || undefined,
              type_demarche: type_demarche || undefined,
              date_rdv: date_rdv || undefined,
            }}
            id="card-alerte-action-b"
            onClick={() => handleBlocClic("B")}
            className="flex items-center p-5 bg-[#faf5ff] border-2 border-purple-100 hover:border-purple-300 rounded-2xl hover:bg-purple-50/50 transition-all duration-200 group select-none"
          >
            <div className="bg-[#9333ea] p-3 rounded-xl mr-4 text-white shrink-0 shadow-sm">
              <Target className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h4 className="font-extrabold text-purple-900 text-sm flex items-center gap-2">
                🎯 Diagnostic Pédagogique Complet
              </h4>
              <p className="text-xs text-purple-700 leading-normal font-semibold mt-1">
                Test officiel de positionnement · Analyse détaillée de vos compétences (écrit, oral, production) pour un programme sur-mesure.
              </p>
            </div>
            <ChevronRight className="h-5 w-5 text-purple-400 group-hover:translate-x-1 transition-transform shrink-0 ml-2" />
          </Link>
        )
      case "C":
        if (!partenaire_consent) return null
        return (
          <Link
            key="C"
            to={`/accompagnement-administratif${prefillQuery}`}
            id="card-alerte-action-c"
            onClick={(e) => {
              handleBlocClic("C")
              if (onDispenseClick) {
                e.preventDefault()
                onDispenseClick()
              }
            }}
            className="flex items-center p-5 bg-[#fff7ed] border-2 border-orange-100 hover:border-orange-300 rounded-2xl hover:bg-orange-50/50 transition-all duration-200 group select-none cursor-pointer text-left"
          >
            <div className="bg-[#ea580c] p-3 rounded-xl mr-4 text-white shrink-0 shadow-sm">
              <ClipboardList className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h4 className="font-extrabold text-orange-900 text-sm flex items-center gap-2">
                📋 Je veux faire vérifier mon dossier
              </h4>
              <p className="text-xs text-orange-700 leading-normal font-semibold mt-1">
                Partenaire spécialisé en accompagnement administratif · Analyse complète de vos pièces administratives et vérification de votre éligibilité à une dispense légale.
              </p>
            </div>
            <ChevronRight className="h-5 w-5 text-orange-400 group-hover:translate-x-1 transition-transform shrink-0 ml-2" />
          </Link>
        )
    }
  }

  return (
    <div className="space-y-6 my-6">
      <div className="p-6 bg-red-50/40 border-2 border-red-200 rounded-3xl shadow-sm transition-all duration-300">
        <div className="flex gap-4 mb-6">
          <div className="bg-red-100 p-2.5 rounded-xl border border-red-200 shrink-0">
            <AlertTriangle className="h-7 w-7 text-red-600" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-800 leading-snug mb-2">
              ⚠️ Justificatif de niveau de langue obligatoire
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed font-semibold">
              Pour la plupart des demandes en préfecture (séjour pluriannuel A2, carte de résident B1, naturalisation B2 depuis 2026), un justificatif officiel de niveau de français doit être joint à votre dossier.
            </p>
            <p className="text-xs text-red-700 font-bold leading-relaxed mt-2">
              Sans ce justificatif valable, votre dossier peut être retardé, bloqué ou faire l'objet d'une demande de pièce complémentaire.
            </p>
          </div>
        </div>
        
        <div className="space-y-3">
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider pl-1">
            Que souhaitez-vous faire maintenant ?
          </p>
          <div className="flex flex-col gap-3">
            {blocsOrder.map(type => renderBloc(type))}
          </div>
        </div>

        <div className="mt-6 pt-5 border-t border-red-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-slate-400 shrink-0" />
            <p className="text-xs text-slate-500 font-semibold leading-relaxed">
              Vous pensez être dispensé de test ? Notre partenaire peut valider votre éligibilité à une dispense.
            </p>
          </div>
          <button 
            type="button"
            id="btn-alerte-dispense"
            onClick={handleDispenseClick}
            className="w-full sm:w-auto h-10 px-5 bg-white border-2 border-slate-200 hover:border-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 shrink-0"
          >
            Vérifier ma situation →
          </button>
        </div>
      </div>
    </div>
  )
}
