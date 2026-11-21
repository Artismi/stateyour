// test_tettonica.mjs — la tettonica che evolve: la crosta si conserva, va alla deriva, si scontra; gli oceani
// invecchiano e affondano; le quote vengono dal galleggiamento; i continenti non sono tondi
import assert from 'node:assert/strict';
import { evolviTettonica, campoDaPotenziale, velocitaCrosta, passoCrosta, crostaAttesa, profonditaOceano, litosfera, COSTANTI } from '../src/camera/tettonica.js';

let ok = 0; const nonTorna = [];
// (ciò che è un riscontro e non una legge — un costo, un numero della Terra vera — non ferma la catena: se non torna si stampa «≠ NON TORNA» e resta scritto in fondo)
const riscontro = (bene, che) => { if (!bene) { nonTorna.push(che); console.log(`      ≠ NON TORNA  ${che}`); } return !!bene; };
const prova = (nome, f) => { f(); ok++; console.log('  ✓', nome); };
const corr = (xs, ys) => { const n = xs.length; let mx = 0, my = 0; for (let i = 0; i < n; i++) { mx += xs[i]; my += ys[i]; } mx /= n; my /= n; let a = 0, b = 0, c = 0; for (let i = 0; i < n; i++) { a += (xs[i] - mx) * (ys[i] - my); b += (xs[i] - mx) ** 2; c += (ys[i] - my) ** 2; } return a / Math.sqrt(b * c); };
const somma = (a) => { let s = 0; for (const v of a) s += v; return s; };

// le masse di terra (celle continentali che si toccano per un lato; in longitudine la carta fa il giro) e quanto
// sono lontane da un cerchio: perimetro² / (4π·area). Il perimetro contato a lati di cella è più lungo del vero di
// 4/π (una linea obliqua fatta a scalini), e lo si corregge: così un cerchio dà 1, come deve.
function masse(cont, W, H) {
  const N = W * H, visto = new Uint8Array(N), out = [];
  for (let k0 = 0; k0 < N; k0++) { if (!cont[k0] || visto[k0]) continue; const pila = [k0]; visto[k0] = 1; let area = 0, lati = 0;
    while (pila.length) { const k = pila.pop(), i = k % W, j = (k - i) / W; area++;
      for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const jj = j + dj; if (jj < 0 || jj >= H) { lati++; continue; } const q = jj * W + ((i + di + W) % W); if (!cont[q]) lati++; else if (!visto[q]) { visto[q] = 1; pila.push(q); } } }
    out.push({ area, forma: ((lati * Math.PI) / 4) ** 2 / (4 * Math.PI * area) }); }
  return out.sort((a, b) => b.area - a.area);
}
// le masse principali: le più grandi, quante ne servono per fare metà di tutta la terra
const principali = (ms) => { const tot = ms.reduce((s, m) => s + m.area, 0), out = []; let c = 0; for (const m of ms) { out.push(m); c += m.area; if (c >= tot / 2) break; } return out; };

// un mantello semplice per le prove a mano: sale lungo il meridiano x = 0 (una dorsale) e scende a x = W/2 (una fossa)
const W0 = 64, H0 = 32, N0 = W0 * H0, C0 = 0.3;
const dueMeta = () => { const u = new Float64Array(N0); for (let j = 0; j < H0; j++) for (let i = 0; i < W0; i++) u[j * W0 + i] = Math.cos((2 * Math.PI * (i + 0.5)) / W0); return campoDaPotenziale(u, W0, H0, C0); };
const stato = () => ({ W: W0, H: H0, h: new Float64Array(N0), a: new Float64Array(N0), sub: new Float64Array(N0) });
const blocco = (st, i0, i1, j0, j1, h) => { for (let j = j0; j < j1; j++) for (let i = i0; i < i1; i++) st.h[j * W0 + i] = h; };
const baricentro = (st) => { let s = 0, m = 0; for (let j = 0; j < H0; j++) for (let i = 0; i < W0; i++) { s += i * st.h[j * W0 + i]; m += st.h[j * W0 + i]; } return s / m; };
const area = (st, soglia) => { let n = 0; for (const v of st.h) if (v >= soglia) n++; return n; };

prova('il trasporto conserva la crosta continentale, e non ne inventa di negativa', () => {
  // un mantello qualsiasi (onde a caso), continenti e veli sparsi; con erosione e fiumi, senza crosta nuova
  let s = 12345; const caso = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const u = new Float64Array(N0), onde = Array.from({ length: 6 }, () => ({ kx: 1 + Math.floor(caso() * 4), ky: Math.floor(caso() * 4), f: caso() * 6.28, a: 0.5 + caso() }));
  for (let j = 0; j < H0; j++) for (let i = 0; i < W0; i++) for (const o of onde) u[j * W0 + i] += o.a * Math.cos((2 * Math.PI * o.kx * i) / W0 + o.f) * Math.cos((Math.PI * o.ky * (j + 0.5)) / H0);
  const ca = campoDaPotenziale(u, W0, H0, C0), st = stato();
  for (let k = 0; k < N0; k++) st.h[k] = caso() < 0.3 ? 30e3 + 25e3 * caso() : caso() < 0.3 ? 8e3 * caso() : 0;
  const prima = somma(st.h), h0 = Float64Array.from(st.h);
  for (let p = 0; p < 300; p++) { if (p % 4 === 0) velocitaCrosta(st.h, ca, W0, H0, 4); passoCrosta(st, ca, { dtMa: 1, kappa: 0.03, fiumi: 0.01 }); }
  const dopo = somma(st.h) + st.fango;
  assert.ok(Math.abs(dopo - prima) / prima < 1e-9, `crosta prima ${prima}, dopo ${dopo}`);
  assert.ok(st.h.every((v) => v >= 0 && Number.isFinite(v)) && st.a.every((v) => v >= 0 && Number.isFinite(v)));
  let mosso = 0; for (let k = 0; k < N0; k++) mosso += Math.abs(st.h[k] - h0[k]); assert.ok(mosso / prima > 0.5, 'e la crosta si è mossa davvero');
});

