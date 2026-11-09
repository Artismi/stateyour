// motore.js — il motore dei pattern.
//
// Una realtà 2D (il piano di esistenza) su cui si muovono particelle.
// Ogni particella è un vettore: posizione, velocità (modulo + direzione), massa.
// Da sola prosegue in linea retta. Può essere influenzata da tre piani:
//
//   1. il piano gravitazionale: masse puntiformi su una griglia 2D che
//      curvano la traiettoria secondo la gravitazione (una massa attiva
//      alla volta => conica esatta: cerchio, ellisse, parabola, iperbole);
//   2. il piano delle interfacce: segmenti perpendicolari al piano di
//      esistenza che separano due mezzi; la particella viene riflessa
//      (specchio) o rifratta (legge di Snell), oppure assorbita;
//   3. il piano dei campi: forze in più dentro una regione.
//        magnetico (Lorentz): accelerazione perpendicolare alla velocità,
//          da solo dà un cerchio esatto di raggio v/ω;
//        attrito (Stokes): accelerazione contraria alla velocità;
//        magnetico + attrito: la velocità ruota a ritmo costante e cala in
//          modo esponenziale, la traiettoria è una spirale logaritmica esatta;
//        molla (Hooke) verso una retta: richiamo proporzionale alla distanza
//          dall'asse, il moto lungo l'asse resta uniforme: sinusoide esatta.
//
// LO SPAZIOTEMPO. Il modo principale di descrivere un pattern è uno STATO,
// non una sequenza di comandi: un insieme di BLOCCHI, ognuno una regione
// di spazio per un intervallo di tempo con la sua legge fisica:
//
//   { piano, regione, tempo: [t0, t1], legge }
//
// La particella in ogni istante sente le leggi dei blocchi che contengono
// la sua posizione e il suo tempo, nel suo piano di esistenza. Quando passa
// da un blocco all'altro il punto esatto del passaggio si trova per
// bisezione. Non ci sono azioni né fasi: la linea è la linea d'universo
// della particella attraverso lo stato.
//
// Restano, per i primi esempi, gli elementi accendibili e le REGOLE a eventi
// (attraversa, distanza, tocca, ogni N passi) con le loro azioni.
// Questo file non sa nulla di disegno o di browser.

export const G_DEFAULT = 1;

// ---------- vettori ----------
export const V = {
  add: (a, b) => [a[0] + b[0], a[1] + b[1]],
  sub: (a, b) => [a[0] - b[0], a[1] - b[1]],
  mul: (a, k) => [a[0] * k, a[1] * k],
  dot: (a, b) => a[0] * b[0] + a[1] * b[1],
  cross: (a, b) => a[0] * b[1] - a[1] * b[0],
  len: (a) => Math.hypot(a[0], a[1]),
  norm: (a) => { const l = Math.hypot(a[0], a[1]) || 1; return [a[0] / l, a[1] / l]; },
  perp: (a) => [-a[1], a[0]],
  daAngolo: (gradi) => [Math.cos(gradi * Math.PI / 180), Math.sin(gradi * Math.PI / 180)],
};

// ---------- i campi ----------
// { id, tipo: 'magnetico'|'attrito'|'molla', pos, raggio, rett: [x0,y0,x1,y1], acceso, ... }
// magnetico: omega   (accelerazione = omega · velocità ruotata di 90°; omega < 0 gira in senso orario)
// attrito:   gamma   (accelerazione = −gamma · velocità)
// molla:     a, b, k (accelerazione = −k · distanza con segno dalla retta a→b, lungo la normale)
function dentroCampo(c, pos) {
  if (c.rett) return pos[0] >= c.rett[0] && pos[1] >= c.rett[1] && pos[0] <= c.rett[2] && pos[1] <= c.rett[3];
  if (c.raggio == null) return true;
  const d = V.sub(pos, c.pos || [0, 0]);
  return V.len(d) <= c.raggio;
}

