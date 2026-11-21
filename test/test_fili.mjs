// test_fili.mjs — I FILI CHE ESISTEVANO GIÀ, collegati (blocco 1 di «Come farlo emergere»): il ciclo del carbonio nel clima,
// il giorno nella dinamo, ciò che il piccolo fa al grande (argon, energia per la chimica, magnetopausa) nel sistema, il
// mare che torna al clima, i vulcani sulle salite del mantello, le stelle vere per il mare.
// I riscontri sono mondi veri COSTRUITI A MANO (la Terra, Venere e Marte con la loro aria): non dipendono da quale mondo
// esce dal caso. Ogni riscontro è stampato come numero; se non torna c'è scritto «NON TORNA» (e la prova non allarga
// le soglie: conta quanti non tornano).
import assert from 'node:assert/strict';
import * as CH from '../src/camera/chimica.js';
import * as LG from '../src/camera/leggi.js';
import * as GE from '../src/camera/geologia.js';
import * as MA from '../src/camera/mare.js';
import * as CO from '../src/camera/cosmo.js';
import * as M from '../src/camera/materia.js';
import * as R from '../src/camera/risalita.js';
import { stella as stellaVera } from '../src/camera/stelle.js';
import { evolviTettonica } from '../src/camera/tettonica.js';
import { sorgente } from '../src/camera/eventi.js';

let ok = 0; const nonTorna = [];
const prova = (nome, f) => { f(); ok++; console.log('  ✓', nome); };
const tra = (x, a, b, che) => assert.ok(x >= a && x <= b, `${che}: ${x} (atteso tra ${a} e ${b})`);
const n = (x, c = 3) => (Math.abs(x) >= 1e4 || (Math.abs(x) < 1e-2 && x !== 0) ? Number(x).toExponential(c - 1) : String(+Number(x).toPrecision(c))).replace('.', ',');
// un riscontro col mondo vero: stampato sempre; fuori dall'intervallo chiesto è «NON TORNA» (e resta scritto in fondo)
const riscontro = (che, x, a, b, vero, perche = '') => { const torna = x >= a && x <= b; console.log(`      ${torna ? '=' : 'NON TORNA'} ${che}: ${n(x, 4)} (chiesto ${n(a)}–${n(b)}; vero ${vero})${torna || !perche ? '' : ` — ${perche}`}`); if (!torna) nonTorna.push(`${che}: ${n(x, 4)} (chiesto ${n(a)}–${n(b)})${perche ? ` — ${perche}` : ''}`); return torna; };

// ---------- i mondi veri, con la loro aria (pressioni parziali in Pa dei gas che non condensano e non reagiscono)
const VERI = {
  Terra: { massaKg: 5.972e24, raggioM: 6.371e6, ua: 1, giorno: 86164, obliquita: 23.44, composizione: { ferro: 0.32, roccia: 0.674, acqua: 0.006 }, gas: { N2: 7.91e4, O2: 2.12e4, CH4: 0.19 } },
  Venere: { massaKg: 4.867e24, raggioM: 6.052e6, ua: 0.723, giorno: 243 * 86400, obliquita: 2.6, composizione: { ferro: 0.31, roccia: 0.69, acqua: 0 }, gas: { CO2: 8.88e6, N2: 3.2e5, SO2: 1.4e3 } },
  Marte: { massaKg: 6.417e23, raggioM: 3.3895e6, ua: 1.524, giorno: 88643, obliquita: 25.2, composizione: { ferro: 0.24, roccia: 0.76, acqua: 0 }, gas: { CO2: 581, N2: 16.5, O2: 0.8 } } };
// lo stesso cammino di cosmo.js sistema(): interno (con il giorno), acqua in superficie, i gas radiogenici che la gravità
// tiene, clima e aria insieme (con il calore dei vulcani, se ce ne sono)
function mondo(nome, { ciclo = true, gas = true, giorno = null } = {}) {
  const m = VERI[nome], p = { id: 0, tipo: 'roccioso', massaKg: m.massaKg, raggioM: m.raggioM, composizione: m.composizione, involucro: 0, giorno: giorno ?? m.giorno, obliquita: m.obliquita, bloccato: false, Lw: LG.LSOLE, aM: m.ua * LG.UA, Mstella: LG.MSOLE, Tstella: 5772,
    anno: 2 * Math.PI * Math.sqrt((m.ua * LG.UA) ** 3 / (6.674e-11 * LG.MSOLE)), origine: 12345 };
  p.interno = GE.interno(p, { eta: 4.5e9, Z: 1 }); p.B0 = p.interno.B0; const ac = LG.acquaInSuperficie(p); p.interno.acquaKg = ac.kg;
  const gr = R.gasRadiogenici({ pianeta: { g: (6.674e-11 * p.massaKg) / p.raggioM ** 2, raggioM: p.raggioM, eta: 4.5e9 }, stella: { Lw: p.Lw, aM: p.aM } }, { P: { tipo: p.tipo, massaKg: p.massaKg, raggioM: p.raggioM, composizione: p.composizione, interno: p.interno, Lw: p.Lw, aM: p.aM } });
  p.radiogenici = gr; const inerti = { Ar: gr.argon40.trattenuto ? gr.perLAria.Ar : 0, He: gr.elio4.trattenuto ? gr.perLAria.He : 0 };
  const r = CH.climaEAria({ Lw: p.Lw, aM: p.aM, massaKg: p.massaKg, raggioM: p.raggioM, tipo: p.tipo, acqua: ac.frazione, inerti, acquaKg: ac.kg, anno: p.anno, giorno: p.giorno, obliquita: p.obliquita, bloccato: false, placche: p.interno.tettonica === 'a placche', composizione: p.composizione, involucro: 0,
    calore: ciclo && p.interno.vulcani > 0 ? p.interno.q : 0, ...(gas ? { gas: m.gas } : {}) }, { Z: 1 });
  p.clima = r.clima; p.atmosfera = r.atmosfera; return p;
}
const TERRA = mondo('Terra'), VENERE = mondo('Venere'), MARTE = mondo('Marte');
const pCO2 = (p) => ((p.atmosfera.gas.CO2 || 0) * p.atmosfera.pressione) / 1e5; // bar

