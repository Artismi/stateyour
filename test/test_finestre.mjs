// test_finestre.mjs — LAVORO 9 di PROGETTO.md: LA FINESTRA A OGNI DISTANZA (il mare). INTRECCIO.md, regole 4, 8, 9, 14.
//
// A ogni distanza si calcola, con la legge di quella grana, solo la finestra inquadrata, come campione condizionato della
// grana sopra; riassunta, la finestra ridà il padre (M∘μ = I). Qui, per il primo mare con il vento del catalogo
// (mare_col_vento.mjs: nessun seme scelto), si riassumono le finestre e si confrontano col padre:
//   A. il padre: lo spettro (direzione normalizzata, energia della parte lunga = Hs²/16 di campoOnde), il tratto e la durata;
//   B. a metri: due finestre sovrapposte vedono le stesse onde; la varianza dell'altezza = l'integrale dello spettro sulla
//      banda della finestra; l'accelerazione che frange ha varianza 1 (quindi la schiuma copre W di Monahan); la griglia
//      dell'app contro la legge esatta (C12: converge);
//   C. a centimetri e micron: i granelli e i fiocchi nel numero e nella massa della torbidità; le bolle sotto la schiuma
//      (mediate sulla copertura: quelle di mare.js); i gas delle bollicine; il plancton (nessuno: non c'è vita);
//   D. a nanometri: la densità dell'acqua, ogni ione nel numero della sua concentrazione, la scatola neutra; il liquido
//      del potenziale mW è all'equilibrio (qualche passo di Monte Carlo in più non lo sposta) e ha la struttura dell'acqua.
// LA TOLLERANZA viene sempre dal modello (4 scarti: Poisson, varianza di un χ², binomiale; la quadratura col doppio dei
// passi; l'aritmetica). Ciò che è un confronto con la natura (Cox e Munk, i raggi X sull'acqua) si stampa e non ferma.
// Dura meno di mezzo minuto, la metà per costruire il pianeta.
import assert from 'node:assert/strict';
import { mareColVento } from './mare_col_vento.mjs';
import * as FI from '../src/camera/finestra.js';
import * as MA from '../src/camera/mare.js';
import { vaporeSaturo } from '../src/camera/leggi.js';
import { creaSistema, rifaiListe, energiaTotale, montecarlo, generatoreMC } from '../strumenti/acqua_mw.mjs';

const T0 = performance.now(); let ok = 0; const confronti = [], tempi = [], nonTorna = [];
const prova = (nome, f) => { const t = performance.now(); f(); ok++; tempi.push([nome.slice(0, 50), performance.now() - t]); console.log('  ✓', nome); };
const num = (x, c = 3) => (!Number.isFinite(x) ? String(x) : x === 0 ? '0' : Math.abs(x) >= 1e4 || Math.abs(x) < 1e-2 ? x.toExponential(c - 1).replace('.', ',') : String(+x.toPrecision(c)).replace('.', ','));
const EPS = 2 ** -52;

const M = mareColVento(), tPianeta = performance.now() - T0; assert.ok(M, 'nessun mare con il vento nei primi pianeti del catalogo');
const { st, aperto: A0, torbido: T1, P: PIANETA } = M;
console.log(`il mare: cosmo 1, galassia ${M.via.galassia}, stella ${M.via.stella}, pianeta ${M.via.pianeta} (${M.provati}° provato), ${num(st.salinitaMedia)} g/kg, ${num(st.pressioneAria / 1e5)} bar, g = ${num(st.gravita)} m/s²; costruito in ${num((performance.now() - T0) / 1000)} s`);
console.log(`il punto aperto: ${num(A0.lon, 5)}°, ${num(A0.lat, 4)}°, fondale ${num(A0.fondoM)} m, vento ${num(A0.onde.U)} m/s, Hs ${num(A0.onde.H)} m`);
const opz = { lon: A0.lon, lat: A0.lat, fondoM: A0.fondoM, P: PIANETA };

