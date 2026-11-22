// sensibilita.mjs — LA SENSIBILITÀ GREZZA dei numeri a mano: uno alla volta, ±20%, sulle uscite di sensibilita_uscite.mjs.
// Nessun file dell'app si tocca: ogni filo lavora su una copia di src/ in una cartella temporanea, cambia UN numero (il
// letterale a file:riga:colonna, riscritto col valore ×0,8 o ×1,2), rifà le uscite in un processo nuovo e rimette il numero.
//
// IL CRITERIO DEI CANDIDATI (scritto prima di misurare, novembre 2026): i numeri di classe «a mano» (numeri_classi.mjs) che
// vengono ESEGUITI mentre si calcolano le uscite (la copertura di V8, una corsa per fase: gal, 217, terra), nei file che
// producono le uscite, con una quota per file (QUOTE qui sotto, 74 in tutto: i 100 previsti, tolti i numeri che non sono parametri). Nel file: prima i numeri con un nome (un
// parametro), poi i non interi, poi i più eseguiti. Esclusi: i numeri delle funzioni che scrivono testi o colori
// (FUORI), i quasi-uno (|x−1| < 0,01: limiti di sicurezza come 0,999), i passi di integrazione (nome h, dt).
// LA MISURA: per ogni uscita o, Δ = max(|o(+20%) − o₀|, |o(−20%) − o₀|) / |o₀| (sui lati misurati), divisa per 0,2: è l'elasticità (1 = l'uscita
// si sposta quanto il numero). L'influenza di un numero è la più grande tra le uscite. Una corsa che si rompe (errore,
// NaN, tempo scaduto) si segna «rompe» e conta come influenza massima.
//
// uso: node strumenti/misure/sensibilita.mjs [--uscita cartella] [--fili 3] [--copertura cartella] [--quanti 74] [--lati 1.2] [--riprendi]
//   → sensibilita.json, sensibilita.csv (una riga per numero: le Δ per uscita, l'influenza)
//   (--copertura: una cartella con cov_gal, cov_217, cov_terra già fatte da NODE_V8_COVERAGE; senza, si rifanno)
import { readFileSync, writeFileSync, appendFileSync, mkdirSync, readdirSync, cpSync, rmSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { tmpdir } from 'node:os';

const QUI = dirname(fileURLToPath(import.meta.url)), RADICE = resolve(join(QUI, '..', '..')), SRC = join(RADICE, 'src');
const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > 0 ? process.argv[i + 1] : d; };
const USCITA = resolve(arg('uscita', join(QUI, 'esiti'))); mkdirSync(USCITA, { recursive: true });
const FILI = +arg('fili', 3), QUANTI = +arg('quanti', 74), TEMPO = 900e3, USCITE = join(QUI, 'sensibilita_uscite.mjs'), FASI = ['gal', '217', 'terra'];
const QUOTE = { 'camera/mare.js': 24, 'camera/geologia.js': 10, 'camera/storia.js': 8, 'camera/galassie.js': 8, 'camera/tettonica.js': 6, 'camera/meteo.js': 6, 'camera/leggi.js': 6, 'camera/disco.js': 4, 'camera/stelle.js': 2 };
const FUORI = new Set(['descrivi', 'scheda', 'xyzNero', 'gammaSRGB', 'occhioCIE', 'lonDi', 'colore', 'coloreMare', 'nome']);
const corri = (args, env = {}) => new Promise((ok) => execFile(process.execPath, args, { timeout: TEMPO, maxBuffer: 1 << 24, env: { ...process.env, ...env } }, (e, so) => {
  try { ok(JSON.parse(String(so).trim().split('\n').pop())); } catch { ok({ errore: e ? String(e.message).slice(0, 120) : 'uscita illeggibile' }); } }));
const base = (o) => Object.fromEntries(Object.entries(o).filter(([k]) => k !== 'ms'));

