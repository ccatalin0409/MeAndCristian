// Extrage obiecte schema.org din tag-urile <script type="application/ld+json"> dintr-un HTML.
// Tratează: wrapper CDATA (/*<![CDATA[*/ ... /*]]>*/), array-uri și @graph.

interface JsonLdObject {
  "@type"?: string | string[];
  "@graph"?: JsonLdObject[];
  [key: string]: unknown;
}

const SCRIPT_RE =
  /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;

function stripCdata(raw: string): string {
  return raw
    .trim()
    .replace(/^\/\*\s*<!\[CDATA\[\s*\*\//, "")
    .replace(/\/\*\s*\]\]>\s*\*\/\s*$/, "")
    .replace(/^<!\[CDATA\[/, "")
    .replace(/\]\]>$/, "")
    .trim();
}

// Toate obiectele JSON-LD din pagină (aplatizând @graph).
export function extractJsonLd(html: string): JsonLdObject[] {
  const out: JsonLdObject[] = [];
  let m: RegExpExecArray | null;
  while ((m = SCRIPT_RE.exec(html))) {
    const raw = stripCdata(m[1]);
    if (!raw) continue;
    try {
      const parsed = JSON.parse(raw);
      const items = Array.isArray(parsed) ? parsed : [parsed];
      for (const item of items) {
        if (item && Array.isArray(item["@graph"])) {
          out.push(...item["@graph"]);
        } else if (item) {
          out.push(item);
        }
      }
    } catch {
      // bloc invalid — îl ignorăm
    }
  }
  return out;
}

function typeMatches(type: string | string[] | undefined, want: string): boolean {
  if (!type) return false;
  return Array.isArray(type) ? type.includes(want) : type === want;
}

// Doar obiectele de tip Event.
export function extractEvents(html: string): JsonLdObject[] {
  return extractJsonLd(html).filter((o) => typeMatches(o["@type"], "Event"));
}