prova('il ciclo del carbonio acceso: la Terra con la sua aria vera sta a 288 K, con la CO2 che le rocce lasciano', () => {
  const c = TERRA.clima;
  assert.equal(c.acqua, 'liquida'); assert.ok(c.co2Ciclo > 0 && !c.termostato, 'il mare è aperto per il ciclo, non per il termostato');
  riscontro('Terra, gas veri, ciclo acceso: temperatura (K)', c.T, 285, 291, '288');
  riscontro('pCO2 del ciclo (bar)', c.co2Ciclo / 1e5, 1e-4, 1e-3, '2,8·10⁻⁴ prima delle fabbriche, 4,2·10⁻⁴ oggi');
  // UNA GRANDEZZA, UNA FONTE: la CO2 dell'aria È quella del ciclo, e l'aria è stata calcolata alla temperatura del clima
  tra(pCO2(TERRA) / (c.co2Ciclo / 1e5), 0.999, 1.001, "CO2 dell'aria / CO2 del ciclo"); tra(Math.abs(c.Taria - c.T), 0, 1, "|T a cui è stata fatta l'aria − T del clima| (K)");
  // la stessa legge, chiamata da sola alla temperatura trovata, ridà quella pressione
  const terre = (1 - c.mare) * (1 - c.ghiaccio), solo = CH.co2DelCiclo({ T: c.Taria, calore: TERRA.interno.q, raggioM: TERRA.raggioM, massaKg: TERRA.massaKg, composizione: TERRA.composizione, terre, continenti: 1 });
  tra(solo / (c.co2Ciclo / 1e5), 0.5, 2, 'co2DelCiclo alla stessa temperatura e con le stesse terre');
  // senza il ciclo il mare resta aperto solo per il termostato (al gelo); con il ciclo fa più caldo
  const spento = mondo('Terra', { ciclo: false }); assert.ok(spento.clima.termostato > 0 && spento.clima.T < c.T - 5, `a ciclo spento: ${spento.clima.T} K`);
  console.log(`      a ciclo spento: ${n(spento.clima.T, 4)} K sul termostato (${n(spento.clima.termostato / 1e5)} bar di CO2); vulcani ${n(CH.vulcani({ calore: TERRA.interno.q, raggioM: TERRA.raggioM, composizione: TERRA.composizione }).CO2)} mol/anno di CO2 (misurate 6–10·10¹²)`);
});

prova('la CO2 sopra un mare ha una legge sola: mai sotto l\'equilibrio di Urey, e il ciclo risponde alla temperatura', () => {
  const dati = { calore: 0.087, raggioM: 6.371e6, massaKg: 5.972e24, composizione: VERI.Terra.composizione, terre: 0.25, continenti: 1 }, p = (T) => CH.co2DelCiclo({ ...dati, T });
  for (const T of [275, 285, 290, 300, 320, 360, 450]) assert.ok(p(T) >= (CH.pressioneCO2Urey(T) / 1e5) * 0.999, `a ${T} K il ciclo scende sotto Urey: ${p(T)} bar contro ${CH.pressioneCO2Urey(T) / 1e5}`);
  assert.ok(p(275) > p(285) && p(285) > p(290) && p(290) >= p(300), 'più caldo, rocce consumate più in fretta, meno CO2');
  tra(p(450) / (CH.pressioneCO2Urey(450) / 1e5), 0.999, 1.001, 'al caldo il ciclo è fermo sul pavimento di Urey (prima scendeva a 10⁻⁹ bar, con 10⁴ Pa nell\'aria)');
  // senza terre emerse la prende il fondo del mare (fondoConsuma): sotto un mare intero la CO2 sale, ma si ferma (prima: il tetto
  // dei cento bar, messo a mano); senza fondo né terre si accumula fino al capo della ricerca; senza vulcani non c'è sorgente
  const soloFondo = CH.co2DelCiclo({ ...dati, T: 288, terre: 0 }); assert.ok(soloFondo > p(288) && soloFondo < CH.CICLO_FINO, `solo il fondo: ${soloFondo} bar`);
  assert.equal(CH.co2DelCiclo({ ...dati, T: 288, terre: 0, mare: 0 }), CH.CICLO_FINO); assert.equal(CH.co2DelCiclo({ ...dati, T: 288, calore: 0 }), 0);
  // il fondo di oggi: tra 0,225 e 0,675·10¹² mol C/anno (Krissansen-Totton, Arney e Catling 2018, tab. S2: 0,5–1,5 volte la precipitazione nei pori, 0,45)
  const v = CH.vulcani({ calore: 0.087, raggioM: 6.371e6, composizione: VERI.Terra.composizione }), oggi = CH.fondoConsuma(2.8e-4, { T: 288, calore: 0.087, magma: v.magma, mare: 0.71, basalto: v.rocce.basalto });
  tra(oggi, 0.225e12, 0.675e12, 'il fondo della Terra di oggi (mol C/anno)');
  // più calore dall'interno, più vulcani, più CO2 e più caldo (un pianeta più giovane)
  const caldo = CH.co2DelCiclo({ ...dati, T: 288, calore: 0.17 }); assert.ok(caldo > p(288), `il doppio del calore: ${caldo} contro ${p(288)} bar`);
  console.log(`      pCO2 del ciclo (bar) a 275, 285, 290, 300 K con un quarto di terre: ${[275, 285, 290, 300].map((T) => n(p(T))).join(', ')}; Urey a 300 K: ${n(CH.pressioneCO2Urey(300) / 1e5)}; senza terre ${n(soloFondo)} bar; il fondo di oggi ${n(oggi)} mol C/anno`);
});

