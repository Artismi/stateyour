// minori.worker.js — I CORPI MINORI di un sistema preparati per la vista 3D (minori.js), fuori dal filo dell'interfaccia.
//
// I dati sono quelli di spazio3d.js `scenaSistema(n, gid, sid, t).vuoto()` (vuoto.js `scenaVuoto`, vuoto_sistema.js
// `corpiMinori`: lì sono scritte le leggi e le fonti). Qui non si aggiunge niente al mondo: lo si mette nella forma che
// serve a chi disegna. { n, via: { cosmo, galassia, stella }, t, corpi (true: manda anche le orbite dei corpi) } →
//   polvere  la luce zodiacale e la polvere fine delle fasce sono un campo solo, `polvere.sezione(r, lat)` (m² di grani
//            per m³): per ogni fascia τ_f(r)·campana(lat; σ_f)/r, con τ la profondità ottica attraverso lo strato. Qui:
//            τ(r) in tabella (NT punti a passo costante nel logaritmo di r, dal bordo dove i grani evaporano all'ultima
//            fascia), una colonna per ogni larghezza σ diversa (al più quattro); albedo e funzione di fase dei grani
//            (tre Henyey–Greenstein: `polvere.fase`) come le dà il mondo. `scarto`: di quanto la somma delle colonne
//            differisce da `polvere.sezione` in punti di prova (deve essere ~0).
//   corpi    le orbite dei corpi delle fasce (Float64Array, EL numeri l'uno): a, e, M0, moto medio, gli assi, il raggio,
//            l'albedo geometrico per colore, la legge di fase (H–G col suo G)
//   comete   per ogni cometa dell'elenco: l'orbita, il nucleo (albedo, colore, fase lineare), e chioma e code come
//            BATUFFOLI a campana (centro, asse, larghezze, luce), nel riferimento che segue la cometa (x: via dalla
//            stella; z: la normale all'orbita). La luce: le righe in watt (`chioma.righe`, `codaIoni.righe`), portate a
//            «watt di luce della stella che l'occhio vede uguali» (lumen della riga / lumen per watt della stella: il
//            motore conta la luce in watt di luce stellare); la polvere dalle sindine (`codaPolvere.sindine`: per taglia
//            dove stanno i grani di ogni età, quanti ne uscivano allora, quanto si sono sparpagliati).
//   mancanti ciò che i dati non danno e che qui è una scelta di forma (elenco in parole, per chi guarda)
import { scenaSistema } from '../camera/spazio3d.js';
import { SISTEMA, efficaciaLuminosa } from '../camera/vuoto_sistema.js';
import { coloreVero, occhio } from '../camera/vuoto_mezzo.js';
import { DISCO } from '../camera/disco.js';
import { UA } from '../camera/leggi.js';

const PI = Math.PI, EL = 18, NB = 12, NT = 512, Y = [0.2126, 0.7152, 0.0722];
const lin = (c) => Math.pow(c / 255, 2.2), scal = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], lungo = (a) => Math.hypot(a[0], a[1], a[2]);
const vett = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
// un colore dei dati (0…255) come tinta lineare: col massimo a 1 (la luce diffusa: come la luce della stella nel motore),
// o con la luminanza a 1 (le righe: poi le si pesa in lumen)
const tinta = (rgb) => { const v = rgb.map(lin), m = Math.max(...v, 1e-9); return v.map((x) => x / m); };
const tintaY = (rgb) => { const v = rgb.map(lin), m = Math.max(scal(v, Y), 1e-9); return v.map((x) => x / m); };

// gli elementi per chi propaga l'orbita (minori.js `stato`): l'anomalia media a t è M0 + motoMedio·t (epoca: oggi)
function elementi(o, raggio, rifl, fase, out, k) {
  const [P, Q, W] = o.assi, n = o.motoMedio ?? (2 * PI) / o.periodo, tipo = fase && fase.legge === 'HG' ? 1 : fase && fase.legge === 'lineare' ? 2 : 0, par = tipo === 1 ? fase.G : tipo === 2 ? fase.magPerGrado : 0;
  out.set([o.a, o.e, o.M0 - n * (o.epoca || 0), n, P[0], P[1], P[2], Q[0], Q[1], Q[2], raggio, rifl[0], rifl[1], rifl[2], Math.sqrt(Math.max(0, 1 - W[2] * W[2])), o.periodo, tipo, par], k * EL);
}
// l'albedo geometrico per colore: il livello dall'albedo, la tinta dal colore (lineare, media 1)
const riflettanza = (albedo, colore) => { const c = (colore || [128, 128, 128]).map(lin), m = (c[0] + c[1] + c[2]) / 3 || 1; return c.map((x) => (albedo * x) / m); };

