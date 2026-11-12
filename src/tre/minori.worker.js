// minori.worker.js — I CORPI MINORI di un sistema preparati per la vista 3D (minori.js), fuori dal filo dell'interfaccia.
//
// I dati sono quelli di spazio3d.js `scenaSistema(n, gid, sid, t).vuoto()` (vuoto.js `scenaVuoto`, vuoto_sistema.js
// `corpiMinori`): qui non si inventa niente del mondo, li si mette nella forma che serve a chi disegna.
// { n, via: { cosmo, galassia, stella }, t, corpi (true: manda anche le orbite dei corpi delle fasce) } →
//   polvere  { fasce: [{ nome, a (m), K (kg/m²: densità × raggio), sigma (rad) }], grano: { raggio, massa }, tinta, R, x }
//            La densità di `polvere.in(r)` è una somma di scalini K_f/r (uno per fascia che macina, fino al suo raggio
//            a_f): li si ritrova campionando ρ·r (è costante a tratti) e cercando i salti. Lo SPESSORE: i dati lo danno
//            come strato uniforme di mezza altezza r·sen(i_f) (i_f = metà dell'eccentricità della fascia: `spessore`).
//            Qui la stessa colonna è distribuita in latitudine come vuole la legge che corpiMinori usa per le
//            inclinazioni dei corpi (Rayleigh di media i_f): una campana exp(−λ²/2σ²) con σ = i_f·√(2/π) [D: orbite
//            tonde con inclinazioni di Rayleigh danno una campana in latitudine; il picco è la densità dei dati].
//            LA FUNZIONE DI FASE dei grani [D]: il grano dei dati è grande (100 µm, x = 2πa/λ ≈ 1100): ottica
//            geometrica. Due parti: la DIFFRAZIONE (tanta luce quanta ne intercetta, in un lobo largo λ/2a attorno alla
//            direzione della stella: figura di Airy, qui il suo inviluppo lisciato g(u) con u = x·2sen(θ/2), che
//            conserva la somma) e la RIFLESSIONE sulla superficie (sfera liscia: (a²/4)·R(i) per steradiante, i =
//            (π − θ)/2, R di Fresnel con l'indice dei grani di vuoto_mezzo.js MEZZO.grano: 7% all'indietro, tutto
//            radente). Φ(θ) = 4π·(dσ/dΩ)/(πa²) = R + x²·g. Per questo la luce zodiacale sta verso la stella.
//   corpi    le orbite dei corpi delle fasce (Float64Array, EL numeri l'uno): gli elementi che scenaVuoto dà (a, e,
//            assi, periodo) più la fase, ricavata dalla posizione a quel tempo (scenaVuoto non dà l'anomalia all'epoca)
//   comete   per ogni cometa attiva: l'orbita, il nucleo, e la chioma e le code come BATUFFOLI a campana (centro, asse,
//            larghezze, luce), nel riferimento che segue la cometa (x: via dalla stella; z: la normale all'orbita)
//   mancanti ciò che i dati non danno e che qui è stato messo al suo posto (elenco in parole, per chi guarda)
import { scenaSistema } from '../camera/spazio3d.js';
import { SISTEMA, esponenteCascata } from '../camera/vuoto_sistema.js';
import { LEGGI_ANELLI } from '../camera/anelli.js';
import { MATERIALI } from '../camera/lune.js';
import { MEZZO } from '../camera/vuoto_mezzo.js';
import { COSTANTI, LSOLE, UA } from '../camera/leggi.js';

