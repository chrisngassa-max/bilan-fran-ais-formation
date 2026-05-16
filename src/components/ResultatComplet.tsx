import { Award, GraduationCap, Banknote, FileText, ArrowRight, Info } from "lucide-react"
import { NiveauIndicatif } from "../types/bilan"
import { ChecklistDocuments } from "./ChecklistDocuments"
import { ModuleFinancement } from "./ModuleFinancement"

interface Props {
  prenom: string
  niveau_estime: NiveauIndicatif
  scores: { oral: number, ecrit: number, grammaire: number, production: number }
  partenaire_consent: boolean
}

export function ResultatComplet({ prenom, niveau_estime, scores }: Props) {
  return (
    <div className="space-y-10 py-10 px-4 max-w-5xl mx-auto">
      <div className="bg-primary-container/10 border-2 border-primary/20 rounded-3xl p-6 md:p-10 text-center">
        <h2 className="text-3xl md:text-4xl font-black text-on-surface mb-4">
          Niveau de positionnement : <span className="text-primary">{niveau_estime}</span>
        </h2>
        <p className="text-sm text-on-surface-variant italic max-w-2xl mx-auto">
          Ce résultat est indicatif. Il ne remplace pas une certification officielle (TCF, DELF, TEF selon la démarche). 
          La décision finale appartient à l'administration compétente.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* BLOC 1 — Ma Formation */}
        <div className="bg-white rounded-3xl border border-outline-variant p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <GraduationCap className="h-6 w-6 text-primary" />
            <h3 className="text-xl font-bold">Ma Formation</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-8">
            {[
              { label: "Oral", score: scores.oral },
              { label: "Écrit", score: scores.ecrit },
              { label: "Grammaire", score: scores.grammaire },
              { label: "Production", score: scores.production, note: true },
            ].map((s) => (
              <div key={s.label} className="p-4 bg-surface-container rounded-2xl">
                <span className="text-xs font-bold text-on-surface-variant uppercase">{s.label}</span>
                <div className="text-2xl font-black text-on-surface">{s.score}/100</div>
                {s.note && <p className="text-[9px] text-on-surface-variant leading-tight mt-1">Score indicatif — évaluation humaine recommandée</p>}
              </div>
            ))}
          </div>

          <button className="w-full h-14 bg-primary text-on-primary rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all">
            Démarrer ma formation
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>

        {/* BLOC 2 — Mon Financement */}
        <ModuleFinancement niveau_estime={niveau_estime} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* BLOC 3 — Mon Dossier Administratif */}
        <div className="bg-white rounded-3xl border border-outline-variant p-8 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <FileText className="h-6 w-6 text-secondary" />
              <h3 className="text-xl font-bold">Mon Dossier Administratif</h3>
            </div>
            <p className="text-on-surface-variant mb-6">
              Un document manquant ou mal rempli peut retarder votre demande de plusieurs mois. Faites vérifier vos pièces par un expert.
            </p>
          </div>
          <button className="w-full h-14 border-2 border-secondary text-secondary rounded-xl font-bold hover:bg-secondary/5 transition-all">
            Faire vérifier mon dossier
          </button>
        </div>

        {/* BLOC 4 — Mes Documents */}
        <ChecklistDocuments type_demarche={niveau_estime} />
      </div>
    </div>
  )
}
