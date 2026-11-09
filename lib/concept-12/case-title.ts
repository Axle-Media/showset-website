/** Consistent case-study title line breaks across Home, Our Work and stories.
 * The first full stop followed by further wording creates a deliberate line
 * break. A title ending in a full stop stays on one line, and authored line
 * breaks still work for titles without that separator.
 */
export function splitCaseTitle(value: string): string[] {
  const text = value.trim().replace(/\r\n?/g, "\n");
  const firstPeriod = /\.(?=\s+\S)/.exec(text);
  if (firstPeriod) {
    const before = text.slice(0, firstPeriod.index + 1).replace(/\s+/g, " ").trim();
    const after = text.slice(firstPeriod.index + 1).replace(/\s+/g, " ").trim();
    if (before && after) return [before, after];
  }
  return text.split(/\n+/).map(line => line.replace(/\s+/g, " ").trim()).filter(Boolean);
}

export function normaliseCaseTitle(value: string): string {
  return splitCaseTitle(value).join("\n");
}