// CIÒ CHE I DATI NON DANNO (scenaVuoto: le righe hanno `W: null`, la polvere di una cometa non ha un ritmo): senza
// questi numeri una cometa non ha luce. Sono presi dalla letteratura [R: ricordati, da verificare] e stanno TUTTI QUI:
// quando vuoto_sistema.js darà i campi (righe[].W, codaPolvere.kgS, …) si leggono quelli e questi non servono più.
export const MANCA = Object.freeze({
  polvereSuGas: 1, // massa di polvere per massa d'acqua che esce (1P/Halley, 67P: tra 1 e 4)
  C2suAcqua: 0.004, // molecole di C₂ per molecola d'acqua (A'Hearn et al. 1995: comete «tipiche»)
  gC2: 4.5e-20, // W per molecola di C₂ alla luce del Sole a 1 UA: la banda di Swan Δv = 0 (A'Hearn 1982)
  COsuAcqua: 0.1, // molecole di CO per molecola d'acqua (dall'1 al 20% nelle comete misurate)
  gCOpiu: 3.55e-21, // W per ione CO⁺ alla luce del Sole a 1 UA: la banda a 426 nm (Magnani & A'Hearn 1986)
  uscitaGrani: 1e-6, // (m) il grano che esce dalla chioma alla velocità del gas; i più grossi vanno come 1/√a (Whipple 1951)
});
const K = COSTANTI, PI = Math.PI, EL = 16, NB = 12, ONDE = [610e-9, 550e-9, 465e-9], TSOLE = 5772;
const lin = (c) => Math.pow(c / 255, 2.2), tinta = (rgb) => { const v = rgb.map(lin), m = Math.max(...v, 1e-9); return v.map((x) => x / m); };
const scal = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], lungo = (a) => Math.hypot(a[0], a[1], a[2]);
const vett = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

// la riflessione di Fresnel (luce non polarizzata) su un materiale di indice n + ik, all'incidenza di coseno ci
function fresnel(ci, n, k) {
  const a = n * n - k * k - (1 - ci * ci), b = 2 * n * k, m = Math.hypot(a, b), p = Math.sqrt((m + a) / 2), q = Math.sqrt(Math.max(0, (m - a) / 2));
  const Rs = ((ci - p) ** 2 + q * q) / ((ci + p) ** 2 + q * q), er = n * n - k * k, nr = er * ci - p, ni = b * ci - q, dr = er * ci + p, di = b * ci + q;
  return 0.5 * (Rs + (nr * nr + ni * ni) / (dr * dr + di * di));
}
// R(i) in funzione dell'angolo di diffusione θ (33 valori da 0 a π): i = (π − θ)/2
const tabellaRiflessa = () => Float32Array.from({ length: 33 }, (_, j) => fresnel(Math.cos((PI - (j / 32) * PI) / 2), MEZZO.grano.n, MEZZO.grano.k));
// quanta della luce di una stella a T sta attorno a una lunghezza d'onda, rispetto al Sole (per le righe eccitate dalla luce)
const planck = (l, T) => 1 / (l ** 5 * Math.expm1((2 * PI * K.hbar * K.c) / (l * K.kB * T))) / T ** 4;
const comeIlSole = (nm, T) => (T > 0 ? planck(nm * 1e-9, T) / planck(nm * 1e-9, TSOLE) : 1);

// gli elementi per chi propaga l'orbita: a, e, M0 (a t = 0), moto medio, P, Q, …; la fase dalla posizione a quel tempo
function elementi(o, pos, t, out, k, raggio, rifl) {
  const [P, Q, W] = o.assi, a = o.a, e = o.e, b = Math.sqrt(1 - e * e), E = Math.atan2(scal(pos, Q) / (a * b), scal(pos, P) / a + e), n = (2 * PI) / o.periodo;
  const menoSin = Math.abs(E) < 0.2 ? (E ** 3 / 6) * (1 - (E * E) / 20 * (1 - (E * E) / 42)) : E - Math.sin(E), M = (1 - e) * E + e * menoSin; // (E − e·senE senza perdere cifre quando e → 1)
  out.set([a, e, M - n * t, n, P[0], P[1], P[2], Q[0], Q[1], Q[2], raggio, rifl[0], rifl[1], rifl[2], Math.sqrt(Math.max(0, 1 - W[2] * W[2])), o.periodo], k * EL);
}

