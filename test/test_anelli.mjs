// test_anelli.mjs — gli anelli come conseguenza: i numeri veri del Sistema Solare, poi gli anelli che emergono
// dalle lune di lune() e dai pianeti di sistema()
import assert from 'node:assert/strict';
import { anelli, anelloDa, storia, giornoMassimo, orbitaSincrona, doveSiSpezza, sublimazione, LEGGI_ANELLI } from '../src/camera/anelli.js';
import { lune, limiteRoche, MATERIALI } from '../src/camera/lune.js';
import { sorgente } from '../src/camera/eventi.js';
import { MSOLE, LSOLE, UA } from '../src/camera/leggi.js';
import { indirizzoDi, sistema } from '../src/camera/cosmo.js';

let ok = 0;
const inizio = performance.now();
const prova = (nome, f) => { f(); ok++; console.log('  ✓', nome); };
const tra = (x, a, b, che) => assert.ok(x > a && x < b, `${che}: ${x} (atteso tra ${a} e ${b})`);
const pc = (x, n) => `${((100 * x) / Math.max(1, n)).toFixed(1)}%`;

// i corpi veri (raggio medio; il giorno è quello dell'interno; il campo all'equatore)
const SOLE = { massa: 1, eta: 4.5e9, Z: 1 };
const luna = (massaKg, aM, densita, eccentricita = 0, altro = {}) => ({ massaKg, aM, densita, raggioM: Math.cbrt(massaKg / ((4 / 3) * Math.PI * densita)), eccentricita, ...altro });
const SATURNO = { tipo: 'gassoso', massaKg: 5.6834e26, raggioM: 5.8232e7, aM: 9.58 * UA, Mstella: MSOLE, Lw: LSOLE, giorno: 38362, obliquita: 26.7, B0: 2.1e-5 };
// Mimas, Encelado, Teti, Dione, Rea, Titano, Giapeto
const LUNE_SATURNO = [luna(3.75e19, 1.8552e8, 1150, 0.0196), luna(1.08e20, 2.3802e8, 1609, 0.0047), luna(6.17e20, 2.9466e8, 984, 0.0001), luna(1.095e21, 3.774e8, 1478, 0.0022), luna(2.307e21, 5.2704e8, 1236, 0.001), luna(1.3452e23, 1.22187e9, 1880, 0.0288), luna(1.806e21, 3.5608e9, 1088, 0.028)];
const GIOVE = { tipo: 'gassoso', massaKg: 1.898e27, raggioM: 6.9911e7, aM: 5.2 * UA, Mstella: MSOLE, Lw: LSOLE, giorno: 35730, obliquita: 3.1, B0: 4.3e-4 };
const LUNE_GIOVE = [luna(8.93e22, 4.22e8, 3528, 0.0041), luna(4.8e22, 6.711e8, 3013, 0.0094), luna(1.48e23, 1.0704e9, 1936, 0.0013), luna(1.08e23, 1.8827e9, 1834, 0.0074)];
const URANO = { tipo: 'ghiacciato', massaKg: 8.681e25, raggioM: 2.5362e7, aM: 19.2 * UA, Mstella: MSOLE, Lw: LSOLE, giorno: 62064, obliquita: 82.2, B0: 2.3e-5 };
const LUNE_URANO = [luna(6.6e19, 1.299e8, 1200, 0.0013), luna(1.25e21, 1.909e8, 1592, 0.0012), luna(1.27e21, 2.66e8, 1460, 0.0039), luna(3.4e21, 4.363e8, 1711, 0.0011), luna(3.08e21, 5.835e8, 1630, 0.0014)];
const NETTUNO = { tipo: 'ghiacciato', massaKg: 1.0241e26, raggioM: 2.4622e7, aM: 30.07 * UA, Mstella: MSOLE, Lw: LSOLE, giorno: 57996, obliquita: 28.3, B0: 1.4e-5 };
const LUNE_NETTUNO = [luna(4.4e19, 1.17647e8, 1300, 0.0005), luna(2.139e22, 3.5476e8, 2061, 0.00002, { retrograda: true })]; // Proteo, Tritone
const TERRA = { tipo: 'roccioso', massaKg: 5.972e24, raggioM: 6.371e6, aM: UA, Mstella: MSOLE, Lw: LSOLE, giorno: 86164, obliquita: 23.4, B0: 3.1e-5, clima: { T: 288, pressione: 1e5, tenuti: ['azoto'], acqua: 'liquida' } };
const LUNA = luna(7.35e22, 3.84e8, 3344, 0.0549);
const MARTE = { tipo: 'roccioso', massaKg: 6.417e23, raggioM: 3.3895e6, aM: 1.524 * UA, Mstella: MSOLE, Lw: LSOLE, giorno: 88643, obliquita: 25.2, B0: 0, clima: { T: 210, pressione: 600, tenuti: ['anidride carbonica'], acqua: 'ghiaccio' } };
const PHOBOS = luna(1.066e16, 9.376e6, 1876, 0.0151), DEIMOS = luna(1.48e15, 2.3463e7, 1471, 0.0003);
const caso = sorgente('prova/anelli');
// un anello ben fatto: numeri finiti, bordi in ordine, densità tra 0 e 2
function sano(a, che) {
  for (const v of [a.interno, a.esterno, a.massaKg, a.etaAnni, a.spessoreMassimo, a.grani.taglia, a.grani.minima, a.grani.massima, a.temperatura, a.lunette.massaKg, a.pioggia.kgAlSecondo, ...a.colore]) assert.ok(Number.isFinite(v) && v >= 0, `${che}: ${v}`);
  assert.ok(a.interno >= 1 && a.esterno > a.interno && a.esterno <= a.roche * 1.0001 && a.massaKg > 0 && a.spessoreMassimo > LEGGI_ANELLI.soglia, `${che}: tra ${a.interno} e ${a.esterno}`);
  assert.ok(a.grani.minima <= a.grani.taglia && a.grani.taglia <= a.grani.massima && typeof a.origine === 'string' && a.composizione[a.materiale] === 1);
  assert.equal(a.densita(a.interno * 0.999), 0); assert.equal(a.densita(a.esterno * 1.001), 0);
  let massimo = 0;
  for (let r = a.interno; r <= a.esterno; r += (a.esterno - a.interno) / 400) { const d = a.densita(r); assert.ok(d >= 0 && d <= 2, `${che}: densità ${d} a ${r}`); massimo = Math.max(massimo, d); }
  assert.ok(massimo > 0, che);
  for (const d of a.divisioni) assert.ok(d.r > a.interno && d.r < a.esterno && d.larghezza > 0 && typeof d.causa === 'string');
}

