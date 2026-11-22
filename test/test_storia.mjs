// test_storia.mjs — LA STORIA DI UN PIANETA (src/camera/storia.js): lo stato lento a un tempo qualsiasi, dalle equazioni
// integrate dall'origine. Le PROVE sono ciò che deve valere sempre (la storia è una funzione pura, il passato non cambia
// se si va avanti, l'energia torna, un ramo cambia solo ciò che ne discende, «interno» ha la forma di sempre). I
// RISCONTRI sono mondi veri costruiti a mano (Terra, Venere, Marte, Mercurio, Luna): ognuno è stampato come numero, e se
// non torna c'è scritto «≠ NON TORNA» con il perché; le soglie non si allargano. In fondo: la popolazione del campione
// (quanti a placche, quanti con dinamo) e il costo misurato.
import assert from 'node:assert/strict';
import { storia, tabellaStoria, climaNelTempo, internoDaStoria, STORIA, APERTI } from '../src/camera/storia.js';
import * as LG from '../src/camera/leggi.js';
import { stella as stellaVera } from '../src/camera/stelle.js';
import * as CH from '../src/camera/chimica.js';

let ok = 0; const nonTorna = [];
const prova = (nome, f) => { f(); ok++; console.log('  ✓', nome); };
const tra = (x, a, b, che) => assert.ok(x >= a && x <= b, `${che}: ${x} (atteso tra ${a} e ${b})`);
const n = (x, c = 3) => (x == null ? '—' : Math.abs(x) >= 1e4 || (Math.abs(x) < 1e-2 && x !== 0) ? Number(x).toExponential(c - 1) : String(+Number(x).toPrecision(c))).replace('.', ',');
const riscontro = (che, x, a, b, vero, perche = '') => { const torna = x >= a && x <= b; console.log(`      ${torna ? '=' : '≠ NON TORNA'} ${che}: ${n(x, 4)} (chiesto ${n(a)}–${n(b)}; vero ${vero})${torna || !perche ? '' : ` — ${perche}`}`); if (!torna) nonTorna.push(`${che}: ${n(x, 4)} (chiesto ${n(a)}–${n(b)})${perche ? ` — ${perche}` : ''}`); return torna; };
const Ga = 1e9, SOLE = { eta: 4.5e9, Z: 1, massa: 1 }, LOGGI = stellaVera(1, { Z: 1, eta: 4.5e9 }).L * LG.LSOLE; // (la luce che stelle.js dà al Sole di oggi)

// ---------- i mondi veri (i numeri di test/test_fili.mjs; Mercurio e Luna in più)
const VERI = {
  Terra: { massaKg: 5.972e24, raggioM: 6.371e6, ua: 1, giorno: 86164, obliquita: 23.44, composizione: { ferro: 0.32, roccia: 0.674, acqua: 0.006 } },
  Venere: { massaKg: 4.867e24, raggioM: 6.052e6, ua: 0.723, giorno: 243 * 86400, obliquita: 2.6, composizione: { ferro: 0.31, roccia: 0.69, acqua: 0 } },
  Marte: { massaKg: 6.417e23, raggioM: 3.3895e6, ua: 1.524, giorno: 88643, obliquita: 25.2, composizione: { ferro: 0.24, roccia: 0.76, acqua: 0 } },
  Mercurio: { massaKg: 3.301e23, raggioM: 2.4397e6, ua: 0.387, giorno: 58.65 * 86400, obliquita: 0, eccentricita: 0.2056, composizione: { ferro: 0.68, roccia: 0.32, acqua: 0 } },
  Luna: { massaKg: 7.35e22, raggioM: 1.737e6, ua: 1, giorno: 27.32 * 86400, obliquita: 6.7, composizione: { ferro: 0.02, roccia: 0.98, acqua: 0 } } };
const mondo = (nome, altro = {}) => { const m = VERI[nome]; return { tipo: 'roccioso', massaKg: m.massaKg, raggioM: m.raggioM, composizione: m.composizione, giorno: m.giorno, obliquita: m.obliquita, eccentricita: m.eccentricita ?? 0, Lw: LOGGI, aM: m.ua * LG.UA, Mstella: LG.MSOLE, ...altro }; };
const TERRA = mondo('Terra'), VENERE = mondo('Venere'), MARTE = mondo('Marte'), MERCURIO = mondo('Mercurio'), LUNA = mondo('Luna');
const oggi = (P, rami = null) => storia(P, 4.5e9, { stella: SOLE, ...(rami ? { rami } : {}) });

