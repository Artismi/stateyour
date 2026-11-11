// test_eventi.mjs — la fonte unica del caso: Threefry-2x32, la chiave dall'indirizzo, i rami, l'ordine che non conta
import assert from 'node:assert/strict';
import { threefry2x32, chiaveDi, numero, sorgente, contatore, comeSorgente } from '../src/camera/eventi.js';
import { casoEvento } from '../src/camera/mondo.js';
import { semeEvento, hash } from '../src/camera/cosmo.js';

let ok = 0; const prova = (nome, f) => { f(); ok++; console.log('  ✓', nome); };
const hex = (x) => x.toString(16).padStart(8, '0'), esito53 = (x0, x1) => (x0 * 2 ** 21 + (x1 >>> 11)) / 2 ** 53;

// I VETTORI NOTI di Random123 (tests/kat_vectors, le righe «threefry2x32»): giri, contatore (2 parole), chiave
// (2 parole), esito (2 parole). Copiati dal file ufficiale di DEShawResearch/random123.
const KAT = `
13 00000000 00000000 00000000 00000000 9d1c5ec6 8bd50731
13 ffffffff ffffffff ffffffff ffffffff fd36d048 2d17272c
13 243f6a88 85a308d3 13198a2e 03707344 ba3e4725 f27d669e
20 00000000 00000000 00000000 00000000 6b200159 99ba4efe
20 ffffffff ffffffff ffffffff ffffffff 1cb996fc bb002be7
20 243f6a88 85a308d3 13198a2e 03707344 c4923a9c 483df7a0
32 00000000 00000000 00000000 00000000 cee3d47e a23dfd5c
32 ffffffff ffffffff ffffffff ffffffff 6e2fe0d0 b1b76f82
32 243f6a88 85a308d3 13198a2e 03707344 e2827716 c3c05cdf`.trim().split('\n').map((r) => r.trim().split(/\s+/));

prova('Threefry-2x32 ridà i vettori noti di Random123 (13, 20 e 32 giri)', () => {
  for (const [giri, c0, c1, k0, k1, x0, x1] of KAT) {
    const [a, b] = threefry2x32(parseInt(c0, 16), parseInt(c1, 16), parseInt(k0, 16), parseInt(k1, 16), Number(giri));
    assert.equal(`${hex(a)} ${hex(b)}`, `${x0} ${x1}`, `giri ${giri}, contatore ${c0} ${c1}, chiave ${k0} ${k1}`);
  }
  assert.deepEqual(threefry2x32(0, 0, 0, 0), [0x6b200159, 0x99ba4efe], 'senza dire i giri sono 20');
});

// la regola della chiave, riscritta qui nel modo più piano (i byte con TextEncoder, i blocchi uno per uno, la
// funzione «da leggere»): deve dare la stessa chiave di quella di lavoro, che è scritta per i cicli caldi
function chiavePiana(indirizzo) {
  let k = [0, 0];
  for (const nome of String(indirizzo).split('/')) {
    const b = [...new TextEncoder().encode(nome)], parola = (q) => (q[0] | (q[1] << 8) | (q[2] << 16) | (q[3] << 24)) >>> 0;
    while (b.length >= 8) { const q = b.splice(0, 8); k = threefry2x32(parola(q), parola(q.slice(4)), k[0], k[1]); }
    const n = b.length; while (b.length < 7) b.push(0); b.push(0xF8 | n);
    k = threefry2x32(parola(b), parola(b.slice(4)), k[0], k[1]);
  }
  return k;
}
const INDIRIZZI = ['', 'a', 'cosmo 1', 'cosmo 1/galassia 3/stella 53/pianeta 0/impatto 12/dove', 'otto ott', 'nove nove', 'sedici caratteri', 'profondità', 'età/città/perché/più giù', 'a/', '/a', 'a//b',
  'x'.repeat(7), 'x'.repeat(8), 'x'.repeat(9), 'x'.repeat(15), 'x'.repeat(16), 'x'.repeat(17), 'è'.repeat(4), 'è'.repeat(5), '→ freccia', 'cosmo 1/galassia 3/stella 53/disco/embrione 12/fusione con 13', 'cosmo 1/galassia 3/stella 53/pianeta 2/lune/cattura 3/distanza'];
