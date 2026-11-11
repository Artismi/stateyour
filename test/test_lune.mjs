// test_lune.mjs — le lune e le maree: i numeri veri del Sistema Solare, e lune che emergono da un seme
import assert from 'node:assert/strict';
import { limiteRoche, raggioHill, raggioRotondo, lune, caloreMareale, stato, maree, tempoBlocco, orbitaDopoLeMaree, k2QFreddo, k2QLuna, MATERIALI } from '../src/camera/lune.js';
import { MSOLE, UA, ANNO } from '../src/camera/leggi.js';
import { indirizzoDi, sistema, cosmoCon, cosmoRamo } from '../src/camera/cosmo.js';
import { sorgente, conRegistro, rileggi } from '../src/camera/eventi.js';

let ok = 0;
const prova = (nome, f) => { f(); ok++; console.log('  ✓', nome); };
const tra = (x, a, b, che) => assert.ok(x > a && x < b, `${che}: ${x} (atteso tra ${a} e ${b})`);
// un riscontro col mondo vero: stampato sempre; fuori dall'intervallo resta scritto «≠ NON TORNA» (le soglie non si allargano)
const nonTorna = [], riscontro = (che, x, a, b, perche = '') => { const torna = x > a && x < b; console.log(`      ${torna ? '=' : '≠ NON TORNA'} ${che}: ${Number(x).toPrecision(3)} (chiesto ${a}–${b})${torna || !perche ? '' : ` — ${perche}`}`); if (!torna) nonTorna.push(`${che}: ${Number(x).toPrecision(3)} (chiesto ${a}–${b})${perche ? ` — ${perche}` : ''}`); return torna; };

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
  // (il calore di Io non viene più dal k₂/Q misurato su Io stesso, che lo ridava per costruzione: esce dallo stato interno,
  // maree.js + storia.js. Il ramo caldo emerge da solo, ma il corpo omogeneo dissipa troppo poco: resta scritto)
  riscontro('calore mareale di Io (W/m²: circa 2)', q, 0.5, 5, 'corpo omogeneo con la reologia di Andrade: −Im k₂ arriva a 0,002–0,003 dove Io misura 0,015; manca lo strato molle sotto la crosta (astenosfera)');
  assert.equal(stato(GIOVE, IO), 'vulcanica');
  tra(caloreMareale(GIOVE, EUROPA), 0.01, 0.5, 'calore mareale di Europa (W/m²)');
  assert.equal(stato(GIOVE, EUROPA), 'oceano sotto il ghiaccio');
  // la legge: come e², e crolla con la distanza (a^-7,5: sei per la marea, uno e mezzo per il periodo)
  // (a stato interno FERMO la legge è e², ed è provata in test_maree; all'equilibrio no: più marea scalda il mantello, che
  // dissipa di più: con l'eccentricità doppia il calore cresce più di quattro volte)
  const q2 = caloreMareale(GIOVE, { ...IO, eccentricita: 0.0082 }); assert.ok(q2 > 4 * q && q2 < 40 * q, `con l'eccentricità doppia: ${q2 / q} volte`);
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
  const RH = raggioHill(GIOVE), N = 60; let piu = 0, risonanti = 0, vulcaniche = 0, oceani = 0, contromano = 0, catturate = 0, rigide = 0;
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
      else if (l.aM < 8 * GIOVE.raggioM) {
        // (la legge: l'attrito nella luna consuma l'eccentricità in τ = (2/21)·(m/M)·(a/R)⁵/((k₂/Q)·n). Il k₂/Q non è più un
        // numero fisso (Q = 40): viene dallo stato interno. Una luna di roccia piccola e fredda è rigida e quasi non dissipa
        // (Q di decine di migliaia): la sua orbita resta schiacciata, come quelle di Amaltea e Tebe. Chi ha τ molto più
        // breve dell'età invece deve essere tonda)
        const tau = ((2 / 21) * (l.massaKg / GIOVE.massaKg) * (l.aM / l.raggioM) ** 5) / (k2QLuna(GIOVE, l) * ((2 * Math.PI) / l.periodo));
        if (tau < ETA / 20) assert.ok(l.eccentricita < 1e-4, `circolarizzata (seme ${s}): ${l.eccentricita}`); else { rigide++; assert.equal(l.stato, 'fredda e ferma', 'chi tiene l\'eccentricità senza risonanza è freddo e rigido'); }
      }
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
  console.log(`      (${N} semi: ${piu} con più lune regolari; ${risonanti} lune in risonanza, ${vulcaniche} vulcaniche, ${oceani} con oceano, ${rigide} vicine rimaste su un'orbita schiacciata perché fredde e rigide; ${contromano} catturate contromano su ${catturate})`);
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

