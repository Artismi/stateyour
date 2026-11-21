// numeri.mjs — I NUMERI MESSI A MANO: scansione statica di src/ (escluso src/pattern/) dei numeri letterali nel codice.
// Ogni numero non banale è classificato così:
//   · «fonte»: c'è una fonte vicina (sulla stessa riga o nelle tre sopra): un autore con l'anno («Kroupa 2001», «Cowan e
//     Abbot 2014», «et al.»), la parola Fonte, un link o un DOI/arXiv, un catalogo noto (NIST, CODATA, IAU, USGS, splib),
//     un rimando a grandezze.js o alle tabelle (stelle_tabella.js, «tabella»);
//   · «unità»: senza fonte, ma con l'unità accanto (nel commento della stessa riga, o nel nome a cui è assegnato: latoM,
//     massaKg, …);
//   · «niente»: né l'una né l'altra.
// BANALI, esclusi (scritti una volta): 0, 1, 2, 0,5 (e i loro opposti); le potenze di dieci esatte (unità: 1e-9 per i nm,
//   1000 per i km); gli interi negli indici (dentro [ ] dopo un nome, una ) o una ]); gli interi nelle dimensioni degli array
//   (new Float32Array(…), Array(…), .fill/.slice/.subarray/.padStart); gli interi dopo un operatore di bit (>>, <<, >>>, &,
//   |, ^) e gli esadecimali (maschere e costanti di hash); in src/visore/ i colori dell'interfaccia (liste di 3–4 interi
//   tra 0 e 255).
// NOTI: segnati se il numero è già in grandezze.js (NUMERI_CON_FONTE, per il suo motivo; SOGLIE, per la riga che cercano)
//   o se la sua riga (±2) è citata in reports/Scelte a mano nella vista.md.
// uso: npm run numeri [-- --uscita cartella]   → numeri.csv (il registro), numeri.md (per file e il totale)
import { readFileSync, writeFileSync, readdirSync, statSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join, relative, resolve, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const QUI = dirname(fileURLToPath(import.meta.url)), RADICE = resolve(join(QUI, '..', '..')), SRC = join(RADICE, 'src');
const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > 0 ? process.argv[i + 1] : d; };
const USCITA = resolve(arg('uscita', join(QUI, 'esiti'))); mkdirSync(USCITA, { recursive: true });

// ---------- i file
const file = []; (function giro(d) { for (const n of readdirSync(d)) { const p = join(d, n), r = relative(SRC, p); if (r === 'pattern' || r.startsWith('pattern/') || r.startsWith('tre/prove/schermate')) continue; const s = statSync(p); if (s.isDirectory()) giro(p); else if (/\.(m?js)$/.test(n)) file.push(p); } })(SRC);

