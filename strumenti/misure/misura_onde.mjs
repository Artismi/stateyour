// misura_onde.mjs — quanto costano le tessere delle onde (pianeta.js, onde_cascata.js) saltando quelle sotto il punto dello
// schermo, e quanto cambia l'immagine (src/tre/prove/mare_scale.html, confronta). uso: node strumenti/misure/misura_onde.mjs [avvio|acqua] [larghezze]
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const RADICE = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const TIPI = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json' };
const [chi = 'avvio', larghe = '20000,2000,200'] = process.argv.slice(2);
const ind = JSON.parse(readFileSync(join(RADICE, 'strumenti/misure/indirizzi.json'), 'utf8')).indirizzi.find((x) => x.nome === chi);
const server = createServer((q, r) => { const f = join(RADICE, decodeURIComponent(q.url.split('?')[0])); try { const d = readFileSync(f); r.writeHead(200, { 'Content-Type': TIPI[extname(f)] || 'application/octet-stream' }); r.end(d); } catch { r.writeHead(404); r.end(); } });
await new Promise((ok) => server.listen(0, '127.0.0.1', ok));
const { chromium } = createRequire(import.meta.url)('playwright');
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 400, height: 250 }, deviceScaleFactor: 1 });
page.on('pageerror', (e) => console.log('ERRORE', e.message.slice(0, 2000)));
await page.goto(`http://127.0.0.1:${server.address().port}/src/tre/prove/mare_scale.html`); await page.waitForFunction(() => window.prova && window.prova.caricata);
await page.evaluate((v) => window.prova.carica(v), ind.via);
for (const L of larghe.split(',').map(Number)) {
  await page.evaluate((L) => window.prova.foto({ larghezza: L, fotogrammi: 1 }), L); const r = await page.evaluate(() => window.prova.confronta());
  console.log(`${L} m: CPU delle onde ${r.normale.ms.toFixed(2)} ms per fotogramma (tessere ${r.normale.attive.join('')}) contro ${r.tutte.ms.toFixed(2)} ms (tutte); immagine: differenza media ${r.diffMedia.toFixed(3)}, massima ${r.diffMassima} su 255`);
}
await browser.close(); server.close();
