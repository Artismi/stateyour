// test_impatti.mjs — la storia degli impatti: i numeri veri della Terra e della Luna, e storie che emergono dalla formazione
import assert from 'node:assert/strict';
import { storiaImpatti, giganteDi, urtoGigante, contaCrateri, improntaMantello, crateriVisibili, ariaDi, attraversaAria, cratere, giriChambers, deltaChambers, classeDi, diametroClasse, CLASSI } from '../src/camera/impatti.js';
import { sorgente } from '../src/camera/eventi.js';
import { MSOLE, UA } from '../src/camera/leggi.js';
import { indirizzoDi, sistema, casoDisco } from '../src/camera/cosmo.js';
import { formaPianeti, disco, raggiNecessari, giriCheRegge } from '../src/camera/disco.js';
import { lune } from '../src/camera/lune.js';
import { evolviTettonica } from '../src/camera/tettonica.js';

let ok = 0;
const prova = (nome, f) => { f(); ok++; console.log('  ✓', nome); };
const tra = (x, a, b, che) => assert.ok(x > a && x < b, `${che}: ${x} (atteso tra ${a} e ${b})`);
const somma = (a) => { let s = 0; for (const v of a) s += v; return s; };

// ---------- i corpi veri. Di ogni pianeta solo ciò che si sa; della formazione si sa (dalle rocce) un urto solo: quello
// che ha fatto la Luna, un corpo come Marte arrivato a 45° circa 60 milioni di anni dopo la nascita del Sole, nel
// verso in cui la Terra gira (l'asse è inclinato di 23°)
const MT = 5.972e24, RT = 6.371e6, ML = 7.35e22, L_TERRA_LUNA = 3.5e34;
const anno = (aUA) => 2 * Math.PI * Math.sqrt((aUA * UA) ** 3 / (6.674e-11 * MSOLE));
const SOLO = 'un embrione di roccia rimasto solo, che ha mangiato tutta la sua striscia di disco';
const pianeta = (id, aUA, m, r, altro = {}) => ({ id, tipo: 'roccioso', aM: aUA * UA, massaKg: m * MT, raggioM: r * RT, Mstella: MSOLE, anno: anno(aUA), composizione: { ferro: 0.32, roccia: 0.68, acqua: 0 }, storia: SOLO, clima: { pressione: 0, T: 300 }, ...altro });
const MERCURIO = pianeta(0, 0.387, 0.0553, 0.383);
const VENERE = pianeta(1, 0.723, 0.815, 0.95, { clima: { pressione: 9.2e6, T: 735 }, atmosfera: { gas: { CO2: 0.965, N2: 0.035 } } });
const TERRA = pianeta(2, 1, 1, 1, { clima: { pressione: 1.013e5, T: 288 }, atmosfera: { gas: { N2: 0.78, O2: 0.21 } }, interno: { q: 0.087, nucleo: 0.546 }, formazione: { urti: [{ bersaglioKg: 0.9 * MT, massaKg: 0.1 * MT, angolo: 45, inclinazione: 23.4, t: 6e7 }] } });
const MARTE = pianeta(3, 1.524, 0.107, 0.532, { clima: { pressione: 610, T: 210 }, atmosfera: { gas: { CO2: 0.95, N2: 0.03 } } });
const GIOVE = { id: 4, tipo: 'gassoso', aM: 5.2 * UA, massaKg: 317.8 * MT, raggioM: 7.149e7, Mstella: MSOLE, anno: anno(5.2), composizione: { idrogeno: 0.71, elio: 0.25, pesanti: 0.04 }, storia: 'un nucleo di 10 Terre ha catturato il gas a valanga', clima: { pressione: Infinity, T: 165 } };
const SOLARE = { stella: { massa: 1, eta: 4.567e9, Z: 1 }, pianeti: [MERCURIO, VENERE, TERRA, MARTE, GIOVE] };
const LUNA = { id: 0, origine: 'urto', massaKg: ML, raggioM: 1.737e6, aM: 3.84e8, composizione: { roccia: 0.98, ferro: 0.02 } };
const RADICE = 'cosmo 1/galassia 0/stella 0/pianeta 2', CASO = sorgente(RADICE);
const STORIA = storiaImpatti(TERRA, SOLARE, CASO), SULLA_LUNA = storiaImpatti(TERRA, SOLARE, CASO, { luna: LUNA });

prova('un corpo come Marte a 10 km/s sulla Terra giovane: l\'energia, il disco e il momento angolare della Luna', () => {
  const u = urtoGigante({ bersaglioKg: 0.893 * MT, massaKg: 0.107 * MT, v: 1e4, angolo: 45 });
  tra(u.energiaJ, 1e31, 1e32, 'energia (J)');
  tra(u.momentoAngolare / L_TERRA_LUNA, 0.7, 1.6, 'momento angolare / quello di Terra e Luna oggi');
  tra(u.discoKg / ML, 1, 4, 'disco di detriti in orbita (lune: le simulazioni danno 1,5–2)');
  tra(u.lunaKg / ML, 0.3, 2, 'la luna che ne nasce (lune)');
  tra(u.detritiKg / MT, 1e-3, 2e-2, 'detriti che sfuggono (masse terrestri)');
  tra(u.frazioneFusa, 0.02, 1, 'parte del pianeta fusa');
  tra((2 * Math.PI * 0.33 * MT * RT ** 2) / u.momentoPianeta / 3600, 3, 8, 'il giorno dopo l\'urto (ore: si stima 5)');
  // a picco non resta niente in orbita; più di striscio, di più; molto più veloce della fuga, i due corpi si disfano
  assert.equal(urtoGigante({ bersaglioKg: 0.9 * MT, massaKg: 0.1 * MT, angolo: 90 }).discoKg, 0);
  assert.ok(urtoGigante({ bersaglioKg: 0.9 * MT, massaKg: 0.1 * MT, angolo: 30 }).discoKg > u.discoKg);
  const veloce = urtoGigante({ bersaglioKg: 0.893 * MT, massaKg: 0.107 * MT, v: 3e4, angolo: 45 });
  assert.ok(Math.abs(veloce.energiaJ / u.energiaJ - 9) < 1e-9 && veloce.detritiKg > 10 * u.detritiKg);
  console.log(`      (energia ${u.energiaJ.toExponential(1)} J; disco ${(u.discoKg / ML).toFixed(2)} lune, luna ${(u.lunaKg / ML).toFixed(2)}; momento ${(u.momentoAngolare / L_TERRA_LUNA).toFixed(2)} di Terra+Luna; sfugge ${(100 * u.detritiKg / MT).toFixed(2)}% di una Terra)`);
});

prova('la legge di Chambers nei due versi, le classi di taglia', () => {
  for (const mu of [1e-7, 3e-6, 1e-3]) for (const d of [4, 8, 12]) assert.ok(Math.abs(deltaChambers(giriChambers(d, mu), mu) - d) < 1e-9);
  tra(Math.log10(giriChambers(5 * 2 ** (2 / 3), 1.5e-6)), 5, 7.5, 'due embrioni vicini reggono (log dei giri: circa un milione)');
  for (let c = 0; c < CLASSI; c++) assert.equal(classeDi(diametroClasse(c)), c);
  tra(diametroClasse(CLASSI - 1), 3, 10, 'la classe più piccola (m)'); tra(diametroClasse(0) / 1e3, 3000, 4100, 'la più grande (km)');
});

