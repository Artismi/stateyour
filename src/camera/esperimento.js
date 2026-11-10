// esperimento.js — il seme come storia: le condizioni iniziali di una cella di
// spaziotempo, e il modo in cui la cella si ripete per fare il pattern.
//
// esperimento = {
//   nome, nota,
//   cella: un mondo (vedi mondo.js): masse, domini di campo/materia/mezzo,
//          specchi, il catalogo delle specie, le sorgenti. È TUTTO il seme:
//          il resto (ogni linea, ogni spessore, ogni occhio) è conseguenza.
//   ripetizione: { tipo: 'nessuna'|'quadrato'|'sfalsato'|'specchio', colonne, righe }
// }
//
// La ripetizione non aggiunge forme: dice solo che lo stesso evento accade in
// tante celle vicine, ognuna col suo campo. Una cella "a specchio" è lo stesso
// evento nell'universo riflesso: lì il campo magnetico ha il verso opposto (B
// è uno pseudoscalare), e la traccia è esattamente la riflessione di quella
// originale. Per questo basta simulare una cella sola.

import { simulaMondo } from './mondo.js';

export const clona = (o) => JSON.parse(JSON.stringify(o));

export function simulaCella(esp, opzioni) { return simulaMondo(esp.cella, opzioni); }

// le trasformazioni [a, b, c, d, e, f] (come canvas.setTransform) di ogni copia della cella
export function copie(esp) {
  const { larghezza: W, altezza: H } = esp.cella, r = esp.ripetizione || { tipo: 'nessuna' };
  if (r.tipo === 'nessuna') return [{ i: 0, j: 0, m: [1, 0, 0, 1, 0, 0], specchio: false }];
  const out = [];
  for (let j = 0; j < (r.righe ?? 3); j++) for (let i = 0; i < (r.colonne ?? 3); i++) {
    let dx = i * W, dy = j * H, specchio = false;
    if (r.tipo === 'sfalsato' && j % 2) dx += W / 2;
    if (r.tipo === 'specchio' && (i + j) % 2) specchio = true;
    out.push({ i, j, specchio, m: specchio ? [-1, 0, 0, 1, dx + W, dy] : [1, 0, 0, 1, dx, dy] });
  }
  return out;
}
export function dimensioneLastra(esp) {
  const { larghezza: W, altezza: H } = esp.cella, r = esp.ripetizione || { tipo: 'nessuna' };
  if (r.tipo === 'nessuna') return [W, H];
  return [W * (r.colonne ?? 3) + (r.tipo === 'sfalsato' ? W / 2 : 0), H * (r.righe ?? 3)];
}

// la storia di una traccia, in parole
export function storia(tr, esp) {
  const s = tr.specie, P = tr.punti, leggi = new Set(P.map((p) => p[5]).join('+').split('+'));
  const chi = s.luce ? `un raggio di luce (${s.nome || 'fotone'})` : `${s.nome ? `un ${s.nome}` : 'una particella'} (carica ${fmt(s.q ?? 0)}, massa ${fmt(s.m ?? 1)})`;
  const nascita = tr.madre ? `è nato al tempo ${fmt(P[0][3])} dal decadimento di un ${tr.madre.specie}` : `parte dalla sorgente ${tr.sorgente + 1} al tempo ${fmt(P[0][3])}`;
  const cosa = [];
  if (leggi.has('magnetico')) cosa.push('il campo magnetico lo fa girare');
  if (leggi.has('materia')) cosa.push('la materia lo frena e la curva si stringe');
  if (leggi.has('gravita')) cosa.push(s.luce ? 'una massa piega il suo cammino' : 'una massa lo attira');
  if (leggi.has('specchio')) cosa.push('rimbalza su uno specchio');
  if (leggi.has('rifrazione')) cosa.push('cambia mezzo e si rifrange');
  if (!cosa.length) cosa.push('nessuna forza: va dritto');
  const FINI = { ferma: 'si ferma: la macchia tonda in fondo è il picco di Bragg', decade: 'decade: qui nascono le sue figlie', fuori: 'esce dalla cella', tempo: 'la pellicola smette di registrare', assorbita: 'una parete nera lo assorbe', caduta: 'cade sul corpo di una massa' };
  const lung = P.reduce((L, p, i) => (i && P[i - 1][2] && p[2] ? L + Math.hypot(p[0] - P[i - 1][0], p[1] - P[i - 1][1]) : L), 0);
  return `Questa linea è ${chi}. ${cap(nascita)}. Lungo la strada ${cosa.join(', ')}. Alla fine ${FINI[tr.fine] || tr.fine}. Lunghezza ${fmt(lung)}, dal tempo ${fmt(P[0][3])} al tempo ${fmt(P[P.length - 1][3])}.`;
}
export const fmt = (x) => (Math.abs(x) >= 100 ? x.toFixed(0) : Math.abs(x) >= 10 ? x.toFixed(1) : x.toFixed(2)).replace(/\.?0+$/, '') || '0';
const cap = (s) => s[0].toUpperCase() + s.slice(1);