prova('con l\'urto gigante vero del pianeta (dalla storia degli impatti) niente è sorteggiato: la luna c\'è se e solo se l\'urto l\'ha fatta', () => {
  // l'urto della Terra com'è andato: 60 milioni di anni dopo la nascita del Sole, una luna di 7,35·10²² kg, un giorno di 5 ore
  const URTO = { t: 6e7, giornoDopo: 5 * 3600, luna: { massaKg: LUNA.massaKg, mu: LUNA.massaKg / TERRA.massaKg } }, RH = raggioHill(TERRA);
  for (let s = 1; s <= 40; s++) {
    const u = lune(TERRA, { ...SOLE, urto: URTO }, s).filter((l) => l.origine === 'urto');
    assert.equal(u.length, 1, `seme ${s}`); const l = u[0];
    assert.equal(l.massaKg, LUNA.massaKg); assert.equal(l.giornoInizialePianeta, 5 * 3600);
    tra(l.aM / 1e8, 2.8, 5, 'distanza oggi (centinaia di migliaia di km: 3,84)');
    tra(l.giornoPianeta / 3600, 12, 40, 'il giorno della Terra oggi, frenata dalla Luna (ore: 24)');
    assert.ok(l.bloccata && l.forma.rotonda && l.stato === 'fredda e ferma' && l.aM < 0.4 * RH && l.periodo > l.giornoPianeta);
    // il pianeta non ha avuto urti giganti, o l'urto non ha lasciato un disco: nessuna luna da urto, qualunque sia il seme
    assert.ok(!lune(TERRA, { ...SOLE, urto: null }, s).some((x) => x.origine === 'urto'));
    assert.ok(!lune(TERRA, { ...SOLE, urto: { ...URTO, luna: null } }, s).some((x) => x.origine === 'urto'));
    assert.ok(!lune({ ...TERRA, bloccato: true }, { ...SOLE, urto: URTO }, s).some((x) => x.origine === 'urto'), 'un pianeta bloccato la perde lo stesso');
    assert.ok(!lune(GIOVE, { ...SOLE, urto: URTO }, s).some((x) => x.origine === 'urto'), 'un gigante non ha lune da urto');
  }
  const una = (urto, P = TERRA) => lune(P, { ...SOLE, urto }, 1).find((l) => l.origine === 'urto');
  // le maree lavorano da quando la luna è nata: un urto recente, una luna ancora vicina e un giorno ancora corto
  const vecchia = una(URTO), giovane = una({ ...URTO, t: 4.4e9 });
  assert.ok(giovane.aM < 0.75 * vecchia.aM && giovane.giornoPianeta < vecchia.giornoPianeta, `${giovane.aM} contro ${vecchia.aM}`);
  assert.ok(Math.abs(vecchia.aM - orbitaDopoLeMaree(TERRA, LUNA.massaKg, 1.2 * limiteRoche(TERRA, vecchia.densita), 4.5e9 - 6e7)) < 1e-6 * vecchia.aM);
  // una luna più pesante frena di più il pianeta; una molto pesante lo ferma: girano faccia a faccia, il mese lungo quanto il giorno
  const pesante = una({ ...URTO, luna: { massaKg: 3 * LUNA.massaKg } }), doppio = una({ ...URTO, luna: { massaKg: 0.1 * TERRA.massaKg } });
  assert.ok(pesante.giornoPianeta > vecchia.giornoPianeta && Math.abs(doppio.periodo / doppio.giornoPianeta - 1) < 1e-3, `mese ${doppio.periodo}, giorno ${doppio.giornoPianeta}`);
  // se dopo l'urto il pianeta gira più piano di quanto la luna orbita appena nata, la luna ricade
  assert.equal(una({ ...URTO, giornoDopo: 30 * 3600 }), undefined);
  // lo stesso ingresso dà lo stesso risultato
  assert.equal(JSON.stringify(lune(TERRA, { ...SOLE, urto: URTO }, 5)), JSON.stringify(lune(TERRA, { ...SOLE, urto: URTO }, 5)));
  console.log(`      (la Luna dall'urto vero: oggi a ${(vecchia.aM / 1e6).toFixed(0)} mila km, giorno della Terra ${(vecchia.giornoPianeta / 3600).toFixed(1)} ore; con una luna di un decimo del pianeta: mese e giorno di ${(doppio.periodo / 86400).toFixed(1)} giorni terrestri)`);
});