// ---------- la polvere: gli scalini di ρ·r
function polvere(v, stella) {
  const fasce = v.fasce, out = { fasce: [], grano: null, tinta: v.polvere.colore ? tinta(v.polvere.colore) : [1, 1, 1], R: tabellaRiflessa(), x: [0, 0, 0] };
  if (!fasce.length) return out; const g = (r) => v.polvere.in(r) * r, r0 = 0.02 * Math.min(...fasce.map((f) => f.interno)), r1 = 1.02 * Math.max(...fasce.map((f) => f.esterno)), n = 3000, usate = new Set();
  let prima = g(r0), rp = r0; const scala = Math.max(prima, 1e-300);
  for (let i = 1; i <= n; i++) { const r = r0 * Math.pow(r1 / r0, i / n), q = g(r);
    if (Math.abs(q - prima) > 1e-9 * scala) { let lo = rp, hi = r; for (let k = 0; k < 50; k++) { const m = 0.5 * (lo + hi); if (Math.abs(g(m) - prima) > 1e-9 * scala) hi = m; else lo = m; }
      // (più scalini nello stesso tratto: li si prende uno alla volta ripartendo da subito dopo il primo)
      const a = 0.5 * (lo + hi), dopo = g(hi * (1 + 1e-9)), Kf = prima - dopo; let meglio = null, dm = Infinity;
      fasce.forEach((f, j) => { if (usate.has(j) || a < f.interno * 0.999 || a > f.esterno * 1.001) return; const d = Math.abs(a - 0.5 * (f.interno + f.esterno)); if (d < dm) { dm = d; meglio = j; } });
      if (Kf > 0 && meglio != null) { usate.add(meglio); const f = fasce[meglio], inc = Math.asin(Math.min(1, f.spessore / (2 * a))); out.fasce.push({ nome: f.nome, a, K: Kf, sigma: inc * Math.sqrt(2 / PI) }); }
      else if (Kf > 0) out.fasce.push({ nome: null, a, K: Kf, sigma: 0.1 * Math.sqrt(2 / PI), senzaFascia: true });
      prima = dopo; rp = hi; if (Math.abs(q - prima) > 1e-9 * scala) i--; else rp = r; continue; }
    rp = r; }
  // il grano: la sua massa è densità / numero (gli stessi dati), il raggio dalla densità della roccia (lune.js: la stessa di corpiMinori)
  const rr = out.fasce.length ? 0.5 * out.fasce[0].a : 0, dens = rr ? v.polvere.in(rr) : 0, num = rr ? v.polvere.grani(rr) : 0;
  if (dens > 0 && num > 0) { const massa = dens / num, raggio = Math.cbrt((3 * massa) / (4 * PI * MATERIALI.roccia.densita)); out.grano = { massa, raggio }; out.x = ONDE.map((l) => (2 * PI * raggio) / l); }
  else out.fasce.length = 0;
  return out;
}

