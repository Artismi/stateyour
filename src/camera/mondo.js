// mondo.js — una sezione di spaziotempo con poche leggi vere.
//
// Il pattern è la fotografia di un evento possibile, in uno dei tanti universi
// possibili. Nessun oggetto costruito: solo ciò che la natura mette nello
// spazio vuoto. Le leggi sono quattro, quelle del nostro universo:
//
//   1. GRAVITÀ   le MASSE stanno ferme e curvano lo spazio intorno a sé. Chi
//                passa segue la curvatura ma non sposta la massa (è un corpo di
//                prova: niente problema a molti corpi). Una particella con massa
//                cade con a = G·M/r², la stessa per tutte, leggere o pesanti
//                (principio di equivalenza); la luce si piega il doppio (la
//                deflessione della relatività generale in campo debole). Chi
//                tocca il corpo della massa (raggio R) ci cade dentro.
//   2. MAGNETISMO dove c'è campo B (perpendicolare al piano) una carica gira con
//                ω = q·B/m. Il campo è a zone, o continuo come in natura: una
//                somma di onde (campi che variano dolcemente) e i CRISTALLI, dove
//                il campo si ripete con il passo del reticolo.
//   3. MATERIA   dove c'è materia (a zone, o a NUBI che variano dolcemente) una
//                carica perde energia (Bethe): dv/dt = −K·q²/(m·v²). Più lenta,
//                frena più in fretta: si ferma dopo m·v⁴/(4·K·q²) e la curva si
//                stringe in spirale fino all'occhio.
//   4. DECADIMENTO una particella instabile si divide nelle figlie della sua
//                specie. Ognuna decade quando capita: la specie dà solo la vita
//                media (la vita di ciascuna si estrae a caso, esponenziale), e
//                gli angoli delle figlie possono essere a caso in un intervallo.
//                Il caso è deterministico: lo fissa il «seme» dell'universo.
//
// La LASTRA registra le cariche come bolle: lo spessore è proporzionale alla
// carica e cresce quando la particella rallenta, w = w0·|q|·min(saturazione,
// vRif/v); in fondo resta una macchia tonda (il picco di Bragg). Le neutre e la
// luce non lasciano traccia, a meno che la specie non dica «visibile».
//
// Il passo è esatto dove il campo è uniforme: la velocità ruota di ω·dt, la
// velocità scalare segue Bethe in forma chiusa, la posizione avanza lungo la
// corda dell'arco. Vicino alle masse la gravità entra con mezzi calci (Verlet);
// nei campi continui il passo resta piccolo rispetto alla loro lunghezza d'onda.

const DUE_PI = 2 * Math.PI;

// ---------- geometria dei domini
export function dentro(forma, x, y) {
  switch (forma.tipo) {
    case 'tutto': return true;
    case 'cerchio': { const dx = x - forma.centro[0], dy = y - forma.centro[1]; return dx * dx + dy * dy <= forma.r * forma.r; }
    case 'anello': {
      const dx = x - forma.centro[0], dy = y - forma.centro[1], r2 = dx * dx + dy * dy;
      if (r2 < forma.r[0] * forma.r[0] || r2 > forma.r[1] * forma.r[1]) return false;
      if (forma.ampiezza == null) return true;
      let a = Math.atan2(dy, dx) - forma.da; a = ((a % DUE_PI) + DUE_PI) % DUE_PI;
      return a <= forma.ampiezza;
    }
    case 'poligono': {
      const P = forma.punti; let d = false;
      for (let i = 0, j = P.length - 1; i < P.length; j = i++) {
        if ((P[i][1] > y) !== (P[j][1] > y) && x < (P[j][0] - P[i][0]) * (y - P[i][1]) / (P[j][1] - P[i][1]) + P[i][0]) d = !d;
      }
      return d;
    }
    default: return false;
  }
}
function riquadro(forma) {
  if (forma.tipo === 'cerchio') return [forma.centro[0] - forma.r, forma.centro[1] - forma.r, forma.centro[0] + forma.r, forma.centro[1] + forma.r];
  if (forma.tipo === 'anello') return [forma.centro[0] - forma.r[1], forma.centro[1] - forma.r[1], forma.centro[0] + forma.r[1], forma.centro[1] + forma.r[1]];
  if (forma.tipo === 'poligono') { const xs = forma.punti.map((p) => p[0]), ys = forma.punti.map((p) => p[1]); return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)]; }
  return [-Infinity, -Infinity, Infinity, Infinity];
}