prova('la Terra dopo l\'urto della Luna: arriva una «vernice tardiva», una piccola parte del pianeta', () => {
  const b = STORIA.bilancio, g = STORIA.gigante;
  assert.equal(STORIA.formazione, 6e7); assert.equal(g.t, 6e7); assert.equal(STORIA.eta, 4.567e9);
  tra(b.arrivataSuM, 1e-4, 2e-2, 'massa arrivata / massa della Terra (dalle rocce: circa 5·10⁻³)');
  tra(g.giornoDopo / 3600, 3, 8, 'il giorno che l\'urto lascia (ore)'); tra(g.obliquita, 0, 180, 'inclinazione dell\'asse (gradi)');
  tra(g.luna.mu, 3e-3, 3e-2, 'massa della luna / massa del pianeta (la nostra: 1/81)');
  tra(g.detritiKg / MT, 1e-3, 2e-2, 'detriti in giro dopo l\'urto (Terre)');
  // la massa si conserva: i detriti sono finiti sul pianeta, sui vicini, fuori, in polvere, o sono ancora lì
  const fine = b.sulPianetaKg + b.aiViciniKg + b.scagliataKg + b.polvereKg + b.rimastaKg;
  assert.ok(Math.abs(fine / b.detritiKg - 1) < 1e-9, `bilancio ${fine} / ${b.detritiKg}`);
  assert.ok(Math.abs(b.arrivataKg / b.sulPianetaKg - 1) < 1e-6, 'gli urti contati sono la massa caduta sul pianeta');
  tra(b.polvereKg / b.detritiKg, 0.2, 0.95, 'la parte macinata in polvere dalla cascata');
  tra(somma(STORIA.grandi.map((x) => x.massaKg)) / b.arrivataKg, 0.3, 1, 'la massa sta nei corpi grandi');
  assert.ok(STORIA.grandi.length > 500 && STORIA.grandi.length <= 2000);
  for (const x of STORIA.grandi) {
    for (const v of [x.t, x.massaKg, x.diametroM, x.v, x.lat, x.lon, x.angolo, x.energiaJ, x.cratereM, x.fusione, x.sorte]) assert.ok(Number.isFinite(v));
    assert.ok(x.t >= 6e7 && x.t <= 4.567e9 && Math.abs(x.lat) <= 90 && Math.abs(x.lon) <= 180 && x.angolo >= 0 && x.angolo <= 90 && x.sorte >= 0 && x.sorte < 1);
    assert.ok(x.v > 11180 && x.v < 80e3, `più veloce della fuga dalla Terra: ${x.v}`);
    assert.ok(Math.abs(x.energiaJ - 0.5 * x.massaKg * x.v ** 2) < 1e-9 * x.energiaJ && x.classe === classeDi(x.diametroM) && x.cratereM > x.diametroM);
  }
  // gli angoli: 45° il più probabile, metà sopra e metà sotto; i punti: sparsi su tutta la sfera
  tra(STORIA.grandi.filter((x) => x.angolo > 45).length / STORIA.grandi.length, 0.44, 0.56, 'urti più ripidi di 45°');
  tra(STORIA.grandi.filter((x) => x.lat > 0).length / STORIA.grandi.length, 0.44, 0.56, 'urti nell\'emisfero nord');
  tra(STORIA.grandi.filter((x) => Math.abs(x.lat) < 30).length / STORIA.grandi.length, 0.44, 0.56, 'urti tra 30° sud e 30° nord (metà della sfera)');
  console.log(`      (arrivato lo ${(100 * b.arrivataSuM).toFixed(2)}% della Terra, in ${STORIA.grandi.length} corpi grandi seguiti uno per uno e ${b.numeroPiccoli.toExponential(1)} piccoli; in polvere il ${(100 * b.polvereKg / b.detritiKg).toFixed(0)}% dei detriti; giorno dopo l'urto ${(g.giornoDopo / 3600).toFixed(1)} ore; luna 1/${Math.round(1 / g.luna.mu)})`);
});

prova('il bombardamento cala nel tempo, e non come una sola esponenziale', () => {
  const A = STORIA.attesi, nE = A.epoche.length - 1, ritmo = [];
  for (let z = 0; z < nE; z++) { let m = 0; for (let k = 0; k < CLASSI; k++) m += A.perEpoca[k * nE + z] * A.massaKg[k]; ritmo.push(m / (A.epoche[z + 1] - A.epoche[z])); }
  for (let z = 1; z < nE; z++) assert.ok(ritmo[z] <= ritmo[z - 1] * 1.0001, `epoca ${z}: ${ritmo[z]} dopo ${ritmo[z - 1]}`);
  const quando = (dt) => ritmo[A.epoche.findIndex((t) => t - STORIA.formazione >= dt)];
  assert.ok(quando(1e9) < 1e-4 * quando(1e7) && quando(1e7) < 0.5 * quando(1e6));
  // una sola esponenziale che cala di 10 volte tra 1 e 10 milioni di anni calerebbe di 10¹⁰ tra 10 e 100: qui molto meno
  // (ogni classe di velocità ha il suo tempo: prima spariscono i lenti, i veloci durano)
  assert.ok(quando(1e8) / quando(1e7) > 100 * Math.pow(quando(1e7) / quando(1e6), 10));
  const finestra = (a, b) => STORIA.grandi.filter((x) => x.t - STORIA.formazione >= a && x.t - STORIA.formazione < b).length;
  assert.ok(finestra(0, 1e8) > finestra(1e8, 2e8) && finestra(1e8, 2e8) > finestra(2e8, 3e8) && finestra(3e9, 4.6e9) === 0);
  tra((STORIA.quiete.t - STORIA.formazione) / 1e6, 10, 1000, 'per quanti milioni di anni gli urti scaldano più del calore interno');
  console.log(`      (kg all'anno sulla Terra: ${quando(1e6).toExponential(1)} dopo 1 milione di anni, ${quando(1e7).toExponential(1)} dopo 10, ${quando(1e8).toExponential(1)} dopo 100, ${quando(1e9).toExponential(1)} dopo 1000; gli urti comandano il mantello per ${((STORIA.quiete.t - STORIA.formazione) / 1e6).toFixed(0)} milioni di anni)`);
});

prova('la cascata: le taglie non sono scritte da nessuno, e stanno attorno alla pendenza di Dohnanyi', () => {
  const A = STORIA.attesi, cum = []; let a = 0; for (let k = 0; k < CLASSI; k++) { a += A.numero[k]; cum.push(a); }
  const pendenza = (d1, d2) => Math.log(cum[classeDi(d2)] / cum[classeDi(d1)]) / Math.log(A.diametroM[classeDi(d1)] / A.diametroM[classeDi(d2)]);
  tra(pendenza(1e5, 1e3), 1.5, 3, 'N(>D) ∝ D^-p tra 100 km e 1 km (Dohnanyi: 2,5; la fascia degli asteroidi: circa 2)');
  tra(pendenza(1e3, 1e2), 1.5, 3.5, 'tra 1 km e 100 m');
  for (let k = classeDi(3e5); k + 1 < CLASSI; k++) assert.ok(A.numero[k + 1] > A.numero[k], `i piccoli sono più dei grandi (classe ${k})`);
  // la popolazione di oggi: quasi tutto è stato spazzato via
  assert.ok(somma(STORIA.popolazione.oggi.slice(0, 20)) < 1e-6 * somma(STORIA.popolazione.iniziale.slice(0, 20)));
  console.log(`      (pendenza ${pendenza(1e5, 1e3).toFixed(2)} tra 100 km e 1 km: ${pendenza(1e5, 1e4).toFixed(2)} sopra i 10 km, ${pendenza(1e4, 1e3).toFixed(2)} sotto: un'onda, come nella fascia vera)`);
});

