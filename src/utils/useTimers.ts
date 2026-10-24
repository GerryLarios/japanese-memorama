import { useCallback, useEffect, useMemo, useRef } from "react";

type Timer = ReturnType<typeof setTimeout>;

interface Scheduler {
  (fn: () => void, ms: number): void;
  clear: () => void;
}

/**
 * setTimeout that is cancelled on unmount and whenever a new timeout starts.
 * Prevents post-unmount state updates and stale auto-advance callbacks.
 */
export function useTimeout(): Scheduler {
  const ref = useRef<Timer | null>(null);

  const clear = useCallback(() => {
    if (ref.current) clearTimeout(ref.current);
    ref.current = null;
  }, []);

  useEffect(() => clear, [clear]);

  const schedule = useCallback(
    (fn: () => void, ms: number) => {
      clear();
      ref.current = setTimeout(fn, ms);
    },
    [clear],
  );

  return useMemo(() => Object.assign(schedule, { clear }), [schedule, clear]);
}

/** setInterval that is cleared on unmount. */
export function useInterval(): {
  start: (fn: () => void, ms: number) => void;
  stop: () => void;
} {
  const ref = useRef<Timer | null>(null);

  const stop = useCallback(() => {
    if (ref.current) clearInterval(ref.current);
    ref.current = null;
  }, []);

  useEffect(() => stop, [stop]);

  const start = useCallback(
    (fn: () => void, ms: number) => {
      stop();
      ref.current = setInterval(fn, ms);
    },
    [stop],
  );

  return { start, stop };
}
