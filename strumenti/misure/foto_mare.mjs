// foto_mare.mjs — le foto del mare aperto a ogni scala (src/tre/prove/mare_scale.html), con i ms per fotogramma.
// uso: node strumenti/nodo.cjs strumenti/misure/foto_mare.mjs <cartella> <prefisso> [avvio|acqua] [larghezze in m, separate da virgole] [falsi]
import { createServer } from 'node:http';
import { readFileSync, mkdirSync } from 'node:fs';
import { join, extname, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const RADICE = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const TIPI = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json' };
const [cartella = 'prove/superficie2', prefisso = 'mare', chi = 'avvio', larghe = '200000,20000,2000,200', falsi = ''] = process.argv.slice(2);
const ind = JSON.parse(readFileSync(join(RADICE, 'strumenti/misure/indirizzi.json'), 'utf8')).indirizzi.find((x) => x.nome === chi);
const server = createServer((q, r) => { const f = join(RADICE, decodeURIComponent(q.url.split('?')[0])); try { const d = readFileSync(f); r.writeHead(200, { 'Content-Type': TIPI[extname(f)] || 'application/octet-stream' }); r.end(d); } catch { r.writeHead(404); r.end(); } });
await new Promise((ok) => server.listen(0, '127.0.0.1', ok));
const { chromium } = createRequire(import.meta.url)('playwright');
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 400, height: 250 }, deviceScaleFactor: 1 });
page.on('pageerror', (e) => console.log('ERRORE', e.message.slice(0, 2000))); page.on('console', (m) => { if (m.type() === 'error') console.log('console', m.text().slice(0, 2000)); });
await page.goto(`http://127.0.0.1:${server.address().port}/src/tre/prove/mare_scale.html${process.env.TUTTE ? '?tutte' : ''}`); await page.waitForFunction(() => window.prova && window.prova.caricata);
const info = await page.evaluate((v) => window.prova.carica(v), ind.via); console.log(chi, JSON.stringify(info));
mkdirSync(resolve(RADICE, cartella), { recursive: true });
for (const L of larghe.split(',').map(Number)) {
  const r = await page.evaluate(([L, f]) => window.prova.foto({ larghezza: L, falsi: f || null }), [L, falsi]);
  const nome = `${prefisso}_${chi}_${L >= 1000 ? `${L / 1000}km` : `${L}m`}.png`; await page.screenshot({ path: resolve(RADICE, cartella, nome) });
  console.log(`${nome}: quota ${Math.round(r.quota)} m, ${r.msMediana.toFixed(1)} ms per fotogramma; onde ${JSON.stringify(r.statistiche?.onde)}; vortici ${JSON.stringify(r.statistiche?.vortici)}`);
}
await browser.close(); server.close();
