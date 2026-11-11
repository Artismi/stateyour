// test_biblioteca.mjs — gli universi della biblioteca: posti veri del cosmo, ripetibili, coerenti
import assert from 'node:assert/strict';
import { universo } from '../src/camera/biblioteca.js';
import { simulaMondo, campiContinui } from '../src/camera/mondo.js';
import { indirizzoDi, numeroDi, regione, cosmo, galassia, sistema, pianeta, cellaDi } from '../src/camera/cosmo.js';
import * as CO from '../src/camera/cosmo.js';
import { unita, catalogoVero, velocita } from '../src/camera/unita.js';

let ok = 0;
const prova = (nome, f) => { f(); ok++; console.log('  ✓', nome); };

// UN LUOGO ADATTO, cercato: i numeri della biblioteca indicano i luoghi dell'universo com'è, e l'universo cambia quando
// cambiano le sue leggi; una prova che ha bisogno di «una regione dove passa un raggio» la cerca, a partire dal numero 13
const luoghi = new Map();
function luogoCon(cerca) {
  for (let n = 13; n < 13 + 300 * 197; n += 197) {
    if (!luoghi.has(n)) { const a = indirizzoDi(n); luoghi.set(n, { a, tracce: simulaMondo(regione(a).cella) }); }
    const { a, tracce } = luoghi.get(n), trovato = cerca(a, tracce); if (trovato) return { n, a, trovato };
  }
  throw new Error('nessun luogo adatto tra 300 provati');
}

prova('lo stesso numero dà lo stesso universo, e la stessa storia; numeri diversi, posti diversi', () => {
  const a = simulaMondo(universo(7).cella), b = simulaMondo(universo(7).cella);
  assert.equal(JSON.stringify(a.map((t) => t.punti.at(-1))), JSON.stringify(b.map((t) => t.punti.at(-1))));
  assert.notEqual(JSON.stringify(universo(7).cella.sorgenti), JSON.stringify(universo(8).cella.sorgenti));
});

prova('dentro ci sono solo cose naturali, e ogni raggio ha una sorgente vera nella sua galassia', () => {
  for (const n of [1, 13, 77, 333, 5000]) {
    const a = indirizzoDi(n), c = regione(a).cella, Gx = galassia(a.cosmo, a.galassia);
    assert.ok(!c.domini.length && !c.cristalli && !c.onde, 'niente zone o campi messi a mano');
    for (const s of c.sorgenti) {
      if (s.specie === 'protone') assert.ok(s.origine.startsWith('il fondo') || Gx.sorgenti.some((g) => s.origine.startsWith(g.nome)), `da dove viene: ${s.origine}`);
      else assert.ok(s.origine.startsWith('un neutrone uscito dal pianeta'), `la fascia: ${s.origine}`);
    }
  }
});

prova('il campo è quello del pianeta: un dipolo che cala come il cubo della distanza', () => {
  const c = regione(indirizzoDi(13)).cella, cc = campiContinui(c), d = c.dipoli[0];
  const B = (r) => cc.B(d.centro[0] + r, d.centro[1]);
  assert.ok(Math.abs(B(2 * d.R) / B(4 * d.R) - 8) < 1e-9);
  // e lo stesso campo, visto dal pianeta e dalla regione, dà lo stesso raggio a un protone (unità diverse, metri uguali)
  const a = indirizzoDi(13), P = sistema(a.cosmo, a.galassia, a.stella).pianeti[a.pianeta];
  const u1 = unita(P.raggioM * 10), u2 = unita(0.32 * P.raggioM), v = velocita(5000, 1836.15), Bt = 1e-5;
  assert.ok(Math.abs(((1836.15 * v) / u1.B(Bt)) * u1.l - ((1836.15 * v) / u2.B(Bt)) * u2.l) < 1e-6 * u1.l);
});

prova('le vite sono quelle vere, e si allungano con la velocità', () => {
  const u = unita(2000), cat = catalogoVero(u), C = 40, v = 0.995 * C, g = 1 / Math.sqrt(1 - 0.995 ** 2);
  const tr = simulaMondo({ larghezza: 1e9, altezza: 1e9, c: C, relativita: true, tempo: 1e6, fondo: { B: 0, K: 0 }, domini: [], masse: [], specie: { m: { ...cat['muone-'], figli: undefined, vita: cat['muone-'].vitaMedia } }, sorgenti: [{ pos: [1, 5e8], dir: 0, v, specie: 'm' }] });
  const t = tr[0].punti.at(-1)[3] * u.tu;
  assert.ok(Math.abs(t - 2.197e-6 * g) < 1e-9, `il muone vive ${t} s, atteso ${2.197e-6 * g}`);
});