// ---------- gli esperimenti di partenza: ognuno è un evento fisico possibile

const C = 30;
const tondo = (x) => Math.round(x * 1000) / 1000;

// IL FIORE. Al centro un nucleo fermo decade e lancia N fotoni a raggiera. Ogni
// fotone (invisibile, come nelle camere a bolle) dopo un breve tratto si
// converte in una coppia elettrone-positrone. Nel campo magnetico le due
// cariche girano in versi opposti e si richiudono una verso l'altra: è il
// petalo. La materia le frena; dove si fermano lasciano la punta. Un nucleo di
// rinculo pesante si ferma quasi subito: il bottone al centro.
export function fiore(N = 6) {
  const figli = [];
  for (let k = 0; k < N; k++) figli.push({ specie: 'fotone', angolo: tondo((360 * k) / N), quota: 1 });
  figli.push({ specie: 'rinculo', angolo: 0, v: 3.2 });
  return {
    nome: 'il fiore',
    nota: 'un nucleo decade in fotoni a raggiera; ogni fotone diventa una coppia + e −, che il campo magnetico richiude in un petalo',
    cella: {
      larghezza: 200, altezza: 200, c: C, G: 1, bordo: 'aperto', tempo: 12,
      fondo: { B: 0, K: 0, n: 1 },
      domini: [{ nome: 'il campo del fiore', forma: { tipo: 'cerchio', centro: [100, 100], r: 92 }, B: 0.32, K: 42, n: 1 }],
      masse: [], pareti: [],
      pellicola: { w0: 0.9, saturazione: 4, vRif: 9 },
      specie: {
        nucleo: { q: 0, m: 4, vita: 0.001, figli },
        fotone: { luce: true, m: 0.62, vita: 0.45, visibile: false, figli: [{ specie: 'elettrone', angolo: 42, quota: 0.5 }, { specie: 'positrone', angolo: -42, quota: 0.5 }] },
        elettrone: { q: -1, m: 1 },
        positrone: { q: 1, m: 1 },
        rinculo: { q: 2, m: 12 },
      },
      sorgenti: [{ pos: [100, 100], dir: -Math.PI / 2, v: 0.0001, specie: 'nucleo' }],
    },
    ripetizione: { tipo: 'quadrato', colonne: 4, righe: 3 },
  };
}

// LA VOLUTA. Una particella neutra sale e decade in due cariche opposte: il
// campo le fa girare in versi opposti, la materia le frena: due spirali
// simmetriche che finiscono nell'occhio (il picco di Bragg).
export function voluta() {
  return {
    nome: 'la voluta',
    nota: 'una neutra decade in + e −: girano in versi opposti e si avvolgono finché la materia le ferma',
    cella: {
      larghezza: 200, altezza: 200, c: C, G: 1, bordo: 'aperto', tempo: 90,
      fondo: { B: 0, K: 0, n: 1 },
      domini: [{ nome: 'il campo', forma: { tipo: 'tutto' }, B: 0.3, K: 4, n: 1 }],
      masse: [], pareti: [],
      pellicola: { w0: 1.1, saturazione: 4.5, vRif: 7 },
      specie: {
        kaone: { q: 0, m: 2, vita: 5, visibile: false, figli: [{ specie: 'pi+', angolo: -24, quota: 0.5 }, { specie: 'pi-', angolo: 24, quota: 0.5 }] },
        'pi+': { q: 1, m: 1 }, 'pi-': { q: -1, m: 1 },
      },
      sorgenti: [{ pos: [100, 190], dir: -Math.PI / 2, v: 9, specie: 'kaone' }],
    },
    ripetizione: { tipo: 'specchio', colonne: 4, righe: 2 },
  };
}

