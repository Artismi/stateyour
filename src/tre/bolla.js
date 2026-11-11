// bolla.js — LA BOLLA: lo stato della vista è un istante con un volume di spazio (INTRECCIO.md, regola 11).
//
// La vista 3D non ha «livelli» con stati propri: ha UNA bolla, e cosmo, galassia, sistema, pianeta, suolo sono la stessa
// cosa con un'altra grandezza. Una bolla è un oggetto semplice, che si scrive e si rilegge (scriviBolla, leggiBolla):
//   indirizzo   l'indirizzo di intreccio.js: { percorso, tempo, rami }
//                 percorso  i luoghi dal più grande al più piccolo fin dove si è dentro: ['cosmo 1', 'galassia 2',
//                           'stella 838', 'pianeta 0', 'luna 1']; l'ultimo è il RIFERIMENTO in cui si danno posizione e assi
//                 tempo     anni dall'inizio del cosmo (ANNI_OGGI + t / anno), come vuole intreccio.js
//                 rami      gli eventi andati diversamente in questo mondo
//   t           lo stesso istante in secondi da oggi (la coordinata che usano spazio3d.js e il nucleo: è quella che conta;
//               `indirizzo.tempo` ne è la forma in anni)
//   posizione   [x, y, z] in metri: dove sta chi guarda, nel riferimento dell'ultimo luogo del percorso (per un pianeta:
//               dal suo centro; se `solidale`, negli assi che girano col pianeta — sopra lo stesso punto del suolo —,
//               altrimenti negli assi fermi rispetto alle stelle); null = «da qualche parte lì»: la vista si mette da sé a
//               guardare quel luogo dalla distanza che la `grandezza` chiede
//   assi        nove numeri: destra, alto e dietro di chi guarda (colonne), nello stesso riferimento
//   grandezza   il lato del volume che si guarda, in metri (da 10²⁶ a 10⁻¹⁵): quanto è alto ciò che sta nel campo alla
//               distanza di ciò che si ha davanti (il suolo sotto, la cosa più vicina)
//   moto        lo stato di moto di chi guarda: { solidale (gira col corpo), velocita [m/s nel riferimento], tempo (secondi
//               del mondo per secondo di chi guarda), pausa }
// Dove vive: nel nucleo, e in nessun altro posto. La camera (N.camera: corpo, pos, assi, solidale) e il tempo (N.tempo:
// t, velocita, pausa) SONO la bolla; `bollaDi(N)` la legge, `universo.vaiAllaBolla(b)` (universo.js) la mette — e prepara
// in secondo piano ciò che in quel volume c'è. Ogni corpo del nucleo porta il nome del suo luogo (`corpo.luogo`): il
// percorso si legge risalendo l'albero dei corpi, senza sapere che livelli ci sono.
import { indirizzo, scrivi, leggi } from '../camera/intreccio.js';
import { ANNI_OGGI } from '../camera/spazio3d.js'; // l'età del cosmo oggi (anni): t = 0

const ANNO = 3.15576e7;

export function bolla({ percorso, t = 0, rami = null, posizione = null, assi = null, grandezza = null, moto = null } = {}) {
  const m = { solidale: false, velocita: [0, 0, 0], tempo: 1, pausa: false, ...(moto || {}) };
  return { indirizzo: indirizzo(percorso || ['cosmo 1'], { tempo: ANNI_OGGI + t / ANNO, rami }), t, posizione: posizione ? Array.from(posizione) : null, assi: assi ? Array.from(assi) : null, grandezza, moto: m };
}
// la forma scritta (una riga di testo, per salvarla e ripartire da lì) e la lettura
export const scriviBolla = (b) => JSON.stringify({ i: scrivi(b.indirizzo), t: b.t, p: b.posizione, a: b.assi, g: b.grandezza, m: b.moto });
export function leggiBolla(testo) {
  const o = typeof testo === 'string' ? JSON.parse(testo) : testo; if (!o || typeof o.i !== 'string') return null; const a = leggi(o.i);
  return bolla({ percorso: a.percorso, rami: a.rami, t: Number(o.t) || 0, posizione: Array.isArray(o.p) && o.p.length === 3 ? o.p.map(Number) : null, assi: Array.isArray(o.a) && o.a.length === 9 ? o.a.map(Number) : null, grandezza: o.g > 0 ? +o.g : null, moto: o.m || null });
}
// dal percorso alla «via» della mappa ({ cosmo, galassia, stella, pianeta, luna }) e ritorno
export function viaDi(b) { const v = {}; for (const p of b.indirizzo.percorso) { const m = /^(cosmo|galassia|stella|pianeta|luna) (-?\d+)$/.exec(p); if (m) v[m[1]] = +m[2]; } return v; }
export function percorsoDi(via) { const out = []; for (const k of ['cosmo', 'galassia', 'stella', 'pianeta', 'luna']) { if (via[k] == null) break; out.push(`${k} ${via[k]}`); } return out; }
// la bolla da cui si parte quando si ha solo un indirizzo della biblioteca: quel luogo, visto intero
export const bollaDaVia = (via, t = 0, rami = null) => bolla({ percorso: percorsoDi(via), t, rami });

