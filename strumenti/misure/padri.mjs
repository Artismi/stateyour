// padri.mjs — PADRE E FIGLIO: il figlio, riassunto sulla cella del padre, somiglia al padre? (Node, senza browser)
// Per ogni campo generato per livelli e per ogni coppia di livelli (padre L−1, figlio L) si misura, sulle celle del padre
// che il figlio copre:
//   · lo SCARTO: la media del figlio sulla cella del padre meno il padre (media con segno = la deriva; valore efficace;
//     il massimo), nelle unità del campo, e il valore efficace diviso per la deviazione del padre su quelle celle;
//   · il RAPPORTO DELLE VARIANZE: Var(figlio riassunto sulle celle del padre) / Var(padre) (1 se il figlio porta le
//     stesse forme del padre alla grana del padre) e, per informazione, Var(figlio) / Var(padre) (quanto dettaglio aggiunge).
// LE SOGLIE (scritte una volta, prima dei numeri; il rapporto le chiama «guida»: segnalano, non fermano niente):
//   · scarto efficace > 10 % della deviazione del padre: alla grana del padre il figlio sposta le forme di un decimo della
//     loro ampiezza, cioè si vede un salto quando lo zoom passa dall'uno all'altro (la regola del rapporto chiede 0, «il
//     figlio è il padre più una correzione a media nulla»);
//   · rapporto delle varianze riassunte fuori da [0,8; 1,25]: il contrasto alla grana del padre cambia di più di un quarto;
//   · per il colore: ΔE76 medio tra il figlio riassunto (in luce lineare) e il padre > 5 (due volte la differenza appena
//     percettibile: il colore cambia entrando nel figlio);
//   · per la luce della galassia: la somma delle stelle (per il loro peso) diversa dalla luce da lontano di più del 25 %
//     (≈ 0,25 magnitudini: un salto di luminosità visibile quando le stelle prendono il posto dell'immagine da lontano).
// I LUOGHI (nessun seme scelto): il pianeta «terre» di indirizzi.json; i punti sono tre celle della superficie erosa, la
// più alta, quella di terra più vicina al livello del mare con una cella di mare accanto (una costa), la più profonda; per
// le finestre d'acqua il primo mare con il vento del catalogo (test/mare_col_vento.mjs); per la galassia quella d'avvio.
// uso: npm run padri [-- --rapido]  (rapido: un punto, livelli fino a 4)   → strumenti/misure/esiti/padri.json e .md
import { writeFileSync, readFileSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const QUI = dirname(fileURLToPath(import.meta.url)), RADICE = join(QUI, '..', '..');
const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > 0 ? process.argv[i + 1] : d; };
const RAPIDO = process.argv.includes('--rapido'), USCITA = resolve(arg('uscita', join(QUI, 'esiti'))); mkdirSync(USCITA, { recursive: true });
const SOGLIA = { scarto: 0.1, varMin: 0.8, varMax: 1.25, deltaE: 5, luce: 0.25 };
const LMAX = RAPIDO ? 4 : 6;
const CO = await import(join(RADICE, 'src/camera/cosmo.js')), GE = await import(join(RADICE, 'src/camera/geologia.js'));
const IND = JSON.parse(readFileSync(join(QUI, 'indirizzi.json'), 'utf8')).indirizzi.find((a) => a.nome === 'terre').via;
const righe = [], t0 = Date.now(), log = (...a) => console.log(`${((Date.now() - t0) / 1000).toFixed(0).padStart(4)} s`, ...a);
const num = (x, c = 3) => (Number.isFinite(x) ? (Math.abs(x) >= 1e4 || (Math.abs(x) < 1e-3 && x !== 0) ? x.toExponential(c - 1) : +x.toPrecision(c)) : String(x));