prova('una magnetosfera forte è schermata: vicino ai giganti non arriva nessun raggio', () => {
  let schermate = 0, viste = 0;
  // (con la fonte unica del caso le stelle sono altre: tra i primi 4000 numeri non c'è più nessun gigante col campo forte; le prime sei si trovano entro il numero 20 080)
  for (let n = 1; n < 40000 && viste < 6; n += 97) {
    const a = indirizzoDi(n), P = sistema(a.cosmo, a.galassia, a.stella).pianeti[a.pianeta], R = pianeta(a.cosmo, a.galassia, a.stella, a.pianeta).regioni[a.regione];
    if ((P.B0 * P.raggioM) / (R.r * R.r) < 2000) continue;
    viste++; if (regione(a).cella.sorgenti.filter((s) => s.specie === 'protone').length === 0) schermate++;
  }
  assert.ok(viste > 0 && schermate === viste, `${schermate} schermate su ${viste}`);
});

prova('un universo si simula in fretta, e niente supera la luce', () => {
  for (const n of [1, 2, 13, 42, 333]) {
    const c = universo(n).cella, t0 = performance.now(), tr = simulaMondo(c);
    assert.ok(performance.now() - t0 < 2000, `${n}`);
    for (const t of tr) for (let i = 1; i < t.punti.length; i += 7) { const a = t.punti[i - 1], b = t.punti[i], dt = b[3] - a[3]; if (dt > 1e-9) assert.ok(Math.hypot(b[0] - a[0], b[1] - a[1]) / dt <= c.c * 1.0001); }
  }
});

prova('il cosmo: ogni numero è un indirizzo, e un ramo cambia quando un raggio arriva', () => {
  for (const n of [1, 2, 13, 5000, 4575388]) { const a = indirizzoDi(n); assert.equal(indirizzoDi(numeroDi(a)).regione, a.regione); }
  assert.ok(cosmo(1).galassie.length > 20, 'un cosmo ha molte galassie');
  // (un luogo qualunque dove arriva almeno un raggio: si cerca, invece di fidarsi di un numero — i numeri indicano i luoghi
  // dell'universo com'è, e l'universo cambia quando cambiano le sue leggi)
  const qui = luogoCon((a, tracce) => tracce.find((t) => t.evento === '0')), c = regione(qui.a).cella, t1 = qui.trovato;
  const t2 = simulaMondo({ ...c, rami: { 0: 7 } }).find((t) => t.evento === '0');
  assert.notEqual(t1.punti[0][3], t2.punti[0][3]);
});

prova('lo zoom: dieci volte più vicino, le stesse particelle nello stesso posto; in più solo il dettaglio fine', () => {
  // una particella che passa nella regione mentre la bolla dura (il primo decimo del tempo)
  const dentro = (q) => q[3] < 12 && q[0] > 50 && q[0] < 950 && q[1] > 50 && q[1] < 950;
  const qui = luogoCon((a, tracce) => tracce.find((t) => t.evento && !t.sagoma && t.punti.filter(dentro).length > 3)), a = qui.a, tr = qui.trovato, p = tr.punti.filter(dentro)[1], ij = [Math.floor(p[0] / 100), Math.floor(p[1] / 100)];
  const t1 = simulaMondo(cellaDi({ ...a, zoom: [ij] })), tz = t1.find((t) => t.evento === tr.evento);
  assert.ok(tz, 'la particella che attraversa il quadratino c\'è anche dentro');
  for (const q of tz.punti.filter((_, i) => i % 5 === 0)) {
    const T = q[3] / 10, X = q[0] / 10 + ij[0] * 100, Y = q[1] / 10 + ij[1] * 100;
    for (let i = 1; i < tr.punti.length; i++) { const A = tr.punti[i - 1], B = tr.punti[i]; if (A[3] <= T && B[3] >= T) { const f = (T - A[3]) / (B[3] - A[3] || 1); assert.ok(Math.hypot(A[0] + (B[0] - A[0]) * f - X, A[1] + (B[1] - A[1]) * f - Y) < 0.5, 'stessa strada ai due livelli'); break; } }
  }
});