prova('Venere e Marte con la loro aria: niente mare, niente ciclo; le temperature della serra', () => {
  assert.equal(VENERE.clima.acqua, 'assente'); assert.equal(VENERE.clima.co2Ciclo, undefined); assert.equal(MARTE.clima.co2Ciclo, undefined);
  tra(pCO2(VENERE), 85, 92, 'CO2 di Venere (bar): tutta nell\'aria'); riscontro('pressione su Marte (Pa)', MARTE.clima.pressione, 550, 650, '610', `l'argon: risalita.js prende la parte uscita dall'interno da una tabella per regime (ferma 0,02 · con vulcani 0,25), tarata con Marte «fermo»; la storia dà a Marte un coperchio unico che fonde ancora un poco (${MARTE.interno.tettonica}), e l'argon viene ${n((MARTE.atmosfera.gas.Ar || 0) * MARTE.atmosfera.pressione)} Pa (vero ~12): la parte degassata va letta dalla storia, non da una tabella`);
  riscontro('Marte: temperatura (K)', MARTE.clima.T, 207, 217, '210–214');
  riscontro('Venere: temperatura (K)', VENERE.clima.T, 713, 757, '735', `l'albedo qui è ${n(VENERE.clima.albedo)} (roccia nuda): le nuvole di acido solforico, che ne fanno 0,76, non ci sono. Con la luce assorbita vera la stessa serra dà ${n(229 * Math.pow(1 + 0.75 * VENERE.clima.tau, 0.25), 4)} K`);
  // (l'interno viene dalla storia del pianeta, storia.js: Marte, asciutto, ha un coperchio fermo per il criterio di
  // Korenaga, non per una soglia sulla massa; sotto il coperchio il mantello fonde ancora un poco: Marte ha avuto vulcani
  // fino a pochi milioni di anni fa. Senza mare il ciclo del carbonio resta comunque spento)
  assert.notEqual(MARTE.interno.tettonica, 'a placche'); assert.notEqual(VENERE.interno.tettonica, 'a placche'); assert.equal(TERRA.interno.tettonica, 'a placche');
});