// ---------- IL CASO PER INDIRIZZO (eventi.js): ogni esito incerto delle lune è un evento con il suo nome
const lette = (P, stella, radice, rami = null) => { const R = new Map(), L = lune(P, stella, conRegistro(sorgente(radice, rami), R)); return { R, L }; };
const diversi = (A, B) => [...A.keys()].filter((k) => B.has(k) && B.get(k) !== A.get(k));
// le lune per nome (il nome sotto cui stanno i loro eventi), senza ciò che dipende dal posto in fila (il numero d'ordine)
const perNome = (L) => new Map(L.map((l) => [l.evento, JSON.stringify({ ...l, id: 0, risonanza: l.risonanza && l.risonanza.replace(/\d+/g, 'N') })]));

prova('un ramo cambia una cosa sola: una luna catturata con un\'altra orbita, e tutte le altre lune restano com\'erano', () => {
  let casi = 0, sparite = 0;
  for (let n = 1; n <= 60; n++) {
    const radice = `prova/pianeta ${n}/lune`, { R: R0, L: L0 } = lette(GIOVE, SOLE, radice), prese = L0.filter((l) => l.origine === 'cattura'); if (!prese.length) continue;
    const quella = prese[n % prese.length], ev = `${radice}/${quella.evento}/eccentricità`, { R: R1, L: L1 } = lette(GIOVE, SOLE, radice, { [ev]: 1 });
    // un solo evento è andato diversamente; nessun altro è stato ritirato
    assert.deepEqual(diversi(R0, R1), [ev], `seme ${n}`);
    // tutte le altre lune sono identiche (massa, orbita, forma, calore, stato); quella ha un'altra eccentricità e ciò che ne
    // discende (il calore delle maree, lo stato), oppure non c'è più: con quell'orbita passava troppo vicino a una luna grande
    const A = perNome(L0), B = perNome(L1);
    for (const [nome, f] of A) if (nome !== quella.evento) assert.equal(B.get(nome), f, `seme ${n}: ${nome}`);
    const dopo = L1.find((l) => l.evento === quella.evento);
    if (!dopo) { sparite++; assert.equal(L1.length, L0.length - 1); continue; }
    assert.equal(L1.length, L0.length); assert.notEqual(dopo.eccentricita, quella.eccentricita);
    for (const k of ['origine', 'massaKg', 'raggioM', 'densita', 'aM', 'periodo', 'retrograda']) assert.equal(dopo[k], quella[k], `seme ${n}: ${k}`);
    assert.deepEqual(dopo.forma, quella.forma); assert.deepEqual(dopo.composizione, quella.composizione);
    casi++;
  }
  assert.ok(casi >= 30, `solo ${casi} casi`);
  console.log(`      (${casi} lune catturate con un'altra eccentricità: le altre lune identiche; ${sparite} in quel mondo non ci sono)`);
});

