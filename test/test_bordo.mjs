// test_bordo.mjs — le bolle sul bordo (bordo.js; PROGETTO.md lavoro 6; LINGUA.md O11, C9, C10, C15; INTRECCIO.md r. 11–13).
//   A. l'impronta di bordo (O11): ℓmax dal modello, esatta (due vie), pura, nel tempo;
//   B. l'incollamento (C15) e la ricostruzione dal bordo (C10): su mondi indipendenti, con le varianze del modello;
//   C. l'antenato comune tra luoghi e istanti diversi (C10, r. 12), in tempo conforme;
//   D. il cono di luce di un ramo del campo (C9), con l'ipotesi dell'inflazione dichiarata.
// DISCIPLINA: la prova è STRUTTURALE (non dipende dai numeri di un universo: gli indirizzi sono nomi di prova, e le
// proprietà valgono per qualunque fonte del caso); le soglie statistiche sono 4 scarti della statistica attesa (detti
// prima), quelle numeriche la precisione dichiarata; ciò che non torna si stampa «≠ NON TORNA».
import assert from 'node:assert/strict';
import * as B from '../src/camera/bordo.js';
import { campoLibero } from '../src/camera/bolle.js';
import { campoPigro } from '../src/camera/campo_pigro.js';
import { MPC as LEGGI_MPC } from '../src/camera/leggi.js'; // il Mpc e il kpc: un posto solo

let ok = 0; const T0 = performance.now(), nonTorna = [], tempi = [];
const prova = (nome, f) => { const t = performance.now(); f(); ok++; tempi.push([nome.slice(0, 40), performance.now() - t]); console.log('  ✓', nome); };
const num = (x, c = 3) => (!Number.isFinite(x) ? String(x) : Math.abs(x) >= 1e4 || (Math.abs(x) < 1e-2 && x !== 0) ? x.toExponential(c - 1).replace('.', ',') : String(+x.toPrecision(c)).replace('.', ','));
const MPC = LEGGI_MPC, J = 16, RADICE = 'prova/bordo/mondo';
const F = campoLibero(RADICE).campo, h = B.latoCella(F, J);
const piu = (a, b, k = 1) => [a[0] + k * b[0], a[1] + k * b[1], a[2] + k * b[2]];
// due bolle che si sovrappongono (la domanda, non il mondo: posti e raggi qualunque, in Mpc)
const c1 = [137 * MPC, -61 * MPC, 23 * MPC], R1 = 40 * MPC, c2 = piu(c1, [60 * MPC, 0, 0]), R2 = 50 * MPC;
const B1 = { centro: c1, raggio: R1, livello: J }, B2 = { centro: c2, raggio: R2, livello: J };
// il cerchio ∂S₁ ∩ ∂S₂: piano a distanza a dal centro 1, raggio ρ
const dd = 60 * MPC, aC = (dd * dd + R1 * R1 - R2 * R2) / (2 * dd), rho = Math.sqrt(R1 * R1 - aC * aC), cc = piu(c1, [aC, 0, 0]);
const sulCerchio = (al) => piu(cc, [0, rho * Math.cos(al), rho * Math.sin(al)]);
const dir = (p, c, R) => [(p[0] - c[0]) / R, (p[1] - c[1]) / R, (p[2] - c[2]) / R];
const NMONDI = 160, mondi = Array.from({ length: NMONDI }, (_, k) => campoPigro(`${RADICE}/altro ${k}`, { lato0: F.lato0 }));
const quattroScarti = (n, varianzaUno = 2) => 4 * Math.sqrt(varianzaUno / n);

