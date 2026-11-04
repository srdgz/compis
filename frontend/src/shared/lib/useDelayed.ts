import { useEffect, useState } from "react";

export function useDelayed(active: boolean, milliseconds: number): boolean {
  const [elapsed, setElapsed] = useState(false);

  useEffect(() => {
    if (!active) {
      setElapsed(false);
      return;
    }
    const timer = window.setTimeout(() => setElapsed(true), milliseconds);
    return () => window.clearTimeout(timer);
  }, [active, milliseconds]);

  return active && elapsed;
}
