import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { QUESTIONS, calculerNiveau } from '@/data/questions-test-rapide';
import { Button } from '@/components/bff/Button';
import { ChevronRight, Loader2, Sparkles, Send } from 'lucide-react';
import { ConsentementRGPD } from '@/components/ConsentementRGPD';
import { FormuleExpressComponent } from '@/components/FormuleExpress';
import { ResultatNiveau } from '@/components/ResultatNiveau';
import { NiveauIndicatif } from '@/types/bilan';
import { trackFormulairesSoumis } from '@/utils/tracking';

export const Route = createFileRoute('/test-rapide')({
  component: TestRapidePage,
});

function TestRapidePage() {
  const [phase, setPhase] = useState<1 | 2 | 3>(1);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  
  // Phase 2 state
  const [prenom, setPrenom] = useState('');
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [rdvPrevu, setRdvPrevu] = useState<boolean | null>(null);
  const [partenaireConsent, setPartenaireConsent] = useState(false);
  const [whatsappConsent, setWhatsappConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      setPhase(2);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    trackFormulairesSoumis({ 
      tunnel: "T2", 
      destination: partenaireConsent ? "les_deux" : "formation" 
    });
    
    setIsSubmitting(false);
    setPhase(3);
  };

  if (phase === 1) {
    return (
      <div className="min-h-[calc(100vh-160px)] bg-[#fcfaf7] py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4 text-xs font-black uppercase tracking-widest text-primary">
              <span>Question {currentStep + 1} sur {QUESTIONS.length}</span>
              <span>{Math.round(((currentStep + 1) / QUESTIONS.length) * 100)}%</span>
            </div>
            <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-500" 
                style={{ width: `${((currentStep + 1) / QUESTIONS.length) * 100}%` }}
              ></div>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
            <div className="p-8 md:p-12 space-y-8">
              <h2 className="text-2xl md:text-3xl font-black text-on-surface leading-tight text-center">
                {currentQuestion.enonce}
              </h2>

              <div className="grid grid-cols-1 gap-3">
                {currentQuestion.options.map((opt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleAnswer(idx)}
                    className="group flex items-center gap-4 p-5 rounded-2xl border-2 border-outline-variant hover:border-primary hover:bg-primary/5 transition-all text-left"
                  >
                    <div className="w-8 h-8 rounded-full border-2 border-outline-variant group-hover:border-primary flex items-center justify-center font-bold text-sm text-on-surface-variant group-hover:text-primary shrink-0">
                      {String.fromCharCode(65 + idx)}
                    </div>
                    <span className="text-lg font-bold text-on-surface">{opt}</span>
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
      <div className="min-h-[calc(100vh-160px)] bg-[#fcfaf7] py-12 px-4">
        <div className="max-w-xl mx-auto">
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
            <div className="bg-primary p-8 text-center text-on-primary">
              <Sparkles className="h-10 w-10 mx-auto mb-4" />
              <h2 className="text-3xl font-black mb-2">Votre résultat est prêt !</h2>
              <p className="opacity-90 font-medium">Entrez vos coordonnées pour recevoir votre bilan détaillé.</p>
            </div>
            
            <form onSubmit={handleFormSubmit} className="p-8 md:p-10 space-y-6">
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-1 ml-1">Prénom</label>
                    <input 
                      type="text" required value={prenom} onChange={e => setPrenom(e.target.value)}
                      className="w-full h-14 px-6 rounded-xl bg-surface-container border-none focus:ring-2 focus:ring-primary font-bold text-lg"
                      placeholder="Ex: Amine"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-1 ml-1">Email</label>
                    <input 
                      type="email" required value={email} onChange={e => setEmail(e.target.value)}
                      className="w-full h-14 px-6 rounded-xl bg-surface-container border-none focus:ring-2 focus:ring-primary font-bold text-lg"
                      placeholder="votre@email.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-1 ml-1">WhatsApp (optionnel)</label>
                    <input 
                      type="tel" value={whatsapp} onChange={e => setWhatsapp(e.target.value)}
                      className="w-full h-14 px-6 rounded-xl bg-surface-container border-none focus:ring-2 focus:ring-primary font-bold text-lg"
                      placeholder="+33 6 XX XX XX XX"
                    />
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <label className="block text-sm font-bold text-on-surface-variant uppercase tracking-wider ml-1">Avez-vous un rendez-vous prévu en préfecture ?</label>
                  <div className="flex gap-4">
                    <button 
                      type="button" onClick={() => setRdvPrevu(true)}
                      className={`flex-1 h-14 rounded-xl border-2 font-bold transition-all ${rdvPrevu === true ? 'border-primary bg-primary/5 text-primary' : 'border-outline-variant text-on-surface-variant'}`}
                    >
                      Oui
                    </button>
                    <button 
                      type="button" onClick={() => setRdvPrevu(false)}
                      className={`flex-1 h-14 rounded-xl border-2 font-bold transition-all ${rdvPrevu === false ? 'border-primary bg-primary/5 text-primary' : 'border-outline-variant text-on-surface-variant'}`}
                    >
                      Non
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

              <Button 
                type="submit"
                disabled={isSubmitting || !prenom || !email || rdvPrevu === null || !partenaireConsent}
                className="w-full h-16 bg-primary text-on-primary font-black text-xl rounded-2xl flex items-center justify-center gap-3 shadow-xl disabled:opacity-50 transition-all active:scale-95"
              >
                {isSubmitting ? <Loader2 className="h-6 w-6 animate-spin" /> : (
                  <>
                    Voir mon résultat
                    <ChevronRight className="h-6 w-6" />
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
    <div className="min-h-[calc(100vh-160px)] bg-[#fcfaf7] py-12 px-4">
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
