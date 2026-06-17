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

// Recunoaște Event și toate sub-tipurile schema.org (MusicEvent, TheaterEvent,
// ComedyEvent, DanceEvent, ScreeningEvent, ExhibitionEvent, Festival etc.).
function isEventType(type: string | string[] | undefined): boolean {
  if (!type) return false;
  const list = Array.isArray(type) ? type : [type];
  return list.some((t) => /Event$/.test(t) || t === "Festival");
}

// Toate obiectele de tip eveniment (inclusiv sub-tipuri).
export function extractEvents(html: string): JsonLdObject[] {
  return extractJsonLd(html).filter((o) => isEventType(o["@type"]));
}
