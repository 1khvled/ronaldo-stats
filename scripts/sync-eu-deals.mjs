#!/usr/bin/env node
/**
 * sync-eu-deals.mjs
 *
 * Fetches the latest verified European AliExpress deal posts from the public
 * Telegram web preview (https://t.me/s/francedealsdz) and writes clean JSON
 * to public/data/eu-deals.json for display inside the EU Deals popup.
 *
 * Strictly links to https://t.me/francedealsdz/<postId> and filters out any
 * third-party / deprecated site links.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_FILE = path.join(ROOT, "public", "data", "eu-deals.json");
const CHANNEL = "francedealsdz";
const SOURCE_URL = `https://t.me/s/${CHANNEL}`;

function decodeEntities(str) {
  return str
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&#0?33;/g, "!")
    .replace(/&#0?36;/g, "$")
    .replace(/&euro;/gi, "€")
    .replace(/&nbsp;/gi, " ")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/[ \t]+/g, " ");
}

function cleanTitle(raw) {
  let s = raw.replace(/^✅\s*/, "").replace(/\s+/g, " ").trim();
  s = s.replace(/\s+(para|pour|for|mit|de|en|avec)\s*$/i, "").trim();
  if (s.length > 68) {
    s = s.slice(0, 65).replace(/\s+\S*$/, "").trim() + "...";
  }
  return s;
}

function formatEuroPrice(raw) {
  const n = Number.parseFloat(String(raw).replace(",", "."));
  if (!Number.isFinite(n) || n <= 0) return "";
  return Number.isInteger(n) ? `${n}€` : `${n.toFixed(2).replace(/\.00$/, "")}€`;
}

function detectRegion(text) {
  if (/Espagne|España|Spain|🇪🇸/i.test(text)) return "ES";
  if (/France|🇫🇷/i.test(text)) return "FR";
  if (/Allemagne|Germany|Deutschland|🇩🇪/i.test(text)) return "DE";
  if (/Italie|Italy|Italia|🇮🇹/i.test(text)) return "IT";
  return "EU";
}

function parsePosts(html) {
  const chunks = html.split('<div class="tgme_widget_message_wrap').slice(1);
  const parsed = [];

  for (const chunk of chunks) {
    const postMatch = chunk.match(/data-post="(francedealsdz\/(\d+))"/);
    if (!postMatch) continue;
    const [, postPath, postId] = postMatch;

    const textMatch = chunk.match(/<div class="tgme_widget_message_text[^"]*"[^>]*>([\s\S]*?)<\/div>/);
    if (!textMatch) continue;

    const plain = decodeEntities(textMatch[1]);
    if (/dealscoutgreen/i.test(plain) || /dealscoutgreen/i.test(chunk)) {
      const filteredLines = plain
        .split(/\r?\n/)
        .filter((l) => !/dealscoutgreen/i.test(l));
      if (!filteredLines.length) continue;
    }

    const lines = plain
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l && !/dealscoutgreen|@alilo07bot|@francedealsdz/i.test(l));

    const checkLine = lines.find((l) => l.startsWith("✅"));
    if (!checkLine) continue;

    const paypalPriceMatch = plain.match(/Prix\s*\(?(?:avec\s+)?PayPal\)?\s*:\s*([\d.,]+)\s*€/i);
    const stdPriceMatch = plain.match(/Prix[^:\n]*:\s*([\d.,]+)\s*€/i);
    const rawPrice = (paypalPriceMatch && paypalPriceMatch[1]) || (stdPriceMatch && stdPriceMatch[1]);
    const price = formatEuroPrice(rawPrice);
    if (!price) continue;

    const codeMatch = plain.match(/Code\s+promo\s*:\s*([A-Z0-9]{4,18})/i);
    const title = cleanTitle(checkLine);
    if (!title || title.length < 4) continue;

    const timeMatch = chunk.match(/datetime="([^"]+)"/);

    parsed.push({
      id: postId,
      url: `https://t.me/${postPath}`,
      title,
      price,
      code: codeMatch ? codeMatch[1].toUpperCase() : null,
      region: detectRegion(plain),
      postedAt: timeMatch ? timeMatch[1] : null,
    });
  }

  return parsed.slice(-4).reverse();
}

async function main() {
  const res = await fetch(SOURCE_URL, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; MessiStat-RonaldoStats-DealSync/1.0)",
      "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
    },
  });
  if (!res.ok) {
    throw new Error(`Telegram fetch failed: HTTP ${res.status}`);
  }
  const html = await res.text();
  const deals = parsePosts(html);
  if (!deals.length) {
    throw new Error("Parsed 0 valid EU deals from t.me/s/francedealsdz");
  }

  const nextSignature = JSON.stringify({ channel: CHANNEL, deals });
  if (fs.existsSync(OUT_FILE)) {
    try {
      const prev = JSON.parse(fs.readFileSync(OUT_FILE, "utf8"));
      const prevSignature = JSON.stringify({ channel: prev.channel, deals: prev.deals });
      if (prevSignature === nextSignature) {
        console.log(`[eu-deals] Unchanged (${deals.length} deals, latest #${deals[0].id}).`);
        return;
      }
    } catch (_) {}
  }

  const payload = {
    channel: CHANNEL,
    channelUrl: `https://t.me/${CHANNEL}`,
    updatedAt: new Date().toISOString(),
    deals,
  };
  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(OUT_FILE, JSON.stringify(payload, null, 2) + "\n", "utf8");
  console.log(`[eu-deals] Wrote ${deals.length} live EU deals to ${path.relative(ROOT, OUT_FILE)} (latest #${deals[0].id}: ${deals[0].title} @ ${deals[0].price}).`);
}

main().catch((err) => {
  console.error("[eu-deals] Warning:", err.message);
  process.exitCode = 1;
});
