// Date demo pentru București. Folosite ca fallback când Supabase nu e configurat,
// și ca sursă pentru scriptul de seed al bazei de date (scripts/seed.ts).
//
// Localurile au coordonate reale ca harta (Leaflet) să arate corect.
// Datele evenimentelor sunt calculate relativ la „azi" ca filtrele
// Diseară / Mâine / Weekend să aibă mereu conținut de testat.

import type { Category, City, EventWithRelations, Venue } from "@/types";

export const CITIES: City[] = [
  {
    id: "bucuresti",
    name: "București",
    slug: "bucuresti",
    lat: 44.4268,
    lng: 26.1025,
    timezone: "Europe/Bucharest",
  },
];

export const CATEGORIES: Category[] = [
  { id: "concerte", name: "Concerte", slug: "concerte" },
  { id: "stand-up", name: "Stand-up", slug: "stand-up" },
  { id: "teatru", name: "Teatru", slug: "teatru" },
  { id: "expozitii", name: "Expoziții", slug: "expozitii" },
  { id: "targuri", name: "Târguri", slug: "targuri" },
  { id: "party", name: "Party", slug: "party" },
  { id: "family", name: "Family", slug: "family" },
  { id: "film", name: "Film", slug: "film" },
];

export const VENUES: Venue[] = [
  {
    id: "arenele-romane",
    city_id: "bucuresti",
    name: "Arenele Romane",
    address: "Str. Cutitul de Argint 5, București",
    lat: 44.4146,
    lng: 26.0997,
    website: "https://www.arenele-romane.ro",
    is_partner: false,
  },
  {
    id: "control-club",
    city_id: "bucuresti",
    name: "Control Club",
    address: "Str. Constantin Mille 4, București",
    lat: 44.4357,
    lng: 26.0967,
    website: "https://control-club.ro",
    is_partner: true,
  },
  {
    id: "quantic",
    city_id: "bucuresti",
    name: "Quantic",
    address: "Splaiul Independenței 210, București",
    lat: 44.4268,
    lng: 26.0535,
    website: "https://quanticclub.ro",
    is_partner: false,
  },
  {
    id: "beraria-h",
    city_id: "bucuresti",
    name: "Berăria H",
    address: "Kiseleff 32, Parcul Herăstrău, București",
    lat: 44.4676,
    lng: 26.0796,
    website: "https://berariah.ro",
    is_partner: false,
  },
  {
    id: "tnb",
    city_id: "bucuresti",
    name: "Teatrul Național București",
    address: "Bd. Nicolae Bălcescu 2, București",
    lat: 44.4366,
    lng: 26.1024,
    website: "https://www.tnb.ro",
    is_partner: false,
  },
  {
    id: "mnar",
    city_id: "bucuresti",
    name: "Muzeul Național de Artă al României",
    address: "Calea Victoriei 49-53, București",
    lat: 44.4396,
    lng: 26.0966,
    website: "https://www.mnar.arts.ro",
    is_partner: false,
  },
  {
    id: "romexpo",
    city_id: "bucuresti",
    name: "Romexpo",
    address: "Bd. Mărăști 65-67, București",
    lat: 44.4757,
    lng: 26.066,
    website: "https://www.romexpo.ro",
    is_partner: false,
  },
  {
    id: "godot",
    city_id: "bucuresti",
    name: "Godot Cafe-Teatru",
    address: "Str. Blănari 14, București",
    lat: 44.4338,
    lng: 26.1018,
    website: "https://www.godotcafe.ro",
    is_partner: false,
  },
  {
    id: "arcub-gabroveni",
    city_id: "bucuresti",
    name: "ARCUB - Hanul Gabroveni",
    address: "Str. Gabroveni 50-52, București",
    lat: 44.4312,
    lng: 26.1006,
    website: "https://www.arcub.ro",
    is_partner: false,
  },
];

// Construiește o dată relativă la acum: peste `dayOffset` zile, la ora `hour`:`minute`.
function at(dayOffset: number, hour: number, minute = 0): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + dayOffset);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

// Câte zile până la următoarea sâmbătă (0 = azi e sâmbătă).
function daysUntilNextSaturday(): number {
  const today = new Date().getDay(); // 0=duminică ... 6=sâmbătă
  return (6 - today + 7) % 7;
}

