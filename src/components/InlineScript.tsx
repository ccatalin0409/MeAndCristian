// Mic ajutor pentru scripturi „inline" care trebuie să ruleze înainte de hidratare
// (ex: aplicarea temei în <head>). Pe server marchează scriptul ca executabil
// (type="text/javascript"), iar pe client ca inert (type="text/plain"), ca să
// nu apară warning-ul „Encountered a script tag while rendering". Pattern recomandat
// în docs Next.js: 02-guides/preventing-flash-before-hydration.
export default function InlineScript({ html }: { html: string }) {
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
