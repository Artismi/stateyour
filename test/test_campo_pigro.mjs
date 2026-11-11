// test_campo_pigro.mjs — il campo del cosmo pigro anche nello spazio (campo_pigro.js; INTRECCIO.md regole 1, 3, 4, 5, 8, 12):
// rumore con indirizzo livello per livello, nuclei locali con lo spettro di galassie.js, dominio senza bordo.
// DISCIPLINA: le soglie vengono dalla teoria o dall'errore di campionamento (dette prima); i punti e i cosmi vengono
// dalla fonte degli eventi; ciò che non torna con l'universo vero si stampa «≠ NON TORNA» senza fermare la catena.
import assert from 'node:assert/strict';
import * as P from '../src/camera/campo_pigro.js';
import * as R from '../src/camera/ragnatela.js';
import { COSMOLOGIA as U } from '../src/camera/galassie.js';
import { COSMO } from '../src/camera/leggi.js';
import { sorgente, campana } from '../src/camera/eventi.js';

let ok = 0; const T0 = performance.now(), nonTorna = [], costi = [];
const prova = (nome, f) => { f(); ok++; console.log('  ✓', nome); };
const tra = (x, a, b, che) => assert.ok(x > a && x < b, `${che}: ${x} (atteso tra ${a} e ${b})`);
const num = (x, c = 3) => (!Number.isFinite(x) ? String(x) : Math.abs(x) >= 1e4 || (Math.abs(x) < 1e-2 && x !== 0) ? x.toExponential(c - 1).replace('.', ',') : String(+x.toPrecision(c)).replace('.', ','));
const riscontro = (che, x, a, b, vero) => { const torna = x >= a && x <= b; if (!torna) nonTorna.push(`${che}: ${num(x)} (chiesto ${num(a)}–${num(b)})`); console.log(`      ${torna ? '=' : '≠ NON TORNA '} ${che}: ${num(x)} (chiesto ${num(a)}–${num(b)}; vero ${vero})`); return torna; };
const ms = (f) => { const t = performance.now(), r = f(); return [r, performance.now() - t]; };
const costa = (che, t, quante = 1) => costi.push([che, t / quante]);
const MPC = 3.0857e22, c = sorgente('prova/pigro'), GRANDE = 1e6 * MPC; // i punti delle prove stanno in un cubo di 2 milioni di Mpc: 140 volte l'orizzonte
const punto = (nome, lato = GRANDE) => [lato * (2 * c(`${nome}/x`) - 1), lato * (2 * c(`${nome}/y`) - 1), lato * (2 * c(`${nome}/z`) - 1)];
const versore = (nome) => { const z = 2 * c(`${nome}/z`) - 1, f = 2 * Math.PI * c(`${nome}/fi`), r = Math.sqrt(1 - z * z); return [r * Math.cos(f), r * Math.sin(f), z]; };
const media = (v) => v.reduce((a, b) => a + b, 0) / v.length, scarto = (v) => { const m = media(v); return Math.sqrt(v.reduce((a, b) => a + (b - m) ** 2, 0) / (v.length - 1)); };
const J50 = P.livelloPer(50 * MPC); // il livello che porta alle onde di 50 Mpc (la risoluzione di cosmo3d): celle di 16 Mpc
const C0 = P.campoPigro('prova/pigro/cosmo 0');