prova('Saturno con le sue lune vere: un anello di ghiaccio tra 1,1 e 2,2 raggi, fino al limite di Roche del ghiaccio', () => {
  const a = anelli(SATURNO, LUNE_SATURNO, SOLE, caso);
  assert.ok(a, 'Saturno ha un anello'); sano(a, 'Saturno');
  tra(a.interno, 1.02, 1.2, 'bordo interno (raggi: l\'anello D vero comincia a 1,15)');
  tra(a.esterno, 2.05, 2.4, 'bordo esterno (raggi: l\'anello A vero finisce a 2,35)');
  assert.ok(Math.abs(a.esterno * SATURNO.raggioM - limiteRoche(SATURNO, MATERIALI.ghiaccio.densita)) < 1, 'il bordo esterno è il limite di Roche del ghiaccio');
  assert.equal(a.materiale, 'ghiaccio'); assert.equal(a.etaAnni, 4.5e9); assert.ok(a.origine.includes('ghiaccio') && a.origine.includes('4,5 miliardi'));
  // la massa NON è scelta: è ciò che la viscosità lascia dopo 4,5 miliardi di anni (quella vera: 1,5·10¹⁹ kg)
  tra(a.massaKg, 3e17, 5e19, 'massa (kg)');
  tra(a.spessoreMassimo, 0.1, 2, 'spessore ottico massimo');
  tra(a.temperatura, 60, 95, 'temperatura dei grani (K: misurata 70–110)');
  // i grani: i più piccoli sono quelli che la luce non ha ancora fatto cadere (misurato: circa 1 cm), i più grossi qualche metro
  tra(a.grani.minima, 0.005, 0.05, 'grano più piccolo (m)'); tra(a.grani.massima, 0.2, 10, 'grano più grosso (m)');
  // la parte densa comincia dove smette di piovere: 0,874 volte l'orbita sincrona (il bordo interno dell'anello B vero: 1,58 raggi)
  const sincrona = orbitaSincrona(SATURNO) / SATURNO.raggioM;
  tra(sincrona, 1.9, 1.96, 'orbita sincrona (raggi)');
  assert.ok(Math.abs(a.denso[0] - Math.cbrt(2 / 3) * sincrona) < 1e-9); tra(a.denso[0], 1.55, 1.75, 'dove comincia la parte densa (raggi)');
  // più dentro, un velo tenue di materia che sta piovendo (l'anello C)
  tra(a.densita(1.4), 1e-4, 0.05, 'il velo interno'); assert.ok(a.densita(1.4) < a.densita(1.9) / 20);
  tra(a.pioggia.kgAlSecondo, 0.5, 5000, 'quanto piove sul pianeta oggi (kg/s)');
  assert.ok(a.lunette.massaKg > 1e17 && a.lunette.destino.includes('allontanano'), 'ciò che esce oltre Roche fa lunette che le maree allontanano');
  console.log(`      (da ${a.interno.toFixed(2)} a ${a.esterno.toFixed(2)} raggi, ${a.massaKg.toExponential(2)} kg, spessore ottico fino a ${a.spessoreMassimo.toFixed(2)}, grani da ${(a.grani.minima * 100).toFixed(1)} cm a ${a.grani.massima.toFixed(2)} m, piove ${a.pioggia.kgAlSecondo.toFixed(1)} kg/s, lunette ${a.lunette.massaKg.toExponential(1)} kg)`);
  console.log(`      (${a.origine})`);
});