console.log('LA STORIA: una funzione pura, che si può guardare a ogni tempo');
prova('la stessa domanda dà la stessa storia; il passato non cambia se si integra più avanti; ogni grandezza è finita', () => {
  const a = mondo('Terra'), b = mondo('Terra'), prima = storia(a, 1.3 * Ga, { stella: SOLE }), dopo = oggi(a), ancora = storia(a, 1.3 * Ga), altro = storia(b, 1.3 * Ga, { stella: SOLE });
  for (const k of ['Tm', 'Tcmb', 'q']) { assert.equal(prima[k], ancora[k], `${k} a 1,3 Ga è cambiato dopo aver guardato oggi`); assert.equal(prima[k], altro[k], `${k}: due oggetti uguali danno storie diverse`); }
  assert.ok(dopo.t === 4.5 * Ga && prima.t === 1.3 * Ga); const avanti = storia(a, 9 * Ga); assert.ok(avanti.Tm < dopo.Tm && storia(a, 4.5 * Ga).Tm === dopo.Tm, 'andare a 9 Ga ha cambiato lo stato a 4,5');
  const tb = tabellaStoria(a); tra(tb.t.length, 60, 600, 'righe della tabella'); for (const col of ['Tm', 'Tcmb', 'Qconv', 'Qcmb', 'Qrad', 'Ric', 'M', 'mob']) for (const x of tb[col]) assert.ok(Number.isFinite(x), `${col} non finito`);
  for (let k = 1; k < tb.t.length; k++) assert.ok(tb.t[k] > tb.t[k - 1], 'il tempo della tabella non cresce');
  console.log(`      ${tb.t.length} righe da ${n(tb.t[0])} a ${n(tb.t.at(-1))} anni; a 1,3 Ga: T_m ${n(prima.Tm, 4)} K, q ${n(prima.q)} W/m²; a 9 Ga: T_m ${n(avanti.Tm, 4)} K, q ${n(avanti.q)} W/m²`);
});
prova("l'energia torna: ciò che mantello e nucleo perdono è ciò che i flussi portano via; e la tabella di lavoro è già a convergenza", () => {
  // (il bilancio si controlla su una storia integrata trentadue volte più fitta: con i passi di lavoro la somma a trapezi della
  // prova, non la storia, sbaglierebbe di qualche centesimo una differenza piccola tra flussi grandi)
  for (const P of [TERRA, MARTE]) { const fitta = { stella: SOLE, fine: 32 }, tb = tabellaStoria(P, fitta), st = tb.struttura, S = STORIA, s = 3.156e7; let nucleo = 0, mantello = 0, primo = -1;
    for (let k = 1; k < tb.t.length; k++) { if (tb.t[k - 1] < 0.5 * Ga) continue; if (primo < 0) primo = k - 1; const dt = (tb.t[k] - tb.t[k - 1]) * s; // (dopo l'oceano di magma: lì il calore latente del mantello è una capacità in più)
      nucleo += 0.5 * (tb.Qcmb[k] + tb.Qcmb[k - 1]) * dt; mantello += 0.5 * (tb.Qrad[k] + tb.Qrad[k - 1] + tb.Qmarea[k] + tb.Qmarea[k - 1] + tb.Qcmb[k] + tb.Qcmb[k - 1] - tb.Qconv[k] - tb.Qconv[k - 1] - tb.Qfuso[k] - tb.Qfuso[k - 1]) * dt; }
    // (finché sotto il coperchio c'è fuso il mantello ha in più la capacità del calore latente: L_m·dφ/dT)
    const u = tb.t.length - 1; let dEm = 0; for (let k = primo + 1; k <= u; k++) dEm += st.Mm * (S.cp + (tb.Fv[k - 1] > 0 ? S.latenteMantello * st.dFdT : 0)) * (tb.Tm[k] - tb.Tm[k - 1]);
    // il nucleo: calore sensibile più quello (latente e gravitazionale) del nucleo interno cresciuto
    const dEc = st.Mc * S.cNucleo * st.ac * (tb.Tcmb[primo] - tb.Tcmb[u]) + (S.latenteFerro + S.gravitazionale) * S.rhoNucleo * (4 / 3) * Math.PI * (tb.Ric[u] ** 3 - tb.Ric[primo] ** 3);
    tra(mantello / dEm, 0.99, 1.01, 'mantello: flussi integrati / calore perso'); tra(nucleo / dEc, 0.99, 1.01, 'nucleo: calore uscito / calore perso');
    const lavoro = storia(P, 4.5e9, { stella: SOLE }), preciso = storia(P, 4.5e9, fitta); for (const k of ['Tm', 'Tcmb']) tra(Math.abs(lavoro[k] - preciso[k]), 0, 3, `${k}: passi di lavoro − passi fitti (K)`); tra(lavoro.q / preciso.q, 0.97, 1.03, 'q: passi di lavoro / passi fitti'); // (q è molto più sensibile delle temperature: 1 K sono 0,5–2%)
    console.log(`      ${P === TERRA ? 'Terra' : 'Marte'}, da 0,5 a 4,5 Ga: il mantello cede ${n(-dEm)} J (flussi: ${n(-mantello)}), il nucleo ${n(dEc)} J (uscito: ${n(nucleo)})`); }
});
prova('«interno» ha la forma di sempre, ed è la storia letta all\'età: una fonte sola', () => {
  const s = oggi(TERRA), i = internoDaStoria(TERRA, SOLE);
  assert.deepEqual(Object.keys(i), ['eta', 'nucleo', 'crosta', 'q', 'dinamo', 'B0', 'tettonica', 'vulcani', 'rossby', 'dipolo']); assert.deepEqual(i, s.interno);
  assert.equal(i.q, s.q); assert.equal(i.B0, s.dinamo.B0); assert.equal(i.tettonica, s.crosta.regime); assert.ok(['a placche', 'coperchio unico, con vulcani', 'ferma'].includes(i.tettonica));
  // senza il giorno non c'è numero di Rossby (come prima); un gigante di gas resta la legge di prima
  const senza = internoDaStoria({ ...TERRA, giorno: undefined }, SOLE); assert.equal(senza.rossby, undefined); assert.equal(senza.B0, i.B0);
  const gas = storia({ tipo: 'gassoso', massaKg: 1.9e27, raggioM: 7e7, composizione: {} }, 4.5e9).interno; assert.equal(gas.tettonica, 'nessuna (è un gas)'); tra(gas.B0, 4.1e-4, 4.3e-4, 'Giove (T)');
  // a un'altra età è la stessa storia più indietro, non un'altra legge: il calore di ieri era di più
  const ieri = internoDaStoria(TERRA, { ...SOLE, eta: 2 * Ga }); assert.ok(ieri.q > i.q && ieri.eta === 2 * Ga); assert.equal(ieri.q, storia(TERRA, 2 * Ga).q);
});
prova('un ramo dei parametri aperti cambia solo ciò che ne discende', () => {
  const base = oggi(TERRA), k40 = oggi(TERRA, { conducibilitaNucleo: 40 }), g = oggi(TERRA, { dipolo: 0.14 }), secca = oggi(TERRA, { poriAcqua: 0 });
  // la conducibilità del nucleo non tocca le temperature (decide solo quanta parte del flusso muove la dinamo)
  assert.equal(k40.Tm, base.Tm); assert.equal(k40.Tcmb, base.Tcmb); assert.equal(k40.q, base.q); assert.ok(k40.dinamo.qad < base.dinamo.qad && k40.dinamo.Fth > base.dinamo.Fth);
  tra(k40.dinamo.qad / base.dinamo.qad, 40 / 70 - 1e-9, 40 / 70 + 1e-9, 'q_ad ∝ k');
  // la costante del dipolo scala il momento e nient'altro
  assert.equal(g.Tm, base.Tm); tra(g.dinamo.momento / base.dinamo.momento, 0.7 - 1e-9, 0.7 + 1e-9, 'M ∝ γ_d');
  // senza l'acqua che abbassa l'attrito la stessa Terra non ha placche (e il mantello resta più caldo)
  assert.equal(base.crosta.regime, 'a placche'); assert.notEqual(secca.crosta.regime, 'a placche'); assert.ok(secca.Tum > base.Tum + 50, `coperchio fermo: T_UM ${secca.Tum} contro ${base.Tum}`);
  for (const k in APERTI) tra(APERTI[k].valore, APERTI[k].intervallo[0], APERTI[k].intervallo[1], `${k}: il valore centrale sta nel suo intervallo`);
  console.log(`      Terra senz'acqua nei pori: ${secca.crosta.regime}, T_UM ${n(secca.Tum, 4)} K (con: ${n(base.Tum, 4)}), q ${n(secca.q)} W/m²`);
});
prova('il criterio di Korenaga: decide l\'attrito, cioè l\'acqua (Venere è ferma perché è asciutta, non perché è calda)', () => {
  const s = oggi(TERRA), c = s.crosta;
  assert.ok(c.lnContrasto < c.lnCritico && c.mobilita > 0.9); const v = oggi(VENERE); assert.ok(v.crosta.lnContrasto > v.crosta.lnCritico + 10 && v.crosta.mobilita < 1e-4, 'Venere, asciutta: coperchio fermo senza appello');
  // l'attrito che sta sulla soglia per la Terra di oggi: 0,327·γ^0,647·θ = ln(0,25·Ra_i^½)
  const tb = tabellaStoria(TERRA), u = tb.t.length - 1, dT = tb.Tum[u] - tb.Ts[u], teta = (STORIA.Enu * dT) / (LG.R_GAS * tb.Tum[u] ** 2), muSoglia = STORIA.alfa * dT * Math.pow(tb.lnCrit[u] / (STORIA.korenagaA * teta), 1 / STORIA.korenagaN);
  tra(muSoglia, 0.02, 0.1, 'attrito efficace alla soglia'); assert.ok(STORIA.attritoSecco * (1 - APERTI.poriAcqua.valore) < muSoglia && STORIA.attritoSecco > 5 * muSoglia);
  // una Terra con la superficie di Venere (735 K) e l'acqua (per assurdo): resta a placche; lo si stampa
  const calda = storia(mondo('Terra'), 4.5e9, { stella: SOLE, Tsuperficie: 735 });
  console.log(`      Terra: ln Δη_L ${n(c.lnContrasto)} contro ln Δη_crit ${n(c.lnCritico)} (θ = ${n(teta)}); attrito alla soglia ${n(muSoglia)} (con l'acqua ${n(STORIA.attritoSecco * (1 - APERTI.poriAcqua.valore))}, roccia secca ${STORIA.attritoSecco}); con la superficie a 735 K e l'acqua: ${calda.crosta.regime}`);
  // l'acqua che conta è quella che sta sopra come mare: con un decimo dell'acqua la stessa Terra non ha più placche
  const poca = oggi(mondo('Terra', { composizione: { ...VERI.Terra.composizione, acqua: 0.0006 } })); assert.notEqual(poca.crosta.regime, 'a placche');
});

