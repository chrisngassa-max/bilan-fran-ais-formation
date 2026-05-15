import { Link } from "@tanstack/react-router";
import { Button } from "./Button";

interface Props {
  title: string;
  ctaLabel: string;
  to?: string;
  description?: string;
}

export function CTASection({ title, ctaLabel, description }: Props) {
  return (
    <section className="px-4 py-16">
      <div className="mx-auto max-w-3xl rounded-2xl border border-outline-variant bg-surface-container-high p-8 text-center sm:p-12">
        <h2 className="headline-lg">{title}</h2>
        {description && (
          <p className="body-lg mt-4 text-on-surface-variant">{description}</p>
        )}
        <div className="mt-8">
          <Link to="/evaluation">
            <Button variant="primary">{ctaLabel}</Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