// ---------- 1. la copertura, una corsa per fase
const COP = resolve(arg('copertura', join(USCITA, 'copertura')));
if (!FASI.every((f) => existsSync(join(COP, `cov_${f}`)))) await Promise.all(FASI.map((f) => corri([USCITE, SRC, f], { NODE_V8_COVERAGE: join(COP, `cov_${f}`) })));
const coperture = FASI.map((f) => { const d = join(COP, `cov_${f}`), m = new Map(); for (const n of readdirSync(d)) for (const s of JSON.parse(readFileSync(join(d, n), 'utf8')).result) { const i = s.url.indexOf('/src/'); if (i > 0 && s.url.startsWith('file://')) m.set(s.url.slice(i + 5), s.functions.flatMap((x) => x.ranges)); } return m; });
const inizi = new Map(); const offset = (f, riga, colonna) => { if (!inizi.has(f)) { const t = readFileSync(join(SRC, f), 'utf8'), a = [0]; for (let i = 0; i < t.length; i++) if (t[i] === '\n') a.push(i + 1); inizi.set(f, a); } return inizi.get(f)[riga - 1] + colonna - 1; };
const eseguito = (f, off) => FASI.filter((_, q) => { const rr = coperture[q].get(f); if (!rr) return false; let b = null; for (const r of rr) if (r.startOffset <= off && off < r.endOffset && (!b || r.endOffset - r.startOffset <= b.endOffset - b.startOffset)) b = r; return b && b.count > 0; });

// ---------- 2. i candidati
const csvClassi = join(USCITA, 'numeri_classi.csv');
if (!existsSync(csvClassi)) await corri([join(QUI, 'numeri_classi.mjs'), '--uscita', USCITA]);
const righe = readFileSync(csvClassi, 'utf8').split('\n').slice(1).filter(Boolean).map((l) => { const c = []; let s = '', q = false; for (const x of l) { if (q) { if (x === '"') q = false; else s += x; } else if (x === '"') q = true; else if (x === ',') { c.push(s); s = ''; } else s += x; } c.push(s); return c; });
// (colonne: file, riga, colonna, testo, valore, classe, regola, grezza, unità, funzione, nome, noto, contesto)
const candidati = [];
for (const [f, quota] of Object.entries(QUOTE)) {
  const c = righe.filter((r) => r[0] === f && r[5] === 'a mano' && !/n$/.test(r[3]) && !FUORI.has(r[9]) && Math.abs(Math.abs(+r[4]) - 1) >= 0.01 && !/^(h|dt)$/.test(r[10]))
    .map((r) => ({ file: f, riga: +r[1], colonna: +r[2], testo: r[3], valore: +r[4], funzione: r[9], nome: r[10], contesto: r[12], off: offset(f, +r[1], +r[2]) }))
    .map((x) => ({ ...x, fasi: eseguito(f, x.off) })).filter((x) => x.fasi.length);
  c.sort((a, b) => (b.nome !== '') - (a.nome !== '') || /[.e]/.test(b.testo) - /[.e]/.test(a.testo));
  candidati.push(...c.slice(0, quota));
}
candidati.splice(QUANTI);

