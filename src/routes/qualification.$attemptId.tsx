import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { useState, useMemo } from 'react';
import { Button } from '@/components/bff/Button';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { 
  CheckCircle2, 
  HelpCircle, 
  FileText, 
  ShieldCheck, 
  ArrowRight,
  Loader2,
  AlertTriangle,
  Building2,
  Wallet,
  Zap,
  UserCheck,
  Award
} from 'lucide-react';
import { toast } from 'sonner';

// --- CONFIGURATION PRICING V4 (Golden Master) ---
const PRICING_CONFIG = {
  journeys: [
    {
      id: "A2-B1-INTENSIF",
      from_level: "A2",
      to_level: "B1",
      total_hours: 100,
      components: { shared: 60, targeted: 40 },
      total_price: 3500,
      rationale: "Parcours de franchissement de seuil incluant 40h de tutorat pour lever les blocages syntaxiques et automatiser la parole.",
      estimates: { cpf: 1500, opco: 1200 }
    },
    {
      id: "B1-B2-EXPERT",
      from_level: "B1",
      to_level: "B2",
      total_hours: 120,
      components: { shared: 70, targeted: 50 },
      total_price: 4800,
      rationale: "Préparation avancée au B2 exigeant un accompagnement individuel soutenu sur l'expression fluide et la précision lexicale.",
      estimates: { cpf: 1500, opco: 2000 }
    }
  ]
};

export const Route = createFileRoute('/qualification/$attemptId')({
  component: QualificationPage,
});