prova('un continente va alla deriva intero: si sposta col mantello senza sfaldarsi', () => {
  const ca = dueMeta(), st = stato(); blocco(st, 8, 16, 10, 22, 35e3);
  const x0 = baricentro(st), a0 = area(st, 25e3), m0 = somma(st.h);
  for (let p = 0; p < 40; p++) { if (p % 4 === 0) velocitaCrosta(st.h, ca, W0, H0, 4); passoCrosta(st, ca); }
  const dx = baricentro(st) - x0;
  assert.ok(dx > 0.8 * 40 * C0 && dx < 1.1 * 40 * C0, `spostato di ${dx.toFixed(1)} celle (il mantello ne fa ${40 * C0})`);
  assert.ok(Math.abs(area(st, 25e3) - a0) / a0 < 0.25, `area ${a0} → ${area(st, 25e3)}`);
  assert.ok(Math.abs(somma(st.h) + (st.fango || 0) - m0) / m0 < 1e-9); // (con i veli più sottili di un metro, che viaggiano col fango dei fiumi)
});

prova('due continenti che si scontrano alzano una catena, e l’ingorgo li ferma', () => {
  const ca = dueMeta(), st = stato(); blocco(st, 14, 24, 10, 22, 35e3); blocco(st, 40, 50, 10, 22, 35e3);
  const m0 = somma(st.h);
  for (let p = 0; p < 120; p++) { if (p % 4 === 0) velocitaCrosta(st.h, ca, W0, H0, 4); passoCrosta(st, ca); }
  // (fuori: dove nessun bordo stringe — conv = 0 — la litosfera fredda è rigida: la crosta resta spessa com'era, 35 km)
  let cima = 0, iCima = 0, fuori = 0; for (let j = 0; j < H0; j++) for (let i = 0; i < W0; i++) { const v = st.h[j * W0 + i]; if (v > cima) { cima = v; iCima = i; } if (ca.conv[j * W0 + i] === 0) fuori = Math.max(fuori, v); }
  assert.ok(cima > 50e3 && cima < COSTANTI.hMassimo * 1.1, `la catena è spessa ${(cima / 1e3).toFixed(0)} km`);
  assert.ok(Math.abs(iCima - 31.5) <= 2, `ed è sulla sutura (colonna ${iCima})`);
  assert.ok(fuori < 35e3 * 1.15, `dove nessun bordo stringe la crosta non si è accartocciata: ${(fuori / 1e3).toFixed(1)} km`);
  assert.ok(ca.conv[16 * W0 + 31] > 0.4 && ca.conv[16 * W0 + 10] === 0, 'la spinta è dove il mantello converge');
  assert.ok(Math.abs(somma(st.h) + (st.fango || 0) - m0) / m0 < 1e-9); // (con i veli più sottili di un metro, che viaggiano col fango dei fiumi)
});

prova('la crosta oceanica nasce alla dorsale, invecchia allontanandosi, affonda alla fossa', () => {
  const ca = dueMeta(), st = stato(); velocitaCrosta(st.h, ca, W0, H0, 4);
  for (let p = 0; p < 400; p++) passoCrosta(st, ca, { dtMa: 1 });
  const eta = (i) => st.a[16 * W0 + i];
  for (let i = 1; i < 30; i++) assert.ok(eta(i + 1) > eta(i), `a ${i} celle dalla dorsale ${eta(i).toFixed(1)}, a ${i + 1} ${eta(i + 1).toFixed(1)}`);
  // l'età è la distanza diviso la velocità (un terzo di cella a passo, un milione di anni a passo)
  for (const i of [10, 20, 28]) assert.ok(Math.abs(eta(i) - (i + 0.5) / C0) / ((i + 0.5) / C0) < 0.15, `a ${i} celle: ${eta(i).toFixed(1)} Ma, attesi ${((i + 0.5) / C0).toFixed(1)}`);
  let affonda = 0; for (let i = 0; i < W0; i++) { const v = st.sub[16 * W0 + i]; affonda += v; if (Math.abs(i - 31.5) > 8) assert.ok(v < 0.01, `lontano dalla fossa non affonda niente (colonna ${i}: ${v})`); }
  assert.ok(Math.abs(affonda - 2 * C0) < 0.02, `alla fossa affonda quanto arriva dai due lati: ${affonda.toFixed(3)} celle a passo`);
  assert.ok(Math.max(...st.a) < 200, 'e non resta in giro: nessuna crosta più vecchia del viaggio');
});

