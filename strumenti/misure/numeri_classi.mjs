// numeri_classi.mjs — LA CLASSIFICAZIONE FINE dei numeri messi a mano. Parte dal registro di numeri.mjs (numeri.csv: ogni
// numero non banale di src/, con la sua classe grezza fonte/unità/niente) e lo divide in cinque classi, con regole scritte
// qui una volta (prima di vedere i conteggi, novembre 2026):
//   · «costante»: una costante fisica o matematica nota (CODATA, IAU, π, i gradi del giro, i secondi del giorno…), che
//     dovrebbe venire da leggi.js/unita.js o dal registro (grandezze.js NUMERI_CON_FONTE) invece di essere riscritta;
//   · «legge»: un parametro di legge con una fonte vera, cioè un autore con l'anno (o un DOI/arXiv/link/catalogo) sulla
//     stessa riga, nelle tre sopra o nel blocco di commento subito sopra (fino a 15 righe). NON valgono come fonte: le date del progetto (anni ≥ 2025, «novembre 2026»), i rimandi
//     generici a una «tabella» o a grandezze.js, una parola maiuscola qualunque col numero di un anno;
//   · «tabella»: un dato misurato in una tabella (una lista di almeno 8 numeri, o le proprietà di un elemento/minerale/ione
//     in un oggetto con molte voci) senza fonte vera vicina: non è una scelta a mano, ma la fonte manca;
//   · «tecnico»: un numero innocuo per la fisica: colori e misure dell'interfaccia (px, font, alfa, rgb), tempi
//     dell'interfaccia (ms, setTimeout), dimensioni di griglie e di campioni (potenze di due, W/H/N/lato/passi/giri),
//     numero di iterazioni e limiti dei cicli, tolleranze numeriche (|x| ≤ 1e-6 senza unità), arrotondamenti della stampa
//     (toFixed, Math.round(x·100)/100), semi e costanti di hash, i numeri che il commento dice «numerici»; tutto src/visore/
//     salvo dove c'è una legge;
//   · «a mano»: il resto, cioè i veri parametri fisici scelti a mano (con o senza unità accanto: la colonna «unità» lo dice).
// Le regole sono grezze e dichiarate: servono a ordinare il lavoro, non a dare un verdetto sul singolo numero. Ogni riga
// del registro porta la regola che l'ha classificata, così un errore si trova e si corregge qui.
// uso: node strumenti/nodo.cjs strumenti/misure/numeri_classi.mjs [--uscita cartella]   → numeri_classi.csv, numeri_classi.md
//   (rifà prima numeri.mjs nella stessa cartella)
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const QUI = dirname(fileURLToPath(import.meta.url)), RADICE = resolve(join(QUI, '..', '..')), SRC = join(RADICE, 'src');
const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > 0 ? process.argv[i + 1] : d; };
const USCITA = resolve(arg('uscita', join(QUI, 'esiti'))); mkdirSync(USCITA, { recursive: true });
execFileSync(process.execPath, [join(QUI, 'numeri.mjs'), '--uscita', USCITA], { stdio: 'ignore' });

// ---------- il registro di numeri.mjs
function leggiCsv(t) { const out = []; let r = [], c = '', q = false; for (let i = 0; i < t.length; i++) { const x = t[i];
  if (q) { if (x === '"' && t[i + 1] === '"') { c += '"'; i++; } else if (x === '"') q = false; else c += x; }
  else if (x === '"') q = true; else if (x === ',') { r.push(c); c = ''; } else if (x === '\n') { r.push(c); out.push(r); r = []; c = ''; } else c += x; } return out; }
const [testa, ...righe] = leggiCsv(readFileSync(join(USCITA, 'numeri.csv'), 'utf8'));
const col = Object.fromEntries(testa.map((n, i) => [n, i]));