// ---------- una cometa: chioma e code come batuffoli a campana, nel riferimento che la segue
// Ogni batuffolo: centro (3), asse (3), σ di traverso, σ lungo l'asse, luce (3) e classe (0: brilla di suo, in watt
// uguali in ogni direzione; 1…3: grani della taglia k, e la «luce» è quella INTERCETTATA — poi la funzione di fase).
function cometa(c, stella, t, mancanti) {
  const pos = c.pos, r = lungo(pos), e1 = pos.map((x) => x / r), W = c.orbita.assi[2], e2 = vett(W, e1), nel = (v) => [scal(v, e1), scal(v, e2), scal(v, W)];
  const luce = stella.L / LSOLE / (r / UA) ** 2, vita = SISTEMA.vitaAcqua / luce, Rc = c.chioma.raggio, vGas = Rc / vita, F = stella.L / (4 * PI * r * r), molecole = c.acquaKgS / (18 * K.mp);
  const B = [], metti = (centro, asse, s1, s2, rgb, classe) => { B.push(centro[0], centro[1], centro[2], asse[0], asse[1], asse[2], s1, Math.max(s1, s2), rgb[0], rgb[1], rgb[2], classe); };
  const somme = { Lem: 0, Bem: 0, P: [0, 0, 0], Bp: [0, 0, 0] }, conta = (L, s1, classe) => { if (classe === 0) { somme.Lem += L; somme.Bem += L / (8 * PI * PI * s1 * s1); } else { somme.P[classe - 1] += L; somme.Bp[classe - 1] += L / (8 * PI * PI * s1 * s1); } };
  // LA CHIOMA DI GAS: le molecole escono a vGas e reggono `vita` secondi: n ∝ e^(−ρ/Rc)/ρ² (Haser 1957), cioè la stessa
  // quantità in ogni guscio, che cala come e^(−ρ/Rc). Gusci a raggi in progressione, ognuno una campana (σ = ρ/1,6).
  // Quanto brilla: la riga la danno i dati (C₂, 516 nm, col suo colore), i watt no (W: null)
  const rigaC = c.chioma.righe && c.chioma.righe[0], LC2 = rigaC && rigaC.W > 0 ? rigaC.W : molecole * MANCA.C2suAcqua * SISTEMA.vitaAcqua * MANCA.gC2 * comeIlSole(rigaC ? rigaC.nm : 516.5, stella.T);
  if (!(rigaC && rigaC.W > 0)) mancanti.add('chioma.righe[].W (i watt della riga del C₂): messi Q(H₂O)·C₂/H₂O·vita·g con C₂/H₂O e g di MANCA; per la vita del C₂ quella dell\'acqua (SISTEMA.vitaAcqua)');
  { const col = tinta(c.chioma.colore), q = 1.5, r0 = Math.max(4 * c.raggio, Rc / 3000); let somma = 0; const gusci = [];
    for (let ro = r0; ro < 5 * Rc; ro *= q) { const w = Math.exp(-ro / Rc) * ro; gusci.push([ro, w]); somma += w; }
    for (const [ro, w] of gusci) { const L = (LC2 * w) / somma, s = ro / 1.6; metti([0, 0, 0], [1, 0, 0], s, s, col.map((x) => x * L), 0); conta(L, s, 0); } }
  // LA CODA DI IONI: dritta lungo `codaIoni.direzione` (il vento visto dalla cometa), sfuma con la scala `lunghezza`.
  // Gli ioni nascono dal gas in SISTEMA.vitaIone secondi (alla luce del Sole a 1 UA): la regione dove nascono è larga
  // vGas·vitaIone/luce; da lì il vento li porta via e il fascio si allarga con la velocità del gas. Tre fasci uno
  // dentro l'altro (stretto e fitto al centro, largo e rado fuori), batuffoli allungati a passi in progressione.
  const rigaI = c.codaIoni.righe && c.codaIoni.righe[0], Lioni = rigaI && rigaI.W > 0 ? rigaI.W : molecole * MANCA.COsuAcqua * SISTEMA.vitaAcqua * MANCA.gCOpiu * comeIlSole(rigaI ? rigaI.nm : 426, stella.T);
  if (!(rigaI && rigaI.W > 0)) mancanti.add('codaIoni.righe[].W (i watt della riga del CO⁺): messi Q(H₂O)·CO/H₂O·vita·g con CO/H₂O e g di MANCA (gli ioni contati per il tempo `lunghezza`/vento)');
  { const col = tinta(c.codaIoni.colore), dir = nel(c.codaIoni.direzione), Lt = c.codaIoni.lunghezza, Rion = (Rc * SISTEMA.vitaIone) / SISTEMA.vitaAcqua, q = 1.6, e8 = Math.exp(-1 / 8), e2 = Math.exp(-1 / 2);
    // (quanti ioni nascono entro ρ: 1 − e^(−ρ/Rion); i tre fasci prendono quelli nati entro Rion/8, tra Rion/8 e Rion/2, e oltre)
    for (const [largo, parte] of [[Rion / 1.6, e2], [Rion / 6.4, e8 - e2], [Rion / 25.6, 1 - e8]]) { const passi = []; let somma = 0;
      for (let s = largo; s < 4 * Lt; s *= q) { const w = Math.exp(-s / Lt) * s * (Math.sqrt(q) - 1 / Math.sqrt(q)); passi.push([s, w]); somma += w; }
      const testa = Math.min(largo, Lt); somma += testa; // (il tratto prima del primo passo: un batuffolo tondo sulla testa)
      { const L = (Lioni * parte * testa) / somma; metti([0, 0, 0], dir, largo, largo, col.map((x) => x * L), 0); conta(L, largo, 0); }
      for (const [s, w] of passi) { const L = (Lioni * parte * w) / somma, s1 = largo * (1 + s / Lt); metti(dir.map((x) => x * s), dir, s1, Math.max(s1, 0.36 * s), col.map((x) => x * L), 0); conta(L, s1, 0); } } }
  // LA CODA DI POLVERE: per ogni taglia di grano i dati danno dove stanno oggi i grani lasciati 3, 10 e 30 giorni fa
  // (la luce toglie loro la parte β della gravità: restano indietro e in fuori). Tra quei punti: una curva
  // c(τ) = Aτ² + Bτ³ + Cτ⁴ che ci passa (per τ piccolo la spinta è costante: τ²). I grani escono a tutte le età con lo
  // stesso ritmo e si sparpagliano alla velocità con cui lasciano la chioma: a ogni età un batuffolo largo v·τ.
  // QUANTA polvere: i dati non lo dicono (MANCA.polvereSuGas); come si divide tra le taglie: massa ∝ a^(4−p) con la
  // pendenza della cascata di vuoto_sistema.js (esponenteCascata(0) = 3,5: Dohnanyi)
  mancanti.add('codaPolvere: manca quanta polvere esce (kg/s) e come si divide tra le taglie: messa polvere = MANCA.polvereSuGas × acquaKgS, divisa ∝ a^(4−3,5); manca la velocità d\'uscita dei grani (MANCA.uscitaGrani)');
  { const linee = c.codaPolvere.linee.filter((l) => l.punti.length >= 4), p = esponenteCascata(0), pesi = linee.map((l) => Math.pow(l.raggioGrano, 4 - p)), tot = pesi.reduce((s, x) => s + x, 0) || 1, GIORNO = 86400, eta = [3, 10, 30].map((g) => g * GIORNO), q = 1.35;
    linee.slice(0, 3).forEach((l, k) => { const a = l.raggioGrano, massa = (4 * PI / 3) * MATERIALI.roccia.densita * a ** 3, numero = (MANCA.polvereSuGas * c.acquaKgS * pesi[k]) / tot / massa, vEsce = vGas * Math.min(1, Math.sqrt(MANCA.uscitaGrani / a));
      // la curva per i tre punti (rispetto al nucleo, nel riferimento della cometa): un sistema 3×3 per componente
      const pt = l.punti.slice(1, 4).map((x) => nel([x[0] - pos[0], x[1] - pos[1], x[2] - pos[2]])), u = eta.map((x) => x / eta[2]), M = u.map((x) => [x * x, x ** 3, x ** 4]);
      const det3 = (m) => m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) - m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) + m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0]), D = det3(M);
      const coef = [0, 1, 2].map((d) => [0, 1, 2].map((j) => det3(M.map((riga, i) => riga.map((x, jj) => (jj === j ? pt[i][d] : x)))) / D)), curva = (tau) => { const x = tau / eta[2]; return [0, 1, 2].map((d) => coef[d][0] * x * x + coef[d][1] * x ** 3 + coef[d][2] * x ** 4); };
      for (let tau = eta[2] / 3000; tau <= eta[2] * 1.001; tau *= q) { const dt = tau * (Math.sqrt(q) - 1 / Math.sqrt(q)), centro = curva(tau), prima = curva(tau / Math.sqrt(q)), dopo = curva(Math.min(eta[2], tau * Math.sqrt(q))), seg = [dopo[0] - prima[0], dopo[1] - prima[1], dopo[2] - prima[2]], ls = lungo(seg) || 1;
        const rq = Math.hypot(r + centro[0], centro[1], centro[2]), P = numero * dt * PI * a * a * F * (r / rq) ** 2, s1 = Math.max(4 * c.raggio, (vEsce * tau) / 1.6); // la luce che quei grani intercettano, dove sono
        metti(centro, seg.map((x) => x / ls), s1, Math.hypot(s1, 0.6 * ls), [P, P, P], k + 1); conta(P, s1, k + 1); }
    });
  }
  const taglie = c.codaPolvere.linee.filter((l) => l.punti.length >= 4).slice(0, 3).map((l) => ONDE.map((o) => (2 * PI * l.raggioGrano) / o)), tintaPolvere = c.codaPolvere.colore ? tinta(c.codaPolvere.colore) : [1, 1, 1];
  const el = new Float64Array(EL), alb = SISTEMA.cometa.albedo; elementi(c.orbita, pos, t, el, 0, c.raggio, [alb, alb, alb]);
  // (fin dove arriva — per sapere se è nel campo — e da che distanza si comincia a essere dentro qualche batuffolo)
  const blob = Float32Array.from(B); let fuori = 0, vicino = 0; for (let i = 0; i < blob.length; i += NB) { const dc = Math.hypot(blob[i], blob[i + 1], blob[i + 2]); fuori = Math.max(fuori, dc + 3 * blob[i + 7]); vicino = Math.max(vicino, dc + 8 * blob[i + 7]); }
  return { id: c.id, el, raggio: c.raggio, blob, nb: blob.length / NB, chioma: Rc, coda: c.codaIoni.lunghezza, fuori, vicino, r, acquaKgS: c.acquaKgS, x: taglie, tintaPolvere, ...somme };
}