// =====================================================================================================================
console.log('A. il padre: lo stato del mare da lontano');
const PA = FI.padreMare(st, A0.lon, A0.lat, { anno: PIANETA.anno, stagioni: st.stagioni?.length }), SP = FI.spettro(PA);
prova('lo spettro: la direzione di Mitsuyasu è normalizzata, la parte lunga ha l\'energia di campoOnde (Hs²/16), la coda capillare viene dalla tensione di quell\'acqua', () => {
  // ∫D dφ = 1 (punto medio su n e 2n angoli: lo scarto è la stima dell'errore)
  const pt = SP.parti[0];
  for (const k of [pt.kp / 2, pt.kp, 4 * pt.kp, PA.km]) { const I = (n) => { let s = 0; for (let i = 0; i < n; i++) s += SP.D(pt, k, -Math.PI + ((i + 0.5) * 2 * Math.PI) / n); return (s * 2 * Math.PI) / n; }, a = I(720), b = I(1440); assert.ok(Math.abs(b - 1) <= Math.abs(a - b) + 1e-9, `D a k = ${k}: ${b}`); }
  // la parte lunga del vento: ∫ = Hs²/16 (il padre), con la quadratura e la stessa col doppio dei passi
  const lunga = (k1, k2) => { let s = 0; const n = 4000, L = Math.log(k2 / k1); for (let i = 0; i < n; i++) { const k = k1 * Math.exp(((i + 0.5) * L) / n); s += pt.lunga(k) * k; } return (s * L) / n; };
  const I1 = lunga(pt.kp / 8, pt.kp * 4e4), I2 = (() => { let s = 0; const n = 8000, L = Math.log(4e4 * 8); for (let i = 0; i < n; i++) { const k = (pt.kp / 8) * Math.exp(((i + 0.5) * L) / n); s += pt.lunga(k) * k; } return (s * L) / n; })();
  assert.ok(Math.abs(I2 - PA.Hs ** 2 / 16) <= 4 * Math.abs(I1 - I2) + 1e-9 * I2, `parte lunga ${I2} contro Hs²/16 = ${PA.Hs ** 2 / 16}`);
  // la velocità di fase minima (dove gravità e capillarità pesano uguale) è √(2g/k_m), con k_m = √(ρg/σ) di quell'acqua
  let cMin = Infinity; for (let k = PA.km / 5; k < PA.km * 5; k *= 1.0005) cMin = Math.min(cMin, FI.omega({ ...PA, d: Infinity }, k) / k);
  assert.ok(Math.abs(cMin - PA.cm) < 1e-6 * PA.cm, `${cMin} ${PA.cm}`);
  const mss = SP.mss(pt.kp / 8, 40 * PA.km), cm = 0.003 + 5.12e-3 * PA.U; confronti.push(`pendenza quadratica media dello spettro ${num(mss)} contro Cox e Munk 1954 (0,003 + 5,12·10⁻³·U) ${num(cm)}`);
  console.log(`      vento ${num(PA.U)} m/s, u* ${num(PA.ustar)} m/s; picco ${num(2 * Math.PI / pt.kp)} m (Ω = ${num(pt.Om)}, γ = ${num(pt.gam)}, s = ${num(pt.sp)}); σ = ${num(PA.sigma * 1000)} mN/m → k_m = ${num(PA.km)} rad/m (λ ${num(2 * Math.PI / PA.km * 100)} cm), c_m = ${num(PA.cm)} m/s; α_m = ${num(pt.am)}`);
  console.log(`      tratto libero ${num(PA.tratto / 1000)} km, χ = ${num(PA.chi)}: servono ${num(PA.tMin / 3600)} h di vento, la stagione ne dà ${PA.durata ? num(PA.durata / 3600) : '?'} → limita ${PA.limita}; mss ${num(mss)} (Cox e Munk ${num(cm)}); schiuma W = ${num(PA.copertura)}`);
});

