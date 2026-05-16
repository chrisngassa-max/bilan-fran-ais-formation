import { AlertTriangle, ChevronRight, Zap, Target, ClipboardList } from "lucide-react"
import { Link } from "@tanstack/react-router"
import { useEffect } from "react"
import { NiveauIndicatif } from "../types/bilan"
import { TypeDemarche } from "../types/leads"
import { ordreBlocsAlerte, calculerJoursRestants } from "../utils/calcul-formule"
import { trackAlerteAffichee, trackAlerteClic } from "../utils/tracking"

interface Props {
  date_rdv?: string
  type_titre?: NiveauIndicatif
  tunnel: "T1" | "T2" | "T3"
  prenom?: string
  whatsapp?: string
  type_demarche?: TypeDemarche
  partenaire_consent: boolean
}

export function AlerteAttestationManquante({
  date_rdv,
  type_titre,
  tunnel,
  prenom,
  whatsapp,
  partenaire_consent
}: Props) {
  const blocsOrder = ordreBlocsAlerte(date_rdv)
  const joursRestants = date_rdv ? calculerJoursRestants(date_rdv) : undefined

  useEffect(() => {
    trackAlerteAffichee({ tunnel, type_titre, jours_restants: joursRestants })
  }, [tunnel, type_titre, joursRestants])

  const handleBlocClic = (bloc: "A" | "B" | "C") => {
    trackAlerteClic({ bloc_choisi: bloc, tunnel, type_titre })
  }

  const renderBloc = (type: "A" | "B" | "C") => {
    switch (type) {
      case "A":
        return (
          <Link 
            key="A"
            to="/test-rapide" 
            onClick={() => handleBlocClic("A")}
            className="flex items-center p-6 bg-blue-50 border border-blue-200 rounded-2xl hover:bg-blue-100 transition-all group"
          >
            <div className="bg-blue-600 p-3 rounded-xl mr-4 text-white">
              <Zap className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-blue-900 flex items-center gap-2">
                ⚡ Je veux estimer mon niveau rapidement
              </h4>
              <p className="text-xs text-blue-700">Test 2 minutes — estimation + formule adaptée à votre délai</p>
            </div>
            <ChevronRight className="h-5 w-5 text-blue-400 group-hover:translate-x-1 transition-transform" />
          </Link>
        )
      case "B":
        return (
          <Link 
            key="B"
            to="/test-complet" 
            onClick={() => handleBlocClic("B")}
            className="flex items-center p-6 bg-purple-50 border border-purple-200 rounded-2xl hover:bg-purple-100 transition-all group"
          >
            <div className="bg-purple-600 p-3 rounded-xl mr-4 text-white">
              <Target className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-purple-900 flex items-center gap-2">
                🎯 Je veux un diagnostic précis
              </h4>
              <p className="text-xs text-purple-700">Test 30 minutes — oral, écrit, grammaire, production</p>
            </div>
            <ChevronRight className="h-5 w-5 text-purple-400 group-hover:translate-x-1 transition-transform" />
          </Link>
        )
      case "C":
        if (!partenaire_consent) return null
        return (
          <div 
            key="C"
            onClick={() => handleBlocClic("C")}
            className="flex items-center p-6 bg-orange-50 border border-orange-200 rounded-2xl hover:bg-orange-100 transition-all group cursor-pointer"
          >
            <div className="bg-orange-600 p-3 rounded-xl mr-4 text-white">
              <ClipboardList className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-orange-900 flex items-center gap-2">
                📋 Je veux faire vérifier mon dossier
              </h4>
              <p className="text-xs text-orange-700">Partenaire spécialisé — pièces + cas de dispense</p>
            </div>
            <ChevronRight className="h-5 w-5 text-orange-400 group-hover:translate-x-1 transition-transform" />
          </div>
        )
    }
  }

  return (
    <div className="space-y-6">
      <div className="p-6 bg-error-container/10 border-2 border-error/20 rounded-2xl">
        <div className="flex gap-4 mb-4">
          <AlertTriangle className="h-8 w-8 text-error shrink-0" />
          <div>
            <h3 className="text-lg font-bold text-on-surface leading-tight mb-2">
              ⚠️ Il vous manque peut-être un justificatif de niveau de langue
            </h3>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              Pour certaines démarches en préfecture, un justificatif officiel peut être demandé. 
              Sans justificatif valable, votre dossier peut être <span className="font-bold text-error">retardé ou bloqué</span>.
            </p>
          </div>
        </div>
        
        <div className="flex flex-col gap-3 mt-6">
          {blocsOrder.map(type => renderBloc(type))}
        </div>
      </div>

      <div className="text-center">
        <p className="text-sm text-on-surface-variant mb-2">Vous pensez être dispensé ?</p>
        <button className="text-primary font-bold hover:underline flex items-center justify-center gap-1 mx-auto">
          Vérifier si je suis dispensé
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
