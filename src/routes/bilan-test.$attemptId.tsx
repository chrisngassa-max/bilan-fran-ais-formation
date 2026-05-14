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
          <div className="flex flex-wrap gap-2 justify-center">
            {result.flags?.includes('FATIGUE_DETECTEE') && (
              <Badge variant="outline" className="border-amber-500 text-amber-700 bg-amber-50 px-3 py-1 animate-pulse">
                <AlertCircle className="h-3 w-3 mr-1" /> Fatigue détectée
              </Badge>
            )}
            {result.flags?.includes('PROFIL_ASYMETRIQUE') && (
              <Badge variant="outline" className="border-blue-300 text-blue-700 bg-blue-50 px-3 py-1">
                Profil asymétrique
              </Badge>
            )}
            <Badge className="bg-green-100 text-green-700 hover:bg-green-100 px-4 py-2 border-green-200">
              Fiabilité Algorithmique : {result.flags?.length > 0 ? 'Diagnostic complexe' : 'Optimale'}
            </Badge>
          </div>
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
                Basé sur le référentiel Européen (CECRL).
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
              "{result.teacher_notes || "Analyse pédagogique en cours..."}"
            </div>
          </CardContent>
        </Card>
        
        {/* ANOMALY DETECTION / EXPERT CTA */}
        {(result.flags?.includes('ALERTE_VITESSE_INCOHERENTE') || result.flags?.includes('PROFIL_INCOHERENT')) && (
          <Card className="border-2 border-red-500 shadow-2xl bg-red-50 overflow-hidden">
            <CardHeader className="bg-red-600 text-white">
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-6 w-6" /> Vérification Humaine Recommandée
              </CardTitle>
            </CardHeader>
            <CardContent className="p-10 space-y-6">
              <p className="text-red-900 font-medium text-xl">
                Votre profil présente des irrégularités (vitesse d'exécution ou incohérence de score) qui ne permettent pas à notre algorithme de garantir votre niveau CECRL à 100%.
              </p>
              <div className="flex flex-col md:flex-row gap-6 items-center bg-white p-6 rounded-2xl border border-red-200 shadow-sm">
                <div className="flex-1">
                  <p className="text-slate-600">Pour valider officiellement votre niveau et obtenir un diagnostic précis, nous vous recommandons un entretien de 15 minutes avec un de nos formateurs experts.</p>
                </div>
                <Button className="h-14 px-8 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl whitespace-nowrap">
                  Réserver mon entretien gratuit
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* RECOMMENDED OFFER (ADVANCED FUNNEL) */}
        {result.recommended_offer_json ? (
          <Card className="border-2 border-amber-400 shadow-2xl bg-amber-50 overflow-hidden">
            <CardHeader className="border-b border-amber-100 bg-amber-100/50">
              <CardTitle className="text-amber-900 flex items-center gap-2">
                <Rocket className="h-6 w-6" /> Votre prochaine étape recommandée
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 md:p-12 space-y-8">
              <p className="text-slate-700 text-xl leading-relaxed font-medium">
                {result.profile_message}
              </p>
              
              <div className="bg-white rounded-3xl p-8 border border-amber-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-8">
                <div className="space-y-3 flex-1 text-center md:text-left">
                  <h3 className="font-black text-blue-900 text-2xl">{result.recommended_offer_json.titre}</h3>
                  <p className="text-slate-500 text-lg leading-snug">{result.recommended_offer_json.description}</p>
                  {result.recommended_offer_json.duree_heures && (
                    <Badge className="bg-amber-100 text-amber-800 border-none font-bold px-4 py-1">
                      {result.recommended_offer_json.duree_heures}h de formation intensive
                    </Badge>
                  )}
                </div>
                <Button asChild className="w-full md:w-auto h-16 px-10 bg-amber-500 hover:bg-amber-600 text-white font-black text-xl rounded-2xl shadow-lg transition-transform hover:scale-105">
                  <a href={result.recommended_offer_json.url_cta} className="flex items-center">
                    Découvrir cette formation
                    <ArrowRight className="ml-3 h-6 w-6" />
                  </a>
                </Button>
              </div>
              
              <p className="text-xs text-slate-400 text-center italic">
                Conseil basé sur votre analyse IA. Pour un plan sur-mesure, prenez rendez-vous avec un expert humain.
              </p>
            </CardContent>
          </Card>
        ) : result.recommended_pathway && (
          <Card className="border-none shadow-xl bg-orange-50 overflow-hidden">
             <CardHeader className="bg-orange-500 text-white">
              <CardTitle className="flex items-center gap-2">
                <Target className="h-6 w-6" /> Parcours Recommandé
              </CardTitle>
            </CardHeader>
            <CardContent className="p-10 space-y-6">
              <p className="text-orange-900 font-bold text-2xl">{result.recommended_group}</p>
              <p className="text-slate-700 text-lg">{result.recommended_pathway}</p>
              <Button asChild className="bg-blue-900 hover:bg-blue-800 text-white">
                <Link to="/financement">Consulter les aides disponibles</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Legal / Disclaimer */}
        <div className="bg-amber-50 border border-amber-200 p-6 rounded-2xl flex gap-4 text-amber-900 items-start">
          <AlertCircle className="h-6 w-6 shrink-0 mt-1" />
          <div className="text-sm">
            <p className="font-bold mb-1">Mention légale importante :</p>
            Ce bilan donne une **estimation pédagogique automatique** de votre niveau de français. Il est basé sur une technologie d'intelligence artificielle et ne remplace en aucun cas une certification officielle passée dans un centre d'examen agréé.
          </div>
        </div>

      </div>
    </div>
  );
}
