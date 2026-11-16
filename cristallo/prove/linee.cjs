// linee.cjs — prova ⭕ (il catalogo delle linee chiuse), la scelta di due orbite, il controcampo 🎨 e la sorgente ✴️.
// Uso: node prove/linee.cjs [indirizzo]
const { chromium } = require('playwright'); const { spawn } = require('node:child_process'); const path = require('node:path');
const aspetta = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const server = spawn(process.execPath, [path.join(__dirname, '..', 'servi.mjs')], { env: { ...process.env, PORTA: '8126' }, stdio: 'ignore' });
  await aspetta(500);
  const b = await chromium.launch(), pg = await b.newPage({ viewport: { width: 1280, height: 800 } }), errori = [];
  pg.on('pageerror', (e) => errori.push(e.message)); pg.on('console', (m) => { if (m.type() === 'error') errori.push(m.text()); });
  const ind = process.argv[2], nome = process.argv[3] || 'linee';
  await pg.goto('http://localhost:8126/index.html' + (ind ? '#' + encodeURIComponent(ind) : '')); await aspetta(1500);
  await pg.click('#t-chiuse');
  for (let i = 0; i < 40; i++) { if (await pg.locator('.orbita').count()) break; await aspetta(250); }
  const n = await pg.locator('.orbita').count(); console.log('orbite nel catalogo:', n);
  await pg.screenshot({ path: path.join(__dirname, 'schermate', `12-${nome}-catalogo.png`) });
  for (let i = 0; i < Math.min(2, n); i++) { await pg.locator('.orbita').nth(i).click(); await aspetta(400); }
  await pg.click('#t-campo'); await aspetta(1500);
  await pg.click('#t-chiuse'); await aspetta(300);
  await pg.click('#t-pallina'); await aspetta(2500);
  const info = await pg.evaluate(() => window.cristallo.info);
  console.log(info.frase, '·', (await pg.evaluate(() => window.cristallo.p.orbite.length)), 'orbite scelte');
  await pg.screenshot({ path: path.join(__dirname, 'schermate', `13-${nome}-controcampo.png`) });
  await pg.click('#t-chiuse'); await pg.click('#t-campo'); await pg.click('#t-chiuse'); await aspetta(2000);
  await pg.screenshot({ path: path.join(__dirname, 'schermate', `14-${nome}-linee.png`) });
  console.log('errori:', errori.length ? errori : 'nessuno');
  await b.close(); server.kill();
})();
