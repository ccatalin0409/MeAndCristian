// Curăță textul venit din JSON-LD: multe surse pun descrierea cu HTML brut
// (<p>, <br />, <strong>) și entități (&#8211;, &amp;, &nbsp;). Le transformăm
// în text simplu, lizibil, păstrând paragrafele ca rânduri goale.

// Entități cu nume folosite des în descrieri românești.
const NAMED: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  hellip: "…",
  ndash: "–",
  mdash: "—",
  laquo: "«",
  raquo: "»",
  bdquo: "„",
  ldquo: "“",
  rdquo: "”",
  lsquo: "‘",
  rsquo: "’",
  deg: "°",
  euro: "€",
  copy: "©",
  reg: "®",
  trade: "™",
  middot: "·",
  bull: "•",
};

function decodeEntities(s: string): string {
  return s.replace(/&(#x?[0-9a-f]+|[a-z][a-z0-9]*);/gi, (m, body) => {
    if (body[0] === "#") {
      const code =
        body[1] === "x" || body[1] === "X"
          ? parseInt(body.slice(2), 16)
          : parseInt(body.slice(1), 10);
      if (Number.isFinite(code) && code > 0) {
        try {
          return String.fromCodePoint(code);
        } catch {
          return m;
        }
      }
      return m;
    }
    const named = NAMED[body.toLowerCase()];
    return named ?? m;
  });
}

// Transformă un fragment HTML/encodat în text simplu.
export function cleanText(input: string | null | undefined): string | null {
  if (!input) return null;
  let s = input;

  // Tag-uri de bloc / rupturi de rând -> newline (păstrăm structura).
  s = s.replace(/<\s*(br|\/p|\/div|\/li|\/h[1-6])\s*\/?\s*>/gi, "\n");
  // Restul tag-urilor -> le scoatem.
  s = s.replace(/<[^>]+>/g, "");
  // Entități (&#8211;, &amp;, &nbsp; ...).
  s = decodeEntities(s);
  // Normalizare Unicode (caractere „fancy") + spații.
  s = s.normalize("NFKC");
  // Spații/taburi multiple -> unul singur, dar păstrăm newline-urile.
  s = s.replace(/[ \t ]+/g, " ");
  // Max două newline-uri consecutive; curățăm spațiile din jurul lor.
  s = s.replace(/[ ]*\n[ ]*/g, "\n").replace(/\n{3,}/g, "\n\n");
  s = s.trim();

  return s || null;
}
