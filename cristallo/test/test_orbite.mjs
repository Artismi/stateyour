// test_orbite.mjs — le orbite periodiche sul toro (le linee chiuse).
// TOLLERANZE (dichiarate prima):
//   · ogni orbita del catalogo è periodica: dopo T lo stato (x, y, vx, vy) torna quello di partenza più (m₁a₁ + m₂a₂)
//     entro 10⁻⁹;
//   · la sua energia si conserva: alla fine è quella dell'inizio entro 10⁻⁹, lungo il periodo oscilla meno di 10⁻³ U₀
//     (Verlet), e sta entro 10⁻³ U₀ dall'energia chiesta al catalogo;
//   · le orbite sorelle per la simmetria del sito sono anch'esse periodiche entro 10⁻⁹;
//   · il catalogo trova almeno un'orbita in ognuno dei tre cristalli provati.
import { creaCristallo } from '../src/reticolo.js';
import { catalogo, mappa, punti, sorelle } from '../src/orbite.js';
import { gruppoDelSito } from '../src/simmetria.js';
import { piano } from './casi.mjs';
import { prova, vero, sotto, fine, dice, numero } from './prova.mjs';

console.log('orbite periodiche');
const casi = [
  ['quadrato, colline', { ...piano('quadrato'), atomi: [{ p: [0, 0, 0], s: 1 }], w: 0.2 }, 0.6],
  ['esagonale, colline', { ...piano('esagonale'), atomi: [{ p: [0, 0, 0], s: 1 }], w: 0.25 }, 0.7],
  ['quadrato, conche', { ...piano('quadrato'), atomi: [{ p: [0, 0, 0], s: -1 }], w: 0.2 }, 0.3],
];
const scartoPeriodo = (cr, o) => {
  const s = mappa(cr, o.x0, o.v0, o.T, o.n, [0, 0, 0]), M = [o.m[0] * cr.A[0][0] + o.m[1] * cr.A[1][0], o.m[0] * cr.A[0][1] + o.m[1] * cr.A[1][1]];
  return Math.max(Math.hypot(s.x[0] - o.x0[0] - M[0], s.x[1] - o.x0[1] - M[1]), Math.hypot(s.v[0] - o.v0[0], s.v[1] - o.v0[1]));
};
prova('le orbite trovate sono periodiche entro 10⁻⁹ e la loro energia si conserva; le sorelle anche', () => {
  for (const [nome, op, E] of casi) {
    const cr = creaCristallo(op), L = catalogo(cr, E, [0, 0, 0], { semi: 80 });
    vero(L.length > 0, `${nome}: nessuna orbita`);
    let ep = 0, ef = 0, eo = 0, ee = 0, es = 0, ns = 0;
    const g = gruppoDelSito(cr, [0, 0, 0]);
    for (const o of L) {
      ep = Math.max(ep, scartoPeriodo(cr, o));
      const { E: dE } = punti(cr, o, [0, 0, 0]);
      ef = Math.max(ef, Math.abs(dE[dE.length - 1])); eo = Math.max(eo, ...dE.map(Math.abs));
      ee = Math.max(ee, Math.abs(0.5 * (o.v0[0] ** 2 + o.v0[1] ** 2) + cr.campo(o.x0[0], o.x0[1], 0, null) - E));
      for (const q of sorelle(o, g, [0, 0, 0])) {
        // la sorella ha lo spostamento trasformato: si misura direttamente sullo stato
        const s = mappa(cr, q.x0, q.v0, q.T, q.n, [0, 0, 0]), D = [s.x[0] - q.x0[0], s.x[1] - q.x0[1]];
        const f = [D[0] * cr.Ar[0][0] + D[1] * cr.Ar[0][1], D[0] * cr.Ar[1][0] + D[1] * cr.Ar[1][1]], m = f.map(Math.round);
        const M = [m[0] * cr.A[0][0] + m[1] * cr.A[1][0], m[0] * cr.A[0][1] + m[1] * cr.A[1][1]];
        es = Math.max(es, Math.hypot(D[0] - M[0], D[1] - M[1]), Math.hypot(s.v[0] - q.v0[0], s.v[1] - q.v0[1])); ns++;
      }
    }
    dice(nome.padEnd(20), L.length, 'orbite;', ns, 'sorelle;  periodicità', numero(ep), ' sorelle', numero(es), ' E fine-inizio', numero(ef), ' oscillazione', numero(eo), ' dall\'energia chiesta', numero(ee),
      ' stabili', L.filter((o) => o.stabile).length);
    sotto(ep, 1e-9, 'periodicità'); sotto(es, 1e-9, 'sorelle'); sotto(ef, 1e-9, 'energia alla fine'); sotto(eo, 1e-3, 'oscillazione'); sotto(ee, 1e-3, 'energia chiesta');
  }
});
fine('orbite periodiche');