prova('la Luna: migliaia di crateri oltre i 20 km su una crosta di 4,4 miliardi di anni (contati: 5185)', () => {
  const n44 = contaCrateri(SULLA_LUNA, { diametroM: 2e4, superficie: 4.4e9 }), n40 = contaCrateri(SULLA_LUNA, { diametroM: 2e4, superficie: 4.0e9 }), tutti = contaCrateri(SULLA_LUNA, { diametroM: 2e4 });
  tra(n44, 500, 50000, 'crateri > 20 km sulla crosta lunare');
  assert.ok(n40 < n44 && n44 < tutti && contaCrateri(SULLA_LUNA, { diametroM: 1e5, superficie: 4.4e9 }) < n44);
  tra(contaCrateri(SULLA_LUNA, { diametroM: 3e5, superficie: 4.45e9 }), 1, 300, 'bacini oltre i 300 km (sulla Luna: una quarantina)');
  // la Luna è un bersaglio più piccolo e attira meno: riceve qualche decina di volte meno massa della Terra
  tra(STORIA.bilancio.arrivataKg / SULLA_LUNA.bilancio.arrivataKg, 10, 100, 'massa sulla Terra / massa sulla Luna (dalle sezioni d\'urto: circa 20; dalle rocce: di più)');
  const v = SULLA_LUNA.attesi.v[classeDi(1000)]; tra(v / 1e3, 6, 25, 'velocità tipica degli urti sulla Luna (km/s)');
  assert.ok(v < STORIA.attesi.v[classeDi(1000)] && SULLA_LUNA.gigante === null);
  // un corpo di 1 km a quella velocità fa sulla Luna un cratere di una ventina di km
  tra(SULLA_LUNA.attesi.cratereM[classeDi(1000)] / 1e3, 8, 25, 'cratere di un corpo di 1 km (km)');
  console.log(`      (crateri > 20 km: ${Math.round(n44)} su una crosta di 4,4 miliardi di anni, ${Math.round(n40)} su una di 4,0, ${Math.round(tutti)} dall'urto che l'ha fatta; massa Terra/Luna ${(STORIA.bilancio.arrivataKg / SULLA_LUNA.bilancio.arrivataKg).toFixed(0)}; velocità ${(v / 1e3).toFixed(1)} km/s)`);
});

prova('il cratere: la legge di scala, il passaggio a complesso, la profondità', () => {
  const luna = cratere({ diametroM: 1000, v: 17000, g: 1.62 }), terra = cratere({ diametroM: 1000, v: 17000, g: 9.81 });
  tra(luna.diametroM / 1e3, 13, 25, '1 km a 17 km/s sulla Luna (km: una ventina)'); assert.ok(terra.diametroM < luna.diametroM, 'più gravità, cratere più piccolo');
  tra(cratere({ diametroM: 12000, v: 20000, g: 9.81, angolo: 60 }).diametroM / 1e3, 100, 220, 'un corpo di 12 km a 20 km/s sulla Terra (Chicxulub: 150–180 km)');
  tra(cratere({ diametroM: 50, v: 12800, g: 9.81, densita: 7800, angolo: 80 }).diametroM / 1e3, 0.7, 2.5, '50 m di ferro (Meteor Crater: 1,2 km)');
  const piccolo = cratere({ diametroM: 30, v: 17000, g: 1.62 });
  assert.ok(!piccolo.complesso && Math.abs(piccolo.profonditaM / piccolo.diametroM - 0.2) < 1e-9 && terra.complesso && terra.profonditaM / terra.diametroM < 0.1);
  assert.ok(cratere({ diametroM: 1000, v: 17000, g: 1.62, angolo: 20 }).diametroM < luna.diametroM && cratere({ diametroM: 1000, v: 0, g: 1.62 }).diametroM === 0);
});

prova('l\'aria frena e fa esplodere i piccoli: sulla Terra sotto il centinaio di metri, su Venere sotto il chilometro', () => {
  const aT = ariaDi(TERRA), aV = ariaDi(VENERE), aM = ariaDi(MARTE), sasso = (aria, D) => attraversaAria(aria, D, 3300, 18000);
  tra(aT.H / 1e3, 7, 9.5, 'scala di altezza dell\'aria terrestre (km: 8,4)'); tra(aT.rho0, 1.1, 1.35, 'densità al suolo (kg/m³: 1,2)'); tra(aV.rho0, 55, 75, 'su Venere (kg/m³: 65)');
  assert.equal(ariaDi(MERCURIO), null); assert.equal(attraversaAria(null, 1, 3300, 18000).esito, 'intatto');
  assert.equal(sasso(aT, 30).esito, 'esplode in aria'); assert.ok(sasso(aT, 1000).v > 0.9 * 18000 && sasso(aT, 300).v > 0);
  assert.equal(sasso(aV, 500).esito, 'esplode in aria'); assert.ok(sasso(aV, 10000).v > 0.8 * 18000);
  assert.ok(sasso(aM, 30).v > 0.9 * 18000 && sasso(aM, 0.5).v < 9000, 'l\'aria sottile di Marte ferma solo i sassi');
  // la taglia più piccola che arriva al suolo: Marte < Terra < Venere
  const soglia = (aria) => { let D = 0.1; while (!(sasso(aria, D).v > 0)) D *= 1.1; return D; };
  assert.ok(soglia(aM) < soglia(aT) && soglia(aT) < soglia(aV));
  tra(soglia(aT), 30, 200, 'il più piccolo sasso che scava un cratere sulla Terra (m)'); tra(soglia(aV), 500, 4000, 'su Venere (m)');
  // nella storia di Venere (che riceve i detriti della Terra): i piccoli non arrivano; senz'aria arriverebbero tutti
  const conAria = storiaImpatti(VENERE, SOLARE, sorgente('prova/venere')), NUDA = { ...VENERE, clima: { pressione: 0, T: 735 }, atmosfera: null };
  const senza = storiaImpatti(NUDA, { ...SOLARE, pianeti: SOLARE.pianeti.map((p) => (p === VENERE ? NUDA : p)) }, sorgente('prova/venere'));
  assert.ok(conAria.bilancio.arrivataKg > 0 && conAria.bilancio.nubi.includes(2), 'i detriti dell\'urto terrestre arrivano fino a Venere');
  conAria.attesi.diametroM.forEach((D, k) => { if (D < 400) assert.equal(conAria.attesi.aTerra[k], 0); if (D > 6000) assert.equal(conAria.attesi.aTerra[k], 1); assert.equal(senza.attesi.aTerra[k], 1); });
  const pochi = contaCrateri(conAria, { diametroM: 2000 }), tanti = contaCrateri(senza, { diametroM: 2000 });
  assert.ok(pochi < 0.5 * tanti && pochi > 0, `crateri > 2 km su Venere: ${pochi} con l'aria, ${tanti} senza`);
  const grossi = contaCrateri(conAria, { diametroM: 3e5 }) / contaCrateri(senza, { diametroM: 3e5 });
  assert.ok(grossi > 0.8 && grossi <= 1, `i grandi passano (crateri oltre 300 km con l'aria / senza: ${grossi})`);
  // un gigante di gas non ha suolo: inghiotte tutto
  const giove = storiaImpatti(GIOVE, SOLARE, sorgente('prova/giove'));
  assert.ok(giove.gigante === null && giove.grandi.every((x) => x.esito === 'inghiottito' && x.cratereM === 0));
  console.log(`      (arrivano al suolo sopra i ${soglia(aM).toFixed(1)} m su Marte, ${Math.round(soglia(aT))} m sulla Terra, ${Math.round(soglia(aV))} m su Venere; crateri > 2 km su Venere: ${pochi.toExponential(1)} con l'aria, ${tanti.toExponential(1)} senza)`);
});

