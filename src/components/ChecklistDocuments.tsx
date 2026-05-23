import { useState, useEffect } from "react"
import { CheckCircle2, ChevronDown, ChevronUp, FileText, Info, HelpCircle } from "lucide-react"

export type DemarcheType = "pluriannuelle" | "resident_10ans" | "naturalisation" | "je_ne_sais_pas" | "autre"

interface Props {
  type_demarche: DemarcheType
  situation_pro?: "salarie" | "demandeur" | "independant" | "sans_activite"
  onChange?: (data: {
    docs_checklist: Record<string, boolean>
    docs_manquants: number
    attestation_ok: boolean
    dispense_demandee: boolean
  }) => void
  onDispenseClick?: () => void
  onFormulaireAutoFill?: (fields: { type_demarche: DemarcheType }) => void
}

export const DOCUMENTS_BY_DEMARCHE = {
  pluriannuelle: {
    label: "Carte de séjour pluriannuelle / résident — niveau requis selon situation",
    socle_commun: [
      { id: "passeport", label: "Passeport valide", desc: "Passeport de votre pays d'origine en cours de validité", statut: "obligatoire" },
      { id: "photos", label: "2 photos d'identité récentes", desc: "Format officiel conforme aux normes administratives françaises", statut: "obligatoire" },
      { id: "domicile", label: "Justificatif de domicile (moins de 3 mois)", desc: "Facture d'électricité, de gaz, quittance de loyer ou avis de taxe d'habitation", statut: "obligatoire" },
      { id: "acte_nais", label: "Acte de naissance + traduction assermentée", desc: "Traduit en français par un traducteur agréé auprès d'une cour d'appel", statut: "obligatoire" },
      { id: "timbre", label: "Timbre fiscal (montant variable)", desc: "Achetable en ligne sur le site officiel de l'administration", statut: "obligatoire" },
      { id: "cerfa", label: "Formulaire CERFA adapté", desc: "Dossier de demande officiel dûment rempli et signé", statut: "obligatoire" },
      { id: "attestation", label: "Attestation officielle TCF ou DELF niveau A2", desc: "Attestation officielle TCF/DELF niveau A2 de moins de 2 ans. Requis pour la carte de séjour pluriannuelle (2-4 ans).", statut: "obligatoire", highlight: true },
    ],
    selon_situation: {
      salarie: [
        { id: "contrat", label: "Contrat de travail actuel", desc: "CDI, CDD ou contrat de mission temporaire", statut: "obligatoire" },
        { id: "bulletins", label: "3 derniers bulletins de salaire", desc: "Preuve d'activité et de revenus stables", statut: "obligatoire" },
      ],
      demandeur: [
        { id: "attestation_ft", label: "Attestation France Travail récente", desc: "Justificatif de votre situation d'inscription en recherche active d'emploi", statut: "obligatoire" },
      ],
      independant: [
        { id: "kbis", label: "Extrait KBIS ou immatriculation URSSAF", desc: "Preuve de l'existence juridique et de l'activité de l'entreprise", statut: "obligatoire" },
      ],
      sans_activite: []
    }
  },
  resident_10ans: {
    label: "Carte de résident / 10 ans — niveau requis selon situation",
    socle_commun: [
      { id: "passeport", label: "Passeport valide", desc: "Passeport national en cours de validité", statut: "obligatoire" },
      { id: "titre_actuel", label: "Titre de séjour actuel", desc: "Carte temporaire ou pluriannuelle arrivant à expiration", statut: "obligatoire" },
      { id: "domicile", label: "Justificatif de domicile", desc: "Facture de moins de 3 mois à votre nom", statut: "obligatoire" },
      { id: "photos", label: "2 photos d'identité récentes", desc: "Conformes aux normes ISO/IEC 19794", statut: "obligatoire" },
      { id: "acte_nais", label: "Acte de naissance traduit", desc: "Copie intégrale avec traduction assermentée en français", statut: "obligatoire" },
      { id: "timbre", label: "Timbre fiscal", desc: "Preuve d'achat du droit de visa administratif", statut: "obligatoire" },
      { id: "bulletins", label: "3 derniers bulletins de salaire", desc: "Preuve de ressources stables et régulières", statut: "obligatoire" },
      { id: "impots", label: "Dernier avis d'imposition", desc: "Avis d'impôt sur le revenu reçu des Finances Publiques", statut: "obligatoire" },
      { id: "attestation", label: "Attestation officielle TCF ou DELF niveau B1", desc: "TCF ou DELF officiel validant le niveau B1 (oral et écrit). Requis pour la carte de résident 10 ans.", statut: "obligatoire", highlight: true },
    ],
    selon_situation: {}
  },
  naturalisation: {
    label: "Naturalisation française — niveau B2 obligatoire depuis 2026",
    socle_commun: [
      { id: "passeport", label: "Passeport valide", desc: "Passeport de votre nationalité d'origine valide", statut: "obligatoire" },
      { id: "acte_nais", label: "Acte de naissance traduit + légalisé", desc: "Copie intégrale de naissance avec traduction officielle et cachet de légalisation/apostille", statut: "obligatoire" },
      { id: "domicile_5ans", label: "Justif. résidence France 5 ans minimum", desc: "Avis d'impôts, quittances, contrats successifs couvrant les 5 dernières années", statut: "obligatoire" },
      { id: "impots_3ans", label: "3 derniers avis d'imposition", desc: "Preuve de votre assiduité fiscale en France", statut: "obligatoire" },
      { id: "bulletins", label: "Bulletins de salaire récents", desc: "Justificatifs d'activité professionnelle et d'autonomie financière", statut: "obligatoire" },
      { id: "casier", label: "Casier judiciaire pays d'origine", desc: "Extrait de casier judiciaire étranger datant de moins de 6 mois", statut: "obligatoire" },
      { id: "cerfa", label: "Formulaire CERFA 12753*01", desc: "Formulaire officiel de demande d'acquisition de la nationalité française", statut: "obligatoire" },
      { id: "photos", label: "2 photos d'identité récentes", desc: "Identiques et parfaitement conformes", statut: "obligatoire" },
      { id: "attestation", label: "Attestation officielle TCF ou DELF niveau B2 (obligatoire depuis 2026)", desc: "Diplôme officiel DELF B2 ou attestation TCF de moins de 2 ans validant les 4 compétences au niveau B2. Depuis 2026, B2 est exigé pour la naturalisation (au lieu de B1).", statut: "obligatoire", highlight: true },
    ],
    selon_situation: {}
  }
}

