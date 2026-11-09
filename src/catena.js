// catena.js — una linea continua per punti di ancoraggio.
//
// Si danno i PUNTI per cui la linea deve passare (e, se si vuole, la
// TANGENTE in ognuno). Il compilatore ricava da solo il campo fisico che
// produce quella linea:
//
//   - tra due ancoraggi consecutivi un BIARCO: due archi di cerchio che si
//     raccordano con la stessa tangente. Ogni arco è un'orbita circolare
//     attorno a una massa posta sulla normale, a distanza r, con
//     M = v²·r / G: la velocità resta la stessa in modulo su tutta la linea,
//     la direzione è continua a ogni giunzione (continuità G1);
//   - ogni arco è un BLOCCO DI SPAZIOTEMPO: una fascia ad anello attorno al
//     suo centro, valida nell'intervallo di tempo in cui la linea la percorre,
//     con dentro la gravità della sua massa. Due blocchi consecutivi confinano
//     lungo la normale comune: lì la particella passa dall'uno all'altro;
//   - in fondo, se richiesta, una VOLUTA: si spegne la gravità e si accende
//     un campo magnetico con la stessa curvatura dell'ultimo arco (continuità
//     anche della curvatura, G2) più un attrito: è un disco attorno al centro
//     asintotico della spirale, calcolato in forma chiusa. Un disco più
//     piccolo, di raggio rMin, ferma la particella;
//   - RAMI: una sorgente nel punto e nell'istante in cui la linea madre passa
//     per l'ancoraggio; il ramo vive nel proprio piano di esistenza.
//
// Il risultato è uno STATO: nessuna azione, nessuna fase. Nessuna curva è
// disegnata, tutte sono traiettorie attraverso i blocchi.

const add = (a, b) => [a[0] + b[0], a[1] + b[1]];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
const mul = (a, k) => [a[0] * k, a[1] * k];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1];
const cross = (a, b) => a[0] * b[1] - a[1] * b[0];
const len = (a) => Math.hypot(a[0], a[1]);
const norm = (a) => { const l = len(a) || 1; return [a[0] / l, a[1] / l]; };
const sinistra = (a) => [-a[1], a[0]];

// L'arco che parte da p con tangente t e arriva in q: cerchio tangente a t in p
// e passante per q. Ritorna centro, raggio con segno (>0 gira a sinistra),
// tangente d'arrivo, ampiezza in radianti. Se è (quasi) dritto, retta.
export function arcoPer(p, t, q) {
  const d = sub(q, p), n = sinistra(t);
  const nd = dot(n, d), dd = dot(d, d);
  const c = norm(d);
  const tq = sub(mul(c, 2 * dot(t, c)), t); // t riflessa sulla corda
  if (Math.abs(nd) < 1e-9 * Math.sqrt(dd) || Math.abs(dd / (2 * nd)) > 1e7) {
    return { dritto: true, p, q, t, tq, lunghezza: Math.sqrt(dd) };
  }
  const r = dd / (2 * nd); // con segno
  const centro = add(p, mul(n, r));
  const a0 = Math.atan2(p[1] - centro[1], p[0] - centro[0]);
  const a1 = Math.atan2(q[1] - centro[1], q[0] - centro[0]);
  let ampiezza = r > 0 ? a1 - a0 : a0 - a1;
  while (ampiezza <= 0) ampiezza += 2 * Math.PI;
  return { dritto: false, p, q, t, tq, centro, r, ampiezza, lunghezza: Math.abs(r) * ampiezza };
}

// Il biarco tra (p1, t1) e (p2, t2): due archi con la stessa tangente nel punto
// di giunzione. Scelta classica a parametri uguali (d1 = d2).
export function biarco(p1, t1, p2, t2) {
  const v = sub(p2, p1);
  const t = add(t1, t2);
  const vt = dot(v, t), vv = dot(v, v);
  const den = 2 * (1 - dot(t1, t2));
  let d;
  if (Math.abs(den) < 1e-12) {
    const vt2 = dot(v, t2);
    if (Math.abs(vt2) < 1e-12) {
      // tangenti parallele e perpendicolari alla corda: due semicerchi
      const pm = add(p1, mul(v, 0.5));
      return [arcoPer(p1, t1, pm), arcoPer(pm, mul(t1, -1), p2)];
    }
    d = vv / (4 * vt2);
  } else {
    d = (-vt + Math.sqrt(vt * vt + den * vv)) / den;
  }
  const pm = mul(add(add(p1, p2), mul(sub(t1, t2), d)), 0.5);
  const primo = arcoPer(p1, t1, pm);
  const secondo = arcoPer(pm, primo.tq, p2);
  return [primo, secondo];
}

