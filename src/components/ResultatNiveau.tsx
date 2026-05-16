import { CheckCircle2, ArrowRight, Info } from "lucide-react"
import { NiveauIndicatif } from "../types/bilan"
import { ModuleFinancement } from "./ModuleFinancement"

interface Props {
  niveau_estime: NiveauIndicatif
  score_brut: number
  prenom: string
}

export function ResultatNiveau({
  niveau_estime,
  prenom,
}: Props) {
  return (
    <div className="space-y-8">
      <div className="bg-white rounded-3xl border border-outline-variant p-8 md:p-10 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-secondary-container/10 rounded-bl-full -mr-16 -mt-16"></div>
        
        <div className="mb-8">
          <CheckCircle2 className="h-12 w-12 text-secondary mb-4" />
          <h2 className="text-3xl font-black text-on-surface mb-2">Bonjour {prenom} !</h2>
          <p className="text-on-surface-variant">Voici votre bilan de niveau de français.</p>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-10 mb-10">
          <div className="text-center md:text-left">
            <label className="block text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-2">Niveau estimé</label>
            <div className="flex items-baseline gap-2 justify-center md:justify-start">
              <span className="text-6xl font-black text-secondary">{niveau_estime}</span>
              <span className="text-sm font-bold text-on-surface-variant uppercase">CECRL</span>
            </div>
          </div>

          <div className="flex-1 p-6 bg-surface-container rounded-2xl border border-outline-variant">
            <h4 className="font-bold text-on-surface mb-2">Formation recommandée : Parcours {niveau_estime} Standard</h4>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              Ce programme est optimisé pour consolider vos acquis et viser le palier supérieur en toute sérénité.
            </p>
          </div>
        </div>

        <div className="space-y-4 pt-8 border-t border-outline-variant">
          <button className="w-full h-16 bg-secondary text-on-secondary font-black text-xl rounded-2xl flex items-center justify-center gap-3 shadow-xl hover:opacity-95 active:scale-95 transition-all">
            Voir les formations disponibles
            <ArrowRight className="h-6 w-6" />
          </button>
          
          <div className="text-center">
            <p className="text-sm text-on-surface-variant mb-2">Vous avez un dossier préfecture en cours ?</p>
            <button className="text-primary font-bold hover:underline">
              Faire vérifier mon dossier gratuitement
            </button>
          </div>
        </div>

        <div className="mt-8 flex gap-3 p-4 bg-error-container/10 border border-error/20 rounded-xl">
          <Info className="h-5 w-5 text-error shrink-0" />
          <p className="text-[10px] text-on-surface-variant italic leading-relaxed">
            Ce résultat est indicatif et ne remplace pas une certification officielle. 
            Il permet de vous orienter vers la formation la plus adaptée à votre profil actuel.
          </p>
        </div>
      </div>

      <ModuleFinancement niveau_estime={niveau_estime} />
    </div>
  )
}