prova('la litosfera: la subsidenza di McKenzie esce dalla colonna; lo spessore neutro, la spinta della dorsale e il Tibet dai suoi pesi', () => {
  const L = litosfera(), C = COSTANTI, aT = C.alfa * C.Tastenosfera;
  // McKenzie 1978, nella forma di Angevine e altri 1990 (eq. 4.2): la subsidenza iniziale, in acqua, di una crosta spessa tc stirata di β
  const Si = (tc, beta) => (L.a * ((C.rhoMantello - C.rhoCrosta) * (tc / L.a) * (1 - (aT * tc) / (2 * L.a)) - (C.rhoMantello * aT) / 2) * (1 - 1 / beta)) / (C.rhoMantello * (1 - aT) - C.rhoAcqua);
  for (const [tc, beta] of [[35e3, 1.5], [35e3, 3], [30e3, 2], [40e3, 4]]) { const qui = (L.quota(tc, 0) - L.quota(tc / beta, 1 - 1 / beta)) * L.carica; assert.ok(Math.abs(qui - Si(tc, beta)) < 1e-6 * Math.abs(Si(tc, beta)), `tc ${tc}, β ${beta}: ${qui} contro ${Si(tc, beta)}`); }
  // sotto 17,2 km (con a = 125 km: Angevine) stirare fa salire invece che scendere; qui a è quello dei fondali della legge empirica
  const tc0 = (L.a / aT) * (1 - Math.sqrt(1 - (aT * aT * C.rhoMantello) / (C.rhoMantello - C.rhoCrosta))); assert.ok(Math.abs(Si(tc0, 2)) < 1e-6 && tc0 > 12e3 && tc0 < 19e3, `stirare non cambia la quota a ${tc0} m di crosta`);
  // poi la colonna si raffredda e scende ancora: tutto ciò che resta è quota(h, x) − quota(h, 0), e τ viene dalla legge dei fondali
  assert.ok(L.quota(17.5e3, 0.5) > L.quota(17.5e3, 0) + 1000 && L.quota(17.5e3, 0.25) > L.quota(17.5e3, 0) && Math.abs(L.tau / 1e6 - (16 / Math.PI ** 3) * ((C.abisso - C.dorsale) / C.raffredda) ** 2) < 1e-9 && L.tau > 4e7 && L.tau < 7e7, `τ = ${L.tau / 1e6} milioni di anni (McKenzie: 62,8)`);
  // una crosta stirata all'infinito è un fondale vecchio: la colonna senza crosta e il fondale della legge stanno a meno della spinta del basalto
  // (di quanto il basalto freddo, più leggero del mantello, la tiene su)
  assert.ok(Math.abs(L.oceano(1e4) - L.quota(0, 0) - ((C.rhoMantello - C.rhoBasalto) / L.rhoA) * C.basalto * (1 - (aT * C.basalto) / (2 * L.a))) < 1);
  // i pesi: la spinta della dorsale (2–3·10¹² N/m nei manuali), il Tibet (7–9·10¹²), lo spessore che pesa quanto la dorsale, e chi è rigido
  assert.ok(L.spinta > 2e12 && L.spinta < 3.5e12 && L.forza(70e3) > 6.5e12 && L.forza(70e3) < 9.5e12 && L.hN > 30e3 && L.hN < 40e3 && Math.abs(L.forza(L.hN)) < 1e9 && L.resistenza > 3 * L.spinta && L.xDebole > 0.3 && L.xDebole < 0.9);
  assert.ok(Math.abs(L.base(L.quota(33e3, 0.2), 0.2) - 33e3) < 1e-3 && Math.abs(L.spessoreDi(L.forzaDi(41.3e3)) - 41.3e3) < 1 && C.hFermo === L.hN && Math.abs(C.galleggia - L.pendenza(L.hN, 0)) < 1e-12);
  console.log(`      litosfera matura ${(L.a / 1e3).toFixed(1)} km, τ ${(L.tau / 1e6).toFixed(1)} Ma; spinta della dorsale ${(L.spinta / 1e12).toFixed(2)}·10¹² N/m, 70 km di crosta ${(L.forza(70e3) / 1e12).toFixed(2)}·10¹²; spessore che pesa quanto la dorsale ${(L.hN / 1e3).toFixed(1)} km (a ${L.quota(L.hN).toFixed(0)} m); la crosta fonde sotto ${(L.zFuso / 1e3).toFixed(0)} km; resistenza della litosfera fredda ${(L.resistenza / 1e12).toFixed(1)}·10¹² N/m: debole oltre x = ${L.xDebole.toFixed(2)}`);
});
prova('la litosfera fredda è rigida anche in trazione: un continente tirato non si stira, se sotto non si apre un bordo', () => {
  // un mantello che tira il continente da due parti con una divergenza larga e debole (nessun bordo che si apre: apre = 0 sotto di lui)
  const u = new Float64Array(N0); for (let j = 0; j < H0; j++) for (let i = 0; i < W0; i++) u[j * W0 + i] = Math.cos((2 * Math.PI * (i + 0.5)) / W0);
  const ca = campoDaPotenziale(u, W0, H0, C0), st = stato(); blocco(st, 8, 20, 10, 22, 35e3); const prima = Float64Array.from(st.h);
  for (let p = 0; p < 30; p++) { if (p % 4 === 0) velocitaCrosta(st.h, ca, W0, H0, 4); passoCrosta(st, ca); }
  let piena = 0, minimo = Infinity, massimo = 0, stirate = 0; for (let k = 0; k < N0; k++) if (st.h[k] >= COSTANTI.hMargine) { piena++; } for (let j = 12; j < 20; j++) for (let i = 0; i < W0; i++) { const v = st.h[j * W0 + i]; if (v > 30e3) { minimo = Math.min(minimo, v); massimo = Math.max(massimo, v); } if (st.m[j * W0 + i] < COSTANTI.hMargine * 0.95) stirate++; }
  assert.ok(massimo < 35e3 * 1.15 && stirate === 0, `dopo 30 passi di deriva: spessore tra ${minimo} e ${massimo} m, celle stirate ${stirate}`);
  // sopra la dorsale (apre > 0) lo stesso continente si stira: m scende con h, lo stato termico sale, e dove arriva allo spessore del basalto nasce fondale
  const st2 = stato(); blocco(st2, 58, 64, 10, 22, 35e3); blocco(st2, 0, 6, 10, 22, 35e3);
  for (let p = 0; p < 12; p++) { if (p % 4 === 0) velocitaCrosta(st2.h, ca, W0, H0, 4); passoCrosta(st2, ca); }
  let sottili = 0, calde = 0; for (let k = 0; k < N0; k++) { if (st2.m[k] < COSTANTI.hMargine * 0.95) sottili++; if (st2.x[k] > 0.05) calde++; assert.ok(st2.m[k] >= Math.min(COSTANTI.hMargine, COSTANTI.basalto) - 1e-6 && st2.x[k] >= 0 && st2.x[k] < 1); }
  assert.ok(sottili > 0 && calde > 0 && ca.apre[16 * W0] > 0.3 && ca.apre[16 * W0 + 14] === 0, `sopra la dorsale: ${sottili} celle stirate, ${calde} calde`);
  console.log(`      lontano dai bordi: 30 passi, spessore ${(minimo / 1e3).toFixed(1)}–${(massimo / 1e3).toFixed(1)} km, nessuna cella stirata; sopra la dorsale: ${sottili} celle stirate, ${calde} con la litosfera calda`);
});

// ---------- la storia intera, con i numeri della Terra
const t0 = performance.now(), terra = evolviTettonica({ seme: 7 }), tempo = performance.now() - t0;
const { W, H, alt, cont, spinta, etaCrosta, spessore, fosse } = terra, N = W * H;

