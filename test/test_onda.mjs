// Verifica che l'onda di mezze ellissi esca dalle formule, non dal caso.
import assert from 'node:assert/strict';
import { simula } from '../src/motore.js';
import { generaOnda } from '../src/partiture.js';

function analizza(partitura, L, f, x0, y0, n) {
  const [tr] = simula(partitura);
  // 1. gli attraversamenti della riga cadono in x0 + i·L
  const attr = tr.eventi.filter((e) => e.attraversa !== undefined);
  assert.equal(attr.length, n, `attesi ${n} attraversamenti, trovati ${attr.length}`);
  attr.forEach((e, i) => {
    const xAtteso = x0 + (i + 1) * L;
    assert.ok(Math.abs(e.pos[0] - xAtteso) < 0.5, `attraversamento ${i}: x=${e.pos[0].toFixed(3)} atteso ${xAtteso}`);
    assert.ok(Math.abs(e.pos[1] - y0) < 1e-5, `attraversamento ${i} non sulla riga: y=${e.pos[1]}`);
  });
  // 2. l'ampiezza di ogni mezza onda è b = sqrt(f(L-f)), alternando sopra e sotto
  const b = Math.sqrt(f * (L - f));
  const passiAttr = [0, ...attr.map((e) => e.passo)];
  for (let i = 0; i < n; i++) {
    const tratto = tr.punti.slice(passiAttr[i], passiAttr[i + 1] + 1);
    const dy = tratto.map((p) => p[1] - y0);
    const estremo = i % 2 === 0 ? Math.max(...dy) : Math.min(...dy);
    assert.ok(Math.abs(Math.abs(estremo) - b) / b < 0.01, `mezza onda ${i}: ampiezza ${estremo.toFixed(2)} attesa ${b.toFixed(2)}`);
    // tutta da un lato
    const sbagliati = dy.filter((d) => (i % 2 === 0 ? d < -1e-3 : d > 1e-3)).length;
    assert.equal(sbagliati, 0, `mezza onda ${i} attraversa la riga dove non deve`);
  }
  // 3. dopo l'ultima massa la particella esce in linea retta e verticale
  const ultimo = tr.punti[tr.punti.length - 1], penultimo = tr.punti[tr.punti.length - 2];
  assert.ok(Math.abs(ultimo[0] - penultimo[0]) < 1e-6, 'uscita non verticale');
  return tr;
}

const casi = [
  { L: 120, f: 40, n: 7, alterna: true },
  { L: 120, f: 60, n: 7, alterna: true },   // semicerchi
  { L: 100, f: 25, n: 5, alterna: true },   // molto eccentrica
  { L: 120, f: 50, n: 6, alterna: false },  // masse decrescenti, offset costante
];
for (const c of casi) {
  const p = generaOnda({ ...c, x0: 80, y0: 300 });
  const tr = analizza(p, c.L, c.f, 80, 300, c.n);
  console.log(`ok  L=${c.L} f=${c.f} n=${c.n} alterna=${c.alterna}  passi=${tr.passi} fine=${tr.fine}`);
}

// 4. controprova: masse uguali con offset costante NON danno l'onda (velocità discontinua)
{
  const p = generaOnda({ L: 120, f: 40, n: 5, alterna: false, x0: 80, y0: 300 });
  p.masse.forEach((m) => (m.M = 30000));
  const [tr] = simula(p);
  const attr = tr.eventi.filter((e) => e.attraversa !== undefined);
  const fuoriPosto = attr.some((e, i) => Math.abs(e.pos[0] - (80 + (i + 1) * 120)) > 0.5);
  assert.ok(fuoriPosto || attr.length < 5, 'con masse uguali e offset costante l\'onda non dovrebbe chiudersi');
  console.log('ok  controprova: senza il rapporto delle masse l\'onda si rompe');
}
console.log('test_onda: tutto ok');