prova('eventi che stanno prima: un\'altra fascia sposta le lune del disco da lì in fuori; un\'altra sorte toglie o dà la luna a una Terra; il resto non è ritirato', () => {
  let casi = 0, interneUguali = 0;
  for (let n = 1; n <= 30; n++) {
    const radice = `prova/pianeta ${n}/lune`, { R: R0, L: L0 } = lette(GIOVE, SOLE, radice), reg = L0.filter((l) => l.origine === 'disco'); if (reg.length < 3) continue;
    const ev = `${radice}/disco/luna 1/fascia`, { R: R1, L: L1 } = lette(GIOVE, SOLE, radice, { [ev]: 1 });
    assert.deepEqual(diversi(R0, R1), [ev], `seme ${n}`); casi++;
    // la fascia della seconda luna è più larga o più stretta: la sua massa cambia; la prima, nata prima, ha la stessa massa
    const una = (L, nome) => L.find((l) => l.evento === nome);
    assert.notEqual(una(L1, 'disco/luna 1').massaKg, una(L0, 'disco/luna 1').massaKg); assert.equal(una(L1, 'disco/luna 0').massaKg, una(L0, 'disco/luna 0').massaKg);
    if (una(L1, 'disco/luna 0').aM === una(L0, 'disco/luna 0').aM) interneUguali++;
    // le catturate che ci sono in tutti e due i mondi sono le stesse (stanno lontano, per conto loro)
    const A = perNome(L0), B = perNome(L1); for (const [nome, f] of A) if (nome.startsWith('cattura') && B.has(nome)) assert.equal(B.get(nome), f);
  }
  assert.ok(casi >= 15, `solo ${casi} casi`);
  // una Terra senza urto vero: «urto/sorte» decide se la luna c'è
  let con = 0, senza = 0;
  for (let n = 1; n <= 40; n++) {
    const radice = `prova/terra ${n}/lune`, ev = `${radice}/urto/sorte`, a = lette(TERRA, SOLE, radice); let b = null;
    for (let r = 1; r <= 8 && !b; r++) { const m = lette(TERRA, SOLE, radice, { [ev]: r }); if (m.L.some((l) => l.origine === 'urto') !== a.L.some((l) => l.origine === 'urto')) b = m; }
    assert.ok(b, `seme ${n}: in otto rami la sorte non cambia mai`); assert.deepEqual(diversi(a.R, b.R), [ev]);
    if (a.L.some((l) => l.origine === 'urto')) con++; else senza++;
    // (le catturate che ci sono in tutti e due i mondi sono le stesse; la luna grande, dove c'è, può aver spazzato via quelle che le passavano vicino)
    const A = perNome(a.L), B = perNome(b.L); for (const [nome, f] of A) if (nome.startsWith('cattura') && B.has(nome)) assert.equal(B.get(nome), f, `seme ${n}: ${nome}`);
  }
  assert.ok(con >= 8 && senza >= 8, `${con} con la luna, ${senza} senza`);
  console.log(`      (${casi} giganti: in ${interneUguali} la luna più interna resta anche alla stessa distanza; ${con} Terre con la luna e ${senza} senza: la sorte le scambia)`);
});

