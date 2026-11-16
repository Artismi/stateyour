// test_finestra.mjs — la finestra tangente alla sfera, i tagli, il periodo lungo (hkl), le direzioni irrazionali, il
// 🎲 uniforme sulla sfera, i punti di fuga della prospettiva.
// TOLLERANZE (dichiarate prima):
//   · l'asse passa per C e la distanza da C è R entro 8 ulp, cioè 8·2⁻⁵²·(R + |C|); i versori ortonormali entro 10⁻¹⁵;
//   · i tagli: i pezzi stanno nel volume visibile entro 10⁻¹²·(la scala), i punti di taglio sui bordi entro 10⁻¹²·(la
//     scala), e la lunghezza tenuta è quella misurata a forza bruta (10⁴ pezzi per tratto) entro 2·10⁻⁴;
//   · con n lungo (hkl), in proiezione parallela (R = ∞), il pattern traslato di t₁, t₂, t₁ + t₂ (il reticolo del piano,
//     calcolato dagli indici) ricade su sé stesso entro 10⁻⁹ celle in ogni punto provato; traslato di t₁/2 no (più di d);
//   · con n irrazionale, nessuna traslazione del reticolo (indici fino a 4, spostamento sull'immagine tra 0,05 e L/2)
//     lo riporta su sé stesso entro d;
//   · la zona di quasi ripetizione vicino a (210) è d/sin ε entro 10⁻⁹ (relativo) e cresce al calare di ε; sul pattern,
//     lo scarto della traslazione di (210) cala al calare di ε;
//   · n del 🎲 uniforme sulla sfera: la statistica di Kolmogorov-Smirnov di cos θ (e di φ, e di ψ) sotto 1,949/√N, il
//     valore critico al livello 0,001, con N = 20000 indirizzi «🎲/0» … «🎲/19999»;
//   · prospettiva: le immagini di x + λt stanno sulla retta per il punto di fuga di t (prodotto vettoriale entro
//     10⁻¹²·scala²) e lo raggiungono come 1/λ; con R = 10⁸ la prospettiva è la proiezione parallela entro 10⁻⁶.
//     (Nota onesta: la prima stesura chiedeva «a λ = 10⁶ entro 10⁻⁵·scala», una stima sbagliata per le direzioni quasi
//     parallele alla finestra, dove la costante della legge 1/λ è grande. È sostituita da una prova più stretta: lo
//     scarto I(λ) − V è quello esatto, R·(a·t_z − b·c)/(t_z·(c + λ·t_z)), entro 10⁻⁹·scala per λ = 10, 10³, 10⁶.)
//   · le prove sulle traslazioni guardano tutti i punti medi del pattern; quelle sulle direzioni irrazionali usano una
//     lastra sottile (D = 0,05): in una lastra spessa il pattern proiettato cambia solo nello strato vicino alle facce.
import { creaCristallo, punto, norma, vettore } from '../src/reticolo.js';
import { creaFinestra, taglia, creaProiettore } from '../src/finestra.js';
import { descriviDirezione, reticoloDelPiano, normaleDi } from '../src/indici.js';
import { creaSessione, sogliaDi } from '../src/motore.js';
import { casuale } from '../src/indirizzo.js';
import { sorgente } from '../src/caso.js';
import { config } from './casi.mjs';
import { prova, vero, sotto, sopra, fine, dice, numero } from './prova.mjs';

const EPS = 2 ** -52;
console.log('finestra');

