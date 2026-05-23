import { createFileRoute, Link } from "@tanstack/react-router";
import { siteName } from "@/config/site";


export const Route = createFileRoute("/niveaux")({
  head: () => ({
    meta: [{ title: `${siteName} - Les niveaux A2, B1 et B2 expliqués` }],
  }),
  component: NiveauxPage,
});

function NiveauxPage() {
  return (
    <div className="flex flex-col min-h-screen bg-surface">
      <main className="flex-1">
        <section className="pt-12 md:pt-16 pb-12 px-4 bg-surface-container-low text-center border-b border-outline-variant">
          <div className="max-w-[800px] mx-auto">
            <span className="text-xs font-bold font-label text-primary uppercase tracking-widest block mb-2">
              RÉFÉRENTIEL CECRL — Mise à jour 2026
            </span>
            <h1 className="text-4xl md:text-5xl font-bold text-on-surface mb-4">
              Comprendre les niveaux de français
            </h1>
            <p className="text-lg text-on-surface-variant max-w-[700px] mx-auto">
              Carte de séjour pluriannuelle (A2), carte de résident 10 ans (B1),
              nationalité française (B2) : chaque démarche correspond à un niveau précis.
            </p>
          </div>
        </section>

        <div className="max-w-[1000px] mx-auto px-4 py-12 space-y-12">
          <section>
            <h2 className="text-2xl font-bold text-on-surface mb-6">Synthèse des obligations 2026</h2>
            <div className="overflow-x-auto bg-surface-bright border border-outline-variant rounded-xl shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead className="bg-surface-container-lowest border-b border-outline-variant">
                  <tr>
                    <th className="p-4 text-xs font-bold font-label text-outline uppercase tracking-wider">Niveau</th>
                    <th className="p-4 text-xs font-bold font-label text-outline uppercase tracking-wider">Démarche associée</th>
                    <th className="p-4 text-xs font-bold font-label text-outline uppercase tracking-wider">Exigence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-variant">
                  <tr>
                    <td className="p-4 font-bold text-primary">A2</td>
                    <td className="p-4">Carte de séjour pluriannuelle (2-4 ans)</td>
                    <td className="p-4">
                      <span className="bg-secondary-container text-on-secondary-container px-2 py-1 rounded text-sm font-medium">Obligatoire</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="p-4 font-bold text-primary">B1</td>
                    <td className="p-4">Carte de résident (10 ans)</td>
                    <td className="p-4">
                      <span className="bg-secondary-container text-on-secondary-container px-2 py-1 rounded text-sm font-medium">Obligatoire</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="p-4 font-bold text-primary">B2</td>
                    <td className="p-4">Nationalité française (naturalisation ou mariage)</td>
                    <td className="p-4">
                      <span className="bg-primary-container text-on-primary-container px-2 py-1 rounded text-sm font-medium">Obligatoire depuis 2026</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="mt-4 p-4 rounded-xl border border-amber-300 bg-amber-50 text-sm text-amber-900">
              <strong>⚠️ Nouveau en 2026 :</strong> la naturalisation exige désormais le niveau <strong>B2</strong>
              (et non plus B1). Assurez-vous de viser le bon niveau selon votre projet.
            </div>
          </section>

          <section className="grid grid-cols-1 gap-6">
            {/* A1 */}
            <div className="bg-surface-bright p-8 rounded-xl border border-outline-variant relative overflow-hidden shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-4xl font-bold text-on-surface">A1</span>
                <span className="text-xs font-bold font-label text-on-surface bg-surface-container-high px-3 py-1 rounded-full uppercase tracking-wider">
                  Débutant
                </span>
                <span className="ml-auto text-xs font-bold text-outline bg-surface-container px-3 py-1 rounded-full uppercase tracking-wider">
                  Hors exigence administrative
                </span>
              </div>
              <h3 className="text-2xl font-bold mb-3">Niveau A1 — Débutant</h3>
              <p className="text-on-surface-variant leading-relaxed mb-3">
                Vous comprenez et utilisez des expressions très simples du quotidien.
                Ce niveau ne correspond à aucune exigence administrative pour un titre de séjour
                ou la nationalité française.
              </p>
              <p className="text-sm text-on-surface-variant"><strong>Objectif administratif :</strong> non requis pour les titres de séjour ou la nationalité.</p>
            </div>

            {/* A2 */}
            <div className="bg-surface-bright p-8 rounded-xl border border-outline-variant relative overflow-hidden shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-4xl font-bold text-primary">A2</span>
                <span className="text-xs font-bold font-label text-secondary bg-secondary-container px-3 py-1 rounded-full uppercase tracking-wider">
                  Élémentaire
                </span>
                <span className="ml-auto text-xs font-bold text-on-secondary-container bg-secondary-container px-3 py-1 rounded-full uppercase tracking-wider">
                  Carte pluriannuelle
                </span>
              </div>
              <h3 className="text-2xl font-bold mb-3">Niveau A2 — Élémentaire</h3>
              <p className="text-on-surface-variant leading-relaxed mb-3">
                Vous comprenez des phrases isolées et des expressions fréquentes
                relatives à des domaines de première nécessité. Vous pouvez communiquer
                lors de tâches simples et habituelles.
              </p>
              <p className="text-sm text-on-surface-variant mb-2"><strong>Objectif administratif :</strong> requis pour la carte de séjour pluriannuelle (2-4 ans).</p>
              <p className="text-xs text-outline italic">Source légale : décret applicable au 1er janvier 2026 — service-public.gouv.fr</p>
            </div>

            {/* B1 */}
            <div className="bg-surface-bright p-8 rounded-xl border border-outline-variant relative overflow-hidden shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-4xl font-bold text-primary">B1</span>
                <span className="text-xs font-bold font-label text-on-primary-container bg-primary-container px-3 py-1 rounded-full uppercase tracking-wider">
                  Intermédiaire
                </span>
                <span className="ml-auto text-xs font-bold text-on-secondary-container bg-secondary-container px-3 py-1 rounded-full uppercase tracking-wider">
                  Carte de résident
                </span>
              </div>
              <h3 className="text-2xl font-bold mb-3">Niveau B1 — Intermédiaire</h3>
              <p className="text-on-surface-variant leading-relaxed mb-3">
                Vous comprenez les points essentiels d'un discours clair
                sur des sujets familiers. Vous pouvez vous débrouiller dans la plupart
                des situations de la vie courante.
              </p>
              <p className="text-sm text-on-surface-variant mb-2"><strong>Objectif administratif :</strong> requis pour la carte de résident 10 ans.</p>
              <p className="text-xs text-outline italic">Source légale : décret applicable au 1er janvier 2026 — loire.gouv.fr</p>
            </div>

            {/* B2 */}
            <div className="bg-surface-bright p-8 rounded-xl border-2 border-primary relative overflow-hidden shadow-md">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-4xl font-bold text-primary">B2</span>
                <span className="text-xs font-bold font-label text-on-primary bg-primary px-3 py-1 rounded-full uppercase tracking-wider">
                  Avancé
                </span>
                <span className="ml-auto text-xs font-bold text-on-primary bg-primary px-3 py-1 rounded-full uppercase tracking-wider">
                  Nationalité française
                </span>
              </div>
              <h3 className="text-2xl font-bold mb-3">Niveau B2 — Avancé</h3>
              <p className="text-on-surface-variant leading-relaxed mb-3">
                Vous comprenez le contenu essentiel de sujets concrets ou abstraits.
                Vous pouvez communiquer avec spontanéité et aisance avec un locuteur natif.
              </p>
              <p className="text-sm text-on-surface-variant mb-2"><strong>Objectif administratif :</strong> requis pour la nationalité française (naturalisation ou mariage).</p>
              <p className="text-xs text-outline italic mb-3">Source légale : décret applicable aux dossiers 2026 — diplomatie.gouv.fr</p>
              <div className="p-4 rounded-lg border border-amber-300 bg-amber-50 text-sm text-amber-900">
                <strong>⚠️ Important :</strong> depuis 2026, la naturalisation exige le niveau B2
                (et non plus B1). Assurez-vous de viser le bon niveau.
              </div>
            </div>
          </section>

          <section className="mt-12 p-10 bg-secondary-container rounded-2xl text-center shadow-inner">
            <h2 className="text-2xl font-bold text-on-secondary-container mb-3">Vous n'êtes pas sûr(e) de votre niveau ?</h2>
            <p className="text-on-secondary-container/80 mb-8 max-w-[500px] mx-auto">
              Répondez à quelques questions pour estimer rapidement votre niveau (2 min). Pour un bilan complet,
              un test approfondi est disponible.
            </p>
            <Link to="/passer-test/$token" params={{ token: "latest" }}>
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
