// test_risalita.mjs — ciò che il piccolo fa al grande: i flussi (ionizzazione, azoto, argon, radiolisi, dose…) contro la
// Terra e Marte veri, gli amplificatori e i loro tempi, e la regola: un evento cambia SOLO ciò che finDoveRisale dice.
// Ciò che non torna è stampato con il numero (righe «≠»).
import assert from 'node:assert/strict';
import * as M from '../src/camera/materia.js';
import * as R from '../src/camera/risalita.js';
import { simulaMondo } from '../src/camera/mondo.js';
import { sorgente } from '../src/camera/eventi.js';
import { indirizzo, puoToccare } from '../src/camera/intreccio.js';
import { ANNO } from '../src/camera/leggi.js';

let ok = 0;
const prova = (nome, f) => { f(); ok++; console.log('  ✓', nome); };
const tra = (x, a, b, che) => assert.ok(x > a && x < b, `${che}: ${x} (atteso tra ${a} e ${b})`);
const n = (x, c = 3) => Number(x).toPrecision(c).replace('.', ',');
const nonTorna = (che, mio, vero, perche = '') => console.log(`      ≠ ${che}: qui ${n(mio)}, vero ${vero}${perche ? ` — ${perche}` : ''}`);
const nota = (t) => console.log(`      · ${t}`);

// i mondi di prova (ciò che cosmo.js dà di un pianeta)
const TERRA = { massaKg: 5.972e24, raggioM: 6.371e6, B0: 3.1e-5, Lw: 3.828e26, aM: 1.496e11, Mstella: 1.989e30, giorno: 86164, clima: { g: 9.81, pressione: 101325, T: 288, Teq: 255, acqua: 'liquida', mare: 0.71, albedo: 0.3 },
  atmosfera: { gas: { N2: 0.781, O2: 0.209, Ar: 0.0093, CO2: 0.0004 } }, interno: { eta: 4.5e9, q: 0.087, B0: 3.1e-5, acquaKg: 1.4e21, tettonica: 'a placche', vulcani: 1, nucleo: 0.546 }, composizione: { ferro: 0.32, roccia: 0.68 } };
const MARTE = { massaKg: 6.417e23, raggioM: 3.3895e6, B0: 0, Lw: 3.828e26, aM: 2.279e11, Mstella: 1.989e30, giorno: 88775, clima: { g: 3.71, pressione: 636, T: 210, Teq: 210, acqua: 'ghiaccio', mare: 0, albedo: 0.25 },
  atmosfera: { gas: { CO2: 0.951, N2: 0.027, Ar: 0.016 } }, interno: { eta: 4.5e9, q: 0.02, B0: 0, tettonica: 'ferma', vulcani: 0, nucleo: 0.5 }, composizione: { ferro: 0.25, roccia: 0.75 } };
const LUNA = { massaKg: 7.35e22, raggioM: 1.737e6, B0: 0, Lw: 3.828e26, aM: 1.496e11, Mstella: 1.989e30, clima: { g: 1.62, pressione: 0, T: 250, Teq: 270, acqua: null, mare: 0 }, atmosfera: null, interno: { eta: 4.5e9, q: 0.015, B0: 0, tettonica: 'ferma', vulcani: 0, nucleo: 0.2 }, composizione: { ferro: 0.02, roccia: 0.98 } };
const conCampo = (k) => ({ ...TERRA, B0: 3.1e-5 * k, interno: { ...TERRA.interno, B0: 3.1e-5 * k } });
const MARE_K = { K: 0.0102, Na: 0.469, Cl: 0.546 }, STATO = { carbonio: 0.0022, pO2: 0.2 };
const sulMare = (lat = 45, P = TERRA) => M.luogoDaAria({ P, suMare: true, lat });
const SUOLO = M.luogoDaRoccia({ P: TERRA, continente: true, etaRoccia: 1.5e9, indirizzo: 'cosmo 1/galassia 3/stella 53/pianeta 0/roccia/12.0000/45.0000/0' });
const sottoRoccia = M.luogoDaRoccia({ P: TERRA, continente: true, profonditaM: 1000, etaRoccia: 1.5e9 });
const sottoMare = (m) => M.luogoDaAcqua({ P: TERRA, totali: MARE_K, stato: STATO, profonditaM: m });

prova("Terra: la ionizzazione dell'aria, al suolo e in quota (massimo di Pfotzer), con la latitudine", () => {
  const pr = R.profiloIonizzazione(sulMare(), { P: TERRA });
  tra(pr.alSuolo.cosmici, 1.2, 2.6, 'coppie di ioni per cm³ al secondo sul mare (misurato: ~2)');
  tra(pr.massimo.valore, 15, 35, 'massimo in quota a 45° (misurato: 20–30)'); tra(pr.massimo.quotaM / 1000, 10, 20, 'quota del massimo (km)');
  tra(R.ionizzazione(sulMare(), 10000, { P: TERRA }).cosmici, 6, 30, 'a 10 km (~10–20)');
  const eq = R.profiloIonizzazione(sulMare(0), { P: TERRA }), polo = R.profiloIonizzazione(sulMare(80), { P: TERRA });
  assert.ok(eq.massimo.valore < pr.massimo.valore && pr.massimo.valore < polo.massimo.valore, 'il campo ferma i primari lenti: più ionizzazione verso i poli');
  tra(eq.massimo.valore, 8, 20, "all'equatore (misurato a 15 km: 14)"); tra(polo.massimo.valore, 25, 50, 'ai poli (misurato a 15 km: 41)');
  tra(polo.alSuolo.cosmici / eq.alSuolo.cosmici, 1, 1.4, 'al suolo la latitudine conta poco (i muoni vengono da primari energici)');
  // l'energia: ciò che resta nell'aria è la parte dichiarata di ciò che i primari portano (qui è imposto, non trovato)
  tra(pr.energia / pr.energiaPrimari, 0.55, 0.65, "parte dell'energia dei primari lasciata nell'aria"); tra(pr.energiaPrimari, 2e-6, 6e-6, 'energia dei cosmici in cima (W/m²; Miller e Urey: 2·10⁻⁶)');
  tra(pr.fattoreCascata, 1, 3, 'correzione degli elettroni dello sciame a 45°');
  // sopra la terraferma il suolo ne aggiunge: radon e γ della roccia
  const terra = R.profiloIonizzazione(M.luogoDaAria({ P: TERRA }), { P: TERRA }).alSuolo; tra(terra.totale, 5, 20, 'sulla terraferma (misurato: ~10)'); assert.ok(terra.radon > 1 && terra.suolo > 1);
  tra(R.ionizzazione(M.luogoDaAria({ P: TERRA }), 3000, { P: TERRA }).radon, 0, terra.radon / 4, 'il radon non sale oltre un paio di km');
  nota(`al suolo ${n(pr.alSuolo.cosmici)} (mare) e ${n(terra.totale)} (terraferma: ${n(terra.radon)} radon, ${n(terra.suolo)} γ); massimo ${n(pr.massimo.valore)} a ${n(pr.massimo.quotaM / 1000)} km; equatore ${n(eq.massimo.valore)}, polo ${n(polo.massimo.valore)} (misurati a 15 km: 14–41)`);
  if (pr.massimo.quotaM < 15000) nonTorna('quota del massimo (km)', pr.massimo.quotaM / 1000, '15–20 per il flusso di particelle', 'qui è il massimo delle coppie per cm³, che pesa la densità: sta più in basso');
});

