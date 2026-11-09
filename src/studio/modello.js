// modello.js — il seme dello studio: un solo formato per tutto.
//
// SEME = { versione, larghezza, altezza, colori, v, parole, frase, sciolti, origine }
//   parola   = { nome, centro: [x, y], simmetria: { tipo: 'id'|'C'|'D', n, asse },
//                elementi: [{ e, copie }] }   copie: null (tutto il gruppo) o indici
//   frase    = [{ parola, M, parti, varianti }]  dove compare ogni parola e come
//   elemento = { tipo: 'catena', def } | { tipo: 'petalo', pos, dir, L, W, b, curva }
//            | { tipo: 'disco', pos, d } | { tipo: 'campitura', contorno, buchi, spessore, inizio }
// Le coordinate di una parola sono le sue; la frase le porta nel mondo.
// Il seme si compila in uno STATO FISICO (blocchi, campi, specchi, sorgenti);
// per disegnare in fretta ogni elemento si simula una volta sola e le sue
// traiettorie si spostano con le trasformazioni (è la stessa cosa: test_seme).

import { catena } from '../catena.js';
import { MOTIVI } from '../motivi.js';
import { trasformaPartitura } from '../seme.js';
import { simula } from '../motore.js';
import { GRUPPI, GRUPPI_ESAGONALI } from '../grammatica.js';

// ---------- similitudini [a, b, c, d, e, f]
export const comp = (A, B) => [
  A[0] * B[0] + A[2] * B[1], A[1] * B[0] + A[3] * B[1],
  A[0] * B[2] + A[2] * B[3], A[1] * B[2] + A[3] * B[3],
  A[0] * B[4] + A[2] * B[5] + A[4], A[1] * B[4] + A[3] * B[5] + A[5],
];
export const app = (M, p) => [M[0] * p[0] + M[2] * p[1] + M[4], M[1] * p[0] + M[3] * p[1] + M[5]];
export const ID = [1, 0, 0, 1, 0, 0];
export const trasla = (x, y) => [1, 0, 0, 1, x, y];
export const ruota = (a) => [Math.cos(a), Math.sin(a), -Math.sin(a), Math.cos(a), 0, 0];
export const specchio = (phi) => [Math.cos(2 * phi), Math.sin(2 * phi), Math.sin(2 * phi), -Math.cos(2 * phi), 0, 0];
export const attorno = (c, L) => comp(trasla(c[0], c[1]), comp(L, trasla(-c[0], -c[1])));
export const scalaDi = (M) => Math.sqrt(Math.abs(M[0] * M[3] - M[1] * M[2]));
export function inversa(M) {
  const [a, b, c, d, e, f] = M, det = a * d - b * c;
  const ia = d / det, ib = -b / det, ic = -c / det, id = a / det;
  return [ia, ib, ic, id, -(ia * e + ic * f), -(ib * e + id * f)];
}
// dai parametri leggibili (posizione, rotazione in gradi, scala, specchio) e ritorno
export function daParametri({ x = 0, y = 0, rotazione = 0, scala = 1, specchiata = false }) {
  const r = rotazione * Math.PI / 180, c = Math.cos(r) * scala, s = Math.sin(r) * scala;
  return specchiata ? [c, s, s, -c, x, y] : [c, s, -s, c, x, y];
}
export function parametri(M) {
  const det = M[0] * M[3] - M[1] * M[2];
  return { x: M[4], y: M[5], rotazione: ((Math.atan2(M[1], M[0]) * 180 / Math.PI) + 360) % 360, scala: Math.sqrt(Math.abs(det)), specchiata: det < 0 };
}

// ---------- il gruppo di simmetria di una parola: prima le rotazioni, poi gli specchi
export function gruppo(parola) {
  const s = parola.simmetria || { tipo: 'id', n: 1 }, c = parola.centro || [0, 0], n = Math.max(1, s.n || 1);
  if (s.tipo === 'id') return [ID];
  const rot = []; for (let k = 0; k < n; k++) rot.push(attorno(c, ruota(2 * Math.PI * k / n)));
  const rif = s.tipo === 'D' ? rot.map((_, k) => attorno(c, specchio((s.asse ?? Math.PI / 2) + Math.PI * k / n))) : [];
  return rot.concat(rif);
}
const copieDi = (parola, voce) => { const g = gruppo(parola); return voce.copie ? voce.copie.filter((i) => i < g.length).map((i) => [i, g[i]]) : g.map((M, i) => [i, M]); };