console.log('\nSTADIO 3: la stella nel tempo');
prova('la luce è quella di stelle.js a quel tempo; l\'XUV è la legge di Ribas 2005, satura prima di 0,1 Ga', () => {
  for (const t of [0.05, 0.3, 1, 2.5, 4.5, 8].map((x) => x * Ga)) tra(storia(TERRA, t, { stella: SOLE }).stella.L / (stellaVera(1, { Z: 1, eta: t }).L * LG.LSOLE), 0.98, 1.02, `luce a ${t / Ga} Ga`); // (48 punti in logaritmo, interpolati)
  // la tabella 4 di Ribas e altri 2005 (erg/s/cm² a 1 UA, 1–1180 Å): 1 erg/s/cm² = 10⁻³ W/m²
  const ribas = [[0.1, 513.5], [0.3, 129.3], [0.65, 51.1], [1.6, 16.0], [4.56, 4.64], [6.7, 2.9]]; const righe = [];
  for (const [t, F] of ribas) { const x = storia(TERRA, t * Ga).stella.XUV / 1e-3; righe.push(`${t} Ga: ${n(x)} (${F})`); tra(x / F, 0.75, 1.3, `XUV a ${t} Ga contro la tabella di Ribas`); }
  const giovane = storia(TERRA, 0.03 * Ga).stella, satura = storia(TERRA, 0.1 * Ga).stella; assert.ok(giovane.saturo && Math.abs(giovane.XUV / satura.XUV - 1) < 0.02, 'prima di 0,1 Ga è satura');
  tra(satura.XUVsuL, 4e-4, 6.5e-4, 'L_XUV/L alla saturazione (Johnstone e altri 2021: R_X,sat = 5,135·10⁻⁴)');
  // una stella più piccola: stessa frazione satura della sua luce; e il flusso cala col quadrato della distanza
  const nana = storia({ ...mondo('Terra'), Lw: stellaVera(0.5, { Z: 1, eta: 4.5e9 }).L * LG.LSOLE, Mstella: 0.5 * LG.MSOLE }, 0.05 * Ga, { stella: { eta: 4.5e9, Z: 1, massa: 0.5 } }).stella; tra(nana.XUVsuL / satura.XUVsuL, 0.9, 1.1, 'frazione satura di una nana');
  tra(storia(MARTE, 1 * Ga, { stella: SOLE }).stella.XUV / storia(TERRA, 1 * Ga).stella.XUV, 1 / 1.524 ** 2 - 1e-3, 1 / 1.524 ** 2 + 1e-3, 'XUV ∝ 1/a²');
  console.log(`      XUV a 1 UA (erg/s/cm²; tra parentesi Ribas): ${righe.join(', ')}; il Sole di stelle.js: ${n(storia(TERRA, 1 * Ga).stella.L / LOGGI)} di oggi a 1 Ga, ${n(storia(TERRA, 0.1 * Ga).stella.L / LOGGI)} a 0,1 Ga`);
});

