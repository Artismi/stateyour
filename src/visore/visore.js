// visore.js — il visore del ricercatore, variante B (PROGETTO_VISORE.md; prototipo: prove/visore/visore.html?v=B).
// Schermo pieno, cornice sottile bordeaux, la linguetta dei tasti in basso. La camera (laboratorio.js) resta com'è e fa
// tutto: qui la si veste. All'avvio si costruisce il guscio e ci si spostano dentro le parti vive della pagina di prima:
// la scena (.tele, con le sue tele), il pannello della cella (nella scheda del pattern), le forze, il tempo della cella.
// La barra in alto, la riga di stato e il pannello laterale spariscono (visore.css); ogni loro funzione ha un posto qui
// (la tabella del § 11): i tasti, la catena, il righello, il mirino, le schede, il menu, il taccuino.
//
// I tasti funzionano davvero: M menu · , P . il tempo · B esci · A entra · I scheda · F inquadra · R a caso · T taccuino.
// Si ascoltano prima della camera (in cattura): A, R e F del volo diventano i tasti del visore; il volo resta con le frecce,
// W S D, Spazio e C, Q ed E.
import { metteSprite, ico } from './icone.js';
import { C, ORDINE } from './dati.js';
import { superficieInCalcolo } from '../camera/mappa.js';
import { creaHud } from './hud.js';
import { creaMenu } from './menu.js';
import { schedaDi } from './schede.js';

const $ = (id) => document.getElementById(id);
const prova = (f, d = null) => { try { return f(); } catch { return d; } };
const LIV3 = ['cosmo', 'galassia', 'stella', 'pianeta'];

