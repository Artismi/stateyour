// giro.mjs — IL GIRO DELLO ZOOM SCRIPTATO: dal cosmo fino in fondo alla scala quantistica e ritorno, con la rotella, su
// tre indirizzi (indirizzi.json, scelti con il criterio scritto in indirizzi.mjs). Un fotogramma ogni quarto di decade di
// larghezza dello schermo (mezza decade nel modo rapido), e per ognuno gli indicatori di analisi.mjs: scala, luminanza,
// frazione vuota, dettaglio, salto rispetto al fotogramma prima, macchie sature, barre dritte, e alla fine la differenza
// tra andata e ritorno alla stessa scala. Uscite: giro.json, riassunto.json, riassunto.md, provini.html, foto/*.jpg.
//
// uso:  npm run giro            (tre indirizzi, un quarto di decade, attese lunghe)
//       npm run giro:rapido     (solo l'avvio, mezza decade, attese brevi, schermo di 480×300)
//       node strumenti/misure/giro.mjs [--rapido] [--uscita cartella] [--indirizzi avvio,terre] [--passo 0.25]
//                                      [--attesa ms] [--W 800 --H 500] [--fino 20]
//
// LA STRADA. Si apre l'app (l'indirizzo d'avvio), si esce con la rotella al centro fino in cima (dove la larghezza non
// cresce più: la «salita», senza foto). Poi per ogni indirizzo: ci si gira verso la sua galassia, e si scende (l'«andata»)
// con il cursore sulla cosa dell'indirizzo del livello sotto (la galassia, poi la stella, poi il pianeta: come farebbe
// chi la cerca); sul pianeta il cursore si ferma su un punto (il centro del pianeta, o per «terre» il punto di terra
// circondato da terra più vicino) e lì resta fino in fondo. In fondo si risale (il «ritorno») con il cursore dove stava
// all'andata alla stessa scala. Il fotogramma si prende quando la vista è PRONTA (vedi sotto), non dopo un tempo fisso.
//
// PRONTO, senza agganci nell'app (solo ciò che l'app già espone su window.__camera e nei moduli): nessuna dissolvenza in
// corso (__camera.passaggio), nessuna finestra in coda o in calcolo (mappa.js, statoFinestre), nel 3D nessun gesto della
// rotella o volo in corso, l'universo pronto, nessuna tessera del pianeta in attesa; poi l'immagine ferma: due catture di
// fila che differiscono in media meno di 1,5 livelli su 255. Se entro l'attesa massima non lo è, si prende lo stesso e si
// segna «non pronto» con il motivo (anche questo è una misura: la vista che non finisce di disegnare).
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { createServer } from 'node:http';
import { dirname, join, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { indicatori, confronta, labSfocato, dimezza, SOGLIE } from './analisi.mjs';
import { scriviProvini } from './provini.mjs';
import { riassunto, riassuntoMd } from './riassunto.mjs';

const QUI = dirname(fileURLToPath(import.meta.url)), RADICE = resolve(process.env.RADICE || join(QUI, '..', '..'));
const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > 0 ? process.argv[i + 1] : d; };
const RAPIDO = process.argv.includes('--rapido');
const PASSO = +arg('passo', RAPIDO ? 0.5 : 0.25), ATTESA = +arg('attesa', RAPIDO ? 6000 : 15000), W = +arg('W', RAPIDO ? 480 : 800), H = +arg('H', RAPIDO ? 300 : 500);
const USCITA = resolve(arg('uscita', join(QUI, 'esiti', RAPIDO ? 'rapido' : 'completo'))), FOTO = join(USCITA, 'foto');
const TUTTI = JSON.parse(readFileSync(join(QUI, 'indirizzi.json'), 'utf8')).indirizzi;
const QUALI = arg('indirizzi', RAPIDO ? 'avvio' : TUTTI.map((a) => a.nome).join(',')).split(',');
const INDIRIZZI = QUALI.map((n) => TUTTI.find((a) => a.nome === n)).filter(Boolean);
const TETTO_TRATTO = (RAPIDO ? 25 : 80) * 60e3; // ms per un tratto, al più
const FINO = arg('fino', null) == null ? null : +arg('fino'); // (--fino 20: l'andata si ferma quando la larghezza scende a 10²⁰ m, poi il ritorno: per misurare solo le scale in cima)
mkdirSync(FOTO, { recursive: true });
const ora = () => new Date().toISOString().slice(11, 19), log = (...a) => console.log(ora(), ...a), dorme = (ms) => new Promise((ok) => setTimeout(ok, ms));