prova('l\'asse della finestra passa per C e la sua distanza da C è R, all\'aritmetica', () => {
  const c = sorgente('prova finestra');
  let e1 = 0, e2 = 0, e3 = 0;
  for (let k = 0; k < 2000; k++) {
    const d = c.sotto(String(k)), C = [0, 1, 2].map((i) => d.tra(`C${i}`, -5, 5)), R = Math.pow(10, d.tra('R', -1, 3));
    const z = 1 - 2 * d('cos'), s = Math.sqrt(1 - z * z), n = [s * Math.cos(6.283185307179586 * d('fi')), s * Math.sin(6.283185307179586 * d('fi')), z];
    const f = creaFinestra({ C, R, n, psi: 6.283185307179586 * d('psi'), L: 4 }), q = f.P0.map((x, i) => x - C[i]);
    const scala = R + norma(C);
    e1 = Math.max(e1, norma(vettore(q, f.n)) / (EPS * scala));
    e2 = Math.max(e2, Math.abs(punto(q, f.n) - R) / (EPS * scala));
    const ass = [f.e1, f.e2, f.k];
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) e3 = Math.max(e3, Math.abs(punto(ass[i], ass[j]) - (i === j ? 1 : 0)));
  }
  dice('fuori asse', numero(e1), 'ulp;  distanza', numero(e2), 'ulp;  ortonormalità', numero(e3));
  sotto(e1, 8, 'asse'); sotto(e2, 8, 'distanza'); sotto(e3, 1e-15, 'versori');
});

prova('i tratti si tagliano esattamente ai bordi (prospettiva, parallela, lastra)', () => {
  const c = sorgente('prova tagli');
  for (const [nome, o] of [['prospettiva', { R: 3 }], ['parallela', { R: Infinity, D: 1 }], ['lastra', { R: 2, modo: 'lastra', h: 0.2 }]]) {
    const f = creaFinestra({ C: [0.1, 0.2, 0.3], n: [0.2, -0.4, 0.89], psi: 0.3, L: 4, ...o });
    let tenuta = 0, bruta = 0, fuori = 0, bordo = 0;
    const dentro = (p) => Math.max(...f.piani.map((a) => a[0] * p[0] + a[1] * p[1] + a[2] * p[2] - a[3]));
    for (let k = 0; k < 400; k++) {
      const p = [0, 1, 2].map((i) => c(`${nome} ${k} p${i}`) * 8 - 4), q = p.map((x, i) => x + c(`${nome} ${k} q${i}`) * 3 - 1.5);
      const lung = Math.hypot(q[0] - p[0], q[1] - p[1], q[2] - p[2]), t = taglia(f.piani, ...p, ...q);
      if (t) {
        const a = p.map((x, i) => x + t[0] * (q[i] - x)), b = p.map((x, i) => x + t[1] * (q[i] - x));
        tenuta += (t[1] - t[0]) * lung;
        fuori = Math.max(fuori, dentro(a), dentro(b));
        for (const [s, x] of [[t[0], a], [t[1], b]]) if (s > 0 && s < 1) bordo = Math.max(bordo, Math.abs(dentro(x)));
      }
      const M = 10000; for (let i = 0; i < M; i++) { const s = (i + 0.5) / M; if (dentro(p.map((x, j) => x + s * (q[j] - x))) <= 0) bruta += lung / M; }
    }
    const scala = Math.max(...f.piani.map((a) => Math.abs(a[3]) + Math.hypot(a[0], a[1], a[2]))) * 8;
    dice(nome.padEnd(11), 'fuori', numero(fuori / scala), ' sul bordo', numero(bordo / scala), ' lunghezza', numero(tenuta), 'contro', numero(bruta));
    sotto(fuori / scala, 1e-12, `${nome}: fuori`); sotto(bordo / scala, 1e-12, `${nome}: bordo`);
    sotto(Math.abs(tenuta - bruta) / bruta, 2e-4, `${nome}: lunghezza`);
  }
});

