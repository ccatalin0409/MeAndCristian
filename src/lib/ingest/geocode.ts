// Geocodare gratuită prin Nominatim (OpenStreetMap).
// Politica Nominatim: UA identificabil + max 1 cerere/secundă. Apelantul respectă pauza.

import { USER_AGENT, sleep } from "./http";

export interface LatLng {
  lat: number;
  lng: number;
}

let lastCall = 0;

export async function geocode(query: string): Promise<LatLng | null> {
  if (!query.trim()) return null;

  // Respectă limita de 1 req/sec.
  const wait = 1100 - (Date.now() - lastCall);
  if (wait > 0) await sleep(wait);
  lastCall = Date.now();

  const url =
    "https://nominatim.openstreetmap.org/search?format=json&limit=1&q=" +
    encodeURIComponent(query);

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT, "Accept-Language": "ro" },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as Array<{ lat: string; lon: string }>;
    if (!data.length) return null;
    return { lat: Number(data[0].lat), lng: Number(data[0].lon) };
  } catch {
    return null;
  }
}
