import { useCallback, useState } from "react";
import type { GameConfig } from "../../data/types";

export interface GameSession<T> {
  config: GameConfig | null;
  rounds: T[];
  index: number;
  score: number;
  done: boolean;
  missed: string[];
  current: T | undefined;
  start: (cfg: GameConfig) => void;
  restart: () => void;
  exit: () => void;
  award: () => void;
  miss: (id: string) => void;
  advance: () => void;
}

/**
 * Shared lobby → rounds → result state for choice-based games.
 * `build` must be stable (define it at module scope).
 */
export function useGameSession<T>(
  build: (cfg: GameConfig) => T[],
): GameSession<T> {
  const [config, setConfig] = useState<GameConfig | null>(null);
  const [rounds, setRounds] = useState<T[]>([]);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [missed, setMissed] = useState<string[]>([]);
  const [done, setDone] = useState(false);

  const start = useCallback(
    (cfg: GameConfig) => {
      setConfig(cfg);
      setRounds(build(cfg));
      setIndex(0);
      setScore(0);
      setMissed([]);
      setDone(false);
    },
    [build],
  );

  const advance = useCallback(() => {
    setIndex((i) => {
      if (i + 1 >= rounds.length) {
        setDone(true);
        return i;
      }
      return i + 1;
    });
  }, [rounds.length]);

  const restart = useCallback(() => {
    if (config) start(config);
  }, [config, start]);

  return {
    config,
    rounds,
    index,
    score,
    done,
    missed,
    current: rounds[index],
    start,
    restart,
    exit: useCallback(() => setConfig(null), []),
    award: useCallback(() => setScore((s) => s + 1), []),
    miss: useCallback(
      (id: string) => setMissed((m) => (m.includes(id) ? m : [...m, id])),
      [],
    ),
    advance,
  };
}