// ---------- un lessico minimo di JavaScript: commenti, stringhe, modelli, espressioni regolari, numeri
const PAROLE_PRIMA_DI_REGEX = new Set(['return', 'typeof', 'instanceof', 'in', 'of', 'new', 'delete', 'void', 'throw', 'case', 'do', 'else', 'yield', 'await']);
function lessico(testo) {
  const out = [], n = testo.length; let i = 0, riga = 1, ultimo = null; const pila = []; // pila: profondità delle graffe dentro ${ }
  const prima = (t) => { ultimo = t; };
  while (i < n) {
    const c = testo[i];
    if (c === '\n') { riga++; i++; continue; }
    if (c === ' ' || c === '\t' || c === '\r') { i++; continue; }
    if (c === '/' && testo[i + 1] === '/') { const f = testo.indexOf('\n', i); const fine = f < 0 ? n : f; out.push({ t: 'commento', v: testo.slice(i, fine), riga }); i = fine; continue; }
    if (c === '/' && testo[i + 1] === '*') { const f = testo.indexOf('*/', i + 2), fine = f < 0 ? n : f + 2, v = testo.slice(i, fine); out.push({ t: 'commento', v, riga }); riga += (v.match(/\n/g) || []).length; i = fine; continue; }
    if (c === '"' || c === "'") { let j = i + 1; while (j < n && testo[j] !== c) { if (testo[j] === '\\') j++; if (testo[j] === '\n') riga++; j++; } prima({ t: 'stringa' }); i = j + 1; continue; }
    if (c === '`' || (c === '}' && pila.length && pila[pila.length - 1] === 0)) { // un modello, o il seguito dopo ${ … }
      if (c === '}') pila.pop(); let j = i + 1;
      while (j < n && testo[j] !== '`') { if (testo[j] === '\\') { j += 2; continue; } if (testo[j] === '$' && testo[j + 1] === '{') break; if (testo[j] === '\n') riga++; j++; }
      if (testo[j] === '$') { pila.push(0); i = j + 2; prima({ t: 'punto', v: '(' }); continue; } prima({ t: 'stringa' }); i = j + 1; continue; }
    if (c === '{') { if (pila.length) pila[pila.length - 1]++; prima({ t: 'punto', v: c }); i++; continue; }
    if (c === '}') { if (pila.length) pila[pila.length - 1]--; prima({ t: 'punto', v: c }); i++; continue; }
    if (c === '/') { // divisione o espressione regolare?
      const regex = !ultimo || (ultimo.t === 'punto' && !/[)\]}]/.test(ultimo.v)) || (ultimo.t === 'parola' && PAROLE_PRIMA_DI_REGEX.has(ultimo.v));
      if (regex) { let j = i + 1, classe = false; while (j < n && testo[j] !== '\n') { const d = testo[j]; if (d === '\\') { j += 2; continue; } if (d === '[') classe = true; else if (d === ']') classe = false; else if (d === '/' && !classe) break; j++; } j++; while (/[a-z]/i.test(testo[j] || '')) j++; prima({ t: 'stringa' }); i = j; continue; }
      prima({ t: 'punto', v: '/' }); i++; continue; }
    const m = /^(?:0[xX][0-9a-fA-F_]+n?|0[bB][01_]+n?|0[oO][0-7_]+n?|(?:\d[\d_]*\.?[\d_]*|\.\d[\d_]*)(?:[eE][+-]?\d+)?n?)/.exec(testo.slice(i, i + 40));
    if (/[0-9]/.test(c) || (c === '.' && /[0-9]/.test(testo[i + 1] || ''))) { const v = m[0]; const tok = { t: 'numero', v, riga, col: i, prima: ultimo }; out.push(tok); prima(tok); i += v.length; continue; }
    const p = /^[A-Za-z_$À-￿][\w$À-￿]*/.exec(testo.slice(i, i + 80)); if (p) { prima({ t: 'parola', v: p[0] }); out.push({ t: 'parola', v: p[0], riga, col: i }); i += p[0].length; continue; }
    const o = /^(?:>>>=?|>>=?|<<=?|===|!==|\*\*=?|\?\?=?|&&=?|\|\|=?|=>|[-+*%&|^!<>=]=?|\?\.|\.\.\.|[()[\];,.:?~])/.exec(testo.slice(i, i + 4)); const v = o ? o[0] : c; const tok = { t: 'punto', v, riga, col: i }; out.push(tok); prima(tok); i += v.length;
  }
  return out;
}

// ---------- i noti
const G = await import(join(SRC, 'camera/grandezze.js'));
const conFonte = G.NUMERI_CON_FONTE || [], soglie = (G.SOGLIE || []).filter((s) => s.dove && s.dove.cerca);
const scelte = new Map(); // basename → insieme di righe citate
{ const p = join(RADICE, 'reports', 'Scelte a mano nella vista.md'), alt = '/home/user/stateyour/reports/Scelte a mano nella vista.md', testo = existsSync(p) ? readFileSync(p, 'utf8') : existsSync(alt) ? readFileSync(alt, 'utf8') : '';
  // `file.js:120`, `file.js:120-125`, e i seguiti `:130` dopo un file
  const re = /([a-z_0-9]+\.(?:m?js))?:(\d+)(?:[-–](\d+))?/g; let corrente = null, m;
  for (const pezzo of testo.split('`')) { while ((m = re.exec(pezzo))) { if (m[1]) corrente = m[1]; if (!corrente) continue; const a = +m[2], b = m[3] ? +m[3] : a; if (!scelte.has(corrente)) scelte.set(corrente, new Set()); for (let r = a; r <= Math.min(b, a + 40); r++) scelte.get(corrente).add(r); } re.lastIndex = 0; } }

