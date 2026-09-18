/** Finds the first balanced top-level `{...}` or `[...]` in text, ignoring braces inside string literals. */
export function extractFirstJsonValue(text: string): string | null {
  const startMatch = text.match(/[{[]/);
  if (!startMatch || startMatch.index === undefined) return null;

  const openChar = startMatch[0];
  const closeChar = openChar === "{" ? "}" : "]";
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = startMatch.index; i < text.length; i++) {
    const char = text[i];

    if (inString) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === '"') inString = false;
      continue;
    }

    if (char === '"') {
      inString = true;
    } else if (char === openChar) {
      depth++;
    } else if (char === closeChar) {
      depth--;
      if (depth === 0) return text.slice(startMatch.index, i + 1);
    }
  }

  return null;
}