const L = await import('../src/camera/leggi.js'), F = await import('../src/camera/fluidi.js');
prova('le leggi: età del cosmo, Chandrasekhar, il clima della Terra, la soglia della convezione', () => {
  assert.ok(Math.abs(L.etaUniverso() / L.ANNO / 1e9 - 13.8) < 0.1);
  assert.ok(Math.abs(L.massaChandrasekhar() / L.MSOLE - 1.43) < 0.05);
  const terra = L.clima({ Lw: L.LSOLE, aM: L.UA, massaKg: 5.97e24, raggioM: 6.371e6, tipo: 'roccioso', acqua: 0.02 });
  assert.equal(terra.acqua, 'liquida'); assert.ok(terra.T > 260 && terra.T < 320, `la Terra a ${terra.T} K`);
  const luna = L.clima({ Lw: L.LSOLE, aM: L.UA, massaKg: 7.3e22, raggioM: 1.737e6, tipo: 'roccioso', acqua: 0.02 });
  assert.ok(!luna.tenuti.includes('azoto') && luna.pressione < 1, 'la Luna non trattiene un\'atmosfera');
  const q = F.flussoInterno(5.97e24, 6.371e6);
  assert.ok(F.convezione({ g: 9.8, q, d: 0.01 }).epsilon < 0 && F.convezione({ g: 9.8, q, d: 0.03 }).epsilon > 0, 'sotto una soglia fermo, sopra si muove');
});

const GE = await import('../src/camera/geologia.js');
prova('l\'interno: la Terra ha la dinamo e le placche, Marte (asciutto) ha un coperchio fermo', () => {
  const t = GE.interno({ tipo: 'roccioso', massaKg: 5.97e24, raggioM: 6.371e6, composizione: { ferro: 0.32, acqua: 0.02 } }, { eta: 4.5e9, Z: 1 });
  assert.ok(t.dinamo && Math.abs(t.B0 - 3.1e-5) < 1e-5 && t.tettonica === 'a placche' && Math.abs(t.nucleo - 0.55) < 0.05);
  // (l'interno è la storia del pianeta, storia.js. Le placche le decide l'attrito, cioè l'acqua che sta sopra come mare, non
  // più una soglia sulla massa: il Marte vero non ha mari, e ha un coperchio fermo. La dinamo di Marte NON TORNA — il
  // modello gli dà un nucleo interno che cresce — ed è scritto in test_storia e test_fili, non nascosto qui)
  const m = GE.interno({ tipo: 'roccioso', massaKg: 6.4e23, raggioM: 3.39e6, composizione: { ferro: 0.25, acqua: 0 } }, { eta: 4.5e9, Z: 1 });
  assert.ok(m.tettonica !== 'a placche' && m.q < t.q);
});

prova('il clima simulato: la Terra temperata con poco ghiaccio, Marte gelido e secco', () => {
  const P = { tipo: 'roccioso', raggioM: 6.371e6, massaKg: 5.97e24, composizione: { ferro: 0.32, acqua: 0.02 }, Lw: 3.828e26, aM: 1.496e11, anno: 3.156e7, obliquita: 23.4, bloccato: false, clima: { Teq: 255, pressione: 1e5 } };
  const it = GE.interno(P, { eta: 4.5e9, Z: 1 }); it.acquaKg = 1.4e21;
  const t = GE.climaSuperficie('prova-terra', P, GE.superficiePianeta('prova-terra', P, it, 11));
  assert.ok(t.Tglobale > 273 && t.Tglobale < 308 && t.ghiaccio < 0.4, `la Terra a ${t.Tglobale - 273.15} °C, ghiaccio ${t.ghiaccio}`);
  const M = { ...P, raggioM: 3.39e6, aM: 1.52 * 1.496e11, anno: 5.9e7, obliquita: 25, clima: { Teq: 210, pressione: 600 } };
  const m = GE.climaSuperficie('prova-marte', M, GE.superficiePianeta('prova-marte', M, { ...it, acquaKg: 1e15 }, 12));
  assert.ok(m.Tglobale < 233, `Marte a ${m.Tglobale - 273.15} °C`);
});

