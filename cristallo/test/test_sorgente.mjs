// test_sorgente.mjs — la sorgente in un punto simmetrico: il gruppo del sito trovato dal reticolo e dagli atomi.
// TOLLERANZE (dichiarate prima):
//   · l'ordine di rotazione trovato sta in {1, 2, 3, 4, 6} (si provano anche 5, 7, 8): 6 sul nodo del piano
//     esagonale, 4 al centro del cubo semplice, 2 con due specchi a metà del lato del piano quadrato, 3 sul nodo del
//     cubo semplice guardato lungo (111), dove sull'immagine si vede 3 o 6 (punto 8);
//     (Nota onesta: la prima stesura chiedeva 3 esatto. Ma la proiezione parallela non distingue n da −n, e
//     l'inversione per 3 dà sull'immagine una rotazione di 60°: si trova 6, che il punto 8 ammette.)
//   · il disegno complessivo, in proiezione parallela lungo l'asse, è invariante sotto ogni operazione del gruppo che
//     tiene l'asse: la traiettoria della pallina i, trasformata, coincide punto per punto con quella della pallina j
//     con v_j = g·v_i, entro 10⁻⁹ celle, per 2 unità di tempo (poi il caos ingrandisce l'ultimo bit);
//   · il sito più vicino a un tocco scatta sul nodo più simmetrico lì vicino.
import { creaCristallo, punto, versore } from '../src/reticolo.js';
import { gruppoDelSito, descriviGruppo, sitoVicino } from '../src/simmetria.js';
import { creaSorgente } from '../src/motore.js';
import { creaFinestra } from '../src/finestra.js';
import { normaleDi } from '../src/indici.js';
import { config, piano } from './casi.mjs';
import { prova, vero, sotto, fine, dice, numero } from './prova.mjs';

console.log('sorgente simmetrica');
const casi = [
  { nome: 'piano esagonale, nodo', reticolo: piano('esagonale'), f: [0, 0, 0], hkl: [0, 0, 1], ordine: 6 },
  { nome: 'cubo semplice, centro', reticolo: { sistema: 'cubico', centratura: 'P' }, f: [0.5, 0.5, 0.5], hkl: [0, 0, 1], ordine: 4 },
  { nome: 'piano quadrato, metà lato', reticolo: piano('quadrato'), f: [0.5, 0, 0], hkl: [0, 0, 1], ordine: 2, specchi: true },
  { nome: 'cubo semplice, nodo, (111)', reticolo: { sistema: 'cubico', centratura: 'P' }, f: [0, 0, 0], hkl: [1, 1, 1], ordine: 4, lungoAsse: [3, 6] },
];
prova('il gruppo del sito, trovato, è cristallografico; il disegno è invariante entro l\'aritmetica', () => {
  for (const c of casi) {
    const cr = creaCristallo({ ...c.reticolo, atomi: [{ p: [0, 0, 0], s: 1 }] });
    const x0 = [0, 1, 2].map((k) => c.f[0] * cr.A[0][k] + c.f[1] * cr.A[1][k] + c.f[2] * cr.A[2][k]);
    const g = gruppoDelSito(cr, x0), d = descriviGruppo(g);
    vero([1, 2, 3, 4, 6].includes(d.ordine), `${c.nome}: ordine ${d.ordine}`);
    vero(d.ordine === c.ordine, `${c.nome}: ordine ${d.ordine}, atteso ${c.ordine}`);
    if (c.specchi) vero(d.specchi > 0, 'specchi');
    // la sorgente, la finestra parallela lungo l'asse, le operazioni che tengono l'asse
    const n = normaleDi(c.hkl, cr), v0 = c.reticolo.piano ? [0.83, 0.31, 0] : [0.83, 0.31, 0.22];
    const p = config({ reticolo: c.reticolo, atomi: [{ p: [0, 0, 0], s: 1 }], w: 0.2, r0: x0, v0, tempo: 2, sorgente: 1, finestra: { C: x0, R: Infinity, n, psi: 0, L: 4, D: 1 } });
    const So = creaSorgente(p), f = creaFinestra(p.finestra);
    for (const S of So.sessioni) while (!S.finito) S.avanza(1e5);
    const imm = So.sessioni.map((S) => { const P = S.viaggio.punti(), o = []; for (let i = 0; i < P.length; i += 3) { const w = f.aFinestra([P[i], P[i + 1], P[i + 2]]); o.push([w[0], w[1]]); } return o; });
    let e = 0, usate = 0, rot = 1;
    for (const op of g) {
      const gn = [0, 1, 2].map((i) => punto(op[i], n));
      if (Math.abs(Math.abs(punto(gn, n)) - 1) > 1e-9) continue; // non tiene l'asse
      usate++;
      const a = (u, v) => punto(f[u], [0, 1, 2].map((i) => punto(op[i], f[v])));
      const G = [[a('e1', 'e1'), a('e1', 'e2')], [a('e2', 'e1'), a('e2', 'e2')]];
      const det = G[0][0] * G[1][1] - G[0][1] * G[1][0], th = Math.atan2(G[1][0], G[0][0]);
      if (det > 0 && Math.abs(th) > 1e-6) rot = Math.max(rot, Math.round((2 * Math.PI) / Math.abs(th)));
      So.direzioni.forEach((vi, i) => {
        const gv = [0, 1, 2].map((k) => punto(op[k], vi)), j = So.direzioni.findIndex((w) => Math.hypot(w[0] - gv[0], w[1] - gv[1], w[2] - gv[2]) < 1e-9);
        vero(j >= 0, 'l\'orbita deve contenere g·v');
        const A = imm[i], B = imm[j];
        for (let k = 0; k < Math.min(A.length, B.length); k++) e = Math.max(e, Math.hypot(G[0][0] * A[k][0] + G[0][1] * A[k][1] - B[k][0], G[1][0] * A[k][0] + G[1][1] * A[k][1] - B[k][1]));
      });
    }
    dice(c.nome.padEnd(28), 'elementi', d.elementi, ' ordine', d.ordine, ' specchi', d.specchi, ' palline', So.direzioni.length, ' operazioni sull\'asse', usate, '(rotazione', rot + ')', ' scarto', numero(e));
    sotto(e, 1e-9, `${c.nome}: invarianza`);
    if (c.lungoAsse) vero(c.lungoAsse.includes(rot), `${c.nome}: lungo l'asse ${rot}`);
  }
});
prova('un tocco scatta sul sito simmetrico più vicino', () => {
  const cr = creaCristallo({ ...piano('esagonale'), atomi: [{ p: [0, 0, 0], s: 1 }] });
  const s = sitoVicino(cr, [1.04, 0.03, 0]);
  dice('scatta su', s.x.map((x) => numero(x)).join(', '), ' ordine', s.sito.ordine);
  sotto(Math.hypot(s.x[0] - 1, s.x[1], s.x[2]), 1e-12, 'posizione'); vero(s.sito.ordine === 6, 'ordine');
  void versore;
});
fine('sorgente simmetrica');
