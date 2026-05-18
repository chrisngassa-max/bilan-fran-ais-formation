import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect, useRef } from 'react';
import { QUESTIONS_COMPLET, calculerScoreSection, calculerNiveauGlobal } from '@/data/questions-test-complet';
import { calculerFlags, type FlagsScoring } from '@/utils/flags-scoring';
import { Button } from '@/components/bff/Button';
import { ConsentementRGPD } from '@/components/ConsentementRGPD';
import { ResultatComplet } from '@/components/ResultatComplet';
import { ResultatIncoherent } from '@/components/ResultatIncoherent';
import { PageContactHumain } from '@/components/PageContactHumain';
import { trackFormulairesSoumis } from '@/utils/tracking';
import { NiveauIndicatif } from '@/types/bilan';
import { Loader2, ChevronRight, Sparkles, Target, BookOpen, PenTool, Mic, AlertTriangle } from 'lucide-react';
import { evaluerProductionFn } from '@/lib/evaluation-production.functions';
import { useServerFn } from '@tanstack/react-start';
import { track } from '@/utils/tracking-plausible';

export const Route = createFileRoute('/test-complet')({
  component: TestCompletPage,
});

const SECTIONS = [
  { id: "oral", label: "Compréhension Orale", icon: Mic },
  { id: "ecrit", label: "Compréhension Écrite", icon: BookOpen },
  { id: "grammaire", label: "Grammaire & Vocabulaire", icon: Target },
  { id: "production", label: "Production Écrite", icon: PenTool }
] as const;