// ---------- un server statico dentro il processo
const TIPI = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.css': 'text/css', '.wasm': 'application/wasm', '.woff2': 'font/woff2' };
const server = createServer((q, r) => { const f = join(RADICE, decodeURIComponent(q.url.split('?')[0])); if (!f.startsWith(RADICE)) { r.writeHead(403); return r.end(); } try { const d = readFileSync(f); r.writeHead(200, { 'Content-Type': TIPI[extname(f)] || 'application/octet-stream' }); r.end(d); } catch { r.writeHead(404); r.end(); } });
await new Promise((ok) => server.listen(0, '127.0.0.1', ok));
const richiedi = createRequire(import.meta.url); let chromium;
try { ({ chromium } = richiedi('playwright')); } catch { ({ chromium } = richiedi('/opt/node-tools/node_modules/playwright')); }
const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: W, height: H + 120 }, deviceScaleFactor: 1 });
const errori = []; page.on('pageerror', (e) => errori.push(e.message.slice(0, 200)));
const t0 = Date.now();
await page.goto(`http://127.0.0.1:${server.address().port}/index.html`); await page.evaluate(() => localStorage.clear()); await page.reload();
await page.waitForFunction(() => window.__camera?.universo3d?.pronto?.(), null, { timeout: 600000, polling: 1000 });
log(`app pronta in ${((Date.now() - t0) / 1000).toFixed(0)} s`);

