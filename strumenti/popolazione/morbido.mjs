// morbido.mjs <file di prova> <testo da sostituire> <testo nuovo> <uscita.json>
// Lancia una prova con le asserzioni rese «morbide»: non fermano, e si segna quali passano (per riga).
import { readFileSync, writeFileSync } from 'node:fs';
const [, , file, da, a, uscita] = process.argv;
let src = readFileSync(file, 'utf8'); if (da) { if (!src.includes(da)) throw new Error('testo non trovato: ' + da); src = src.split(da).join(a); }
src = src.replace(/from '\.\.\/src\//g, "from '/home/user/stateyour/src/").replace(/import\('\.\.\/src\//g, "import('/home/user/stateyour/src/");
const righe = src.split('\n').map((r, i) => {
  if (/^const (tra|prova|confronta|riscontro)\b/.test(r) || /^import /.test(r)) return r;
  let k = 0; const id = () => `"${i + 1}.${k++}", `;
  return r.replace(/assert\.ok\(/g, () => `__M.ok(${id()}`).replace(/assert\.equal\(/g, () => `__M.eq(${id()}`).replace(/assert\.notEqual\(/g, () => `__M.ne(${id()}`).replace(/assert\.deepEqual\(/g, () => `__M.de(${id()}`).replace(/assert\.notDeepEqual\(/g, () => `__M.nd(${id()}`).replace(/(?<![\w.])tra\(/g, () => `__M.tra(${id()}`);
});
const testa = `const __R = {}, __segna = (id, bene, msg) => { const q = (__R[id] ??= { si: 0, no: 0, msg: '' }); if (bene) q.si++; else { q.no++; if (!q.msg) q.msg = String(typeof msg === 'function' ? '' : msg ?? '').slice(0, 200); } };
const __M = { ok: (id, c, m) => __segna(id, !!c, m), eq: (id, x, y, m) => __segna(id, Object.is(x, y), m ?? (x + ' !== ' + y)), ne: (id, x, y, m) => __segna(id, !Object.is(x, y), m), de: (id, x, y, m) => __segna(id, JSON.stringify(x) === JSON.stringify(y), m), nd: (id, x, y, m) => __segna(id, JSON.stringify(x) !== JSON.stringify(y), m), tra: (id, x, a, b, che) => __segna(id, x >= a && x <= b, che + ': ' + x + ' (tra ' + a + ' e ' + b + ')') };
const __crolli = [];
import { writeFileSync as __scrivi } from 'node:fs';
process.on('exit', () => __scrivi(${JSON.stringify(uscita)}, JSON.stringify({ R: __R, crolli: __crolli })));
`;
let corpo = righe.join('\n');
// le prove non fermano: un crollo dentro una prova si segna
corpo = corpo.replace(/const prova = \(nome, f\) => \{ f\(\);/, "const prova = (nome, f) => { try { f(); } catch (e) { __crolli.push(nome.slice(0, 60) + ': ' + String(e.message).slice(0, 160)); return; }");
const tmp = uscita.replace(/\.json$/, '.mjs'); writeFileSync(tmp, testa + corpo);
