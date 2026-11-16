// schermate.cjs — prova il prototipo in Chromium (Playwright) e fa le schermate a 1280×800 in prove/schermate/.
// Uso: node prove/schermate.cjs   (avvia da sé il server statico di servi.mjs sulla porta 8123)
const { chromium } = require('playwright');
const { spawn } = require('node:child_process');
const path = require('node:path');

const qui = path.join(__dirname, '..'), porta = 8123, cartella = path.join(__dirname, 'schermate');
const aspetta = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const server = spawn(process.execPath, [path.join(qui, 'servi.mjs')], { env: { ...process.env, PORTA: String(porta) }, stdio: 'ignore' });
  await aspetta(600);
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const errori = []; page.on('pageerror', (e) => errori.push(e.message)); page.on('console', (m) => { if (m.type() === 'error') errori.push(m.text()); });
  const foto = async (nome) => { await page.screenshot({ path: path.join(cartella, `${nome}.png`) }); console.log('schermata', nome); };
  const stato = () => page.evaluate(() => window.cristallo.info);
  const fino = async (cond, max = 15000) => { const t = Date.now(); while (Date.now() - t < max) { const s = await stato(); if (s && cond(s)) return s; await aspetta(150); } return stato(); };

  const t0 = Date.now();
  await page.goto(`http://localhost:${porta}/index.html`);
  const s0 = await fino((s) => s.info.primoMs != null);
  console.log('avvio: primo disegno dopo', Date.now() - t0, 'ms dal caricamento;', Math.round(s0.info.primoMs), 'ms nel worker;', s0.frase);
  await aspetta(3500); await foto('1-avvio');

  // cambio cristallo: esagonale, poi un atomo in più (una conca al centro)
  await page.click('#t-cristallo'); await aspetta(300);
  await page.click('.forma[data-sistema="esagonale"]'); await aspetta(500);
  const box = await page.locator('#cubetto').boundingBox();
  await foto('2-cristallo-esagonale');
  // tocca il posto (½,½,½): due tocchi = conca
  const pos = await page.evaluate(() => null);
  void pos;
  await page.mouse.click(box.x + box.width * 0.5, box.y + box.height * 0.52); await aspetta(300);
  console.log('atomi:', JSON.stringify(await page.evaluate(() => window.cristallo.p.atomi)));
  await foto('3-atomo-aggiunto');
  // chiudi il vassoio e lancia la pallina trascinando una freccia
  await page.click('#t-cristallo'); await aspetta(200);
  await page.mouse.move(520, 420); await page.mouse.down(); await page.mouse.move(640, 360, { steps: 6 }); await page.mouse.up();
  await fino((s) => s.info.passi > 0); await aspetta(3500); await foto('4-lancio');

  // il magnete
  await page.locator('#m-magnete input').fill('650'); await page.locator('#m-magnete input').dispatchEvent('change');
  await aspetta(4000); await foto('5-magnete');

  // il globo che scatta su (111): da cubico
  await page.click('#t-cristallo'); await page.click('.forma[data-sistema="cubico"]'); await page.click('#t-cristallo');
  await page.locator('#m-magnete input').fill('0'); await page.locator('#m-magnete input').dispatchEvent('input'); await page.locator('#m-magnete input').dispatchEvent('change');
  await page.click('#t-globo'); await aspetta(300);
  const g = await page.locator('#globo').boundingBox();
  // gira il globo a piccoli passi finché n non è (111)
  let mx = g.x + g.width / 2, my = g.y + g.height / 2;
  await page.mouse.move(mx, my); await page.mouse.down();
  let n = null;
  for (let i = 0; i < 80; i++) {
    n = await page.evaluate(() => window.cristallo.p.finestra.n);
    const s = 1 / Math.sqrt(3), err = Math.hypot(n[0] - s, n[1] - s, n[2] - s);
    if (err < 1e-12) break;
    // un passo verso (111): la direzione sull'immagine del globo viene dalla pagina
    const d = await page.evaluate(() => {
      const f = window.cristallo.p.finestra.n, t = [1 / Math.sqrt(3), 1 / Math.sqrt(3), 1 / Math.sqrt(3)];
      return t.map((x, i) => x - f[i]);
    });
    const e = await page.evaluate((d) => { const { n } = window.cristallo.p.finestra; return window.__assi ? window.__assi(n, d) : null; }, d);
    if (!e) break;
    mx -= e[0] * 5; my += e[1] * 5;
    if (mx < g.x + 20 || mx > g.x + g.width - 20 || my < g.y + 20 || my > g.y + g.height - 20) { await page.mouse.up(); mx = g.x + g.width / 2; my = g.y + g.height / 2; await page.mouse.move(mx, my); await page.mouse.down(); }
    await page.mouse.move(mx, my, { steps: 1 });
    await aspetta(40);
  }
  await page.mouse.up();
  console.log('n dopo il globo:', JSON.stringify(n));
  await aspetta(3500); await foto('6-globo-111');

  // il 🎲
  await page.click('#t-globo');
  await page.click('#t-caso'); await fino((s) => s.info.passi > 2000); await aspetta(3500); await foto('7-caso');
  const prima = await page.evaluate(() => window.cristallo.scrivi(window.cristallo.p));
  await page.click('#t-indietro'); await aspetta(2500);
  const dopo = await page.evaluate(() => window.cristallo.scrivi(window.cristallo.p));
  console.log('↩ torna indietro:', prima !== dopo);
  await foto('8-indietro');
  await page.click('#t-info'); await aspetta(600); await foto('9-pannello');
  console.log('errori nella pagina:', errori.length ? errori : 'nessuno');
  await browser.close(); server.kill();
})();