prova('lo stesso indirizzo dà la stessa storia; un ramo che cambia un solo impatto lascia identici gli altri', () => {
  const testo = (s) => JSON.stringify(s);
  assert.equal(testo(storiaImpatti(TERRA, SOLARE, sorgente(RADICE))), testo(STORIA));
  assert.notEqual(testo(storiaImpatti(TERRA, SOLARE, sorgente('cosmo 2/galassia 0/stella 0/pianeta 2')).grandi), testo(STORIA.grandi));
  // un universo parallelo: l'impatto 3 cade altrove
  const ramo = storiaImpatti(TERRA, SOLARE, sorgente(RADICE, { [`${RADICE}/impatto 3/dove`]: 1 }));
  const perId = (s) => new Map(s.grandi.map((x) => [x.id, x])), qui = perId(STORIA), la = perId(ramo);
  assert.equal(qui.size, la.size); assert.ok(qui.has(3));
  for (const [id, x] of qui) {
    const y = la.get(id);
    if (id !== 3) { assert.deepEqual(y, x); continue; }
    assert.ok(y.lat !== x.lat || y.lon !== x.lon, 'è caduto altrove');
    assert.deepEqual({ ...y, lat: 0, lon: 0 }, { ...x, lat: 0, lon: 0 }, 'ma è lo stesso corpo, alla stessa ora, con la stessa velocità');
  }
  assert.deepEqual(ramo.gigante, STORIA.gigante); assert.equal(testo(ramo.piccoli), testo(STORIA.piccoli)); assert.deepEqual(ramo.bilancio, STORIA.bilancio);
  // un altro: lo stesso corpo arriva in un altro momento
  const tardi = perId(storiaImpatti(TERRA, SOLARE, sorgente(RADICE, { [`${RADICE}/impatto 7/quando`]: 2 })));
  for (const [id, x] of qui) { if (id !== 7) assert.deepEqual(tardi.get(id), x); else assert.ok(tardi.get(7).t !== x.t && tardi.get(7).lat === x.lat && tardi.get(7).massaKg === x.massaKg); }
  // un ramo dell'urto gigante (su una Terra di cui non si sa l'angolo) cambia invece tutto ciò che ne discende
  const IGNOTA = { ...TERRA, formazione: { urti: [{ bersaglioKg: 0.9 * MT, massaKg: 0.1 * MT, t: 6e7 }] } }, sis = { ...SOLARE, pianeti: SOLARE.pianeti.map((p) => (p === TERRA ? IGNOTA : p)) };
  const uno = storiaImpatti(IGNOTA, sis, sorgente(RADICE)), due = storiaImpatti(IGNOTA, sis, sorgente(RADICE, { [`${RADICE}/urto gigante 1/angolo`]: 1 }));
  assert.ok(uno.gigante.angolo !== due.gigante.angolo && uno.gigante.detritiKg !== due.gigante.detritiKg && uno.bilancio.arrivataKg !== due.bilancio.arrivataKg);
});

prova('l\'impronta nel mantello: media zero, calda dove sono caduti gli urti più grandi e più tardi', () => {
  const W = 128, H = 64, m = improntaMantello(STORIA, W, H);
  assert.ok(m instanceof Float32Array && m.length === W * H && m.every(Number.isFinite));
  let alto = -Infinity, basso = Infinity; for (const v of m) { alto = Math.max(alto, v); basso = Math.min(basso, v); }
  assert.ok(Math.abs(somma(m) / m.length) < 1e-3 * (alto - basso) && alto > 10 && basso < 0, `media ${somma(m) / m.length}, da ${basso} a ${alto} K`);
  // il più energetico degli urti caduti prima della quiete: lì il mantello è tra i punti più caldi
  const cella = (x) => Math.min(H - 1, Math.floor(((90 - x.lat) / 180) * H)) * W + Math.min(W - 1, Math.floor(((x.lon + 180) / 360) * W));
  const prima = STORIA.grandi.filter((x) => x.t <= STORIA.quiete.t).sort((a, b) => b.energiaJ - a.energiaJ), ordinati = Float32Array.from(m).sort();
  assert.ok(m[cella(prima[0])] > 0 && m[cella(prima[0])] > ordinati[Math.floor(0.75 * m.length)], `sotto il più grande: ${m[cella(prima[0])]} K`);
  // a parità di calore per chilo (la roccia non regge più del calore latente), il più grande fa la macchia più larga, il più tardo la più calda
  const tardi = prima.filter((x) => x.diametroM > 2e5).sort((a, b) => b.t - a.t)[0];
  assert.ok(tardi.t > prima[0].t && m[cella(tardi)] > m[cella(prima[0])], `sotto il più tardo dei grossi: ${m[cella(tardi)]} K`);
  // più tardi lo si guarda, più il mantello ha rimescolato: l'impronta sbiadisce; senza rimescolamento resta
  const ampiezza = (a) => { let x = -Infinity, y = Infinity; for (const v of a) { x = Math.max(x, v); y = Math.min(y, v); } return x - y; };
  const dopo = improntaMantello(STORIA, W, H, { t: STORIA.quiete.t + 5e8 });
  assert.ok(ampiezza(dopo) < 0.5 * ampiezza(m) && ampiezza(improntaMantello(STORIA, W, H, { t: STORIA.quiete.t + 5e8, mescola: Infinity })) > ampiezza(dopo), `${ampiezza(dopo)} contro ${ampiezza(m)}`);
  // un urto solo, grande: una macchia calda lì e nient'altro; nessun urto: niente
  const una = improntaMantello({ ...STORIA, gigante: null, grandi: [{ ...prima[0], lat: 0, lon: 0 }] }, W, H);
  let k = 0; una.forEach((v, i) => { if (v > una[k]) k = i; });
  assert.ok(Math.abs((k % W) - W / 2) <= 1 && Math.abs(Math.floor(k / W) - H / 2) <= 1 && una[0] < 0);
  assert.ok(improntaMantello({ ...STORIA, gigante: null, grandi: [] }, W, H).every((v) => v === 0));
  console.log(`      (da ${basso.toFixed(0)} a ${alto.toFixed(0)} K; sotto l'urto più grande, un corpo di ${(prima[0].diametroM / 1e3).toFixed(0)} km: ${m[cella(prima[0])].toFixed(0)} K)`);
});

