import { Card } from "./Card";

interface Props {
  level: "A0" | "A1" | "A2" | "B1" | "B2";
  understands: string;
  speaks: string;
  writes: string;
  difficulties: string;
  training: string;
  admin?: string;
}

export function LevelCard({
  level,
  understands,
  speaks,
  writes,
  difficulties,
  training,
  admin,
}: Props) {
  return (
    <Card>
      <div className="flex items-baseline justify-between gap-4">
        <h3 className="headline-md">Niveau {level}</h3>
        <span className="label-caps text-secondary">CECRL</span>
      </div>
      <dl className="mt-4 space-y-3 body-md">
        <div>
          <dt className="label-caps text-on-surface-variant">Comprend</dt>
          <dd>{understands}</dd>
        </div>
        <div>
          <dt className="label-caps text-on-surface-variant">Parle</dt>
          <dd>{speaks}</dd>
        </div>
        <div>
          <dt className="label-caps text-on-surface-variant">Écrit</dt>
          <dd>{writes}</dd>
        </div>
        <div>
          <dt className="label-caps text-on-surface-variant">Difficultés fréquentes</dt>
          <dd>{difficulties}</dd>
        </div>
        <div>
          <dt className="label-caps text-on-surface-variant">Formation conseillée</dt>
          <dd>{training}</dd>
        </div>
        {admin && (
          <div>
            <dt className="label-caps text-on-surface-variant">Démarche associée</dt>
            <dd className="text-on-surface-variant">{admin}</dd>
          </div>
        )}
      </dl>
    </Card>
  );
}
