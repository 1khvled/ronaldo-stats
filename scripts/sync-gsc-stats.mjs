/**
 * scripts/sync-gsc-stats.mjs
 * Fetches verified Google Search Console telemetry for BOTH RonaldoStats and MessiStats
 * using a Google Cloud Service Account (zero npm dependencies; Node 22 built-in crypto + fetch).
 *
 * Credentials lookup order:
 *   1. --key-file <path> CLI argument
 *   2. GSC_SERVICE_ACCOUNT_JSON env var (raw JSON string or base64-encoded JSON)
 *   3. GOOGLE_APPLICATION_CREDENTIALS file path env var
 *
 * Writes: public/data/gsc-stats.json (only when telemetry values change).
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SELF_SITE = "ronaldo";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_FILE = path.join(ROOT, "public", "data", "gsc-stats.json");

const ISO3_TO_ISO2 = {
  usa: "US", gbr: "GB", ind: "IN", idn: "ID", bra: "BR", esp: "ES", fra: "FR",
  rou: "RO", prt: "PT", deu: "DE", ita: "IT", can: "CA", mex: "MX", arg: "AR",
  aus: "AU", nld: "NL", pol: "PL", tur: "TR", sau: "SA", are: "AE", egy: "EG",
  mar: "MA", dza: "DZ", tun: "TN", nga: "NG", cmr: "CM", cod: "CD", ken: "KE",
  zaf: "ZA", phl: "PH", vnm: "VN", tha: "TH", mys: "MY", pak: "PK", bgd: "BD",
  uzb: "UZ", rus: "RU", ukr: "UA", col: "CO", chl: "CL", per: "PE", ecu: "EC",
  ven: "VE", gha: "GH", sen: "SN", civ: "CI", jpn: "JP", kor: "KR", sgp: "SG",
  bel: "BE", che: "CH", aut: "AT", swe: "SE", nor: "NO", dnk: "DK", irl: "IE",
  grc: "GR", cze: "CZ", hun: "HU", irq: "IQ", jor: "JO", kwt: "KW", qat: "QA",
  omn: "OM", bhr: "BH", lbn: "LB", kaz: "KZ", aze: "AZ", geo: "GE", npl: "NP",
  lka: "LK", eth: "ET", tza: "TZ", uga: "UG", ago: "AO", moz: "MZ", xkk: "XK"
};

const regionNames = new Intl.DisplayNames(["en"], { type: "region" });
function countryDisplayName(code3) {
  const iso2 = ISO3_TO_ISO2[String(code3 || "").toLowerCase()];
  if (!iso2) return String(code3 || "Other").toUpperCase();
  try {
    return regionNames.of(iso2) || iso2;
  } catch {
    return iso2;
  }
}

function compactNum(n) {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(Math.round(n));
}

function formatDateRange(startIso, endIso) {
  if (!startIso || !endIso) return "";
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const [y1, m1, d1] = startIso.split("-").map(Number);
  const [y2, m2, d2] = endIso.split("-").map(Number);
  const mon1 = months[m1 - 1];
  const mon2 = months[m2 - 1];
  if (y1 === y2 && m1 === m2) return `${mon1} ${d1}–${d2}, ${y1}`;
  if (y1 === y2) return `${mon1} ${d1} – ${mon2} ${d2}, ${y1}`;
  return `${mon1} ${d1}, ${y1} – ${mon2} ${d2}, ${y2}`;
}

function shortDateLabel(iso) {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const [, m, d] = iso.split("-").map(Number);
  return `${months[m - 1]} ${d}`;
}

function loadServiceAccount() {
  const args = process.argv.slice(2);
  const kfIdx = args.indexOf("--key-file");
  if (kfIdx !== -1 && args[kfIdx + 1]) {
    return JSON.parse(fs.readFileSync(args[kfIdx + 1], "utf8"));
  }
  const envRaw = (process.env.GSC_SERVICE_ACCOUNT_JSON || "").trim();
  if (envRaw) {
    const decoded = envRaw.startsWith("{") ? envRaw : Buffer.from(envRaw, "base64").toString("utf8");
    return JSON.parse(decoded);
  }
  const credPath = (process.env.GOOGLE_APPLICATION_CREDENTIALS || "").trim();
  if (credPath && fs.existsSync(credPath)) {
    return JSON.parse(fs.readFileSync(credPath, "utf8"));
  }
  return null;
}

async function getAccessToken(sa) {
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/webmasters.readonly",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  })).toString("base64url");
  const signer = crypto.createSign("RSA-SHA256");
  signer.update(`${header}.${payload}`);
  const sig = signer.sign(sa.private_key, "base64url");

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${header}.${payload}.${sig}`,
    }),
  });
  const json = await res.json();
  if (!res.ok || !json.access_token) {
    throw new Error(`OAuth token exchange failed: ${JSON.stringify(json)}`);
  }
  return json.access_token;
}

async function gscFetch(token, urlPath, body) {
  const res = await fetch(`https://www.googleapis.com/webmasters/v3${urlPath}`, {
    method: body ? "POST" : "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`GSC API ${res.status} on ${urlPath}: ${JSON.stringify(json)}`);
  return json;
}

async function fetchSiteTelemetry(token, siteUrl, domainLabel) {
  const todayUtc = new Date().toISOString().slice(0, 10);
  const startDate = new Date(Date.now() - 34 * 86400000).toISOString().slice(0, 10);

  const dateResp = await gscFetch(token, `/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`, {
    startDate, endDate: todayUtc, dimensions: ["date"], dataState: "all", rowLimit: 60,
  });

  const nonEmptyRows = (dateResp.rows || [])
    .filter((r) => (r.impressions || 0) > 0 || (r.clicks || 0) > 0)
    .sort((a, b) => a.keys[0].localeCompare(b.keys[0]));

  const windowRows = nonEmptyRows.slice(-28);
  const periodStart = windowRows[0]?.keys[0] || startDate;
  const periodEnd = windowRows[windowRows.length - 1]?.keys[0] || todayUtc;

  const [overallResp, countryResp, deviceResp] = await Promise.all([
    gscFetch(token, `/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`, {
      startDate: periodStart, endDate: periodEnd, dataState: "all", rowLimit: 5,
    }),
    gscFetch(token, `/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`, {
      startDate: periodStart, endDate: periodEnd, dimensions: ["country"], dataState: "all", rowLimit: 25,
    }),
    gscFetch(token, `/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`, {
      startDate: periodStart, endDate: periodEnd, dimensions: ["device"], dataState: "all", rowLimit: 10,
    }),
  ]);

  const aggRow = overallResp.rows?.[0];
  const dayImprSum = windowRows.reduce((s, r) => s + (r.impressions || 0), 0);
  const dayClkSum = windowRows.reduce((s, r) => s + (r.clicks || 0), 0);
  const impressions = Math.round(aggRow?.impressions ?? dayImprSum);
  const clicks = Math.round(aggRow?.clicks ?? dayClkSum);
  const weightedPosSum = windowRows.reduce((s, r) => s + (r.position || 0) * (r.impressions || 0), 0);
  const avgPosition = aggRow?.position
    ? Math.round(aggRow.position * 10) / 10
    : (dayImprSum > 0 ? Math.round((weightedPosSum / dayImprSum) * 10) / 10 : 0);
  const ctr = impressions > 0 ? Math.round((clicks / impressions) * 10000) / 100 : 0;

  const completeRows = nonEmptyRows.filter((r) => r.keys[0] < todayUtc);
  const chartBase = completeRows.length >= 3 ? completeRows : nonEmptyRows;
  const chartSlice = chartBase.slice(-7);

  const maxChartImpr = Math.max(1, ...chartSlice.map((r) => r.impressions || 0));
  const maxChartClicks = Math.max(1, ...chartSlice.map((r) => r.clicks || 0));
  const peakImprThreshold = maxChartImpr * 0.78;

  const daily = chartSlice.map((r) => {
    const d = r.keys[0];
    const impr = Math.round(r.impressions || 0);
    const clk = Math.round(r.clicks || 0);
    return {
      date: d,
      label: shortDateLabel(d),
      impressions: impr,
      clicks: clk,
      ctr: impr > 0 ? Math.round((clk / impr) * 10000) / 100 : 0,
      position: Math.round((r.position || 0) * 10) / 10,
      imprPct: Math.max(6, Math.round((impr / maxChartImpr) * 100)),
      clickPct: clk > 0 ? Math.max(6, Math.round((clk / maxChartClicks) * 100)) : 4,
      isPeak: impr >= peakImprThreshold && maxChartImpr > 50,
    };
  });

  const peakRow = windowRows.reduce((best, r) => (!best || r.impressions > best.impressions ? r : best), null);
  const peakDay = peakRow ? {
    date: peakRow.keys[0],
    label: shortDateLabel(peakRow.keys[0]),
    impressions: Math.round(peakRow.impressions || 0),
    clicks: Math.round(peakRow.clicks || 0),
  } : { date: todayUtc, label: shortDateLabel(todayUtc), impressions: 0, clicks: 0 };

  const prev7Impr = chartBase.slice(-14, -7).reduce((s, r) => s + (r.impressions || 0), 0);
  const last7Impr = chartSlice.reduce((s, r) => s + (r.impressions || 0), 0);
  const wkGrowthPct = prev7Impr >= 100 ? Math.round(((last7Impr - prev7Impr) / prev7Impr) * 100) : null;
  const trendLabel = wkGrowthPct !== null && wkGrowthPct > 0
    ? `+${wkGrowthPct}% wk/wk`
    : `${compactNum(peakDay.impressions)}/day peak`;

  const rawCountries = (countryResp.rows || []).slice().sort((a, b) => (b.impressions || 0) - (a.impressions || 0));
  const maxCtryImpr = Math.max(1, rawCountries[0]?.impressions || 1);
  const countries = rawCountries.slice(0, 6).map((r) => {
    const code = r.keys[0];
    const impr = Math.round(r.impressions || 0);
    const clk = Math.round(r.clicks || 0);
    return {
      code,
      name: countryDisplayName(code),
      impressions: impr,
      clicks: clk,
      pct: Math.max(6, Math.round((impr / maxCtryImpr) * 100)),
    };
  });

  const totalDevImpr = Math.max(1, (deviceResp.rows || []).reduce((s, r) => s + (r.impressions || 0), 0));
  const devices = (deviceResp.rows || []).slice().sort((a, b) => (b.impressions || 0) - (a.impressions || 0)).map((r) => ({
    device: String(r.keys[0] || "").toLowerCase(),
    impressions: Math.round(r.impressions || 0),
    clicks: Math.round(r.clicks || 0),
    sharePct: Math.round(((r.impressions || 0) / totalDevImpr) * 100),
  }));

  return {
    domain: domainLabel,
    siteUrl,
    activeDays: windowRows.length,
    periodStart,
    periodEnd,
    periodLabel: formatDateRange(periodStart, periodEnd),
    chartRangeLabel: daily.length ? formatDateRange(daily[0].date, daily[daily.length - 1].date).replace(/,\s*\d{4}$/, "") : "",
    impressions,
    clicks,
    ctr,
    avgPosition,
    peakDay,
    wkGrowthPct,
    trendLabel,
    daily,
    countries,
    devices,
  };
}

async function main() {
  const sa = loadServiceAccount();
  if (!sa) {
    console.log("[sync-gsc-stats] No GSC credentials found (GSC_SERVICE_ACCOUNT_JSON / --key-file); skipping sync.");
    return;
  }

  const token = await getAccessToken(sa);
  const { siteEntry = [] } = await gscFetch(token, "/sites");
  const messiSite = siteEntry.find((s) => /messistat\.com/i.test(s.siteUrl))?.siteUrl;
  const ronaldoSite = siteEntry.find((s) => /ronaldostats\.site/i.test(s.siteUrl))?.siteUrl;

  if (!messiSite && !ronaldoSite) {
    throw new Error(`No messistat.com or ronaldostats.site properties accessible to ${sa.client_email}`);
  }

  const [messi, ronaldo] = await Promise.all([
    messiSite ? fetchSiteTelemetry(token, messiSite, "messistat.com") : null,
    ronaldoSite ? fetchSiteTelemetry(token, ronaldoSite, "ronaldostats.site") : null,
  ]);

  const combined = {
    impressions: (messi?.impressions || 0) + (ronaldo?.impressions || 0),
    clicks: (messi?.clicks || 0) + (ronaldo?.clicks || 0),
    properties: [messi, ronaldo].filter(Boolean).length,
  };

  const primary = SELF_SITE === "messi" ? messi : ronaldo;
  const partner = SELF_SITE === "messi" ? ronaldo : messi;

  const corePayload = { primary, partner, combined };

  if (fs.existsSync(OUT_FILE)) {
    try {
      const prev = JSON.parse(fs.readFileSync(OUT_FILE, "utf8"));
      const prevCore = JSON.stringify({ primary: prev.primary, partner: prev.partner, combined: prev.combined });
      if (prevCore === JSON.stringify(corePayload)) {
        console.log("[sync-gsc-stats] Search Console metrics unchanged; leaving public/data/gsc-stats.json untouched.");
        return;
      }
    } catch {}
  }

  const output = {
    updatedAt: new Date().toISOString(),
    source: "Google Search Console API",
    ...corePayload,
  };

  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(OUT_FILE, JSON.stringify(output, null, 2) + "\n", "utf8");
  console.log(
    `[sync-gsc-stats] Updated ${path.relative(ROOT, OUT_FILE)}: primary=${primary?.impressions} impr/${primary?.clicks} clicks, partner=${partner?.impressions} impr, combined=${combined.impressions}`
  );
}

main().catch((err) => {
  console.error("[sync-gsc-stats] Failed:", err.message);
  process.exit(1);
});
