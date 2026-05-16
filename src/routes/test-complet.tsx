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
import { Loader2, ChevronRight, Sparkles, Target, BookOpen, PenTool, Mic } from 'lucide-react';

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
  
  // Phase 1 state
  const [prenom, setPrenom] = useState('');
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [partenaireConsent, setPartenaireConsent] = useState(false);
  const [wsConsent, setWsConsent] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  // Timer
  const startTime = useRef<number>(0);
  const [finalDuration, setFinalDuration] = useState(0);

  // Results
  const [results, setResults] = useState<{
    scores: { oral: number, ecrit: number, grammaire: number, production: number },
    niveau: NiveauIndicatif,
    flags: FlagsScoring
  } | null>(null);

  const currentSection = SECTIONS[sectionIndex];
  const sectionQuestions = QUESTIONS_COMPLET.filter(q => q.section === currentSection.id);

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsStarting(true);
    await new Promise(r => setTimeout(r, 1000));
    startTime.current = Date.now();
    setPhase(2);
    setIsStarting(false);
  };

  const handleNextSection = () => {
    if (sectionIndex < SECTIONS.length - 1) {
      setSectionIndex(prev => prev + 1);
      window.scrollTo(0, 0);
    } else {
      const duration = Math.round((Date.now() - startTime.current) / 1000);
      setFinalDuration(duration);
      
      const scores = {
        oral: calculerScoreSection(answers, QUESTIONS_COMPLET.filter(q => q.section === "oral")),
        ecrit: calculerScoreSection(answers, QUESTIONS_COMPLET.filter(q => q.section === "ecrit")),
        grammaire: calculerScoreSection(answers, QUESTIONS_COMPLET.filter(q => q.section === "grammaire")),
        production: 40 // Mock for now as per spec "estimated via length/keywords"
      };

      const niveau = calculerNiveauGlobal(scores);
      const flags = calculerFlags({
        score_oral: scores.oral,
        score_ecrit: scores.ecrit,
        duree_secondes: duration
      });

      setResults({ scores, niveau, flags });
      setPhase(3);
    }
  };

  if (phase === 1) {
    return (
      <div className="min-h-screen bg-[#fcfaf7] py-16 px-4">
        <div className="max-w-xl mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="bg-primary p-10 text-center text-on-primary">
            <Target className="h-12 w-12 mx-auto mb-4" />
            <h2 className="text-3xl font-black mb-3">Diagnostic Complet</h2>
            <p className="opacity-90 font-medium">Évaluation approfondie de 30 minutes sur les 4 compétences clés.</p>
          </div>
          
          <form onSubmit={handleStart} className="p-8 md:p-10 space-y-6">
            <div className="bg-surface-container p-4 rounded-xl text-sm text-on-surface-variant leading-relaxed">
              Entrez vos coordonnées pour recevoir vos résultats, même si vous ne terminez pas le test en une seule fois.
            </div>

            <div className="space-y-4">
              <input 
                type="text" required placeholder="Votre prénom" value={prenom} onChange={e => setPrenom(e.target.value)}
                className="w-full h-14 px-6 rounded-xl bg-surface-container border-none font-bold"
              />
              <input 
                type="email" required placeholder="Votre email" value={email} onChange={e => setEmail(e.target.value)}
                className="w-full h-14 px-6 rounded-xl bg-surface-container border-none font-bold"
              />
              <input 
                type="tel" placeholder="WhatsApp (optionnel)" value={whatsapp} onChange={e => setWhatsapp(e.target.value)}
                className="w-full h-14 px-6 rounded-xl bg-surface-container border-none font-bold"
              />
            </div>

            <ConsentementRGPD 
              show_whatsapp_consent={!!whatsapp}
              partenaire_consent={partenaireConsent}
              whatsapp_consent={wsConsent}
              onConsentChange={(p, w) => { setPartenaireConsent(p); setWsConsent(w); }}
            />

            <Button 
              type="submit"
              disabled={isStarting || !prenom || !email || !partenaireConsent}
              className="w-full h-16 bg-primary text-on-primary font-black text-xl rounded-2xl shadow-xl flex items-center justify-center gap-2"
            >
              {isStarting ? <Loader2 className="h-6 w-6 animate-spin" /> : "Commencer le test →"}
            </Button>
          </form>
        </div>
      </div>
    );
  }

  if (phase === 2) {
    const Icon = currentSection.icon;
    return (
      <div className="min-h-screen bg-[#fcfaf7] py-12 px-4">
        <div className="max-w-3xl mx-auto">
          {/* Progress Header */}
          <div className="mb-10 space-y-4">
            <div className="flex justify-between items-end">
              <div className="flex items-center gap-3">
                <div className="bg-primary text-on-primary p-2 rounded-lg">
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <span className="text-xs font-black uppercase tracking-widest text-on-surface-variant">Section {sectionIndex + 1} / 4</span>
                  <h3 className="text-xl font-black text-on-surface">{currentSection.label}</h3>
                </div>
              </div>
            </div>
            <div className="w-full h-3 bg-surface-container rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-700" 
                style={{ width: `${((sectionIndex + 1) / 4) * 100}%` }}
              ></div>
            </div>
          </div>

          <div className="space-y-8 pb-20">
            {sectionQuestions.map((q, idx) => (
              <div key={q.id} className="bg-white rounded-3xl p-8 shadow-sm border border-outline-variant animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${idx * 100}ms` }}>
                <p className="text-lg font-bold text-on-surface mb-6 leading-relaxed">
                  {q.id}. {q.enonce}
                  {q.consigne && <span className="block mt-2 text-primary font-black uppercase text-sm tracking-wider">👉 {q.consigne}</span>}
                </p>

                {q.section === "production" ? (
                  <textarea 
                    rows={6}
                    value={(answers[q.id] as string) || ''}
                    onChange={e => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                    className="w-full p-6 rounded-2xl bg-surface-container border-2 border-transparent focus:border-primary focus:bg-white outline-none font-medium transition-all"
                    placeholder="Tapez votre texte ici..."
                  />
                ) : (
                  <div className="grid grid-cols-1 gap-2">
                    {q.options?.map((opt, oIdx) => (
                      <button
                        key={oIdx}
                        onClick={() => setAnswers(prev => ({ ...prev, [q.id]: oIdx }))}
                        className={`flex items-center gap-4 p-5 rounded-2xl border-2 transition-all text-left ${
                          answers[q.id] === oIdx 
                          ? 'border-primary bg-primary/5 shadow-inner' 
                          : 'border-outline-variant hover:border-primary/40 hover:bg-surface'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold text-sm shrink-0 ${
                          answers[q.id] === oIdx ? 'bg-primary border-primary text-on-primary' : 'border-outline-variant text-on-surface-variant'
                        }`}>
                          {String.fromCharCode(65 + oIdx)}
                        </div>
                        <span className="font-bold text-on-surface">{opt}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            <div className="flex justify-center pt-8">
              <Button 
                onClick={handleNextSection}
                className="w-full h-16 bg-primary text-on-primary font-black text-xl rounded-2xl flex items-center justify-center gap-3 shadow-xl"
              >
                {sectionIndex === 3 ? "Terminer l'évaluation" : "Section suivante"}
                <ChevronRight className="h-6 w-6" />
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
