export type NiveauIndicatif = "A1" | "A2" | "B1" | "B2" | "a_verifier";

export interface Journey {
  id: string;
  fromLevel: NiveauIndicatif | "A0";
  toLevel: NiveauIndicatif;
  name: string;
  objective: string;
  hours: number;
  sessions: number;
  publicPrice: number;
  financedReferencePrice: number;
  monthlyInstallment: number;
  isMostRequested: boolean;
  description: string;
  examTarget: string;
  reassurance: string;
}
