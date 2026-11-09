// grammatica.js — l'alfabeto di composizione dei pattern.
//
// Il motore (motore.js) produce TRATTI: linee tracciate da particelle.
// La grammatica li compone su quattro livelli:
//
//   TRATTO   una linea del motore, in coordinate locali centrate in (0,0)
//   MOTIVO   un tratto moltiplicato da una simmetria puntuale:
//              C_n  (ciclica: n copie ruotate, "circolare" senza specchi)
//              D_n  (diedrale: n assi di specchio, 2n copie; D2 = i 4 spicchi, D4 = 8)
//   CELLA    la piastrella: un quadrato di lato L con ruoli
//              centro       il motivo centrale
//              angoli       i riempitivi ai quattro angoli (il cerchio diventa quadrato)
//              lati         i riempitivi a metà dei quattro lati
//              corolla      n copie di un motivo su un cerchio di raggio r (ciclica)
//              contenitore  ciò che si ripete uguale in ogni cella
//              contenuto    ciò che varia, scelto da un RITMO
//   RETICOLO la ripetizione della cella: colonne × righe, con un GRUPPO che
//            dice come ogni copia è trasformata (identica, specchiata,
//            ruotata, slittata) e un RITMO che sceglie il contenuto.
//
// Ogni livello è un oggetto JSON; `parola()` lo riassume in una riga di
// alfabeto leggibile. La grammatica non disegna: produce ISTANZE, cioè
// coppie (tratto, trasformazione). Da lì si va in due modi:
//   - `seme()` in seme.js trasforma lo STATO di ogni tratto (blocchi, campi,
//     specchi, sorgenti) e ne fa un'unica configurazione iniziale da cui una
//     sola simulazione genera tutto il pattern;
//   - `cella()` e `reticolo()` qui sotto trasformano le linee già calcolate di
//     ogni tratto: è la stessa cosa, più veloce, per l'anteprima.

import { simula } from './motore.js';
import { MOTIVI } from './motivi.js';

// ---------- trasformazioni affini: [a, b, c, d, e, f]  x' = a x + c y + e ; y' = b x + d y + f
export const T = {
  id: () => [1, 0, 0, 1, 0, 0],
  trasla: (x, y) => [1, 0, 0, 1, x, y],
  scala: (k) => [k, 0, 0, k, 0, 0],
  ruota: (gradi) => { const r = gradi * Math.PI / 180, c = Math.cos(r), s = Math.sin(r); return [c, s, -s, c, 0, 0]; },
  specchioX: () => [-1, 0, 0, 1, 0, 0],   // x -> -x (asse verticale)
  specchioY: () => [1, 0, 0, -1, 0, 0],   // y -> -y (asse orizzontale)
  // specchio rispetto a un asse per l'origine inclinato di `gradi`
  specchio: (gradi) => { const r = 2 * gradi * Math.PI / 180, c = Math.cos(r), s = Math.sin(r); return [c, s, s, -c, 0, 0]; },
  // componi: prima B poi A
  comp: (A, B) => [
    A[0] * B[0] + A[2] * B[1], A[1] * B[0] + A[3] * B[1],
    A[0] * B[2] + A[2] * B[3], A[1] * B[2] + A[3] * B[3],
    A[0] * B[4] + A[2] * B[5] + A[4], A[1] * B[4] + A[3] * B[5] + A[5],
  ],
  applica: (M, p) => [M[0] * p[0] + M[2] * p[1] + M[4], M[1] * p[0] + M[3] * p[1] + M[5]],
};
const catena = (...Ms) => Ms.reduce((acc, M) => T.comp(acc, M), T.id());

// ---------- tratti: dal motore, con cache
// lo stato di un tratto, in coordinate locali
export function partituraTratto(nome, parametri = {}) {
  const gen = MOTIVI[nome];
  if (!gen) throw new Error(`tratto sconosciuto: ${nome}`);
  return gen(parametri);
}
// dalle tracce alle linee: la penna alzata spezza la linea
export function lineeDaTracce(tracce) {
  const linee = [];
  for (const tr of tracce) {
    let corrente = [];
    for (const [x, y, su, , w] of tr.punti) {
      if (su) corrente.push([x, y, w ?? 0]);
      else if (corrente.length > 1) { linee.push(corrente); corrente = []; }
      else corrente = [];
    }
    if (corrente.length > 1) linee.push(corrente);
  }
  return linee;
}
const cacheTratti = new Map();
export function tratto(nome, parametri = {}) {
  const chiave = nome + JSON.stringify(parametri);
  if (cacheTratti.has(chiave)) return cacheTratti.get(chiave);
  const linee = lineeDaTracce(simula(partituraTratto(nome, parametri)));
  cacheTratti.set(chiave, linee);
  return linee;
}

