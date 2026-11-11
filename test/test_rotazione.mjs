// test_rotazione.mjs — il giorno e l'asse dei pianeti come conseguenza: i numeri veri del Sistema Solare, e i pianeti del cosmo
import assert from 'node:assert/strict';
import { rotazione, giroDaGas, giornoDiRottura, frenataMareale, equilibrioMareale, gasDi, ROTAZIONE } from '../src/camera/rotazione.js';
import { giganteDi, urtoGigante, IMPATTI } from '../src/camera/impatti.js';
import { lune, tempoBlocco } from '../src/camera/lune.js';
import { sorgente } from '../src/camera/eventi.js';
import { MSOLE, UA, ANNO } from '../src/camera/leggi.js';
import { indirizzoDi, sistema } from '../src/camera/cosmo.js';

let ok = 0;
const prova = (nome, f) => { f(); ok++; console.log('  ✓', nome); };
const tra = (x, a, b, che) => assert.ok(x > a && x < b, `${che}: ${x} (atteso tra ${a} e ${b})`);
const ore = (s) => s / 3600, q = (v, f) => [...v].sort((x, y) => x - y)[Math.min(v.length - 1, Math.floor(f * v.length))];

// ---------- i corpi veri (raggio medio; della formazione si sa solo l'urto che ha fatto la Luna)
const MT = 5.972e24, RT = 6.371e6, SOLE = { massa: 1, eta: 4.567e9, Z: 1 }, S = { stella: SOLE };
const corpo = (nome, tipo, aUA, m, r, altro = {}) => ({ nome, tipo, aM: aUA * UA, massaKg: m * MT, raggioM: r * RT, Mstella: MSOLE,
  composizione: tipo === 'roccioso' ? { ferro: 0.32, roccia: 0.68, acqua: 0 } : tipo === 'gassoso' ? { idrogeno: 0.71, elio: 0.25, pesanti: 0.04 } : { ghiaccio: 0.65, roccia: 0.3, ferro: 0.05 }, ...altro });
const MERCURIO = corpo('Mercurio', 'roccioso', 0.387, 0.0553, 0.383, { eccentricita: 0.2056 }), VENERE = corpo('Venere', 'roccioso', 0.723, 0.815, 0.95, { eccentricita: 0.0068 });
const TERRA = corpo('Terra', 'roccioso', 1, 1, 1, { eccentricita: 0.0167, clima: { acqua: 'liquida' }, formazione: { urti: [{ bersaglioKg: 0.9 * MT, massaKg: 0.1 * MT, angolo: 45, inclinazione: 23.4, t: 6e7 }] } });
const MARTE = corpo('Marte', 'roccioso', 1.524, 0.107, 0.532, { eccentricita: 0.093 });
const GIOVE = corpo('Giove', 'gassoso', 5.2, 317.8, 10.97), SATURNO = corpo('Saturno', 'gassoso', 9.58, 95.2, 9.14, { composizione: { idrogeno: 0.62, elio: 0.2, pesanti: 0.18 } });
const URANO = corpo('Urano', 'ghiacciato', 19.2, 14.54, 3.98, { involucro: 0.12 }), NETTUNO = corpo('Nettuno', 'ghiacciato', 30.07, 17.15, 3.865, { involucro: 0.1 });
const giro = (P, altro = {}) => rotazione(P, S, sorgente(`prova/${P.nome}`), { urto: null, ...altro });