// ---------- lo spaziotempo: regioni, tempi, leggi ----------
// regione: { tipo: 'tutto' }
//          { tipo: 'cerchio', centro, r }
//          { tipo: 'settore', centro, r: [r0, r1], da, ampiezza }   (radianti, antiorario da `da`)
//          { tipo: 'semipiano', a, b }                              (a sinistra di a→b)
//          { tipo: 'poligono', punti }
// legge:   { tipo: 'gravita', pos, M } | { tipo: 'magnetico', omega } | { tipo: 'attrito', gamma }
//          { tipo: 'molla', a, b, k } | { tipo: 'ferma' } | { tipo: 'vuoto' }
//          oppure una lista di leggi che valgono insieme
const DUE_PI = 2 * Math.PI;
export function contiene(reg, pos) {
  switch (reg.tipo) {
    case 'tutto': return true;
    case 'cerchio': return V.len(V.sub(pos, reg.centro)) <= reg.r;
    case 'settore': {
      const d = V.sub(pos, reg.centro), r = V.len(d);
      if (r < reg.r[0] || r > reg.r[1]) return false;
      let a = Math.atan2(d[1], d[0]) - reg.da;
      a = ((a % DUE_PI) + DUE_PI) % DUE_PI;
      return a <= reg.ampiezza;
    }
    case 'semipiano': return lato(pos, reg.a, reg.b) >= 0;
    case 'poligono': {
      const P = reg.punti; let dentro = false;
      for (let i = 0, j = P.length - 1; i < P.length; j = i++) {
        if ((P[i][1] > pos[1]) !== (P[j][1] > pos[1]) &&
            pos[0] < (P[j][0] - P[i][0]) * (pos[1] - P[i][1]) / (P[j][1] - P[i][1]) + P[i][0]) dentro = !dentro;
      }
      return dentro;
    }
    default: throw new Error(`regione sconosciuta: ${reg.tipo}`);
  }
}
// I piani di esistenza sono percorsi: un elemento del piano "s3" agisce sulle
// particelle del piano "s3" e di ogni suo sottopiano ("s3/c", "s3/cr0", ...);
// un elemento senza piano agisce su tutte.
export function nelPiano(pianoElemento, pianoParticella) {
  if (pianoElemento == null) return true;
  if (pianoParticella == null) return false;
  return pianoParticella === pianoElemento || pianoParticella.startsWith(pianoElemento + '/');
}
export function inBlocco(b, pos, t, piano) {
  if (!nelPiano(b.piano, piano)) return false;
  if (b.tempo && ((b.tempo[0] != null && t < b.tempo[0]) || (b.tempo[1] != null && t > b.tempo[1]))) return false;
  return contiene(b.regione || { tipo: 'tutto' }, pos);
}
const leggiDi = (b) => (Array.isArray(b.legge) ? b.legge : [b.legge || { tipo: 'vuoto' }]);
export const ferma = (b) => leggiDi(b).some((l) => l.tipo === 'ferma');

function forzaLegge(l, pos, vel, G) {
  switch (l.tipo) {
    case 'gravita': {
      const dx = l.pos[0] - pos[0], dy = l.pos[1] - pos[1];
      const r2 = dx * dx + dy * dy;
      if (r2 < 1e-12) return [0, 0];
      const k = G * l.M / (r2 * Math.sqrt(r2));
      return [k * dx, k * dy];
    }
    case 'magnetico': { const w = l.omega ?? 1; return [-w * vel[1], w * vel[0]]; }
    case 'attrito': { const g = l.gamma ?? 0.1; return [-g * vel[0], -g * vel[1]]; }
    case 'molla': {
      const u = V.norm(V.sub(l.b, l.a)), n = V.perp(u);
      const d = V.dot(V.sub(pos, l.a), n), k = l.k ?? 0.01;
      return [-k * d * n[0], -k * d * n[1]];
    }
    default: return [0, 0];
  }
}

// ---------- gravitazione + attrito ----------
function accelerazione(pos, vel, masse, campi, acceso, G, attivi = []) {
  let ax = 0, ay = 0;
  for (const b of attivi) {
    for (const l of leggiDi(b)) { const f = forzaLegge(l, pos, vel, G); ax += f[0]; ay += f[1]; }
  }
  for (const m of masse) {
    if (!acceso[m.id]) continue;
    const dx = m.pos[0] - pos[0], dy = m.pos[1] - pos[1];
    const r2 = dx * dx + dy * dy;
    if (r2 < 1e-12) continue;
    const k = G * m.M / (r2 * Math.sqrt(r2));
    ax += k * dx; ay += k * dy;
  }
  for (const c of campi) {
    if (!acceso[c.id] || !dentroCampo(c, pos)) continue;
    if (c.tipo === 'attrito') {
      const g = c.gamma ?? 0.1;
      ax -= g * vel[0]; ay -= g * vel[1];
    } else if (c.tipo === 'magnetico') {
      const w = c.omega ?? 1;
      ax += -w * vel[1]; ay += w * vel[0];
    } else if (c.tipo === 'molla') {
      const a = c.a || [0, 0], b = c.b || [1, 0];
      const u = V.norm(V.sub(b, a)), n = V.perp(u);
      const d = V.dot(V.sub(pos, a), n); // distanza con segno dall'asse
      const k = c.k ?? 0.01;
      ax -= k * d * n[0]; ay -= k * d * n[1];
    }
  }
  return [ax, ay];
}