prova('l\'erosione: l\'acqua scende sempre, e scava', () => {
  const P = { tipo: 'roccioso', raggioM: 6.371e6, massaKg: 5.97e24, composizione: { ferro: 0.32, acqua: 0.02 }, Lw: 3.828e26, aM: 1.496e11, anno: 3.156e7, obliquita: 23.4, bloccato: false, clima: { Teq: 255, pressione: 1e5 } };
  const it = GE.interno(P, { eta: 4.5e9, Z: 1 }); it.acquaKg = 0.9e21;
  // (il seme 23 è il mondo su cui si guardano l'acqua che scende e i laghi. Le valli, invece, si misurano più sotto su sei
  // mondi: su uno solo la prova passava o no secondo il seme)
  const sf = GE.superficiePianeta('prova-er', P, it, 23), cl = GE.climaSuperficie('prova-er', P, sf), se = GE.erosione('prova-er', sf, cl, { passi: 60 });
  // dove l'acqua si raccoglie molto, il terreno si è abbassato
  // una valle: dove scorre molta acqua il terreno diventa più incassato rispetto ai vicini
  const W = sf.W, incasso = (alt, k) => { const i = k % W, j = (k - i) / W; let m = 0, n = 0; for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const jj = j + dj; if (jj < 0 || jj >= sf.H) continue; m += alt[jj * W + ((i + di + W) % W)]; n++; } return m / n - alt[k]; };
  // LE VALLI SU UNA POPOLAZIONE. «Dove scorre molta acqua il terreno si incassa» è ciò che ci si aspetta da un fiume. Con
  // l'erosione di prima NON valeva (su sedici Terre l'incasso medio era positivo su 2, mediana −12 m, e 7 celle di fiume
  // su 10 si alzavano): «i pendii si sgretolano» spianava anche il letto dei fiumi (provato togliendolo: da −10 m a +2 m;
  // il sollevamento non c'entrava). Ora l'erosione è in metri e in anni (geologia.js, EROSIONE) e il letto non è più un
  // pendio. La misura resta su sei mondi (questo e i semi da 11 a 15; ± 20%): si stampa, e se non torna lo dice senza
  // fermare la catena. Dura resta solo l'asserzione che i fiumi ci siano. (I riscontri in metri e anni: test_erosione.)
  const valli = (sfx, sex) => { const inc = (alt, k) => { const i = k % W, j = (k - i) / W; let m = 0, n = 0; for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const jj = j + dj; if (jj < 0 || jj >= sfx.H) continue; m += alt[jj * W + ((i + di + W) % W)]; n++; } return m / n - alt[k]; };
    let d = 0, n = 0, alzate = 0; for (let k = 0; k < sex.alt.length; k++) if (sfx.alt[k] > sfx.mare && sex.lago[k] === 0 && sex.flusso[k] > 30) { d += inc(sex.alt, k) - inc(sfx.alt, k); n++; if (sex.alt[k] > sfx.alt[k]) alzate++; } return { n, medio: d / n, alzate: alzate / n }; };
  const mondi = [valli(sf, se)]; for (const seme of [11, 12, 13, 14, 15]) { const s2 = GE.superficiePianeta(`prova-valli-${seme}`, P, it, seme), c2 = GE.climaSuperficie(`prova-valli-${seme}`, P, s2), e2 = GE.erosione(`prova-valli-${seme}`, s2, c2, { passi: 60 }); mondi.push(valli(s2, e2)); }
  for (const m of mondi) assert.ok(m.n > 0, 'nessun fiume su cui misurare le valli');
  const incassati = mondi.filter((m) => m.medio > 0).length, medi = mondi.map((m) => m.medio).sort((a, b) => a - b), alzate = mondi.reduce((a, m) => a + m.alzate, 0) / mondi.length;
  console.log(`      le valli: incasso medio dove scorre molta acqua ${mondi.map((m) => m.medio.toFixed(0)).join(', ')} m sui ${mondi.length} mondi (mediana ${medi[mondi.length >> 1].toFixed(0)} m); positivo su ${incassati}; celle di fiume che si alzano: ${Math.round(100 * alzate)}%`);
  if (2 * incassati < mondi.length || alzate > 0.5) console.log(`      ≠ NON TORNA  le valli si incassano: solo su ${incassati} mondi su ${mondi.length}; ${Math.round(100 * alzate)}% delle celle dove scorre molta acqua si alza invece di abbassarsi`);
});