// ---------- gli aiuti nella pagina
await page.evaluate(async () => {
  // via l'interfaccia sopra la scena (barra di scala, etichette, anelli, bottoni): si misura la scena
  const st = document.createElement('style'); st.textContent = '.tele > :not(canvas), .segni3d { visibility: hidden !important; }'; document.head.appendChild(st);
  let F = null; try { F = (await import('/src/camera/mappa.js')).statoFinestre; } catch { F = null; }
  const tele = () => document.querySelector('.tele');
  const G = (window.__giro = {
    fisso: null,
    larghezza: () => { const m = window.__camera.mpp(); return m > 0 ? m * tele().clientWidth : null; },
    stato: () => { const C = window.__camera, M = C.mondo3d; const v = C.vista || 'cosmo'; let s = v; if (v === 'cosmo') { s += ` L${C.camMappa?.livello}`; if (M) s += ' 3D'; else if (C.camMappa?.livello === 5) s += ` passo${C.camMappa.passoRoccia || 0}${C.camMappa.suAcqua ? ' acqua' : ''}${C.camMappa.latoSuolo ? ' suolo' : ''}`; if (C.vistaAtomi) s += ' +atomi'; if (document.querySelectorAll('.tele canvas').length) s += ` tele${document.querySelectorAll('.tele canvas:not([hidden])').length}`; }
      let via = ''; try { via = C.universo3d?.percorso?.().join(' › ') || ''; } catch { via = ''; } return { s, via, cosa: (() => { try { return C.cosa(); } catch { return ''; } })() }; },
    occupato: () => { const C = window.__camera, o = []; if (C.passaggio) o.push('dissolvenza'); if (F && F.inCoda + F.inCorso > 0) o.push(`finestre ${F.inCoda}+${F.inCorso}`);
      const M = C.mondo3d, U = C.universo3d; if (M) { if (M.volo) o.push('volo'); if (M.gesto) o.push('gesto'); try { if (U && !U.pronto()) o.push('universo'); const st = U?.sistema()?.vero?.()?.statistiche?.(); if (st && st.inAttesa > 0) o.push(`tessere ${st.inAttesa}`); } catch { /* */ } } return o; },
    // dove sta sullo schermo (0..1) un vettore occhio → cosa (nav.cjs)
    schermo(v) { const M = window.__camera.mondo3d, S = M.stato, a = S.assi, x = v[0] * a[0] + v[1] * a[3] + v[2] * a[6], y = v[0] * a[1] + v[1] * a[4] + v[2] * a[7], z = v[0] * a[2] + v[1] * a[5] + v[2] * a[8]; if (z >= 0) return null; return [0.5 + x / -z / S.tanX / 2, 0.5 - y / -z / S.tanY / 2]; },
    // girarsi verso la galassia dell'indirizzo (solo in cima, attaccati alla radice del cosmo: come in nav.cjs)
    orienta(via) { const U = window.__camera.universo3d, M = window.__camera.mondo3d; if (!M || !U) return false; const C = U.cosmo; if (M.camera.corpo !== C.radice) return false; const P = C.posGalassia(via.galassia), p = M.camera.pos, L = C.lato(), d = [0, 1, 2].map((k) => { const x = P[k] - p[k]; return x - Math.round(x / L) * L; }); // (il cosmo si richiude: l'immagine più vicina della galassia, come fa universo.js)
      M.camera.assi = M.assiDa(M.V.norma(d), [0, 0, 1]); M.cambia(); return true; },
    // il cursore dell'andata: sulla cosa dell'indirizzo del livello sotto
    mira(via, modo, prima) {
      const C = window.__camera, M = C.mondo3d, U = C.universo3d; if (G.fisso) return G.fisso; if (!M || !U) return prima || { x: 0.5, y: 0.5, chi: 'centro' };
      // (la meta più profonda dell'indirizzo che si vede: il pianeta, la stella, la galassia; il sistema aperto dice di chi è)
      const S = M.stato; let corpo = null; try { const Sx = U.sistema(); if (Sx && Sx.via && Sx.via.galassia === via.galassia && Sx.via.stella === via.stella) corpo = Sx.pianeta(via.pianeta); } catch { corpo = null; }
      const dentro = (s) => s && s[0] > 0.02 && s[0] < 0.98 && s[1] > 0.02 && s[1] < 0.98;
      if (corpo && M.camera.corpo === corpo) { // sul pianeta: quanto dello schermo copre, e dove fermarsi
        const pi = U.sistema().vero?.(), T = M.tela, Wt = T.clientWidth, Ht = T.clientHeight, P = prima || { x: 0.5, y: 0.5 }; let presi = 0, meglio = null;
        const terra = (x, y) => { const q = M.sotto(x * Wt, y * Ht); if (!q) return null; const i = pi?.info(q.lon, q.lat); return i ? !i.acqua : null; };
        for (let j = 0; j <= 40; j++) for (let i = 0; i <= 40; i++) { const x = i / 40, y = j / 40, t = terra(x, y); if (t == null) continue; presi++;
          if (modo === 'terra') { if (!t) continue; let ok = true; for (const [a, b] of [[-3, 0], [3, 0], [0, -3], [0, 3]]) if (terra(x + a / 40, y + b / 40) !== true) ok = false; if (!ok) continue; }
          const d = Math.hypot(x - P.x, y - P.y); if (!meglio || d < meglio.d) meglio = { d, x, y }; }
        if (meglio && presi > 0.3 * 41 * 41) { G.fisso = { x: meglio.x, y: meglio.y, chi: `suolo (${modo})` }; return G.fisso; }
        return meglio ? { x: meglio.x, y: meglio.y, chi: 'pianeta' } : P;
      }
      let bP = null, bS = null, bG = null; for (const q of S.bersagli) { if (corpo && q.corpo === corpo) bP = q; else if (q.stella === via.stella && q.galassia === via.galassia) bS = q; else if (q.galassia === via.galassia && q.stella == null && !q.corpo) bG = q; }
      for (const [b, chi] of [[bP, 'pianeta'], [bS, 'stella'], [bG, 'galassia']]) { const s = b ? G.schermo(b.p) : null; if (dentro(s)) return { x: s[0], y: s[1], chi }; }
      return prima ? { ...prima, chi: (prima.chi || '') .replace(/ \(perso\)$/, '') + ' (perso)' } : { x: 0.5, y: 0.5, chi: 'centro (meta non vista)' };
    },
    // scatti della rotella in (x, y) finché la larghezza passa la meta (log10), al più n; 35 ms tra uno scatto e l'altro
    async ruota(dy, xy, meta, n) { const T = tele().getBoundingClientRect(), x = T.left + xy.x * T.width, y = T.top + xy.y * T.height; let w = G.larghezza(), j = 0;
      for (; j < n; j++) { document.elementFromPoint(x, y)?.dispatchEvent(new WheelEvent('wheel', { deltaY: dy, deltaMode: 0, clientX: x, clientY: y, bubbles: true, cancelable: true, composed: true })); await new Promise((ok) => setTimeout(ok, 35)); w = G.larghezza(); if (w > 0 && (dy < 0 ? Math.log10(w) <= meta : Math.log10(w) >= meta)) { j++; break; } }
      return { j, w }; },
  });
});

