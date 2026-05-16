import { AlertCircle, UserCheck, ArrowRight } from "lucide-react"
import { ConsentementRGPD } from "./ConsentementRGPD"
import { useState } from "react"

interface Props {
  prenom: string
  partenaire_consent: boolean
}

export function ResultatIncoherent({ prenom, partenaire_consent: initialConsent }: Props) {
  const [consent, setConsent] = useState(initialConsent)
  const [wsConsent, setWsConsent] = useState(false)

  return (
    <div className="max-w-2xl mx-auto py-16 px-4">
      <div className="bg-white rounded-3xl border-2 border-error/20 shadow-xl overflow-hidden">
        <div className="bg-error/5 p-8 border-b border-error/10 text-center">
          <AlertCircle className="h-16 w-16 text-error mx-auto mb-4" />
          <h2 className="text-3xl font-black text-on-surface">Bonjour {prenom}</h2>
        </div>
        
        <div className="p-8 md:p-12 space-y-8">
          <p className="text-xl text-on-surface-variant leading-relaxed text-center font-medium">
            Votre profil de compétences présente des caractéristiques qui nécessitent une analyse personnalisée.
          </p>
          
          <div className="bg-surface-container p-6 rounded-2xl flex items-start gap-4">
            <UserCheck className="h-8 w-8 text-primary shrink-0" />
            <p className="text-on-surface-variant">
              Un conseiller de notre partenaire spécialisé vous contacte pour faire le point sur votre situation et vos démarches administratives.
            </p>
          </div>

          {!initialConsent && (
            <div className="pt-4">
               <ConsentementRGPD 
                show_whatsapp_consent={true}
                partenaire_consent={consent}
                whatsapp_consent={wsConsent}
                onConsentChange={(p, w) => { setConsent(p); setWsConsent(w); }}
              />
            </div>
          )}

          <button 
            disabled={!consent}
            className="w-full h-16 bg-primary text-on-primary rounded-2xl font-black text-xl flex items-center justify-center gap-3 shadow-lg disabled:opacity-50 transition-all"
          >
            Être recontacté
            <ArrowRight className="h-6 w-6" />
          </button>
        </div>
      </div>
    </div>
  )
}