// ---------- la polvere: τ(r) in tabella, una colonna per larghezza
function polvere(v) {
  const P = v.polvere, fasce = (P.fasce || []).filter((f) => typeof f.profilo === 'function' && f.sigma > 0), out = { n: 0, rIn: 0, rOut: 0, rFasce: 0, sigma: [], tab: new Float32Array(4 * NT), albedo: P.albedo ?? 0, g: P.fase ? Array.from(P.fase.g) : [0], pesi: P.fase ? Array.from(P.fase.pesi) : [1], tinta: P.colore ? tinta(P.colore) : [1, 1, 1], scarto: 0, fasce: [] };
  if (!fasce.length || !(P.bordoInterno > 0)) return out;
  const gruppi = []; for (const f of fasce) { let g = gruppi.find((x) => Math.abs(x.sigma - f.sigma) < 0.01 * x.sigma); if (!g) { if (gruppi.length === 4) g = gruppi[3]; else gruppi.push((g = { sigma: f.sigma, fasce: [] })); } g.fasce.push(f); }
  // (dentro il bordo del ghiaccio i grani delle fasce di ghiaccio hanno perso il ghiaccio: la sezione cala di (1 − ghiaccio)^⅔, come in corpiMinori)
  const residuo = (f, r) => (f.materiale === 'ghiaccio' && r < P.bordoGhiaccio ? Math.pow(1 - DISCO.ghiaccio, 2 / 3) : 1), tauDi = (g, r) => { let s = 0; for (const f of g.fasce) if (r <= f.esterno) s += f.profilo(r).tau * residuo(f, r); return s; };
  out.n = gruppi.length; out.sigma = gruppi.map((g) => g.sigma); out.rIn = P.bordoInterno; out.rOut = Math.max(...fasce.map((f) => f.esterno)); out.rFasce = Math.min(...fasce.map((f) => f.interno));
  for (let i = 0; i < NT; i++) { const r = out.rIn * Math.pow(out.rOut / out.rIn, i / (NT - 1)); gruppi.forEach((g, q) => { out.tab[4 * i + q] = i === 0 ? 0 : tauDi(g, Math.min(r, out.rOut * (1 - 1e-9))); }); }
  // riscontro: la somma delle colonne ridà `polvere.sezione` (dove non la ridà lo si dice)
  for (const r of [0.05, 0.3, 1, 3, 10].map((x) => x * UA).concat(fasce.map((f) => 0.5 * (f.interno + f.esterno)))) for (const lat of [0, 0.1]) { if (r <= out.rIn || r >= out.rOut) continue; const vera = P.sezione(r, lat); let mia = 0; gruppi.forEach((g) => { mia += (tauDi(g, r) * Math.exp((-lat * lat) / (2 * g.sigma * g.sigma))) / (g.sigma * Math.sqrt(2 * PI) * r); }); if (vera > 0) out.scarto = Math.max(out.scarto, Math.abs(mia / vera - 1)); }
  out.fasce = fasce.map((f) => ({ nome: f.nome, interno: f.interno, esterno: f.esterno, sigma: f.sigma, tau: f.tau }));
  return out;
}