const rett = await page.evaluate(() => { const r = document.querySelector('.tele').getBoundingClientRect(); return { x: r.left, y: r.top, width: r.width, height: r.height }; });
// ---------- una cattura: la scena come la vede l'utente, ridotta nella pagina a 480×300 (analisi) e 240×150 (foto JPEG)
const AW = 480, AH = 300, TW = 240, TH = 150;
async function cattura() {
  // via tutto ciò che non è la scena (l'interfaccia del visore e le etichette, anche quelle comparse dopo): resta visibile
  // solo ciò che contiene la scena e le tele della scena
  await page.evaluate(() => { const T = document.querySelector('.tele'); for (const e of document.body.querySelectorAll('*')) { if (e.contains(T) || (e.tagName === 'CANVAS' && e.parentNode === T)) continue; if (e.style.visibility !== 'hidden') e.style.setProperty('visibility', 'hidden', 'important'); } });
  const png = await page.screenshot({ clip: rett, type: 'png' });
  const r = await page.evaluate(async ([b64, AW, AH, TW, TH]) => {
    const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
    const riduci = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d', { willReadFrequently: true }); x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high'; x.drawImage(img, 0, 0, w, h); return { c, x }; };
    const a = riduci(AW, AH), d = a.x.getImageData(0, 0, AW, AH).data; let s = ''; for (let i = 0; i < d.length; i += 0x8000) s += String.fromCharCode.apply(null, d.subarray(i, i + 0x8000));
    return { rgba: btoa(s), jpeg: riduci(TW, TH).c.toDataURL('image/jpeg', 0.6).split(',')[1] };
  }, [png.toString('base64'), AW, AH, TW, TH]);
  return { W: AW, H: AH, rgba: new Uint8Array(Buffer.from(r.rgba, 'base64')), jpeg: r.jpeg };
}
const diffMedia = (a, b) => { let s = 0; for (let i = 0; i < a.rgba.length; i += 4) s += Math.abs(a.rgba[i] - b.rgba[i]) + Math.abs(a.rgba[i + 1] - b.rgba[i + 1]) + Math.abs(a.rgba[i + 2] - b.rgba[i + 2]); return s / (3 * a.W * a.H); };
async function pronto() {
  const t = Date.now(); let occ = [];
  while (Date.now() - t < ATTESA) { occ = await page.evaluate(() => window.__giro.occupato()); if (!occ.length) break; await dorme(250); }
  let a = await cattura(), d = Infinity;
  while (Date.now() - t < ATTESA) { await dorme(RAPIDO ? 400 : 700); const b = await cattura(); d = diffMedia(a, b); a = b; if (d < 1.5) return { f: a, ms: Date.now() - t, ok: !occ.length, occ, ferma: +d.toFixed(2) }; }
  if (!occ.length) occ = await page.evaluate(() => window.__giro.occupato());
  return { f: a, ms: Date.now() - t, ok: false, occ: occ.length ? occ : ['immagine non ferma'], ferma: Number.isFinite(d) ? +d.toFixed(2) : null };
}
const larghezza = () => page.evaluate(() => window.__giro.larghezza());

