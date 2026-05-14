import { createFileRoute, Link } from '@tanstack/react-router';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { 
  Award, 
  Target, 
  BarChart, 
  ArrowRight, 
  CheckCircle2, 
  Download,
  Share2,
  Rocket,
  Loader2,
  AlertCircle,
  FileText
} from 'lucide-react';
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  ResponsiveContainer 
} from 'recharts';

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
          placement_test_attempts (
            student_name,
            estimated_level,
            placement_tests (title)
          ),
          training_offers (*)
        `)
        .eq('attempt_id', attemptId)
        .single();
      
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) return <div className="p-20 text-center"><Loader2 className="h-10 w-10 animate-spin mx-auto mb-6 text-orange-500" /> Analyse de votre profil expert...</div>;
  if (!result) return <div className="p-20 text-center">Résultat introuvable.</div>;

  const chartData = [
    { subject: 'Compréhension Écrite', A: result.ce_score_pct || 0 },
    { subject: 'Compréhension Orale', A: result.co_score_pct || 0 },
    { subject: 'Expression Écrite', A: result.detailed_analysis?.ee_level === 'B1' ? 75 : result.detailed_analysis?.ee_level === 'A2' ? 50 : 25 },
    { subject: 'Expression Orale', A: result.detailed_analysis?.eo_level === 'B1' ? 75 : result.detailed_analysis?.eo_level === 'A2' ? 50 : 25 },
  ];

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-5xl mx-auto space-y-10">
        
        {/* Header Section */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="space-y-2 text-center md:text-left">
            <h1 className="text-4xl font-extrabold text-blue-900 tracking-tight">Bilan de Niveau Expert</h1>
            <p className="text-slate-500 text-lg">Candidat : <span className="font-bold text-slate-800">{result.placement_test_attempts?.student_name}</span></p>
          </div>
          <Badge className="bg-green-100 text-green-700 hover:bg-green-100 px-4 py-2 border-green-200">
            Évaluation IA : Indice {result.confidence_level || 'Normal'}
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Level Card */}
          <Card className="lg:col-span-1 border-none shadow-2xl bg-blue-900 text-white overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
              <Award className="h-40 w-40" />
            </div>
            <CardHeader className="text-center">
              <CardTitle className="text-sm font-medium opacity-70 uppercase tracking-widest">Niveau Estimé</CardTitle>
            </CardHeader>
            <CardContent className="text-center p-12 space-y-6 relative z-10">
              <div className="text-[10rem] font-black tracking-tighter leading-none">{result.global_level || 'A2'}</div>
              <p className="text-xl font-bold opacity-90">Cadre CECRL</p>
              <div className="pt-8 text-xs opacity-60 leading-relaxed italic border-t border-white/20">
                Basé sur le barème TCF IRN (Intégration, Résidence, Nationalité).
              </div>
            </CardContent>
          </Card>

          {/* Detailed Skill Analysis */}
          <Card className="lg:col-span-2 border-none shadow-xl bg-white">
            <CardHeader className="border-b bg-slate-50/50">
              <CardTitle className="flex items-center gap-2 text-blue-900">
                <BarChart className="h-5 w-5 text-orange-500" />
                Détail de vos compétences
              </CardTitle>
            </CardHeader>
            <CardContent className="p-10 h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 13, fontWeight: 600 }} />
                  <Radar
                    name="Niveau"
                    dataKey="A"
                    stroke="#f97316"
                    fill="#f97316"
                    fillOpacity={0.6}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Narrative Analysis Section */}
        <Card className="border-none shadow-lg overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-900 to-blue-800 text-white">
            <CardTitle className="flex items-center gap-3">
              <FileText className="h-6 w-6" />
              Bilan Pédagogique Personnalisé
            </CardTitle>
          </CardHeader>
          <CardContent className="p-10 space-y-10">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-green-700 flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5" /> Vos points forts
                </h3>
                <ul className="space-y-3">
                  {result.strengths?.map((s: string, i: number) => (
                    <li key={i} className="bg-green-50 p-4 rounded-xl text-slate-700 border-l-4 border-green-500">{s}</li>
                  ))}
                </ul>
              </div>
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-orange-700 flex items-center gap-2">
                  <Target className="h-5 w-5" /> Axes d'amélioration
                </h3>
                <ul className="space-y-3">
                  {result.weaknesses?.map((w: string, i: number) => (
                    <li key={i} className="bg-orange-50 p-4 rounded-xl text-slate-700 border-l-4 border-orange-500">{w}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="p-8 bg-blue-50 rounded-2xl border border-blue-100 text-slate-700 leading-relaxed italic">
              <h4 className="not-italic font-bold text-blue-900 mb-2">L'avis de l'expert :</h4>
              "{result.detailed_analysis?.analysis || "Analyse en attente."}"
            </div>
          </CardContent>
        </Card>
        
        {/* RECOMMENDED OFFER (SALES FUNNEL) */}
        {result.training_offers && (
          <Card className="border-none shadow-2xl bg-gradient-to-br from-orange-500 to-orange-600 text-white overflow-hidden relative">
            <div className="absolute -right-20 -bottom-20 opacity-10">
              <Rocket className="h-80 w-80 rotate-12" />
            </div>
            <CardContent className="p-10 md:p-14 flex flex-col md:flex-row gap-12 items-center relative z-10">
              <div className="flex-1 space-y-6">
                <div className="inline-flex items-center gap-2 bg-white/20 px-4 py-1.5 rounded-full text-sm font-bold backdrop-blur-sm">
                  <Rocket className="h-4 w-4" /> Prochaine étape conseillée
                </div>
                <h2 className="text-4xl font-black leading-tight">
                  {result.estimated_level === 'B1' ? "Objectif Nationalité Française ?" : "Sécurisez votre parcours de formation"}
                </h2>
                <p className="text-xl text-orange-50 text-balance">
                  {result.detailed_analysis?.reliability_flag || 
                    `Bravo ${result.placement_test_attempts?.student_name} ! Votre niveau ${result.estimated_level} est une excellente base. Pour atteindre votre prochain objectif, nous vous conseillons ce module spécifique.`}
                </p>
                <div className="flex flex-wrap gap-4 pt-4">
                  <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-md border border-white/20">
                    <p className="text-xs opacity-70 uppercase font-bold tracking-widest mb-1">Formation recommandée</p>
                    <p className="text-xl font-bold">{result.training_offers.title}</p>
                  </div>
                  <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-md border border-white/20">
                    <p className="text-xs opacity-70 uppercase font-bold tracking-widest mb-1">Durée</p>
                    <p className="text-xl font-bold">{result.training_offers.duration}</p>
                  </div>
                </div>
              </div>
              <div className="w-full md:w-auto">
                <Button className="w-full md:w-auto h-20 px-12 bg-white text-orange-600 hover:bg-orange-50 font-black text-xl rounded-2xl shadow-xl transition-all hover:scale-105">
                  Découvrir mon offre
                  <ArrowRight className="ml-3 h-8 w-8" />
                </Button>
                <p className="text-center mt-4 text-xs opacity-70">
                  Conseil basé sur votre analyse IA
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Legal / Disclaimer */}
        <div className="bg-amber-50 border border-amber-200 p-6 rounded-2xl flex gap-4 text-amber-900 items-start">
          <AlertCircle className="h-6 w-6 shrink-0 mt-1" />
          <div className="text-sm">
            <p className="font-bold mb-1">Mention légale importante :</p>
            Ce test donne une **estimation pédagogique automatique** de votre niveau de français. Il est basé sur une technologie d'intelligence artificielle et ne remplace en aucun cas une certification officielle (TCF, DELF) passée dans un centre d'examen agréé par France Éducation International.
          </div>
        </div>

      </div>
    </div>
  );
}