// =====================================================================================================================
console.log('B. a metri: le onde di quel tratto');
const fin1 = FI.finestraAcqua(st, { ...opz, latoM: 1 }), t = fin1.tratto, [xc, yc] = FI.nelTratto(t, A0.lon, A0.lat);
prova('due finestre sovrapposte vedono le stesse onde (le tessere sono eventi del tratto, la griglia è quella dell\'ottava)', () => {
  const [lo2, la2] = FI.dalTratto(t, xc + 0.37, yc - 0.21), fin2 = FI.finestraAcqua(st, { ...opz, lon: lo2, lat: la2, latoM: 1 });
  assert.equal(fin2.tratto, t); const G1 = FI.ondeFinestra(fin1, 2.5), G2 = FI.ondeFinestra(fin2, 2.5); let d = 0, s = 0, n = 0;
  for (let gy = Math.max(G1.gy0, G2.gy0) + 3; gy < Math.min(G1.gy0 + G1.ny, G2.gy0 + G2.ny) - 3; gy++) for (let gx = Math.max(G1.gx0, G2.gx0) + 3; gx < Math.min(G1.gx0 + G1.nx, G2.gx0 + G2.nx) - 3; gx++) {
    const a = G1.eta[(gy - G1.gy0) * G1.nx + gx - G1.gx0], b = G2.eta[(gy - G2.gy0) * G2.nx + gx - G2.gx0]; d = Math.max(d, Math.abs(a - b)); s += a * a; n++; }
  console.log(`      ${n} punti in comune: scarto massimo ${num(d)} m (rms del campo ${num(Math.sqrt(s / n))} m)`);
  assert.ok(n > 1000 && d <= 1e3 * EPS * Math.sqrt(s / n) * 64, `scarto ${d}`);
});
// la varianza della banda della finestra (le ottave che la finestra aggiunge: lunghezze d'onda da 4 punti al suo lato), legge esatta.
// K finestre indipendenti (lontane più di una tessera dell'ottava più lunga), n×n punti in ciascuna: la tolleranza è il
// campionamento, 4·sd/√K. (Prima 24 finestre di 20×20 punti: ±29% a 1 cm. I punti di una finestra sono vicini e si somigliano:
// a parità di conti rendono di più tante finestre con pochi punti — qui 256 di 5×5, 6400 punti.)
function varianzaFinestre(L, K, n = 5) {
  const f0 = FI.finestraAcqua(st, { ...opz, latoM: L }), b1 = Math.floor(Math.log2(L)), bande = f0.bande.filter((B) => B.b <= b1), atteso = bande.reduce((a, B) => a + B.varianza, 0);
  const continuo = bande.reduce((a, B) => a + SP.varianza((2 * Math.PI) / 2 ** B.b, (4 * Math.PI) / 2 ** B.b), 0), Q = [], passo = 4 * 2 ** (b1 + 2);
  for (let q = 0; q < K; q++) { const x0 = xc + (q % 16) * passo, y0 = yc + Math.floor(q / 16) * passo; let s = 0;
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { const e = FI.ondeEsatte(t, x0 + ((i + 0.5) * L) / n, y0 + ((j + 0.5) * L) / n, 1.7 * q, bande).eta; s += e * e; } Q.push(s / (n * n)); }
  const m = Q.reduce((a, b) => a + b, 0) / K, sd = Math.sqrt(Q.reduce((a, b) => a + (b - m) ** 2, 0) / (K - 1));
  return { L, bande: bande.map((B) => B.b), atteso, continuo, m, tol: (4 * sd) / Math.sqrt(K), K };
}
const VAR = [];
prova('la varianza dell\'altezza nella finestra è l\'integrale dello spettro sulla banda della finestra (1 m e 1 cm, finestre indipendenti)', () => {
  for (const [L, K] of [[1, 256], [0.01, 256]]) { const r = varianzaFinestre(L, K); VAR.push(r);
    // (i modi della banda: la loro varianza Σs è l'integrale dello spettro sulle corone, cella per cella con Gauss-Legendre 4×4; con 8×8 la stima del suo errore)
    FI.ONDE.quadratura = 8; const t8 = FI.trattoDi(st, A0.lon, A0.lat), s8 = FI.bandeDelTratto(t8).filter((B) => r.bande.includes(B.b)).reduce((a, B) => a + B.varianza, 0); FI.ONDE.quadratura = 4; FI.bandeDelTratto(t8);
    const tolQ = 4 * Math.abs(s8 - r.atteso) + 1e-6 * r.continuo;
    console.log(`      lato ${num(L)} m, ottave ${r.bande[0]}…${r.bande[r.bande.length - 1]}: varianza media ${num(r.m)} m², attesa Σs ${num(r.atteso)} ± ${num(r.tol)} (4·sd/√${K}); l'integrale continuo sulle stesse corone ${num(r.continuo)}, Σs ${num(r.atteso)} ± ${num(tolQ)} (quadratura 4×4 contro 8×8)`);
    assert.ok(Math.abs(r.m - r.atteso) <= r.tol, `varianza ${r.m} contro ${r.atteso}`); assert.ok(Math.abs(r.atteso - r.continuo) <= tolQ, `Σs ${r.atteso} contro l'integrale ${r.continuo}`); }
});
prova('la schiuma: l\'accelerazione che frange, normalizzata, ha varianza 1 in ogni punto (quindi copre W di Monahan); conteggio su punti indipendenti', () => {
  // K punti indipendenti (lontani più di una tessera dell'ottava più lunga che porta l'accelerazione): la tolleranza del conteggio
  // è binomiale, 4·√(K·W(1 − W)), e perché stia sotto W/3 serve K ≳ 144/W (prima K = 1500: ±150% di W). Le ottave senza
  // accelerazione (varX sotto 10⁻⁹ di σX², lo stesso criterio di finestra.js aggiungiBanda) non entrano: pesano meno di 10⁻⁹.
  const bande = FI.bandeDelTratto(t).filter((B) => B.varX > 1e-9 * t.sigmaX ** 2), W0 = t.P.copertura, lato = Math.ceil(Math.sqrt(Math.min(40000, Math.max(1500, 144 / Math.max(W0, 1e-9))))), K = lato * lato, passo = 4 * 2 ** (bande[bande.length - 1].b + 1); let s2 = 0, sopra = 0; const c = t.sogliaSchiuma;
  for (let q = 0; q < K; q++) { const x = xc + ((q % lato) - (lato >> 1)) * passo, y = yc + (Math.floor(q / lato) - (lato >> 1)) * passo, X = FI.ondeEsatte(t, x, y, 0.37 * q, bande).X; s2 += X * X; if (X > c) sopra++; }
  const m = s2 / K, tol = 4 * Math.sqrt(2 / K), W = t.P.copertura, tolW = 4 * Math.sqrt(K * W * (1 - W));
  console.log(`      ⟨Y²⟩ = ${num(m, 4)} (atteso 1 ± ${num(tol)}); soglia ${num(c)} scarti; coperti ${sopra} su ${K} (attesi ${num(K * W)} ± ${num(tolW)}; W = ${num(W)})`);
  assert.ok(Math.abs(m - 1) <= tol && Math.abs(sopra - K * W) <= tolW + 1);
});
prova('la griglia della finestra (la piramide delle ottave) contro la legge esatta: converge raddoppiando i campioni per onda (C12)', () => {
  const err = (cpo) => { FI.ONDE.campioniPerOnda = cpo; const f = FI.finestraAcqua(st, { ...opz, latoM: 1 }), G = FI.ondeFinestra(f, 1.3); let d = 0, s = 0;
    for (let q = 0; q < 300; q++) { const i = (q * 37) % f.N, j = (q * 91) % f.N, gx = Math.round(f.x0 / f.h) + i, gy = Math.round(f.y0 / f.h) + j, v = G.eta[(gy - G.gy0) * G.nx + gx - G.gx0], e = FI.ondeEsatte(f.tratto, gx * f.h, gy * f.h, 1.3, f.bande).eta; d += (v - e) ** 2; s += e * e; }
    return Math.sqrt(d / s); };
  const e8 = err(8), e16 = err(16); FI.ONDE.campioniPerOnda = 8;
  console.log(`      scarto relativo (rms) dalla legge esatta: 8 campioni per onda (l'app) ${num(100 * e8, 2)}%, 16 campioni ${num(100 * e16, 2)}%; ordine ${num(Math.log2(e8 / e16), 2)}`);
  assert.ok(e16 < e8 / 2, 'la griglia non converge');
});