function costruisci() {
  metteSprite();
  const tele = document.querySelector('.tele'), pannello = $('pannello'), sopra = document.querySelector('.sopra'), sotto = document.querySelector('.sotto');
  if (!tele || document.getElementById('visore')) return;
  const radice = document.createElement('div'); radice.id = 'visore'; radice.className = 'v-scocca';
  radice.innerHTML = `
    <button class="v-finestrella" title="schermo pieno"><i></i><i></i><i></i></button>
    <div class="v-schermo">
      <section class="v-scheda" hidden aria-label="la scheda">
        <div class="testa"><div class="stemma"></div><div><h2></h2><p></p></div><button class="chiudi" title="chiudi (B, Esc)">${ico('g-chiudi')}<kbd>B</kbd></button></div>
        <nav class="v-linguette"></nav>
        <div class="corpo"><div class="gen"></div><div class="vivo" data-vivo="leggi" hidden></div><div class="vivo" data-vivo="sezione" hidden></div></div>
        <div class="piede"></div>
      </section>
      <div class="v-pop" hidden><h4>Il tempo</h4><div class="riga v-pop-3d"></div><div class="v-pop-cella"></div></div>
      <div class="v-vetro"></div>
    </div>
    <div class="v-linguetta v-scocca">
      <div class="raccordo s"></div><div class="raccordo d"></div>
      <div class="fila">
        <span class="nome">STATEYOUR</span>
        <button class="v-tasto quadro" data-v-tasto="menu" title="il menu (M)">${ico('menu')}<kbd>M</kbd></button>
        <div class="divisore"></div>
        <div class="v-bilanciere"><button data-v-tasto="lento" title="il tempo più lento (,)">${ico('g-indietro')}<kbd>,</kbd></button><button data-v-tasto="pausa" title="pausa (P)">${ico('g-pausa')}<kbd>P</kbd></button><button data-v-tasto="veloce" title="il tempo più veloce (.)">${ico('g-avanti')}<kbd>.</kbd></button></div>
        <div class="divisore"></div>
        <button class="v-tasto tondo" data-v-tasto="esci" title="esci, risali di un livello (B)">${ico('esci')}<kbd>B</kbd></button>
        <button class="v-tasto tondo primario" data-v-tasto="entra" title="entra (A)">${ico('entra')}<kbd>A</kbd></button>
        <div class="divisore"></div>
        <button class="v-tasto quadro" data-v-tasto="scheda" title="la scheda (I)">${ico('mirino')}<kbd>I</kbd></button>
        <button class="v-tasto quadro" data-v-tasto="inquadra" title="inquadra: una finestra bella a questa scala (F)">${ico('inquadra')}<kbd>F</kbd></button>
        <button class="v-tasto quadro" data-v-tasto="caso" title="un punto a caso (R)">${ico('dado')}<kbd>R</kbd></button>
      </div>
    </div>`;
  document.body.appendChild(radice);
  const schermo = radice.querySelector('.v-schermo'), elScheda = radice.querySelector('.v-scheda'), pop = radice.querySelector('.v-pop');
  schermo.prepend(tele);
  const corpo = elScheda.querySelector('.corpo'), gen = corpo.querySelector('.gen'), vivoLeggi = corpo.querySelector('[data-vivo="leggi"]'), vivoSezione = corpo.querySelector('[data-vivo="sezione"]');
  if (sopra) vivoLeggi.appendChild(sopra);
  if (pannello) vivoSezione.appendChild(pannello);
  if (sotto) radice.querySelector('.v-pop-cella').appendChild(sotto);

  // ---------- IL RAPPORTO DELLA CAMERA: ogni volta che la scena cambia misura (la scheda che si apre o si chiude, la
  // finestra ridimensionata, lo schermo pieno) le tele si rifanno alla misura nuova. La camera ascolta `resize` della
  // finestra (laboratorio.js: disegna, atomi, mondo 3D): glielo si manda anche quando cambia solo la scena. (Era un difetto:
  // il buffer 3D restava a 1840 × 1338 su una tela di 1280 × 790, e il pianeta usciva schiacciato.)
  let misura = '', giroMisura = 0;
  const ricalcola = () => { giroMisura = 0; const k = `${tele.clientWidth}×${tele.clientHeight}`; if (k === misura) return; misura = k; window.dispatchEvent(new Event('resize')); };
  new ResizeObserver(() => { if (!giroMisura) giroMisura = requestAnimationFrame(ricalcola); }).observe(tele);
  // (e le tele montate dopo — il mondo 3D, gli atomi, i quanti — se nascono con un buffer che non è della loro misura)
  setInterval(() => { for (const cv of tele.querySelectorAll('canvas')) { if (!cv.clientWidth || !cv.clientHeight || cv.hidden) continue; const r = cv.width / cv.height, s = cv.clientWidth / cv.clientHeight; if (cv.width > 1 && Math.abs(r / s - 1) > 0.02) { misura = ''; ricalcola(); break; } } }, 1000);

  const azioni = {};
  const hud = creaHud(schermo, { azioni });
  const menu = creaMenu(schermo, { azioni, hud });

  // ---------- LA GHIERA: la rotella resa tasto (A e B, il righello). Si manda la rotella alla tela che sta sotto il mirino,
  // così fa esattamente ciò che fa la rotella vera a ogni livello (lo spazio, il suolo, la roccia, gli atomi, la cella)
  function ghiera(verso, n = 4) {
    const r = tele.getBoundingClientRect(), m = hud.mirino, x = r.left + (m && m.tipo !== 'anello' ? m.x : r.width / 2), y = r.top + (m && m.tipo !== 'anello' ? m.y : r.height / 2);
    let i = 0; const passo = () => {
      let el = document.elementFromPoint(x, y); if (!el || !tele.contains(el)) el = [...tele.querySelectorAll('canvas')].filter((cv) => !cv.hidden && getComputedStyle(cv).pointerEvents !== 'none').at(-1);
      el?.dispatchEvent(new WheelEvent('wheel', { deltaY: verso * 100, deltaMode: 0, clientX: x, clientY: y, bubbles: true, cancelable: true, view: window }));
      if (++i < n) setTimeout(passo, 45);
    }; passo();
  }
  azioni.ghiera = ghiera;
  // A · ENTRA: verso il bersaglio del mirino (il volo «vai a» della camera), altrimenti un passo della ghiera
  azioni.entra = () => {
    const c = C(), q = hud.q, m = hud.mirino; if (!c) return;
    if (q.tre && m?.tipo === 'anello' && c.universo3d?.vaiA) { const b = prova(() => c.mondo3d.mira(m.x, m.y)?.b); if (b && c.universo3d.vaiA(b, {})) return; }
    ghiera(-1, 4);
  };
  // B · ESCI: prima chiude ciò che è aperto; poi risale di un livello (in volo, nello spazio; altrimenti con la ghiera)
  const chiudiSopra = () => { if (menu.taccuinoAperto) { menu.chiudiTaccuino(); return true; } if (menu.aperto) { menu.chiudi(); return true; } if (!pop.hidden) { pop.hidden = true; return true; } if (!elScheda.hidden) { scheda(false); return true; } return false; };
  azioni.esci = () => {
    if (chiudiSopra()) return; const c = C(), q = hud.q; if (!c) return;
    if (q.tre && c.universo3d) {
      if (q.id === 'terreno') { const corpo = prova(() => c.universo3d.sistema()?.pianeta(q.via.pianeta)); if (corpo && c.universo3d.vaiA({ corpo }, {})) return; }
      const i = LIV3.indexOf(q.id); if (i > 0 && c.volaAlLivello) { c.volaAlLivello(LIV3[i - 1]); return; }
    }
    ghiera(1, 4);
  };
  // un livello della catena o del righello: sopra si vola (o si torna nello spazio e poi si vola), sotto si scende con la ghiera
  azioni.vaiAlLivello = (liv) => {
    const c = C(), q = hud.q; if (!c) return; if (liv === q.id) { scheda(true); return; }
    if (LIV3.includes(liv)) {
      if (q.tre && c.volaAlLivello) { c.volaAlLivello(liv); return; }
      const cm = c.camMappa; if (!cm?.via) { hud.avvisa('Da qui non si torna nello spazio'); return; }
      const L = LIV3.indexOf(liv), m = Math.min(tele.clientWidth, tele.clientHeight) * (devicePixelRatio || 1);
      Object.assign(cm, { livello: L, cx: L === 0 ? 0.5 : 0, cy: L === 0 ? 0.5 : 0, z: L === 3 ? m / 3 : m / 2.4 }); delete cm.roccia; delete cm.quota3d;
      c.vai('cosmo'); let n = 0; const aspetta = setInterval(() => { const x = C(); if (++n > 100) return clearInterval(aspetta); if (x?.universo3d?.pronto?.()) { clearInterval(aspetta); setTimeout(() => x.volaAlLivello?.(liv), 400); } }, 100);
      hud.avvisa(`Si torna nello spazio: ${liv === 'cosmo' ? 'il cosmo' : `la ${liv === 'pianeta' ? 'pianeta' : liv}`.replace('la pianeta', 'il pianeta')}`); return;
    }
    const qi = ORDINE.indexOf(q.id === 'pattern' ? 'pattern' : q.id), li = ORDINE.indexOf(liv); ghiera(li > qi ? -1 : 1, 6);
  };
  // il tempo: nello spazio i bottoni del mondo (laboratorio.js, barra del mondo); nella cella il cursore del tempo e ▶
  azioni.tempo = (s) => {
    const b = tele.querySelector(`[data-t="${s}"]`); if (b) { b.click(); hud.aggiornaOra(); return; }
    const c = C(); if (!c) return;
    if (c.vista === 'pattern') { hud.avvisa('Il pattern è tutta la storia: entra nella finestra per il suo tempo'); return; }
    if (c.vista === 'cosmo') { hud.avvisa("Qui il tempo è adesso: sotto la superficie lo stato c'è solo oggi"); return; }
    if (s === 0) $('gioca')?.click(); else { const t = $('tempo'); if (t) { t.value = Math.max(0, Math.min(1, +t.value + s * 0.05)); t.dispatchEvent(new Event('input', { bubbles: true })); } }
    hud.aggiornaOra();
  };
  // F · INQUADRA: «una finestra bella a questa scala» (nello spazio e sulla mappa); nella cella una sezione più bella
  azioni.inquadra = () => {
    const p = $('pannello'), b = p?.querySelector('[data-finestra-bella]') || p?.querySelector('[data-cerca="qui"]') || p?.querySelector('[data-cerca="ovunque"]');
    if (b) b.click(); else hud.avvisa('Qui non c\'è niente da inquadrare');
  };
  // R · A CASO: un punto a caso dell'universo (lingua.js); l'avviso dice dove
  azioni.caso = () => {
    const b = $('puntoACaso'); if (!b) return; b.click();
    setTimeout(() => { const t = $('dove')?.textContent || '', m = t.match(/«([^»]+)»/); hud.avvisa(m ? `Un punto a caso: ${m[1]}` : t.split(' · ')[0]); }, 60);
  };
  azioni.schermoPieno = () => { if (document.fullscreenElement) document.exitFullscreen?.(); else document.documentElement.requestFullscreen?.().catch(() => hud.avvisa('Lo schermo pieno qui non si può: F11')); };
  azioni.menu = () => { if (menu.taccuinoAperto) menu.chiudiTaccuino(); menu.toggle(); };
  azioni.taccuino = () => { if (menu.taccuinoAperto) menu.chiudiTaccuino(); else { menu.chiudi(); menu.taccuino(); } };
  azioni.popTempo = () => {
    pop.hidden = !pop.hidden; if (pop.hidden) return;
    const c = C(), tre = !!tele.querySelector('[data-t="passo"]');
    pop.querySelector('.v-pop-3d').innerHTML = tre ? `<button class="v-bottone" data-v-tempo="-1">${ico('g-indietro')}più lento</button><button class="v-bottone" data-v-tempo="0">${ico('g-pausa')}pausa</button><button class="v-bottone" data-v-tempo="1">${ico('g-avanti')}più veloce</button><button class="v-bottone" data-v-tempo="passo" title="ore per un pianeta, milioni di anni per una galassia">≈ il passo che ha senso qui</button>` : c?.vista === 'cosmo' ? '<p class="v-riga">Qui il tempo è adesso: sopra le particelle lo stato c\'è solo oggi.</p>' : '';
    pop.querySelector('.v-pop-cella').hidden = tre || c?.vista === 'cosmo';
  };
  pop.addEventListener('click', (e) => { const b = e.target.closest('[data-v-tempo]'); if (b) azioni.tempo(b.dataset.vTempo); });

  // ---------- LA SCHEDA: una per volta, a destra; la scena si stringe e la camera ricentra il bersaglio nella parte libera
  const st = { linguetta: {}, chiave: '' };
  function scheda(apri = elScheda.hidden) {
    elScheda.hidden = !apri; schermo.classList.toggle('con-scheda', apri); st.chiave = ''; if (apri) { pop.hidden = true; disegnaScheda(); }
    for (const b of radice.querySelectorAll('[data-v-tasto="scheda"]')) b.classList.toggle('on', apri);
  }
  azioni.scheda = (forza) => scheda(forza === true ? true : elScheda.hidden);
  function testa(liv, nome, identita) {
    elScheda.querySelector('.stemma').innerHTML = ico(liv); const h2 = elScheda.querySelector('h2'), p = elScheda.querySelector('.testa p');
    if (h2.textContent !== nome) h2.textContent = nome; if (p.textContent !== identita) p.textContent = identita;
  }
  function linguette(lista, on) {
    const nav = elScheda.querySelector('.v-linguette'); nav.style.setProperty('--n', lista.length);
    nav.innerHTML = lista.map((l) => `<button data-v-linguetta="${l.id}" class="${l.id === on ? 'on' : ''}" title="${l.nome}">${ico(l.ico)}${l.nome}</button>`).join('');
  }
  const VISTE = { pattern: 'il pattern: la finestra ripetuta', finestra: 'la finestra: la sezione da sola', dettaglio: "l'universo della cella", spaziotempo: 'lo spaziotempo della finestra' };
  function disegnaScheda() {
    if (elScheda.hidden) return; const q = hud.q, c = C();
    if (q.id === 'pattern') {
      const on = st.linguetta.pattern || 'sezione', k = `pattern|${on}|${c?.vista}|${c?.comp?.nome}`; if (k === st.chiave) return; st.chiave = k;
      testa('pattern', (c?.comp?.nome || 'Il pattern').replace(/^./, (x) => x.toUpperCase()), VISTE[c?.vista] || '');
      linguette([{ id: 'sezione', ico: 'mirino', nome: 'Sezione' }, { id: 'leggi', ico: 'campo', nome: 'Leggi' }], on);
      gen.innerHTML = ''; gen.hidden = true; vivoSezione.hidden = on !== 'sezione'; vivoLeggi.hidden = on !== 'leggi'; elScheda.querySelector('.piede').innerHTML = ''; return;
    }
    vivoSezione.hidden = vivoLeggi.hidden = true; gen.hidden = false;
    const s = schedaDi(q), pozza = !!$('pannello')?.querySelector('img[alt="la convezione nella pozza"]');
    if (!s) { const k = `vuota|${q.id}`; if (k === st.chiave) return; st.chiave = k; testa(q.id, (q.id || '').replace(/^./, (x) => x.toUpperCase()), ''); linguette([], null); gen.innerHTML = '<p class="v-riga">Niente da mostrare qui.</p>'; return; }
    const on = s.linguette.some((l) => l.id === st.linguetta[s.liv]) ? st.linguetta[s.liv] : s.linguette[0].id, k = `${s.chiave}|${on}|${pozza}`; if (k === st.chiave) return; st.chiave = k;
    testa(s.liv, s.nome, s.identita); linguette(s.linguette, on);
    const l = s.linguette.find((x) => x.id === on), su = corpo.scrollTop, stessa = st.ultima === `${s.liv}|${on}`; st.ultima = `${s.liv}|${on}`;
    gen.innerHTML = prova(() => l.html(), '<p class="v-riga">Questa scheda non si è potuta fare.</p>'); corpo.scrollTop = stessa ? su : 0;
    elScheda.querySelector('.piede').innerHTML = prova(() => s.piede(), '');
  }
  elScheda.addEventListener('click', (e) => {
    if (e.target.closest('.chiudi')) { scheda(false); return; }
    const t = e.target.closest('[data-v-linguetta]'); if (t) { const q = hud.q, s = q.id === 'pattern' ? { liv: 'pattern' } : schedaDi(q); st.linguetta[s?.liv || q.id] = t.dataset.vLinguetta; st.chiave = ''; disegnaScheda(); return; }
    const tc = e.target.closest('[data-v-taccuino]'); if (tc) { menu.taccuino(tc.dataset.vTaccuino); return; }
    const r = e.target.closest('[data-v-ramo]'); if (r) { $('pannello')?.querySelector(r.dataset.vRamo === '1' ? '[data-ramo-p]:not([data-ramo-p="|0"])' : '[data-ramo-p="|0"]')?.click(); hud.avvisa(r.dataset.vRamo === '1' ? 'Un pianeta parallelo: un solo evento è andato diversamente' : 'Di nuovo il cosmo di partenza'); return; }
    const vp = e.target.closest('[data-v-vola-pianeta]'), vg = e.target.closest('[data-v-vola-galassia]'), c = C(), v = hud.q.via;
    if (vp && c?.universo3d?.vaiA && v) { c.universo3d.vaiA({ galassia: v.galassia, stella: v.stella, pianeta: +vp.dataset.vVolaPianeta }, {}); return; }
    if (vg && c?.universo3d?.vaiA) { c.universo3d.vaiA({ galassia: +vg.dataset.vVolaGalassia }, {}); return; }
  });
  setInterval(() => prova(disegnaScheda), 600);

  // ---------- I TASTI della linguetta, e la tastiera
  const FA = { menu: azioni.menu, lento: () => azioni.tempo(-1), pausa: () => azioni.tempo(0), veloce: () => azioni.tempo(1), esci: azioni.esci, entra: azioni.entra, scheda: () => azioni.scheda(), inquadra: azioni.inquadra, caso: azioni.caso };
  radice.querySelector('.v-linguetta').addEventListener('click', (e) => { const b = e.target.closest('[data-v-tasto]'); if (b) FA[b.dataset.vTasto]?.(); });
  radice.querySelector('.v-finestrella').addEventListener('click', azioni.schermoPieno);
  const TASTI = { m: 'menu', ',': 'lento', p: 'pausa', '.': 'veloce', b: 'esci', a: 'entra', i: 'scheda', f: 'inquadra', r: 'caso', t: 'taccuino' };
  window.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.target?.matches?.('input, textarea, select, [contenteditable]') || document.querySelector('dialog[open]')) return;
    if (e.key === 'Escape') { if (chiudiSopra()) { e.preventDefault(); e.stopImmediatePropagation(); } return; } // (altrimenti Esc resta alla camera)
    const k = TASTI[e.key.length === 1 ? e.key.toLowerCase() : '']; if (!k) return;
    if (k === 'entra' && C()?.vista === 'spaziotempo') return; // (lì A riallinea lo spaziotempo: laboratorio.js)
    e.preventDefault(); e.stopImmediatePropagation();
    const b = radice.querySelector(`[data-v-tasto="${k}"]`); if (b) { b.classList.add('premuto'); setTimeout(() => b.classList.remove('premuto'), 140); }
    if (k === 'taccuino') azioni.taccuino(); else FA[k]?.();
  }, { capture: true });

  // ---------- GLI AVVISI: uno alla volta, da ciò che la camera scrive (gli errori, la ricerca di una finestra bella, la
  // superficie che arriva in secondo piano)
  const visti = { errore: '', cerca: '', finestra: '', superficie: null };
  setInterval(() => {
    const e = $('errore')?.textContent || ''; if (e && e !== visti.errore) hud.avvisa(e, { rosso: true }); visti.errore = e;
    for (const [k, id] of [['cerca', 'cercaStato'], ['finestra', 'finestraStato']]) { const t = $(id)?.textContent || ''; if (t && t !== visti[k] && (k !== 'finestra' || /Trovata/.test(t))) hud.avvisa(t.split(' · ')[0]); visti[k] = t; }
    const v = hud.q.via; if (v?.pianeta != null) { const k = JSON.stringify(v), calc = prova(() => superficieInCalcolo(v), false); if (visti.superficie?.k === k && visti.superficie.calc && !calc) hud.avvisa('Superficie pronta: clima ed erosione'); visti.superficie = { k, calc }; }
  }, 300);

  // la prima volta: la guida, nel taccuino
  try { if (!localStorage.getItem('stateyour.visore.guida')) { localStorage.setItem('stateyour.visore.guida', '1'); setTimeout(() => menu.taccuino('guida'), 800); } } catch { /* senza memoria */ }
  window.__visore = { azioni, hud, menu, scheda: (x) => scheda(x) };
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', costruisci); else costruisci();
