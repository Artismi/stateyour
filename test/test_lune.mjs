// test_lune.mjs — le lune e le maree: i numeri veri del Sistema Solare, e lune che emergono da un seme
import assert from 'node:assert/strict';
import { limiteRoche, raggioHill, raggioRotondo, lune, caloreMareale, stato, maree, tempoBlocco, orbitaDopoLeMaree, k2QFreddo, MATERIALI } from '../src/camera/lune.js';
import { MSOLE, UA, ANNO } from '../src/camera/leggi.js';
import { indirizzoDi, sistema } from '../src/camera/cosmo.js';

let ok = 0;
const prova = (nome, f) => { f(); ok++; console.log('  ✓', nome); };
const tra = (x, a, b, che) => assert.ok(x > a && x < b, `${che}: ${x} (atteso tra ${a} e ${b})`);

// i corpi veri
const SOLE = { massa: 1, eta: 4.5e9 }, ETA = 4.5e9 * ANNO;
const TERRA = { tipo: 'roccioso', massaKg: 5.97e24, raggioM: 6.371e6, aM: UA, Mstella: MSOLE, giorno: 86164, clima: { acqua: 'liquida' } };
const LUNA = { massaKg: 7.35e22, raggioM: 1.737e6, aM: 3.84e8, eccentricita: 0.0549 };
const GIOVE = { tipo: 'gassoso', massaKg: 1.898e27, raggioM: 7.15e7, aM: 5.2 * UA, Mstella: MSOLE, giorno: 35730 };
const IO = { massaKg: 8.93e22, raggioM: 1.82e6, aM: 4.22e8, eccentricita: 0.0041 };
const EUROPA = { massaKg: 4.8e22, raggioM: 1.561e6, aM: 6.711e8, eccentricita: 0.0094 };
const STATI = ['vulcanica', 'oceano sotto il ghiaccio', 'geologicamente attiva', 'fredda e ferma'];

prova('Terra e Luna: il limite di Roche, la marea, il blocco', () => {
  tra(limiteRoche(TERRA, 3344) / 1e3, 9000, 19000, 'limite di Roche (km)');
  const m = maree(TERRA, LUNA);
  tra(m.altezza, 0.2, 0.6, 'marea di equilibrio (m)');
  tra(m.periodo / 3600, 12.3, 12.6, 'ogni quanto torna la marea (ore: 12 e 25 minuti)');
  tra(tempoBlocco(TERRA, LUNA), 0, ETA / 10, 'tempo di blocco della Luna (s): molto meno della sua età');
  tra(k2QFreddo(LUNA) * MATERIALI.roccia.Q, 0.015, 0.035, 'il numero di Love della Luna (misurato: 0,024)');
  assert.equal(stato(TERRA, LUNA), 'fredda e ferma');
  tra(raggioHill(TERRA) / 1e9, 1.4, 1.6, 'raggio di Hill della Terra (milioni di km: 1,5)');
});

prova('la Luna, nata al limite di Roche, in 4,5 miliardi di anni arriva dov\'è (da/dt ∝ a^-11/2)', () => {
  const a0 = 1.2 * limiteRoche(TERRA, 3344), a = orbitaDopoLeMaree(TERRA, LUNA.massaKg, a0, 4.5e9);
  tra(a / 1e8, 2.8, 5, 'distanza della Luna oggi (centinaia di migliaia di km: 3,84)');
  // a^(13/2) cresce in modo lineare: il primo decimo del tempo fa già più di due terzi della strada
  const presto = orbitaDopoLeMaree(TERRA, LUNA.massaKg, a0, 4.5e8);
  assert.ok(Math.abs((a ** 6.5 - a0 ** 6.5) / (presto ** 6.5 - a0 ** 6.5) - 10) < 1e-6 && presto > 0.66 * a);
});

prova('Giove e Io: il calore delle maree accende i vulcani; Europa ha un oceano sotto il ghiaccio', () => {
  const q = caloreMareale(GIOVE, IO);
  tra(q, 0.5, 5, 'calore mareale di Io (W/m²: circa 2)');
  assert.equal(stato(GIOVE, IO), 'vulcanica');
  tra(caloreMareale(GIOVE, EUROPA), 0.01, 0.5, 'calore mareale di Europa (W/m²)');
  assert.equal(stato(GIOVE, EUROPA), 'oceano sotto il ghiaccio');
  // la legge: come e², e crolla con la distanza (a^-7,5: sei per la marea, uno e mezzo per il periodo)
  assert.ok(Math.abs(caloreMareale(GIOVE, { ...IO, eccentricita: 0.0082 }) / q - 4) < 1e-9);
  assert.equal(caloreMareale(GIOVE, { ...IO, eccentricita: 0 }), 0);
  assert.equal(stato(GIOVE, { ...IO, eccentricita: 0 }), 'fredda e ferma');
  assert.ok(caloreMareale(GIOVE, { ...IO, aM: 2 * IO.aM }) < q / 100);
  tra(tempoBlocco(GIOVE, IO), 0, ETA / 1000, 'tempo di blocco di Io (s)');
});

