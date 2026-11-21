// uso: node strumenti/tabella_stelle.mjs [Z1 Z2 …]
// Calcola la tabella delle stelle (src/camera/stelle_tabella.js) dalle leggi di src/camera/stelle.js: per ogni
// metallicità la sequenza di età zero (integrando le quattro equazioni della struttura), la massa minima, la vita
// in sequenza principale di ogni massa, la contrazione che la precede, le nane brune. Sono minuti di calcolo (qualche minuto per metallicità):
// per questo il risultato si salva, e stella() lo interpola. Senza argomenti rifà tutte le metallicità di Z_NODI;
// con argomenti rifà solo quelle date e tiene le altre. Va rilanciato se si cambia la fisica o una costante.
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const modulo = process.env.STELLE_MODULO || '../src/camera/stelle.js'; // (per provare una versione in costruzione)
const { calcolaRiga, Z_NODI, M_NODI } = await import(modulo);
const file = fileURLToPath(new URL('../src/camera/stelle_tabella.js', import.meta.url));
const quali = process.argv.slice(2).map(Number).filter((z) => z > 0), t0 = Date.now();
let righe = [];
if (existsSync(file)) { const m = /export const TABELLA = (\{[\s\S]*\});\s*$/.exec(readFileSync(file, 'utf8')); if (m) righe = JSON.parse(m[1]).righe; }
const scrivi = () => {
  righe.sort((a, b) => a.Z - b.Z);
  const corpo = righe.map((r) => `    { "Z": ${r.Z}, "Mmin": ${r.Mmin},\n      "tracce": [\n${r.tracce.map((x) => '        ' + JSON.stringify(x)).join(',\n')}\n      ],\n      "brune": [\n${r.brune.map((x) => '        ' + JSON.stringify(x)).join(',\n')}\n      ] }`).join(',\n');
  writeFileSync(file, `// stelle_tabella.js — GENERATO da \`node strumenti/tabella_stelle.mjs\` (non modificare a mano): le tracce delle stelle\n// calcolate da stelle.js (struttura integrata, nessuna taratura). Per ogni metallicità Z (Sole = 1): la massa minima,\n// e per ogni massa M (in M☉) gli stati lungo la sequenza principale: t (anni), ln L, ln R (unità solari), ln Tc (K),\n// ln ρc (kg/m³), frazione CNO, nucleo e involucro convettivi (frazioni di massa), fondo dell'involucro (r/R), idrogeno\n// al centro; vita (anni) e nucleo di elio finale (frazione di massa); «pre»: la contrazione prima della sequenza principale\n// (t, ln L, ln R, fino al raggio di età zero). «brune»: nane brune che si raffreddano.\nexport const TABELLA = {\n  "righe": [\n${corpo}\n  ]\n};\n`);
};
for (const Z of quali.length ? quali : Z_NODI) {
  const r = calcolaRiga(Z, M_NODI, (s) => console.log(s));
  if (!r) { console.log(`Z = ${Z}: NON RIUSCITA`); continue; }
  righe = righe.filter((x) => Math.abs(x.Z - Z) > 1e-9 * Z); righe.push(r); scrivi();
  console.log(`Z = ${Z}: scritta (${((Date.now() - t0) / 1e3).toFixed(0)} s dall'inizio)`);
}
