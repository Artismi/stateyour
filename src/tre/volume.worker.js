// volume.worker.js — i VOLUMI che lo sguardo attraversa, calcolati fuori dal filo dell'interfaccia.
//
// { tipo: 'galassia', n, cosmo, galassia, t, nf, nr, nz } → la galassia come campo in coordinate cilindriche:
//   una griglia (angolo φ × raggio R × quota z) con, in ogni cella, quanta luce nasce lì (rosso, verde, blu) e quanta
//   polvere c'è (estinzione per unità di lunghezza). Tutto da galassie.js `densitaGalassia(forma).in3d` (disco
//   esponenziale ad anelli, bracci con la loro fase, sferoide di Hernquist, gas e polvere = gas × metalli) e da vuoto.js:
//   · la LUCE va con la massa delle stelle; il colore con la popolazione: lo sferoide e il disco tra i bracci sono stelle
//     vecchie (un corpo nero a 4300 K), dove il braccio addensa le stelle ne nascono di nuove (9500 K) — la parte
//     giovane è l'eccesso sulla media dell'anello, e vale in luce `GIOVANI` volte la sua massa (LIBERO: 3; le stelle
//     giovani rendono più luce per chilo). La somma su tutto il volume è la luminosità della galassia;
//   · la POLVERE: A_V per metro = κ × densità di polvere, con κ letto da vuoto.js (`polvere.in`, una volta). Quella dello
//     STRATO del disco non sta nella griglia: sta in una tabella a parte (angolo × raggio: la colonna A_V e la mezza
//     altezza h dello strato sech²), perché chi guarda la integri esatta lungo il raggio (volumi.js);
//   · le NEBULOSE e le NUBI di vuoto.js (`scenaGalassia().vuoto`) depositate nella cella dove stanno: la loro luce
//     visibile col colore delle loro righe, la loro estinzione come colonna media della cella (secondo messaggio).
//   Unità (perché stiano in 16 bit): lunghezze in raggi della galassia Rg; la luce di una cella è j·Rg³/L (L la luminosità
//   di tutta la galassia: l'integrale sul volume, in Rg³, fa 1); la polvere è A_V per Rg.
//   z non è uniforme: z = zmax·s·|s| con s da −1 a 1 (fitto vicino al piano, dove stanno disco e polvere).
// { tipo: 'ragnatela', … } → vedi sotto.
// { tipo: 'aria', aria, R, albedo } → le tabelle fini della luce diffusa più volte di un pianeta (pianeta.js `tabelleAria`:
//   un secondo e mezzo; il pianeta intanto usa quelle grezze).
// { tipo: 'pozza', c, seme } → le celle di convezione della pozza del pannello (fluidi.js `celle`: quasi due secondi).
import { scenaGalassia } from '../camera/spazio3d.js';
import { densitaGalassia, cinematica, LEGGI as LEGGI_GALASSIE } from '../camera/galassie.js';
import { galassia } from '../camera/cosmo.js';
import { coloreCorpoNero } from './nucleo.js';
import { classiSuGriglia, campoDi, raffina, ondeDi, aloniAttesi } from '../camera/ragnatela.js';
import { galassiaAlTempo } from '../camera/galassie.js';
import { cosmo as cosmoDi } from '../camera/cosmo.js';
import { ANNI_OGGI } from '../camera/spazio3d.js';
import { tabelleAria } from './pianeta.js';
import { celle } from '../camera/fluidi.js';

const KPC = 3.0857e19, MSOLE = 1.989e30, GIOVANI = 3, lin = (c) => (c / 255) ** 2.2;