// ---------- una cometa: chioma e code come batuffoli a campana, nel riferimento che la segue
// Ogni batuffolo: centro (3), asse (3), σ di traverso, σ lungo l'asse, luce (3) e classe (0: brilla di suo, watt uguali in
// ogni direzione; 1: grani, e la «luce» è quella che rimandano in tutto — sezione × luce della stella × albedo —, da
// moltiplicare per la funzione di fase all'angolo da cui li si guarda).
function cometa(c, stella, mancanti) {
  const pos = c.pos, r = lungo(pos), e1 = pos.map((x) => x / r), W = c.orbita.assi[2], e2 = vett(W, e1), nel = (v) => [scal(v, e1), scal(v, e2), scal(v, W)];
  const vGas = c.velocitaGas, uv = SISTEMA.vitaAcqua / c.vitaAcqua /* quanto l'ultravioletto che spezza le molecole è più forte, lì, che a 1 UA dal Sole */, F = stella.L / (4 * PI * r * r), Rn = c.raggio;
  const lmW = efficaciaLuminosa(stella.T > 0 ? stella.T : SISTEMA.Tsole), bianco = scal(tinta(c.codaPolvere.colore || [255, 255, 255]), Y), comeStella = (riga) => (riga.W * 683 * occhio(riga.nm)[1]) / lmW; // watt di luce della stella che fanno gli stessi lumen
  const B = [], metti = (centro, asse, s1, s2, rgb, classe) => { B.push(centro[0], centro[1], centro[2], asse[0], asse[1], asse[2], s1, Math.max(s1, s2), rgb[0], rgb[1], rgb[2], classe); };
  const somme = { Lem: 0, Bem: 0, P: 0, Bp: 0 }, conta = (L, s1, classe) => { if (classe === 0) { somme.Lem += L; somme.Bem += L / (8 * PI * PI * s1 * s1); } else { somme.P += L; somme.Bp += L / (8 * PI * PI * s1 * s1); } };
  // LA CHIOMA DI GAS: ogni molecola figlia (C₂, CN, C₃) brilla nella sua riga coi watt dei dati. Dove: le figlie nascono dal gas
  // che esce a `velocitaGas` e reggono la loro vita (SISTEMA.figlie, accorciata dall'ultravioletto di lì): n ∝ e^(−ρ/ℓ)/ρ²
  // (Haser 1957), cioè la stessa quantità in ogni guscio fino a ℓ = v·vita. Gusci a raggi in progressione, ognuno una campana
  // (σ = ρ/1,6). Le righe che l'occhio quasi non vede (il CN a 388 nm) restano fuori se fanno meno dell'1% dei lumen.
  { const righe = (c.chioma.righe || []).filter((x) => x.W > 0).map((x) => ({ ...x, eq: comeStella(x) })), tot = righe.reduce((s, x) => s + x.eq, 0), q = 1.5;
    for (const x of righe) { if (!(x.eq > 0.01 * tot)) continue; const f = SISTEMA.figlie.find((m) => m.nome === x.nome), scala = f ? (vGas * f.vita) / uv : c.chioma.raggio, col = tintaY(coloreVero([{ nm: x.nm, W: 1 }]).rgb).map((u) => u * bianco), gusci = []; let somma = 0;
      for (let ro = Math.max(4 * Rn, scala / 3000); ro < 5 * scala; ro *= q) { const w = Math.exp(-ro / scala) * ro; gusci.push([ro, w]); somma += w; }
      for (const [ro, w] of gusci) { const L = (x.eq * w) / somma, s = ro / 1.6; metti([0, 0, 0], [1, 0, 0], s, s, col.map((u) => u * L), 0); conta(L, s, 0); } } }
  // LA CODA DI IONI: dritta lungo `codaIoni.direzione` (il vento visto dalla cometa), i watt della riga del CO⁺ dai dati,
  // sfumata con la scala `lunghezza`. La LARGHEZZA non è nei dati: gli ioni nascono dove il CO si ionizza, entro
  // v_gas/(ionizza + spezza) dal nucleo (SISTEMA.CO), e il fascio si allarga con la velocità del gas mentre il vento lo porta:
  // tre fasci uno dentro l'altro (quanti ioni nascono entro ρ: 1 − e^(−ρ/R)), batuffoli allungati a passi in progressione.
  { const riga = (c.codaIoni.righe || []).find((x) => x.W > 0), Lioni = riga ? comeStella(riga) : 0;
    if (Lioni > 0) { mancanti.add('codaIoni: la larghezza del fascio non è nei dati (c\'è direzione, lunghezza, watt): presa dalla regione dove il CO si ionizza, v_gas/(ionizza + spezza) di SISTEMA.CO');
      const col = tintaY(coloreVero([{ nm: riga.nm, W: 1 }]).rgb).map((u) => u * bianco), dir = nel(c.codaIoni.direzione), Lt = c.codaIoni.lunghezza, Rion = vGas / ((SISTEMA.CO.ionizza + SISTEMA.CO.spezza) * uv), q = 1.6, e8 = Math.exp(-1 / 8), e2 = Math.exp(-1 / 2), allarga = vGas / (c.codaIoni.velocita || 4e5);
      for (const [largo, parte] of [[Rion / 1.6, e2], [Rion / 6.4, e8 - e2], [Rion / 25.6, 1 - e8]]) { const passi = []; let somma = 0;
        for (let s = largo; s < 4 * Lt; s *= q) { const w = Math.exp(-s / Lt) * s * (Math.sqrt(q) - 1 / Math.sqrt(q)); passi.push([s, w]); somma += w; }
        const testa = Math.min(largo, Lt); somma += testa; // (il tratto prima del primo passo: un batuffolo tondo sulla testa)
        { const L = (Lioni * parte * testa) / somma; metti([0, 0, 0], dir, largo, largo, col.map((u) => u * L), 0); conta(L, largo, 0); }
        for (const [s, w] of passi) { const L = (Lioni * parte * w) / somma, s1 = largo + (allarga * s) / 1.6; metti(dir.map((u) => u * s), dir, s1, Math.max(s1, 0.36 * s), col.map((u) => u * L), 0); conta(L, s1, 0); } } } }
  // LA POLVERE (chioma e coda sono gli stessi grani: i più giovani stanno attorno al nucleo). Per ogni taglia i dati danno dove
  // sta oggi un grano di ogni età (`punti`: una sindine), quanti ne uscivano allora rispetto a oggi (`attivita`), e quanto si
  // sono sparpagliati (`larghezza` = velocità d'uscita × età). I grani escono a tutte le età: batuffoli a età in progressione,
  // tra i punti dati lo scostamento dal nucleo diviso per l'età al quadrato (per poco tempo la spinta della luce è costante)
  // e l'attività, interpolati nel logaritmo dell'età; prima del primo punto restano quelli del primo.
  // Ogni batuffolo rimanda sezione × luce della stella (dove sta) × albedo; poi la funzione di fase dei grani (minori.js).
  { const D = c.codaPolvere, alb = D.albedo ?? 0, q = 1.45, tutte = (D.sindine || []).filter((s) => s.punti.length >= 2 && s.perSecondo > 0), sezioni = tutte.map((s) => s.perSecondo * PI * s.raggioGrano ** 2 * s.punti[s.punti.length - 1].eta), sezTot = sezioni.reduce((x, y) => x + y, 0);
    tutte.forEach((s, k) => { if (!(sezioni[k] > 0.003 * sezTot)) return; const a = s.raggioGrano, pt = s.punti, eta = pt.map((p) => p.eta), u = pt.map((p) => nel([p.pos[0] - pos[0], p.pos[1] - pos[1], p.pos[2] - pos[2]]).map((x) => x / (p.eta * p.eta)));
      const aEta = (tau) => { if (tau <= eta[0]) return [u[0], pt[0].attivita]; let j = 0; while (j < eta.length - 2 && eta[j + 1] < tau) j++; const f = Math.min(1, Math.log(tau / eta[j]) / Math.log(eta[j + 1] / eta[j])); return [[0, 1, 2].map((d) => u[j][d] + (u[j + 1][d] - u[j][d]) * f), pt[j].attivita + (pt[j + 1].attivita - pt[j].attivita) * f]; };
      const curva = (tau) => { const [uu] = aEta(tau); return uu.map((x) => x * tau * tau); }, ultima = eta[eta.length - 1];
      for (let tau = ultima / 20000; tau <= ultima * 1.001; tau *= q) { const dt = tau * (Math.sqrt(q) - 1 / Math.sqrt(q)), [, att] = aEta(tau), centro = curva(tau), prima = curva(tau / Math.sqrt(q)), dopo = curva(Math.min(ultima, tau * Math.sqrt(q))), seg = [dopo[0] - prima[0], dopo[1] - prima[1], dopo[2] - prima[2]], ls = lungo(seg) || 1;
        const rq = Math.hypot(r + centro[0], centro[1], centro[2]), Pd = s.perSecondo * att * dt * PI * a * a * F * (r / rq) ** 2 * alb, s1 = Math.max(4 * Rn, (s.uscita * tau) / 1.6); if (!(Pd > 0)) continue;
        metti(centro, seg.map((x) => x / ls), s1, Math.hypot(s1, 0.6 * ls), [Pd, Pd, Pd], 1); conta(Pd, s1, 1); } });
    if ((D.sindine || []).length && c.chioma.polvere) mancanti.add('chioma.polvere (sezione e watt dei grani dentro la chioma) non è disegnata a parte: sono gli stessi grani di `sindine` nelle età più giovani'); }
  const el = new Float64Array(EL), nu = c.nucleo || { albedo: c.albedo, colore: c.colore, fase: c.fase }; elementi(c.orbita, Rn, riflettanza(nu.albedo ?? 0, nu.colore), nu.fase, el, 0);
  // (fin dove arriva — per sapere se è nel campo — e da che distanza si comincia a essere dentro qualche batuffolo)
  const blob = Float32Array.from(B); let fuori = 0, vicino = 0; for (let i = 0; i < blob.length; i += NB) { const dc = Math.hypot(blob[i], blob[i + 1], blob[i + 2]); fuori = Math.max(fuori, dc + 3 * blob[i + 7]); vicino = Math.max(vicino, dc + 8 * blob[i + 7]); }
  const D = c.codaPolvere;
  return { id: c.id, el, raggio: Rn, blob, nb: blob.length / NB, chioma: c.chioma.raggio, coda: c.codaIoni.lunghezza, fuori, vicino, r, attivita: c.attivita, acquaKgS: c.acquaKgS, magnitudineA1UA: c.magnitudineA1UA, lumen: c.lumen,
    g: D.fase ? Array.from(D.fase.g) : [0], pesi: D.fase ? Array.from(D.fase.pesi) : [1], tintaPolvere: D.colore ? tinta(D.colore) : [1, 1, 1], ...somme };
}