prova("il circuito elettrico globale: l'aria resa conduttrice dai cosmici, caricata dai fulmini", () => {
  const c = R.circuitoElettrico(sulMare(), { P: TERRA }), f = R.fulmini(sulMare(), { P: TERRA });
  tra(f.alSecondo, 40, 48, 'fulmini al secondo (misurati: 44 ± 5; è il parametro fissato sulla Terra)'); tra(f.latente, 70, 90, 'calore latente (W/m²; ~80)');
  tra(c.conducibilita, 1.5e-14, 9e-14, 'conducibilità al suolo sul mare (S/m; misurata ~3·10⁻¹⁴)'); tra(c.resistenza, 0.6e17, 2.5e17, 'resistenza della colonna (Ω·m²; 1,3·10¹⁷)');
  tra(c.potenziale, 1e5, 4e5, 'potenziale della ionosfera (V; 250 kV)'); tra(c.correnteBelTempo, 1e-12, 3e-12, 'corrente di bel tempo (A/m²; 2·10⁻¹²)'); tra(c.resistenzaTotale, 100, 400, 'resistenza totale (Ω; ~230)');
  // più pioggia, più fulmini; un mondo senz'acqua non ne ha
  assert.ok(R.fulmini(sulMare(), { P: TERRA, pioggia: 2000 }).alSecondo > f.alSecondo * 1.5); assert.equal(R.fulmini(M.luogoDaAria({ P: MARTE }), { P: MARTE }).alSecondo, 0);
  nota(`${n(f.alSecondo)} fulmini/s, ${n(c.potenziale / 1000)} kV, ${n(c.correnteBelTempo * 1e12)} pA/m², colonna ${n(c.resistenza)} Ω·m²`);
});

prova('ciò che la ionizzazione produce: azoto fissato, carbonio-14, berillio-10; i nuclei di condensazione pesano poco', () => {
  const p = R.prodotti(sulMare(), { P: TERRA });
  tra(p.azoto.fulmini.kgAnno / 1e9, 2, 8, 'azoto dai fulmini (Tg/anno; 5 ± 3)'); tra(p.azoto.cosmici.kgAnno / 1e9, 0.03, 0.3, 'azoto dai raggi cosmici (Tg/anno; ~0,06–0,09)');
  assert.equal(p.azoto.domina, 'fulmini'); assert.ok(p.azoto.fulmini.kgAnno > 10 * p.azoto.cosmici.kgAnno);
  tra(p.azoto.fulmini.perKgAria, 3e-8, 1.5e-7, "mol di N per kg d'aria all'anno");
  tra(p.carbonio14.atomiM2s / 1e4, 1.6, 2.5, 'carbonio-14 (atomi/cm²/s; ~2)'); assert.equal(p.carbonio14.atomiM2s, M.raggiCosmici(sulMare()).produzioneC14, 'una fonte sola: materia.js');
  tra(p.berillio10.atomiM2s / 1e4, 0.015, 0.035, 'berillio-10 (atomi/cm²/s; 0,02–0,03)'); tra(p.carbonio14.kgAnno, 4, 12, 'carbonio-14 prodotto (kg/anno; ~7,5)');
  assert.ok(p.nuclei.sensibilita <= 0.05 && Math.pow(2, p.nuclei.sensibilita) - 1 < 0.05, 'raddoppiare i cosmici cambia i nuclei di meno del 5% (CLOUD)'); assert.ok(p.nuclei.tetto > 1);
  assert.ok(p.radicali.molAnno > p.azoto.cosmici.molAnno);
  // Marte: poca aria e poco azoto
  const pm = R.prodotti(M.luogoDaAria({ P: MARTE }), { P: MARTE }); assert.ok(pm.azoto.cosmici.kgAnno < 1e-2 * p.azoto.cosmici.kgAnno && pm.azoto.fulmini.kgAnno === 0);
  if (p.azoto.cosmici.kgAnno / 1e9 > 0.09) nonTorna('azoto dai raggi cosmici (Tg/anno)', p.azoto.cosmici.kgAnno / 1e9, '0,06–0,09 (3,0–3,7·10³³ molecole: ricordato)', 'la colonna media su tre latitudini è grossolana');
});

prova("i gas radiogenici: argon-40 nell'aria dopo 4,5 miliardi di anni, l'elio che fugge", () => {
  const g = R.gasRadiogenici(sulMare(), { P: TERRA });
  assert.equal(g.degassata, 0.5, 'la parte uscita, dichiarata (con le placche)'); tra(g.potassio * 1e6, 150, 350, 'potassio del mantello (ppm; Terra vera: 240)');
  tra(g.argon40.nellAria, 4e16, 9e16, "argon-40 nell'aria (kg; vero 6,6·10¹⁶)"); tra(g.argon40.frazione * 100, 0.7, 1.3, "argon nell'aria (% in volume; vero 0,934)"); assert.ok(g.argon40.trattenuto);
  tra(g.elio4.flusso / 1e4, 0.5e6, 4e6, 'elio che esce (atomi/cm²/s; ~2·10⁶)'); assert.equal(g.elio4.trattenuto, false); tra(g.elio4.frazione * 1e6, 1, 10, "elio nell'aria (milionesimi; vero 5,2)");
  // Marte fermo: pochissimo esce, ma la sua aria è così poca che l'argon vi pesa
  const gm = R.gasRadiogenici(M.luogoDaAria({ P: MARTE }), { P: MARTE }); assert.equal(gm.degassata, 0.02); tra(gm.argon40.frazione * 100, 0.8, 4, "argon nell'aria di Marte (%; vero 1,9)");
  // un mondo grande tiene anche l'elio: lì si accumula
  const SUPER = { ...TERRA, massaKg: 5 * TERRA.massaKg, raggioM: 1.5 * TERRA.raggioM, clima: { ...TERRA.clima, g: (9.81 * 5) / 2.25 } }, gs = R.gasRadiogenici(M.luogoDaAria({ P: SUPER }), { P: SUPER });
  assert.ok(gs.elio4.trattenuto && gs.elio4.frazione > 1e3 * g.elio4.frazione); assert.equal(g.argon40.gelato, 0);
  // un mondo gelido: l'argon esce lo stesso, ma gela al suolo
  const FREDDO = { ...TERRA, clima: { ...TERRA.clima, T: 25, Teq: 25, pressione: 10, acqua: 'ghiaccio', mare: 0 } }, gf = R.gasRadiogenici(M.luogoDaAria({ P: FREDDO }), { P: FREDDO }); assert.ok(gf.argon40.gelato > 1e3 * gf.argon40.nellAria && gf.argon40.pressione < 1e-3, `a 25 K l'argon è ghiaccio: ${gf.argon40.pressione} Pa`); assert.equal(R.gasRadiogenici(M.luogoDaRoccia({ P: LUNA, continente: false, bagnato: false }), { P: LUNA }).argon40.trattenuto, false);
  nota(`argon ${n(g.argon40.frazione * 100)}% (${n(g.argon40.nellAria)} kg), elio ${n(g.elio4.frazione * 1e6)} ppm, ${n(g.elio4.flusso / 1e4)} atomi/cm²/s; Marte ${n(gm.argon40.frazione * 100)}%; una super-Terra tiene l'elio: ${n(gs.elio4.frazione * 100)}%`);
});

