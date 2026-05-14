import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  ArrowLeft,
  Clock,
  EyeOff,
  Headphones,
  PenLine,
  Mic,
  BookOpen,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/bff/Button";
import { ITEMS, ITEMS_BY_SKILL } from "@/evaluation/items";
import { SKILL_LABELS, SKILL_ORDER, type Answer, type Skill } from "@/evaluation/types";
import {
  clearProgress,
  loadProgress,
  saveProgress,
  saveResult,
} from "@/evaluation/storage";
import { useActiveTimer } from "@/evaluation/useActiveTimer";
import { computeResult } from "@/evaluation/scoring";
import { trackEvent } from "@/lib/analytics";

const SKILL_ICONS: Record<Skill, typeof BookOpen> = {
  CE: BookOpen,
  CO: Headphones,
  EE: PenLine,
  EO: Mic,
};

function fmtMs(ms: number) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, "0")}`;
}

type Phase = "intro" | "running";

export function EvaluationFlow() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>("intro");
  const [name, setName] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [openText, setOpenText] = useState("");
  const [choice, setChoice] = useState<number | null>(null);
  const [tabHidden, setTabHidden] = useState(false);

  // Resume previous attempt if any.
  useEffect(() => {
    const p = loadProgress();
    if (p && p.candidateName && Object.keys(p.answers).length > 0) {
      setName(p.candidateName);
      setCurrentIndex(Math.min(p.currentIndex, ITEMS.length - 1));
      setAnswers(p.answers);
      setPhase("running");
    }
  }, []);

  const currentItem = ITEMS[currentIndex];
  const itemKey = currentItem?.id ?? "none";
  const elapsedMs = useActiveTimer(itemKey);
  const elapsedRef = useRef(0);
  elapsedRef.current = elapsedMs;

  // Reset per-item input when item changes / on resume.
  useEffect(() => {
    if (!currentItem) return;
    const existing = answers[currentItem.id];
    if (existing) {
      setChoice(existing.choiceIndex ?? null);
      setOpenText(existing.text ?? "");
    } else {
      setChoice(null);
      setOpenText("");
    }
  }, [currentItem, answers]);

  // Tab visibility indicator.
  useEffect(() => {
    if (typeof document === "undefined") return;
    const onVis = () => setTabHidden(document.visibilityState !== "visible");
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  const skillCounts = useMemo(() => {
    const c: Record<Skill, { total: number; done: number }> = {
      CE: { total: ITEMS_BY_SKILL.CE.length, done: 0 },
      CO: { total: ITEMS_BY_SKILL.CO.length, done: 0 },
      EE: { total: ITEMS_BY_SKILL.EE.length, done: 0 },
      EO: { total: ITEMS_BY_SKILL.EO.length, done: 0 },
    };
    for (const item of ITEMS) {
      if (answers[item.id]) c[item.skill].done++;
    }
    return c;
  }, [answers]);

  function startEvaluation() {
    if (!name.trim()) return;
    clearProgress();
    setAnswers({});
    setCurrentIndex(0);
    setPhase("running");
    trackEvent("simulator_started", { kind: "evaluation" });
  }

  function persist(nextAnswers: Record<string, Answer>, nextIndex: number) {
    saveProgress({
      candidateName: name.trim(),
      startedAt: new Date().toISOString(),
      currentIndex: nextIndex,
      answers: nextAnswers,
    });
  }

  function recordCurrent(): Record<string, Answer> {
    if (!currentItem) return answers;
    const previous = answers[currentItem.id];
    const previousTime = previous?.timeSpentMs ?? 0;
    const ans: Answer = {
      itemId: currentItem.id,
      timeSpentMs: previousTime + elapsedRef.current,
      choiceIndex: "correctIndex" in currentItem ? choice ?? undefined : undefined,
      text: "correctIndex" in currentItem ? undefined : openText,
    };
    return { ...answers, [currentItem.id]: ans };
  }

  function goNext() {
    const updated = recordCurrent();
    setAnswers(updated);
    const nextIndex = currentIndex + 1;
    if (nextIndex >= ITEMS.length) {
      const result = computeResult(name.trim(), updated);
      saveResult(result);
      clearProgress();
      trackEvent("simulator_completed", { kind: "evaluation" });
      navigate({ to: "/bilan" });
      return;
    }
    setCurrentIndex(nextIndex);
    persist(updated, nextIndex);
    trackEvent("simulator_step_completed", { index: nextIndex });
  }

  function goPrev() {
    if (currentIndex === 0) return;
    const updated = recordCurrent();
    setAnswers(updated);
    const prev = currentIndex - 1;
    setCurrentIndex(prev);
    persist(updated, prev);
  }

  if (phase === "intro") {
    const hadProgress = loadProgress();
    return (
      <div className="mx-auto max-w-2xl px-4 py-12">
        <div className="rounded-2xl border-2 border-[var(--color-eval-navy)] bg-surface-bright p-6 shadow-lg sm:p-10">
          <p className="label-caps text-[var(--color-eval-orange)]">
            Évaluation Linguistique Initiale
          </p>
          <h1 className="headline-lg mt-2 text-[var(--color-eval-navy)]">
            Test complet — 4 compétences
          </h1>
          <p className="body-md mt-4 text-on-surface-variant">
            Inspiré du référentiel <strong>CECRL</strong>. Vous serez évalué·e sur la
            compréhension écrite, la compréhension orale, l'expression écrite et l'expression orale.
            Durée estimée : <strong>15 à 20 minutes</strong>. Le temps n'est décompté que
            lorsque l'onglet est actif.
          </p>

          <label className="mt-8 block">
            <span className="label-caps text-on-surface-variant">Votre nom complet</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex. Marie Dupont"
              className="mt-2 w-full rounded-lg border-2 border-outline-variant bg-surface-bright px-4 py-3 body-lg focus:border-[var(--color-eval-navy)] focus:outline-none"
            />
          </label>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={startEvaluation}
              disabled={!name.trim()}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-[var(--color-eval-navy)] px-6 text-base font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Commencer l'évaluation <ArrowRight className="h-4 w-4" />
            </button>
            {hadProgress && hadProgress.candidateName && (
              <span className="self-center body-md text-on-surface-variant">
                Une session interrompue de <strong>{hadProgress.candidateName}</strong> sera
                automatiquement reprise dès que vous aurez saisi son nom.
              </span>
            )}
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {SKILL_ORDER.map((s) => {
              const Icon = SKILL_ICONS[s];
              return (
                <div
                  key={s}
                  className="flex items-center gap-3 rounded-lg border border-outline-variant bg-[var(--color-eval-navy-soft)] px-4 py-3"
                >
                  <Icon className="h-5 w-5 text-[var(--color-eval-navy)]" />
                  <span className="body-md font-medium">{SKILL_LABELS[s]}</span>
                </div>
              );
            })}
          </div>

          <p className="mt-6 flex items-center gap-2 body-md text-on-surface-variant">
            <ShieldCheck className="h-4 w-4 text-[var(--color-eval-success)]" />
            Sauvegarde automatique : vous pouvez rafraîchir la page sans perdre votre progression.
          </p>
        </div>
      </div>
    );
  }

  if (!currentItem) return null;

  const Icon = SKILL_ICONS[currentItem.skill];
  const globalProgress = ((currentIndex + 1) / ITEMS.length) * 100;
  const isMcq = "correctIndex" in currentItem;
  const canValidate = isMcq ? choice !== null : openText.trim().length >= 10;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* Header progression */}
      <div className="rounded-2xl border-2 border-[var(--color-eval-navy)] bg-surface-bright p-4 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-[var(--color-eval-navy)]">
            <Icon className="h-5 w-5" />
            <span className="label-caps">{SKILL_LABELS[currentItem.skill]}</span>
            <span className="rounded-full bg-[var(--color-eval-orange-soft)] px-2 py-0.5 text-xs font-semibold text-[var(--color-eval-orange)]">
              Niveau {currentItem.level}
            </span>
          </div>
          <div className="flex items-center gap-3 text-sm text-on-surface-variant">
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {fmtMs(elapsedMs)}
            </span>
            {tabHidden && (
              <span className="flex items-center gap-1 rounded-full bg-[var(--color-eval-orange-soft)] px-2 py-0.5 font-semibold text-[var(--color-eval-orange)]">
                <EyeOff className="h-3 w-3" /> Timer en pause
              </span>
            )}
            <span>
              {currentIndex + 1} / {ITEMS.length}
            </span>
          </div>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-container">
          <div
            className="h-full rounded-full bg-[var(--color-eval-orange)] transition-all"
            style={{ width: `${globalProgress}%` }}
          />
        </div>
        <div className="mt-3 grid grid-cols-4 gap-2">
          {SKILL_ORDER.map((s) => {
            const c = skillCounts[s];
            const active = s === currentItem.skill;
            return (
              <div
                key={s}
                className={`rounded-lg border px-2 py-1 text-center text-xs ${
                  active
                    ? "border-[var(--color-eval-navy)] bg-[var(--color-eval-navy-soft)] font-semibold text-[var(--color-eval-navy)]"
                    : "border-outline-variant text-on-surface-variant"
                }`}
              >
                {s} · {c.done}/{c.total}
              </div>
            );
          })}
        </div>
      </div>

      {/* Item */}
      <div className="mt-6 rounded-2xl border border-outline-variant bg-surface-bright p-6 shadow-sm sm:p-8">
        {"passage" in currentItem && currentItem.passage && (
          <blockquote className="mb-4 rounded-lg border-l-4 border-[var(--color-eval-navy)] bg-[var(--color-eval-navy-soft)] p-4 body-lg italic text-on-surface">
            {currentItem.passage}
          </blockquote>
        )}
        {"audioLabel" in currentItem && currentItem.audioLabel && (
          <div className="mb-4 flex items-start gap-3 rounded-lg border border-outline-variant bg-surface-container p-4">
            <Headphones className="mt-1 h-5 w-5 text-[var(--color-eval-navy)]" />
            <p className="body-md text-on-surface-variant">{currentItem.audioLabel}</p>
          </div>
        )}

        <p className="body-lg font-medium text-on-surface">{currentItem.prompt}</p>

        {isMcq ? (
          <div className="mt-5 grid gap-2">
            {currentItem.choices.map((c, i) => {
              const selected = choice === i;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => setChoice(i)}
                  className={`rounded-lg border-2 px-4 py-3 text-left body-md transition-colors ${
                    selected
                      ? "border-[var(--color-eval-navy)] bg-[var(--color-eval-navy-soft)] font-semibold"
                      : "border-outline-variant bg-surface-bright hover:border-[var(--color-eval-navy)]"
                  }`}
                >
                  {c}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="mt-5">
            <textarea
              value={openText}
              onChange={(e) => setOpenText(e.target.value)}
              rows={8}
              placeholder="Écrivez votre réponse ici…"
              className="w-full rounded-lg border-2 border-outline-variant bg-surface-bright px-4 py-3 body-md focus:border-[var(--color-eval-navy)] focus:outline-none"
            />
            <p className="mt-2 text-xs text-on-surface-variant">
              {openText.trim().split(/\s+/).filter(Boolean).length} mot(s) — minimum
              recommandé : {currentItem.minWords}.
            </p>
          </div>
        )}
      </div>

      {/* Nav */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={goPrev}
          disabled={currentIndex === 0}
          className="inline-flex items-center gap-2 rounded-lg border border-outline-variant bg-surface-bright px-4 py-2 body-md hover:bg-surface-container disabled:opacity-40"
        >
          <ArrowLeft className="h-4 w-4" /> Précédent
        </button>
        <Button
          variant="primary"
          onClick={goNext}
          disabled={!canValidate}
          className="bg-[var(--color-eval-orange)] hover:opacity-90"
        >
          {currentIndex + 1 === ITEMS.length ? "Voir mon bilan" : "Question suivante"}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