// i punti sono [x, y, spessore]: lo spessore scala con la trasformazione
const trasforma = (linee, M) => {
  const k = Math.sqrt(Math.abs(M[0] * M[3] - M[1] * M[2]));
  return linee.map((l) => l.map((p) => [...T.applica(M, p), (p[2] ?? 0) * k]));
};

// ---------- simmetrie puntuali
// { tipo: 'C'|'D'|'id', n, fase }  ->  lista di matrici
export function simmetria(s = { tipo: 'id' }) {
  const n = s.n ?? 1, fase = s.fase ?? 0;
  const out = [];
  if (s.tipo === 'C') {
    // ciclica: n rotazioni; la fase ruota tutte le copie
    for (let k = 0; k < n; k++) out.push(T.ruota(fase + 360 * k / n));
  } else if (s.tipo === 'D') {
    // diedrale: n rotazioni (il motivo resta dov'è) e n specchi i cui assi sono
    // a fase, fase + 180/n, ...: la fase dice dove sta il primo asse
    for (let k = 0; k < n; k++) out.push(T.ruota(360 * k / n));
    for (let k = 0; k < n; k++) out.push(T.specchio(fase + 180 * k / n));
  } else out.push(T.id());
  return out;
}

// ---------- motivo
// { tratto, parametri, simmetria, scala, rotazione, spostamento: [x, y] }
// le istanze: una per ogni copia della simmetria
export function istanzeMotivo(m, M0 = T.id()) {
  if (!m) return [];
  const locale = catena(T.ruota(m.rotazione ?? 0), T.scala(m.scala ?? 1));
  const posto = T.trasla(...(m.spostamento || [0, 0]));
  return simmetria(m.simmetria).map((S) => ({ tratto: m.tratto, parametri: m.parametri || {}, M: catena(M0, S, posto, locale) }));
}
const lineeIstanze = (istanze) => istanze.flatMap((ist) => trasforma(tratto(ist.tratto, ist.parametri), ist.M));
export function motivo(m) { return lineeIstanze(istanzeMotivo(m)); }