console.log('A. il rumore con indirizzo');
prova('ogni cella è un evento «…/campo/livello j/cella x,y,z»; il ramo di una cella sposta il campo solo entro il raggio del nucleo', () => {
  const r = 'prova/pigro/cosmo 0', s = sorgente(`${r}/campo/livello 12`).serie('cella 3,-2,7'); assert.equal(C0.cella(12, 3, -2, 7), campana(s(0), s(1)));
  let m = 0, v = 0; const N = 20000; for (let i = 0; i < N; i++) { const w = C0.cella(9, i, -i, 3 * i); m += w / N; v += (w * w) / N; } assert.ok(Math.abs(m) < 4 / Math.sqrt(N) && Math.abs(v - 1) < 4 * Math.sqrt(2 / N), `celle: media ${m}, varianza ${v}`);
  // il ramo: un'altra estrazione per la cella (3,−2,7) del livello J50
  const h = P.latoDi(J50) * MPC, centro = [3.5 * h, -1.5 * h, 7.5 * h], Cr = P.campoPigro(r, { rami: { [`${r}/campo/livello ${J50}/cella 3,-2,7`]: 1 } });
  assert.notEqual(Cr.cella(J50, 3, -2, 7), C0.cella(J50, 3, -2, 7)); assert.equal(Cr.cella(J50, 4, -2, 7), C0.cella(J50, 4, -2, 7));
  const vicino = [centro[0] + 0.3 * h, centro[1], centro[2] - 0.2 * h], lontano = [centro[0] + (C0.raggio + 0.6) * h, centro[1], centro[2]];
  assert.notEqual(Cr.delta(vicino, { livello: J50 }), C0.delta(vicino, { livello: J50 })); assert.equal(Cr.delta(lontano, { livello: J50 }), C0.delta(lontano, { livello: J50 }));
  assert.equal(Cr.delta(vicino, { livello: J50 - 1 }), C0.delta(vicino, { livello: J50 - 1 })); // i livelli più grossi non la vedono
  console.log(`      (${N} celle: media ${num(m)}, varianza ${num(v)}; il ramo di una cella di ${num(P.latoDi(J50))} Mpc cambia δ entro ${num(C0.raggio * P.latoDi(J50))} Mpc e non oltre)`);
});

prova('determinismo per indirizzo: lo stesso valore, bit per bit, da regioni di calcolo diverse, in altro ordine, dopo aver buttato tutto, a ogni distanza', () => {
  for (const [nome, lato] of [['vicino', 1e3 * MPC], ['lontano', GRANDE], ['lontanissimo', 1e9 * MPC]]) { const p = punto(`det ${nome}`, lato), o = { livello: J50 }, A = P.campoPigro('prova/pigro/cosmo 0'), a = A.delta(p, o), tutto = A.in(p, o);
    const B = P.campoPigro('prova/pigro/cosmo 0'), passo = 7 * MPC; B.griglia([p[0] - 3 * passo, p[1] - 2 * passo, p[2] - passo], passo, 5, o); const g = B.griglia([p[0] - passo, p[1] - 4 * passo, p[2] - 2 * passo], passo, 5, o); assert.equal(g[(2 * 5 + 4) * 5 + 1], a); // il punto è il nodo (1, 4, 2) di questa regione
    const D = P.campoPigro('prova/pigro/cosmo 0'); for (let i = 0; i < 5; i++) D.delta(punto(`det altrove ${i}`), o); D.in(p, { livello: J50 + 2 }); assert.equal(D.delta(p, o), a); D.dimentica(); assert.equal(D.delta(p, o), a); assert.deepEqual(D.in(p, o), tutto);
    assert.notEqual(P.campoPigro('prova/pigro/cosmo 1').delta(p, o), a); } // un altro indirizzo è un altro campo
});

prova('regola 4: guardare più fine aggiunge un livello e non cambia quelli di prima; ciò che si aggiunge, visto da lontano, fa zero', () => {
  let peggio = 0, aggiunto = 0, scala = 0; const N = 300, R200 = P.FILTRI.gaussiana(200 * MPC), senzaTaglio = { ...R200, kTop: null };
  for (let i = 0; i < 12; i++) { const p = punto(`livelli ${i}`), a = C0.in(p, { livello: J50, perLivello: true }), b = C0.in(p, { livello: J50 + 2, perLivello: true });
    for (let k = 0; k < a.perLivello.length; k++) assert.equal(b.perLivello[k], a.perLivello[k]); assert.equal(b.perLivello.length, a.perLivello.length + 2); // i livelli di prima: gli stessi bit
    // lisciato a 200 Mpc: i due livelli in più (onde più corte di 64 Mpc) si sommano davvero (soglia 0), e non portano niente
    const grosso = C0.delta(p, { filtro: senzaTaglio, livello: J50, soglia: 0 }), fine = C0.delta(p, { filtro: senzaTaglio, livello: J50 + 2, soglia: 0 }); peggio = Math.max(peggio, Math.abs(fine - grosso)); scala = Math.max(scala, Math.abs(grosso)); }
  assert.ok(peggio < 1e-12 * scala, `lisciato a 200 Mpc i livelli fini cambiano il campo di ${peggio}`); assert.ok(C0.livelliUtili({ filtro: senzaTaglio, livello: J50 + 2, soglia: 0 }).length > C0.livelliUtili({ filtro: senzaTaglio, livello: J50, soglia: 0 }).length, 'i livelli in più sono stati sommati davvero');
  // la varianza che i due livelli aggiungono è quella dello spettro tra 12 e 50 Mpc (N punti indipendenti: quattro scarti = 4·√(2/N))
  for (let i = 0; i < N; i++) { const p = punto(`aggiunta ${i}`); aggiunto += (C0.delta(p, { livello: J50 + 2 }) - C0.delta(p, { livello: J50 })) ** 2 / N; }
  const atteso = C0.varianza({ livello: J50 + 2 }) - C0.varianza({ livello: J50 }); tra(aggiunto / atteso, 1 - 4 * Math.sqrt(2 / N), 1 + 4 * Math.sqrt(2 / N), 'la varianza aggiunta da due livelli su quella dello spettro');
  console.log(`      (livelli ${C0.livelliUtili({ livello: J50 }).join(', ')} per le onde fino a 50 Mpc; due livelli in più (fino a 12 Mpc) aggiungono varianza ${num(aggiunto)} (attesa ${num(atteso)}); lisciato a 200 Mpc il campo cambia di ${num(peggio)} su ${num(scala)})`);
});

