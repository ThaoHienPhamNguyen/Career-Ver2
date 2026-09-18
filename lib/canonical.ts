import { distance } from "fastest-levenshtein";
import { normalize } from "./normalize";

export type CanonicalMatchResult =
  | { status: "matched"; canonicalName: string }
  | { status: "ambiguous"; candidates: string[] }
  | { status: "new"; canonicalName: string };

const FUZZY_MATCH_MIN_DISTANCE = 2;
const FUZZY_MATCH_RATIO = 0.25;

/**
 * A fixed edit-distance cutoff is too strict for long, multi-word titles (a typo in each
 * of 2-3 words easily exceeds a flat distance of 2). Scale the tolerance with name length
 * instead, with a floor of 2 so short titles keep the original tight tolerance.
 */
function fuzzyThreshold(name: string): number {
  return Math.max(FUZZY_MATCH_MIN_DISTANCE, Math.floor(name.length * FUZZY_MATCH_RATIO));
}

function toTitleCase(input: string): string {
  return input
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function matchCanonical(
  rawInput: string,
  knownCanonicalNames: string[]
): CanonicalMatchResult {
  const { normalized, matchedSynonym, ambiguousCandidates } = normalize(rawInput);

  if (ambiguousCandidates) {
    return { status: "ambiguous", candidates: ambiguousCandidates };
  }

  if (matchedSynonym) {
    return { status: "matched", canonicalName: matchedSynonym };
  }

  const exactMatch = knownCanonicalNames.find((name) => name.toLowerCase() === normalized);
  if (exactMatch) {
    return { status: "matched", canonicalName: exactMatch };
  }

  let closest: { name: string; dist: number } | null = null;
  for (const name of knownCanonicalNames) {
    const dist = distance(normalized, name.toLowerCase());
    if (dist <= fuzzyThreshold(name) && (!closest || dist < closest.dist)) {
      closest = { name, dist };
    }
  }
  if (closest) {
    return { status: "matched", canonicalName: closest.name };
  }

  return { status: "new", canonicalName: toTitleCase(normalized) };
}