prova('i crateri che si vedono ancora: l\'età della superficie, l\'erosione, i crateri sepolti da altri crateri', () => {
  const W = 256, H = 128, tutti = crateriVisibili(STORIA, { W, H });
  assert.ok(tutti.length > 300 && tutti.length < STORIA.grandi.length, `su un mondo fermo e senz'aria: ${tutti.length} di ${STORIA.grandi.length}`);
  for (let k = 0; k < tutti.length; k++) { const x = tutti[k];
    assert.ok(x.i >= 0 && x.i < W && x.j >= 0 && x.j < H && x.eta > 0 && x.profonditaM > 0 && x.diametroM >= (Math.PI * RT) / W && x.raggioCelle > 0 && (k === 0 || x.t >= tutti[k - 1].t)); }
  // la superficie che si rinnova: più in fretta, meno crateri; con placche come quelle terrestri non ne resta nessuno
  const lento = crateriVisibili(STORIA, { W, H, rinnovo: 2e9 }), svelto = crateriVisibili(STORIA, { W, H, rinnovo: 3e8 });
  assert.ok(lento.length < tutti.length && svelto.length < lento.length && crateriVisibili(STORIA, { W, H, rinnovo: 1e8 }).length === 0);
  // una mappa di età: metà del pianeta ha una superficie di 4,3 miliardi di anni, l'altra metà di 100 milioni
  const eta = new Float32Array(W * H); for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) eta[j * W + i] = i < W / 2 ? 4.3e9 : 1e8;
  const meta = crateriVisibili(STORIA, { W, H, rinnovo: eta });
  assert.ok(meta.length > 0 && meta.every((x) => x.i < W / 2 && x.eta < 4.3e9));
  // l'erosione: mangia la profondità; un millimetro ogni mille anni cancella in 4 miliardi di anni tutto ciò che è meno fondo di 4 km
  const eroso = crateriVisibili(STORIA, { W, H, erosione: 1e-6 });
  assert.ok(eroso.length < tutti.length && eroso.every((x) => x.profonditaM < x.profonditaInizialeM && Math.abs(x.profonditaInizialeM - x.profonditaM - 1e-6 * x.eta) < 1e-6 * x.profonditaInizialeM));
  // sepolti: un cratere piccolo dentro uno più giovane e più grande sparisce; fuori, o se è lui il più giovane, resta
  const finto = (id, t, lat, lon, D) => ({ id, t, lat, lon, cratereM: D, profonditaM: 0.05 * D, complesso: true, sorte: 0.5 });
  const due = (g) => crateriVisibili({ raggioM: RT, eta: 4e9, formazione: 0, grandi: g }, {}).map((x) => x.id);
  assert.deepEqual(due([finto(0, 1e9, 10, 10, 1e5), finto(1, 2e9, 11, 10, 6e5)]), [1]);
  assert.deepEqual(due([finto(0, 3e9, 10, 10, 1e5), finto(1, 2e9, 11, 10, 6e5)]).sort(), [0, 1]);
  assert.deepEqual(due([finto(0, 1e9, 10, 40, 1e5), finto(1, 2e9, 11, 10, 6e5)]).sort(), [0, 1]);
  console.log(`      (${STORIA.grandi.length} grandi urti: se ne vedono ${tutti.length} se nulla li cancella, ${lento.length} con una superficie che si rifà in 2 miliardi di anni, ${svelto.length} in 300 milioni, ${eroso.length} con 1 mm di erosione ogni mille anni)`);
});

prova('un embrione lento ha ancora il suo cibo in giro: è colpito senza sosta, ancora oggi', () => {
  const LENTO = { id: 0, tipo: 'ghiacciato', aM: 12 * UA, massaKg: 0.3 * MT, raggioM: 0.8 * RT, Mstella: MSOLE, composizione: { ghiaccio: 0.75, roccia: 0.2, ferro: 0.05 }, storia: 'un embrione di ghiaccio rimasto solo, cresciuto piano: il suo cibo è ancora in giro', clima: { pressione: 0, T: 60 } };
  const s = storiaImpatti(LENTO, { stella: { massa: 1, eta: 4.567e9, Z: 1 }, pianeti: [LENTO] }, sorgente('prova/lento')), b = s.bilancio;
  assert.ok(s.gigante === null && b.detritiKg === 0 && b.restiKg > LENTO.massaKg, `cibo rimasto: ${b.restiKg / MT} Terre`);
  assert.ok(Math.abs((b.sulPianetaKg + b.aiViciniKg + b.scagliataKg + b.polvereKg + b.rimastaKg + b.daRilasciareKg) / b.restiKg - 1) < 1e-9);
  assert.ok(b.daRilasciareKg > 0 && b.rimastaKg > 0, 'una parte della striscia è ancora al suo posto');
  // i più recenti sono seguiti uno per uno: arrivano fino a oggi
  assert.ok(s.taglio && s.grandi.length <= 2000 && s.grandi.at(-1).t > 0.99 * s.eta && s.grandi[0].t >= s.taglio.t);
  // il ritmo cala piano (la striscia si apre come il logaritmo del tempo), non a precipizio come i detriti di un urto
  const A = s.attesi, nE = A.epoche.length - 1, ritmo = (z) => { let m = 0; for (let k = 0; k < CLASSI; k++) m += A.perEpoca[k * nE + z] * A.massaKg[k]; return m / (A.epoche[z + 1] - A.epoche[z]); };
  const z1 = A.epoche.findIndex((t) => t - s.formazione >= 3e8);
  tra(ritmo(z1) / ritmo(nE - 1), 1.5, 30, 'ritmo a 300 milioni di anni / ritmo di oggi');
  // un embrione che ha finito la sua striscia, e senza vicini, ha il cielo pulito
  const FINITO = { ...LENTO, storia: 'un embrione di ghiaccio rimasto solo, che ha mangiato tutta la sua striscia di disco' };
  const pulito = storiaImpatti(FINITO, { stella: { massa: 1, eta: 4.567e9, Z: 1 }, pianeti: [FINITO] }, sorgente('prova/finito'));
  assert.ok(pulito.grandi.length === 0 && pulito.bilancio.arrivataKg === 0 && improntaMantello(pulito, 64, 32).every((v) => v === 0) && crateriVisibili(pulito, { W: 64, H: 32 }).length === 0);
  console.log(`      (cibo rimasto ${(b.restiKg / MT).toFixed(1)} Terre; sul pianeta ${(100 * b.arrivataSuM).toFixed(2)}% della sua massa; ancora da aprire ${(100 * b.daRilasciareKg / b.restiKg).toFixed(0)}%)`);
});