console.log('B. lo spettro');
prova('in teoria è esatto: Σ_j B_j² = 1 a ogni k, la varianza a livelli è quella di galassie.js, σ₈ = quello di leggi.js; le code tagliate sono dichiarate', () => {
  let p = 0; for (let i = 0; i < 400; i++) { const k = 1e-5 * 10 ** (7 * (i + 0.5) / 400); p = Math.max(p, Math.abs(P.finoA(40, k) - 1)); } assert.ok(p < 1e-12, `partizione: ${p}`);
  const R8 = (8 / U.h) * MPC, s8 = Math.sqrt(C0.varianza({ filtro: P.FILTRI.sfera(R8) })); assert.ok(Math.abs(s8 / COSMO.sigma8 - 1) < 1e-3, `σ₈ dai livelli: ${s8}`);
  // la varianza lisciata a 30 Mpc: somma dei livelli contro l'integrale diretto dello spettro
  const R30 = 30, v = C0.varianza({ scala: R30 * MPC }); let d = 0; for (let i = 0; i < 4000; i++) { const lk = Math.log(1e-6) + (i + 0.5) * (Math.log(10 / 1e-6) / 4000), k = Math.exp(lk); d += U.potenza(k) * Math.exp(-k * k * R30 * R30) * (Math.log(10 / 1e-6) / 4000); } assert.ok(Math.abs(v / d - 1) < 1e-4, `varianza a 30 Mpc: ${v} contro ${d}`);
  const code = C0.code({ livello: J50 }), peggiore = Math.max(...code.map((q) => q.coda)); assert.ok(peggiore < 5e-3 && peggiore > 0, `la coda tagliata: ${peggiore}`);
  console.log(`      (σ₈ dalla somma dei livelli: ${num(s8, 6)}; parte di varianza del nucleo fuori da ${C0.raggio} celle, per livello: ${code.map((q) => `${q.latoMpc} Mpc: ${num(q.coda, 2)}`).join('; ')})`);
});

prova('misurato: σ₈ e la varianza a 50 Mpc su punti sparsi in un dominio 140 volte l\'orizzonte', () => {
  const N = 500, R8 = (8 / U.h) * MPC, F8 = P.FILTRI.sfera(R8); let s8 = 0, s50 = 0;
  const [, t8] = ms(() => { for (let i = 0; i < N; i++) s8 += C0.delta(punto(`s8 ${i}`), { filtro: F8 }) ** 2 / N; }); costa(`δ nella sfera di 8 Mpc/h, punto mai visto (${C0.livelliUtili({ filtro: F8 }).length} livelli)`, t8, N);
  const [, t50] = ms(() => { for (let i = 0; i < N; i++) s50 += C0.delta(punto(`s50 ${i}`), { livello: J50 }) ** 2 / N; }); costa(`δ alle onde di 50 Mpc, punto mai visto (${C0.livelliUtili({ livello: J50 }).length} livelli)`, t50, N);
  // lo scarto di una varianza su N punti indipendenti è √(2/N): quattro scarti
  tra(s8 / COSMO.sigma8 ** 2, 1 - 4 * Math.sqrt(2 / N), 1 + 4 * Math.sqrt(2 / N), 'σ₈² misurata su quella di leggi.js'); tra(s50 / C0.varianza({ livello: J50 }), 1 - 4 * Math.sqrt(2 / N), 1 + 4 * Math.sqrt(2 / N), 'varianza a 50 Mpc');
  console.log(`      (σ₈ misurata su ${N} punti: ${num(Math.sqrt(s8), 4)} (leggi.js: ${COSMO.sigma8}); scarto del campo alle onde di 50 Mpc: ${num(Math.sqrt(s50), 4)} (atteso ${num(Math.sqrt(C0.varianza({ livello: J50 })), 4)}; il toro di cosmo3d: 0,669))`);
  riscontro('σ₈ misurata', Math.sqrt(s8), 0.76, 0.86, '0,811 ± 0,006 (Planck 2018) [V]');
});