// =====================================================================================================================
console.log('C. a centimetri e micron: ciò che l\'acqua porta');
prova('i granelli e i fiocchi: nel numero (Poisson su n·V) e nella massa della torbidità di mare.js (finestre indipendenti, nel punto più torbido)', () => {
  const opzT = { lon: T1.lon, lat: T1.lat, fondoM: T1.fondoM, P: PIANETA }, f0 = FI.finestraAcqua(st, { ...opzT, latoM: 1e-3 }), classi = f0.popolazioni.classi.filter((c) => c.tipo === 'granello' || c.tipo === 'fiocco');
  console.log(`      il punto torbido: ${num(T1.lon, 5)}°, ${num(T1.lat, 4)}°, ${num(1000 * T1.fango)} g/m³ di fango${T1.foce ? ` (foce a ${num(T1.foce.distanzaM / 1000)} km)` : ''}`);
  let provate = 0;
  for (const L of [1e-2, 1e-3, 1e-4]) {
    const conta = {}, massa = {}; let K = 0; const fs = [];
    for (let q = 0; q < 12; q++) { const [xc2, yc2] = FI.nelTratto(FI.trattoDi(st, T1.lon, T1.lat), T1.lon, T1.lat), [lo, la] = FI.dalTratto(FI.trattoDi(st, T1.lon, T1.lat), xc2 + q * 7 * L, yc2); const f = FI.finestraAcqua(st, { ...opzT, lon: lo, lat: la, latoM: L }); fs.push(f); K++;
      for (const p of f.popolazioni.particelle) { const k = p.materiale; conta[k] = (conta[k] || 0) + 1; const v = (Math.PI / 6) * p.d ** 3, rho = p.tipo === 'fiocco' ? 0 : MA.DATI.densitaGrani; massa[k] = (massa[k] || 0) + v * rho; } }
    for (const c of fs[0].popolazioni.classi.filter((x) => x.tipo === 'granello' && /sabbia|limo|argilla/.test(x.materiale))) {
      const V = fs[0].L ** 3, att = K * c.visibili, n = conta[c.materiale] || 0; if (att < 4) continue; provate++;
      console.log(`      lato ${num(L)} m: ${c.materiale} ${n} contro ${num(att)} attesi (${c.legge.slice(0, 60)}…), tolleranza ${num(4 * Math.sqrt(att))}`);
      assert.ok(Math.abs(n - att) <= 4 * Math.sqrt(att), `${c.materiale}: ${n} contro ${att}`);
    }
  }
  if (!provate) console.log('      (in questo punto nessuna classe di granelli ha in media 4 granelli visibili in 12 finestre: il conteggio non si prova qui)');
  // la massa: la somma per classe (tutte le taglie, anche sotto il punto) è la torbidità di mare.js
  const camp = f0.popolazioni.campione; let tot = 0; for (const c of f0.popolazioni.classi) if (c.kgPerM3 != null && (c.tipo === 'granello' || c.tipo === 'fiocco')) tot += c.kgPerM3;
  const conosciute = (camp.sospeso.sabbia || 0) + (camp.sospeso.limo || 0) + (camp.sospeso.argilla || 0) + (camp.sospeso.fiocchi || 0) + (camp.sospeso.polvere || 0); // (la polvere del vento: mare.js polvereDelVento)
  console.log(`      massa delle classi (granelli e fiocchi) con la loro legge delle taglie ${num(1000 * tot)} g/m³ contro la torbidità di mare.js ${num(1000 * conosciute)} g/m³`);
  assert.ok(Math.abs(tot - conosciute) <= 64 * EPS * conosciute + 1e-18, `massa ${tot} contro ${conosciute}`);
});
prova('le bolle: sotto la schiuma (Deane e Stokes), e mediate sulla copertura sono quelle di mare.js; i gas sono quelli dell\'aria di quel pianeta', () => {
  const f = FI.finestraAcqua(st, { ...opz, latoM: 1e-2 }), B = f.popolazioni.bolle, Z = f.popolazioni.zattera;
  assert.ok(B && B.n > 0, 'nessuna bolla sotto la schiuma'); const cl = f.popolazioni.campione.classi.find((c) => c.tipo === 'bolla');
  // mediata sulla copertura: n_sotto·W·(parte visibile) = n di mare.js·(parte visibile)
  const lb = B.legge, media = B.n * f.padre.copertura / lb.parteSopra(B.dVis);
  assert.ok(Math.abs(media - cl.perM3) <= 64 * EPS * cl.perM3, `${media} ${cl.perM3}`);
  // tutta la finestra sotto la schiuma: il numero delle bolle visibili è Poisson su n·V
  const tutta = new Uint8Array(f.N * f.N).fill(1); let n = 0, att = 0; const K = 6;
  for (let q = 0; q < K; q++) { const [lo, la] = FI.dalTratto(f.tratto, FI.nelTratto(f.tratto, A0.lon, A0.lat)[0] + q * 0.05, FI.nelTratto(f.tratto, A0.lon, A0.lat)[1]), g = FI.finestraAcqua(st, { ...opz, lon: lo, lat: la, latoM: 1e-2 });
    n += FI.bolleSottoSchiuma(g, tutta).filter((p) => !p.zattera).length; att += g.popolazioni.bolle.n * g.L ** 3; }
  console.log(`      sotto la schiuma: ${n} bolle visibili in ${K} finestre di 1 cm (attese ${num(att)} ± ${num(4 * Math.sqrt(att))}); a_H = ${num(lb.aH * 1000)} mm, la più piccola ${num(lb.aMin * 1e6)} µm; la zattera in superficie ${num(Z.perM2)} bolle/m²`);
  assert.ok(Math.abs(n - att) <= 4 * Math.sqrt(att) + 1);
  // i gas d'una bolla di raggio a a profondità z: il vapore alla sua pressione di saturazione, il resto nelle proporzioni dell'aria
  const g = FI.gasDellaBolla(f, 20e-6, 0.1), somma = Object.values(g.parziali).reduce((a, b) => a + b, 0);
  console.log(`      una bollicina di 20 µm a 10 cm: ${num(g.pressione / 1e5)} bar (Laplace ${num(g.laplace / 1e5)} bar), ${num(g.molecole)} molecole: ${Object.entries(g.frazioni).filter(([, x]) => x > 1e-4).map(([k, x]) => `${k} ${num(100 * x)}%`).join(', ')}`);
  assert.ok(Math.abs(somma - g.pressione) <= 64 * EPS * g.pressione && Math.abs(g.parziali.H2O - vaporeSaturo(f.padre.T)) <= 64 * EPS * g.pressione);
});
prova('il plancton: nessuno — il modello non ha la vita, e la finestra lo dice', () => {
  assert.ok(/plancton: nessuno/.test(fin1.descrizione));
});