// Un passo Runge-Kutta del quarto ordine sullo stato {pos, vel}.
function rk4(s, dt, masse, campi, acceso, G, attivi) {
  const a1 = accelerazione(s.pos, s.vel, masse, campi, acceso, G, attivi);
  const p2 = V.add(s.pos, V.mul(s.vel, dt / 2)), v2 = V.add(s.vel, V.mul(a1, dt / 2));
  const a2 = accelerazione(p2, v2, masse, campi, acceso, G, attivi);
  const p3 = V.add(s.pos, V.mul(v2, dt / 2)), v3 = V.add(s.vel, V.mul(a2, dt / 2));
  const a3 = accelerazione(p3, v3, masse, campi, acceso, G, attivi);
  const p4 = V.add(s.pos, V.mul(v3, dt)), v4 = V.add(s.vel, V.mul(a3, dt));
  const a4 = accelerazione(p4, v4, masse, campi, acceso, G, attivi);
  const pos = [
    s.pos[0] + dt / 6 * (s.vel[0] + 2 * v2[0] + 2 * v3[0] + v4[0]),
    s.pos[1] + dt / 6 * (s.vel[1] + 2 * v2[1] + 2 * v3[1] + v4[1]),
  ];
  const vel = [
    s.vel[0] + dt / 6 * (a1[0] + 2 * a2[0] + 2 * a3[0] + a4[0]),
    s.vel[1] + dt / 6 * (a1[1] + 2 * a2[1] + 2 * a3[1] + a4[1]),
  ];
  return { pos, vel };
}

// ---------- geometria delle linee ----------
// Da che lato della retta a->b sta il punto p: >0 sinistra, <0 destra, 0 sopra.
export function lato(p, a, b) {
  return V.cross(V.sub(b, a), V.sub(p, a));
}

// Intersezione del tratto p0->p1 col segmento a->b. Ritorna la frazione t in [0,1]
// lungo p0->p1 oppure null.
export function intersezione(p0, p1, a, b) {
  const r = V.sub(p1, p0), s = V.sub(b, a);
  const den = V.cross(r, s);
  if (Math.abs(den) < 1e-14) return null;
  const qp = V.sub(a, p0);
  const t = V.cross(qp, s) / den;
  const u = V.cross(qp, r) / den;
  const eps = 1e-9; // i vertici condivisi non devono lasciare fessure
  if (t < 0 || t > 1 || u < -eps || u > 1 + eps) return null;
  return Math.max(0, t);
}

// ---------- ottica ----------
export function rifletti(vel, normale) {
  const n = V.norm(normale);
  return V.sub(vel, V.mul(n, 2 * V.dot(vel, n)));
}

// Snell: nIn sin(t1) = nOut sin(t2). La velocità scala come nIn/nOut
// (come la luce: v = c/n). Se la riflessione è totale, riflette.
export function rifrangi(vel, normale, nIn, nOut) {
  let n = V.norm(normale);
  const d = V.norm(vel), modulo = V.len(vel);
  let cosI = -V.dot(d, n);
  if (cosI < 0) { n = V.mul(n, -1); cosI = -cosI; } // normale rivolta contro il raggio
  const eta = nIn / nOut;
  const k = 1 - eta * eta * (1 - cosI * cosI);
  if (k < 0) return { vel: rifletti(vel, n), totale: true };
  const t = V.add(V.mul(d, eta), V.mul(n, eta * cosI - Math.sqrt(k)));
  return { vel: V.mul(V.norm(t), modulo * eta), totale: false };
}

