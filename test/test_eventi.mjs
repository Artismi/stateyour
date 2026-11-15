// test_eventi.mjs — la fonte unica del caso: Threefry-4x32, la chiave (128 bit) dall'indirizzo, i rami, l'ordine che non conta
import assert from 'node:assert/strict';
import { threefry2x32, threefry4x32, chiaveDi, numero, sorgente, contatore, comeSorgente, logEsatto, cosGiro, campana } from '../src/camera/eventi.js';
import { readFileSync } from 'node:fs';
import { casoEvento } from '../src/camera/mondo.js';
import { semeEvento, hash } from '../src/camera/cosmo.js';

let ok = 0; const prova = (nome, f) => { f(); ok++; console.log('  ✓', nome); };
const hex = (x) => x.toString(16).padStart(8, '0'), esito53 = (x0, x1) => (x0 * 2 ** 21 + (x1 >>> 11)) / 2 ** 53, x0y1 = ([x0, x1]) => esito53(x0, x1);
// l'esito dell'estrazione k di una chiave, nel ramo dato: il contatore è (k, ramo, 0, 0)
const esitoDi = (chiave, k = 0, ramo = 0) => threefry4x32([k, ramo, 0, 0], chiave);

// I VETTORI NOTI di Random123 (tests/kat_vectors, le righe «threefry4x32» e «threefry2x32»): giri, contatore,
// chiave, esito. Copiati dal file ufficiale di DEShawResearch/random123 (github.com/DEShawResearch/random123).
const KAT4 = `
13 00000000 00000000 00000000 00000000 00000000 00000000 00000000 00000000 531c7e4f 39491ee5 2c855a92 3d6abf9a
13 ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff c4189358 1c9cc83a d5881c67 6a0a89e0
13 243f6a88 85a308d3 13198a2e 03707344 a4093822 299f31d0 082efa98 ec4e6c89 4aa71d8f 734738c2 431fc6a8 ae6debf1
20 00000000 00000000 00000000 00000000 00000000 00000000 00000000 00000000 9c6ca96a e17eae66 fc10ecd4 5256a7d8
20 ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff 2a881696 57012287 f6c7446e a16a6732
20 243f6a88 85a308d3 13198a2e 03707344 a4093822 299f31d0 082efa98 ec4e6c89 59cd1dbb b8879579 86b5d00c ac8b6d84
72 00000000 00000000 00000000 00000000 00000000 00000000 00000000 00000000 93171da6 9220326d b392b7b1 ff58a002
72 ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff 60743f3d 9961e684 aab21c34 8c65fb7d
72 243f6a88 85a308d3 13198a2e 03707344 a4093822 299f31d0 082efa98 ec4e6c89 09930adf 7f27bd55 9ed68ce1 97f803f6`.trim().split('\n').map((r) => r.trim().split(/\s+/));
const KAT2 = `
13 00000000 00000000 00000000 00000000 9d1c5ec6 8bd50731
13 ffffffff ffffffff ffffffff ffffffff fd36d048 2d17272c
13 243f6a88 85a308d3 13198a2e 03707344 ba3e4725 f27d669e
20 00000000 00000000 00000000 00000000 6b200159 99ba4efe
20 ffffffff ffffffff ffffffff ffffffff 1cb996fc bb002be7
20 243f6a88 85a308d3 13198a2e 03707344 c4923a9c 483df7a0
32 00000000 00000000 00000000 00000000 cee3d47e a23dfd5c
32 ffffffff ffffffff ffffffff ffffffff 6e2fe0d0 b1b76f82
32 243f6a88 85a308d3 13198a2e 03707344 e2827716 c3c05cdf`.trim().split('\n').map((r) => r.trim().split(/\s+/));