prova('il giorno entra nella dinamo: la Terra ha un dipolo, Venere (243 giorni) no, Marte non ha dinamo', () => {
  tra(TERRA.interno.rossby, 0.085, 0.095, 'numero di Rossby locale della Terra (il dato: 0,09)'); assert.equal(TERRA.interno.dipolo, true);
  riscontro('Terra: campo all\'equatore (T)', TERRA.B0, 2.5e-5, 3.6e-5, '3,1·10⁻⁵');
  assert.ok(VENERE.interno.rossby > 0.12 && VENERE.interno.dipolo === false, `Venere: Ro_l = ${VENERE.interno.rossby}`); assert.ok(VENERE.interno.dinamo, 'il suo nucleo, qui, è liquido: è la rotazione che manca');
  const venereSvelta = mondo('Venere', { giorno: 86400 }); tra(VENERE.B0 / venereSvelta.B0, 0.0999, 0.1001, 'senza dipolo il campo in superficie è un decimo'); assert.equal(venereSvelta.interno.dipolo, true);
  riscontro('Venere: campo in superficie (T)', VENERE.B0, 0, 5e-9, 'nessuno misurabile (< 5·10⁻⁹)', 'la legge dice solo «almeno dieci volte più debole»: quanto, senza dipolo, non lo sa');
  // Marte: la soglia di prima (nucleo liquido solo sopra 3500 km di raggio) non c'è più. La storia termica dà a un Marte
  // con gli elementi leggeri della Terra un nucleo interno che cresce e una dinamo debole: il Marte vero non ne ha
  // (nucleo ricco di zolfo, tutto liquido). È un difetto del modello e resta scritto (vedi anche test_storia)
  riscontro('Marte: campo in superficie (T)', MARTE.B0, 0, 5e-9, 'nessuna dinamo da ~4 miliardi di anni', 'storia.js non sa che il nucleo di Marte è ricco di zolfo: lo fa gelare dal centro, e il nucleo interno che cresce tiene viva una dinamo');
  assert.equal(MARTE.interno.dinamo ? MARTE.B0 > 1e-9 : MARTE.B0 === 1e-9, true, 'B0 = 10⁻⁹ T se e solo se non c\'è dinamo');
  // la soglia: una Terra che gira più piano perde il dipolo; e chi non dà il giorno ottiene la dinamo di prima
  const lenta = mondo('Terra', { giorno: 2 * 86164 }); assert.equal(lenta.interno.dipolo, false); tra(lenta.interno.rossby / TERRA.interno.rossby, 2.24, 2.25, 'Ro_l ∝ giorno^(7/6)');
  // (lo stesso pianeta senza il giorno: la storia termica è la stessa, manca solo il numero di Rossby)
  const { giorno: _g, interno: _i, clima: _c, atmosfera: _a, ...terraSenzaGiorno } = TERRA, senza = GE.interno(terraSenzaGiorno, { eta: 4.5e9, Z: 1 }); assert.equal(senza.B0, TERRA.B0); assert.equal(senza.rossby, undefined);
  console.log(`      Ro_l: Terra ${n(TERRA.interno.rossby)}, Venere ${n(VENERE.interno.rossby)}; una Terra con il giorno di ${n((86164 * Math.pow(0.12 / TERRA.interno.rossby, 6 / 7)) / 3600)} ore è sulla soglia (0,12)`);
});

prova('ciò che il piccolo fa al grande, sulla Terra a mano: argon nell\'aria, magnetopausa, energia per la chimica', () => {
  const qui = M.luogoDaAria({ P: TERRA }), opz = { P: TERRA, stella: { T: 5772, eta: 4.6e9, massa: 1 } }, aria = TERRA.atmosfera, v = R.ventoStellare(qui, opz), e = R.energiaPerLaChimica(qui, opz);
  riscontro("argon nell'aria (% in volume)", 100 * aria.gas.Ar, 0.8, 1.05, '0,934');
  riscontro('magnetopausa (raggi del pianeta)', v.magnetopausa, 8.5, 11.5, '~10');
  tra(aria.gas.Ar * aria.pressione, 1000, 1800, "pressione dell'argon (Pa; vera 946)"); tra(Object.values(aria.gas).reduce((a, b) => a + b, 0), 0.999999, 1.000001, 'le frazioni fanno uno'); assert.equal(aria.pressione, TERRA.clima.pressione, "una pressione sola: quella dell'aria è quella del clima");
  assert.ok(TERRA.radiogenici.argon40.trattenuto && !TERRA.radiogenici.elio4.trattenuto); assert.ok((MARTE.atmosfera.gas.Ar || 0) > 0, "anche Marte tiene il suo argon");
  assert.ok(!aria.gas.He, "l'elio fugge: non è nell'aria");
  // al freddo l'argon gela come ogni altro gas: sopra un mondo a 30 K non ne resta
  const gelo = CH.atmosfera({ tipo: 'roccioso', massaKg: 5.972e24, raggioM: 6.371e6, composizione: VERI.Terra.composizione, clima: { T: 30, acqua: 'ghiaccio', tenuti: ['azoto', 'anidride carbonica'], pressione: 0 } }, { Z: 1, inventario: true, inerti: { Ar: 1400 } });
  assert.ok(!(gelo.gas?.Ar * gelo.pressione > 0.01), `argon a 30 K: ${gelo.gas?.Ar * gelo.pressione} Pa (ne erano usciti 1400)`);
  tra(e.relativa, 0.9, 1.1, "energia per la chimica dell'aria (1 = la Terra)");
  // prebiotica riceve lo STATO dell'acqua (prima un sì/no, che non era mai «liquida»): con un mare, ora lo vede
  const pre = (acqua) => CH.prebiotica({ atmosfera: aria, T: TERRA.clima.T, energia: e.relativa, pressione: TERRA.clima.pressione, acqua });
  assert.equal(pre(TERRA.clima.acqua).acquaLiquida, true); assert.equal(pre(true).acquaLiquida, false, 'il vecchio errore: un booleano non è «liquida»'); assert.equal(pre('ghiaccio').acquaLiquida, false);
  // la fascia di radiazione: finisce alla magnetopausa, e il suo massimo è quello calcolato
  const Pl = { densitaAnello: () => 0 }, P = { B0: TERRA.B0, raggioM: TERRA.raggioM, magnetopausa: v.magnetopausa };
  let fmax = 0, rmax = 0; for (let r = 1.15; r < 8; r += 0.002) { const f = CO.fascia(P, Pl, r); if (f > fmax) { fmax = f; rmax = r; } }
  tra(fmax / CO.FASCIA_MAX, 0.9999, 1.0001, 'massimo della fascia / FASCIA_MAX'); tra(rmax, 2.23, 2.25, 'dove (raggi)');
  const stretta = { ...P, magnetopausa: 3 }; assert.ok(CO.fascia(stretta, Pl, 2.9) > 0 && CO.fascia(stretta, Pl, 3.1) === 0 && CO.fascia(P, Pl, 3.1) > 0, 'oltre la magnetopausa niente fascia');
  assert.equal(CO.fascia(P, Pl, v.magnetopausa + 0.01), 0); assert.equal(CO.fascia({ B0: TERRA.B0, raggioM: TERRA.raggioM }, Pl, 3.1), CO.fascia(P, Pl, 3.1), 'senza magnetopausa data, come prima');
  console.log(`      aria: ${Object.entries(aria.gas).slice(0, 5).map(([f, x]) => `${f} ${n(100 * x)}%`).join(', ')}; vento ${n(v.pressione * 1e9)} nPa; energia: UV ${n(e.superficie.ultravioletto)}, fulmini ${n(e.superficie.fulmini)}, aurore ${n(e.superficie.aurore)}, cosmici ${n(e.superficie.cosmici)} W/m²`);
});