prova('un corpo si arrotonda da solo sopra 150–400 km: prima il ghiaccio, poi la roccia', () => {
  const g = raggioRotondo(MATERIALI.ghiaccio.densita, MATERIALI.ghiaccio.resistenza), r = raggioRotondo(MATERIALI.roccia.densita, MATERIALI.roccia.resistenza);
  tra(g / 1e3, 150, 400, 'ghiaccio (km)'); tra(r / 1e3, 150, 400, 'roccia (km)');
  assert.ok(g < r);
  assert.equal(raggioRotondo(930), g); assert.equal(raggioRotondo(3300), r);
});

prova('un gigante come Giove: più lune dal disco, tra Roche e Hill, in tutto circa 10⁻⁴ del pianeta', () => {
  const RH = raggioHill(GIOVE), N = 60; let piu = 0, risonanti = 0, vulcaniche = 0, oceani = 0, contromano = 0, catturate = 0;
  for (let s = 1; s <= N; s++) {
    const tutte = lune(GIOVE, SOLE, s), reg = tutte.filter((l) => l.origine === 'disco'), tot = reg.reduce((x, l) => x + l.massaKg, 0) / GIOVE.massaKg;
    assert.ok(reg.length >= 1 && !tutte.some((l) => l.origine === 'urto'), `seme ${s}`);
    tra(tot, 5e-5, 8e-4, `massa totale delle lune regolari / massa del pianeta (seme ${s})`);
    if (reg.length >= 2) piu++;
    tutte.forEach((l, i) => {
      assert.equal(l.id, i); assert.ok(STATI.includes(l.stato)); assert.ok(i === 0 || l.aM > tutte[i - 1].aM, 'dalla più vicina alla più lontana');
      for (const v of [l.massaKg, l.raggioM, l.densita, l.aM, l.periodo, l.eccentricita, l.caloreMareale, ...l.forma.assi]) assert.ok(Number.isFinite(v) && v >= 0);
      assert.ok(l.aM > limiteRoche(GIOVE, l.densita) && l.aM * (1 + l.eccentricita) < RH, `tra Roche e Hill (seme ${s}, luna ${i})`);
      assert.ok(Math.abs(l.periodo - 2 * Math.PI * Math.sqrt(l.aM ** 3 / (6.674e-11 * (GIOVE.massaKg + l.massaKg)))) < 1e-6 * l.periodo, 'Keplero');
      assert.ok(Math.abs(l.massaKg - (4 / 3) * Math.PI * l.raggioM ** 3 * l.densita) < 1e-9 * l.massaKg);
    });
    for (const l of reg) {
      assert.ok(l.aM < 0.1 * RH && l.bloccata && l.forma.rotonda && !l.retrograda, 'vicine, bloccate, tonde');
      tra(l.densita, 900, 4000, 'densità');
      // in risonanza l'eccentricità resta forzata (millesimi); le altre vicine si circolarizzano
      if (l.risonanza) { risonanti++; tra(l.eccentricita, 1e-4, 0.0201, `eccentricità forzata (seme ${s})`); }
      else if (l.aM < 8 * GIOVE.raggioM) assert.ok(l.eccentricita < 1e-4, `circolarizzata (seme ${s}): ${l.eccentricita}`);
      assert.ok(l.caloreMareale < 50, `calore ${l.caloreMareale}`);
      if (l.stato === 'vulcanica') { vulcaniche++; assert.ok(l.risonanza && (l.composizione.ghiaccio ?? 0) < 0.01, 'i vulcani solo dove una risonanza tiene viva la marea'); }
      if (l.stato === 'oceano sotto il ghiaccio') oceani++;
    }
    // le lune in risonanza hanno davvero i periodi in rapporto semplice
    for (let i = 0; i + 1 < reg.length; i++) if (reg[i].risonanza?.includes(`con la luna ${reg[i + 1].id}`)) { const r = reg[i + 1].periodo / reg[i].periodo; assert.ok([2, 1.5, 4 / 3].some((x) => Math.abs(r - x) < 0.01), `rapporto dei periodi ${r}`); }
    // il ghiaccio sta lontano dal pianeta giovane e caldo: cresce andando in fuori
    for (let i = 0; i + 1 < reg.length; i++) assert.ok(reg[i + 1].composizione.ghiaccio >= reg[i].composizione.ghiaccio);
    for (const l of tutte.filter((x) => x.origine === 'cattura')) {
      catturate++; if (l.retrograda) contromano++;
      assert.ok(l.aM > 0.1 * RH && l.eccentricita > 0.05 && !l.bloccata && l.stato === 'fredda e ferma' && l.raggioM < 2.5e5, 'catturate: lontane, storte, libere, fredde, piccole');
      if (!l.forma.rotonda) assert.ok(l.forma.assi[0] > l.forma.assi[1] && l.forma.assi[1] > l.forma.assi[2] && Math.abs(l.forma.assi.reduce((x, y) => x * y) - 1) < 1e-9);
    }
  }
  assert.ok(piu >= 0.8 * N, `con più lune regolari: ${piu} su ${N}`);
  assert.ok(risonanti > 0 && vulcaniche > 0 && oceani > 0, `risonanti ${risonanti}, vulcaniche ${vulcaniche}, con oceano ${oceani}`);
  assert.ok(catturate > N && contromano > catturate / 2, `catturate ${catturate}, contromano ${contromano}`);
  console.log(`      (${N} semi: ${piu} con più lune regolari; ${risonanti} lune in risonanza, ${vulcaniche} vulcaniche, ${oceani} con oceano; ${contromano} catturate contromano su ${catturate})`);
});