self.onmessage = (e) => {
  const d = e.data, t0 = performance.now();
  try {
    const sc = scenaSistema(d.via.cosmo, d.via.galassia, d.via.stella, d.t), v = sc.vuoto(), st = sc.corpi[0], stella = { L: d.stella?.L ?? st.luminosita, R: d.stella?.R ?? st.raggio, T: d.stella?.T ?? 0 }, mancanti = new Set();
    const out = { n: d.n, t: d.t, stella, polvere: polvere(v, stella), corpi: null, comete: [], nube: v.nube, accensione: v.accensione };
    if (out.polvere.fasce.length) { mancanti.add('polvere: `polvere.in(r)` dipende solo da r: il profilo in latitudine è ricostruito (campana con la colonna dello strato dei dati, larga come le inclinazioni dei corpi della fascia); non c\'è un bordo interno (dove i grani evaporano): ρ ∝ 1/r fino alla stella');
      mancanti.add('polvere: né albedo né funzione di fase dei grani: derivate dall\'ottica di una sfera grande con l\'indice di vuoto_mezzo.js MEZZO.grano (diffrazione + riflessione di Fresnel)'); }
    if (out.polvere.fasce.some((f) => f.senzaFascia)) mancanti.add('polvere: uno scalino di densità non corrisponde a nessuna fascia di `fasce`: gli si è dato lo spessore 0,1 rad');
    if (d.corpi) { const n = v.corpi.length, el = new Float64Array(n * EL), alb = LEGGI_ANELLI.albedo;
      v.corpi.forEach((c, k) => { const roccia = c.cosa === 'asteroide', col = (c.colore || [170, 170, 165]).map(lin), m = (col[0] + col[1] + col[2]) / 3 || 1, A = roccia ? alb.roccia : alb.ghiaccio; elementi(c.orbita, c.pos, d.t, el, k, c.raggio, col.map((x) => (A * x) / m)); });
      out.corpi = { n, el, fascia: v.corpi.map((c) => c.fascia), cosa: v.corpi.map((c) => c.cosa) };
      if (n) mancanti.add('corpi[].albedo e la legge di fase: scenaVuoto dà solo `colore`; l\'albedo è letto da anelli.js LEGGI_ANELLI.albedo (la stessa tabella del colore: ghiaccio 0,6, roccia 0,1), la fase è quella di una sfera di Lambert'); }
    for (const c of v.comete) if (c.attiva && c.chioma && c.codaIoni && c.codaPolvere) out.comete.push(cometa(c, stella, d.t, mancanti));
    if (out.comete.length) mancanti.add('comete[]: il nucleo non ha colore (grigio, con l\'albedo di SISTEMA.cometa: 0,04); gli elementi dell\'orbita non hanno l\'anomalia all\'epoca (ricavata da `pos`)');
    out.mancanti = [...mancanti]; out.ms = performance.now() - t0;
    self.postMessage(out, [out.polvere.R.buffer, ...(out.corpi ? [out.corpi.el.buffer] : []), ...out.comete.flatMap((c) => [c.blob.buffer, c.el.buffer])]);
  } catch (err) { self.postMessage({ n: d.n, t: d.t, errore: String((err && err.stack) || err) }); }
};