prova('nel sistema di cosmo.js i fili ci sono: aria con i radiogenici, energia, magnetopausa, seme del meteo, stella vera', () => {
  let conAria = 0, conAr = 0, conMp = 0, liquidi = 0, vistoLiquido = 0, cicli = 0;
  for (const sid of [7, 68, 129, 190, 251, 312]) { const S = CO.sistema(1, 0, sid);
    for (const p of S.pianeti) {
      assert.ok(p.semeMeteo && p.semeMeteo.fasi.length === 3 && p.semeMeteo.evento.endsWith(`pianeta ${p.id}/meteo/seme/0`), 'il seme del meteo è un evento del pianeta');
      assert.ok(p.magnetopausa >= 0, 'magnetopausa'); if (isFinite(p.magnetopausa) && p.magnetopausa > 1.15) conMp++;
      if (S.stella.T > 0) assert.equal(p.Tstella, S.stella.T, 'la temperatura della stella vera');
      if (p.tipo !== 'gassoso') assert.ok(p.interno.rossby === undefined || p.interno.dipolo === !(p.interno.rossby > 0.12));
      if (!p.atmosfera || !(p.atmosfera.pressione > 0)) continue; conAria++;
      tra(Object.values(p.atmosfera.gas).reduce((a, b) => a + b, 0), 0.999, 1.001, 'le frazioni dei gas'); if (p.atmosfera.gas.Ar > 0) conAr++;
      assert.ok(p.energiaChimica && p.energiaChimica.relativa >= 0 && isFinite(p.energiaChimica.relativa), 'energia per la chimica');
      if (p.clima.acqua === 'liquida') { liquidi++; if (p.prebiotica?.acquaLiquida) vistoLiquido++; if (p.clima.co2Ciclo > 0) { cicli++; assert.ok(p.interno.vulcani > 0, 'il ciclo solo dove ci sono vulcani'); tra(Math.abs(p.clima.Taria - p.clima.T), 0, 3, 'aria e clima alla stessa temperatura'); } }
    } }
  assert.ok(conAria > 5 && conAr > 0, `pianeti con aria ${conAria}, con argon ${conAr}`); assert.equal(vistoLiquido, liquidi, 'prebiotica vede il mare dove c\'è');
  console.log(`      in sei sistemi: ${conAria} pianeti con un'aria, ${conAr} con argon radiogenico, ${conMp} con una magnetosfera oltre 1,15 raggi, ${liquidi} con un mare (${cicli} tenuti dal ciclo), tutti visti da prebiotica`);
});