// lo scarto tra il figlio riassunto e il padre: figlio(i, j) e padre(I, J) come funzioni, celle del padre coperte e, per
// ognuna, le celle del figlio che le compongono
// devRif: la deviazione del padre su tutto il padre (la tessera o la finestra intera: l'ampiezza delle sue forme), il metro
// dello scarto relativo; sotto un milionesimo della media il padre è uniforme e il relativo non si dice
function scarto(celle, devRif = null) { // celle: [{ p: valore del padre, f: [valori del figlio nella cella] }]
  const P = [], Fm = [], tutti = []; for (const c of celle) { if (!c.f.length || !Number.isFinite(c.p)) continue; let s = 0; for (const v of c.f) { s += v; tutti.push(v); } P.push(c.p); Fm.push(s / c.f.length); }
  const n = P.length, media = (a) => a.reduce((s, x) => s + x, 0) / a.length, varianza = (a) => { const m = media(a); return a.reduce((s, x) => s + (x - m) ** 2, 0) / a.length; };
  const d = P.map((p, i) => Fm[i] - p), vp = varianza(P), sp = devRif ?? Math.sqrt(vp), rms = Math.sqrt(d.reduce((s, x) => s + x * x, 0) / n), uniforme = !(Math.sqrt(vp) > 1e-6 * Math.abs(media(P)) + 1e-12);
  return { celle: n, deriva: media(d), rms, max: Math.max(...d.map(Math.abs)), devPadre: sp, rmsRelativo: sp > 0 && !uniforme ? rms / sp : null, varRiassunto: uniforme ? null : varianza(Fm) / vp, varFiglio: uniforme ? null : varianza(tutti) / vp, ...(uniforme ? { nota: 'padre uniforme sulle celle coperte' } : {}) };
}
function deviazione(a) { let s = 0, s2 = 0; for (const x of a) { s += x; s2 += x * x; } const m = s / a.length; return Math.sqrt(Math.max(0, s2 / a.length - m * m)); }
function riga(campo, luogo, coppia, unita, s, extra = {}) {
  const oltre = []; if (s.rmsRelativo != null && s.rmsRelativo > SOGLIA.scarto) oltre.push(`scarto ${num(100 * s.rmsRelativo, 2)} % > ${100 * SOGLIA.scarto} %`);
  if (s.varRiassunto != null && (s.varRiassunto < SOGLIA.varMin || s.varRiassunto > SOGLIA.varMax)) oltre.push(`varianze ${num(s.varRiassunto, 2)} fuori da [${SOGLIA.varMin}; ${SOGLIA.varMax}]`);
  if (extra.deltaE != null && extra.deltaE > SOGLIA.deltaE) oltre.push(`ΔE ${num(extra.deltaE, 2)} > ${SOGLIA.deltaE}`);
  if (extra.luce != null && Math.abs(extra.luce - 1) > SOGLIA.luce) oltre.push(`luce ×${num(extra.luce, 3)}`);
  const r = { campo, luogo, coppia, unita, ...s, ...extra, segnalato: oltre.join('; ') }; righe.push(r);
  log(`${oltre.length ? '!!' : 'ok'} ${campo.padEnd(18)} ${luogo.padEnd(10)} ${coppia.padEnd(8)} deriva ${num(s.deriva)} ${unita}, rms ${num(s.rms)} (${s.rmsRelativo != null ? num(100 * s.rmsRelativo, 2) + ' %' : '–'} di σ padre ${num(s.devPadre)}), var riassunte ${num(s.varRiassunto)}, var figlio ${num(s.varFiglio)}${extra.deltaE != null ? `, ΔE ${num(extra.deltaE, 2)}` : ''} ${r.segnalato}`);
}

