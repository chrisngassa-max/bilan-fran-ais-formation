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
          )
        `)
        .eq('attempt_id', attemptId)
        .single();
      
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) return <div className="p-20 text-center"><Loader2 className="h-10 w-10 animate-spin mx-auto mb-6 text-orange-500" /> Analyse pédagogique en cours...</div>;
  if (!result) return <div className="p-20 text-center">Résultat introuvable.</div>;

  const chartData = [
    { subject: 'Écrit', A: result.ce_score_pct || 0, fullMark: 100 },
    { subject: 'Oral', A: result.co_score_pct || 0, fullMark: 100 },
    { subject: 'Production', A: ((result.ee_score_pct || 0) + (result.eo_score_pct || 0)) / 2 || 0, fullMark: 100 },
    { subject: 'Grammaire', A: 75, fullMark: 100 }, // Mocked or calculated
  ];

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-5xl mx-auto space-y-10">
        
        {/* Success Banner */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-extrabold text-blue-900">Votre Bilan de Niveau Français</h1>
          <p className="text-slate-500 text-lg">Bravo {result.placement_test_attempts?.student_name}, voici votre profil linguistique actuel.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Level Card */}
          <Card className="lg:col-span-1 border-none shadow-2xl bg-gradient-to-br from-blue-900 to-blue-800 text-white overflow-hidden relative">
            <div className="absolute -right-4 -bottom-4 opacity-10">
              <Award className="h-48 w-48" />
            </div>
            <CardHeader className="text-center">
              <CardTitle className="text-sm font-medium opacity-70 uppercase tracking-[0.2em]">Estimation CECRL</CardTitle>
            </CardHeader>
            <CardContent className="text-center p-12 space-y-6 relative z-10">
              <div className="text-9xl font-black tracking-tighter drop-shadow-lg">{result.global_level || 'A2'}</div>
              <Badge className="bg-orange-500 hover:bg-orange-500 text-white px-6 py-2 text-md border-none shadow-lg">
                {result.global_level?.includes('A') ? 'Niveau Élémentaire' : 'Niveau Indépendant'}
              </Badge>
              <div className="pt-6 text-sm opacity-80 leading-relaxed max-w-[200px] mx-auto">
                Vous pouvez communiquer dans des situations simples de la vie quotidienne.
              </div>
            </CardContent>
          </Card>

          {/* Analysis Card */}
          <Card className="lg:col-span-2 border-none shadow-xl bg-white overflow-hidden">
            <CardHeader className="bg-slate-50 border-b">
              <CardTitle className="flex items-center gap-2 text-blue-900">
                <BarChart className="h-5 w-5 text-orange-500" />
                Détails par compétences
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 14, fontWeight: 600 }} />
                  <Radar
                    name="Score"
                    dataKey="A"
                    stroke="#f97316"
                    fill="#f97316"
                    fillOpacity={0.5}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Analysis Text */}
          <Card className="border-none shadow-lg bg-white">
            <CardHeader className="bg-green-50/50 border-b">
              <CardTitle className="text-lg flex items-center gap-2 text-green-800">
                <CheckCircle2 className="h-5 w-5" /> Vos points forts
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-4">
              {result.strengths?.map((s: string, i: number) => (
                <div key={i} className="flex gap-4 items-start">
                  <div className="h-6 w-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <p className="text-slate-700 leading-relaxed">{s}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg bg-white">
            <CardHeader className="bg-orange-50/50 border-b">
              <CardTitle className="text-lg flex items-center gap-2 text-orange-800">
                <Target className="h-5 w-5" /> À travailler
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-4">
              {result.weaknesses?.map((w: string, i: number) => (
                <div key={i} className="flex gap-4 items-start">
                  <div className="h-6 w-6 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center shrink-0 mt-0.5">
                    <ArrowRight className="h-4 w-4" />
                  </div>
                  <p className="text-slate-700 leading-relaxed">{w}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Action / Next Steps */}
        <div className="bg-blue-900 rounded-3xl p-10 text-white flex flex-col md:flex-row items-center justify-between gap-10 shadow-2xl">
          <div className="space-y-4 max-w-xl">
            <h2 className="text-3xl font-bold">Prêt à progresser ?</h2>
            <p className="opacity-80 text-lg">
              Téléchargez votre bilan complet au format PDF ou contactez un formateur pour mettre en place votre parcours personnalisé.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 shrink-0">
            <Button size="lg" variant="secondary" className="h-16 px-10 gap-2 font-bold text-lg rounded-2xl">
              <Download className="h-5 w-5" /> Télécharger mon PDF
            </Button>
            <Button size="lg" className="h-16 px-10 gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-lg rounded-2xl">
              Prendre rendez-vous <ArrowRight className="h-5 w-5" />
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
}
