import { Card } from "./Card";
import type { ReactNode } from "react";

interface Props {
  title: string;
  children: ReactNode;
  badge?: string;
}

export function FundingCard({ title, children, badge }: Props) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <h3 className="headline-md">{title}</h3>
        {badge && (
          <span className="label-caps rounded-full bg-secondary-container px-3 py-1 text-secondary">
            {badge}
          </span>
        )}
      </div>
      <div className="mt-3 body-md text-on-surface-variant">{children}</div>
    </Card>
  );
}
