// test_sezione.mjs — le sezioni da un angolo, e il dado che cerca quelle belle
import assert from 'node:assert/strict';
import { proiettore, segmentiSezione, bellezza } from '../src/camera/sezione.js';
import { cercaSezione } from '../src/camera/cercatore.js';
import { universo } from '../src/camera/biblioteca.js';
import { simulaMondo, generatore } from '../src/camera/mondo.js';
import { ramo, perfeziona } from '../src/camera/vicini.js';
import { geometria, motivo, bellezzaPattern, RIPETI_BASE } from '../src/camera/pattern.js';

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
  const puri = []; for (let n = 100; n < 108; n++) { const u = universo(n); puri.push(bellezzaPattern(segmentiSezione(simulaMondo(u.cella), u.cella), RIPETI_BASE, u.cella.finestra.lato).totale); }
  const media = puri.reduce((a, b) => a + b, 0) / puri.length;
  const m = cercaSezione({ da: 300, universi: 8, inquadrature: 12, seme: 7 });
  assert.ok(m.bellezza.totale > 2 * media, `${m.bellezza.totale} contro ${media}`);
  // e la stessa ricerca, con lo stesso seme, ritrova la stessa sezione
  assert.equal(JSON.stringify(cercaSezione({ da: 300, universi: 8, inquadrature: 12, seme: 7 }).finestra), JSON.stringify(m.finestra));
});

prova('il caleidoscopio: le copie del triangolo riempiono il motivo, e le linee continuano negli specchi', () => {
  const area = (P) => { let a = 0; for (let i = 0; i < P.length; i++) { const p = P[i], q = P[(i + 1) % P.length]; a += p[0] * q[1] - q[0] * p[1]; } return Math.abs(a) / 2; };
  for (const gruppo of ['esagoni', 'quadrati']) {
    const G = geometria({ gruppo, angolo: 17 }, 200);
    assert.equal(G.copie.length, gruppo === 'esagoni' ? 12 : 8);
    assert.ok(Math.abs(G.copie.length * area(G.dominio) - area(G.poligono)) < 1e-6, `${gruppo}: le copie riempiono il poligono`);
    // un segmento che tocca il lato del triangolo opposto al centro finisce dove comincia la sua immagine
    const [O, M, V] = G.dominio, P = [(M[0] + V[0]) / 2, (M[1] + V[1]) / 2], Q = [(O[0] + P[0]) / 2, (O[1] + P[1]) / 2];
    const m = motivo([[Q[0], Q[1], P[0], P[1], 1, 0, 0]], { gruppo, angolo: 17 }, 200);
    const fine = m.segmenti.map((s) => [s[2], s[3]]);
    // nel poligono traslato del reticolo, l'immagine dello stesso punto sul bordo coincide con un altro estremo
    const { a, b } = G.reticolo, vicinoA = (p) => fine.some((q) => [[a[0], a[1]], [b[0], b[1]], [-a[0], -a[1]], [-b[0], -b[1]], [a[0] - b[0], a[1] - b[1]], [b[0] - a[0], b[1] - a[1]]].some((t) => Math.hypot(q[0] + t[0] - p[0], q[1] + t[1] - p[1]) < 1e-6));
    assert.ok(fine.every((p) => vicinoA(p)), `${gruppo}: ogni linea che esce dal motivo rientra nel vicino`);
  }
  assert.equal(bellezzaPattern([], RIPETI_BASE, 100).totale, 0);
});

prova('i rami paralleli: un evento va diversamente, e cambia solo ciò che ne discende', () => {
  const u = universo(285085), a = simulaMondo(u.cella), d = a.decadimenti[Math.floor(a.decadimenti.length / 2)];
  const c2 = ramo(u.cella, d.evento, generatore(4)), b = simulaMondo(c2);
  assert.equal(c2.seme, u.cella.seme); assert.ok(c2.rami[d.evento] > 0);
  const firma = (T) => new Map(T.map((t) => [t.evento, JSON.stringify(t.punti)]));
  const A = firma(a), B = firma(b);
  let diverse = 0;
  for (const [k, v] of A) if (B.get(k) !== v) { diverse++; assert.ok(k === d.evento || k.startsWith(d.evento + '.'), `è cambiata ${k}, che non discende da ${d.evento}`); }
  assert.ok(diverse >= 1, 'il ramo deve cambiare qualcosa');
  // e lo stesso ramo è sempre lo stesso universo
  assert.equal(JSON.stringify(simulaMondo(c2).map((t) => t.punti.length)), JSON.stringify(b.map((t) => t.punti.length)));
  // la ricerca del ramo migliore non scende
  const m = cercaSezione({ solo: 285085, inquadrature: 4, seme: 2 });
  const p = perfeziona({ cella: u.cella, finestra: m.finestra, vista: m.vista, sezione: m.sezione, ripeti: m.ripeti }, { passi: 14, seme: 3 });
  assert.ok(p.bellezza.totale >= m.bellezza.totale - 1e-9, `la ricerca non scende: ${p.bellezza.totale} contro ${m.bellezza.totale}`);
});

console.log(`sezione: ${ok} prove, tutto ok`);