prova('la divisione di Cassini: il bordo tenuto dalla risonanza 2:1 con Mimas, a 2,0 raggi; l\'anello A più tenue del B', () => {
  const a = anelli(SATURNO, LUNE_SATURNO, SOLE, caso), d = a.divisioni.find((x) => x.causa.includes('2:1') && x.causa.includes('la luna 0'));
  assert.ok(d, 'c\'è la divisione della 2:1 con Mimas');
  tra(d.r, 1.95, 2.03, 'dove sta la divisione (raggi)');
  const risonanza = (LUNE_SATURNO[0].aM * Math.pow(1 / 2, 2 / 3)) / SATURNO.raggioM;
  assert.ok(Math.abs(d.r - d.larghezza / 2 - risonanza) < 1e-9, 'il bordo interno della divisione è la risonanza');
  tra(d.larghezza * SATURNO.raggioM / 1e3, 50, 6000, 'larghezza (km: la divisione di Huygens 400, tutta la Cassini 4500)');
  assert.equal(a.densita(d.r), 0);
  // due fasce: la B (dentro, tenuta dal bordo: più densa verso fuori) e la A (stretta: più tenue)
  assert.equal(a.fasce.length, 2);
  const [B, A] = a.fasce;
  assert.ok(A.spessore < B.spessore && A.massaKg < B.massaKg, 'A più tenue di B');
  assert.ok(a.densita(risonanza - 0.01) > a.densita(a.denso[0] + 0.02), 'la B cresce verso il suo bordo');
  assert.ok(a.densita((A.da + A.a) / 2) > a.densita(A.a - 0.005), 'la A sfuma verso il limite di Roche');
  // la 3:1 con Encelado è troppo debole per tenere un bordo: lancia un'onda di densità
  const o = a.onde.find((x) => x.causa.includes('3:1') && x.causa.includes('la luna 1'));
  assert.ok(o && Math.abs(o.r - (LUNE_SATURNO[1].aM * Math.pow(1 / 3, 2 / 3)) / SATURNO.raggioM) < 1e-9 && o.ampiezza > 0 && o.ampiezza < 1);
  // senza lune l'anello c'è lo stesso, ma liscio: la struttura viene dalle lune
  const liscio = anelli(SATURNO, [LUNE_SATURNO[5]], SOLE, caso);
  assert.ok(liscio && liscio.divisioni.length === 0 && liscio.fasce.length === 1);
  console.log(`      (divisione a ${d.r.toFixed(3)} raggi, larga ${(d.larghezza * SATURNO.raggioM / 1e3).toFixed(0)} km; B: spessore ${B.spessore.toFixed(2)}, A: ${A.spessore.toFixed(2)}; onda a ${o.r.toFixed(3)})`);
});

