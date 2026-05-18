import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { QUESTIONS, calculerNiveau } from '@/data/questions-test-rapide';
import { Button } from '@/components/bff/Button';
import { ChevronRight, Loader2, Sparkles, Clock, AlertCircle } from 'lucide-react';
import { ConsentementRGPD } from '@/components/ConsentementRGPD';
import { FormuleExpressComponent } from '@/components/FormuleExpress';
import { ResultatNiveau } from '@/components/ResultatNiveau';
import { trackFormulairesSoumis } from '@/utils/tracking';
import { track } from '@/utils/tracking-plausible';

export const Route = createFileRoute('/test-rapide')({
  component: TestRapidePage,
});

function TestRapidePage() {
  const [phase, setPhase] = useState<1 | 2 | 3>(1);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  
  // Timer state (120 seconds = 2 minutes)
  const [timeLeft, setTimeLeft] = useState(120);
  
  // Phase 2 state
  const [prenom, setPrenom] = useState('');
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [rdvPrevu, setRdvPrevu] = useState<boolean | null>(null);
  const [partenaireConsent, setPartenaireConsent] = useState(false);
  const [whatsappConsent, setWhatsappConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    track("test_started");
  }, []);

  // Timer logic for Phase 1
  useEffect(() => {
    if (phase !== 1) return;
    if (timeLeft <= 0) {
      // Auto-submit test when timer runs out
      track("test_completed_timeout");
      setPhase(2);
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

  const currentQuestion = QUESTIONS[currentStep];
  const score = Object.entries(answers).reduce((acc, [id, ans]) => {
    const q = QUESTIONS.find(q => q.id === parseInt(id));
    return acc + (q?.bonne_reponse === ans ? 1 : 0);
  }, 0);

  const handleAnswer = (optionIndex: number) => {
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: optionIndex }));
    if (currentStep < QUESTIONS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      track("test_completed");
      setPhase(2);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!prenom.trim()) {
      setSubmitError("Le prénom est obligatoire.");
      return;
    }

    if (!email.trim()) {
      setSubmitError("L'adresse e-mail est obligatoire.");
      return;
    }

    if (whatsapp.trim() && !whatsapp.trim().startsWith("+") && !whatsapp.trim().startsWith("00")) {
      setSubmitError("Veuillez saisir votre numéro WhatsApp au format international (ex: +33 6 12 34 56 78).");
      return;
    }

    setIsSubmitting(true);
    
    const payload = {
      tunnel: "T2_test_rapide",
      source: "test_rapide_direct",
      prenom: prenom.trim(),
      email: email.trim(),
      whatsapp: whatsapp.trim() || undefined,
      rdv_prevu: rdvPrevu,
      score_brut: score,
      partenaire_consent: partenaireConsent,
      whatsapp_consent: whatsapp.trim() ? whatsappConsent : false,
      consent_at: new Date().toISOString(),
    };

    try {
      const response = await fetch("/api/capture-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Une erreur est survenue lors de l'envoi.");
      }
      
      trackFormulairesSoumis({ 
        tunnel: "T2", 
        destination: partenaireConsent ? "les_deux" : "formation" 
      });
      
      setPhase(3);
    } catch (err: any) {
      console.error("[TestRapide] lead capture failed:", err);
      setSubmitError(err?.message || "Une erreur de connexion est survenue. Veuillez réessayer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (phase === 1) {
    return (
      <div className="min-h-[calc(100vh-160px)] bg-slate-50 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8 flex items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex justify-between items-center mb-3 text-xs font-black uppercase tracking-widest text-primary">
                <span>Question {currentStep + 1} sur {QUESTIONS.length}</span>
                <span>{Math.round(((currentStep) / QUESTIONS.length) * 100)}%</span>
              </div>
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-500 animate-pulse" 
                  style={{ width: `${((currentStep) / QUESTIONS.length) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Premium Glassmorphic Timer */}
            <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-2xl border-2 border-slate-200 shadow-sm shrink-0">
              <Clock className={`h-5 w-5 ${timeLeft <= 30 ? 'text-red-500 animate-bounce' : 'text-slate-400'}`} />
              <span className={`font-black text-sm ${timeLeft <= 30 ? 'text-red-500 font-extrabold' : 'text-slate-700'}`}>
                {formatTime(timeLeft)}
              </span>
            </div>
          </div>

          <div className="bg-white rounded-3xl border-2 border-slate-100 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
            <div className="p-8 md:p-12 space-y-8">
              <h2 className="text-2xl md:text-3xl font-black text-slate-800 leading-tight text-center">
                {currentQuestion.enonce}
              </h2>

              <div className="grid grid-cols-1 gap-3">
                {currentQuestion.options.map((opt, idx) => (
                  <button
                    key={idx}
                    id={`btn-qcm-opt-${idx}`}
                    onClick={() => handleAnswer(idx)}
                    className="group flex items-center gap-4 p-5 rounded-2xl border-2 border-slate-100 hover:border-primary hover:bg-primary/5 transition-all text-left bg-white"
                  >
                    <div className="w-8 h-8 rounded-full border-2 border-slate-200 group-hover:border-primary flex items-center justify-center font-bold text-sm text-slate-400 group-hover:text-primary shrink-0 transition-colors">
                      {String.fromCharCode(65 + idx)}
                    </div>
                    <span className="text-base sm:text-lg font-bold text-slate-700">{opt}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 2) {
    return (
      <div className="min-h-[calc(100vh-160px)] bg-slate-50 py-12 px-4">
        <div className="max-w-xl mx-auto">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl overflow-hidden animate-fade-in">
            <div className="bg-primary p-8 text-center text-on-primary">
              <Sparkles className="h-10 w-10 mx-auto mb-4 text-white" />
              <h2 className="text-3xl font-black mb-2 text-white">Votre niveau est estimé !</h2>
              <p className="opacity-90 font-medium text-white/90 text-sm">
                Saisissez vos coordonnées pour afficher instantanément votre bilan et adapter votre formation.
              </p>
            </div>
            
            <form onSubmit={handleFormSubmit} className="p-8 md:p-10 space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2" htmlFor="lead-prenom">
                    Votre prénom <span className="text-red-500">*</span>
                  </label>
                  <input 
                    id="lead-prenom"
                    type="text" 
                    required 
                    value={prenom} 
                    onChange={e => setPrenom(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl bg-slate-50 border-2 border-slate-100 focus:border-primary focus:bg-white transition-all font-bold text-sm"
                    placeholder="Ex: Amine"
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
                    value={email} 
                    onChange={e => setEmail(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl bg-slate-50 border-2 border-slate-100 focus:border-primary focus:bg-white transition-all font-bold text-sm"
                    placeholder="amine.kadi@exemple.com"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2" htmlFor="lead-whatsapp">
                    Numéro WhatsApp <span className="text-slate-400 font-normal text-[10px]">(Optionnel)</span>
                  </label>
                  <input 
                    id="lead-whatsapp"
                    type="tel" 
                    value={whatsapp} 
                    onChange={e => setWhatsapp(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl bg-slate-50 border-2 border-slate-100 focus:border-primary focus:bg-white transition-all font-bold text-sm"
                    placeholder="+33 6 12 34 56 78"
                  />
                </div>

                <div className="space-y-3 pt-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Avez-vous un rendez-vous prévu en préfecture ? <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-4">
                    <button 
                      type="button" 
                      id="btn-rdv-oui"
                      onClick={() => setRdvPrevu(true)}
                      className={`flex-1 h-12 rounded-xl border-2 font-bold transition-all text-xs ${
                        rdvPrevu === true 
                          ? 'border-primary bg-primary/5 text-primary' 
                          : 'border-slate-100 hover:border-slate-200 text-slate-600 bg-slate-50/50'
                      }`}
                    >
                      Oui, j'ai une date
                    </button>
                    <button 
                      type="button" 
                      id="btn-rdv-non"
                      onClick={() => setRdvPrevu(false)}
                      className={`flex-1 h-12 rounded-xl border-2 font-bold transition-all text-xs ${
                        rdvPrevu === false 
                          ? 'border-primary bg-primary/5 text-primary' 
                          : 'border-slate-100 hover:border-slate-200 text-slate-600 bg-slate-50/50'
                      }`}
                    >
                      Non, pas encore
                    </button>
                  </div>
                </div>
              </div>

              <ConsentementRGPD 
                show_whatsapp_consent={!!whatsapp}
                partenaire_consent={partenaireConsent}
                whatsapp_consent={whatsappConsent}
                onConsentChange={(p, w) => { setPartenaireConsent(p); setWhatsappConsent(w); }}
              />

              {submitError && (
                <div className="p-4 bg-red-50 border-2 border-red-100 text-red-600 text-xs font-bold rounded-xl flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}

              <Button 
                type="submit"
                id="btn-submit-contact-rapide"
                disabled={isSubmitting || !prenom || !email || rdvPrevu === null}
                className="w-full h-14 bg-primary text-on-primary font-black text-base rounded-xl flex items-center justify-center gap-2 shadow-xl disabled:opacity-50 transition-all active:scale-95 text-white"
              >
                {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin text-white" /> : (
                  <>
                    Afficher mon résultat
                    <ChevronRight className="h-5 w-5 text-white" />
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  const niveau = calculerNiveau(score);

  return (
    <div className="min-h-[calc(100vh-160px)] bg-slate-50 py-12 px-4 animate-fade-in">
      <div className="max-w-4xl mx-auto">
        {rdvPrevu ? (
          <FormuleExpressComponent 
            niveau_estime={niveau}
            score_brut={score}
            prenom={prenom}
            whatsapp={whatsapp}
            partenaire_consent={partenaireConsent}
          />
        ) : (
          <ResultatNiveau 
            niveau_estime={niveau}
            score_brut={score}
            prenom={prenom}
          />
        )}
      </div>
    </div>
  );
}
