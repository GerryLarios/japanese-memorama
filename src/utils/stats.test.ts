import assert from "node:assert/strict";
import { test } from "node:test";
import { addResult, emptyStats, parseStats, topMissed } from "./stats.ts";

const result = (score: number, missed: string[] = []) => ({
  game: "quiz",
  score,
  total: 10,
  at: 1,
  missed,
});

test("addResult appends and counts missed words", () => {
  let s = emptyStats();
  s = addResult(s, result(8, ["a", "b"]));
  s = addResult(s, result(5, ["b"]));

  assert.equal(s.results.length, 2);
  assert.equal(s.missed.a, 1);
  assert.equal(s.missed.b, 2);
  assert.deepEqual(topMissed(s), ["b", "a"]);
});

test("results are capped at 20", () => {
  let s = emptyStats();
  for (let i = 0; i < 25; i++) s = addResult(s, result(i));
  assert.equal(s.results.length, 20);
  assert.equal(s.results.at(-1)?.score, 24);
});

test("parseStats survives corrupt and foreign data", () => {
  assert.deepEqual(parseStats(null), emptyStats());
  assert.deepEqual(parseStats("{not json"), emptyStats());
  assert.deepEqual(parseStats('{"results":"nope"}'), emptyStats());
  assert.deepEqual(parseStats("[1,2,3]"), emptyStats());

  const ok = parseStats(
    '{"results":[{"game":"quiz","score":1,"total":2,"at":3,"missed":[]}],"missed":{"x":4}}',
  );
  assert.equal(ok.results.length, 1);
  assert.equal(ok.missed.x, 4);
});

test("results with broken fields are dropped", () => {
  const parsed = parseStats(
    '{"results":[{"game":"quiz","score":null,"total":2,"at":3},' +
      '{"game":"quiz","score":1,"total":2,"at":3}],"missed":{}}',
  );
  assert.equal(parsed.results.length, 1);
});
