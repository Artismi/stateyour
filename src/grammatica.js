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
// alfabeto leggibile, `componi()` lo trasforma in linee da disegnare.

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
const cacheTratti = new Map();
export function tratto(nome, parametri = {}) {
  const chiave = nome + JSON.stringify(parametri);
  if (cacheTratti.has(chiave)) return cacheTratti.get(chiave);
  const gen = MOTIVI[nome];
  if (!gen) throw new Error(`tratto sconosciuto: ${nome}`);
  const partitura = gen(parametri);
  const linee = [];
  for (const tr of simula(partitura)) {
    let corrente = [];
    for (const [x, y, su] of tr.punti) {
      if (su) corrente.push([x, y]);
      else if (corrente.length > 1) { linee.push(corrente); corrente = []; }
      else corrente = [];
    }
    if (corrente.length > 1) linee.push(corrente);
  }
  cacheTratti.set(chiave, linee);
  return linee;
}

const trasforma = (linee, M) => linee.map((l) => l.map((p) => T.applica(M, p)));

// ---------- simmetrie puntuali
// { tipo: 'C'|'D'|'id', n, fase }  ->  lista di matrici
export function simmetria(s = { tipo: 'id' }) {
  const n = s.n ?? 1, fase = s.fase ?? 0;
  const out = [];
  if (s.tipo === 'C' || s.tipo === 'D') {
    for (let k = 0; k < n; k++) out.push(T.ruota(fase + 360 * k / n));
    if (s.tipo === 'D') for (let k = 0; k < n; k++) out.push(catena(T.ruota(fase + 360 * k / n), T.specchio(fase)));
  } else out.push(T.id());
  return out;
}

// ---------- motivo
// { tratto, parametri, simmetria, scala, rotazione, spostamento: [x, y] }
export function motivo(m) {
  if (!m) return [];
  const base = tratto(m.tratto, m.parametri || {});
  const locale = catena(T.ruota(m.rotazione ?? 0), T.scala(m.scala ?? 1));
  const posto = T.trasla(...(m.spostamento || [0, 0]));
  const linee = [];
  for (const S of simmetria(m.simmetria)) linee.push(...trasforma(base, catena(S, posto, locale)));
  return linee;
}

// ---------- cella
// Restituisce le linee in coordinate locali (centro in 0,0), ognuna col suo ruolo.
export function cella(c, indiceContenuto = 0) {
  const L = c.lato ?? 120, h = L / 2;
  const pezzi = [];
  const metti = (ruolo, m, M) => { if (m) pezzi.push({ ruolo, linee: trasforma(motivo(m), M) }); };

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
  if (c.corolla) {
    const co = c.corolla, n = co.n ?? 8, r = co.raggio ?? h * 0.7, fase = co.fase ?? 0;
    for (let k = 0; k < n; k++) {
      const a = fase + 360 * k / n;
      // `alterna` specchia una copia sì e una no: la corolla resta ciclica ma non simmetrica
      const M = catena(T.ruota(a), T.trasla(r, 0), T.ruota(co.orienta ?? 0), co.alterna && k % 2 ? T.specchioY() : T.id());
      metti('corolla', co.motivo, M);
    }
  }
  return { lato: L, pezzi };
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

export function reticolo(r) {
  const c = r.cella, L = c.lato ?? 120;
  const colonne = r.colonne ?? 6, righe = r.righe ?? 4;
  const gruppo = GRUPPI[r.gruppo || 'p1'] || GRUPPI.p1;
  const ritmo = r.ritmo || { sequenza: [0], lungo: 'riga' };
  const sfalsa = r.sfalsa || r.gruppo === 'cm';
  const pezzi = [];
  for (let j = 0; j < righe; j++) {
    for (let i = 0; i < colonne; i++) {
      const seq = ritmo.sequenza || [0];
      const idx = ritmo.lungo === 'diagonale' ? i + j : ritmo.lungo === 'colonna' ? j : i + j * colonne;
      const k = seq[idx % seq.length];
      const celle = cella(c, k);
      const dx = (sfalsa && j % 2 ? L / 2 : 0);
      const dy = (r.gruppo === 'pg' && i % 2 ? L / 2 : 0);
      const M = catena(T.trasla(i * L + L / 2 + dx, j * L + L / 2 + dy), gruppo(i, j));
      for (const p of celle.pezzi) pezzi.push({ ...p, linee: trasforma(p.linee, M), i, j, k });
    }
  }
  return { pezzi, larghezza: colonne * L + (sfalsa ? L / 2 : 0), altezza: righe * L + (r.gruppo === 'pg' ? L / 2 : 0) };
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
  if (c.corolla) parti.push(`corolla ${c.corolla.n ?? 8}×${nomeMotivo(c.corolla.motivo)} @${c.corolla.raggio ?? Math.round((c.lato ?? 120) * 0.35)}${c.corolla.fase ? ` φ${c.corolla.fase}°` : ''}${c.corolla.alterna ? ' alternata' : ''}`);
  const gruppo = r.gruppo || 'p1';
  return `CELLA ${c.lato ?? 120} [ ${parti.join(' | ')} ]  ×  RETICOLO ${gruppo} ${r.colonne ?? 6}×${r.righe ?? 4}${r.sfalsa || gruppo === 'cm' ? ' sfalsato' : ''}`;
}

export const RUOLI = ['centro', 'contenitore', 'contenuto', 'angoli', 'lati', 'corolla'];