// IL CALORE CHE L'ARIA PORTA nel clima a fasce è una legge (leggi.js: L'ARIA CHE PORTA IL CALORE), non più 0,6·√p tarato
// sulla Terra: dipende dal giorno, dal raggio, dalla gravità, dalla pressione, dal gradiente e dall'attrito. I riscontri
// col vero sono stampati come numeri; il confronto con i venti di meteo.js su una griglia di pianeti è in test_meteo
prova('il calore che l\'aria porta nel clima a fasce è una legge: la Terra, Marte, un mondo d\'acqua; il giorno conta', () => {
  const c = TERRA.clima, t = c.fasce.T, H = t.length, equatore = 0.5 * (t[H / 2 - 1] + t[H / 2]), polo = 0.5 * (t[0] + t[H - 1]), B = (4 * 5.67e-8 * c.T ** 3) / (1 + 0.75 * c.tau);
  assert.ok(c.D > 0 && c.vento >= LG.ARIA.raffica && c.scambio > 0 && c.trasporto.flusso.length === H - 1 && c.trasporto.aria.length === H, 'clima() porta con sé il calore portato, il vento, lo scambio e il flusso');
  // l'aria sposta il calore e non ne crea: ciò che dà alle fasce, sommato sul pianeta, fa zero (contro ciò che sposta)
  { let somma = 0, assoluta = 0; for (let j = 0; j < H; j++) { const w = Math.cos((c.fasce.lat[j] * Math.PI) / 180); somma += w * c.trasporto.calore[j]; assoluta += w * Math.abs(c.trasporto.calore[j]); } tra(Math.abs(somma) / assoluta, 0, 1e-6, 'calore creato dall\'aria / calore spostato'); }
  riscontro('Terra a fasce: temperatura (K)', c.T, 285, 291, '288 ± 3');
  // (la riprova: lo stesso bilancio con una diffusione uniforme di 0,3 W/m²/K, il vecchio modello di Budyko-Sellers)
  const uniforme = LG.bilancioPerFasce({ S0: TERRA.Lw / (4 * Math.PI * TERRA.aM ** 2), anno: TERRA.anno, obliquita: TERRA.obliquita, mare: c.mare, pressione: c.pressione, tau: c.tau, raggioM: TERRA.raggioM, D: 0.3, Tavvio: c.Tavvio }), tu = uniforme.fasce;
  const perche = `qui la luce irradiata cresce di ${n(B)} W/m² per ogni grado (serra fissa: 4σT³/(1 + ¾τ)); sulla Terra vera di ~2 (il vapore cresce col caldo). Con questa serra a tenere il contrasto sui 40 K bastano ~2 PW (con una diffusione uniforme di 0,3 W/m²/K: ${n(0.5 * (tu[H / 2 - 1] + tu[H / 2]) - 0.5 * (tu[0] + tu[H - 1]))} K con ${n(uniforme.trasporto.massimo / 1e15)} PW), dove alla Terra vera ne servono 5–6: contrasto e trasporto veri insieme qui non possono tornare, con nessuna legge del trasporto. La legge porta in proporzione alla 5,6ª potenza del gradiente: sul profilo misurato della Terra (42 K) dà di più (test_meteo lo stampa). Manca il calore che porta il mare (un terzo, ai tropici)`;
  riscontro('Terra a fasce: contrasto equatore − polo (K)', equatore - polo, 40, 45, '~40–45', perche);
  riscontro('Terra a fasce: trasporto massimo verso i poli (PW)', c.trasporto.massimo / 1e15, 5, 6, '5–6 (aria e mare)', perche);
  riscontro('Terra a fasce: latitudine del trasporto massimo (gradi)', c.trasporto.latitudine, 35, 40, '35–40', 'le fasce sono larghe 11°: i paralleli tra una fascia e l\'altra stanno a 34° e a 45°');
  riscontro('Marte a fasce: temperatura (K)', MARTE.clima.T, 210, 214, '210–214');
  // un mondo d'acqua: la Terra tutta mare, con la sua aria (stessa pressione, stessa serra): non deve gelare
  const acqua = LG.clima({ Lw: TERRA.Lw, aM: TERRA.aM, massaKg: TERRA.massaKg, raggioM: TERRA.raggioM, tipo: 'roccioso', acqua: 0.05, acquaKg: 0.05 * TERRA.massaKg, anno: TERRA.anno, giorno: TERRA.giorno, obliquita: TERRA.obliquita, aria: { pressione: c.pressione, tau: c.tau } });
  tra(acqua.mare, 0.999, 1, 'mare del mondo d\'acqua'); riscontro('mondo d\'acqua (la Terra tutta mare, con la sua aria): temperatura (K)', acqua.T, 273.15, 330, 'non gela', `ghiaccio ${n(acqua.ghiaccio)}, albedo ${n(acqua.albedo)}`);
  riscontro('mondo d\'acqua: ghiaccio (parte del pianeta)', acqua.ghiaccio, 0, 0.5, 'il mare resta aperto');
  // IL GIORNO CONTA (prima no): la stessa Terra con il giorno di 6 ore tiene il caldo all'equatore, con il giorno di 16
  // giorni la cella arriva ai poli; e Venere, che gira in 243 giorni sotto 92 bar, è quasi uniforme
  const con = (giorno) => { const x = mondo('Terra', { giorno }).clima, f = x.fasce.T; return { x, contrasto: 0.5 * (f[H / 2 - 1] + f[H / 2]) - 0.5 * (f[0] + f[H - 1]) }; }, svelta = con(6 * 3600), lenta = con(16 * 86400);
  assert.ok(svelta.contrasto > equatore - polo + 5 && lenta.contrasto < equatore - polo - 5, `contrasto equatore − polo: ${svelta.contrasto} K con il giorno di 6 ore, ${equatore - polo} K con 24, ${lenta.contrasto} K con 16 giorni`);
  const tv = VENERE.clima.fasce.T; tra(Math.max(...tv) - Math.min(...tv), 0, 10, 'Venere: differenza tra la fascia più calda e la più fredda (K; misurata: pochi gradi)');
  console.log(`      Terra a fasce: ${n(polo, 4)} K ai poli, ${n(equatore, 4)} K all'equatore; calore portato ${n(c.D)} W/m²/K (equivalente), ${n(c.trasporto.massimo / 1e15)} PW a ${n(c.trasporto.latitudine)}°; vento al suolo ${n(c.vento)} m/s (misurato ~6–7), scambio con l'aria ${n(c.scambio)} W/m²/K`);
  console.log(`      contrasto equatore − polo con il giorno di 6 ore, 24 ore, 16 giorni: ${n(svelta.contrasto)}, ${n(equatore - polo)}, ${n(lenta.contrasto)} K (calore portato ${n(svelta.x.D)}, ${n(c.D)}, ${n(lenta.x.D)} W/m²/K); Marte: ${n(MARTE.clima.D)} W/m²/K, vento ${n(MARTE.clima.vento)} m/s (misurato 2–10: qui troppo, il vento della cella in un'aria sottile); Venere: ${n(VENERE.clima.D)} W/m²/K, ${n(Math.max(...tv) - Math.min(...tv))} K da una fascia all'altra`);
});

