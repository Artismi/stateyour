// sorgente.cjs — due schermate della sorgente simmetrica con lo scheletro acceso (sito a 6 e sito a 4).
// Uso: node prove/sorgente.cjs '<json: lista di due indirizzi>'
const { chromium } = require('playwright'); const { spawn } = require('node:child_process'); const path = require('node:path');
const indirizzi = JSON.parse(process.argv[2]), nomi = ['10-sorgente-sito-6-scheletro', '11-sorgente-sito-4-scheletro'];
(async () => {
  const server = spawn(process.execPath, [path.join(__dirname, '..', 'servi.mjs')], { env: { ...process.env, PORTA: '8125' }, stdio: 'ignore' });
  await new Promise((r) => setTimeout(r, 500));
  const b = await chromium.launch(), pg = await b.newPage({ viewport: { width: 1280, height: 800 } }), errori = [];
  pg.on('pageerror', (e) => errori.push(e.message));
  for (const [i, a] of indirizzi.entries()) {
    await pg.goto('about:blank'); await pg.goto('http://localhost:8125/index.html#' + encodeURIComponent(a));
    await new Promise((r) => setTimeout(r, 800)); await pg.click('#t-scheletro'); await new Promise((r) => setTimeout(r, 5000));
    const s = await pg.evaluate(() => window.cristallo.info);
    console.log(nomi[i], '· palline', s.info.palline, '· ordine', s.info.ordine, '· specchi', s.info.specchi, '·', s.finestra);
    await pg.screenshot({ path: path.join(__dirname, 'schermate', nomi[i] + '.png') });
  }
  console.log('errori:', errori.length ? errori : 'nessuno');
  await b.close(); server.kill();
})();