self.onmessage = (e) => {
  const d = e.data, t0 = performance.now();
  try {
    const sc = scenaSistema(d.via.cosmo, d.via.galassia, d.via.stella, d.t), v = sc.vuoto(), st = sc.corpi[0], stella = { L: d.stella?.L ?? st.luminosita, R: d.stella?.R ?? st.raggio, T: d.stella?.T ?? 0 }, mancanti = new Set();
    const out = { n: d.n, t: d.t, stella, polvere: polvere(v), corpi: null, comete: [], accensione: v.accensione, elenco: v.elenco };
    if (out.polvere.scarto > 0.02) mancanti.add(`polvere: la somma per fasce (profilo(r).tau × campana) non ridà polvere.sezione: scarto ${(100 * out.polvere.scarto).toFixed(0)}%`);
    if ((v.polvere.fasce || []).length > 4 && new Set(v.polvere.fasce.map((f) => f.sigma.toPrecision(2))).size > 4) mancanti.add('polvere: più di quattro larghezze diverse in latitudine: le ultime sono disegnate con la quarta');
    if (d.corpi) { const n = v.corpi.length, el = new Float64Array(n * EL); let senza = 0;
      v.corpi.forEach((c, k) => { if (c.albedo == null || !c.fase) senza++; elementi(c.orbita, c.raggio, riflettanza(c.albedo ?? 0, c.colore), c.fase, el, k); });
      out.corpi = { n, el, fascia: v.corpi.map((c) => c.fascia), cosa: v.corpi.map((c) => c.cosa) }; if (senza) mancanti.add(`corpi[]: ${senza} senza albedo o legge di fase (non riflettono)`); }
    for (const c of v.comete) if (c.chioma && c.codaIoni && c.codaPolvere && c.velocitaGas > 0 && c.vitaAcqua > 0) out.comete.push(cometa(c, stella, mancanti));
    out.mancanti = [...mancanti]; out.ms = performance.now() - t0;
    self.postMessage(out, [out.polvere.tab.buffer, ...(out.corpi ? [out.corpi.el.buffer] : []), ...out.comete.flatMap((c) => [c.blob.buffer, c.el.buffer])]);
  } catch (err) { self.postMessage({ n: d.n, t: d.t, errore: String((err && err.stack) || err) }); }
};
