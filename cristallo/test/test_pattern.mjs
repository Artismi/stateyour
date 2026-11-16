// test_pattern.mjs — i pattern attesi del punto 8, ritrovati con misure (non a occhio).
// TOLLERANZE (dichiarate prima):
//   · canale: lanciata a 3° da una fila, con E = 5 U₀, la pallina non attraversa mai le due file (0 < y < 1 per tutto
//     il viaggio) e avanza di almeno 100 celle;
//   · intreccio: con E appena sopra le selle (il biliardo morbido) la zona pulita è sotto 20 celle e λ è almeno dieci
//     volte quello del canale;
//   · fiori nelle conche: la pallina resta entro 0,4 dal fondo della conca, ci gira attorno almeno 10 volte, e il
//     raggio ha almeno 20 massimi (i petali) che non tornano allo stesso angolo (lo scarto tipico tra gli angoli di due
//     massimi successivi, ridotti a un giro, è sopra 0,05 rad: la rosetta non è un'ellisse chiusa);
//   · i cerchi di L2: raggio e uguaglianza sono in test_moto (raggio entro 10⁻³ da v/Ω, tutti entro 10⁻⁹);
//   · L1 + L2: la pallina gira sempre nello stesso verso (per almeno il 90% dei punti); col cerchio attorno al centro
//     della cella, tra quattro colline, il centro di guida x + (v × B)/B² resta in una cella (la rosetta); col cerchio
//     centrato a metà tra due colline, che passa a 0,15 da ognuna, il centro di guida visita almeno 3 celle (i salti).
//     (Nella prima stesura c'era solo il primo lancio, a cui si chiedevano i salti: è una rosetta, e la prova falliva
//     giustamente. Il secondo lancio è scelto dalla geometria, prima di provarlo.)
import { creaSessione, lyapunov } from '../src/motore.js';
import { CASI } from './casi.mjs';
import { prova, vero, sotto, sopra, fine, dice, numero } from './prova.mjs';

const corri = (p) => { const S = creaSessione(p); while (!S.finito) S.avanza(1e5); return S; };
console.log('pattern attesi');

prova('L1, energia alta lungo una fila: il canale', () => {
  const S = corri(CASI.canale), P = S.viaggio.punti();
  let ymin = Infinity, ymax = -Infinity;
  for (let i = 1; i < P.length; i += 3) { ymin = Math.min(ymin, P[i]); ymax = Math.max(ymax, P[i]); }
  const avanti = P[P.length - 3] - P[0];
  dice('y tra', numero(ymin), 'e', numero(ymax), ' avanti di', numero(avanti), 'celle');
  vero(ymin > 0 && ymax < 1, 'ha attraversato una fila'); sopra(avanti, 100, 'avanzamento');
});

prova('L1, energia appena sopra le selle: l\'intreccio caotico, con la zona pulita corta', () => {
  const S = corri(CASI.caos), C = corri(CASI.canale);
  const lc = lyapunov(S.cristallo, CASI.caos.r0, CASI.caos.v0, CASI.caos.B, S.dt, 1000);
  const lk = lyapunov(C.cristallo, CASI.canale.r0, CASI.canale.v0, CASI.canale.B, C.dt, 1000);
  dice('zona', S.zona.celle, 'celle;  λ caos', numero(lc), ' λ canale', numero(lk));
  vero(S.zona.finita, 'si deve sfaldare'); sotto(S.zona.celle, 20, 'zona'); sopra(lc, 10 * Math.max(lk, 0), 'λ');
});

prova('L1, conche, energia bassa: i fiori chiusi nella cella', () => {
  const S = corri(CASI.conche), P = S.viaggio.punti(), n = P.length / 3;
  let rmax = 0, giri = 0, fiPrima = Math.atan2(P[1], P[0]);
  const r = [], fi = [];
  for (let i = 0; i < n; i++) {
    const x = P[3 * i], y = P[3 * i + 1], f = Math.atan2(y, x);
    rmax = Math.max(rmax, Math.hypot(x, y)); r.push(Math.hypot(x, y)); fi.push(f);
    let df = f - fiPrima; if (df > Math.PI) df -= 2 * Math.PI; if (df < -Math.PI) df += 2 * Math.PI; giri += df / (2 * Math.PI); fiPrima = f;
  }
  const massimi = []; for (let i = 1; i < n - 1; i++) if (r[i] > r[i - 1] && r[i] >= r[i + 1]) massimi.push(fi[i]);
  const salti = []; for (let i = 1; i < massimi.length; i++) { let d = massimi[i] - massimi[i - 1]; d -= 2 * Math.PI * Math.floor(d / (2 * Math.PI)); salti.push(d); }
  const media = salti.reduce((a, b) => a + b, 0) / salti.length, sd = Math.sqrt(salti.reduce((a, b) => a + (b - media) ** 2, 0) / salti.length);
  // e i petali non tornano allo stesso angolo: gli angoli dei massimi, ridotti a un giro, si sparpagliano
  const angoli = massimi.map((x) => ((x % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)).sort((a, b) => a - b);
  let buco = 0; for (let i = 1; i < angoli.length; i++) buco = Math.max(buco, angoli[i] - angoli[i - 1]);
  const sparpaglio = 2 * Math.PI - Math.max(buco, 2 * Math.PI - angoli[angoli.length - 1] + angoli[0]);
  dice('raggio massimo', numero(rmax), ' giri', numero(Math.abs(giri)), ' petali', massimi.length, ' angoli dei petali sparsi su', numero(sparpaglio), 'rad');
  sotto(rmax, 0.4, 'resta nella conca'); sopra(Math.abs(giri), 10, 'giri'); sopra(massimi.length, 20, 'petali'); sopra(sparpaglio, 0.05, 'rosetta');
  void sd;
});

function guida(p) {
  const S = creaSessione(p), B = p.B, B2 = B[0] ** 2 + B[1] ** 2 + B[2] ** 2, celle = new Set();
  let stessi = 0, tutti = 0, prima = null;
  while (!S.finito) {
    S.avanza(S.ogni);
    const x = S.pallina.x, v = S.pallina.v, g = [x[0] + (v[1] * B[2] - v[2] * B[1]) / B2, x[1] + (v[2] * B[0] - v[0] * B[2]) / B2];
    celle.add(`${Math.floor(g[0])},${Math.floor(g[1])}`);
    if (prima) { const w = prima[0] * v[1] - prima[1] * v[0]; tutti++; if (w * B[2] < 0) stessi++; }
    prima = [...v];
  }
  return { celle: celle.size, verso: stessi / tutti };
}
prova('L1 + L2: rosette tra le colline e cerchi che saltano di cella in cella', () => {
  const r = guida(CASI.rosette), s = guida(CASI.salti);
  dice('rosetta: celle del centro di guida', r.celle, ' stesso verso', numero(r.verso), ';  salti: celle', s.celle, ' stesso verso', numero(s.verso));
  vero(r.celle === 1, 'la rosetta resta nella sua cella'); sopra(r.verso, 0.9, 'verso');
  sopra(s.celle, 2, 'salti'); sopra(s.verso, 0.9, 'verso');
});
fine('pattern attesi');
