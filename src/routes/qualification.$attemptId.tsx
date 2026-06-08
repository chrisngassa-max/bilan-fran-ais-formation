import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { FormEvent, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Loader2,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/bff/Button";
import { Stepper } from "@/components/Stepper";
import { type NiveauIndicatif } from "@/types/bilan";
import { getRecommendedJourneyFromList, useFormationOffers } from "@/hooks/useFormationOffers";

export const Route = createFileRoute("/qualification/$attemptId")({
  component: QualificationPage,
});

type QualificationForm = {
  firstName: string;
  lastName: string;
  email: string;
  whatsapp: string;
  birthDate: string;
  nationality: string;
  addressLine1: string;
  postalCode: string;
  city: string;
  professionalStatus: string;
  sectorActivity: string;
  cpfStatus: string;
  cpfBalance: string;
  franceTravailRegistered: string;
  employerSupport: string;
  targetDate: string;
  notes: string;
  consentTraining: boolean;
  consentPartner: boolean;
};

const initialForm: QualificationForm = {
  firstName: "",
  lastName: "",
  email: "",
  whatsapp: "",
  birthDate: "",
  nationality: "",
  addressLine1: "",
  postalCode: "",
  city: "",
  professionalStatus: "",
  sectorActivity: "",
  cpfStatus: "unknown",
  cpfBalance: "",
  franceTravailRegistered: "unknown",
  employerSupport: "unknown",
  targetDate: "",
  notes: "",
  consentTraining: false,
  consentPartner: false,
};

function QualificationPage() {
  const { attemptId } = Route.useParams();
  const { data: journeys, isLoading: journeysLoading } = useFormationOffers();
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: testResult, isLoading: loadingTest } = useQuery({
    queryKey: ["placement-result-qualification", attemptId],
    queryFn: async () => {
      const { data, error: queryError } = await supabase
        .from("placement_test_results")
        .select("*, placement_test_attempts(*)")
        .eq("attempt_id", attemptId)
        .single();

      if (queryError) throw queryError;
      return data;
    },
  });

  const journey = useMemo(() => {
    const level: NiveauIndicatif = (testResult?.global_level as NiveauIndicatif) || "A2";
    return getRecommendedJourneyFromList(journeys || [], level);
  }, [journeys, testResult?.global_level]);

  const setField = <K extends keyof QualificationForm>(
    key: K,
    value: QualificationForm[K],
  ) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!form.firstName.trim() || !form.lastName.trim()) {
      setError("Le nom et le prenom sont obligatoires.");
      return;
    }

    if (!form.email.trim() && !form.whatsapp.trim()) {
      setError("Renseignez un email ou un numero WhatsApp.");
      return;
    }

    if (!form.professionalStatus || !form.consentTraining) {
      setError("Completez votre situation et le consentement requis.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/capture-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: "qualification_post_bilan",
          tunnel: "T4_financement_post_bilan",
          lead_intent: "training_financing",
          first_name: form.firstName.trim(),
          last_name: form.lastName.trim(),
          email: form.email.trim() || undefined,
          whatsapp_phone: form.whatsapp.trim() || undefined,
          estimated_level: testResult?.global_level || undefined,
          attempt_id: attemptId,
          consent_training: form.consentTraining,
          consent_partner: form.consentPartner,
          financement_opt_in: true,
          message: form.notes.trim() || undefined,
          flags: testResult?.flags || undefined,
          reliability_by_level: testResult?.reliability_by_level || undefined,
          time_metrics: testResult?.time_metrics || testResult?.time_spent_by_level || undefined,
          funding_profile: {
            origin: "post_bilan",
            birth_date: form.birthDate || null,
            nationality: form.nationality.trim() || null,
            address_line1: form.addressLine1.trim() || null,
            postal_code: form.postalCode.trim() || null,
            city: form.city.trim() || null,
            professional_status: form.professionalStatus,
            sector_activity: form.professionalStatus === "salarie" ? form.sectorActivity.trim() || null : null,
            cpf_status: form.cpfStatus,
            cpf_balance_declared: form.cpfBalance ? Number(form.cpfBalance) : null,
            france_travail_registered: form.franceTravailRegistered,
            employer_support: form.employerSupport,
            target_date: form.targetDate || null,
            recommended_journey: {
              id: journey.id,
              name: journey.name,
              hours: journey.hours,
              exam_target: journey.examTarget,
              public_price: journey.publicPrice,
            },
          },
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Envoi impossible.");

      setSuccess(true);
    } catch (submitError: any) {
      setError(submitError?.message || "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  if (loadingTest || journeysLoading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center p-10 text-center">
        <Loader2 className="mb-4 h-9 w-9 animate-spin text-primary" />
        <p className="font-bold text-on-surface">Chargement de votre bilan...</p>
      </div>
    );
  }

  if (!testResult) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center p-10 text-center">
        <AlertCircle className="mb-4 h-10 w-10 text-error" />
        <p className="text-lg font-bold text-on-surface">Bilan introuvable.</p>
        <Link to="/passer-test/latest" className="mt-4 font-bold text-primary hover:underline">
          Repasser le test
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-14">
        <div className="rounded-3xl border border-primary/30 bg-primary-container/10 p-8 text-center shadow-sm md:p-10">
          <CheckCircle2 className="mx-auto h-16 w-16 text-primary" />
          <h1 className="mt-5 text-3xl font-black text-on-surface">Demande financement recue</h1>
          <p className="mt-3 text-on-surface-variant">
            Votre bilan et votre profil de financement sont maintenant relies.
            Nous pourrons verifier les pistes pertinentes avant toute demande de
            document.
          </p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              to="/formations"
              className="inline-flex h-12 items-center justify-center rounded-lg bg-primary px-5 font-bold text-on-primary"
            >
              Voir les formations
            </Link>
            <Link
              to="/contact"
              className="inline-flex h-12 items-center justify-center rounded-lg border border-outline-variant px-5 font-bold text-on-surface"
            >
              Echanger avec nous
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-5xl space-y-6">
        <Stepper currentStep={3} />

        <section className="grid gap-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-[1fr_320px] md:p-8">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-black uppercase text-primary">
              <ClipboardCheck className="h-4 w-4" />
              Etape financement
            </div>
            <h1 className="text-3xl font-black text-slate-900">
              Prequalifier votre financement
            </h1>
            <p className="mt-3 max-w-2xl text-slate-600">
              Votre bilan nous donne deja une base pedagogique. Completez votre
              profil de financement pour relier votre besoin au bon parcours.
            </p>
          </div>

          <aside className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
            <p className="text-xs font-black uppercase text-primary">Parcours recommande</p>
            <h2 className="mt-2 text-2xl font-black text-slate-900">{journey.name}</h2>
            <p className="mt-1 text-sm font-semibold text-slate-600">
              Niveau estime {testResult.global_level || "a verifier"} - {journey.hours}h - {journey.examTarget}
            </p>
            <p className="mt-4 text-sm text-slate-700">{journey.objective}</p>
            <p className="mt-4 text-2xl font-black text-slate-900">{journey.publicPrice} EUR</p>
          </aside>
        </section>

        <form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <section className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            <fieldset className="space-y-4">
              <legend className="text-xl font-black text-slate-900">1. Coordonnees</legend>
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField label="Prenom" value={form.firstName} onChange={(value) => setField("firstName", value)} required />
                <TextField label="Nom" value={form.lastName} onChange={(value) => setField("lastName", value)} required />
                <TextField label="Email" type="email" value={form.email} onChange={(value) => setField("email", value)} />
                <TextField label="WhatsApp" type="tel" value={form.whatsapp} onChange={(value) => setField("whatsapp", value)} />
              </div>
            </fieldset>

            <fieldset className="space-y-4">
              <legend className="text-xl font-black text-slate-900">2. Situation financement</legend>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-bold text-slate-900">Identite utile au dossier</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-600">
                  Facultatif maintenant : ces informations aident a preparer une prequalification plus complete.
                </p>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <TextField label="Date de naissance" type="date" value={form.birthDate} onChange={(value) => setField("birthDate", value)} />
                  <TextField label="Nationalite" value={form.nationality} onChange={(value) => setField("nationality", value)} />
                  <div className="sm:col-span-2">
                    <TextField label="Adresse" value={form.addressLine1} onChange={(value) => setField("addressLine1", value)} />
                  </div>
                  <TextField label="Code postal" value={form.postalCode} onChange={(value) => setField("postalCode", value)} />
                  <TextField label="Ville" value={form.city} onChange={(value) => setField("city", value)} />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <SelectField
                  label="Situation professionnelle"
                  value={form.professionalStatus}
                  onChange={(value) => setField("professionalStatus", value)}
                  options={[
                    ["", "Choisir"],
                    ["salarie", "Salarie"],
                    ["independant", "Independant"],
                    ["demandeur_emploi", "Demandeur d'emploi"],
                    ["etudiant", "Etudiant"],
                    ["sans_activite", "Sans activite"],
                    ["autre", "Autre"],
                  ]}
                  required
                />
                <SelectField
                  label="Compte CPF"
                  value={form.cpfStatus}
                  onChange={(value) => setField("cpfStatus", value)}
                  options={[
                    ["yes", "Oui"],
                    ["no", "Non"],
                    ["unknown", "Je ne sais pas"],
                  ]}
                />
                {form.professionalStatus === "salarie" ? (
                  <TextField
                    label="Secteur d'activite"
                    value={form.sectorActivity}
                    onChange={(value) => setField("sectorActivity", value)}
                  />
                ) : null}
                <TextField
                  label="Solde CPF connu"
                  type="number"
                  value={form.cpfBalance}
                  onChange={(value) => setField("cpfBalance", value)}
                />
                <SelectField
                  label="Inscrit France Travail"
                  value={form.franceTravailRegistered}
                  onChange={(value) => setField("franceTravailRegistered", value)}
                  options={[
                    ["yes", "Oui"],
                    ["no", "Non"],
                    ["unknown", "Je ne sais pas"],
                  ]}
                />
                <SelectField
                  label="Soutien employeur"
                  value={form.employerSupport}
                  onChange={(value) => setField("employerSupport", value)}
                  options={[
                    ["yes", "Oui"],
                    ["no", "Non"],
                    ["unknown", "Je ne sais pas"],
                  ]}
                />
                <TextField
                  label="Date cible"
                  type="date"
                  value={form.targetDate}
                  onChange={(value) => setField("targetDate", value)}
                />
              </div>
              <TextAreaField
                label="Precision utile"
                value={form.notes}
                onChange={(value) => setField("notes", value)}
                placeholder="Ex : disponibilites, urgence, financeur deja contacte..."
              />
            </fieldset>
          </section>

          <aside className="space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="flex items-center gap-2 text-lg font-black text-slate-900">
                <ShieldCheck className="h-5 w-5 text-primary" />
                Consentements
              </h2>
              <label className="mt-4 flex cursor-pointer items-start gap-3 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={form.consentTraining}
                  onChange={(event) => setField("consentTraining", event.target.checked)}
                  className="mt-1 h-5 w-5 accent-primary"
                />
                <span>
                  J'accepte d'etre recontacte pour ma formation et l'etude de mes pistes de financement.
                  <strong className="text-primary"> *</strong>
                </span>
              </label>
              <label className="mt-4 flex cursor-pointer items-start gap-3 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={form.consentPartner}
                  onChange={(event) => setField("consentPartner", event.target.checked)}
                  className="mt-1 h-5 w-5 accent-primary"
                />
                <span>
                  J'accepte que notre partenaire financement recoive mon profil si l'etude de mes droits le necessite.
                </span>
              </label>
            </div>

            <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-950">
              Aucun upload de document ici. Nous verifions d'abord votre profil,
              puis les pieces utiles seront precisees au bon moment.
            </div>

            {error ? (
              <p className="rounded-2xl border border-error/30 bg-error-container/20 p-4 text-sm text-error">
                {error}
              </p>
            ) : null}

            <Button
              type="submit"
              disabled={loading}
              className="flex h-16 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-lg font-black text-on-primary"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Wallet className="h-5 w-5" />}
              Envoyer mon profil
              {!loading ? <ArrowRight className="h-5 w-5" /> : null}
            </Button>

            <p className="text-xs leading-relaxed text-slate-500">
              Les montants et dispositifs restent soumis a validation par les
              organismes financeurs concernes.
            </p>
          </aside>
        </form>
      </div>
    </main>
  );
}

function TextField({
  label,
  type = "text",
  value,
  onChange,
  required,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <label className="block text-sm font-bold text-slate-900">
      {label} {required ? <span className="text-primary">*</span> : null}
      <input
        type={type}
        value={value}
        required={required}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-base font-semibold text-slate-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<[string, string]>;
  required?: boolean;
}) {
  return (
    <label className="block text-sm font-bold text-slate-900">
      {label} {required ? <span className="text-primary">*</span> : null}
      <select
        value={value}
        required={required}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-base font-semibold text-slate-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
      >
        {options.map(([valueOption, labelOption]) => (
          <option key={valueOption} value={valueOption}>
            {labelOption}
          </option>
        ))}
      </select>
    </label>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="block text-sm font-bold text-slate-900">
      {label}
      <textarea
        rows={3}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-base font-semibold text-slate-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
    </label>
  );
}