// ---------- il pianeta e i tre punti
const k = JSON.stringify(IND), P = CO.sistema(IND.cosmo, IND.galassia, IND.stella).pianeti[IND.pianeta];
log('pianeta', k); const sf = GE.superficiePianeta(k, P, P.interno, P.origine), cl = GE.climaSuperficie(k, P, sf), se = GE.erosione(k, sf, cl); log('superficie pronta', se.W, '×', se.H);
const punti = (() => { const { W, H, alt, mare } = se; let alto = 0, basso = 0, costa = -1, dc = Infinity;
  for (let c = 0; c < W * H; c++) { if (alt[c] > alt[alto]) alto = c; if (alt[c] < alt[basso]) basso = c; const i = c % W, j = (c / W) | 0;
    if (alt[c] >= mare && alt[c] - mare < dc) { const v = [[i - 1, j], [i + 1, j], [i, j - 1], [i, j + 1]].some(([x, y]) => y >= 0 && y < H && alt[y * W + ((x + W) % W)] < mare); if (v) { dc = alt[c] - mare; costa = c; } } }
  const uv = (c) => ({ u: ((c % W) + 0.5) / W, v: (((c / W) | 0) + 0.5) / H });
  return [{ nome: 'costa', ...uv(costa) }, { nome: 'vetta', ...uv(alto) }, { nome: 'abisso', ...uv(basso) }]; })();

// ---------- 1. il rilievo delle tessere (geologia.js tessera) e 2. il loro colore (tessere.worker.js, la riflettanza «terra»)
let lavoratore = null;
async function preparaLavoratore() {
  const attesi = new Map(); globalThis.self = { postMessage: (m) => { const f = attesi.get(m.n); if (f) { attesi.delete(m.n); f(m); } } };
  await import(join(RADICE, 'src/tre/tessere.worker.js'));
  const on = globalThis.self.onmessage; on({ data: { tipo: 'base', k, se, cl, mare: null, seme: P.origine, T: P.clima.T, raggioM: P.raggioM } });
  let n = 0; lavoratore = (L, tx, ty) => new Promise((ok) => { const id = ++n; attesi.set(id, ok); on({ data: { tipo: 'tessera', n: id, L, tx, ty } }); });
}
try { await preparaLavoratore(); } catch (e) { log('il filo delle tessere non parte in Node:', e.message); lavoratore = null; }
const LIN = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
const labDi = ([r, g, b]) => { const f = (t) => (t > 216 / 24389 ? Math.cbrt(t) : (841 / 108) * t + 4 / 29), x = f((0.4124 * r + 0.3576 * g + 0.1805 * b) / 0.95047), y = f(0.2126 * r + 0.7152 * g + 0.0722 * b), z = f((0.0193 * r + 0.1192 * g + 0.9505 * b) / 1.08883); return [116 * y - 16, 500 * (x - y), 200 * (y - z)]; };
for (const pt of RAPIDO ? punti.slice(0, 1) : punti) {
  let madre = null, colMadre = null;
  for (let L = 0; L <= LMAX; L++) {
    const n = 4 ** L, tx = Math.min(n - 1, Math.floor(pt.u * n)), ty = Math.min(n - 1, Math.floor(pt.v * n)), t = GE.tessera(k, se, cl, L, tx, ty, P.origine);
    let col = null; if (lavoratore) { try { const r = await lavoratore(L, tx, ty); col = r.terra ? r : null; if (r.errore) log('tessera 3D', L, r.errore.split('\n')[0]); } catch (e) { log('tessera 3D', L, e.message); } }
    if (madre) {
      const { W, H } = t, ox = (tx & 3) * (W / 4), oy = (ty & 3) * (H / 4), celle = [], celleC = [[], [], []], dE = [];
      for (let J = 0; J < H / 4; J++) for (let I = 0; I < W / 4; I++) {
        const f = [], fc = [0, 0, 0]; for (let b = 0; b < 4; b++) for (let a = 0; a < 4; a++) { const c = (4 * J + b) * W + 4 * I + a; f.push(t.alt[c]); if (col) for (let q = 0; q < 3; q++) fc[q] += LIN(col.terra[4 * c + q]) / 16; }
        const cm = (oy + J) * madre.W + ox + I; celle.push({ p: madre.alt[cm], f });
        if (col && colMadre) { const pc = [0, 1, 2].map((q) => LIN(colMadre.terra[4 * cm + q])); for (let q = 0; q < 3; q++) celleC[q].push({ p: pc[q], f: [fc[q]] }); const A = labDi(fc), B = labDi(pc); dE.push(Math.hypot(A[0] - B[0], A[1] - B[1], A[2] - B[2])); }
      }
      riga('rilievo (tessere)', pt.nome, `L${L - 1}→L${L}`, 'm', scarto(celle, deviazione(madre.alt)), { lato: `${num((2 * Math.PI * P.raggioM) / (n * t.W) / 1e3)} km per cella` });
      if (dE.length) riga('colore (tessere)', pt.nome, `L${L - 1}→L${L}`, 'riflettanza G', scarto(celleC[1], deviazione(Array.from({ length: madre.W * madre.H }, (_, c) => LIN(colMadre.terra[4 * c + 1])))), { deltaE: dE.reduce((s, x) => s + x, 0) / dE.length });
    }
    madre = t; colMadre = col;
  }
}