prova('l\'ordine non conta: pianeti calcolati all\'indietro, eventi riletti all\'indietro; i nomi degli eventi sono quelli dichiarati', () => {
  const pianeti = Array.from({ length: 24 }, (_, n) => ({ P: n % 3 ? { ...GIOVE, massaKg: GIOVE.massaKg * (0.3 + 0.1 * n), id: n } : { ...TERRA, id: n }, radice: `prova/stella ${n >> 2}/pianeta ${n}/lune` }));
  const avanti = pianeti.map(({ P, radice }) => JSON.stringify(lune(P, SOLE, sorgente(radice))));
  const indietro = pianeti.slice().reverse().map(({ P, radice }) => JSON.stringify(lune(P, SOLE, sorgente(radice)))).reverse();
  assert.deepEqual(indietro, avanti);
  const nomi = new Set();
  for (const [P, radice] of [[GIOVE, 'prova/pianeta 3/lune'], [GIOVE, 'prova/pianeta 4/lune'], [TERRA, 'prova/terra 5/lune'], [TERRA, 'prova/terra 6/lune']]) {
    const { R } = lette(P, SOLE, radice), voci = [...R.keys()]; assert.ok(voci.length >= 4, `${voci.length} eventi`);
    for (const v of voci.slice().reverse()) assert.equal(rileggi(v), R.get(v), v);
    for (const v of voci) nomi.add(v.slice(radice.length + 1).replace(/\d+/g, 'N').replace(/#N$/, ''));
  }
  const dichiarati = ['disco/massa', 'disco/bordo interno', 'disco/bordo esterno', 'disco/larghezza delle fasce', 'disco/luna N/fascia', 'disco/luna N/eccentricità', 'urto/sorte', 'urto/massa', 'urto/eccentricità',
    'catture/quante', 'cattura N/raggio', 'cattura N/distanza', 'cattura N/verso', 'cattura N/eccentricità', 'disco/luna N/forma', 'urto/luna/forma', 'cattura N/forma'];
  for (const n of nomi) assert.ok(dichiarati.includes(n), `evento «${n}»`);
  // un numero al posto della sorgente è «lune numero/pianeta id»
  assert.equal(JSON.stringify(lune({ ...GIOVE, id: 2 }, SOLE, 7)), JSON.stringify(lune({ ...GIOVE, id: 2 }, SOLE, sorgente('lune 7/pianeta 2'))));
});

prova('nel cosmo: il ramo di un evento del disco o di una luna, scritto tra i rami del cosmo, cambia quella cosa sola e ciò che ne discende', () => {
  const pianetiDi = (S) => S.pianeti.map((p) => JSON.stringify([p.aM, p.massaKg, p.raggioM, p.tipo, p.composizione])), luneDi = (p) => JSON.stringify(p.lune.map((l) => ({ ...l, id: 0 })));
  let dischi = 0, catture = 0;
  for (let n = 1; n < 60000 && (dischi < 6 || catture < 6); n += 191) {
    const a = indirizzoDi(n), S0 = sistema(a.cosmo, a.galassia, a.stella), stella = `cosmo ${a.cosmo}/galassia ${a.galassia}/stella ${a.stella}`; if (S0.pianeti.length < 3) continue;
    const accanto = (c) => JSON.stringify(sistema(c, a.galassia, (a.stella + 1) % 2500).pianeti.map((p) => [p.aM, p.massaKg, p.eccentricita, luneDi(p)]));
    if (dischi < 6) { // l'eccentricità di oggi di un pianeta (un evento del disco): stessi pianeti, stesse orbite, stesse masse; un'altra eccentricità per lui
      const k = 1, ev = `${stella}/disco/embrione ${S0.pianeti[k].formazione.embrione}/eccentricità`, c1 = cosmoCon(a.cosmo, { [ev]: 1 }), S1 = sistema(c1, a.galassia, a.stella);
      assert.deepEqual(pianetiDi(S1), pianetiDi(S0), ev); assert.notEqual(S1.pianeti[k].eccentricita, S0.pianeti[k].eccentricita, ev);
      S0.pianeti.forEach((p, i) => { if (Math.abs(i - k) > 1) { assert.equal(S1.pianeti[i].eccentricita, p.eccentricita); assert.equal(luneDi(S1.pianeti[i]), luneDi(p)); } });
      assert.equal(accanto(c1), accanto(a.cosmo)); dischi++;
    }
    const q = S0.pianeti.find((p) => p.lune.some((l) => l.origine === 'cattura'));
    if (q && catture < 6) { // l'orbita di una luna catturata: gli stessi pianeti, le stesse altre lune
      const quella = q.lune.find((l) => l.origine === 'cattura'), ev = `${stella}/pianeta ${q.id}/lune/${quella.evento}/eccentricità`, c1 = cosmoCon(a.cosmo, { [ev]: 1 }), S1 = sistema(c1, a.galassia, a.stella);
      assert.deepEqual(S1.pianeti.map((p) => JSON.stringify([p.aM, p.massaKg, p.eccentricita, p.giorno])), S0.pianeti.map((p) => JSON.stringify([p.aM, p.massaKg, p.eccentricita, p.giorno])), ev);
      S0.pianeti.forEach((p, i) => { if (p !== q) assert.equal(luneDi(S1.pianeti[i]), luneDi(p), `${ev}: le lune del pianeta ${i}`); });
      const dopo = S1.pianeti[q.id].lune.find((l) => l.evento === quella.evento); assert.ok(!dopo || dopo.eccentricita !== quella.eccentricita, ev);
      for (const l of q.lune) if (l !== quella) { const m = S1.pianeti[q.id].lune.find((x) => x.evento === l.evento); assert.equal(JSON.stringify({ ...m, id: 0 }), JSON.stringify({ ...l, id: 0 }), `${ev}: la luna ${l.evento}`); }
      assert.equal(accanto(c1), accanto(a.cosmo)); catture++;
    }
    // il ramo del corso intero («lune/galassia/stella/pianeta», come sempre) le cambia tutte, e solo quelle di quel pianeta
    if (q && catture === 1) { const c2 = cosmoRamo(a.cosmo, `lune/${a.galassia}/${a.stella}/${q.id}`, 1), S2 = sistema(c2, a.galassia, a.stella); assert.notEqual(luneDi(S2.pianeti[q.id]), luneDi(q)); S0.pianeti.forEach((p, i) => { if (p !== q) assert.equal(luneDi(S2.pianeti[i]), luneDi(p)); }); }
  }
  assert.ok(dischi >= 6 && catture >= 6, `${dischi} sistemi, ${catture} lune catturate`);
  console.log(`      (${dischi} sistemi con l'eccentricità di un pianeta andata diversamente, ${catture} con l'orbita di una luna catturata: il resto del sistema e la stella accanto identici)`);
});

console.log(`\n${ok} prove superate${nonTorna.length ? `; ${nonTorna.length} riscontri col vero NON TORNANO:` : ''}`); for (const r of nonTorna) console.log(`   ≠ ${r}`);