// =====================================================================================================================
console.log('D. a nanometri: l\'acqua liquida, fitta, con ogni ione');
prova('la densità di quell\'acqua, ogni ione nel numero della sua concentrazione (Poisson condizionato alla scatola neutra), ogni ione col suo guscio', () => {
  // LA LEGGE: i Poisson indipendenti delle concentrazioni (λ = perM3 × volume), condizionati alla carica zero. La media di
  // ogni specie è allora E[n | Q = 0] = λ·P(Q = −z)/P(Q = 0) (FI.medieNeutre: la legge di Q per convoluzione), la sua varianza
  // non supera λ. TOLLERANZA, dichiarata prima: 4·√(Σλ) sulla somma di 100 scatole (4 scarti di Poisson: più larga dello scarto
  // vero del condizionato, mai allargata). Si guarda ciò che la scena mostra (gli ioni messi, liberi e nelle coppie). Prima la
  // neutralità aggiungeva sempre lo ione più abbondante del segno che mancava: HCO₃⁻ 554 contro 426 ± 83 (NON TORNA).
  const somme = {}, attese = {}, neutre = {}, lam = {}; let K = 0, aggiustati = 0, tentativi = 0; const gusci = {};
  for (let q = 0; q < 100; q++) { const sc = FI.scenaNano(st, { lon: A0.lon + q * 1e-3, lat: A0.lat, latoM: 6e-9, fondoM: A0.fondoM }); K++;
    assert.equal(sc.carica, 0, 'la scatola non è neutra');
    const tolti = sc.ripetizioni ** 3 * sc.modello.N - sc.conteggi.acqua; assert.ok(tolti >= 0 && Math.abs(sc.ripetizioni ** 3 * sc.modello.N - sc.densitaNm3 * sc.latoNm ** 3) < 1e-6 * sc.modello.N, 'densità');
    for (const f in sc.messi) somme[f] = (somme[f] || 0) + sc.messi[f]; for (const f in sc.attesi) attese[f] = (attese[f] || 0) + sc.attesi[f];
    const mn = FI.medieNeutre(sc.classiIoni).medie, da = (f, x, l) => { neutre[f] = (neutre[f] || 0) + x; lam[f] = (lam[f] || 0) + l; };
    sc.classiIoni.forEach((c, i) => { if (c.tipo === 'ione') da(c.f, mn[i], c.lam); else { da(c.ca, mn[i], c.lam); da(c.an, mn[i], c.lam); } });
    for (const f in sc.gusci) (gusci[f] ||= []).push(...sc.gusci[f]); aggiustati += sc.aggiustati || 0; tentativi += sc.tentativi || 0; }
  assert.equal(aggiustati, 0, 'il condizionamento non è riuscito in qualche scatola (si è dovuto aggiustare a mano)');
  for (const f of Object.keys(lam).filter((x) => lam[x] >= 4)) { const tol = 4 * Math.sqrt(lam[f]), n = somme[f] || 0, torna = Math.abs(n - neutre[f]) <= tol;
    console.log(`      ${f}: ${n} in ${K} scatole di 6 nm, attesi ${num(neutre[f])} ± ${num(tol)} con la scatola neutra (Poisson senza vincolo ${num(lam[f])}; dalla concentrazione ${num(attese[f] || 0)}) ${torna ? 'TORNA' : '≠ NON TORNA'}`); assert.ok(torna, f); }
  console.log(`      il condizionamento: ${num(tentativi / K)} tentativi per scatola (rigetto esatto sul perno), nessuno ione aggiunto o tolto a mano`);
  const misurate = { 'Na+': '5–6', 'Ca2+': '6–8', 'Mg2+': '6', 'K+': '6–7', 'Cl-': '6–7' }; for (const f of Object.keys(gusci).filter((x) => misurate[x])) confronti.push(`molecole nel primo guscio di ${f}: ${num(gusci[f].reduce((a, b) => a + b, 0) / gusci[f].length)} (misurate ${misurate[f]}: gli ioni prendono il posto d'una molecola del liquido e non riordinano le vicine)`);
});
prova('il campionatore dei Poisson condizionati alla carica zero è esatto: su 20 000 scatole finte le medie sono E[n | Q = 0] della convoluzione', () => {
  // (classi con la carica media lontana da zero, perché il condizionamento sposti le medie; una coppia carica; lo ione perno
  // con media sopra 10, dove il Poisson esatto è PTRS. TOLLERANZA dichiarata prima: 4 scarti della media campionaria, sd/√K)
  const classi = [{ tipo: 'ione', f: 'Na+', lam: 14, z: 1 }, { tipo: 'ione', f: 'Ca2+', lam: 3, z: 2 }, { tipo: 'ione', f: 'Cl-', lam: 9, z: -1 }, { tipo: 'ione', f: 'SO4(2-)', lam: 2.5, z: -2 }, { tipo: 'coppia', ca: 'Na+', an: 'SO4(2-)', lam: 1.2, z: -1 }];
  const r = FI.generatore(0x5eed), K = 20000, s = classi.map(() => 0), s2 = classi.map(() => 0); let t = 0;
  for (let q = 0; q < K; q++) { const c = FI.campioniNeutri(r, classi); assert.ok(c.riuscito); t += c.tentativi; let Q = 0; c.n.forEach((x, i) => { s[i] += x; s2[i] += x * x; Q += x * classi[i].z; }); assert.equal(Q, 0); }
  const m = FI.medieNeutre(classi); const righe = [];
  classi.forEach((c, i) => { const mu = s[i] / K, sd = Math.sqrt(Math.max(0, s2[i] / K - mu * mu)), tol = (4 * sd) / Math.sqrt(K); righe.push(`${c.f || `${c.ca} ${c.an}`} ${num(mu, 4)} contro ${num(m.medie[i], 4)} ± ${num(tol)} (λ ${c.lam})`); assert.ok(Math.abs(mu - m.medie[i]) <= tol, righe[i]); });
  console.log(`      carica media senza vincolo ${num(m.mediaQ)}, P(Q = 0) ${num(m.pZero)}; ${righe.join('; ')}; ${num(t / K)} tentativi per scatola`);
});
prova('il liquido mW è all\'equilibrio (trenta passate di Monte Carlo in più non spostano l\'energia) e ha la struttura dell\'acqua', () => {
  const L = FI.liquidoMW(), S = creaSistema(Float64Array.from(L.pos, (x) => x * 10), L.latoNm * 10); rifaiListe(S); const E0 = energiaTotale(S), r = generatoreMC('prova della finestra/monte carlo'), E = [];
  let m = { passo: 0.23 }; for (let b = 0; b < 6; b++) { m = montecarlo(S, 5, L.T, r, { passo: m.passo }); E.push(energiaTotale(S)); }
  const me = E.reduce((a, b) => a + b, 0) / E.length, sd = Math.sqrt(E.reduce((a, b) => a + (b - me) ** 2, 0) / (E.length - 1));
  const g = FI.distribuzioneRadiale(L.pos, L.N, L.latoNm, { rMax: 0.6, nb: 60 }); let gm = 0, km = 0; for (let k = 0; k < 60; k++) if (g.g[k] > gm) { gm = g.g[k]; km = k; }
  let n33 = 0; for (let k = 0; k < 60 && g.r[k] < 0.33; k++) n33 += 4 * Math.PI * g.r[k] ** 2 * g.h * g.rho * g.g[k];
  console.log(`      energia per molecola ${num(E0, 5)} kcal/mol, dopo 30 passate ${num(me, 5)} ± ${num(sd)} (Molinero e Moore: −10,06); g(r): primo massimo ${num(g.r[km] * 10)} Å alto ${num(gm)}, vicine entro 3,3 Å: ${num(n33)}`);
  confronti.push(`g_OO dell'acqua mW: primo massimo ${num(g.r[km] * 10)} Å alto ${num(gm)}, contro i raggi X (Skinner e altri 2013: 2,80 Å, 2,57); vicine entro 3,3 Å ${num(n33)} (misurate ~4,3)`);
  assert.ok(Math.abs(E0 - me) <= 4 * sd + 4 * sd / Math.sqrt(E.length), `energia ${E0} contro ${me}`);
  assert.ok(n33 > 3.5 && n33 < 6.5, 'le vicine non sono quelle di un liquido tetraedrico');
});