console.log('\nSTADIO 1: i riscontri con i mondi veri (niente è tarato su di loro, tranne la costante del numero di Rossby)');
prova('la Terra: calore, mantello, nucleo, dinamo, placche', () => {
  const s = oggi(TERRA), e = s.eventi, tb = tabellaStoria(TERRA), prima = storia(TERRA, 1.5 * Ga);
  riscontro('Terra: flusso di calore in superficie (W/m²)', s.q, 0.061, 0.113, '0,087 (±30%)');
  riscontro('Terra: campo all\'equatore (T)', s.dinamo.B0, 2e-5, 4.5e-5, '3,1·10⁻⁵');
  riscontro('Terra: momento di dipolo (A·m²)', s.dinamo.momento, 5e22, 1.2e23, '8·10²²');
  riscontro('Terra: temperatura potenziale del mantello superiore (K)', s.Tum, 1550, 1700, '1600–1650');
  riscontro('Terra: la temperatura potenziale del mantello cala (K per miliardo di anni, media sugli ultimi 3)', (prima.Tum - s.Tum) / 3, 50, 100, '50–100 (dalle lave antiche)', `la temperatura media del mantello cala di ${n((prima.Tm - s.Tm) / 3)} K/Ga: con β = 1/3 e tanto potassio (condriti) il mantello segue il calore radiogenico da vicino`);
  riscontro('Terra: calore dal nucleo (TW)', s.Q.cmb / 1e12, 5, 17, '5–17');
  riscontro('Terra: raggio del nucleo interno (km)', s.nucleoInterno.raggio / 1e3, 610, 2440, '1221 (entro un fattore 2)');
  riscontro('Terra: età del nucleo interno (miliardi di anni)', e.nucleoInterno != null ? (4.5 * Ga - e.nucleoInterno) / Ga : 0, 0.3, 1.5, '0,5–1,5',
    'tra «nessun nucleo interno» e «quello di oggi» ci sono 45 K di T_cmb: il riscontro più sensibile del modello; vedi sotto come si muove con i parametri aperti');
  riscontro('Terra: rapporto di Urey (calore radiogenico / calore che esce)', s.urey, 0.25, 0.6, '0,3–0,5');
  riscontro('Terra: magma prodotto (km³/anno)', s.fuso.kgAnno / 2900 / 1e9, 15, 40, '~20–30 (crosta degli oceani)');
  riscontro('Terra: crosta di basalto (km)', s.crosta.basalto / 1e3, 5, 10, '7', 'il solidus di Katz a secco fa cominciare la fusione più in fondo (qui manca il raffreddamento per conduzione sotto la dorsale)');
  riscontro('Terra: CO2 dai vulcani (10¹² mol/anno)', s.degassamento.CO2 / 1e12, 6, 10, '6–10 (misurate)');
  assert.ok(s.dinamo.accesa && s.dinamo.dipolo && e.fineDinamo == null && e.dinamoAccesa <= 1e6, 'la geodinamo c\'è da sempre'); assert.equal(e.placche.filter((x) => x.t <= 4.5 * Ga).length, 0, 'placche per tutta la storia fin qui (con l\'acqua)');
  tra(s.dinamo.rossby, 0.0899, 0.0901, 'Ro_l della Terra di oggi: è il dato (0,09)');
  console.log(`      oggi: T_m ${n(s.Tm, 4)} K, T_cmb ${n(s.Tcmb, 4)} K, Q_conv ${n(s.Q.conv / 1e12)} + Q_fuso ${n(s.Q.fuso / 1e12)} TW, Q_rad ${n(s.Q.rad / 1e12)} TW, Q_cmb ${n(s.Q.cmb / 1e12)} TW (adiabatico ${n(s.dinamo.qad * 4 * Math.PI * tb.struttura.Rc ** 2 / 1e12)} TW), coperchio ${n(s.crosta.coperchio / 1e3)} km`);
  console.log(`      nel tempo (Ga: T_UM K, q W/m², B T, nucleo interno km): ${[0.5, 1, 2, 3, 4, 4.5].map((t) => { const x = storia(TERRA, t * Ga); return `${t}: ${n(x.Tum, 4)}, ${n(x.q)}, ${n(x.dinamo.B0)}, ${n(x.nucleoInterno.raggio / 1e3, 4)}`; }).join(' · ')}`);
  // i parametri aperti: come si muove ciò che ne dipende
  const riga = (nome, rami) => { const x = oggi(TERRA, rami); return `${nome}: nucleo interno ${n(x.nucleoInterno.raggio / 1e3, 4)} km, nato ${x.eventi.nucleoInterno != null ? n((4.5 * Ga - x.eventi.nucleoInterno) / Ga) + ' Ga fa' : 'mai'}; B ${n(x.dinamo.B0)} T${x.dinamo.accesa ? '' : ' (dinamo spenta)'}`; };
  console.log(`      PARAMETRI APERTI → ${riga('leggeri 5%', { leggeriNucleo: 0.05 })} | ${riga('15%', { leggeriNucleo: 0.15 })} | ${riga('k = 20', { conducibilitaNucleo: 20 })} | ${riga('k = 160', { conducibilitaNucleo: 160 })} | ${riga('γ_d 0,14', { dipolo: 0.14 })} | ${riga('γ_d 0,28', { dipolo: 0.28 })}`);
  // con la conducibilità più alta dell'intervallo: per quanto tempo la dinamo termica non basta?
  const k160 = tabellaStoria(TERRA, { stella: SOLE, rami: { conducibilitaNucleo: 160 } }); let spenta = 0; for (let k = 1; k < k160.t.length; k++) if (!k160.accesa[k]) spenta += k160.t[k] - k160.t[k - 1];
  console.log(`      anche con k = 160 W/m/K la dinamo resta spenta solo per ${n(spenta / Ga)} Ga: qui il nucleo cede sempre più calore di quanto l'adiabatica ne porti (il «nuovo paradosso del nucleo» non compare, perché il nucleo interno nasce presto)`);
  // il futuro: quando il Sole, crescendo, fa evaporare il mare (luce assorbita oltre il limite del vapore) l'attrito torna quello della roccia secca
  const fut = storia(TERRA, 9 * Ga).eventi.placche.find((x) => x.a === 'coperchio'); console.log(`      il futuro: le placche si fermano a ${fut ? n(fut.t / Ga) : '—'} Ga dalla nascita (il mare evapora: leggi.js LIMITE_VAPORE con albedo 0,3)`);
});
prova('Venere: coperchio fermo e nessun dipolo (gira troppo piano); Marte: coperchio fermo; Mercurio e Luna stampati', () => {
  const v = oggi(VENERE), m = oggi(MARTE), me = oggi(MERCURIO), lu = oggi(LUNA);
  assert.notEqual(v.crosta.regime, 'a placche'); assert.notEqual(m.crosta.regime, 'a placche');
  riscontro('Venere: numero di Rossby locale (sopra 0,12 non c\'è dipolo)', v.dinamo.rossby ?? Infinity, 0.12, Infinity, 'nessun dipolo');
  assert.equal(v.dinamo.dipolo, false); assert.ok(v.fuso.vulcani > 0, 'Venere ha vulcani');
  riscontro('Venere: campo in superficie (T)', v.dinamo.B0, 0, 5e-9, 'nessuno misurabile (< 5·10⁻⁹)', 'il nucleo, qui, fa ancora dinamo; senza dipolo la legge dice solo «dieci volte più debole»');
  riscontro('Venere: flusso di calore (W/m²)', v.q, 0.01, 0.08, 'non misurato; stime 0,01–0,08');
  riscontro('Marte: flusso di calore oggi (W/m²)', m.q, 0.014, 0.03, '0,019–0,025 (InSight e stime)');
  riscontro('Marte: la dinamo si spegne (miliardi di anni dalla nascita)', m.eventi.fineDinamo != null ? m.eventi.fineDinamo / Ga : Infinity, 0, 0.7, '~0,5 (spenta da ~4 Ga)',
    'qui il nucleo di Marte ha gli elementi leggeri della Terra (10%): gela dal centro e il nucleo interno tiene viva una dinamo debole; il nucleo vero è ricco di zolfo e tutto liquido. In più conducibilità del mantello profondo e dilatazione del ferro sono quelle della Terra (alta pressione)');
  riscontro('Marte: campo oggi (T)', m.dinamo.B0, 0, 5e-9, 'nessuna dinamo (solo crosta magnetizzata)', 'come sopra');
  riscontro('Mercurio: ha una dinamo oggi (1 = sì)', me.dinamo.accesa ? 1 : 0, 1, 1, 'sì, debole');
  riscontro('Mercurio: campo all\'equatore (T)', me.dinamo.B0, 1e-7, 6e-7, '~3·10⁻⁷', 'la legge del momento di dipolo vale per le dinamo rapide; senza dipolo (Ro_l alto) dice solo «dieci volte meno»');
  riscontro('Luna: ha avuto una dinamo (1 = sì)', lu.eventi.dinamoAccesa != null ? 1 : 0, 1, 1, 'sì, tra ~4,2 e ~1–2 Ga fa', 'un corpo così piccolo qui parte dalla sola energia di accrescimento (1600 K) e il nucleo non ha calore da cedere: manca il calore dell\'urto che l\'ha fatta');
  console.log(`      Venere: ${v.crosta.regime}, T_UM ${n(v.Tum, 4)} K, coperchio ${n(v.crosta.coperchio / 1e3)} km, Ro_l ${n(v.dinamo.rossby)}; Marte: ${m.crosta.regime}, T_UM ${n(m.Tum, 4)} K, coperchio ${n(m.crosta.coperchio / 1e3)} km, nucleo interno ${n(m.nucleoInterno.raggio / 1e3)} km, Q_cmb ${n(m.dinamo.qcmb * 1e3)} contro adiabatico ${n(m.dinamo.qad * 1e3)} mW/m²`);
  console.log(`      Marte con il 20% di elementi leggeri (ramo): nucleo interno ${n(oggi(MARTE, { leggeriNucleo: 0.2 }).nucleoInterno.raggio / 1e3)} km, dinamo ${oggi(MARTE, { leggeriNucleo: 0.2 }).dinamo.accesa ? 'ancora accesa (termica)' : 'spenta'}; Mercurio: Ro_l ${n(me.dinamo.rossby)}, nucleo interno ${n(me.nucleoInterno.raggio / 1e3)} di ${n(tabellaStoria(MERCURIO).struttura.Rc / 1e3)} km`);
});

