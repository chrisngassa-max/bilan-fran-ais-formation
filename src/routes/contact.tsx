import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { Card } from "@/components/bff/Card";
import { Button } from "@/components/bff/Button";
import { contactInfo, mailHref, phoneHref, siteName, siteUrl, waHref } from "@/config/site";
import { trackEvent } from "@/lib/analytics";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: `Contact — ${siteName}` },
      {
        name: "description",
        content:
          "Contactez l'équipe Bilan Français Formation pour étudier votre projet : certifications officielles, démarches administratives, français professionnel.",
      },
      { property: "og:title", content: `Contact — ${siteName}` },
      {
        property: "og:description",
        content: "Échangeons sur votre projet de formation en français.",
      },
      { property: "og:url", content: siteUrl + "/contact" },
    ],
  }),
  component: ContactPage,
});

const schema = z.object({
  firstName: z.string().trim().min(1, "Prénom requis").max(80),
  lastName: z.string().trim().max(80).optional().or(z.literal("")),
  email: z.string().trim().email("Email invalide").max(255),
  phone: z.string().trim().min(6, "Téléphone requis").max(30),
  city: z.string().trim().max(120).optional().or(z.literal("")),
  goal: z.string().trim().max(120).optional().or(z.literal("")),
  message: z.string().trim().max(1000).optional().or(z.literal("")),
  consent: z.literal(true, {
    errorMap: () => ({ message: "Le consentement est requis" }),
  }),
});

function ContactPage() {
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
      goal: String(fd.get("goal") || ""),
      message: String(fd.get("message") || ""),
      consent: fd.get("consent") === "on",
    };
    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      for (const issue of parsed.error.issues) errs[issue.path.join(".")] = issue.message;
      setErrors(errs);
      return;
    }
    setErrors({});
    const payload = {
      ...parsed.data,
      consentDate: new Date().toISOString(),
      source: { page: "/contact" },
    };
    // eslint-disable-next-line no-console
    console.log("[BFF contact payload]", payload);
    /* TODO: envoyer ce payload vers Brevo via une serverless function
       (Cloudflare Workers function /functions/brevo-contact.ts).
       La clé API Brevo reste côté serveur, JAMAIS dans le frontend. */
    trackEvent("contact_form_submitted", { from: "contact_page" });
    setSubmitted(true);
  };

  return (
    <div className="px-4 py-10">
      <div className="mx-auto max-w-2xl space-y-6">
        <header className="text-center">
          <h1 className="headline-lg">Échangez avec notre équipe</h1>
          <p className="mt-3 body-lg text-on-surface-variant">
            Vous avez un doute sur votre niveau ou sur les financements possibles ? Laissez-nous vos coordonnées, notre équipe vous répond sous 24h pour faire le point.
          </p>
        </header>

        <Card>
          <h2 className="headline-md">Nous joindre directement</h2>
          <ul className="mt-3 grid gap-2 body-md">
            <li>
              <a
                href={phoneHref}
                onClick={() => trackEvent("phone_clicked", { from: "contact_page" })}
                className="text-primary hover:underline"
              >
                Téléphone : {contactInfo.phone}
              </a>
            </li>
            <li>
              <a href={mailHref} className="text-primary hover:underline">
                Email : {contactInfo.email}
              </a>
            </li>
            <li>
              <a
                href={waHref()}
                target="_blank"
                rel="noreferrer"
                onClick={() => trackEvent("whatsapp_clicked", { from: "contact_page" })}
                className="text-primary hover:underline"
              >
                WhatsApp
              </a>
            </li>
          </ul>
        </Card>

        {submitted ? (
          <Card>
            <h2 className="headline-md">Demande reçue</h2>
            <p className="mt-2 body-md text-on-surface-variant">
              Merci, nous vous recontactons rapidement.
            </p>
          </Card>
        ) : (
          <Card>
            <h2 className="headline-md">Nous contacter</h2>
            <p className="mt-1 body-md text-on-surface-variant">
              Laissez-nous un message, c'est sans engagement.
            </p>
            <form className="mt-6 grid gap-4" onSubmit={onSubmit} noValidate>
              <F name="firstName" label="Prénom" required error={errors.firstName} />
              <F name="lastName" label="Nom" />
              <F name="email" label="Email" type="email" required error={errors.email} />
              <F name="phone" label="Téléphone" type="tel" required error={errors.phone} />
              <F name="city" label="Ville" />
              <F name="goal" label="Votre objectif (en quelques mots)" />
              <F name="message" label="Message" textarea />

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
                Envoyer mon message
              </Button>
            </form>
          </Card>
        )}
      </div>
    </div>
  );
}

function F({
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
  const id = `cf-${name}`;
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