prova('i giganti: il gas cade attraverso un disco e il campo magnetico li frena: Giove 9,9 ore (la taratura), Saturno 10,7', () => {
  const g = giro(GIOVE), s = giro(SATURNO);
  tra(ore(giornoDiRottura(GIOVE)), 2.7, 3.1, 'il periodo di rottura di Giove (ore)');
  tra(ore(g.giorno), 9.3, 10.5, 'il giorno di Giove (ore: 9,93)'); tra(ore(s.giorno), 8.5, 14.5, 'il giorno di Saturno (ore: 10,66)');
  tra(g.suRottura, 0.28, 0.32, 'Giove gira a questa frazione della rottura (0,30)'); tra(s.suRottura, 0.28, 0.42, 'Saturno (0,39)');
  assert.ok(g.origine === 'gas' && !g.bloccato && !g.retrogrado && g.obliquita < 1 && s.obliquita < 1, 'asse dritto: il gas arriva nel piano dell\'orbita (Giove 3°)');
  // la legge: meno gas, giro più lento (potenza 1/7); meno densità, un poco più svelto (potenza −1/14)
  assert.ok(Math.abs(giroDaGas({ ...GIOVE, composizione: { idrogeno: 0.45, elio: 0.15, pesanti: 0.4 } }) / giroDaGas(GIOVE) - Math.pow(0.6 / 0.96, 1 / 7)) < 1e-9);
  assert.ok(Math.abs(giroDaGas({ ...GIOVE, raggioM: GIOVE.raggioM * 2 }) / giroDaGas(GIOVE) - Math.pow(1 / 8, -1 / 14)) < 1e-9);
  console.log(`      (Giove ${ore(g.giorno).toFixed(1)} ore, Saturno ${ore(s.giorno).toFixed(1)} [10,7]: al ${(100 * g.suRottura).toFixed(0)}% e al ${(100 * s.suRottura).toFixed(0)}% della rottura)`);
});

prova('i giganti di ghiaccio: poco gas, giro più lento: Urano 17 ore e Nettuno 16 (entro una volta e mezza)', () => {
  const u = giro(URANO), n = giro(NETTUNO);
  assert.equal(u.origine, 'gas'); tra(gasDi(URANO), 0.1, 0.15, 'la parte di gas di Urano');
  tra(ore(u.giorno), 11.5, 26, 'il giorno di Urano (ore: 17,2)'); tra(ore(n.giorno), 10.7, 24, 'il giorno di Nettuno (ore: 16,1)');
  assert.ok(u.suRottura < giro(GIOVE).suRottura && n.suRottura < giro(GIOVE).suRottura, 'girano più lontano dalla rottura di Giove (0,17 e 0,16 contro 0,30)');
  console.log(`      (Urano ${ore(u.giorno).toFixed(1)} ore [17,2], Nettuno ${ore(n.giorno).toFixed(1)} [16,1]: al ${(100 * u.suRottura).toFixed(0)}% e al ${(100 * n.suRottura).toFixed(0)}% della rottura [17% e 16%]; l'asse resta dritto [Urano è coricato: manca un urto])`);
});

prova('Marte, un embrione senza urti giganti: gira come l\'ha lasciato la crescita, e il Sole non lo frena (24,6 ore)', () => {
  const m = giro(MARTE);
  assert.equal(m.origine, 'embrione'); tra(ore(m.giorno), 10, 40, 'il giorno di Marte (ore: 24,6)');
  assert.ok(m.tempoFreno > 100 * SOLE.eta && Math.abs(m.giorno / m.giornoNascita - 1) < 0.01 && !m.bloccato && !m.retrogrado);
  tra(m.obliquita, 0, 20, 'l\'asse, inclinato solo dai sassi arrivati a caso (gradi; Marte: 25, ma oscilla per le risonanze)');
  console.log(`      (Marte ${ore(m.giorno).toFixed(1)} ore [24,6], asse ${m.obliquita.toFixed(1)}° [25°])`);
});

