import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { useServerFn } from "@tanstack/react-start";
import { listJourneysFn, createCohortFn } from "../lib/cohortes.functions";
import { ArrowLeft, ArrowRight, Plus, Trash2, Check } from "lucide-react";

export const Route = createFileRoute("/admin/cohortes/nouveau")({
  head: () => ({
    meta: [
      { title: "Nouvelle cohorte — Console Admin" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: NouvelleCohorte,
});

const DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
const INTENSITY = [
  { v: "standard", l: "Standard (3h/sem)", h: 3 },
  { v: "intensif", l: "Intensif (6h/sem)", h: 6 },
  { v: "express", l: "Express (9h/sem)", h: 9 },
];

type Slot = { day: number; start: string; end: string };

function NouvelleCohorte() {
  const navigate = useNavigate();
  const getJourneys = useServerFn(listJourneysFn);
  const createCohort = useServerFn(createCohortFn);

  const [step, setStep] = useState(1);
  const [journeys, setJourneys] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [journeyId, setJourneyId] = useState("");
  const [intensity, setIntensity] = useState("standard");
  const [visibility, setVisibility] = useState<"private" | "public">("private");
  const [meetingUrl, setMeetingUrl] = useState("");
  const [startDate, setStartDate] = useState("");
  const [slots, setSlots] = useState<Slot[]>([{ day: 1, start: "18:00", end: "21:00" }]);
  const [maxStudents, setMaxStudents] = useState(5);
  const [minStudents, setMinStudents] = useState(3);

  useEffect(() => {
    getJourneys({}).then((r) => setJourneys(r.journeys)).catch(console.error);
  }, [getJourneys]);

  const selectedJourney = useMemo(() => journeys.find((j) => j.id === journeyId), [journeys, journeyId]);

  const computed = useMemo(() => {
    if (!selectedJourney) return null;
    const weeks = selectedJourney.duration_weeks || 12;
    const hours = INTENSITY.find((i) => i.v === intensity)?.h || 3;
    const weeksNeeded = Math.ceil((weeks * 3) / hours);
    const totalSessions = weeksNeeded * slots.length;
    let endDate = "";
    if (startDate) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + weeksNeeded * 7);
      endDate = d.toLocaleDateString("fr-FR");
    }
    return { totalSessions, weeksNeeded, endDate, sessionDuration: 3 };
  }, [selectedJourney, intensity, slots, startDate]);

  const addSlot = () => {
    if (slots.length < 3) setSlots([...slots, { day: 2, start: "18:00", end: "21:00" }]);
  };
  const removeSlot = (i: number) => {
    if (slots.length > 1) setSlots(slots.filter((_, idx) => idx !== i));
  };
  const updateSlot = (i: number, patch: Partial<Slot>) => {
    setSlots(slots.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  };

  const canNext1 = journeyId && intensity && visibility;
  const canNext2 = startDate && slots.length >= 1;

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await createCohort({
        data: {
          formation_journey_id: journeyId,
          intensity: intensity as any,
          visibility,
          meeting_url: meetingUrl || undefined,
          start_date: startDate,
          weekly_schedule: slots,
          max_students: maxStudents,
          min_students_to_confirm: minStudents,
        },
      });
      navigate({ to: "/admin/cohortes/$cohortId", params: { cohortId: res.cohort.id } });
    } catch (e: any) {
      setError(e?.message || "Erreur lors de la création");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <header className="pb-4 border-b border-outline-variant/30">
        <Link to="/admin/cohortes" className="inline-flex items-center gap-1 text-sm font-bold text-primary hover:underline mb-2">
          <ArrowLeft size={16} /> Retour aux cohortes
        </Link>
        <h1 className="text-3xl font-black text-on-surface">Nouvelle cohorte</h1>
        <p className="text-sm text-on-surface-variant mt-1">Configurez le parcours, le planning et la capacité de la session.</p>
      </header>

      {/* Stepper */}
      <div className="flex items-center gap-2">
        {[1, 2, 3].map((n) => (
          <div key={n} className="flex items-center gap-2 flex-1">
            <div className={`h-9 w-9 rounded-full flex items-center justify-center font-black text-sm border-2 ${step >= n ? "bg-primary text-on-primary border-primary" : "bg-white text-on-surface-variant border-outline-variant"}`}>
              {step > n ? <Check size={16} /> : n}
            </div>
            <span className={`text-xs font-bold uppercase tracking-wider ${step >= n ? "text-on-surface" : "text-on-surface-variant"}`}>
              {n === 1 ? "Parcours" : n === 2 ? "Planning" : "Capacité"}
            </span>
            {n < 3 && <div className={`flex-1 h-0.5 ${step > n ? "bg-primary" : "bg-outline-variant/30"}`} />}
          </div>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm font-semibold">
          {error}
        </div>
      )}

      <section className="rounded-3xl border border-outline-variant/30 shadow-sm bg-white p-6 space-y-5">
        {step === 1 && (
          <>
            <h2 className="text-xl font-bold text-on-surface">Étape 1 — Parcours & Intensité</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">Parcours de formation</label>
                <select value={journeyId} onChange={(e) => setJourneyId(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-outline-variant bg-surface text-sm font-semibold text-on-surface focus:outline-none focus:border-primary">
                  <option value="">— Sélectionner —</option>
                  {journeys.map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.title}{j.duration_weeks ? ` (${j.duration_weeks} sem)` : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">Intensité</label>
                <select value={intensity} onChange={(e) => setIntensity(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-outline-variant bg-surface text-sm font-semibold text-on-surface focus:outline-none focus:border-primary">
                  {INTENSITY.map((i) => <option key={i.v} value={i.v}>{i.l}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">Visibilité</label>
                <select value={visibility} onChange={(e) => setVisibility(e.target.value as any)}
                  className="w-full h-10 px-3 rounded-lg border border-outline-variant bg-surface text-sm font-semibold text-on-surface focus:outline-none focus:border-primary">
                  <option value="private">Privé</option>
                  <option value="public">Public</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">Lien visio par défaut</label>
                <input type="url" value={meetingUrl} onChange={(e) => setMeetingUrl(e.target.value)} placeholder="https://meet..."
                  className="w-full h-10 px-3 rounded-lg border border-outline-variant bg-surface text-sm text-on-surface focus:outline-none focus:border-primary" />
              </div>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="text-xl font-bold text-on-surface">Étape 2 — Planning</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">Date de démarrage</label>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-outline-variant bg-surface text-sm font-semibold text-on-surface focus:outline-none focus:border-primary" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Créneaux hebdomadaires</label>
                  <button type="button" onClick={addSlot} disabled={slots.length >= 3}
                    className="inline-flex h-8 items-center gap-1 rounded-lg border border-outline-variant bg-white px-3 text-xs font-bold text-on-surface hover:bg-surface-container disabled:opacity-50">
                    <Plus size={14} /> Ajouter
                  </button>
                </div>
                <div className="space-y-2">
                  {slots.map((slot, i) => (
                    <div key={i} className="flex items-center gap-2 p-3 rounded-xl border border-outline-variant/40 bg-surface/40">
                      <select value={slot.day} onChange={(e) => updateSlot(i, { day: Number(e.target.value) })}
                        className="h-9 px-2 rounded-lg border border-outline-variant bg-white text-sm font-semibold text-on-surface focus:outline-none focus:border-primary">
                        {DAYS.map((d, idx) => <option key={idx} value={idx}>{d}</option>)}
                      </select>
                      <input type="time" value={slot.start} onChange={(e) => updateSlot(i, { start: e.target.value })}
                        className="h-9 px-2 rounded-lg border border-outline-variant bg-white text-sm text-on-surface focus:outline-none focus:border-primary" />
                      <span className="text-on-surface-variant font-bold">→</span>
                      <input type="time" value={slot.end} onChange={(e) => updateSlot(i, { end: e.target.value })}
                        className="h-9 px-2 rounded-lg border border-outline-variant bg-white text-sm text-on-surface focus:outline-none focus:border-primary" />
                      <button type="button" onClick={() => removeSlot(i)} disabled={slots.length <= 1}
                        className="ml-auto h-9 w-9 inline-flex items-center justify-center rounded-lg border border-outline-variant bg-white text-red-600 hover:bg-red-50 disabled:opacity-50">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              {computed && (
                <div className="rounded-xl bg-surface-container/60 border border-outline-variant/30 p-4 space-y-1 text-sm">
                  <p className="font-bold text-on-surface">Nombre de séances estimé : <span className="text-primary">{computed.totalSessions}</span> séances de 3h</p>
                  {computed.endDate && <p className="text-on-surface-variant font-semibold">Fin estimée : <span className="text-on-surface">{computed.endDate}</span></p>}
                </div>
              )}
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h2 className="text-xl font-bold text-on-surface">Étape 3 — Capacité & Validation</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">Places maximum</label>
                <input type="number" min={2} max={20} value={maxStudents} onChange={(e) => setMaxStudents(Number(e.target.value))}
                  className="w-full h-10 px-3 rounded-lg border border-outline-variant bg-surface text-sm font-semibold text-on-surface focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">Minimum pour confirmer</label>
                <input type="number" min={2} value={minStudents} onChange={(e) => setMinStudents(Number(e.target.value))}
                  className="w-full h-10 px-3 rounded-lg border border-outline-variant bg-surface text-sm font-semibold text-on-surface focus:outline-none focus:border-primary" />
              </div>
            </div>
            <div className="rounded-xl bg-surface-container/60 border border-outline-variant/30 p-4 space-y-2 text-sm mt-4">
              <h3 className="font-bold text-on-surface text-base mb-2">Récapitulatif</h3>
              <Row k="Parcours" v={selectedJourney?.title || "—"} />
              <Row k="Intensité" v={INTENSITY.find((i) => i.v === intensity)?.l || intensity} />
              <Row k="Démarrage" v={startDate ? new Date(startDate).toLocaleDateString("fr-FR") : "—"} />
              <Row k="Créneaux" v={slots.map((s) => `${DAYS[s.day]} ${s.start}-${s.end}`).join(" · ")} />
              <Row k="Séances estimées" v={computed ? `${computed.totalSessions}` : "—"} />
              <Row k="Places" v={`${maxStudents} (min ${minStudents})`} />
            </div>
          </>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-outline-variant/20">
          <button type="button" onClick={() => setStep(step - 1)} disabled={step === 1}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-outline-variant bg-white px-4 text-sm font-bold text-on-surface shadow-sm hover:bg-surface-container disabled:opacity-50">
            <ArrowLeft size={16} /> Précédent
          </button>
          {step < 3 ? (
            <button type="button" onClick={() => setStep(step + 1)}
              disabled={(step === 1 && !canNext1) || (step === 2 && !canNext2)}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-on-primary shadow-sm hover:opacity-90 disabled:opacity-50">
              Suivant <ArrowRight size={16} />
            </button>
          ) : (
            <button type="button" onClick={handleSubmit} disabled={submitting}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-on-primary shadow-sm hover:opacity-90 disabled:opacity-60">
              {submitting ? "Création..." : "Créer la cohorte"}
            </button>
          )}
        </div>
      </section>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">{k}</span>
      <span className="font-semibold text-on-surface text-right">{v}</span>
    </div>
  );
}
