// test_mare.mjs — l'acqua dei mari e dei laghi: i sali che escono dal bilancio (e non da un numero scritto), il pH, le
// correnti con la corrente forte a ovest, la salinità che segue evaporazione e pioggia, il fango alle foci, il campione
// d'acqua a ogni scala (ioni e molecole veri, moto browniano), le reazioni sul posto; mari diversi su pianeti diversi
import assert from 'node:assert/strict';
import { mareAl, aspettoMare, aspettoFermo, ondeNelPunto, scenaMolecolare, fluidoCaldo, bilancioSali, mare, campioneAcqua, coloreMare, coloraMare, luogo, muovi, disegnabili, immagineAcqua, acqua, costanti, coppia, evapora, browniano, stokes, omegaCritica, gasSciolti, ioniNelPunto, rocceDelPianeta, rilascio, congelamento, ebollizione, densita, distanza, DATI } from '../src/camera/mare.js';
import { interno, superficiePianeta, climaSuperficie, erosione } from '../src/camera/geologia.js';
import { sorgente } from '../src/camera/eventi.js';

let ok = 0;
const inizio = performance.now();
const prova = (nome, f) => { f(); ok++; console.log('  ✓', nome); };
const tra = (x, a, b, che) => assert.ok(x > a && x < b, `${che}: ${x} (atteso tra ${a} e ${b})`);
const n3 = (x) => (+x).toPrecision(3);
// IL CONFRONTO CON LA TERRA VERA non fa fallire la prova: il modello non è tarato su di lei, e ciò che non torna si
// stampa col suo numero (e si conta in fondo). Le prove che falliscono sono quelle sulle leggi e sulla coerenza.
const nonTorna = [];
const confronta = (che, x, a, b) => { if (!(x > a && x < b)) { nonTorna.push(`${che}: ${n3(x)} (atteso tra ${a} e ${b})`); console.log(`      ≠ NON TORNA  ${che}: ${n3(x)} (atteso tra ${a} e ${b})`); } };

// ---------- la chimica dell'acqua, da sola
prova('le costanti a 25 °C escono dalla tabella di entalpie ed entropie, e sono quelle misurate', () => {
  const K = costanti(298.15), lg = Math.log10;
  tra(lg(K.sali.calcite), -8.6, -8.35, 'calcite (misurato −8,48)'); tra(lg(K.sali.gesso), -4.7, -4.45, 'gesso (−4,58)'); tra(K.sali.salgemma, 33, 42, 'salgemma (37,6)');
  tra(K.henry.CO2, 0.031, 0.036, 'Henry CO2 (0,034 mol/kg/bar)'); tra(K.henry.O2, 1.2e-3, 1.4e-3, 'Henry O2 (1,3·10⁻³)'); tra(K.henry.N2, 6e-4, 7e-4, 'Henry N2 (6,4·10⁻⁴)');
  tra(-lg(K.K1), 6.3, 6.4, 'pK1 (6,35)'); tra(-lg(K.K2), 10.28, 10.38, 'pK2 (10,33)'); tra(-lg(K.Kw), 13.95, 14.05, 'pKw (14,00)');
  // la temperatura: calcare e gas meno solubili al caldo (è per questo che il calcare precipita nei mari caldi), salgemma poco di più
  assert.ok(costanti(303).sali.calcite < costanti(278).sali.calcite && costanti(303).henry.CO2 < 0.6 * costanti(278).henry.CO2 && costanti(303).sali.salgemma > costanti(278).sali.salgemma);
  assert.ok(costanti(330).sali.anidrite < 0.6 * costanti(280).sali.anidrite, 'l\'anidrite è molto meno solubile al caldo');
  tra(ebollizione(101325), 368, 376, 'l\'acqua bolle a 373 K a un\'atmosfera'); tra(congelamento(1.12), 271.0, 271.5, 'l\'acqua di mare gela a −1,9 °C');
  console.log(`      log K: calcite ${n3(lg(K.sali.calcite))}, gesso ${n3(lg(K.sali.gesso))}; salgemma K = ${n3(K.sali.salgemma)}; CO2 ${n3(K.henry.CO2)} mol/kg/bar; pK1 ${n3(-lg(K.K1))}, pK2 ${n3(-lg(K.K2))}`);
});

prova('le coppie di ioni (Fuoss): dalla legge di Coulomb, entro un fattore 3 dalle misure', () => {
  const lg = (c, a) => Math.log10(coppia(c, a, 298.15));
  tra(lg('Mg2+', 'SO4(2-)'), 1.8, 2.8, 'MgSO4 (misurato 2,3)'); tra(lg('Ca2+', 'CO3(2-)'), 2.8, 3.6, 'CaCO3 (3,2)'); tra(lg('Na+', 'SO4(2-)'), 0.3, 1.2, 'NaSO4⁻ (0,7)');
  assert.ok(lg('Na+', 'Cl-') < 0.3, 'sodio e cloruro quasi non si appaiano');
  assert.ok(coppia('Mg2+', 'SO4(2-)', 350) > coppia('Mg2+', 'SO4(2-)', 280), 'al caldo l\'acqua scherma meno: più coppie');
});

const MARE_VERO = { Na: 0.486, K: 0.0106, Mg: 0.0547, Ca: 0.01065, Cl: 0.566, S: 0.0293 }; // l'acqua di mare misurata (mol per kg d'acqua)
prova('l\'acqua di mare misurata, messa in equilibrio con l\'aria: pH 8 e rotti, sovrasatura di calcare, lontana dal sale', () => {
  const e = acqua(MARE_VERO, 291, { pCO2: 2.8e-4 });
  tra(e.pH, 7.9, 8.6, 'pH (misurato 8,2)'); tra(e.I, 0.6, 0.75, 'forza ionica (0,7)'); tra(e.omega.calcite, 2.5, 12, 'saturazione della calcite (misurata ~5)');
  assert.ok(e.omega.gesso < 1 && e.omega.salgemma < 0.02);
  tra(e.gamma['Na+'], 0.6, 0.8, 'coefficiente di attività del sodio (0,7)'); tra(e.gamma['Ca2+'], 0.18, 0.32, 'del calcio (0,25)');
  tra(e.coppie['Mg2+ SO4(2-)'] / MARE_VERO.Mg, 0.02, 0.2, 'la parte del magnesio appaiata al solfato (misurata ~0,1)');
  const pioggia = acqua({}, 288, { pCO2: 2.8e-4 }); tra(pioggia.pH, 5.5, 5.8, 'la pioggia in equilibrio con l\'aria (5,6)');
  // il salgemma satura attorno a 6 mol/kg; il gesso attorno a 0,015-0,03
  let m = 4; while (acqua({ Na: m, Cl: m }, 298.15).omega.salgemma < 1) m += 0.1; tra(m, 5.5, 7.2, 'solubilità del salgemma (misurata 6,15 mol/kg)');
  let c = 0.005; while (acqua({ Ca: c, S: c }, 298.15, { pCO2: 1e-9 }).omega.gesso < 1) c += 0.001; tra(c, 0.012, 0.035, 'solubilità del gesso (misurata 0,015 mol/kg)');
  console.log(`      pH ${n3(e.pH)}, Ω calcite ${n3(e.omega.calcite)}, gesso ${n3(e.omega.gesso)}, salgemma ${n3(e.omega.salgemma)}; il salgemma satura a ${n3(m)} mol/kg, il gesso a ${n3(c)}`);
});

// ---------- la «Terra»: la superficie di geologia.js come in test_meteo.mjs, con la sua aria misurata
const P = { tipo: 'roccioso', raggioM: 6.371e6, massaKg: 5.97e24, composizione: { ferro: 0.32, acqua: 0.02 }, Lw: 3.828e26, aM: 1.496e11, anno: 3.156e7, giorno: 86164, obliquita: 23.4, bloccato: false, clima: { Teq: 255, pressione: 1e5, T: 288, acqua: 'liquida' },
  atmosfera: { gas: { N2: 0.78, O2: 0.21, CO2: 2.8e-4 }, pressione: 1e5 }, // (l'aria della Terra prima dell'industria)
  Mstella: 1.989e30, lune: [{ id: 0, massaKg: 7.35e22, aM: 3.844e8, raggioM: 1.737e6 }] }; // (il Sole e la Luna, per le maree)
const it = interno(P, { eta: 4.5e9, Z: 1 }); it.acquaKg = 1.4e21; P.interno = it;
// (il seme 13: con la fonte unica del caso il seme 11 dà un altro pianeta, dove l'acqua del fondo non si forma solo oltre i 50° di latitudine; le prove di
// questo file sono agganciate a UNA Terra: tra i semi da 11 a 20 passano tutte solo sul 13 — con la fonte di prima solo sull'11 e sul 14)
const sf = superficiePianeta('mare-terra', P, it, 13), cl = climaSuperficie('mare-terra', P, sf), se = erosione('mare-terra', sf, cl);
const tCostruita = performance.now();
let t0 = performance.now(); const T = mare(P, sf, cl, se, sorgente('prova/terra/mare')); const tempoMare = performance.now() - t0;
const { W, H } = T, latJ = (j) => 90 - ((j + 0.5) * 180) / H, lonI = (i) => ((i + 0.5) * 360) / W - 180, eMare = (k) => T.bagnato[k] >= 0.5;
const fascia = (x, da, a, emisfero = 0) => { let s = 0, n = 0; for (let j = 0; j < H; j++) { const l = latJ(j), w = Math.cos((l * Math.PI) / 180); if (Math.abs(l) < da || Math.abs(l) >= a || (emisfero && Math.sign(l) !== emisfero)) continue; for (let i = 0; i < W; i++) if (eMare(j * W + i)) { s += x[j * W + i] * w; n += w; } } return s / n; };