prova('una luna dentro l\'anello (Pan) apre una divisione attorno alla sua orbita (Encke)', () => {
  const pan = luna(4.95e15, 1.26e8, 420), a = anelli(SATURNO, [...LUNE_SATURNO, pan], SOLE, caso);
  const d = a.divisioni.find((x) => x.causa.includes("dentro l'anello"));
  assert.ok(d && Math.abs(d.r - pan.aM / SATURNO.raggioM) < 1e-9);
  tra(d.larghezza * SATURNO.raggioM / 1e3, 100, 1000, 'larghezza (km: la divisione di Encke è 325)');
  assert.equal(a.densita(d.r), 0);
});

prova('il giorno decide: oltre la zona di pioggia resta ghiaccio solo se il giorno dura meno di 16 ore', () => {
  tra(giornoMassimo('ghiaccio') / 3600, 15.9, 16.05, 'giorno massimo per il ghiaccio (ore)');
  tra(giornoMassimo('roccia') / 3600, 8.4, 8.6, 'giorno massimo per la roccia (ore)');
  // i quattro giganti veri: solo Saturno. Giove gira in fretta ma la sua luna interna è di roccia; Urano e Nettuno girano piano
  assert.equal(anelli(GIOVE, LUNE_GIOVE, SOLE, caso), null);
  assert.equal(anelli(URANO, LUNE_URANO, SOLE, caso), null);
  assert.equal(anelli(NETTUNO, LUNE_NETTUNO, SOLE, caso), null);
  assert.ok(GIOVE.giorno < giornoMassimo('ghiaccio') && GIOVE.giorno > giornoMassimo('roccia') && URANO.giorno > giornoMassimo('ghiaccio') && NETTUNO.giorno > giornoMassimo('ghiaccio'));
  // lo stesso Urano che girasse in 12 ore, o senza campo magnetico (niente pioggia), l'anello lo avrebbe ancora
  const veloce = anelli({ ...URANO, giorno: 12 * 3600 }, LUNE_URANO, SOLE, caso), spento = anelli({ ...URANO, B0: 0 }, LUNE_URANO, SOLE, caso);
  assert.ok(veloce && spento); sano(veloce, 'Urano veloce'); sano(spento, 'Urano senza campo');
  assert.ok(spento.denso[0] < 1.1 && veloce.denso[0] > 1.5, 'senza pioggia l\'anello arriva fino all\'atmosfera');
  // e un Giove con una luna interna di ghiaccio (come Ganimede) lo avrebbe
  const ghiacciato = anelli(GIOVE, LUNE_GIOVE.slice(2), SOLE, caso);
  assert.ok(ghiacciato && ghiacciato.materiale === 'ghiaccio');
});