prova('la chiave è il cammino dei nomi: Threefry del nome (a blocchi di 8 byte, l\'ultimo con il conto) con la chiave di chi lo contiene', () => {
  for (const s of INDIRIZZI) assert.deepEqual(chiaveDi(s), chiavePiana(s), `«${s}»`);
  // l'esito: contatore (numero dell'estrazione, ramo), chiave dell'indirizzo; numero() ne dà i primi 32 bit
  for (const s of INDIRIZZI) for (const ramo of [0, 1, 2, 7]) assert.equal(numero(s, ramo), threefry2x32(0, ramo, ...chiavePiana(s))[0], `«${s}» ramo ${ramo}`);
  // c() ne usa i primi 53: tutta la prima parola e i 21 più alti della seconda
  const [x0, x1] = threefry2x32(0, 0, ...chiavePiana('cosmo 1/galassia 3/massa'));
  assert.equal(sorgente('cosmo 1/galassia 3')('massa'), esito53(x0, x1));
  assert.equal(numero(12345), numero('12345'));
});

prova('la sorgente: stessa interfaccia di sempre; la chiave della radice vale per tutte le sue parti', () => {
  const c = sorgente('cosmo 1/galassia 3'), d = sorgente('cosmo 1').sotto('galassia 3'), e = sorgente('cosmo 1/galassia 3/stella 53');
  assert.equal(c.radice, 'cosmo 1/galassia 3'); assert.equal(d.radice, c.radice); assert.equal(c.rami, null);
  assert.equal(c('stella 53/massa'), d('stella 53/massa')); assert.equal(c('stella 53/massa'), e('massa')); assert.equal(c.sotto('stella 53')('massa'), e('massa'));
  assert.equal(sorgente('cosmo 1')('galassia 3/stella 53/massa'), e('massa'));
  assert.equal(Math.floor(e('massa') * 4294967296), numero('cosmo 1/galassia 3/stella 53/massa'), 'numero() sono i primi 32 bit di c()');
  for (const nome of ['massa', 'dove', 'impatto 12/dove']) { const x = e(nome); assert.ok(x >= 0 && x < 1); assert.equal(e.tra(nome, 10, 20), 10 + 10 * x); assert.equal(e.intero(nome, 7), Math.min(6, Math.floor(x * 7))); }
  const s = e.seme('motore'); assert.ok(Number.isInteger(s) && s >= 1 && s <= 2147483646); assert.equal(s, e.seme('motore')); assert.equal(s, numero('cosmo 1/galassia 3/stella 53/motore') % 2147483646 + 1);
  // le estrazioni di uno stesso evento: la numero 0 è c(); in fila o a salti sono le stesse
  const serie = e.serie('rumore'), fila = e.fila('rumore'), fuori = contatore('cosmo 1/galassia 3/stella 53/rumore');
  assert.equal(serie(0), e('rumore')); assert.equal(serie(), e('rumore'));
  const inFila = [fila(), fila(), fila(), fila()]; assert.deepEqual(inFila, [0, 1, 2, 3].map(serie)); assert.deepEqual([fuori(), fuori(), fuori(), fuori()], inFila);
  assert.equal(new Set([0, 1, 2, 3, 4, 5, 6, 7].map(serie)).size, 8);
  // chi riceve un seme alla vecchia maniera
  assert.equal(comeSorgente(e, 'disco'), e); assert.equal(comeSorgente(7, 'disco').radice, 'disco 7'); assert.notEqual(comeSorgente(7, 'disco')('x'), comeSorgente(8, 'disco')('x'));
});