// ---------- il pattern sull'immagine e i suoi confronti
function patternDi(reticolo, n, L, tempo = 12, D = 0.6, R = Infinity, atomi = [{ p: [0, 0, 0], s: 1 }]) {
  const p = config({ reticolo, atomi, w: 0.15, r0: [0.21, 0.33, 0.17], v0: [2.1, 1.0, 0.6], tempo, finestra: { C: [0, 0, 0], R, n, psi: 0.4, L, D } });
  const S = creaSessione(p); while (!S.finito) S.avanza(1e5);
  const f = creaFinestra(p.finestra), P = creaProiettore(f, S.cristallo, true, 4e6);
  const s = P.proietta(S.tessera.s, S.tessera.vel, 0, S.tessera.n);
  vero(!P.pieno, 'troppi tratti'); return { S, f, s, cr: S.cristallo, d: sogliaDi(p.finestra) };
}
// la griglia dei tratti dell'immagine, per cercare il più vicino
function griglia(s, g = 0.05) {
  const m = new Map(), chiave = (i, j) => i * 100003 + j;
  for (let q = 0; q < s.length; q += 6) {
    const i0 = Math.floor(Math.min(s[q], s[q + 2]) / g), i1 = Math.floor(Math.max(s[q], s[q + 2]) / g), j0 = Math.floor(Math.min(s[q + 1], s[q + 3]) / g), j1 = Math.floor(Math.max(s[q + 1], s[q + 3]) / g);
    for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) { const k = chiave(i, j); if (!m.has(k)) m.set(k, []); m.get(k).push(q); }
  }
  return (x, y) => {
    let best = Infinity; const i = Math.floor(x / g), j = Math.floor(y / g);
    for (let a = i - 1; a <= i + 1; a++) for (let b = j - 1; b <= j + 1; b++) for (const q of m.get(chiave(a, b)) ?? []) {
      const ax = s[q], ay = s[q + 1], dx = s[q + 2] - ax, dy = s[q + 3] - ay, l2 = dx * dx + dy * dy;
      const t = l2 > 0 ? Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / l2)) : 0;
      best = Math.min(best, Math.hypot(ax + t * dx - x, ay + t * dy - y));
    }
    return best;
  };
}
// lo scarto massimo del pattern traslato di τ (sull'immagine), su TUTTI i punti medi lontani dai bordi dell'immagine
function scartoTraslazione(s, vicino, tau, L, margine = 0.02) {
  let e = 0, n = 0; const h = L / 2 - margine;
  for (let q = 0; q < s.length; q += 6) {
    const x = (s[q] + s[q + 2]) / 2, y = (s[q + 1] + s[q + 3]) / 2, X = x + tau[0], Y = y + tau[1];
    if (Math.abs(x) > h || Math.abs(y) > h || Math.abs(X) > h || Math.abs(Y) > h) continue;
    e = Math.max(e, vicino(X, Y)); n++;
  }
  return n > 50 ? e : NaN;
}
const sulPiano = (f, t) => [punto(t, f.e1), punto(t, f.e2)];

prova('con n lungo (hkl) il pattern si ripete col reticolo del piano, calcolato dagli indici', () => {
  const casi = [
    [{ sistema: 'cubico', centratura: 'P' }, [1, 0, 0]], [{ sistema: 'cubico', centratura: 'P' }, [1, 1, 0]], [{ sistema: 'cubico', centratura: 'P' }, [1, 1, 1]],
    [{ sistema: 'cubico', centratura: 'P' }, [2, 1, 0]], [{ sistema: 'cubico', centratura: 'F' }, [1, 1, 1]], [{ sistema: 'cubico', centratura: 'I' }, [1, 1, 0]],
    [{ sistema: 'esagonale', centratura: 'P', c: 1.63 }, [0, 0, 1]], [{ sistema: 'tetragonale', centratura: 'I', c: 1.4 }, [1, 0, 1]],
    [{ sistema: 'ortorombico', centratura: 'C', b: 1.3, c: 0.8 }, [0, 0, 1]], [{ sistema: 'triclino', centratura: 'P', b: 1.1, c: 0.9, alfa: 80, beta: 105, gamma: 95 }, [0, 1, 1]],
  ];
  for (const [ret, hkl] of casi) {
    const cr0 = creaCristallo({ ...ret, atomi: [] }), r = reticoloDelPiano(hkl, cr0), G = normaleDi(hkl, cr0);
    sotto(Math.max(Math.abs(punto(r.t1, G)), Math.abs(punto(r.t2, G))), 1e-12, 'i vettori del piano sono nel piano');
    const Vp = Math.abs(punto(cr0.primitiva[0], vettore(cr0.primitiva[1], cr0.primitiva[2])));
    sotto(Math.abs(r.area * r.distanza - Vp) / Vp, 1e-12, 'area × distanza = volume');
    const L = Math.max(4, 3.2 * r.periodo), { f, s, d } = patternDi(ret, G, L);
    const vicino = griglia(s);
    const e = [r.t1, r.t2, r.t1.map((x, i) => x + r.t2[i])].map((t) => scartoTraslazione(s, vicino, sulPiano(f, t), L));
    const mezzo = scartoTraslazione(s, vicino, sulPiano(f, r.t1.map((x) => x / 2)), L);
    const D = descriviDirezione(G, cr0);
    dice(`${ret.sistema} ${ret.centratura} (${hkl.join('')})`.padEnd(22), 'periodo', numero(r.periodo), ' scarti', e.map(numero).join(' '), ' a metà', numero(mezzo), ' «' + D.frase + '»');
    for (const x of e) sotto(x, 1e-9, 'traslazione del reticolo del piano');
    sopra(mezzo, d, 'mezza traslazione');
    vero(D.esatta, 'la direzione deve essere riconosciuta esatta');
  }
});

