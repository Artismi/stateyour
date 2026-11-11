// test_rocce.mjs — sotto la cella di terreno: cristalli, fiocchi, granelli, crepe. Che emergano come in natura.
import assert from 'node:assert/strict';
import { cristallizza, fioccoDiNeve, sedimento, fratture, immagine, nakaya, sottoraffreddamento, GRANITO, BASALTO, VETRO } from '../src/camera/rocce.js';

let ok = 0;
const prova = (nome, f) => { f(); ok++; console.log('  ✓', nome); };
const N = 192;
const crono = (f) => { const t = performance.now(), r = f(); return [r, performance.now() - t]; };

// la legge di Avrami X = 1 − exp(−k·tⁿ) è una retta in carta doppio-logaritmica: ln(−ln(1−X)) = ln k + n·ln t
function avrami(X) {
  let sx = 0, sy = 0, sxx = 0, sxy = 0, syy = 0, n = 0;
  X.forEach((x, i) => { if (x > 0.05 && x < 0.9) { const a = Math.log(i + 1), b = Math.log(-Math.log(1 - x)); sx += a; sy += b; sxx += a * a; sxy += a * b; syy += b * b; n++; } });
  const cov = n * sxy - sx * sy;
  return { n: cov / (n * sxx - sx * sx), r2: (cov * cov) / ((n * sxx - sx * sx) * (n * syy - sy * sy)), punti: n };
}

prova('cristalli: più lento è il raffreddamento, più grandi i cristalli (granito, basalto, e il vetro in fondo)', () => {
  for (const seme of [1, 7, 42]) {
    const lento = cristallizza({ N, raffreddamento: 0.002, seme }), medio = cristallizza({ N, raffreddamento: 0.02, seme }), rapido = cristallizza({ N, raffreddamento: 0.2, seme });
    assert.ok(lento.granoMedio > 1.5 * medio.granoMedio && medio.granoMedio > 1.5 * rapido.granoMedio, `grani ${lento.granoMedio} > ${medio.granoMedio} > ${rapido.granoMedio}`);
    assert.ok(lento.nGrani < medio.nGrani && medio.nGrani < rapido.nGrani);
    for (const c of [lento, medio, rapido]) assert.ok(c.cristallino > 0.99, 'sotto la velocità critica solidifica tutto');
    if (seme === 1) console.log(`      grano medio (celle): lento ${lento.granoMedio.toFixed(1)}, medio ${medio.granoMedio.toFixed(1)}, rapido ${rapido.granoMedio.toFixed(1)}; cristalli ${lento.nGrani}, ${medio.nGrani}, ${rapido.nGrani}`);
  }
  // il sottoraffreddamento a cui i cristalli decollano cresce con la fretta
  assert.ok(sottoraffreddamento(0.002) < sottoraffreddamento(0.02) && sottoraffreddamento(0.02) < sottoraffreddamento(0.2));
  // oltre la velocità critica non fa in tempo: vetro, quasi nessun cristallo
  const vetro = cristallizza({ N, raffreddamento: 2, seme: 1 }), quasi = cristallizza({ N, raffreddamento: 0.7, seme: 1 });
  assert.ok(vetro.cristallino < 0.02 && vetro.vetro > 0.98 && vetro.minerale.every((m) => m === VETRO) && vetro.grano.every((g) => g === -1));
  assert.ok(quasi.cristallino > 0 && quasi.cristallino < 0.5 && quasi.granoMedio < 3, `microliti nel vetro: ${quasi.cristallino}`);
});

prova('cristalli: la frazione solida nel tempo segue Avrami, 1 − exp(−k·tⁿ), con n fra 2 e 3,5', () => {
  const visti = [];
  for (const raffreddamento of [0.003, 0.01, 0.03]) for (const minerali of [GRANITO, BASALTO]) for (const seme of [1, 5]) {
    const c = cristallizza({ N, raffreddamento, minerali, seme }), a = avrami(c.frazioneNelTempo);
    assert.ok(a.punti >= 8, 'abbastanza punti per la retta');
    assert.ok(a.n > 2 && a.n < 3.5, `esponente ${a.n}`);
    assert.ok(a.r2 > 0.99, `è davvero una retta: R² ${a.r2}`);
    for (let i = 1; i < c.frazioneNelTempo.length; i++) assert.ok(c.frazioneNelTempo[i] >= c.frazioneNelTempo[i - 1], 'il solido non torna fuso');
    visti.push(a.n);
  }
  console.log(`      esponente di Avrami: fra ${Math.min(...visti).toFixed(2)} e ${Math.max(...visti).toFixed(2)} (in due dimensioni la teoria dà 3)`);
});