prova("la radiolisi dell'acqua: nella crosta bagnata e nel mare profondo", () => {
  const r = R.radiolisi(sottoRoccia, { P: TERRA }), rp = R.radiolisiDelPianeta(sottoRoccia, { P: TERRA });
  tra(r.H2 * 1e9, 0.1, 100, "idrogeno nell'acqua dei pori (nmol per kg all'anno; pubblicati 0,1–10)"); assert.equal(r.ossidanti, r.H2 / 2); assert.equal(r.porosita, 0.01);
  tra(r.parte.rapporti.alfa, 1.2, 1.6, "quanto frena l'acqua rispetto alla roccia, α (usato da Lin e altri: 1,5)"); tra(r.parte.rapporti.beta, 1.1, 1.35, 'β (1,25)'); tra(r.parte.rapporti.gamma, 1.05, 1.2, 'γ (1,14)');
  tra(rp.crosta, 0.5e10, 2.3e11, 'idrogeno dalla crosta dei continenti (mol/anno; pubblicato 0,16–0,47·10¹¹ di sola radiolisi, 0,36–2,27·10¹¹ in tutto)');
  assert.ok(R.radiolisi(sottoRoccia, { P: TERRA, porosita: 0.05 }).perKgRoccia > 3 * r.perKgRoccia, "più acqua nei pori, più idrogeno per kg di roccia"); assert.equal(R.radiolisi(M.luogoDaRoccia({ P: LUNA, continente: true, bagnato: false }), { P: LUNA }).H2, 0);
  // il mare profondo: resta il potassio-40 dell'acqua; in superficie contano anche i cosmici
  const fondo = R.radiolisi(sottoMare(2000), { P: TERRA }), cima = R.radiolisi(sottoMare(1), { P: TERRA });
  tra(fondo.H2, 1e-13, 1e-10, "idrogeno nell'acqua del mare profondo (mol per kg all'anno)"); assert.ok(cima.H2 > 2 * fondo.H2 && fondo.dose.cosmici < 1e-3 * fondo.dose.beta);
  nota(`pori della roccia ${n(r.H2 * 1e9)} nmol/kg/anno; crosta ${n(rp.crosta)} mol/anno; mare profondo ${n(fondo.H2 * 1e12)} pmol/kg/anno (in superficie ${n(cima.H2 * 1e12)})`);
});

prova('il calore, il piombo radiogenico e il danno negli zirconi: una fonte sola con materia.js', () => {
  const r = R.risalita(sottoRoccia, { P: TERRA }), f = r.flussi.find((x) => x.nome === 'calore della radioattività');
  assert.equal(f.valore, M.calore(sottoRoccia)); const e = R.energiaPerTipo(sottoRoccia); tra(e.totale / M.calore(sottoRoccia), 0.999, 1.001, 'α + β + γ = il calore');
  const o = R.orologi(SUOLO), l238 = Math.LN2 / 4.468e9; tra(o.piombo.rapporti['Pb206/U238'] / Math.expm1(l238 * 1.5e9), 0.999, 1.001, 'Pb206/U238 = e^(λt) − 1');
  tra(o.piombo.rapporti['Pb207/Pb206'], 0.088, 0.099, 'Pb207/Pb206 radiogenico a 1,5 miliardi di anni (0,0936)'); tra(o.piombo.ppm, 0.3, 5, 'piombo radiogenico (ppm)');
  // lo zircone: giovane è cristallino; antico e rimasto freddo ha perso il reticolo
  tra(o.zircone.uranio * 1e6, 200, 5000, 'uranio nello zircone (ppm; veri: 100–5000)'); assert.ok(o.zircone.alfaPerGrammo > 0 && o.zircone.anni <= 1.5e9);
  const fermo = { ...TERRA, clima: { ...TERRA.clima, acqua: null, mare: 0 }, interno: { ...TERRA.interno, tettonica: 'ferma' } };
  const vecchio = R.orologi(M.luogoDaRoccia({ P: fermo, continente: true, etaRoccia: 3e9, bagnato: false })), giovane = R.orologi(M.luogoDaRoccia({ P: fermo, continente: true, etaRoccia: 5e7, bagnato: false }));
  assert.ok(vecchio.zircone.alfaPerGrammo > R.DATI.ZIRCONE_AMORFO && /metamittico/.test(vecchio.zircone.stato), `uno zircone di 3 miliardi di anni è metamittico: ${vecchio.zircone.alfaPerGrammo}`);
  assert.equal(giovane.zircone.stato, 'cristallino'); assert.equal(R.orologi(sulMare()), null);
  nota(`zircone con ${n(o.zircone.uranio * 1e6)} ppm di uranio: ${n(o.zircone.alfaPerGrammo)} α/g in ${n(o.zircone.anni / 1e6)} milioni di anni (soglia 4,5·10¹⁸); dopo 3 miliardi: ${n(vecchio.zircone.alfaPerGrammo)}`);
});

