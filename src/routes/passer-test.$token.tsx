import { createFileRoute, useNavigate, useParams, Link } from '@tanstack/react-router';
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/bff/Button';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { waHref, contactInfo } from '@/config/site';
import { trackEvent } from '@/lib/analytics';
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

import { z } from 'zod';

const searchSchema = z.object({
  prenom: z.string().optional(),
  whatsapp: z.string().optional(),
  type_demarche: z.string().optional(),
  date_rdv: z.string().optional(),
});

export const Route = createFileRoute('/passer-test/$token')({
  head: () => ({
    meta: [
      { title: "Diagnostic complet de français (30 min) — Bilan Français Formation" },
      {
        name: "description",
        content:
          "Diagnostic complet de votre niveau de français : compréhension et expression, écrites et orales. Bilan détaillé en 30 minutes.",
      },
      { property: "og:title", content: "Diagnostic complet de français (30 min) — Bilan Français Formation" },
    ],
  }),
  component: PasserTestPage,
  validateSearch: (search) => searchSchema.parse(search),
});

const PLACEMENT_TEST_TIMEOUT_MS = 10000;

function PasserTestPage() {
  const { token } = Route.useParams();
  const search = Route.useSearch();
  const navigate = useNavigate();
  const SESSION_KEY = `test_session_${token}`;

  // Helper to load session synchronously
  const getInitialSession = () => {
    if (typeof window === 'undefined') return null;
    const saved = sessionStorage.getItem(SESSION_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse saved session", e);
      }
    }
    return null;
  };

  const initialSession = getInitialSession();

  const [currentStep, setCurrentStep] = useState(initialSession?.step ?? 0);
  const [currentItemIndex, setCurrentItemIndex] = useState(initialSession?.index ?? 0);
  const [answers, setAnswers] = useState<any[]>(initialSession?.savedAnswers ?? []);
  
  // Persisted search params state
  const [studentName, setStudentName] = useState(initialSession?.name ?? search.prenom ?? '');
  const [whatsapp, setWhatsapp] = useState(initialSession?.whatsapp ?? search.whatsapp ?? '');
  const [typeDemarche, setTypeDemarche] = useState(initialSession?.typeDemarche ?? search.type_demarche ?? '');
  const [dateRdv, setDateRdv] = useState(initialSession?.dateRdv ?? search.date_rdv ?? '');

  // Audio state
  const [audioPlayed, setAudioPlayed] = useState<Record<string, boolean>>({});
  const [isRecording, setIsRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  
  // Timer state
  const [activeStartTime, setActiveStartTime] = useState<number>(Date.now());
  const accumulatedTimeRef = useRef<number>(0);

  // Synchronize with sessionStorage whenever state changes
  useEffect(() => {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({
      step: currentStep,
      index: currentItemIndex,
      savedAnswers: answers,
      name: studentName,
      whatsapp,
      typeDemarche,
      dateRdv
    }));
  }, [currentStep, currentItemIndex, answers, studentName, whatsapp, typeDemarche, dateRdv, SESSION_KEY]);

  // Synchronize candidate details globally for LeadCaptureForm & Bilan page
  useEffect(() => {
    sessionStorage.setItem('bff_candidate_info', JSON.stringify({
      prenom: studentName,
      whatsapp,
      type_demarche: typeDemarche,
      date_rdv: dateRdv
    }));
  }, [studentName, whatsapp, typeDemarche, dateRdv]);

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

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (currentStep > 0 && currentStep < 5) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [activeStartTime, currentStep]);

  const { data: testPayload, isLoading, error, refetch } = useQuery({
    queryKey: ['public-placement-test', token],
    queryFn: async () => {
      try {
        const response = await Promise.race([
          supabase.functions.invoke('get-placement-test', {
            method: 'GET',
            headers: token === 'latest'
              ? { 'Content-Type': 'application/json' }
              : { 'Content-Type': 'application/json', 'x-placement-token': token },
          }),
          new Promise<never>((_, reject) => {
            window.setTimeout(
              () => reject(new Error('Le serveur de test ne répond pas dans le délai imparti.')),
              PLACEMENT_TEST_TIMEOUT_MS,
            );
          }),
        ]);

        const { data, error } = response as any;

        if (error || !data || !Array.isArray(data.items)) {
          throw new Error(error?.message || "Impossible de charger le contenu du test.");
        }
        return data;
      } catch (e: any) {
        trackEvent("diag_load_error", { reason: e?.message || "unknown" });
        throw e;
      }
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
    retry: 3, // FIX CRITIQUE: Retry x3
    onSuccess: (data) => {
      sessionStorage.removeItem(SESSION_KEY); // Clear session on success
      sessionStorage.setItem('last_attempt_id', data.attempt_id); // Save for back nav
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#fcfaf7] flex items-center justify-center p-6">
        <div className="text-center space-y-4 max-w-sm">
          <Loader2 className="h-12 w-12 animate-spin text-blue-900 mx-auto" />
          <h3 className="text-xl font-bold text-slate-800">Chargement du test d'évaluation</h3>
          <p className="text-slate-500 text-sm">Veuillez patienter, nous récupérons les supports pédagogiques interactifs...</p>
        </div>
      </div>
    );
  }

  if (error) {
    const errorMsg = error.message || "";
    const isTimeout = errorMsg.includes("délai") || errorMsg.includes("timeout") || errorMsg.includes("répond pas");
    const isNotFound = errorMsg.includes("introuvable") || errorMsg.includes("trouver") || errorMsg.includes("not found") || errorMsg.includes("404");

    let errorTitle = "Service de positionnement momentanément indisponible";
    let errorDesc = "Notre moteur d'évaluation pédagogique rencontre des difficultés de connexion. Nos équipes sont mobilisées pour le rétablir rapidement.";

    if (isNotFound) {
      errorTitle = "Évaluation introuvable ou expirée";
      errorDesc = "Le test demandé n'a pas pu être trouvé. Il est possible que le lien d'accès soit incorrect ou que la session d'évaluation ait expiré.";
    } else if (isTimeout) {
      errorTitle = "Délai de connexion dépassé";
      errorDesc = "Le chargement du test a pris trop de temps en raison d'une lenteur réseau. Veuillez vérifier votre connexion internet et réessayer.";
    }

    return (
      <div className="min-h-screen bg-[#fcfaf7] py-20 px-4 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-100 p-10 text-center space-y-6">
          <div className="h-20 w-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto text-amber-500">
            <AlertTriangle className="h-10 w-10 animate-bounce" />
          </div>
          <h2 className="text-2xl font-black text-slate-800 leading-tight">{errorTitle}</h2>
          <p className="text-slate-500 text-sm leading-relaxed">{errorDesc}</p>
          <div className="pt-4 flex flex-col gap-3">
            <Button
              onClick={() => refetch()}
              className="w-full h-14 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center"
            >
              Réessayer la connexion
            </Button>
            <Link
              to="/test-rapide"
              className="w-full h-14 border-2 border-blue-900 text-blue-900 font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 hover:bg-blue-50"
            >
              Faire le test rapide (3 min)
            </Link>
            <a
              href={waHref("Bonjour, je rencontre un problème de chargement avec le test de positionnement et je souhaite de l'aide.")}
              target="_blank"
              rel="noreferrer"
              className="w-full h-14 bg-[#25D366] hover:bg-[#20ba56] text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
            >
              Contact direct WhatsApp
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fcfaf7] py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {currentStep === 0 && (
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="text-center p-10 bg-blue-900 text-white">
              <h2 className="text-3xl font-bold">{testPayload.test.title}</h2>
              <p className="mt-2 text-white/70 text-lg">Votre bilan de niveau — Inspiré du référentiel CECRL</p>
            </div>
            <div className="p-10 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-6">
                  <h3 className="font-bold text-blue-900 text-xl">Règles du test</h3>
                  <ul className="space-y-4 text-slate-600">
                    <li className="flex gap-3"><Volume2 className="h-5 w-5 text-blue-500 shrink-0" /> Vous écouterez chaque audio une seule fois</li>
                    <li className="flex gap-3"><Mic className="h-5 w-5 text-red-500 shrink-0" /> Vous enregistrerez votre voix pour l'oral</li>
                    <li className="flex gap-3"><CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" /> Votre niveau est calculé selon une méthode rigoureuse</li>
                  </ul>
                </div>
                <div className="space-y-4 bg-slate-50 p-6 rounded-xl border border-slate-100">
                  <label htmlFor="name" className="font-bold text-blue-900 block">Votre Prénom et Nom</label>
                  <input 
                    id="name" 
                    type="text"
                    value={studentName} 
                    onChange={(e) => setStudentName(e.target.value)} 
                    placeholder="Ex: Amine Benali"
                    className="h-12 bg-white w-full border border-slate-200 rounded-lg px-4"
                  />
                </div>
              </div>
              <Button 
                disabled={!studentName.trim()}
                onClick={() => { trackEvent('test_started'); setCurrentStep(1); }}
                className="w-full h-16 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xl rounded-xl shadow-lg flex items-center justify-center"
              >
                Démarrer mon évaluation
                <ChevronRight className="ml-2 h-6 w-6" />
              </Button>
              
              {/* Point 2 de l'audit : Retour au bilan si existant */}
              {sessionStorage.getItem('last_attempt_id') && (
                <Link to="/bilan-test/$attemptId" params={{ attemptId: sessionStorage.getItem('last_attempt_id')! }} className="block">
                  <button className="w-full py-4 text-primary font-bold hover:underline flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-5 h-5" />
                    Consulter mon dernier bilan enregistré
                  </button>
                </Link>
              )}
            </div>
          </div>
        )}

        {currentStep > 0 && currentStep < 5 && currentItem && (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-100">
              <span className="bg-blue-900 text-white px-4 py-1.5 text-sm rounded-full font-medium">{currentSkill}</span>
              <div className="flex-1 max-w-xs mx-10 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-900 transition-all duration-300" 
                  style={{ width: `${((currentStep - 1) * 25 + (currentItemIndex / currentItems.length) * 25)}%` }} 
                />
              </div>
              <span className="text-sm font-bold text-slate-400 whitespace-nowrap">Q{currentItemIndex + 1} / {currentItems.length}</span>
            </div>

            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="p-8 md:p-12 space-y-8">
                
                {/* Audio Section (CO) */}
                {currentSkill === 'CO' && currentItem.audio_url && (
                  <div className="flex flex-col items-center gap-4 p-8 bg-blue-50 rounded-2xl border-2 border-dashed border-blue-200">
                    <p className="text-sm font-bold text-blue-800">Attention : Une seule écoute possible</p>
                    <button 
                      onClick={() => playAudio(currentItem.audio_url)} 
                      disabled={audioPlayed[currentItem.audio_url]}
                      className={`h-16 w-16 rounded-full shadow-lg flex items-center justify-center ${audioPlayed[currentItem.audio_url] ? 'bg-slate-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                    >
                      <Play className="h-8 w-8 text-white" />
                    </button>
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4" role="radiogroup">
                      {currentItem.options?.map((opt: any) => {
                        const isSelected = answers.find(a => a.item_id === currentItem.id)?.answer === opt.id;
                        return (
                          <label 
                            key={opt.id}
                            className={`flex items-center gap-5 p-6 rounded-2xl border-2 cursor-pointer transition-all ${
                              isSelected 
                              ? "border-orange-500 bg-orange-50" 
                              : "border-slate-100 hover:border-slate-200 bg-white"
                            }`}
                          >
                            <input 
                              type="radio" 
                              className="sr-only" 
                              name={`question-${currentItem.id}`}
                              value={opt.id}
                              checked={isSelected}
                              onChange={() => handleAnswerChange(opt.id)}
                            />
                            <span className={`h-8 w-8 rounded-full border-2 flex items-center justify-center font-bold text-sm ${isSelected ? 'border-orange-500 text-orange-600 bg-orange-100' : 'border-slate-300 text-slate-400 group-hover:border-orange-500'}`}>
                              {opt.id}
                            </span>
                            <span className="text-lg font-medium text-slate-700">{opt.text}</span>
                          </label>
                        );
                      })}
                    </div>
                  ) : currentSkill === 'EE' ? (
                    <textarea 
                      value={answers.find(a => a.item_id === currentItem.id)?.answer || ""}
                      onChange={(e) => handleAnswerChange(e.target.value)}
                      placeholder="Tapez votre texte ici..."
                      className="w-full min-h-[250px] text-lg p-8 border border-slate-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  ) : (
                    /* Expression Orale (Recorder) */
                    <div className="flex flex-col items-center gap-6 p-10 bg-red-50 rounded-3xl border-2 border-dashed border-red-200">
                      <p className="text-center font-medium text-red-800">Pratiquez l’oral en direct : nous analysons votre aisance pour mieux vous orienter.</p>
                      {!isRecording ? (
                        <button 
                          onClick={startRecording} 
                          disabled={transcribing}
                          className="h-20 w-20 flex items-center justify-center rounded-full bg-red-500 hover:bg-red-600 shadow-xl animate-pulse disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Mic className="h-10 w-10 text-white" />
                        </button>
                      ) : (
                        <button 
                          onClick={stopRecording} 
                          className="h-20 w-20 flex items-center justify-center rounded-full bg-slate-800 hover:bg-slate-900 shadow-xl"
                        >
                          <Square className="h-10 w-10 text-white" />
                        </button>
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
                    className="h-14 px-12 bg-blue-900 hover:bg-blue-800 text-white font-bold text-lg rounded-xl flex items-center"
                  >
                    Suivant
                    <ChevronRight className="ml-2 h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentStep === 5 && (
          <div className="bg-white rounded-2xl shadow-2xl text-center p-20 space-y-8">
            <CheckCircle2 className="h-20 w-20 text-green-500 mx-auto" />
            <h2 className="text-4xl font-bold text-blue-900">C'est terminé, bravo !</h2>
            <p className="text-slate-500 max-w-md mx-auto">Vos réponses sont prêtes à être analysées par notre moteur de scoring expert.</p>
            
            <div className="flex flex-col gap-4 items-center">
              <Button 
                onClick={() => submitMutation.mutate({ 
                  token: token === 'latest' ? null : token, 
                  student_name: studentName, 
                  answers,
                  source: 'public_site_v2.0.5'
                })}
                disabled={submitMutation.isPending}
                className="h-16 px-16 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xl rounded-2xl w-full md:w-auto flex items-center justify-center"
              >
                {submitMutation.isPending ? <Loader2 className="animate-spin h-6 w-6" /> : "Voir mon bilan détaillé"}
              </Button>

              {submitMutation.isError && (
                <button 
                  onClick={() => submitMutation.reset()}
                  className="text-slate-500 underline hover:text-slate-700"
                >
                  Réessayer la soumission
                </button>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