prova('una Terra: a volte una luna da un grande urto, a volte no; e quando c\'è somiglia alla nostra', () => {
  let con = 0, senza = 0; const N = 80, RH = raggioHill(TERRA);
  for (let s = 1; s <= N; s++) {
    const tutte = lune(TERRA, SOLE, s), u = tutte.filter((l) => l.origine === 'urto');
    assert.ok(u.length <= 1 && !tutte.some((l) => l.origine === 'disco'));
    if (!u.length) { senza++; continue; }
    con++; const l = u[0];
    tra(l.massaKg / TERRA.massaKg, 1e-3, 0.026, 'massa della luna / massa del pianeta');
    assert.ok(l.aM > 5 * limiteRoche(TERRA, l.densita) && l.aM < 0.4 * RH, `allontanata dalle maree, ma ancora legata: ${l.aM}`);
    tra(l.aM / 1e8, 2, 6, 'distanza (centinaia di migliaia di km)');
    assert.ok(l.bloccata && l.forma.rotonda && l.stato === 'fredda e ferma' && (l.composizione.ghiaccio ?? 0) === 0);
    tra(l.giornoInizialePianeta / 3600, 1.3, 23.9, 'il giorno del pianeta appena dopo l\'urto (ore): più corto di oggi');
    tra(maree(TERRA, l).altezza, 0.02, 3, 'la marea che alza (m)');
  }
  assert.ok(con >= 0.2 * N && senza >= 0.2 * N, `con luna ${con}, senza ${senza}`);
  // un pianeta bloccato dalla sua stella la perde; e così uno troppo vicino (la stella gliela porta via)
  for (let s = 1; s <= N; s++) {
    assert.ok(!lune({ ...TERRA, bloccato: true }, SOLE, s).some((l) => l.origine === 'urto'));
    assert.ok(!lune({ ...TERRA, aM: 0.1 * UA }, SOLE, s).some((l) => l.origine === 'urto'));
  }
  console.log(`      (${N} semi: ${con} con una luna da urto, ${senza} senza)`);
});

prova('un gigante troppo vicino alla stella non ha posto per le lune', () => {
  for (let s = 1; s <= 20; s++) assert.equal(lune({ ...GIOVE, aM: 0.05 * UA }, SOLE, s).length, 0);
});

prova('lo stesso seme dà le stesse lune; semi diversi, lune diverse', () => {
  for (const P of [GIOVE, TERRA]) for (const s of [1, 7, 42]) assert.equal(JSON.stringify(lune(P, SOLE, s)), JSON.stringify(lune(P, SOLE, s)));
  assert.notEqual(JSON.stringify(lune(GIOVE, SOLE, 1)), JSON.stringify(lune(GIOVE, SOLE, 2)));
  assert.notEqual(JSON.stringify(lune({ ...GIOVE, id: 0 }, SOLE, 1)), JSON.stringify(lune({ ...GIOVE, id: 1 }, SOLE, 1)));
});

prova('sui pianeti veri del cosmo: tutto finito, tutto legato al pianeta, e in fretta', () => {
  let pianeti = 0, trovate = 0, peggio = 0;
  for (let n = 1; n < 3000; n += 53) {
    const a = indirizzoDi(n), S = sistema(a.cosmo, a.galassia, a.stella);
    for (const P of S.pianeti) {
      const t0 = performance.now(), tutte = lune(P, S.stella, n); peggio = Math.max(peggio, performance.now() - t0); pianeti++;
      for (const l of tutte) {
        trovate++;
        for (const v of [l.massaKg, l.raggioM, l.densita, l.aM, l.periodo, l.eccentricita, l.caloreMareale, ...l.forma.assi]) assert.ok(Number.isFinite(v) && v >= 0);
        assert.ok(l.aM > limiteRoche(P, l.densita) && l.aM * (1 + l.eccentricita) < raggioHill(P) && STATI.includes(l.stato) && l.massaKg < 0.03 * P.massaKg);
        assert.ok((P.tipo === 'roccioso') === (l.origine !== 'disco') || l.origine === 'cattura');
      }
    }
  }
  assert.ok(pianeti > 50 && trovate > 50 && peggio < 50, `${pianeti} pianeti, ${trovate} lune, la più lenta ${peggio} ms`);
  console.log(`      (${pianeti} pianeti, ${trovate} lune; la chiamata più lenta ${peggio.toFixed(2)} ms)`);
});

console.log(`\n${ok} prove superate`);