// tangenti automatiche: nei punti interni la direzione tra il precedente e il
// successivo (Catmull-Rom); agli estremi la corda riflessa sulla tangente vicina
function tangentiAuto(punti, chiusa, date = []) {
  const n = punti.length, out = [];
  for (let i = 0; i < n; i++) {
    if (date[i]) { out.push(norm(date[i])); continue; }
    if (chiusa || (i > 0 && i < n - 1)) {
      const a = punti[(i - 1 + n) % n], b = punti[(i + 1) % n];
      out.push(norm(sub(b, a)));
    } else out.push(null);
  }
  if (!chiusa && n >= 2) {
    if (!out[0]) { const c = norm(sub(punti[1], punti[0])); out[0] = out[1] ? norm(sub(mul(c, 2 * dot(out[1], c)), out[1])) : c; }
    if (!out[n - 1]) { const c = norm(sub(punti[n - 1], punti[n - 2])); out[n - 1] = out[n - 2] ? norm(sub(mul(c, 2 * dot(out[n - 2], c)), out[n - 2])) : c; }
  }
  return out;
}

// la voluta: rapporto q = γ/ω tale che, partendo con raggio di curvatura R, la
// spirale arrivi a distanza rMin dal centro asintotico in `giri` giri
function rapportoVoluta(R, rMin, giri) {
  const f = (q) => (R / Math.sqrt(1 + q * q)) * Math.exp(-2 * Math.PI * q * giri) - rMin;
  if (f(0) <= 0) return 0;
  let lo = 0, hi = 1;
  while (f(hi) > 0 && hi < 1e3) hi *= 2;
  for (let i = 0; i < 100; i++) { const m = (lo + hi) / 2; if (f(m) > 0) lo = m; else hi = m; }
  return (lo + hi) / 2;
}

// Compila una catena in BLOCCHI DI SPAZIOTEMPO, senza regole né azioni.
// Ogni arco curvo è un blocco: una fascia ad anello attorno al suo centro,
// tra il raggio che passa per il punto di partenza e quello che passa per il
// punto d'arrivo, valida nell'intervallo di tempo in cui la particella lo
// percorre (più un margine). Dentro c'è la gravità della sua massa.
// Due archi consecutivi hanno i centri sulla stessa normale: i loro blocchi
// confinano lungo quella retta, e il passaggio avviene esattamente lì.
// Il tempo separa i tratti della linea che passano per lo stesso luogo.
function compila(c, piano, v, G, t0) {
  const punti = c.punti.slice();
  if (c.chiusa) punti.push(punti[0]);
  const tang = tangentiAuto(c.chiusa ? c.punti : punti, !!c.chiusa, c.tangenti || []);
  if (c.chiusa) tang.push(tang[0]);

  const archi = [], tempoAncoraggio = [t0];
  let t = t0;
  for (let i = 0; i < punti.length - 1; i++) {
    for (const a of biarco(punti[i], tang[i], punti[i + 1], tang[i + 1])) {
      if (a.lunghezza <= 1e-9) continue;
      a.t0 = t; t += a.lunghezza / v; a.t1 = t;
      archi.push(a);
    }
    tempoAncoraggio[i + 1] = t;
  }

  const blocchi = [];
  let rMinCurv = Infinity;
  const durata = (k) => (archi[k] ? archi[k].t1 - archi[k].t0 : Infinity);
  archi.forEach((a, k) => {
    if (a.dritto) return; // tra due blocchi curvi la particella va dritta da sola
    const R = Math.abs(a.r);
    rMinCurv = Math.min(rMinCurv, R);
    const margine = 0.25 * Math.min(durata(k - 1), durata(k), durata(k + 1));
    const w = Math.min(0.5 * R, c.spessore ?? 3);
    const aP = Math.atan2(a.p[1] - a.centro[1], a.p[0] - a.centro[0]);
    const aQ = Math.atan2(a.q[1] - a.centro[1], a.q[0] - a.centro[0]);
    blocchi.push({
      id: `${piano}:${k}`, piano,
      regione: { tipo: 'settore', centro: a.centro, r: [R - w, R + w], da: a.r > 0 ? aP : aQ, ampiezza: a.ampiezza },
      tempo: [a.t0 - margine, a.t1 + margine],
      legge: { tipo: 'gravita', pos: a.centro, M: v * v * R / G },
    });
  });

  const ultimo = archi[archi.length - 1];
  const E = ultimo.q, tE = ultimo.t1, tq = ultimo.tq;
  const margineFine = 0.25 * durata(archi.length - 1);
  let tFine = tE, omega = 0;
  if (c.voluta) {
    const vo = c.voluta;
    const R = vo.R ?? (ultimo.dritto ? (vo.r0 ?? 10) : Math.abs(ultimo.r));
    const segnoArco = ultimo.dritto ? 1 : Math.sign(ultimo.r);
    const segnoV = vo.verso === 'sinistra' ? 1 : vo.verso === 'destra' ? -1 : segnoArco;
    omega = segnoV * v / R;
    const rMin = vo.rMin ?? R / 10;
    const q = rapportoVoluta(R, rMin, vo.giri ?? 2);
    const gamma = q * Math.abs(omega);
    // centro asintotico: z∞ = z0 − v0/(iω − γ); distanza iniziale r0 = v/√(ω²+γ²)
    const vx = v * tq[0], vy = v * tq[1], den = gamma * gamma + omega * omega;
    const zinf = [E[0] - (-gamma * vx + omega * vy) / den, E[1] - (-omega * vx - gamma * vy) / den];
    const r0 = v / Math.sqrt(den);
    blocchi.push({
      id: `${piano}:voluta`, piano,
      regione: { tipo: 'cerchio', centro: zinf, r: r0 * (1 + 1e-7) + 1e-7 },
      tempo: [tE - margineFine, null],
      legge: [{ tipo: 'magnetico', omega }, { tipo: 'attrito', gamma }],
    });
    blocchi.push({ id: `${piano}:fine`, piano, regione: { tipo: 'cerchio', centro: zinf, r: rMin }, tempo: [tE, null], legge: { tipo: 'ferma' } });
    rMinCurv = Math.min(rMinCurv, R);
    // il tempo per raggiungere rMin: la distanza dal centro cala come e^(−γt)
    tFine = tE + (gamma > 0 ? Math.log(r0 / rMin) / gamma : 2 * Math.PI * (vo.giri ?? 2) / Math.abs(omega));
  } else {
    // un piccolo disco appena oltre il punto d'arrivo: la particella vi entra esattamente in E
    const h = Math.min(1, 0.5 * (ultimo.lunghezza || 1));
    blocchi.push({ id: `${piano}:fine`, piano, regione: { tipo: 'cerchio', centro: [E[0] + tq[0] * h, E[1] + tq[1] * h], r: h }, tempo: [tE - margineFine, null], legge: { tipo: 'ferma' } });
    // il passo non deve poter scavalcare il disco
    rMinCurv = Math.min(rMinCurv, 50 * h);
  }
  const lunghezza = archi.reduce((s, a) => s + a.lunghezza, 0);
  return { punti, tang, archi, tempoAncoraggio, blocchi, rMinCurv, lunghezza, tFine };
}