// ---------- le costanti note (valore, nome): uguali entro 2·10⁻³ relativo
const COSTANTI = [[Math.PI, 'π'], [2 * Math.PI, '2π'], [Math.PI / 2, 'π/2'], [Math.PI / 180, 'π/180'], [180 / Math.PI, '180/π'], [Math.E, 'e'], [Math.LN2, 'ln 2'], [Math.LN10, 'ln 10'], [Math.SQRT2, '√2'], [Math.SQRT1_2, '1/√2'], [Math.sqrt(3), '√3'], [1.618034, 'φ'], [1.686, 'δc del collasso sferico (3(12π)^⅔/20)'], [0.6745, 'mediana di |N(0,1)| (Φ⁻¹(¾))'],
  [180, 'gradi (180)'], [360, 'gradi (360)'], [90, 'gradi (90)'], [60, 'minuti/secondi (60)'], [3600, 'secondi dell\'ora'], [86400, 'secondi del giorno'], [86164, 'giorno sidereo'], [24, 'ore del giorno'], [365.25, 'giorni dell\'anno'], [3.156e7, 'anno (s)'], [3.1557e7, 'anno (s)'],
  [6.674e-11, 'G'], [2.998e8, 'c'], [299792458, 'c'], [1.380649e-23, 'kB'], [1.381e-23, 'kB'], [6.626e-34, 'h'], [1.0546e-34, 'ħ'], [5.670e-8, 'σ'], [6.022e23, 'NA'], [8.314, 'R'], [1.602e-19, 'e'], [9.109e-31, 'me'], [1.6726e-27, 'mp'], [1.6749e-27, 'mn'], [1.6605e-27, 'u'], [8.854e-12, 'ε0'], [8.988e9, '1/(4πε0)'], [1.2566e-6, 'μ0'], [5.29177e-11, 'a0 (Bohr)'], [13.6057, 'Rydberg (eV)'], [27.211, 'Hartree (eV)'], [0.0072974, 'α'], [137.036, '1/α'], [1.6022e-19, 'eV (J)'], [4184, 'caloria (J/kg)'], [4.184, 'caloria'], [2.2e-8, 'masse'],
  [9.81, 'g Terra'], [9.80665, 'g0'], [273.15, '0 °C'], [101325, 'atmosfera'], [1.01325, 'atmosfera (bar)'], [1.989e30, 'M☉'], [6.957e8, 'R☉'], [3.828e26, 'L☉'], [1.496e11, 'UA'], [3.086e16, 'pc'], [3.0857e16, 'pc'], [3.086e19, 'kpc'], [3.086e22, 'Mpc'], [9.461e15, 'anno luce'], [5.972e24, 'M⊕'], [5.97e24, 'M⊕'], [6.371e6, 'R⊕'], [7.35e22, 'M Luna'], [3.844e8, 'Luna (a)'], [1.737e6, 'R Luna'], [1361, 'costante solare'], [2.7255, 'Tcmb'], [67.7, 'H0'], [5778, 'T☉'], [5772, 'T☉'],
  [1.008, 'massa H'], [4.0026, 'massa He'], [12.011, 'massa C'], [14.007, 'massa N'], [15.999, 'massa O'], [18.015, 'massa H2O'], [22.99, 'massa Na'], [24.305, 'massa Mg'], [28.085, 'massa Si'], [32.06, 'massa S'], [35.45, 'massa Cl'], [39.098, 'massa K'], [40.078, 'massa Ca'], [55.845, 'massa Fe'], [44.01, 'massa CO2'], [28.97, 'massa dell\'aria'], [28.014, 'massa N2'], [31.998, 'massa O2'], [0.018015, 'massa molare dell\'acqua (kg/mol)'], [461.5, 'R del vapore (J/kg/K)'], [1.8246e6, 'Debye-Hückel A'], [50.29, 'Debye-Hückel B'], [287.05, 'R dell\'aria (J/kg/K)'], [0.01801528, 'massa molare dell\'acqua']];
// (un intero vale come costante solo se la costante è quell'intero esatto, e i più comuni — 24, 60, 90 — solo con i gradi o le ore
// sulla riga: altrimenti il 4 sarebbe «la massa dell'elio»)
const COMUNI = new Set([24, 60, 90]);
const costante = (x, linea) => { const a = Math.abs(x); if (!a) return null; const intero = (y) => Number.isInteger(y) && y < 1e6; // (3,0857e19 è «intero» per JavaScript: non lo è per noi)
  for (const [v, n] of COSTANTI) { if (intero(a) !== intero(v)) continue;
  if (intero(a) ? a === v && (!COMUNI.has(a) || /°|grad|lat|lon|PI|ore|ora\b|minut|second|giorn/i.test(linea)) : Math.abs(a / v - 1) < 2e-3) return n; } return null; };
