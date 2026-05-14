import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { Card } from "@/components/bff/Card";
import { Button } from "@/components/bff/Button";
import { Disclaimer } from "@/components/bff/Disclaimer";
import {
  SIMULATION_STORAGE_KEY,
  type AdminGoal,
  type EstimatedLevel,
  type FundingRoute,
  type PublicSimulationResult,
  type TargetLevel,
} from "@/shared/simulationResult";
import { siteName, siteUrl, waHref } from "@/config/site";
import { trackEvent } from "@/lib/analytics";

export const Route = createFileRoute("/resultat")({
  head: () => ({
    meta: [
      { title: `Votre résultat — ${siteName}` },
      {
        name: "description",
        content:
          "Résultat de votre estimation de niveau de français et formulaire pour recevoir votre bilan personnalisé.",
      },
      { property: "og:title", content: `Votre résultat — ${siteName}` },
      {
        property: "og:description",
        content: "Estimation de niveau, parcours conseillé et formulaire de contact.",
      },
      { property: "og:url", content: siteUrl + "/resultat" },
    ],
  }),
  component: ResultPage,
});

const ADMIN_GOAL_LABEL: Record<AdminGoal, string> = {
  carte_pluriannuelle: "Carte de séjour pluriannuelle",
  carte_resident: "Carte de résident 10 ans",
  naturalisation: "Naturalisation",
  travail: "Emploi / français professionnel",
  vie_quotidienne: "Vie quotidienne",
  preparation_tcf: "Préparation TCF",
  remise_a_niveau: "Remise à niveau",
  unknown: "Non précisé",
};

const FUNDING_LABEL: Record<FundingRoute, string> = {
  Personnel: "Financement personnel",
  Employeur: "Employeur",
  OPCO: "OPCO",
  FranceTravail: "France Travail",
  CPF: "CPF (selon éligibilité)",
  Partenaire: "Orientation partenaire",
};

