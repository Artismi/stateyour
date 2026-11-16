// test_moto.mjs — l'energia, Boris, la convergenza del passo, il determinismo.
// TOLLERANZE (dichiarate prima):
//   · L1: la deriva dell'energia su 10⁶ passi, misurata come pendenza della retta dei minimi quadrati di E(t) per la
//     durata, è sotto 10⁻⁶ U₀ (Verlet: l'energia oscilla ma non deriva);
//   · L2: il modulo della velocità resta quello del lancio entro 10⁻¹² (relativo) su 10⁶ passi: l'aritmetica sbaglia
//     di ~10⁻¹⁶ a passo, e in 10⁶ passi a caso fa ~10⁻¹³;
//   · i cerchi di L2: il raggio misurato sta entro 10⁻³ da v/Ω, e tutti i punti di tutti i giri stanno sullo stesso
//     cerchio entro 10⁻⁹ (relativo);
//   · la convergenza: nella zona pulita lo scarto tra la linea col passo scelto e quella col passo dimezzato è sotto d
//     (lo spessore della linea, L/400);
//   · il determinismo: stesso indirizzo, stessa polilinea al bit.
import { creaCristallo } from '../src/reticolo.js';
import { creaPallina, passiVerlet, passiBoris, energia, avanza } from '../src/moto.js';
import { creaSessione, scegliPasso, sogliaDi } from '../src/motore.js';
import { scrivi, leggi, casuale } from '../src/indirizzo.js';
import { CASI, config } from './casi.mjs';
import { prova, vero, sotto, fine, dice, numero } from './prova.mjs';

console.log('moto');
prova('L1: l\'energia non deriva su 10⁶ passi (Verlet, col passo scelto per convergenza)', () => {
  const p = CASI.spazio, { dt } = scegliPasso(p);
  const cr = creaCristallo({ ...p.reticolo, atomi: p.atomi, w: p.w }), s = creaPallina(cr, p.r0, p.v0);
  const N = 1e6, ogni = 100, E = [], E0 = energia(cr, s);
  let mn = Infinity, mx = -Infinity;
  for (let i = 0; i < N / ogni; i++) { passiVerlet(cr, s, dt, ogni); const e = energia(cr, s) - E0; E.push(e); mn = Math.min(mn, e); mx = Math.max(mx, e); }
  const n = E.length, tm = (n - 1) / 2, em = E.reduce((a, b) => a + b, 0) / n;
  let sxy = 0, sxx = 0; E.forEach((e, i) => { sxy += (i - tm) * (e - em); sxx += (i - tm) ** 2; });
  const deriva = Math.abs((sxy / sxx) * (n - 1));
  dice('dt', numero(dt), ' oscillazione', numero(mn), '…', numero(mx), ' deriva', numero(deriva));
  sotto(deriva, 1e-6, 'deriva dell\'energia');
});

prova('L2: con il solo magnete il modulo della velocità resta esatto all\'aritmetica (Boris, 10⁶ passi)', () => {
  const cr = creaCristallo({ sistema: 'cubico', centratura: 'P', atomi: [] }), v0 = [0.8, -0.3, 0.5], s = creaPallina(cr, [0, 0, 0], v0);
  const B = [0.3, 1.1, -0.7], m0 = Math.hypot(...v0);
  let e = 0;
  for (let i = 0; i < 1000; i++) { passiBoris(cr, s, 0.01, 1000, B); e = Math.max(e, Math.abs(Math.hypot(...s.v) - m0) / m0); }
  dice('scarto massimo di |v|', numero(e));
  sotto(e, 1e-12, '|v|');
});