function TestCompletPage() {
  const [phase, setPhase] = useState<1 | 2 | 3>(1);
  const [sectionIndex, setSectionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number | string>>({});
  
  // Phase 1 contact capture state
  const [prenom, setPrenom] = useState('');
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [partenaireConsent, setPartenaireConsent] = useState(false);
  const [wsConsent, setWsConsent] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [iaConsent, setIaConsent] = useState(false);
  const [iaLoading, setIaLoading] = useState(false);
  const evaluerProduction = useServerFn(evaluerProductionFn);
  const [startError, setStartError] = useState<string | null>(null);

  // Timer: 30 minutes = 1800 seconds countdown
  const startTime = useRef<number>(0);
  const [timeLeft, setTimeLeft] = useState(1800);
  const [finalDuration, setFinalDuration] = useState(0);

  // Results
  const [results, setResults] = useState<{
    scores: { oral: number, ecrit: number, grammaire: number, production: number },
    niveau: NiveauIndicatif,
    flags: FlagsScoring
  } | null>(null);

  const currentSection = SECTIONS[sectionIndex];
  const sectionQuestions = QUESTIONS_COMPLET.filter(q => q.section === currentSection.id);

  // Countdown timer logic
  useEffect(() => {
    if (phase !== 2) return;
    if (timeLeft <= 0) {
      handleNextSection(); // Auto-complete when 30 minutes run out
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft, phase]);

  useEffect(() => {
    if (phase === 3) {
      track("result_viewed");
    }
  }, [phase]);

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    setStartError(null);

    if (!prenom.trim()) {
      setStartError("Le prénom est obligatoire.");
      return;
    }

    if (!email.trim()) {
      setStartError("L'adresse e-mail est obligatoire.");
      return;
    }

    if (whatsapp.trim() && !whatsapp.trim().startsWith("+") && !whatsapp.trim().startsWith("00")) {
      setStartError("Veuillez saisir votre numéro au format international (ex: +33 6 12 34 56 78).");
      return;
    }

    setIsStarting(true);
    track("test_started");

    // Capture contact details early before starting the QCM to catch abandoned leads (growth hacking)
    const payload = {
      tunnel: "T3_test_complet",
      source: "test_complet_pre_capture",
      prenom: prenom.trim(),
      email: email.trim(),
      whatsapp: whatsapp.trim() || undefined,
      partenaire_consent: partenaireConsent,
      whatsapp_consent: whatsapp.trim() ? wsConsent : false,
      consent_at: new Date().toISOString(),
    };

    try {
      const response = await fetch("/api/capture-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Une erreur est survenue lors de l'enregistrement de vos coordonnées.");
      }

      startTime.current = Date.now();
      setPhase(2);
    } catch (err: any) {
      console.error("[TestComplet] pre-capture failed:", err);
      setStartError(err?.message || "Une erreur de connexion est survenue. Veuillez réessayer.");
    } finally {
      setIsStarting(false);
    }
  };

  const handleNextSection = async () => {
    if (sectionIndex < SECTIONS.length - 1) {
      setSectionIndex(prev => prev + 1);
      window.scrollTo(0, 0);
      return;
    }

    track("test_completed");
    const duration = Math.round((Date.now() - startTime.current) / 1000);
    setFinalDuration(duration);

    const scoresBase = {
      oral: calculerScoreSection(answers, QUESTIONS_COMPLET.filter(q => q.section === "oral")),
      ecrit: calculerScoreSection(answers, QUESTIONS_COMPLET.filter(q => q.section === "ecrit")),
      grammaire: calculerScoreSection(answers, QUESTIONS_COMPLET.filter(q => q.section === "grammaire")),
      production: 40,
    };

    // Niveau provisoire pour cibler l'IA
    const niveauProvisoire = calculerNiveauGlobal(scoresBase);

    let productionScore = scoresBase.production;
    if (iaConsent) {
      const prodQuestion = QUESTIONS_COMPLET.find(q => q.section === "production");
      const texte = prodQuestion ? String(answers[prodQuestion.id] ?? '') : '';
      if (prodQuestion && texte.trim().length > 0) {
        setIaLoading(true);
        try {
          const result = await evaluerProduction({
            data: {
              consigne: prodQuestion.consigne ?? prodQuestion.enonce,
              texte_candidat: texte,
              niveau_cible: niveauProvisoire,
              ia_consent: true,
            },
          });
          productionScore = result.score;
        } catch (err) {
          console.error('[test-complet] evaluerProductionFn failed', err);
        } finally {
          setIaLoading(false);
        }
      }
    }

    const scores = { ...scoresBase, production: productionScore };
    const niveau = calculerNiveauGlobal(scores);
    const flags = calculerFlags({
      score_oral: scores.oral,
      score_ecrit: scores.ecrit,
      duree_secondes: duration,
    });

    // Save final scores to the database!
    const finalPayload = {
      tunnel: "T3_test_complet",
      source: "test_complet_final",
      prenom: prenom.trim(),
      email: email.trim(),
      whatsapp: whatsapp.trim() || undefined,
      estimated_level: niveau,
      score_brut: scores.oral + scores.ecrit + scores.grammaire + scores.production,
      partenaire_consent: partenaireConsent,
      whatsapp_consent: whatsapp.trim() ? wsConsent : false,
      consent_at: new Date().toISOString(),
    };

    try {
      await fetch("/api/capture-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(finalPayload),
      });

      trackFormulairesSoumis({ 
        tunnel: "T3", 
        destination: partenaireConsent ? "les_deux" : "formation" 
      });
    } catch (err) {
      console.error("[TestComplet] final result capture failed:", err);
    }

    setResults({ scores, niveau, flags });
    setPhase(3);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (phase === 1) {
    return (
      <div className="min-h-screen bg-slate-50 py-16 px-4">
        <div className="max-w-xl mx-auto bg-white rounded-3xl border border-slate-100 shadow-2xl overflow-hidden animate-fade-in">
          <div className="bg-primary p-10 text-center text-on-primary">
            <Target className="h-12 w-12 mx-auto mb-4 text-white" />
            <h2 className="text-3xl font-black mb-3 text-white">Diagnostic Complet</h2>
            <p className="opacity-90 font-medium text-white/90 text-sm">Évaluation approfondie de 30 minutes sur les 4 compétences clés.</p>
          </div>
          
          <form onSubmit={handleStart} className="p-8 md:p-10 space-y-6">
            <div className="bg-slate-50 p-4 rounded-xl text-xs text-slate-500 font-semibold leading-relaxed border border-slate-100">
              Saisissez vos coordonnées pour enregistrer votre progression et recevoir votre diagnostic officiel par email.
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2" htmlFor="lead-prenom">
                  Votre prénom <span className="text-red-500">*</span>
                </label>
                <input 
                  id="lead-prenom"
                  type="text" 
                  required 
                  placeholder="Ex: Amine" 
                  value={prenom} 
                  onChange={e => setPrenom(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl bg-slate-50 border-2 border-slate-100 focus:border-primary focus:bg-white transition-all font-bold text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2" htmlFor="lead-email">
                  Votre adresse e-mail <span className="text-red-500">*</span>
                </label>
                <input 
                  id="lead-email"
                  type="email" 
                  required 
                  placeholder="amine.kadi@exemple.com" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl bg-slate-50 border-2 border-slate-100 focus:border-primary focus:bg-white transition-all font-bold text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2" htmlFor="lead-whatsapp">
                  Numéro WhatsApp <span className="text-slate-400 font-normal text-[10px]">(Optionnel)</span>
                </label>
                <input 
                  id="lead-whatsapp"
                  type="tel" 
                  placeholder="+33 6 12 34 56 78" 
                  value={whatsapp} 
                  onChange={e => setWhatsapp(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl bg-slate-50 border-2 border-slate-100 focus:border-primary focus:bg-white transition-all font-bold text-sm"
                />
              </div>
            </div>

            <ConsentementRGPD 
              show_whatsapp_consent={!!whatsapp}
              partenaire_consent={partenaireConsent}
              whatsapp_consent={wsConsent}
              onConsentChange={(p, w) => { setPartenaireConsent(p); setWsConsent(w); }}
            />

            {startError && (
              <div className="p-4 bg-red-50 border-2 border-red-100 text-red-600 text-xs font-bold rounded-xl flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 shrink-0" />
                <span>{startError}</span>
              </div>
            )}

            <Button 
              type="submit"
              id="btn-start-test-complet"
              disabled={isStarting || !prenom || !email}
              className="w-full h-14 bg-primary text-on-primary font-black text-base rounded-xl shadow-xl flex items-center justify-center gap-2 text-white disabled:opacity-50 transition-all active:scale-95"
            >
              {isStarting ? <Loader2 className="h-5 w-5 animate-spin text-white" /> : "Commencer le test →"}
            </Button>
          </form>
        </div>
      </div>
    );
  }

  if (phase === 2) {
    const Icon = currentSection.icon;
    return (
      <div className="min-h-screen bg-slate-50 py-12 px-4">
        <div className="max-w-3xl mx-auto">
          {/* Progress & Chronometer Header */}
          <div className="mb-10 flex items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="bg-primary text-on-primary p-2.5 rounded-xl text-white">
                <Icon className="h-6 w-6 text-white" />
              </div>
              <div>
                <span className="text-xs font-black uppercase tracking-widest text-slate-400">Section {sectionIndex + 1} / 4</span>
                <h3 className="text-lg font-black text-slate-800 leading-tight">{currentSection.label}</h3>
              </div>
            </div>

            {/* Premium chronometer */}
            <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl border-2 border-slate-100 shrink-0 select-none">
              <Clock className={`h-5 w-5 ${timeLeft <= 180 ? 'text-red-500 animate-pulse' : 'text-slate-400'}`} />
              <span className={`font-black text-sm ${timeLeft <= 180 ? 'text-red-500 font-extrabold' : 'text-slate-700'}`}>
                {formatTime(timeLeft)}
              </span>
            </div>
          </div>

          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden mb-8">
            <div 
              className="h-full bg-primary transition-all duration-700" 
              style={{ width: `${((sectionIndex + 1) / 4) * 100}%` }}
            ></div>
          </div>

          <div className="space-y-8 pb-20">
            {sectionQuestions.map((q, idx) => (
              <div key={q.id} className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 animate-in fade-in slide-in-from-bottom-4 duration-500 bg-white" style={{ animationDelay: `${idx * 100}ms` }}>
                <p className="text-base sm:text-lg font-bold text-slate-800 mb-6 leading-relaxed">
                  {q.id}. {q.enonce}
                  {q.consigne && <span className="block mt-2 text-primary font-black uppercase text-xs tracking-wider">👉 {q.consigne}</span>}
                </p>

                {q.section === "production" ? (
                  <textarea 
                    rows={6}
                    id={`textarea-q-${q.id}`}
                    value={(answers[q.id] as string) || ''}
                    onChange={e => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                    className="w-full p-6 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-primary focus:bg-white outline-none font-medium transition-all text-sm leading-relaxed"
                    placeholder="Tapez votre texte ici..."
                  />
                ) : (
                  <div className="grid grid-cols-1 gap-2">
                    {q.options?.map((opt, oIdx) => (
                      <button
                        key={oIdx}
                        id={`btn-q-${q.id}-opt-${oIdx}`}
                        onClick={() => setAnswers(prev => ({ ...prev, [q.id]: oIdx }))}
                        className={`flex items-center gap-4 p-5 rounded-2xl border-2 transition-all text-left bg-white ${
                          answers[q.id] === oIdx 
                          ? 'border-primary bg-primary/5 shadow-inner' 
                          : 'border-slate-100 hover:border-primary/40 hover:bg-slate-50/50'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold text-sm shrink-0 transition-colors ${
                          answers[q.id] === oIdx ? 'bg-primary border-primary text-white font-extrabold' : 'border-slate-200 text-slate-400'
                        }`}>
                          {String.fromCharCode(65 + oIdx)}
                        </div>
                        <span className="font-bold text-slate-700 text-sm sm:text-base">{opt}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {currentSection.id === "production" && (
              <label className="flex items-start gap-3 p-5 rounded-2xl border-2 border-amber-300 bg-amber-50 cursor-pointer animate-fade-in">
                <input
                  type="checkbox"
                  checked={iaConsent}
                  onChange={e => setIaConsent(e.target.checked)}
                  className="mt-1 h-5 w-5 accent-amber-600 cursor-pointer shrink-0"
                />
                <span className="text-xs text-amber-900 leading-relaxed font-semibold">
                  <AlertTriangle className="inline h-4 w-4 mr-1 -mt-0.5" />
                  <strong>Évaluation IA optionnelle.</strong> J'accepte que mon texte soit analysé par une IA pour estimer mon niveau (résultat indicatif, non officiel). Mon texte n'est pas conservé à des fins d'entraînement.
                </span>
              </label>
            )}

            <div className="flex justify-center pt-8">
              <Button
                id="btn-next-section"
                onClick={handleNextSection}
                disabled={iaLoading}
                className="w-full h-14 bg-primary text-on-primary font-black text-base rounded-xl flex items-center justify-center gap-2 shadow-xl disabled:opacity-60 text-white"
              >
                {iaLoading ? <Loader2 className="h-5 w-5 animate-spin text-white" /> : (sectionIndex === 3 ? "Terminer l'évaluation" : "Section suivante")}
                {!iaLoading && <ChevronRight className="h-5 w-5 text-white" />}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 3 && results) {
    if (results.flags.ALERTE_VITESSE) return <PageContactHumain />;
    if (results.flags.PROFIL_INCOHERENT) return <ResultatIncoherent prenom={prenom} partenaire_consent={partenaireConsent} />;
    
    return (
      <ResultatComplet 
        prenom={prenom} 
        niveau_estime={results.niveau} 
        scores={results.scores} 
        partenaire_consent={partenaireConsent} 
      />
    );
  }

  return null;
}