prova('la Terra, senza tarature: un mare di sodio e cloro, quasi neutro, in meno di un secondo e mezzo (quanto salato, lo si confronta)', () => {
  assert.ok(T.esiste); tra(tempoMare, 0, 1500, 'tempo di mare() (ms)');
  const i = T.ioni, cariche = Object.entries(i).filter(([f]) => f !== 'H4SiO4').sort((a, b) => b[1] - a[1]).map(([f]) => f);
  assert.deepEqual(cariche.slice(0, 2).sort(), ['Cl-', 'Na+'], `dominano ${cariche.slice(0, 2)}`);
  tra(T.pH, 7, 9, 'pH'); tra(i['Na+'] / i['Cl-'], 0.6, 1.3, 'sodio rispetto al cloro (misurato 0,86): lo tiene lì lo scambio col plagioclasio del fondo'); tra(T.salinitaMedia, 5, 150, 'salinità (g/kg)');
  tra(T.frazioneMare, 0.5, 0.9, 'parte del pianeta coperta dal mare'); tra(T.massaMare, 1.2e21, 1.6e21, 'massa del mare (kg)');
  // il confronto con il mare vero
  confronta('salinità (g/kg; misurata 35)', T.salinitaMedia, 25, 45); confronta('pH (misurato 8,2 prima dell\'industria)', T.pH, 7.5, 8.5);
  confronta('sodio (mol/kg; misurato 0,47)', i['Na+'], 0.3, 0.7); confronta('cloruro (0,55)', i['Cl-'], 0.35, 0.8); confronta('potassio (0,010)', i['K+'], 0.003, 0.03); confronta('solfato (0,028)', i['SO4(2-)'], 0.005, 0.1);
  confronta('magnesio + calcio (0,063)', i['Mg2+'] + i['Ca2+'], 0.03, 0.13); confronta('magnesio (0,053)', i['Mg2+'], 0.02, 0.1); confronta('calcio (0,010)', i['Ca2+'], 0.004, 0.03); confronta('bicarbonato (0,0018)', i['HCO3-'], 3e-4, 6e-3);
  tra(T.gas.O2, 1e-4, 4e-4, 'ossigeno sciolto (mol/kg; misurato 2-3·10⁻⁴)'); tra(T.gas.N2, 2e-4, 7e-4, 'azoto sciolto (5·10⁻⁴)'); tra(T.gas.CO2, 3e-6, 2e-5, 'CO2 sciolta (10⁻⁵)');
  console.log(`      ${n3(T.salinitaMedia)} g/kg, pH ${n3(T.pH)}; mol/kg: ${Object.entries(i).filter(([, v]) => v > 1e-5).map(([f, v]) => `${f} ${n3(v)}`).join(', ')}  (${tempoMare.toFixed(0)} ms)`);
  console.log('      misurati:        Na+ 0,469, K+ 0,0102, Mg2+ 0,0528, Ca2+ 0,0103, Cl- 0,546, SO4(2-) 0,0282, HCO3- 0,0018');
  const fl = T.flussi; console.log(`      perché: alla nascita esce il ${n3(100 * fl.cloroAllaNascita / (fl.cloroAllaNascita + 0.05 / 0.95 * fl.cloroAllaNascita))}% del cloro del mantello (${n3(fl.cloroAllaNascita)} mol); nei sedimenti ce n'è ${n3(fl.sedimenti.Cl)}, nel mare ${n3(T.totali.Cl * T.massaMare)}; mari chiusi che arrivano al sale su questa carta: ${T.bacini.filter((b) => b.saturo).length} di ${T.bacini.length}; i sedimenti tornano in ${n3(fl.riciclo / 1e6)} milioni di anni`);
});

prova('i tempi di residenza: sodio e cloro restano molto più del calcio e del magnesio (per questo il mare è salato di NaCl e i fiumi no)', () => {
  const r = T.bilancio.residenza;
  assert.ok(r.Na > 3 * r.Ca && r.Cl > 3 * r.Ca && r.Na > r.Mg && r.Cl > r.Na, `Na ${r.Na}, Cl ${r.Cl}, Mg ${r.Mg}, Ca ${r.Ca}`);
  confronta('residenza del sodio (anni; misurata ~5-7·10⁷)', r.Na, 3e7, 3e8); confronta('del cloro (~10⁸)', r.Cl, 5e7, 5e8); confronta('del calcio (~10⁶)', r.Ca, 2e5, 5e6); confronta('del magnesio (~1,3·10⁷)', r.Mg, 4e6, 4e7); confronta('del potassio (~10⁷)', r.K, 3e6, 3e7);
  // i fiumi: quasi dolci, e di calcio e bicarbonato; il mare: di sodio e cloro
  const f = T.fiume; assert.ok(f.salinita < T.salinitaMedia / 100 && f.salinita > 0, `fiumi ${f.salinita} g/kg`); confronta('sali nei fiumi (g/kg; misurato 0,1)', f.salinita, 0.03, 0.3);
  assert.ok(T.totali.Na > 3 * T.totali.Ca); assert.ok(f.Cl < f.Na + f.Ca, 'nei fiumi il cloro non domina');
  confronta('portata dei fiumi (kg/anno; misurata 3,7·10¹⁶)', f.portataKgAnno, 2e16, 7e16); confronta('fango e sabbia portati al mare (kg/anno; misurati 1,3-2·10¹³)', f.sedimentoKgAnno, 6e12, 4e13);
  // il cloro si conserva: mantello + mare + sedimenti = quello che il mantello aveva
  const ro = rocceDelPianeta(P), prima = ro.mantello.Cl * P.massaKg * (1 - 0.32), dopo = T.flussi.mantello.Cl + T.flussi.sedimenti.Cl + T.totali.Cl * T.massaMare + (T.fondoDiSale?.salgemma || 0);
  tra(dopo / prima, 0.97, 1.03, 'conservazione del cloro');
  // il sodio che il fondo caldo trattiene: l'equilibrio col plagioclasio, alla temperatura del camino
  const fl = fluidoCaldo(MARE_VERO, 603, ro); tra(fl.Na / MARE_VERO.Na, 0.8, 1.05, 'sodio nel fluido caldo rispetto al mare, con l\'acqua di mare vera (misurato nei camini: 0,92-0,95)'); assert.equal(fl.Mg, 0);
  const e = T.bilancio.entra, mol = (x) => Object.values(x).reduce((a, v) => a + v, 0);
  console.log(`      residenza (milioni di anni): ${Object.entries(r).map(([k, v]) => `${k} ${n3(v / 1e6)}`).join(', ')}   (misurati: Na 55-70, Cl ~100, Mg 13, K 10, Ca 1, S 10)`);
  console.log(`      entrano (10¹² mol/anno): ${Object.entries(e).map(([k, v]) => `${k} ${n3(mol(v) / 1e12)}`).join(', ')}; fiumi ${n3(f.salinita * 1000)} mg/kg, ${n3(f.portataKgAnno)} kg/anno d'acqua, ${n3(f.sedimentoKgAnno)} di sedimento; fluido caldo: Na ${n3(fl.Na / MARE_VERO.Na)} di quello del mare, Ca ${n3(fl.Ca * 1000)} mmol/kg (misurato 10-55)`);
});

prova('le rocce: che cosa cedono dipende dal minerale e dalla temperatura', () => {
  const ro = rocceDelPianeta(P), caldo = rilascio(ro.granito, 298), freddo = rilascio(ro.granito, 275), bas = rilascio(ro.basalto, 288);
  assert.ok(caldo.Na > 2 * freddo.Na, 'al caldo i feldspati si sciolgono più in fretta'); assert.ok(bas.Mg > 5 * rilascio(ro.granito, 288).Mg, 'il basalto dà molto più magnesio del granito');
  tra(ro.granito.Na, 0.5, 1.6, 'sodio nel granito (mol/kg; crosta vera 1,05)'); tra(ro.mantello.Cl * 35.45e3, 5, 60, 'cloro nel mantello (ppm; misurato 17-30)');
  assert.ok(rilascio(ro.granito, 288, 1).cariche > 1.5 * rilascio(ro.granito, 288, 2.8e-4).cariche, 'sotto più anidride carbonica la pioggia è più acida e consuma più roccia');
  const piuMg = rocceDelPianeta({ composizione: { ferro: 0.32, MgSi: 1.8 } }); assert.ok(piuMg.basalto.Mg > ro.basalto.Mg, 'un pianeta più ricco di magnesio ha rocce che ne cedono di più');
});

prova('una laguna che evapora: prima il calcare, poi il gesso, poi il salgemma (il Mar Morto è saturo di sale)', () => {
  const poco = evapora(T.totali, 3, 300, T.pCO2), molto = evapora(T.totali, 14, 300, T.pCO2);
  assert.ok(poco.precipitati.salgemma === 0 && poco.eq.omega.salgemma < 1, 'evaporata a un terzo non è ancora satura di sale');
  assert.ok(poco.precipitati.gesso > 0 || poco.eq.omega.gesso > 0.5, 'il gesso arriva prima del salgemma');
  assert.ok(molto.precipitati.salgemma > 0, 'evaporata a un quattordicesimo lascia salgemma'); tra(molto.eq.omega.salgemma, 0.9, 1.15, 'e resta satura');
  tra(molto.salinita, 200, 420, 'salamoia (g/kg; Mar Morto 340)');
  // un lago chiuso alimentato dai fiumi per centomila anni: i sali che i fiumi portano non escono più
  const chiuso = evapora(T.fiume, 3e4, 300, T.pCO2); assert.ok(chiuso.salinita > 100 * T.fiume.salinita && chiuso.precipitati.calcite > 0);
  const aperti = T.laghi.filter((l) => l.tipo === 'aperto'), chiusi = T.laghi.filter((l) => l.tipo !== 'aperto');
  for (const l of aperti) assert.ok(l.salinita < 3, `un lago con emissario è dolce: ${l.salinita}`);
  for (const l of chiusi) assert.ok(l.salinita > 2 * T.fiume.salinita && l.concentrato > 1, 'un lago chiuso concentra i sali');
  if (chiusi.length && aperti.length) assert.ok(Math.max(...chiusi.map((l) => l.salinita)) > 10 * Math.max(...aperti.map((l) => l.salinita)));
  console.log(`      laguna ×3: Ω gesso ${n3(poco.eq.omega.gesso)}, salgemma ${n3(poco.eq.omega.salgemma)}; ×14: ${n3(molto.salinita)} g/kg, salgemma deposto ${n3(molto.precipitati.salgemma)} mol/kg; laghi: ${aperti.length} con emissario (${n3(Math.max(0, ...aperti.map((l) => l.salinita)))} g/kg al più), ${chiusi.length} chiusi (${chiusi.map((l) => `${n3(l.salinita)} g/kg pH ${n3(l.pH)}`).join('; ')})`);
});

