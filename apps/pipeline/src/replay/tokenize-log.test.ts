import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { extractSnapshot, rebuildBattleState, tokenizeLog } from "./index.js";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const fixturePath = path.join(testDir, "fixtures", "basic.log");
const fixtureLog = readFileSync(fixturePath, "utf8");

test("tokenizeLog parses replay events", () => {
  const events = tokenizeLog(fixtureLog);

  assert.equal(events.length, 11);
  assert.deepEqual(events[0], { type: "turn", turn: 1 });
  assert.deepEqual(events[1], {
    type: "switch",
    side: "p1",
    species: "Tornadus",
    hp: "100/100"
  });
  assert.deepEqual(events[5], { type: "weather", weather: "RainDance" });
  assert.deepEqual(events[8], { type: "status", target: "p2a: Urshifu", status: "par" });
});

test("rebuildBattleState creates deterministic snapshot state", () => {
  const events = tokenizeLog(fixtureLog);
  const snapshot = rebuildBattleState(events);
  const p1Active = snapshot.p1.active[0];
  const p2Active = snapshot.p2.active[0];

  assert.equal(snapshot.turn, 1);
  assert.equal(snapshot.weather, "RainDance");
  assert.equal(snapshot.terrain, "move: Electric Terrain");
  assert.deepEqual(snapshot.p1.sideConditions, ["Tailwind"]);
  assert.ok(p2Active);
  assert.equal(p2Active.species, "Urshifu");
  assert.equal(p2Active.status, "par");
  assert.equal(p2Active.currentHp, 100);
  assert.equal(p2Active.maxHp, 175);
  assert.deepEqual(p2Active.moves, []);
});

test("extractSnapshot returns the rebuilt battle state", () => {
  const events = tokenizeLog(fixtureLog);
  const snapshot = extractSnapshot(events);
  const p1Active = snapshot.p1.active[0];

  assert.ok(p1Active);
  assert.equal(p1Active.species, "Tornadus");
  assert.equal(p1Active.currentHp, 100);
});