// ---------- un elemento come stato fisico, nel riferimento della sua parola
export function partituraElemento(e, v = 10, precisione = 0.01) {
  if (e.tipo === 'catena') return { part: catena({ ...e.def, v, precisione }), P: ID };
  if (e.tipo === 'petalo') {
    const a = Math.atan2(e.dir[1], e.dir[0]) - Math.PI / 2, c = Math.cos(a), s = Math.sin(a);
    return { part: MOTIVI.petalo({ L: e.L, W: e.W, b: e.b, curva: e.curva }), P: [c, s, -s, c, e.pos[0], e.pos[1]] };
  }
  if (e.tipo === 'campitura') return { part: MOTIVI.campitura({ contorno: e.contorno, buchi: e.buchi || [], spessore: e.spessore, inizio: e.inizio, copertura: e.copertura }), P: ID };
  return { part: MOTIVI.disco({ d: e.d }), P: trasla(e.pos[0], e.pos[1]) };
}

// ogni collocazione di un elemento nel mondo: parola × istanza × copia
export function collocazioni(seme) {
  const out = [];
  seme.frase.forEach((ist, k) => {
    const w = seme.parole[ist.parola];
    if (!w) return;
    const parti = ist.parti ? new Set(ist.parti) : null;
    w.elementi.forEach((voce, i) => {
      for (const [j, G] of copieDi(w, voce)) {
        if (parti && !parti.has(`${i}:${j}`)) continue;
        out.push({ parola: ist.parola, istanza: k, elemento: i, copia: j, e: voce.e, M: comp(ist.M, G) });
      }
    });
    (ist.varianti || []).forEach((e, i) => out.push({ parola: ist.parola, istanza: k, variante: i, e, M: ID }));
  });
  (seme.sciolti || []).forEach((e, i) => out.push({ sciolto: i, e, M: ID }));
  return out;
}

// ---------- il seme come stato fisico
export function compila(seme) {
  const v = seme.v ?? 10;
  const conf = { G: 1, limiti: [-1e5, -1e5, 1e5, 1e5], blocchi: [], masse: [], campi: [], interfacce: [], regole: [], emettitori: [], piani: {} };
  const cache = new Map();
  collocazioni(seme).forEach((c, n) => {
    const chiave = JSON.stringify(c.e);
    if (!cache.has(chiave)) cache.set(chiave, partituraElemento(c.e, v));
    const { part, P } = cache.get(chiave);
    const pref = `z${n}`, t = trasformaPartitura(part, comp(c.M, P), pref);
    for (const k of ['blocchi', 'masse', 'campi', 'interfacce', 'regole', 'emettitori']) conf[k].push(...t[k]);
    conf.piani[pref] = { parola: c.parola };
  });
  return conf;
}

// ---------- traiettorie in cache: ogni elemento si simula una volta
export function creaCache(v = 10) {
  const mappa = new Map();
  const trasformaTracce = (tracce, M) => {
    const k = scalaDi(M);
    return tracce.map((tr) => ({ ...tr, punti: tr.punti.map((q) => { const [x, y] = app(M, q); return [x, y, q[2], q[3], (q[4] ?? 0) * k, q[5]]; }) }));
  };
  return {
    ha: (e) => mappa.has(JSON.stringify(e)),
    // le traiettorie dell'elemento nel riferimento della sua parola
    tracce(e) {
      const chiave = JSON.stringify(e);
      if (!mappa.has(chiave)) { const { part, P } = partituraElemento(e, v); mappa.set(chiave, trasformaTracce(simula(part), P)); }
      return mappa.get(chiave);
    },
    nelMondo(e, M) { return trasformaTracce(this.tracce(e), M); },
    svuota() { mappa.clear(); },
    dimensione: () => mappa.size,
  };
}

// ---------- semi di partenza
export function semeVuoto(larghezza = 800, altezza = 560) {
  return { versione: 1, larghezza, altezza, colori: { inchiostro: '#2a201d', carta: '#b25a4f' }, v: 10, parole: [], frase: [], sciolti: [], origine: { tipo: 'vuoto' } };
}
const esadecimale = (c) => '#' + c.map((x) => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, '0')).join('');

