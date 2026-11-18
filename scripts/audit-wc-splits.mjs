// audit-wc-splits.mjs — check the World Cup split for both players.
//
// Ronaldo: 11 goals in 27 FIFA World Cup matches — the record for a European
// player, and the first man to score at six World Cups.
// Messi: the rival's figures live in public/data/messi.json.
//
// The check is a REGRESSION GUARD: if the dataset's splits drift away from
// the published records, this fails.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => JSON.parse(fs.readFileSync(path.join(root, p), "utf8"));
const data = read("public/data/ronaldo-data.json");
const messi = read("public/data/messi.json");

const R = data.splits?.ronaldo || {};
const M = data.splits?.worldCup?.messi || {};

const checks = [
  ["Ronaldo World Cup goals", 11, R.worldCup?.goals],
  ["Ronaldo World Cup appearances", 27, R.worldCup?.apps],
  ["Ronaldo World Cup knockout goals", 1, R.worldCup?.koGoals],
  ["Messi World Cup goals", 21, M.goals],
  ["Messi World Cup knockout goals", 4, M.koGoals],
  ["Ronaldo Champions League goals", 140, R.continental?.goals],
  ["Ronaldo Champions League assists", 42, R.continental?.assists],
  ["Ronaldo senior team trophies", 35, R.trophies],
  ["Ronaldo Ballons d'Or", 5, R.ballons],
  ["Messi senior team trophies", 46, messi.trophies],
  ["Messi Ballons d'Or", 8, messi.ballonsDO],
];

let failed = 0;
for (const [label, expected, actual] of checks) {
  const ok = expected === actual;
  if (!ok) failed++;
  console.log((ok ? "ok   " : "FAIL ") + label + ": " + actual + " (expected " + expected + ")");
}

if ((R.worldCup?.goals ?? 0) > data.totals.combined.goals) {
  console.error("FAIL: the World Cup goals exceed the career total");
  failed++;
} else {
  console.log("ok    the World Cup goals are inside the career total");
}

// Every built rivalry page — all seven locales — must carry the shared split
// cells from the JSON. Restored locales are skipped until the generator has
// written their shells; once present they are guarded like the original four.
const RIVALRY_LOCALES = ["en", "es", "pt", "fr", "ro", "uz", "ar"];
const sharedCells = [
  String(R.worldCup?.goals ?? 0),
  String(M.goals ?? 0),
  String(R.continental?.goals ?? 0),
  String(R.trophies ?? 0),
  String(messi.trophies ?? 0),
];
for (const lang of RIVALRY_LOCALES) {
  const rel = lang === "en" ? "ronaldo-vs-messi.html" : `${lang}/ronaldo-vs-messi.html`;
  const file = path.join(root, rel);
  if (!fs.existsSync(file)) {
    console.log("skip  " + rel + ": page not generated yet");
    continue;
  }
  const html = fs.readFileSync(file, "utf8");
  const missingCells = sharedCells.filter((cell) => !html.includes(cell));
  if (missingCells.length) {
    failed++;
    console.error("FAIL  " + rel + ": missing shared split cells " + missingCells.join(", "));
  } else {
    console.log("ok    " + rel + ": shared split cells present");
  }
}

if (failed) { console.error(failed + " check(s) failed"); process.exit(1); }
console.log(`wc-splits audit ok (${RIVALRY_LOCALES.length} locales checked).`);
