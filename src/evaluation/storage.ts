import type { EvaluationProgress, EvaluationResult } from "./types";

export const PROGRESS_KEY = "bff_eval_progress_v1";
export const RESULT_KEY = "bff_eval_result_v1";
export const QUICKSCAN_KEY = "bff_quickscan_result_v1";

function safeStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

export function loadProgress(): EvaluationProgress | null {
  const s = safeStorage();
  if (!s) return null;
  const raw = s.getItem(PROGRESS_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as EvaluationProgress;
  } catch {
    return null;
  }
}

export function saveProgress(p: EvaluationProgress): void {
  const s = safeStorage();
  if (!s) return;
  s.setItem(PROGRESS_KEY, JSON.stringify(p));
}

export function clearProgress(): void {
  safeStorage()?.removeItem(PROGRESS_KEY);
}

export function saveResult(r: EvaluationResult): void {
  const s = safeStorage();
  if (!s) return;
  s.setItem(RESULT_KEY, JSON.stringify(r));
}

export function loadResult(): EvaluationResult | null {
  const s = safeStorage();
  if (!s) return null;
  const raw = s.getItem(RESULT_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as EvaluationResult;
  } catch {
    return null;
  }
}

export type QuickScanResult = {
  rangeLow: "A1" | "A2" | "B1" | "B2";
  rangeHigh: "A1" | "A2" | "B1" | "B2" | "C1";
  rawScore: number;
};

export function saveQuickScan(r: QuickScanResult): void {
  const s = safeStorage();
  if (!s) return;
  s.setItem(QUICKSCAN_KEY, JSON.stringify(r));
}

export function loadQuickScan(): QuickScanResult | null {
  const s = safeStorage();
  if (!s) return null;
  const raw = s.getItem(QUICKSCAN_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as QuickScanResult;
  } catch {
    return null;
  }
}