function volumeGalassia(d, manda) {
  const sg = scenaGalassia(d.cosmo, d.galassia, d.t), F = galassia(d.cosmo, d.galassia).forma, D = densitaGalassia(F), Rg = sg.riferimento.raggio, Rk = Rg / KPC, tG = d.t / (1e9 * 3.15576e7);
  const { nf, nr, nz } = d, Rmax = 1.15, zmax = 0.8, dati = new Float32Array(4 * nf * nr * nz), vecchio = coloreCorpoNero(4300), giovane = coloreCorpoNero(9500);
  const sf = D.sferoide, sferoide = (R, z) => { const r3 = Math.hypot(R, z) || 1e-6; return sf.massa > 0 ? (sf.massa * sf.scala) / (2 * Math.PI * (sf.schiacciata || 1) * r3 * (r3 + sf.scala) ** 3) : 0; };
  // κ: A_V per metro per kg/m³ di polvere, da vuoto.js (in un punto del piano dove c'è polvere)
  // (κ non dipende dal posto — polvere/gas va coi metalli come in galassie.js —: lo si legge nel primo anello del modello
  // che ha gas; prima si provavano quattro raggi fissi e in una galassia col gas solo al centro κ restava zero: niente polvere)
  let kappa = 0; try { const pv = sg.vuoto({ centro: [0, 0, 0], raggio: 0.2 }).polvere; for (const r of D.colonne.r) { const q = pv.in(r * KPC, 0, 0); if (q.densita > 0) { kappa = q.AVperMetro / q.densita; break; } } } catch { kappa = 0; }
  // LO STRATO DELLA POLVERE. galassie.js dà al gas una mezza altezza fissa (LEGGI.spessoreGas, 0,1 kpc: quella del gas
  // vicino al Sole); le stelle invece hanno quella dell'equilibrio, z₀ = σ_z²/(πGΣ). Il gas, freddo (σ_g, LEGGI.sigmaGas) e
  // leggero, sta nella buca del disco delle stelle: vicino al piano la loro gravità cresce con la quota, g_z = 4πGρ₀·z con
  // ρ₀ = Σ/(2z₀), e lo strato di prova ha la larghezza σ_g/√(4πGρ₀); come sech²(z/h_g) vale h_g = z₀·σ_g/σ_z [D: Ostriker,
  // McKee & Leroy 2010, lo strato del gas nel potenziale delle stelle] — lineare in σ_g/σ_z. (Prima qui c'era h_g = z₀·(σ_g/σ_z)²,
  // lo strato che si regge da solo: con σ_z = 120 km/s, al centro di un'ellittica, dieci volte troppo sottile.) Al più
  // quella del modello (dove il disco è rado resta 0,1 kpc). La colonna resta quella del modello (la densità sul piano per
  // 2·0,1 kpc), distribuita come sech²(z/h_g).
  // Lo strato è spesso da una frazione di parsec a cento parsec, le celle in quota vicino al piano 12 pc e poi di più: nella
  // griglia diventava uno strato spesso quanto la cella (di taglio una barra nera larga decine di parsec, che non c'è), e
  // campionato a punti lungo il raggio una grana di righe. Perciò lo strato va a parte (`strato`: per angolo e raggio la
  // colonna A_V e h in millesimi di Rg) e volumi.js lo integra esatto: lungo un tratto da z_a a z_b la sua A_V è
  // colonna/2·|tanh(z_b/h) − tanh(z_a/h)|·(lunghezza del tratto/|z_b − z_a|).
  const Cm = cinematica(F), hM = LEGGI_GALASSIE.spessoreGas, bordi = D.colonne.bordo, NA = D.colonne.r.length, hStrato = new Float64Array(nr), colonna = new Float64Array(nr * nf);
  for (let jr = 0; jr < nr; jr++) { const R = Math.max(1e-3, ((jr + 0.5) / nr) * Rmax * Rk); let k = 0; while (k < NA - 1 && bordi[k + 1] < R) k++; hStrato[jr] = Math.min(hM, (Cm.z0[k] * LEGGI_GALASSIE.sigmaGas) / Cm.sigZ[k]) || hM;
    for (let jf = 0; jf < nf; jf++) colonna[jr * nf + jf] = D.in3d(R, 0, ((jf + 0.5) / nf) * 2 * Math.PI, tG).polvere * 2 * hM; }
  // (la tabella dello strato: per anello e angolo la colonna A_V — κ·Σ_polvere — e h_g in millesimi di Rg; a chi la manda si dà
  // colonna e colonna·h, perché tra due celle si interpoli h pesata con la polvere: tra un anello con lo strato sottile e uno
  // senza polvere, dove h vale 0,1 kpc per niente, la polvere non deve prendere lo spessore di quello vuoto)
  const tabStrato = new Float32Array(2 * nr * nf); for (let jr = 0; jr < nr; jr++) for (let jf = 0; jf < nf; jf++) { tabStrato[2 * (jr * nf + jf)] = kappa * colonna[jr * nf + jf] * (MSOLE / KPC ** 2); tabStrato[2 * (jr * nf + jf) + 1] = (1e3 * hStrato[jr]) / Rk; }
  const u = MSOLE / KPC ** 3, riga = new Float64Array(nf), volCella = (jr, jz) => { const r0 = (jr / nr) * Rmax, r1 = ((jr + 1) / nr) * Rmax, s0 = (jz / nz) * 2 - 1, s1 = ((jz + 1) / nz) * 2 - 1; return (Math.PI * (r1 * r1 - r0 * r0) / nf) * Math.abs(zmax * (s1 * Math.abs(s1) - s0 * Math.abs(s0))); };
  let somma = 0;
  for (let jz = 0; jz < nz; jz++) { const s = ((jz + 0.5) / nz) * 2 - 1, z = zmax * s * Math.abs(s) * Rk;
    for (let jr = 0; jr < nr; jr++) { const R = Math.max(1e-3, ((jr + 0.5) / nr) * Rmax * Rk), sfe = sferoide(R, z); let media = 0;
      for (let jf = 0; jf < nf; jf++) { const q = D.in3d(R, z, ((jf + 0.5) / nf) * 2 * Math.PI, tG); riga[jf] = q.stelle - sfe; media += riga[jf]; }
      media /= nf; const v = volCella(jr, jz);
      for (let jf = 0; jf < nf; jf++) { const disco = Math.max(0, riga[jf]), nuove = Math.max(0, disco - media), o = 4 * ((jz * nr + jr) * nf + jf), a = sfe + disco - nuove, b = GIOVANI * nuove;
        for (let c = 0; c < 3; c++) dati[o + c] = a * vecchio[c] + b * giovane[c]; somma += (a + b) * v; } } }
  // (galassie.js dà il disco ad anelli: la densità cambia a scalini da un anello all'altro, e di faccia si vedrebbero
  // cerchi che non ci sono: lungo il raggio si passa due volte una media 1-2-1, larga quanto un anello non è)
  for (let giro = 0; giro < 3; giro++) { const prima = dati.slice(); for (let jz = 0; jz < nz; jz++) for (let jr = 1; jr < nr - 1; jr++) for (let jf = 0; jf < nf; jf++) { const o = 4 * ((jz * nr + jr) * nf + jf), m = 4 * nf; for (let c = 0; c < 4; c++) dati[o + c] = 0.25 * prima[o - m + c] + 0.5 * prima[o + c] + 0.25 * prima[o + m + c]; } }
  // (la stessa media lungo il raggio per la colonna dello strato; h va con la polvere che si sposta: la media di h pesata con
  // la colonna — se no la polvere di un anello sottile, sparsa sul vicino, vi prenderebbe il suo spessore)
  for (let giro = 0; giro < 3; giro++) { const prima = tabStrato.slice(), m = 2 * nf; for (let jr = 1; jr < nr - 1; jr++) for (let jf = 0; jf < nf; jf++) { const o = 2 * (jr * nf + jf), c0 = prima[o - m], c1 = prima[o], c2 = prima[o + m], c = 0.25 * c0 + 0.5 * c1 + 0.25 * c2;
    if (c > 0) tabStrato[o + 1] = (0.25 * c0 * prima[o - m + 1] + 0.5 * c1 * prima[o + 1] + 0.25 * c2 * prima[o + m + 1]) / c; tabStrato[o] = c; } }
  for (let o = 0; o < tabStrato.length; o += 2) tabStrato[o + 1] *= tabStrato[o];
  // (verso il bordo della griglia la luce sfuma a zero: lo sferoide vero continua, qui lo si taglia senza spigolo)
  for (let jz = 0; jz < nz; jz++) { const s = Math.abs(((jz + 0.5) / nz) * 2 - 1), fz = Math.min(1, (1 - s * s) / 0.35); for (let jr = 0; jr < nr; jr++) { const fr = Math.min(1, (1 - (jr + 0.5) / nr) / 0.2), f = fz * fr; if (f >= 1) continue; for (let jf = 0; jf < nf; jf++) { const o = 4 * ((jz * nr + jr) * nf + jf); dati[o] *= f; dati[o + 1] *= f; dati[o + 2] *= f; } } }
  // (la somma sul volume della luce deve fare 1)
  const k = somma > 0 ? 1 / somma : 0; for (let o = 0; o < dati.length; o += 4) { dati[o] *= k; dati[o + 1] *= k; dati[o + 2] *= k; }
  // (la griglia va alla scheda in mezza precisione: oltre 65504 diventerebbe infinito. Un tetto di 6·10⁴ A_V per Rg è
  // comunque una parete: la cella più sottile, sul piano, ne fa decine di magnitudini)
  const tetto = () => { for (let o = 3; o < dati.length; o += 4) if (dati[o] > 6e4) dati[o] = 6e4; }; tetto();
  const meta = { nf, nr, nz, Rmax, zmax, raggioM: Rg, luce: sg.daLontano.luminosita, kappa, t: d.t, strato: tabStrato };
  manda({ n: d.n, tipo: 'galassia', dati: dati.slice(), ...meta, nebulose: 0 });
  // secondo messaggio: con le nebulose e le nubi di vuoto.js depositate nelle loro celle
  try { const v = sg.vuoto({ centro: [0, 0, 0], raggio: Rk * 1.1 }); let messe = 0;
    // (vicino all'asse una cella è uno spicchio stretto: una nebulosa più larga dello spicchio vi stava tutta dentro, e di
    // faccia il centro si vedeva a raggi, spicchi chiari e scuri. La si stende sugli spicchi che il suo raggio copre a quella
    // distanza dall'asse — 2·asin(r/R), tutto il giro se r ≥ R —, con la stessa somma)
    for (const x of v.volumi) { const R = Math.hypot(x.pos[0], x.pos[1]) / Rg, z = x.pos[2] / Rg; if (R >= Rmax || Math.abs(z) >= zmax) continue; let fi = Math.atan2(x.pos[1], x.pos[0]) / (2 * Math.PI); fi -= Math.floor(fi);
      const jf = Math.min(nf - 1, Math.floor(fi * nf)), jr = Math.min(nr - 1, Math.floor((R / Rmax) * nr)), s = Math.sign(z) * Math.sqrt(Math.abs(z) / zmax), jz = Math.min(nz - 1, Math.floor(((s + 1) / 2) * nz)), vc = volCella(jr, jz);
      const rr = x.raggio / Rg, largo = rr >= R ? 2 * Math.PI : 2 * Math.asin(rr / R), nc = Math.max(1, Math.min(nf, Math.ceil((largo * nf) / (2 * Math.PI)))), f0 = jf - Math.floor(nc / 2);
      const L = x.brillanza > 0 && x.colore ? (x.brillanza * 4 * Math.PI * Math.PI * x.raggio * x.raggio) / sg.daLontano.luminosita / vc / nc : 0, m = x.colore ? Math.max(lin(x.colore[0]), lin(x.colore[1]), lin(x.colore[2])) || 1 : 1, A = x.estinzione > 0 ? (x.estinzione * (2 / 3) * Math.PI * rr * rr) / vc / nc : 0;
      for (let q = 0; q < nc; q++) { const o = 4 * ((jz * nr + jr) * nf + ((((f0 + q) % nf) + nf) % nf));
        if (L > 0) for (let c = 0; c < 3; c++) dati[o + c] += (L * lin(x.colore[c])) / m;
        if (A > 0) dati[o + 3] += A; }
      if (L > 0) messe++; if (A > 0) messe++; }
    tetto(); manda({ n: d.n, tipo: 'galassia', dati, ...meta, nebulose: messe });
  } catch (e) { /* senza vuoto.js resta il volume delle stelle e della polvere */ }
}