prova('le particelle della stella: il vento, la magnetosfera, le aurore, Marte senza campo, la Luna senz\'aria', () => {
  const v = R.ventoStellare(sulMare(), { P: TERRA });
  tra(v.pressione * 1e9, 1, 3, 'pressione del vento a 1 UA (nPa; ~2)'); tra(v.magnetopausa, 8, 12, 'magnetopausa (raggi terrestri; 10)'); assert.equal(v.scoperto, false);
  tra(v.aurora.potenza, 1e10, 1e11, 'potenza delle aurore (W; 1–10·10¹⁰)'); tra(v.aurora.colatitudine, 14, 25, 'gli ovali (gradi dal polo; ~20)'); tra(v.aurora.sugliOvali * 1e3, 0.5, 10, 'energia sugli ovali (mW/m²; 1–10)');
  tra(v.perditaAria, 0.2, 3, 'aria portata via (kg/s; misurato ~1)'); assert.equal(v.sputtering, null);
  const vm = R.ventoStellare(M.luogoDaAria({ P: MARTE }), { P: MARTE }); assert.ok(vm.scoperto && vm.magnetopausa === 0);
  tra(vm.perditaAria, 0.03, 0.3, 'Marte: ioni portati via (kg/s; misurati ~0,1)'); tra(vm.tempoAria, 1e9, 1e11, "anni per portar via l'aria di oggi al ritmo di oggi");
  nonTorna("Marte: aria persa in tutta la storia (bar)", vm.ariaPersa.pressione / 1e5, 'fino a ~0,8 (MAVEN)', "qui c'è solo ciò che il vento carica; mancano la fuga fotochimica e lo sputtering");
  nonTorna('Marte: perdita di oggi (kg/s)', vm.perditaAria, '1–2 in tutto (MAVEN)', 'la legge dà i soli ioni');
  nota(`la Terra, col suo campo, perde ${n(v.perditaAria)} kg/s (${n(v.ariaPersa.pressione / 1e5)} bar in 4,5 miliardi di anni): in questa legge il campo non protegge`);
  // una stella giovane soffia di più; la Luna: niente aria, il vento arriva al suolo
  assert.ok(R.ventoStellare(sulMare(), { P: TERRA, stella: { eta: 5e8, T: 5772 } }).pressione > 20 * v.pressione);
  const vl = R.ventoStellare(M.luogoDaRoccia({ P: LUNA, continente: false, bagnato: false }), { P: LUNA }); assert.equal(vl.perditaAria, 0); tra(vl.sputtering.metriPerAnno * 1e10, 0.01, 1, 'superficie lunare strappata (ångström/anno; 0,02–0,2)'); tra(vl.sputtering.annerimento, 1e5, 1e6, 'annerimento (anni)');
});

prova('la dose: Terra al suolo, sotto un metro d\'acqua, sotto un chilometro di roccia; i coefficienti dei γ del suolo', () => {
  const mare = R.dose(sulMare(), { P: TERRA }), suolo = R.dose(SUOLO, { P: TERRA }), m1 = R.dose(sottoMare(1), { P: TERRA }), km = R.dose(sottoRoccia, { P: TERRA });
  tra(mare.cosmici.Sv * 1e3, 0.25, 0.4, 'cosmici al livello del mare (mSv/anno; UNSCEAR: 0,27 + 0,05 di neutroni)'); tra(mare.cosmici.neutroni * 1e3, 0.02, 0.1, 'di cui neutroni (0,05)');
  tra(suolo.suolo.Gy * 1e3, 0.2, 1.5, 'γ del suolo su un granito (mGy/anno; media mondiale 0,5, sui graniti ~1)'); tra(suolo.totale.Sv * 1e3, 0.6, 2.4, 'in tutto, all\'aperto (mSv/anno)');
  tra(suolo.radonPerChiRespira * 1e3, 0.05, 1.3, 'il radon, per chi ha polmoni (mSv/anno; al chiuso sulla Terra 1,26)'); assert.equal(mare.suolo.Gy, 0);
  nonTorna('dose totale sulla Terra (mSv/anno)', suolo.totale.Sv * 1e3, '2,4 (UNSCEAR)', `dei 2,4, 1,26 sono radon respirato al chiuso e 0,29 mangiati: dipendono da polmoni e case; qui restano cosmici ${n(suolo.cosmici.Sv * 1e3)} e suolo ${n(suolo.suolo.Gy * 1e3)} (il radon all'aperto ne aggiungerebbe ${n(suolo.radonPerChiRespira * 1e3)})`);
  // un metro d'acqua ferma gli elettroni e i neutroni, non i muoni; un chilometro di roccia ferma quasi tutto
  tra(m1.cosmici.Sv / mare.cosmici.Sv, 0.5, 0.98, "sotto 1 m d'acqua"); tra(m1.interna.Gy * 1e3, 0.02, 0.08, 'il potassio-40 del mare (mGy/anno; ~0,04)');
  tra(km.cosmici.Sv / mare.cosmici.Sv, 1e-8, 1e-4, 'sotto 1 km di roccia (misurato: ~10⁻⁵–10⁻⁶ dei muoni)'); tra((km.interna.beta + km.interna.gamma) * 1e3, 1, 20, 'β e γ della roccia attorno (mGy/anno)'); assert.ok(km.interna.alfa > km.interna.beta);
  assert.ok(km.totale.Gy > 3 * suolo.totale.Gy, 'sotto terra la dose non cala: la radioattività della roccia resta, e ci si sta dentro');
  // il semispazio dà i coefficienti dell'UNSCEAR (nGy/h per Bq/kg)
  for (const [nome, el, rif, nuc] of [['potassio', { K: 0.03, U: 0, Th: 0, Rb: 0 }, 0.0417, 'potassio-40'], ['uranio', { K: 0, U: 3e-6, Th: 0, Rb: 0 }, 0.462, 'uranio-238'], ['torio', { K: 0, U: 0, Th: 1e-5, Rb: 0 }, 0.604, 'torio-232']]) {
    const L = M.luogoDaRoccia({ P: TERRA, elementi: el }), bq = M.attivita(L).filter((a) => a.nuclide === nuc).reduce((s, a) => s + a.perKg, 0);
    tra((R.dose(L, { P: TERRA }).suolo.Gy / 8766) * 1e9 / bq / rif, 0.9, 1.25, `γ del ${nome}: metà di ciò che la roccia assorbirebbe, contro il coefficiente misurato`); }
  // le «mutazioni»: la radiazione rompe molto meno del calore, tranne dove fa freddo e la dose è alta
  tra(mare.mutazioni.rapporto, 1e-8, 1e-3, 'sulla Terra il calore rompe il DNA molto più della radiazione'); assert.ok(R.dose(M.luogoDaAria({ P: MARTE }), { P: MARTE }).mutazioni.rapporto > 1, 'su Marte, al freddo, vince la radiazione');
  nota(`mare ${n(mare.cosmici.Sv * 1e3)} mSv; granito ${n(suolo.totale.Sv * 1e3)}; sotto 1 m d'acqua ${n(m1.totale.Sv * 1e3)}; sotto 1 km di roccia ${n(km.cosmici.Sv * 1e3)} dai cosmici e ${n((km.interna.beta + km.interna.gamma) * 1e3)} mGy da β e γ (più ${n(km.interna.alfa * 1e3)} mGy di α accanto ai grani)`);
});

