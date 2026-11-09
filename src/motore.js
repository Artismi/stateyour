// motore.js — il motore dei pattern.
//
// Una realtà 2D (il piano di esistenza) su cui si muovono particelle.
// Ogni particella è un vettore: posizione, velocità (modulo + direzione), massa.
// Da sola prosegue in linea retta. Può essere influenzata da due piani:
//
//   1. il piano gravitazionale: masse puntiformi su una griglia 2D che
//      curvano la traiettoria secondo la gravitazione (una massa attiva
//      alla volta => conica esatta: cerchio, ellisse, parabola, iperbole);
//   2. il piano delle interfacce: segmenti perpendicolari al piano di
//      esistenza che separano due mezzi; la particella viene riflessa
//      (specchio) o rifratta (legge di Snell), oppure assorbita.
//
// Ogni elemento può essere acceso o spento. L'accensione avviene tramite
// REGOLE a eventi geometrici (attraverso una linea, tocco un'interfaccia,
// ogni N passi...). Un pattern è quindi codificato come PARTITURA:
// elementi + stato iniziale + regole. Questo file non sa nulla di
// disegno o di browser: gira sia in Node sia nel browser.

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

// ---------- gravitazione ----------
function accelerazione(pos, masse, acceso, G) {
  let ax = 0, ay = 0;
  for (const m of masse) {
    if (!acceso[m.id]) continue;
    const dx = m.pos[0] - pos[0], dy = m.pos[1] - pos[1];
    const r2 = dx * dx + dy * dy;
    if (r2 < 1e-12) continue;
    const k = G * m.M / (r2 * Math.sqrt(r2));
    ax += k * dx; ay += k * dy;
  }
  return [ax, ay];
}

// Un passo Runge-Kutta del quarto ordine sullo stato {pos, vel}.
function rk4(s, dt, masse, acceso, G) {
  const a1 = accelerazione(s.pos, masse, acceso, G);
  const p2 = V.add(s.pos, V.mul(s.vel, dt / 2)), v2 = V.add(s.vel, V.mul(a1, dt / 2));
  const a2 = accelerazione(p2, masse, acceso, G);
  const p3 = V.add(s.pos, V.mul(v2, dt / 2)), v3 = V.add(s.vel, V.mul(a2, dt / 2));
  const a3 = accelerazione(p3, masse, acceso, G);
  const p4 = V.add(s.pos, V.mul(v3, dt)), v4 = V.add(s.vel, V.mul(a3, dt));
  const a4 = accelerazione(p4, masse, acceso, G);
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
//   emettitori: [{ id, pos, angolo, v, m, passi, acceso }],
//   masse:      [{ id, pos, M, acceso }],
//   interfacce: [{ id, a, b, tipo: 'specchio'|'rifrazione'|'assorbe', n1, n2, acceso }],
//   regole:     [{ quando: {...}, fai: [{...}] }]
// }
// quando: { tipo: 'attraversa', a, b, verso?: 'entrambi'|'sinistra'|'destra' }
//         { tipo: 'tocca', id }           (un'interfaccia)
//         { tipo: 'passi', n }            (al passo n)
//         { tipo: 'ogni', passi: n }      (ogni n passi)
// fai:    { tipo: 'accendi'|'spegni'|'inverti', id }   (id di massa, interfaccia o 'penna')
//         { tipo: 'staffetta', lista: [id...] }        (spegne l'attuale, accende il prossimo)
//         { tipo: 'ferma' }

export function statoIniziale(partitura) {
  const acceso = {};
  for (const m of partitura.masse || []) acceso[m.id] = m.acceso !== false;
  for (const i of partitura.interfacce || []) acceso[i.id] = i.acceso !== false;
  return acceso;
}

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
  const limiti = partitura.limiti || [-1e4, -1e4, 1e4, 1e4];
  const masse = partitura.masse || [];
  const interfacce = partitura.interfacce || [];
  const regole = partitura.regole || [];

  const dir = em.dir ? V.norm(em.dir) : V.daAngolo(em.angolo ?? 0);
  const p = {
    s: { pos: em.pos.slice(), vel: V.mul(dir, em.v ?? 1) },
    m: em.m ?? 1,
    acceso: statoIniziale(partitura),
    staffette: {},
    lati: regole.map((r) => (r.quando.tipo === 'attraversa' ? Math.sign(lato(em.pos, r.quando.a, r.quando.b)) : 0)),
    penna: em.penna !== false,
    passo: 0,
    fine: null,
    ultimaInterfaccia: null,
  };
  const traccia = { id: em.id, punti: [[p.s.pos[0], p.s.pos[1], p.penna]], eventi: [], fine: null };

  const dentro = (q) => q[0] >= limiti[0] && q[1] >= limiti[1] && q[0] <= limiti[2] && q[1] <= limiti[3];

  while (p.passo < maxPassi && !p.fine) {
    p.passo++;
    const s0 = p.s;
    let s1 = rk4(s0, dt, masse, p.acceso, G);
    let saltaAttraversa = false;

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
        traccia.punti.push([punto[0], punto[1], p.penna]);
        p.fine = 'assorbita';
      }
      traccia.eventi.push({ passo: p.passo, pos: punto.slice(), tocca: i.id, nota });
      if (p.fine) break;
      traccia.punti.push([punto[0], punto[1], p.penna]);
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
      for (const [k, r] of regole.entries()) {
        if (r.quando.tipo === 'attraversa') p.lati[k] = Math.sign(lato(s1.pos, r.quando.a, r.quando.b));
      }
      saltaAttraversa = true;
    }

    // 2. attraversamenti di linee: bisezione fino al punto esatto
    if (!saltaAttraversa) {
      let fermata = null;
      for (const [k, r] of regole.entries()) {
        if (r.quando.tipo !== 'attraversa') continue;
        const prima = p.lati[k];
        const dopo = Math.sign(lato(s1.pos, r.quando.a, r.quando.b));
        if (prima !== 0 && dopo !== 0 && prima !== dopo) {
          const verso = r.quando.verso || 'entrambi';
          const ok = verso === 'entrambi' || (verso === 'sinistra' && dopo > 0) || (verso === 'destra' && dopo < 0);
          if (ok && (fermata === null)) fermata = { k, r };
        }
      }
      if (fermata) {
        const { k, r } = fermata;
        let lo = 0, hi = dt, sHi = s1;
        for (let it = 0; it < 60 && hi - lo > 1e-12; it++) {
          const mid = (lo + hi) / 2;
          const sMid = rk4(s0, mid, masse, p.acceso, G);
          if (Math.sign(lato(sMid.pos, r.quando.a, r.quando.b)) === p.lati[k]) lo = mid; else { hi = mid; sHi = sMid; }
        }
        s1 = sHi;
        p.s = s1;
        for (const [j, rr] of regole.entries()) {
          if (rr.quando.tipo !== 'attraversa') continue;
          const l = lato(s1.pos, rr.quando.a, rr.quando.b);
          p.lati[j] = Math.abs(l) < 1e-7 ? 0 : Math.sign(l);
        }
        traccia.eventi.push({ passo: p.passo, pos: s1.pos.slice(), attraversa: k });
        applica(r.fai, p, traccia);
      } else {
        for (const [j, rr] of regole.entries()) {
          if (rr.quando.tipo !== 'attraversa') continue;
          const l = lato(s1.pos, rr.quando.a, rr.quando.b);
          if (Math.abs(l) >= 1e-7) p.lati[j] = Math.sign(l);
        }
      }
    }

    p.s = s1;
    traccia.punti.push([s1.pos[0], s1.pos[1], p.penna]);

    // 3. regole a passi
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