prova('con n irrazionale nessuna traslazione del reticolo riporta il pattern su sé stesso', () => {
  const ret = { sistema: 'cubico', centratura: 'P' }, L = 4;
  // (1, √2, √3): 1, √2 e √3 sono indipendenti sui razionali, quindi nessun vettore intero è perpendicolare a n
  const { f, s, d, cr } = patternDi(ret, [1, Math.SQRT2, Math.sqrt(3)], L, 12, 0.05);
  const vicino = griglia(s);
  let minimo = Infinity, provate = 0;
  for (let i = -4; i <= 4; i++) for (let j = -4; j <= 4; j++) for (let k = -4; k <= 4; k++) {
    const t = [i, j, k], tau = sulPiano(f, t), l = Math.hypot(...tau);
    if (l < 0.05 || l > L / 2) continue;
    const e = scartoTraslazione(s, vicino, tau, L); if (Number.isNaN(e)) continue;
    minimo = Math.min(minimo, e); provate++;
  }
  const D = descriviDirezione(f.n, cr);
  dice('traslazioni provate', provate, ' lo scarto più piccolo', numero(minimo), ' d =', numero(d), ' «' + D.frase + '»');
  sopra(minimo, d, 'scarto minimo'); vero(provate > 50, 'troppo poche');
});

prova('la zona di quasi ripetizione cresce avvicinando n a (210)', () => {
  const ret = { sistema: 'cubico', centratura: 'P' }, cr = creaCristallo({ ...ret, atomi: [] }), G = normaleDi([2, 1, 0], cr), d = 0.01;
  // l'asse attorno a cui n si stacca da (210) è una direzione del piano qualunque, non del reticolo
  const q = vettore(G, [0.3, 0.7, 0.2]), asse = q.map((x) => x / norma(q)), zone = [], scarti = [];
  for (const eps of [1e-3, 3e-4, 1e-4, 3e-5]) {
    const n = G.map((x, i) => Math.cos(eps) * x + Math.sin(eps) * asse[i]), D = descriviDirezione(n, cr, d);
    vero(D.hkl && D.hkl.join('') === '210', `ε = ${eps}: piano ${D.hkl}`);
    sotto(Math.abs(D.zona - d / Math.sin(eps)) / D.zona, 1e-9, 'zona = d/sin ε');
    zone.push(D.zona);
    const r = reticoloDelPiano([2, 1, 0], cr), { f, s } = patternDi(ret, n, 4, 8, 0.05);
    const vic = griglia(s); scarti.push(Math.max(scartoTraslazione(s, vic, sulPiano(f, r.t1), 4), scartoTraslazione(s, vic, sulPiano(f, r.t2), 4)));
  }
  dice('zone', zone.map(numero).join(' < '), ';  scarti della traslazione', scarti.map(numero).join(' > '));
  for (let i = 1; i < zone.length; i++) { sopra(zone[i], zone[i - 1], 'zona'); sotto(scarti[i], scarti[i - 1], 'scarto'); }
});