// ---------- la scansione
const valore = (v) => { const s = v.replace(/_/g, '').replace(/n$/, ''); return /^0[xX]/.test(s) ? parseInt(s, 16) : /^0[bB]/.test(s) ? parseInt(s.slice(2), 2) : /^0[oO]/.test(s) ? parseInt(s.slice(2), 8) : Number(s); };
const potenzaDiDieci = (x) => x > 0 && Math.abs(Math.log10(x) - Math.round(Math.log10(x))) < 1e-12;
const FONTE = /\b(fonte|fonti|source)\b|https?:\/\/|\bdoi\b|10\.\d{4,}\/|arxiv|\bNIST\b|CODATA|\bIAU\b|USGS|splib|grandezze\.js|NUMERI_CON_FONTE|stelle_tabella|tabell[ae]|\b[A-ZÀ-Ü][a-zà-ü'’-]+(?:\s+(?:e|ed|and|&)\s+[A-ZÀ-Ü][a-zà-ü'’-]+|\s+e\s+altri|\s+et\s+al\.?|\s+e\s+coll\.?)?,?\s*\(?(?:1[6-9]|20)\d\d[a-z]?\b/;
const UNITA = /(?:^|[\s(·×/0-9])(?:m|km|cm|mm|µm|μm|nm|pm|fm|Å|s|ms|µs|ns|h|K|°C|°|Pa|hPa|MPa|GPa|bar|atm|kg|g|t|J|kJ|W|eV|keV|MeV|GeV|mol|kpc|pc|Mpc|Gpc|UA|AU|anni|Ma|Ga|Myr|Gyr|M☉|L☉|R☉|Hz|ppm|ppb|%|‰|rad|sr|mag|cd|lm|lx|ohm|V|A|T|N|C|L|ml|psu|g\/kg|mol\/kg|m\/s|km\/s|m²|m³|kg\/m³|g\/cm³|W\/m²|J\/kg|J\/mol|K\/km|mm\/a|m\/Ma|cd\/m²)(?=$|[\s,;:.)·/²³⁻¹])/;
const SUFFISSO_UNITA = /(?:M|Km|Cm|Mm|Nm|Kg|Pa|Bar|Ma|Ga|Anni|Anno|K|Gradi|Rad|Sec|S|Ms|Hz|Ev|Kev|Mev|J|W|Pc|Kpc|Ua|Ppm)$/;
const righeCsv = [['file', 'riga', 'colonna', 'testo', 'valore', 'classe', 'noto', 'contesto']], perFile = new Map();
let banali = 0;
for (const f of file) {
  const r = relative(SRC, f), testo = readFileSync(f, 'utf8'), righe = testo.split('\n'), T = lessico(testo), base = basename(f), visore = r.startsWith('visore/');
  const generato = /\bGENERAT[OA]\b/.test(righe.slice(0, 5).join('\n')); // (una tabella scritta da un programma: i suoi numeri sono calcolati, non messi a mano)
  const commentiPerRiga = new Map(); for (const t of T) if (t.t === 'commento') { const v = t.v.split('\n'); v.forEach((x, k) => commentiPerRiga.set(t.riga + k, (commentiPerRiga.get(t.riga + k) || '') + ' ' + x)); }
  const conta = { fonte: 0, 'unità': 0, niente: 0, noti: 0, generato: 0 };
  // il contesto delle parentesi: per ogni token, che cosa ha aperto la parentesi in cui sta
  const apre = []; const ctx = new Array(T.length);
  for (let k = 0; k < T.length; k++) { const t = T[k]; if (t.t === 'commento') continue; if (t.t === 'punto' && (t.v === '(' || t.v === '[')) { let p = k - 1; while (p >= 0 && T[p].t === 'commento') p--; const pp = T[p], pq = T[p - 1];
      let tipo = 'altro'; if (t.v === '[' && pp && (pp.t === 'parola' || pp.v === ')' || pp.v === ']') && !(pp.t === 'parola' && PAROLE_PRIMA_DI_REGEX.has(pp.v))) tipo = 'indice';
      else if (t.v === '[') tipo = 'lista'; else if (pp && pp.t === 'parola' && (/^(?:Float32|Float64|Uint8|Uint8Clamped|Int8|Int16|Uint16|Int32|Uint32|BigInt64|BigUint64)?Array$/.test(pp.v) || /^(fill|slice|subarray|padStart|padEnd|toFixed|toPrecision|toExponential|splice|substr|substring|charCodeAt|at|repeat)$/.test(pp.v))) tipo = 'dimensione';
      apre.push({ tipo, k }); }
    else if (t.t === 'punto' && (t.v === ')' || t.v === ']')) apre.pop();
    ctx[k] = apre.length ? apre[apre.length - 1] : null; }
  for (let k = 0; k < T.length; k++) {
    const t = T[k]; if (t.t !== 'numero') continue;
    let p = k - 1; while (p >= 0 && T[p].t === 'commento') p--; const pr = T[p];
    const meno = pr && pr.t === 'punto' && pr.v === '-' && (() => { let q = p - 1; while (q >= 0 && T[q].t === 'commento') q--; const a = T[q]; return !a || (a.t === 'punto' && !/[)\]}]/.test(a.v)) || (a.t === 'parola' && PAROLE_PRIMA_DI_REGEX.has(a.v)); })();
    const x = (meno ? -1 : 1) * valore(t.v), ax = Math.abs(x), intero = Number.isInteger(x), c = ctx[k];
    let banale = ax === 0 || ax === 1 || ax === 2 || ax === 0.5 || potenzaDiDieci(ax) || /^0[xXbBoO]/.test(t.v)
      || (intero && c && (c.tipo === 'indice' || c.tipo === 'dimensione'))
      || (intero && pr && pr.t === 'punto' && /^(>>>?|<<|&|\||\^)=?$/.test(pr.v));
    if (!banale && visore && intero && ax <= 255 && c && c.tipo === 'lista') { // un colore: una lista di 3–4 interi tra 0 e 255
      let q = c.k + 1, n = 0, ok = true; for (; q < T.length && !(T[q].t === 'punto' && T[q].v === ']'); q++) { if (T[q].t === 'numero') { n++; const y = valore(T[q].v); if (!Number.isInteger(y) || y > 255) ok = false; } else if (!(T[q].t === 'punto' && (T[q].v === ',' || T[q].v === '-')) && T[q].t !== 'commento') ok = false; }
      if (ok && n >= 3 && n <= 4) banale = true; }
    if (banale) { banali++; continue; }
    // (in una tabella, una lista di almeno 8 numeri, la fonte può stare nelle 6 righe sopra l'inizio della lista)
    let inizio = t.riga; if (c && c.tipo === 'lista') { let q = c.k + 1, n = 0; for (; q < T.length && n < 8 && !(T[q].t === 'punto' && T[q].v === ']'); q++) if (T[q].t === 'numero') n++; if (n >= 8) inizio = T[c.k].riga - 3; }
    const vicino = [0, 1, 2, 3].map((d) => commentiPerRiga.get(t.riga - d) || '').concat([0, 1, 2, 3].map((d) => (inizio < t.riga ? commentiPerRiga.get(inizio - d) || '' : ''))).join(' ');
    const stessa = commentiPerRiga.get(t.riga) || '', lineaCodice = righe[t.riga - 1] || '';
    let assegnato = null; for (let q = p; q >= Math.max(0, p - 3); q--) { if (T[q].t === 'punto' && (T[q].v === '=' || T[q].v === ':')) { const a = T[q - 1]; if (a && a.t === 'parola') assegnato = a.v; break; } if (T[q].t === 'punto' && /[;,{(]/.test(T[q].v)) break; }
    const classe = generato ? 'generato' : FONTE.test(vicino) ? 'fonte' : UNITA.test(stessa) || (assegnato && SUFFISSO_UNITA.test(assegnato) && /[a-z]/.test(assegnato)) ? 'unità' : 'niente';
    const noti = [];
    for (const g of conFonte) if (g.motivo && g.motivo.test(t.v.replace(/_/g, ''))) noti.push(`grandezze.js: ${g.nome}`);
    for (const s of soglie) if (s.dove.modulo === base && lineaCodice.includes(s.dove.cerca)) noti.push(`grandezze.js SOGLIE (${s.specie})`);
    const sc = scelte.get(base); if (sc && [-2, -1, 0, 1, 2].some((d) => sc.has(t.riga + d))) noti.push('Scelte a mano nella vista');
    conta[classe]++; if (noti.length) conta.noti++;
    if (classe !== 'generato') righeCsv.push([r, t.riga, t.col - testo.lastIndexOf('\n', t.col - 1), (meno ? '-' : '') + t.v, x, classe, noti.join(' · '), lineaCodice.trim().slice(0, 60)]); // (le tabelle generate solo contate: il registro resta leggero)
  }
  perFile.set(r, conta);
}