// dalla lingua esportata (lingua.js) al seme
export function semeDaLingua(L, misure) {
  const s = semeVuoto(misure.larghezza, misure.altezza);
  s.origine = { tipo: 'decodifica' };
  if (misure.colori) s.colori = { inchiostro: esadecimale(misure.colori.inchiostro), carta: esadecimale(misure.colori.fondo) };
  L.parole.forEach((w, idx) => {
    const parola = { nome: w.nome, centro: w.simmetria.centro || [0, 0], simmetria: { tipo: w.simmetria.tipo, n: w.simmetria.n, asse: w.simmetria.asse ?? Math.PI / 2 }, elementi: [] };
    const g = gruppo(parola);
    // le copie della lingua sono matrici: si ritrovano gli indici nel gruppo
    const indice = (M) => { let best = 0, bd = Infinity; g.forEach((G, i) => { const d = G.reduce((t, x, k) => t + Math.abs(x - M[k]), 0); if (d < bd) { bd = d; best = i; } }); return best; };
    parola.elementi = w.elementi.map(({ e, copie }) => ({ e, copie: copie.length === g.length ? null : copie.map(indice) }));
    s.parole.push(parola);
    for (const ist of w.istanze) s.frase.push({ parola: idx, M: ist.M, parti: ist.parti || null, varianti: ist.varianti || [] });
  });
  s.sciolti = L.sciolti || [];
  return s;
}

// ---------- il caso, riproducibile: un numero dà sempre lo stesso pattern
export function generatore(seme) {
  let a = (seme >>> 0) || 1;
  const r = () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  return { r, tra: (x, y) => x + (y - x) * r(), intero: (x, y) => Math.floor(x + (y - x + 1) * r()), scegli: (lista) => lista[Math.floor(r() * lista.length)], moneta: (p = 0.5) => r() < p };
}

// i generatori di parole: ognuno restituisce elementi nel riferimento della
// parola (centro in 0,0) e la simmetria che li moltiplica
const GENERATORI = {
  voluta(g, s) {
    // una voluta che parte fuori asse, con eventuali viticci; la simmetria la moltiplica
    const punti = [[g.tra(0.04, 0.16) * s, -g.tra(0.25, 0.42) * s]];
    let ang = g.tra(55, 100) * Math.PI / 180;
    for (let k = 0, n = g.intero(2, 3); k < n; k++) {
      const l = g.tra(0.14, 0.26) * s; ang -= g.tra(10, 55) * Math.PI / 180;
      const p = punti[punti.length - 1]; punti.push([p[0] + Math.cos(ang) * l, p[1] + Math.sin(ang) * l]);
    }
    const greca = g.moneta(0.4), sp = g.tra(0.014, 0.04) * s;
    const def = {
      punti, tangenti: [[Math.cos(g.tra(60, 100) * Math.PI / 180), Math.sin(g.tra(60, 100) * Math.PI / 180)]],
      voluta: { giri: g.tra(1.2, 2.4), rMin: (greca ? 0.025 : 0.012) * s, verso: g.scegli(['destra', 'sinistra']), ...(greca ? { occhio: sp * 2.6 } : {}) },
      spessore: sp, esponente: greca ? 0 : 1, rastremazione: greca ? 1 : g.tra(0.45, 0.9),
    };
    if (g.moneta(0.35)) { def.profondita = 2; def.rami = [{ da: 1, simile: { scala: g.tra(0.35, 0.55), angolo: g.tra(-45, 45), specchia: g.moneta() } }]; }
    else if (g.moneta(0.6)) {
      def.rami = [{ da: 1, catena: { punti: [], tangenti: [[Math.cos(ang + 1.2), Math.sin(ang + 1.2)]], voluta: { R: g.tra(0.03, 0.06) * s, giri: g.tra(1, 1.8), rMin: 0.008 * s, verso: g.scegli(['destra', 'sinistra']) } } }];
    }
    return { elementi: [{ tipo: 'catena', def }], simmetrie: [{ tipo: 'D', n: 1 }, { tipo: 'D', n: 2 }, { tipo: 'C', n: 3 }, { tipo: 'D', n: 4 }, { tipo: 'C', n: 4 }, { tipo: 'D', n: 6 }] };
  },
  palmetta(g, s) {
    const n = g.intero(5, 11), a0 = g.tra(8, 35), base = [0, -g.tra(0.15, 0.3) * s], verso = g.moneta() ? 1 : -1;
    const elementi = [];
    for (let k = 0; k < n; k++) {
      const u = n > 1 ? k / (n - 1) : 0.5, a = (a0 + (180 - 2 * a0) * u) * Math.PI / 180;
      const L = s * g.tra(0.42, 0.5) * (0.62 + 0.38 * Math.sin(Math.PI * u));
      elementi.push({ tipo: 'petalo', pos: base, dir: [Math.cos(a), Math.sin(a)], L, W: L * g.tra(0.2, 0.3), b: L * 0.03, curva: verso * (u - 0.5) * 2 * g.tra(0.2, 0.6) });
    }
    if (g.moneta(0.75)) elementi.push({ tipo: 'disco', pos: base, d: s * g.tra(0.06, 0.11) });
    return { elementi, simmetrie: [{ tipo: 'id', n: 1 }] };
  },
  rosetta(g, s) {
    const L = s * g.tra(0.25, 0.42), a = g.tra(0, 360) * Math.PI / 180, r0 = s * g.tra(0, 0.06);
    const elementi = [{ tipo: 'petalo', pos: [Math.cos(a) * r0, Math.sin(a) * r0], dir: [Math.cos(a), Math.sin(a)], L, W: L * g.tra(0.25, 0.4), b: L * 0.04, curva: g.tra(-0.5, 0.5) }];
    return { elementi, centrali: [{ tipo: 'disco', pos: [0, 0], d: s * g.tra(0.08, 0.14) }], simmetrie: [{ tipo: 'C', n: g.intero(5, 12) }, { tipo: 'D', n: g.intero(4, 9) }] };
  },
  stella(g, s) {
    const n = g.intero(5, 12), k = g.intero(1, Math.floor((n - 1) / 2)), r = s * g.tra(0.3, 0.45), f = Math.PI / 2;
    const A = [Math.cos(f) * r, Math.sin(f) * r], B = [Math.cos(f + 2 * Math.PI * k / n) * r, Math.sin(f + 2 * Math.PI * k / n) * r];
    const d = [B[0] - A[0], B[1] - A[1]], l = Math.hypot(...d), t = [d[0] / l, d[1] / l];
    const elementi = [{ tipo: 'catena', def: { punti: [A, B], tangenti: [t, t], spessore: s * g.tra(0.012, 0.03), esponente: 0 } }];
    return { elementi, simmetrie: [{ tipo: 'C', n }] };
  },
  macchia(g, s) {
    const k = g.intero(3, 7), a = g.tra(0.15, 0.4), r0 = s * g.tra(0.12, 0.22), f = g.tra(0, 6.28), pen = s * 0.012;
    const contorno = [];
    for (let i = 0; i < 48; i++) { const t = 2 * Math.PI * i / 48, r = r0 * (1 + a * Math.sin(k * t + f)) - pen / 2; contorno.push([Math.cos(t) * r, Math.sin(t) * r]); }
    return { elementi: [{ tipo: 'campitura', contorno, buchi: [], spessore: pen, inizio: [0, 0] }], simmetrie: [{ tipo: 'id', n: 1 }] };
  },
};