prova('un ramo cambia quell\'evento e solo quello: non i vicini, non ciò che gli sta sotto, non ciò che gli sta sopra', () => {
  const r = 'cosmo 1/galassia 3/stella 53/pianeta 0', ev = `${r}/impatto 12/dove`, c = sorgente(r), d = sorgente(r, { [ev]: 1 }), d2 = sorgente(r, { [ev]: 2 }), vuoti = sorgente(r, {});
  assert.notEqual(c('impatto 12/dove'), d('impatto 12/dove')); assert.notEqual(d('impatto 12/dove'), d2('impatto 12/dove'));
  for (const altro of ['impatto 12/quando', 'impatto 13/dove', 'impatto 12', 'impatto 12/dove/dettaglio', 'impatto 1/dove', 'dove']) assert.equal(c(altro), d(altro), altro);
  assert.equal(c('impatto 12/dove'), vuoti('impatto 12/dove'));
  // il ramo arriva anche passando per una parte, e vale per tutte le estrazioni dell'evento (la campana, la serie, il seme)
  assert.equal(d.sotto('impatto 12')('dove'), d('impatto 12/dove')); assert.equal(sorgente('cosmo 1', { [ev]: 1 }).sotto('galassia 3/stella 53/pianeta 0/impatto 12')('dove'), d('impatto 12/dove'));
  assert.notEqual(c.normale('impatto 12/dove'), d.normale('impatto 12/dove')); assert.equal(c.normale('impatto 13/dove'), d.normale('impatto 13/dove'));
  assert.notEqual(c.serie('impatto 12/dove')(5), d.serie('impatto 12/dove')(5)); assert.equal(c.serie('impatto 13/dove')(5), d.serie('impatto 13/dove')(5));
  assert.notEqual(c.seme('impatto 12/dove'), d.seme('impatto 12/dove')); assert.equal(d('impatto 12/dove'), esito53(...threefry2x32(0, 1, ...chiaveDi(ev))));
  assert.equal(numero(ev, 1), Math.floor(d('impatto 12/dove') * 4294967296));
});

prova('l\'ordine non conta: gli stessi indirizzi, chiesti all\'indietro o mescolati, danno gli stessi esiti', () => {
  const nomi = []; for (let p = 0; p < 6; p++) for (let i = 0; i < 40; i++) for (const che of ['dove', 'quando', 'massa']) nomi.push(`pianeta ${p}/impatto ${i}/${che}`);
  const c = sorgente('cosmo 1/galassia 3/stella 53'), avanti = nomi.map((n) => c(n));
  const indietro = nomi.slice().reverse().map((n) => sorgente('cosmo 1/galassia 3/stella 53')(n)).reverse(); assert.deepEqual(indietro, avanti);
  // mescolati (con un passo primo con la lunghezza), intercalando altre richieste: campane, serie, altre sorgenti
  const altra = sorgente('cosmo 2/galassia 1'), sparsi = new Array(nomi.length);
  for (let k = 0, i = 0; k < nomi.length; k++, i = (i + 277) % nomi.length) { altra.normale(`disturbo ${k}`); altra.serie('rumore')(k); numero(`fuori/${k}`, k % 3); sparsi[i] = c(nomi[i]); }
  assert.deepEqual(sparsi, avanti);
  const s = c.serie('rumore di una griglia'), a = Array.from({ length: 500 }, (_, k) => s(k)), b = Array.from({ length: 500 }, (_, k) => s(499 - k)).reverse(); assert.deepEqual(b, a);
  const g = c.normale('campana'); c('altro'); assert.equal(c.normale('campana'), g);
});

