// test_reticoli.mjs — i 14 reticoli di Bravais e i 5 piani, la cella, il potenziale.
// TOLLERANZE (dichiarate prima):
//   · i vincoli del sistema: lati uguali entro 10⁻¹² (relativo), angoli entro 10⁻¹⁰ gradi;
//   · l'ordine di simmetria rotazionale: una rotazione di 2π/m (m da 2 a 12) attorno a una direzione del reticolo è una
//     simmetria se manda i vettori primitivi in combinazioni intere entro 10⁻⁶; l'ordine trovato deve stare in
//     {1, 2, 3, 4, 6} ed essere quello del sistema;
//   · il potenziale è periodico entro 10⁻¹²·U₀; la forza è −∇V entro 10⁻⁶ (relativo, differenze centrali h = 10⁻⁵);
//   · lo scarto dalla somma di gaussiane pure (senza taglio) è al più Σ exp(−ρ²/2w²) sulle immagini con ρ ≥ 3w,
//     più 10⁻¹²: lo spegnimento tra 3w e 4w toglie solo da quelle;
//   · nel piano la forza lungo z è zero esatto e la pallina resta a z = 0 esatto.
import { SISTEMI, PIANI, NOMI_TECNICI, vincola, vettoriCella, creaCristallo, punto, norma, vettore, reciproci } from '../src/reticolo.js';
import { creaPallina, passiVerlet } from '../src/moto.js';
import { sorgente } from '../src/caso.js';
import { prova, vero, sotto, fine, dice } from './prova.mjs';

const angolo = (u, v) => (Math.acos(Math.max(-1, Math.min(1, punto(u, v) / (norma(u) * norma(v))))) * 180) / Math.PI;

function parametri(sistema, centratura, piano, c) {
  for (let k = 0; ; k++) {
    const d = c.sotto(`prova ${k}`);
    const p = vincola({ sistema, centratura, piano, a: 1, b: d.tra('b', 0.7, 1.5), c: d.tra('c', 0.7, 1.5),
      alfa: sistema === 'trigonale' ? d.tra('alfa', 50, 110) : d.tra('alfa', 60, 120), beta: d.tra('beta', 60, 120), gamma: d.tra('gamma', 60, 120) });
    try { vettoriCella(p); return p; } catch { /* piatta */ }
  }
}

function rotazione(u, th) {
  const [x, y, z] = u, c = Math.cos(th), s = Math.sin(th), C = 1 - c;
  return [[c + x * x * C, x * y * C - z * s, x * z * C + y * s], [y * x * C + z * s, c + y * y * C, y * z * C - x * s], [z * x * C - y * s, z * y * C + x * s, c + z * z * C]];
}
const applica = (M, v) => M.map((r) => punto(r, v));

// il massimo ordine m tale che la rotazione di 2π/m attorno a una direzione del reticolo lo manda in sé
export function ordineRotazionale(P) {
  const Pr = reciproci(P), assi = [];
  for (let i = -2; i <= 2; i++) for (let j = -2; j <= 2; j++) for (let k = -2; k <= 2; k++) {
    if (!i && !j && !k) continue;
    const u = [0, 1, 2].map((q) => i * P[0][q] + j * P[1][q] + k * P[2][q]), l = norma(u);
    assi.push(u.map((x) => x / l));
  }
  let migliore = 1;
  for (const u of assi) for (let m = 2; m <= 12; m++) {
    if (m <= migliore) continue;
    const R = rotazione(u, (2 * Math.PI) / m);
    let ok = true;
    for (const p of P) {
      const q = applica(R, p);
      for (const r of Pr) { const x = punto(q, r); if (Math.abs(x - Math.round(x)) > 1e-6) { ok = false; break; } }
      if (!ok) break;
    }
    if (ok) migliore = m;
  }
  return migliore;
}

console.log('reticoli');
const tutti = [];
for (const [s, d] of Object.entries(SISTEMI)) for (const c of d.centrature) tutti.push({ s, c, piano: false, ordine: d.ordine });
for (const [s, d] of Object.entries(PIANI)) for (const c of d.centrature) tutti.push({ s, c, piano: true, ordine: d.ordine });

prova('sono 14 reticoli di Bravais nello spazio e 5 nel piano, ognuno col suo nome tecnico', () => {
  vero(tutti.filter((x) => !x.piano).length === 14, 'quattordici');
  vero(tutti.filter((x) => x.piano).length === 5, 'cinque');
  for (const x of tutti) vero(NOMI_TECNICI[`${x.piano ? 'piano ' : ''}${x.s} ${x.c}`], `nome di ${x.s} ${x.c}`);
});