// La descrizione completa: blocchi di spaziotempo e sorgenti. Ogni linea vive
// nel proprio piano di esistenza; un ramo è una sorgente posta nel punto e
// nell'istante in cui la linea madre passa per il suo ancoraggio.
export function catena(opzioni = {}) {
  // senza punti: un'onda con una voluta, come esempio
  if (!opzioni.punti) opzioni = { ...opzioni, punti: [[-30, 0], [-15, 10], [0, 0], [15, -10]], voluta: opzioni.voluta ?? { giri: 1.5, rMin: 1 } };
  const v = opzioni.v ?? 10, G = opzioni.G ?? 1;
  const precisione = opzioni.precisione ?? 0.004; // radianti per passo
  const blocchi = [], emettitori = [], linee = [];

  function costruisci(c, piano, t0) {
    const k = compila(c, piano, v, G, t0);
    blocchi.push(...k.blocchi);
    const dt = Math.min(precisione * k.rMinCurv / v, 0.5);
    const passi = Math.ceil(((k.tFine - t0) / dt) * 1.2) + 50;
    emettitori.push({ id: piano, piano, pos: k.punti[0], dir: k.tang[0], v, t0, dt, passi });
    linee.push({ piano, archi: k.archi, punti: k.punti, tempoAncoraggio: k.tempoAncoraggio });
    (c.rami || []).forEach((ramo, j) => {
      costruisci({ ...ramo.catena, punti: [k.punti[ramo.da], ...ramo.catena.punti] }, `${piano}r${j}`, k.tempoAncoraggio[ramo.da]);
    });
    return k;
  }
  const radice = costruisci(opzioni, 'c', opzioni.t0 ?? 0);

  return {
    G, dt: emettitori[0].dt, passi: emettitori[0].passi, limiti: opzioni.limiti || [-1e4, -1e4, 1e4, 1e4],
    blocchi, emettitori, masse: [], campi: [], interfacce: [], regole: [],
    // per i test e la lettura: la geometria attesa
    _archi: radice.archi, _punti: radice.punti, _linee: linee,
  };
}

// specchia una lista di punti rispetto all'asse y (x -> −x), utile per i motivi simmetrici
export const specchiaPunti = (punti) => punti.map(([x, y]) => [-x, y]);
