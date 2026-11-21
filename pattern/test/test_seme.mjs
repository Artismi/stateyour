// Il seme: una sola configurazione iniziale genera tutto il pattern.
// Verifica che la simulazione del seme dia le stesse linee che si ottengono
// calcolando ogni tratto da solo e spostandolo al suo posto.
import assert from 'node:assert/strict';
import { simula } from '../src/motore.js';
import { reticolo, lineeDaTracce } from '../src/grammatica.js';
import { seme, contaSeme } from '../src/seme.js';
import { CELLE } from '../src/celle.js';

function confronta(nome, r) {
  const conf = seme(r);
  const t0 = Date.now();
  const tracce = simula(conf);
  const ms = Date.now() - t0;
  const dalSeme = lineeDaTracce(tracce);
  const attese = reticolo(r).pezzi.flatMap((p) => p.linee);
  assert.equal(dalSeme.length, attese.length, `${nome}: ${dalSeme.length} linee dal seme, ${attese.length} attese`);
  const scala = Math.max(r.cella.lato ?? 120, 1);
  // distanza di un punto da una polilinea, cercando vicino all'indice atteso
  const daLinea = (q, linea, k0) => {
    let best = Infinity;
    const da = Math.max(0, k0 - 40), a = Math.min(linea.length - 1, k0 + 40);
    for (let k = da; k < a; k++) {
      const [x1, y1] = linea[k], [x2, y2] = linea[k + 1];
      const dx = x2 - x1, dy = y2 - y1, l2 = dx * dx + dy * dy;
      const t = l2 ? Math.max(0, Math.min(1, ((q[0] - x1) * dx + (q[1] - y1) * dy) / l2)) : 0;
      best = Math.min(best, Math.hypot(q[0] - x1 - t * dx, q[1] - y1 - t * dy));
    }
    return best;
  };
  let scartoMax = 0;
  dalSeme.forEach((l, i) => {
    const a = attese[i];
    // un passaggio di blocco può cadere un passo prima o dopo: pochi punti di differenza
    assert.ok(Math.abs(l.length - a.length) <= 5 + 0.01 * a.length, `${nome}, linea ${i}: ${l.length} punti contro ${a.length}`);
    const passo = Math.max(1, Math.floor(l.length / 60));
    for (let k = 0; k < l.length; k += passo) scartoMax = Math.max(scartoMax, daLinea(l[k], a, Math.round(k * a.length / l.length)));
    scartoMax = Math.max(scartoMax, Math.hypot(l[0][0] - a[0][0], l[0][1] - a[0][1]));
    scartoMax = Math.max(scartoMax, Math.hypot(l[l.length - 1][0] - a[a.length - 1][0], l[l.length - 1][1] - a[a.length - 1][1]));
  });
  assert.ok(scartoMax < 1e-6 * scala, `${nome}: scarto ${scartoMax}`);
  const c = contaSeme(conf);
  console.log(`ok  ${nome.padEnd(22)} seme: ${String(c.sorgenti).padStart(4)} sorgenti, ${String(c.blocchi).padStart(4)} blocchi, ${String(c.masse).padStart(4)} masse, ${String(c.interfacce).padStart(3)} specchi, ${String(c.regole).padStart(4)} regole → ${dalSeme.length} linee, scarto ${scartoMax.toExponential(1)}, ${ms} ms`);
}

// piccoli reticoli: ogni gruppo (traslazione, specchio, rotazione, esagonale)
const casi = {
  girale: { ...CELLE.girale, colonne: 2 },
  candelabro: CELLE.candelabro,                        // D1: volute specchiate, il magnetico cambia verso
  palmetta: CELLE.palmetta,                            // corolla ruotata e scalata
  nuvola_ruyi: { ...CELLE.nuvola_ruyi, colonne: 2, righe: 2 },
  spicchi: { ...CELLE.spicchi, colonne: 2, righe: 2 },  // pmm sull'onda a blocchi
  rombi_p2: { ...CELLE.rombi_p2, colonne: 2, righe: 2 },
  corolla_ciclica: { ...CELLE.corolla_ciclica, colonne: 2, righe: 2 }, // p4 sulle orbite
  contenitore_ritmo: { ...CELLE.contenitore_ritmo, colonne: 4, righe: 1 }, // rifrazione specchiata (zigzag D2)
  ventagli_sfalsati: { ...CELLE.ventagli_sfalsati, colonne: 2, righe: 2 }, // specchi
  cinese_greca: { ...CELLE.cinese_greca, colonne: 3 },
  bizantino_esagoni: { ...CELLE.bizantino_esagoni, colonne: 3, righe: 2 },
  fregio_onda: { ...CELLE.fregio_onda, colonne: 4 },
};
for (const [nome, r] of Object.entries(casi)) confronta(nome, r);

// lo specchio di una voluta: il campo magnetico deve cambiare verso, altrimenti
// la copia specchiata si avvolgerebbe dalla parte sbagliata
{
  const r = { cella: { lato: 100, centro: { tratto: 'spirale', parametri: { r0: 20, rMin: 2, giri: 2 }, simmetria: { tipo: 'D', n: 1, fase: 90 } } }, colonne: 1, righe: 1 };
  const conf = seme(r);
  const omega = conf.campi.filter((c) => c.tipo === 'magnetico').map((c) => Math.sign(c.omega));
  assert.deepEqual(omega.sort(), [-1, 1], `versi del magnetico: ${omega}`);
  confronta('spirale specchiata', r);
}
console.log('test_seme: tutto ok');