// =====================================================================================================================
console.log('E. i costi (ms): la finestra si crea quando la si guarda, poi ogni fotogramma rifà solo le onde e l\'immagine');
prova('i costi per lato: creazione, onde e immagine per fotogramma', () => {
  for (const L of [1, 0.1, 0.01, 1e-3, 1e-5, 1e-7]) { let t0 = performance.now(); const f = FI.finestraAcqua(st, { ...opz, latoM: L }); const tc = performance.now() - t0; FI.immagineFinestra(f, 0);
    let to = 0, ti = 0; for (let k = 1; k <= 4; k++) { t0 = performance.now(); const G = FI.ondeFinestra(f, 0.05 * k); to += performance.now() - t0; t0 = performance.now(); FI.immagineFinestra(f, 0.05 * k, { onde: G }); ti += performance.now() - t0; }
    console.log(`      ${num(L)} m (${f.N}×${f.N}): creazione ${num(tc)} ms, onde ${num(to / 4)} ms, immagine ${num(ti / 4)} ms; ${f.popolazioni.particelle.length} particelle disegnate`); }
});

for (const c of confronti) console.log('  ≈ confronto con la natura:', c);
for (const c of nonTorna) console.log('  ≠ NON TORNA:', c);
console.log(`\n${ok} prove superate in ${num((performance.now() - T0) / 1000)} s (il pianeta: ${num(tPianeta / 1000)} s)`);
for (const [n, ms] of tempi.sort((a, b) => b[1] - a[1]).slice(0, 4)) console.log(`    ${n}: ${(ms / 1000).toFixed(1)} s`);
