import { createFileRoute, Link } from "@tanstack/react-router";
import { siteName } from "@/config/site";
import { Home, Sparkles, GraduationCap } from "lucide-react";

export const Route = createFileRoute("/niveaux")({
  head: () => ({
    meta: [
      { title: `${siteName} — Les Niveaux CECRL expliqués` },
      { name: "description", content: "Découvrez les niveaux de français (A2, B1, B2) requis pour votre carte de séjour, de résident ou de naturalisation." }
    ],
  }),
  component: NiveauxPage,
});

function NiveauxPage() {
  return (
    <div className="flex flex-col min-h-screen bg-surface">
      <main className="flex-1">
        {/* Header Section */}
        <section className="pt-12 md:pt-16 pb-12 px-4 bg-surface-container-low text-center border-b border-outline-variant">
          <div className="max-w-[800px] mx-auto">
            <span className="text-xs font-bold font-label text-primary uppercase tracking-widest block mb-2">
              RÉFÉRENTIEL CECRL
            </span>
            <h1 className="text-4xl md:text-5xl font-bold text-on-surface mb-4">
              Comprendre les niveaux de français
            </h1>
            <p className="text-lg text-on-surface-variant max-w-[600px] mx-auto">
              De A1 à C2, voici les niveaux requis pour chaque démarche administrative en France. À chaque palier, son objectif.
            </p>
          </div>
        </section>

        <div className="max-w-[1000px] mx-auto px-4 py-12 space-y-12">
          {/* Summary Table */}
          <section>
            <h2 className="text-2xl font-bold text-on-surface mb-6">Synthèse des obligations</h2>
            <div className="overflow-x-auto bg-surface-bright border border-outline-variant rounded-xl shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead className="bg-surface-container-lowest border-b border-outline-variant">
                  <tr>
                    <th className="p-4 text-xs font-bold font-label text-outline uppercase tracking-wider">Niveau</th>
                    <th className="p-4 text-xs font-bold font-label text-outline uppercase tracking-wider">Objectif</th>
                    <th className="p-4 text-xs font-bold font-label text-outline uppercase tracking-wider">Exigence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-variant">
                  <tr>
                    <td className="p-4 font-bold text-primary">A2</td>
                    <td className="p-4">Carte de Résident (10 ans)</td>
                    <td className="p-4">
                      <span className="bg-secondary-container text-on-secondary-container px-2 py-1 rounded text-sm font-medium">Obligatoire</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="p-4 font-bold text-primary">B1</td>
                    <td className="p-4">Demande de Nationalité Française</td>
                    <td className="p-4">
                      <span className="bg-secondary-container text-on-secondary-container px-2 py-1 rounded text-sm font-medium">Obligatoire</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="p-4 font-bold text-primary">B2 / C1</td>
                    <td className="p-4">Études supérieures & Emplois qualifiés</td>
                    <td className="p-4">
                      <span className="bg-surface-container-high text-on-surface px-2 py-1 rounded text-sm font-medium">Recommandé</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Detailed Cards (Bento-inspired) */}
          <section className="grid grid-cols-1 gap-6">
            {/* A2 Card */}
            <div className="bg-surface-bright p-8 rounded-xl border border-outline-variant flex flex-col md:flex-row gap-6 items-start relative overflow-hidden shadow-sm">
              <div className="absolute top-4 right-4 text-primary opacity-10">
                <Home className="w-24 h-24" />
              </div>
              <div className="flex-1 relative z-10">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-4xl font-bold text-primary">A2</span>
                  <span className="text-xs font-bold font-label text-secondary bg-secondary-container px-3 py-1 rounded-full uppercase tracking-wider">Élémentaire</span>
                </div>
                <h3 className="text-2xl font-bold mb-3">La Carte de Résident</h3>
                <p className="text-on-surface-variant mb-6 leading-relaxed">
                  Pour obtenir votre carte de 10 ans, vous devez prouver que vous pouvez communiquer simplement dans la vie courante : faire des courses, parler de votre environnement.
                </p>
                <div className="bg-surface-container p-4 rounded-lg border border-surface-variant italic text-sm text-on-surface-variant">
                  "L'étape clé pour une stabilité durable en France."
                </div>
              </div>
            </div>

            {/* B1 Card */}
            <div className="bg-surface-bright p-8 rounded-xl border-2 border-primary flex flex-col md:flex-row gap-6 items-start relative overflow-hidden shadow-md">
              <div className="absolute top-4 right-4 text-primary-container opacity-10">
                <Sparkles className="w-24 h-24" />
              </div>
              <div className="flex-1 relative z-10">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-4xl font-bold text-primary">B1</span>
                  <span className="text-xs font-bold font-label text-on-primary-container bg-primary-container px-3 py-1 rounded-full uppercase tracking-wider">Intermédiaire</span>
                </div>
                <h3 className="text-2xl font-bold mb-3">Devenir Français</h3>
                <p className="text-on-surface-variant mb-6 leading-relaxed">
                  La naturalisation demande une autonomie réelle. Vous devez savoir exprimer votre opinion, raconter un événement et comprendre les points essentiels d'une discussion standard.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3 text-sm text-on-surface">
                    <span className="text-secondary shrink-0">✓</span>
                    Indispensable pour le dossier de citoyenneté
                  </li>
                  <li className="flex items-center gap-3 text-sm text-on-surface">
                    <span className="text-secondary shrink-0">✓</span>
                    Valable pour la plupart des formations professionnelles
                  </li>
                </ul>
              </div>
            </div>

            {/* B2/C1 Card */}
            <div className="bg-surface-bright p-8 rounded-xl border border-outline-variant flex flex-col md:flex-row gap-6 items-start relative overflow-hidden shadow-sm">
              <div className="absolute top-4 right-4 text-on-surface-variant opacity-10">
                <GraduationCap className="w-24 h-24" />
              </div>
              <div className="flex-1 relative z-10">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-4xl font-bold text-on-surface">B2 / C1</span>
                  <span className="text-xs font-bold font-label text-on-surface bg-surface-container-high px-3 py-1 rounded-full uppercase tracking-wider">Avancé</span>
                </div>
                <h3 className="text-2xl font-bold mb-3">Études & Carrière</h3>
                <p className="text-on-surface-variant leading-relaxed">
                  Pour intégrer une Université ou accéder à des postes de cadres, une maîtrise fluide de la langue est nécessaire pour argumenter et comprendre des textes complexes.
                </p>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="mt-12 p-10 bg-secondary-container rounded-2xl text-center shadow-inner">
            <h2 className="text-2xl font-bold text-on-secondary-container mb-3">Vous n'êtes pas sûr(e) de votre niveau ?</h2>
            <p className="text-on-secondary-container/80 mb-8 max-w-[500px] mx-auto">
              Répondez à quelques questions pour estimer rapidement votre niveau (2 min). Pour un bilan complet, un test approfondi est disponible.
            </p>
            <Link to="/evaluation">
              <button className="bg-primary text-on-primary min-h-[56px] px-10 rounded-lg font-bold hover:opacity-90 active:scale-95 transition-all shadow-md">
                Démarrer (2 min, gratuit)
              </button>
            </Link>
            <p className="mt-4 text-sm text-on-secondary-container/60">
              Service gratuit, sans engagement et conforme RGPD.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