// ---------- 3. il suolo (suolo.js finestraSuolo): finestre di dieci in dieci attorno al punto della costa, la quota fine Z
try {
  // (il suolo si misura sul pianeta d'avvio: sul pianeta «terre» le terre stanno a pochi metri dal mare e alla tessera fine
  // sono laghi, quindi il suolo lì non c'è; il punto: la cella più alta della superficie erosa d'avvio, poi le altre in
  // ordine di quota, finché il padre del suolo esiste — al più otto prove)
  const SU = await import(join(RADICE, 'src/camera/suolo.js')), VA = JSON.parse(readFileSync(join(QUI, 'indirizzi.json'), 'utf8')).indirizzi.find((a) => a.nome === 'avvio').via;
  const kA = JSON.stringify(VA), PA = CO.sistema(VA.cosmo, VA.galassia, VA.stella).pianeti[VA.pianeta], sfA = GE.superficiePianeta(kA, PA, PA.interno, PA.origine), clA = GE.climaSuperficie(kA, PA, sfA), seA = GE.erosione(kA, sfA, clA), S = { k: kA, P: PA, se: seA, cl: clA, seme: PA.origine };
  const ordine = Array.from({ length: seA.W * seA.H }, (_, c) => c).filter((c) => seA.alt[c] > seA.mare).sort((a, b) => seA.alt[b] - seA.alt[a]);
  // (il padre del suolo è la tessera del livello 6, LIVELLO_PADRE; se lì la cella risulta acqua o lago si prova il livello sotto, e lo si scrive)
  // (e se nemmeno così, la vetta del pianeta «terre», che al livello 0 è terra)
  const candidati = ordine.filter((_, i) => i % Math.max(1, Math.floor(ordine.length / 8)) === 0).slice(0, 8).map((c) => ({ S, q: { nome: `avvio, cella ${c}`, u: ((c % seA.W) + 0.5) / seA.W, v: (((c / seA.W) | 0) + 0.5) / seA.H } })).concat([{ S: { k, P, se, cl, seme: P.origine }, q: { ...punti[1], nome: 'terre, vetta' } }]);
  let pt = null, liv = SU.LIVELLO_PADRE, Sx = S; cerca: for (; liv >= 0; liv--) for (const { S: s1, q } of candidati) { if (SU.padreSuolo(s1, q.u * 360 - 180, 90 - q.v * 180, { livello: liv })) { pt = q; Sx = s1; break cerca; } }
  if (!pt) throw new Error('nessun punto di terra con il padre del suolo, a nessun livello'); if (liv !== SU.LIVELLO_PADRE) { pt.nome += ` (padre al livello ${liv}: al ${SU.LIVELLO_PADRE} le celle provate sono acqua o lago)`; log('suolo: padre al livello', liv); }
  const lon = pt.u * 360 - 180, lat = 90 - pt.v * 180; log('suolo a', pt.nome, lon.toFixed(2), lat.toFixed(2));
  const lati = RAPIDO ? [1000, 100, 10] : [1000, 100, 10, 1, 0.1, 0.01]; let pa = null;
  for (const latoM of lati) {
    const f = SU.finestraSuolo(Sx, { lon, lat, latoM, N: 128, livello: liv }); if (f.acqua) { log('suolo: il punto è acqua'); break; } const Z = f.campo.Z, N = f.N;
    if (pa) { const celle = []; const Zp = pa.campo.Z, Np = pa.N, h = f.h, H = pa.h;
      for (let J = 0; J < Np; J++) for (let I = 0; I < Np; I++) { const X = (pa.gx0 + I) * H, Y = (pa.gy0 + J) * H, ff = [];
        const i0 = Math.ceil((X - H / 2) / h) - f.gx0, i1 = Math.ceil((X + H / 2) / h) - f.gx0, j0 = Math.ceil((Y - H / 2) / h) - f.gy0, j1 = Math.ceil((Y + H / 2) / h) - f.gy0; if (i0 < 0 || j0 < 0 || i1 > N || j1 > N) continue;
        for (let j = j0; j < j1; j++) for (let i = i0; i < i1; i++) ff.push(Z[j * N + i]); celle.push({ p: Zp[J * Np + I], f: ff }); }
      riga('suolo (Z fine)', pt.nome, `${num(pa.latoChiesto ?? pa.L)} m→${num(latoM)} m`, 'm', scarto(celle, deviazione(Zp))); }
    f.latoChiesto = latoM; pa = f;
  }
} catch (e) { log('suolo: non misurato:', e.message); }

