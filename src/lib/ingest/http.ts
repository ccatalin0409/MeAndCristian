// Fetch „politicos": user-agent identificabil, timeout, reîncercări și pauză între requesturi.
// Respectăm sursele — fără rafale, cu UA clar.

export const USER_AGENT =
  "CeFacInOrasBot/0.1 (+https://github.com/ccatalin0409/MeAndCristian; agregator evenimente Bucuresti)";

export function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export interface FetchOptions {
  timeoutMs?: number;
  retries?: number;
}

export async function politeFetch(
  url: string,
  { timeoutMs = 20000, retries = 2 }: FetchOptions = {}
): Promise<string> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": USER_AGENT,
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "ro-RO,ro;q=0.9,en;q=0.8",
        },
        signal: controller.signal,
        redirect: "follow",
      });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`HTTP ${res.status} la ${url}`);
      return await res.text();
    } catch (err) {
      clearTimeout(timer);
      lastErr = err;
      if (attempt < retries) await sleep(1000 * (attempt + 1));
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}