prova('Threefry-4x32 ridà i vettori noti di Random123 (13, 20 e 72 giri); la versione di lavoro è la stessa funzione', () => {
  for (const [giri, ...h] of KAT4) {
    const v = h.map((x) => parseInt(x, 16)), x = threefry4x32(v.slice(0, 4), v.slice(4, 8), Number(giri));
    assert.equal(x.map(hex).join(' '), h.slice(8).join(' '), `giri ${giri}, contatore ${h.slice(0, 4)}, chiave ${h.slice(4, 8)}`);
  }
  assert.deepEqual(threefry4x32([0, 0, 0, 0], [0, 0, 0, 0]), [0x9c6ca96a, 0xe17eae66, 0xfc10ecd4, 0x5256a7d8], 'senza dire i giri sono 20');
  // la versione di lavoro (i giri scritti per esteso) dà la chiave di un nome corto: un blocco solo, sotto la chiave
  // della radice (0, 0, 0, 0): è il vettore noto con quel contatore. Il blocco di «a»: il byte 0x61, e in cima 0xF1
  assert.deepEqual(chiaveDi('a'), threefry4x32([0x61, 0, 0, 0xF1000000], [0, 0, 0, 0]));
  // e con una chiave qualunque (quelle dei vettori noti) fa come la versione da leggere: la chiave del nome vuoto (un
  // blocco con il solo conto, 0xF0) e i suoi esiti in fila
  for (const [, ...h] of KAT4.filter((r) => r[0] === '20')) {
    const k = h.slice(4, 8).map((x) => parseInt(x, 16)), c = contatore('', 0, k), figlio = threefry4x32([0, 0, 0, 0xF0000000], k);
    for (let i = 0; i < 4; i++) assert.equal(c(), x0y1(esitoDi(figlio, i)));
  }
});
prova('Threefry-2x32 (la fonte di prima, che resta per confronto) ridà i suoi vettori noti (13, 20 e 32 giri)', () => {
  for (const [giri, c0, c1, k0, k1, x0, x1] of KAT2) {
    const [a, b] = threefry2x32(parseInt(c0, 16), parseInt(c1, 16), parseInt(k0, 16), parseInt(k1, 16), Number(giri));
    assert.equal(`${hex(a)} ${hex(b)}`, `${x0} ${x1}`, `giri ${giri}, contatore ${c0} ${c1}, chiave ${k0} ${k1}`);
  }
});

// la regola della chiave, riscritta qui nel modo più piano (i byte con TextEncoder, i blocchi uno per uno, la
// funzione «da leggere»): deve dare la stessa chiave di quella di lavoro, che è scritta per i cicli caldi
function chiavePiana(indirizzo) {
  // i byte di un nome: ogni unità del testo (UTF-16) in UTF-8 per sé (anche le due metà di un carattere fuori dal piano base)
  const byte = (nome) => Array.from({ length: nome.length }, (_, i) => nome.charCodeAt(i)).flatMap((u) => (u < 0x80 ? [u] : u < 0x800 ? [0xC0 | (u >> 6), 0x80 | (u & 63)] : [0xE0 | (u >> 12), 0x80 | ((u >> 6) & 63), 0x80 | (u & 63)]));
  const parola = (q, i) => (q[i] | (q[i + 1] << 8) | (q[i + 2] << 16) | (q[i + 3] << 24)) >>> 0, blocco = (q) => [0, 4, 8, 12].map((i) => parola(q, i));
  let k = [0, 0, 0, 0];
  for (const nome of String(indirizzo).split('/')) {
    const b = byte(nome);
    while (b.length >= 15) k = threefry4x32(blocco([...b.splice(0, 15), 0xFF]), k); // un blocco pieno: 15 byte e 0xF0 + 15
    const n = b.length; while (b.length < 15) b.push(0); b.push(0xF0 | n); // l'ultimo: i byte rimasti, zeri, 0xF0 + quanti
    k = threefry4x32(blocco(b), k);
  }
  return k;
}
const INDIRIZZI = ['', 'a', 'cosmo 1', 'cosmo 1/galassia 3/stella 53/pianeta 0/impatto 12/dove', 'otto ott', 'nove nove', 'sedici caratteri', 'profondità', 'età/città/perché/più giù', 'a/', '/a', 'a//b',
  'x'.repeat(7), 'x'.repeat(8), 'x'.repeat(9), 'x'.repeat(14), 'x'.repeat(15), 'x'.repeat(16), 'x'.repeat(29), 'x'.repeat(30), 'x'.repeat(31), 'è'.repeat(7), 'è'.repeat(8), 'aè'.repeat(5), 'a→'.repeat(5), 'aa→'.repeat(5), '→'.repeat(5), '→ freccia', 'una stella ✶ e una 🌍', '🌍'.repeat(4), 'cosmo 1/galassia 3/stella 53/disco/embrione 12/fusione con 13', 'cosmo 1/galassia 3/stella 53/pianeta 2/lune/cattura 3/distanza'];