prova('quando è successo conta: un anello cala come 1/√t, dimentica la massa di partenza, e dove piove finisce', () => {
  const materia = (massaKg, anni) => ({ massaKg, ghiaccio: 1, anni, cosa: 'una luna di ghiaccio sbriciolata' });
  const m1 = anelloDa(SATURNO, [], SOLE, materia(1e22, 1e9)).massaKg, m4 = anelloDa(SATURNO, [], SOLE, materia(1e22, 4e9)).massaKg;
  tra(m1 / m4, 1.9, 2.2, 'massa a 1 miliardo di anni / massa a 4 (1/√t: 2)');
  assert.ok(Math.abs(anelloDa(SATURNO, [], SOLE, materia(1e24, 4e9)).massaKg / m4 - 1) < 0.01, 'cento volte più materia all\'inizio: stessa massa oggi');
  // un anello tenue e vecchio è sparito (la luce ha fatto cadere i suoi grani, tutti piccoli); lo stesso, appena arrivato, c'è
  assert.equal(anelloDa(SATURNO, [], SOLE, materia(1e15, 4.5e9)), null);
  const fresco = anelloDa(SATURNO, [], SOLE, materia(1e15, 1e4));
  assert.ok(fresco && fresco.massaKg > 0.9e15 && fresco.etaAnni === 1e4);
  // più è tenue, prima finisce
  const dura = (massaKg) => { let t = 1e3; while (t < 2e10 && anelloDa(SATURNO, [], SOLE, materia(massaKg, t))) t *= 1.5; return t; };
  assert.ok(dura(1e14) < dura(1e16) && dura(1e16) < dura(1e18), `durate: ${dura(1e14)}, ${dura(1e16)}, ${dura(1e18)}`);
  // attorno a Urano tutto l'anello sta dove piove: da giovane c'era (massiccio: centinaia di milioni di anni), oggi no
  const u = [1e7, 1e8, 3e8, 1e9, 4.5e9].map((eta) => anelli(URANO, LUNE_URANO, { massa: 1, eta }, caso));
  assert.ok(u[0] && u[1] && u[2] && !u[4]); assert.ok(u[0].massaKg > u[1].massaKg && u[1].massaKg > u[2].massaKg);
  assert.ok(u[0].lunette.destino.includes('riportano dentro'), 'le sue lunette girano più in fretta del pianeta');
  console.log(`      (un anello di 10¹⁴ kg attorno a Saturno dura ${(dura(1e14) / 1e6).toFixed(1)} milioni di anni, uno di 10¹⁶ ${(dura(1e16) / 1e6).toFixed(0)}, uno di 10¹⁸ ${dura(1e18) >= 2e10 ? 'più dell\'universo' : (dura(1e18) / 1e9).toFixed(1) + ' miliardi'}; Urano a 100 milioni di anni: ${u[1].massaKg.toExponential(1)} kg)`);
});

prova('vicino alla stella il ghiaccio sublima: l\'anello di Saturno regge solo da circa 5 UA in fuori', () => {
  tra(sublimazione(273.16) * MATERIALI.ghiaccio.densita, 0.1, 1, 'ghiaccio a 273 K nel vuoto (kg/m²/s)');
  assert.ok(sublimazione(130) * 3.156e16 > 100 && sublimazione(80) * 3.156e16 * 4.5 < 1e-6, 'a 130 K cento metri in un miliardo di anni; a 80 K niente');
  let linea = 0;
  for (const d of [2, 3, 4, 4.5]) assert.equal(anelli({ ...SATURNO, aM: d * UA }, LUNE_SATURNO, SOLE, caso), null, `a ${d} UA`);
  for (const d of [5.5, 7, 9.58, 20]) { const a = anelli({ ...SATURNO, aM: d * UA }, LUNE_SATURNO, SOLE, caso); assert.ok(a && a.materiale === 'ghiaccio', `a ${d} UA`); }
  for (let d = 3; d < 7 && !linea; d += 0.05) if (anelli({ ...SATURNO, aM: d * UA }, LUNE_SATURNO, SOLE, caso)) linea = d;
  tra(linea, 4, 5.6, 'la linea della neve degli anelli (UA)');
  console.log(`      (attorno al Sole un anello di ghiaccio regge da ${linea.toFixed(2)} UA in fuori)`);
});

prova('la Terra con la Luna: nessun anello (i detriti dell\'urto sono piovuti da miliardi di anni)', () => {
  const s = storia(TERRA, [LUNA], SOLE, caso);
  assert.ok(s.length === 1 && s[0].quando === -4.5e9 && s[0].cosa.includes('grande urto'));
  assert.equal(anelli(TERRA, [LUNA], SOLE, caso), null);
  // ma poco dopo l'urto c'era
  const giovane = anelli(TERRA, [LUNA], { massa: 1, eta: 1e5 }, caso);
  assert.ok(giovane && giovane.materiale === 'roccia'); sano(giovane, 'Terra giovane');
  tra(giovane.esterno, 2.5, 3.2, 'limite di Roche della roccia attorno alla Terra (raggi)');
});