prova('Marte: cento volte la Terra; la Luna; un mondo con un campo forte: in quota quasi niente, la radioattività resta', () => {
  const terra = R.dose(SUOLO, { P: TERRA }), mare = R.dose(sulMare(), { P: TERRA }), LM = M.luogoDaAria({ P: MARTE }), marte = R.dose(LM, { P: MARTE });
  tra(marte.cosmici.Sv * 1e3, 60, 350, 'Marte al suolo (mSv/anno; misurato dal rover: 234)'); tra(marte.cosmici.Gy * 1e3, 25, 110, 'in gray (mGy/anno; misurato 77 ± 15)');
  tra(marte.totale.Sv / terra.totale.Sv, 50, 400, 'Marte rispetto alla Terra, tutto compreso (~cento volte)'); assert.ok(marte.cosmici.Sv / mare.cosmici.Sv > 100);
  tra((marte.cosmici.Sv - marte.cosmici.neutroni) / (marte.cosmici.Gy - marte.cosmici.neutroni / 10), 1.3, 3.5, 'fattore di qualità medio delle particelle cariche (misurato: 3,05)');
  nonTorna('Marte: dose al suolo (mSv/anno)', marte.cosmici.Sv * 1e3, '234 (0,64 mSv al giorno)', "mancano i secondari nati nell'aria sottile e nel suolo");
  const luna = R.dose(M.luogoDaRoccia({ P: LUNA, continente: false, bagnato: false }), { P: LUNA }); tra(luna.cosmici.Sv * 1e3, 80, 700, 'la Luna (mSv/anno; misurato da Chang\'E 4: ~500)');
  nonTorna('Luna: dose al suolo (mSv/anno)', luna.cosmici.Sv * 1e3, '~500 (al minimo solare)', 'qui il Sole è a metà del ciclo e mancano i neutroni e i frammenti che il suolo rimanda');
  assert.equal(R.profiloIonizzazione(M.luogoDaRoccia({ P: LUNA, continente: false, bagnato: false }), { P: LUNA }).massimo.valore, 0);
  // il campo più forte che cosmo.js sa dare (4,5·10⁻⁴ T, 14,5 volte la Terra)
  const F = conCampo(14.5), base = R.profiloIonizzazione(sulMare(45), { P: TERRA }), forte = R.profiloIonizzazione(sulMare(45, F), { P: F }), dEq = R.dose(sulMare(0, F), { P: F }), d45 = R.dose(sulMare(45, F), { P: F });
  assert.ok(forte.massimo.valore < 0.3 * base.massimo.valore, `in quota la ionizzazione crolla: ${forte.massimo.valore} contro ${base.massimo.valore}`);
  assert.ok(M.raggiCosmici(sulMare(45, F)).produzioneC14 < 0.4 * M.raggiCosmici(sulMare()).produzioneC14, 'e con lei il carbonio-14');
  assert.ok(dEq.cosmici.Sv < 0.1 * R.dose(sulMare(0), { P: TERRA }).cosmici.Sv, "all'equatore la dose dei cosmici è meno di un decimo"); tra(d45.cosmici.Sv / mare.cosmici.Sv, 0.2, 0.8, 'a 45° si dimezza soltanto: i muoni dei primari più energici passano');
  const sF = M.luogoDaRoccia({ P: F, continente: true, etaRoccia: 1.5e9 }), dF = R.dose(sF, { P: F });
  assert.equal(dF.suolo.Gy, terra.suolo.Gy, 'i γ della roccia non sanno del campo'); assert.equal(M.calore(sF), M.calore(SUOLO)); assert.ok(dF.suolo.Gy > 3 * dF.cosmici.Sv, 'sotto un campo forte la dose è quasi tutta della roccia');
  nota(`Marte ${n(marte.cosmici.Sv * 1e3)} mSv (${n(marte.cosmici.Gy * 1e3)} mGy), Luna ${n(luna.cosmici.Sv * 1e3)}; campo ×14,5: massimo in quota ${n(forte.massimo.valore)} (Terra ${n(base.massimo.valore)}), dose ${n(dEq.cosmici.Sv * 1e3)} mSv all'equatore e ${n(d45.cosmici.Sv * 1e3)} a 45°`);
  nonTorna('«quasi niente dai cosmici» sotto un campo forte', d45.cosmici.Sv / mare.cosmici.Sv, 'vero in quota e ai tropici', 'a 45° al suolo resta la metà: la soglia del campo cala come cos⁴ della latitudine');
});

prova("l'energia per la chimica: l'ultravioletto domina di ordini di grandezza in superficie; sotto il mare, il ghiaccio o la roccia no", () => {
  const e = R.energiaPerLaChimica(sulMare(), { P: TERRA }), s = e.superficie;
  tra(s.ultravioletto, 0.01, 0.15, 'ultravioletto sotto 200 nm (W/m², media sul pianeta; misurato ~0,025; Miller e Urey: 0,11)'); tra(s.fulmini, 3e-5, 3e-4, 'fulmini (W/m²; Chyba e Sagan: 6·10⁻⁵)');
  tra(s.cosmici, 1e-6, 1e-5, 'raggi cosmici (W/m²; Miller e Urey: 2·10⁻⁶)'); tra(s.radioattivita, 3e-4, 5e-3, 'radioattività nel primo km (W/m²; Miller e Urey: 1,1·10⁻³)'); tra(s.aurore, 1e-5, 3e-4, 'aurore (W/m²)');
  assert.equal(e.domina, 'ultravioletto'); assert.ok(s.ultravioletto > 1e3 * s.cosmici && s.ultravioletto > 100 * s.fulmini, "l'ultravioletto vale migliaia di volte i cosmici"); assert.equal(e.qui, null);
  tra(e.relativa, 0.999, 1.001, 'la Terra è il riferimento: 1'); tra(R.sottoLaSoglia(5772), 1e-3, 2e-3, 'corpo nero a 5772 K sotto 200 nm (1,5·10⁻³)'); tra(R.sottoLaSoglia(5772, 1e9), 0.999, 1.001, 'tutto lo spettro');
  // sotto: la luce non arriva
  const m10 = R.energiaPerLaChimica(sottoMare(10), { P: TERRA }), m2k = R.energiaPerLaChimica(sottoMare(2000), { P: TERRA }), roccia = R.energiaPerLaChimica(sottoRoccia, { P: TERRA });
  const ghiaccio = R.energiaPerLaChimica(M.luogoDaRoccia({ P: TERRA, ghiaccio: true, profonditaM: 100, T: 250 }), { P: TERRA });
  assert.equal(m10.domina, 'cosmici', "sotto 10 m di mare: ciò che resta dei cosmici (i muoni)"); assert.equal(m2k.domina, 'radioattivita', 'sotto 2 km: il potassio-40 del mare'); assert.equal(roccia.domina, 'radioattivita'); assert.equal(ghiaccio.domina, 'cosmici');
  for (const x of [m10, m2k, roccia, ghiaccio]) assert.ok(x.qui.ultravioletto < 1e-3 * Math.max(x.qui.cosmici, x.qui.radioattivita));
  assert.ok(m2k.qui.cosmici < 1e-3 * m10.qui.cosmici && m10.superficie.ultravioletto === s.ultravioletto);
  // altri mondi: Marte più lontano dalla stella; una nana rossa (corpo nero freddo: resta la cromosfera, e i fulmini contano)
  const em = R.energiaPerLaChimica(M.luogoDaAria({ P: MARTE }), { P: MARTE }); tra(em.relativa, 0.3, 0.6, 'Marte (1,52 UA: 0,43)');
  const NANA = { ...TERRA, Lw: 3.828e24, aM: 1.496e10, Mstella: 0.3 * 1.989e30 }, en = R.energiaPerLaChimica(sulMare(45, NANA), { P: NANA });
  assert.ok(en.relativa < 0.3 && en.superficie.fulmini / en.superficie.ultravioletto > 5 * (s.fulmini / s.ultravioletto), `sotto una nana rossa, stessa luce: ${en.relativa}`);
  nota(`Terra (W/m²): UV ${n(s.ultravioletto)}, radioattività ${n(s.radioattivita)}, aurore ${n(s.aurore)}, fulmini ${n(s.fulmini)}, cosmici ${n(s.cosmici)}; «energia» per prebiotica: Terra 1, Marte ${n(em.relativa)}, nana rossa a pari luce ${n(en.relativa)}`);
  nota(`sotto 10 m di mare (W/m² in un metro): cosmici ${n(m10.qui.cosmici)}, potassio-40 ${n(m10.qui.radioattivita)}; a 2 km: ${n(m2k.qui.cosmici)} e ${n(m2k.qui.radioattivita)}`);
});