// ---------- le uscite
const csv = (v) => { const s = String(v ?? ''); return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
writeFileSync(join(USCITA, 'numeri.csv'), righeCsv.map((r) => r.map(csv).join(',')).join('\n') + '\n');
const tot = { fonte: 0, 'unità': 0, niente: 0, noti: 0, generato: 0 }; for (const c of perFile.values()) for (const k in tot) tot[k] += c[k];
const ordinati = [...perFile].filter(([, c]) => c.fonte + c['unità'] + c.niente + c.generato > 0).sort((a, b) => b[1].niente - a[1].niente);
const nienteNoti = righeCsv.slice(1).filter((r) => r[5] === 'niente' && r[6]).length;
const md = ['# I numeri messi a mano', '', `Scansione di \`src/\` (escluso \`src/pattern/\`): ${file.length} file, ${tot.fonte + tot['unità'] + tot.niente + tot.generato} numeri non banali (${banali} banali esclusi), di cui ${tot.generato} in tabelle generate da un programma (calcolati, non messi a mano: contati a parte).`, '',
  `**Totale: ${tot.fonte} con fonte vicina, ${tot['unità']} con unità, ${tot.niente} senza niente.** Già noti (grandezze.js o «Scelte a mano nella vista»): ${tot.noti}, di cui ${nienteNoti} tra quelli senza niente.`, '',
  'Il registro completo, numero per numero, è in `numeri.csv` (file, riga, colonna, testo, valore, classe, noto, la riga di codice).', '',
  '| file | senza niente | con unità | con fonte | già noti | generati |', '|---|---:|---:|---:|---:|---:|', ...ordinati.map(([f, c]) => `| ${f} | ${c.niente} | ${c['unità']} | ${c.fonte} | ${c.noti} | ${c.generato} |`),
  `| **totale** | **${tot.niente}** | **${tot['unità']}** | **${tot.fonte}** | **${tot.noti}** | **${tot.generato}** |`];
writeFileSync(join(USCITA, 'numeri.md'), md.join('\n') + '\n');
console.log(md.slice(0, 5).join('\n')); console.log('i file con più numeri senza niente:'); for (const [f, c] of ordinati.slice(0, 10)) console.log(`  ${f}: ${c.niente} senza niente, ${c['unità']} con unità, ${c.fonte} con fonte`);
console.log(join(USCITA, 'numeri.md'));
