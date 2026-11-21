// test_strumenti.mjs — L'OCCHIO E GLI STRUMENTI DAVANTI A LUI (nucleo.js, OCCHIO; src/visore/strumenti.js).
//   A. le soglie di Ferwerda, Pattanaik, Shirley & Greenberg 1996 nei punti delle loro forme a tratti; la risposta che ne
//      viene: al buio il colore sparisce e ciò che sta sotto la soglia resta nero, di giorno la luce di adattamento va
//      vicino al grigio medio;
//   B. l'adattamento nel tempo: continuo (nessun salto), svelto verso il chiaro e lento verso il buio;
//   C. l'amplificatore: porta la luce della regione a OCCHIO.amplificato, mai sotto ×1, senza scatti né all'accensione
//      né allo spegnimento, e il fattore non segue il singolo fotogramma;
//   D. il registro degli strumenti: ogni voce ha ciò che serve, le future restano spente, il fattore si legge ×10ⁿ.
import assert from 'node:assert/strict';
import * as NU from '../src/tre/nucleo.js';
import { STRUMENTI, accendi, acceso, fattore, strumento } from '../src/visore/strumenti.js';

let ok = 0; const prova = (nome, f) => { f(); ok++; console.log('  ✓', nome); };
const vicino = (a, b, eps = 1e-9) => Math.abs(a - b) <= eps * Math.max(1, Math.abs(b));

console.log('A. le soglie di Ferwerda et al. 1996');
prova('le forme a tratti: i rami esterni e la continuità ai raccordi', () => {
  assert.ok(vicino(Math.log10(NU.sogliaFotopica(1e-4)), -0.72)); assert.ok(vicino(Math.log10(NU.sogliaFotopica(1e3)), 3 - 1.255));
  assert.ok(vicino(Math.log10(NU.sogliaScotopica(1e-6)), -2.86)); assert.ok(vicino(Math.log10(NU.sogliaScotopica(1)), -0.395));
  for (const [f, x] of [[NU.sogliaFotopica, -2.6], [NU.sogliaFotopica, 1.9], [NU.sogliaScotopica, -3.94], [NU.sogliaScotopica, -1.44]]) { const a = f(10 ** (x - 1e-7)), b = f(10 ** (x + 1e-7)); assert.ok(Math.abs(Math.log10(a / b)) < 0.02, `raccordo a ${x}`); }
});
prova('di giorno l\'occhio porta la luce a cui è adattato vicino al grigio medio dello schermo (L_da)', () => {
  for (const LA of [200, 1e3, 1e5]) { const f = NU.fattoriOcchio(LA), Ld = f.mP * LA + f.k * f.mS * LA; assert.equal(f.k, 0); assert.ok(Ld > 0.9 * NU.OCCHIO.Lda && Ld < 1.3 * NU.OCCHIO.Lda, `L_d ${Ld}`); }
});
prova('al buio comandano i bastoncelli: il colore pesa cento volte meno, e ciò che è sotto la soglia resta nero', () => {
  const f = NU.fattoriOcchio(1e-5); assert.equal(f.k, 1); assert.ok(f.mS / f.mP > 100);
  // la ragnatela a 10⁻⁸ cd/m² per un occhio adattato al buio: meno di un passo visibile dello schermo
  assert.ok(NU.passiVisibili(1e-8, 1e-6) < 1e-3);
  // la Via Lattea a ~10⁻³ cd/m²: qualche passo; un foglio al sole a 10⁴: tantissimi
  assert.ok(NU.passiVisibili(3e-3, 1e-4) > 1); assert.ok(NU.passiVisibili(1e4, 1e4) > 10);
});