function creaParola(g, nome, s, tipi = Object.keys(GENERATORI)) {
  const tipo = g.scegli(tipi), gen = GENERATORI[tipo](g, s);
  const simmetria = { ...g.scegli(gen.simmetrie), asse: Math.PI / 2 };
  const elementi = gen.elementi.map((e) => ({ e, copie: null }));
  for (const e of gen.centrali || []) elementi.push({ e, copie: [0] });
  return { nome, centro: [0, 0], simmetria, elementi, genere: tipo };
}

// un pattern intero da un numero: parole inventate, simmetrie, una disposizione
export function inventa(numero, opzioni = {}) {
  const g = generatore(numero);
  const s0 = semeVuoto(opzioni.larghezza ?? 800, opzioni.altezza ?? 560);
  s0.origine = { tipo: 'inventato', numero };
  const W = s0.larghezza, H = s0.altezza;
  const disposizione = opzioni.disposizione || g.scegli(['reticolo', 'reticolo', 'fregio', 'rosone', 'singola']);
  const tavolozze = [['#2a201d', '#b25a4f'], ['#1c1b18', '#f4f1ea'], ['#f1e6c8', '#23395b'], ['#2b2a26', '#c9a24a'], ['#efe7d8', '#3f6b4f']];
  const [ink, carta] = g.scegli(tavolozze); s0.colori = { inchiostro: ink, carta };
  const metti = (parola, M) => s0.frase.push({ parola, M, parti: null, varianti: [] });
  if (disposizione === 'singola') {
    const s = Math.min(W, H) * 0.8;
    s0.parole.push(creaParola(g, 'A', s));
    metti(0, trasla(W / 2, H / 2));
  } else if (disposizione === 'rosone') {
    const R = Math.min(W, H) * 0.3, k = g.intero(5, 12), s = R * g.tra(0.6, 0.9);
    s0.parole.push(creaParola(g, 'A', s, ['voluta', 'palmetta', 'rosetta']));
    s0.parole.push(creaParola(g, 'B', R * 0.7, ['rosetta', 'stella', 'macchia']));
    for (let i = 0; i < k; i++) metti(0, comp(trasla(W / 2, H / 2), comp(ruota(2 * Math.PI * i / k), comp(trasla(0, R), ruota(0)))));
    metti(1, trasla(W / 2, H / 2));
  } else {
    const fregio = disposizione === 'fregio';
    const gruppoNome = g.scegli(fregio ? ['p1', 'pm', 'p2'] : ['p1', 'pm', 'pmm', 'p2', 'p4', 'cm', 'esagonale']);
    const nx = fregio ? g.intero(4, 7) : g.intero(3, 6), lato = W / (nx + (gruppoNome === 'cm' || gruppoNome === 'esagonale' ? 0.5 : 0));
    const passoRiga = gruppoNome === 'esagonale' ? lato * Math.sqrt(3) / 2 : lato;
    const ny = fregio ? 1 : Math.max(1, Math.floor(H / passoRiga));
    s0.parole.push(creaParola(g, 'A', lato * 0.95));
    const riempitivo = g.moneta(0.6);
    if (riempitivo) s0.parole.push(creaParola(g, 'B', lato * g.tra(0.35, 0.55), ['rosetta', 'stella', 'macchia', 'palmetta']));
    const G = gruppoNome === 'esagonale' ? GRUPPI_ESAGONALI.p1 : (GRUPPI[gruppoNome] || GRUPPI.p1);
    const y0 = (H - ((ny - 1) * passoRiga)) / 2;
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
      const dx = (gruppoNome === 'cm' || gruppoNome === 'esagonale') && j % 2 ? lato / 2 : 0;
      const pos = [lato / 2 + i * lato + dx, y0 + j * passoRiga];
      metti(0, comp(trasla(pos[0], pos[1]), G(i, j)));
      if (riempitivo && (!fregio || true)) metti(1, comp(trasla(pos[0] + lato / 2, pos[1] + (fregio ? 0 : passoRiga / 2)), G(i, j)));
    }
    s0.origine.disposizione = `${fregio ? 'fregio' : 'reticolo'} ${gruppoNome}`;
  }
  s0.origine.disposizione = s0.origine.disposizione || disposizione;
  return s0;
}