prova('lo spettro misurato ridà quello di galassie.js su tre decadi (banco di filtri passa-banda, 1000 punti per banda)', () => {
  const righe = [], rapporti = []; let tTot = 0;
  for (const kc of [1e-3, 3.2e-3, 1e-2, 3.2e-2, 0.1, 0.32, 1]) { const F = P.FILTRI.banda(kc), passo = (6.3 / kc) * MPC, o = punto(`banda ${kc}`), n = 10; let s = 0;
    const [, t] = ms(() => { for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) for (let l = 0; l < n; l++) s += C0.delta([o[0] + i * passo, o[1] + j * passo, o[2] + l * passo], { filtro: F }) ** 2; }); tTot += t; s /= n ** 3;
    // la teoria: l'integrale diretto dello spettro di galassie.js col filtro (non passa dai livelli)
    let teoria = 0; const nk = 2000, l0 = Math.log(kc / 12), dl = Math.log(144) / nk; for (let i = 0; i < nk; i++) { const k = Math.exp(l0 + (i + 0.5) * dl); teoria += U.potenza(k) * F.F(k) ** 2 * dl; }
    // punti a una lunghezza d'onda l'uno dall'altro: li si conta per metà (prudenza), quattro scarti = 4·√(4/N) = 0,25
    tra(s / teoria, 0.75, 1.25, `potenza a k = ${kc}/Mpc, misurata su attesa`); rapporti.push(s / teoria); righe.push(`k = ${kc}: ${num(s / teoria)}`); }
  tra(media(rapporti), 1 - 4 * 0.063 / Math.sqrt(7), 1 + 4 * 0.063 / Math.sqrt(7), 'la media dei sette rapporti'); costa('δ con un filtro passa-banda (punti su un reticolo, 8–9 livelli sopra la soglia di 10⁻¹⁰)', tTot, 7000);
  console.log(`      (potenza misurata / spettro di galassie.js: ${righe.join('; ')}; media ${num(media(rapporti), 4)})`);
});

