// servi.mjs — un server statico minimo per aprire il prototipo: node servi.mjs, poi http://localhost:8123
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
const radice = new URL('.', import.meta.url).pathname, porta = Number(process.env.PORTA ?? 8123);
const tipi = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css', '.png': 'image/png', '.md': 'text/plain; charset=utf-8' };
createServer(async (q, r) => {
  const via = normalize(decodeURIComponent(new URL(q.url, 'http://x').pathname)).replace(/^(\.\.[/\\])+/, '');
  try { const dati = await readFile(join(radice, via.endsWith('/') ? via + 'index.html' : via)); r.writeHead(200, { 'content-type': tipi[extname(via)] ?? 'application/octet-stream' }); r.end(dati); }
  catch { r.writeHead(404); r.end('non trovato'); }
}).listen(porta, () => console.log(`cristallo: http://localhost:${porta}`));