prova('L2: i cerchi hanno il raggio v/Ω e sono tutti uguali', () => {
  const p = CASI.magnete, S = creaSessione(p);
  while (!S.finito) S.avanza(1e5);
  const P = S.viaggio.punti(), n = P.length / 3, Om = Math.hypot(...p.B), r = Math.hypot(...p.v0) / Om;
  // il centro dal cerchio per tre punti del primo giro
  const pt = (i) => [P[3 * i], P[3 * i + 1]], q = Math.max(1, Math.round((2 * Math.PI) / Om / (S.dt * S.ogni) / 3));
  const [a, b, c] = [pt(0), pt(q), pt(2 * q)], D = 2 * (a[0] * (b[1] - c[1]) + b[0] * (c[1] - a[1]) + c[0] * (a[1] - b[1]));
  const ux = ((a[0] ** 2 + a[1] ** 2) * (b[1] - c[1]) + (b[0] ** 2 + b[1] ** 2) * (c[1] - a[1]) + (c[0] ** 2 + c[1] ** 2) * (a[1] - b[1])) / D;
  const uy = ((a[0] ** 2 + a[1] ** 2) * (c[0] - b[0]) + (b[0] ** 2 + b[1] ** 2) * (a[0] - c[0]) + (c[0] ** 2 + c[1] ** 2) * (b[0] - a[0])) / D;
  const r0 = Math.hypot(a[0] - ux, a[1] - uy);
  let e = 0; for (let i = 0; i < n; i++) e = Math.max(e, Math.abs(Math.hypot(P[3 * i] - ux, P[3 * i + 1] - uy) - r0) / r0);
  const giri = (S.pallina.t * Om) / (2 * Math.PI);
  dice('raggio', numero(r0), 'atteso', numero(r), ' scarto', numero(Math.abs(r0 - r) / r), ' giri', numero(giri), ' fuori dal cerchio', numero(e));
  sotto(Math.abs(r0 - r) / r, 1e-3, 'raggio'); sotto(e, 1e-9, 'tutti uguali'); vero(giri > 10, 'giri');
});

prova('convergenza: nella zona pulita, passo e mezzo passo non distano più dello spessore della linea', () => {
  for (const [nome, p] of Object.entries(CASI)) {
    const S = creaSessione(p); while (!S.finito) S.avanza(1e5);
    const d = sogliaDi(p.finestra), P = S.viaggio.punti();
    const s = creaPallina(S.cristallo, p.r0, p.v0);
    const fino = S.zona.finita ? S.zona.tempo : Infinity;
    let scarto = 0, k = 1, celle = S.zona.celle;
    while (k < P.length / 3 - 1) {
      avanza(S.cristallo, s, S.dt / 2, 2 * S.ogni, p.B);
      if (s.t > fino) break;
      scarto = Math.max(scarto, Math.hypot(s.x[0] - P[3 * k], s.x[1] - P[3 * k + 1], s.x[2] - P[3 * k + 2])); k++;
    }
    dice(nome.padEnd(8), 'dt', numero(S.dt), ' zona', celle, 'celle', S.zona.finita ? '' : '(tutto il viaggio)', ' scarto', numero(scarto), '/ d =', numero(d));
    sotto(scarto, d, `${nome}: scarto`); vero(k > 10, `${nome}: confronto troppo corto`);
  }
});

prova('determinismo: stesso indirizzo, stessa polilinea al bit (anche passando per il testo)', () => {
  const indirizzi = [scrivi(CASI.caldo), scrivi(CASI.rosette), scrivi(casuale(0)), scrivi(casuale(1)), scrivi(casuale(2))];
  const corri = (testo) => { const p = leggi(testo); p.tempo = Math.min(p.tempo, 20); const S = creaSessione(p); while (!S.finito) S.avanza(1e5); return new Uint8Array(S.viaggio.punti().slice().buffer); };
  const uguali = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);
  const prime = indirizzi.map(corri), seconde = [...indirizzi].reverse().map(corri).reverse();
  prime.forEach((a, i) => vero(uguali(a, seconde[i]), `indirizzo ${i}: polilinee diverse`));
  for (const t of indirizzi) vero(scrivi(leggi(t)) === t, 'scrivi(leggi(t)) = t');
  vero(!uguali(prime[0], corri(scrivi(config({ ...CASI.caldo, T: 0.0100001 })))), 'una temperatura diversa deve cambiare la linea');
  dice('punti confrontati:', prime.map((a) => a.length / 24).join(', '));
});
fine('moto');
