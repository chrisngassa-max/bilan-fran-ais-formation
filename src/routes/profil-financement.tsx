import { createFileRoute, Link } from "@tanstack/react-router";
import { FormEvent, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { siteName } from "@/config/site";

export const Route = createFileRoute("/profil-financement")({
  head: () => ({
    meta: [
      { title: `${siteName} - Profil financement` },
      {
        name: "description",
        content:
          "Partagez votre profil pour verifier les pistes de financement possibles pour votre formation de francais.",
      },
    ],
  }),
  component: ProfilFinancementPage,
});

type FundingForm = {
  firstName: string;
  lastName: string;
  email: string;
  whatsapp: string;
  birthDate: string;
  nationality: string;
  addressLine1: string;
  postalCode: string;
  city: string;
  goal: string;
  professionalStatus: string;
  sectorActivity: string;
  cpfStatus: string;
  cpfBalance: string;
  franceTravailRegistered: string;
  employerSupport: string;
  targetDate: string;
  message: string;
  consentTraining: boolean;
  consentPartner: boolean;
};

const initialForm: FundingForm = {
  firstName: "",
  lastName: "",
  email: "",
  whatsapp: "",
  birthDate: "",
  nationality: "",
  addressLine1: "",
  postalCode: "",
  city: "",
  goal: "",
  professionalStatus: "",
  sectorActivity: "",
  cpfStatus: "unknown",
  cpfBalance: "",
  franceTravailRegistered: "unknown",
  employerSupport: "unknown",
  targetDate: "",
  message: "",
  consentTraining: false,
  consentPartner: false,
};

function ProfilFinancementPage() {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setField = <K extends keyof FundingForm>(key: K, value: FundingForm[K]) => {
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

    if (!form.goal || !form.professionalStatus || !form.consentTraining) {
      setError("Completez le besoin, la situation et le consentement requis.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/capture-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: "profil_financement",
          tunnel: "T4_financement",
          lead_intent: "training_financing",
          first_name: form.firstName.trim(),
          last_name: form.lastName.trim(),
          email: form.email.trim() || undefined,
          whatsapp_phone: form.whatsapp.trim() || undefined,
          partner_request_type: form.goal,
          consent_training: form.consentTraining,
          consent_partner: form.consentPartner,
          financement_opt_in: true,
          message: form.message.trim() || undefined,
          funding_profile: {
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

  if (success) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-16">
        <div className="rounded-2xl border border-primary/30 bg-primary-container/10 p-8 text-center shadow-sm">
          <CheckCircle2 className="mx-auto h-14 w-14 text-primary" />
          <h1 className="mt-4 text-3xl font-bold text-on-surface">Profil recu</h1>
          <p className="mt-3 text-on-surface-variant">
            {form.consentPartner
              ? "Votre profil peut maintenant etre qualifie avant un partage eventuel avec notre partenaire charge d'etudier le financement de votre formation."
              : "Nous avons les premieres informations utiles pour vous recontacter sur vos pistes de financement."}
            {" "}Aucun document sensible n'est demande a cette etape.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              to="/passer-test/latest"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-primary px-5 font-bold text-on-primary"
            >
              Passer mon test
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/formations"
              className="inline-flex h-12 items-center justify-center rounded-lg border border-outline-variant px-5 font-bold text-on-surface"
            >
              Voir les formations
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      <header className="mb-8 max-w-3xl">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary-container/20 px-3 py-1 text-xs font-bold uppercase text-primary">
          <ClipboardCheck className="h-4 w-4" />
          Financement
        </div>
        <h1 className="text-4xl font-bold text-on-surface">Verifier mon profil financement</h1>
        <p className="mt-3 text-lg text-on-surface-variant">
          Nous demandons uniquement le minimum utile pour vous orienter. Les
          pieces justificatives seront traitees plus tard si votre dossier le
          necessite.
        </p>
      </header>

      <form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <section className="space-y-6 rounded-2xl border border-outline-variant bg-surface-bright p-6 shadow-sm">
          <fieldset className="space-y-4">
            <legend className="text-xl font-bold text-on-surface">1. Vos coordonnees</legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField label="Prenom" value={form.firstName} onChange={(value) => setField("firstName", value)} required />
              <TextField label="Nom" value={form.lastName} onChange={(value) => setField("lastName", value)} required />
              <TextField label="Email" type="email" value={form.email} onChange={(value) => setField("email", value)} />
              <TextField label="WhatsApp" type="tel" value={form.whatsapp} onChange={(value) => setField("whatsapp", value)} />
            </div>
          </fieldset>

          <fieldset className="space-y-4">
            <legend className="text-xl font-bold text-on-surface">2. Votre besoin</legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <SelectField
                label="Objectif"
                value={form.goal}
                onChange={(value) => setField("goal", value)}
                options={[
                  ["", "Choisir"],
                  ["pluriannuelle", "Carte de sejour"],
                  ["resident_10ans", "Carte de resident"],
                  ["naturalisation", "Naturalisation"],
                  ["autre", "Autre objectif"],
                ]}
                required
              />
              <TextField label="Date cible" type="date" value={form.targetDate} onChange={(value) => setField("targetDate", value)} />
            </div>
          </fieldset>

          <fieldset className="space-y-4">
            <legend className="text-xl font-bold text-on-surface">3. Identite utile au dossier</legend>
            <p className="text-sm text-on-surface-variant">
              Ces champs restent facultatifs a ce stade. Ils facilitent la prequalification
              si vous souhaitez avancer plus vite ensuite.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField label="Date de naissance" type="date" value={form.birthDate} onChange={(value) => setField("birthDate", value)} />
              <TextField label="Nationalite" value={form.nationality} onChange={(value) => setField("nationality", value)} />
              <div className="sm:col-span-2">
                <TextField label="Adresse" value={form.addressLine1} onChange={(value) => setField("addressLine1", value)} placeholder="Numero et rue" />
              </div>
              <TextField label="Code postal" value={form.postalCode} onChange={(value) => setField("postalCode", value)} />
              <TextField label="Ville" value={form.city} onChange={(value) => setField("city", value)} />
            </div>
          </fieldset>

          <fieldset className="space-y-4">
            <legend className="text-xl font-bold text-on-surface">4. Pistes financement</legend>
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
                  placeholder="Ex : restauration, BTP, services"
                />
              ) : null}
              <TextField
                label="Solde CPF connu"
                type="number"
                value={form.cpfBalance}
                onChange={(value) => setField("cpfBalance", value)}
                placeholder="Facultatif"
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
            </div>
            <TextAreaField
              label="Precision utile"
              value={form.message}
              onChange={(value) => setField("message", value)}
              placeholder="Ex : examen dans 3 mois, besoin du soir, employeur interesse..."
            />
          </fieldset>
        </section>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-outline-variant bg-surface-bright p-5 shadow-sm">
            <h2 className="flex items-center gap-2 text-lg font-bold text-on-surface">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Consentements
            </h2>
            <label className="mt-4 flex cursor-pointer items-start gap-3 text-sm text-on-surface-variant">
              <input
                type="checkbox"
                checked={form.consentTraining}
                onChange={(event) => setField("consentTraining", event.target.checked)}
                className="mt-1 h-5 w-5 accent-primary"
              />
              <span>
                J'accepte d'etre recontacte au sujet de ma formation et de mes pistes de financement.
                <strong className="text-primary"> *</strong>
              </span>
            </label>
            <label className="mt-4 flex cursor-pointer items-start gap-3 text-sm text-on-surface-variant">
              <input
                type="checkbox"
                checked={form.consentPartner}
                onChange={(event) => setField("consentPartner", event.target.checked)}
                className="mt-1 h-5 w-5 accent-primary"
              />
              <span>
                J'accepte que mon profil soit partage avec notre partenaire financement si l'etude de mes droits le necessite.
              </span>
            </label>
            <p className="mt-4 text-xs text-on-surface-variant">
              Vous pouvez continuer sans transmission au partenaire financement si vous ne cochez pas la seconde case.
            </p>
          </div>

          <div className="rounded-2xl border border-secondary/20 bg-secondary-container p-5 text-sm text-on-secondary-container">
            Aucun upload de document a cette etape. Nous vous demanderons les pieces utiles seulement si votre parcours l'exige.
          </div>

          {error ? (
            <p className="rounded-xl border border-error/30 bg-error-container/20 p-4 text-sm text-error">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 text-lg font-bold text-on-primary shadow-md transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
            Envoyer mon profil
          </button>

          <p className="text-xs leading-relaxed text-on-surface-variant">
            Le financement reste soumis a l'etude de vos droits et a la decision des organismes concernes.
          </p>
        </aside>
      </form>
    </main>
  );
}

function TextField({
  label,
  type = "text",
  value,
  onChange,
  required,
  placeholder,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block text-sm font-bold text-on-surface">
      {label} {required ? <span className="text-primary">*</span> : null}
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        required={required}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 h-12 w-full rounded-lg border border-outline-variant bg-surface px-3 text-base font-medium text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
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
    <label className="block text-sm font-bold text-on-surface">
      {label} {required ? <span className="text-primary">*</span> : null}
      <select
        value={value}
        required={required}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 h-12 w-full rounded-lg border border-outline-variant bg-surface px-3 text-base font-medium text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
      >
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>
            {optionLabel}
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
    <label className="block text-sm font-bold text-on-surface">
      {label}
      <textarea
        rows={3}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-lg border border-outline-variant bg-surface px-3 py-3 text-base font-medium text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
      />
    </label>
  );
}
