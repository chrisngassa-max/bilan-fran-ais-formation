import { createFileRoute, useNavigate, useParams } from '@tanstack/react-router';
import { useState, useEffect, useRef } from 'react';
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
import { 
  ChevronRight, 
  Send, 
  AlertTriangle, 
  CheckCircle2, 
  Loader2, 
  Volume2, 
  Mic, 
  Square,
  Play
} from 'lucide-react';

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
  
  // Audio state
  const [audioPlayed, setAudioPlayed] = useState<Record<string, boolean>>({});
  const [isRecording, setIsRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  
  // Timer and Persistence state
  const [activeStartTime, setActiveStartTime] = useState<number>(Date.now());
  const accumulatedTimeRef = useRef<number>(0);
  const SESSION_KEY = `test_session_${token}`;

  // Load persistence on mount
  useEffect(() => {
    const saved = sessionStorage.getItem(SESSION_KEY);
    if (saved) {
      try {
        const { step, index, savedAnswers, name } = JSON.parse(saved);
        setCurrentStep(step);
        setCurrentItemIndex(index);
        setAnswers(savedAnswers);
        setStudentName(name);
        toast.info("Session restaurée. Vous pouvez reprendre votre test.");
      } catch (e) {
        console.error("Failed to restore session", e);
      }
    }
  }, [SESSION_KEY]);

  // Save persistence on change
  useEffect(() => {
    if (currentStep > 0) {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify({
        step: currentStep,
        index: currentItemIndex,
        savedAnswers: answers,
        name: studentName
      }));
    }
  }, [currentStep, currentItemIndex, answers, studentName, SESSION_KEY]);

  // Active Timer Logic (only count time when tab is visible)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab hidden: save accumulated time so far
        accumulatedTimeRef.current += (Date.now() - activeStartTime);
      } else {
        // Tab focused: restart the reference clock
        setActiveStartTime(Date.now());
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [activeStartTime]);

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
      sessionStorage.removeItem(SESSION_KEY); // Clear session on success
      toast.success('Test terminé !');
      navigate({ to: '/bilan-test/$attemptId', params: { attemptId: data.attempt_id } });
    },
    onError: (err: any) => {
      toast.error(`Erreur de transmission : ${err.message}. Vos réponses sont sauvegardées localement.`);
    },
  });

  const handleAnswerChange = (answer: string) => {
    setAnswers(prev => {
      const filtered = prev.filter(a => a.item_id !== currentItem.id);
      return [...filtered, { item_id: currentItem.id, answer, time_spent: 0 }];
    });
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        await handleTranscription(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      toast.error("Impossible d'accéder au micro.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const handleTranscription = async (blob: Blob) => {
    setTranscribing(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        const base64Audio = (reader.result as string).split(',')[1];
        const { data, error } = await supabase.functions.invoke('transcribe-audio', {
          body: { audioBase64: base64Audio }
        });
        if (error) throw error;
        handleAnswerChange(data.transcript || "[Pas de transcription]");
        setTranscribing(false);
      };
    } catch (err) {
      toast.error("Erreur de transcription");
      setTranscribing(false);
    }
  };

  const playAudio = (url: string) => {
    if (audioPlayed[url]) return;
    const audio = new Audio(url);
    audio.play();
    setAudioPlayed(prev => ({ ...prev, [url]: true }));
  };

  const nextItem = () => {
    // Total active time = accumulated from previous focus sessions + current focus session
    const currentActiveSession = Date.now() - activeStartTime;
    const totalTimeSpent = Math.round((accumulatedTimeRef.current + currentActiveSession) / 1000);
    
    // Mettre à jour la réponse avec le temps passé (temps actif uniquement)
    setAnswers(prev => {
      const existing = prev.find(a => a.item_id === currentItem.id);
      if (existing) {
        existing.time_spent = totalTimeSpent;
        return [...prev];
      }
      return [...prev, { item_id: currentItem.id, answer: "", time_spent: totalTimeSpent }];
    });

    if (currentItemIndex < currentItems.length - 1) {
      setCurrentItemIndex(prev => prev + 1);
    } else {
      setCurrentStep(prev => prev + 1);
      setCurrentItemIndex(0);
    }
    
    // Reset timer for next question
    accumulatedTimeRef.current = 0;
    setActiveStartTime(Date.now());
  };

  if (isLoading) return <div className="p-20 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" /> Chargement du test expert...</div>;
  if (error) return <div className="p-20 text-center text-destructive">Erreur: {(error as any).message}</div>;

  return (
    <div className="min-h-screen bg-[#fcfaf7] py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {currentStep === 0 && (
          <Card className="border-none shadow-xl">
            <CardHeader className="text-center p-10 bg-blue-900 text-white rounded-t-xl">
              <CardTitle className="text-3xl font-bold">{testPayload.test.title}</CardTitle>
              <p className="mt-2 text-white/70 text-lg">Évaluation Linguistique Initiale — Inspiré du référentiel CECRL</p>
            </CardHeader>
            <CardContent className="p-10 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-6">
                  <h3 className="font-bold text-blue-900 text-xl">Règles du test</h3>
                  <ul className="space-y-4 text-slate-600">
                    <li className="flex gap-3"><Volume2 className="h-5 w-5 text-blue-500 shrink-0" /> Écoute unique pour la partie orale</li>
                    <li className="flex gap-3"><Mic className="h-5 w-5 text-red-500 shrink-0" /> Enregistrement vocal requis (EO)</li>
                    <li className="flex gap-3"><CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" /> Scoring expert pondéré</li>
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
                </div>
              </div>
              <Button 
                disabled={!studentName.trim()}
                onClick={() => setCurrentStep(1)}
                className="w-full h-16 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xl rounded-xl shadow-lg"
              >
                Lancer l'évaluation experte
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
              <span className="text-sm font-bold text-slate-400 whitespace-nowrap">Q{currentItemIndex + 1} / {currentItems.length}</span>
            </div>

            <Card className="border-none shadow-xl overflow-hidden">
              <CardContent className="p-8 md:p-12 space-y-8">
                
                {/* Audio Section (CO) */}
                {currentSkill === 'CO' && currentItem.audio_url && (
                  <div className="flex flex-col items-center gap-4 p-8 bg-blue-50 rounded-2xl border-2 border-dashed border-blue-200">
                    <p className="text-sm font-bold text-blue-800">Attention : Une seule écoute possible</p>
                    <Button 
                      onClick={() => playAudio(currentItem.audio_url)} 
                      disabled={audioPlayed[currentItem.audio_url]}
                      className={`h-16 w-16 rounded-full shadow-lg ${audioPlayed[currentItem.audio_url] ? 'bg-slate-300' : 'bg-blue-600 hover:bg-blue-700'}`}
                    >
                      <Play className="h-8 w-8 text-white" />
                    </Button>
                  </div>
                )}

                {currentItem.support && currentSkill !== 'CO' && (
                  <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100 font-serif italic text-xl leading-relaxed text-slate-800">
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
                      className="grid grid-cols-1 md:grid-cols-2 gap-4"
                    >
                      {currentItem.options?.map((opt: any) => (
                        <Label 
                          key={opt.id}
                          className={`flex items-center gap-5 p-6 rounded-2xl border-2 cursor-pointer transition-all ${
                            answers.find(a => a.item_id === currentItem.id)?.answer === opt.id 
                            ? "border-orange-500 bg-orange-50" 
                            : "border-slate-100 hover:border-slate-200 bg-white"
                          }`}
                        >
                          <RadioGroupItem value={opt.id} className="sr-only" />
                          <span className="h-8 w-8 rounded-full border-2 border-slate-300 flex items-center justify-center font-bold text-sm text-slate-400 group-hover:border-orange-500">
                            {opt.id}
                          </span>
                          <span className="text-lg font-medium text-slate-700">{opt.text}</span>
                        </Label>
                      ))}
                    </RadioGroup>
                  ) : currentSkill === 'EE' ? (
                    <Textarea 
                      value={answers.find(a => a.item_id === currentItem.id)?.answer || ""}
                      onChange={(e) => handleAnswerChange(e.target.value)}
                      placeholder="Tapez votre texte ici..."
                      className="min-h-[250px] text-lg p-8 border-slate-200 rounded-2xl shadow-sm"
                    />
                  ) : (
                    /* Expression Orale (Recorder) */
                    <div className="flex flex-col items-center gap-6 p-10 bg-red-50 rounded-3xl border-2 border-dashed border-red-200">
                      <p className="text-center font-medium text-red-800">Enregistrez votre réponse à l'oral</p>
                      {!isRecording ? (
                        <Button 
                          onClick={startRecording} 
                          disabled={transcribing}
                          className="h-20 w-20 rounded-full bg-red-500 hover:bg-red-600 shadow-xl animate-pulse"
                        >
                          <Mic className="h-10 w-10 text-white" />
                        </Button>
                      ) : (
                        <Button 
                          onClick={stopRecording} 
                          className="h-20 w-20 rounded-full bg-slate-800 hover:bg-slate-900 shadow-xl"
                        >
                          <Square className="h-10 w-10 text-white" />
                        </Button>
                      )}
                      
                      {transcribing && (
                        <div className="flex items-center gap-2 text-slate-500 italic">
                          <Loader2 className="h-4 w-4 animate-spin" /> Transcription de votre voix...
                        </div>
                      )}
                      
                      {answers.find(a => a.item_id === currentItem.id)?.answer && (
                        <div className="mt-4 p-4 bg-white rounded-xl border border-red-100 w-full text-sm text-slate-600 italic">
                          Transcription reçue : "{answers.find(a => a.item_id === currentItem.id)?.answer}"
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex justify-end pt-6">
                  <Button 
                    disabled={!answers.find(a => a.item_id === currentItem.id)?.answer || transcribing}
                    onClick={nextItem}
                    className="h-14 px-12 bg-blue-900 hover:bg-blue-800 text-white font-bold text-lg rounded-xl"
                  >
                    Suivant
                    <ChevronRight className="ml-2 h-5 w-5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {currentStep === 5 && (
          <Card className="border-none shadow-2xl text-center p-20 space-y-8">
            <CheckCircle2 className="h-20 w-20 text-green-500 mx-auto" />
            <h2 className="text-4xl font-bold text-blue-900">Évaluation terminée !</h2>
            <p className="text-slate-500 max-w-md mx-auto">Vos réponses sont prêtes à être analysées par notre moteur de scoring expert.</p>
            
            <div className="flex flex-col gap-4 items-center">
              <Button 
                onClick={() => submitMutation.mutate({ 
                  token: token === 'latest' ? null : token, 
                  student_name: studentName, 
                  answers,
                  source: 'public_site_v2'
                })}
                disabled={submitMutation.isPending}
                className="h-16 px-16 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xl rounded-2xl w-full md:w-auto"
              >
                {submitMutation.isPending ? <Loader2 className="animate-spin h-6 w-6" /> : "Générer mon bilan détaillé"}
              </Button>

              {submitMutation.isError && (
                <Button 
                  variant="outline" 
                  onClick={() => submitMutation.reset()}
                  className="text-slate-500"
                >
                  Réessayer la soumission
                </Button>
              )}
            </div>
          </Card>
        )}

      </div>
    </div>
  );
}
