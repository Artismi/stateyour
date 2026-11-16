// decodifica_tavole.mjs — decodifica la cella di immagini di riferimento (grigi grezzi): reticolo, tessera
// ripiegata, classi di giro dei tratti chiusi; scrive la tessera (e lo scheletro) come PNG accanto ai dati.
// Uso: node strumenti/decodifica_tavole.mjs <cartella> <uscita>   (la cartella ha grigi.json: [[nome, W, H], …] e nome.grigio)
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { decodificaCella } from '../src/decodifica_cella.js';
import { scriviPNG } from '../src/png.js';
const [, , dir, out] = process.argv; mkdirSync(out, { recursive: true });
const ris = [];
for (const [nome, W, H] of JSON.parse(readFileSync(join(dir, 'grigi.json'), 'utf8'))) {
  const g = new Float32Array(readFileSync(join(dir, `${nome}.grigio`)).buffer.slice(0)), d = decodificaCella(g, W, H);
  if (!d) { console.log(nome, ': nessun reticolo'); continue; }
  const G = d.tessera.G, T = 3, img = new Uint8Array(G * T * G * T); // la tessera ripetuta 3 × 3 (in coordinate di cella), scheletro scuro
  for (let y = 0; y < G * T; y++) for (let x = 0; x < G * T; x++) { const i = (y % G) * G + (x % G); img[y * G * T + x] = d.scheletro[i] ? 0 : Math.round(255 - 200 * d.tessera.media[i]); }
  scriviPNG(join(out, `tessera_${nome}.png`), img, G * T, G * T);
  const r = { nome, p1: d.p1.map((x) => +x.toFixed(2)), p2: d.p2.map((x) => +x.toFixed(2)), campiture: d.campiture, classi: d.classi, componenti: d.componenti.map((c) => `${c.pixel}px:${JSON.stringify(c.generatori)}`), tratti: d.tratti.filter((t) => t.chiuso).map((t) => `${t.m}(${t.pixel})`) };
  ris.push(r); console.log(JSON.stringify(r));
}
writeFileSync(join(out, 'celle.json'), JSON.stringify(ris, null, 1));
