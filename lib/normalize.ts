import { distance } from "fastest-levenshtein";
import aliasesData from "@/data/aliases.json";

export interface NormalizeResult {
  normalized: string;
  matchedSynonym: string | null;
  ambiguousCandidates: string[] | null;
}

function stripDiacritics(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
}

const ALIAS_FUZZY_MIN_KEY_LENGTH = 5;
const ALIAS_FUZZY_RATIO = 0.2;

/**
 * Only fuzzy-match alias keys of a minimum length, with a tight ratio-based tolerance —
 * short abbreviations like "hr" or "ba" are too easy to false-positive on unrelated
 * input, so those only ever resolve via an exact match.
 */
function fuzzyMatchAliasKey<T>(input: string, dict: Record<string, T>): T | null {
  let best: { dist: number; value: T } | null = null;
  for (const key of Object.keys(dict)) {
    if (key.length < ALIAS_FUZZY_MIN_KEY_LENGTH) continue;
    const threshold = Math.max(1, Math.floor(key.length * ALIAS_FUZZY_RATIO));
    const dist = distance(input, key);
    if (dist <= threshold && (!best || dist < best.dist)) {
      best = { dist, value: dict[key] };
    }
  }
  return best?.value ?? null;
}

export function normalize(rawInput: string): NormalizeResult {
  const cleaned = stripDiacritics(rawInput.trim().toLowerCase());
  const ambiguousDict = aliasesData.ambiguous as Record<string, string[]>;
  const synonymsDict = aliasesData.synonyms as Record<string, string>;

  const ambiguousMatch = ambiguousDict[cleaned];
  if (ambiguousMatch) {
    return { normalized: cleaned, matchedSynonym: null, ambiguousCandidates: ambiguousMatch };
  }

  const synonymMatch = synonymsDict[cleaned];
  if (synonymMatch) {
    return { normalized: cleaned, matchedSynonym: synonymMatch, ambiguousCandidates: null };
  }

  // Exact alias lookup failed — try a fuzzy pass over alias keys too, so a typo in a
  // Vietnamese (or English) alias still resolves instead of being treated as a brand-new
  // job title (e.g. "Ke Toa" as a typo of the "ke toan" alias for Accountant).
  const fuzzyAmbiguous = fuzzyMatchAliasKey(cleaned, ambiguousDict);
  if (fuzzyAmbiguous) {
    return { normalized: cleaned, matchedSynonym: null, ambiguousCandidates: fuzzyAmbiguous };
  }

  const fuzzySynonym = fuzzyMatchAliasKey(cleaned, synonymsDict);
  if (fuzzySynonym) {
    return { normalized: cleaned, matchedSynonym: fuzzySynonym, ambiguousCandidates: null };
  }

  return { normalized: cleaned, matchedSynonym: null, ambiguousCandidates: null };
}