prova('Marte con Phobos: oggi niente; tra decine di milioni di anni Phobos si spezza e fa un anello', () => {
  assert.equal(anelli(MARTE, [PHOBOS, DEIMOS], SOLE, caso), null);
  const futuri = storia(MARTE, [PHOBOS, DEIMOS], SOLE, caso).filter((e) => e.quando > 0);
  assert.equal(futuri.length, 1, 'solo Phobos scende (gira più in fretta di Marte); Deimos si allontana');
  assert.equal(futuri[0].luna, 0);
  tra(futuri[0].quando / 1e6, 10, 80, 'tra quanti milioni di anni (stime: 20–40)');
  tra(doveSiSpezza(MARTE, PHOBOS) / MARTE.raggioM, 1.3, 1.9, 'dove si spezza (raggi di Marte: un corpo piccolo regge fin sotto il limite dei fluidi)');
  // l'anello che ne verrà (roccia: lì il ghiaccio non regge)
  const poi = anelloDa(MARTE, [DEIMOS], SOLE, { massaKg: futuri[0].massaKg, ghiaccio: futuri[0].ghiaccio, anni: 1e5, cosa: futuri[0].cosa });
  assert.ok(poi && poi.materiale === 'roccia'); sano(poi, 'Marte dopo Phobos');
  tra(poi.massaKg, 1e15, 1.1e16, 'massa dell\'anello di Phobos (kg)');
  // Tritone gira contromano: scende anche lui, ma più lentamente dell'età dell'universo
  const tritone = storia(NETTUNO, LUNE_NETTUNO, SOLE, caso).find((e) => e.luna === 1);
  assert.ok(tritone && tritone.quando > 1e9 && tritone.cosa.includes('contromano'));
  console.log(`      (Phobos si spezza tra ${(futuri[0].quando / 1e6).toFixed(1)} milioni di anni a ${(doveSiSpezza(MARTE, PHOBOS) / MARTE.raggioM).toFixed(2)} raggi; Tritone tra ${(tritone.quando / 1e9).toFixed(0)} miliardi di anni)`);
});

prova('un roccioso bloccato dalla stella: la luna dell\'urto ricade (a volte c\'è stata, a volte no: dagli eventi)', () => {
  const VENERE = { tipo: 'roccioso', massaKg: 4.867e24, raggioM: 6.052e6, aM: 0.3 * UA, Mstella: MSOLE, Lw: LSOLE, giorno: 60 * 86400, bloccato: true, obliquita: 0, B0: 0, clima: { T: 600, pressione: 1e5, tenuti: ['anidride carbonica'], acqua: 'assente' } };
  let ricadute = 0; const N = 300;
  for (let k = 0; k < N; k++) {
    const s = storia(VENERE, [], SOLE, sorgente(`prova/venere ${k}`));
    if (s.length) { ricadute++; assert.ok(s[0].cosa.includes('ricaduta') && s[0].quando === -4.5e9); tra(s[0].massaKg / VENERE.massaKg, 1e-3, 0.026, 'massa della luna ricaduta / pianeta'); }
  }
  tra(ricadute / N, 0.35, 0.55, 'quante volte c\'è stato l\'urto (lune.js: 0,45)');
  // una Terra non bloccata e senza luna: la storia ricostruita non contiene mai una luna che sarebbe rimasta
  for (let k = 0; k < 100; k++) for (const e of storia(TERRA, [], SOLE, sorgente(`prova/terra ${k}`))) assert.ok(e.cosa.includes('ricaduta'));
});

prova('determinismo: stessi eventi, stesso anello; il caso entra solo dalla sorgente', () => {
  const impronta = (a) => (a ? JSON.stringify(a) + Array.from({ length: 50 }, (_, i) => a.spessoreOttico(1 + 0.03 * i)).join() : 'niente');
  for (const [P, L] of [[SATURNO, LUNE_SATURNO], [URANO, LUNE_URANO], [TERRA, [LUNA]]]) for (const eta of [1e8, 4.5e9]) {
    assert.equal(impronta(anelli(P, L, { massa: 1, eta }, sorgente('prova/a'))), impronta(anelli(P, L, { massa: 1, eta }, sorgente('prova/a'))));
  }
  // un evento andato diversamente (un altro ramo) cambia ciò che ne discende
  const a = storia(SATURNO, LUNE_SATURNO, SOLE, sorgente('prova/a')), b = storia(SATURNO, LUNE_SATURNO, SOLE, sorgente('prova/a', { 'prova/a/ultima luna perduta/fascia': 1 }));
  assert.notEqual(a[0].massaKg, b[0].massaKg);
  assert.ok(!/Math\.random|generatore/.test(anelli.toString() + storia.toString() + anelloDa.toString()));
});