prova('cristalli: le proporzioni dei minerali sono quelle della ricetta (entro 0,1), e ogni cella ha il minerale del suo grano', () => {
  let peggio = 0;
  for (const raffreddamento of [0.002, 0.02, 0.2]) for (const minerali of [GRANITO, BASALTO]) for (const seme of [1, 2, 3]) {
    const c = cristallizza({ N, raffreddamento, minerali, seme }), conta = new Array(minerali.length).fill(0);
    for (let i = 0; i < N * N; i++) { assert.equal(c.minerale[i], c.grano[i] < 0 ? VETRO : c.mineraleDelGrano[c.grano[i]]); if (c.grano[i] >= 0) conta[c.minerale[i]]++; }
    minerali.forEach((m, k) => { const e = Math.abs(conta[k] / (N * N) - m.frazione); peggio = Math.max(peggio, e); assert.ok(e < 0.1, `${m.nome}: ${conta[k] / (N * N)} invece di ${m.frazione}`); });
  }
  console.log(`      scarto massimo dalle frazioni richieste: ${peggio.toFixed(3)}`);
  // un cristallo è un pezzo solo: tutte le sue celle si raggiungono senza uscirne
  const c = cristallizza({ N: 96, raffreddamento: 0.01, seme: 4 }), visto = new Uint8Array(96 * 96), pezzi = new Map();
  for (let c0 = 0; c0 < 96 * 96; c0++) {
    if (visto[c0]) continue; const g = c.grano[c0], pila = [c0]; visto[c0] = 1; pezzi.set(g, (pezzi.get(g) || 0) + 1);
    while (pila.length) { const p = pila.pop(), x = p % 96, y = (p - x) / 96; for (const q of [y * 96 + (x + 1) % 96, y * 96 + (x + 95) % 96, ((y + 1) % 96) * 96 + x, ((y + 95) % 96) * 96 + x]) if (!visto[q] && c.grano[q] === g) { visto[q] = 1; pila.push(q); } }
  }
  assert.ok([...pezzi.values()].every((n) => n === 1), 'nessun cristallo in due pezzi');
});

// la figura girata di 60° attorno al centro, confrontata con sé stessa (dentro il cerchio che sta nel quadrato)
function simmetriaASei(f) {
  const c = Math.cos(Math.PI / 3), s = Math.sin(Math.PI / 3); let uguali = 0, tutte = 0, insieme = 0, almenoUna = 0;
  for (let y = 0; y < f.N; y++) for (let x = 0; x < f.N; x++) {
    const dx = x + 0.5 - f.N / 2, dy = y + 0.5 - f.N / 2; if (dx * dx + dy * dy > (f.N / 2 - 2) ** 2) continue;
    const a = f.ghiaccio[y * f.N + x], b = f.ghiaccio[Math.floor(f.N / 2 + s * dx + c * dy) * f.N + Math.floor(f.N / 2 + c * dx - s * dy)];
    tutte++; if (a === b) uguali++; if (a && b) insieme++; if (a || b) almenoUna++;
  }
  return { celle: uguali / tutte, ghiaccio: insieme / almenoUna };
}

