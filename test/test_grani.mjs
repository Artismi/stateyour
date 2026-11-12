// test_grani.mjs — la materia come popolazione: i grani (Johnson-Mehl, impacchettamento) e le tracce di tutti gli eventi
import assert from 'node:assert/strict';
import { campoGrani, granoGhiaccio, popolazioneTracce, AVRAMI_2D } from '../src/camera/grani.js';
import { sorgente } from '../src/camera/eventi.js';
import { luogoDaRoccia, luogoDaAcqua } from '../src/camera/materia.js';
import { GRANITO } from '../src/camera/rocce.js';

let ok = 0; const prova = (nome, f) => { f(); ok++; console.log('  ✓', nome); };
const granito = (seme = 'prova/granito', extra = {}) => campoGrani({ modo: 'tassellatura', granoM: 4e-3, minerali: GRANITO, polarizzata: true, ...extra }, sorgente(seme));
// i grani distinti visti su una griglia fine di un quadrato largo L (m), e la frazione di punti senza grano (vetro o pori)
function censimento(C, L, n = 220) { const visti = new Set(); let vuoti = 0; for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { const g = C.granoIn(((i + 0.5) / n) * L, ((j + 0.5) / n) * L); if (g) visti.add(g.indirizzo); else vuoti++; } return { grani: visti.size, vuoti: vuoti / (n * n) }; }

prova('la costante di Avrami in sezione: Γ(4/3)·(3/π)^⅓ ≈ 0,879', () => assert.ok(Math.abs(AVRAMI_2D - 0.8794) < 1e-3));
prova('la densità dei grani è quella della legge (Johnson-Mehl: dal grano medio, non scelta)', () => {
  const C = granito(), L = 0.12, c = censimento(C, L), atteso = C.conta(L * L);
  // (i grani tagliati dal bordo del quadrato contano anche loro: qualche percento in più)
  assert.ok(c.grani > 0.85 * atteso && c.grani < 1.35 * atteso, `${c.grani} grani contati, ${atteso.toFixed(0)} attesi`);
  assert.ok(c.vuoti < 0.002, 'un granito è tutto cristallino');
});
prova('ogni grano è un evento con indirizzo: lo stesso punto dà lo stesso grano, un altro luogo un altro', () => {
  const a = granito().granoIn(0.0123, 0.0456), b = granito().granoIn(0.0123, 0.0456), c = granito('prova/altrove').granoIn(0.0123, 0.0456);
  assert.deepEqual(a, b); assert.ok(/grani\/cella -?\d+ -?\d+\/\d+$/.test(a.indirizzo)); assert.notEqual(a.indirizzo, c.indirizzo);
  assert.ok(GRANITO.some((m) => m.nome === a.minerale));
});
prova('le proporzioni dei minerali sono quelle della ricetta (entro il caso)', () => {
  const C = granito(), n = 160, conta = {}; for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { const g = C.granoIn((i / n) * 0.2, (j / n) * 0.2); conta[g.minerale] = (conta[g.minerale] || 0) + 1; }
  for (const m of GRANITO) assert.ok(Math.abs(conta[m.nome] / (n * n) - m.frazione) < 0.12, `${m.nome}: ${(conta[m.nome] / (n * n)).toFixed(2)} contro ${m.frazione}`);
});
prova('un fuso che non fa in tempo resta in parte vetro, quanto dice Avrami', () => {
  const C = granito('prova/vetro', { cristallino: 0.6 }), c = censimento(C, 0.1);
  assert.ok(Math.abs(c.vuoti - 0.4) < 0.08, `vetro ${c.vuoti.toFixed(2)}`);
});
prova('il sedimento: granelli alla rinfusa con la porosità di una sabbia (0,38)', () => {
  const C = campoGrani({ modo: 'impacchettamento', granoM: 3e-4, selezione: 0.6, minerali: [{ nome: 'quarzo', frazione: 1, colore: [206, 198, 182] }] }, sorgente('prova/sabbia')), c = censimento(C, 0.01);
  assert.ok(Math.abs(c.vuoti - 0.38) < 0.06, `pori ${c.vuoti.toFixed(2)}`);
});
prova('i grani del ghiaccio crescono con Gow: fermi a −198 °C, a −20 °C sì', () => {
  const D0 = 2e-3; assert.ok(Math.abs(granoGhiaccio(75, 1e4, D0).D - D0) < 1e-12);
  const caldo = granoGhiaccio(253, 100, D0); assert.ok(caldo.D > D0 * 1.1, `${caldo.D}`);
  // Alley 1982: a −54,3 °C, K ≈ 4,2·10⁻⁴ mm²/anno
  assert.ok(Math.abs(granoGhiaccio(273.15 - 54.3, 1, 1e-3).K * 1e6 / 4.2e-4 - 1) < 0.25);
});
prova('le tracce: quante sono lo dicono i ritmi veri e la memoria; se ne disegnano quante lo schermo ne regge', () => {
  const L = luogoDaRoccia({ minerali: [{ nome: 'quarzo', frazione: 0.3 }, { nome: 'biotite', frazione: 0.1 }, { nome: 'feldspato potassico', frazione: 0.6 }], continente: true, etaRoccia: 1e9, T: 288, indirizzo: 'prova/roccia' });
  const P = popolazioneTracce(L, { minerale: 'biotite' }, sorgente('prova/tracce')), Q = popolazioneTracce(L, { minerale: 'quarzo' }, sorgente('prova/tracce'));
  assert.ok(P.processi.some((p) => p.memoria), 'la biotite ricorda le α e le fissioni');
  assert.ok(!Q.processi.some((p) => p.memoria), 'il quarzo non ricorda: solo il presente');
  let linee = 0; const ctx = { beginPath() {}, moveTo() {}, lineTo() {}, stroke() { linee++; }, set strokeStyle(v) {}, set lineWidth(v) {}, set globalAlpha(v) {}, set lineCap(v) {} };
  const W = 800, H = 600, v = P.dipingi(ctx, { W, H, ox: W / 2, oy: H / 2, k: W / 1e-3 }); // uno schermo largo un millimetro
  assert.ok(v.vere > 1e6, `vere ${v.vere}`); assert.ok(v.disegnate > 50 && v.disegnate <= 1500 * P.processi.length, `disegnate ${v.disegnate}`); assert.ok(linee >= v.disegnate);
  const v2 = P.dipingi(ctx, { W, H, ox: W / 2, oy: H / 2, k: W / 2e-3 }); assert.ok(v2.vere / v.vere > 3 && v2.vere / v.vere < 5, `il conteggio vero va con l'area (più quelle che entrano dai bordi): ×${(v2.vere / v.vere).toFixed(2)}`);
  // nell'acqua, nel presente (0,1 s): quasi niente rispetto a ciò che la roccia ricorda
  const A = luogoDaAcqua({ lat: 10, lon: 0, profonditaM: 0, T: 290, totali: { K: 0.0102 }, indirizzo: 'prova/acqua' }), PA = popolazioneTracce(A, {}, sorgente('prova/acqua'));
  assert.ok(PA.processi.every((p) => !p.memoria)); assert.ok(PA.dipingi(ctx, { W, H, ox: W / 2, oy: H / 2, k: W / 1e-3 }).vere < 1e-6 * v.vere, 'il presente dell\'acqua è un niente rispetto all\'età della roccia');
});
console.log(`grani: ${ok} prove passate`);
