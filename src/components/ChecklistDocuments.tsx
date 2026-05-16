import { useState } from "react"
import { CheckCircle2, ChevronDown, ChevronUp, FileText, AlertCircle } from "lucide-react"
import { NiveauIndicatif } from "../types/bilan"
import { AlerteAttestationManquante } from "./AlerteAttestationManquante"

interface Props {
  type_demarche?: NiveauIndicatif
}

export function ChecklistDocuments({ type_demarche }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({})

  const items = [
    { id: "id", label: "Pièce d'identité en cours de validité", desc: "Passeport, titre de séjour ou carte d'identité" },
    { id: "domicile", label: "Justificatif de domicile de moins de 3 mois", desc: "Quittance de loyer, facture EDF, avis d'imposition" },
    { id: "attestation", label: "Attestation de réussite à un test de français (TCF/DELF)", desc: "Moins de 2 ans. Niveau A2 ou B1 selon votre demande." },
    { id: "fiscal", label: "Bordereau de situation fiscale (P237)", desc: "Pour les demandes de naturalisation et carte de résident" },
  ]

  const toggleItem = (id: string) => {
    setCheckedItems(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const isAttestationMissing = !checkedItems["attestation"]

  return (
    <div className="space-y-4">
      <div className="bg-surface-bright rounded-2xl border border-outline-variant overflow-hidden">
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between p-6 hover:bg-surface-container transition-colors"
        >
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6 text-primary" />
            <h3 className="text-xl font-bold text-on-surface">Checklist de vos documents</h3>
          </div>
          {isOpen ? <ChevronUp className="h-6 w-6 text-on-surface-variant" /> : <ChevronDown className="h-6 w-6 text-on-surface-variant" />}
        </button>

        {isOpen && (
          <div className="p-6 pt-0 border-t border-outline-variant space-y-4">
            <p className="text-sm text-on-surface-variant mb-6">
              Cochez les documents que vous avez déjà en votre possession pour vérifier si votre dossier est complet.
            </p>
            
            <div className="space-y-3">
              {items.map(item => (
                <div 
                  key={item.id}
                  onClick={() => toggleItem(item.id)}
                  className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    checkedItems[item.id] ? 'border-primary bg-primary/5' : 'border-outline-variant hover:border-outline'
                  }`}
                >
                  <div className={`mt-0.5 h-6 w-6 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                    checkedItems[item.id] ? 'bg-primary border-primary text-on-primary' : 'border-outline-variant bg-surface'
                  }`}>
                    {checkedItems[item.id] && <CheckCircle2 className="h-4 w-4" />}
                  </div>
                  <div>
                    <p className={`font-bold leading-tight ${checkedItems[item.id] ? 'text-primary' : 'text-on-surface'}`}>{item.label}</p>
                    <p className="text-xs text-on-surface-variant mt-1">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {isAttestationMissing && (
        <AlerteAttestationManquante 
          tunnel="T1" 
          type_titre={type_demarche}
          partenaire_consent={true} // Default for display in checklist
        />
      )}
    </div>
  )
}