function QualificationPage() {
  const { attemptId } = Route.useParams();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    status: '',
    soldeCpf: 0,
    hasEmployerAgreement: null as boolean | null,
    hasSiret: null as boolean | null,
    hasMainDocs: null as boolean | null,
    isSmallCompany: null as boolean | null,
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

  // Calcul du Parcours et du Financement V4
  const simulation = useMemo(() => {
    const current = testResult?.global_level || 'A2';
    const target = 'B1'; // TODO: Laisser le candidat choisir son objectif ?
    
    const journey = PRICING_CONFIG.journeys.find(j => j.from_level === current && j.to_level === target) 
                    || PRICING_CONFIG.journeys[0];
    
    const mobilizedCpf = Math.min(formData.soldeCpf || 0, journey.total_price);
    const opcoEst = formData.status === 'salarie' ? journey.estimates.opco : 0;
    const totalAides = mobilizedCpf + opcoEst;
    const rac = journey.total_price - totalAides;

    // Calcul de la Priorité Système
    let priority = 'moyenne';
    const isReady = rac === 0 && (testResult?.flags?.length || 0) === 0 && formData.hasMainDocs;
    if (isReady) priority = 'critique';
    else if (rac === 0 || formData.hasMainDocs) priority = 'haute';

    return { journey, mobilizedCpf, opcoEst, totalAides, rac, priority };
  }, [testResult, formData]);

  const submitMutation = useMutation({
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
              target_level: simulation.journey.to_level,
              reliability_flags: testResult?.flags || [],
              rationale: simulation.journey.rationale
            },
            administration: {
              student_status: formData.status,
              declarative_info: formData
            },
            finances: {
              journey_id: simulation.journey.id,
              total_price: simulation.journey.total_price,
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
    },
    onSuccess: () => {
      toast.success('Votre fiche de financement a été transmise au conseiller.');
      navigate({ to: '/' });
    }
  });

  if (loadingTest) return <div className="p-20 text-center"><Loader2 className="animate-spin h-8 w-8 mx-auto" /> Calcul de votre parcours...</div>;

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-8">
        
        {/* Colonne Gauche : Questionnaire */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
            <h1 className="text-2xl font-black text-slate-900 mb-2">Diagnostic de Financement</h1>
            <p className="text-slate-500 mb-8 text-sm">Répondez à ces questions pour estimer vos droits de prise en charge.</p>

            <div className="space-y-8">
              {/* Statut */}
              <div className="space-y-3">
                <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Votre Statut</label>
                <div className="grid grid-cols-2 gap-2">
                  {['salarie', 'demandeur_emploi', 'independant', 'autre'].map(s => (
                    <button
                      key={s}
                      onClick={() => setFormData(p => ({ ...p, status: s }))}
                      className={`h-12 px-4 rounded-xl border-2 text-sm font-bold transition-all ${
                        formData.status === s ? 'border-primary bg-primary/5 text-primary' : 'border-slate-100 hover:border-slate-200'
                      }`}
                    >
                      {s === 'salarie' ? 'Salarié' : s === 'demandeur_emploi' ? 'Chômeur' : s === 'independant' ? 'Indépendant' : 'Autre'}
                    </button>
                  ))}
                </div>
              </div>

              {/* CPF */}
              <div className="space-y-3">
                <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Solde CPF Estimé (€)</label>
                <input 
                  type="number" 
                  placeholder="Ex: 1500"
                  className="w-full h-14 px-6 rounded-xl bg-slate-50 border-none text-lg font-bold focus:ring-2 focus:ring-primary"
                  onChange={(e) => setFormData(p => ({ ...p, soldeCpf: parseInt(e.target.value) || 0 }))}
                />
              </div>

              {/* Checkboxes rapides */}
              <div className="space-y-4 pt-4 border-t">
                <BooleanToggle 
                  label="J'ai mes documents d'identité à disposition"
                  value={formData.hasMainDocs}
                  onChange={(v) => setFormData(p => ({ ...p, hasMainDocs: v }))}
                />
                {formData.status === 'salarie' && (
                  <BooleanToggle 
                    label="Mon entreprise a moins de 50 salariés"
                    value={formData.isSmallCompany}
                    onChange={(v) => setFormData(p => ({ ...p, isSmallCompany: v }))}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Argumentaire de vente */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
               <Zap className="h-6 w-6 text-blue-600 mb-3" />
               <h3 className="font-bold text-blue-900 mb-1 text-sm">Méthode Accélérée</h3>
               <p className="text-xs text-blue-700 leading-relaxed">Îlots de 6 élèves pour 2x plus de temps de parole et une progression record.</p>
             </div>
             <div className="bg-purple-50 p-6 rounded-2xl border border-purple-100">
               <UserCheck className="h-6 w-6 text-purple-600 mb-3" />
               <h3 className="font-bold text-purple-900 mb-1 text-sm">Suivi 100% Humain</h3>
               <p className="text-xs text-purple-700 leading-relaxed">Un tuteur dédié suit vos devoirs et votre progression chaque semaine.</p>
             </div>
          </div>
        </div>

        {/* Colonne Droite : Simulation V4 */}
        <div className="lg:col-span-2">
          <div className="sticky top-8 space-y-6">
            <div className="bg-slate-900 text-white p-8 rounded-[2rem] shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <Award className="h-24 w-24" />
              </div>

              <div className="relative z-10 space-y-6">
                <div>
                  <div className="inline-block px-3 py-1 bg-primary rounded-full text-[10px] font-black uppercase tracking-widest mb-2">
                    Ingénierie {simulation.journey.id}
                  </div>
                  <h2 className="text-3xl font-black leading-tight">Parcours {simulation.journey.to_level} complet</h2>
                  <p className="text-slate-400 text-sm">{simulation.journey.total_hours}h de formation experte</p>
                </div>

                <p className="text-xs text-slate-300 italic border-l-2 border-primary/50 pl-4 py-1">
                  "{simulation.journey.rationale}"
                </p>

                <div className="space-y-4 pt-6 border-t border-slate-800">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-sm">Prix du parcours</span>
                    <span className="text-xl font-bold">{simulation.journey.total_price}€</span>
                  </div>
                  <div className="flex justify-between items-center text-green-400">
                    <span className="text-sm">Aides estimées</span>
                    <span className="text-xl font-bold">-{simulation.totalAides}€</span>
                  </div>
                  <div className="flex justify-between items-end pt-4">
                    <div>
                      <span className="text-slate-400 text-xs block mb-1">Reste à charge</span>
                      <span className="text-4xl font-black text-white">{simulation.rac}€</span>
                    </div>
                    {simulation.rac === 0 && (
                      <div className="bg-green-500/20 text-green-400 px-3 py-1 rounded-lg text-[10px] font-bold mb-2">
                        100% FINANÇABLE
                      </div>
                    )}
                  </div>
                </div>

                <Button 
                  disabled={!formData.status || submitMutation.isPending}
                  onClick={() => submitMutation.mutate()}
                  className="w-full h-16 bg-primary hover:bg-primary/90 text-on-primary font-black text-lg rounded-2xl flex items-center justify-center gap-3 shadow-xl transition-all active:scale-95"
                >
                  {submitMutation.isPending ? <Loader2 className="animate-spin h-6 w-6" /> : (
                    <>
                      Transmettre ma fiche
                      <ArrowRight className="h-6 w-6" />
                    </>
                  )}
                </Button>

                <p className="text-[9px] text-slate-500 text-center leading-relaxed">
                  [ESTIMATION NON CONTRACTUELLE] <br />
                  La faisabilité finale dépend de la validation de vos droits par notre partenaire administratif.
                </p>
              </div>
            </div>

            {/* Alert pédagogique si besoin */}
            {testResult?.flags?.length > 0 && (
              <div className="bg-orange-50 border border-orange-200 p-4 rounded-2xl flex gap-3">
                <AlertTriangle className="h-5 w-5 text-orange-600 shrink-0" />
                <p className="text-[10px] text-orange-800 leading-tight">
                  <strong>Note technique :</strong> Des incohérences ont été détectées lors du test. Un entretien de vérification sera nécessaire avant validation définitive.
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
      <span className="text-xs font-bold text-slate-600">{label}</span>
      <div className="flex gap-1">
        <button 
          onClick={() => onChange(true)}
          className={`px-4 py-1.5 rounded-lg text-[10px] font-black border-2 transition-all ${value === true ? 'bg-primary border-primary text-white' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'}`}
        >
          OUI
        </button>
        <button 
          onClick={() => onChange(false)}
          className={`px-4 py-1.5 rounded-lg text-[10px] font-black border-2 transition-all ${value === false ? 'bg-slate-200 border-slate-200 text-slate-600' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'}`}
        >
          NON
        </button>
      </div>
    </div>
  );
}