// una griglia per trovare in fretta i domini che contengono un punto
function indiceDomini(domini, larghezza, altezza, vivo = () => true) {
  const N = 48, cw = larghezza / N, ch = altezza / N, celle = Array.from({ length: N * N }, () => []), ovunque = [];
  domini.forEach((d, i) => {
    const [x0, y0, x1, y1] = riquadro(d.forma);
    if (!isFinite(x0)) { ovunque.push(i); return; }
    const a = Math.max(0, Math.floor(x0 / cw)), b = Math.min(N - 1, Math.floor(x1 / cw)), c = Math.max(0, Math.floor(y0 / ch)), e = Math.min(N - 1, Math.floor(y1 / ch));
    if (a > N - 1 || b < 0 || c > N - 1 || e < 0) { ovunque.push(i); return; }
    for (let gy = c; gy <= e; gy++) for (let gx = a; gx <= b; gx++) celle[gy * N + gx].push(i);
  });
  return (x, y) => {
    const gx = Math.floor(x / cw), gy = Math.floor(y / ch);
    const lista = gx >= 0 && gy >= 0 && gx < N && gy < N ? celle[gy * N + gx] : [];
    let best = -1;
    for (const i of ovunque) if (i > best && vivo(i) && dentro(domini[i].forma, x, y)) best = i;
    for (const i of lista) if (i > best && vivo(i) && dentro(domini[i].forma, x, y)) best = i;
    return best;
  };
}

// le cinque leggi, tutte accese se non si dice altrimenti (mondo.leggi)
export const LEGGI = { gravita: true, magnetico: true, materia: true, decadimento: true };