prova('fiocco di neve: simmetria a sei, e la forma dipende da temperatura e umidità (Nakaya)', () => {
  const piastra = fioccoDiNeve({ N, T: 258, umidita: 0.88, seme: 1 }), stella = fioccoDiNeve({ N, T: 258, umidita: 0.96, seme: 1 }), dendrite = fioccoDiNeve({ N, T: 258, umidita: 1, seme: 1 });
  for (const f of [piastra, stella, dendrite]) {
    const sim = simmetriaASei(f);
    assert.ok(sim.celle > 0.9, `girato di 60° coincide per ${sim.celle}`);
    assert.ok(sim.ghiaccio > 0.75, `anche contando solo il ghiaccio: ${sim.ghiaccio}`);
    assert.ok(f.ghiaccio.length === N * N && f.raggio > 0.4 * N && f.raggio < 0.5 * N, 'riempie il quadro senza uscirne');
    console.log(`      ${f.forma}: girato di 60° coincide per il ${(100 * sim.celle).toFixed(1)}% delle celle (${(100 * sim.ghiaccio).toFixed(0)}% del ghiaccio), pienezza ${f.pienezza.toFixed(2)}, frastaglio ${f.frastaglio.toFixed(1)}, rami ${f.rami.toFixed(2)}`);
  }
  assert.equal(piastra.forma, 'piastra'); assert.equal(stella.forma, 'stella'); assert.equal(dendrite.forma, 'dendrite');
  assert.ok(piastra.pienezza > stella.pienezza && stella.pienezza > dendrite.pienezza && dendrite.rami > stella.rami);
  // la forma è una proprietà delle condizioni, non del caso: semi diversi, stessa famiglia, disegno diverso
  for (const seme of [2, 3, 4]) { assert.equal(fioccoDiNeve({ N, T: 258, umidita: 1, seme }).forma, 'dendrite'); assert.equal(fioccoDiNeve({ N, T: 258, umidita: 0.96, seme }).forma, 'stella'); assert.equal(fioccoDiNeve({ N, T: 258, umidita: 0.88, seme }).forma, 'piastra'); }
  assert.notDeepEqual(fioccoDiNeve({ N, T: 258, umidita: 1, seme: 2 }).ghiaccio, dendrite.ghiaccio);
  // lontano da −15 °C, anche in piena nube, niente rami; e in aria non satura rispetto al ghiaccio il germe non cresce
  assert.equal(fioccoDiNeve({ N, T: 248, umidita: 1, seme: 1 }).forma, 'piastra');
  assert.equal(fioccoDiNeve({ N, T: 267, umidita: 1, seme: 1 }).forma, 'piastra');
  assert.ok(nakaya(258, 0.8).eccesso < 0 && fioccoDiNeve({ N, T: 258, umidita: 0.8, seme: 1 }).passi === 0);
  // l'eccesso di vapore in una nube è massimo fra −10 e −17 °C (la fisica dietro il diagramma)
  const ecc = (t) => nakaya(273.15 + t, 1).eccesso;
  assert.ok(ecc(-13) > ecc(-3) && ecc(-13) > ecc(-25) && Math.abs(ecc(-15) - 0.22) < 0.03);
});

prova('sedimento: più energia, grana più grossa e peggio selezionata; il tempo lascia le lamine', () => {
  for (const seme of [1, 2, 3]) {
    const limo = sedimento({ N, energia: 0.1, seme }), sabbia = sedimento({ N, energia: 0.35, seme }), ghiaia = sedimento({ N, energia: 0.9, seme });
    assert.ok(limo.granaMedia < sabbia.granaMedia && sabbia.granaMedia < ghiaia.granaMedia, `grana ${limo.granaMedia} < ${sabbia.granaMedia} < ${ghiaia.granaMedia}`);
    assert.ok(limo.selezione < 0.5 && ghiaia.selezione > limo.selezione + 0.2, `selezione ${limo.selezione} (limo) e ${ghiaia.selezione} (ghiaia)`);
    assert.ok(limo.nGranelli > sabbia.nGranelli && sabbia.nGranelli > ghiaia.nGranelli);
    for (const s of [limo, sabbia, ghiaia]) {
      let pieno = 0; for (const g of s.grano) { assert.ok(g >= -1 && g < s.nGranelli); if (g >= 0) pieno++; }
      assert.ok(pieno > 0.6 * N * N, `il deposito riempie il quadro: ${pieno / (N * N)}`);
    }
    // le lamine: la grana cambia da una riga all'altra più di quanto cambi dentro una riga… e le righe vicine si somigliano
    const r = [...limo.granaPerRiga].slice(4, N - 4), m = r.reduce((a, b) => a + b) / r.length; let vr = 0, cv = 0;
    for (let j = 0; j < r.length; j++) { vr += (r[j] - m) ** 2; if (j) cv += (r[j] - m) * (r[j - 1] - m); }
    assert.ok(Math.sqrt(vr / r.length) / m > 0.05 && cv / vr > 0.5, `lamine: variazione ${Math.sqrt(vr / r.length) / m}, somiglianza fra righe vicine ${cv / vr}`);
    if (seme === 1) console.log(`      grana media (celle): ${limo.granaMedia.toFixed(2)} → ${sabbia.granaMedia.toFixed(2)} → ${ghiaia.granaMedia.toFixed(2)}; selezione ${limo.selezione.toFixed(2)} → ${sabbia.selezione.toFixed(2)} → ${ghiaia.selezione.toFixed(2)}`);
  }
});