prova('Mercurio e Venere: il Sole li frena; Mercurio, su un\'orbita allungata, resta agganciato a tre giri ogni due anni', () => {
  const m = giro(MERCURIO), v = giro(VENERE), anno = (P) => 2 * Math.PI * Math.sqrt(P.aM ** 3 / (6.674e-11 * MSOLE));
  tra(equilibrioMareale(0.2056), 1.2, 1.3, 'la rotazione di equilibrio di Mercurio (giri per orbita: 1,26)'); assert.equal(equilibrioMareale(0), 1);
  assert.ok(m.tempoFreno < SOLE.eta && m.risonanza === '3:2' && !m.bloccato && m.obliquita === 0, `Mercurio: ${JSON.stringify(m)}`);
  tra(m.giorno / 86400, 58.4, 58.9, 'il giorno di Mercurio (giorni terrestri: 58,65)'); assert.ok(Math.abs(m.giorno / anno(MERCURIO) - 2 / 3) < 1e-9);
  // su un'orbita tonda si sarebbe bloccato; più lontano no
  const tondo = giro({ ...MERCURIO, eccentricita: 0.01 }); assert.ok(tondo.bloccato && tondo.risonanza === null && Math.abs(tondo.giorno / anno(MERCURIO) - 1) < 1e-9);
  assert.ok(!giro({ ...MERCURIO, aM: UA }).bloccato && giro({ ...MERCURIO, eccentricita: 0.42 }).risonanza === '2:1');
  // Venere: la frenata del Sole conta (la ferma in un tempo paragonabile all'età), ma da sola non basta
  tra(v.tempoFreno / SOLE.eta, 0.3, 5, 'tempo che serve al Sole per fermare Venere / età'); assert.ok(v.giorno > 1.3 * v.giornoNascita && v.obliquita < 3);
  // la frenata è la legge di lune.js (tempoBlocco), solo integrata: stesso tempo, se si parte dallo stesso giorno
  const t = tempoBlocco({ massaKg: MSOLE }, VENERE, v.giornoNascita) / ANNO; assert.ok(Math.abs((v.tempoFreno / t) / (1 - v.giornoNascita / anno(VENERE)) - 1) < 1e-3, `${v.tempoFreno} contro ${t}`);
  assert.ok(Math.abs(frenataMareale({ ...VENERE, aM: 2 * VENERE.aM }) / frenataMareale(VENERE) - 1 / 64) < 1e-9, 'la frenata cala come la distanza alla sesta');
  console.log(`      (Mercurio ${(m.giorno / 86400).toFixed(2)} giorni [58,65], fermato in ${(m.tempoFreno / 1e9).toFixed(1)} miliardi di anni; Venere ${ore(v.giorno).toFixed(1)} ore [243 giorni al contrario: manca la marea termica della sua aria], il Sole la fermerebbe in ${(v.tempoFreno / 1e9).toFixed(1)} miliardi di anni)`);
});

prova('la Terra: l\'urto la lascia a 4–5 ore, la Luna la frena; con la Luna vera il giorno è di 24 ore', () => {
  const c = sorgente('prova/Terra'), urto = giganteDi(TERRA, S, c), nuda = rotazione(TERRA, S, c, { urto });
  assert.equal(nuda.origine, 'urti'); tra(ore(urto.giornoDopo), 3, 8, 'il giorno dopo l\'urto (ore: si stima 5)'); tra(urto.obliquita, 5, 40, 'l\'asse dopo l\'urto (gradi: 23)');
  tra(urto.giroSuRottura, 0.1, IMPATTI.giroLimite + 1e-9, 'giro dopo l\'urto / rottura'); assert.ok(Math.abs(nuda.giornoNascita - urto.giornoDopo) < 1e-6 * urto.giornoDopo);
  tra(ore(nuda.giorno), 3, 8.5, 'senza la Luna oggi girerebbe ancora così (il Sole da solo la frena pochissimo)');
  // la luna che il modello fa (più leggera della vera) e la Luna vera
  const con = (massa) => { const u = { ...urto, luna: { massaKg: massa } }, L = lune({ ...TERRA, giorno: nuda.giorno, bloccato: nuda.bloccato }, { ...SOLE, urto: u }, 1).find((l) => l.origine === 'urto'); return rotazione(TERRA, S, c, { urto: u, luna: L }); };
  const modello = con(urto.luna.massaKg), vera = con(7.35e22);
  assert.ok(modello.giorno > nuda.giorno * 1.3 && vera.giorno > modello.giorno);
  tra(ore(vera.giorno), 16, 40, 'il giorno della Terra con la Luna vera (ore: 24)'); tra(vera.obliquita, 5, 40, 'l\'asse oggi (gradi: 23,4)');
  console.log(`      (dopo l'urto ${ore(urto.giornoDopo).toFixed(1)} ore, asse ${urto.obliquita.toFixed(0)}°; oggi: ${ore(nuda.giorno).toFixed(1)} ore senza luna, ${ore(modello.giorno).toFixed(1)} con la luna del modello [${(urto.luna.massaKg / 7.35e22).toFixed(2)} lune], ${ore(vera.giorno).toFixed(1)} con la Luna vera [24])`);
});