// ---------- la partitura ----------
// {
//   nome, G, dt, passi, limiti: [xmin, ymin, xmax, ymax],
//   blocchi:    [{ id, piano, regione, tempo: [t0, t1], legge }],     (lo stato)
//   emettitori: [{ id, piano, pos, angolo | dir, v, t0, dt, passi, limiti, regole }],
//   masse:      [{ id, pos, M, acceso }],
//   interfacce: [{ id, a, b, tipo: 'specchio'|'rifrazione'|'assorbe', n1, n2, acceso }],
//   campi:      [{ id, tipo: 'magnetico'|'attrito'|'molla', pos, raggio, rett, acceso, ... }],
//   regole:     [{ quando: {...}, fai: [{...}] }]
// }
// quando: { tipo: 'attraversa', a, b, verso?: 'entrambi'|'sinistra'|'destra' }
//         { tipo: 'distanza', da: [x, y], r, verso?: 'entrambi'|'dentro'|'fuori' }
//         { tipo: 'tocca', id }           (un'interfaccia)
//         { tipo: 'passi', n }            (al passo n)
//         { tipo: 'ogni', passi: n }      (ogni n passi)
// fai:    { tipo: 'accendi'|'spegni'|'inverti', id }   (id di massa, interfaccia, campo o 'penna')
//         { tipo: 'staffetta', lista: [id...], allaFine?: 'ferma' }
//         { tipo: 'ferma' }

export function statoIniziale(partitura) {
  const acceso = {};
  for (const m of partitura.masse || []) acceso[m.id] = m.acceso !== false;
  for (const i of partitura.interfacce || []) acceso[i.id] = i.acceso !== false;
  for (const c of partitura.campi || []) acceso[c.id] = c.acceso !== false;
  return acceso;
}

// Gli eventi continui sono funzioni scalari della posizione: l'evento scatta
// quando cambiano segno, e il punto esatto si trova per bisezione.
function funzioneEvento(q) {
  if (q.tipo === 'attraversa') return (pos) => lato(pos, q.a, q.b);
  if (q.tipo === 'distanza') return (pos) => V.len(V.sub(pos, q.da)) - q.r;
  return null;
}
function versoOk(q, dopo) {
  const verso = q.verso || 'entrambi';
  if (verso === 'entrambi') return true;
  if (q.tipo === 'attraversa') return (verso === 'sinistra' && dopo > 0) || (verso === 'destra' && dopo < 0);
  return (verso === 'fuori' && dopo > 0) || (verso === 'dentro' && dopo < 0);
}
const segno = (v) => (Math.abs(v) < 1e-7 ? 0 : Math.sign(v));

function applica(azioni, p, traccia) {
  for (const az of azioni) {
    switch (az.tipo) {
      case 'accendi': if (az.id === 'penna') p.penna = true; else p.acceso[az.id] = true; break;
      case 'spegni': if (az.id === 'penna') p.penna = false; else p.acceso[az.id] = false; break;
      case 'inverti': if (az.id === 'penna') p.penna = !p.penna; else p.acceso[az.id] = !p.acceso[az.id]; break;
      case 'staffetta': {
        const chiave = az.lista.join('|');
        // la staffetta parte da chi è acceso nella lista, altrimenti dal primo
        if (p.staffette[chiave] === undefined) {
          const k0 = az.lista.findIndex((id) => p.acceso[id]);
          p.staffette[chiave] = k0 < 0 ? -1 : k0;
        }
        const k = p.staffette[chiave];
        if (k >= 0) p.acceso[az.lista[k]] = false;
        if (k + 1 < az.lista.length) p.acceso[az.lista[k + 1]] = true;
        else if (az.allaFine === 'ferma') p.fine = 'fermata';
        p.staffette[chiave] = k + 1;
        break;
      }
      case 'ferma': p.fine = 'fermata'; break;
      default: throw new Error(`azione sconosciuta: ${az.tipo}`);
    }
    traccia.eventi.push({ passo: p.passo, pos: p.s.pos.slice(), azione: az });
  }
}