console.log('A. l\'impronta di bordo (O11)');
let I1, Fo1, Fo2;
prova('ℓmax viene da R e dalla grana (⌈π·R/h_J⌉, il bordo esatto della banda); ciò che resta oltre è la coda della teoria, e la teoria è quella del campo', () => {
  I1 = B.improntaDiBordo(F, B1); Fo1 = B.formaImpronta(F, { ...B1, grandezza: 'densita' }); Fo2 = B.formaImpronta(F, { ...B2, grandezza: 'densita' });
  assert.equal(I1.lmax, Math.ceil((Math.PI * R1) / h)); assert.equal(Fo2.lmax, Math.ceil((Math.PI * R2) / h)); assert.equal(I1.densita.alm.length, (I1.lmax + 1) ** 2);
  // lo spettro della teoria (C_ℓ = 4π∫dlnk Δ²·ΣB_j²·j_ℓ(kR)²) contro ⟨a_ℓm²⟩ ESATTO per il campo com'è (Σ_celle g²: nuclei troncati, reticolo)
  const S = B.spettroAtteso(F, { raggio: R1, livello: J, lmax: I1.lmax }); let peggio = 0;
  for (let l = 0; l <= I1.lmax; l++) { let s = 0; for (let m = -l; m <= l; m++) s += I1.densita.attesa[B.indice(l, m)]; s /= 2 * l + 1; peggio = Math.max(peggio, Math.abs(s / S.C[l] - 1)); }
  // la tolleranza: la coda dei nuclei troncati di campo_pigro.js (≤ 3·10⁻³ della varianza per livello) spostata su un C_ℓ che
  // pesa poche onde: la si misura e si stampa; si ferma solo se teoria e campo sono di un altro ordine (un errore di formula)
  console.log(`      grana J = ${J}: celle di ${num(h / MPC)} Mpc, k_max = π/h = ${num(I1.kMax)} /Mpc; R₁ = 40 Mpc → ℓmax ${I1.lmax}, R₂ = 50 Mpc → ℓmax ${Fo2.lmax}`);
  console.log(`      coda oltre ℓmax (teoria): densità ${num(I1.densita.coda)}, potenziale ${num(I1.potenziale.coda)}; C_ℓ della teoria contro il campo: scarto massimo ${num(100 * peggio)}% fino a ℓmax`);
  assert.ok(peggio < 0.5, `C_ℓ: teoria e campo distano ${peggio}`); assert.ok(I1.densita.coda > 0 && I1.densita.coda < 1e-2);
});
prova('l\'impronta è l\'integrale VERO del campo sulla sfera: la quadratura del campo punto per punto (seconda via) converge a lei', () => {
  const quad = (nt, g = 'densita') => B.improntaPerQuadratura(F, { ...B1, lmax: I1.lmax, nodi: nt, grandezza: g });
  const dist = (Q, v, Fo) => { let m = 0; for (let q = 0; q < Q.length; q++) { let s2 = 0; for (let c = 0; c < Fo.n; c++) s2 += Fo.g[c * Fo.righe + q] ** 2; m = Math.max(m, Math.abs(Q[q] - v[q]) / Math.sqrt(s2)); } return m; };
  const FoP = B.formaImpronta(F, { ...B1, grandezza: 'potenziale' }), esatta = B.valoriForma(F, Fo1), Q = [12, 24, 48].map((nt) => quad(nt)), e = Q.map((q) => dist(q, esatta, Fo1)), ep = dist(quad(24, 'potenziale'), B.valoriForma(F, FoP), FoP);
  console.log(`      massimo |a_quadratura − a_esatta|/scarto(a_ℓm), densità: ${e.map((x, i) => `${[12, 24, 48][i]}×${2 * [12, 24, 48][i]} nodi ${num(x)}`).join(', ')} (ordine ${num(Math.log2(e[1] / e[2]))}); potenziale (24×48) ${num(ep)}`);
  // il campo sulla sfera ha i gomiti delle tabelle lineari (ordine 2 atteso): la quadratura deve avvicinarsi, e avvicinarsi
  // all'impronta esatta più di quanto due quadrature successive distano tra loro (se convergesse ad altro, sarebbe il contrario)
  assert.ok(e[1] < e[0] && e[2] < e[1], `la quadratura non converge: ${e}`); assert.ok(e[2] < dist(Q[2], Q[1], Fo1), `la quadratura converge a un'altra cosa: ${e}`);
});
prova('funzione pura dell\'indirizzo: un altro esemplare del campo, in un altro ordine, dà gli stessi coefficienti al bit; un ramo lontano non li tocca', () => {
  const G = campoLibero(RADICE).campo; B.improntaDiBordo(G, B2); G.dimentica(); const J1 = B.improntaDiBordo(G, B1);
  assert.deepEqual([...J1.densita.alm], [...I1.densita.alm]); assert.deepEqual([...J1.potenziale.alm], [...I1.potenziale.alm]);
  const lontano = campoLibero(RADICE, { rami: { [`${RADICE}/campo/livello ${J}/cella 900,900,900`]: 1 } }).campo, K = B.improntaDiBordo(lontano, B1);
  assert.deepEqual([...K.densita.alm], [...I1.densita.alm]);
});
prova('nel tempo: la densità cresce con D(a), il potenziale con D/a (Poisson comovente); a un istante dato l\'impronta è la stessa per costruzione', () => {
  const t = 5e9, I5 = B.improntaDiBordo(F, { ...B1, istante: t }), T = B.tempoDi(t);
  for (let q = 0; q < I5.densita.alm.length; q++) assert.ok(Math.abs(I5.densita.alm[q] - T.D * I1.densita.alm[q]) <= 1e-12 * Math.abs(I1.densita.alm[q]) + 1e-300);
  const r = I5.potenziale.alm[0] / I1.potenziale.alm[0]; assert.ok(Math.abs(r - T.D / T.a) < 1e-12 * r);
  console.log(`      a 5 Ga: a = ${num(T.a)}, D = ${num(T.D)}; a₀₀ della densità ${num(I1.densita.alm[0])} → ${num(I5.densita.alm[0])}, del potenziale ${num(I1.potenziale.alm[0])} → ${num(I5.potenziale.alm[0])} m²/s²`);
});