// ---------- 4. le finestre d'acqua (finestra.js finestraAcqua, ondeFinestra): l'altezza della superficie a un istante
try {
  const { mareColVento } = await import(join(RADICE, 'test/mare_col_vento.mjs')), FI = await import(join(RADICE, 'src/camera/finestra.js'));
  const M = mareColVento(); if (!M) throw new Error('nessun mare con il vento');
  const opz = { lon: M.aperto.lon, lat: M.aperto.lat, fondoM: M.aperto.fondoM, P: M.P }, lati = RAPIDO ? [100, 10, 1] : [1000, 100, 10, 1, 0.1]; let pa = null;
  log('mare', JSON.stringify(M.via));
  for (const latoM of lati) {
    const f = FI.finestraAcqua(M.st, { ...opz, latoM }), G = FI.ondeFinestra(f, 0); if (!G) break;
    if (pa) { const celle = [], Gp = pa.G, H = Gp.h, h = G.h, dentro = (x, y) => x >= f.x0 && y >= f.y0 && x < f.x0 + f.L && y < f.y0 + f.L;
      for (let J = 0; J < Gp.ny; J++) for (let I = 0; I < Gp.nx; I++) { const X = (Gp.gx0 + I) * H, Y = (Gp.gy0 + J) * H; if (!dentro(X - H / 2, Y - H / 2) || !dentro(X + H / 2, Y + H / 2)) continue; const ff = [];
        const i0 = Math.ceil((X - H / 2) / h) - G.gx0, i1 = Math.ceil((X + H / 2) / h) - G.gx0, j0 = Math.ceil((Y - H / 2) / h) - G.gy0, j1 = Math.ceil((Y + H / 2) / h) - G.gy0; if (i0 < 0 || j0 < 0 || i1 > G.nx || j1 > G.ny) continue;
        for (let j = j0; j < j1; j++) for (let i = i0; i < i1; i++) ff.push(G.eta[j * G.nx + i]); celle.push({ p: Gp.eta[J * Gp.nx + I], f: ff }); }
      riga('acqua (finestre)', 'mare', `${num(pa.lato)} m→${num(latoM)} m`, 'm', scarto(celle, deviazione(Gp.eta))); }
    pa = { G, lato: latoM };
  }
} catch (e) { log('finestre d\'acqua: non misurate:', e.message); }

