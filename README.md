# Ce fac în oraș 🎉

Aplicație web (PWA) care adună într-un singur loc tot ce se întâmplă în **București**:
concerte, stand-up, teatru, expoziții, târguri, petreceri. Mobile-first, merge pe
telefon (iOS/Android) și PC din același cod.

> MVP construit conform `docs/SPEC.md`. Stack: **Next.js 16 + TypeScript + Tailwind 4 + Supabase + Leaflet**.

---

## Cuprins
- [Pornire rapidă (mod demo)](#pornire-rapidă-mod-demo)
- [Configurare Supabase (date reale)](#configurare-supabase-date-reale)
- [Cum lucrăm în doi pe GitHub](#cum-lucrăm-în-doi-pe-github)
- [Structura proiectului](#structura-proiectului)
- [Deploy pe Vercel](#deploy-pe-vercel)
- [De unde luăm evenimentele](#de-unde-luăm-evenimentele)

---

## Pornire rapidă (mod demo)

Fără nicio configurare, aplicația rulează cu **evenimente de test** (date demo din
București), ca să poți vedea imediat UI-ul.

```bash
npm install
npm run dev
```

Deschide http://localhost:3000

Funcționalități disponibile în demo: feed, filtre (Diseară/Mâine/Weekend/Gratis/Lângă
mine + categorie), pagină de eveniment, hartă, salvare (în localStorage).
Adminul și autentificarea reală necesită Supabase (mai jos).

---

## Configurare Supabase (date reale)

1. Creează un proiect gratuit pe [supabase.com](https://supabase.com).
2. **SQL Editor → New query** → lipește conținutul din
   [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql) → **Run**.
   (creează tabelele, indexurile și politicile de securitate)
3. Copiază `.env.example` în `.env.local` și completează din
   **Project Settings → API**:
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   SUPABASE_SERVICE_ROLE_KEY=...     # doar pentru seed local
   ADMIN_EMAILS=email@tau.com        # cine are acces la /admin
   ```
4. Populează datele demo în DB:
   ```bash
   npm run seed
   ```
5. Repornește `npm run dev`. Banner-ul „mod demo" dispare.

### Acces la /admin
Adminul e protejat. Un cont devine admin dacă emailul lui e în:
- variabila `ADMIN_EMAILS` (cel mai simplu), **sau**
- tabelul `admins` din Supabase (`insert into admins(email) values ('email@tau.com')`).

Intri pe `/login`, primești link pe email (sau Google), apoi `/admin` îți dă CRUD complet.

### Autentificare Google (opțional)
Supabase → Authentication → Providers → Google → activează și pune Client ID/Secret.
Adaugă `https://<proiect>.supabase.co/auth/v1/callback` ca redirect în Google Console.

---

## Cum lucrăm în doi pe GitHub

Repo comun: `https://github.com/ccatalin0409/MeAndCristian`

Pentru că e o **singură aplicație web** (nu iOS + Android separat), amândoi lucrați pe
același cod. Vă împărțiți pe **funcționalități**, nu pe sisteme de operare. Flux simplu:

```bash
git clone https://github.com/ccatalin0409/MeAndCristian.git
cd MeAndCristian
npm install
cp .env.example .env.local   # completați valorile Supabase

# fiecare lucrează pe branch-ul lui
git checkout -b feature/numele-functiei
# ...modificări...
git add . && git commit -m "feat: ..."
git push -u origin feature/numele-functiei
# apoi Pull Request pe GitHub, celălalt revizuiește, merge în main
```

**Lansare în store-uri mai târziu:** PWA-ul se poate publica pe Google Play (TWA via
PWABuilder) și App Store (împachetat cu Capacitor) — refolosind același cod, fără
rescriere în Swift/Kotlin.

---

## Structura proiectului

```
src/
  app/
    page.tsx                 Home / feed
    event/[id]/page.tsx      Detaliu eveniment
    saved/page.tsx           Salvate
    login/page.tsx           Autentificare
    auth/callback/route.ts   Callback OAuth/magic-link
    admin/                   Panou admin (CRUD + surse) + server actions
  components/                EventCard, FilterChips, FeedClient, MapView, ...
  lib/
    data/seed.ts             Date demo (București) — fallback + sursă seed DB
    events.ts                Acces evenimente (Supabase sau demo)
    filters.ts               Logica filtrelor (date + distanță)
    reference.ts             Categorii / localuri / orașe / surse
    admin.ts                 Verificare drepturi admin
    supabase/                Clienți browser/server + proxy sesiune
supabase/migrations/         Schema SQL
scripts/seed.ts              Populează Supabase (npm run seed)
public/                      manifest.webmanifest, sw.js, icons/
```

---

## Deploy pe Vercel

1. Push pe GitHub (deja făcut).
2. [vercel.com](https://vercel.com) → Import repo → framework detectat automat (Next.js).
3. Adaugă variabilele de mediu (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   `ADMIN_EMAILS`).
4. Deploy. Costul rămâne ~0 pe planurile gratuite.

---

## De unde luăm evenimentele

Strategia de date (vezi și secțiunea 6 din `docs/SPEC.md`), de la simplu la complex:

1. **Manual** (oricând): introduci evenimente bune din `/admin`. Garantezi calitatea.
2. **Scraping automat** (implementat): sistemul de ingestie din `src/lib/ingest/`.
   - **iaBilet** — sursa #1 ca volum. Citim datele structurate `schema.org/Event`
     (JSON-LD) de pe pagina de listare București — fără parsare fragilă de HTML.
     `robots.txt` permite paginile de listare/eveniment (verificat).
   - **Adaptor generic JSON-LD** — adaugi orice venue care publică `schema.org/Event`
     doar cu o configurație în `src/lib/ingest/sources/index.ts` (fără cod nou).
3. **Parteneri & organizatori** care își trimit singuri evenimentele (Faza 2).

> ❌ **Eventbrite API nu merge** pentru agregare: căutarea publică a fost închisă în
> 2019, acum vezi doar evenimentele propriei organizații. Nu-l folosim.
>
> ❌ **Facebook Events** — fără API public, contra ToS. Evitat.

### Cum rulezi ingestia

Necesită Supabase configurat (vezi mai sus) + `SUPABASE_SERVICE_ROLE_KEY` în `.env.local`.

```bash
npm run ingest                  # toate sursele → published
npm run ingest iabilet          # doar iaBilet
npm run ingest iabilet --dry    # preview, fără scriere în DB
npm run ingest -- --status=draft  # importă ca draft (le aprobi din /admin)
npm run ingest iabilet --max-pages=3
npm run ingest -- --no-geocode  # sare peste geocodarea Nominatim
```

Deduplicare automată pe `(source_id, external_id)` — rulezi de câte ori vrei fără dubluri.
Locurile noi primesc coordonate din venue-urile cunoscute sau prin geocodare gratuită
(Nominatim/OpenStreetMap, 1 cerere/sec).

### Ingestie programată (Vercel Cron)

`vercel.json` rulează `/api/ingest` zilnic la 06:00. Setează în Vercel variabila
`CRON_SECRET` (același secret protejează ruta). Manual: `GET /api/ingest?secret=...&source=iabilet`.

### Cum adaugi o sursă nouă

1. Verifică dacă pagina are JSON-LD: deschide sursa, caută `application/ld+json` cu `"@type":"Event"`.
2. Dacă da → adaugă `createJsonLdSource({ key, label, urls })` în
   `src/lib/ingest/sources/index.ts` și testează cu `npm run ingest <key> --dry`.
3. Dacă nu → scrie un adaptor dedicat după modelul `sources/iabilet.ts`.

⚠️ Legal: respectă `robots.txt` și termenii fiecărui site; păstrează titlu/dată/loc/link +
descriere scurtă; UA identificabil și fără rafale (vezi `src/lib/ingest/http.ts`).
Preferă feed-uri oficiale și parteneriate.
