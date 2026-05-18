import { Award, GraduationCap, Banknote, FileText, ArrowRight, Info, Clock, ShieldCheck, Wallet } from "lucide-react";
import { NiveauIndicatif } from "@/types/bilan";
import { getRecommendedJourney } from "@/data/pricing";
import { ChecklistDocuments } from "./ChecklistDocuments";
import { ModuleFinancement } from "./ModuleFinancement";
import { Link } from "@tanstack/react-router";

interface Props {
  prenom: string;
  niveau_estime: NiveauIndicatif;
  scores: { oral: number; ecrit: number; grammaire: number; production: number };
  partenaire_consent: boolean;
  attemptId?: string;
}

export function ResultatComplet({ prenom, niveau_estime, scores, attemptId }: Props) {
  const journey = getRecommendedJourney(niveau_estime);
  
  // Si nous avons un attemptId, nous lions vers sa page de qualification, sinon vers le formulaire d'accompagnement
  const qualificationLink = attemptId 
    ? `/qualification/${attemptId}` 
    : "/accompagnement-administratif";

  return (
    <div className="space-y-10 py-10 px-4 max-w-5xl mx-auto">
      
      {/* En-tête Principal */}
      <div className="bg-slate-900 text-white rounded-3xl p-8 md:p-10 text-center relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-bl-full -mr-16 -mt-16"></div>
        <div className="relative z-10 space-y-4">
          <span className="text-xs font-black uppercase tracking-widest text-primary bg-primary/10 px-3 py-1.5 rounded-full inline-block">
            Diagnostic Pédagogique Complet
          </span>
          <h2 className="text-3xl md:text-4xl font-black">
            Votre niveau indicatif : <span className="text-primary">{niveau_estime}</span> (CECRL)
          </h2>
          <p className="text-sm text-slate-400 italic max-w-2xl mx-auto">
            Ce résultat est indicatif. Il permet de vous positionner de manière sécurisée pour votre objectif administratif ou professionnel.
          </p>
        </div>
      </div>

      {/* BLOC PRINCIPAL — Proposition Commerciale & Parcours */}
      <div className="bg-white rounded-3xl border border-slate-200 p-8 md:p-10 shadow-sm relative overflow-hidden space-y-8">
        <div className="border-b border-slate-100 pb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/5 px-2.5 py-1 rounded-md block mb-1.5 w-fit">
              Recommandation Académique
            </span>
            <h3 className="text-2xl font-black text-slate-900">Parcours {journey.name}</h3>
          </div>
          <div className="flex items-center gap-1.5 text-slate-600 font-bold text-sm bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            <Clock className="h-4 w-4 text-slate-400" />
            {journey.hours}h de formation ({journey.sessions} séances)
          </div>
        </div>

        <p className="text-sm font-semibold text-slate-800 italic border-l-2 border-primary/50 pl-4 py-1">
          "{journey.objective}"
        </p>

        {/* Détails et Grille de Prix */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">Avantages pédagogiques</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-xs font-bold text-slate-700">
                <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
                1 formateur référent - 6 élèves maximum
              </li>
              <li className="flex items-center gap-2 text-xs text-slate-600">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0"></span>
                Suivi hebdomadaire de devoirs et progression
              </li>
              <li className="flex items-center gap-2 text-xs text-slate-600">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0"></span>
                Objectif Examen : {journey.examTarget}
              </li>
            </ul>
          </div>

          <div className="space-y-4 md:border-l md:border-slate-200 md:pl-8">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">Grille de Financement</h4>
            <div className="space-y-2.5">
              <div className="flex justify-between items-baseline text-xs font-semibold text-slate-500">
                <span>Prix public</span>
                <span>{journey.publicPrice} €</span>
              </div>
              <div className="flex justify-between items-baseline border-b border-dashed pb-2">
                <span className="text-xs font-semibold text-slate-500">Tarif financé de référence</span>
                <span className="text-base font-extrabold text-emerald-600">{journey.financedReferencePrice} €</span>
              </div>
              <div className="flex justify-between items-baseline pt-1">
                <span className="text-xs font-bold text-slate-900">Mensualité (3x sans frais)</span>
                <span className="text-lg font-black text-slate-900">{journey.monthlyInstallment} €<span className="text-[10px] font-normal text-slate-500">/mois</span></span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons Ordonnés */}
        <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row gap-4">
          <Link to={qualificationLink} className="flex-1">
            <button className="w-full h-16 bg-primary text-on-primary font-black text-lg rounded-2xl flex items-center justify-center gap-2 shadow-xl hover:opacity-95 active:scale-95 transition-all">
              <Wallet className="h-5 w-5" />
              Vérifier mon financement
              <ArrowRight className="h-5 w-5" />
            </button>
          </Link>
          <Link to="/contact" className="flex-1">
            <button className="w-full h-16 border-2 border-slate-900 text-slate-900 font-bold rounded-2xl hover:bg-slate-50 transition-all flex items-center justify-center">
              M'inscrire au prix public - {journey.publicPrice} €
            </button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* BLOC ÉVALUATION — Mes Scores */}
        <div className="bg-white rounded-3xl border border-outline-variant p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <GraduationCap className="h-6 w-6 text-primary shrink-0" />
            <h3 className="text-xl font-bold">Mes Scores Détaillés</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Compréhension Oral", score: scores.oral },
              { label: "Compréhension Écrit", score: scores.ecrit },
              { label: "Grammaire & Vocabulaire", score: scores.grammaire },
              { label: "Production Écrite", score: scores.production, note: true },
            ].map((s) => (
              <div key={s.label} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">{s.label}</span>
                <div className="text-2xl font-black text-slate-800">{s.score}/100</div>
                {s.note && <p className="text-[9px] text-slate-400 leading-tight mt-1">Évaluation linguistique</p>}
              </div>
            ))}
          </div>
        </div>

        {/* BLOC FINANCEMENT — Options */}
        <ModuleFinancement niveau_estime={niveau_estime} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* BLOC ACCUEIL ADMINISTRATIF */}
        <div className="bg-white rounded-3xl border border-outline-variant p-8 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <FileText className="h-6 w-6 text-secondary shrink-0" />
              <h3 className="text-xl font-bold">Mon Dossier Administratif</h3>
            </div>
            <p className="text-on-surface-variant text-sm mb-6 leading-relaxed">
              Un document manquant ou mal rempli en préfecture peut retarder votre demande de plusieurs mois. Bénéficiez d'une vérification personnalisée par nos experts partenaires.
            </p>
          </div>
          <Link to="/accompagnement-administratif">
            <button className="w-full h-14 border-2 border-secondary text-secondary rounded-xl font-bold hover:bg-secondary/5 transition-all">
              Faire vérifier mon dossier
            </button>
          </Link>
        </div>

        {/* BLOC DOCUMENTS DE REFERENCE */}
        <ChecklistDocuments type_demarche={niveau_estime} />
      </div>
    </div>
  );
}
