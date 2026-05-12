import { createFileRoute } from "@tanstack/react-router";
import { contactInfo, siteName, siteUrl } from "@/config/site";

export const Route = createFileRoute("/confidentialite")({
  head: () => ({
    meta: [
      { title: `Politique de confidentialité — ${siteName}` },
      {
        name: "description",
        content: `Politique de confidentialité et données personnelles — ${siteName}.`,
      },
      { property: "og:title", content: `Confidentialité — ${siteName}` },
      { property: "og:url", content: siteUrl + "/confidentialite" },
    ],
  }),
  component: ConfPage,
});

function ConfPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-10 body-lg space-y-6">
      <h1 className="headline-lg">Politique de confidentialité</h1>

      <section>
        <h2 className="headline-md">Finalités du traitement</h2>
        <p>
          Vos données sont collectées pour répondre à votre demande de bilan, vous
          orienter vers la formation adaptée et vous recontacter.
        </p>
      </section>

      <section>
        <h2 className="headline-md">Données collectées</h2>
        <p>
          Prénom, nom, email, téléphone, ville, objectif, niveau estimé,
          disponibilités, message libre. Les données minimales nécessaires (principe
          de minimisation CNIL) sont collectées.
        </p>
      </section>

      <section>
        <h2 className="headline-md">Durée de conservation</h2>
        <p>
          Vos données sont conservées 3 ans après le dernier contact, puis supprimées
          ou archivées de manière sécurisée.
        </p>
      </section>

      <section>
        <h2 className="headline-md">Vos droits</h2>
        <p>
          Conformément au RGPD, vous disposez d'un droit d'accès, de rectification, de
          suppression, d'opposition et de portabilité de vos données.
        </p>
        <p className="mt-2">
          Pour exercer vos droits : <a className="text-primary underline" href={`mailto:${contactInfo.email}`}>{contactInfo.email}</a>
        </p>
      </section>

      <section>
        <h2 className="headline-md">Mesure d'audience</h2>
        <p>
          Nous utilisons (ou prévoyons d'utiliser) Plausible Analytics, solution
          cookie-less qui ne nécessite pas de bandeau de consentement.
        </p>
      </section>
    </article>
  );
}