prova('fratture: le crepe chiudono poligoni con 4,5–6,5 lati in media; la contrazione lenta li porta verso l\'esagono', () => {
  for (const seme of [1, 2, 3]) {
    const brusca = fratture({ N, sforzo: 1.5, seme }), fango = fratture({ N, sforzo: 1, seme }), media = fratture({ N, sforzo: 0.3, seme }), lenta = fratture({ N, sforzo: 0.1, seme });
    for (const f of [brusca, fango, media, lenta]) {
      assert.ok(f.latiMedi >= 4.5 && f.latiMedi <= 6.5, `lati medi ${f.latiMedi}`);
      assert.ok(f.nPoligoni >= 10, `poligoni ${f.nPoligoni}`);
      // ogni cella o è crepa o sta in un poligono, e le crepe sono una rete sottile
      let rotte = 0; for (let i = 0; i < N * N; i++) { assert.equal(f.crepe[i] === 1, f.poligono[i] < 0); rotte += f.crepe[i]; }
      assert.ok(rotte > 0.02 * N * N && rotte < 0.35 * N * N, `celle di crepa ${rotte / (N * N)}`);
    }
    assert.ok(brusca.nPoligoni > fango.nPoligoni && fango.nPoligoni > media.nPoligoni && media.nPoligoni > lenta.nPoligoni, 'più brusca la contrazione, più fitti i poligoni');
    assert.ok(lenta.frazioneEsagoni > fango.frazioneEsagoni + 0.15 && lenta.frazioneEsagoni > 0.4, `esagoni: ${fango.frazioneEsagoni} (fango) contro ${lenta.frazioneEsagoni} (colonne)`);
    assert.equal(fango.maturazione, 0); assert.ok(lenta.maturazione > 10);
    if (seme === 1) console.log(`      lati medi: brusca ${brusca.latiMedi.toFixed(2)}, fango ${fango.latiMedi.toFixed(2)}, media ${media.latiMedi.toFixed(2)}, lenta ${lenta.latiMedi.toFixed(2)}; esagoni ${(100 * fango.frazioneEsagoni).toFixed(0)}% → ${(100 * lenta.frazioneEsagoni).toFixed(0)}%; poligoni ${brusca.nPoligoni}, ${fango.nPoligoni}, ${media.nPoligoni}, ${lenta.nPoligoni}`);
  }
  // la stessa contrazione, con e senza assestamento: maturando i poligoni si regolarizzano
  const prima = fratture({ N, sforzo: 0.3, seme: 5, maturazione: 0 }), dopo = fratture({ N, sforzo: 0.3, seme: 5, maturazione: 20 });
  assert.ok(dopo.frazioneEsagoni > prima.frazioneEsagoni && dopo.nPoligoni === prima.nPoligoni);
});