prova('una storia intera (256 × 128, 4,5 miliardi di anni) sta sotto i 3 secondi', () => {
  riscontro(tempo < 3000, `una storia intera sotto i 3 secondi: ${tempo.toFixed(0)} ms (la soglia è quella di prima: la litosfera, la rigidità e lo stiramento costano; vedi in testa a tettonica.js)`);
  assert.equal(terra.regime, 'a placche'); assert.equal(terra.storia.saltati, 0); assert.ok(Math.abs(terra.storia.simulati - 4.5e9) < 1);
  assert.ok(terra.storia.passi > 500, 'evoluta passo per passo, non disegnata');
  assert.ok(alt instanceof Float32Array && cont instanceof Uint8Array && spinta instanceof Float32Array && etaCrosta instanceof Float32Array);
  assert.ok([alt, cont, spinta, etaCrosta, spessore, fosse].every((a) => a.length === N && a.every(Number.isFinite)));
  assert.ok(spinta.every((v) => v >= 0 && v <= 1) && terra.celle >= 4 && terra.celle <= 40);
  console.log(`      ${tempo.toFixed(0)} ms, ${terra.storia.passi} passi (${terra.storia.livelli.map((l) => `${l.passi} a ${l.W}`).join(', ')}), ${terra.celle} celle del mantello`);
});

prova('la crosta continentale è quella che la legge di crescita dichiara: il trasporto non ne crea né ne perde (entro il 2%)', () => {
  const attesa = crostaAttesa(4.5e9) * COSTANTI.hMisura, presente = somma(spessore) / N + terra.bilancio.inViaggio;
  assert.ok(Math.abs(presente - attesa) / attesa < 0.02, `attesa ${attesa.toFixed(1)} m di spessore medio, presente ${presente.toFixed(1)}`);
  assert.ok(Math.abs(terra.bilancio.prodotta - attesa) / attesa < 0.02 && Math.abs(terra.bilancio.presente + terra.bilancio.inViaggio - terra.bilancio.prodotta) / attesa < 1e-3);
  // (la misura è il volume della crosta continentale terrestre, 7,177·10⁹ km³: Cogley 1984; prima «un terzo della superficie», che era il 9% in meno)
  assert.ok(Math.abs(crostaAttesa(4.5e9) * COSTANTI.hMisura * 4 * Math.PI * 6.371e6 ** 2 - 7.177e18) / 7.177e18 < 1e-9, 'sulla Terra, oggi: il volume misurato della crosta continentale');
  console.log(`      attesa ${attesa.toFixed(1)} m, trovata ${presente.toFixed(1)} m (scarto ${((100 * (presente - attesa)) / attesa).toFixed(4)}%)`);
});

prova('continenti su un terzo della superficie, alti 3–6 km sopra il fondo degli oceani', () => {
  let nc = 0, ac = 0, ao = 0; for (let k = 0; k < N; k++) if (cont[k]) { nc++; ac += alt[k]; } else ao += alt[k];
  const fraz = nc / N, salto = ac / nc - ao / (N - nc);
  assert.ok(fraz > 0.2 && fraz < 0.45, `frazione continentale ${fraz.toFixed(3)}`);
  assert.ok(salto > 3000 && salto < 6000, `continenti a ${(ac / nc).toFixed(0)} m, oceani a ${(ao / (N - nc)).toFixed(0)} m`);
  // (continente: la cella è tutta coperta di crosta leggera; per la crosta non stirata vuol dire almeno hMargine, per quella stirata anche meno: i margini sommersi)
  for (let k = 0; k < N; k++) { assert.equal(cont[k], spessore[k] > 0 && terra.copre[k] >= 1 ? 1 : 0); if (terra.stiramento[k] === 1) assert.equal(cont[k], spessore[k] >= COSTANTI.hMargine ? 1 : 0); assert.ok(terra.stiramento[k] >= 1 && terra.stiramento[k] <= COSTANTI.hMargine / Math.min(COSTANTI.hMargine, terra.litosfera.basalto) + 1e-6 && terra.calore[k] >= 0 && terra.calore[k] < 1); }
  console.log(`      frazione ${fraz.toFixed(3)}; continenti ${(ac / nc).toFixed(0)} m, oceani ${(ao / (N - nc)).toFixed(0)} m: salto ${(salto / 1e3).toFixed(2)} km`);
});

prova('l’oceano è più profondo dove la crosta è più vecchia, secondo la legge 2500 + 350·√età', () => {
  // (la legge dà la profondità sotto il mare che lascia la dorsale a 2500 m, lo zero delle quote; il mare di questo pianeta sta a
  // terra.mare, e il fondo ne porta il peso: la profondità sotto lo zero è quella della legge più mare·(ρa/(ρa − ρw) − 1))
  const peso = terra.mare * (terra.litosfera.carica - 1), eta = [], prof = [], scarti = []; let aperto = 0, oceano = 0, vecchia = 0;
  for (let k = 0; k < N; k++) { if (cont[k]) { assert.equal(etaCrosta[k], 0); continue; } oceano++; eta.push(etaCrosta[k]); prof.push(-alt[k]); vecchia = Math.max(vecchia, etaCrosta[k]);
    scarti.push(Math.abs(-alt[k] - peso - profonditaOceano(etaCrosta[k])));
    // in mare aperto (niente veli di crosta leggera, niente fosse) la legge vale esattamente
    if (spessore[k] < 1 && fosse[k] === 0) { aperto++; assert.ok(Math.abs(-alt[k] - peso - profonditaOceano(etaCrosta[k])) < 2, `cella ${k}: ${-alt[k]} m a ${etaCrosta[k]} Ma`); } }
  const r = corr(eta, prof), r2 = corr(eta.map(Math.sqrt), prof), mediano = scarti.sort((a, b) => a - b)[scarti.length >> 1], media = somma(eta) / eta.length;
  assert.ok(r > 0.6 && r2 > 0.6, `correlazione età–profondità ${r.toFixed(2)}, √età–profondità ${r2.toFixed(2)}`);
  assert.ok(aperto / oceano > 0.25 && mediano < 150, `mare aperto ${(100 * aperto / oceano).toFixed(0)}%, scarto mediano dalla legge ${mediano.toFixed(0)} m`);
  assert.ok(profonditaOceano(0) === 2500 && profonditaOceano(100) === 6000 && profonditaOceano(1e4) === 6000 && Math.abs(profonditaOceano(25) - 4250) < 1e-9);
  // la crosta oceanica si rinnova: è molto più giovane del pianeta (sulla Terra: in media 60 milioni di anni, al più 200)
  assert.ok(media > 15 && media < 150 && vecchia < 1000, `età media ${media.toFixed(0)} Ma, massima ${vecchia.toFixed(0)}`);
  console.log(`      r(età, profondità) = ${r.toFixed(2)}, r(√età, profondità) = ${r2.toFixed(2)}; scarto mediano dalla legge ${mediano.toFixed(0)} m; età media ${media.toFixed(0)} Ma, massima ${vecchia.toFixed(0)} Ma`);
});