console.log('B. l\'incollamento sul bordo comune (C15) e la ricostruzione dal bordo (C10)');
// i valori di tutte le forme su NMONDI mondi indipendenti (indirizzi di prova): ciò che serve alle prove statistiche
const angoli = Array.from({ length: 6 }, (_, i) => (2 * Math.PI * (i + 0.5)) / 6), Pc = angoli.map(sulCerchio);
const dentro = [c1, piu(c1, [aC + 0.3 * (R1 - aC), 0, 0]), piu(c1, [0, 0.5 * R1, 0])]; // il centro di B₁, un punto della lente, mezzo raggio
const FoC = B.formaPunti(F, Pc, { livello: J }), FoD = B.formaPunti(F, dentro, { livello: J });
let V = null;
prova(`su ${NMONDI} mondi: χ² dell'impronta ~ i suoi gradi (le celle del modello danno la statistica giusta del bordo)`, () => {
  const t = performance.now(); V = mondi.map((M) => ({ a1: B.valoriForma(M, Fo1), a2: B.valoriForma(M, Fo2), cer: B.valoriForma(M, FoC), den: B.valoriForma(M, FoD) })); tempi.push([`valori su ${NMONDI} mondi`, performance.now() - t]);
  for (const [Fo, k] of [[Fo1, 'a1'], [Fo2, 'a2']]) { const S = B.sistema([Fo]), x = V.map((v) => S.chi2(v[k]) / S.gradi), m = x.reduce((a, b) => a + b, 0) / NMONDI, tol = quattroScarti(NMONDI, 2 / S.gradi);
    console.log(`      ${k === 'a1' ? 'B₁' : 'B₂'}: ${S.gradi} gradi, ⟨χ²⟩/gradi = ${num(m, 4)} (atteso 1 ± ${num(tol)})`); assert.ok(Math.abs(m - 1) < tol, `χ² di ${k}: ${m}`); }
});
prova('sul cerchio ∂S₁∩∂S₂ le due impronte risommate danno lo stesso campo, e il campo vero, entro il resto che il modello prevede (z² medio ~ 1)', () => {
  const C11 = B.covarianza(Fo1, Fo1), C22 = B.covarianza(Fo2, Fo2), C12 = B.covarianza(Fo1, Fo2), P1 = B.covarianza(FoC, Fo1), P2 = B.covarianza(FoC, Fo2), PP = B.covarianza(FoC, FoC), n1 = Fo1.righe, n2 = Fo2.righe;
  const Y1 = Pc.map((p) => B.armonicheReali(Fo1.lmax, dir(p, c1, R1))), Y2 = Pc.map((p) => B.armonicheReali(Fo2.lmax, dir(p, c2, R2)));
  const quad = (Ya, M, Yb, nb) => { let s = 0; for (let a = 0; a < Ya.length; a++) for (let b = 0; b < Yb.length; b++) s += Ya[a] * M[a * nb + b] * Yb[b]; return s; }, lin = (Ya, M, r, na) => { let s = 0; for (let a = 0; a < na; a++) s += Ya[a] * M[r * na + a]; return s; };
  // le varianze del modello (esatte: le celle sono N(0, 1) indipendenti)
  const s12 = Pc.map((_, i) => quad(Y1[i], C11, Y1[i], n1) + quad(Y2[i], C22, Y2[i], n2) - 2 * quad(Y1[i], C12, Y2[i], n2));
  const s1 = Pc.map((_, i) => PP[i * Pc.length + i] - 2 * lin(Y1[i], P1, i, n1) + quad(Y1[i], C11, Y1[i], n1)), s2 = Pc.map((_, i) => PP[i * Pc.length + i] - 2 * lin(Y2[i], P2, i, n2) + quad(Y2[i], C22, Y2[i], n2));
  const z = { tra: [], uno: [], due: [] }; let massimo = 0;
  for (const v of V) Pc.forEach((_, i) => { let f1 = 0, f2 = 0; for (let q = 0; q < n1; q++) f1 += v.a1[q] * Y1[i][q]; for (let q = 0; q < n2; q++) f2 += v.a2[q] * Y2[i][q]; z.tra.push((f1 - f2) ** 2 / s12[i]); z.uno.push((f1 - v.cer[i]) ** 2 / s1[i]); z.due.push((f2 - v.cer[i]) ** 2 / s2[i]); massimo = Math.max(massimo, Math.abs(f1 - f2) / Math.sqrt(PP[i * Pc.length + i])); });
  const tol = quattroScarti(NMONDI); // i 6 punti di un mondo non sono indipendenti: si conta un campione per mondo
  for (const [k, che] of [['tra', 'f₁ − f₂'], ['uno', 'f₁ − f'], ['due', 'f₂ − f']]) { const m = z[k].reduce((a, b) => a + b, 0) / z[k].length; console.log(`      ${che}: ⟨z²⟩ = ${num(m, 4)} (atteso 1 ± ${num(tol)})`); assert.ok(Math.abs(m - 1) < tol, `${che}: ${m}`); }
  console.log(`      scarto atteso del disaccordo sul cerchio: ${num(Math.sqrt(Math.max(...s12) / PP[0]))} dello scarto del campo (il resto oltre ℓmax delle due bolle); il più grande visto: ${num(massimo)}`);
});
prova('dato solo il bordo, l\'interno condizionato (media vincolata + varianza che resta) contiene il campo vero con la statistica attesa', () => {
  for (const [forme, nome, k] of [[[Fo1], 'B₁', ['a1']], [[Fo1, Fo2], 'B₁ e B₂ insieme', ['a1', 'a2']]]) {
    const S = B.sistema(forme), X = forme.map((Fo) => B.covarianza(FoD, Fo)), PP = B.covarianza(FoD, FoD), nd = dentro.length, z = dentro.map(() => []), parte = [];
    const xi = dentro.map((_, r) => { const out = new Float64Array(S.n); forme.forEach((Fo, f) => out.set(X[f].subarray(r * Fo.righe, (r + 1) * Fo.righe), S.off[f])); return S.risolvi(out); }); // C⁻¹ξ
    dentro.forEach((_, r) => { let t = 0; const x0 = new Float64Array(S.n); forme.forEach((Fo, f) => x0.set(X[f].subarray(r * Fo.righe, (r + 1) * Fo.righe), S.off[f])); for (let q = 0; q < S.n; q++) t += x0[q] * xi[r][q]; parte.push({ resta: PP[r * nd + r] - t, libera: PP[r * nd + r] }); });
    for (const v of V) { const c = new Float64Array(S.n); k.forEach((kk, f) => c.set(v[kk], S.off[f])); dentro.forEach((_, r) => { let m = 0; for (let q = 0; q < S.n; q++) m += xi[r][q] * c[q]; z[r].push((v.den[r] - m) ** 2 / parte[r].resta); }); }
    const tol = quattroScarti(NMONDI);
    const righe = z.map((zz, r) => { const m = zz.reduce((a, b) => a + b, 0) / NMONDI; assert.ok(Math.abs(m - 1) < tol, `${nome}, punto ${r}: ⟨z²⟩ = ${m}`); return `${['centro', 'lente', 'mezzo raggio'][r]} ⟨z²⟩ ${num(m, 3)}, il bordo spiega ${num(100 * (1 - parte[r].resta / parte[r].libera))}%`; });
    console.log(`      ${nome} (${S.gradi} vincoli; atteso ⟨z²⟩ = 1 ± ${num(tol)}): ${righe.join('; ')}`);
  }
});
prova('il campo è uno solo: condizionato all\'impronta che di lui dà l\'altra via (la quadratura), non si muove più di quanto la teoria permette', () => {
  const Q = B.improntaPerQuadratura(F, { ...B2, lmax: Fo2.lmax, nodi: 24 }), K = B.condizionaAlBordo(F, [{ bolla: B2, valori: Q }]); assert.ok(K.esiste);
  // |δ_c(x) − δ(x)| = |ξᵀC⁻¹Δc| ≤ √(ξᵀC⁻¹ξ)·√(ΔcᵀC⁻¹Δc) ≤ σ(x)·√(χ²(Δc)) (Cauchy–Schwarz): il limite viene dal modello
  const S = K.sistema, esatti = B.valoriForma(F, Fo2), dc = Q.map((x, i) => x - esatti[i]), lim = Math.sqrt(S.chi2(dc)), punti = [c1, dentro[1], c2, sulCerchio(1)], sx = Math.sqrt(F.varianza({ livello: J }));
  let peggio = 0; for (const p of punti) { const d = Math.abs(K.campo.delta(p, { livello: J }) - F.delta(p, { livello: J })) / sx; peggio = Math.max(peggio, d); assert.ok(d <= lim * 1.0001 + 1e-15, `si è mosso di ${d} scarti, più di ${lim}`); }
  // e se l'impronta è quella esatta (da un altro esemplare del campo), la correzione è nulla al bit
  const K0 = B.condizionaAlBordo(F, [{ bolla: B2, valori: B.valoriForma(campoLibero(RADICE).campo, Fo2) }]); for (const p of punti) assert.equal(K0.campo.delta(p, { livello: J }), F.delta(p, { livello: J })); assert.equal(K0.chi2, K0.chi2Libero);
  console.log(`      con l'impronta della quadratura il campo si sposta al più di ${num(peggio)} scarti (limite dal modello ${num(lim)}); con quella esatta di 0 al bit`);
});
prova('un altro mondo, condizionato alle impronte di B₁ e B₂ di questo, ha quelle impronte (entro 10⁻⁹ dello scarto): le due bolle si incollano in un mondo solo', () => {
  const W = mondi[0], v = V[0], K = B.condizionaAlBordo(W, [{ bolla: B1, valori: B.valoriForma(F, Fo1) }, { bolla: B2, valori: B.valoriForma(F, Fo2) }]); assert.ok(K.esiste);
  let peggio = 0; for (const Fo of [Fo1, Fo2]) { const a = B.valoriForma(K.campo, Fo), b = B.valoriForma(F, Fo); for (let q = 0; q < a.length; q++) { let s2 = 0; for (let c = 0; c < Fo.n; c++) s2 += Fo.g[c * Fo.righe + q] ** 2; peggio = Math.max(peggio, Math.abs(a[q] - b[q]) / Math.sqrt(s2)); } }
  assert.ok(peggio < 1e-9, `impronte: ${peggio}`); assert.ok(v.a1.length === Fo1.righe);
  console.log(`      ${K.gradi} vincoli, χ² = ${num(K.chi2)}; impronte riprodotte entro ${num(peggio)} scarti`);
});
prova('bolle di due mondi diversi sulla stessa regione si possono condizionare insieme, ma pesano meno: ⟨χ²⟩ = tr(C⁻¹·diag(C₁₁, C₂₂)) contro i gradi', () => {
  const S = B.sistema([Fo1, Fo2]), n = S.n, n1 = Fo1.righe, C = S.C, Sg = new Float64Array(n * n); for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if ((i < n1) === (j < n1)) Sg[i * n + j] = C[i * n + j];
  const M = new Float64Array(n * n); for (let j = 0; j < n; j++) { const col = S.risolvi(Sg.subarray(j * n, (j + 1) * n)); for (let i = 0; i < n; i++) M[i * n + j] = col[i]; } // C⁻¹Σ (Σ simmetrica)
  let tr = 0, tr2 = 0; for (let i = 0; i < n; i++) { tr += M[i * n + i]; for (let j = 0; j < n; j++) tr2 += M[i * n + j] * M[j * n + i]; }
  const stesso = V.map((v) => { const c = new Float64Array(n); c.set(v.a1, 0); c.set(v.a2, n1); return S.chi2(c); });
  // (coppie disgiunte di mondi, 2k e 2k + 1: i campioni restano indipendenti)
  const misto = Array.from({ length: NMONDI / 2 }, (_, k) => { const c = new Float64Array(n); c.set(V[2 * k].a1, 0); c.set(V[2 * k + 1].a2, n1); return S.chi2(c); });
  const ms = stesso.reduce((a, b) => a + b, 0) / NMONDI, mm = misto.reduce((a, b) => a + b, 0) / misto.length, ts = 4 * Math.sqrt((2 * S.gradi) / NMONDI), tm = 4 * Math.sqrt((2 * tr2) / misto.length);
  console.log(`      stesso mondo: ⟨χ²⟩ = ${num(ms, 4)} (atteso ${S.gradi} ± ${num(ts)}); mondi diversi: ${num(mm, 4)} (atteso ${num(tr, 4)} ± ${num(tm)}): incollarle costa in media e^(−${num((tr - S.gradi) / 2)})`);
  assert.ok(Math.abs(ms - S.gradi) < ts); assert.ok(Math.abs(mm - tr) < tm); assert.ok(tr - S.gradi > tm, 'due mondi diversi dovrebbero pesare di meno');
});

