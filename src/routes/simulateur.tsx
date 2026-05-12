import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/bff/Button";
import { Card } from "@/components/bff/Card";
import { StepTracker } from "@/components/bff/StepTracker";
import { Disclaimer } from "@/components/bff/Disclaimer";
import { QUESTIONS, type Question } from "@/simulator/questions";
import {
  buildSimulationResult,
  type SimulatorState,
} from "@/simulator/scoring";
import { SIMULATION_STORAGE_KEY } from "@/shared/simulationResult";
import { siteName, siteUrl } from "@/config/site";
import { trackEvent } from "@/lib/analytics";

export const Route = createFileRoute("/simulateur")({
  head: () => ({
    meta: [
      { title: `Simulateur de niveau de français — ${siteName}` },
      {
        name: "description",
        content:
          "Test de niveau de français en 12 questions. Estimation gratuite et orientation vers la formation adaptée.",
      },
      { property: "og:title", content: `Simulateur de niveau — ${siteName}` },
      {
        property: "og:description",
        content: "12 questions pour estimer votre niveau et recevoir une orientation.",
      },
      { property: "og:url", content: siteUrl + "/simulateur" },
    ],
  }),
  component: SimulatorPage,
});

const STATE_STORAGE_KEY = "bff_simulator_state";
const STEP_STORAGE_KEY = "bff_simulator_step";

const initialState: SimulatorState = {
  linguistic: {
    comprehension_orale: 0,
    comprehension_ecrite: 0,
    expression_ecrite: 0,
    expression_orale: 0,
    vocabulaire_admin: 0,
    vocabulaire_travail: 0,
    grammaire: 0,
    prononciation: 0,
    aisance: 0,
  },
  adminGoal: "unknown",
  deadlineMonths: null,
  procedureStarted: false,
  professionalProfile: false,
  availability: [],
  formatPreference: "les_deux",
};

function SimulatorPage() {
  const navigate = useNavigate();
  const [state, setState] = useState<SimulatorState>(initialState);
  const [step, setStep] = useState(0);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = sessionStorage.getItem(STATE_STORAGE_KEY);
      if (raw) setState({ ...initialState, ...JSON.parse(raw) });
      const s = sessionStorage.getItem(STEP_STORAGE_KEY);
      if (s) setStep(Math.min(QUESTIONS.length - 1, Math.max(0, parseInt(s, 10) || 0)));
    } catch {
      /* ignore */
    }
    setHydrated(true);
    trackEvent("simulator_started");
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    sessionStorage.setItem(STATE_STORAGE_KEY, JSON.stringify(state));
    sessionStorage.setItem(STEP_STORAGE_KEY, String(step));
  }, [state, step, hydrated]);

  const question = QUESTIONS[step];
  const total = QUESTIONS.length;

  const isAnswered = useMemo(() => questionAnswered(question, state), [question, state]);

  const goNext = () => {
    trackEvent("simulator_step_completed", { step: step + 1 });
    if (step < total - 1) {
      setStep((s) => s + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      finish();
    }
  };

  const goBack = () => {
    if (step > 0) setStep((s) => s - 1);
  };

  const finish = () => {
    const result = buildSimulationResult(
      state,
      { consent: false },
      { page: "/simulateur" }
    );
    sessionStorage.setItem(SIMULATION_STORAGE_KEY, JSON.stringify(result));
    sessionStorage.removeItem(STATE_STORAGE_KEY);
    sessionStorage.removeItem(STEP_STORAGE_KEY);
    trackEvent("simulator_completed", {
      level: result.estimatedLevel,
      goal: result.adminGoal,
      urgency: result.urgency,
    });
    navigate({ to: "/resultat" });
  };

  return (
    <div className="px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <header className="mb-6 text-center">
          <p className="label-caps text-secondary">
            Question {step + 1} / {total}
          </p>
          <h1 className="sr-only">Simulateur de niveau de français</h1>
        </header>

        <StepTracker total={total} current={step} />

        <Card className="mt-6">
          <h2 className="headline-md">{question.label}</h2>
          {"help" in question && question.help && (
            <p className="mt-2 body-md text-on-surface-variant">{question.help}</p>
          )}

          <div className="mt-6">
            <QuestionInput question={question} state={state} setState={setState} />
          </div>
        </Card>

        <div className="mt-6 flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            onClick={goBack}
            disabled={step === 0}
            aria-label="Question précédente"
          >
            <ChevronLeft className="h-5 w-5" /> Retour
          </Button>
          <Button variant="primary" onClick={goNext} disabled={!isAnswered}>
            {step === total - 1 ? "Voir mon résultat" : "Continuer"}
          </Button>
        </div>

        <div className="mt-8">
          <Disclaimer>
            Vos réponses ne sont pas envoyées tant que vous n'avez pas validé le
            formulaire de contact. Aucune donnée administrative sensible n'est demandée.
          </Disclaimer>
        </div>
      </div>
    </div>
  );
}