// ---------- 3. le corse: la base, poi un numero alla volta
// DUE LIVELLI, perché la superficie costa (≈ 25 s di CPU per pianeta, molte volte di più su una macchina carica):
//  · «pian»: il cosmo e il sistema (la luce delle galassie, la pressione e la temperatura del 217), pochi secondi: a ±20% per tutti;
//  · «217» e «terra», con la superficie, il clima, l'erosione e il mare: solo a +20% (--lati), e solo per i file della catena
//    superficie–clima (SUPERFICIE); per «terra», solo se il numero è eseguito sulla Terra di prova (la copertura).
//  · i numeri di mare.js: un filo a parte, che rifà solo mare() a ±20% (sensibilita_uscite.mjs, modo «mare»).
const SUPERFICIE = new Set(['camera/geologia.js', 'camera/tettonica.js', 'camera/meteo.js', 'camera/storia.js', 'camera/leggi.js']);
const cartellaMare = join(tmpdir(), `sensibilita_${process.pid}_mare`); rmSync(cartellaMare, { recursive: true, force: true }); cpSync(SRC, join(cartellaMare, 'src'), { recursive: true });
const cartelle = Array.from({ length: FILI }, (_, k) => { const d = join(tmpdir(), `sensibilita_${process.pid}_${k}`); rmSync(d, { recursive: true, force: true }); cpSync(SRC, join(d, 'src'), { recursive: true }); return d; });
// --riprendi: la base e le corse già fatte (sensibilita_base.json, sensibilita_corse.jsonl, sensibilita_mare.json.esiti) non si rifanno
const RIPRENDI = process.argv.includes('--riprendi'), LATI = arg('lati', '1.2').split(',').map(Number), fBase = join(USCITA, 'sensibilita_base.json'), fCorse = join(USCITA, 'sensibilita_corse.jsonl'), fMare = join(USCITA, 'sensibilita_mare.json');
const o0 = RIPRENDI && existsSync(fBase) ? JSON.parse(readFileSync(fBase, 'utf8')) : {};
if (!Object.keys(o0).length) { for (const o of await Promise.all(FASI.map((f, q) => corri([USCITE, join(cartelle[q % FILI], 'src'), f])))) Object.assign(o0, base(o)); writeFileSync(fBase, JSON.stringify(o0)); }
console.log('base', JSON.stringify(o0));
if (!RIPRENDI) { rmSync(fCorse, { force: true }); rmSync(fMare + '.esiti', { force: true }); }
const giaFatte = new Set(), unisci = (v) => { const c = candidati.find((x) => x.file === v.file && x.riga === v.riga && x.colonna === v.colonna); if (!c) return; c[v.k] = { ...(c[v.k] || {}), ...v.o }; for (const f of v.fasi || ['pian', '217', 'terra', 'mare']) giaFatte.add(`${v.file}:${v.riga}:${v.colonna}:${v.k}:${f}`); };
for (const f of [fCorse, fMare + '.esiti']) if (existsSync(f)) for (const l of readFileSync(f, 'utf8').split('\n').filter(Boolean)) unisci(JSON.parse(l));
const daFare = (c, k, f) => !giaFatte.has(`${c.file}:${c.riga}:${c.colonna}:${k}:${f}`);
const lavori = [];
for (const c of candidati) { if (c.file === 'camera/mare.js') continue;
  for (const k of [0.8, 1.2]) if (daFare(c, k, 'pian')) lavori.push({ c, k, fasi: ['pian'] });
  if (SUPERFICIE.has(c.file)) for (const k of LATI) { const fasi = ['217', ...(c.fasi.includes('terra') ? ['terra'] : [])].filter((f) => daFare(c, k, f)); if (fasi.length) lavori.push({ c, k, fasi }); } }
lavori.sort((a, b) => a.fasi.length - b.fasi.length || (a.fasi[0] === 'pian' ? -1 : 1)); // (prima i veloci)
const diMare = candidati.filter((c) => c.file === 'camera/mare.js' && (daFare(c, 0.8, 'mare') || daFare(c, 1.2, 'mare'))); let fatti = 0; const t0 = Date.now(), totale = lavori.length;
const filoMare = (async () => { if (!diMare.length) return; // (una copia a parte: le copie di mare.js si scrivono accanto a lei, non in src/) writeFileSync(fMare, JSON.stringify(diMare.flatMap((c) => [0.8, 1.2].filter((k) => daFare(c, k, 'mare')).map((k) => ({ file: c.file, riga: c.riga, colonna: c.colonna, testo: c.testo, valore: c.valore, off: c.off, k })))));
  const so = await new Promise((ok) => execFile(process.execPath, [USCITE, join(cartellaMare, 'src'), 'mare', fMare], { timeout: 8 * TEMPO, maxBuffer: 1 << 26 }, (e, x) => ok(String(x || ''))));
  const [testa, ...voci] = so.trim().split('\n').filter(Boolean).map((l) => JSON.parse(l)); console.log('mare, base nel filo:', JSON.stringify(testa));
  for (const v of voci) unisci({ ...v, fasi: ['mare'] }); })();
async function filo(d) {
  for (let l; (l = lavori.shift());) {
    const p = join(d, 'src', l.c.file), orig = readFileSync(p, 'utf8'), t = l.c.testo.replace(/^-/, ''), nuovo = String(+(Math.abs(l.c.valore) * l.k).toPrecision(12));
    if (orig.slice(l.c.off, l.c.off + t.length) !== t) { console.log('il testo non torna', l.c.file, l.c.riga, l.c.colonna, l.c.testo); continue; }
    writeFileSync(p, orig.slice(0, l.c.off) + nuovo + orig.slice(l.c.off + t.length));
    const o = {}; for (const f of l.fasi) Object.assign(o, base(await corri([USCITE, join(d, 'src'), f])));
    writeFileSync(p, orig); const v = { file: l.c.file, riga: l.c.riga, colonna: l.c.colonna, k: l.k, fasi: l.fasi, o }; unisci(v); appendFileSync(fCorse, JSON.stringify(v) + '\n'); fatti++;
    console.log(`${fatti}/${totale} ${l.c.file}:${l.c.riga} ×${l.k} ${l.fasi.join('+')} ${((Date.now() - t0) / 60e3).toFixed(1)} min`);
  }
}
await Promise.all([...cartelle.map(filo), filoMare]);
for (const d of [...cartelle, cartellaMare]) rmSync(d, { recursive: true, force: true });