console.log('C. l\'antenato comune tra luoghi e istanti diversi (C10, regola 12), in tempo conforme');
const eta0 = B.ORIZZONTE_OGGI;
prova('per eventi che coincidono ridà l\'evento; per uno nel passato dell\'altro dà il più vecchio', () => {
  for (const ist of [null, 3.8e5, 1e9, 9.2e9]) { const e = { posizione: c1, istante: ist }, A = B.antenatoTraEventi(e, e); assert.equal(A.caso, 'stesso'); assert.deepEqual(A.posizione.map((x) => x / MPC), c1.map((x) => x / MPC));
    const atteso = ist ?? B.istanteDa(eta0).istante; assert.ok(Math.abs(A.istante - atteso) <= 1e-9 * atteso, `istante ${A.istante} contro ${atteso}`); }
  const p = { posizione: c1, istante: 1e9 }, q = { posizione: piu(c1, [10 * MPC, 0, 0]), istante: null }, A = B.antenatoTraEventi(p, q);
  assert.equal(A.caso, 'uno nel passato dell\'altro'); assert.equal(A.eta, B.tempoDi(1e9).eta); assert.equal(B.relazioneConforme(p, q), 'prima');
});
prova('per coppie qualunque (tempo, luce, spazio) l\'antenato sta nel passato causale di entrambe, sul loro cono, ed è il più recente', () => {
  let n = 0; const tipi = {};
  for (let i = 0; i < 400; i++) { const u = (k) => ((i * [0.6180339887, 0.4142135624, 0.7320508076, 0.2360679775, 0.3166247904, 0.1622776602][k]) % 1);
    const p = { posizione: [0, 0, 0], eta: 50 + u(0) * (eta0 - 50) }, d = u(1) * 2.5 * eta0, th = Math.acos(2 * u(2) - 1), fi = 2 * Math.PI * u(3), q = { posizione: [d * Math.sin(th) * Math.cos(fi) * MPC, d * Math.sin(th) * Math.sin(fi) * MPC, d * Math.cos(th) * MPC], eta: i % 7 === 0 ? p.eta + d : 50 + u(4) * (eta0 - 50) };
    const A = B.antenatoTraEventi(p, q), e = { posizione: A.posizione, eta: A.eta }; tipi[A.separazione] = (tipi[A.separazione] ?? 0) + 1;
    for (const x of [p, q]) { const dist = Math.hypot(...[0, 1, 2].map((a) => x.posizione[a] - e.posizione[a])) / MPC; assert.ok(x.eta - e.eta >= dist - 1e-9 * eta0, `l'antenato non sta nel passato: ${x.eta - e.eta} < ${dist}`); }
    // il più recente: un evento un po' più tardi nello stesso posto non sta più nel passato di entrambe
    const dopo = { posizione: A.posizione, eta: A.eta + 1e-6 * eta0 }; assert.ok([p, q].some((x) => B.relazioneConforme(dopo, x) !== 'prima'));
    if (A.inflazione) assert.ok(A.separazione === 'spazio' && Math.hypot(...q.posizione) / MPC > p.eta + q.eta - 1e-9 * eta0); n++; }
  console.log(`      ${n} coppie (${Object.entries(tipi).map(([k, v]) => `${v} di ${k}`).join(', ')})`);
});
prova('oltre l\'orizzonte (|Δx| > η_p + η_q, oggi 2η₀) l\'antenato è prima dell\'inizio: esiste solo con l\'inflazione, dichiarata', () => {
  const oggi = (d) => B.antenatoTraEventi({ posizione: [0, 0, 0] }, { posizione: [d * MPC, 0, 0] }), vicino = oggi(1.98 * eta0), oltre = oggi(2.02 * eta0);
  assert.ok(vicino.esiste && !vicino.inflazione && vicino.istante > 0); assert.ok(!oltre.esiste && oltre.inflazione && oltre.istante === null && oltre.eta < 0);
  const ric = { posizione: [0, 0, 0], istante: 3.8e5 }, oggiLa = { posizione: [eta0 * 0.99 * MPC, 0, 0] }, A = B.antenatoTraEventi(ric, oggiLa);
  console.log(`      orizzonte: 2η₀ = ${num((2 * eta0) / 1000)} Gpc; a ${num((1.98 * eta0) / 1000)} Gpc l'antenato è a ${num(vicino.istante)} anni; a ${num((2.02 * eta0) / 1000)} Gpc ${oltre.perche}`);
  console.log(`      una bolla alla ricombinazione e una di oggi a ${num((0.99 * eta0) / 1000)} Gpc: ${A.caso}, antenato a ${num(A.istante)} anni`);
  assert.ok(A.esiste && A.istante < 3.8e5);
  // con i raggi: due bolle grandi, ognuna oltre l'orizzonte dell'altra al centro, si toccano coi bordi
  const b = B.antenatoTraEventi({ posizione: [0, 0, 0], raggio: 0.1 * eta0 * MPC }, { posizione: [2.1 * eta0 * MPC, 0, 0], raggio: 0.1 * eta0 * MPC }); assert.ok(b.esiste);
  // tre eventi: esatto quando lo sostiene una coppia
  const tre = B.antenatoComuneEventi([{ posizione: [0, 0, 0] }, { posizione: [100 * MPC, 0, 0] }, { posizione: [50 * MPC, 10 * MPC, 0] }]); assert.ok(tre.esatto); assert.ok(Math.abs(tre.eta - (eta0 - 50)) < 1e-9 * eta0);
});

