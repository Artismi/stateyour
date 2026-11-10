// vicini.js — gli universi vicini.
//
// Nella biblioteca gli universi non sono isolati: accanto a ognuno ce ne sono
// infiniti quasi uguali. Lo stesso campo un poco più forte o un poco ruotato, la
// stessa nube un poco più densa, la stessa massa un poco più in là, lo stesso
// raggio cosmico arrivato un istante dopo o da un'altra direzione, o mai
// arrivato. Se una sezione è quasi bella ma ha una linea a caso, spezzata o
// storta, in un universo vicino quella linea non c'è, o va dove deve. Perfezionare
// una sezione è camminare tra i vicini, un passo alla volta, verso quello più
// bello (una salita, con un poco di caso per non fermarsi al primo poggio).

import { simulaMondo, generatore } from './mondo.js';
import { segmentiSezione, bellezza } from './sezione.js';

const clona = (o) => JSON.parse(JSON.stringify(o));

// un universo vicino: piccoli cambiamenti naturali, «forza» da 0 a 1
export function vicino(cella, forza, caso) {
  const c = clona(cella), g = () => { let u = 0; for (let i = 0; i < 6; i++) u += caso(); return u - 3; }; // circa normale
  const scegli = (a) => a[Math.floor(caso() * a.length)];
  const cosa = caso();
  if (cosa < 0.25 && c.onde?.B?.length) {
    // il campo: un'onda un poco più forte, ruotata, spostata
    const o = scegli(c.onde.B), th = Math.atan2(o.k[1], o.k[0]) + g() * 0.15 * forza, km = Math.hypot(...o.k) * Math.exp(g() * 0.1 * forza);
    o.k = [km * Math.cos(th), km * Math.sin(th)]; o.a *= Math.exp(g() * 0.2 * forza); o.fi += g() * 0.4 * forza;
  } else if (cosa < 0.35 && c.nubi) {
    c.nubi.K *= Math.exp(g() * 0.25 * forza); const o = scegli(c.nubi.modi); o.fi += g() * 0.5 * forza;
  } else if (cosa < 0.42 && c.cristalli?.length) {
    const k = scegli(c.cristalli); k.centro = k.centro.map((v) => v + g() * 10 * forza); k.passo *= Math.exp(g() * 0.1 * forza); k.a *= Math.exp(g() * 0.2 * forza);
  } else if (cosa < 0.5 && c.masse?.length) {
    const m = scegli(c.masse); m.pos = m.pos.map((v) => v + g() * 15 * forza); m.M *= Math.exp(g() * 0.2 * forza);
  } else if (cosa < 0.62 && c.sorgenti.length > 1) {
    // un raggio cosmico, una stella, un decadimento che in quell'universo non c'è
    c.sorgenti.splice(Math.floor(caso() * c.sorgenti.length), 1);
  } else if (c.sorgenti.length) {
    // una particella che nasce un poco più in là, in un'altra direzione, più o meno veloce, un poco dopo
    const s = scegli(c.sorgenti);
    s.pos = s.pos.map((v) => v + g() * 8 * forza); s.dir += g() * 0.1 * forza; s.v *= Math.exp(g() * 0.1 * forza); if (s.t0 != null) s.t0 = Math.max(0, s.t0 + g() * 2 * forza);
  }
  c.vicino = (c.vicino || 0) + 1;
  return c;
}

// un'inquadratura vicina: la finestra, lo sguardo e la fetta di tempo, appena mossi
export function inquadraturaVicina(st, forza, caso) {
  const g = () => { let u = 0; for (let i = 0; i < 6; i++) u += caso(); return u - 3; };
  const f = st.finestra, v = st.vista, z = st.sezione;
  return {
    finestra: { centro: f.centro.map((x) => x + g() * 0.06 * f.lato * forza), lato: f.lato * Math.exp(g() * 0.06 * forza) },
    vista: { inclinazione: Math.max(0, Math.min(85, v.inclinazione + (v.inclinazione ? g() * 4 * forza : 0))), rotazione: v.rotazione + (v.inclinazione ? g() * 6 * forza : 0), scalaTempo: Math.max(1, v.scalaTempo * Math.exp(g() * 0.08 * forza)) },
    sezione: { fine: Math.max(1, z.fine + g() * 3 * forza), durata: Math.max(1, Math.min(z.fine, z.durata * Math.exp(g() * 0.08 * forza))) },
  };
}

const misura = (cella, tracce, st) => bellezza(segmentiSezione(tracce, { ...cella, ...st }), st.finestra.lato);

// la salita: stato = { cella, finestra, vista, sezione }
export function perfeziona(stato, { passi = 50, seme = 1 } = {}, avanza = () => {}) {
  const caso = generatore(seme);
  let cella = stato.cella, tracce = simulaMondo(cella), st = { finestra: stato.finestra, vista: stato.vista, sezione: stato.sezione };
  let b = misura(cella, tracce, st);
  const partenza = b.totale;
  let meglio = { cella, ...st, bellezza: b };
  for (let i = 0; i < passi; i++) {
    const forza = 1 - (0.7 * i) / passi, tempera = 0.02 * (1 - i / passi);
    let c2 = cella, t2 = tracce, s2 = st;
    if (caso() < 0.65) { c2 = vicino(cella, forza, caso); t2 = simulaMondo(c2); } else s2 = inquadraturaVicina(st, forza, caso);
    const b2 = misura(c2, t2, s2);
    if (b2.totale > b.totale || caso() < Math.exp((b2.totale - b.totale) / Math.max(1e-6, tempera)) * 0.15) {
      if (b2.totale >= b.totale || i < passi * 0.6) { cella = c2; tracce = t2; st = s2; b = b2; }
    }
    if (b.totale > meglio.bellezza.totale) meglio = { cella, ...st, bellezza: b };
    avanza((i + 1) / passi, meglio.bellezza);
  }
  // si tiene il punto più alto toccato, anche se poi la strada è scesa
  return { ...meglio, partenza };
}