prova('una supernova vicina: ogni quanto, e di quanto alza i raggi cosmici e la dose', () => {
  const s = R.supernovaVicina(sulMare(), { P: TERRA });
  tra(s.ogniQuanto(10), 3e8, 5e9, 'entro 10 parsec (anni; stime: una ogni ~0,5–2 miliardi)'); tra(s.ogniQuanto(100), 3e5, 5e6, 'entro 100 parsec (anni; ~una ogni 2–4 milioni)');
  tra(s.effetto(10).cosmici, 30, 500, 'a 10 parsec: volte il fondo'); tra(s.effetto(100).cosmici, 0.03, 0.5, 'a 100 parsec'); tra(s.distanzaPericolosa, 30, 100, 'distanza a cui i cosmici raddoppiano (parsec)');
  tra(s.effetto(10).dose / R.dose(sulMare(), { P: TERRA }).cosmici.Sv, 30, 500, 'la dose dei cosmici sale con loro'); assert.ok(s.effetto(5).ozono && !s.effetto(50).ozono);
  // picco breve o rilascio lento: l'integrale è lo stesso, e va come 1/d
  const e10 = s.effetto(10); tra(e10.durata, 50, 1e3, 'durata del picco a 10 parsec (anni)'); tra(e10.cosmiciLento, 2, 20, 'se il resto li rilascia in 30 mila anni: volte il fondo'); tra(e10.anniDiFondo, 5e4, 5e5, 'in tutto: anni di fondo normale'); tra(e10.cosmici * e10.durata / e10.anniDiFondo, 0.05, 1, 'il picco porta una parte del totale'); tra(s.effetto(100).anniDiFondo / e10.anniDiFondo, 0.099, 0.101, '∝ 1/d');
  // dalle sorgenti vere di una galassia (come le dà cosmo.js): le più vicine, e la prossima come evento della sorgente
  const Gx = { ritmoSN: 0.05, forma: { unitaM: 6.7e20 }, sorgenti: [{ tipo: 'getto', pos: [0, 0] }, { tipo: 'supernova', nome: 'lontana', pos: [0.4, 0.1], eta: 4000 }, { tipo: 'supernova', nome: 'vicina', pos: [0.1001, 0.1], eta: 1000 }, { tipo: 'pulsar', pos: [0.4, 0.1] }] };
  const caso = sorgente('cosmo 1/galassia 3/stella 53'), g = R.supernovaVicina(sulMare(), { P: TERRA, galassia: Gx, posizione: [0.1, 0.1], caso });
  assert.equal(g.vicine.length, 2); assert.equal(g.vicine[0].nome, 'vicina'); tra(g.vicine[0].distanzaPc, 1.5, 3); assert.ok(g.vicine[0].cosmici > 10 && g.vicine[1].cosmici < 1e-6);
  assert.ok(g.ogniQuanto(10) < s.ogniQuanto(10) * 1.2 && g.prossima.tra > 0 && g.prossima.distanza <= 100);
  assert.deepEqual(R.supernovaVicina(sulMare(), { P: TERRA, galassia: Gx, posizione: [0.1, 0.1], caso: sorgente('cosmo 1/galassia 3/stella 53') }).prossima.tra, g.prossima.tra);
  const altro = R.supernovaVicina(sulMare(), { P: TERRA, galassia: Gx, posizione: [0.1, 0.1], caso: sorgente('cosmo 1/galassia 3/stella 53', { 'cosmo 1/galassia 3/stella 53/supernova vicina/quando': 1 }) });
  assert.notEqual(altro.prossima.tra, g.prossima.tra); assert.equal(altro.prossima.distanza, g.prossima.distanza);
  nota(`entro 10 pc ogni ${n(s.ogniQuanto(10) / 1e9)} miliardi di anni (cosmici ×${n(s.effetto(10).cosmici)} per ${n(s.effetto(10).durata)} anni, o ×${n(s.effetto(10).cosmiciLento)} per 30 mila; in tutto ${n(s.effetto(10).doseTotale)} Sv al suolo); entro 100 pc ogni ${n(s.ogniQuanto(100) / 1e6)} milioni (×${n(1 + s.effetto(100).cosmici)})`);
});

