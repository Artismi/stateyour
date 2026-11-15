// La prova della patch eventi_registro.patch (da applicare a src/camera/eventi.js dopo il passaggio a 128 bit):
//   1. il registro dei tiri di conRegistro è IDENTICO a prima (chiavi, ordine, valori), con e senza «leggi»;
//   2. le leggi annotate da conRegistro(c, R, leggi) sono quelle di misura.conMisura, voce per voce;
//   3. i metodi nuovi della sorgente (bernoulli, discreta) danno l'esito che la legge dice, dallo stesso tiro di c();
//   4. misura.storia dà gli stessi bit sulle due annotazioni.
// Uso: node prova_patch.mjs [cartella con l'eventi.js patchato] (predefinita: ./b accanto a questo file)
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const qui = path.dirname(fileURLToPath(import.meta.url)), cartella = process.argv[2] ? path.resolve(process.argv[2]) : path.join(qui, 'b');
const R = '/home/user/stateyour/src/camera/';
const vecchio = await import(pathToFileURL(path.join(qui, 'a/eventi.js')).href), nuovo = await import(pathToFileURL(path.join(cartella, 'eventi.js')).href);
const M = await import(R + 'misura.js'), { formaPianeti } = await import(R + 'disco.js'), { stelleGalassia } = await import(R + 'galassie.js'), CO = await import(R + 'cosmo.js');
const finto = (c) => { const r = []; for (let i = 0; i < 40; i++) { const s = c.sotto(`lancio ${i}`); r.push(s.bernoulli ? s.bernoulli('moneta', 0.3) : s('moneta') < 0.3, s.intero('dado', 6), s.tra('dove', -2, 5), s.normale('rumore'), s.seme('seme'), s.serie('campo')(3), s.discreta ? s.discreta('scelta', [1, 2, 3.5]) : null); } return r; };
const consumatori = [
  ['disco.js formaPianeti (tiri nudi e serie)', (c) => formaPianeti({ massa: 1, Z: 1, eta: 4.6e9 }, c)],
  ['galassie.js stelleGalassia (normale, tra)', (c) => stelleGalassia(CO.cosmo(1).galassie[0].forma, c, { quante: 300 })],
  ['un consumatore finto (bernoulli, intero, tra, normale, seme, serie, discreta)', finto],
];
let n = 0;
for (const [nome, f] of consumatori) for (const rami of [null, { 'prova/patch/lancio 3/moneta': 2, 'prova/patch/stella 4/massa': 1 }]) {
  const radice = 'prova/patch', R0 = new Map(), R1 = new Map(), R2 = new Map(), Lp = new Map(), Lm = new Map();
  const fin = nome.startsWith('un consumatore'); // il finto usa i metodi nuovi solo con la sorgente patchata
  const e0 = f(vecchio.conRegistro(vecchio.sorgente(radice, rami), R0)), e1 = f(nuovo.conRegistro(nuovo.sorgente(radice, rami), R1)), e2 = f(nuovo.conRegistro(nuovo.sorgente(radice, rami), R2, Lp));
  const e3 = f(M.conMisura(nuovo.sorgente(radice, rami), Lm));
  if (!fin) { assert.deepEqual([...R1], [...R0], `${nome}: il registro cambia senza leggi`); assert.deepEqual([...R2], [...R0], `${nome}: il registro cambia con le leggi`); assert.deepEqual(JSON.stringify(e2), JSON.stringify(e0)); }
  else { assert.deepEqual([...R2], [...R1]); // (col vecchio i metodi nuovi non ci sono: il confronto è tra nuovo con e senza leggi)
    for (const [k, v] of Lp) if (v.legge === 'bernoulli') assert.equal(v.esito, v.tiri[0] < v.parametri.p); }
  assert.equal(JSON.stringify(e3), JSON.stringify(e2), `${nome}: conMisura e conRegistro danno esiti diversi`);
  assert.deepEqual([...Lp.keys()].sort(), [...Lm.keys()].sort(), `${nome}: eventi annotati diversi`);
  for (const [k, v] of Lp) { const w = Lm.get(k); assert.equal(v.legge, w.legge, k); assert.deepEqual(v.parametri, w.parametri, k); assert.deepEqual(v.tiri, w.tiri, k); assert.deepEqual(v.esito, w.esito, k); }
  assert.equal(M.storia(Lp).bit, M.storia(Lm).bit);
  const leggi = {}; for (const v of Lp.values()) leggi[v.legge] = (leggi[v.legge] || 0) + 1;
  console.log(`  ✓ ${nome}${rami ? ', con rami' : ''}: ${R0.size} tiri, registro identico; ${Lp.size} eventi con la legge (${Object.entries(leggi).map(([l, q]) => `${l} ${q}`).join(', ')}), ${M.storia(Lp).bit.toFixed(0)} bit`); n++;
}
// la sorgente stessa: bernoulli e discreta sono il tiro di c() letto con la legge
const c = nuovo.sorgente('prova/patch/sorgente'); for (let i = 0; i < 1000; i++) { const u = c(`x ${i}`); assert.equal(c.bernoulli(`x ${i}`, 0.37), u < 0.37); assert.equal(c.discreta(`x ${i}`, [1, 2, 3.5]), M.LEGGI.discreta.esito([u], { pesi: [1, 2, 3.5] })); }
console.log(`prova della patch: ${n + 1} prove, tutto ok`);