// la bolla di adesso, letta dal nucleo: il percorso risalendo i luoghi dei corpi, la posizione nel riferimento del
// primo corpo che ha un luogo (di solito quello a cui la camera è attaccata)
let prima = null; // (posizione e istante dell'ultima lettura: per la velocità di chi guarda)
export function bollaDi(N, rami = null) {
  const cam = N.camera, V = N.V, t = N.tempo.t, S = N.stato; let c = cam.corpo, pos = cam.pos.slice(), assi = Array.from(cam.assi), solidale = !!cam.solidale;
  if (c && !c.luogo) { // un corpo senza luogo (un riferimento d'appoggio): si passa al primo antenato che ne ha uno, negli assi fermi
    const A = solidale ? N.assettoDi(c, t) : null; if (A) { pos = V.mv(A, pos); assi = V.mm(A, assi); } solidale = false;
    let g = c.genitore; while (g && !g.luogo) g = g.genitore; if (g) { const d = N.tra(g, c, t); pos = [pos[0] + d[0], pos[1] + d[1], pos[2] + d[2]]; } c = g; }
  const percorso = []; for (let x = c; x; x = x.genitore) if (x.luogo) percorso.unshift(...String(x.luogo).split('/'));
  // quanto è grande ciò che si guarda: l'altezza del campo alla distanza del suolo, o della cosa più vicina
  const terra = cam.corpo && cam.corpo.quota, lontano = Math.hypot(pos[0], pos[1], pos[2]), d = terra ? Math.max(S.quota || 0, 0.5) : Math.min(S.vicinoM > 0 ? S.vicinoM : Infinity, cam.corpo && cam.corpo.genitore && lontano > 0 ? lontano : Infinity, S.vicinoM > 0 ? Infinity : lontano || 1), grandezza = 2 * (S.tanY || Math.tan((cam.fov || 0.75) / 2)) * d;
  const ora = performance.now() / 1000, chiave = percorso.join('/') + (solidale ? '|s' : ''); let velocita = [0, 0, 0];
  if (prima && prima.chiave === chiave && ora - prima.ora > 1e-3 && ora - prima.ora < 2) velocita = [0, 1, 2].map((k) => (pos[k] - prima.pos[k]) / (ora - prima.ora));
  if (!prima || prima.chiave !== chiave || ora - prima.ora > 0.25) prima = { chiave, ora, pos: pos.slice() };
  return bolla({ percorso: percorso.length ? percorso : ['cosmo 1'], t, rami, posizione: pos, assi, grandezza, moto: { solidale, velocita, tempo: N.tempo.velocita, pausa: !!N.tempo.pausa } });
}

// a ogni grandezza il suo nome (per dire dove si è) e il passo del tempo che ha senso (secondi del mondo per secondo di
// chi guarda): quello a cui le cose di quella taglia si muovono di un tratto che si vede, senza correre
const SCALE = [
  [3e23, 'il cosmo', 3e7 * ANNO], [3e19, 'una galassia', 3e6 * ANNO], [3e14, 'tra le stelle', 1e4 * ANNO], [5e10, 'un sistema', 30 * 86400],
  [3e8, 'un pianeta e le sue lune', 6 * 3600], [3e5, 'un pianeta', 1800], [3e3, 'una regione', 120], [30, 'un paesaggio', 10], [1e-2, 'il suolo', 1],
  [1e-6, 'un granello', 1e-3], [1e-9, 'una cellula di materia', 1e-9], [0, 'gli atomi', 1e-15],
];
export function scalaDi(grandezza) { for (const [min, nome, passo] of SCALE) if (grandezza >= min) return { nome, passo }; return { nome: 'gli atomi', passo: 1e-15 }; }
export const passoSensato = (grandezza) => scalaDi(grandezza).passo;