// LA LENTE GRAVITAZIONALE. Una massa al centro; raggi di luce paralleli le
// passano accanto e si piegano verso di lei (il doppio di quanto farebbe un
// sasso), incrociandosi dietro: una caustica. Una particella lenta le orbita
// attorno: l'ellisse che ruota (con un filo di campo magnetico) è la rosetta.
export function lente() {
  const sorgenti = [];
  for (let k = -9; k <= 9; k++) if (k) sorgenti.push({ pos: [0, 100 + k * 9.5], dir: 0, specie: 'luce' });
  sorgenti.push({ pos: [100, 52], dir: 0, v: 4.4, specie: 'satellite' });
  return {
    nome: 'la lente',
    nota: 'una massa ferma piega la luce che le passa accanto e trattiene in orbita una carica lenta',
    cella: {
      larghezza: 200, altezza: 200, c: C, G: 1, bordo: 'aperto', tempo: 60,
      fondo: { B: 0.012, K: 0, n: 1 },
      domini: [], pareti: [],
      masse: [{ nome: 'la massa', pos: [100, 100], M: 900, R: 7 }],
      pellicola: { w0: 0.8, saturazione: 3, vRif: 5 },
      specie: { luce: { luce: true, m: 1 }, satellite: { q: 0.4, m: 1, visibile: true } },
      sorgenti,
    },
    ripetizione: { tipo: 'quadrato', colonne: 3, righe: 2 },
  };
}

// IL BILIARDO. Un raggio di luce chiuso in una scatola di specchi rimbalza
// all'infinito: la campitura. Una goccia di vetro al centro lo rifrange.
export function biliardo() {
  const R = [[20, 20], [180, 20], [180, 180], [20, 180]];
  return {
    nome: 'il biliardo',
    nota: 'un raggio di luce in una scatola di specchi riempie lo spazio; una goccia di vetro lo devia',
    cella: {
      larghezza: 200, altezza: 200, c: C, G: 1, bordo: 'aperto', tempo: 300,
      fondo: { B: 0, K: 0, n: 1 },
      domini: [{ nome: 'la goccia di vetro', forma: { tipo: 'cerchio', centro: [100, 100], r: 34 }, B: 0, K: 0, n: 1.45 }],
      masse: [],
      pareti: R.map((a, i) => ({ a, b: R[(i + 1) % 4], tipo: 'specchio' })),
      pellicola: { w0: 0.7, saturazione: 3, vRif: 10 },
      specie: { luce: { luce: true, m: 1 } },
      sorgenti: [{ pos: [30, 64], dir: 0.31, specie: 'luce' }],
    },
    ripetizione: { tipo: 'specchio', colonne: 3, righe: 2 },
  };
}

// LA PALMETTA. Una neutra pesante decade in un ventaglio di cariche alterne: il
// campo apre il ventaglio in foglie che si arricciano verso l'esterno.
export function palmetta(N = 7) {
  const figli = [];
  for (let k = 0; k < N; k++) { const a = -70 + (140 * k) / (N - 1); figli.push({ specie: a < 0 ? 'meno' : a > 0 ? 'più' : 'neutra', angolo: tondo(a), quota: tondo(0.15 - 0.07 * Math.abs(a) / 70) }); }
  return {
    nome: 'la palmetta',
    nota: 'una neutra decade in un ventaglio di cariche: quelle a sinistra sono negative e girano verso sinistra, quelle a destra positive e girano verso destra',
    cella: {
      larghezza: 200, altezza: 200, c: C, G: 1, bordo: 'aperto', tempo: 60,
      fondo: { B: 0, K: 0, n: 1 },
      domini: [{ nome: 'il campo', forma: { tipo: 'tutto' }, B: 0.22, K: 7, n: 1 }],
      masse: [], pareti: [],
      pellicola: { w0: 1, saturazione: 4, vRif: 7 },
      specie: {
        madre: { q: 0, m: 6, vita: 3.2, visibile: false, figli },
        'più': { q: 1, m: 1 }, meno: { q: -1, m: 1 }, neutra: { q: 0, m: 1, visibile: false },
      },
      sorgenti: [{ pos: [100, 150], dir: -Math.PI / 2, v: 10, specie: 'madre' }],
    },
    ripetizione: { tipo: 'sfalsato', colonne: 4, righe: 3 },
  };
}

export const PRESET = { fiore, voluta, palmetta, lente, biliardo };
