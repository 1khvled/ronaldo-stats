// Per-language dictionary registry.
import * as en from "./en.js";
import * as es from "./es.js";
import * as pt from "./pt.js";
import * as fr from "./fr.js";
import * as ro from "./ro.js";
import * as uz from "./uz.js";
import * as ar from "./ar.js";

export const LANGS = ["en", "es", "pt", "fr", "ro", "uz", "ar"];
const REGISTRY = { en, es, pt, fr, ro, uz, ar };

export function getDict(lang) {
  return REGISTRY[lang] || REGISTRY.en;
}

export default REGISTRY;
