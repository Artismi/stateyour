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
//   - a ogni fine arco un evento geometrico (il raggio che passa per il
//     punto d'arrivo, attraversato nel verso giusto) spegne la massa e
//     accende la successiva: una staffetta per fasi;
//   - in fondo, se richiesta, una VOLUTA: si spegne la gravità e si accende
//     un campo magnetico con la stessa curvatura dell'ultimo arco (continuità
//     anche della curvatura, G2) più un attrito. La particella si avvolge in
//     una spirale logaritmica e si ferma quando arriva a distanza rMin dal
//     centro asintotico, calcolato in forma chiusa;
//   - RAMI: a un ancoraggio la particella emette una particella figlia che
//     segue la propria catena, con le proprie masse.
//
// Il risultato è una partitura del motore: nessuna curva è disegnata, tutte
// sono traiettorie.

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

// Compila una catena in una lista di archi + masse + regole a fasi.
// opzioni: { punti, tangenti?, chiusa?, voluta?: { giri, rMin, verso?: 'sinistra'|'destra', R? }, rami?: [{ da, catena }] }
function compila(c, prefisso, v, G) {
  const punti = c.punti.slice();
  if (c.chiusa) punti.push(punti[0]);
  const tang = tangentiAuto(c.chiusa ? c.punti : punti, !!c.chiusa, c.tangenti || []);
  if (c.chiusa) tang.push(tang[0]);

  const archi = [], fineAncoraggio = []; // fineAncoraggio[i] = indice dell'arco che arriva al punto i
  for (let i = 0; i < punti.length - 1; i++) {
    const [a1, a2] = biarco(punti[i], tang[i], punti[i + 1], tang[i + 1]);
    for (const a of [a1, a2]) if (a.lunghezza > 1e-9) archi.push(a);
    fineAncoraggio[i + 1] = archi.length - 1;
  }

  const masse = [], regole = [], campi = [];
  const ids = archi.map((a, k) => (a.dritto ? null : `${prefisso}m${k}`));
  archi.forEach((a, k) => { if (!a.dritto) masse.push({ id: ids[k], pos: a.centro, M: v * v * Math.abs(a.r) / G, acceso: false }); });

  let rMinCurv = Infinity, lunghezza = 0;
  for (const a of archi) { if (!a.dritto) rMinCurv = Math.min(rMinCurv, Math.abs(a.r)); lunghezza += a.lunghezza; }

  // gli eventi: per ogni arco la linea che passa per il punto d'arrivo
  archi.forEach((a, k) => {
    let la, lb;
    if (a.dritto) { la = a.q; lb = add(a.q, sinistra(a.tq)); }
    else { la = a.centro; lb = a.q; }
    const verso = cross(sub(lb, la), a.tq) > 0 ? 'sinistra' : 'destra';
    const fai = [];
    if (ids[k]) fai.push({ tipo: 'spegni', id: ids[k] });
    if (k + 1 < archi.length && ids[k + 1]) fai.push({ tipo: 'accendi', id: ids[k + 1] });
    regole.push({ fase: k, quando: { tipo: 'attraversa', a: la, b: lb, verso }, fai });
  });

  const ultimo = archi[archi.length - 1];
  const fineFai = regole[regole.length - 1].fai;
  let passiVoluta = 0, omega = 0;
  if (c.voluta) {
    const vo = c.voluta;
    const R = vo.R ?? (ultimo.dritto ? (vo.r0 ?? 10) : Math.abs(ultimo.r));
    const segnoArco = ultimo.dritto ? 1 : Math.sign(ultimo.r);
    const segnoV = vo.verso === 'sinistra' ? 1 : vo.verso === 'destra' ? -1 : segnoArco;
    omega = segnoV * v / R;
    const q = rapportoVoluta(R, vo.rMin ?? R / 10, vo.giri ?? 2);
    const gamma = q * Math.abs(omega);
    // centro asintotico: z∞ = z0 − v0/(iω − γ)
    const E = ultimo.q, t = ultimo.tq;
    const vx = v * t[0], vy = v * t[1], den = gamma * gamma + omega * omega;
    const zinf = [E[0] - (-gamma * vx + omega * vy) / den, E[1] - (-omega * vx - gamma * vy) / den];
    campi.push({ id: `${prefisso}B`, tipo: 'magnetico', omega, acceso: false });
    campi.push({ id: `${prefisso}A`, tipo: 'attrito', gamma, acceso: false });
    fineFai.push({ tipo: 'accendi', id: `${prefisso}B` }, { tipo: 'accendi', id: `${prefisso}A` }, { tipo: 'avanza' });
    regole.push({ fase: archi.length, quando: { tipo: 'distanza', da: zinf, r: vo.rMin ?? R / 10, verso: 'dentro' }, fai: [{ tipo: 'ferma' }] });
    rMinCurv = Math.min(rMinCurv, R);
    passiVoluta = 2 * Math.PI * (vo.giri ?? 2) * 1.3;
  } else {
    fineFai.push({ tipo: 'ferma' });
  }
  // tutte le altre regole di fine arco avanzano di fase
  regole.forEach((r, k) => { if (k < archi.length - 1) r.fai.push({ tipo: 'avanza' }); });

  return { punti, tang, archi, fineAncoraggio, masse, campi, regole, ids, rMinCurv, lunghezza, passiVoluta, omega };
}