prova('gli amplificatori e i loro tempi: giorni per il tempo atmosferico, milioni di anni per le orbite, subito per la nucleazione', () => {
  const t = R.tempoMeteo(sulMare(), { P: TERRA });
  tra(t.giorni, 7, 30, 'tempo di amplificazione del tempo atmosferico (giorni; limite di Lorenz: due settimane)'); tra(t.raddoppio / 86400, 0.7, 5, 'tempo di raddoppio degli errori (giorni; modelli di oggi 1,5–2,5; Lorenz: 5)');
  tra(t.cascata / 3600, 0.3, 12, 'la cascata della turbolenza fino ai temporali (ore)'); tra(t.vento, 5, 60, 'vento termico (m/s)'); assert.ok(t.molecole < 10 && /cicloni/.test(t.regime));
  const lento = R.tempoMeteo(sulMare(), { P: { ...TERRA, giorno: 86400 * 200 } }); assert.ok(/gira piano/.test(lento.regime) && lento.giorni > 0.5 && lento.giorni < 400);
  assert.equal(R.tempoMeteo(M.luogoDaRoccia({ P: LUNA, continente: false, bagnato: false }), { P: LUNA }), null);
  const tc = R.tempiCaotici(sulMare(), { P: TERRA });
  tra(tc.mare, 0.2, 5, 'i vortici del mare (anni)'); tra(tc.dinamo, 300, 3e4, 'la dinamo (anni)'); tra(tc.mantello, 1e8, 1e9, 'il mantello (anni)'); tra(tc.raddoppi, 35, 80, 'tempi di Lyapunov necessari');
  tra(tc.corpiPiccoli, 1e6, 1e8, 'le orbite dei corpi piccoli (anni)'); tra(tc.pianeti, 1e8, 1e9, 'le orbite dei pianeti (anni)'); assert.ok(tc.pianeti / tc.corpiPiccoli > 10);
  const A = R.amplificatori(sulMare(), { P: TERRA }), di = (s) => A.filter((a) => a.specie === s);
  assert.ok(di('metastabile').length >= 3 && di('caotico').length >= 4 && di('copia').length === 1);
  const goccia = A.find((a) => /goccia nasce/.test(a.nome)), fulmine = A.find((a) => /scarica/.test(a.nome)), meteo = A.find((a) => a.nome === 'il tempo atmosferico'), orbite = A.find((a) => /orbite/.test(a.nome)), copia = di('copia')[0];
  assert.ok(goccia.acceso && goccia.tempo < 3600 && fulmine.acceso && fulmine.tempo < 1 && fulmine.ritmo.valore > 1e9); assert.ok(meteo.acceso && meteo.tempo === t.secondi && /NON il clima/.test(meteo.cosa)); assert.equal(orbite.livello, 'sistema');
  assert.equal(copia.acceso, false, 'nel progetto la chimica che si copia non è ancora accesa'); assert.ok(R.amplificatori(sulMare(), { P: TERRA, vita: true }).find((a) => a.specie === 'copia').acceso);
  assert.ok(A.find((a) => /salamoia/.test(a.nome)).acceso === false && R.amplificatori(sulMare(), { P: TERRA, salamoia: true }).find((a) => /salamoia/.test(a.nome)).acceso);
  // la Luna: niente aria, niente mare; resta solo il mantello (lentissimo)
  const AL = R.amplificatori(M.luogoDaRoccia({ P: LUNA, continente: false, bagnato: false }), { P: LUNA }); assert.ok(!AL.find((a) => a.nome === 'il tempo atmosferico').acceso && !AL.find((a) => /goccia nasce/.test(a.nome)).acceso);
  nota(`tempo atmosferico ${n(t.giorni)} giorni (cascata ${n(t.cascata / 3600)} ore, poi ${n(Math.log(TERRA.raggioM / 8430))} tempi di crescita da ${n(t.lyapunov / 86400)} giorni); mare ${n(tc.mare)} anni; dinamo ${n(tc.dinamo)}; mantello ${n(tc.mantello / 1e6)} milioni; impatti ${n(tc.corpiPiccoli / 1e6)} milioni; orbite dei pianeti ${n(tc.pianeti / 1e6)} milioni`);
});

prova('un ramo che cambia un decadimento cambia SOLO ciò che finDoveRisale dice', () => {
  // lo stesso punto di roccia in due mondi: in uno il primo decadimento della finestra è andato in un altro modo
  const radice = SUOLO.indirizzo, evento = `${radice}/materia/istante/evento 0/dove/x`, rami = { [evento]: 1 }, opz = { processo: 'potassio-40 β' };
  const qui = M.cellaMateria(SUOLO, opz, sorgente(radice)), la = M.cellaMateria(SUOLO, opz, sorgente(radice, rami));
  assert.notEqual(JSON.stringify(qui.cella.sorgenti), JSON.stringify(la.cella.sorgenti), 'il punto: le tracce sono altre');
  assert.notEqual(JSON.stringify(simulaMondo(qui.cella, { maxParticelle: 3 })[0].punti[0]), JSON.stringify(simulaMondo(la.cella, { maxParticelle: 3 })[0].punti[0]));
  // 1. le somme non lo sanno: i flussi, la dose, le sorgenti naturali di quel luogo sono gli stessi nei due mondi
  const numeri = (r) => JSON.stringify([r.flussi, r.dose, r.gasRadiogenici, r.energiaPerLaChimica, r.tempi, r.supernova.prossima]);
  const stella = 'cosmo 1/galassia 3/stella 53', A = R.risalita(SUOLO, { P: TERRA, caso: sorgente(stella) }), B = R.risalita(SUOLO, { P: TERRA, caso: sorgente(stella, rami) });
  assert.equal(numeri(A), numeri(B), 'ogni flusso è identico'); assert.equal(JSON.stringify(M.sorgentiNaturali(SUOLO).totale), JSON.stringify(M.sorgentiNaturali({ ...SUOLO }).totale));
  // 2. un altro punto dello stesso pianeta, nello stesso istante: identico
  const altrove = M.luogoDaRoccia({ P: TERRA, continente: true, etaRoccia: 1.5e9, lon: 80, indirizzo: 'cosmo 1/galassia 3/stella 53/pianeta 0/roccia/80.0000/45.0000/0' });
  assert.equal(JSON.stringify(M.cellaMateria(altrove, opz, sorgente(altrove.indirizzo)).cella.sorgenti), JSON.stringify(M.cellaMateria(altrove, opz, sorgente(altrove.indirizzo, rami)).cella.sorgenti));
  // 3. ciò che può cambiare, e da quando
  const f = R.finDoveRisale(evento, SUOLO, { P: TERRA });
  assert.deepEqual(f.contenitori, { punto: radice, pianeta: 'cosmo 1/galassia 3/stella 53/pianeta 0', sistema: 'cosmo 1/galassia 3/stella 53' });
  for (let i = 1; i < f.livelli.length; i++) assert.ok(f.livelli[i].da >= f.livelli[i - 1].da); assert.equal(f.livelli[0].da, 0); assert.equal(f.livelli[0].contenitore, 'punto');
  const liv = (nome) => f.livelli.find((l) => l.livello === nome), meteo = liv('il tempo atmosferico'), impatti = liv('gli impatti nel sistema');
  tra(meteo.da / 86400, 7, 30, 'il tempo atmosferico è un altro dopo (giorni)'); assert.equal(meteo.contenitore, 'pianeta'); assert.ok(/clima/.test(meteo.nonCambia)); tra(impatti.da / ANNO, 1e6, 1e8, 'gli impatti del sistema (anni)');
  assert.ok(f.livelli.every((l) => l.nonCambia && l.cambia && l.via) && f.mai.length >= 4);
  const a = (...p) => indirizzo(['cosmo 1', 'galassia 3', ...p]);
  const punto = a('stella 53', 'pianeta 0', 'roccia', '12.0000', '45.0000', '0', 'materia'), tempoMeteo = a('stella 53', 'pianeta 0', 'meteo'), vicino = a('stella 53', 'pianeta 1'), lontano = a('stella 54', 'pianeta 0'), altraGalassia = indirizzo(['cosmo 1', 'galassia 4']);
  assert.ok(f.tocca(punto, 0)); assert.equal(f.tocca(punto, -1), false, 'niente prima'); assert.equal(f.tocca(tempoMeteo, 1 / 365), false, 'un giorno dopo il tempo è ancora lo stesso'); assert.ok(f.tocca(tempoMeteo, 1));
  assert.equal(f.tocca(vicino, 1e4), false); assert.ok(f.tocca(vicino, 1e8), 'gli impatti sul pianeta accanto, dopo cento milioni di anni'); assert.equal(f.tocca(lontano, 1e10), false, 'un altro sistema: mai'); assert.equal(f.tocca(altraGalassia, 1e10), false);
  assert.equal(f.livelloDi(1e-6), 'punto'); assert.equal(f.livelloDi(1), 'pianeta'); assert.equal(f.livelloDi(1e9), 'sistema');
  // (è la regola 3 di intreccio.js, con il tempo in più)
  for (const [x, dopo] of [[punto, 0], [tempoMeteo, 1], [vicino, 1e8], [lontano, 1e10]]) assert.equal(f.tocca(x, dopo), puoToccare(evento, f.contenitori[f.livelloDi(dopo)], x));
  // sotto un chilometro di roccia il disturbo deve prima arrivare all'aria; su un mondo senz'aria né mare non sale
  const sotto = R.finDoveRisale('e', { ...sottoRoccia, indirizzo: radice }, { P: TERRA }); assert.ok(sotto.livelli.find((l) => l.livello === 'il tempo atmosferico').da > meteo.da);
  const luna = R.finDoveRisale('e', M.luogoDaRoccia({ P: LUNA, continente: false, bagnato: false, indirizzo: 'cosmo 1/galassia 3/stella 53/pianeta 0/luna 0/roccia/0/0/0' }), { P: LUNA });
  assert.equal(luna.livelli.find((l) => l.livello === 'il tempo atmosferico'), undefined); assert.equal(luna.livelloDi(1e6), 'punto');
  // 4. la differenza minima tra due mondi per il tempo atmosferico: un evento alla sorgente del pianeta
  const pianeta = f.contenitori.pianeta, fisso = R.increspatura(), uno = R.increspatura(sorgente(pianeta)), due = R.increspatura(sorgente(pianeta, { [`${pianeta}/meteo/seme/0`]: 1 }));
  assert.deepEqual(fisso.fasi, [0, 1, 2], 'senza sorgente: il tempo di prima'); assert.equal(uno.evento, `${pianeta}/meteo/seme/0`); assert.notEqual(uno.fasi[0], due.fasi[0]); assert.equal(uno.fasi[1], due.fasi[1]); assert.equal(uno.fasi[2], due.fasi[2]);
  assert.deepEqual(R.increspatura(sorgente(pianeta)).fasi, uno.fasi);
  nota(f.livelli.map((l) => `${l.livello} ${l.daTesto}`).join(' · '));
});