// ---------- un tratto: verso = -1 scende (andata), +1 sale (ritorno); `cursori`: per il ritorno, quelli dell'andata
const fotogrammi = [];
async function tratto(ind, verso, cursori) {
  const nome = verso < 0 ? 'andata' : 'ritorno', inizio = Date.now(); let w = await larghezza(), meta = Math.log10(w), fermi = 0, prima = null, cur = { x: 0.5, y: 0.5, chi: 'centro' }, k = 0, volato = false, persi = 0;
  const salva = async (fe) => {
    const f = fe.f, ind1 = indicatori(f), piccolo = dimezza(f), lsf = labSfocato(piccolo), st = await page.evaluate(() => window.__giro.stato()), W1 = await larghezza();
    const r = { indirizzo: ind.nome, tratto: nome, i: k, larghezza: W1, logW: W1 > 0 ? +Math.log10(W1).toFixed(3) : null, cursore: { x: +cur.x.toFixed(3), y: +cur.y.toFixed(3), chi: cur.chi }, stato: st.s, percorso: st.via, cosa: st.cosa, attesa: fe.ms, pronto: fe.ok, occupato: fe.occ, ferma: fe.ferma, t: Math.round((Date.now() - t0) / 1000), ...ind1 };
    if (prima && prima.lsf && r.larghezza > 0 && prima.larghezza > 0) { const grosso = r.larghezza > prima.larghezza ? lsf : prima.lsf, fine = grosso === lsf ? prima.lsf : lsf, c = verso < 0 ? cur : prima.cursore;
      const s = confronta(grosso, fine, Math.max(r.larghezza, prima.larghezza) / Math.min(r.larghezza, prima.larghezza), [c.x, c.y]); if (s) r.salto = { cambiata: +s.cambiata.toFixed(3), deltaE: +s.deltaE.toFixed(2), fattore: +s.fattore.toPrecision(3), dichiarato: +s.dichiarato.toPrecision(3), comune: +s.comune.toFixed(2) }; }
    r.file = `foto/${ind.nome}_${nome}_${String(k).padStart(3, '0')}.jpg`; writeFileSync(join(USCITA, r.file), Buffer.from(f.jpeg, 'base64'));
    fotogrammi.push(r); r.lsf = lsf; prima = r; k++;
    log(`${ind.nome} ${nome} ${String(k - 1).padStart(3)} W=${W1?.toExponential(2)} ${st.s.padEnd(22)} vuota=${ind1.vuota.toFixed(2)} dett=${ind1.dettaglio.toFixed(1)} salto=${r.salto ? r.salto.cambiata.toFixed(2) : '-'} macchie=${ind1.macchie} barre=${ind1.barre} ${fe.ok ? '' : `NON PRONTO (${fe.occ.join(', ')})`} ${cur.chi}`);
  };
  await salva(await pronto());
  while (Date.now() - inizio < TETTO_TRATTO) {
    meta = Math.round(meta / PASSO) * PASSO + verso * PASSO;
    if (verso < 0) cur = await page.evaluate(([v, m, p]) => window.__giro.mira(v, m, p), [ind.via, ind.mira, cur]);
    else if (cursori.length) { const lw = Math.log10(w); let m = cursori[0]; for (const c of cursori) if (Math.abs(c.logW - lw) < Math.abs(m.logW - lw)) m = c; cur = { ...m.cursore }; }
    const w0 = await larghezza(); const r = await page.evaluate(([dy, xy, meta, n]) => window.__giro.ruota(dy, xy, meta, n), [verso * 100, cur, meta, 48]); w = r.w;
    const fe = await pronto(); w = await larghezza();
    const cerca3D = verso < 0 && !volato && (await page.evaluate(() => !!window.__camera.mondo3d && !window.__giro.fisso));
    if (cerca3D && ((/perso/.test(cur.chi) ? ++persi : (persi = 0)) >= 3 || (fermi >= 1 && Math.abs(Math.log10(w / w0)) < 0.02))) {
      // LA RISERVA: nel 3D la meta dell'indirizzo non si trova più sullo schermo, o lo zoom non avanza: si vola all'indirizzo
      // con «vai a» dell'app (universo.js vaiA) e si riprende la discesa da lì. Il fotogramma dopo il volo è segnato «volo»
      // e il suo salto non si conta (il volo non è uno zoom).
      volato = true; persi = 0; fermi = 0; log(`${ind.nome} ${nome}: la meta non si raggiunge con la rotella (${cur.chi}, ${w?.toExponential(2)} m): volo con «vai a»`);
      await page.evaluate((v) => window.__camera.vaiA({ galassia: v.galassia, stella: v.stella, pianeta: v.pianeta }), ind.via);
      const tv = Date.now(); await dorme(1000); while (Date.now() - tv < 180000 && (await page.evaluate(() => { const C = window.__camera; return !!(C.mondo3d?.volo || C.universo3d?.inViaggio); }))) await dorme(1000);
      await page.evaluate(() => { window.__giro.fisso = null; }); cur = await page.evaluate(([v, m, p]) => window.__giro.mira(v, m, p), [ind.via, ind.mira, { x: 0.5, y: 0.5, chi: 'dopo il volo' }]);
      const fv = await pronto(); w = await larghezza(); meta = Math.log10(w); prima = null; await salva(fv); fotogrammi[fotogrammi.length - 1].volo = true; continue;
    }
    if (!(w > 0) || Math.abs(Math.log10(w / w0)) < 0.02) { if (++fermi >= 3) { log(`${ind.nome} ${nome}: la larghezza non cambia più (${w?.toExponential(2)} m): fine del tratto`); break; } meta = Math.log10(w || w0); continue; }
    fermi = 0; meta = Math.log10(w); await salva(fe);
    if (verso < 0 && FINO != null && meta <= FINO) { log(`${ind.nome} ${nome}: arrivati a 10^${FINO} m (--fino): fine del tratto`); break; }
  }
}

