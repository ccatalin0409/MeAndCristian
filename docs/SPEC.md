# Ce fac în oraș — Specificații proiect

> Document de referință pentru construirea aplicației cu Claude Code.
> Citește tot înainte să începi. Construiește în ordinea din secțiunea „Plan de implementare".

---

## 1. Viziune (pe scurt)

O aplicație web (merge pe telefon și PC) care adună într-un singur loc curat **tot ce se întâmplă într-un oraș**: concerte, stand-up, teatru, expoziții, târguri, petreceri, evenimente gratuite. Utilizatorul deschide aplicația și vede instant **„ce fac diseară"** sau **„ce fac în weekend"**, filtrat după ce-l interesează.

Problema rezolvată: acum evenimentele sunt împrăștiate pe Facebook, iaBilet, Eventbrite, pagini de localuri și afișe. Nu există un loc unic, rapid și bine organizat.

**Oraș de lansare: București.** Restul orașelor vin după ce funcționează mecanismul pe unul singur.

**Principiu cheie:** valoarea aplicației = **calitatea și prospețimea datelor despre evenimente**, nu codul. Codul e partea ușoară. Restul documentului ține cont de asta.

---

## 2. Public țintă

- Orășeni 18–45 ani care vor să iasă și nu știu ce e disponibil.
- Cazuri tipice: „n-am nimic de făcut diseară", „caut ceva gratis în weekend", „vreau ceva cu copilul sâmbătă", „ce concerte sunt luna asta".

---

## 3. Stack tehnologic (ieftin, rapid, potrivit pentru un singur dezvoltator)

Toate au planuri gratuite generoase la început, deci costuri ~0 până prinzi tracțiune.

- **Frontend + backend:** Next.js (App Router) + TypeScript.
- **Stilizare:** Tailwind CSS. UI minimal, rapid, mobile-first.
- **Bază de date + Auth:** Supabase (Postgres gestionat + autentificare gata făcută).
- **Hosting:** Vercel (plan gratuit la început).
- **Hărți:** Leaflet + OpenStreetMap (gratuit) la MVP. NU folosi Google Maps la început (costă și cere card).
- **PWA:** configurează aplicația ca Progressive Web App, ca să poată fi „instalată" pe telefon fără magazin de aplicații.

> NU porni cu aplicație nativă (React Native / Swift / Kotlin). Web-ul merge și pe telefon și pe PC, e mai ieftin și mai rapid de iterat. Native vine mult mai târziu, dacă e cazul.

---

## 4. Model de date (Postgres / Supabase)

Tabele de bază pentru MVP:

**cities**
- `id`, `name`, `slug`, `lat`, `lng`, `timezone`

**venues** (locuri: cluburi, săli, cafenele, teatre)
- `id`, `city_id`, `name`, `address`, `lat`, `lng`, `website`, `is_partner` (bool, plătește pentru vizibilitate)

**categories**
- `id`, `name`, `slug` (ex: concerte, stand-up, teatru, expoziții, târguri, party, family, film)

**events**
- `id`, `city_id`, `venue_id` (nullable), `title`, `description`, `category_id`
- `starts_at` (timestamp), `ends_at` (nullable)
- `is_free` (bool), `price_min`, `price_max` (nullable)
- `is_family_friendly` (bool)
- `image_url`, `ticket_url` (link extern, aici intră comisionul din bilete)
- `source_id`, `external_id` (de unde a venit, ca să eviți duplicate)
- `status` (draft / published / hidden)
- `is_promoted` (bool, eveniment plătit ca să apară mai sus)
- `created_at`, `updated_at`

**sources** (de unde vin datele)
- `id`, `name`, `type` (manual / scraper / feed / user_submitted / partner), `url`, `last_synced_at`

