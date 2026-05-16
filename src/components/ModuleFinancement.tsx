import { useState } from "react"
import { Wallet, Building2, Handshake, Briefcase, Info } from "lucide-react"
import { SituationPro, FormuleExpress } from "../types/leads"
import { NiveauIndicatif } from "../types/bilan"

interface Props {
  formule?: FormuleExpress
  niveau_estime?: NiveauIndicatif
}

export function ModuleFinancement({}: Props) {
  const [situation, setSituation] = useState<SituationPro>("salarie")

  return (
    <div className="bg-surface-bright rounded-2xl border border-outline-variant p-6 md:p-8 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-primary-container/20 p-2 rounded-lg">
          <Wallet className="h-6 w-6 text-primary" />
        </div>
        <h3 className="text-xl font-bold text-on-surface">Options de Financement</h3>
      </div>

      <div className="mb-8">
        <label className="block text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-3">
          Votre situation professionnelle
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {[
            { id: "salarie", label: "Salarié(e)", icon: Building2 },
            { id: "demandeur", label: "Demandeur d'emploi", icon: Briefcase },
            { id: "independant", label: "Indépendant / Auto-entrep.", icon: Handshake },
            { id: "sans_activite", label: "Sans activité", icon: Info },
          ].map((s) => (
            <button
              key={s.id}
              onClick={() => setSituation(s.id as SituationPro)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 font-bold transition-all ${
                situation === s.id 
                ? 'border-primary bg-primary/5 text-primary' 
                : 'border-outline-variant hover:border-outline text-on-surface-variant'
              }`}
            >
              <s.icon className="h-5 w-5 shrink-0" />
              <span className="text-sm">{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {situation === "salarie" && (
          <div className="p-6 bg-primary-container/10 border border-primary/20 rounded-2xl">
            <h4 className="font-bold text-primary mb-2 flex items-center gap-2">
              <Building2 className="h-5 w-5" /> Mon Compte Formation (CPF)
            </h4>
            <p className="text-sm text-on-surface-variant mb-4">
              Votre formation peut être financée jusqu'à 100% selon votre solde CPF disponible.
            </p>
            <a 
              href="https://www.moncompteformation.gouv.fr" 
              target="_blank" 
              rel="noreferrer"
              className="inline-flex items-center justify-center w-full h-12 bg-primary text-on-primary rounded-lg font-bold hover:opacity-90 transition-all"
            >
              Vérifier mon solde CPF
            </a>
          </div>
        )}

        {situation === "demandeur" && (
          <div className="p-6 bg-secondary-container/10 border border-secondary/20 rounded-2xl">
            <h4 className="font-bold text-secondary mb-2 flex items-center gap-2">
              <Briefcase className="h-5 w-5" /> Aide Individuelle à la Formation (AIF)
            </h4>
            <p className="text-sm text-on-surface-variant mb-4">
              Pôle Emploi peut prendre en charge tout ou partie de votre formation selon votre projet personnalisé.
            </p>
            <button className="w-full h-12 bg-secondary text-on-secondary rounded-lg font-bold hover:opacity-90 transition-all">
              Contacter mon conseiller
            </button>
          </div>
        )}

        {situation === "independant" && (
          <div className="space-y-4">
            <div className="p-6 bg-primary-container/10 border border-primary/20 rounded-2xl">
              <h4 className="font-bold text-primary mb-2">Mon Compte Formation (CPF)</h4>
              <p className="text-sm text-on-surface-variant mb-4">Utilisez vos droits cumulés en tant qu'indépendant.</p>
              <a href="https://www.moncompteformation.gouv.fr" target="_blank" rel="noreferrer" className="inline-block text-primary font-bold hover:underline">Accéder au portail CPF →</a>
            </div>
            <div className="p-6 bg-surface-container border border-outline-variant rounded-2xl">
              <h4 className="font-bold text-on-surface mb-2">Fonds d'Assurance Formation (FAF)</h4>
              <p className="text-sm text-on-surface-variant">Prise en charge selon votre code APE (AGEFICE, FIFPL...).</p>
            </div>
          </div>
        )}

        {situation === "sans_activite" && (
          <div className="p-6 bg-surface-container border border-outline-variant rounded-2xl">
            <h4 className="font-bold text-on-surface mb-2">Conseil Régional / CAF</h4>
            <p className="text-sm text-on-surface-variant mb-4">Des aides locales peuvent exister selon votre département et votre situation familiale.</p>
            <button className="w-full h-12 bg-outline text-white rounded-lg font-bold hover:bg-on-surface transition-all">
              Vérifier mon éligibilité
            </button>
          </div>
        )}
      </div>

      <p className="mt-6 text-[11px] text-on-surface-variant/70 italic leading-relaxed text-center">
        Votre formation peut être partiellement ou totalement finançable selon votre situation. Ces informations sont indicatives et ne constituent pas une garantie de prise en charge.
      </p>
    </div>
  )
}
