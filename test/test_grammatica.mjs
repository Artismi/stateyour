// La grammatica: simmetrie, ruoli, reticolo e parola.
import assert from 'node:assert/strict';
import { T, simmetria, motivo, cella, reticolo, parola, tratto } from '../src/grammatica.js';
import { MOTIVI } from '../src/motivi.js';
import { CELLE } from '../src/celle.js';

const vicino = (a, b, eps = 1e-6) => Math.abs(a - b) < eps;

// ogni tratto dell'alfabeto produce almeno una linea con almeno due punti
for (const nome of Object.keys(MOTIVI)) {
  const l = tratto(nome);
  assert.ok(l.length >= 1 && l.every((x) => x.length >= 2), `tratto ${nome} vuoto`);
}

// simmetrie: C_n ha n copie, D_n ne ha 2n; D2 contiene i quattro spicchi
assert.equal(simmetria({ tipo: 'C', n: 5 }).length, 5);
assert.equal(simmetria({ tipo: 'D', n: 4 }).length, 8);
{
  const p = [3, 1];
  const immagini = simmetria({ tipo: 'D', n: 2 }).map((M) => T.applica(M, p)).map((q) => q.map((v) => Math.round(v * 1e6) / 1e6));
  const attese = [[3, 1], [-3, -1], [3, -1], [-3, 1]];
  for (const a of attese) assert.ok(immagini.some((q) => vicino(q[0], a[0]) && vicino(q[1], a[1])), `manca lo spicchio ${a}`);
}

// specchio rispetto a un asse a 45°: scambia x e y
{
  const q = T.applica(T.specchio(45), [2, 0]);
  assert.ok(vicino(q[0], 0) && vicino(q[1], 2));
}

// un motivo D4 di un arco ha otto copie dell'arco
assert.equal(motivo({ tratto: 'arco', simmetria: { tipo: 'D', n: 4 } }).length, 8);

// la cella: angoli e lati sono quattro, la corolla n, il contenuto segue l'indice
{
  const c = {
    lato: 100,
    centro: { tratto: 'cerchio' },
    angoli: { tratto: 'segmento' },
    lati: { tratto: 'segmento' },
    corolla: { n: 9, raggio: 30, motivo: { tratto: 'segmento' } },
    contenuto: [{ tratto: 'cerchio', parametri: { r: 10 } }, { tratto: 'quadrato', parametri: { l: 20 } }],
  };
  const conta = (ruolo, k = 0) => cella(c, k).pezzi.filter((p) => p.ruolo === ruolo).length;
  assert.equal(conta('angoli'), 4);
  assert.equal(conta('lati'), 4);
  assert.equal(conta('corolla'), 9);
  assert.equal(conta('centro'), 1);
  const cont0 = cella(c, 0).pezzi.find((p) => p.ruolo === 'contenuto');
  const cont1 = cella(c, 1).pezzi.find((p) => p.ruolo === 'contenuto');
  assert.equal(cont0.linee.length, 1, 'indice 0: il cerchio, una linea');
  assert.equal(cont1.linee.length, 4, 'indice 1: il quadrato, quattro linee');
  // gli angoli stanno agli angoli: il baricentro di ciascuno è vicino a (±50, ±50)
  for (const p of cella(c).pezzi.filter((p) => p.ruolo === 'angoli')) {
    const pts = p.linee.flat();
    const cx = pts.reduce((s, q) => s + q[0], 0) / pts.length, cy = pts.reduce((s, q) => s + q[1], 0) / pts.length;
    assert.ok(vicino(Math.abs(cx), 50, 1e-6) && vicino(Math.abs(cy), 50, 1e-6), `angolo in (${cx}, ${cy})`);
  }
}

// il reticolo pmm: la cella (1,0) è l'immagine speculare della (0,0) rispetto al bordo comune
{
  const r = { cella: { lato: 100, centro: { tratto: 'uncino' } }, colonne: 2, righe: 1, gruppo: 'pmm' };
  const res = reticolo(r);
  const a = res.pezzi.find((p) => p.i === 0).linee[0], b = res.pezzi.find((p) => p.i === 1).linee[0];
  assert.equal(a.length, b.length);
  for (let k = 0; k < a.length; k++) {
    assert.ok(vicino(a[k][0], 200 - b[k][0]) && vicino(a[k][1], b[k][1]), 'pmm non specchia sul bordo');
  }
}

// il ritmo: lungo la riga la sequenza si legge cella per cella
{
  const r = { cella: { lato: 10, contenuto: [{ tratto: 'segmento' }, { tratto: 'cerchio' }, { tratto: 'quadrato' }] }, colonne: 4, righe: 1, ritmo: { sequenza: [0, 2, 1, 2] } };
  const k = reticolo(r).pezzi.map((p) => p.k);
  assert.deepEqual(k, [0, 2, 1, 2]);
}

// le piastrelle di esempio si compongono tutte e hanno una parola
for (const [nome, r] of Object.entries(CELLE)) {
  const res = reticolo(r);
  assert.ok(res.pezzi.length > 0, `${nome} vuota`);
  const w = parola(r);
  assert.ok(w.startsWith('CELLA') && w.includes('RETICOLO'), `parola di ${nome}: ${w}`);
  console.log(`ok  ${nome.padEnd(18)} ${w}`);
}
console.log('test_grammatica: tutto ok');
