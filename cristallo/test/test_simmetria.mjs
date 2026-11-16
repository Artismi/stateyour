// test_simmetria.mjs — la simmetria che emerge (punti 8 e 9): non è scritta da nessuna parte, viene dalla cella.
// TOLLERANZE (dichiarate prima):
//   · la tessera ruotata: nel piano esagonale, il lancio ruotato di 60° attorno a un atomo dà la traiettoria ruotata
//     entro d per tutta la zona pulita; nella cella obliqua (γ = 75°, b = 1,15) se ne stacca più di d dentro la zona;
//   · il pattern sulla finestra: la densità delle linee su una griglia 40 × 40, confrontata con sé stessa ruotata
//     attorno al centro dell'immagine (dentro il cerchio di raggio 0,45·L), ha lo scarto relativo
//     m = ‖D − D∘R‖ / ‖D − media‖ sotto 0,25 quando la rotazione è una simmetria del taglio, e sopra 0,5 quando no:
//       esagonale (001) 60° · cubico (100) 90° (anche in prospettiva) · cubico (111) 120° · piano esagonale 60°: sì;
//       cubico (110) 90° · piano obliquo 60°: no.
//     (La misura è statistica: la traiettoria caotica riempie la cella in modo ergodico, e il rumore cala come
//     1/√durata. Con la prima durata, 1500 unità nello spazio, i casi simmetrici stavano tra 0,5 e 0,96, e a 6000 tra
//     0,22 e 0,42: la soglia non si tocca, si allunga la corsa a 40000 unità nello spazio e 24000 nel piano.)
import { creaSessione, sogliaDi } from '../src/motore.js';
import { creaFinestra, creaProiettore } from '../src/finestra.js';
import { normaleDi } from '../src/indici.js';
import { creaCristallo } from '../src/reticolo.js';
import { CASI, config, piano } from './casi.mjs';
import { prova, vero, sotto, sopra, fine, dice, numero } from './prova.mjs';

console.log('simmetria');
const ruota = (v, th) => [Math.cos(th) * v[0] - Math.sin(th) * v[1], Math.sin(th) * v[0] + Math.cos(th) * v[1], v[2]];

prova('la tessera esagonale ruotata di 60° coincide con sé stessa entro la zona pulita; la cella obliqua no', () => {
  const esito = {};
  for (const [nome, ret] of [['esagonale', piano('esagonale')], ['obliquo', { ...piano('obliquo'), b: 1.15, gamma: 75 }]]) {
    const p = config({ ...CASI.caos, reticolo: ret }), A = creaSessione(p);
    while (!A.finito) A.avanza(1e5);
    const th = Math.PI / 3, q = config({ ...p, r0: ruota(p.r0, th), v0: ruota(p.v0, th) }), B = creaSessione(q, { dt: A.dt });
    while (!B.finito) B.avanza(1e5);
    const P = A.viaggio.punti(), Q = B.viaggio.punti(), fino = A.zona.finita ? A.zona.tempo : Infinity;
    let e = 0;
    for (let i = 0; i < Math.min(P.length, Q.length) / 3; i++) {
      if (i * A.ogni * A.dt > fino) break;
      const r = ruota([P[3 * i], P[3 * i + 1], 0], th); e = Math.max(e, Math.hypot(r[0] - Q[3 * i], r[1] - Q[3 * i + 1]));
    }
    esito[nome] = e; dice(nome.padEnd(10), 'zona', A.zona.celle, 'celle;  scarto massimo dentro la zona', numero(e), '/ d =', numero(sogliaDi(p.finestra)));
  }
  sotto(esito.esagonale, 0.01, 'esagonale'); sopra(esito.obliquo, 0.01, 'obliquo');
});

