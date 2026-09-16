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

export function normalize(rawInput: string): NormalizeResult {
  const cleaned = stripDiacritics(rawInput.trim().toLowerCase());

  const ambiguousMatch = (aliasesData.ambiguous as Record<string, string[]>)[cleaned];
  if (ambiguousMatch) {
    return { normalized: cleaned, matchedSynonym: null, ambiguousCandidates: ambiguousMatch };
  }

  const synonymMatch = (aliasesData.synonyms as Record<string, string>)[cleaned];
  if (synonymMatch) {
    return { normalized: cleaned, matchedSynonym: synonymMatch, ambiguousCandidates: null };
  }

  return { normalized: cleaned, matchedSynonym: null, ambiguousCandidates: null };
}