// il caso, ripetibile: lo stesso seme dà lo stesso universo
export function generatore(seme) {
  let a = seme >>> 0 || 1;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
// una mappa si può scrivere compatta: «sparsa» = [scarto d'indice, valore, ...]
const mappeDense = new WeakMap();
function densa(m, chiave = 'sparsa') {
  if (chiave === 'sparsa' && m.B) return m.B;
  if (!m[chiave]) return null;
  let tutte = mappeDense.get(m); if (!tutte) { tutte = {}; mappeDense.set(m, tutte); }
  if (!tutte[chiave]) { const d = new Float32Array(m.nx * m.ny); let n = -1; for (let i = 0; i < m[chiave].length; i += 2) { n += m[chiave][i]; d[n] = m[chiave][i + 1]; } tutte[chiave] = d; }
  return tutte[chiave];
}
// i campi continui: onde (campi che variano dolcemente) e cristalli (campi periodici)
export function campiContinui(mondo) {
  const ondeB = mondo.onde?.B || [], nubi = mondo.nubi || null, cristalli = mondo.cristalli || [], mappa = mondo.mappa || null;
  const ondeK = nubi?.modi || [];
  let lambdaOnde = Infinity;
  for (const o of [...ondeB, ...ondeK]) lambdaOnde = Math.min(lambdaOnde, (2 * Math.PI) / Math.hypot(...o.k));
  // la lunghezza su cui il campo cambia, qui: fitta dentro un cristallo, larga fuori
  // la MAPPA: un campo dato su una griglia fine e interpolato con continuità (bilineare)
  const dentroMappa = (x, y) => mappa && x >= mappa.x0 && y >= mappa.y0 && x <= mappa.x0 + (mappa.nx - 1) * mappa.h && y <= mappa.y0 + (mappa.ny - 1) * mappa.h;
  const MB = mappa ? densa(mappa) : null, MK = mappa ? densa(mappa, 'sparsaK') : null;
  const valoreMappa = (x, y, M = MB) => {
    const fx = (x - mappa.x0) / mappa.h, fy = (y - mappa.y0) / mappa.h, i = Math.min(mappa.nx - 2, Math.floor(fx)), j = Math.min(mappa.ny - 2, Math.floor(fy)), u = fx - i, v = fy - j, n = mappa.nx;
    return M[j * n + i] * (1 - u) * (1 - v) + M[j * n + i + 1] * u * (1 - v) + M[(j + 1) * n + i] * (1 - u) * v + M[(j + 1) * n + i + 1] * u * v;
  };
  const lambda = (x, y) => { let l = lambdaOnde; for (const c of cristalli) if (Math.hypot(x - c.centro[0], y - c.centro[1]) < c.r + c.passo) l = Math.min(l, c.passo); if (dentroMappa(x, y)) l = Math.min(l, mappa.h * 2); return l; };
  if (!ondeB.length && !ondeK.length && !cristalli.length && !mappa) return null;
  const B = (x, y) => {
    let b = 0;
    for (const o of ondeB) b += o.a * Math.cos(o.k[0] * x + o.k[1] * y + o.fi);
    for (const c of cristalli) {
      const dx = x - c.centro[0], dy = y - c.centro[1], r = Math.hypot(dx, dy);
      if (r >= c.r) continue;
      // il reticolo: tre onde a 60°, come in un cristallo esagonale; ai bordi il cristallo sfuma
      const sfuma = Math.min(1, (c.r - r) / (0.15 * c.r)), g = (4 * Math.PI) / (Math.sqrt(3) * c.passo);
      let somma = 0;
      for (let j = 0; j < 3; j++) { const an = c.angolo + (j * Math.PI) / 3; somma += Math.cos(g * (dx * Math.cos(an) + dy * Math.sin(an))); }
      b += (c.a * sfuma * somma) / 3;
    }
    if (dentroMappa(x, y)) b += valoreMappa(x, y);
    return b;
  };
  const K = (x, y) => {
    let k = 0;
    if (nubi) { let s = 0; for (const o of ondeK) s += o.a * Math.cos(o.k[0] * x + o.k[1] * y + o.fi); k = nubi.K * Math.max(0, s); }
    if (MK && dentroMappa(x, y)) k += Math.max(0, valoreMappa(x, y, MK));
    return k;
  };
  return { B, K, lambda };
}

// gli interruttori nel tempo: un oggetto parte acceso (o spento, se «spento») e
// cambia stato a ogni scatto { t, acceso } della sua lista «interruttori».
// Una legge è true, false, oppure una lista di scatti (parte accesa).
export function accesoA(o, t) { let a = !o.spento; for (const e of o.interruttori || []) if (e.t <= t) a = e.acceso; return a; }
export const leggeA = (v, t) => (Array.isArray(v) ? v.reduce((a, e) => (e.t <= t ? e.acceso : a), true) : v !== false);

// le specie si possono scrivere per nome: mondo.specie = { elettrone: {...}, ... }
export function risolviSpecie(s, catalogo = {}) {
  if (typeof s === 'string') { const o = catalogo[s]; if (!o) throw new Error(`specie sconosciuta: ${s}`); return { nome: s, ...o }; }
  return s;
}

// ---------- la simulazione di un'esposizione
// mondo = { larghezza, altezza, bordo: 'aperto'|'periodico', G, c, seme,
//           fondo: { B, K }, domini: [{ forma, B, K }],
//           onde: { B: [{ k, a, fi }] }, nubi: { K, modi: [{ k, a, fi }] },
//           cristalli: [{ centro, r, passo, angolo, a }], masse: [{ pos, M, R }],
//           pellicola: { w0, saturazione, vRif }, tempo,
//           specie: { nome: { q, m, luce, vita | vitaMedia, visibile, figli: [{ specie, angolo, quota }] } },
//           sorgenti: [{ pos, dir, v, t0, vita, specie }] }
// angolo e quota delle figlie: un numero, o un intervallo [da, a] da cui si
// estrae a caso. Angolo in gradi, relativo alla direzione della madre. Per la
// luce m è la sua energia (in unità di massa): la sua quantità di moto è m·c.
// le SAGOME: corpi opachi appoggiati sulla lastra. Un lampo di luce uniforme,
// all'istante zero, ne imprime la forma piena (un fotogramma, come una
// radiografia). Sono le campiture: esatte, istantanee, senza riempimenti.
function sagomeImpresse(mondo) {
  if (mondo.lampo === false) return [];
  return (mondo.sagome || []).filter((s) => accesoA(s, 0)).map((s, i) => ({
    sagoma: true, indice: i, contorno: s.contorno, buchi: s.buchi || [], fine: 'lampo', specie: { nome: 'lampo', luce: true }, sorgente: -1, generazione: 0,
    punti: [...s.contorno, s.contorno[0]].map((p) => [p[0], p[1], true, 0, 0, 'luce']),
  }));
}

export function simulaMondo(mondo, opzioni = {}) {
  // più esposizioni sulla stessa lastra: ognuna con i suoi campi, le sue masse,
  // i suoi specchi e le sue sorgenti; le specie, la pellicola e c sono comuni
  if (mondo.esposizioni) {
    const tutte = [], decadimenti = [];
    const lista = [{ domini: mondo.domini, masse: mondo.masse, sorgenti: mondo.sorgenti }, ...mondo.esposizioni];
    for (const s of sagomeImpresse(mondo)) tutte.push({ ...s, id: tutte.length, esposizione: -1 });
    lista.forEach((e, k) => {
      if (!e.sorgenti || !e.sorgenti.length) return;
      const tr = simulaMondo({ ...mondo, esposizioni: undefined, sagome: undefined, domini: e.domini || [], masse: e.masse || [], mappa: e.mappa, sorgenti: e.sorgenti, tempo: e.tempo ?? mondo.tempo }, opzioni);
      for (const t of tr) tutte.push({ ...t, id: tutte.length, esposizione: k - 1 });
      for (const d of tr.decadimenti) decadimenti.push({ ...d, esposizione: k - 1 });
    });
    tutte.decadimenti = decadimenti;
    return tutte;
  }
  const W = mondo.larghezza, H = mondo.altezza, T = mondo.tempo ?? 200;
  const G = mondo.G ?? 1, C = mondo.c ?? 30;
  // le leggi si possono spegnere, gli oggetti pure: per vedere che cosa fa ognuno
  // e anche nel tempo: un interruttore che scatta a metà cambia le traiettorie da lì in poi
  const leggiIn = { ...LEGGI, ...(mondo.leggi || {}) };
  const f0 = { B: 0, K: 0, ...(mondo.fondo || {}) };
  const domini = mondo.domini || [], tutteMasse = mondo.masse || [];
  const continui = campiContinui(mondo), caso = generatore(mondo.seme ?? 1);
  const scatti = [...new Set([...domini, ...tutteMasse].flatMap((o) => (o.interruttori || []).map((e) => e.t)).concat(Object.values(leggiIn).flatMap((v) => (Array.isArray(v) ? v.map((e) => e.t) : []))))].sort((a, b) => a - b);
  const prossimoScatto = (t) => { for (const x of scatti) if (x > t + 1e-12) return x; return Infinity; };
  let S, masse; // lo stato del mondo adesso: tra due scatti non cambia
  const statoA = (t) => {
    const L = {}; for (const k of Object.keys(LEGGI)) L[k] = leggeA(leggiIn[k], t);
    S = { L, fondo: { B: L.magnetico ? f0.B : 0, K: L.materia ? f0.K : 0 }, dom: domini.map((d) => accesoA(d, t)) };
    masse = L.gravita ? tutteMasse.filter((m) => accesoA(m, t)) : [];
  };
  statoA(0);
  const catalogo = mondo.specie || {};
  const pel = { w0: 1, saturazione: 4, vRif: 10, ...(mondo.pellicola || {}) };
  const bordo = mondo.bordo || 'aperto';
  const quale = indiceDomini(domini, W, H, (i) => S.dom[i]);
  const campoIn = (x, y) => {
    const i = quale(x, y), f = S.fondo, L = S.L;
    let B = f.B, K = f.K;
    if (i >= 0) { const d = domini[i]; B = L.magnetico ? d.B ?? f0.B : 0; K = L.materia ? d.K ?? f0.K : 0; }
    if (continui) { if (L.magnetico) B += continui.B(x, y); if (L.materia) K += continui.K(x, y); }
    return { B, K, i };
  };
  // la gravità delle masse: accelerazione di caduta e distanza dalla superficie più vicina
  const gravita = (x, y) => {
    let gx = 0, gy = 0;
    for (const s of masse) { const dx = s.pos[0] - x, dy = s.pos[1] - y, r2 = dx * dx + dy * dy + 1e-9, k = (G * s.M) / (r2 * Math.sqrt(r2)); gx += k * dx; gy += k * dy; }
    return [gx, gy];
  };
  const superficie = (x, y) => { let d = Infinity, chi = -1; masse.forEach((s, j) => { const e = Math.hypot(x - s.pos[0], y - s.pos[1]) - (s.R ?? 0); if (e < d) { d = e; chi = j; } }); return { d, chi }; };
  const lontano = (x, y) => { let d = Infinity; for (const s of masse) d = Math.min(d, Math.hypot(x - s.pos[0], y - s.pos[1])); return d; };
  const passoMax = opzioni.passo ?? Math.max(W, H) / 500;
  const maxParticelle = opzioni.maxParticelle ?? 20000;
  const tracce = [], decadimenti = [];
  const coda = (mondo.sorgenti || []).map((s, i) => {
    if (!accesoA(s, s.t0 ?? 0)) return null;
    const specie = risolviSpecie(s.specie, catalogo), v = specie.luce ? C : s.v;
    // «vita» sulla sorgente: l'istante in cui QUESTA particella decade (le particelle di una
    // stessa specie decadono ognuna a un istante diverso; la specie ne dà solo la media)
    return { pos: s.pos.slice(), vel: [Math.cos(s.dir ?? 0) * v, Math.sin(s.dir ?? 0) * v], t: s.t0 ?? 0, specie, nascita: s.t0 ?? 0, sorgente: i, generazione: 0, madre: null, vita: s.vita };
  }).filter(Boolean);
  let nate = 0;

  while (coda.length && nate < maxParticelle) {
    const p = coda.shift(); nate++;
    const sp = p.specie, luce = !!sp.luce, q = luce ? 0 : sp.q ?? 0, m = sp.m ?? 1;
    // la vita di QUESTA particella: data, o estratta dalla vita media della specie
    const vita = p.vita ?? sp.vita ?? (sp.vitaMedia != null ? -sp.vitaMedia * Math.log(1 - caso()) : Infinity);
    statoA(p.t); let scatto = prossimoScatto(p.t);
    const visibile = sp.visibile ?? q !== 0;
    const larghezza = (v) => (!visibile ? 0 : q ? pel.w0 * Math.abs(q) * Math.min(pel.saturazione, pel.vRif / Math.max(v, 1e-9)) : pel.w0 * 0.35);
    let [x, y] = p.pos, [vx, vy] = p.vel, t = p.t;
    let c = campoIn(x, y);
    // il nome della legge che agisce in un punto, per colorare e per spiegare
    const legge = (cc, gx, gy, v) => {
      const parti = [];
      if (masse.length) { const gp = Math.abs(gx * vy - gy * vx) / (v || 1); if ((gp * (luce ? 2 : 1)) / ((v * v) || 1) > 1 / (6 * Math.max(W, H))) parti.push('gravita'); }
      if (luce) return parti.length ? parti.join('+') : 'libero';
      if (q && cc.B) parti.push('magnetico');
      if (q && cc.K) parti.push('materia');
      return parti.length ? parti.join('+') : 'libero';
    };
    const g0 = gravita(x, y);
    const punti = [[x, y, visibile, t, larghezza(Math.hypot(vx, vy)), legge(c, g0[0], g0[1], Math.hypot(vx, vy))]];
    let fine = 'tempo', guardia = 0;
    while (t < T && guardia++ < 200000) {
      const v = Math.hypot(vx, vy);
      if (v < 1e-9) { fine = 'ferma'; break; }
      // un interruttore scatta: il mondo cambia qui, la particella prosegue nel mondo nuovo
      if (t >= scatto - 1e-12) { statoA(t); scatto = prossimoScatto(t); c = campoIn(x, y); }
      if (S.L.decadimento && t >= p.nascita + vita) { fine = 'decade'; break; }
      const w = q ? (q * c.B) / m : 0, kq = q ? (c.K * q * q) / m : 0;
      // l'accelerazione di gravità: per la luce solo la parte trasversale, doppia, divisa per n²
      const accel = (px, py, ux, uy) => {
        if (!masse.length) return [0, 0];
        const [gx, gy] = gravita(px, py);
        if (!luce) return [gx, gy];
        const k = 2, par = gx * ux + gy * uy;
        return [k * (gx - par * ux), k * (gy - par * uy)];
      };
      const [ax, ay] = accel(x, y, vx / v, vy / v);
      // il passo: piccolo abbastanza per la svolta, per il rallentamento, vicino alle masse
      let dt = Math.min(passoMax / v, T - t, S.L.decadimento ? p.nascita + vita - t : Infinity, scatto - t);
      if (masse.length) { const L = lontano(x, y), a = Math.hypot(ax, ay) + 1e-12; dt = Math.min(dt, (0.02 * L) / v, 0.1 * Math.sqrt(L / a)); }
      if (w) dt = Math.min(dt, 0.06 / Math.abs(w));
      if (kq) dt = Math.min(dt, (0.15 * v * v * v) / (3 * kq) + 1e-12);
      if (continui && q) dt = Math.min(dt, continui.lambda(x, y) / (14 * v));
      const avanza = (h) => {
        // mezzo calcio di gravità, poi rotazione esatta, Bethe esatto e corda
        // dell'arco, poi l'altro mezzo calcio (velocity Verlet)
        let wx = vx + (ax * h) / 2, wy = vy + (ay * h) / 2;
        const v0 = Math.hypot(wx, wy) || 1e-12;
        const fi = w * h, v3 = v0 * v0 * v0 - 3 * kq * h, v1 = kq ? (v3 > 0 ? Math.cbrt(v3) : 0) : v0;
        const vm = (v0 + v1) / 2, fattore = Math.abs(fi) > 1e-9 ? Math.sin(fi / 2) / (fi / 2) : 1;
        const ux = wx / v0, uy = wy / v0, cm = Math.cos(fi / 2), sm = Math.sin(fi / 2);
        const nx = x + vm * h * fattore * (ux * cm - uy * sm), ny = y + vm * h * fattore * (ux * sm + uy * cm);
        const cf = Math.cos(fi), sf = Math.sin(fi);
        wx = v1 * (ux * cf - uy * sf); wy = v1 * (ux * sf + uy * cf);
        if (masse.length) { const u = Math.hypot(wx, wy) || 1e-12, [bx, by] = accel(nx, ny, wx / u, wy / u); wx += (bx * h) / 2; wy += (by * h) / 2; }
        if (luce) { const u = Math.hypot(wx, wy) || 1e-12, s = C / u; wx *= s; wy *= s; }
        else { const u = Math.hypot(wx, wy); if (u > 0.99 * C) { const s = (0.99 * C) / u; wx *= s; wy *= s; } } // nessuna particella con massa raggiunge c
        return { x: nx, y: ny, vx: wx, vy: wy, ferma: kq > 0 && v3 <= 0 };
      };
      let s = avanza(dt);
      // si attraversa un confine di dominio: si accorcia il passo fino al confine
      if (campoIn(s.x, s.y).i !== c.i) {
        let lo = 0, hi = dt;
        for (let k = 0; k < 22; k++) { const mid = (lo + hi) / 2, r = avanza(mid); if (campoIn(r.x, r.y).i === c.i) lo = mid; else hi = mid; }
        dt = hi; s = avanza(dt);
      }
      x = s.x; y = s.y; vx = s.vx; vy = s.vy; t += dt;
      // il corpo di una massa: chi lo tocca ci cade dentro
      if (masse.length) {
        const { d, chi } = superficie(x, y);
        if (d <= 0) {
          const mm = masse[chi], dx = x - mm.pos[0], dy = y - mm.pos[1], r = Math.hypot(dx, dy) || 1, R = mm.R ?? 0;
          x = mm.pos[0] + (dx / r) * R; y = mm.pos[1] + (dy / r) * R;
          punti.push([x, y, visibile, t, larghezza(Math.hypot(vx, vy)), punti[punti.length - 1][5]]);
          fine = 'caduta'; break;
        }
      }
      // il bordo del mondo
      if (x < 0 || y < 0 || x > W || y > H) {
        if (bordo === 'periodico') {
          punti.push([x, y, visibile, t, larghezza(Math.hypot(vx, vy)), punti[punti.length - 1][5]]);
          x = ((x % W) + W) % W; y = ((y % H) + H) % H;
          punti.push([x, y, false, t, 0, 'libero']);
        } else { fine = 'fuori'; punti.push([x, y, visibile, t, larghezza(Math.hypot(vx, vy)), punti[punti.length - 1][5]]); break; }
      }
      c = campoIn(x, y);
      const gg = masse.length ? gravita(x, y) : [0, 0];
      punti.push([x, y, visibile, t, larghezza(Math.hypot(vx, vy)), legge(c, gg[0], gg[1], Math.hypot(vx, vy))]);
      if (s.ferma) { fine = 'ferma'; vx = 0; vy = 0; break; }
    }
    if (visibile && punti.length > 1) tracce.push({ id: tracce.length, punti, fine, specie: sp, sorgente: p.sorgente, generazione: p.generazione, madre: p.madre });
    // il decadimento: le figlie partono da qui, ora
    if (fine === 'decade' && sp.figli) {
      const v = Math.hypot(vx, vy), dir = Math.atan2(vy, vx), P = luce ? m * C : m * v;
      for (const f of sp.figli) {
        const estrai = (x, d) => (Array.isArray(x) ? x[0] + caso() * (x[1] - x[0]) : x ?? d);
        const fs = risolviSpecie(f.specie, catalogo), a = dir + (estrai(f.angolo, 0) * Math.PI) / 180, mf = fs.m ?? 1;
        const vf = fs.luce ? C : Math.min(0.95 * C, f.v != null ? f.v : (estrai(f.quota, 0.5) * (P || m * pel.vRif)) / mf);
        coda.push({ pos: [x, y], vel: [Math.cos(a) * vf, Math.sin(a) * vf], t, nascita: t, specie: fs, sorgente: p.sorgente, generazione: p.generazione + 1, madre: { specie: sp.nome, t } });
      }
      decadimenti.push({ pos: [x, y], t, specie: sp.nome, sorgente: p.sorgente, generazione: p.generazione });
    }
  }
  for (const s of sagomeImpresse(mondo)) tracce.push({ ...s, id: tracce.length });
  tracce.decadimenti = decadimenti;
  return tracce;
}

// ---------- le forze in un punto, separate per legge (per vederle)
// Restituisce le accelerazioni che ogni legge dà a una particella di quella
// specie che passa in (x, y) con velocità (vx, vy), e il dominio dove si trova.
export function forze(mondo, specie, x, y, vx, vy, esposizione = -1, t = 0) {
  if (esposizione >= 0 && mondo.esposizioni) { const e = mondo.esposizioni[esposizione]; mondo = { ...mondo, domini: e.domini || [], masse: e.masse || [], mappa: e.mappa }; }
  const leggi = {}; for (const k of Object.keys(LEGGI)) leggi[k] = leggeA((mondo.leggi || {})[k] ?? true, t);
  mondo = { ...mondo, domini: (mondo.domini || []).filter((d) => accesoA(d, t)), masse: leggi.gravita ? (mondo.masse || []).filter((m) => accesoA(m, t)) : [],
    fondo: { ...(mondo.fondo || {}), B: leggi.magnetico ? mondo.fondo?.B : 0, K: leggi.materia ? mondo.fondo?.K : 0 } };
  if (!leggi.magnetico || !leggi.materia) mondo.domini = mondo.domini.map((d) => ({ ...d, B: leggi.magnetico ? d.B : 0, K: leggi.materia ? d.K : 0 }));
  const fondo = { B: 0, K: 0, ...(mondo.fondo || {}) }, G = mondo.G ?? 1;
  let d = { ...fondo, i: -1 };
  (mondo.domini || []).forEach((dm, i) => { if (dentro(dm.forma, x, y)) d = { B: dm.B ?? fondo.B, K: dm.K ?? fondo.K, i }; });
  const continui = campiContinui(mondo);
  if (continui) d = { ...d, B: d.B + (leggi.magnetico ? continui.B(x, y) : 0), K: d.K + (leggi.materia ? continui.K(x, y) : 0) };
  const sp = risolviSpecie(specie, mondo.specie), luce = !!sp.luce, q = luce ? 0 : sp.q ?? 0, m = sp.m ?? 1;
  const v = Math.hypot(vx, vy) || 1e-12, ux = vx / v, uy = vy / v, out = { dominio: d, v };
  let gx = 0, gy = 0;
  for (const s of mondo.masse || []) { const dx = s.pos[0] - x, dy = s.pos[1] - y, r2 = dx * dx + dy * dy + 1e-9, k = (G * s.M) / (r2 * Math.sqrt(r2)); gx += k * dx; gy += k * dy; }
  if (luce) { const par = gx * ux + gy * uy; gx = 2 * (gx - par * ux); gy = 2 * (gy - par * uy); }
  if (gx || gy) out.gravita = [gx, gy];
  if (q && d.B) { const w = (q * d.B) / m; out.magnetico = [-w * vy, w * vx]; }
  if (q && d.K) { const a = (d.K * q * q) / (m * v * v); out.materia = [-a * ux, -a * uy]; }
  return out;
}

// ---------- un esperimento: più esposizioni sovrapposte sulla stessa lastra
export function simulaEsperimento(esp, opzioni = {}) {
  const out = [];
  for (const [k, mondo] of (esp.esposizioni || []).entries()) {
    for (const tr of simulaMondo({ larghezza: esp.larghezza, altezza: esp.altezza, ...mondo }, opzioni)) out.push({ ...tr, esposizione: k });
  }
  return out;
}

// ---------- utilità fisiche per chi progetta un esperimento
// raggio di curvatura: r = m·v / (|q|·|B|)
export const raggio = (specie, v, B) => ((specie.m ?? 1) * v) / (Math.abs(specie.q) * Math.abs(B));
// gittata nella materia: m·v⁴ / (4·K·q²)
export const gittata = (specie, v, K) => ((specie.m ?? 1) * v ** 4) / (4 * K * specie.q * specie.q);
// la velocità che dà una certa gittata
export const velocitaPerGittata = (specie, R, K) => Math.pow((4 * K * specie.q * specie.q * R) / (specie.m ?? 1), 0.25);
// il tempo per fermarsi: m·v³ / (3·K·q²)
export const tempoDiArresto = (specie, v, K) => ((specie.m ?? 1) * v ** 3) / (3 * K * specie.q * specie.q);
// velocità dell'orbita circolare attorno a una massa: √(G·M/r)
export const velocitaOrbitale = (G, M, r) => Math.sqrt((G * M) / r);
// deflessione della luce che passa a distanza b: 4·G·M/(b·c²)
export const deflessioneLuce = (G, M, b, c) => (4 * G * M) / (b * c * c);
