import { cn } from "@/lib/utils";

interface Props {
  total: number;
  current: number; // 0-based
  labels?: string[];
}

export function StepTracker({ total, current, labels }: Props) {
  return (
    <ol className="flex items-center gap-2" aria-label="Progression du questionnaire">
      {Array.from({ length: total }).map((_, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li
            key={i}
            className="flex flex-1 items-center gap-2"
            aria-current={active ? "step" : undefined}
          >
            <span
              className={cn(
                "flex h-2 flex-1 rounded-full transition-colors",
                done && "bg-secondary",
                active && "bg-primary",
                !done && !active && "bg-surface-container-high"
              )}
            />
            <span className="sr-only">
              {labels?.[i] ?? `Étape ${i + 1} sur ${total}`}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