prova('gli urti giganti: il limite dei fluidi che ruotano, il mordi e fuggi, il momento angolare che se ne va', () => {
  const u = urtoGigante({ bersaglioKg: 0.5 * MT, massaKg: 0.5 * MT, angolo: 30 });
  assert.ok(!u.mordiEFuggi && u.momentoPianeta < u.momentoAngolare && u.momentoDetriti > 0 && u.momentoPianeta > 0);
  tra(u.vCritica / u.vFuga, 1.04, 1.3, 'velocità critica del mordi e fuggi per due corpi uguali di striscio (in velocità di fuga)');
  // più veloce della critica e di striscio: non si fondono; a picco sì, anche veloci
  assert.ok(urtoGigante({ bersaglioKg: 0.5 * MT, massaKg: 0.5 * MT, angolo: 30, v: 1.5 * u.vFuga }).mordiEFuggi && !urtoGigante({ bersaglioKg: 0.5 * MT, massaKg: 0.5 * MT, angolo: 85, v: 1.5 * u.vFuga }).mordiEFuggi);
  // due mezze Terre di striscio portano più momento angolare di quanto un corpo fuso possa tenere (0,53 della rottura):
  // una parte se ne va col disco e coi detriti, e ciò che resta non supera mai il limite
  const P = corpo('doppio', 'roccioso', 1, 1, 1, { formazione: { urti: [{ bersaglioKg: 0.5 * MT, massaKg: 0.5 * MT, angolo: 20, inclinazione: 0, t: 1e7 }] } }), g = giganteDi(P, S, sorgente('prova/doppio'));
  const critico = 0.33 * P.massaKg * Math.sqrt(6.674e-11 * P.massaKg * P.raggioM);
  assert.ok(g.momentoAngolare > IMPATTI.giroLimite * critico && g.giroSuRottura <= IMPATTI.giroLimite + 1e-9 && g.giroSuRottura > 0.3 && Math.abs(g.giornoDopo * g.giroSuRottura / giornoDiRottura(P) - 1) < 1e-9, `giro ${g.giroSuRottura}`);
  // gli urti minori della storia cambiano poco un pianeta che gira forte, molto uno fermo
  const finta = { grandi: [{ id: 0, massaKg: 1e21, vSuolo: 15000, angolo: 30 }] }, c = sorgente('prova/urti minori');
  const lento = corpo('lento', 'roccioso', 1, 1, 1), a = rotazione(lento, S, c, { urto: null }), b = rotazione(lento, S, c, { urto: null, storia: finta });
  assert.ok(a.giornoNascita !== b.giornoNascita && Math.abs(b.giornoNascita / a.giornoNascita - 1) < 0.2);
});

