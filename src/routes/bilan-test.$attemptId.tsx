import { createFileRoute, Link } from '@tanstack/react-router';
import { Button } from '@/components/bff/Button';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { 
  Award, 
  Loader2,
  AlertCircle,
  Phone,
  Send,
  RefreshCw,
  Download,
  GraduationCap,
  Banknote,
  Wallet,
  ArrowRight
} from 'lucide-react';
import { trackEvent } from '@/lib/analytics';
import { contactInfo, phoneHref, waHref } from '@/config/site';

export const Route = createFileRoute('/bilan-test/$attemptId')({
  component: BilanTestPage,
});

function BilanTestPage() {
  const { attemptId } = Route.useParams();

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

  if (isLoading) return <div className="min-h-[60vh] flex flex-col items-center justify-center p-20 text-center"><Loader2 className="h-10 w-10 animate-spin mx-auto mb-6 text-primary" /> Analyse de votre profil expert...</div>;
  if (!result) return <div className="min-h-[60vh] flex flex-col items-center justify-center p-20 text-center">Résultat introuvable.</div>;

  const hasFatigue = result.flags?.includes('FATIGUE_DETECTEE');
  const isIncoherent = result.flags?.includes('PROFIL_INCOHERENT') || result.flags?.includes('ALERTE_VITESSE_INCOHERENTE');
  const isFragile = result.flags?.some((f: string) => f.startsWith('FIABILITE_FAIBLE'));

  // Modale bloquante de fatigue
  if (hasFatigue) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-4">
        <div className="bg-surface-bright p-10 rounded-3xl border border-outline-variant max-w-lg w-full text-center space-y-6 shadow-sm">
          <AlertCircle className="h-20 w-20 text-primary-container mx-auto" />
          <h2 className="text-3xl font-bold text-on-surface">Baisse d'attention détectée</h2>
          <p className="text-on-surface-variant text-lg leading-relaxed">
            Notre système a détecté une fatigue ou une baisse de concentration significative sur la fin de votre test. 
            Le résultat actuel ne serait pas représentatif de votre vrai niveau.
          </p>
          <p className="text-primary font-bold bg-primary-container/10 p-4 rounded-xl border border-primary-container/20">
            Nous vous invitons à vous reposer et à repasser l'évaluation dans de meilleures conditions.
          </p>
          <Link to="/evaluation" className="block w-full">
            <button className="w-full h-14 bg-primary text-on-primary font-bold rounded-lg hover:opacity-90 transition-all">Recommencer plus tard</button>
          </Link>
        </div>
      </div>
    );
  }

  const level = result.global_level || 'A2';
  const levelText = level === 'B1' ? 'Intermédiaire' : level === 'B2' ? 'Avancé' : level === 'A1' ? 'Débutant' : 'Élémentaire';
  const levelDesc = level === 'B1' ? 'Vous comprenez les points essentiels quand un langage clair et standard est utilisé. Vous pouvez vous débrouiller dans la plupart des situations rencontrées en voyage.' : 
                    level === 'B2' ? 'Vous pouvez comprendre le contenu essentiel de sujets concrets ou abstraits dans un texte complexe.' :
                    'Vous pouvez comprendre des phrases isolées et des expressions fréquemment utilisées.';

  return (
    <div className="min-h-screen bg-surface py-12 px-4">
      <div className="max-w-[1000px] mx-auto">
        
        {/* Result Header */}
        <div className="text-center mb-12">
          <span className="text-xs font-bold font-label text-secondary uppercase tracking-widest block mb-2">Résultat de votre test (30 min)</span>
          <h1 className="text-3xl md:text-4xl font-bold text-on-surface">Votre bilan de niveau estimé</h1>
          {result.placement_test_attempts?.student_name && (
            <p className="text-on-surface-variant mt-2 text-lg">Candidat : {result.placement_test_attempts.student_name}</p>
          )}
        </div>

        {isIncoherent ? (
          <div className="rounded-2xl border-2 border-error/50 shadow-sm bg-error-container/10 overflow-hidden mb-12">
            <div className="bg-error text-white p-6">
              <h2 className="flex items-center gap-2 text-xl font-bold">
                <AlertCircle className="h-6 w-6" /> Vérification Humaine Requise
              </h2>
            </div>
            <div className="p-10 space-y-6">
              <p className="text-on-surface font-medium text-xl">
                Votre profil présente des irrégularités (vitesse d'exécution ou asymétrie de score).
                Les résultats ont été masqués.
              </p>
              <div className="flex flex-col md:flex-row gap-6 items-center bg-surface-bright p-6 rounded-2xl border border-outline-variant shadow-sm">
                <div className="flex-1">
                  <p className="text-on-surface-variant">Pour débloquer vos résultats officiels, un entretien de vérification avec un de nos formateurs est nécessaire.</p>
                </div>
                <Link to="/contact">
                  <button className="h-14 px-8 bg-primary hover:opacity-90 text-on-primary font-bold rounded-xl whitespace-nowrap transition-all">
                    Contacter un conseiller
                  </button>
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-surface-bright border border-outline-variant rounded-xl p-8 md:p-10 shadow-sm relative overflow-hidden">
            {/* Decorative Accent */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-secondary-container opacity-20 rounded-bl-full -mr-16 -mt-16"></div>
            
            <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-8">
              {/* Level Badge */}
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-primary-container flex flex-col items-center justify-center bg-surface shrink-0">
                <span className="text-xs font-bold font-label text-on-surface-variant uppercase">NIVEAU</span>
                <span className="text-4xl md:text-5xl font-bold text-primary flex items-baseline">
                  {level}
                  {isFragile && <span className="text-xl ml-1 text-primary-container">*</span>}
                </span>
              </div>
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-2xl font-bold text-on-surface mb-2">{levelText}</h2>
                <p className="text-on-surface-variant text-lg mb-4">{levelDesc}</p>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-secondary-container text-on-secondary-container rounded-full mb-4">
                  <Award className="h-5 w-5" />
                  <span className="text-xs font-bold uppercase tracking-wider">Niveau requis pour : {level === 'B2' ? 'Naturalisation' : level === 'B1' ? 'Carte de Résident' : 'Carte Pluriannuelle'}</span>
                </div>
                
                {/* CTA Predict Tunnel */}
                <div className="mt-4">
                  <Link to="/qualification/$attemptId" params={{ attemptId }} className="block md:inline-block">
                    <Button className="w-full md:w-auto h-12 px-6 bg-primary text-on-primary font-bold rounded-xl shadow-md hover:opacity-90 flex items-center justify-center gap-2">
                      <Wallet className="h-5 w-5" />
                      Vérifier mon éligibilité au financement
                      <ArrowRight className="h-5 w-5" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-outline-variant pt-8">
              {/* Recommendations */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-3 flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" />
                  CERTIFICATIONS RECOMMANDÉES
                </h3>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-on-surface">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                    Examen Officiel (Intégration, Résidence, Nationalité)
                  </li>
                  <li className="flex items-center gap-2 text-on-surface">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                    TEF Carte de Résident
                  </li>
                  <li className="flex items-center gap-2 text-on-surface">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                    {level === 'B1' || level === 'B2' ? `DELF ${level}` : 'DELF A2'}
                  </li>
                </ul>
              </div>
              
              {/* Financing */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-3 flex items-center gap-2">
                  <Banknote className="h-4 w-4" />
                  FINANCEMENTS DISPONIBLES
                </h3>
                <div className="bg-surface-container p-4 rounded-lg">
                  <p className="text-on-surface-variant mb-2">Vos droits (CPF, OPCO, employeur) peuvent couvrir tout ou partie de votre préparation. Testons votre éligibilité.</p>
                </div>
              </div>
            </div>

            {/* Caution Message */}
            <div className="mt-8 flex gap-3 p-4 bg-error-container/10 border border-error/20 rounded-lg">
              <AlertCircle className="text-error h-6 w-6 shrink-0" />
              <p className="text-on-surface-variant italic">
                <span className="font-bold text-on-surface">Note :</span> Cette estimation indique votre niveau actuel. Pour obtenir votre carte de séjour ou votre naturalisation, vous devrez passer un examen officiel (TCF, DELF) en centre agréé.
              </p>
            </div>
            {isFragile && (
              <p className="text-xs text-on-surface-variant mt-2 italic text-right">* Profil algorithmique fragile (besoin de confirmation humaine).</p>
            )}
          </div>
        )}

        {/* Action Grid */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link to="/contact" className="flex items-center justify-center gap-2 bg-primary text-on-primary h-[56px] rounded-lg font-bold hover:opacity-90 transition-all active:scale-95 shadow-sm">
            <Send className="h-5 w-5" />
            Nous contacter
          </Link>
          <a href={waHref()} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 bg-surface-container-highest text-on-surface h-[56px] rounded-lg font-bold border border-outline-variant hover:bg-surface-variant transition-all active:scale-95">
            <Send className="h-5 w-5" />
            Envoyer par WhatsApp
          </a>
          <Link to="/evaluation" className="flex items-center justify-center gap-2 bg-transparent text-secondary border-2 border-secondary h-[56px] rounded-lg font-bold hover:bg-secondary/5 transition-all active:scale-95">
            <RefreshCw className="h-5 w-5" />
            Refaire le test
          </Link>
        </div>

        {/* Help Section */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="relative group overflow-hidden rounded-xl h-48 bg-surface-container-high border border-outline-variant flex items-center justify-center">
            {/* Fallback pattern if image is missing */}
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary to-surface"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-6 z-10">
              <h4 className="text-white font-bold text-xl mb-1">Besoin d'aide ?</h4>
              <p className="text-white/80">Un expert vous guide pour votre dossier de nationalité.</p>
            </div>
          </div>
          <div className="bg-[#ffdbd0] text-[#7e2c0d] p-6 rounded-xl flex flex-col justify-center">
            <h4 className="font-bold text-xl mb-2">Guide Pratique</h4>
            <p className="mb-4">Téléchargez gratuitement notre guide sur les étapes de la demande de naturalisation 2024.</p>
            <a className="font-bold flex items-center gap-1 hover:underline" href="#">
                Télécharger le PDF
                <Download className="h-5 w-5" />
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}
