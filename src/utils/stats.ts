const KEY = "memorama.stats.v1";
const MAX_RESULTS = 20;
const MAX_MISSED = 100;

export interface GameResult {
  game: string;
  score: number;
  total: number;
  at: number;
  missed: string[];
}

export interface Stats {
  results: GameResult[];
  missed: Record<string, number>;
}

export const emptyStats = (): Stats => ({ results: [], missed: {} });

export function addResult(stats: Stats, result: GameResult): Stats {
  const missed = { ...stats.missed };
  for (const id of result.missed) missed[id] = (missed[id] ?? 0) + 1;

  // Keep the most-missed words only, so the record cannot grow forever.
  const top = Object.entries(missed)
    .sort((a, b) => b[1] - a[1])
    .slice(0, MAX_MISSED);

  return {
    results: [...stats.results, result].slice(-MAX_RESULTS),
    missed: Object.fromEntries(top),
  };
}

/** Most-missed word ids, worst first. */
export function topMissed(stats: Stats, limit = 20): string[] {
  return Object.entries(stats.missed)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id]) => id);
}

/** Corrupt or foreign data must never break the lobby. */
export function parseStats(raw: string | null): Stats {
  if (!raw) return emptyStats();
  try {
    const data = JSON.parse(raw);
    if (!data || !Array.isArray(data.results)) return emptyStats();
    const results = data.results.filter(
      (r: GameResult) =>
        typeof r?.game === "string" &&
        Number.isFinite(r?.score) &&
        Number.isFinite(r?.total) &&
        Number.isFinite(r?.at),
    );
    const missed =
      data.missed && typeof data.missed === "object" ? data.missed : {};
    return { results, missed };
  } catch {
    return emptyStats();
  }
}

export function loadStats(): Stats {
  if (typeof window === "undefined") return emptyStats();
  try {
    return parseStats(window.localStorage.getItem(KEY));
  } catch {
    return emptyStats(); // storage blocked (private mode / disabled cookies)
  }
}

function saveStats(stats: Stats) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(stats));
  } catch {
    // quota or blocked storage — progress is optional, never fail the game
  }
}

export function recordGame(
  game: string,
  score: number,
  total: number,
  missed: string[] = [],
) {
  // shortcut: missed words are only collected by quiz/fill-blank/listening;
  // other games record history without feeding the review pool.
  saveStats(addResult(loadStats(), { game, score, total, at: Date.now(), missed }));
}