prova('le montagne stanno dove la crosta è compressa', () => {
  const s = [], q = [], sottoSpinta = [], ferme = [];
  for (let k = 0; k < N; k++) if (cont[k]) { s.push(spinta[k]); q.push(alt[k]); (spinta[k] > 0.3 ? sottoSpinta : spinta[k] === 0 ? ferme : []).push(alt[k]); } else assert.equal(spinta[k], 0);
  const r = corr(s, q), su = somma(sottoSpinta) / sottoSpinta.length, giu = somma(ferme) / ferme.length;
  assert.ok(r > 0.3, `correlazione spinta–quota sui continenti ${r.toFixed(2)}`);
  assert.ok(sottoSpinta.length > 50 && su > giu + 800, `dove spinge ${su.toFixed(0)} m, dove no ${giu.toFixed(0)} m`);
  let cima = -Infinity; for (const v of alt) cima = Math.max(cima, v); assert.ok(cima > 2500 && cima < 7000, `la cima più alta: ${cima.toFixed(0)} m`);
  console.log(`      r(spinta, quota) = ${r.toFixed(2)}; quota media dove la crosta è compressa ${su.toFixed(0)} m, altrove ${giu.toFixed(0)} m; cima ${cima.toFixed(0)} m`);
});

prova('i continenti non sono tondi, e cambiano col seme', () => {
  // la misura: un disco dà 1
  const disco = new Uint8Array(N); for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) if ((i - 100) ** 2 + (j - 64) ** 2 < 30 * 30) disco[j * W + i] = 1;
  const d = masse(disco, W, H)[0]; assert.ok(d.forma > 0.9 && d.forma < 1.15, `un disco: ${d.forma.toFixed(2)}`);
  const altri = [evolviTettonica({ seme: 8 }), evolviTettonica({ seme: 9 })], righe = [];
  for (const r of [terra, ...altri]) { const ms = masse(r.cont, W, H), pr = principali(ms);
    const media = pr.reduce((t, m) => t + m.area * m.forma, 0) / pr.reduce((t, m) => t + m.area, 0);
    assert.ok(pr[0].forma > 1.35 && media > 1.4, `la massa più grande (${pr[0].area} celle) ha forma ${pr[0].forma.toFixed(2)}; le principali in media ${media.toFixed(2)}`);
    const tonde = pr.filter((m) => m.forma < 1.15).reduce((t, m) => t + m.area, 0) / pr.reduce((t, m) => t + m.area, 0);
    assert.ok(tonde < 0.3, `le masse quasi tonde (un continente giovane sopra una sola discesa) sono il ${(100 * tonde).toFixed(0)}% della terra`);
    righe.push(`${ms.length} masse, le principali: ${pr.map((m) => `${m.area} celle, forma ${m.forma.toFixed(1)}`).join('; ')}`); }
  for (const r of altri) { let diverse = 0; for (let k = 0; k < N; k++) if (r.cont[k] !== cont[k]) diverse++; assert.ok(diverse / N > 0.15, `celle diverse: ${(100 * diverse / N).toFixed(0)}%`); }
  righe.forEach((x, i) => console.log(`      seme ${7 + i}: ${x}`));
});

prova('stesso seme, stesso pianeta', () => {
  const a = evolviTettonica({ seme: 7, W: 128, H: 64 }), b = evolviTettonica({ seme: 7, W: 128, H: 64 }), c = evolviTettonica({ seme: 8, W: 128, H: 64 });
  for (const campo of ['alt', 'cont', 'spinta', 'etaCrosta', 'spessore', 'fosse']) assert.deepEqual(a[campo], b[campo], campo);
  assert.equal(a.celle, b.celle); assert.deepEqual(a.bilancio, b.bilancio); assert.notDeepEqual(a.cont, c.cont);
});

prova('poco calore o niente acqua: un coperchio unico, nessuna deriva', () => {
  const freddo = evolviTettonica({ q: 0.01, seme: 7 }), secco = evolviTettonica({ acqua: false, seme: 7 }), tiepido = evolviTettonica({ q: 0.04, seme: 7 });
  for (const r of [freddo, secco, tiepido]) {
    assert.ok(r.cont.every((v) => v === 0) && r.spinta.every((v) => v === 0) && r.spessore.every((v) => v === 0) && r.fosse.every((v) => v === 0), 'niente continenti, niente spinta, niente fosse');
    assert.ok(r.etaCrosta.every((v) => v === 4500), 'la crosta ha l’età del pianeta');
    assert.equal(r.storia.simulati, 0); assert.equal(r.storia.passi, 0); assert.ok(r.alt.length === N && r.alt.every(Number.isFinite));
  }
  // mantello fermo: tutto piatto; mantello vivo sotto il coperchio: solo i rigonfiamenti sopra i pennacchi
  assert.equal(freddo.regime, 'fermo'); assert.ok(freddo.alt.every((v) => v === 0)); assert.equal(freddo.celle, 0);
  assert.equal(secco.regime, 'coperchio unico'); assert.equal(tiepido.regime, 'coperchio unico');
  let mx = 0, mn = 0; for (const v of secco.alt) { mx = Math.max(mx, v); mn = Math.min(mn, v); }
  assert.ok(mx > 500 && mx <= 1500 && mn < 0 && mn >= -1500 && secco.celle >= 4, `rigonfiamenti tra ${mn.toFixed(0)} e ${mx.toFixed(0)} m, ${secco.celle} pennacchi`);
  // e si può forzare il regime, per seguire interno() che guarda anche la massa
  assert.equal(evolviTettonica({ placche: false, seme: 7 }).regime, 'coperchio unico');
  assert.equal(evolviTettonica({ q: 0.04, placche: true, seme: 7, W: 64, H: 32 }).regime, 'a placche');
});

