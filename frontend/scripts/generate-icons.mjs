import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

const here = dirname(fileURLToPath(import.meta.url));
const out = resolve(here, "../public/icons");
mkdirSync(out, { recursive: true });

const mark = `
  <path d="M8 30 L32 10 L56 30" fill="none" stroke="#ffffff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="26" cy="40" r="14" fill="#ffffff"/>
  <circle cx="40" cy="40" r="14" fill="#F2B134"/>
  <path d="M33 27.88 A14 14 0 0 1 33 52.12 A14 14 0 0 1 33 27.88 Z" fill="#11302F"/>`;

const rounded = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">
  <rect width="96" height="96" rx="22" fill="#0E7C7B"/>
  <g transform="translate(16 16)">${mark}</g>
</svg>`;

const maskable = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">
  <rect width="96" height="96" fill="#0E7C7B"/>
  <g transform="translate(22.4 22.4) scale(0.8)">${mark}</g>
</svg>`;

const targets = [
  { name: "icon-192.png", svg: rounded, size: 192 },
  { name: "icon-512.png", svg: rounded, size: 512 },
  { name: "icon-maskable-512.png", svg: maskable, size: 512 },
  { name: "apple-touch-icon.png", svg: maskable, size: 180 },
];

for (const { name, svg, size } of targets) {
  const png = await sharp(Buffer.from(svg), { density: 384 }).resize(size, size).png().toBuffer();
  writeFileSync(resolve(out, name), png);
}
