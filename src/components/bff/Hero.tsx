import { Link } from "@tanstack/react-router";
import { Button } from "./Button";

export function Hero() {
  return (
    <section className="px-4 pt-12 pb-16 sm:pt-20 sm:pb-24">
      <div className="mx-auto max-w-3xl text-center">
        <p className="label-caps mb-4 text-secondary">Bilan Français Formation</p>
        <h1 className="headline-lg sm:text-4xl">
          Évaluez votre niveau de français et trouvez la formation adaptée
        </h1>
        <p className="body-lg mt-6 text-on-surface-variant">
          Préparation au TCF, carte de séjour, naturalisation, français professionnel
          et intégration en France.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link to="/simulateur">
            <Button variant="primary">Faire le test de niveau</Button>
          </Link>
          <Link to="/contact">
            <Button variant="outline">Être rappelé</Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