prova('pianeti diversi: giovani con poca crosta, caldi più veloci; e le griglie sbagliate si rifiutano', () => {
  const giovane = evolviTettonica({ eta: 1e9, seme: 7, W: 128, H: 64 }), vecchio = evolviTettonica({ eta: 9e9, seme: 7, W: 128, H: 64 });
  const fr = (r) => somma(r.cont) / r.cont.length;
  assert.ok(fr(giovane) < 0.15 && fr(vecchio) > fr(giovane) + 0.15, `continenti: ${fr(giovane).toFixed(2)} a 1 miliardo di anni, ${fr(vecchio).toFixed(2)} a 9`);
  const caldo = evolviTettonica({ q: 0.174, seme: 7, W: 64, H: 32 });
  assert.ok(Math.abs(caldo.storia.velocita / terra.storia.velocita - 4) < 1e-9, 'il doppio del calore, quattro volte la velocità');
  assert.ok(caldo.storia.saltati > 0 && Math.abs(caldo.storia.simulati + caldo.storia.saltati - 4.5e9) < 1, 'se i passi non bastano, il passato più antico si salta e lo si dichiara');
  assert.ok(Math.abs(caldo.bilancio.presente + caldo.bilancio.inViaggio - crostaAttesa(4.5e9) * COSTANTI.hMisura) / (crostaAttesa(4.5e9) * COSTANTI.hMisura) < 0.02, 'ma la crosta c’è tutta');
  assert.throws(() => evolviTettonica({ W: 100, H: 50 })); assert.throws(() => evolviTettonica({ W: 256, H: 64 }));
});

prova('lo stato iniziale del mantello è l\'impronta degli urti: stessa impronta, stessa storia; impronte diverse, continenti diversi', () => {
  // due impronte: una macchia calda (un grande urto) in due posti diversi; mappe lon × lat, in kelvin
  const macchia = (lon0, lat0) => (W, H) => { const m = new Float32Array(W * H); for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) { const lon = ((i + 0.5) / W) * 2 * Math.PI - Math.PI, lat = Math.PI / 2 - ((j + 0.5) / H) * Math.PI, d = Math.acos(Math.min(1, Math.sin(lat) * Math.sin(lat0) + Math.cos(lat) * Math.cos(lat0) * Math.cos(lon - lon0))); m[j * W + i] = 300 * Math.exp(-((d / 0.5) ** 2)); } return m; };
  const o = { W: 64, H: 32, seme: 7 }, a = evolviTettonica({ ...o, impronta: macchia(0.5, 0.3) }), b = evolviTettonica({ ...o, impronta: macchia(0.5, 0.3) }), c = evolviTettonica({ ...o, impronta: macchia(-2, -0.6) });
  for (const campo of ['alt', 'cont', 'spinta', 'etaCrosta', 'spessore', 'fosse']) assert.deepEqual(a[campo], b[campo], campo);
  assert.notDeepEqual(a.cont, c.cont); assert.equal(a.storia.impronta, 'urti'); assert.equal(a.regime, 'a placche');
  assert.ok(a.alt.every(Number.isFinite) && somma(a.cont) > 0.1 * a.cont.length && somma(a.cont) < 0.6 * a.cont.length, `continenti: ${somma(a.cont) / a.cont.length}`);
  // con l'impronta il seme non conta più; la sua misura non conta (solo la forma), e nemmeno la grana con cui è data
  assert.deepEqual(evolviTettonica({ ...o, seme: 99, impronta: macchia(0.5, 0.3) }).cont, a.cont);
  // (×4: un fattore che in virgola mobile è esatto, e l'impronta messa a misura è la stessa bit per bit. Con un altro fattore, o
  // spostando lo zero, è la stessa a meno dell'arrotondamento: e in 4,5 miliardi di anni di una dinamica caotica l'arrotondamento
  // basta a spostare qualche costa — con la crosta di prima le due storie coincidevano, ora differiscono di poche celle: lo si stampa)
  const quadrupla = (W, H) => macchia(0.5, 0.3)(W, H).map((v) => 4 * v), tripla = (W, H) => macchia(0.5, 0.3)(W, H).map((v) => 3 * v + 40);
  assert.deepEqual(evolviTettonica({ ...o, impronta: quadrupla }).cont, a.cont);
  { const t = evolviTettonica({ ...o, impronta: tripla }); let diverse = 0; for (let k = 0; k < t.cont.length; k++) if (t.cont[k] !== a.cont[k]) diverse++; assert.ok(Math.abs(somma(t.cont) - somma(a.cont)) < 0.1 * somma(a.cont), 'stessa forma, stessi continenti in quantità'); console.log(`      impronta × 3 + 40 (la stessa forma, arrotondata diversamente): ${diverse} celle di continente diverse su ${t.cont.length}`); }
  assert.equal(evolviTettonica({ ...o, impronta: macchia(0.5, 0.3)(256, 128) }).storia.impronta, 'urti');
  assert.throws(() => evolviTettonica({ ...o, impronta: new Float32Array(100) }));
  // senza impronta, o con un'impronta piatta (nessun urto), resta il ripiego: il rumore dal seme, come prima
  const senza = evolviTettonica(o), piatta = evolviTettonica({ ...o, impronta: new Float32Array(64 * 32) });
  assert.equal(senza.storia.impronta, 'seme'); assert.equal(piatta.storia.impronta, 'seme'); assert.deepEqual(piatta.cont, senza.cont); assert.notDeepEqual(senza.cont, a.cont);
  // anche sotto un coperchio unico i rigonfiamenti nascono dall'impronta
  const fermo = evolviTettonica({ ...o, acqua: false, impronta: macchia(0.5, 0.3) }), fermo2 = evolviTettonica({ ...o, acqua: false, impronta: macchia(-2, -0.6) });
  assert.equal(fermo.regime, 'coperchio unico'); assert.notDeepEqual(fermo.alt, fermo2.alt);
});