**users** (din Supabase Auth)
- profil minimal + `saved_events` (relație many-to-many cu events, pentru „salvează / mă interesează")

---

## 5. Funcționalități

### MVP (construiește ASTA prima dată — nimic în plus)

1. **Feed principal** cu evenimente, sortat pe timp, cu carduri (imagine, titlu, loc, oră, preț/gratis).
2. **Filtre rapide sus:** „Diseară", „Mâine", „Weekend", „Gratis", „Lângă mine", + filtru pe categorie.
3. **Pagină de eveniment** cu detalii + buton „Bilete" (link extern) + buton „Salvează".
4. **Hartă** simplă cu evenimentele din feedul curent (Leaflet).
5. **Autentificare** minimă (email/Google prin Supabase) — doar ca să poți salva evenimente.
6. **Panou de admin** (rută protejată) unde TU adaugi/editezi evenimente manual. Esențial pentru pornire (vezi secțiunea 6).

### Faza 2 (după ce MVP-ul are utilizatori reali)

- Formular „Trimite un eveniment" pentru organizatori/localuri (intră ca `draft`, tu aprobi).
- Evenimente promovate (`is_promoted`) afișate cu badge și prioritate în feed.
- Pagini de loc (`venue`) cu toate evenimentele lor.
- Notificări / email săptămânal „ce e în weekend pe gustul tău".
- Mai multe orașe.

### NU face acum (non-goals)

- NU vinde bilete direct (folosește linkuri externe spre iaBilet/Eventbrite — comision/afiliere).
- NU construi sistem de recomandări complicat.
- NU AI, NU chat, NU aplicație nativă.
- NU mai multe orașe până nu merge perfect Bucureștiul.

---

## 6. Strategia de date (PARTEA GREA — citește cu atenție)

Aplicația trăiește sau moare în funcție de cât de pline și proaspete sunt evenimentele. Abordare pe etape, de la simplu la complex:

**Etapa A — Manual + curat (săptămânile 1–4).**
Tu introduci manual prin admin 30–50 de evenimente bune din București pe săptămână. Pare puțin „scalabil", dar așa garantezi calitate și înțelegi ce evenimente contează. Multe aplicații de succes au pornit cu introducere manuală.

**Etapa B — Surse semi-automate.**
- Feed-uri unde există (unele platforme de bilete oferă liste / RSS / API).
- Scrapere ușoare pentru câteva surse fixe și cunoscute (pagini de evenimente ale sălilor mari). Pune fiecare sursă în tabelul `sources` și folosește `external_id` ca să nu dublezi.

**Etapa C — Conținut de la utilizatori și parteneri.**
- Organizatorii își trimit singuri evenimentele (formularul din Faza 2).
- Localurile partenere primesc cont să-și publice direct evenimentele.

> ⚠️ Atenție legală la scraping: respectă `robots.txt` și termenii fiecărui site; nu copia texte/imagini protejate integral — păstrează titlu, dată, loc, link și o descriere scurtă proprie sau preluată cu sursă. Preferă feed-uri oficiale și parteneriate ori de câte ori există.

---

## 7. Cum faci bani

1. **Comision din bilete (afiliere):** butonul „Bilete" duce către platforma de bilete cu link de afiliat; iei un procent din vânzări.
2. **Evenimente promovate:** organizatorii plătesc ca evenimentul lor să apară sus, cu badge.
3. **Listări de localuri:** un local plătește abonament lunar mic ca să fie „partener" vizibil.
4. (mai târziu) Reclame discrete, dar abia după ce ai trafic.

Nu taxa utilizatorul pe folosire — folosirea trebuie să fie gratuită ca să crești publicul.

---

## 8. Ecrane (UI)

1. **Home / Feed** — filtre sus (chips: Diseară / Mâine / Weekend / Gratis / Lângă mine), listă de carduri dedesubt. Buton toggle Listă / Hartă.
2. **Detaliu eveniment** — imagine mare, titlu, dată/oră, loc + mini-hartă, preț, descriere, buton Bilete, buton Salvează.
3. **Hartă** — pini cu evenimentele filtrate; click pe pin → card mic.
4. **Salvate** — evenimentele pe care le-a salvat userul.
5. **Admin** (doar tu) — tabel cu evenimente + formular adăugare/editare + management surse.

Design: mobile-first, curat, rapid. Vezi secțiunea de design tokens / stil dacă folosești un ghid de frontend.

---

## 9. Plan de implementare (ordinea pentru Claude Code)

1. **Setup proiect:** Next.js + TypeScript + Tailwind. Structură de foldere. PWA config de bază.
2. **Supabase:** creează proiectul, definește tabelele din secțiunea 4 (migrații SQL), conectează clientul în Next.js. Variabile de mediu.
3. **Seed:** un script care bagă în DB câteva orașe (București), categoriile, și 15–20 de evenimente demo, ca să ai cu ce testa UI-ul.
4. **Feed (Home):** afișează evenimentele din DB ca listă de carduri, sortate pe `starts_at`.
5. **Filtre:** „Diseară" (azi), „Mâine", „Weekend" (sâmbătă+duminică următoare), „Gratis" (`is_free`), categorie. „Lângă mine" = geolocație + sortare după distanță.
6. **Pagină detaliu eveniment** + buton Bilete (link extern) + buton Salvează.
7. **Auth (Supabase)** + funcția „Salvează eveniment".
8. **Hartă (Leaflet)** cu evenimentele filtrate.
9. **Admin protejat:** CRUD evenimente + management surse. (Cel mai important instrument pentru tine zilnic.)
10. **Polish:** stări de loading, empty states („Nimic diseară în filtrul ăsta, încearcă weekendul"), responsive, PWA installable.

Construiește incremental: după fiecare pas, rulează și verifică în browser înainte să treci mai departe.

---

## 10. Definiția de „gata" pentru MVP

- Pot intra pe telefon, văd ce e diseară în București, filtrez după „gratis" și „concerte", deschid un eveniment, dau click pe Bilete, și salvez unul.
- Tu poți adăuga un eveniment nou din admin în sub 1 minut.
- Totul rulează pe planurile gratuite (cost lunar ~0).

---

## 11. Pași de validare ÎNAINTE/în paralel cu construitul (non-tehnic)

- Adună manual o listă de 50 de evenimente bune dintr-o săptămână din București. Dacă reușești ușor, datele există și merită agregate.
- Întreabă 10 oameni dacă ar folosi așa ceva și pe ce se bazează acum (Facebook? prieteni?). Dacă da → ai cerere.
- Primii utilizatori: grupuri de Facebook locale, prieteni, un singur post bun „am făcut un loc unde vezi tot ce e în oraș diseară".
