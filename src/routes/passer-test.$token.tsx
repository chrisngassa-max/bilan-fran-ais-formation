import { createFileRoute, useNavigate, useParams } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { ChevronRight, Send, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';

export const Route = createFileRoute('/passer-test/$token')({
  component: PasserTestPage,
});

function PasserTestPage() {
  const { token } = Route.useParams();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0); 
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [answers, setAnswers] = useState<any[]>([]);
  const [studentName, setStudentName] = useState('');

  const { data: testPayload, isLoading, error } = useQuery({
    queryKey: ['public-placement-test', token],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('get-placement-test', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        queries: token === 'latest' ? {} : { token }
      });
      if (error) throw error;
      return data;
    },
  });

  const groupedItems = testPayload?.items ? {
    CE: testPayload.items.filter((i: any) => i.skill === 'CE'),
    CO: testPayload.items.filter((i: any) => i.skill === 'CO'),
    EE: testPayload.items.filter((i: any) => i.skill === 'EE'),
    EO: testPayload.items.filter((i: any) => i.skill === 'EO'),
  } : null;

  const steps = ["", "CE", "CO", "EE", "EO"];
  const currentSkill = steps[currentStep];
  const currentItems = groupedItems ? (groupedItems as any)[currentSkill] : [];
  const currentItem = currentItems ? currentItems[currentItemIndex] : null;

  const submitMutation = useMutation({
    mutationFn: async (payload: any) => {
      const { data, error } = await supabase.functions.invoke('score-placement-test', {
        body: payload
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success('Test terminé !');
      navigate({ to: '/bilan-test/$attemptId', params: { attemptId: data.attempt_id } });
    },
    onError: (err: any) => toast.error(`Erreur: ${err.message}`),
  });

  const handleAnswerChange = (answer: string) => {
    setAnswers(prev => {
      const filtered = prev.filter(a => a.item_id !== currentItem.id);
      return [...filtered, { item_id: currentItem.id, answer, time_spent: 0 }];
    });
  };

  const nextItem = () => {
    if (currentItemIndex < currentItems.length - 1) {
      setCurrentItemIndex(prev => prev + 1);
    } else {
      setCurrentStep(prev => prev + 1);
      setCurrentItemIndex(0);
    }
  };

  if (isLoading) return <div className="p-20 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" /> Chargement du test...</div>;
  if (error) return <div className="p-20 text-center text-destructive">Erreur: {(error as any).message}</div>;

  return (
    <div className="min-h-screen bg-[#fcfaf7] py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {currentStep === 0 && (
          <Card className="border-none shadow-xl">
            <CardHeader className="text-center p-10 bg-blue-900 text-white rounded-t-xl">
              <CardTitle className="text-3xl font-bold">{testPayload.test.title}</CardTitle>
              <p className="mt-2 text-white/70 text-lg">Évaluation gratuite de votre niveau de français</p>
            </CardHeader>
            <CardContent className="p-10 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-6">
                  <h3 className="font-bold text-blue-900 text-xl">Comment ça marche ?</h3>
                  <ul className="space-y-4 text-slate-600">
                    <li className="flex gap-3"><CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" /> 45 minutes environ</li>
                    <li className="flex gap-3"><CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" /> Compréhension et Expression</li>
                    <li className="flex gap-3"><CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" /> Résultat immédiat (A1, A2, B1)</li>
                  </ul>
                </div>
                <div className="space-y-4 bg-slate-50 p-6 rounded-xl border border-slate-100">
                  <Label htmlFor="name" className="font-bold text-blue-900">Votre Prénom et Nom</Label>
                  <Input 
                    id="name" 
                    value={studentName} 
                    onChange={(e) => setStudentName(e.target.value)} 
                    placeholder="Ex: Amine Benali"
                    className="h-12 bg-white"
                  />
                  <p className="text-xs text-slate-400 italic">Ces informations sont nécessaires pour générer votre bilan personnalisé.</p>
                </div>
              </div>
              <Button 
                disabled={!studentName.trim()}
                onClick={() => setCurrentStep(1)}
                className="w-full h-16 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xl rounded-xl shadow-lg transition-transform hover:scale-[1.01]"
              >
                Démarrer mon évaluation
                <ChevronRight className="ml-2 h-6 w-6" />
              </Button>
            </CardContent>
          </Card>
        )}

        {currentStep > 0 && currentStep < 5 && currentItem && (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-100">
              <Badge className="bg-blue-900 text-white px-4 py-1.5 text-sm">{currentSkill}</Badge>
              <div className="flex-1 max-w-xs mx-10">
                <Progress value={(currentStep - 1) * 25 + (currentItemIndex / currentItems.length) * 25} className="h-2.5" />
              </div>
              <span className="text-sm font-bold text-slate-400 whitespace-nowrap">Question {currentItemIndex + 1} / {currentItems.length}</span>
            </div>

            <Card className="border-none shadow-xl overflow-hidden">
              <CardContent className="p-8 md:p-12 space-y-8">
                {currentItem.support && (
                  <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100 font-serif italic text-xl leading-relaxed text-slate-800 shadow-inner">
                    {currentItem.support}
                  </div>
                )}

                <div className="space-y-8">
                  <h3 className="text-2xl font-bold text-blue-900 leading-tight">
                    {currentItem.question}
                  </h3>

                  {['CE', 'CO'].includes(currentSkill) ? (
                    <RadioGroup 
                      value={answers.find(a => a.item_id === currentItem.id)?.answer || ""} 
                      onValueChange={handleAnswerChange}
                      className="grid grid-cols-1 gap-4"
                    >
                      {currentItem.options?.map((opt: any) => (
                        <Label 
                          key={opt.id}
                          className={`flex items-center gap-5 p-6 rounded-2xl border-2 cursor-pointer transition-all ${
                            answers.find(a => a.item_id === currentItem.id)?.answer === opt.id 
                            ? "border-orange-500 bg-orange-50 ring-2 ring-orange-200" 
                            : "border-slate-100 hover:border-slate-200 bg-white"
                          }`}
                        >
                          <RadioGroupItem value={opt.id} className="sr-only" />
                          <div className={`h-7 w-7 rounded-full border-2 flex items-center justify-center shrink-0 ${
                            answers.find(a => a.item_id === currentItem.id)?.answer === opt.id
                            ? "border-orange-500 bg-orange-500"
                            : "border-slate-300"
                          }`}>
                            {answers.find(a => a.item_id === currentItem.id)?.answer === opt.id && <div className="h-2.5 w-2.5 bg-white rounded-full"></div>}
                          </div>
                          <span className="text-lg font-medium text-slate-700">{opt.text}</span>
                        </Label>
                      ))}
                    </RadioGroup>
                  ) : (
                    <Textarea 
                      value={answers.find(a => a.item_id === currentItem.id)?.answer || ""}
                      onChange={(e) => handleAnswerChange(e.target.value)}
                      placeholder="Tapez votre texte ici..."
                      className="min-h-[250px] text-lg p-8 border-slate-200 focus:border-orange-500 focus:ring-orange-500 rounded-2xl shadow-sm"
                    />
                  )}
                </div>

                <div className="flex justify-end pt-6">
                  <Button 
                    disabled={!answers.find(a => a.item_id === currentItem.id)?.answer}
                    onClick={nextItem}
                    className="h-14 px-12 bg-blue-900 hover:bg-blue-800 text-white font-bold text-lg rounded-xl shadow-lg"
                  >
                    Valider et continuer
                    <ChevronRight className="ml-2 h-5 w-5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {currentStep === 5 && (
          <Card className="border-none shadow-2xl text-center p-20 space-y-8">
            <div className="h-24 w-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-12 w-12" />
            </div>
            <div className="space-y-4">
              <h2 className="text-4xl font-bold text-blue-900">Bravo ! C'est terminé.</h2>
              <p className="text-slate-500 text-lg max-w-lg mx-auto">
                Vos réponses ont été enregistrées. Cliquez sur le bouton ci-dessous pour recevoir votre analyse de niveau et vos recommandations personnalisées.
              </p>
            </div>
            <Button 
              onClick={() => submitMutation.mutate({ 
                token: token === 'latest' ? null : token, 
                student_name: studentName, 
                answers,
                source: 'public_site'
              })}
              disabled={submitMutation.isPending}
              className="h-16 px-16 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xl rounded-2xl shadow-xl transition-all hover:scale-105"
            >
              {submitMutation.isPending ? (
                <>Analyse en cours... <Loader2 className="ml-2 h-6 w-6 animate-spin" /></>
              ) : (
                <>Découvrir mon résultat <Send className="ml-2 h-6 w-6" /></>
              )}
            </Button>
          </Card>
        )}

      </div>
    </div>
  );
}