console.log('C. marea, spostamento, potenziale');
prova('la traccia della marea è δ; marea e spostamento sono derivate dello stesso potenziale (a meno dell\'errore dichiarato); classi 8/42/42/8', () => {
  const N = 600, o = { livello: J50 }, hd = 0.5 * MPC, conta = [0, 0, 0, 0], l = [0, 0, 0]; let traccia = 0, v2 = 0, e2 = 0, d2 = 0, t2 = 0, x2 = 0; const NC = 24;
  const [, t] = ms(() => { for (let i = 0; i < N; i++) { const w = C0.in(punto(`marea ${i}`), o); traccia = Math.max(traccia, Math.abs(w.marea[0] + w.marea[1] + w.marea[2] - w.delta)); v2 += (w.velocita[0] ** 2 + w.velocita[1] ** 2 + w.velocita[2] ** 2) / N; R.dentro.autovalori(...w.marea, l); conta[(l[0] > 0) + (l[1] > 0) + (l[2] > 0)]++; } }); costa(`δ, marea, spostamento e potenziale, punto mai visto (${J50 - C0.daLivello + 1} livelli)`, t, N);
  assert.ok(traccia < 1e-12);
  // la densità da in() (tabelle della marea) e da delta() (tabella sua) sono la stessa cosa a meno dell'interpolazione
  let dd = 0; for (let i = 0; i < 20; i++) { const p = punto(`marea ${i}`); dd = Math.max(dd, Math.abs(C0.in(p, { ...o, da: C0.livelliUtili(o)[0] }).delta - C0.delta(p, o))); } assert.ok(dd < 1e-3, `in() e delta() differiscono di ${dd}`);
  // alle differenze finite (passo 0,5 Mpc): −∇·Ψ contro δ, e ∂Ψ_x/∂y contro −T_xy
  for (let i = 0; i < NC; i++) { const p = punto(`marea ${i}`), w = C0.in(p, o), der = (f, a) => { const q = [...p]; q[a] += hd; const su = f(C0.in(q, o)); q[a] -= 2 * hd; return (su - f(C0.in(q, o))) / (2 * hd); };
    const div = der((x) => x.spostamento[0], 0) + der((x) => x.spostamento[1], 1) + der((x) => x.spostamento[2], 2), xy = -der((x) => x.spostamento[0], 1); e2 += (div + w.delta) ** 2 / NC; d2 += w.delta ** 2 / NC; t2 += (xy - w.marea[3]) ** 2 / NC; x2 += w.marea[3] ** 2 / NC; }
  const sigma = Math.sqrt(C0.varianza(o)), errDiv = Math.sqrt(e2) / sigma, errXY = Math.sqrt(t2 / x2);
  // l'errore dichiarato: le code dei nuclei di spostamento e marea sono tagliate ciascuna per conto suo (~√ε, con ε ~ 10⁻²)
  assert.ok(errDiv < 0.2 && errXY < 0.2, `−∇·Ψ e δ differiscono di ${errDiv} scarti; ∂Ψ/∂y e T_xy del ${errXY}`);
  const teoria = [0.08, 0.42, 0.42, 0.08]; for (let k = 0; k < 4; k++) assert.ok(Math.abs(conta[k] / N - teoria[k]) < 4 * Math.sqrt((teoria[k] * (1 - teoria[k])) / N) + 0.005, `classe ${k}: ${conta[k] / N}`);
  // la velocità: teoria (H₀f)²∫dlnk Δ²/k² sulle stesse onde
  let sv = 0; { const nk = 3000, l0 = Math.log(1e-6), dl = Math.log(1e6) / nk; for (let i = 0; i < nk; i++) { const k = Math.exp(l0 + (i + 0.5) * dl); sv += (U.potenza(k) / (k * k)) * P.finoA(J50, k) * (k < P.kDi(C0.daLivello) / 2 ? 0 : 1) * dl; } }
  const vTeoria = COSMO.H0 * R.dentro.f0Crescita * Math.sqrt(sv); tra(v2 / vTeoria ** 2, 1 - 0.05 - 4 * Math.sqrt(2 / (3 * N)) * 2, 1 + 0.05 + 4 * Math.sqrt(2 / (3 * N)) * 2, 'velocità² misurata su attesa'); // (le onde lunghe legano i punti: si conta metà; 5% per le code)
  console.log(`      (classi su ${N} punti: ${conta.map((q) => (100 * q / N).toFixed(1)).join(' / ')} %; −∇·Ψ − δ: ${num(errDiv)} scarti; ∂Ψ_x/∂y contro −T_xy: ${num(errXY)}; velocità: ${num(Math.sqrt(v2))} km/s (attesa ${num(vTeoria)}))`);
  riscontro('velocità tipica della materia, in tre dimensioni (km/s)', Math.sqrt(v2), 370, 620, '370 il Sole, 620 il Gruppo Locale rispetto al fondo [R]');
});