// { tipo: 'ragnatela', n, cosmo, regione: null | { centro, lato } (m comoventi), celle, griglia, kmax, D }
// → la densità ρ/ρ̄ su una griglia (griglia³, Float32) DOPO lo spostamento di Zel'dovich: ogni elemento di materia (i nodi
//   di una griglia celle³: tutti della stessa massa) è portato da q a x = q + D·Ψ(q) e depositato nelle otto celle
//   vicine, con la LUCE che gli spetta (vedi sotto: quella degli aloni attesi in lui). Ψ = −∇φ con ∇²φ = δ: ragnatela.js dà le derivate seconde di φ (il tensore di marea) nei nodi; le prime si
//   ricavano da lì integrando lungo le file della griglia (∂ψ_x/∂x = −φ_xx …: trapezi; su tutto il toro, che si
//   richiude, la media di Ψ è zero; in una regione resta ignota una traslazione di tutta la regione, che non cambia
//   la forma dei filamenti ma la sposta di qualche Mpc rispetto alla grana grossa — dichiarato).
function volumeRagnatela(d, manda) {
  const C = campoDi(d.cosmo), O = C ? null : ondeDi(d.cosmo), campo = C ? d.cosmo : d.kmax > O.kmax ? raffina(d.cosmo, d.kmax) : O, dettaglio = C && d.regione && d.kmax ? C.toroM / d.kmax : null, TM = (C || O).toroM, reg = d.regione ? { centro: d.regione.centro, lato: d.regione.lato, celle: d.celle } : null;
  const G = classiSuGriglia(campo, reg, { celle: d.celle, dettaglio }), n = G.n, n2 = n * n, F = G.campo, h = G.passo; // (h: il passo in frazioni del toro; le λ sono in quelle unità: Ψ in frazioni del toro)
  // Ψ per integrazione: lungo x da (0, j, k), con il punto di partenza di ogni fila ottenuto lungo y da (0, 0, k) e quello lungo z da (0, 0, 0)
  const P = [new Float32Array(n * n2), new Float32Array(n * n2), new Float32Array(n * n2)], T = [[F.xx, F.xy, F.xz], [F.xy, F.yy, F.yz], [F.xz, F.yz, F.zz]], q = (i, j, k) => (k * n + j) * n + i;
  for (let c = 0; c < 3; c++) { const [tx, ty, tz] = T[c], p = P[c];
    for (let k = 1; k < n; k++) p[q(0, 0, k)] = p[q(0, 0, k - 1)] - 0.5 * h * (tz[q(0, 0, k)] + tz[q(0, 0, k - 1)]);
    for (let k = 0; k < n; k++) for (let j = 1; j < n; j++) p[q(0, j, k)] = p[q(0, j - 1, k)] - 0.5 * h * (ty[q(0, j, k)] + ty[q(0, j - 1, k)]);
    for (let k = 0; k < n; k++) for (let j = 0; j < n; j++) for (let i = 1; i < n; i++) p[q(i, j, k)] = p[q(i - 1, j, k)] - 0.5 * h * (tx[q(i, j, k)] + tx[q(i - 1, j, k)]);
    let m = 0; for (let a = 0; a < p.length; a++) m += p[a]; m /= p.length; for (let a = 0; a < p.length; a++) p[a] -= m; }
  // LA LUCE VIENE DALLE GALASSIE, non dalla massa: ogni elemento di materia porta la luce degli aloni che fanno galassie
  // attesi in lui, e quanti sono lo dice ragnatela.js `aloniAttesi` (Press–Schechter condizionata all'ambiente: in un
  // vuoto gli aloni grandi spariscono, in un nodo abbondano — cresce molto più in fretta della densità). Gli aloni che
  // contano sono quelli tra il più piccolo e il più grande alone delle galassie della biblioteca (galassie.js), e la
  // luce va con la loro massa (luce su massa d'alone: una costante del campione, che qui si semplifica: conta il
  // rapporto con la media). La legge dipende dall'ambiente solo attraverso la sovradensità lineare: la si calcola in 64
  // elementi sparsi e per gli altri si interpola su quella (dichiarato: `aloniAttesi` media su una sfera grande quanto
  // la cella, la griglia dà il valore nel nodo; con onde più lunghe di due celle la differenza è piccola).
  let peso = null;
  try { const forme = cosmoDi(d.cosmo).galassie.map((x) => galassiaAlTempo(x.forma, ANNI_OGGI / 1e9 + (d.t || 0) / (1e9 * 3.15576e7))).filter((x) => x.esiste && x.massaAlone > 0), m0 = Math.min(...forme.map((x) => x.massaAlone)), m1 = Math.max(...forme.map((x) => x.massaAlone));
    const NB = 10, fasce = Array.from({ length: NB }, (_, b) => [m0 * (m1 / m0) ** (b / NB), m0 * (m1 / m0) ** ((b + 1) / NB)]), tab = [], passo = Math.max(1, Math.floor((n * n2) / 64));
    for (let a = Math.floor(passo / 2); a < n * n2; a += passo) { const i = a % n, j = Math.floor(a / n) % n, k = Math.floor(a / n2), r = aloniAttesi(campo, [(G.origine[0] + i * h) * TM, (G.origine[1] + j * h) * TM, (G.origine[2] + k * h) * TM], 0.62 * G.latoCellaM, { fasce, t: d.t || 0 });
      tab.push([G.delta[a], r.fasce.reduce((somma, f) => somma + f.perMpc3DiMateria * Math.sqrt(f.da * f.a), 0)]); }
    tab.sort((x, y) => x[0] - y[0]); peso = new Float32Array(n * n2); let media = 0;
    for (let a = 0; a < n * n2; a++) { const x = G.delta[a]; let lo = 0, hi = tab.length - 1; if (x <= tab[0][0]) hi = 0; else if (x >= tab[hi][0]) lo = hi; else { while (hi - lo > 1) { const m = (lo + hi) >> 1; if (tab[m][0] <= x) lo = m; else hi = m; } }
      const f = lo === hi || tab[hi][0] === tab[lo][0] ? tab[lo][1] : tab[lo][1] + ((tab[hi][1] - tab[lo][1]) * (x - tab[lo][0])) / (tab[hi][0] - tab[lo][0]); peso[a] = Math.max(0, f); media += peso[a]; }
    media /= n * n2; if (media > 0) for (let a = 0; a < n * n2; a++) peso[a] /= media; else peso = null;
    var legge = { aloniDa: m0, aloniA: m1, punti: tab.length, minimo: tab[0], massimo: tab[tab.length - 1], media };
  } catch (e) { peso = null; var legge = { errore: String(e) }; }
  // il deposito: griglia g³ sulla stessa regione (tutto il toro: periodica), nuvola-nella-cella (otto celle vicine)
  const g = d.griglia, rho = new Float32Array(g * g * g), per = !reg, lato = per ? 1 : n * h, o0 = per ? [0, 0, 0] : G.origine.map((v) => v - 0.5 * h), D = d.D ?? 1, massa = (g / n) ** 3;
  for (let k = 0; k < n; k++) for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { const a = q(i, j, k), X = [G.origine[0] + i * h + D * P[0][a], G.origine[1] + j * h + D * P[1][a], G.origine[2] + k * h + D * P[2][a]].map((v, c) => ((v - o0[c]) / lato) * g - 0.5);
    const i0 = Math.floor(X[0]), j0 = Math.floor(X[1]), k0 = Math.floor(X[2]), fx = X[0] - i0, fy = X[1] - j0, fz = X[2] - k0;
    for (let dk = 0; dk < 2; dk++) for (let dj = 0; dj < 2; dj++) for (let di = 0; di < 2; di++) { let x = i0 + di, y = j0 + dj, z = k0 + dk; if (per) { x = ((x % g) + g) % g; y = ((y % g) + g) % g; z = ((z % g) + g) % g; } else if (x < 0 || y < 0 || z < 0 || x >= g || y >= g || z >= g) continue;
      rho[(z * g + y) * g + x] += massa * (peso ? peso[a] : 1) * (di ? fx : 1 - fx) * (dj ? fy : 1 - fy) * (dk ? fz : 1 - fz); } }
  manda({ n: d.n, tipo: 'ragnatela', dati: rho, griglia: g, periodica: per, origine: o0.map((v) => v * TM), latoM: lato * TM, toroM: TM, kmax: O ? campo.kmax : d.kmax, D, legge });
}

self.onmessage = (e) => {
  const d = e.data, t0 = performance.now(), manda = (m) => self.postMessage({ ...m, ms: performance.now() - t0 }, [m.dati.buffer]);
  try { if (d.tipo === 'galassia') volumeGalassia(d, manda); else if (d.tipo === 'ragnatela') volumeRagnatela(d, manda);
    else if (d.tipo === 'pozza') { const r = celle(d.c, { seme: d.seme }); self.postMessage({ tipo: 'pozza', N: r.N, u: r.u }, [r.u.buffer]); }
    else if (d.tipo === 'aria') { const T = tabelleAria(d.aria, d.R, d.albedo); self.postMessage({ tipo: 'aria', ms: T.ms, cieloT: T.cieloT, tempo: performance.now() - t0 }, [T.ms.buffer, T.cieloT.buffer]); } }
  catch (err) { self.postMessage({ n: d.n, tipo: d.tipo, errore: String((err && err.stack) || err) }); }
};