function questionAnswered(q: Question, s: SimulatorState): boolean {
  switch (q.type) {
    case "linguistic":
      // 0 est une réponse valide (=) "quasiment rien" → considérer comme répondu.
      // On distingue l'état "non touché" via une valeur sentinelle ? Ici on accepte 0 comme valide.
      return true;
    case "goal":
      return s.adminGoal !== "unknown";
    case "deadline":
      // On accepte null aussi (pas d'échéance) — on considère qu'on a forcément cliqué une option si on est passé par cette étape.
      return true;
    case "procedure":
      return true;
    case "professional":
      return true;
    case "availability":
      return s.availability.length > 0;
    case "format":
      return Boolean(s.formatPreference);
    default:
      return true;
  }
}

interface QInputProps {
  question: Question;
  state: SimulatorState;
  setState: React.Dispatch<React.SetStateAction<SimulatorState>>;
}

function QuestionInput({ question, state, setState }: QInputProps) {
  if (question.type === "linguistic") {
    const current = state.linguistic[question.field];
    return (
      <div className="grid gap-3">
        {question.options.map((opt) => (
          <OptionButton
            key={opt.label}
            label={opt.label}
            selected={current === opt.value}
            onClick={() =>
              setState((s) => ({
                ...s,
                linguistic: { ...s.linguistic, [question.field]: opt.value },
              }))
            }
          />
        ))}
      </div>
    );
  }

  if (question.type === "goal") {
    return (
      <div className="grid gap-3">
        {question.options.map((opt) => (
          <OptionButton
            key={opt.value}
            label={opt.label}
            selected={state.adminGoal === opt.value}
            onClick={() => setState((s) => ({ ...s, adminGoal: opt.value }))}
          />
        ))}
      </div>
    );
  }

  if (question.type === "deadline") {
    return (
      <div className="grid gap-3">
        {question.options.map((opt, i) => (
          <OptionButton
            key={i}
            label={opt.label}
            selected={state.deadlineMonths === opt.value}
            onClick={() => setState((s) => ({ ...s, deadlineMonths: opt.value }))}
          />
        ))}
      </div>
    );
  }

  if (question.type === "procedure") {
    return (
      <div className="grid gap-3">
        {question.options.map((opt) => (
          <OptionButton
            key={String(opt.value)}
            label={opt.label}
            selected={state.procedureStarted === opt.value}
            onClick={() => setState((s) => ({ ...s, procedureStarted: opt.value }))}
          />
        ))}
      </div>
    );
  }

  if (question.type === "professional") {
    return (
      <div className="grid gap-3">
        {question.options.map((opt) => (
          <OptionButton
            key={String(opt.value)}
            label={opt.label}
            selected={state.professionalProfile === opt.value}
            onClick={() => setState((s) => ({ ...s, professionalProfile: opt.value }))}
          />
        ))}
      </div>
    );
  }

  if (question.type === "availability") {
    return (
      <div className="grid gap-3">
        {question.options.map((opt) => {
          const active = state.availability.includes(opt.value);
          return (
            <OptionButton
              key={opt.value}
              label={opt.label}
              selected={active}
              onClick={() =>
                setState((s) => ({
                  ...s,
                  availability: active
                    ? s.availability.filter((a) => a !== opt.value)
                    : [...s.availability, opt.value],
                }))
              }
            />
          );
        })}
        <p className="body-md text-on-surface-variant">Plusieurs choix possibles.</p>
      </div>
    );
  }

  if (question.type === "format") {
    return (
      <div className="grid gap-3">
        {question.options.map((opt) => (
          <OptionButton
            key={opt.value}
            label={opt.label}
            selected={state.formatPreference === opt.value}
            onClick={() => setState((s) => ({ ...s, formatPreference: opt.value }))}
          />
        ))}
      </div>
    );
  }

  return null;
}

function OptionButton({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={
        "min-h-14 w-full rounded-lg border px-4 py-3 text-left body-lg transition-colors " +
        (selected
          ? "border-primary bg-primary/5 text-on-surface font-semibold"
          : "border-outline-variant bg-surface-bright text-on-surface hover:bg-surface-container")
      }
    >
      {label}
    </button>
  );
}