console.log('D. il cielo del fondo senza toro');
// i nodi e i pesi di Gauss–Legendre (Newton sui polinomi di Legendre): la quadratura è esatta fino al grado 2n − 1
const gaussLegendre = (n) => { const x = [], w = []; for (let i = 0; i < n; i++) { let z = Math.cos((Math.PI * (i + 0.75)) / (n + 0.5)), dp = 1; for (let it = 0; it < 50; it++) { let p0 = 1, p1 = z; for (let k = 2; k <= n; k++) { const p2 = ((2 * k - 1) * z * p1 - (k - 1) * p0) / k; p0 = p1; p1 = p2; } dp = (n * (z * p1 - p0)) / (z * z - 1); const dz = p1 / dp; z -= dz; if (Math.abs(dz) < 1e-15) break; } x.push(z); w.push(2 / ((1 - z * z) * dp * dp)); } return { x, w }; };
prova('il cielo da un dominio senza bordo: la potenza a ℓ basso è quella dell\'universo senza bordo (il toro ne ha il 3‰–18%), e non ci sono cerchi uguali', () => {
  const LMAX = 8, NT = 36, NF = 72, GL = gaussLegendre(NT), ell = [2, 3, 4, 5, 6, 7, 8], attesa = R.spettroAtteso(ell).continuo, rapporti = [], cerchi = [], Ptab = new Float64Array(((LMAX + 1) * (LMAX + 2)) / 2);
  const cor = (a, b) => { const ma = media(a), mb = media(b); return a.reduce((s, v, i) => s + (v - ma) * (b[i] - mb), 0) / Math.sqrt(a.reduce((s, v) => s + (v - ma) ** 2, 0) * b.reduce((s, v) => s + (v - mb) ** 2, 0)); };
  let quale = null;
  for (let s = 0; s < 3; s++) { const Cs = P.campoPigro(`prova/pigro/cielo ${s}`), [S, t0] = ms(() => P.cieloPigro(Cs, { posizione: punto(`oss ${s}`) }, { ellMax: LMAX })); if (!s) { costa('cieloPigro: i nuclei del cielo per 11 livelli (una volta)', t0); quale = S; assert.ok(S.ellPiena > LMAX + 6 && S.ellBanda < 2 * NT - 1 - LMAX, 'la quadratura basta alla banda della mappa'); }
    const re = new Float64Array(Ptab.length), im = new Float64Array(Ptab.length);
    const [, t] = ms(() => { for (let i = 0; i < NT; i++) { const ct = GL.x[i], st = Math.sqrt(1 - ct * ct); R.dentro.legendre(LMAX, ct, st, Ptab); for (let j = 0; j < NF; j++) { const fi = (2 * Math.PI * j) / NF, T = S.in([st * Math.cos(fi), st * Math.sin(fi), ct]), w = (GL.w[i] * 2 * Math.PI) / NF; for (let l = 0; l <= LMAX; l++) for (let m = 0; m <= l; m++) { const q = (l * (l + 1)) / 2 + m; re[q] += w * T * Ptab[q] * Math.cos(m * fi); im[q] -= w * T * Ptab[q] * Math.sin(m * fi); } } } }); if (!s) costa('una direzione del cielo pigro (11 livelli, isotropo e Doppler)', t, NT * NF);
    ell.forEach((l, k) => { let cl = 0; for (let m = 0; m <= l; m++) { const q = (l * (l + 1)) / 2 + m; cl += (m ? 2 : 1) * (re[q] ** 2 + im[q] ** 2); } rapporti.push(cl / (2 * l + 1) / attesa[k]); });
    // i cerchi che nel toro di 1,2 Gpc sono uguali (copia a L·m dall'osservatore): qui i due cerchi mostrano punti diversi
    for (const m of [[5, 3, 0], [12, 9, 8]]) { const d = Math.hypot(...m), ca = (d * 3.7e25) / (2 * S.raggioM), u = m.map((v) => v / d), sa = Math.sqrt(1 - ca * ca), e1 = [-u[1], u[0], 0].map((v) => v / Math.hypot(u[0], u[1])), e2 = [u[1] * e1[2] - u[2] * e1[1], u[2] * e1[0] - u[0] * e1[2], u[0] * e1[1] - u[1] * e1[0]], a = [], b = [];
      // (tolte le armoniche fino a ℓ = 8 appena misurate: due cerchi specchiati vedono le stesse onde grandi anche in un cielo senza bordo)
      const fine = (n) => { const ct = n[2], st = Math.sqrt(1 - ct * ct), fi = Math.atan2(n[1], n[0]); R.dentro.legendre(LMAX, ct, st, Ptab); let g = 0; for (let l = 0; l <= LMAX; l++) for (let mm = 0; mm <= l; mm++) { const q = (l * (l + 1)) / 2 + mm; g += (mm ? 2 : 1) * Ptab[q] * (re[q] * Math.cos(mm * fi) - im[q] * Math.sin(mm * fi)); } return S.in(n) - g; };
      for (let i = 0; i < 96; i++) { const f = (2 * Math.PI * i) / 96, cs = Math.cos(f) * sa, sn = Math.sin(f) * sa; a.push(fine([0, 1, 2].map((q) => ca * u[q] + cs * e1[q] + sn * e2[q]))); b.push(fine([0, 1, 2].map((q) => -ca * u[q] + cs * e1[q] + sn * e2[q]))); } cerchi.push(cor(a, b)); } }
  // la varianza cosmica della media dei rapporti: (1/n)·√(Σ_ℓ 2/(2ℓ+1)) per cielo, tre cieli: 0,10; quattro scarti
  const es = Math.sqrt(ell.reduce((a, l) => a + 2 / (2 * l + 1), 0)) / ell.length / Math.sqrt(3); tra(media(rapporti), 1 - 4 * es, 1 + 4 * es, 'C_ℓ misurato su atteso, ℓ = 2…8, tre cieli');
  // il toro di cosmo3d alle stesse ℓ (la media sui cosmi, da ragnatela.js): il campo senza bordo ne ha molte volte di più
  const Tt = R.spettroAtteso(ell, 'prova/pigro/toro'), toro = ell.map((l, k) => Tt.toro[k] / Tt.continuo[k]); assert.ok(media(rapporti) > 5 * Math.max(...toro), `la potenza a ℓ basso (${media(rapporti)}) contro quella del toro (${Math.max(...toro)})`);
  // nel toro la correlazione lungo queste coppie è 1 (test_ragnatela) a ogni scala; qui i punti distano Gpc: compatibile con zero.
  // Lungo un cerchio, una mappa con ℓ tra 9 e ~43 ha una trentina di campioni indipendenti: quattro scarti ≈ 0,7 per coppia, 0,3 per la media di sei
  assert.ok(cerchi.every((v) => Math.abs(v) < 0.7) && Math.abs(media(cerchi)) < 0.3, `correlazioni lungo le coppie di cerchi del toro: ${cerchi}`);
  console.log(`      (livelli ${quale.livelli.join('–')}: potenza piena fino a ℓ ≈ ${num(quale.ellPiena)}, niente oltre ${num(quale.ellBanda)}; C_ℓ misurato/atteso (universo senza bordo), ℓ = 2…8, tre cieli: ${num(media(rapporti))} ± ${num(es)} (il toro: ${toro.map((v) => num(v, 2)).join(', ')}); correlazione, tolte le ℓ ≤ 8, lungo le coppie di cerchi del toro: ${cerchi.map((v) => v.toFixed(2)).join(', ')} (nel toro: 1))`);
  riscontro('coppie di cerchi uguali nel cielo', 0, 0, 0, '0 (nessuna trovata: Cornish et al. 2004) [R]');
});