// GLI INDIRIZZI VERI. Quelli che il programma compone davvero: galassie, stelle, pianeti, impatti, embrioni, lune,
// particelle; con numeri vicini e nomi che differiscono di un carattere (il caso peggiore per una regola debole)
function* indirizziVeri() {
  for (let cosmo = 1; cosmo <= 2; cosmo++) for (let g = 0; g < 6; g++) {
    const G = `cosmo ${cosmo}/galassia ${g}`;
    for (const che of ['massa', 'spin', 'fusioni', 'profondità']) yield `${G}/${che}`;
    for (let s = 0; s < 2500; s++) {
      const S = `${G}/stella ${s}`;
      for (const che of ['massa', 'nascita', 'dove', 'metalli']) yield `${S}/${che}`;
      if (s % 25) continue;
      for (const che of ['massa del disco', 'vita del gas', 'bordo interno', 'acqua del sistema']) yield `${S}/disco/${che}`;
      for (let e = 0; e < 40; e++) { yield `${S}/disco/embrione ${e}/incontro con ${e + 1}`; yield `${S}/disco/embrione ${e}/fusione con ${e + 1}`; yield `${S}/disco/embrione ${e}/eccentricità`; }
      for (let p = 0; p < 8; p++) {
        const P = `${S}/pianeta ${p}`;
        for (const che of ['urto gigante/angolo', 'orbita/nodo', 'lune/disco/massa', 'lune/catture/quante', 'lune/urto/sorte']) yield `${P}/${che}`;
        for (let k = 0; k < 6; k++) for (const che of ['raggio', 'distanza', 'verso', 'eccentricità', 'forma']) yield `${P}/lune/cattura ${k}/${che}`;
        for (let i = 0; i < 12; i++) for (const che of ['dove', 'quando', 'massa', 'angolo']) yield `${P}/impatto ${i}/${che}`;
      }
    }
  }
  for (let n = 1; n <= 400; n++) for (let i = 0; i < 20; i++) { yield `mondo ${n}/${i}`; yield `mondo ${n}/${i}|emissione`; yield `mondo ${n}/${i}|mezzo`; yield `mondo ${n}/${i}.0`; yield `mondo ${n}/${i}.1`; yield `mondo ${n}/${i}.0.1`; }
}
prova('nessuna collisione su un milione di indirizzi veri: né tra le chiavi (64 bit), né tra gli esiti (53 bit)', () => {
  // (una chiave a 64 bit non sta in un double: le chiavi si confrontano metà per metà; gli esiti sono i 53 bit di c())
  const esiti = new Set(), primi32 = new Set(), perMeta = new Map(), visti = new Set(); let n = 0, doppie = 0;
  for (const a of indirizziVeri()) {
    assert.ok(!visti.has(a), `l'elenco ripete «${a}»`); visti.add(a); n++;
    const [k0, k1] = chiaveDi(a), v = perMeta.get(k0);
    if (v === undefined) perMeta.set(k0, k1); else if (v === k1 || (Array.isArray(v) && v.includes(k1))) doppie++; else perMeta.set(k0, Array.isArray(v) ? [...v, k1] : [v, k1]);
    const [x0, x1] = threefry2x32(0, 0, k0, k1); esiti.add(x0 * 2 ** 21 + (x1 >>> 11)); primi32.add(x0);
  }
  assert.ok(n >= 1e6, `gli indirizzi sono ${n}`);
  assert.equal(doppie, 0, `${doppie} chiavi a 64 bit coincidono`);
  assert.equal(esiti.size, n, `${n - esiti.size} esiti a 53 bit coincidono`);
  // a 32 bit invece le coincidenze ci sono, e quante ce ne aspettiamo da numeri davvero sparsi: n²/2³³ (per questo servono 64 bit)
  const attese = (n * n) / 2 ** 33, viste = n - primi32.size; console.log(`      (${n} indirizzi: 0 coincidenze a 64 e a 53 bit; nei soli primi 32 bit ${viste}, attese ${attese.toFixed(0)})`);
  assert.ok(Math.abs(viste - attese) < 5 * Math.sqrt(attese), `coincidenze a 32 bit: ${viste}, attese ${attese}`);
});

