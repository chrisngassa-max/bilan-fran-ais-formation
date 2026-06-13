import { Link } from "@tanstack/react-router";
import { Button } from "./Button";

export function Hero() {
  return (
    <section className="px-4 pt-12 pb-8 sm:pt-16 sm:pb-10">
      <div className="mx-auto max-w-3xl text-center">
        <p className="label-caps mb-4 text-secondary">Bilan Français Formation</p>
        <h1 className="headline-lg sm:text-4xl">
          Évaluez votre niveau de français et trouvez la formation adaptée
        </h1>
        <p className="body-lg mt-6 text-on-surface-variant">
          Préparation linguistique selon le référentiel CECRL, carte de séjour, naturalisation, français professionnel
          et intégration en France.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button variant="primary" asChild>
            <Link to="/passer-test/$token" params={{ token: "latest" }}>
              Passer l'évaluation experte
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/contact">Nous contacter</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