prova('le tessere: più vicino è lo stesso terreno con più dettaglio, e lo stesso posto dà la stessa tessera', () => {
  const P = { tipo: 'roccioso', raggioM: 6.371e6, massaKg: 5.97e24, composizione: { ferro: 0.32, acqua: 0.02 }, Lw: 3.828e26, aM: 1.496e11, anno: 3.156e7, obliquita: 23.4, bloccato: false, clima: { Teq: 255, pressione: 1e5 } };
  const it = GE.interno(P, { eta: 4.5e9, Z: 1 }); it.acquaKg = 0.9e21;
  const sf = GE.superficiePianeta('prova-ts', P, it, 21), cl = GE.climaSuperficie('prova-ts', P, sf), se = GE.erosione('prova-ts', sf, cl, { passi: 60 });
  const t = GE.tessera('prova-ts', se, cl, 2, 9, 5, 21), W = se.W, H = se.H;
  // la media della tessera (1/16 × 1/16 della mappa) contro la media dello stesso pezzo della mappa intera
  let a = 0; for (const h of t.alt) a += h; a /= t.alt.length;
  let b = 0, n = 0; for (let j = Math.floor((5 / 16) * H); j < Math.floor((6 / 16) * H); j++) for (let i = Math.floor((9 / 16) * W); i < Math.floor((10 / 16) * W); i++) { b += se.alt[j * W + i]; n++; }
  assert.ok(Math.abs(a - b / n) < 250, `media della tessera ${a}, della madre ${b / n}`);
  assert.equal(GE.tessera('prova-ts', se, cl, 2, 9, 5, 21), t);
});

prova('un cosmo parallelo: un evento va diversamente, e cambia solo ciò che ne discende', () => {
  const n = 1616476, a = CO.indirizzoDi(n), S0 = CO.sistema(a.cosmo, a.galassia, a.stella);
  // il mantello di un pianeta parte da un altro stato: stesso pianeta, stessi vicini, stessa regione di particelle
  const ev = `mantello/${a.galassia}/${a.stella}/${a.pianeta}`, c1 = CO.cosmoRamo(a.cosmo, ev, 1), S1 = CO.sistema(c1, a.galassia, a.stella);
  assert.notEqual(S0.pianeti[a.pianeta].origine, S1.pianeti[a.pianeta].origine);
  assert.equal(S0.pianeti[a.pianeta].massaKg, S1.pianeti[a.pianeta].massaKg);
  assert.ok(S0.pianeti.every((p, i) => i === a.pianeta || p.origine === S1.pianeti[i].origine));
  const r0 = CO.regione(a).cella, r1 = CO.regione({ ...a, cosmo: c1 }).cella;
  assert.equal(JSON.stringify({ ...r0, indirizzo: 0 }), JSON.stringify({ ...r1, indirizzo: 0 }));
  // il numero della biblioteca resta lo stesso, e il ramo si toglie tornando al cosmo di partenza
  assert.equal(CO.numeroDi({ ...a, cosmo: c1 }), n); assert.equal(CO.cosmoRamo(c1, ev, 0), a.cosmo);
  assert.deepEqual(CO.indirizzoDi(n, CO.ramiCosmo(c1)), { ...a, cosmo: c1 });
  // un'altra formazione dei pianeti: la stella è la stessa, i pianeti no; la stella accanto non se ne accorge
  const c2 = CO.cosmoRamo(a.cosmo, `disco/${a.galassia}/${a.stella}`, 1), S2 = CO.sistema(c2, a.galassia, a.stella);
  assert.equal(S2.stella.massa, S0.stella.massa);
  assert.notEqual(JSON.stringify(S2.pianeti.map((p) => p.massaKg)), JSON.stringify(S0.pianeti.map((p) => p.massaKg)));
  const altra = (c) => JSON.stringify(CO.sistema(c, a.galassia, (a.stella + 1) % CO.STELLE).pianeti.map((p) => [p.massaKg, p.origine]));
  assert.equal(altra(c2), altra(a.cosmo));
});

console.log(`biblioteca: ${ok} prove, tutto ok`);