prova('le stelle di mare.js e di risalita.js sono quelle di stelle.js (non più le formule di leggi.js)', () => {
  const m = R.mondoDi(M.luogoDaAria({ P: { ...TERRA, Tstella: undefined, Mstella: 0.5 * LG.MSOLE } }), { P: { ...TERRA, Tstella: undefined, Mstella: 0.5 * LG.MSOLE } });
  assert.equal(m.Tst, stellaVera(0.5).T); assert.notEqual(m.Tst, LG.stella(0.5).T); assert.equal(R.mondoDi(M.luogoDaAria({ P: TERRA }), { P: TERRA }).Tst, 5772, 'se il pianeta porta la temperatura della sua stella, è quella');
  assert.equal(LG.fine, undefined, 'la vecchia fine() di leggi.js non c\'è più');
});

// ---------- la mappa: i vulcani, il clima a giri, il mare che torna al clima (costa: una tettonica, tre circolazioni, un mare)
const T0 = performance.now(), sf = GE.superficiePianeta('fili|terra', TERRA, TERRA.interno, TERRA.origine), cl = GE.climaSuperficie('fili|terra', TERRA, sf), se = GE.erosione('fili|terra', sf, cl);
const acque = MA.mare(TERRA, se, cl, se, 'fili|terra/mare'), clMare = GE.climaConIlMare('fili|terra', TERRA, sf, cl, acque);

prova('i vulcani stanno sulle salite del mantello (tettonica.js), il più caldo per primo', () => {
  const tt = { salite: sf.tettonica.salite }; // (il campo del mantello della STESSA storia che ha fatto la superficie: superficiePianeta lo porta con sé. Prima la prova rifaceva la tettonica con gli stessi argomenti; ora la superficie le passa anche la litosfera, l'acqua e la gravità, e rifarla qui a mano sarebbe una seconda fonte)
  assert.ok(tt.salite && tt.salite.length === sf.W * sf.H); assert.equal(sf.vulcani.length, TERRA.interno.vulcani);
  let mx = 0; for (const v of tt.salite) if (v > mx) mx = v; const u = sf.vulcani.map(([i, j]) => tt.salite[j * sf.W + i]);
  for (const [k, v] of u.entries()) { assert.ok(v > 0, `il vulcano ${k} sta dove il mantello scende: ${v}`); if (k) assert.ok(v <= u[k - 1] + 1e-12, 'in ordine: il più caldo per primo'); }
  // (la cima più alta tra quelle che geologia.js cerca: i massimi locali del campo sulle righe 1…H−2. Le due righe dei
  // poli non le guarda: se la salita più forte del pianeta cade lì — con il calore che la storia dà oggi alla Terra capita
  // — il primo vulcano sta sulla cima più alta delle altre righe, e lo si dice)
  let cima = 0; for (let j = 1; j < sf.H - 1; j++) for (let i = 0; i < sf.W; i++) { const v = tt.salite[j * sf.W + i]; if (!(v > cima)) continue; let ok = true; for (let b = -1; b <= 1 && ok; b++) for (let a = -1; a <= 1; a++) if ((a || b) && tt.salite[(j + b) * sf.W + ((i + a + sf.W) % sf.W)] > v) { ok = false; break; } if (ok) cima = v; }
  tra(u[0] / cima, 0.999, 1.001, 'il primo sta sulla cima più alta del campo (tra quelle che geologia.js cerca)');
  if (cima < 0.999 * mx) console.log(`      (la salita più forte del pianeta, ${n(mx / cima, 4)} volte quella cima, sta su una riga dei poli, dove geologia.js non mette vulcani)`);
  // la superficie senza storia degli urti (com'è questa) parte dallo stesso seme: è la stessa tettonica
  console.log(`      ${sf.vulcani.length} vulcani; il mantello sale lì di ${u.map((v) => n(v / mx, 2)).join(', ')} (1 = la salita più forte)`);
});

