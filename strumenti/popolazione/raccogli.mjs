import { readFileSync } from 'node:fs';
const [, , file, ...json] = process.argv, righe = readFileSync(file, 'utf8').split('\n'), tot = {}, crolli = {}; let n = 0;
for (const j of json) { let d; try { d = JSON.parse(readFileSync(j, 'utf8')); } catch { continue; } n++; for (const id in d.R) { const q = (tot[id] ??= { si: 0, no: 0, visti: 0, msg: '' }); q.visti++; if (d.R[id].no) { q.no++; q.msg ||= d.R[id].msg; } else q.si++; } for (const c of d.crolli) crolli[c.slice(0, 50)] = (crolli[c.slice(0, 50)] || 0) + 1; }
console.log(n, 'mondi;', Object.keys(tot).length, 'asserzioni;', Object.values(tot).filter((q) => q.no).length, 'non sempre vere');
for (const id of Object.keys(tot).sort((a, b) => parseFloat(a) - parseFloat(b))) { const q = tot[id]; if (q.no) console.log(`  riga ${id}: ${q.si}/${q.visti}  ${q.msg.slice(0, 150)}`); }
for (const c in crolli) console.log('  CROLLO', crolli[c], c);