interface SeedEventInput {
  id: string;
  title: string;
  description: string;
  category_id: string;
  venue_id: string;
  dayOffset: number;
  hour: number;
  minute?: number;
  is_free?: boolean;
  price_min?: number | null;
  price_max?: number | null;
  is_family_friendly?: boolean;
  image_url?: string | null;
  ticket_url?: string | null;
  is_promoted?: boolean;
}

const sat = daysUntilNextSaturday();
const sun = sat + 1;

const RAW_EVENTS: SeedEventInput[] = [
  {
    id: "ev-1",
    title: "Concert indie: Coma live",
    description:
      "Trupa Coma revine la Arenele Romane cu un show energic și piese de pe noul album. Deschidere ușile la 19:00.",
    category_id: "concerte",
    venue_id: "arenele-romane",
    dayOffset: 0,
    hour: 20,
    price_min: 120,
    price_max: 250,
    ticket_url: "https://www.iabilet.ro",
    is_promoted: true,
  },
  {
    id: "ev-2",
    title: "Stand-up Comedy: seară deschisă",
    description:
      "Open mic cu comedianți tineri din București. Intrare liberă, consumație recomandată.",
    category_id: "stand-up",
    venue_id: "control-club",
    dayOffset: 0,
    hour: 21,
    is_free: true,
  },
  {
    id: "ev-3",
    title: "DJ set: Techno Night",
    description: "Noapte de techno cu invitați locali. 18+, bilet la intrare.",
    category_id: "party",
    venue_id: "quantic",
    dayOffset: 0,
    hour: 23,
    price_min: 40,
    price_max: 60,
    ticket_url: "https://www.iabilet.ro",
  },
  {
    id: "ev-4",
    title: "Hamlet",
    description:
      "Spectacol clasic pus în scenă de Teatrul Național București. Durată aprox. 2h30.",
    category_id: "teatru",
    venue_id: "tnb",
    dayOffset: 1,
    hour: 19,
    price_min: 50,
    price_max: 120,
    ticket_url: "https://bilete.tnb.ro",
  },
  {
    id: "ev-5",
    title: "Expoziție: Maeștri ai picturii românești",
    description:
      "Tur ghidat prin colecția permanentă, cu accent pe Grigorescu și Luchian. Bilet redus pentru studenți.",
    category_id: "expozitii",
    venue_id: "mnar",
    dayOffset: 1,
    hour: 11,
    price_min: 20,
    price_max: 30,
    is_family_friendly: true,
  },
  {
    id: "ev-6",
    title: "Berăria H - Seară cu muzică live",
    description:
      "Cover band cu hituri rock și pop. Atmosferă relaxată, intrare liberă.",
    category_id: "concerte",
    venue_id: "beraria-h",
    dayOffset: 1,
    hour: 20,
    is_free: true,
  },
  {
    id: "ev-7",
    title: "Târg de design & handmade",
    description:
      "Zeci de creatori locali: bijuterii, haine, ceramică, ilustrație. Intrare liberă, weekend întreg.",
    category_id: "targuri",
    venue_id: "romexpo",
    dayOffset: sat,
    hour: 10,
    is_free: true,
    is_family_friendly: true,
  },
  {
    id: "ev-8",
    title: "Atelier de pictură pentru copii",
    description:
      "Activitate creativă pentru cei mici (4-10 ani), cu materiale incluse. Locuri limitate.",
    category_id: "family",
    venue_id: "arcub-gabroveni",
    dayOffset: sat,
    hour: 12,
    price_min: 50,
    price_max: 50,
    is_family_friendly: true,
  },
  {
    id: "ev-9",
    title: "Stand-up: Special de weekend",
    description:
      "Show de o oră cu unul dintre cei mai cunoscuți comedianți români.",
    category_id: "stand-up",
    venue_id: "godot",
    dayOffset: sat,
    hour: 20,
    price_min: 60,
    price_max: 80,
    ticket_url: "https://www.iabilet.ro",
    is_promoted: true,
  },
  {
    id: "ev-10",
    title: "Concert simfonic",
    description:
      "Orchestra interpretează Beethoven și Ceaikovski. Seară elegantă de muzică clasică.",
    category_id: "concerte",
    venue_id: "tnb",
    dayOffset: sat,
    hour: 19,
    price_min: 70,
    price_max: 150,
    ticket_url: "https://bilete.tnb.ro",
  },
  {
    id: "ev-11",
    title: "Petrecere retro 80s-90s",
    description: "Hituri retro toată noaptea. Dress code: tot ce strălucește.",
    category_id: "party",
    venue_id: "control-club",
    dayOffset: sat,
    hour: 22,
    price_min: 30,
    price_max: 30,
  },
  {
    id: "ev-12",
    title: "Proiecție film în aer liber",
    description:
      "Film clasic proiectat în grădină. Adu o pătură. Gratis, în limita locurilor.",
    category_id: "film",
    venue_id: "beraria-h",
    dayOffset: sun,
    hour: 21,
    is_free: true,
    is_family_friendly: true,
  },
  {
    id: "ev-13",
    title: "Brunch & jazz",
    description: "Duminică lentă cu jazz live și brunch. Rezervare recomandată.",
    category_id: "concerte",
    venue_id: "beraria-h",
    dayOffset: sun,
    hour: 12,
    price_min: 0,
    price_max: 0,
    is_free: true,
  },
  {
    id: "ev-14",
    title: "Matineu de teatru pentru familii",
    description: "Poveste pe scenă pentru copii și părinți. Durată 60 min.",
    category_id: "family",
    venue_id: "godot",
    dayOffset: sun,
    hour: 11,
    price_min: 40,
    price_max: 40,
    is_family_friendly: true,
  },
  {
    id: "ev-15",
    title: "Vernisaj: artă contemporană",
    description:
      "Deschiderea unei expoziții de tineri artiști. Intrare liberă la vernisaj.",
    category_id: "expozitii",
    venue_id: "arcub-gabroveni",
    dayOffset: 3,
    hour: 18,
    is_free: true,
  },
  {
    id: "ev-16",
    title: "Concert rock: trupă internațională",
    description:
      "Eveniment major în turneu european, oprire la București. Bilete limitate.",
    category_id: "concerte",
    venue_id: "arenele-romane",
    dayOffset: 5,
    hour: 20,
    price_min: 180,
    price_max: 400,
    ticket_url: "https://www.iabilet.ro",
    is_promoted: true,
  },
  {
    id: "ev-17",
    title: "Seară de boardgames",
    description:
      "Jocuri de societate pentru toate nivelurile. Vino singur sau cu prietenii.",
    category_id: "party",
    venue_id: "control-club",
    dayOffset: 4,
    hour: 19,
    is_free: true,
  },
  {
    id: "ev-18",
    title: "Workshop fotografie de stradă",
    description:
      "Curs practic prin centrul vechi, cu un fotograf profesionist. Adu-ți aparatul.",
    category_id: "expozitii",
    venue_id: "arcub-gabroveni",
    dayOffset: 6,
    hour: 16,
    price_min: 150,
    price_max: 150,
  },
];