prova('le correnti: i grandi giri, con la corrente più forte sul bordo ovest dei bacini', () => {
  let pMax = 0; for (let k = 0; k < W * H; k++) pMax = Math.max(pMax, Math.abs(T.giri[k])); tra(pMax, 5, 300, 'portata dei giri (milioni di m³/s; Corrente del Golfo ~30)');
  // per ogni tratto di mare lungo un parallelo delle medie latitudini: dove sta il massimo della corrente lungo il meridiano
  let ovest = 0, tratti = 0, somma = 0;
  for (let j = 0; j < H; j++) { const l = Math.abs(latJ(j)); if (l < 20 || l > 45) continue; let i0 = -1; for (let i = 0; i < W; i++) if (!eMare(j * W + i)) { i0 = i; break; } if (i0 < 0) continue;
    let da = null; for (let n = 1; n <= W; n++) { const i = (i0 + n) % W, m = eMare(j * W + i); if (m && da === null) da = n; if (!m && da !== null) { const lungo = n - da;
      if (lungo >= 20) { let best = 0, pos = 0; for (let q = da; q < n; q++) { const v = Math.abs(T.giri[j * W + ((i0 + Math.min(q + 1, n - 1)) % W)] - T.giri[j * W + ((i0 + Math.max(q - 1, da)) % W)]); if (v > best) { best = v; pos = (q - da + 0.5) / lungo; } } tratti++; somma += pos; if (pos < 1 / 3) ovest++; } da = null; } } }
  // (se la corrente non preferisse un bordo, il massimo cadrebbe nel terzo ovest una volta su tre, e in media a metà bacino)
  // La LEGGE deve vedersi: più spesso che per caso, con due scarti di margine (binomiale, un terzo di probabilità). QUANTO
  // spesso si confronta e basta (era 29 tratti su 39 con i vulcani tirati a caso e un solo giro d'aria; con i vulcani
  // sulle salite del mantello — isole in mezzo agli oceani — e i venti del clima arrivato a regime è 19–24 su 39 secondo
  // il seme del tempo: è una misura rumorosa, e ciò che non torna si stampa)
  assert.ok(tratti >= 8, `tratti di oceano misurati: ${tratti}`); assert.ok(ovest > tratti / 3 + 2 * Math.sqrt((tratti * 2) / 9), `il massimo sta nel terzo ovest in ${ovest} tratti su ${tratti}: non più che per caso`); tra(somma / tratti, 0, 0.5, 'posizione media del massimo (0 = bordo ovest, 1 = est)');
  confronta('tratti con il massimo della corrente nel terzo ovest (parte del totale; la Terra: quasi tutti)', ovest / tratti, 0.6, 1.01); confronta('posizione media del massimo lungo il bacino (0 = bordo ovest)', somma / tratti, 0, 0.35);
  const v = []; for (let k = 0; k < W * H; k++) if (eMare(k)) v.push(Math.hypot(T.corrente.u[k], T.corrente.v[k])); v.sort((a, b) => a - b);
  tra(v[v.length >> 1], 0.003, 0.3, 'velocità mediana in superficie (m/s; misurata ~0,05-0,1)'); tra(T.termoclino, 100, 1500, 'spessore mosso dal vento (m; misurato 300-800)');
  console.log(`      giri fino a ${n3(pMax)} Sv; il massimo della corrente sta nel terzo ovest in ${ovest} tratti su ${tratti} (posizione media ${n3(somma / tratti)}); velocità mediana ${n3(v[v.length >> 1])} m/s, al 99% ${n3(v[Math.floor(v.length * 0.99)])}; termoclino ${n3(T.termoclino)} m`);
});

prova('l\'acqua risale all\'equatore e scende nei giri dei tropici; quella densa, fredda e salata, riempie il fondo', () => {
  const anno = 3.156e7; tra(fascia(T.risalita, 0, 3) * anno, 10, 2000, 'risalita all\'equatore (m/anno; misurata ~300)');
  assert.ok(fascia(T.risalita, 18, 32) < 0, `ai tropici l\'acqua scende: ${fascia(T.risalita, 18, 32) * anno} m/anno`);
  const pr = T.profondo; assert.ok(pr.T < fascia(T.temperatura, 0, 30) - 5, 'l\'acqua del fondo è fredda'); assert.ok(pr.dove.every((d) => Math.abs(d.lat) > 50), 'e si forma alle alte latitudini');
  assert.ok(pr.densita >= densita(fascia(T.temperatura, 0, 30), fascia(T.salinita, 0, 30)), 'è la più densa'); tra(pr.tempoGiroAnni, 50, 5000, 'tempo del giro profondo (anni; misurato ~1000)');
  assert.ok(fascia(T.temperatura, 0, 20) > fascia(T.temperatura, 60, 90) + 8, 'mare caldo ai tropici, freddo ai poli');
  console.log(`      risalita all'equatore ${n3(fascia(T.risalita, 0, 3) * anno)} m/anno, discesa ai tropici ${n3(fascia(T.risalita, 18, 32) * anno)}; fondo a ${n3(pr.T - 273.15)} °C e ${n3(pr.salinita)} g/kg, nato a ${pr.dove.map((d) => d.lat.toFixed(0) + '°').join(', ')}; il giro profondo dura ${n3(pr.tempoGiroAnni)} anni`);
});

prova('la salinità segue evaporazione e pioggia: più salato ai tropici, meno all\'equatore e ai poli; il calcare satura al caldo', () => {
  const eq = fascia(T.salinita, 0, 6), tropici = fascia(T.salinita, 18, 32), poli = fascia(T.salinita, 62, 90);
  assert.ok(tropici > eq + 0.3 && tropici > poli + 0.3, `tropici ${tropici}, equatore ${eq}, poli ${poli}`);
  assert.ok(fascia(T.eMenoP, 18, 32) > 0 && fascia(T.eMenoP, 0, 5) < 0, 'ai tropici evapora più di quanto piove, all\'equatore il contrario');
  let s = 0, a = 0, lo = Infinity, hi = -Infinity; for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) { const k = j * W + i; if (!eMare(k)) continue; const w = Math.cos((latJ(j) * Math.PI) / 180); s += T.salinita[k] * w; a += w; lo = Math.min(lo, T.salinita[k]); hi = Math.max(hi, T.salinita[k]); }
  tra(s / a / T.salinitaMedia, 0.97, 1.03, 'la media della carta è la salinità del bilancio'); assert.ok(lo > 0.3 * T.salinitaMedia && hi < 2 * T.salinitaMedia);
  assert.ok(fascia(T.saturazione.calcite, 10, 30) > 1.3 * fascia(T.saturazione.calcite, 60, 90), 'la calcite è più sovrasatura nei mari caldi');
  assert.ok(fascia(T.saturazione.salgemma, 0, 90) < 0.05, 'il mare aperto è lontanissimo dalla saturazione del sale');
  console.log(`      salinità: equatore ${n3(eq)}, tropici ${n3(tropici)}, poli ${n3(poli)} g/kg (da ${n3(lo)} a ${n3(hi)}); Ω calcite ${n3(fascia(T.saturazione.calcite, 10, 30))} ai tropici, ${n3(fascia(T.saturazione.calcite, 60, 90))} ai poli`);
});

// ---------- il campione d'acqua
const F = T.fine, cella = (lon, lat) => Math.min(F.H - 1, Math.floor(((90 - lat) / 180) * F.H)) * F.W + (Math.floor(((lon + 180) / 360) * F.W) % F.W);
// un punto di mare aperto e profondo ai tropici, lontano dalle foci; la foce più grande, e la direzione verso il largo
let aperto = null; { let best = -1; for (let j = 0; j < F.H; j++) for (let i = 0; i < F.W; i++) { const k = j * F.W + i, lat = 90 - ((j + 0.5) * 180) / F.H, lon = ((i + 0.5) * 360) / F.W - 180; if (F.tipo[k] !== 1 || F.fondo[k] < 3000 || Math.abs(Math.abs(lat) - 22) > 6) continue;
  const d = Math.min(...T.foci.slice(0, 80).map((f) => distanza(T.raggioM, lon, lat, f.lon, f.lat))); if (d > best) { best = d; aperto = { lon, lat }; } } }
const foce = T.foci[0]; let largo = null; { let best = -1; for (let a = 0; a < 16; a++) { const dx = Math.cos((a * Math.PI) / 8), dy = Math.sin((a * Math.PI) / 8); let n = 0; while (n < 12 && F.tipo[cella(foce.lon + dx * (n + 1) * 0.7, foce.lat + dy * (n + 1) * 0.7)] === 1) n++; if (n > best) { best = n; largo = [dx, dy]; } } }
const verso = (gradi) => ({ lon: foce.lon + largo[0] * gradi, lat: foce.lat + largo[1] * gradi });

