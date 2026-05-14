import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import {
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  Sparkles,
  ThumbsUp,
  Target,
  UserCheck,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/bff/Button";
import { loadResult } from "@/evaluation/storage";
import {
  FLAG_DEFINITIONS,
  SKILL_LABELS,
  SKILL_ORDER,
  type EvaluationFlag,
  type EvaluationResult,
} from "@/evaluation/types";

function FlagsRenderer({ flags }: { flags: EvaluationFlag[] }) {
  if (flags.length === 0) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-[var(--color-eval-success)] bg-green-50 px-4 py-3 body-md text-[var(--color-eval-success)]">
        <CheckCircle2 className="h-5 w-5" />
        Aucun signal de fiabilité détecté — votre profil est cohérent.
      </div>
    );
  }
  return (
    <div className="flex flex-wrap gap-2">
      {flags.map((f) => {
        const def = FLAG_DEFINITIONS[f];
        const styles =
          def.severity === "critical"
            ? "border-[var(--color-eval-danger)] bg-[var(--color-eval-danger-soft)] text-[var(--color-eval-danger)]"
            : def.severity === "warning"
              ? "border-[var(--color-eval-orange)] bg-[var(--color-eval-orange-soft)] text-[var(--color-eval-orange)]"
              : "border-outline-variant bg-surface-container text-on-surface-variant";
        return (
          <span
            key={f}
            title={def.description}
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-semibold ${styles}`}
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            {def.label}
          </span>
        );
      })}
    </div>
  );
}

const CRITICAL_FLAGS: EvaluationFlag[] = ["ALERTE_VITESSE_INCOHERENTE", "PROFIL_INCOHERENT"];

export function Bilan() {
  const navigate = useNavigate();
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setResult(loadResult());
    setHydrated(true);
  }, []);

  if (!hydrated) {
    return <div className="mx-auto max-w-3xl px-4 py-12 body-md">Chargement…</div>;
  }

  if (!result) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="headline-lg">Aucun bilan disponible</h1>
        <p className="body-md mt-3 text-on-surface-variant">
          Vous n'avez pas encore terminé d'évaluation. Lancez le test complet pour générer
          votre bilan détaillé.
        </p>
        <div className="mt-6 flex justify-center">
          <Link to="/evaluation">
            <Button variant="primary" className="bg-[var(--color-eval-orange)] hover:opacity-90">
              Commencer l'évaluation
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const data = SKILL_ORDER.map((s) => ({
    skill: SKILL_LABELS[s],
    score: result.scores[s],
    fullMark: 100,
  }));

  const showCriticalCta = result.flags.some((f) => CRITICAL_FLAGS.includes(f));

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      {/* Header */}
      <div className="rounded-2xl border-2 border-[var(--color-eval-navy)] bg-[var(--color-eval-navy)] p-6 text-white sm:p-8">
        <p className="label-caps text-[var(--color-eval-orange-soft)]">
          Bilan expert — Évaluation Linguistique Initiale (CECRL)
        </p>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">{result.candidateName}</h1>
            <p className="body-md mt-1 text-white/80">
              Niveau global estimé&nbsp;:{" "}
              <span className="text-[var(--color-eval-orange)] font-bold text-2xl">
                {result.globalLevel}
              </span>
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {SKILL_ORDER.map((s) => (
              <div
                key={s}
                className="rounded-lg bg-white/10 px-3 py-2 text-center backdrop-blur"
              >
                <div className="text-xs text-white/70">{s}</div>
                <div className="text-lg font-bold">{result.perSkillLevel[s]}</div>
                <div className="text-xs text-white/70">{result.scores[s]}/100</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Critical CTA */}
      {showCriticalCta && (
        <div className="mt-6 rounded-2xl border-2 border-[var(--color-eval-danger)] bg-[var(--color-eval-danger-soft)] p-6">
          <div className="flex flex-wrap items-start gap-4">
            <ShieldAlert className="h-8 w-8 shrink-0 text-[var(--color-eval-danger)]" />
            <div className="flex-1">
              <h2 className="headline-md text-[var(--color-eval-danger)]">
                Validation humaine recommandée
              </h2>
              <p className="body-md mt-2 text-on-surface">
                Notre système a détecté des signaux contrastés sur votre passation
                ({result.flags
                  .filter((f) => CRITICAL_FLAGS.includes(f))
                  .map((f) => FLAG_DEFINITIONS[f].label.toLowerCase())
                  .join(", ")}
                ). Pour fiabiliser votre niveau et orienter votre parcours, nous vous
                recommandons un entretien individuel avec un expert humain.
              </p>
              <div className="mt-4">
                <Link to="/contact">
                  <Button
                    variant="primary"
                    className="bg-[var(--color-eval-danger)] hover:opacity-90"
                  >
                    <UserCheck className="h-4 w-4" />
                    Réserver un entretien avec un expert humain
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Radar + Flags */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-outline-variant bg-surface-bright p-6 shadow-sm">
          <h2 className="headline-md text-[var(--color-eval-navy)]">
            Profil par compétence
          </h2>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={data} outerRadius="75%">
                <PolarGrid stroke="#cbd5e1" />
                <PolarAngleAxis
                  dataKey="skill"
                  tick={{ fill: "#1e3a8a", fontSize: 12, fontWeight: 600 }}
                />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10 }} />
                <Radar
                  name="Score"
                  dataKey="score"
                  stroke="#f97316"
                  fill="#f97316"
                  fillOpacity={0.4}
                />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-outline-variant bg-surface-bright p-6 shadow-sm">
          <h2 className="headline-md text-[var(--color-eval-navy)]">
            Signaux de fiabilité
          </h2>
          <p className="body-md mt-2 text-on-surface-variant">
            Indicateurs détectés pendant la passation (rythme, cohérence, asymétrie).
          </p>
          <div className="mt-4">
            <FlagsRenderer flags={result.flags} />
          </div>
          <p className="mt-6 text-xs text-on-surface-variant">
            Ces signaux ne remplacent pas un avis pédagogique humain — ils l'éclairent.
          </p>
        </div>
      </div>

      {/* Narrative */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-outline-variant bg-surface-bright p-6 shadow-sm">
          <div className="flex items-center gap-2 text-[var(--color-eval-success)]">
            <ThumbsUp className="h-5 w-5" />
            <h3 className="headline-md">Points forts</h3>
          </div>
          <ul className="mt-3 space-y-2 body-md text-on-surface">
            {result.narrative.strengths.map((s, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-[var(--color-eval-success)]">•</span>
                {s}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-outline-variant bg-surface-bright p-6 shadow-sm">
          <div className="flex items-center gap-2 text-[var(--color-eval-orange)]">
            <Target className="h-5 w-5" />
            <h3 className="headline-md">Axes d'amélioration</h3>
          </div>
          <ul className="mt-3 space-y-2 body-md text-on-surface">
            {result.narrative.improvements.map((s, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-[var(--color-eval-orange)]">•</span>
                {s}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border-2 border-[var(--color-eval-navy)] bg-[var(--color-eval-navy-soft)] p-6 shadow-sm">
          <div className="flex items-center gap-2 text-[var(--color-eval-navy)]">
            <Sparkles className="h-5 w-5" />
            <h3 className="headline-md">Avis de l'expert</h3>
          </div>
          <p className="mt-3 body-md text-on-surface">{result.narrative.expertOpinion}</p>
        </div>
      </div>

      {/* Footer actions */}
      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <p className="body-md text-on-surface-variant">
          Évaluation réalisée le{" "}
          {new Date(result.completedAt).toLocaleDateString("fr-FR", {
            dateStyle: "long",
          })}
          .
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => navigate({ to: "/evaluation" })}
            className="inline-flex items-center gap-2 rounded-lg border border-outline-variant bg-surface-bright px-4 py-2 body-md hover:bg-surface-container"
          >
            <RotateCcw className="h-4 w-4" /> Refaire l'évaluation
          </button>
          <Link to="/contact">
            <Button variant="primary" className="bg-[var(--color-eval-navy)] hover:opacity-90">
              Être recontacté·e
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