prova('se disco.js espone il disco, il cibo rimasto viene dalla densità dei solidi (la massa di isolamento)', () => {
  const P = { id: 0, tipo: 'roccioso', aM: UA, massaKg: 0.2 * MT, raggioM: 0.6 * RT, Mstella: MSOLE, composizione: { ferro: 0.3, roccia: 0.7, acqua: 0 }, storia: '', clima: { pressione: 0, T: 280 } };
  // 100 kg/m² di solidi a 1 UA: la massa di isolamento, (4π·r²·Σ·C)^1,5·(2/(3·M*))^0,5 con C = 5 (la striscia di 10 raggi di Hill
  // reciproci di disco.js), è 0,165 Terre... ma con 240 kg/m² è 0,608 (prima, con 10 raggi di Hill del corpo solo, 0,43)
  const s = storiaImpatti(P, { stella: { massa: 1, eta: 4.567e9, Z: 1 }, pianeti: [P], disco: { vita: 2e6, sigmaSolidi: () => 240 } }, sorgente('prova/disco'));
  tra(s.bilancio.restiKg / MT, 0.355, 0.461, 'cibo rimasto (Terre: 0,608 − 0,2; la stessa forchetta relativa di prima, ±13%)'); assert.equal(s.formazione, 2e6);
  assert.ok(!s.bilancio.stime.some((x) => x.includes('disco')));
});

const partito = (P) => { const v = P.composizione?.elementi?.spazio; let s = 0; if (v) for (const x of v) s += x; return s; };
prova('sui pianeti veri del cosmo: tutto finito, tutto al suo posto, e in fretta', () => {
  let pianeti = 0, urti = 0, conGigante = 0, conLuna = 0, luneGrosse = 0, lenti = 0, puliti = 0, retrogradi = 0; const tempi = [], giorni = [];
  for (let n = 1; n < 3000; n += 53) {
    const a = indirizzoDi(n), S = sistema(a.cosmo, a.galassia, a.stella);
    for (const P of S.pianeti) {
      const caso = sorgente(`cosmo ${a.cosmo}/galassia ${a.galassia}/stella ${a.stella}/pianeta ${P.id}`);
      const t0 = performance.now(), s = storiaImpatti(P, S, caso); tempi.push(performance.now() - t0); pianeti++; urti += s.grandi.length;
      const b = s.bilancio;
      for (const v of [s.formazione, s.eta, s.quiete.t, b.arrivataKg, b.energiaJ, b.polvereKg, b.scagliataKg, b.rimastaKg, ...s.attesi.numero, ...s.attesi.cratereM, ...s.attesi.v]) assert.ok(Number.isFinite(v) && v >= 0, `${n} pianeta ${P.id}: ${v}`);
      assert.ok(s.formazione > 0 && s.formazione < s.eta && s.quiete.t >= s.formazione && s.quiete.t <= s.eta && s.grandi.length <= 2000);
      for (let k = 0; k < s.grandi.length; k++) { const x = s.grandi[k];
        for (const v of [x.t, x.massaKg, x.diametroM, x.v, x.lat, x.lon, x.angolo, x.energiaJ, x.cratereM, x.fusione]) assert.ok(Number.isFinite(v), `${n} pianeta ${P.id} impatto ${x.id}`);
        assert.ok(x.t >= s.formazione && x.t <= s.eta && Math.abs(x.lat) <= 90 && Math.abs(x.lon) <= 180 && x.v * x.v >= (2 * 6.674e-11 * P.massaKg) / P.raggioM && (k === 0 || x.t >= s.grandi[k - 1].t));
        assert.ok(P.tipo === 'gassoso' ? x.cratereM === 0 : x.cratereM <= Math.PI * P.raggioM * 1.0001); }
      // la massa della nube del pianeta si conserva
      const mia = b.detritiKg + b.restiKg;
      if (mia > 0) assert.ok(Math.abs((b.sulPianetaKg + b.aiViciniKg + b.scagliataKg + b.polvereKg + b.rimastaKg + b.daRilasciareKg) / mia - 1) < 1e-6, `${n} pianeta ${P.id}: bilancio`);
      if (s.gigante) { conGigante++; const g = s.gigante; if (g.luna) conLuna++; if (g.luna?.mu > 1e-3) luneGrosse++; if (g.obliquita > 90) retrogradi++; giorni.push(g.giornoDopo / 3600);
        assert.ok(/urt[oi] gigant/.test(P.storia) && g.t === s.formazione && g.urti >= 1 && g.massaKg <= g.bersaglioKg * 1.0001 && (g.massaKg + g.bersaglioKg) / (P.massaKg + partito(P)) < 1 + 1e-9); // (i due corpi dell'urto pesavano quanto il pianeta più ciò che è partito durante l'accrescimento: elementi.js perditeAccrescimento)
        assert.ok(g.giornoDopo > 3000 && g.obliquita >= 0 && g.obliquita <= 180 && g.detritiKg >= 0 && g.detritiKg < 0.1 * P.massaKg && g.lunaKg < 0.2 * P.massaKg && JSON.stringify(giganteDi(P, S, caso)) === JSON.stringify(g) && g.frazioneFusa > 0 && g.frazioneFusa <= 1, `${n} pianeta ${P.id}: ${JSON.stringify(g)}`);
      } else assert.ok(!/urt[oi] gigant/.test(P.storia) || P.tipo === 'gassoso');
      if (b.restiKg > 0) { lenti++; assert.ok(P.formazione || /cresciuto piano/.test(P.storia)); }
      if (!s.grandi.length) puliti++;
      if (pianeti % 6) continue; // (le due letture, su un pianeta ogni sei: sono più lente della storia)
      const m = improntaMantello(s, 64, 32), v = crateriVisibili(s, { W: 64, H: 32 });
      assert.ok(m.every(Number.isFinite) && v.length <= s.grandi.length && Math.abs(somma(m) / m.length) < 1);
    }
  }
  tempi.sort((x, y) => x - y); const mediana = tempi[tempi.length >> 1], novanta = tempi[Math.floor(0.95 * tempi.length)];
  assert.ok(pianeti > 100 && urti > 1e4 && conGigante > 30 && conLuna > 10 && lenti > 10, `${pianeti} pianeti, ${urti} urti, ${conGigante} con urto gigante, ${conLuna} con luna, ${lenti} lenti`);
  assert.ok(mediana < 50 && novanta < 50, `storiaImpatti: mediana ${mediana} ms, 95 su 100 sotto ${novanta} ms`);
  console.log(`      (${pianeti} pianeti, ${urti} grandi urti; ${conGigante} con un urto gigante: ${conLuna} con un disco che fa una luna, ${luneGrosse} più pesante di un millesimo del pianeta; giorno dopo l'urto ${giorni.sort((x, y) => x - y)[giorni.length >> 1].toFixed(1)} ore (mediana), ${retrogradi} girano al contrario; ${lenti} embrioni lenti ancora bersagliati; ${puliti} col cielo pulito; storiaImpatti: mediana ${mediana.toFixed(1)} ms, 95 su 100 sotto ${novanta.toFixed(1)} ms, la più lenta ${tempi.at(-1).toFixed(0)} ms)`);
});