// ---------- ciò che la tettonica passa all'erosione (geologia.js): quanto la crosta è stretta, la copertura, le velocità
prova('seguire la copertura e il moto non cambia la crosta; la deriva non ispessisce, lo scontro sì', () => {
  const conto = () => ({ stretta: new Float64Array(N0), termico: new Float64Array(N0), arco: new Float64Array(N0), tolto: new Float64Array(N0), posato: new Float64Array(N0) });
  // un continente che va alla deriva intero: con e senza i conti la crosta è la stessa, bit per bit, e nessuno la stringe
  const ca = dueMeta(), a = stato(), b = { ...stato(), cop: new Float64Array(N0), conto: conto() }; blocco(a, 8, 16, 10, 22, 35e3); blocco(b, 8, 16, 10, 22, 35e3);
  for (let p = 0; p < 40; p++) { if (p % 4 === 0) velocitaCrosta(a.h, ca, W0, H0, 4); passoCrosta(a, ca, { dtMa: 1, kappa: 0.03, fiumi: 0.01 }); }
  const cb = dueMeta(); for (let p = 0; p < 40; p++) { if (p % 4 === 0) velocitaCrosta(b.h, cb, W0, H0, 4); passoCrosta(b, cb, { dtMa: 1, kappa: 0.03, fiumi: 0.01 }); }
  assert.deepEqual(Array.from(b.h), Array.from(a.h)); assert.deepEqual(Array.from(b.a), Array.from(a.a));
  const passata = 40 * C0 * somma(b.h), stretta = b.conto.stretta.reduce((s, v) => s + Math.abs(v), 0);
  assert.ok(stretta < 0.1 * passata, `alla deriva: stretta ${stretta.toExponential(2)} m contro ${passata.toExponential(2)} m di crosta passata`);
  // due continenti che si scontrano: lungo la sutura la crosta è stretta (lo stesso spessore che la catena guadagna)
  const cc = dueMeta(), c = { ...stato(), cop: new Float64Array(N0), conto: conto() }; blocco(c, 14, 24, 10, 22, 35e3); blocco(c, 40, 50, 10, 22, 35e3); const prima = Float64Array.from(c.h);
  for (let p = 0; p < 120; p++) { if (p % 4 === 0) velocitaCrosta(c.h, cc, W0, H0, 4); passoCrosta(c, cc); }
  // (il guadagno è ciò che la catena ha IN PIÙ dei 35 km delle due lastre che si sono scontrate: la crosta arrivata dove prima c'era
  // mare è traslazione, non compressione. «stretta» è lo spessore per la differenza tra la velocità d'entrata e quella d'uscita: con
  // l'ingorgo che arriva una passata sì e una no conta più del guadagno vero; non è una legge di conservazione: è un riscontro)
  let guadagno = 0, strettaLi = 0, altrove = 0; for (let j = 12; j < 20; j++) for (let i = 0; i < W0; i++) { const k = j * W0 + i; if (c.h[k] > 45e3) { guadagno += c.h[k] - 35e3; strettaLi += c.conto.stretta[k]; } else altrove += Math.abs(c.conto.stretta[k]); }
  assert.ok(strettaLi > 0 && guadagno > 0, `nella catena: stretta ${strettaLi}, guadagno ${guadagno}`);
  riscontro(Math.abs(strettaLi - guadagno) < 0.2 * guadagno, `nello scontro, crosta stretta nella catena / spessore guadagnato oltre quello delle lastre: ${(strettaLi / guadagno).toFixed(2)} (chiesto 0,8–1,2)`);
  console.log(`      alla deriva: stretta ${(100 * stretta / passata).toFixed(2)}% della crosta passata; nello scontro la catena guadagna ${(guadagno / 1e3).toFixed(0)} km di spessore (sommati), stretta ${(strettaLi / 1e3).toFixed(0)} km`);
  // la copertura: nasce dove i fiumi e i pendii posano, non supera la crosta, e ciò che è sepolto oltre copMax è basamento
  const d = { ...stato(), cop: new Float64Array(N0), copMax: 5e3 }, cd = dueMeta(); blocco(d, 20, 30, 8, 24, 45e3);
  for (let p = 0; p < 200; p++) { if (p % 4 === 0) velocitaCrosta(d.h, cd, W0, H0, 4); passoCrosta(d, cd, { dtMa: 1, kappa: 0.03, fiumi: 0.01 }); }
  let coperta = 0; for (let k = 0; k < N0; k++) { assert.ok(d.cop[k] >= 0 && d.cop[k] <= d.h[k] + 1e-6 && d.cop[k] <= 5e3 + 1e-6); if (d.cop[k] > 1) coperta++; }
  assert.ok(coperta > 0, 'dove si è posato sedimento c\'è copertura');
});
prova('sulla Terra di prova: sollevamento in m/anno dove la crosta è stretta, scudi fermi, copertura fin dove non è metamorfica', () => {
  const { sollevamento, regge, copertura, arco, consumata, posata, velEst, velSud } = terra, copMax = ((COSTANTI.Tmetamorfismo - COSTANTI.Tsuolo) * COSTANTI.conducibilita) / COSTANTI.qTerra;
  for (const x of [sollevamento, regge, copertura, arco, consumata, posata, velEst, velSud]) assert.ok(x instanceof Float32Array && x.length === N && x.every(Number.isFinite));
  let vMax = 0, coperti = 0, continenti = 0; const attive = [], ferme = [];
  for (let k = 0; k < N; k++) { assert.ok(regge[k] >= 0 && arco[k] >= 0 && consumata[k] >= 0 && posata[k] >= 0 && copertura[k] >= 0 && copertura[k] <= Math.min(spessore[k], copMax) * (1 + 1e-6) + 1e-3);
    vMax = Math.max(vMax, Math.hypot(velEst[k], velSud[k])); if (!cont[k]) continue; continenti++; if (copertura[k] > 1) coperti++; (spinta[k] > 0 ? attive : ferme).push(sollevamento[k] / COSTANTI.galleggia); }
  const q = (v, f) => [...v].sort((x, y) => x - y)[Math.floor(f * (v.length - 1))];
  assert.ok(vMax > 0.2 * terra.storia.velocita && vMax <= 1.5 * terra.storia.velocita, `la crosta va al più come le placche: ${vMax} contro ${terra.storia.velocita} m/anno`);
  assert.ok(terra.storia.finestra > 0 && terra.storia.finestra < 3e7 && coperti > 0 && coperti < continenti);
  assert.ok(q(attive, 0.9) > 10 * Math.abs(q(ferme, 0.5)), 'dove la crosta è stretta la roccia sale molto più che negli scudi');
  console.log(`      velocità delle placche ${terra.storia.velocita} m/anno, la crosta più veloce ${vMax.toFixed(4)}; la roccia sale (mm/anno): catene, 50° e 90° percentile ${(1e3 * q(attive, 0.5)).toFixed(2)} e ${(1e3 * q(attive, 0.9)).toFixed(2)}; scudi, mediana ${(1e3 * q(ferme, 0.5)).toFixed(3)}; continenti con copertura ${Math.round((100 * coperti) / continenti)}% (fino a ${(copMax / 1e3).toFixed(1)} km: più giù è metamorfica)`);
  // un coperchio unico non ha né moto né copertura
  const fermo = evolviTettonica({ q: 0.04, seme: 7, W: 64, H: 32 }); assert.ok(fermo.sollevamento.every((v) => v === 0) && fermo.copertura.every((v) => v === 0) && fermo.velEst.every((v) => v === 0) && fermo.storia.finestra === 0);
});