console.log('\nSTADIO 4 (in parte): ciò che è esposto, non ancora collegato');
prova('il tetto energetico della fuga e il clima a un tempo t (il ciclo del carbonio di chimica.js, non duplicato)', () => {
  const t = oggi(TERRA), m = oggi(MARTE), aria = (P) => (1e5 * 4 * Math.PI * P.raggioM ** 2) / ((LG.COSTANTI.G * P.massaKg) / P.raggioM ** 2); // (kg di un'aria da 1 bar)
  assert.ok(t.fuga.kgTotali > 0 && m.fuga.kgTotali > 0 && storia(TERRA, 1 * Ga).fuga.kgTotali < t.fuga.kgTotali, 'l\'integrale cresce col tempo');
  tra(storia(TERRA, 0.05 * Ga).fuga.kgAnno / t.fuga.kgAnno, 50, 200, 'la fuga possibile da giovane / oggi');
  riscontro('Marte perde l\'aria: tetto energetico della fuga / un\'aria da 1 bar', m.fuga.kgTotali / aria(MARTE), 1, Infinity, '> 1 (l\'ha persa)');
  riscontro('la Terra la tiene: tetto energetico della fuga / la sua aria', t.fuga.kgTotali / aria(TERRA), 0, 1, '< 1 (l\'ha tenuta)',
    'il tetto energetico vale per un\'alta atmosfera di idrogeno: per N2 e CO2 comandano il limite di diffusione e il raffreddamento della termosfera, che mancano. Da solo non distingue la Terra da Marte');
  // il clima a un tempo: la stessa legge di oggi (chimica.js climaEAria) con la luce, il calore e il regime di allora
  let riga = '';
  try { const adesso = climaNelTempo(TERRA, 4.5 * Ga, { stella: SOLE }), antico = climaNelTempo(TERRA, 1 * Ga, { stella: SOLE }), mezzo = climaNelTempo(TERRA, 2.5 * Ga, { stella: SOLE });
    tra(antico.luce, 0.7, 0.85, 'il Sole a 1 Ga, in unità di oggi'); assert.ok(antico.calore > 2 * adesso.calore, 'più calore dall\'interno, allora');
    riscontro('Terra a 3,5 Ga fa (Sole al ' + n(100 * antico.luce) + '%): temperatura (K)', antico.clima.T, 273, 330, 'non gelata, mare liquido (il paradosso del Sole giovane)', `stato dell'acqua: ${antico.clima.acqua}. Non gela: bolle. Con il calore di allora (${n(antico.calore)} W/m²) i vulcani di chimica.js emettono ${n(CH.vulcani({ calore: antico.calore, raggioM: TERRA.raggioM, composizione: TERRA.composizione }).CO2)} mol/anno di CO2, più di quanta la roccia fresca esposta (denudazione fissa) e il fondo del mare possano consumare a una temperatura con il mare: co2DelCiclo sale e il mare evapora`);
    riga = `oggi ${n(adesso.clima.T, 4)} K (${adesso.clima.acqua}, CO2 del ciclo ${n((adesso.clima.co2Ciclo || 0) / 1e5)} bar) · 2 Ga fa ${n(mezzo.clima.T, 4)} K (${mezzo.clima.acqua}, ${n((mezzo.clima.co2Ciclo || 0) / 1e5)} bar) · 3,5 Ga fa ${n(antico.clima.T, 4)} K (${antico.clima.acqua}, ${n((antico.clima.co2Ciclo || 0) / 1e5)} bar, calore ${n(antico.calore)} W/m²)`;
  } catch (err) { riga = `NON CALCOLATO: ${err.message}`; nonTorna.push(`clima nel tempo: ${err.message}`); }
  console.log(`      il clima della Terra nel tempo (inventario dell'aria del modello, non i gas veri): ${riga}`);
  // il magma ha due stime: quella della storia (dalla roccia che fonde) e quella di chimica.js (un decimo del calore): da unificare
  const ch = CH.vulcani({ calore: t.q, raggioM: TERRA.raggioM, composizione: TERRA.composizione });
  console.log(`      magma della Terra: ${n(t.fuso.kgAnno)} kg/anno dalla storia, ${n(ch.magma)} da chimica.js vulcani(q) (CO2: ${n(t.degassamento.CO2)} contro ${n(ch.CO2)} mol/anno): due stime della stessa grandezza, da unificare quando il clima leggerà la storia`);
});