prova('per ogni reticolo i vettori rispettano i vincoli del sistema, e l\'ordine di simmetria è cristallografico', () => {
  const visti = new Set();
  for (const x of tutti) for (let k = 0; k < 6; k++) {
    const p = parametri(x.s, x.c, x.piano, sorgente(`prova reticoli/${x.piano ? 'piano ' : ''}${x.s} ${x.c}/${k}`));
    const A = vettoriCella(p), la = norma(A[0]), lb = norma(A[1]), lc = norma(A[2]);
    const al = angolo(A[1], A[2]), be = angolo(A[0], A[2]), ga = angolo(A[0], A[1]);
    const ug = (u, v) => Math.abs(u - v) <= 1e-12 * Math.max(u, v), ang = (u, v) => Math.abs(u - v) <= 1e-10;
    const nome = `${x.s} ${x.c} #${k}`;
    vero(ug(la, p.a) && ug(lb, p.b) && ug(lc, p.c) && ang(al, p.alfa) && ang(be, p.beta) && ang(ga, p.gamma), `${nome}: i vettori non danno i parametri`);
    const retti = (...g) => g.every((y) => ang(y, 90));
    const vincoli = x.piano ? {
      obliquo: retti(al, be), rettangolare: retti(al, be, ga), quadrato: retti(al, be, ga) && ug(la, lb), esagonale: retti(al, be) && ang(ga, 120) && ug(la, lb),
    }[x.s] : {
      triclino: true, monoclino: retti(al, ga), ortorombico: retti(al, be, ga), tetragonale: retti(al, be, ga) && ug(la, lb),
      trigonale: ug(la, lb) && ug(lb, lc) && ang(al, be) && ang(be, ga), esagonale: retti(al, be) && ang(ga, 120) && ug(la, lb),
      cubico: retti(al, be, ga) && ug(la, lb) && ug(lb, lc),
    }[x.s];
    vero(vincoli, `${nome}: vincoli del sistema`);
    const cr = creaCristallo({ ...p, atomi: [{ p: [0, 0, 0], s: 1 }] });
    const m = ordineRotazionale(cr.primitiva);
    vero([1, 2, 3, 4, 6].includes(m), `${nome}: ordine ${m} non cristallografico`);
    vero(m === x.ordine, `${nome}: ordine ${m}, il sistema vuole ${x.ordine}`);
    visti.add(`${x.piano ? 'piano ' : ''}${x.s}: ${m}`);
  }
  dice('ordini trovati:', [...visti].join(', '));
});

const casi = [
  { sistema: 'cubico', centratura: 'F', atomi: [{ p: [0, 0, 0], s: 1 }, { p: [0.5, 0, 0], s: -1 }], w: 0.15 },
  { sistema: 'esagonale', centratura: 'P', c: 1.63, atomi: [{ p: [0, 0, 0], s: 1 }], w: 0.2 },
  { sistema: 'triclino', centratura: 'P', b: 1.2, c: 0.9, alfa: 75, beta: 100, gamma: 80, atomi: [{ p: [0, 0, 0], s: 1 }, { p: [0.5, 0.5, 0.5], s: -1 }], w: 0.15 },
  { sistema: 'tetragonale', centratura: 'I', c: 1.4, atomi: [{ p: [0, 0, 0.5], s: -1 }], w: 0.25 },
];
prova('il potenziale è periodico, la forza è −∇V, il taglio a 4w toglie solo la coda', () => {
  const c = sorgente('prova potenziale');
  let ep = 0, ef = 0, eg = 0;
  for (const [q, caso] of casi.entries()) {
    const cr = creaCristallo(caso), w = cr.w;
    for (let i = 0; i < 200; i++) {
      const r = [0, 1, 2].map((k) => 3 * c(`${q}/${i}/${k}`) - 1.5), F = [0, 0, 0], V = cr.campo(...r, F);
      for (const t of cr.primitiva) ep = Math.max(ep, Math.abs(cr.campo(r[0] + t[0], r[1] + t[1], r[2] + t[2], null) - V));
      const h = 1e-5, g = [0, 1, 2].map((k) => { const a = [...r], b = [...r]; a[k] += h; b[k] -= h; return -(cr.campo(...a, null) - cr.campo(...b, null)) / (2 * h); });
      ef = Math.max(ef, norma(g.map((x, k) => x - F[k])) / Math.max(1, norma(F)));
      // la somma pura, su tutte le immagini entro 3 celle
      let puro = 0, coda = 0;
      for (const at of cr.atomi) for (let a = -3; a <= 3; a++) for (let b = -3; b <= 3; b++) for (let e = -3; e <= 3; e++) {
        const Q = [0, 1, 2].map((k) => at.r[k] + a * cr.A[0][k] + b * cr.A[1][k] + e * cr.A[2][k]), d2 = (r[0] - Q[0]) ** 2 + (r[1] - Q[1]) ** 2 + (r[2] - Q[2]) ** 2;
        puro += at.s * Math.exp(-d2 / (2 * w * w)); if (d2 >= 9 * w * w) coda += Math.exp(-d2 / (2 * w * w));
      }
      const s = Math.abs(V - puro) - coda - 1e-12; eg = Math.max(eg, s);
    }
  }
  dice('periodicità', ep.toExponential(1), ' forza', ef.toExponential(1), ' eccesso sul limite della coda', eg.toExponential(1));
  sotto(ep, 1e-12, 'periodicità'); sotto(ef, 1e-6, 'forza'); vero(eg <= 0, 'coda');
});

prova('nel piano la forza lungo z è zero esatto e la pallina resta nel piano', () => {
  const c = sorgente('prova piano');
  for (const s of ['obliquo', 'rettangolare', 'quadrato', 'esagonale']) {
    const cr = creaCristallo({ ...parametri(s, s === 'rettangolare' ? 'C' : 'P', true, c.sotto(s)), atomi: [{ p: [0, 0, 0], s: 1 }, { p: [0.5, 0.5, 0], s: -1 }], w: 0.2 });
    for (let i = 0; i < 300; i++) { const F = [0, 0, 0]; cr.campo(3 * c(`${s} x${i}`), 3 * c(`${s} y${i}`), 0, F); vero(F[2] === 0, `${s}: Fz = ${F[2]}`); }
    const st = creaPallina(cr, [0.3, 0.2, 0], [1.1, 0.7, 0]);
    passiVerlet(cr, st, 0.002, 20000);
    vero(st.x[2] === 0 && st.v[2] === 0, `${s}: z = ${st.x[2]}`);
  }
});
fine('reticoli');
