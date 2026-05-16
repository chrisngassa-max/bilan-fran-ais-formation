import { useState } from "react"
import { Calendar, Clock, ArrowRight, CheckCircle2, Info } from "lucide-react"
import { NiveauIndicatif } from "../types/bilan"
import { FormuleExpress } from "../types/leads"
import { calculerFormule, calculerJoursRestants } from "../utils/calcul-formule"
import { ModuleFinancement } from "./ModuleFinancement"

interface Props {
  niveau_estime: NiveauIndicatif
  score_brut: number
  prenom: string
  whatsapp?: string
  partenaire_consent: boolean
}

export function FormuleExpressComponent({
  niveau_estime,
  prenom,
}: Props) {
  const [dateRdv, setDateRdv] = useState("")
  const [titreVise, setTitreVise] = useState<NiveauIndicatif>("B1")

  const formule = dateRdv ? calculerFormule(dateRdv) : null
  const jours = dateRdv ? calculerJoursRestants(dateRdv) : null

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-3xl border border-outline-variant p-8 md:p-10 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -mr-16 -mt-16"></div>
        
        <div className="mb-8">
          <h2 className="text-3xl font-black text-on-surface mb-2">Félicitations {prenom} !</h2>
          <p className="text-on-surface-variant">Votre profil a été analysé. Voici votre parcours sur-mesure.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-2">Niveau estimé</label>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-black text-primary">{niveau_estime}</span>
                <span className="text-sm font-bold text-on-surface-variant uppercase">CECRL</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-2">Titre de séjour visé</label>
              <select 
                value={titreVise}
                onChange={(e) => setTitreVise(e.target.value as NiveauIndicatif)}
                className="w-full h-12 px-4 rounded-xl border-2 border-outline-variant bg-surface font-bold focus:ring-2 focus:ring-primary outline-none"
              >
                <option value="A2">Carte de séjour pluriannuelle / résident</option>
                <option value="B1">Carte de résident / 10 ans</option>
                <option value="B1_nat">Naturalisation par décret (B1 oral/écrit)</option>
                <option value="a_verifier">Je ne sais pas encore</option>
              </select>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-2">Date de votre RDV Préfecture</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-on-surface-variant" />
                <input 
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={dateRdv}
                  onChange={(e) => setDateRdv(e.target.value)}
                  className="w-full h-12 pl-12 pr-4 rounded-xl border-2 border-outline-variant bg-surface font-bold focus:ring-2 focus:ring-primary outline-none"
                />
              </div>
            </div>

            {formule && (
              <div className="p-6 bg-primary text-on-primary rounded-2xl shadow-lg animate-in fade-in slide-in-from-bottom-4">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="h-4 w-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-80">Formule recommandée</span>
                </div>
                <h4 className="text-2xl font-black mb-1">{formule}</h4>
                <p className="text-xs opacity-90 font-medium">Il vous reste {jours} jours avant votre RDV.</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4 pt-8 border-t border-outline-variant">
          <button className="w-full h-16 bg-primary text-on-primary font-black text-xl rounded-2xl flex items-center justify-center gap-3 shadow-xl hover:opacity-95 active:scale-95 transition-all">
            Démarrer ma formation
            <ArrowRight className="h-6 w-6" />
          </button>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <button className="flex-1 h-14 border-2 border-primary text-primary font-bold rounded-xl hover:bg-primary/5 transition-all">
              Vérifier mon financement
            </button>
            <button className="flex-1 h-14 border-2 border-outline-variant text-on-surface-variant font-bold rounded-xl hover:bg-surface-container transition-all">
              Faire vérifier mon dossier
            </button>
          </div>
        </div>

        <div className="mt-8 flex gap-3 p-4 bg-error-container/10 border border-error/20 rounded-xl">
          <Info className="h-5 w-5 text-error shrink-0" />
          <p className="text-[10px] text-on-surface-variant italic leading-relaxed">
            Ce résultat est indicatif et ne remplace pas une certification officielle (TCF, DELF, TEF selon la démarche). 
            La décision finale appartient exclusivement à l'administration compétente.
          </p>
        </div>
      </div>

      <ModuleFinancement formule={formule || undefined} niveau_estime={niveau_estime} />
    </div>
  )
}
