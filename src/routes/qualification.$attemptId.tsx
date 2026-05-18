import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, useMemo, useEffect } from 'react';
import { type NiveauIndicatif } from '@/types/bilan';
import { Button } from '@/components/bff/Button';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { 
  CheckCircle2, 
  ArrowRight,
  Loader2,
  AlertTriangle,
  Wallet,
  Zap,
  UserCheck,
  Award,
  Check
} from 'lucide-react';
import { toast } from 'sonner';
import { track } from '@/utils/tracking-plausible';
import { getRecommendedJourney } from '@/data/pricing';
import { Stepper } from '@/components/Stepper';
import { Tooltip } from '@/components/Tooltip';

export const Route = createFileRoute('/qualification/$attemptId')({
  component: QualificationPage,
});

function QualificationPage() {
  const { attemptId } = Route.useParams();
  const navigate = useNavigate();

  useEffect(() => {
    track("result_viewed");
  }, []);
  
  const [formData, setFormData] = useState({
    status: '',
    soldeCpf: 0,
    hasEmployerAgreement: null as boolean | null,
    hasSiret: null as boolean | null,
    hasMainDocs: null as boolean | null,
    isSmallCompany: null as boolean | null,
    niveau_indicatif: 'a_verifier' as NiveauIndicatif,
  });

  const { data: testResult, isLoading: loadingTest } = useQuery({
    queryKey: ['placement-result', attemptId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('placement_test_results')
        .select('*, placement_test_attempts(*)')
        .eq('attempt_id', attemptId)
        .single();
      if (error) throw error;
      return data;
    },
  });

  // Calcul du Parcours et du Financement dynamique depuis pricing.ts
  const simulation = useMemo(() => {
    const current: NiveauIndicatif = (testResult?.global_level as NiveauIndicatif) || 'A2';
    
    // Récupère le parcours de référence depuis pricing.ts
    const journey = getRecommendedJourney(current);
    
    const mobilizedCpf = Math.min(formData.soldeCpf || 0, journey.publicPrice);
    
    // Calcul de l'OPCO si salarié (estimation simplifiée de 50% du prix public jusqu'à concurrence)
    const opcoEst = formData.status === 'salarie' ? Math.round(journey.publicPrice * 0.5) : 0;
    
    const totalAides = Math.min(mobilizedCpf + opcoEst, journey.publicPrice);
    const rac = journey.publicPrice - totalAides;

    // Calcul de la Priorité Système
    let priority = 'moyenne';
    const isReady = rac === 0 && (testResult?.flags?.length || 0) === 0 && formData.hasMainDocs;
    if (isReady) priority = 'critique';
    else if (rac === 0 || formData.hasMainDocs) priority = 'haute';

    return { journey, mobilizedCpf, opcoEst, totalAides, rac, priority };
  }, [testResult, formData]);

  const submitMutation = useMutation({
    onSuccess: () => {
      toast.success('Votre fiche de financement a été transmise au conseiller.');
      navigate({ to: '/' });
    },
    mutationFn: async () => {
      const { data, error } = await supabase
        .from('dossiers')
        .insert({
          external_ref: attemptId,
          student_name: testResult?.placement_test_attempts?.student_name || 'Inconnu',
          student_email: 'A renseigner',
          status: 'en_qualification',
          priority: simulation.priority,
          context: {
            pedagogy: {
              current_level: testResult?.global_level,
              target_level: simulation.journey.toLevel,
              reliability_flags: testResult?.flags || [],
              rationale: simulation.journey.description
            },
            administration: {
              student_status: formData.status,
              declarative_info: formData
            },
            finances: {
              journey_id: simulation.journey.id,
              total_price: simulation.journey.publicPrice,
              aides_est: simulation.totalAides,
              rac: simulation.rac,
              is_estimated: true
            }
          }
        })
        .select();
      
      if (error) throw error;

      // Déclencher la notification partenaire
      if (data && data[0]?.id) {
        await supabase.functions.invoke('notify-partner-lead', {
          body: { dossier_id: data[0].id }
        });
      }
      return data;
    }
  });

  if (loadingTest) {
    return (
      <div className="p-20 text-center">
        <Loader2 className="animate-spin h-8 w-8 mx-auto mb-4 text-primary" />
        <span className="font-extrabold text-slate-800">Chargement de votre profil et initialisation du simulateur...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 space-y-6">
      {/* Stepper de Progression */}
      <div className="max-w-4xl mx-auto">
        <Stepper currentStep={3} />
      </div>

      <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-8">
        
        {/* Colonne Gauche : Questionnaire */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
            <h1 className="text-2xl font-black text-slate-900 mb-2">Simulateur de Financement</h1>
            <p className="text-slate-500 mb-8 text-sm">Déterminez vos droits de prise en charge en 3 questions simples.</p>

            <div className="space-y-8">
              {/* Statut Professionnel */}
              <div className="space-y-3">
                <label className="text-xs font-black text-slate-400 uppercase tracking-wider block">1. Votre situation professionnelle</label>
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { id: 'salarie', label: 'Salarié(e)' },
                    { id: 'demandeur_emploi', label: 'Demandeur d\'emploi' },
                    { id: 'independant', label: 'Indépendant / Chef d\'entreprise' },
                    { id: 'autre', label: 'Sans activité / Autre' }
                  ].map(s => (
                    <button
                      key={s.id}
                      onClick={() => setFormData(p => ({ ...p, status: s.id }))}
                      className={`h-14 px-4 rounded-xl border-2 text-sm font-black transition-all ${
                        formData.status === s.id ? 'border-primary bg-primary/5 text-primary' : 'border-slate-100 hover:border-slate-200 text-slate-700 bg-slate-50/50'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* CPF */}
              <div className="space-y-3">
                <label className="text-xs font-black text-slate-400 uppercase tracking-wider block">
                  2. Solde disponible sur votre compte <Tooltip content="Mon Compte Formation : l'argent gagné en travaillant pour financer vos cours.">CPF</Tooltip> (€)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400">€</span>
                  <input 
                    type="number" 
                    placeholder="Ex: 1500"
                    className="w-full h-14 pl-10 pr-6 rounded-xl bg-slate-50 border-2 border-slate-100 text-lg font-bold focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-slate-800"
                    onChange={(e) => setFormData(p => ({ ...p, soldeCpf: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  Vos droits <Tooltip content="Mon Compte Formation : l'argent gagné en travaillant pour financer vos cours.">CPF</Tooltip> cumulés en travaillant en France peuvent financer votre formation, sous réserve de solde suffisant.
                </p>
              </div>

              {/* Checkboxes Administratifs */}
              <div className="space-y-4 pt-6 border-t border-slate-100">
                <label className="text-xs font-black text-slate-400 uppercase tracking-wider block">3. Pièces administratives</label>
                <BooleanToggle 
                  label="Je possède les justificatifs requis pour ma démarche préfecture (identité, logement...)"
                  value={formData.hasMainDocs}
                  onChange={(v) => setFormData(p => ({ ...p, hasMainDocs: v }))}
                />
                {formData.status === 'salarie' && (
                  <BooleanToggle 
                    label="Mon employeur soutient ma démarche d'évolution professionnelle"
                    value={formData.hasEmployerAgreement}
                    onChange={(v) => setFormData(p => ({ ...p, hasEmployerAgreement: v }))}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Rassurance Pédagogique */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100">
               <Zap className="h-6 w-6 text-emerald-600 mb-3" />
               <h3 className="font-extrabold text-emerald-950 mb-1 text-sm">Effectifs Réduits</h3>
               <p className="text-xs text-emerald-700 leading-relaxed">
                 Groupes de 6 élèves maximum pour maximiser votre temps de parole et sécuriser votre réussite préfecture.
               </p>
             </div>
             <div className="bg-primary/5 p-6 rounded-2xl border border-primary/20">
               <UserCheck className="h-6 w-6 text-primary mb-3" />
               <h3 className="font-extrabold text-slate-900 mb-1 text-sm">Formateur Référent Dédié</h3>
               <p className="text-xs text-slate-600 leading-relaxed">
                 Un enseignant professionnel vous accompagne individuellement et valide vos devoirs chaque semaine.
               </p>
             </div>
          </div>
        </div>

        {/* Colonne Droite : Simulation de Reste à Charge */}
        <div className="lg:col-span-2">
          <div className="sticky top-8 space-y-6">
            <div className="bg-slate-900 text-white p-8 rounded-[2rem] shadow-2xl relative overflow-hidden space-y-6">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <Award className="h-24 w-24" />
              </div>

              <div className="relative z-10 space-y-6">
                <div>
                  <div className="inline-block px-3 py-1 bg-primary rounded-full text-[10px] font-black uppercase tracking-widest mb-2">
                    Ingénierie Académique
                  </div>
                  <h2 className="text-3xl font-black leading-tight">{simulation.journey.name}</h2>
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">{simulation.journey.hours}h · Objectif {simulation.journey.examTarget}</p>
                </div>

                <p className="text-xs text-slate-300 italic border-l-2 border-primary/50 pl-4 py-1">
                  "{simulation.journey.objective}"
                </p>

                <div className="space-y-4 pt-6 border-t border-slate-800">
                  <div className="flex justify-between items-center text-slate-400">
                    <span className="text-sm font-semibold">Prix public de la formation</span>
                    <span className="text-lg font-bold">{simulation.journey.publicPrice} €</span>
                  </div>
                  <div className="flex justify-between items-center text-emerald-400">
                    <span className="text-sm font-semibold flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                      Tarif financé de référence
                    </span>
                    <span className="text-lg font-bold">-{simulation.totalAides} €</span>
                  </div>
                  <div className="flex justify-between items-end pt-4 border-t border-dashed border-slate-800">
                    <div>
                      <span className="text-slate-400 text-xs block mb-1">Reste à charge estimé</span>
                      <span className="text-4xl font-black text-white">{simulation.rac} €</span>
                    </div>
                    {simulation.rac === 0 && (
                      <div className="bg-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded-lg text-[10px] font-black mb-2 tracking-wider uppercase flex items-center gap-1">
                        <Check className="h-3.5 w-3.5 stroke-[3]" />
                        Prise en charge totale
                      </div>
                    )}
                  </div>
                </div>

                <Button 
                  disabled={!formData.status || submitMutation.isPending}
                  onClick={() => submitMutation.mutate()}
                  className="w-full h-16 bg-primary hover:bg-primary/95 text-on-primary font-black text-lg rounded-2xl flex items-center justify-center gap-3 shadow-xl transition-all active:scale-95 disabled:opacity-50"
                >
                  {submitMutation.isPending ? <Loader2 className="animate-spin h-6 w-6" /> : (
                    <>
                      Confirmer ma simulation
                      <ArrowRight className="h-6 w-6" />
                    </>
                  )}
                </Button>

                <p className="text-[9px] text-slate-500 text-center leading-relaxed font-bold">
                  [ESTIMATION NON CONTRACTUELLE] <br />
                  Sous réserve de validation de vos droits CPF/OPCO et de l'analyse définitive de votre dossier.
                </p>
              </div>
            </div>

            {/* Alert Pédagogique */}
            {testResult?.flags?.length > 0 && (
              <div className="bg-orange-50 border border-orange-200 p-4 rounded-2xl flex gap-3">
                <AlertTriangle className="h-5 w-5 text-orange-600 shrink-0" />
                <p className="text-[10px] text-orange-800 leading-normal font-semibold">
                  <strong>Validation requise :</strong> Des variations algorithmiques ont été détectées. Un conseiller validera votre niveau lors de l'appel d'intégration.
                </p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

function BooleanToggle({ label, value, onChange }: { label: string, value: boolean | null, onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-4 p-3 hover:bg-slate-50 rounded-xl transition-colors">
      <span className="text-xs font-semibold text-slate-700">{label}</span>
      <div className="flex gap-1">
        <button 
          onClick={() => onChange(true)}
          className={`px-4 py-2 rounded-lg text-[10px] font-black border-2 transition-all ${value === true ? 'bg-primary border-primary text-white' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}
        >
          OUI
        </button>
        <button 
          onClick={() => onChange(false)}
          className={`px-4 py-2 rounded-lg text-[10px] font-black border-2 transition-all ${value === false ? 'bg-slate-800 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}
        >
          NON
        </button>
      </div>
    </div>
  );
}
