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
  const r = CH.climaEAria({ Lw: p.Lw, aM: p.aM, massaKg: p.massaKg, raggioM: p.raggioM, tipo: p.tipo, acqua: ac.frazione, inerti, acquaKg: ac.kg, anno: p.anno, obliquita: p.obliquita, bloccato: false, placche: p.interno.tettonica === 'a placche', composizione: p.composizione, involucro: 0,
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
  // senza terre emerse non c'è chi la prenda: si accumula (il tetto dei cento bar); senza vulcani non c'è sorgente
  assert.equal(CH.co2DelCiclo({ ...dati, T: 288, terre: 0 }), 100); assert.equal(CH.co2DelCiclo({ ...dati, T: 288, calore: 0 }), 0);
  // più calore dall'interno, più vulcani, più CO2 e più caldo (un pianeta più giovane)
  const caldo = CH.co2DelCiclo({ ...dati, T: 288, calore: 0.17 }); assert.ok(caldo > p(288), `il doppio del calore: ${caldo} contro ${p(288)} bar`);
  console.log(`      pCO2 del ciclo (bar) a 275, 285, 290, 300 K con un quarto di terre: ${[275, 285, 290, 300].map((T) => n(p(T))).join(', ')}; Urey a 300 K: ${n(CH.pressioneCO2Urey(300) / 1e5)}`);
});

prova('Venere e Marte con la loro aria: niente mare, niente ciclo; le temperature della serra', () => {
  assert.equal(VENERE.clima.acqua, 'assente'); assert.equal(VENERE.clima.co2Ciclo, undefined); assert.equal(MARTE.clima.co2Ciclo, undefined);
  tra(pCO2(VENERE), 85, 92, 'CO2 di Venere (bar): tutta nell\'aria'); tra(MARTE.clima.pressione, 550, 650, 'pressione su Marte (Pa)');
  riscontro('Marte: temperatura (K)', MARTE.clima.T, 207, 217, '210–214');
  riscontro('Venere: temperatura (K)', VENERE.clima.T, 713, 757, '735', `l'albedo qui è ${n(VENERE.clima.albedo)} (roccia nuda): le nuvole di acido solforico, che ne fanno 0,76, non ci sono. Con la luce assorbita vera la stessa serra dà ${n(229 * Math.pow(1 + 0.75 * VENERE.clima.tau, 0.25), 4)} K`);
  assert.equal(MARTE.interno.vulcani, 0); assert.equal(MARTE.interno.tettonica, 'ferma');
});

prova('il giorno entra nella dinamo: la Terra ha un dipolo, Venere (243 giorni) no, Marte non ha dinamo', () => {
  tra(TERRA.interno.rossby, 0.085, 0.095, 'numero di Rossby locale della Terra (il dato: 0,09)'); assert.equal(TERRA.interno.dipolo, true);
  riscontro('Terra: campo all\'equatore (T)', TERRA.B0, 2.5e-5, 3.6e-5, '3,1·10⁻⁵');
  assert.ok(VENERE.interno.rossby > 0.12 && VENERE.interno.dipolo === false, `Venere: Ro_l = ${VENERE.interno.rossby}`); assert.ok(VENERE.interno.dinamo, 'il suo nucleo, qui, è liquido: è la rotazione che manca');
  const venereSvelta = mondo('Venere', { giorno: 86400 }); tra(VENERE.B0 / venereSvelta.B0, 0.0999, 0.1001, 'senza dipolo il campo in superficie è un decimo'); assert.equal(venereSvelta.interno.dipolo, true);
  riscontro('Venere: campo in superficie (T)', VENERE.B0, 0, 5e-9, 'nessuno misurabile (< 5·10⁻⁹)', 'la legge dice solo «almeno dieci volte più debole»: quanto, senza dipolo, non lo sa');
  assert.equal(MARTE.interno.dinamo, false); assert.equal(MARTE.interno.rossby, undefined); assert.equal(MARTE.B0, 1e-9);
  // la soglia: una Terra che gira più piano perde il dipolo; e chi non dà il giorno ottiene la dinamo di prima
  const lenta = mondo('Terra', { giorno: 2 * 86164 }); assert.equal(lenta.interno.dipolo, false); tra(lenta.interno.rossby / TERRA.interno.rossby, 2.24, 2.25, 'Ro_l ∝ giorno^(7/6)');
  const senza = GE.interno({ tipo: 'roccioso', massaKg: 5.972e24, raggioM: 6.371e6, composizione: VERI.Terra.composizione }, { eta: 4.5e9, Z: 1 }); assert.equal(senza.B0, TERRA.B0); assert.equal(senza.rossby, undefined);
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

prova('le stelle di mare.js e di risalita.js sono quelle di stelle.js (non più le formule di leggi.js)', () => {
  const m = R.mondoDi(M.luogoDaAria({ P: { ...TERRA, Tstella: undefined, Mstella: 0.5 * LG.MSOLE } }), { P: { ...TERRA, Tstella: undefined, Mstella: 0.5 * LG.MSOLE } });
  assert.equal(m.Tst, stellaVera(0.5).T); assert.notEqual(m.Tst, LG.stella(0.5).T); assert.equal(R.mondoDi(M.luogoDaAria({ P: TERRA }), { P: TERRA }).Tst, 5772, 'se il pianeta porta la temperatura della sua stella, è quella');
  assert.equal(LG.fine, undefined, 'la vecchia fine() di leggi.js non c\'è più');
});

// ---------- la mappa: i vulcani, il clima a giri, il mare che torna al clima (costa: una tettonica, tre circolazioni, un mare)
const T0 = performance.now(), sf = GE.superficiePianeta('fili|terra', TERRA, TERRA.interno, TERRA.origine), cl = GE.climaSuperficie('fili|terra', TERRA, sf), se = GE.erosione('fili|terra', sf, cl);
const acque = MA.mare(TERRA, se, cl, se, 'fili|terra/mare'), clMare = GE.climaConIlMare('fili|terra', TERRA, sf, cl, acque);

prova('i vulcani stanno sulle salite del mantello (tettonica.js), il più caldo per primo', () => {
  const tt = evolviTettonica({ W: sf.W, H: sf.H, raggioM: TERRA.raggioM, nucleo: TERRA.interno.nucleo, q: TERRA.interno.q, eta: TERRA.interno.eta, acqua: true, seme: TERRA.origine, placche: true });
  assert.ok(tt.salite && tt.salite.length === sf.W * sf.H); assert.equal(sf.vulcani.length, TERRA.interno.vulcani);
  let mx = 0; for (const v of tt.salite) if (v > mx) mx = v; const u = sf.vulcani.map(([i, j]) => tt.salite[j * sf.W + i]);
  for (const [k, v] of u.entries()) { assert.ok(v > 0, `il vulcano ${k} sta dove il mantello scende: ${v}`); if (k) assert.ok(v <= u[k - 1] + 1e-12, 'in ordine: il più caldo per primo'); }
  tra(u[0] / mx, 0.999, 1.001, 'il primo sta sulla cima più alta del campo');
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