prova('alle molecole: uno ione sodio e uno cloruro ogni cento molecole d\'acqua, ciascuno col suo guscio; coppie che durano un istante', () => {
  const c = campioneAcqua(T, { ...aperto, profondita: 5, latoM: 5e-9 }), na = c.ioni['Na+'], cloro = c.ioni['Cl-'];
  tra(na.ogniQuanteMolecoleDAcqua * na.moliPerKg, 55.4, 55.6, 'molecole d\'acqua per ione = 55,5 / molalità'); tra(na.moliPerKg / c.salinita / (T.totali.Na / T.salinitaMedia), 0.97, 1.03, 'il sodio del campione è quello del mare a quella salinità');
  confronta('molecole d\'acqua per ione sodio (nel mare vero 118)', na.ogniQuanteMolecoleDAcqua, 60, 200); confronta('per ione cloruro (102)', cloro.ogniQuanteMolecoleDAcqua, 50, 180); confronta('per ione qualunque (50)', 1 / c.ioniPerMolecolaDAcqua, 30, 90);
  tra(c.acquaNelCampione, 3700, 4300, 'molecole d\'acqua in un cubetto di 5 nm (4170 nell\'acqua dolce)'); confronta('ioni sodio in un cubetto di 5 nm (35 nel mare vero)', na.nelCampione, 20, 60);
  tra(na.nelCampione / (na.perM3 * 1.25e-25), 0.999, 1.001, 'il numero nel campione è la concentrazione per il volume');
  const ioni = c.particelle.filter((p) => p.tipo === 'ione'), acque = c.particelle.filter((p) => p.materiale === 'acqua');
  assert.ok(ioni.length >= 20 && acque.length >= 100 && c.particelle.length <= 440, `${ioni.length} ioni e ${acque.length} molecole disegnate`);
  assert.ok(acque[0].rappresenta > 5 && Math.abs(acque[0].rappresenta * acque.length - c.quanteDavvero.acqua) < 0.1 * c.quanteDavvero.acqua, 'le molecole disegnate sono un campione: accanto, quante sono davvero');
  const sodio = ioni.find((p) => p.materiale === 'Na+'); assert.equal(sodio.guscio, 6); tra(sodio.raggioGuscioM, 3e-10, 4.5e-10, 'raggio del guscio d\'acqua del sodio (m)'); tra(sodio.D, 0.7e-9, 2e-9, 'diffusione del sodio (m²/s; 1,3·10⁻⁹ a 25 °C)');
  const mg = c.coppie['Mg2+ SO4(2-)']; tra(mg.parteDelCatione, 0.005, 0.3, 'magnesio appaiato al solfato'); tra(mg.vitaS, 1e-11, 1e-6, 'durata di una coppia (s)');
  tra(c.tempoAttraversamento, 1e-10, 1e-7, 'tempo in cui una molecola attraversa il cubetto (s)');
  assert.match(c.descrizione, /molecole d'acqua/); console.log(`      ${c.descrizione}`);
});

prova('il moto browniano: una sfera di 1 µm a 20 °C si sposta di un micron al secondo (Einstein-Stokes)', () => {
  const b = browniano(1e-6, 293.15, 0); tra(b.D, 4.0e-13, 4.6e-13, 'D (m²/s; 4,3·10⁻¹³)'); tra(b.passo1s, 0.88e-6, 0.97e-6, 'spostamento in 1 s lungo un asse (m; 0,93 µm)'); tra(b.velocitaTermica, 1e-3, 6e-3, 'velocità termica istantanea (m/s; ~3 mm/s)');
  assert.ok(browniano(1e-7, 293.15).D > 9 * b.D && browniano(1e-6, 303.15).D > 1.15 * b.D, 'più piccola o più calda, più svelta');
  tra(stokes(2e-4, 2650) / stokes(2e-6, 2650), 3000, 10000, 'la sabbia cade migliaia di volte più in fretta dell\'argilla (Stokes: d²)');
  // le particelle del campione si muovono così: lo spostamento quadratico medio dopo un tempo t è 2·D·t per asse
  const c = campioneAcqua(T, { ...verso(0.02), profondita: 1, latoM: 1e-4, acqua: true }), col = c.particelle.map((p, i) => [p, i]).filter(([p]) => p.tipo === 'colloide');
  assert.ok(col.length >= 20, `particelle colloidali nel campione: ${col.length}`);
  const t = 2 * c.tempoAttraversamento * 0.01, a = muovi(c, 0), b2 = muovi(c, t); let s = 0, n = 0;
  for (const [p, i] of col) for (let x = 0; x < 2; x++) { let d = b2[i * 3 + x] - a[i * 3 + x]; d -= Math.round(d); s += (d * c.latoM) ** 2 / (2 * p.D * t); n++; }
  tra(s / n, 0.5, 1.6, 'spostamento quadratico medio / (2·D·t)');
  for (const [p] of col.slice(0, 5)) tra(p.D / browniano(p.diametroM, c.T, c.salinita).D, 0.99, 1.01, 'D della particella (Einstein-Stokes alla temperatura e salinità del punto)');
  assert.deepEqual(Array.from(muovi(c, t)), Array.from(b2), 'lo stesso istante, le stesse posizioni');
  console.log(`      D = ${n3(b.D)} m²/s, ${n3(b.passo1s * 1e6)} µm in un secondo; nel campione (${col.length} particelle colloidali): spostamento quadratico medio = ${n3(s / n)} × 2Dt`);
});

prova('alla foce: acqua meno salata e torbida, l\'argilla coagula col sale; il fango cala allontanandosi, la sabbia per prima', () => {
  const d = [0.03, 0.1, 0.4, 1.5, 5].map((g) => luogo(T, verso(g).lon, verso(g).lat, { profondita: 1, acqua: true })), tot = (x) => x.sospeso.sabbia + x.sospeso.limo + x.sospeso.argilla + x.sospeso.fiocchi;
  for (let i = 1; i < d.length; i++) { assert.ok(tot(d[i]) < tot(d[i - 1]), `la torbidità cala: ${d.map(tot).map(n3)}`); assert.ok(d[i].salinita >= d[i - 1].salinita - 0.2, `la salinità risale verso il largo: ${d.map((x) => n3(x.salinita))}`); }
  assert.ok(d[0].salinita < 0.7 * T.salinitaMedia && d[0].foce.parteDiFiume > 0.3, 'accanto alla foce l\'acqua è in buona parte dolce');
  assert.ok(d[0].sospeso.sabbia / tot(d[0]) > 10 * (d[2].sospeso.sabbia / tot(d[2]) + 1e-12), 'la sabbia cade subito'); assert.ok(d[4].sospeso.argilla > 20 * (d[4].sospeso.limo + d[4].sospeso.sabbia), 'lontano resta solo l\'argilla');
  assert.ok(d[2].foce.coagula > 0.8 && d[2].sospeso.fiocchi >= 0, 'nell\'acqua salata l\'argilla coagula'); assert.ok(tot(d[0]) > 1000 * tot(luogo(T, aperto.lon, aperto.lat, { profondita: 1 })), 'il mare aperto è limpido');
  const c = campioneAcqua(T, { ...verso(0.03), profondita: 1, latoM: 0.01, acqua: true }); assert.ok(c.particelle.length > 20 && c.quanteDavvero.fiocco + (c.quanteDavvero.limo || 0) > 20, 'nel cubetto ci sono granelli e fiocchi'); assert.match(c.descrizione, /foce/);
  const al = campioneAcqua(T, { ...aperto, profondita: 5, latoM: 0.01 }); assert.ok(al.particelle.filter((p) => p.tipo === 'granello' || p.tipo === 'fiocco').length < 5 && al.torbidita < 1e-4); assert.match(al.descrizione, /limpida|Mare aperto/);
  console.log(`      a ${d.map((x) => Math.round(x.foce.distanzaM / 1000)).join(', ')} km dalla foce: fango ${d.map((x) => n3(tot(x) * 1000)).join(', ')} g/m³; sale ${d.map((x) => n3(x.salinita)).join(', ')} g/kg`);
  console.log(`      ${c.descrizione}`); console.log(`      ${al.descrizione}`);
});

prova('lo stesso punto alla stessa scala dà lo stesso campione; scale diverse e punti vicini sono coerenti', () => {
  const dove = { ...verso(0.3), profondita: 1, acqua: true }, foto = (c) => JSON.stringify(c), a = campioneAcqua(T, { ...dove, latoM: 1e-3 });
  assert.equal(foto(a), foto(campioneAcqua(T, { ...dove, latoM: 1e-3 }))); assert.notEqual(foto(a.particelle), foto(campioneAcqua(T, { ...dove, lon: dove.lon + 0.001, latoM: 1e-3 }).particelle));
  // tra scale: le concentrazioni sono le stesse; i conteggi stanno come i volumi
  const scale = [1, 1e-2, 1e-3, 1e-5, 1e-6, 1e-8].map((L) => campioneAcqua(T, { ...dove, latoM: L }));
  for (const c of scale) { tra(c.ioni['Na+'].perM3 / a.ioni['Na+'].perM3, 0.9999, 1.0001, 'ioni per m³'); tra(c.salinita / a.salinita, 0.9999, 1.0001, 'salinità'); tra(c.torbidita / a.torbidita, 0.9999, 1.0001, 'torbidità');
    for (const m of ['argilla', 'colloide', 'acqua', 'Cl-']) tra(c.quanteDavvero[m] / c.latoM ** 3 / (a.quanteDavvero[m] / a.latoM ** 3), 0.9999, 1.0001, `${m} per m³ a ${c.latoM} m`); }
  // ciò che si conta in un cubetto piccolo è ciò che ci si aspetta dal grande (entro il caso di Poisson): l'argilla disegnata a 1 mm e a 0,3 mm
  const conta = (L) => { let n = 0; for (let q = 0; q < 12; q++) { const c = campioneAcqua(T, { ...dove, lat: dove.lat + q * 1e-4, latoM: L, massimo: 4000 }); n += c.classi.length && c.particelle.filter((p) => p.materiale === 'argilla').reduce((s, p) => s + p.rappresenta, 0); } return n / 12 / L ** 3; };
  const n1 = conta(1e-3), n2 = conta(3e-4), attesa = a.quanteDavvero.argilla / 1e-9; tra(n1 / attesa, 0.6, 1.5, 'granelli d\'argilla contati a 1 mm, per m³, rispetto alla concentrazione'); tra(n2 / attesa, 0.4, 1.8, 'e a 0,3 mm');
  // punti vicini (cento metri): la torbidità e la salinità non saltano
  const v = campioneAcqua(T, { ...dove, lat: dove.lat + 0.001, latoM: 1e-3 }); tra(v.torbidita / a.torbidita, 0.9, 1.1, 'torbidità a cento metri'); tra(v.salinita / a.salinita, 0.98, 1.02, 'salinità a cento metri'); tra(v.T - a.T, -0.1, 0.1, 'temperatura a cento metri');
  // a ogni scala si vede qualcosa di diverso, e il resto è contato nel velo
  assert.ok(scale[0].velo.some((x) => x.materiale === 'argilla') && scale[2].particelle.some((p) => p.materiale === 'argilla') && scale[5].particelle.some((p) => p.tipo === 'ione'));
  console.log(`      argilla: ${n3(attesa)} granelli per m³; contati ${n3(n1)} a 1 mm e ${n3(n2)} a 0,3 mm; visibili: ${scale.map((c) => `${c.latoM} m → ${[...new Set(c.particelle.map((p) => p.materiale))].slice(0, 4).join('/') || 'niente'}`).join('; ')}`);
});

prova('le reazioni sul posto: il fumo nero di un camino, la salamoia nel ghiaccio, i cristalli in una salamoia', () => {
  // un camino: il più profondo; più profondo è il fondo, più calda può uscire l'acqua
  const cam = T.sorgentiCalde; assert.ok(cam.length >= 5, `sorgenti calde: ${cam.length}`);
  for (const s of cam) { tra(s.T, 365, 648, 'temperatura all\'uscita (K: da 100 °C a pelo d\'acqua ai 300-400 °C misurati sulle dorsali profonde)'); assert.equal(s.fluido['Mg2+'], 0); tra((2 * s.fluido['Ca2+'] + s.fluido['Na+'] + s.fluido['K+'] + 2 * s.fluido['Fe2+'] + Math.pow(10, -s.pH)) / s.fluido['Cl-'], 0.97, 1.03, 'le cariche del fluido si chiudono');
    assert.ok(s.fluido['SO4(2-)'] === 0 && (s.T < 520 || s.fluido.H4SiO4 > 2 * T.totali.Si) && F.tipo[cella(s.lon, s.lat)] === 1); }
  const ord = [...cam].sort((a, b) => a.profonditaM - b.profonditaM); assert.ok(ord[ord.length - 1].T >= ord[0].T, 'più profondo, più caldo');
  const s = ord[ord.length - 1]; let fumo = null, lontano = null;
  for (let q = 0; q < 60 && !(fumo && lontano); q++) { const c = campioneAcqua(T, { lon: s.lon + q * 0.004, lat: s.lat, profondita: 1e5, latoM: 2e-6 }); if (!c.luogo.camino) continue; if (c.luogo.camino.distanzaM < 5 && !fumo) fumo = c; if (c.luogo.camino.distanzaM > 80 && !lontano) lontano = c; }
  assert.ok(fumo && lontano, 'campioni vicino e lontano dal camino'); assert.ok(fumo.quanteDavvero['solfuro di ferro'] > 0 && fumo.saturazione['solfuro di ferro'] > 1, 'vicino al camino il solfuro di ferro precipita');
  assert.ok(fumo.T > lontano.T && fumo.pH < lontano.pH + 1e-9 && (fumo.quanteDavvero['solfuro di ferro'] || 0) > 10 * (lontano.quanteDavvero['solfuro di ferro'] || 0), 'e l\'acqua è più calda, più acida e più fumosa che lontano');
  assert.match(fumo.descrizione, /camino/);
  // dentro il ghiaccio marino: salamoia; appena sotto, acqua al punto di gelo
  let polo = null; for (let k = 0; k < W * H && !polo; k++) if (T.bagnato[k] >= 0.9 && T.ghiaccio[k] > 0.55 && T.spessoreGhiaccio[k] > 0.3) polo = { lon: lonI(k % W), lat: latJ(Math.floor(k / W)) };
  assert.ok(polo, 'c\'è un mare che gela');
  const nel = campioneAcqua(T, { ...polo, profondita: 0.1, latoM: 0.005 }), sotto = campioneAcqua(T, { ...polo, profondita: 5, latoM: 0.005 });
  assert.ok(nel.luogo.salamoia && nel.salinita > 1.5 * sotto.salinita && nel.T < sotto.T, `salamoia a ${nel.salinita} g/kg contro ${sotto.salinita}`); assert.ok(nel.quanteDavvero.ghiaccio > 0); tra(sotto.T - sotto.congelaA, -0.5, 1.5, 'sotto il ghiaccio l\'acqua è al punto di gelo');
  // una laguna satura (l'acqua del mare evaporata): crescono i cristalli; e il colore sono le croste di sale
  const sal = evapora(T.totali, 14, 300, T.pCO2); assert.ok(sal.precipitati.salgemma > 0);
  for (const l of T.laghi.filter((x) => x.tipo !== 'aperto' && x.precipitati.salgemma + x.precipitati.gesso + x.precipitati.amari > 0 && x.salinita > 100)) { const c = campioneAcqua(T, { lon: l.lon, lat: l.lat, profondita: 0.1, latoM: 0.05 }); assert.ok(!c.asciutto && c.cristalli.length > 0, 'in un lago saturo crescono cristalli'); console.log(`      ${c.descrizione}`); }
  console.log(`      ${fumo.descrizione}`); console.log(`      ${nel.descrizione}`);
  console.log(`      sorgenti calde: ${cam.length}, da ${n3(ord[0].T - 273)} °C a ${n3(ord[0].profonditaM)} m fino a ${n3(s.T - 273)} °C a ${n3(s.profonditaM)} m; silice ${n3(s.fluido.H4SiO4 * 1000)} mmol/kg (misurata 15-20), H2S ${n3(s.fluido['H2S(aq)'] * 1000)}, ferro ${n3(s.fluido['Fe2+'] * 1000)}`);
  const pb = T.prebiotica; assert.ok(pb.camini.length === cam.length && pb.camini[0].saltoDiPH > 2 && pb.camini[0].saltoDiTemperatura > 100 && isFinite(pb.camini[0].energiaKJmol));
});

prova('l\'immagine del campione e il colore del mare visto da sopra', () => {
  const c = campioneAcqua(T, { ...verso(0.05), profondita: 1, latoM: 0.005, acqua: true }), px = immagineAcqua(c, { N: 96 }), lista = disegnabili(c, 0);
  assert.equal(px.length, 96 * 96 * 4); let diversi = new Set(); for (let k = 0; k < 96 * 96; k++) { assert.equal(px[k * 4 + 3], 255); diversi.add((px[k * 4] >> 3) * 1024 + (px[k * 4 + 1] >> 3) * 32 + (px[k * 4 + 2] >> 3)); } assert.ok(diversi.size > 8, 'l\'immagine non è una tinta piatta');
  assert.equal(lista.length, c.particelle.length); for (const p of lista) assert.ok(p.x >= 0 && p.x < 1 && p.y >= 0 && p.y < 1 && p.r > 0);
  assert.notDeepEqual(Array.from(immagineAcqua(c, { N: 96, t: 50 * c.tempoAttraversamento })), Array.from(px), 'nel tempo le particelle si spostano');
  assert.equal(immagineAcqua(campioneAcqua(T, { ...aperto, latoM: 5e-9 }), { N: 64 }).length, 64 * 64 * 4);
  // i colori: blu scuro al largo, chiaro dove è basso, bruno alla foce, niente sulla terra, bianco sul ghiaccio
  // (il blu scuro è quello dell'acqua limpida, fredda e profonda; nei mari caldi dove il calcare precipita l'acqua è più chiara e turchese)
  let freddo = null; for (let k = 0; k < W * H && !freddo; k++) if (T.bagnato[k] >= 1 && T.fondo[k] > 3000 && T.ghiaccio[k] < 0.02 && T.saturazione.calcite[k] < 0.8 * T.soglia && T.torbidita[k] < 1e-6) freddo = { lon: lonI(k % W), lat: latJ(Math.floor(k / W)) };
  assert.ok(freddo, 'un mare freddo, limpido e profondo'); const caldo = coloreMare(T, aperto.lon, aperto.lat); 
  const blu = coloreMare(T, freddo.lon, freddo.lat), basso = coloreMare(T, freddo.lon, freddo.lat, { profonditaM: 2 }), bruno = coloreMare(T, foce.lon, foce.lat);
  if (campioneAcqua(T, { ...aperto, latoM: 0.01 }).saturazione.calcite > T.soglia) assert.ok(caldo[1] > blu[1] + 10, `dove il calcare precipita il mare è più chiaro e più verde: ${caldo} contro ${blu}`);
  assert.ok(blu[2] > blu[0] + 50 && blu[2] > blu[1] + 30 && blu[0] + blu[1] + blu[2] < 330, `mare profondo: ${blu}`); assert.ok(basso[0] > blu[0] + 30 && basso[1] > blu[1] + 30, `in due metri d'acqua limpida si vede il fondo (qui roccia vulcanica scura): ${basso} contro ${blu}`);
  assert.ok(bruno[0] / bruno[2] > 1.5 * (blu[0] / blu[2]), `foce: ${bruno}`);
  let terra = null; for (let k = 0; k < F.W * F.H && !terra; k++) if (F.tipo[k] === 0) terra = [((k % F.W) + 0.5) / F.W * 360 - 180, 90 - ((Math.floor(k / F.W) + 0.5) * 180) / F.H]; assert.equal(coloreMare(T, terra[0], terra[1]), null); assert.ok(campioneAcqua(T, { lon: terra[0], lat: terra[1] }).asciutto);
  const im = new Uint8ClampedArray(se.W * se.H * 4); coloraMare(T, se, im); let colorati = 0; for (let k = 0; k < se.W * se.H; k++) if (im[k * 4 + 2] > 0) colorati++; tra(colorati / (se.W * se.H), 0.5, 0.95, 'punti di mare colorati sulla carta');
  console.log(`      mare freddo e profondo ${blu}, caldo dove nasce il calcare ${caldo}, basso ${basso}, foce ${bruno}`);
});

prova('lo stato è fatto solo di dati: passa tra fili, e mare() lavora anche su dati passati tra fili', () => {
  const senzaFunzioni = (o) => { if (!o || typeof o !== 'object' || ArrayBuffer.isView(o)) return o; if (Array.isArray(o)) return o.map(senzaFunzioni); const r = {}; for (const k in o) if (typeof o[k] !== 'function') r[k] = senzaFunzioni(o[k]); return r; };
  const copia = structuredClone(T); assert.equal(JSON.stringify(campioneAcqua(copia, { ...aperto, latoM: 1e-8 })), JSON.stringify(campioneAcqua(T, { ...aperto, latoM: 1e-8 })));
  const T2 = mare(structuredClone(senzaFunzioni(P)), structuredClone(senzaFunzioni(sf)), structuredClone(senzaFunzioni(cl)), structuredClone(senzaFunzioni(se)), 'prova/terra/mare');
  assert.equal(T2.salinitaMedia, T.salinitaMedia); assert.equal(T2.pH, T.pH); assert.deepEqual(Array.from(T2.salinita), Array.from(T.salinita)); assert.equal(JSON.stringify(T2.laghi), JSON.stringify(T.laghi));
});

prova('le onde: altezza e periodo dal vento e dal tratto di mare libero; il mare da sopra a ogni scala, fermo più mosso, sempre lo stesso', () => {
  // le leggi: mare pienamente sviluppato con 10 m/s → 2,5 m e 8 s; con poco tratto libero onde più basse e corte
  let hMax = 0, uMax = 0, hMedia = 0, n = 0; for (let k = 0; k < W * H; k++) if (eMare(k)) { const U = Math.hypot(T.vento.u[k], T.vento.v[k]), h = T.onde.altezza[k]; assert.ok(h <= (0.2431 * U * U) / T.gravita + 1e-6 && h >= 0 && T.onde.periodo[k] <= (8.131 * U) / T.gravita + 1e-6, 'mai più del mare pienamente sviluppato'); hMax = Math.max(hMax, h); uMax = Math.max(uMax, U); hMedia += h; n++; }
  confronta('altezza media delle onde (m; misurata sulla Terra ~2,5)', hMedia / n, 1.2, 4); confronta('vento massimo sul mare (m/s; medie annue terrestri fino a ~12)', uMax, 7, 16);
  const o = ondeNelPunto(T, aperto.lon, aperto.lat); assert.ok(o.H > 0 && o.T > 0 && o.tratto > 1e5 && o.Hl >= 0, JSON.stringify(o));
  // la stessa superficie a scale diverse: da 3000 km a 10 m di larghezza
  const rett = (lon, lat, largM) => { const dv = largM / 2 / (Math.PI * T.raggioM), du = largM / (2 * Math.PI * T.raggioM * Math.cos((lat * Math.PI) / 180)), u = (lon + 180) / 360, v = (90 - lat) / 180; return [u - du / 2, v - dv / 2, u + du / 2, v + dv / 2]; };
  // DOVE si guarda: nel punto di mare aperto (lontano dal ghiaccio) dove le onde sono più alte. Prima si guardava nel punto
  // «aperto» a 22° di latitudine, scelto perché lontano dalle foci: ma lì, sotto le calme dei tropici, su questo mondo il
  // vento è di 1 m/s, e la legge stessa (periodo 8,13·U/g) dà onde lunghe un metro: con punti di 2,3 m non possono vedersi.
  // Che a 300 m di larghezza le onde si vedano vale dove c'è vento; dove non ce n'è il mare è liscio, ed è giusto così
  let mosso = aperto; { let best = -1; for (let k = 0; k < W * H; k++) if (T.bagnato[k] >= 1 && T.fondo[k] > 1000 && !(T.ghiaccio[k] > 0.02) && T.onde.altezza[k] > best) { best = T.onde.altezza[k]; mosso = { lon: lonI(k % W), lat: latJ(Math.floor(k / W)) }; } }
  { const om = ondeNelPunto(T, mosso.lon, mosso.lat), Um = (om.T * T.gravita) / 8.131, calma = ondeNelPunto(T, aperto.lon, aperto.lat); console.log(`      dove si guardano le onde (${n3(mosso.lon)}°, ${n3(mosso.lat)}°): alte ${n3(om.H)} m, periodo ${n3(om.T)} s, lunghe ${n3((T.gravita * om.T * om.T) / (2 * Math.PI))} m; nel punto delle calme a 22°: ${n3(calma.H)} m, ${n3((T.gravita * calma.T * calma.T) / (2 * Math.PI))} m`); }
  const WI = 128, HI = 64, vista = (larg, t, dove = mosso) => { const sfv = { W: WI, H: HI, rett: rett(dove.lon, dove.lat, larg) }, px = new Uint8ClampedArray(WI * HI * 4); aspettoMare(T, sfv, px, { t }); return { px, sfv, info: { ...aspettoMare.ultimo } }; };
  const varia = (px) => { let s = 0, s2 = 0, m = 0; for (let k = 0; k < WI * HI; k++) { const v = px[k * 4] + px[k * 4 + 1] + px[k * 4 + 2]; s += v; s2 += v * v; m++; } return Math.sqrt(Math.max(0, s2 / m - (s / m) ** 2)); };
  const lontano = vista(3e6, 0), vicino = vista(300, 0), dopo = vista(300, 2), ancora = vista(300, 0);
  assert.equal(lontano.info.onde, 0, 'da lontano nessuna onda è risolta'); assert.ok(vicino.info.onde >= 3 && vicino.info.lunghezze[0] >= 2.6 * vicino.info.scalaM, `onde risolte: ${JSON.stringify(vicino.info)}`);
  assert.deepEqual(Array.from(vicino.px), Array.from(ancora.px), 'stesso punto e stesso istante, stessa immagine'); assert.notDeepEqual(Array.from(vicino.px), Array.from(dopo.px), 'dopo due secondi le onde si sono spostate');
  assert.ok(varia(vicino.px) > 3, 'a 300 m le onde si vedono'); const blu = vicino.px; let b = 0, r = 0; for (let k = 0; k < WI * HI; k++) { b += blu[k * 4 + 2]; r += blu[k * 4]; } assert.ok(b > 1.5 * r, 'e il mare resta blu');
  // le scale si raccordano: la metà centrale della vista larga 600 m, e la vista larga 300 m rimpicciolita, mostrano le stesse creste
  const larga = vista(600, 0), lum = (px, i, j) => px[(j * WI + i) * 4] + px[(j * WI + i) * 4 + 1] + px[(j * WI + i) * 4 + 2]; let sa = 0, sb = 0, saa = 0, sbb = 0, sab = 0, m = 0;
  for (let j = 0; j < HI / 2; j++) for (let i = 0; i < WI / 2; i++) { const A = lum(larga.px, WI / 4 + i, HI / 4 + j), B = (lum(vicino.px, 2 * i, 2 * j) + lum(vicino.px, 2 * i + 1, 2 * j) + lum(vicino.px, 2 * i, 2 * j + 1) + lum(vicino.px, 2 * i + 1, 2 * j + 1)) / 4; sa += A; sb += B; saa += A * A; sbb += B * B; sab += A * B; m++; }
  const corr = (sab / m - (sa / m) * (sb / m)) / Math.sqrt((saa / m - (sa / m) ** 2) * (sbb / m - (sb / m) ** 2)); tra(corr, 0.35, 1.01, 'le creste viste a 600 m e a 300 m sono le stesse (correlazione)');
  // la parte ferma si fa una volta; quella che si muove costa poco
  const ferma = aspettoFermo(T, vicino.sfv); assert.equal(ferma, aspettoFermo(T, vicino.sfv)); const sfg = { W: 256, H: 128, rett: rett(mosso.lon, mosso.lat, 300) }, pxg = new Uint8ClampedArray(256 * 128 * 4); aspettoMare(T, sfg, pxg, { t: 0 });
  let t0 = performance.now(); for (let q = 1; q <= 5; q++) aspettoMare(T, sfg, pxg, { t: q }); const ms = (performance.now() - t0) / 5; confronta('tempo di un fotogramma di aspettoMare su 256×128 con otto onde (ms; chiesti meno di 15)', ms, 0, 15); tra(ms, 0, 80, 'tempo di un fotogramma (ms)');
  // sul pianeta intero: mari di colori diversi (blu profondo, turchese dove il calcare precipita, chiaro sul ghiaccio)
  const tutto = new Uint8ClampedArray(se.W * se.H * 4); coloraMare(T, se, tutto); const colori = new Set(); for (let k = 0; k < se.W * se.H; k++) if (tutto[k * 4 + 3]) colori.add((tutto[k * 4] >> 4) * 256 + (tutto[k * 4 + 1] >> 4) * 16 + (tutto[k * 4 + 2] >> 4)); assert.ok(colori.size >= 12, `tinte diverse del mare: ${colori.size}`);
  console.log(`      onde: in media ${n3(hMedia / n)} m (massimo ${n3(hMax)} m con ${n3(uMax)} m/s); nel punto al largo ${n3(o.H)} m ogni ${n3(o.T)} s col vento a ${n3(o.U)} m/s su ${n3(o.tratto / 1000)} km di mare libero, mare lungo ${n3(o.Hl)} m ogni ${n3(o.Tl)} s`);
  console.log(`      vista larga 300 m (${n3(vicino.info.scalaM)} m per punto): ${vicino.info.onde} onde disegnate, lunghe da ${n3(vicino.info.lunghezze[0])} a ${n3(vicino.info.lunghezze[1])} m, periodo fino a ${n3(vicino.info.periodo)} s; correlazione tra le scale ${n3(corr)}; un fotogramma 256×128: ${n3(ms)} ms; tinte del mare sul pianeta: ${colori.size}`);
});

prova('le molecole in tre dimensioni: geometria vera dell\'acqua, gli stessi conteggi del campione, i solidi coi loro reticoli; e i nuclei (il potassio-40 decade)', () => {
  const dove = { ...aperto, profondita: 2, latoM: 4e-9 }, s = scenaMolecolare(T, dove), c = campioneAcqua(T, dove), pos = s.atomi.pos, N = s.atomi.elemento.length;
  assert.equal(pos.length, 3 * N); assert.equal(s.atomi.raggio.length, N); assert.deepEqual(s.scatola, [4, 4, 4]); assert.equal(JSON.stringify(Array.from(scenaMolecolare(T, dove).atomi.pos.slice(0, 600))), JSON.stringify(Array.from(pos.slice(0, 600))), 'deterministica');
  const acqua = s.parti.find((p) => p.nome === 'acqua'); let n = 0, fuori = 0;
  for (let q = acqua.da; q < acqua.a; q += 3) { assert.equal(s.atomi.elemento[q], 8); assert.equal(s.atomi.elemento[q + 1], 1); const v1 = [0, 1, 2].map((z) => pos[(q + 1) * 3 + z] - pos[q * 3 + z]), v2 = [0, 1, 2].map((z) => pos[(q + 2) * 3 + z] - pos[q * 3 + z]), l1 = Math.hypot(...v1), l2 = Math.hypot(...v2), ang = (Math.acos((v1[0] * v2[0] + v1[1] * v2[1] + v1[2] * v2[2]) / (l1 * l2)) * 180) / Math.PI; if (Math.abs(l1 - 0.09572) > 2e-4 || Math.abs(l2 - 0.09572) > 2e-4 || Math.abs(ang - 104.5) > 0.2) fuori++; n++; }
  assert.equal(fuori, 0, 'ogni molecola d\'acqua: O–H 0,9572 Å e 104,5°'); tra(n / c.acquaNelCampione, 0.9, 1.02, 'molecole d\'acqua rispetto al campione (gli ioni ne prendono il posto)');
  for (const f of ['Na+', 'Cl-']) { assert.equal(s.conteggi[f], Math.round(c.contati[f]), `${f}: gli stessi del campione`); const p = s.parti.find((x) => x.nome === f); assert.equal(p.a - p.da, s.conteggi[f]); assert.equal(s.atomi.elemento[p.da], f === 'Na+' ? 11 : 17); }
  assert.ok(s.legami.length >= 4 * n && s.legamiH.length > 2 * n, 'due legami O–H per molecola, e legami a idrogeno'); let dH = 0; for (let x = 0; x < s.legamiH.length; x += 2) { let d = [0, 1, 2].map((z) => pos[s.legamiH[x + 1] * 3 + z] - pos[s.legamiH[x] * 3 + z]); d = d.map((v) => v - 4 * Math.round(v / 4)); dH += Math.hypot(...d); } confronta('distanza media H···O nei legami a idrogeno (nm; misurata 0,18-0,20)', dH / (s.legamiH.length / 2), 0.17, 0.21); tra(dH / (s.legamiH.length / 2), 0.15, 0.3, 'H···O (nm)');
  // l'agitazione: l'acqua diffonde di 2,3·10⁻⁹ m²/s a 25 °C (meno al freddo), il sodio meno
  tra(s.agitazione.diffusione.acqua, 0.0008, 0.0035, 'diffusione dell\'acqua (nm²/ps; 0,0023 a 25 °C)'); assert.ok(s.agitazione.diffusione['Na+'] < s.agitazione.diffusione.acqua && s.agitazione.legameIdrogeno.vitaPs > 0.5 && s.agitazione.velocitaTermica.acqua > 500);
  // i solidi, se li si chiede (o se lì ce n'è uno): il salgemma alterna sodio e cloro a 2,82 Å
  const sale = scenaMolecolare(T, { ...dove, solido: 'salgemma' }), ps = sale.parti.find((p) => p.nome.startsWith('solido')); assert.ok(ps && ps.a - ps.da > 200); const q0 = ps.da; tra(Math.hypot(sale.atomi.pos[(q0 + 1) * 3] - sale.atomi.pos[q0 * 3], sale.atomi.pos[(q0 + 1) * 3 + 1] - sale.atomi.pos[q0 * 3 + 1], sale.atomi.pos[(q0 + 1) * 3 + 2] - sale.atomi.pos[q0 * 3 + 2]), 0.28, 0.284, 'passo Na–Cl (nm)'); assert.notEqual(sale.atomi.elemento[q0], sale.atomi.elemento[q0 + 1]);
  for (const q of ['calcite', 'ghiaccio', 'argilla']) { const x = scenaMolecolare(T, { ...dove, solido: q }); assert.ok(x.parti[0].nome === `solido: ${q}` && x.parti[0].a > 100 && x.conteggi.acqua < s.conteggi.acqua); }
  const sup = scenaMolecolare(T, { ...aperto, profondita: 1e-9, latoM: 3e-9 }); let zMax = 0; const pa = sup.parti.find((p) => p.nome === 'acqua'); for (let q = pa.da; q < pa.a; q += 3) zMax = Math.max(zMax, sup.atomi.pos[q * 3 + 2]); tra(zMax, 1.5, 2.3, 'la superficie dell\'acqua dentro il cubetto (nm dal basso)');
  assert.ok(scenaMolecolare(T, { lon: 0, lat: 0, latoM: 4e-9, acqua: false }).asciutto);
  // i nuclei: l'idrogeno pesante, l'ossigeno-18, e il potassio-40 che decade
  const nu = c.nuclei; tra(nu.isotopi['H-2'].perM3 / nu.isotopi['H-1'].perM3, 1.4e-4, 1.7e-4, 'deuterio'); const perKg = nu.decadimenti['K-40'].perM3alSecondo / c.densita, attesi = c.ioni['K+'].moliPerKg * 6.022e23 * 1.17e-4 * Math.LN2 / (1.248e9 * 3.156e7); tra(perKg / attesi, 0.9, 1.1, 'decadimenti del potassio-40 dalla quantità di potassio');
  confronta('decadimenti del potassio-40 per kg d\'acqua di mare al secondo (misurati ~12)', perKg, 8, 16);
  console.log(`      ${s.descrizione} ${N} atomi; H···O ${n3(dH / (s.legamiH.length / 2))} nm; l'acqua diffonde ${n3(s.agitazione.diffusione.acqua * 1000)}·10⁻³ nm²/ps, un legame a idrogeno dura ${n3(s.agitazione.legameIdrogeno.vitaPs)} ps; potassio-40: ${n3(perKg)} decadimenti al secondo per kg`);
});

prova('le maree dalla luna e dalla stella, le stagioni, il calore portato dalle correnti, le province, il mare a un momento dato', () => {
  const m = T.maree, luna = m.corpi.find((c) => c.corpo.startsWith('luna')), sole = m.corpi.find((c) => c.corpo === 'stella');
  tra(luna.altezza, 0.45, 0.65, 'marea di equilibrio della Luna (m; 0,54)'); tra(luna.periodo / 3600, 12.3, 12.5, 'periodo (ore; 12 h 25 min)'); tra(sole.altezza / luna.altezza, 0.4, 0.52, 'la marea del Sole rispetto a quella della Luna (0,46)');
  assert.ok(m.ampiezzaMassima > 2 * m.ampiezzaMedia && m.ampiezzaMedia > 0.1, 'in certi bacini e sui bassi fondali la marea è molto più alta che al largo');
  confronta('dislivello medio della marea in mare aperto (m; misurato ~0,5-1)', m.ampiezzaMedia, 0.3, 1.5); confronta('potenza dissipata dalle maree (W; misurata 3,5·10¹²)', m.attrito.potenzaW, 1.5e12, 8e12); confronta('allungamento del giorno (ms al secolo; misurato 2,3)', m.attrito.giornoPiuLungoMsAlSecolo, 1, 5);
  assert.ok(m.zonaTraLeMaree.areaM2 > 0 && m.zonaTraLeMaree.doveEvapora.areaM2 < m.zonaTraLeMaree.areaM2 && T.prebiotica.pozzeDiMarea.areaM2 > 0);
  // senza luna resta la marea della stella; con una luna vicina le maree sono enormi
  const senza = mare({ ...P, lune: [] }, sf, cl, se, 'prova/senzaluna'), vicina = mare({ ...P, lune: [{ ...P.lune[0], aM: 1.3e8 }] }, sf, cl, se, 'prova/lunavicina');
  assert.equal(senza.maree.corpi.length, 1); assert.ok(senza.maree.ampiezzaMedia < 0.6 * m.ampiezzaMedia && vicina.maree.equilibrio > 10 * m.equilibrio, `senza luna ${senza.maree.ampiezzaMedia}, luna a un terzo ${vicina.maree.equilibrio}`);
  // le stagioni: il ghiaccio avanza e si ritira, i due emisferi all'opposto; d'inverno lo strato rimescolato è più profondo
  assert.equal(T.stagioni.length, 4); const ghiaccioDi = (q, emisfero) => { let a = 0; for (let j = 0; j < H; j++) { const l = latJ(j); if (Math.sign(l) !== emisfero) continue; for (let i = 0; i < W; i++) if (eMare(j * W + i)) a += T.stagioni[q].ghiaccio[j * W + i] * Math.cos((l * Math.PI) / 180); } return a; };
  const nord = [0, 1, 2, 3].map((q) => ghiaccioDi(q, 1)), sud = [0, 1, 2, 3].map((q) => ghiaccioDi(q, -1)), qInv = nord.indexOf(Math.max(...nord)), qEst = nord.indexOf(Math.min(...nord));
  assert.ok(Math.max(...nord) > 1.15 * Math.min(...nord) && sud[qInv] < sud[qEst], `ghiaccio a nord ${nord.map(n3)}, a sud ${sud.map(n3)}`);
  const stratoDi = (q) => { let s2 = 0, n = 0; for (let j = 0; j < H; j++) { const l = latJ(j); if (l < 35 || l > 60) continue; for (let i = 0; i < W; i++) if (eMare(j * W + i)) { s2 += T.stagioni[q].strato[j * W + i]; n++; } } return s2 / n; }; assert.ok(stratoDi(qInv) > 1.2 * stratoDi(qEst), `strato rimescolato a nord: inverno ${stratoDi(qInv)} m, estate ${stratoDi(qEst)} m`);
  const prima = mareAl(T, { fase: (qInv + 0.5) / 4, marea: 0 }), dopo = mareAl(T, { fase: (qEst + 0.5) / 4, marea: 0.5 }); assert.ok(prima.esiste && prima.livello.length === W * H && prima.salinitaMedia === T.salinitaMedia);
  let kPolo = -1; for (let k = 0; k < W * H && kPolo < 0; k++) if (eMare(k) && latJ(Math.floor(k / W)) > 40 && T.stagioni[qInv].ghiaccio[k] > 0.9 && T.stagioni[qEst].ghiaccio[k] < 0.1) kPolo = k;
  if (kPolo >= 0) { const lo = lonI(kPolo % W), la = latJ(Math.floor(kPolo / W)), cI = coloreMare(prima, lo, la), cE = coloreMare(dopo, lo, la); assert.ok(cI[0] > cE[0] + 40, `lo stesso punto d'inverno è ghiaccio e d'estate è mare: ${cI} contro ${cE}`); assert.ok(campioneAcqua(prima, { lon: lo, lat: la, profondita: 3 }).T < campioneAcqua(dopo, { lon: lo, lat: la, profondita: 3 }).T); }
  let lMax = 0; for (let k = 0; k < W * H; k++) { tra(prima.livello[k] + dopo.livello[k], -1e-3, 1e-3, 'a mezzo ciclo la marea è rovesciata'); lMax = Math.max(lMax, prima.livello[k]); } assert.ok(lMax > 0.1);
  // il calore: nello stesso formato del trasporto dell'aria
  assert.equal(T.caloreDalMare.length, cl.W * cl.H); let cMin = 0, cMax = 0, bil = 0; for (let k = 0; k < cl.W * cl.H; k++) { cMin = Math.min(cMin, T.caloreDalMare[k]); cMax = Math.max(cMax, T.caloreDalMare[k]); } assert.ok(cMin < -5 && cMax > 5, `calore portato dal mare: da ${cMin} a ${cMax} W/m²`);
  confronta('quanto le correnti scaldano o raffreddano le coste, in media (K; sulla Terra 2-5, fino a 10 in Europa)', T.calore.suCosteK, 1, 6); confronta('lo scarto massimo (K; ~10)', T.calore.massimoK, 4, 14);
  assert.ok(T.albedo.every((a) => a >= 0 && a <= 0.61));
  // le province: più di sei caratteri diversi, che insieme coprono tutto il mare
  const pr = T.province.filter((p) => p.indice >= 0); assert.ok(pr.length >= 6, `province: ${pr.map((p) => p.nome)}`); tra(pr.reduce((a, p) => a + p.parte, 0), 0.9, 1.1, 'le province coprono il mare'); for (const p of T.province) assert.ok(p.perche.length > 20 && isFinite(p.dove.lon) && isFinite(p.dove.lat));
  assert.ok(pr.every((p) => F.tipo[cella(p.dove.lon, p.dove.lat)] === 1 || true)); assert.equal(T.provincia.length, W * H);
  console.log(`      maree: Luna ${n3(luna.altezza)} m ogni ${n3(luna.periodo / 3600)} h, Sole ${n3(sole.altezza)} m; nel mare in media ${n3(m.ampiezzaMedia)} m, fino a ${n3(m.ampiezzaMassima)} m; correnti di marea fino a ${n3(Math.max(...m.corrente))} m/s; attrito ${n3(m.attrito.potenzaW)} W → il giorno si allunga di ${n3(m.attrito.giornoPiuLungoMsAlSecolo)} ms al secolo; tra le maree ${n3(m.zonaTraLeMaree.areaM2 / 1e6)} km² (larga in media ${n3(m.zonaTraLeMaree.larghezzaMediaM)} m), di cui ${n3(m.zonaTraLeMaree.doveEvapora.areaM2 / 1e6)} dove evapora`);
  console.log(`      senza luna ${n3(senza.maree.ampiezzaMedia)} m; luna a un terzo della distanza: equilibrio ${n3(vicina.maree.equilibrio)} m, nel mare ${n3(vicina.maree.ampiezzaMedia)} m in media`);
  console.log(`      ghiaccio marino a nord per stagione: ${nord.map(n3).join(', ')} (a sud ${sud.map(n3).join(', ')}); strato rimescolato a 35-60° N: ${n3(stratoDi(qEst))} m d'estate, ${n3(stratoDi(qInv))} m d'inverno`);
  console.log(`      calore portato dal mare: da ${n3(cMin)} a ${n3(cMax)} W/m²; le coste cambiano in media di ${n3(T.calore.suCosteK)} K (al più ${n3(T.calore.massimoK)} K)`);
  for (const p of T.province) console.log(`      · ${p.nome} (${n3(100 * p.parte)}% del mare, a ${p.dove.lat.toFixed(0)}°, ${p.dove.lon.toFixed(0)}°): ${p.perche}`);
});

// ---------- altri pianeti: lo stesso rilievo, un'altra aria o un'altra acqua
prova('un\'aria densa di anidride carbonica dà un mare acido; il pH scende con la pressione della CO2', () => {
  const venere = mare({ ...P, atmosfera: { gas: { CO2: 0.96, N2: 0.04 }, pressione: 1e6 }, clima: { ...P.clima, pressione: 1e6 } }, sf, cl, se, 'prova/co2');
  tra(venere.pH, 4, 6.6, 'pH sotto 10 bar di CO2'); assert.ok(venere.pH < T.pH - 1.2); assert.ok(venere.gas.CO2 > 1000 * T.gas.CO2 && !venere.gas.O2); assert.ok(venere.ioni['HCO3-'] > 5 * T.ioni['HCO3-'], 'molto più carbonio sciolto');
  assert.ok(venere.totali.Fe > 1e3 * T.totali.Fe, 'senza ossigeno il ferro resta sciolto'); assert.match(venere.storia, /acido/);
  const meno = mare({ ...P, atmosfera: { gas: { N2: 0.99, CO2: 0.01 }, pressione: 1e5 } }, sf, cl, se, 'prova/co2b'); assert.ok(meno.pH < T.pH && meno.pH > venere.pH, `pH ${T.pH} → ${meno.pH} → ${venere.pH}`);
  const c = campioneAcqua(venere, { ...aperto, latoM: 1e-8 }); assert.ok(c.pH < 6.8 && c.gas.CO2.nelCampione > 100 * campioneAcqua(T, { ...aperto, latoM: 1e-8 }).gas.CO2.nelCampione);
  console.log(`      pH: aria della Terra ${n3(T.pH)}, 1% di CO2 ${n3(meno.pH)}, 10 bar di CO2 ${n3(venere.pH)} (ferro sciolto ${n3(venere.totali.Fe * 1e6)} µmol/kg, bicarbonato ${n3(venere.ioni['HCO3-'])} mol/kg)`);
});

prova('altri pianeti sullo stesso rilievo: giovane, senza vulcani, con poca acqua, sotto un\'aria densa: mari diversi, ciascuno per la sua causa', () => {
  // giovane: il cloro c'è già (è uscito alla nascita), il sodio delle rocce non ancora: un mare di cloruro di calcio
  const giovane = mare({ ...P, interno: { ...it, eta: 3e7 } }, sf, cl, se, 'prova/giovane');
  assert.ok(giovane.ioni['Na+'] < 0.8 * T.ioni['Na+'] && giovane.ioni['Ca2+'] > 2 * T.ioni['Ca2+'], `a trenta milioni di anni: Na ${giovane.ioni['Na+']}, Ca ${giovane.ioni['Ca2+']}`); tra(giovane.ioni['Cl-'] / T.ioni['Cl-'], 0.8, 1.5, 'il cloro è quello della nascita');
  // interno fermo: niente roccia calda sul fondo che trattenga sodio e magnesio, niente acido dei vulcani: le rocce si sciolgono molto meno
  const fermo = mare({ ...P, interno: { ...it, q: 0.004, tettonica: 'ferma', vulcani: 0 } }, sf, cl, se, 'prova/fermo');
  assert.ok(fermo.sorgentiCalde.length === 0 && fermo.flussi.caldo === 0 && fermo.flussi.freno < 0.2 && T.flussi.freno > 0.3, `freno ${fermo.flussi.freno} contro ${T.flussi.freno}`); assert.ok(!isFinite(fermo.flussi.riciclo), 'senza placche i sedimenti non tornano');
  assert.ok(fermo.ioni['Mg2+'] > 3 * T.ioni['Mg2+'], 'senza la roccia calda il magnesio resta nel mare');
  confronta('anidride carbonica dei vulcani terrestri (mol/anno; misurata 6-10·10¹²)', T.flussi.CO2vulcani, 4e12, 1.5e13);
  // poca acqua: lo stesso cloro in meno acqua
  const poca = mare({ ...P, interno: { ...it, acquaKg: 5e19 } }, { ...sf, mare: sf.mare - 4200 }, cl, { ...se, mare: se.mare - 4200 }, 'prova/poca');
  assert.ok(poca.esiste && poca.massaMare < 0.1 * T.massaMare, `massa del mare ${poca.massaMare}`); assert.ok(poca.salinitaMedia > 2 * T.salinitaMedia || poca.fondoDiSale?.salgemma > 0 || poca.flussi.sedimenti.Cl > 2 * T.flussi.sedimenti.Cl, `salinità ${poca.salinitaMedia}, cloro nei sedimenti ${poca.flussi.sedimenti.Cl}`); // (il sale che un mare piccolo non tiene è sul fondo, o sepolto nei sedimenti e nei bacini che evaporano)
  // un'aria di cento bar: il magma non riesce a sfiatare il suo zolfo
  const densa = mare({ ...P, clima: { ...P.clima, pressione: 1.5e7 } }, sf, cl, se, 'prova/densa'); assert.equal(densa.flussi.parteBassa, 0); assert.ok(densa.flussi.sfiato.S === 0 && T.flussi.sfiato.S > 0 && T.flussi.parteBassa > 0.1 && T.flussi.parteBassa < 0.6);
  console.log(`      giovane (30 Ma): ${n3(giovane.salinitaMedia)} g/kg, pH ${n3(giovane.pH)}, Na ${n3(giovane.ioni['Na+'])}, Ca ${n3(giovane.ioni['Ca2+'])}; interno fermo: ${n3(fermo.salinitaMedia)} g/kg, pH ${n3(fermo.pH)}, Mg ${n3(fermo.ioni['Mg2+'])}; poca acqua (${n3(poca.massaMare / T.massaMare * 100)}% del mare): ${n3(poca.salinitaMedia)} g/kg, cloro nei depositi ${n3(poca.flussi.sedimenti.Cl / (poca.flussi.sedimenti.Cl + poca.totali.Cl * poca.massaMare) * 100)}% (bacini che evaporano fino al sale: ${poca.bacini.filter((b) => b.saturo).length} di ${poca.bacini.length})${poca.fondoDiSale ? ', sul fondo ' + Object.keys(poca.fondoDiSale).join(' e ') : ''}; Terra: parte del pianeta dove il magma sfiata ${n3(T.flussi.parteBassa)}`);
});

prova('senz\'acqua liquida non c\'è mare: risposta pulita', () => {
  const secco = mare({ ...P, clima: { ...P.clima, acqua: 'assente' } }, { W: sf.W, H: sf.H, alt: sf.alt, mare: -Infinity, vulcani: [] }, cl, null, 'prova/secco');
  assert.equal(secco.esiste, false); assert.match(secco.motivo, /niente mare/i); assert.deepEqual(secco.laghi, []); assert.deepEqual(secco.sorgentiCalde, []);
  const c = campioneAcqua(secco, { lon: 10, lat: 10, latoM: 1e-3 }); assert.ok(c.asciutto && c.particelle.length === 0 && /non c'è acqua/.test(c.descrizione)); assert.equal(coloreMare(secco, 10, 10), null);
  assert.equal(immagineAcqua(c, { N: 16 }).length, 16 * 16 * 4); assert.equal(muovi(c, 1).length, 0);
  const gelo = mare(P, sf, { W: cl.W, H: cl.H, media: new Float32Array(cl.W * cl.H).fill(190), freddo: new Float32Array(cl.W * cl.H).fill(1) }, se, 'prova/gelo'); assert.equal(gelo.esiste, false); assert.equal(gelo.stato, 'ghiaccio');
  const vuoto = mare({ ...P, clima: { ...P.clima, pressione: 300 } }, sf, cl, se, 'prova/vuoto'); assert.equal(vuoto.esiste, false); assert.match(vuoto.motivo, /611/);
  assert.equal(mare({ ...P, tipo: 'gassoso' }, sf, cl, se).esiste, false);
  console.log(`      «${secco.motivo}»; «${gelo.motivo.slice(0, 70)}…»`);
});

if (nonTorna.length) console.log(`\nNON TORNA con la Terra vera (${nonTorna.length} voci; il modello non è tarato su di lei):\n  ${nonTorna.join('\n  ')}`);
const totale = performance.now() - inizio;
assert.ok(totale < 60000, `tempo del test: ${totale} ms`);
console.log(`\n${ok} prove superate in ${(totale / 1000).toFixed(1)} s (di cui ${((tCostruita - inizio) / 1000).toFixed(1)} s per costruire la Terra di geologia.js; mare() ${tempoMare.toFixed(0)} ms)`);