prova('clima e aria si rispondono a giri fino a fermarsi; il clima per fasce e quello della mappa danno la stessa Terra', () => {
  assert.ok(cl.meteo && cl.giri >= 3 && cl.storiaGiri.length === cl.giri, `giri: ${cl.giri}`);
  const ultimo = Math.abs(cl.storiaGiri[cl.giri - 1] - cl.storiaGiri[cl.giri - 2]); riscontro('ultimo passo dei giri clima ↔ aria (K)', ultimo, 0, 0.5, 'fermo sotto mezzo grado');
  riscontro('clima a fasce − mappa con i venti (K)', Math.abs(cl.Tglobale - TERRA.clima.T), 0, 2, 'entro 2', `nuvole di meteo.js ${n(cl.meteo.nuvoleMedie)} contro ${n(TERRA.clima.nuvole)} attese, calore portato ${n(cl.meteo.diffusivita)} contro ${n(TERRA.clima.D)}`);
  riscontro('mappa con i venti e il mare: temperatura (K)', clMare.Tglobale, 285, 291, '288');
  console.log(`      per fasce ${n(TERRA.clima.T, 4)} K; sulla mappa ${cl.storiaGiri.map((t) => n(t, 4)).join(' → ')} K (senza venti, poi ${cl.giri - 1} giri d'aria); nuvole ${n(cl.meteo.nuvoleMedie)} (attese ${n(TERRA.clima.nuvole)}), calore portato ${n(cl.meteo.diffusivita)} W/m²/K (atteso ${n(TERRA.clima.D)})`);
});

prova('il mare torna al clima: il calore che le correnti spostano (a somma nulla) e l\'albedo della sua superficie', () => {
  assert.ok(acque.esiste && acque.caloreDalMare.length === cl.W * cl.H && acque.albedo.length % (cl.W * cl.H) === 0);
  const m = clMare.conIlMare; assert.ok(m && isFinite(m.dT)); assert.notEqual(clMare, cl); assert.equal(clMare.meteo, cl.meteo);
  riscontro('clima a fasce − mappa con i venti e il mare (K)', Math.abs(clMare.Tglobale - TERRA.clima.T), 0, 2, 'entro 2');
  // l'energia si conserva: il pianeta irradia quanto assorbe anche con il mare dentro (il mare sposta, non crea)
  tra(clMare.bilancio.irradiata / clMare.bilancio.assorbita, 0.995, 1.005, 'irradiata / assorbita con il mare');
  // dove le correnti portano caldo fa più caldo di prima, dove portano freddo più freddo (segno giusto, in media)
  let su = 0, giu = 0, nsu = 0, ngiu = 0, media = 0, pesi = 0; for (let j = 0; j < cl.H; j++) { const w = Math.cos(Math.PI / 2 - ((j + 0.5) / cl.H) * Math.PI); for (let i = 0; i < cl.W; i++) { media += w * acque.caloreDalMare[j * cl.W + i]; pesi += w; } } media /= pesi;
  for (let k = 0; k < cl.W * cl.H; k++) { const f = acque.caloreDalMare[k] - media, d = clMare.media[k] - cl.media[k]; if (f > 20) { su += d; nsu++; } else if (f < -20) { giu += d; ngiu++; } }
  if (nsu && ngiu) assert.ok(su / nsu > giu / ngiu, `dove arriva calore ${su / nsu} K, dove ne parte ${giu / ngiu} K`);
  tra(m.caloreMedioTolto, -1e9, 1e9, 'media tolta'); assert.equal(GE.climaConIlMare('fili|terra', TERRA, sf, cl, acque), clMare, 'lo stesso clima la seconda volta'); assert.equal(GE.climaConIlMare('x', TERRA, sf, cl, { esiste: false }), cl);
  riscontro('calore che il mare di mare.js crea o distrugge in media (W/m²)', Math.abs(m.caloreMedioTolto), 0, 1, '0: le correnti spostano soltanto', 'la temperatura media del mare di mare.js è più bassa di quella del clima che ha letto (l\'acqua di fondo, fredda, risale e nessuno la scalda): qui la media è tolta, ma è un\'incoerenza di mare.js');
  // aria e mare: una sola CO2 (quella dell'aria, che viene dal ciclo)
  assert.equal(acque.carbonioAria.usata, 'aria'); tra(acque.carbonioAria.pCO2Aria / (TERRA.clima.co2Ciclo / 1e5), 0.999, 1.001, 'la CO2 che il mare usa è quella del ciclo del clima');
  console.log(`      il mare sposta in media ${n(m.caloreSpostato)} W/m² e cambia la temperatura media di ${n(m.dT)} K (${n(cl.Tglobale, 4)} → ${n(clMare.Tglobale, 4)}); dove arriva calore ${nsu ? n(su / nsu) : '—'} K, dove ne parte ${ngiu ? n(giu / ngiu) : '—'} K; ghiaccio ${n(cl.ghiaccio)} → ${n(clMare.ghiaccio)}  [mappa: ${((performance.now() - T0) / 1000).toFixed(0)} s]`);
});

prova('il tempo atmosferico parte da un evento del pianeta: un ramo dà un altro tempo, lo stesso clima', () => {
  const p = 'cosmo 1/galassia 3/stella 53/pianeta 0', a = R.increspatura(sorgente(p)), b = R.increspatura(sorgente(p, { [`${p}/meteo/seme/0`]: 1 }));
  assert.notEqual(a.fasi[0], b.fasi[0]); assert.equal(a.fasi[1], b.fasi[1]); assert.deepEqual(R.increspatura().fasi, [0, 1, 2]);
});

console.log(`\ntest_fili: ${ok} prove passate` + (nonTorna.length ? `; ${nonTorna.length} riscontri col vero NON TORNANO:` : '; tutti i riscontri col vero tornano'));
for (const x of nonTorna) console.log('   ✗', x);