prova('sui pianeti veri del cosmo: nessuno oltre il limite, i vicini alla stella frenati o bloccati; la distribuzione dei giorni', () => {
  const per = { gas: [], urti: [], embrione: [] }, visti = new Set(); let n = 0, bloccati = 0, risonanti = 0, contro = 0, collegati = 0, gassosiBloccati = 0; const assi = [], frazioni = [];
  // (si guarda finché ogni specie di pianeta è rappresentata abbastanza da contare — quanti sistemi servano dipende da che
  // stelle ha la galassia: i giganti di gas sono rari attorno alle stelle povere di metalli —, e comunque almeno 110 numeri)
  const bastano = () => n > 150 && per.gas.length > 10 && per.urti.length > 30 && per.embrione.length > 10 && bloccati > 10;
  for (let k = 1; k < 60000 && (k < 6000 || !bastano()); k += 53) {
    const a = indirizzoDi(k), chiave = `${a.cosmo}/${a.galassia}/${a.stella}`; if (visti.has(chiave)) continue; visti.add(chiave);
    const Sis = sistema(a.cosmo, a.galassia, a.stella);
    for (const P of Sis.pianeti) {
      const c = sorgente(`cosmo ${a.cosmo}/galassia ${a.galassia}/stella ${a.stella}/pianeta ${P.id}`), urto = P.tipo === 'gassoso' ? null : giganteDi(P, Sis, c), luna = (P.lune || []).find((l) => l.origine === 'urto' && l.giornoPianeta);
      const r = rotazione(P, Sis, c, { urto, luna }); n++;
      for (const v of [r.giorno, r.obliquita, r.giornoNascita, r.suRottura, r.frenata]) assert.ok(Number.isFinite(v) && v >= 0, `${k}/${P.id}: ${JSON.stringify(r)}`);
      assert.ok(r.suRottura <= IMPATTI.giroLimite + 1e-9 && r.giorno >= r.giornoRottura / IMPATTI.giroLimite * (1 - 1e-9), `oltre il limite: ${JSON.stringify(r)}`);
      assert.ok(r.obliquita >= 0 && r.obliquita <= 90 && (!r.bloccato || (r.obliquita === 0 && r.giorno === P.anno)));
      assert.ok(luna || r.bloccato || r.risonanza || r.giorno >= r.giornoNascita * (1 - 1e-9) || r.retrogrado !== (r.obliquitaNascita > 90), 'la stella frena, non accelera, chi gira più in fretta dell\'orbita');
      per[r.origine].push(ore(r.giorno)); frazioni.push(r.suRottura); if (!r.bloccato) assi.push(r.obliquita);
      if (r.bloccato) { bloccati++; if (P.tipo === 'gassoso') gassosiBloccati++; } if (r.risonanza) risonanti++; if (r.retrogrado) contro++;
      // se cosmo.js è collegato, il giorno del pianeta è questo
      if (P.giro) { collegati++; assert.ok(Math.abs(P.giorno / r.giorno - 1) < 1e-9 && P.bloccato === r.bloccato && Math.abs(P.obliquita - r.obliquita) < 1e-9, `${k}/${P.id}: cosmo ${P.giorno} ${P.bloccato}, qui ${r.giorno} ${r.bloccato}`); }
    }
  }
  assert.ok(n > 150 && per.gas.length > 10 && per.urti.length > 30 && per.embrione.length > 10 && bloccati > 10 && bloccati < n - 30, `${n} pianeti, ${bloccati} bloccati`);
  // Kokubo e Genda 2010: dopo gli urti giganti i pianeti girano a una frazione grande della rottura, ma sotto
  const dopoUrti = []; for (let k = 1; k < 6000; k += 53) { const a = indirizzoDi(k), Sis = sistema(a.cosmo, a.galassia, a.stella); for (const P of Sis.pianeti) { if (P.tipo === 'gassoso') continue; const g = giganteDi(P, Sis, sorgente(`cosmo ${a.cosmo}/galassia ${a.galassia}/stella ${a.stella}/pianeta ${P.id}`)); if (g) dopoUrti.push(g.giroSuRottura); } }
  tra(q(dopoUrti, 0.5), 0.2, IMPATTI.giroLimite, 'giro dopo l\'ultimo urto gigante / rottura (mediana)');
  const riga = (v) => v.length ? `${q(v, 0.05).toFixed(1)} · ${q(v, 0.25).toFixed(1)} · ${q(v, 0.5).toFixed(1)} · ${q(v, 0.75).toFixed(1)} · ${q(v, 0.95).toFixed(0)}` : '—';
  console.log(`      (${n} pianeti${collegati ? `, ${collegati} già collegati in cosmo.js` : ''}; ${bloccati} bloccati dalla stella [${gassosiBloccati} di gas], ${risonanti} in risonanza, ${contro} al contrario)`);
  console.log(`      giorno di oggi in ore (5% · 25% · mediana · 75% · 95%): dal gas ${riga(per.gas)}  |  dagli urti ${riga(per.urti)}  |  embrioni soli ${riga(per.embrione)}`);
  console.log(`      giro dopo l'ultimo urto gigante / rottura: ${riga(dopoUrti.map((x) => 100 * x)).replace(/\\.0/g, '')} %  [limite ${100 * IMPATTI.giroLimite}%];  asse dei non bloccati (gradi): ${riga(assi)}`);
});

console.log(`\nrotazione: ${ok} prove, tutto ok`);