const nowIso = () => new Date().toISOString();

function buildEvent(input: SeedEventInput): EventWithRelations {
  const venue = VENUES.find((v) => v.id === input.venue_id) ?? null;
  const category = CATEGORIES.find((c) => c.id === input.category_id) ?? null;
  const isFree = input.is_free ?? false;
  return {
    id: input.id,
    city_id: "bucuresti",
    venue_id: input.venue_id,
    title: input.title,
    description: input.description,
    category_id: input.category_id,
    starts_at: at(input.dayOffset, input.hour, input.minute ?? 0),
    ends_at: null,
    is_free: isFree,
    price_min: isFree ? 0 : input.price_min ?? null,
    price_max: isFree ? 0 : input.price_max ?? null,
    is_family_friendly: input.is_family_friendly ?? false,
    image_url: input.image_url ?? null,
    ticket_url: input.ticket_url ?? null,
    source_id: "manual",
    external_id: input.id,
    status: "published",
    is_promoted: input.is_promoted ?? false,
    created_at: nowIso(),
    updated_at: nowIso(),
    venue,
    category,
  };
}

// Evenimentele demo cu relațiile rezolvate, gata de afișat în UI.
export function getSeedEvents(): EventWithRelations[] {
  return RAW_EVENTS.map(buildEvent).sort(
    (a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()
  );
}