// ---------- mutare: lo stesso seme con i parametri spostati, e qualche cambio di struttura
export function muta(seme, intensita = 0.3, numero = 1) {
  const g = generatore(numero), s = JSON.parse(JSON.stringify(seme));
  const j = (x, rel = 1) => x * (1 + intensita * rel * (g.r() * 2 - 1));
  const sposta = (p, q) => [p[0] + intensita * q * (g.r() * 2 - 1), p[1] + intensita * q * (g.r() * 2 - 1)];
  const mutaElemento = (e, misura) => {
    if (e.tipo === 'catena') {
      const d = e.def;
      d.punti = d.punti.map((p, i) => (i === 0 ? p : sposta(p, misura * 0.15)));
      if (d.spessore) d.spessore = j(d.spessore, 0.6);
      if (d.voluta) { d.voluta.giri = Math.max(0.5, j(d.voluta.giri, 0.5)); if (d.voluta.rMin) d.voluta.rMin = j(d.voluta.rMin, 0.5); if (g.moneta(intensita * 0.3)) d.voluta.verso = d.voluta.verso === 'destra' ? 'sinistra' : 'destra'; }
      if (d.rami) for (const r of d.rami) { if (r.simile) { r.simile.scala = Math.min(0.75, j(r.simile.scala, 0.4)); r.simile.angolo += intensita * 40 * (g.r() * 2 - 1); } else if (r.catena) mutaElemento({ tipo: 'catena', def: r.catena }, misura * 0.5); }
    } else if (e.tipo === 'petalo') { e.L = j(e.L, 0.4); e.W = j(e.W, 0.5); e.curva = e.curva + intensita * (g.r() * 2 - 1); }
    else if (e.tipo === 'disco') e.d = j(e.d, 0.5);
    else if (e.tipo === 'campitura') e.contorno = e.contorno.map((p) => sposta(p, misura * 0.03));
  };
  for (const w of s.parole) {
    let misura = 1;
    for (const { e } of w.elementi) if (e.tipo === 'catena') for (const p of e.def.punti) misura = Math.max(misura, Math.hypot(p[0] - w.centro[0], p[1] - w.centro[1]));
    for (const { e } of w.elementi) mutaElemento(e, misura);
    if (w.simmetria.tipo !== 'id' && w.simmetria.n >= 2 && g.moneta(intensita * 0.5)) {
      w.simmetria.n = Math.max(2, w.simmetria.n + (g.moneta() ? 1 : -1));
      for (const voce of w.elementi) if (voce.copie && voce.copie.length > 1) voce.copie = null;
    }
  }
  s.origine = { ...(s.origine || {}), mutato: (s.origine?.mutato || 0) + 1 };
  return s;
}

