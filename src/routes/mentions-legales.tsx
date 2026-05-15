import { createFileRoute } from "@tanstack/react-router";
import { siteName } from "@/config/site";

export const Route = createFileRoute("/mentions-legales")({
  head: () => ({
    meta: [{ title: `${siteName} — Mentions Légales` }],
  }),
  component: MentionsLegalesPage,
});

function MentionsLegalesPage() {
  return (
    <div className="min-h-screen bg-surface py-12 px-4">
      <div className="max-w-[800px] mx-auto bg-surface-bright p-8 md:p-12 rounded-xl shadow-sm border border-outline-variant">
        <h1 className="text-3xl font-bold mb-8 text-on-surface">Mentions Légales</h1>
        
        <div className="space-y-8 text-on-surface-variant leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-on-surface mb-3">1. Éditeur du site</h2>
            <p>
              Le site <strong>{siteName}</strong> est édité par la société [Nom de la Société], 
              [Forme juridique] au capital de [Montant] euros, immatriculée au Registre du Commerce et des Sociétés 
              de [Ville] sous le numéro [Numéro SIREN].
            </p>
            <p className="mt-2">
              <strong>Siège social :</strong> [Adresse complète]<br />
              <strong>Numéro de TVA intracommunautaire :</strong> [Numéro TVA]<br />
              <strong>Directeur de la publication :</strong> [Nom du directeur]
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-on-surface mb-3">2. Hébergement</h2>
            <p>
              Ce site est hébergé par Vercel Inc.<br />
              340 S Lemon Ave #4133<br />
              Walnut, CA 91789<br />
              États-Unis
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-on-surface mb-3">3. Propriété intellectuelle</h2>
            <p>
              L'ensemble de ce site relève de la législation française et internationale sur le droit d'auteur 
              et la propriété intellectuelle. Tous les droits de reproduction sont réservés, y compris pour les 
              documents téléchargeables et les représentations iconographiques et photographiques.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
