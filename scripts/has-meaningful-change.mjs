#!/usr/bin/env node
/**
 * Meaningful-change detector (scripts/has-meaningful-change.mjs)
 *
 * A scraper day that only rolled its date stamps forward must not cost a
 * commit, a push or a Vercel deployment. This script answers one question:
 * did anything OTHER than date stamps and ephemeral watcher logs change?
 *
 *   node scripts/has-meaningful-change.mjs --worktree
 *     Changes in the working tree vs HEAD (tracked + untracked).
 *     Used by the workflow right after the scrapers: on a "no" the run
 *     stops before the rebuild, the commit and the deployment.
 *
 *   node scripts/has-meaningful-change.mjs --staged        (default)
 *     Staged changes vs HEAD.
 *
 *   node scripts/has-meaningful-change.mjs --range <base> <head>
 *     Changes between two commits. Used by scripts/vercel-ignore-build.sh
 *     as a belt-and-braces guard: even if a date-only commit slips through
 *     somewhere, the Vercel build step cancels itself.
 *
 * Exit codes:
 *   0  MEANINGFUL changes exist  -> commit / deploy
 *   1  only noise (dates, ephemeral logs, non-production files) or nothing
 *   2  the detector itself failed -> callers fall back to deploying
 *
 * Noise rules:
 *   - Ephemeral watcher logs (source-watch / last-check / pending) and the
 *     llms date markers: always noise.
 *   - Non-production files (.github/, docs/, scripts/, README, CONTEXT.md,
 *     X_POSTS_SCHEDULE.md): always noise - none of them reach dist/.
 *   - Everything else: the changed lines are compared with every date-shaped
 *     token stripped (ISO dates and "D <month> YYYY" in any of the site's
 *     languages). If the stripped - and + line sets are equal, the file only
 *     rolled dates: noise. One real line anywhere: MEANINGFUL.
 * The failure direction is safe: anything unclassified counts as meaningful,
 * so a missed pattern deploys (status quo) rather than skipping a real fix.
 */
import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const git = (args) =>
  execSync(`git -C ${JSON.stringify(root)} ${args}`, {
    encoding: "utf8",
    maxBuffer: 1024 * 1024 * 64,
  });

/* ------------------------------------------------------------ CLI parsing */
const argv = process.argv.slice(2);
let mode = "--staged";
if (argv.includes("--worktree")) mode = "--worktree";
const rangeIdx = argv.indexOf("--range");
if (rangeIdx !== -1) mode = "--range";
const rangeBase = rangeIdx !== -1 ? argv[rangeIdx + 1] : null;
const rangeHead = rangeIdx !== -1 ? argv[rangeIdx + 2] || "HEAD" : "HEAD";
if (argv.some((a) => a.startsWith("-") && !["--worktree", "--staged", "--range"].includes(a))) {
  console.error("usage: has-meaningful-change.mjs [--worktree | --staged | --range <base> <head>]");
  process.exit(2);
}

/* -------------------------------------------------------- noise file rules */
const NOISE_EXACT = new Set([
  "public/data/source-watch.json", // ephemeral watcher log
  "public/data/last-check.json", // ephemeral scoreboard check
  "public/data/pending.json", // ephemeral staged review
  "public/llms.txt", // date marker file
  "public/llms-full.txt", // date marker file
  "README.md",
  "CONTEXT.md",
  "X_POSTS_SCHEDULE.md",
]);
const NOISE_PREFIXES = [".github/", "docs/", "scripts/", ".vercel/", "build-cache/"];
const isNoisePath = (f) => NOISE_EXACT.has(f) || NOISE_PREFIXES.some((p) => f.startsWith(p));

/* ------------------------------------------------------- date token stripper */
// ISO dates, "D <month word> YYYY" (any Latin/Arabic/Cyrillic month word the
// site's languages use), and "Month D, YYYY".
const DATE_PATTERNS = [
  /\d{4}-\d{2}-\d{2}/g,
  /\b\d{1,2}[ \u00A0]+[A-Za-z\u00C0-\u024F\u0370-\u06FF]{3,12}[ \u00A0]+20\d{2}\b/g,
  /\b[A-Za-z\u00C0-\u024F]{3,12}[ \u00A0]+\d{1,2},[ \u00A0]+20\d{2}\b/g,
];
const stripDates = (s) =>
  DATE_PATTERNS.reduce((acc, re) => acc.replace(re, ""), s.replace(/\r/g, "")).replace(/\s+/g, " ").trim();

/* --------------------------------------------------------- file collection */
let files = [];
let diffArgs = "";
try {
  if (mode === "--staged") {
    files = git("diff --cached --name-only").split("\n").filter(Boolean);
    diffArgs = "--cached";
  } else if (mode === "--worktree") {
    files = git("diff HEAD --name-only").split("\n").filter(Boolean);
    const untracked = git("ls-files --others --exclude-standard").split("\n").filter(Boolean);
    files = [...new Set([...files, ...untracked])];
    diffArgs = "HEAD";
  } else {
    if (!rangeBase) {
      console.error("--range needs a base commit");
      process.exit(2);
    }
    files = git(`diff --name-only ${JSON.stringify(rangeBase)} ${JSON.stringify(rangeHead)}`)
      .split("\n")
      .filter(Boolean);
    diffArgs = `${JSON.stringify(rangeBase)} ${JSON.stringify(rangeHead)}`;
  }
} catch (err) {
  console.error(`[has-meaningful-change] git failed: ${err.message}`);
  process.exit(2);
}

/* --------------------------------------------------------- classification */
function classify(file) {
  if (isNoisePath(file)) return "noise";
  let patch = "";
  try {
    patch = git(`diff -U0 ${diffArgs} -- ${JSON.stringify(file)}`);
  } catch {
    return "meaningful"; // untracked new files have no diff: a new file is a change
  }
  const minus = [];
  const plus = [];
  for (const line of patch.split("\n")) {
    if (line.startsWith("---") || line.startsWith("+++")) continue;
    if (line.startsWith("-")) minus.push(stripDates(line.slice(1)));
    else if (line.startsWith("+")) plus.push(stripDates(line.slice(1)));
  }
  if (minus.length === 0 && plus.length === 0) return "noise"; // whitespace-only hunk
  const same =
    minus.length === plus.length &&
    [...minus].sort().join("\n") === [...plus].sort().join("\n");
  return same ? "noise" : "meaningful";
}

const meaningful = [];
const noise = [];
for (const f of files) (classify(f) === "meaningful" ? meaningful : noise).push(f);

for (const f of meaningful) console.log(`MEANINGFUL  ${f}`);
for (const f of noise.slice(0, 12)) console.log(`noise       ${f}`);
if (noise.length > 12) console.log(`noise       (+${noise.length - 12} more)`);

if (meaningful.length > 0) {
  console.log(`\nVERDICT: MEANINGFUL — ${meaningful.length} file(s) carry real changes. Deploy.`);
  process.exit(0);
}
console.log(
  `\nVERDICT: NO CHANGE THAT MATTERS — only date stamps, ephemeral logs or non-production files (${noise.length}). Skip the commit and the deployment.`
);
process.exit(1);