// ---------- ripetere una parola su un reticolo
export function ripetiSuReticolo(seme, indice, { gruppo: nome = 'p1', nx = 4, ny = 3, passoX = 100, passoY = 100, x0 = null, y0 = null, scala = 1 } = {}) {
  const s = JSON.parse(JSON.stringify(seme));
  const esag = nome === 'esagonale';
  const G = esag ? GRUPPI_ESAGONALI.p1 : (GRUPPI[nome] || GRUPPI.p1);
  const w = s.parole[indice], c = w.centro;
  s.frase = s.frase.filter((f) => f.parola !== indice);
  const py = esag ? passoX * Math.sqrt(3) / 2 : passoY;
  const ox = x0 ?? (s.larghezza - (nx - 1) * passoX) / 2, oy = y0 ?? (s.altezza - (ny - 1) * py) / 2;
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    const dx = (esag || nome === 'cm') && j % 2 ? passoX / 2 : 0;
    // la parola si porta col suo centro sul nodo del reticolo
    const M = comp(trasla(ox + i * passoX + dx, oy + j * py), comp(G(i, j), comp([scala, 0, 0, scala, 0, 0], trasla(-c[0], -c[1]))));
    s.frase.push({ parola: indice, M, parti: null, varianti: [] });
  }
  return s;
}

// ---------- utilità per l'editor: maniglie e modifiche di un elemento
export function maniglie(e) {
  if (e.tipo === 'catena') return e.def.punti.map((p, i) => ({ chiave: `p${i}`, pos: p }));
  if (e.tipo === 'petalo') return [{ chiave: 'base', pos: e.pos }, { chiave: 'punta', pos: [e.pos[0] + e.dir[0] * e.L, e.pos[1] + e.dir[1] * e.L] }];
  if (e.tipo === 'disco') return [{ chiave: 'centro', pos: e.pos }];
  if (e.tipo === 'campitura') return e.contorno.map((p, i) => ({ chiave: `v${i}`, pos: p })).filter((_, i) => e.contorno.length < 40 || i % Math.ceil(e.contorno.length / 24) === 0);
  return [];
}
export function spostaManiglia(e, chiave, pos) {
  if (e.tipo === 'catena' && chiave[0] === 'p') e.def.punti[Number(chiave.slice(1))] = pos;
  else if (e.tipo === 'petalo' && chiave === 'base') e.pos = pos;
  else if (e.tipo === 'petalo' && chiave === 'punta') { const d = [pos[0] - e.pos[0], pos[1] - e.pos[1]], L = Math.hypot(...d) || 1; e.dir = [d[0] / L, d[1] / L]; const k = L / e.L; e.L = L; e.W *= k; e.b *= k; }
  else if (e.tipo === 'disco') e.pos = pos;
  else if (e.tipo === 'campitura' && chiave[0] === 'v') {
    const i = Number(chiave.slice(1)), old = e.contorno[i], d = [pos[0] - old[0], pos[1] - old[1]];
    // si trascina un tratto del contorno, non un punto solo
    const n = e.contorno.length, raggio = Math.max(1, Math.round(n / 24));
    e.contorno = e.contorno.map((p, k) => { const dist = Math.min(Math.abs(k - i), n - Math.abs(k - i)); const w = Math.max(0, 1 - dist / (raggio + 1)); return [p[0] + d[0] * w, p[1] + d[1] * w]; });
  }
}
export function descriviElemento(e) {
  if (e.tipo === 'catena') return `catena di ${e.def.punti.length} punti${e.def.voluta ? ', voluta' : ''}${e.def.rami ? `, ${e.def.rami.length} rami` : ''}`;
  if (e.tipo === 'petalo') return 'petalo';
  if (e.tipo === 'disco') return 'disco';
  return `campitura di ${e.contorno.length} lati`;
}