// ---------- la salita: dall'avvio in cima, al centro, senza foto
{ let w = await larghezza(), massimo = w, fermi = 0, n = 0; log(`salita da ${w?.toExponential(2)} m`);
  // (in cima la larghezza oscilla: si smette quando per tre raffiche di fila non supera di un 5 % la più grande vista)
  while (fermi < 3 && n < 150) { await page.evaluate(([xy]) => window.__giro.ruota(400, xy, 99, 20), [{ x: 0.5, y: 0.5 }]); await dorme(300); w = await larghezza(); n++; if (!(w > massimo * 1.05)) fermi++; else fermi = 0; if (w > massimo) massimo = w; if (n % 5 === 0) log(`  salita: ${w?.toExponential(2)} m, ${(await page.evaluate(() => window.__giro.stato())).via}`); }
  await pronto(); log(`in cima: ${(await larghezza())?.toExponential(2)} m, ${JSON.stringify(await page.evaluate(() => window.__giro.stato()))}`); }

for (const ind of INDIRIZZI) {
  await page.evaluate(() => { window.__giro.fisso = null; });
  log(`== ${ind.nome} ${JSON.stringify(ind.via)}: girato verso la galassia: ${await page.evaluate((v) => window.__giro.orienta(v), ind.via)}`); await dorme(1500);
  await tratto(ind, -1, []);
  const cursori = fotogrammi.filter((f) => f.indirizzo === ind.nome && f.tratto === 'andata' && f.logW != null);
  await tratto(ind, +1, cursori);
  // andata e ritorno alla stessa scala (entro mezzo passo)
  const rit = fotogrammi.filter((f) => f.indirizzo === ind.nome && f.tratto === 'ritorno' && f.logW != null);
  for (const a of cursori) { let m = null; for (const r of rit) if (!m || Math.abs(r.logW - a.logW) < Math.abs(m.logW - a.logW)) m = r; if (!m || Math.abs(m.logW - a.logW) > PASSO / 2 || !a.lsf || !m.lsf) continue;
    const grosso = m.larghezza > a.larghezza ? m.lsf : a.lsf, fine = grosso === m.lsf ? a.lsf : m.lsf, c = confronta(grosso, fine, Math.max(m.larghezza, a.larghezza) / Math.min(m.larghezza, a.larghezza), [a.cursore.x, a.cursore.y]);
    if (c) a.andataRitorno = { con: m.i, cambiata: +c.cambiata.toFixed(3), deltaE: +c.deltaE.toFixed(2), fattore: +c.fattore.toPrecision(3), statoRitorno: m.stato }; }
  for (const f of fotogrammi) delete f.lsf;
  scrivi();
}
function scrivi() {
  const ris = riassunto(fotogrammi);
  writeFileSync(join(USCITA, 'giro.json'), JSON.stringify({ quando: new Date().toISOString(), modo: RAPIDO ? 'rapido' : 'completo', passo: PASSO, attesaMassima: ATTESA, schermo: [W, H], soglie: SOGLIE, indirizzi: INDIRIZZI, errori: errori.slice(0, 20), fotogrammi: fotogrammi.map(({ lsf, ...f }) => f) }, null, 0));
  writeFileSync(join(USCITA, 'riassunto.json'), JSON.stringify(ris, null, 1)); writeFileSync(join(USCITA, 'riassunto.md'), riassuntoMd(ris));
  scriviProvini(USCITA, { fotogrammi: fotogrammi.map(({ lsf, ...f }) => f), riassunto: ris, soglie: SOGLIE, modo: RAPIDO ? 'rapido' : 'completo', passo: PASSO });
}
await browser.close(); server.close();
log(`fatto in ${((Date.now() - t0) / 60000).toFixed(1)} min: ${USCITA}/provini.html`); console.log(readFileSync(join(USCITA, 'riassunto.md'), 'utf8'));

