import { useEffect, useRef, useState } from "react";

/**
 * Décompte uniquement le temps "actif" (onglet visible + fenêtre focus).
 * Renvoie le temps écoulé en ms depuis le dernier reset(), mis à jour ~10 fois/sec.
 */
export function useActiveTimer(itemKey: string) {
  const [elapsedMs, setElapsedMs] = useState(0);
  const accumulatedRef = useRef(0);
  const lastTickRef = useRef<number | null>(null);
  const activeRef = useRef<boolean>(true);

  useEffect(() => {
    accumulatedRef.current = 0;
    lastTickRef.current = null;
    setElapsedMs(0);

    const isActive = () =>
      typeof document !== "undefined" &&
      document.visibilityState === "visible" &&
      typeof document.hasFocus === "function"
        ? document.hasFocus()
        : true;

    activeRef.current = isActive();
    if (activeRef.current) {
      lastTickRef.current = performance.now();
    }

    const flush = () => {
      if (activeRef.current && lastTickRef.current !== null) {
        const now = performance.now();
        accumulatedRef.current += now - lastTickRef.current;
        lastTickRef.current = now;
      }
    };

    const onVisibility = () => {
      const active = isActive();
      if (active && !activeRef.current) {
        lastTickRef.current = performance.now();
      } else if (!active && activeRef.current) {
        flush();
        lastTickRef.current = null;
      }
      activeRef.current = active;
    };

    const interval = window.setInterval(() => {
      flush();
      setElapsedMs(accumulatedRef.current);
    }, 250);

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", onVisibility);
    window.addEventListener("blur", onVisibility);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", onVisibility);
      window.removeEventListener("blur", onVisibility);
    };
  }, [itemKey]);

  return elapsedMs;
}