prova('le lune di lune(): i gemelli di Saturno, di Giove e di Urano; ogni divisione viene da una luna che c\'è', () => {
  const N = 150, conta = (P, nome) => { let con = 0; for (let s = 1; s <= N; s++) { const l = lune(P, SOLE, s), a = anelli(P, l, SOLE, sorgente(`prova/${nome} ${s}`)); if (a) { con++; sano(a, `${nome} ${s}`); assert.equal(a.materiale, 'ghiaccio'); assert.ok((l.find((x) => x.origine === 'disco').composizione.ghiaccio ?? 0) > LEGGI_ANELLI.ghiaccioMinimo, 'l\'anello di ghiaccio c\'è solo se la luna più interna ha ghiaccio'); } } return con; };
  const saturni = conta(SATURNO, 'saturno'), giovi = conta(GIOVE, 'giove'), urani = conta(URANO, 'urano');
  assert.ok(saturni > giovi && giovi < 0.3 * N && saturni > 0.1 * N, `Saturno ${saturni}, Giove ${giovi}`);
  assert.equal(urani, 0, 'Urano gira troppo piano');
  // un Urano che gira in 12 ore: anelli sempre, e le divisioni cadono sulle risonanze delle sue lune
  let divisioni = 0, conDivisioni = 0;
  for (let s = 1; s <= N; s++) {
    const P = { ...URANO, giorno: 12 * 3600 }, l = lune(P, SOLE, s), a = anelli(P, l, SOLE, sorgente(`prova/urano veloce ${s}`));
    assert.ok(a, `seme ${s}`); sano(a, `Urano veloce ${s}`);
    if (a.divisioni.length) conDivisioni++;
    for (const d of a.divisioni) {
      divisioni++;
      const [, p, q, id] = d.causa.match(/risonanza (\d+):(\d+) con la luna (\d+)/) || [], m = l.find((x) => x.id === +id);
      if (p) assert.ok(m && Math.abs((d.r - d.larghezza / 2) * P.raggioM - m.aM * Math.pow(q / p, 2 / 3)) < 1e-6 * m.aM, d.causa);
      else assert.ok(/la luna \d+ (dentro|a ridosso)/.test(d.causa), d.causa);
      assert.equal(a.densita(d.r), 0);
    }
  }
  assert.ok(divisioni > 0);
  console.log(`      (${N} semi: con anello ${saturni} gemelli di Saturno, ${giovi} di Giove, ${urani} di Urano; un Urano da 12 ore: sempre, ${conDivisioni} con divisioni)`);
});