export function ChecklistDocuments({ 
  type_demarche, 
  situation_pro, 
  onChange, 
  onDispenseClick 
}: Props) {
  const [isOpen, setIsOpen] = useState(true)
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({})
  const [dispenseDemandee, setDispenseDemandee] = useState(false)

  // Get active documents list
  const demarcheKey = type_demarche === "pluriannuelle" || type_demarche === "resident_10ans" || type_demarche === "naturalisation" 
    ? type_demarche 
    : null

  const demarcheData = demarcheKey ? DOCUMENTS_BY_DEMARCHE[demarcheKey] : null
  
  const socleList = demarcheData ? demarcheData.socle_commun : []
  const situationList = (demarcheData && demarcheData.selon_situation && situation_pro && demarcheData.selon_situation[situation_pro]) 
    ? demarcheData.selon_situation[situation_pro] 
    : []

  const fullList = [...socleList, ...situationList]

  // Reset check state on demarche change
  useEffect(() => {
    setCheckedItems({})
    setDispenseDemandee(false)
  }, [type_demarche, situation_pro])

  // Trigger change events to parent
  useEffect(() => {
    if (fullList.length === 0) return

    const docs_checklist = { ...checkedItems }
    const totalDocs = fullList.length
    const checkedCount = fullList.filter(item => checkedItems[item.id]).length
    const docs_manquants = totalDocs - checkedCount
    const attestation_ok = !!checkedItems["attestation"]

    onChange?.({
      docs_checklist,
      docs_manquants,
      attestation_ok,
      dispense_demandee: dispenseDemandee
    })
  }, [checkedItems, dispenseDemandee, type_demarche, situation_pro])

  if (!demarcheData) {
    if (type_demarche === "je_ne_sais_pas") {
      return (
        <div className="bg-[#eff6ff] border-l-4 border-[#2563eb] p-6 rounded-r-2xl shadow-sm my-4 animate-fade-in">
          <div className="flex gap-4">
            <Info className="h-6 w-6 text-[#2563eb] shrink-0" />
            <div>
              <h4 className="font-bold text-[#1e3a8a] text-lg mb-2">Pas de problème !</h4>
              <p className="text-sm text-[#1e40af] leading-relaxed">
                Notre partenaire spécialisé en accompagnement administratif identifie précisément votre démarche idéale et vous guide sur les pièces et justificatifs requis selon votre profil.
              </p>
            </div>
          </div>
        </div>
      )
    }
    return null
  }

  const toggleItem = (id: string) => {
    setCheckedItems(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const handleDispenseClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDispenseDemandee(true)
    onDispenseClick?.()
  }

  const totalDocs = fullList.length
  const checkedCount = fullList.filter(item => checkedItems[item.id]).length
  const missingCount = totalDocs - checkedCount

  return (
    <div className="space-y-4 my-6">
      <div className="bg-white rounded-3xl border-2 border-slate-100 shadow-lg overflow-hidden transition-all duration-300">
        <button 
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between p-6 hover:bg-slate-50 transition-colors"
          id="checklist-accordion-btn"
        >
          <div className="flex items-center gap-3">
            <div className="bg-[#f0fdf4] p-2.5 rounded-xl border border-[#bbf7d0]">
              <FileText className="h-6 w-6 text-[#16a34a]" />
            </div>
            <div className="text-left">
              <h3 className="text-lg font-black text-slate-800">Checklist de vos documents obligatoires</h3>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-0.5">
                {checkedCount} sur {totalDocs} disponibles · {missingCount} manquant{missingCount > 1 ? 's' : ''}
              </p>
            </div>
          </div>
          {isOpen ? <ChevronUp className="h-6 w-6 text-slate-400" /> : <ChevronDown className="h-6 w-6 text-slate-400" />}
        </button>

        {isOpen && (
          <div className="p-6 pt-0 border-t border-slate-50 space-y-4 bg-slate-50/20">
            <p className="text-xs text-slate-500 font-semibold mb-6 pt-4">
              Cochez les pièces dont vous disposez déjà. La préfecture peut exiger d'autres justificatifs selon votre situation.
            </p>
            
            <div className="space-y-3">
              {fullList.map(item => {
                const isChecked = !!checkedItems[item.id]
                const isHighlight = item.id === "attestation"
                return (
                  <div key={item.id} className="space-y-3">
                    <div 
                      id={`checkbox-container-${item.id}`}
                      onClick={() => toggleItem(item.id)}
                      className={`flex items-start gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 select-none ${
                        isChecked 
                          ? 'border-[#16a34a] bg-[#f0fdf4]/40 shadow-sm' 
                          : isHighlight 
                            ? 'border-amber-300 bg-amber-50/20 hover:border-amber-400' 
                            : 'border-slate-100 bg-white hover:border-slate-200 shadow-sm'
                      }`}
                    >
                      <button
                        type="button"
                        id={`checkbox-${item.id}`}
                        aria-checked={isChecked}
                        role="checkbox"
                        className={`mt-0.5 h-6 w-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-colors ${
                          isChecked ? 'bg-[#16a34a] border-[#16a34a] text-white' : 'border-slate-300 bg-white'
                        }`}
                      >
                        {isChecked && <CheckCircle2 className="h-4 w-4" />}
                      </button>
                      <div className="flex-1">
                        <p className={`font-extrabold leading-tight text-sm ${isChecked ? 'text-[#15803d]' : 'text-slate-800'}`}>
                          {item.label}
                        </p>
                        <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">{item.desc}</p>
                      </div>
                    </div>

                    {isHighlight && !isChecked && (
                      <div className="ml-6 p-5 bg-amber-50 border-2 border-amber-200/50 rounded-2xl space-y-3 animate-fade-in">
                        <div className="flex gap-2">
                          <HelpCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                          <div>
                            <h5 className="font-extrabold text-amber-900 text-xs uppercase tracking-wider mb-1">ℹ️ Cas de dispense possible</h5>
                            <p className="text-xs text-amber-800 leading-relaxed font-semibold">
                              Certaines situations (âge avancé, diplômes français, dispense médicale...) permettent d'éviter de fournir un justificatif officiel de niveau de langue.
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          id="btn-verif-dispense"
                          onClick={handleDispenseClick}
                          className="w-full sm:w-auto px-4 h-9 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5"
                        >
                          Vérifier si je suis dispensé →
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            <div className="pt-4 text-[10px] text-slate-400 font-bold uppercase tracking-wider text-center leading-relaxed">
              Liste indicative · Chaque préfecture conserve la faculté discrétionnaire d'exiger des pièces complémentaires.
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
