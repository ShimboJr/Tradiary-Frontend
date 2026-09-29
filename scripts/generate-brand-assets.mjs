/**
 * scripts/generate-brand-assets.mjs
 * Rasterizes the Tradiary SVG icon into all required PNG/ICO formats
 * and writes site.webmanifest.
 *
 * Usage: node scripts/generate-brand-assets.mjs
 * Requires: @resvg/resvg-js (npm install --save-dev @resvg/resvg-js)
 */

import { Resvg } from '@resvg/resvg-js';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');
const svgPath   = join(__dirname, '..', 'src', 'assets', 'brand', 'tradiary-icon.svg');

// Ensure public dir exists
mkdirSync(publicDir, { recursive: true });

const svgContent = readFileSync(svgPath, 'utf8');

/** Render SVG at given size, returns PNG Buffer */
function renderPng(svgStr, size) {
  const resvg = new Resvg(svgStr, {
    fitTo: { mode: 'width', value: size },
  });
  return resvg.render().asPng();
}

/** Encode a 16×16 or 32×32 PNG into a minimal ICO file */
function buildIco(pngBuffers) {
  // ICO format: ICONDIR + ICONDIRENTRYs + image data
  const count = pngBuffers.length;
  const headerSize = 6 + count * 16;
  let offset = headerSize;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);     // reserved
  header.writeUInt16LE(1, 2);     // type: ICO
  header.writeUInt16LE(count, 4); // count

  const entries = [];
  for (const buf of pngBuffers) {
    // For 256+ px ICO, width/height byte = 0 (means 256)
    // We only use 16 and 32 here
    const dim = Math.round(Math.sqrt(buf.length / 4)); // rough estimate — use explicit
    entries.push(buf);
  }

  // Simpler: build ICO from explicit sizes
  const sizes = pngBuffers.map((b, i) => (i === 0 ? 16 : 32));
  const entries2 = [];
  let dataOffset = 6 + count * 16;
  const dirEntries = pngBuffers.map((buf, i) => {
    const entry = Buffer.alloc(16);
    const sz = sizes[i];
    entry.writeUInt8(sz === 256 ? 0 : sz, 0);   // width
    entry.writeUInt8(sz === 256 ? 0 : sz, 1);   // height
    entry.writeUInt8(0, 2);                       // color count
    entry.writeUInt8(0, 3);                       // reserved
    entry.writeUInt16LE(1, 4);                    // color planes
    entry.writeUInt16LE(32, 6);                   // bits per pixel
    entry.writeUInt32LE(buf.length, 8);           // size
    entry.writeUInt32LE(dataOffset, 12);          // offset
    dataOffset += buf.length;
    return entry;
  });

  return Buffer.concat([header, ...dirEntries, ...pngBuffers]);
}

console.log('Generating brand assets…');

// Standard icon
const png16  = renderPng(svgContent, 16);
const png32  = renderPng(svgContent, 32);
const png180 = renderPng(svgContent.replace('rx="15"', 'rx="0"'), 180); // square for iOS
const png192 = renderPng(svgContent, 192);
const png512 = renderPng(svgContent, 512);

// Maskable: glyph at ~60% of canvas on full-bleed gradient
// We rebuild the SVG with padding so the icon is centred at 60%
const maskableSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="mg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#5B6CFF"/>
      <stop offset="1" stop-color="#22D3EE"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" fill="url(#mg)"/>
  <!-- Icon glyph centred, scaled to ~60% = 307px out of 512 -->
  <!-- Translate to center: (512 - 307)/2 = 102.5 -->
  <g transform="translate(102.5 102.5) scale(4.8)">
    <rect x="14" y="14" width="36" height="9" rx="4.5" fill="#FFFFFF"/>
    <rect x="26" y="18" width="12" height="27" rx="3.5" fill="#FFFFFF"/>
    <line x1="32" y1="44" x2="32" y2="52" stroke="#FFFFFF" stroke-width="3.5" stroke-linecap="round"/>
  </g>
</svg>`;

const png512m = renderPng(maskableSvg, 512);

// Write files
writeFileSync(join(publicDir, 'favicon.ico'), buildIco([png16, png32]));
writeFileSync(join(publicDir, 'apple-touch-icon.png'), png180);
writeFileSync(join(publicDir, 'icon-192.png'), png192);
writeFileSync(join(publicDir, 'icon-512.png'), png512);
writeFileSync(join(publicDir, 'icon-maskable-512.png'), png512m);
console.log('  ✓ favicon.ico, apple-touch-icon.png, icon-192.png, icon-512.png, icon-maskable-512.png');

// site.webmanifest
const manifest = {
  name: 'Tradiary',
  short_name: 'Tradiary',
  description: 'Your trading diary, with analytics.',
  theme_color: '#0B1220',
  background_color: '#0B1220',
  display: 'standalone',
  start_url: '/',
  icons: [
    { src: '/icon-192.png',         sizes: '192x192', type: 'image/png' },
    { src: '/icon-512.png',         sizes: '512x512', type: 'image/png' },
    {
      src: '/icon-maskable-512.png',
      sizes: '512x512',
      type: 'image/png',
      purpose: 'maskable',
    },
  ],
};
writeFileSync(join(publicDir, 'site.webmanifest'), JSON.stringify(manifest, null, 2));
console.log('  ✓ site.webmanifest');

console.log('Done! All brand assets written to client/public/');