// La partitura completa, con i rami. `v` è la velocità (costante) delle particelle.
export function catena(opzioni = {}) {
  // senza punti: un'onda con una voluta, come esempio
  if (!opzioni.punti) opzioni = { ...opzioni, punti: [[-30, 0], [-15, 10], [0, 0], [15, -10]], voluta: opzioni.voluta ?? { giri: 1.5, rMin: 1 } };
  const v = opzioni.v ?? 10, G = opzioni.G ?? 1;
  const precisione = opzioni.precisione ?? 0.004; // radianti per passo
  const tutteMasse = [], tuttiCampi = [], emettitori = [];

  // compila ricorsivamente: ritorna l'emettitore (o la definizione del figlio)
  function costruisci(c, prefisso) {
    const k = compila(c, prefisso, v, G);
    tutteMasse.push(...k.masse); tuttiCampi.push(...k.campi);
    const dt = Math.min(precisione * k.rMinCurv / v, 0.5);
    const passi = Math.ceil((k.lunghezza / v) / dt * 1.2 + (k.passiVoluta ? k.passiVoluta / (Math.abs(k.omega) * dt) : 0)) + 50;
    const primo = k.ids[0];
    const nodo = { k, dt, passi, primo, figli: [] };
    (c.rami || []).forEach((ramo, j) => {
      const sub = costruisci({ ...ramo.catena, punti: [k.punti[ramo.da], ...ramo.catena.punti] }, `${prefisso}r${j}`);
      nodo.figli.push({ da: ramo.da, sub });
    });
    return nodo;
  }
  const radice = costruisci(opzioni, 'c');

  // l'accensione di partenza di ogni particella: tutto spento tranne la sua prima massa
  const tuttoSpento = Object.fromEntries([...tutteMasse, ...tuttiCampi].map((x) => [x.id, false]));

  function collega(nodo) {
    const regole = nodo.k.regole.map((r) => ({ ...r, fai: r.fai.slice() }));
    for (const { da, sub } of nodo.figli) {
      const sotto = collega(sub);
      const stato = { ...tuttoSpento };
      if (sub.primo) stato[sub.primo] = true;
      const emissione = { tipo: 'emetti', dir: sub.k.tang[0], v, dt: sub.dt, passi: sub.passi, regole: sotto, fase: 0, stato };
      if (da === 0) {
        emettitori.push({ id: `ramo${emettitori.length}`, pos: sub.k.punti[0], dir: sub.k.tang[0], v, dt: sub.dt, passi: sub.passi, regole: sotto, acceso: stato });
      } else {
        // si emette alla fine dell'arco che arriva all'ancoraggio `da`, prima di avanzare
        const k = nodo.k.fineAncoraggio[da];
        regole[k].fai.unshift(emissione);
      }
    }
    return regole;
  }
  const regoleRadice = collega(radice);
  const statoRadice = { ...tuttoSpento };
  if (radice.primo) statoRadice[radice.primo] = true;
  emettitori.unshift({ id: 'catena', pos: radice.k.punti[0], dir: radice.k.tang[0], v, dt: radice.dt, passi: radice.passi, regole: regoleRadice, acceso: statoRadice });

  return {
    G, dt: radice.dt, passi: radice.passi, limiti: opzioni.limiti || [-1e4, -1e4, 1e4, 1e4],
    emettitori, masse: tutteMasse, campi: tuttiCampi, interfacce: [], regole: [],
    // per i test e la lettura: la geometria attesa
    _archi: radice.k.archi, _punti: radice.k.punti,
  };
}

// specchia una lista di punti rispetto all'asse y (x -> −x), utile per i motivi simmetrici
export const specchiaPunti = (punti) => punti.map(([x, y]) => [-x, y]);
