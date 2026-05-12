import { createFileRoute } from "@tanstack/react-router";
import { contactInfo, siteName, siteUrl } from "@/config/site";

export const Route = createFileRoute("/mentions-legales")({
  head: () => ({
    meta: [
      { title: `Mentions légales — ${siteName}` },
      {
        name: "description",
        content: `Mentions légales du site ${siteName}.`,
      },
      { property: "og:title", content: `Mentions légales — ${siteName}` },
      { property: "og:url", content: siteUrl + "/mentions-legales" },
    ],
  }),
  component: MentionsPage,
});

function MentionsPage() {
  return (
    <article className="prose-bff mx-auto max-w-3xl px-4 py-10 body-lg">
      <h1 className="headline-lg">Mentions légales</h1>

      <h2 className="headline-md mt-8">Éditeur</h2>
      <p>
        {siteName} — TODO : raison sociale, adresse, numéro RCS / SIRET, représentant
        légal.
      </p>

      <h2 className="headline-md mt-8">Hébergeur</h2>
      <p>TODO : Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, USA. (à confirmer)</p>

      <h2 className="headline-md mt-8">Contact</h2>
      <p>
        Email : {contactInfo.email}
        <br />
        Téléphone : {contactInfo.phone}
      </p>

      <h2 className="headline-md mt-8">Propriété intellectuelle</h2>
      <p>
        L'ensemble du contenu de ce site (textes, illustrations, logos) est protégé par
        le droit de la propriété intellectuelle.
      </p>
    </article>
  );
}