console.log('D. il cono di luce di un ramo del campo (C9)');
prova('un ramo su una cella cambia l\'impronta solo se la sua portata arriva al bordo; allora la cella sta nel passato causale del bordo (ipotesi dell\'inflazione)', () => {
  const tocca = [], nonTocca = [], b = B.improntaPerQuadratura(F, { ...B1, lmax: I1.lmax, nodi: 12 }), esatta = B.valoriForma(F, Fo1), inForma = new Set(Array.from({ length: Fo1.n }, (_, c) => `${Fo1.j[c]},${Fo1.i[c]},${Fo1.k[c]},${Fo1.l[c]}`));
  for (const j of [J, J - 2, J - 5]) { const hj = F.latoDi(j), r = F.raggio * hj, R = R1 / MPC;
    // (s: dove sta la cella, in portate oltre il bordo; l'arrotondamento al reticolo la sposta al più di h/2 = r/12)
    for (const s of [0.5, 1.25]) { const d = R + s * r, idx = [Math.round((c1[0] / MPC + d) / hj - 0.5), Math.round(c1[1] / MPC / hj - 0.5), Math.round(c1[2] / MPC / hj - 0.5)], cel = B.eventoDiCella(F, j, ...idx), T = B.ramoTocca(F, cel, B1);
      const Fr = campoLibero(RADICE, { rami: { [cel.nome]: 1 } }).campo;
      if (T.tocca) { assert.ok(T.nelCono, 'la cella tocca il bordo ma non sta nel suo passato causale'); assert.ok(inForma.has(`${j},${idx.join(',')}`)); const a = B.valoriForma(Fr, Fo1); assert.ok(a.some((v, q) => v !== esatta[q]), `un ramo dentro la portata (livello ${j}) non ha cambiato l'impronta`); tocca.push([j, T.distanza]); }
      else { assert.ok(!inForma.has(`${j},${idx.join(',')}`)); const a = B.improntaPerQuadratura(Fr, { ...B1, lmax: I1.lmax, nodi: 12 }); assert.ok(a.every((v, q) => v === b[q]), `un ramo fuori portata (livello ${j}) ha cambiato l'impronta`); nonTocca.push([j, T.distanza]); } } }
  assert.ok(tocca.length === 3 && nonTocca.length === 3);
  console.log(`      fuori portata (la quadratura del campo resta identica al bit): ${nonTocca.map(([j, d]) => `livello ${j} a ${num(d)} Mpc dal bordo`).join(', ')}; dentro (cambia, e sta nel cono): ${tocca.map(([j, d]) => `livello ${j} a ${num(d)} Mpc`).join(', ')}`);
  console.log(`      ipotesi: ${B.IPOTESI_INFLAZIONE}`);
});
prova('le celle che due punti condividono sono eventi del loro passato comune; oltre l\'orizzonte il campo resta correlato solo per l\'inflazione', () => {
  for (const dMpc of [30, 3000, 2.1 * eta0]) { const p = [0, 0, 0], q = [dMpc * MPC, 0, 0], A = B.antenatoTraEventi({ posizione: p }, { posizione: q }), Fp = B.formaPunti(F, [p, q], { livello: J }); let comuni = 0, cov = 0;
    const chiavi = new Map(); for (let c = 0; c < Fp.n; c++) { const g0 = Fp.g[2 * c], g1 = Fp.g[2 * c + 1]; if (g0 !== 0 && g1 !== 0) { comuni++; cov += g0 * g1; const e = B.eventoDiCella(F, Fp.j[c], Fp.i[c], Fp.k[c], Fp.l[c]); for (const x of [p, q]) { const dist = Math.hypot(...[0, 1, 2].map((a) => x[a] - e.posizione[a])) / MPC; assert.ok(eta0 - e.eta >= dist, 'una cella condivisa fuori dal passato comune'); } assert.ok(e.eta <= A.eta); chiavi.set(Fp.j[c], (chiavi.get(Fp.j[c]) ?? 0) + 1); } }
    const v = F.varianza({ livello: J }); console.log(`      a ${num(dMpc)} Mpc: antenato a η = ${num(A.eta)} Mpc (${A.esiste ? 'esiste' : 'prima dell\'inizio'}); ${comuni} celle in comune (livelli ${[...chiavi.keys()].join(', ')}), correlazione ${num(cov / v)}`);
    if (!A.esiste) assert.ok(comuni > 0 && cov !== 0, 'il campo del modello deve essere correlato oltre l\'orizzonte (ha l\'inflazione dentro)'); }
});
prova('senza l\'inflazione C9 cadrebbe: i livelli il cui nucleo supera l\'orizzonte della bolla, e quanto pesano', () => {
  for (const [ist, che] of [[null, 'oggi'], [3.8e5, 'alla ricombinazione']]) for (const g of ['densita', 'potenziale']) { const S = B.senzaInflazione(F, { istante: ist, livello: J, grandezza: g });
    console.log(`      ${che} (η = ${num(S.eta)} Mpc), ${g}: livelli ${S.livelli.map((x) => x.livello).join(', ') || 'nessuno'}, ${num(100 * S.parte)}% della varianza`); if (ist != null) assert.ok(S.livelli.length > 0); }
});

const tot = (performance.now() - T0) / 1000;
console.log(`\nbordo: ${ok} prove in ${tot.toFixed(1)} s (le più lente: ${tempi.sort((a, b) => b[1] - a[1]).slice(0, 4).map(([c, t]) => `${c} ${(t / 1000).toFixed(1)} s`).join(', ')})`);
if (nonTorna.length) console.log(`≠ NON TORNA:\n  ${nonTorna.join('\n  ')}`);