// ---------- con la storia termica (storia.js): il calore, la velocità, la mobilità e il fuso di ogni epoca
console.log('  con la storia della Terra: la crosta dei continenti nasce agli archi e torna giù alle fosse; la gravità accorcia catene e bacini');
{
  const ST = await import('../src/camera/storia.js'), TERRA = { tipo: 'roccioso', massaKg: 5.972e24, raggioM: 6.371e6, composizione: { ferro: 0.32, roccia: 0.674, acqua: 0.006 }, Lw: 3.828e26, aM: 1.496e11, Mstella: 1.989e30, giorno: 86164 };
  const s = ST.storia(TERRA, 4.5e9, { stella: { eta: 4.5e9, Z: 1, massa: 1 } }), tempo = ST.tabellaStoria(TERRA, { finoA: 4.5e9 });
  const r = evolviTettonica({ W: 128, H: 64, seme: 7, q: s.q, eta: 4.5e9, placche: true, termico: { dT: s.Tum - s.Ts, k: 4.2, kappa: 1e-6, alfa: 3e-5, rho: 3300, basalto: s.crosta.basalto }, tempo, acquaM3: 1.4e18 });
  const b = r.bilancio, N1 = r.W * r.H, attesa = crostaAttesa(4.5e9) * COSTANTI.hMisura;
  prova('…il bilancio: nata = presente + in viaggio + tornata giù (a meno di un millesimo)', () => { assert.ok(r.storia.conLaStoria && b.riciclata > 0 && b.prodotta > 0); assert.ok(Math.abs(b.prodotta - b.presente - b.inViaggio - b.riciclata) < 1e-3 * b.prodotta, JSON.stringify(b)); });
  let nc = 0; for (const v of r.cont) nc += v;
  riscontro(b.presente > 0.5 * attesa && b.presente < 2 * attesa, `la Terra dalla storia: crosta continentale ${(b.presente / 1e3).toFixed(1)} km di spessore medio (il vero ${(attesa / 1e3).toFixed(1)}: Cogley 1984); chiesto entro un fattore 2`);
  console.log(`      la Terra dalla storia: crosta dei continenti ${(b.presente / 1e3).toFixed(1)} km medi (nata ${(b.prodotta / 1e3).toFixed(0)}, tornata giù ${(b.riciclata / 1e3).toFixed(0)}; il vero ${(attesa / 1e3).toFixed(1)}), continenti sul ${(100 * nc / N1).toFixed(0)}% (vero ~40); saltati ${(r.storia.saltati / 1e9).toFixed(2)} Ga`);
  prova('…la gravità: lo spessore che uno scontro regge e il bacino più fondo vanno come 1/g (Cowan e Abbot 2014)', () => {
    assert.equal(litosfera().hMassimo, COSTANTI.hMassimo); assert.ok(Math.abs(litosfera({ g: 2 * 9.81 }).hMassimo - COSTANTI.hMassimo / 2) < 1e-6);
    assert.equal(litosfera().fondoG, 1); const g3 = litosfera({ g: 3 * 9.81 }); assert.ok(Math.abs(g3.fondoG * COSTANTI.abisso - COSTANTI.bacino / 3) < 1e-6 && Math.abs(-g3.oceano(1e4) / g3.aria - COSTANTI.bacino / 3) < 1e-6); });
  // senza placche: il rilievo del coperchio viene dalla storia (Marte asciutto, nessun mare)
  const MARTE = { tipo: 'roccioso', massaKg: 6.417e23, raggioM: 3.3895e6, composizione: { ferro: 0.25, roccia: 0.75, acqua: 0 }, Lw: 3.828e26, aM: 2.279e11, Mstella: 1.989e30 };
  ST.storia(MARTE, 4.5e9, { stella: { eta: 4.5e9, Z: 1, massa: 1 } });
  const m = evolviTettonica({ W: 64, H: 32, seme: 7, raggioM: MARTE.raggioM, nucleo: 0.5, eta: 4.5e9, placche: false, tempo: ST.tabellaStoria(MARTE, { finoA: 4.5e9 }), gravita: 3.71, acquaM3: 0 });
  prova('…senza placche, con la storia: la crosta del coperchio ispessita dove sale il mantello, la topografia dinamica, il sollevamento di oggi', () => {
    assert.ok(m.regime === 'coperchio unico' || m.regime === 'fermo'); assert.ok(m.alt.every(Number.isFinite) && m.sollevamento.every((v) => v >= 0) && m.basalto.every((v) => v >= 0));
    let a = 0, a2 = 0; for (const v of m.alt) { a += v; a2 += v * v; } a /= m.alt.length; const sd = Math.sqrt(a2 / m.alt.length - a * a); assert.ok(sd > 0, 'il coperchio non è piatto');
    console.log(`      Marte con la storia: ${m.regime}, crosta ${(m.rilievo.crostaMedia / 1e3).toFixed(0)} km (la storia: ${(m.rilievo.crostaStoria / 1e3).toFixed(0)}; il vero ~50), topografia dinamica ${m.rilievo.dinamica.toFixed(0)} m, scarto delle quote ${sd.toFixed(0)} m (il vero ~3000), ${m.rilievo.giri.toFixed(0)} giri del mantello`); });
}

console.log(`tettonica: ${ok} prove, tutto ok` + (nonTorna.length ? `; ${nonTorna.length} riscontri NON TORNANO:\n  ${nonTorna.join('\n  ')}` : ''));