export function simulaParticella(em, partitura) {
  const G = partitura.G ?? G_DEFAULT;
  const dt = em.dt ?? partitura.dt ?? 0.05;
  const maxPassi = em.passi ?? partitura.passi ?? 2000;
  const limiti = em.limiti || partitura.limiti || [-1e4, -1e4, 1e4, 1e4];
  const piano = em.piano ?? null;
  // ogni particella vede solo gli elementi del proprio piano di esistenza
  const mio = (x) => nelPiano(x.piano, piano);
  const masse = (partitura.masse || []).filter(mio);
  const interfacce = (partitura.interfacce || []).filter(mio);
  const campi = (partitura.campi || []).filter(mio);
  // le regole della partitura valgono per le particelle del loro piano; un
  // emettitore può averne di proprie
  const regole = [...(partitura.regole || []).filter(mio), ...(em.regole || [])];
  const continue_ = regole.map((r) => funzioneEvento(r.quando));
  const blocchi = (partitura.blocchi || []).filter(mio);
  const insieme = (pos, t) => blocchi.filter((b) => inBlocco(b, pos, t, piano));
  const chiave = (lista) => lista.map((b) => blocchi.indexOf(b)).join(',');

  const dir = em.dir ? V.norm(em.dir) : V.daAngolo(em.angolo ?? 0);
  const p = {
    s: { pos: em.pos.slice(), vel: V.mul(dir, em.v ?? 1) },
    m: em.m ?? 1,
    acceso: em.acceso ? { ...em.acceso } : statoIniziale(partitura),
    staffette: {},
    t: em.t0 ?? 0,
    segni: continue_.map((f) => (f ? segno(f(em.pos)) : 0)),
    penna: em.penna !== false,
    passo: 0,
    fine: null,
    ultimaInterfaccia: null,
  };
  p.attivi = insieme(p.s.pos, p.t);
  const traccia = { id: em.id, piano, punti: [[p.s.pos[0], p.s.pos[1], p.penna, p.t]], eventi: [], fine: null };
  if (p.attivi.some(ferma)) p.fine = 'fermata';

  const dentro = (q) => q[0] >= limiti[0] && q[1] >= limiti[1] && q[0] <= limiti[2] && q[1] <= limiti[3];
  const aggiornaSegni = (pos, forza) => {
    continue_.forEach((f, k) => {
      if (!f) return;
      const s = segno(f(pos));
      if (forza || s !== 0) p.segni[k] = s;
    });
  };

  while (p.passo < maxPassi && !p.fine) {
    p.passo++;
    const s0 = p.s;
    let s1 = rk4(s0, dt, masse, campi, p.acceso, G, p.attivi);
    let saltaContinui = false, durata = dt;

    // 1. interfacce: il tratto può toccarne più d'una nello stesso passo
    //    (vicino a un vertice): dopo ogni tocco il resto del passo prosegue
    //    dritto con la nuova velocità e viene ricontrollato.
    let escludi = p.ultimaInterfaccia;
    let da = s0, a = s1, resto = dt, colpi = 0;
    p.ultimaInterfaccia = null;
    while (colpi < 16) {
      let colpo = null;
      for (const i of interfacce) {
        if (!p.acceso[i.id] || i.id === escludi) continue;
        const t = intersezione(da.pos, a.pos, i.a, i.b);
        if (t !== null && (colpo === null || t < colpo.t)) colpo = { t, i };
      }
      if (!colpo) break;
      colpi++;
      const { t, i } = colpo;
      const punto = V.add(da.pos, V.mul(V.sub(a.pos, da.pos), t));
      const velArrivo = V.add(da.vel, V.mul(V.sub(a.vel, da.vel), t));
      const normale = V.norm(V.perp(V.sub(i.b, i.a)));
      let velNuova = velArrivo, nota = i.tipo;
      if (i.tipo === 'specchio') {
        velNuova = rifletti(velArrivo, normale);
      } else if (i.tipo === 'rifrazione') {
        const daSinistra = lato(da.pos, i.a, i.b) > 0;
        const nIn = daSinistra ? (i.n1 ?? 1) : (i.n2 ?? 1);
        const nOut = daSinistra ? (i.n2 ?? 1) : (i.n1 ?? 1);
        const r = rifrangi(velArrivo, normale, nIn, nOut);
        velNuova = r.vel; nota = r.totale ? 'riflessione totale' : 'rifrazione';
      } else if (i.tipo === 'assorbe') {
        p.s = { pos: punto, vel: velArrivo };
        traccia.punti.push([punto[0], punto[1], p.penna, p.t + dt * t]);
        p.fine = 'assorbita';
      }
      traccia.eventi.push({ passo: p.passo, pos: punto.slice(), tocca: i.id, nota });
      if (p.fine) break;
      traccia.punti.push([punto[0], punto[1], p.penna, p.t + (dt - resto) + resto * t]);
      resto = resto * (1 - t);
      da = { pos: punto, vel: velNuova };
      a = { pos: V.add(punto, V.mul(velNuova, resto)), vel: velNuova };
      escludi = i.id;
      p.ultimaInterfaccia = i.id;
      p.s = da;
      for (const r of regole) {
        if (r.quando.tipo === 'tocca' && r.quando.id === i.id) applica(r.fai, p, traccia);
      }
    }
    if (p.fine) break;
    if (colpi > 0) {
      s1 = a;
      aggiornaSegni(s1.pos, true);
      saltaContinui = true;
    }

    // 2. passaggio da un blocco di spaziotempo all'altro: bisezione sul tempo
    //    fino all'istante esatto in cui cambia l'insieme dei blocchi
    if (!saltaContinui && blocchi.length) {
      const k0 = chiave(p.attivi);
      if (chiave(insieme(s1.pos, p.t + dt)) !== k0) {
        let lo = 0, hi = dt, sHi = s1;
        for (let it = 0; it < 80 && hi - lo > 1e-13; it++) {
          const mid = (lo + hi) / 2;
          const sMid = rk4(s0, mid, masse, campi, p.acceso, G, p.attivi);
          if (chiave(insieme(sMid.pos, p.t + mid)) === k0) lo = mid; else { hi = mid; sHi = sMid; }
        }
        s1 = sHi; durata = hi;
        const prima = p.attivi;
        p.attivi = insieme(s1.pos, p.t + hi);
        traccia.eventi.push({ passo: p.passo, t: p.t + hi, pos: s1.pos.slice(), cambio: true, da: prima.map((b) => b.id ?? blocchi.indexOf(b)), a: p.attivi.map((b) => b.id ?? blocchi.indexOf(b)) });
        if (p.attivi.some(ferma)) p.fine = 'fermata';
        aggiornaSegni(s1.pos, true);
        saltaContinui = true;
      }
    }

    // 3. eventi continui (attraversa, distanza): bisezione fino al punto esatto
    if (!saltaContinui) {
      let scatto = null;
      continue_.forEach((f, k) => {
        if (!f || scatto) return;
        const prima = p.segni[k], dopo = segno(f(s1.pos));
        if (prima !== 0 && dopo !== 0 && prima !== dopo && versoOk(regole[k].quando, dopo)) scatto = k;
      });
      if (scatto !== null) {
        const f = continue_[scatto], prima = p.segni[scatto];
        let lo = 0, hi = dt, sHi = s1;
        for (let it = 0; it < 60 && hi - lo > 1e-12; it++) {
          const mid = (lo + hi) / 2;
          const sMid = rk4(s0, mid, masse, campi, p.acceso, G, p.attivi);
          if (Math.sign(f(sMid.pos)) === prima) lo = mid; else { hi = mid; sHi = sMid; }
        }
        s1 = sHi; durata = hi;
        p.s = s1;
        aggiornaSegni(s1.pos, true);
        traccia.eventi.push({ passo: p.passo, pos: s1.pos.slice(), attraversa: scatto });
        applica(regole[scatto].fai, p, traccia);
      } else {
        aggiornaSegni(s1.pos, false);
      }
    }

    p.s = s1;
    p.t += durata;
    traccia.punti.push([s1.pos[0], s1.pos[1], p.penna, p.t]);
    // un blocco può cominciare o finire nel tempo anche se la particella sta ferma nello spazio
    if (blocchi.length && !p.fine) {
      const ora = insieme(s1.pos, p.t);
      if (chiave(ora) !== chiave(p.attivi)) { p.attivi = ora; if (ora.some(ferma)) p.fine = 'fermata'; }
    }

    // 4. regole a passi
    for (const r of regole) {
      if (r.quando.tipo === 'passi' && r.quando.n === p.passo) applica(r.fai, p, traccia);
      if (r.quando.tipo === 'ogni' && p.passo % r.quando.passi === 0) applica(r.fai, p, traccia);
    }

    if (!dentro(s1.pos)) p.fine = 'fuori';
  }
  traccia.fine = p.fine || 'passi';
  traccia.passi = p.passo;
  return traccia;
}

export function simula(partitura) {
  return (partitura.emettitori || [])
    .filter((e) => e.acceso !== false)
    .map((e) => simulaParticella(e, partitura));
}

// ---------- utilità per le coniche (una massa sola) ----------
// Velocità all'apside a distanza r per un'orbita di semiasse maggiore a.
export function velocitaApside(GM, r, a) {
  return Math.sqrt(GM * (2 / r - 1 / a));
}
export function velocitaCircolare(GM, r) { return Math.sqrt(GM / r); }
export function velocitaFuga(GM, r) { return Math.sqrt(2 * GM / r); }