prova('n del 🎲 è uniforme sulla sfera (Kolmogorov-Smirnov su cos θ, φ e ψ)', () => {
  const N = 20000, z = [], fi = [], psi = [];
  for (let k = 0; k < N; k++) { const f = casuale(k).finestra; z.push((f.n[2] + 1) / 2); fi.push((Math.atan2(f.n[1], f.n[0]) / (2 * Math.PI) + 1) % 1); psi.push(f.psi / (2 * Math.PI)); }
  const ks = (u) => { u.sort((a, b) => a - b); let D = 0; u.forEach((x, i) => { D = Math.max(D, Math.abs(x - i / N), Math.abs(x - (i + 1) / N)); }); return D; };
  const lim = 1.949 / Math.sqrt(N), r = [ks(z), ks(fi), ks(psi)];
  dice('KS cos θ', numero(r[0]), ' φ', numero(r[1]), ' ψ', numero(r[2]), ' limite', numero(lim));
  for (const x of r) sotto(x, lim, 'Kolmogorov-Smirnov');
});

prova('in prospettiva i punti di fuga sono quelli delle direzioni del reticolo; R → ∞ è la proiezione parallela', () => {
  const cr = creaCristallo({ sistema: 'cubico', centratura: 'F', atomi: [] });
  const f = creaFinestra({ C: [0, 0, 0], R: 3, n: [0.3, 0.5, -0.81], psi: 0.2, L: 4 });
  const imm = (x) => { const w = f.aFinestra(x); return f.proietta(...w); };
  let ec = 0, el = 0, viste = 0;
  for (const t0 of [[1, 0, 0], [0, 1, 0], [0, 0, 1], [1, 1, 0], [1, 1, 1], [1, -1, 2], [0.5, 0.5, 0]]) {
    const t = punto(t0, f.k) > 0 ? t0 : t0.map((x) => -x), V = f.fuga(t); if (!V) continue; viste++;
    const x = [0.25, 0.1, 0.4], a = imm(x), b = imm(x.map((q, i) => q + 2 * t[i]));
    const sc = Math.max(1, Math.hypot(...V));
    ec = Math.max(ec, Math.abs((b[0] - a[0]) * (V[1] - a[1]) - (b[1] - a[1]) * (V[0] - a[0])) / (sc * sc));
    // la legge esatta: I(λ) − V = R·(a·t_z − b·c)/(t_z·(c + λ·t_z)) per componente, a = x·e, b = t·e, c = R + x·k
    const tz = punto(t, f.k), c = f.R + punto(x, f.k), gap = [];
    for (const lam of [10, 1e3, 1e6]) {
      const z = imm(x.map((q, i) => q + lam * t[i]));
      const atteso = [f.e1, f.e2].map((e) => (f.R * (punto(x, e) * tz - punto(t, e) * c)) / (tz * (c + lam * tz)));
      el = Math.max(el, Math.hypot(z[0] - V[0] - atteso[0], z[1] - V[1] - atteso[1]) / sc);
      gap.push(Math.hypot(z[0] - V[0], z[1] - V[1]));
    }
    vero(gap[2] <= gap[1] / 500, 'il punto di fuga si raggiunge come 1/λ');
  }
  const g = creaFinestra({ C: [0, 0, 0], R: 1e8, n: [0.3, 0.5, -0.81], psi: 0.2, L: 4 }), h = creaFinestra({ C: [0, 0, 0], R: Infinity, n: [0.3, 0.5, -0.81], psi: 0.2, L: 4 });
  let ep = 0; for (const x of [[0.3, 0.2, 0.1], [-1, 1.5, 0.7], [1.2, -0.4, -1]]) { const a = g.proietta(...g.aFinestra(x)), b = h.proietta(...h.aFinestra(x)); ep = Math.max(ep, Math.hypot(a[0] - b[0], a[1] - b[1])); }
  dice('direzioni', viste, ' allineamento', numero(ec), ' scarto dalla legge 1/λ', numero(el), ' R = 10⁸ contro parallela', numero(ep));
  sotto(ec, 1e-12, 'allineamento'); sotto(el, 1e-9, 'legge 1/λ'); sotto(ep, 1e-6, 'limite parallelo'); vero(viste >= 5, 'direzioni');
});
fine('finestra');
