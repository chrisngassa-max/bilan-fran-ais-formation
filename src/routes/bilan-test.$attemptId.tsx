import { createFileRoute, Link } from '@tanstack/react-router';
import { Button } from '@/components/bff/Button';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { 
  Loader2,
  AlertCircle,
  Send,
  RefreshCw,
  Clock,
  ShieldCheck,
  Wallet,
  ArrowRight
} from 'lucide-react';
import { trackEvent } from '@/lib/analytics';
import { waHref } from '@/config/site';
import { LeadCaptureForm } from '@/components/LeadCaptureForm';
import { useEffect } from 'react';
import { ChecklistDocuments } from '@/components/ChecklistDocuments';
import { type NiveauIndicatif } from '@/types/bilan';
import { track } from '@/utils/tracking-plausible';
import { getRecommendedJourney } from '@/data/pricing';
import { Stepper } from '@/components/Stepper';

export const Route = createFileRoute('/bilan-test/$attemptId')({
  component: BilanTestPage,
});

function BilanTestPage() {
  const { attemptId } = Route.useParams();
  
  useEffect(() => {
    trackEvent('test_completed', { attempt_id: attemptId });
    track("result_viewed");
  }, [attemptId]);

  const { data: result, isLoading } = useQuery({
    queryKey: ['placement-result', attemptId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('placement_test_results')
        .select(`
          *,
          flags,
          placement_test_attempts (
            student_name,
            estimated_level,
            placement_tests (title)
          )
        `)
        .eq('attempt_id', attemptId)
        .single();
      
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-20 text-center">
        <Loader2 className="h-10 w-10 animate-spin mx-auto mb-6 text-primary" />
        <span className="font-extrabold text-slate-800 text-lg">Analyse linguistique et calcul de votre profil expert...</span>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-20 text-center">
        <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-4" />
        <span className="font-extrabold text-slate-800 text-lg">Résultat de bilan introuvable.</span>
      </div>
    );
  }

  const hasFatigue = result.flags?.includes('FATIGUE_DETECTEE');
  const isIncoherent = result.flags?.includes('PROFIL_INCOHERENT') || result.flags?.includes('ALERTE_VITESSE_INCOHERENTE');
  const isFragile = result.flags?.some((f: string) => f.startsWith('FIABILITE_FAIBLE'));

  // Modale bloquante de fatigue
  if (hasFatigue) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-10 rounded-3xl border border-slate-200 max-w-lg w-full text-center space-y-6 shadow-sm">
          <AlertCircle className="h-20 w-20 text-primary/80 mx-auto animate-pulse" />
          <h2 className="text-3xl font-black text-slate-900 leading-snug">Prenez une pause pour donner le meilleur de vous-même.</h2>
          <p className="text-slate-600 text-base leading-relaxed">
            Notre système a détecté une baisse significative de concentration sur la fin de votre évaluation. 
            Pour que votre bilan soit le plus précis possible, il est préférable de le terminer quand vous serez bien reposé(e).
          </p>
          <p className="text-primary font-bold bg-primary/5 p-4 rounded-xl border border-primary/20">
            Nous vous invitons à vous reposer et à repasser l'évaluation dans de meilleures conditions.
          </p>
          <Link to="/passer-test/$token" params={{ token: "latest" }} className="block w-full">
            <button className="w-full h-14 bg-primary text-on-primary font-bold rounded-xl hover:opacity-90 transition-all">
              Recommencer plus tard
            </button>
          </Link>
        </div>
      </div>
    );
  }

  const level = result.global_level || 'A2';
  const journey = getRecommendedJourney(level as NiveauIndicatif);

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-[850px] mx-auto space-y-8">
        
        {/* Stepper de Progression */}
        <Stepper currentStep={2} />

        {/* Result Header */}
        <div className="text-center space-y-2">
          <span className="text-xs font-black text-primary bg-primary/10 px-3 py-1 rounded-full uppercase tracking-wider inline-block">
            Bilan de Positionnement Linguistique
          </span>
          <h1 className="text-4xl font-black text-slate-900">Votre Rapport de Positionnement</h1>
          {result.placement_test_attempts?.student_name && (
            <p className="text-slate-500 font-semibold text-base">Candidat : {result.placement_test_attempts.student_name}</p>
          )}
        </div>

        {isIncoherent ? (
          <div className="rounded-3xl border-2 border-red-200 shadow-sm bg-red-50/50 overflow-hidden">
            <div className="bg-red-500 text-white p-6">
              <h2 className="flex items-center gap-2 text-xl font-bold">
                <AlertCircle className="h-6 w-6" /> Un échange pédagogique est recommandé.
              </h2>
            </div>
            <div className="p-8 space-y-6">
              <p className="text-slate-800 font-bold text-lg">
                Votre profil présente des variations de vitesse ou de réussite nécessitant une analyse humaine.
              </p>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-slate-600 text-sm mb-4">
                  Renseignez votre email ci-dessous : nous vous envoyons votre bilan détaillé avec une lecture
                  pédagogique affinée par notre équipe.
                </p>
                <LeadCaptureForm 
                  attemptId={attemptId} 
                  estimatedLevel={level} 
                  flags={result.flags} 
                  reliabilityByLevel={result.reliability_by_level} 
                  timeMetrics={result.time_metrics || result.time_spent_by_level} 
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            
            {/* BLOC PRINCIPAL — Score et Recommandation Unifiée */}
            <div className="bg-white border border-slate-200 rounded-3xl p-8 md:p-10 shadow-sm relative overflow-hidden space-y-8">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -mr-16 -mt-16"></div>
              
              <div className="flex flex-col md:flex-row items-center md:items-start gap-8 border-b border-slate-100 pb-8">
                {/* Badge Niveau */}
                <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-slate-900 flex flex-col items-center justify-center bg-slate-900 text-white shrink-0 shadow-lg">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Niveau</span>
                  <span className="text-5xl font-black text-primary flex items-baseline">
                    {level}
                    {isFragile && <span className="text-sm font-bold ml-1 text-amber-500"> (fragile)</span>}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">CECRL</span>
                </div>
                
                <div className="flex-1 text-center md:text-left space-y-3">
                  <span className="text-xs font-black text-slate-900 bg-slate-100 px-3 py-1 rounded-full uppercase tracking-wider inline-block">
                    PROFIL VALIDÉ PAR L'ALGORITHME
                  </span>
                  <h2 className="text-2xl font-black text-slate-900">Parcours Recommandé : {journey.name}</h2>
                  <p className="text-slate-600 text-sm leading-relaxed italic">
                    "{journey.objective}"
                  </p>
                </div>
              </div>

              {/* Fiche Technique & Grille Tarifaire */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">Structure Pédagogique</h4>
                  <ul className="space-y-3">
                    <li className="flex items-center gap-2 text-xs font-bold text-slate-700">
                      <Clock className="h-4 w-4 text-slate-400 shrink-0" />
                      {journey.hours}h de formation ({journey.sessions} séances)
                    </li>
                    <li className="flex items-center gap-2 text-xs font-bold text-slate-700">
                      <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
                      1 formateur référent - 6 élèves maximum
                    </li>
                    <li className="flex items-center gap-2 text-xs text-slate-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0"></span>
                      Préparation : {journey.examTarget}
                    </li>
                  </ul>
                </div>

                <div className="space-y-4 md:border-l md:border-slate-200 md:pl-8">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">Tarification et Financement</h4>
                  <div className="space-y-2">
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
                      <span className="text-lg font-black text-slate-900">{journey.monthlyInstallment} €<span className="text-xs font-normal text-slate-500">/mois</span></span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Primary action buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-slate-100">
                <Link to="/qualification/$attemptId" params={{ attemptId }} className="flex-1">
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

              <p className="text-[10px] text-center font-bold text-slate-400 uppercase tracking-wider">
                Eligible CPF, OPCO, France Travail. Paiement en 3 fois sans frais.
              </p>
            </div>

            {/* Profil Asymétrique Conseil */}
            {result.flags?.includes('PROFIL_ASYMETRIQUE') && (
              <div className="bg-amber-50/60 border border-amber-200 rounded-3xl p-8 shadow-sm space-y-3">
                <h3 className="text-lg font-black text-amber-900 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-amber-600 animate-pulse" />
                  Conseil Pédagogique : Profil Asymétrique Détecté
                </h3>
                <p className="text-slate-700 text-sm leading-relaxed">
                  Votre score révèle un écart prononcé entre vos compétences de compréhension écrite et orale. 
                  Ce profil d'apprentissage asymétrique est très fréquent chez les personnes apprenant en immersion pratique quotidienne. Nous vous recommandons de 
                  privilégier nos ateliers intensifs de conversation orale pour libérer votre parole tout en consolidant l'écrit.
                </p>
              </div>
            )}

            {/* Checklist Section */}
            <ChecklistDocuments type_demarche={level as NiveauIndicatif} />

            {/* Lead Capture */}
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div className="space-y-1">
                <h3 className="text-xl font-black text-slate-900">Recevoir le rapport complet par email</h3>
                <p className="text-xs text-slate-500">Un récapitulatif détaillé de vos scores et de votre plan de formation.</p>
              </div>
              <LeadCaptureForm 
                attemptId={attemptId} 
                estimatedLevel={level} 
                flags={result.flags} 
                reliabilityByLevel={result.reliability_by_level} 
                timeMetrics={result.time_metrics || result.time_spent_by_level} 
              />
            </div>

          </div>
        )}

        {/* Action Grid - canaux secondaires */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link to="/passer-test/$token" params={{ token: "latest" }} className="flex items-center justify-center gap-2 bg-transparent text-secondary border-2 border-secondary h-[56px] rounded-lg font-bold hover:bg-secondary/5 transition-all active:scale-95">
            <RefreshCw className="h-5 w-5" />
            Refaire le test
          </Link>
          <a 
            href={waHref()} 
            target="_blank" 
            rel="noreferrer" 
            onClick={() => trackEvent("whatsapp_clicked", { location: "bilan_secondary" })} 
            className="flex items-center justify-center gap-2 bg-emerald-600 text-white h-[56px] rounded-lg font-bold hover:bg-emerald-700 transition-all active:scale-95 shadow-md"
          >
            <Send className="h-5 w-5" />
            Une question ? Nous écrire sur WhatsApp
          </a>
        </div>

      </div>
    </div>
  );
}