prova('con i numeri veri della formazione (formaPianeti: urti, masse, tempi) niente è più stimato; e la catena arriva fino alle lune e al mantello', () => {
  // la legge di Chambers è quella di disco.js, non una copia
  assert.equal(giriChambers, giriCheRegge); assert.equal(deltaChambers, raggiNecessari);
  // i pianeti di sistema() con la loro «formazione» (finché cosmo.js non la copia da sé, la si riprende da formaPianeti con lo stesso seme)
  const veri = (a) => { const S = sistema(a.cosmo, a.galassia, a.stella); if (S.pianeti.every((P) => P.formazione)) return S;
    const seme = casoDisco(a.cosmo, a.galassia, a.stella); // (la sorgente degli eventi del disco: la stessa che usa cosmo.js)
    for (const eta of [S.stella.eta, (S.stella.eta ?? 5e9) + (S.stella.morta ?? 0)]) { // (l'età con cui cosmo.js chiama formaPianeti)
      const st = { massa: S.stella.massaNascita || S.stella.massa, Z: S.stella.Z ?? 1, eta }, nati = formaPianeti(st, seme), F = S.pianeti.map((P) => nati.find((q) => q.massaKg === P.massaKg && q.raggioM === P.raggioM)?.formazione);
      if (F.every(Boolean)) return { stella: { ...S.stella, eta }, disco: disco(st, seme), pianeti: S.pianeti.map((P, k) => ({ ...P, formazione: F[k] })) }; }
    throw new Error('i pianeti di sistema() non sono quelli di formaPianeti'); };
  // la catena fino al mantello: l'impronta degli urti di un pianeta è lo stato da cui parte la sua tettonica
  const catenaDi = (P, s, eta) => { const r = evolviTettonica({ W: 64, H: 32, raggioM: P.raggioM, nucleo: P.interno.nucleo, q: Math.max(P.interno.q, 0.06), eta, placche: true, seme: 1, impronta: (W, H) => improntaMantello(s, W, H) }); assert.ok(r.storia.impronta === 'urti' && r.alt.every(Number.isFinite) && somma(r.cont) > 0); };
  let pianeti = 0, giganti = 0, dischi = 0, lunePrese = 0, tardi = 0, lenti = 0, retro = 0, catena = 0; const giorni = [], rapporti = [], quando = [], tempi = [], visti = new Set();
  for (let n = 1; n < 3000; n += 53) {
    const a = indirizzoDi(n), chiave = `${a.cosmo}/${a.galassia}/${a.stella}`; if (visti.has(chiave)) continue; visti.add(chiave);
    const S = veri(a), eta = S.stella.eta;
    for (const P of S.pianeti) {
      const F = P.formazione, caso = sorgente(`cosmo ${a.cosmo}/galassia ${a.galassia}/stella ${a.stella}/pianeta ${P.id}`), t0 = performance.now(), s = storiaImpatti(P, S, caso), g = s.gigante; tempi.push(performance.now() - t0); pianeti++;
      assert.ok(Array.isArray(F.urti) && F.cibo >= 0 && F.tGas > 0 && F.mIso > 0 && F.urti.every((u, k) => u.bersaglioKg >= u.massaKg && u.delta >= 0 && u.tIncrocio >= F.tGas && u.tIncrocio <= eta && (k === 0 || u.tIncrocio >= F.urti[k - 1].tIncrocio)), `formazione di ${n}/${P.id}`);
      assert.ok(!s.bilancio.stime.length, `niente stime: ${s.bilancio.stime}`);
      assert.equal(JSON.stringify(giganteDi(P, S, caso)), JSON.stringify(g));
      for (const v of [s.formazione, s.bilancio.arrivataKg, s.quiete.t, ...s.grandi.flatMap((x) => [x.t, x.cratereM, x.energiaJ])]) assert.ok(Number.isFinite(v));
      if (s.bilancio.restiKg > 0) { lenti++; assert.equal(s.bilancio.restiKg, F.cibo); }
      if (P.tipo === 'gassoso' || !F.urti.length) { assert.equal(g, null); assert.equal(s.formazione, Math.min(0.999 * eta, F.tGas)); continue; }
      // l'urto gigante della storia è proprio l'ultimo di formaPianeti: stesse masse, e avviene poco dopo che le orbite si sono incrociate
      const u = F.urti.at(-1); giganti++;
      assert.ok(!u.laterale && g.bersaglioKg === u.bersaglioKg && g.massaKg === u.massaKg && g.urti === F.urti.length && g.t === s.formazione && g.t >= Math.min(u.tIncrocio, 0.9999 * eta) && g.t <= eta, `urto di ${n}/${P.id}`);
      // (il tempo per trovarsi dopo l'incrocio lo dà disco.js: l'urto è quando il modello a eventi lo fa avvenire)
      assert.ok(u.t >= u.tIncrocio && u.t <= eta && g.t === Math.min(0.9999 * eta, u.t), `l'urto di ${n}/${P.id}: ${g.t} contro ${u.t}`);
      rapporti.push(g.massaKg / g.bersaglioKg); quando.push((g.t - F.tGas) / eta); giorni.push(g.giornoDopo / 3600); if (g.t > 1e9) tardi++; if (g.obliquita > 90) retro++; if (g.luna) dischi++;
      // le lune: con l'urto vero, la luna da urto c'è solo se l'urto l'ha fatta, e pesa quanto dice l'urto
      if (P.tipo !== 'roccioso') continue;
      const L = lune(P, { eta, Z: S.stella.Z ?? 1, urto: g }, 1).filter((l) => l.origine === 'urto');
      assert.ok(L.length <= (g.luna ? 1 : 0)); if (!L.length) continue; lunePrese++;
      assert.ok(L[0].massaKg === g.luna.massaKg && L[0].giornoInizialePianeta >= g.giornoDopo * 0.999 && L[0].giornoPianeta >= L[0].giornoInizialePianeta && L[0].periodo >= L[0].giornoPianeta * 0.999);
      // e il mantello: l'impronta degli urti è lo stato da cui parte la tettonica (una volta ogni tanto: costa)
      if (catena < 2 && s.grandi.length > 100) { catena++; catenaDi(P, s, eta); }
    }
  }
  const q = (v, f) => [...v].sort((x, y) => x - y)[Math.floor(f * v.length)];
  // (la catena va provata almeno una volta: se tra questi pianeti nessuno roccioso ha avuto più di cento grandi urti, se ne cerca uno più in là)
  for (let n = 3000; catena < 1 && n < 60000; n += 53) { const a = indirizzoDi(n), S = veri(a); for (const P of S.pianeti) { if (catena || P.tipo !== 'roccioso') continue; const s = storiaImpatti(P, S, sorgente(`cosmo ${a.cosmo}/galassia ${a.galassia}/stella ${a.stella}/pianeta ${P.id}`)); if (s.grandi.length > 100 && s.gigante) { catena++; catenaDi(P, s, S.stella.eta); } } }
  assert.ok(pianeti > 80 && giganti > 40 && lenti > 10 && catena >= 1, `${pianeti} pianeti, ${giganti} con urto gigante, ${lenti} lenti, ${catena} catene`);
  // gli ultimi urti giganti cadono presto: metà entro il primo ventesimo della vita del sistema, tre quarti entro il primo quinto
  // (in anni dipende da quanto sono vecchie le stelle del campione: tra stelle di dieci miliardi di anni, uno su quattro cade dopo il primo)
  tra(q(quando, 0.5), 0, 0.05, 'a che punto della vita cade l\'ultimo urto gigante (mediana)'); tra(q(quando, 0.75), 0, 0.2, 'e i tre quarti');
  tra(q(rapporti, 0.5), 0.3, 1, 'rapporto di massa tra i due corpi dell\'ultimo urto (mediana: gli embrioni di disco.js sono quasi pari)');
  tra(q(giorni, 0.5), 1.5, 12, 'giorno dopo l\'urto (ore, mediana)'); tra(retro / giganti, 0.25, 0.75, 'pianeti che girano al contrario (gli urti arrivano da ogni parte: metà)');
  assert.ok(q(tempi, 0.5) < 50 && q(tempi, 0.95) < 50);
  console.log(`      (${pianeti} pianeti: ${giganti} con un urto gigante; l'ultimo cade a ${(100 * q(quando, 0.5)).toFixed(1)}% della vita (mediana), ${tardi} dopo il primo miliardo di anni; rapporto di massa ${q(rapporti, 0.5).toFixed(2)}; giorno dopo l'urto ${q(giorni, 0.5).toFixed(1)} ore, ${retro} al contrario; ${dischi} lasciano un disco che fa una luna, ${lunePrese} lune restano dopo le maree; ${lenti} con cibo ancora in giro)`);
});