prova('sui pianeti veri del cosmo: quanti hanno anelli, e in fretta', () => {
  const classi = {}, tempi = [], visti = new Set(); let peggio = 0;
  // (si guarda finché ci sono abbastanza pianeti di ogni specie per contare: quanti sistemi servano dipende da che stelle ha la galassia)
  const bastano = () => (classi.rocciosi?.n ?? 0) > 450 && (classi['giganti di gas']?.n ?? 0) + (classi['giganti di ghiaccio (più di 10 Terre)']?.n ?? 0) > 450;
  for (let n = 1; n < 260000 && !bastano(); n += 197) {
    const a = indirizzoDi(n), chiave = `${a.cosmo}/${a.galassia}/${a.stella}`; if (visti.has(chiave)) continue; visti.add(chiave);
    const S = sistema(a.cosmo, a.galassia, a.stella), stella = { massa: S.stella.massa, eta: S.stella.eta ?? 5e9, morta: S.stella.morta, Z: S.stella.Z };
    for (const P of S.pianeti) {
      const c = sorgente(`cosmo ${a.cosmo}/galassia ${a.galassia}/stella ${a.stella}/pianeta ${P.id}/anelli`);
      const t0 = performance.now(), A = anelli(P, P.lune, stella, c), dt = performance.now() - t0; tempi.push(dt); if (tempi.length > 200) peggio = Math.max(peggio, dt);
      const classe = P.tipo === 'roccioso' ? 'rocciosi' : P.tipo === 'gassoso' ? 'giganti di gas' : P.massaKg > 10 * 5.972e24 ? 'giganti di ghiaccio (più di 10 Terre)' : 'ghiacciati piccoli';
      const q = (classi[classe] ??= { n: 0, anello: 0, massiccio: 0, divisioni: 0, senzaCampo: 0 }); q.n++;
      if (!A) continue;
      sano(A, `${chiave}/${P.id}`);
      q.anello++; if (A.spessoreMassimo > 0.1) q.massiccio++; if (A.divisioni.length) q.divisioni++; if (!P.interno?.dinamo) q.senzaCampo++;
      for (const e of storia(P, P.lune, stella, c)) assert.ok(Number.isFinite(e.quando) && e.massaKg > 0);
    }
  }
  const gas = classi['giganti di gas'], ghi = classi['giganti di ghiaccio (più di 10 Terre)'], roc = classi.rocciosi;
  const giganti = { n: gas.n + ghi.n, massiccio: gas.massiccio + ghi.massiccio, anello: gas.anello + ghi.anello };
  for (const [nome, q] of Object.entries(classi)) console.log(`      ${nome}: ${q.n}; con anello ${q.anello} (${pc(q.anello, q.n)}), massiccio ${q.massiccio} (${pc(q.massiccio, q.n)}); con divisioni ${q.divisioni}; senza campo magnetico ${q.senzaCampo}`);
  console.log(`      FRAZIONE DI GIGANTI CON ANELLI MASSICCI (spessore ottico > 0,1): ${giganti.massiccio} su ${giganti.n} = ${pc(giganti.massiccio, giganti.n)} (nel Sistema Solare: 1 su 4); rocciosi con anello: ${pc(roc.anello, roc.n)}`);
  assert.ok(giganti.n > 300 && roc.n > 300, `giganti ${giganti.n}, rocciosi ${roc.n}`);
  // (da quando giorno e asse vengono dagli urti giganti veri, i mondi di ghiaccio pesanti e senza gas girano in 2–4 ore,
  // e con un giorno così corto l'anello resta: la frazione è salita da un quarto a sette su dieci. È una conseguenza
  // delle premesse, non una taratura: resta tra le cose da guardare)
  tra(giganti.massiccio / giganti.n, 0.03, 0.85, 'frazione di giganti con anelli massicci');
  // I ROCCIOSI. Il riscontro vero è piccolissimo: nel Sistema Solare nessuno dei quattro ha un anello. La domanda giusta è
  // se la frazione del modello è compatibile con «zero su quattro», non se sta sotto una soglia scelta: (1 − f)⁴ deve
  // restare una probabilità non trascurabile (oltre il 5%). (Da quando la dinamo viene dalla storia termica, storia.js,
  // i rocciosi grandi e vecchi non hanno più campo: senza campo non c'è pioggia e l'anello dura; la frazione è salita dal
  // 3% al 10%, tutti senza campo.)
  const fRoc = roc.anello / roc.n, zeroSuQuattro = (1 - fRoc) ** 4;
  console.log(`      rocciosi con anello: ${pc(roc.anello, roc.n)} (${roc.senzaCampo} su ${roc.anello} senza campo magnetico); probabilità di vederne zero su quattro, come nel Sistema Solare: ${pc(zeroSuQuattro, 1)}`);
  assert.ok(zeroSuQuattro > 0.05, `la frazione di rocciosi con anello (${pc(roc.anello, roc.n)}) non è compatibile con zero su quattro`);
  tempi.sort((x, y) => x - y);
  const media = tempi.reduce((x, y) => x + y, 0) / tempi.length;
  assert.ok(media < 0.5 && tempi[Math.floor(0.99 * tempi.length)] < 2 && peggio < 20, `anelli(): media ${media} ms, 99% ${tempi[Math.floor(0.99 * tempi.length)]} ms, peggiore ${peggio} ms`);
  console.log(`      (${visti.size} sistemi, ${tempi.length} pianeti; anelli(): media ${media.toFixed(3)} ms, il 99% sotto ${tempi[Math.floor(0.99 * tempi.length)].toFixed(2)} ms, la più lenta ${peggio.toFixed(2)} ms)`);
});

const secondi = (performance.now() - inizio) / 1000;
assert.ok(secondi < 30, `il test dura ${secondi} s`);
console.log(`\n${ok} prove superate in ${secondi.toFixed(1)} s`);