function ResultPage() {
  const [result, setResult] = useState<PublicSimulationResult | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(SIMULATION_STORAGE_KEY);
      if (raw) setResult(JSON.parse(raw) as PublicSimulationResult);
    } catch {
      /* ignore */
    }
    setHydrated(true);
    trackEvent("result_viewed");
  }, []);

  if (!hydrated) return null;

  if (!result) {
    return (
      <div className="px-4 py-16 text-center">
        <div className="mx-auto max-w-md">
          <h1 className="headline-lg">Aucun résultat trouvé</h1>
          <p className="mt-3 body-md text-on-surface-variant">
            Faites le test pour obtenir votre estimation.
          </p>
          <div className="mt-6">
            <Link to="/simulateur">
              <Button variant="primary">Refaire le test</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <ResultContent result={result} />;
}

function ResultContent({ result }: { result: PublicSimulationResult }) {
  const profile = profileFor(result.estimatedLevel);

  const targetLabel = labelForTarget(result.targetLevel);

  const waText = useMemo(
    () =>
      `Bonjour, j'ai fait le simulateur Bilan Français Formation.\n` +
      `Niveau estimé : ${result.estimatedLevel}\n` +
      `Objectif : ${ADMIN_GOAL_LABEL[result.adminGoal]}\n` +
      `Niveau cible : ${targetLabel}\n` +
      `Je souhaite être contacté(e).`,
    [result, targetLabel]
  );

  return (
    <div className="px-4 py-10">
      <div className="mx-auto max-w-3xl space-y-6">
        <header className="text-center">
          <p className="label-caps text-secondary">Votre estimation</p>
          <h1 className="headline-lg mt-2">Voici votre bilan</h1>
        </header>

        <Card>
          <div className="flex flex-wrap items-center gap-3">
            <LevelBadge level={result.estimatedLevel} />
            <span className="body-md text-on-surface-variant">→ Niveau cible :</span>
            <span className="rounded-full bg-secondary-container px-3 py-1 font-semibold text-secondary">
              {targetLabel}
            </span>
          </div>
          <p className="mt-4 body-lg">{profile.summary}</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div>
              <h3 className="label-caps text-on-surface-variant">Compétences probables</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 body-md">
                {profile.strengths.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="label-caps text-on-surface-variant">Points à travailler</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 body-md">
                {profile.weaknesses.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="headline-md">Parcours conseillé</h2>
          <p className="mt-2 body-md text-on-surface-variant">{profile.path}</p>
          <ul className="mt-4 grid gap-2 body-md">
            <li>
              <strong>Objectif :</strong> {ADMIN_GOAL_LABEL[result.adminGoal]}
            </li>
            <li>
              <strong>Disponibilités :</strong>{" "}
              {result.availability.length
                ? result.availability.join(", ")
                : "Non précisées"}
            </li>
            <li>
              <strong>Format préféré :</strong>{" "}
              {result.formatPreference === "en_ligne"
                ? "En ligne"
                : result.formatPreference === "presentiel"
                  ? "Présentiel"
                  : "Les deux"}
            </li>
          </ul>
        </Card>

        <Card>
          <h2 className="headline-md">Solutions de financement possibles</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {result.fundingRoutes.map((f) => (
              <li
                key={f}
                className="rounded-full border border-outline-variant bg-surface-container px-3 py-1 body-md text-on-surface"
              >
                {FUNDING_LABEL[f]}
              </li>
            ))}
          </ul>
          <p className="mt-3 body-md text-on-surface-variant">
            Les options exactes dépendent de votre situation et seront étudiées avec
            vous lors d'un échange.
          </p>
        </Card>

        <Disclaimer>
          Ce résultat est une estimation. Un échange avec un conseiller permet de
          confirmer le parcours adapté.
        </Disclaimer>

        <div className="flex flex-wrap gap-3">
          <a
            href={waHref(waText)}
            target="_blank"
            rel="noreferrer"
            onClick={() => trackEvent("whatsapp_clicked", { from: "result" })}
          >
            <Button variant="secondary">Envoyer par WhatsApp</Button>
          </a>
          <Link to="/simulateur">
            <Button variant="outline">Refaire le test</Button>
          </Link>
        </div>

        <ContactForm result={result} />
      </div>
    </div>
  );
}

function LevelBadge({ level }: { level: EstimatedLevel }) {
  return (
    <span className="rounded-full bg-primary px-4 py-1 text-on-primary font-semibold">
      Niveau {level}
    </span>
  );
}

function labelForTarget(t: TargetLevel): string {
  if (t === "diagnostic_required") return "À déterminer (diagnostic)";
  if (t === "not_required") return "Non requis";
  return t;
}

function profileFor(level: EstimatedLevel) {
  switch (level) {
    case "A0":
      return {
        summary: "Vous débutez en français. Un parcours d'alphabétisation est conseillé.",
        strengths: ["Motivation", "Quelques mots de base"],
        weaknesses: ["Compréhension globale", "Lecture", "Écriture"],
        path: "Démarrage progressif sur les bases : alphabet, sons, vocabulaire du quotidien. Compter 60 à 100h pour atteindre A1.",
      };
    case "A1":
      return {
        summary: "Vous avez les premières bases. Un parcours débutant structuré vous fera progresser rapidement.",
        strengths: ["Phrases simples", "Vocabulaire de base"],
        weaknesses: ["Conjugaisons", "Compréhension orale rapide"],
        path: "Consolidation A1 puis passage à A2. Compter 40 à 70h pour passer de A1 à A2.",
      };
    case "A2":
      return {
        summary: "Vous tenez une conversation simple. Vous pouvez viser un B1 dans un délai raisonnable.",
        strengths: ["Vie quotidienne", "Mails simples"],
        weaknesses: ["Temps complexes", "Vocabulaire administratif"],
        path: "Consolidation A2 et préparation au B1. Compter 60 à 100h pour passer de A2 à B1.",
      };
    case "B1":
      return {
        summary: "Vous êtes autonome dans la plupart des situations. Un B2 est atteignable avec un travail ciblé.",
        strengths: ["Discussions du quotidien", "Récits structurés"],
        weaknesses: ["Argumentation", "Vocabulaire soutenu"],
        path: "Préparation au B2 ciblée. Compter 80 à 120h pour passer de B1 à B2.",
      };
    case "B2":
      return {
        summary: "Vous avez un niveau autonome avancé. Un travail de polissage suffit selon votre objectif.",
        strengths: ["Argumentation", "Compréhension de médias"],
        weaknesses: ["Registres soutenus", "Précision écrite"],
        path: "Préparation finale et entraînement aux épreuves visées (TCF, naturalisation).",
      };
    default:
      return {
        summary: "Estimation indisponible.",
        strengths: [],
        weaknesses: [],
        path: "Un échange permettra d'établir un diagnostic précis.",
      };
  }
}

const contactSchema = z.object({
  firstName: z.string().trim().min(1, "Prénom requis").max(80),
  lastName: z.string().trim().max(80).optional().or(z.literal("")),
  email: z.string().trim().email("Email invalide").max(255),
  phone: z.string().trim().min(6, "Téléphone requis").max(30),
  city: z.string().trim().max(120).optional().or(z.literal("")),
  message: z.string().trim().max(1000).optional().or(z.literal("")),
  consent: z.literal(true, {
    errorMap: () => ({ message: "Le consentement est requis" }),
  }),
});

function ContactForm({ result }: { result: PublicSimulationResult }) {
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const raw = {
      firstName: String(fd.get("firstName") || ""),
      lastName: String(fd.get("lastName") || ""),
      email: String(fd.get("email") || ""),
      phone: String(fd.get("phone") || ""),
      city: String(fd.get("city") || ""),
      message: String(fd.get("message") || ""),
      consent: fd.get("consent") === "on",
    };
    const parsed = contactSchema.safeParse(raw);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        errs[issue.path.join(".")] = issue.message;
      }
      setErrors(errs);
      return;
    }
    setErrors({});

    const payload: PublicSimulationResult = {
      ...result,
      contact: {
        firstName: parsed.data.firstName,
        lastName: parsed.data.lastName || undefined,
        email: parsed.data.email,
        phone: parsed.data.phone,
        city: parsed.data.city || undefined,
        message: parsed.data.message || undefined,
        consent: true,
        consentDate: new Date().toISOString(),
      },
    };

    // eslint-disable-next-line no-console
    console.log("[BFF contact payload]", payload);
    /* TODO: envoyer ce payload vers Brevo via une serverless function
       (Cloudflare Workers function /functions/brevo-contact.ts).
       La clé API Brevo reste côté serveur, JAMAIS dans le frontend.
       Endpoint Brevo cible : POST /v3/contacts (upsert) + POST /v3/events.
       Mapping attributs : OBJECTIF, NIVEAU_CIBLE, NIVEAU_ESTIME,
       SCORE_PRIORITE, STATUT_COMMERCIAL, FINANCEMENTS, URGENCE,
       SOURCE_PAGE, UTM_SOURCE, UTM_CAMPAIGN, CONSENT_DATE. */

    trackEvent("contact_form_submitted", {
      level: result.estimatedLevel,
      goal: result.adminGoal,
    });

    setSubmitted(true);
  };

  if (submitted) {
    return (
      <Card>
        <h2 className="headline-md">Demande reçue</h2>
        <p className="mt-2 body-md text-on-surface-variant">
          Merci, nous vous recontactons rapidement pour étudier votre dossier.
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <h2 className="headline-md">Recevoir mon bilan</h2>
      <p className="mt-1 body-md text-on-surface-variant">
        Laissez vos coordonnées, nous revenons vers vous avec une orientation
        personnalisée.
      </p>
      <form className="mt-6 grid gap-4" onSubmit={onSubmit} noValidate>
        <Field name="firstName" label="Prénom" required error={errors.firstName} />
        <Field name="lastName" label="Nom" />
        <Field name="email" label="Email" type="email" required error={errors.email} />
        <Field name="phone" label="Téléphone" type="tel" required error={errors.phone} />
        <Field name="city" label="Ville" />
        <Field name="message" label="Message (optionnel)" textarea />

        <label className="flex items-start gap-3 body-md">
          <input
            type="checkbox"
            name="consent"
            className="mt-1 h-5 w-5 rounded border-outline accent-primary"
          />
          <span>
            J'accepte d'être contacté(e) au sujet de ma demande de formation.
            <span className="text-primary"> *</span>
          </span>
        </label>
        {errors.consent && (
          <p className="body-md text-destructive">{errors.consent}</p>
        )}

        <Button variant="primary" type="submit">
          Envoyer ma demande
        </Button>
      </form>
    </Card>
  );
}

function Field({
  name,
  label,
  type = "text",
  required,
  textarea,
  error,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  textarea?: boolean;
  error?: string;
}) {
  const id = `f-${name}`;
  const errId = `${id}-err`;
  const cls =
    "min-h-14 w-full rounded-lg border border-outline-variant bg-surface-bright px-4 py-3 body-md text-on-surface focus:border-primary";
  return (
    <div>
      <label htmlFor={id} className="block label-caps text-on-surface-variant">
        {label} {required && <span className="text-primary">*</span>}
      </label>
      {textarea ? (
        <textarea
          id={id}
          name={name}
          rows={4}
          className={cls + " min-h-28"}
          aria-describedby={error ? errId : undefined}
          aria-invalid={Boolean(error)}
        />
      ) : (
        <input
          id={id}
          name={name}
          type={type}
          required={required}
          className={cls}
          aria-describedby={error ? errId : undefined}
          aria-invalid={Boolean(error)}
        />
      )}
      {error && (
        <p id={errId} className="mt-1 body-md text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
