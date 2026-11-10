// test_sezione.mjs — le sezioni da un angolo, e il dado che cerca quelle belle
import assert from 'node:assert/strict';
import { proiettore, segmentiSezione, bellezza } from '../src/camera/sezione.js';
import { cercaSezione } from '../src/camera/cercatore.js';
import { universo } from '../src/camera/biblioteca.js';
import { simulaMondo } from '../src/camera/mondo.js';

let ok = 0;
const prova = (nome, f) => { f(); ok++; console.log('  ✓', nome); };

prova('da sopra la sezione è la lastra di sempre; inclinata, il tempo entra nel disegno', () => {
  const P = proiettore({ inclinazione: 0, rotazione: 0, scalaTempo: 5 }, [100, 100, 10]);
  assert.deepEqual(P(130, 70, 99).map((x) => +x.toFixed(9)), [130, 70]);
  const Q = proiettore({ inclinazione: 90, rotazione: 0, scalaTempo: 2 }, [0, 0, 0]);
  const [u, v] = Q(3, 4, 5); assert.ok(Math.abs(u + 10) < 1e-9 && Math.abs(v - 4) < 1e-9, 'di fianco: un asse è il tempo');
  // un cerchio percorso nel tempo, visto di fianco, è un'onda
  const tr = [{ id: 0, punti: Array.from({ length: 400 }, (_, i) => { const t = i * 0.05; return [100 + 20 * Math.cos(t), 100 + 20 * Math.sin(t), true, t, 1, 'magnetico']; }) }];
  const cella = { finestra: { centro: [100, 100], lato: 200 }, sezione: { fine: 20, durata: 20 }, vista: { inclinazione: 80, rotazione: 0, scalaTempo: 5 } };
  const seg = segmentiSezione(tr, cella); const us = seg.map((s) => s[0]);
  assert.ok(Math.max(...us) - Math.min(...us) > 2 * 40, 'l\'onda si allunga lungo il tempo (da sopra sarebbe un cerchio largo 40)');
});

prova('la misura della bellezza: una sezione vuota vale zero, una struttura ordinata più di un groviglio', () => {
  assert.equal(bellezza([], 100).totale, 0);
  const anelli = []; for (let k = 0; k < 6; k++) for (let i = 0; i < 60; i++) { const a = (i / 60) * 2 * Math.PI, b = ((i + 1) / 60) * 2 * Math.PI, cx = 20 + k * 12, cy = 50; anelli.push([cx + 10 * Math.cos(a), cy + 10 * Math.sin(a), cx + 10 * Math.cos(b), cy + 10 * Math.sin(b), 1.2, k, i]); }
  let s = 5; const caso = () => ((s = (s * 16807) % 2147483647) / 2147483647), groviglio = [];
  for (let k = 0; k < 60; k++) { const x = caso() * 100, y = caso() * 100; groviglio.push([x, y, x + (caso() - 0.5) * 60, y + (caso() - 0.5) * 60, 1.2, k, 0]); }
  assert.ok(bellezza(anelli, 100).totale > bellezza(groviglio, 100).totale);
});

prova('il dado trova sezioni molto più belle del caso puro', () => {
  const puri = []; for (let n = 100; n < 108; n++) { const u = universo(n); puri.push(bellezza(segmentiSezione(simulaMondo(u.cella), u.cella), u.cella.finestra.lato).totale); }
  const media = puri.reduce((a, b) => a + b, 0) / puri.length;
  const m = cercaSezione({ da: 300, universi: 8, inquadrature: 12, seme: 7 });
  assert.ok(m.bellezza.totale > 2 * media, `${m.bellezza.totale} contro ${media}`);
  // e la stessa ricerca, con lo stesso seme, ritrova la stessa sezione
  assert.equal(JSON.stringify(cercaSezione({ da: 300, universi: 8, inquadrature: 12, seme: 7 }).finestra), JSON.stringify(m.finestra));
});

console.log(`sezione: ${ok} prove, tutto ok`);
