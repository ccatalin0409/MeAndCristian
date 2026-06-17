// Generează ecranele de pornire (splash / launch) pentru iOS PWA.
// iOS nu desenează un splash automat — trebuie imagini exacte pe dimensiunea
// fiecărui dispozitiv, legate prin <link rel="apple-touch-startup-image"> cu
// media-query potrivit. Aici punem logo-ul centrat pe fundalul mărcii.
//
// Rulează o singură dată: `npx tsx scripts/gen-splash.ts`
// (sharp e instalat doar temporar; îl scoatem după.)

import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";

const OUT = join(process.cwd(), "public", "splash");
const LOGO = join(process.cwd(), "public", "icons", "icon-512.png");

// Fundal deschis (egal cu background_color din manifest) ca tranziția spre
// aplicație să fie lină. Logo-ul ocupă ~38% din latura scurtă.
const BG = { r: 247, g: 247, b: 248, alpha: 1 };

// (lățime_logică, înălțime_logică, dpr) — iPhone-urile uzuale, portret.
const DEVICES: [number, number, number][] = [
  [430, 932, 3], // 15 Plus / 14 Pro Max
  [393, 852, 3], // 15 / 15 Pro / 14 Pro
  [428, 926, 3], // 14 Plus / 13 Pro Max / 12 Pro Max
  [390, 844, 3], // 14 / 13 / 13 Pro / 12 / 12 Pro
  [375, 812, 3], // 13 mini / 12 mini / 11 Pro / X / XS
  [414, 896, 3], // 11 Pro Max / XS Max
  [414, 896, 2], // 11 / XR
  [375, 667, 2], // SE (2/3) / 8 / 7 / 6s
  [414, 736, 3], // 8 Plus / 7 Plus / 6s Plus
  [320, 568, 2], // SE (1) / 5s
];

interface SplashMeta {
  file: string;
  media: string;
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const logo = await sharp(LOGO).toBuffer();
  const metas: SplashMeta[] = [];

  for (const [w, h, dpr] of DEVICES) {
    const pxW = w * dpr;
    const pxH = h * dpr;
    const logoSize = Math.round(Math.min(pxW, pxH) * 0.38);
    const resized = await sharp(logo)
      .resize(logoSize, logoSize, { fit: "contain" })
      .toBuffer();

    const file = `splash-${pxW}x${pxH}.png`;
    await sharp({
      create: { width: pxW, height: pxH, channels: 4, background: BG },
    })
      .composite([{ input: resized, gravity: "center" }])
      .png()
      .toFile(join(OUT, file));

    metas.push({
      file: `/splash/${file}`,
      media: `(device-width: ${w}px) and (device-height: ${h}px) and (-webkit-device-pixel-ratio: ${dpr}) and (orientation: portrait)`,
    });
    console.log("✓", file);
  }

  // Listă gata de lipit în appleWebApp.startupImage din layout.tsx.
  console.log("\n--- startupImage ---");
  console.log(
    JSON.stringify(
      metas.map((m) => ({ url: m.file, media: m.media })),
      null,
      2
    )
  );
}

main();