prova('gli esiti sono sparsi come devono: media, varianza, coppie vicine, bit; la campana è una campana', () => {
  const c = sorgente('prova/statistica'), N = 200000; let m = 0, v = 0, cov = 0, prima = 0; const bit = new Float64Array(32), celle = new Float64Array(16 * 16);
  for (let i = 0; i < N; i++) { const x = c(`evento ${i}`); m += x; v += (x - 0.5) ** 2; if (i) { cov += (x - 0.5) * (prima - 0.5); celle[Math.floor(x * 16) * 16 + Math.floor(prima * 16)]++; } prima = x; const h = numero(`prova/statistica/evento ${i}`); for (let b = 0; b < 32; b++) bit[b] += (h >>> b) & 1; }
  assert.ok(Math.abs(m / N - 0.5) < 4 * Math.sqrt(1 / 12 / N), `media ${m / N}`); assert.ok(Math.abs(v / N - 1 / 12) < 4 * Math.sqrt(1 / 180 / N), `varianza ${v / N}`);
  assert.ok(Math.abs(cov / N) < 4 / 12 / Math.sqrt(N), `nomi vicini («evento 7», «evento 8») danno esiti legati: ${cov / N}`);
  for (let b = 0; b < 32; b++) assert.ok(Math.abs(bit[b] / N - 0.5) < 4 * 0.5 / Math.sqrt(N), `bit ${b}: ${bit[b] / N}`);
  let chi = 0; const att = (N - 1) / 256; for (const q of celle) chi += (q - att) ** 2 / att; assert.ok(Math.abs(chi - 255) < 5 * Math.sqrt(2 * 255), `χ² delle coppie ${chi} (atteso 255)`);
  // un bit cambiato nel nome cambia circa metà dei bit dell'esito
  let diversi = 0; for (let i = 0; i < 4000; i++) { let x = numero(`valanga/${i}a`) ^ numero(`valanga/${i}b`); while (x) { diversi += x & 1; x >>>= 1; } } assert.ok(Math.abs(diversi / 4000 - 16) < 0.4, `bit cambiati in media ${diversi / 4000}`);
  // le estrazioni di una serie e i rami sono sparsi allo stesso modo
  const s = c.serie('campo'); let ms = 0; for (let k = 0; k < N; k++) ms += s(k); assert.ok(Math.abs(ms / N - 0.5) < 4 * Math.sqrt(1 / 12 / N));
  let mr = 0; for (let r = 1; r <= 20000; r++) mr += numero('prova/ramo', r) / 4294967296; assert.ok(Math.abs(mr / 20000 - 0.5) < 4 * Math.sqrt(1 / 12 / 20000));
  let g1 = 0, g2 = 0, g4 = 0; for (let i = 0; i < N; i++) { const g = c.normale(`campana ${i}`); g1 += g; g2 += g * g; g4 += g ** 4; }
  assert.ok(Math.abs(g1 / N) < 4 / Math.sqrt(N) && Math.abs(g2 / N - 1) < 4 * Math.sqrt(2 / N) && Math.abs(g4 / N - 3) < 4 * Math.sqrt(96 / N), `campana: media ${g1 / N}, varianza ${g2 / N}, quarto momento ${g4 / N}`);
});

prova('le particelle (mondo.js) e il cosmo (cosmo.js) leggono dalla stessa fonte', () => {
  // casoEvento(seme, indirizzo, ramo): le estrazioni in fila dell'evento «mondo seme/indirizzo», nel ramo dato
  const a = casoEvento(77, '3.0.1', 0), b = contatore('mondo 77/3.0.1'), c = sorgente('mondo 77').serie('3.0.1');
  for (let k = 0; k < 6; k++) { const x = a(); assert.equal(x, b()); assert.equal(x, c(k)); }
  // il ramo cambia le estrazioni di quell'evento (tutte), e solo le sue
  const r1 = casoEvento(77, '3.0.1', 1), r0 = casoEvento(77, '3.0.1', 0); assert.notEqual(r1(), r0()); assert.notEqual(r1(), r0());
  assert.equal(casoEvento(77, '3.0.1', 1)(), sorgente('mondo 77', { 'mondo 77/3.0.1': 1 })('3.0.1')); assert.equal(casoEvento(77, '3.0.2', 0)(), sorgente('mondo 77', { 'mondo 77/3.0.1': 1 })('3.0.2'));
  assert.notEqual(casoEvento(77, '3', 0)(), casoEvento(78, '3', 0)()); assert.notEqual(casoEvento(2 ** 32 + 5, '3', 0)(), casoEvento(5, '3', 0)(), 'un seme più lungo di 32 bit non si tronca');
  // semeEvento e hash di cosmo.js: i primi 32 bit dell'esito dell'evento con quell'indirizzo
  assert.equal(semeEvento('pozza', 1, 3, 53, 0), numero('pozza/1/3/53/0')); assert.equal(hash('a', 2, 'b'), numero('a/2/b'));
  assert.notEqual(semeEvento('disco', '1#{"disco/3/53":1}', 3, 53), semeEvento('disco', 1, 3, 53)); assert.equal(semeEvento('disco', '1#{"disco/3/53":1}', 3, 54), semeEvento('disco', 1, 3, 54));
});

console.log(`eventi: ${ok} prove, tutto ok`);
