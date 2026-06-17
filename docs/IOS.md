# iOS — cum ajunge „Ce fac în oraș" pe iPhone

Sunt **două** căi. Una merge azi, fără nimic. Cealaltă (App Store) cere un Mac
sau un Mac în cloud + cont Apple Developer.

---

## 1. PWA — instalare directă pe iPhone (disponibilă ACUM)

Aplicația e un PWA. Pe iPhone se instalează din Safari, fără App Store, fără
cont Apple, fără bani:

1. Deschide **https://me-and-cristian.vercel.app** în **Safari** (trebuie Safari,
   nu Chrome — doar Safari poate „instala" pe iOS).
2. Apasă butonul **Partajează** (pătratul cu săgeată în sus, jos pe ecran).
3. Alege **„Adaugă pe ecranul principal" / „Add to Home Screen"**.
4. Gata — apare iconița pe ecran. Pornește full-screen, cu splash screen, ca o
   aplicație nativă.

Ce am pregătit pentru asta (deja în cod):
- `manifest.webmanifest` — nume, iconițe (192/512 + maskable), `display: standalone`.
- Meta Apple în `src/app/layout.tsx`: `appleWebApp.capable`, titlu, `apple-touch-icon`.
- **Splash screens** pentru toate iPhone-urile uzuale (`public/splash/`,
  generate cu `scripts/gen-splash.ts`) — fără ecran alb la pornire.
- **Safe-area** (`viewportFit: cover` + `env(safe-area-inset-*)` în
  `globals.css`) — conținutul nu intră sub crestătură / bara „home".
- Banner de instalare cu instrucțiuni iOS (`src/components/InstallPrompt.tsx`).

> Limitări iOS pentru PWA (impuse de Apple, nu de noi): notificările push merg
> doar din iOS 16.4+ și doar după ce aplicația e adăugată pe ecran; nu există
> prezență în App Store. Pentru App Store, vezi mai jos.

---

## 2. App Store — aplicație nativă cu Capacitor (mai târziu)

Pentru a publica în App Store ai nevoie obligatoriu de:
- **Xcode**, care rulează **doar pe macOS** (Mac fizic SAU Mac în cloud / CI);
- **cont Apple Developer** — 99 USD/an.

Abordarea recomandată: **Capacitor** ca înveliș nativ peste site-ul live de pe
Vercel (nu rescriem aplicația). Apple poate respinge un simplu „site împachetat"
(ghidul 4.2), așa că adăugăm câteva funcții native (push, share, geolocație).

### Pași (de rulat pe un Mac, în ordinea asta)

```bash
# 1. Instalează Capacitor + plugin-uri native utile
npm i @capacitor/core @capacitor/ios @capacitor/app \
      @capacitor/status-bar @capacitor/share @capacitor/geolocation \
      @capacitor/push-notifications
npm i -D @capacitor/cli

# 2. Inițializează (o singură dată)
npx cap init "Ce fac în oraș" ro.cefacinoras.app

# 3. Adaugă platforma iOS (generează folderul ios/ — necesită CocoaPods/Mac)
npx cap add ios

# 4. Sincronizează și deschide în Xcode
npx cap sync ios
npx cap open ios
```

### `capacitor.config.ts` (conținut)

Învelișul încarcă direct site-ul live, deci e mereu la zi cu ce e pe Vercel:

```ts
import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "ro.cefacinoras.app",
  appName: "Ce fac în oraș",
  // Încărcăm aplicația live de pe Vercel (SSR + Supabase funcționează ca atare).
  server: {
    url: "https://me-and-cristian.vercel.app",
    cleartext: false,
  },
  ios: {
    contentInset: "always",
  },
};

export default config;
```

### În Xcode (pe Mac)
- Setează **Team**-ul (contul Apple Developer) și un **Bundle Identifier** unic
  (`ro.cefacinoras.app`).
- Pune iconițele (App Icon set) și splash-ul (LaunchScreen).
- Rulează pe simulator sau pe un iPhone real conectat.
- Pentru App Store: **Product → Archive** → **Distribute App** → încarcă în
  **App Store Connect**, completează fișa (capturi, descriere, confidențialitate)
  și trimite la review.

---

## Fără Mac fizic? Build în cloud

Se poate produce `.ipa` fără să deții un Mac, folosind un runner macOS în cloud:

- **GitHub Actions** — `runs-on: macos-14` (minute gratuite limitate). Build +
  semnare cu certificat/profil din Secrets, apoi upload în TestFlight cu
  `xcrun altool` / `fastlane`.
- **Codemagic** sau **Ionic Appflow** — au flux dedicat Capacitor/iOS, plan
  gratuit limitat.

În toate cazurile tot ai nevoie de **cont Apple Developer** pentru semnare și
pentru TestFlight/App Store. Dezvoltarea/depanarea fără niciun Mac (nici local,
nici interactiv) e grea — recomandat doar pentru build-ul final, după ce
aplicația merge bine ca PWA.

---

## Împărțirea muncii
- **iOS** — Catalin (acest ghid).
- **Android** — Cristian (TWA / Capacitor Android; Android se poate construi și
  de pe Windows/Linux, nu cere Mac).