console.log('E. i vincoli (Hoffman–Ribak) su un campo locale');
prova('il campo passa per N vincoli senza toccare il resto: lontano è quello libero bit per bit, il peso è tipico, il costo non dipende dal dominio', () => {
  const Rv = 15 * MPC, o = { scala: Rv }, righe = [];
  for (const [nome, lato] of [['qui', 1e3 * MPC], ['lontano', GRANDE]]) { const centro = punto(`vincoli ${nome}`, lato), altro = P.campoPigro(`prova/pigro/altro mondo ${nome}`), N = 24;
    const V = Array.from({ length: N }, (_, i) => { const p = punto(`vincolo ${nome}/${i}`, 300 * MPC).map((v, d) => v + centro[d]); return { posizione: p, scala: Rv, valore: altro.delta(p, o) }; });
    const [K, t] = ms(() => P.condiziona(C0, V)); costa(`condiziona: ${N} vincoli a 15 Mpc (${nome}: a ${num(Math.hypot(...centro) / MPC)} Mpc dall'origine)`, t);
    assert.ok(K.esiste && K.gradi === N && K.ridondanti.length === 0); let e = 0; for (const v of V) { e = Math.max(e, Math.abs(K.delta(v.posizione, o) - v.valore)); const a = K.attesa(v.posizione, o); assert.ok(a.varianza < 1e-9 * a.libera && Math.abs(a.media - v.valore) < 1e-9); } assert.ok(e < 1e-9, `non passa per i vincoli: ${e}`);
    tra(K.probabilita, 1e-4, 1 - 1e-4, 'probabilità del χ² di vincoli presi da un altro mondo'); // valori tipici: χ² ≈ N
    // marea e spostamento del campo vincolato: la traccia è ancora δ, e nel punto di un vincolo δ è il valore chiesto (a meno dell'interpolazione)
    const w = K.in(V[0].posizione, o); assert.ok(Math.abs(w.marea[0] + w.marea[1] + w.marea[2] - w.delta) < 1e-12 && Math.abs(w.delta - V[0].valore) < 1e-3);
    // lontano da tutti i vincoli il campo è quello libero, bit per bit; a metà strada cambia
    const fuori = [centro[0] + 301 * MPC + K.raggioM, centro[1], centro[2]]; assert.equal(K.delta(fuori, o), C0.delta(fuori, o)); const mezzo = V[0].posizione.map((v, d) => v + (d === 0 ? 20 * MPC : 0)); assert.notEqual(K.correzione(mezzo, o), 0);
    righe.push(`${nome}: χ² = ${num(K.chi2)} su ${N} (P = ${num(K.probabilita)}), errore ${num(e)}, ${num(t)} ms`); }
  for (const r of righe) console.log(`      ${r}`);
  // due valori diversi nello stesso punto: quel campo non esiste
  const p = punto('doppio'); assert.equal(P.condiziona(C0, [{ posizione: p, scala: Rv, valore: 0.1 }, { posizione: p, scala: Rv, valore: 0.2 }]).esiste, false);
});