// ---------- il costo e la popolazione
console.log('\nIL COSTO e LA POPOLAZIONE');
prova('il costo: pochi millisecondi a pianeta', () => {
  const fai = (k) => ({ tipo: 'roccioso', massaKg: 5.972e24 * (0.05 + 0.02 * k), raggioM: 6.371e6 * Math.pow(0.05 + 0.02 * k, 0.27), giorno: 86164, composizione: { ferro: 0.32, roccia: 0.674, acqua: k % 2 ? 0.006 : 0 }, Lw: LOGGI, aM: LG.UA * (0.5 + 0.01 * k), Mstella: LG.MSOLE });
  for (let k = 0; k < 30; k++) storia(fai(k), 4.5e9, { stella: SOLE }); // (a caldo)
  const N = 150, t0 = process.hrtime.bigint(); let righe = 0; for (let k = 0; k < N; k++) { const P = fai(k + 0.5); storia(P, 1.2e10, { stella: { eta: 1.2e10, Z: 1, massa: 0.5 } }); righe += tabellaStoria(P).t.length; }
  const ms = Number(process.hrtime.bigint() - t0) / 1e6 / N, P = fai(7.5); storia(P, 4.5e9, { stella: SOLE }); const t1 = process.hrtime.bigint(); for (let k = 0; k < 2000; k++) storia(P, 1e9 + k * 1e6); const us = Number(process.hrtime.bigint() - t1) / 1e3 / 2000;
  tra(ms, 0, 8, 'millisecondi per una storia di 12 miliardi di anni'); console.log(`      una storia di 12 Ga: ${n(ms)} ms (${n(righe / N)} righe); una domanda a storia già fatta: ${n(us)} µs`);
});
{
  // la popolazione: i pianeti solidi di un campione della biblioteca (cosmo.js); «prima» è la legge a soglie che interno() aveva
  const prima = (P, eta) => { const TR = { M: 5.97e24, R: 6.371e6, q: 0.087 }, M = P.massaKg, R = P.raggioM, q = TR.q * (M / TR.M) / (R / TR.R) ** 2 * (LG.caloreDellaRoccia(eta) / LG.caloreDellaRoccia(4.5e9)) * Math.pow(M / TR.M, 0.3);
    return { placche: q > 0.05 && LG.acquaInSuperficie(P).frazione > 0.005 && M > 0.3 * TR.M, dinamo: q > 0.025 && R > 3.5e6, vulcani: q > 0.02 }; }; // (senza il fattore √Z)
  let CO = null; try { CO = await import('../src/camera/cosmo.js'); } catch (err) { console.log(`  ○ popolazione non calcolata: cosmo.js non si carica (${err.message})`); }
  if (CO) prova('la popolazione: quanti a placche, quanti con dinamo, prima (soglie) → ora (storia)', () => {
    const c = { n: 0, placche: [0, 0], dinamo: [0, 0], vulcani: [0, 0], dipolo: 0, nucleoInterno: 0, roccia: 0, ghiaccio: 0, vecchi: 0 }; const t0 = Date.now();
    for (const cosmo of [1, 2]) for (let g = 0; g < 2; g++) for (let s = 0; s < 8; s++) { let S; try { S = CO.sistema(cosmo, g, s); } catch { continue; }
      for (const p of S.pianeti) { if (p.tipo === 'gassoso') continue; const o = p.interno, v = prima(p, S.stella.eta), st = storia(p);
        assert.ok(Number.isFinite(o.q) && o.q >= 0 && Number.isFinite(o.B0) && o.B0 > 0 && o.nucleo > 0 && o.nucleo < 1, `interno non finito: ${JSON.stringify(o)}`); assert.equal(o.q, st.q, 'p.interno.q è la storia letta all\'età'); assert.equal(o.eta, S.stella.eta);
        c.n++; c[p.tipo === 'roccioso' ? 'roccia' : 'ghiaccio']++; if (S.stella.eta > 8e9) c.vecchi++; c.placche[0] += v.placche; c.placche[1] += o.tettonica === 'a placche'; c.dinamo[0] += v.dinamo; c.dinamo[1] += o.dinamo; c.vulcani[0] += v.vulcani; c.vulcani[1] += o.vulcani > 0;
        if (o.dinamo && o.dipolo !== false) c.dipolo++; if (st.nucleoInterno.raggio > 0) c.nucleoInterno++; } }
    assert.ok(c.n > 100, `campione troppo piccolo: ${c.n}`);
    console.log(`      ${c.n} pianeti solidi (${c.roccia} di roccia, ${c.ghiaccio} ghiacciati; ${c.vecchi} attorno a stelle più vecchie di 8 Ga) in ${Date.now() - t0} ms con tutto il sistema`);
    console.log(`      a placche: ${c.placche[0]} → ${c.placche[1]} · con dinamo: ${c.dinamo[0]} → ${c.dinamo[1]} (${c.dipolo} con dipolo) · con vulcani: ${c.vulcani[0]} → ${c.vulcani[1]} · con nucleo interno: ${c.nucleoInterno}`);
  });
}

console.log(`\ntest_storia: ${ok} prove passate; ${nonTorna.length} riscontri col vero NON TORNANO${nonTorna.length ? ':' : '.'}`);
for (const r of nonTorna) console.log(`   ≠ ${r}`);