// ---------- 4. la misura
// IL RIMESCOLAMENTO: un numero a monte del pianeta (le galassie, il disco, la funzione di massa iniziale) può cambiare QUALE
// pianeta sta all'indirizzo 217: allora le sue uscite non sono una sensibilità ma un altro mondo. Lo si riconosce dalla
// massa del pianeta (più del 5% di differenza, o il pianeta che manca): il numero si segna «rimescola» e le uscite del 217
// non entrano nella sua influenza (restano scritte a parte, in delta217).
const NOMI = Object.keys(o0).filter((k) => typeof o0[k] === 'number' && k !== 'nGal' && k !== 'p217_massa');
const scarto = (v, n) => (typeof v === 'number' && isFinite(v) ? Math.abs(v - o0[n]) / Math.abs(o0[n] || 1) / 0.2 : Infinity);
for (const c of candidati) {
  c.delta = {}; c.delta217 = {}; c.rompe = [];
  c.rimescola = [0.8, 1.2].some((k) => c[k] && ('p217_massa' in c[k] || 'p217_errore' in c[k]) && !(Math.abs(c[k].p217_massa / o0.p217_massa - 1) <= 0.05));
  for (const k of [0.8, 1.2]) { const o = c[k] || {}; for (const n of Object.keys(o)) if (/errore/.test(n) && !(c.rimescola && n.startsWith('p217'))) c.rompe.push(`×${k}: ${o[n]}`); }
  for (const n of NOMI) { let m = 0, visto = false; for (const k of [0.8, 1.2]) { const o = c[k]; if (!o || !(n in o || Object.keys(o).some((x) => x.startsWith(n.split('_')[0]) && /errore/.test(x)))) continue; visto = true; m = Math.max(m, scarto(o[n], n)); }
    if (visto) (c.rimescola && n.startsWith('p217') ? c.delta217 : c.delta)[n] = m; }
  const v = Object.entries(c.delta).sort((a, b) => b[1] - a[1]); c.influenza = c.rompe.length ? Infinity : v.length ? v[0][1] : 0; c.uscitaPiuMossa = c.rompe.length ? 'rompe' : v[0]?.[0] || '';
  c.lati = [0.8, 1.2].filter((k) => c[k]).join(' ');
}
candidati.sort((a, b) => b.rimescola - a.rimescola || b.influenza - a.influenza);
writeFileSync(join(USCITA, 'sensibilita.json'), JSON.stringify({ criterio: 'vedi la testa di sensibilita.mjs', base: o0, candidati: candidati.map(({ off, ...c }) => c) }, null, 1));
const csv = (v) => { const s = String(v ?? ''); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
writeFileSync(join(USCITA, 'sensibilita.csv'), [['file', 'riga', 'colonna', 'testo', 'funzione', 'nome', 'lati', 'rimescola il 217', 'influenza', 'uscita più mossa', ...NOMI, 'rompe', 'contesto'].join(','),
  ...candidati.map((c) => [c.file, c.riga, c.colonna, c.testo, c.funzione, c.nome, c.lati, c.rimescola ? 'sì' : '', isFinite(c.influenza) ? c.influenza.toFixed(4) : 'rompe', c.uscitaPiuMossa, ...NOMI.map((n) => { const x = c.delta[n] ?? c.delta217[n]; return x === undefined ? '' : (isFinite(x) ? x.toFixed(4) : 'inf') + (n in c.delta217 ? ' (rimescolato)' : ''); }), c.rompe.join(' · '), c.contesto].map(csv).join(','))].join('\n') + '\n');
console.log(join(USCITA, 'sensibilita.csv'));