prova('la teoria del campo vincolato: su 80 cosmi, media e varianza accanto ai vincoli sono quelle di Hoffman–Ribak', () => {
  const Rv = 20 * MPC, o = { scala: Rv }, V = [[0, 0, 0, 0.5], [60, 0, 0, -0.3], [0, 45, 30, 0.2], [-50, -40, 10, 0.4]].map(([x, y, z, valore]) => ({ posizione: [x * MPC, y * MPC, z * MPC], scala: Rv, valore })), sonda = [25 * MPC, 10 * MPC, 5 * MPC], NC = 80, valori = []; let at = null;
  for (let i = 0; i < NC; i++) { const K = P.condiziona(P.campoPigro(`prova/pigro/insieme ${i}`), V); valori.push(K.delta(sonda, o)); at = K.attesa(sonda, o); }
  const m = media(valori), s = scarto(valori); assert.ok(at.varianza < at.libera && at.varianza > 0);
  assert.ok(Math.abs(m - at.media) < 4 * Math.sqrt(at.varianza / NC), `media ${m} contro ${at.media}`); tra(s * s / at.varianza, 1 - 4 * Math.sqrt(2 / NC), 1 + 4 * Math.sqrt(2 / NC), 'varianza misurata su quella della teoria');
  console.log(`      (a 27 Mpc da un vincolo: media ${num(m)} (teoria ${num(at.media)}), scarto ${num(s)} (teoria ${num(Math.sqrt(at.varianza))}; libero ${num(Math.sqrt(at.libera))}))`);
});

console.log('\nI COSTI (ms, misurati qui)');
{ // per livello, a caldo: lo stesso punto chiesto due volte
  const p = punto('costo'), o = { livello: J50 }; C0.in(p, o); const n = 200, [, tc] = ms(() => { for (let i = 0; i < n; i++) C0.in([p[0] + i * 1e21, p[1], p[2]], o); }), [, td] = ms(() => { for (let i = 0; i < n; i++) C0.delta([p[0] + i * 1e21, p[1], p[2]], o); });
  costa(`δ, marea, spostamento, potenziale: punto già visto, per livello`, tc, n * (J50 - C0.daLivello + 1)); costa('δ sola: punto già visto, per livello', td, n * C0.livelliUtili(o).length); }
for (const [che, t] of costi) console.log(`  ${t < 10 ? t.toFixed(3) : t.toFixed(0)}`.padStart(10), ' ', che);
{ const s = C0.stato(); console.log(`  in memoria per il cosmo 0 dopo tutte le prove: ${s.blocchi} blocchi di 8³ celle su ${s.livelli} livelli = ${num(s.byte / 1e6)} MB (tetto: ${P.PIGRO.memoria} blocchi a livello); ${num(s.celle)} celle estratte; ${s.nuclei} tabelle di nuclei`); }
if (nonTorna.length) { console.log(`\nCHE COSA NON TORNA (${nonTorna.length}):`); for (const r of nonTorna) console.log(`  ≠ ${r}`); }
console.log(`\n${ok} prove superate in ${((performance.now() - T0) / 1000).toFixed(1)} s`);