prova('la chiave è il cammino dei nomi: Threefry del nome (a blocchi di 15 byte e un byte di conto) con la chiave di chi lo contiene', () => {
  for (const s of INDIRIZZI) assert.deepEqual(chiaveDi(s), chiavePiana(s), `«${s}»`);
  // l'esito: contatore (numero dell'estrazione, ramo, 0, 0), chiave dell'indirizzo; numero() ne dà i primi 32 bit
  for (const s of INDIRIZZI) for (const ramo of [0, 1, 2, 7]) assert.equal(numero(s, ramo), esitoDi(chiavePiana(s), 0, ramo)[0], `«${s}» ramo ${ramo}`);
  // c() ne usa i primi 53: tutta la prima parola e i 21 più alti della seconda
  const [x0, x1] = esitoDi(chiavePiana('cosmo 1/galassia 3/massa'));
  assert.equal(sorgente('cosmo 1/galassia 3')('massa'), esito53(x0, x1));
  assert.equal(numero(12345), numero('12345'));
  // il conto nel byte più alto separa i nomi dai loro prolungamenti: un nome di 15 byte (un blocco pieno e uno vuoto) non è
  // quello di 14 con un carattere in più, né un nome lungo è il cammino dei suoi pezzi
  const chiavi = new Set(['x'.repeat(14), 'x'.repeat(15), 'x'.repeat(15) + '\0', 'x'.repeat(16), 'x'.repeat(15) + '/', 'x'.repeat(15) + '/x', 'x'.repeat(30)].map((s) => chiaveDi(s).join(' ')));
  assert.equal(chiavi.size, 7);
  // la chiave di una parte è Threefry del suo blocco con la chiave di chi la contiene: «stella 53» sono 9 byte, e in cima 0xF9
  const blocco = [...new TextEncoder().encode('stella 53'), 0, 0, 0, 0, 0, 0, 0xF9].reduce((w, b, i) => { w[i >> 2] = (w[i >> 2] | (b << ((i & 3) * 8))) >>> 0; return w; }, [0, 0, 0, 0]);
  assert.deepEqual(chiaveDi('cosmo 1/galassia 3/stella 53'), threefry4x32(blocco, chiaveDi('cosmo 1/galassia 3')));
  // nessun esito di un luogo è la chiave di una sua parte: i contatori d'esito hanno 0 nel byte più alto, i blocchi dei
  // nomi almeno 0xF0 (che gli esiti siano quelli del contatore (k, ramo, 0, 0) lo provano numero() e c() qui sopra), e con la
  // stessa chiave Threefry è una biiezione
  assert.ok(blocco[3] >>> 24 >= 0xF0); for (let k = 0; k < 4; k++) assert.notDeepEqual(esitoDi(chiaveDi('cosmo 1/galassia 3'), k), chiaveDi('cosmo 1/galassia 3/stella 53'));
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
  assert.notEqual(c.seme('impatto 12/dove'), d.seme('impatto 12/dove')); assert.equal(d('impatto 12/dove'), x0y1(esitoDi(chiaveDi(ev), 0, 1)));
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
prova('nessuna collisione su un milione di indirizzi veri: né tra le chiavi (128 bit), né tra gli esiti (53 bit)', () => {
  // (una chiave a 128 bit non sta in un double: se ne tengono i primi 53 bit; se nemmeno quelli coincidono, non coincide
  // la chiave intera. Su un milione di chiavi davvero sparse una coincidenza nei primi 53 bit ha probabilità 6·10⁻⁵)
  const esiti = new Set(), primi32 = new Set(), chiavi53 = new Set(), visti = new Set(); let n = 0;
  for (const a of indirizziVeri()) {
    assert.ok(!visti.has(a), `l'elenco ripete «${a}»`); visti.add(a); n++;
    const k = chiaveDi(a); chiavi53.add(k[0] * 2 ** 21 + (k[1] >>> 11));
    const [x0, x1] = esitoDi(k); esiti.add(x0 * 2 ** 21 + (x1 >>> 11)); primi32.add(x0);
  }
  assert.ok(n >= 1e6, `gli indirizzi sono ${n}`);
  assert.equal(chiavi53.size, n, `${n - chiavi53.size} chiavi coincidono nei primi 53 bit`);
  assert.equal(esiti.size, n, `${n - esiti.size} esiti a 53 bit coincidono`);
  // a 32 bit invece le coincidenze ci sono, e quante ce ne aspettiamo da numeri davvero sparsi: n²/2³³ (per questo servono chiavi lunghe)
  const attese = (n * n) / 2 ** 33, viste = n - primi32.size; console.log(`      (${n} indirizzi: 0 coincidenze tra le chiavi e tra gli esiti a 53 bit; nei soli primi 32 bit ${viste}, attese ${attese.toFixed(0)})`);
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

// i 64 bit di un numero, scritti in esadecimale: per confrontare «al bit»
const bit = (x) => { const b = new DataView(new ArrayBuffer(8)); b.setFloat64(0, x); return b.getBigUint64(0).toString(16).padStart(16, '0'); };
prova('gli esiti si ricavano dai bit con sole operazioni esatte: la campana ha il suo logaritmo e il suo coseno, uguali al bit su ogni motore', () => {
  // VALORI ATTESI AL BIT (calcolati una volta, le campane con la fonte Threefry-4x32; non dipendono da Math.log né da
  // Math.cos, che lo standard non fissa all'ultimo bit)
  const attesi = [[logEsatto(0.3), 'bff34378fcbda720'], [logEsatto(1e-9), 'c034b927f32bffb8'], [logEsatto(7), '3fff2272ae325a56'], [cosGiro(0.1), '3fe9e3779b97f4a8'], [cosGiro(0.37), 'bfe5e7cf55112013'],
    [cosGiro(0.93), '3fecf457dcdc158d'], [campana(0.25, 0.6), 'bff58dba77ef920f'], [sorgente('prova/campana').normale('uno'), 'bfdad83971c68c5d'], [sorgente('prova/campana').normale('due'), '3fa2b645208232d1'], [sorgente('prova/campana').normale('età'), 'bfe06bbfd02856e6']];
  attesi.forEach(([v, b], i) => assert.equal(bit(v), b, `valore ${i}: ${v}`));
  assert.equal(bit(sorgente('cosmo 1/galassia 3')('massa')), bit(x0y1(esitoDi(chiaveDi('cosmo 1/galassia 3/massa')))), 'c() sono i primi 53 bit');
  // sono il logaritmo e il coseno veri, entro qualche 10⁻¹⁶
  let eL = 0, eC = 0;
  for (let i = 1; i < 200000; i++) { const x = i / 200000, y = Math.pow(10, -12 * x); eL = Math.max(eL, Math.abs(logEsatto(x) - Math.log(x)) / (Math.abs(Math.log(x)) || 1), Math.abs(logEsatto(y) / Math.log(y) - 1)); eC = Math.max(eC, Math.abs(cosGiro(x) - Math.cos(2 * Math.PI * x))); }
  for (const x of [5e-324, 1e-300, 1 - 1e-16, 1 + 1e-15, 2, 123456.789, 1e300]) eL = Math.max(eL, Math.abs(logEsatto(x) - Math.log(x)) / Math.abs(Math.log(x)));
  assert.ok(eL < 1e-15 && eC < 1e-15, `scarto del logaritmo ${eL}, del coseno ${eC}`);
  assert.equal(logEsatto(1), 0); assert.equal(logEsatto(0), -Infinity); assert.ok(Number.isNaN(logEsatto(-1))); assert.equal(cosGiro(0), 1); assert.equal(cosGiro(0.5), -1); assert.equal(Math.abs(cosGiro(0.25)), 0); assert.equal(cosGiro(1.1), cosGiro(0.1 + 1 - 1));
  assert.equal(sorgente('prova/campana').normale('uno'), campana(sorgente('prova/campana').serie('uno')(0), sorgente('prova/campana').serie('uno')(1)));
  // e nel codice della fonte non c'è nessuna funzione che lo standard lasci libera (solo Math.sqrt, Math.floor, Math.min)
  const codice = readFileSync(new URL('../src/camera/eventi.js', import.meta.url), 'utf8').split('\n').map((r) => r.replace(/\/\/.*$/, '')).join('\n');
  assert.deepEqual([...new Set(codice.match(/Math\.\w+/g))].sort(), ['Math.floor', 'Math.min', 'Math.sqrt']);
  console.log(`      (scarto massimo dal logaritmo e dal coseno del motore: ${eL.toExponential(1)} e ${eC.toExponential(1)})`);
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