// ---------- cella
// I posti della cella: per ogni ruolo le istanze dei motivi, in coordinate
// locali (centro in 0,0).
export function istanzeCella(c, indiceContenuto = 0) {
  const L = c.lato ?? 120, h = L / 2;
  const posti = [];
  const metti = (ruolo, m, M) => { if (m) posti.push({ ruolo, istanze: istanzeMotivo(m, M) }); };

  metti('centro', c.centro, T.id());
  metti('contenitore', c.contenitore, T.id());
  if (c.contenuto && c.contenuto.length) {
    const k = ((indiceContenuto % c.contenuto.length) + c.contenuto.length) % c.contenuto.length;
    metti('contenuto', c.contenuto[k], T.id());
  }
  if (c.angoli) {
    // il riempitivo è disegnato per l'angolo in alto a destra e poi portato negli altri tre
    const verso = c.angoli.versoCentro === false ? 0 : 225; // di default guarda il centro
    for (let k = 0; k < 4; k++) {
      const M = catena(T.ruota(90 * k), T.trasla(h, h), T.ruota(verso));
      metti('angoli', c.angoli, M);
    }
  }
  if (c.lati) {
    for (let k = 0; k < 4; k++) {
      const M = catena(T.ruota(90 * k), T.trasla(h, 0), T.ruota(c.lati.versoCentro === false ? 0 : 180));
      metti('lati', c.lati, M);
    }
  }
  const corolle = Array.isArray(c.corolla) ? c.corolla : c.corolla ? [c.corolla] : [];
  for (const co of corolle) {
    // n copie tra gli angoli `da` e `a` (cerchio intero se mancano): il ventaglio
    // è una corolla su un arco. `scala` può essere [inizio, fine] e varia lungo l'arco.
    const n = co.n ?? 8, r = co.raggio ?? h * 0.7;
    const intero = co.da == null && co.a == null;
    const da = co.da ?? (co.fase ?? 0), a = co.a ?? da + 360;
    for (let k = 0; k < n; k++) {
      const frazione = intero ? k / n : n > 1 ? k / (n - 1) : 0.5;
      const ang = da + (a - da) * frazione;
      const sc = Array.isArray(co.scala) ? co.scala[0] + (co.scala[1] - co.scala[0]) * frazione : (co.scala ?? 1);
      // `alterna` specchia una copia sì e una no: la corolla resta ciclica ma non simmetrica
      const M = catena(T.ruota(ang), T.trasla(r, 0), T.ruota(co.orienta ?? 0), T.scala(sc), co.alterna && k % 2 ? T.specchioY() : T.id());
      metti('corolla', co.motivo, M);
    }
  }
  if (c.fusto) {
    // il candelabro: un asse verticale e coppie di elementi specchiati a varie altezze
    const f = c.fusto;
    if (f.asse !== false) metti('fusto', f.asse || { tratto: 'tratto', parametri: { A: [0, -h], B: [0, h] } }, T.id());
    for (const e of f.elementi || []) {
      const M = catena(T.trasla(e.x ?? 0, e.y ?? 0), T.ruota(e.rotazione ?? 0), T.scala(e.scala ?? 1));
      metti('fusto', e.motivo, M);
      if (f.specchia !== false && (e.x ?? 0) !== 0) metti('fusto', e.motivo, catena(T.specchioX(), M));
    }
  }
  return { lato: L, posti };
}
// le linee della cella, ognuna col suo ruolo
export function cella(c, indiceContenuto = 0) {
  const { lato, posti } = istanzeCella(c, indiceContenuto);
  return { lato, pezzi: posti.map((p) => ({ ruolo: p.ruolo, linee: lineeIstanze(p.istanze) })) };
}

// ---------- reticolo
// { cella, colonne, righe, gruppo, sfalsa, ritmo: { sequenza: [..], lungo: 'riga'|'diagonale'|'colonna' } }
// gruppo: come ogni copia (i, j) è trasformata attorno al proprio centro
export const GRUPPI = {
  p1: () => T.id(),                                               // tutte identiche
  pm: (i) => (i % 2 ? T.specchioX() : T.id()),                   // specchiate a colonne alterne
  pmm: (i, j) => catena(i % 2 ? T.specchioX() : T.id(), j % 2 ? T.specchioY() : T.id()),
  p2: (i, j) => ((i + j) % 2 ? T.ruota(180) : T.id()),
  p4: (i, j) => T.ruota(90 * [0, 1, 3, 2][(i % 2) + 2 * (j % 2)]),
  pg: (i) => (i % 2 ? T.specchioX() : T.id()),                   // con slittamento verticale, vedi sotto
  cm: (i) => (i % 2 ? T.specchioX() : T.id()),                   // con righe sfalsate
};

// reticolo esagonale: le celle stanno sui centri di un impaccamento di esagoni
// di larghezza L (lato a lato); le righe sono sfalsate di L/2 e distano L·√3/2.
// p3 e p6 ruotano le celle di 120° o 60° a seconda della posizione.
export const GRUPPI_ESAGONALI = {
  p1: () => T.id(),
  p3: (i, j) => T.ruota(120 * (((i + 2 * j) % 3) + 3) % 3),
  p6: (i, j) => T.ruota(60 * (((i + 2 * j) % 6) + 6) % 6),
  p31m: (i, j) => catena(T.ruota(120 * (((i + 2 * j) % 3) + 3) % 3), j % 2 ? T.specchioX() : T.id()),
};