// la densità delle linee del pattern sulla finestra, e il suo scarto dalla ruotata
function densita(p, G = 40) {
  const S = creaSessione(p), f = creaFinestra(p.finestra), P = creaProiettore(f, S.cristallo, true, Infinity), L = f.L, D = new Float64Array(G * G);
  while (!S.finito) {
    S.avanza(2e4);
    const s = P.proietta(S.tessera.s, S.tessera.vel, 0, S.tessera.n);
    for (let q = 0; q < s.length; q += 6) {
      const x = (s[q] + s[q + 2]) / 2, y = (s[q + 1] + s[q + 3]) / 2, i = Math.floor((x / L + 0.5) * G), j = Math.floor((y / L + 0.5) * G);
      if (i >= 0 && i < G && j >= 0 && j < G) D[j * G + i] += Math.hypot(s[q + 2] - s[q], s[q + 3] - s[q + 1]) * s[q + 4];
    }
    S.tessera.n = 0; S.tratti.n = 0; S.viaggio.n = 0; // (già proiettati: non serve tenerli)
  }
  return { D, G, L, S };
}
function scartoRotazione({ D, G }, th) {
  const val = (x, y) => { // bilineare, in coordinate di griglia
    const i = Math.floor(x), j = Math.floor(y), a = x - i, b = y - j, g = (u, v) => D[Math.min(G - 1, Math.max(0, v)) * G + Math.min(G - 1, Math.max(0, u))];
    return (1 - a) * (1 - b) * g(i, j) + a * (1 - b) * g(i + 1, j) + (1 - a) * b * g(i, j + 1) + a * b * g(i + 1, j + 1);
  };
  const c = (G - 1) / 2, punti = [];
  for (let j = 0; j < G; j++) for (let i = 0; i < G; i++) {
    const x = i - c, y = j - c; if (Math.hypot(x, y) > 0.45 * G) continue;
    punti.push([D[j * G + i], val(c + Math.cos(th) * x - Math.sin(th) * y, c + Math.sin(th) * x + Math.cos(th) * y)]);
  }
  const m = punti.reduce((a, p) => a + p[0], 0) / punti.length;
  return Math.sqrt(punti.reduce((a, p) => a + (p[0] - p[1]) ** 2, 0) / punti.reduce((a, p) => a + (p[0] - m) ** 2, 0));
}

prova('il pattern sulla finestra ha la simmetria del taglio: esagonale 6, cubico (100) 4, (111) 3; (110) e la cella obliqua no', () => {
  // il caos nello spazio: colline larghe (w = 0,3), il lancio dal centro della cella con E cinetica 0,5 U₀
  const v = Math.sqrt(2 * 0.5), dir3 = [0.62, 0.48, 0.62].map((x) => x * v / Math.hypot(0.62, 0.48, 0.62));
  const spazio = (reticolo, hkl, th, R = Infinity) => {
    const cr = creaCristallo({ ...reticolo, atomi: [] }), n = normaleDi(hkl, cr);
    return [config({ reticolo, atomi: [{ p: [0, 0, 0], s: 1 }], w: 0.3, r0: [0.5 * cr.A[0][0] + 0.5 * cr.A[1][0], 0.5 * cr.A[1][1], 0.5 * cr.A[2][2]], v0: dir3, tempo: 40000,
      finestra: { C: [0, 0, 0], R, n, psi: 0.3, L: 3, D: 0.5 } }), th];
  };
  const casi = {
    'esagonale (001) 60°': [...spazio({ sistema: 'esagonale', centratura: 'P', c: 1.63 }, [0, 0, 1], Math.PI / 3), true],
    'cubico (100) 90°': [...spazio({ sistema: 'cubico', centratura: 'P' }, [1, 0, 0], Math.PI / 2), true],
    'cubico (100) 90° prosp.': [...spazio({ sistema: 'cubico', centratura: 'P' }, [1, 0, 0], Math.PI / 2, 3), true],
    'cubico (111) 120°': [...spazio({ sistema: 'cubico', centratura: 'P' }, [1, 1, 1], (2 * Math.PI) / 3), true],
    'piano esagonale 60°': [config({ ...CASI.caos, tempo: 24000, finestra: { ...CASI.caos.finestra, L: 3 } }), Math.PI / 3, true],
    'cubico (110) 90°': [...spazio({ sistema: 'cubico', centratura: 'P' }, [1, 1, 0], Math.PI / 2), false],
    'piano obliquo 60°': [config({ ...CASI.caos, reticolo: { ...piano('obliquo'), b: 1.15, gamma: 75 }, tempo: 24000, finestra: { ...CASI.caos.finestra, L: 3 } }), Math.PI / 3, false],
  };
  for (const [nome, [p, th, simmetrico]] of Object.entries(casi)) {
    if (p.finestra.R !== Infinity) p.finestra.D = 3;
    const d = densita(p), m = scartoRotazione(d, th);
    dice(nome.padEnd(24), 'm =', numero(m), simmetrico ? '(deve stare sotto 0,25)' : '(deve stare sopra 0,5)', ' zona', d.S.zona.celle, 'celle');
    if (simmetrico) sotto(m, 0.25, nome); else sopra(m, 0.5, nome);
  }
});
fine('simmetria');