prova('il bombardamento tardo: una fascia di sassi orfani accanto a un gigante tiene vivo il cielo per miliardi di anni; senza giganti no', () => {
  // il Sistema Solare con ciò che NON si sa per certo, messo come dato: nella fascia degli asteroidi c'era un embrione
  // (un quinto della Terra, a 2,4 UA) che Giove ha scacciato tre milioni di anni dopo la nascita del Sole
  const GIOVE2 = { ...GIOVE, eccentricita: 0.048, formazione: { urti: [], tGas: 3e6, orfani: [{ aUA: 2.4, massaKg: 0.2 * MT, ciboKg: 0, ghiaccio: 0, t: 3e6, dentro: true }] } };
  const sis = { ...SOLARE, pianeti: [MERCURIO, VENERE, TERRA, MARTE, GIOVE2] }, caso = sorgente(RADICE), s = storiaImpatti(TERRA, sis, caso), sl = storiaImpatti(TERRA, sis, caso, { luna: LUNA });
  assert.equal(s.bilancio.fasce.length, 1); const f = s.bilancio.fasce[0]; assert.ok(s.bilancio.nubi.includes('fascia 4.0') && f.oggiKg > 0 && f.oggiKg < f.inizioKg);
  // il flusso di oggi sulla Terra: quanti corpi oltre 1 km e oltre 10 km
  const A = s.attesi, nE = A.epoche.length - 1, ogni = (D) => { let n = 0; for (let k = 0; k <= classeDi(D); k++) n += A.perEpoca[k * nE + nE - 1]; return (A.epoche[nE] - A.epoche[nE - 1]) / n; };
  tra(ogni(1000) / 1e6, 0.1, 5, 'oggi sulla Terra un corpo oltre 1 km ogni (milioni di anni: 0,5)'); tra(ogni(1e4) / 1e6, 20, 500, 'un corpo oltre 10 km ogni (milioni di anni: 100)');
  // la Luna: i crateri oltre i 20 km su superfici di 4,0 e di 3,5 miliardi di anni (dai conteggi veri: 1000–2600 e circa 200)
  const n40 = contaCrateri(sl, { superficie: 4.0e9 }), n35 = contaCrateri(sl, { superficie: 3.5e9 }), n10 = contaCrateri(sl, { superficie: 1e9 });
  tra(n40, 330, 7800, 'crateri lunari > 20 km su 4,0 miliardi di anni'); tra(n35, 65, 600, 'su 3,5 miliardi di anni'); assert.ok(n10 > 0 && n10 < n35);
  // i corpi della fascia arrivano veloci: l'orbita, pompata dal gigante, incrocia quella del pianeta di traverso
  const tardi = s.grandi.filter((x) => x.t > 1e9), v = tardi.reduce((a, x) => a + x.v, 0) / tardi.length;
  assert.ok(tardi.length > 3 && tardi.every((x) => x.da === 'fascia 4.0')); tra(v / 1e3, 14, 30, 'velocità degli urti tardi sulla Terra (km/s: circa 20)');
  // SENZA GIGANTI nessuno scaccia nessuno: niente fasce; dopo il primo miliardo di anni non cade più niente
  const senza = { ...SOLARE, pianeti: [MERCURIO, VENERE, TERRA, MARTE] }, quieto = storiaImpatti(TERRA, senza, caso, { luna: LUNA });
  assert.ok(quieto.bilancio.fasce.length === 0 && contaCrateri(quieto, { superficie: 3.5e9 }) < 1 && quieto.grandi.filter((x) => x.t > 2e9).length === 0);
  // LE COMETE: i sassi di ghiaccio di un embrione lontano arrivano dentro solo se un gigante li palleggia; e quelli
  // piccoli evaporano al Sole prima di colpire (senza gigante, sull'orbita che li porterebbe dentro, evaporano tutti)
  const LENTO = { id: 5, tipo: 'ghiacciato', aM: 8 * UA, massaKg: 0.5 * MT, raggioM: RT, Mstella: MSOLE, anno: anno(8), composizione: { ghiaccio: 0.75, roccia: 0.2, ferro: 0.05 }, storia: 'un embrione di ghiaccio rimasto solo, cresciuto piano: il suo cibo è ancora in giro', clima: { pressione: 0, T: 60 } };
  const nudo = pianeta(0, 1, 1, 1), conGigante = storiaImpatti(nudo, { ...SOLARE, pianeti: [nudo, { ...GIOVE, eccentricita: 0.048 }, LENTO] }, sorgente('prova/comete')), senzaGigante = storiaImpatti(nudo, { ...SOLARE, pianeti: [nudo, LENTO] }, sorgente('prova/comete'));
  assert.ok(conGigante.bilancio.nubi.includes(5) && conGigante.bilancio.arrivataKg > 100 * senzaGigante.bilancio.arrivataKg, `comete: ${conGigante.bilancio.arrivataKg} kg con il gigante, ${senzaGigante.bilancio.arrivataKg} senza`);
  const comete = conGigante.grandi.filter((x) => x.t > 1e9); tra(comete.reduce((a, x) => a + x.v, 0) / comete.length / 1e3, 22, 60, 'velocità delle comete sulla Terra (km/s: 30–50)');
  const pic = conGigante.attesi, gra = (D) => pic.numero[classeDi(D)] * pic.massaKg[classeDi(D)]; assert.ok(gra(1e5) > 0 && gra(100) < 1e-3 * gra(1e5), 'le comete piccole evaporano');
  console.log(`      (Terra oggi: un corpo > 1 km ogni ${(ogni(1000) / 1e6).toFixed(1)} milioni di anni [0,5], > 10 km ogni ${(ogni(1e4) / 1e6).toFixed(0)} [100]; Luna, crateri > 20 km: ${Math.round(n40)} su 4,0 miliardi di anni [1000–2600], ${Math.round(n35)} su 3,5 [200], ${Math.round(n10)} su 1 [50]; urti tardi a ${(v / 1e3).toFixed(1)} km/s [20]; la fascia oggi pesa ${(f.oggiKg / 2.4e21).toFixed(2)} fasce vere; vernice ${(100 * s.bilancio.arrivataSuM).toFixed(2)}% [0,5])`);
});

console.log(`\n${ok} prove superate`);