// ---------- 5. la luce della galassia da lontano contro la somma delle sue stelle (spazio3d.js scenaGalassia)
try {
  const SP = await import(join(RADICE, 'src/camera/spazio3d.js')), sc = SP.scenaGalassia(1, 33, 0), Pt = sc.punti; let s = 0;
  for (let i = 0; i < Pt.luminosita.length; i++) if (Pt.esiste[i]) s += Pt.luminosita[i];
  const peso = (typeof Pt.peso === 'number' ? Pt.peso : 1) * (Pt.normaLuce ?? 1), grezzo = (s * peso) / (Pt.normaLuce ?? 1) / sc.daLontano.luminosita, rapporto = (s * peso) / sc.daLontano.luminosita;
  log(`galassia: stelle × peso / luce da lontano = ${num(grezzo, 3)} senza la stima di rapporto, ${num(rapporto, 3)} con (normaLuce ${num(Pt.normaLuce ?? 1, 3)})`);
  riga('luce galassia', 'galassia 34', 'lontano→stelle', 'W', { celle: 1, deriva: s * peso - sc.daLontano.luminosita, rms: Math.abs(s * peso - sc.daLontano.luminosita), max: Math.abs(s * peso - sc.daLontano.luminosita), devPadre: sc.daLontano.luminosita, rmsRelativo: null, varRiassunto: null, varFiglio: null }, { luce: rapporto, nota: `${Pt.luminosita.length} stelle del campione, peso ${num(peso)}: la luce che le stelle portano da sole (la vista vi aggiunge la luce diffusa, universo.js)` });
} catch (e) { log('galassia: non misurata:', e.message); }

// ---------- le uscite
const segnalate = righe.filter((r) => r.segnalato), peggio = [...righe].filter((r) => r.rmsRelativo != null).sort((a, b) => b.rmsRelativo - a.rmsRelativo);
writeFileSync(join(USCITA, 'padri.json'), JSON.stringify({ quando: new Date().toISOString(), soglie: SOGLIA, pianeta: IND, punti, righe }, null, 1));
const md = ['# Padre e figlio', '', `Pianeta ${k}; punti: ${punti.map((p) => p.nome).join(', ')}. Soglie (guida): scarto efficace > ${100 * SOGLIA.scarto} % di σ del padre; varianze riassunte fuori da [${SOGLIA.varMin}; ${SOGLIA.varMax}]; ΔE > ${SOGLIA.deltaE}; luce ±${100 * SOGLIA.luce} %.`, '',
  `${righe.length} coppie misurate, ${segnalate.length} oltre la soglia. Peggiore: ${peggio[0] ? `${peggio[0].campo} ${peggio[0].luogo} ${peggio[0].coppia}, scarto ${num(100 * peggio[0].rmsRelativo, 2)} % di σ` : '–'}.`, '',
  '| campo | luogo | coppia | deriva | rms | rms/σ padre | var riassunte | var figlio | ΔE | segnalato |', '|---|---|---|---|---|---|---|---|---|---|',
  ...righe.map((r) => `| ${r.campo} | ${r.luogo} | ${r.coppia} | ${num(r.deriva)} ${r.unita} | ${num(r.rms)} | ${r.rmsRelativo != null ? num(100 * r.rmsRelativo, 2) + ' %' : r.luce != null ? `luce ×${num(r.luce)}` : '–'} | ${num(r.varRiassunto)} | ${num(r.varFiglio)} | ${r.deltaE != null ? num(r.deltaE, 2) : ''} | ${r.segnalato || ''} |`)];
writeFileSync(join(USCITA, 'padri.md'), md.join('\n') + '\n'); console.log('\n' + md.slice(0, 5).join('\n')); log(`fatto: ${join(USCITA, 'padri.md')}`);
