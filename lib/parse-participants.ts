export type ParsedParticipant = {
  email: string;
  name: string | null;
};

export type ParseResult = {
  parsed: ParsedParticipant[];
  skipped: string[];
};

const NAMED_RE = /^(.+?)\s*<\s*([^\s<>]+@[^\s<>]+\.[^\s<>]+)\s*>$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function parseBulkParticipants(input: string): ParseResult {
  const parsed: ParsedParticipant[] = [];
  const skipped: string[] = [];
  const seen = new Set<string>();

  const chunks = input
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const chunk of chunks) {
    const named = chunk.match(NAMED_RE);
    if (named) {
      const name = named[1].replace(/^"|"$/g, "").trim();
      const email = named[2].toLowerCase();
      if (seen.has(email)) continue;
      seen.add(email);
      parsed.push({ email, name: name.length === 0 ? null : name });
      continue;
    }
    if (EMAIL_RE.test(chunk)) {
      const email = chunk.toLowerCase();
      if (seen.has(email)) continue;
      seen.add(email);
      parsed.push({ email, name: null });
      continue;
    }
    skipped.push(chunk);
  }

  return { parsed, skipped };
}