// una riga di tabella: almeno 6 numeri e poche operazioni (dopo aver tolto le stringhe): dati, non una formula
const rigaDiTabella = (linea) => { const l = linea.replace(/(['"`])(?:\\.|(?!\1).)*\1/g, "''").replace(/\/\/.*$/, ''); const n = (l.match(/(?<![\w.])-?\d+\.?\d*(?:e-?\d+)?/g) || []).length, o = (l.match(/[*/+]|Math\.|=>|\b[a-zA-Z_$][\w$]*\(/g) || []).length; return n >= 6 && o <= 0.25 * n; };

// ---------- le regole
const AUTORE = /\b(?!(?:Il|La|Lo|Le|Gli|I|Un|Una|Nel|Nella|Con|Dal|Dalla|Da|Per|Su|Sul|Sulla|Tra|Fra|In|Ma|E|Se|Che|Non|Più|Ogni|Dopo|Prima|Fino|Oggi|Novembre|Ottobre|Dicembre|Questa|Questo|Qui|Vedi|Come|Anche)\b)[A-ZÀ-Ü][a-zà-üA-Z'’-]+(?:\s+(?:e|ed|and|&)\s+[A-ZÀ-Ü][a-zà-ü'’-]+|\s+e\s+altri|\s+et\s+al\.?|\s+e\s+coll\.?)?,?\s*\(?((?:1[6-9]|20)\d\d)[a-z]?\b/g;
const ALTRA_FONTE = /https?:\/\/|\bdoi\b|10\.\d{4,}\/|arxiv|\bNIST\b|CODATA|\bIAU\b|USGS|splib|JANAF|CRC Handbook|\bPDG\b/i;
const fonteVera = (testo) => { if (ALTRA_FONTE.test(testo)) return true; AUTORE.lastIndex = 0; let m; while ((m = AUTORE.exec(testo))) if (+m[1] < 2025) return true; return false; };
const INTERFACCIA = /\b(ctx|fillStyle|strokeStyle|lineWidth|globalAlpha|font|rgba?|hsla?|px|em|rem|canvas|tela|schermo|pixel|clientWidth|clientHeight|devicePixelRatio|dpr|setTimeout|setInterval|requestAnimationFrame|opacity|zIndex|margin|padding|style|colore|colori|tinta|alfa|alpha|opacit\w*|bordo|cursore|icona|pannello|hud|testo|scritta|etichett\w*|fmt\w*|toFixed|toPrecision|padStart|gl\.|uniform\w*|shader|vec[234]|mix|smoothstep|fragColor)\b|#[0-9a-f]{3,8}\b/i;
const NUMERICO = /\b(iter\w*|passi|passo|giri|giro|prove|tentativi|massimo|max|min|N|n|W|H|lato|lati|griglia|campion\w*|celle|risoluzione|ris|punti|nodi|seme|semi|hash|eps|epsilon|tolleranza|toll|precisione|quante|quanti|anelli|onde|taglio|limite|cache|memo|lunghezza|length|cicli|ottave|livelli)\b/;
const potenzaDiDue = (x) => Number.isInteger(x) && x >= 4 && (x & (x - 1)) === 0;
const testi = new Map(); const sorgente = (f) => { if (!testi.has(f)) testi.set(f, readFileSync(join(SRC, f), 'utf8').split('\n')); return testi.get(f); };
// la funzione che contiene la riga: la più vicina sopra con «function nome(» o «const nome = (…) =>», o «export const NOME = {»
const FUNZ = /^\s*(?:export\s+)?(?:async\s+)?(?:function\s*\*?\s*([\w$]+)|(?:const|let)\s+([\w$]+)\s*=\s*(?:memo\()?(?:\([^)]*\)|[\w$]+)\s*=>|(?:const|let)\s+([A-Z][\w$]*)\s*=\s*(?:Object\.freeze\()?[{[])/;
function funzioneDi(f, riga) { const L = sorgente(f); for (let r = riga - 1; r >= 0 && r > riga - 400; r--) { const m = FUNZ.exec(L[r]); if (m) return m[1] || m[2] || m[3]; } return ''; }
function nomeVicino(linea, colonna) { const prima = linea.slice(0, Math.max(0, colonna - 1)); const m = /([\w$]+)\s*(?:=|:)\s*[^=:,;{}]*$/.exec(prima); return m ? m[1] : ''; }

// I GRUPPI DI LAVORO dei prossimi giri: ogni file in uno (src/visore e il resto di src/tre nell'interfaccia)
const GRUPPI = { superficie: 'geologia tettonica meteo storia suolo rocce impatti maree rotazione lune anelli secolare fluidi orbite deposito sezione bordo eredita tre/pianeta tre/tessere.worker superficie.worker tre/onde_cascata',
  mare: 'mare mare_lungo acqua_mw', chimica: 'chimica elementi reazioni albero_vita molecole molecole_atomi molecole_cristalli molecole_energia molecole_forma molecole_forze molecole_grafo molecole_incontri molecole_pozzi molecole_reazioni molecole_rete',
  galassie: 'galassie cosmo cosmo3d ragnatela bolle spazio3d vuoto vuoto_mezzo vuoto_oggetti vuoto_sistema campo_pigro intreccio tre/universo tre/buconero tre/minori tre/minori.worker tre/mezzo tre/volumi tre/volume.worker',
  stelle: 'stelle stelle_tabella disco leggi nebbia tre/sistema tre/luci', materia: 'materia atomi3d quanti grani unita finestra finestre.worker misura relativita tre/quanti tre/quanti.worker tre/nucleo eventi' };
const gruppoDi = new Map(); for (const [g, l] of Object.entries(GRUPPI)) for (const n of l.split(' ')) gruppoDi.set(n.includes('/') ? n + '.js' : 'camera/' + n + '.js', g);
const gruppo = (f) => gruppoDi.get(f) || 'interfaccia';
const out = [['file', 'riga', 'colonna', 'testo', 'valore', 'classe', 'regola', 'grezza', 'unità', 'funzione', 'nome', 'noto', 'contesto', 'gruppo']];
const conta = new Map(), perFile = new Map(), perGruppo = new Map(), K = ['costante', 'legge', 'tabella', 'tecnico', 'a mano'];
for (const r of righe) {
  if (r.length < 6) continue;
  const f = r[col.file], riga = +r[col.riga], colonna = +r[col.colonna], tx = r[col.testo], x = +r[col.valore], grezza = r[col.classe], noto = r[col.noto] || '';
  const L = sorgente(f), linea = L[riga - 1] || '';
  // (la fonte: la riga, le tre sopra, e il blocco di commento intero che sta subito sopra, fino a 15 righe: le fonti lunghe si scrivono lì)
  let q = riga - 2; while (q >= 0 && q > riga - 5 && !/^\s*\/\//.test(L[q])) q--; let r0 = q; while (r0 >= 0 && r0 > riga - 18 && /^\s*\/\//.test(L[r0])) r0--;
  const sopra = L.slice(Math.max(0, Math.min(r0 + 1, riga - 4)), riga).join(' '), nome = nomeVicino(linea, colonna), funz = funzioneDi(f, riga);
  const ax = Math.abs(x), intero = Number.isInteger(x);
  let classe, regola;
  const cst = costante(x, linea);
  if (cst && !(intero && ax <= 360 && INTERFACCIA.test(linea))) { classe = 'costante'; regola = `costante nota: ${cst}`; }
  else if (/grandezze\.js:/.test(noto)) { classe = 'costante'; regola = `in NUMERI_CON_FONTE (${noto})`; }
  else if (fonteVera(sopra)) { classe = 'legge'; regola = 'autore e anno, o DOI/catalogo, vicino o nel commento sopra'; }
  else if (/numeric/i.test(linea.slice(colonna))) { classe = 'tecnico'; regola = 'dichiarato numerico nel commento'; }
  else if (f.startsWith('visore/') || f.startsWith('tre/prove/')) { classe = 'tecnico'; regola = 'interfaccia (src/visore)'; }
  else if (INTERFACCIA.test(linea) && !/\b(K|Pa|kg|m\/s|W\/m)\b/.test(r[col.contesto] || '')) { classe = 'tecnico'; regola = 'riga dell\'interfaccia o del disegno'; }
  else if (/\b(performance\.now|Date\.now|ora|ms|msFilo|attesa|ritardo)\b/.test(linea) && /setTimeout|now\(\)|\bora\b|\bms\b/.test(linea)) { classe = 'tecnico'; regola = 'tempi dell\'interfaccia (ms)'; }
  else if (/toFixed|toPrecision|Math\.round\([^)]*\*\s*\d+\)\s*\/\s*\d+/.test(linea)) { classe = 'tecnico'; regola = 'arrotondamento della stampa'; }
  else if (intero && (potenzaDiDue(ax) || NUMERICO.test(nome)) && !/(Kg|M|K|Pa|Anni|Ma|Ga)$/.test(nome)) { classe = 'tecnico'; regola = `dimensione o conteggio${nome ? ` (${nome})` : ''}`; }
  else if (intero && /\bfor\s*\(/.test(linea) && /<=?\s*$/.test(linea.slice(0, colonna - 1).trimEnd())) { classe = 'tecnico'; regola = 'limite di un ciclo'; }
  else if (/^(eps|epsilon|toll\w*|precisione|fine|piccolo)$/i.test(nome) || (ax > 0 && ax <= 1e-6 && grezza !== 'unità' && /Math\.(max|min)|\|\||<|>|\?\?/.test(linea))) { classe = 'tecnico'; regola = 'tolleranza numerica'; }
  else if (intero && ax >= 1e5 && !/e/i.test(tx) && /hash|seme|mix|imul|>>>/.test(linea)) { classe = 'tecnico'; regola = 'costante di hash'; }
  else if (grezza === 'fonte') { classe = 'tabella'; regola = 'fonte generica (tabella o rimando senza autore)'; }
  else if (rigaDiTabella(linea)) { classe = 'tabella'; regola = 'riga di tabella (≥ 6 numeri, poche operazioni)'; }
  else { classe = 'a mano'; regola = grezza === 'unità' ? 'parametro fisico, con unità' : 'parametro fisico, senza niente'; }
  out.push([f, riga, colonna, tx, x, classe, regola, grezza, grezza === 'unità' ? 'sì' : '', funz, nome, noto, r[col.contesto], gruppo(f)]);
  conta.set(classe, (conta.get(classe) || 0) + 1);
  { const g = gruppo(f); if (!perGruppo.has(g)) perGruppo.set(g, Object.fromEntries(K.map((k) => [k, 0]))); perGruppo.get(g)[classe]++; }
  if (!perFile.has(f)) perFile.set(f, Object.fromEntries(K.map((k) => [k, 0]))); perFile.get(f)[classe]++;
}
const csv = (v) => { const s = String(v ?? ''); return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
writeFileSync(join(USCITA, 'numeri_classi.csv'), out.map((r) => r.map(csv).join(',')).join('\n') + '\n');
const tot = K.map((k) => conta.get(k) || 0), N = tot.reduce((a, b) => a + b, 0);
const file = [...perFile].sort((a, b) => b[1]['a mano'] - a[1]['a mano']);
const md = ['# I numeri messi a mano, per classe', '', `Dal registro di numeri.mjs: ${N} numeri non banali (escluse le tabelle generate). Le regole sono in testa a numeri_classi.mjs.`, '',
  '| classe | numeri |', '|---|---:|', ...K.map((k, i) => `| ${k} | ${tot[i]} |`), `| **totale** | **${N}** |`, '',
  '| gruppo | a mano | tabella | tecnico | legge | costante |', '|---|---:|---:|---:|---:|---:|',
  ...[...perGruppo].sort((a, b) => b[1]['a mano'] - a[1]['a mano']).map(([g, c]) => `| ${g} | ${c['a mano']} | ${c.tabella} | ${c.tecnico} | ${c.legge} | ${c.costante} |`), '',
  '| file | a mano | tabella | tecnico | legge | costante |', '|---|---:|---:|---:|---:|---:|',
  ...file.map(([f, c]) => `| ${f} | ${c['a mano']} | ${c.tabella} | ${c.tecnico} | ${c.legge} | ${c.costante} |`)];
writeFileSync(join(USCITA, 'numeri_classi.md'), md.join('\n') + '\n');
console.log(md.slice(4, 12).join('\n')); console.log(join(USCITA, 'numeri_classi.md'));
