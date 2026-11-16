// test_zona.mjs — la zona pulita (punto 4).
// TOLLERANZE (dichiarate prima):
//   · a T = 0 una traiettoria regolare (il canale, i cerchi del magnete, il fiore nella conca) non si sfalda mai nel
//     viaggio: la gemella spostata di δ₀ resta entro d fino alla fine;
//   · una traiettoria caotica (il biliardo di Sinai morbido) si sfalda dopo un tempo vicino a ln(d/δ₀)/λ: la media su 16
//     lanci del rapporto tra il tempo misurato e ln(d/δ₀)/λ (λ di Benettin sullo stesso lancio, 2000 unità di tempo)
//     sta tra 0,75 e 1,25;
//   · la zona si accorcia al crescere di T: la media su 8 lanci del canale, a T = 0, 10⁻⁶, 10⁻⁴, 10⁻² U₀, cala in
//     modo stretto (a T = 0 conta tutto il viaggio).
import { creaSessione, lyapunov, DELTA0, sogliaDi } from '../src/motore.js';
import { sorgente } from '../src/caso.js';
import { CASI, config, dir } from './casi.mjs';
import { prova, vero, sotto, sopra, fine, dice, numero } from './prova.mjs';

const corri = (p, o) => { const S = creaSessione(p, o); while (!S.finito) S.avanza(1e5); return S; };
console.log('zona pulita');

prova('a T = 0 una traiettoria regolare non si sfalda mai', () => {
  for (const nome of ['canale', 'magnete', 'conche']) {
    const S = corri(CASI[nome]);
    dice(nome.padEnd(8), S.frase());
    vero(!S.zona.finita, `${nome}: si è sfaldata`);
  }
});

prova('una traiettoria caotica si sfalda dopo circa ln(d/δ₀)/λ', () => {
  const c = sorgente('prova zona caos'), r = [];
  for (let k = 0; k < 16; k++) {
    const p = config({ ...CASI.caos, v0: dir(360 * c(`angolo ${k}`), 0.9) }), S = corri(p);
    vero(S.zona.finita, `lancio ${k}: non si sfalda`);
    const lam = lyapunov(S.cristallo, p.r0, p.v0, p.B, S.dt, 2000), atteso = Math.log(sogliaDi(p.finestra) / DELTA0) / lam;
    r.push({ t: S.zona.tempo, atteso, lam });
  }
  const m = r.reduce((a, x) => a + x.t / x.atteso, 0) / r.length;
  dice('λ medio', numero(r.reduce((a, x) => a + x.lam, 0) / r.length), ' tempo medio', numero(r.reduce((a, x) => a + x.t, 0) / r.length),
    ' ln(d/δ₀)/λ medio', numero(r.reduce((a, x) => a + x.atteso, 0) / r.length), ' rapporto medio', numero(m));
  vero(m > 0.75 && m < 1.25, `rapporto ${m}`);
});

prova('la zona si accorcia al crescere della temperatura', () => {
  const c = sorgente('prova zona caldo'), medie = [];
  for (const T of [0, 1e-6, 1e-4, 1e-2]) {
    let s = 0;
    for (let k = 0; k < 8; k++) {
      const p = config({ ...CASI.canale, v0: dir(1 + 6 * c(`angolo ${k}`), Math.sqrt(10)), T });
      s += corri(p).zona.celle;
    }
    medie.push(s / 8);
  }
  dice('celle pulite a T = 0, 10⁻⁶, 10⁻⁴, 10⁻²:', medie.map(numero).join(' > '));
  for (let i = 1; i < medie.length; i++) sotto(medie[i], medie[i - 1], 'zona');
});
fine('zona pulita');