export function istanzeReticolo(r) {
  const c = r.cella, L = c.lato ?? 120;
  const colonne = r.colonne ?? 6, righe = r.righe ?? 4;
  const esagonale = r.tipo === 'esagonale';
  const gruppo = esagonale ? (GRUPPI_ESAGONALI[r.gruppo || 'p1'] || GRUPPI_ESAGONALI.p1) : (GRUPPI[r.gruppo || 'p1'] || GRUPPI.p1);
  const ritmo = r.ritmo || { sequenza: [0], lungo: 'riga' };
  const sfalsa = esagonale || r.sfalsa || r.gruppo === 'cm';
  const passoRiga = esagonale ? L * Math.sqrt(3) / 2 : L;
  const pezzi = [];
  for (let j = 0; j < righe; j++) {
    for (let i = 0; i < colonne; i++) {
      const seq = ritmo.sequenza || [0];
      const idx = ritmo.lungo === 'diagonale' ? i + j : ritmo.lungo === 'colonna' ? j : i + j * colonne;
      const k = seq[idx % seq.length];
      const { posti } = istanzeCella(c, k);
      const dx = (sfalsa && j % 2 ? L / 2 : 0);
      const dy = (!esagonale && r.gruppo === 'pg' && i % 2 ? L / 2 : 0);
      const M = catena(T.trasla(i * L + L / 2 + dx, j * passoRiga + L / 2 + dy), gruppo(i, j));
      for (const p of posti) pezzi.push({ ruolo: p.ruolo, istanze: p.istanze.map((ist) => ({ ...ist, M: catena(M, ist.M) })), i, j, k });
    }
  }
  return {
    posti: pezzi,
    larghezza: colonne * L + (sfalsa ? L / 2 : 0),
    altezza: (righe - 1) * passoRiga + L + (!esagonale && r.gruppo === 'pg' ? L / 2 : 0),
  };
}

// le linee del reticolo, dalle linee già calcolate di ogni tratto
export function reticolo(r) {
  const { posti, larghezza, altezza } = istanzeReticolo(r);
  return { pezzi: posti.map((p) => ({ ruolo: p.ruolo, linee: lineeIstanze(p.istanze), i: p.i, j: p.j, k: p.k })), larghezza, altezza };
}

// ---------- la parola: la cella e il reticolo riassunti in alfabeto
function nomeMotivo(m) {
  if (!m) return '·';
  const s = m.simmetria;
  const sim = !s || s.tipo === 'id' ? '' : `${s.tipo}${s.n}`;
  const base = `${sim}${sim ? '(' : ''}${m.tratto}${sim ? ')' : ''}`;
  return base;
}
export function parola(r) {
  const c = r.cella;
  const parti = [];
  if (c.centro) parti.push(`centro ${nomeMotivo(c.centro)}`);
  if (c.contenitore) parti.push(`contenitore ${nomeMotivo(c.contenitore)}`);
  if (c.contenuto && c.contenuto.length) {
    const seq = (r.ritmo && r.ritmo.sequenza) || [0];
    const lettere = seq.map((k) => String.fromCharCode(65 + (k % 26))).join('');
    parti.push(`contenuto {${c.contenuto.map(nomeMotivo).join(', ')}} ritmo ${lettere}${r.ritmo && r.ritmo.lungo ? ' ' + r.ritmo.lungo : ''}`);
  }
  if (c.angoli) parti.push(`angoli 4×${nomeMotivo(c.angoli)}`);
  if (c.lati) parti.push(`lati 4×${nomeMotivo(c.lati)}`);
  const corolle = Array.isArray(c.corolla) ? c.corolla : c.corolla ? [c.corolla] : [];
  for (const co of corolle) {
    const arco = co.da != null || co.a != null ? ` ${co.da ?? 0}°→${co.a ?? 360}°` : co.fase ? ` φ${co.fase}°` : '';
    parti.push(`corolla ${co.n ?? 8}×${nomeMotivo(co.motivo)} @${co.raggio ?? Math.round((c.lato ?? 120) * 0.35)}${arco}${co.alterna ? ' alternata' : ''}`);
  }
  if (c.fusto) parti.push(`fusto ${(c.fusto.elementi || []).length} coppie {${(c.fusto.elementi || []).map((e) => nomeMotivo(e.motivo)).join(', ')}}`);
  const gruppo = r.gruppo || 'p1';
  return `CELLA ${c.lato ?? 120} [ ${parti.join(' | ')} ]  ×  RETICOLO ${r.tipo === 'esagonale' ? 'esagonale ' : ''}${gruppo} ${r.colonne ?? 6}×${r.righe ?? 4}${r.sfalsa || gruppo === 'cm' ? ' sfalsato' : ''}`;
}

export const RUOLI = ['centro', 'contenitore', 'contenuto', 'angoli', 'lati', 'corolla', 'fusto'];