prova('il raccordo inverso: sotto ogni famiglia di eventi grandi c\'è un amplificatore; le fluttuazioni dell\'inizio', () => {
  assert.ok(R.FAMIGLIE.length >= 12); for (const f of R.FAMIGLIE) assert.ok(f.famiglia && f.dove && f.sotto && f.tempo && ['metastabile', 'caotico', 'copia', 'primo', 'nessuna'].includes(f.specie), f.famiglia);
  for (const parola of ['cosmo', 'galassie', 'supernove', 'urti giganti', 'impatti', 'mantello', 'tempo atmosferico', 'decadimenti']) assert.ok(R.FAMIGLIE.some((f) => f.famiglia.includes(parola)), `manca la famiglia: ${parola}`);
  assert.equal(R.FAMIGLIE.filter((f) => f.specie === 'primo').length, 1, 'un solo caso «primo»: gli eventi subatomici stessi'); assert.ok(R.FAMIGLIE.filter((f) => f.specie === 'caotico').length >= 7);
  const i = R.fluttuazioniDellInizio(); assert.ok(i.vero.length >= 2 && i.manca.some((m) => /spettro/.test(m)) && i.manca.some((m) => /Rayleigh/.test(m)) && i.esponenti.quiPerOttava < 0 && i.esponenti.veroSottoIlPicco > 3);
});

prova('tutto insieme, per ogni specie di luogo: numeri finiti, lo stesso risultato due volte, un costo piccolo', () => {
  const GIOVE = { tipo: 'gassoso', massaKg: 1.9e27, raggioM: 7e7, B0: 4e-4, Lw: 3.828e26, aM: 7.78e11, Mstella: 1.989e30, clima: { g: 24.8, pressione: Infinity, T: 165, Teq: 110 }, atmosfera: { gas: { H2: 0.86, He: 0.14 } }, interno: { eta: 4.5e9, q: 5, B0: 4e-4, tettonica: 'nessuna (è un gas)', vulcani: 0 } };
  const luoghi = [['aria sul mare', sulMare(), TERRA], ['granito', SUOLO, TERRA], ['1 km sotto', sottoRoccia, TERRA], ['mare profondo', sottoMare(2000), TERRA], ['ghiaccio', M.luogoDaRoccia({ P: TERRA, ghiaccio: true, profonditaM: 100, T: 250 }), TERRA],
    ['Marte', M.luogoDaAria({ P: MARTE }), MARTE], ['Luna', M.luogoDaRoccia({ P: LUNA, continente: false, bagnato: false }), LUNA], ['un gigante', M.luogoDaAria({ P: GIOVE }), GIOVE], ['un luogo senza pianeta', { tipo: 'roccia', minerali: [{ nome: 'quarzo', frazione: 1 }] }, null]];
  for (const [nome, L, P] of luoghi) {
    const t0 = Date.now(), r = R.risalita(L, P ? { P } : {}), dt = Date.now() - t0, r2 = R.risalita(L, P ? { P } : {});
    assert.ok(r.flussi.length >= 8 && r.racconto.length >= 4 && r.breve.length === 4, nome); assert.ok(!r.breve.join(' ').match(/NaN|undefined|Infinity/), `${nome}: ${r.breve.join(' ')}`); for (const f of r.flussi) assert.ok(isFinite(f.valore) && f.nome && f.unita && f.verso && f.legge, `${nome}: ${f.nome}`);
    assert.ok(isFinite(r.dose.totale.Sv) && r.dose.totale.Sv >= 0 && r.amplificatori.length >= 8 && r.famiglie === R.FAMIGLIE, nome); assert.equal(typeof r.ionizzazione(5000).totale, 'number');
    assert.equal(JSON.stringify([r.flussi, r.racconto, r.dose]), JSON.stringify([r2.flussi, r2.racconto, r2.dose]), `${nome}: deterministico`); assert.ok(dt < 1500, `${nome}: ${dt} ms`);
    assert.ok(!r.racconto.join(' ').match(/NaN|undefined|Infinity/), `${nome}: ${r.racconto.join(' ')}`);
  }
  const t0 = Date.now(); for (let i = 0; i < 5; i++) R.risalita(sulMare(), { P: TERRA }); assert.ok(Date.now() - t0 < 400, `la seconda volta costa poco: ${Date.now() - t0} ms per 5`);
  console.log('\n   il racconto per la Terra, su un granito:\n' + R.risalita(SUOLO, { P: TERRA }).racconto.map((x) => `     ${x}`).join('\n'));
  console.log('\n   in breve (per il pannello del pianeta):\n' + R.risalita(M.luogoDaAria({ P: TERRA }), { P: TERRA }).breve.map((x) => `     ${x}`).join('\n') + '\n   e per Marte:\n' + R.risalita(M.luogoDaAria({ P: MARTE }), { P: MARTE }).breve.map((x) => `     ${x}`).join('\n'));
});

console.log(`\ntest_risalita: ${ok} prove passate`);