console.log('B. l\'adattamento nel tempo');
prova('continuo; svelto verso il chiaro, verso il buio svelto tra i coni e lento sotto (dopo l\'apertura degli occhi)', () => {
  const oc = {}; NU.passoOcchio(oc, 100, 0.05, false); assert.ok(vicino(oc.LA, 100));
  for (let i = 0; i < 100; i++) NU.passoOcchio(oc, 100, 0.05, false); // (oltre l'apertura)
  let prima = oc.LA, salto = 0; for (let i = 0; i < 20; i++) { NU.passoOcchio(oc, 1e-4, 0.05, false); salto = Math.max(salto, Math.abs(Math.log(oc.LA / prima))); prima = oc.LA; }
  assert.ok(oc.LA > 5 && oc.LA < 50, `verso il buio in un secondo, coi coni: ${oc.LA}`); assert.ok(salto < 0.2, 'nessun salto');
  for (let i = 0; i < 400; i++) NU.passoOcchio(oc, 1e-4, 0.05, false); assert.ok(oc.LA > 1 && oc.LA <= 5, `dopo venti secondi, al bordo dei coni: ${oc.LA}`);
  for (let i = 0; i < 1200; i++) NU.passoOcchio(oc, 1e-4, 0.05, false); assert.ok(oc.LA > 1e-2, `un minuto dopo, i pigmenti sono ancora lenti: ${oc.LA}`);
  for (let i = 0; i < 20; i++) NU.passoOcchio(oc, 1e4, 0.05, false); assert.ok(oc.LA > 1e3, `verso il chiaro in un secondo: ${oc.LA}`);
});

console.log('C. l\'amplificatore di luce');
prova('porta la regione a OCCHIO.amplificato, mai sotto ×1, senza scatti; un fotogramma diverso non lo sposta', () => {
  const oc = {}; for (let i = 0; i < 100; i++) NU.passoOcchio(oc, 1e-8, 0.05, false); assert.equal(oc.G, 1);
  let prima = oc.G, salto = 0; for (let i = 0; i < 400; i++) { NU.passoOcchio(oc, 1e-8, 0.05, true); salto = Math.max(salto, Math.abs(Math.log10(oc.G / prima))); prima = oc.G; }
  assert.ok(vicino(oc.G * 1e-8, NU.OCCHIO.amplificato, 1e-3), `G ${oc.G}`); assert.ok(salto < 0.3, `il passo più grande in 50 ms: ${salto} decadi`);
  // un fotogramma solo cento volte più chiaro (una stella che passa) sposta G di poco
  const G0 = oc.G; NU.passoOcchio(oc, 1e-6, 0.05, true); assert.ok(Math.abs(Math.log10(oc.G / G0)) < 0.1);
  // su un pianeta al sole non amplifica (×1); spento torna a ×1 con la stessa costante
  const p = {}; for (let i = 0; i < 400; i++) NU.passoOcchio(p, 300, 0.05, true); assert.ok(vicino(p.G, 1, 1e-6));
  for (let i = 0; i < 400; i++) NU.passoOcchio(oc, 1e-8, 0.05, false); assert.ok(oc.G < 1.01);
});

console.log('D. il registro degli strumenti');
prova('ogni strumento ha nome, icona, tasto, le due frasi e l\'effetto; i futuri non si accendono', () => {
  const tasti = new Set();
  for (const s of STRUMENTI) { for (const k of ['id', 'nome', 'icona', 'tasto', 'fa', 'vedi']) assert.ok(typeof s[k] === 'string' && s[k].length, `${s.id}.${k}`); assert.equal(typeof s.applica, 'function'); assert.equal(typeof s.misura, 'function'); assert.ok(!tasti.has(s.tasto)); tasti.add(s.tasto); }
  assert.ok(strumento('amplificatore').pronto); assert.equal(accendi('amplificatore', true), true); assert.ok(acceso('amplificatore')); accendi('amplificatore', false); assert.ok(!acceso('amplificatore'));
  for (const s of STRUMENTI.filter((x) => !x.pronto)) { assert.equal(accendi(s.id, true), false); assert.ok(!acceso(s.id)); }
  const M = { vista: { occhio: {} }, stato: { visione: { G: 3.2e6 } } }; strumento('amplificatore').applica(M, true); assert.equal(M.vista.occhio.amplificatore, true);
  assert.equal(strumento('amplificatore').misura(M), '×3·10⁶');
  assert.equal(fattore(1), '×1'); assert.equal(fattore(42), '×42'); assert.equal(fattore(1e12), '×10¹²'); assert.equal(fattore(96), '×10²');
});
console.log(`test_strumenti: ${ok} prove passate`);