prova('immagini: N×N punti RGBA opachi per tutti e quattro, coi bordi di grano più scuri', () => {
  const luce = (px, k) => px[k * 4] + px[k * 4 + 1] + px[k * 4 + 2];
  const c = cristallizza({ N, raffreddamento: 0.005, seme: 3 }), casi = [c, cristallizza({ N, raffreddamento: 2, seme: 3 }), fioccoDiNeve({ N, seme: 3 }), sedimento({ N, energia: 0.6, seme: 3 }), fratture({ N, sforzo: 0.4, seme: 3 })];
  for (const r of casi) {
    const px = immagine(r);
    assert.ok(px instanceof Uint8ClampedArray && px.length === N * N * 4, r.tipo);
    for (let k = 0; k < N * N; k++) assert.equal(px[k * 4 + 3], 255);
    const colori = new Set(); for (let k = 0; k < N * N; k += 7) colori.add((px[k * 4] << 16) | (px[k * 4 + 1] << 8) | px[k * 4 + 2]);
    assert.ok(colori.size > 3, `${r.tipo}: non è una tinta piatta`);
  }
  // nei cristalli: i punti sul confine fra due grani sono più scuri di quelli dentro, minerale per minerale
  const px = immagine(c), dentro = GRANITO.map(() => [0, 0]), bordo = GRANITO.map(() => [0, 0]);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const k = y * N + x, g = c.grano[k], sulBordo = g !== c.grano[y * N + (x + 1) % N] || g !== c.grano[((y + 1) % N) * N + x], dove = (sulBordo ? bordo : dentro)[c.minerale[k]]; dove[0] += luce(px, k); dove[1]++; }
  GRANITO.forEach((m, k) => assert.ok(bordo[k][0] / bordo[k][1] < 0.75 * (dentro[k][0] / dentro[k][1]), `${m.nome}: bordo più scuro`));
  // i colori sono quelli dei minerali: il quarzo chiaro, la biotite scura
  assert.ok(dentro[0][0] / dentro[0][1] > 3 * (dentro[3][0] / dentro[3][1]));
  // nelle fratture le crepe sono il punto più scuro; nel fiocco il ghiaccio è più chiaro del cielo
  const fr = casi[4], pf = immagine(fr); let lc = 0, nc = 0, lp = 0, np = 0;
  for (let k = 0; k < N * N; k++) if (fr.crepe[k]) { lc += luce(pf, k); nc++; } else { lp += luce(pf, k); np++; }
  assert.ok(lc / nc < 0.3 * (lp / np));
  const fi = casi[2], pg = immagine(fi); assert.ok(luce(pg, (N / 2) * N + N / 2) > 4 * luce(pg, 0) && fi.ghiaccio[(N / 2) * N + N / 2] === 1 && fi.ghiaccio[0] === 0);
});

prova('stesso seme, stesso risultato; seme diverso, un altro esemplare della stessa roccia', () => {
  const uguali = (a, b) => assert.deepEqual(a, b), fabbriche = [
    (seme) => cristallizza({ N: 128, raffreddamento: 0.01, minerali: BASALTO, seme }), (seme) => fioccoDiNeve({ N: 128, T: 258, umidita: 1, seme }),
    (seme) => sedimento({ N: 128, energia: 0.5, seme }), (seme) => fratture({ N: 128, sforzo: 0.5, seme }),
  ];
  for (const f of fabbriche) {
    const a = f(11), b = f(11), c = f(12);
    uguali(immagine(a), immagine(b));
    for (const campo of ['grano', 'minerale', 'ghiaccio', 'crepe', 'poligono', 'frazioneNelTempo', 'diametri']) if (a[campo]) uguali(a[campo], b[campo]);
    assert.notDeepEqual(immagine(a), immagine(c), `${a.tipo}: un altro seme dà un altro disegno`);
  }
});

prova('leggere: ogni simulazione sotto un secondo su una griglia 192×192', () => {
  const lavori = {
    'cristalli lenti (granito)': () => cristallizza({ N, raffreddamento: 0.001, seme: 9 }), 'cristalli rapidi (basalto)': () => cristallizza({ N, raffreddamento: 0.2, minerali: BASALTO, seme: 9 }),
    'fiocco a piastra': () => fioccoDiNeve({ N, T: 258, umidita: 0.88, seme: 9 }), 'fiocco a dendrite': () => fioccoDiNeve({ N, T: 258, umidita: 1, seme: 9 }),
    'sedimento fine': () => sedimento({ N, energia: 0.05, seme: 9 }), 'sedimento grosso': () => sedimento({ N, energia: 1, seme: 9 }),
    'fratture brusche': () => fratture({ N, sforzo: 2, seme: 9 }), 'fratture lente (colonne)': () => fratture({ N, sforzo: 0.05, seme: 9 }),
  };
  const tempi = [];
  for (const [nome, f] of Object.entries(lavori)) {
    const [r, ms] = crono(f), [, msImmagine] = crono(() => immagine(r));
    assert.ok(ms < 1000, `${nome}: ${ms} ms`); assert.ok(msImmagine < 1000, `immagine di ${nome}: ${msImmagine} ms`);
    tempi.push(`${nome} ${ms.toFixed(0)}`);
  }
  console.log(`      millisecondi: ${tempi.join(', ')}`);
});

console.log(`rocce: ${ok} prove, tutto ok`);
