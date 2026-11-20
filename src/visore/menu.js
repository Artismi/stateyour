// menu.js — il menu ≡ (un cassetto da sinistra: la scena si scurisce ma continua a muoversi) e il taccuino (i testi lunghi,
// impaginati per leggere). Il menu ha cinque voci (PROGETTO_VISORE.md, § 5): Seme, Vista, Taccuino, Impostazioni,
// Diagnostica. Ogni comando di prima ha qui il suo posto (§ 11): i comandi si eseguono premendo i bottoni della camera, che
// restano nella pagina (nascosti), così la logica resta una sola, quella di laboratorio.js.
import { ico } from './icone.js';
import { C, catena, scala, lunghezza } from './dati.js';

const $ = (id) => document.getElementById(id);
const prova = (f, d = null) => { try { return f(); } catch { return d; } };
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const VOCI = [['seme', 'seme', 'Seme'], ['vista', 'vista', 'Vista'], ['taccuino', 'taccuino', 'Taccuino', 'T'], ['impostazioni', 'impostazioni', 'Impostazioni'], ['diagnostica', 'diagnostica', 'Diagnostica']];
const voce = (az, icona, testo, { kbd = '', off = false, on = false, titolo = '' } = {}) => `<button data-v-azione="${az}"${off ? ' disabled' : ''} class="${on ? 'on' : ''}"${titolo ? ` title="${esc(titolo)}"` : ''}>${ico(icona)}<span>${testo}</span>${kbd ? `<small>${kbd}</small>` : ''}</button>`;

// LA GUIDA: le istruzioni che stavano sempre a schermo (la riga in basso, i riquadri del pannello), qui una volta sola
const GUIDA = `
<h3>Il visore</h3>
<p>Sullo schermo c'è solo l'universo. Quattro cose stanno sempre ai bordi: <b>dove sei</b> (la catena in alto a sinistra: un clic su un anello vola lì), <b>quanto è grande</b> (il righello a sinistra: l'ago segna la larghezza dello schermo, la banda rosa le grandezze che si vedono adesso; trascinalo per avvicinarti o allontanarti), <b>che cosa guardi</b> (il mirino, con il nome e il tasto che fa la cosa più probabile) e <b>quando</b> (il tempo, in alto a destra: un clic per il passo e la fetta). Tutto il resto si apre a richiesta: la scheda a destra, il menu, questo taccuino.</p>
<h3>I tasti</h3>
<table>
<tr><td><kbd>A</kbd></td><td>entra: vola verso il bersaglio del mirino, o avvicinati di un passo (la ghiera)</td></tr>
<tr><td><kbd>B</kbd></td><td>esci: chiude la scheda o il menu aperti; altrimenti risale di un livello</td></tr>
<tr><td><kbd>I</kbd></td><td>la scheda di ciò che guardi (si chiude con <kbd>B</kbd>, <kbd>Esc</kbd> o ×)</td></tr>
<tr><td><kbd>M</kbd></td><td>il menu: seme, vista, taccuino, impostazioni, diagnostica</td></tr>
<tr><td><kbd>,</kbd> <kbd>P</kbd> <kbd>.</kbd></td><td>il tempo: più lento, pausa, più veloce</td></tr>
<tr><td><kbd>F</kbd></td><td>inquadra: una finestra bella a questa scala (nella cella: una sezione più bella)</td></tr>
<tr><td><kbd>R</kbd></td><td>a caso: un punto a caso dell'universo, scelto con la misura della lingua</td></tr>
<tr><td><kbd>T</kbd></td><td>questo taccuino</td></tr>
<tr><td><kbd>Ctrl</kbd> <kbd>Z</kbd> / <kbd>Y</kbd></td><td>annulla, rifai · <kbd>Ctrl</kbd> <kbd>S</kbd> salva il seme · <kbd>Ctrl</kbd> <kbd>O</kbd> apri un'immagine</td></tr>
</table>
<h3>Il mouse e il volo</h3>
<table>
<tr><td>rotella</td><td>verso ciò che sta sotto il cursore (il prossimo bersaglio ha il mirino); indietro per allontanarti</td></tr>
<tr><td>doppio clic</td><td>vola fin lì (una galassia, una stella, un pianeta)</td></tr>
<tr><td>trascina</td><td>gira il mondo sotto la mano · tasto destro (o Maiusc): orbita · tasto centrale (o Ctrl): guarda attorno</td></tr>
<tr><td><kbd>W</kbd> <kbd>S</kbd> <kbd>D</kbd> <kbd>←</kbd> <kbd>→</kbd></td><td>vola avanti, indietro e di lato · <kbd>Spazio</kbd> e <kbd>C</kbd> su e giù · <kbd>Q</kbd> <kbd>E</kbd> gira la testa · con <kbd>Maiusc</kbd> più in fretta (<kbd>A</kbd>, <kbd>R</kbd> e <kbd>F</kbd> sono i tasti del visore: a sinistra, su e giù con le frecce, Spazio e C)</td></tr>
</table>
<h3>L'universo intero, da esplorare</h3>
<p>Nessun bordo: lo spazio si richiude su sé stesso. Ogni cosa ha una causa più in là: le galassie nascono dove le fluttuazioni dell'inizio hanno lasciato più materia; le stelle nei bracci; i pianeti attorno alle stelle; le regioni nell'anello o nel campo dei pianeti. Avvicinati fino alle particelle, allontanati fino alla rete delle galassie.</p>
<p>Vicino al suolo la rotella scende verso il punto sotto il cursore e lo sguardo si raddrizza piano: il suolo diventa una carta vista dall'alto, poi la roccia o l'acqua di quel punto, i suoi grani, gli atomi in tre dimensioni, la scala quantistica. Più in fondo di così si entra nella finestra delle particelle di quel punto, e la rotella la allarga fino al pattern: il pattern sta in fondo allo zoom, è una scheda in più.</p>
<p>La finestra (<kbd>F</kbd>) è un punto di osservazione qualsiasi, a qualsiasi scala: le galassie, le orbite, i continenti, i fiumi, i cristalli, le particelle. Il disegno c'è già: lo si cerca.</p>
<h3>Nella cella e nel pattern</h3>
<p>Nella cella delle particelle la scheda ha le leggi (accendile e spegnile: la scena si rifà e in grigio resta com'era) e la sezione (l'universo, da dove la guardi, chi guarda, come si ripete). Gli strumenti per aggiungere una particella, un campo, la materia o una massa stanno nel vassoio a sinistra. Il tempo della cella (fino a quando guardare, la fetta, ▶) si apre con un clic sul tempo in alto a destra; il bilanciere lo fa scorrere.</p>
<p class="nota">I caratteri del visore (Inter, Inter Display, JetBrains Mono) sono inclusi nell'app, con licenza libera SIL OFL 1.1: niente rete.</p>`;

export function creaMenu(schermo, { azioni, hud }) {
  const velo = document.createElement('div'); velo.className = 'v-velo';
  const menu = document.createElement('aside'); menu.className = 'v-menu'; menu.setAttribute('aria-label', 'menu');
  menu.innerHTML = `<div class="marchio"><b>STATEYOUR</b><span>visore di ricerca</span></div><nav>${VOCI.map(([id, icona, nome, k]) => `<button data-v-pagina="${id}">${ico(icona)}<span>${nome}</span>${k ? `<kbd>${k}</kbd>` : ''}</button>`).join('')}</nav><div class="pagina"></div>`;
  const tac = document.createElement('section'); tac.className = 'v-taccuino'; tac.setAttribute('aria-label', 'taccuino');
  tac.innerHTML = `<div class="testa">${ico('taccuino')}<h2>Il taccuino</h2><button class="chiudi" title="chiudi (B, Esc)">${ico('g-chiudi')}</button></div><nav><button data-v-foglio="guida">Guida</button><button data-v-foglio="qui">Dove sei</button><button data-v-foglio="spiega">Le spiegazioni</button></nav><div class="foglio"></div>`;
  schermo.append(velo, menu, tac);
  const pagina = menu.querySelector('.pagina'), foglio = tac.querySelector('.foglio');
  const st = { aperto: false, pagina: 'seme', taccuino: false, foglio: 'guida', giro: 0 };

  // ---------- le pagine del menu
  const bottone = (sel) => document.querySelector(sel);
  const tele = () => schermo.querySelector('.tele');
  function paginaSeme() {
    const c = C(), anelli = prova(() => catena(hud.q), []), bolla = prova(() => c?.bolla, null);
    const ramo = bottone('#pannello [data-ramo-p]:not([data-ramo-p="|0"])'), ritorno = bottone('#pannello [data-ramo-p="|0"]');
    return `<h4>L'indirizzo</h4><p class="indirizzo">${anelli.map((a) => esc(a.nome)).join(' › ')}</p>
      ${bolla ? `<div class="campo"><input id="v-bolla" value="${esc(bolla)}" spellcheck="false" title="la bolla: il luogo, l'istante, la posizione e lo sguardo"><button class="v-bottone" data-v-azione="bolla" title="vai alla bolla scritta qui">vai</button></div>` : ''}
      <div class="voci">${voce('caso', 'dado', 'Un punto a caso', { kbd: 'R' })}${voce('ramo', 'ramo', 'Un pianeta parallelo', { off: !ramo, titolo: 'lo stesso pianeta in un cosmo dove un solo evento è andato diversamente' })}${ritorno ? voce('ritorno', 'annulla', 'Il cosmo di partenza') : ''}</div>
      <h4>Il seme</h4><div class="voci">${voce('file:nuovo', 'seme', 'Nuovo…', { titolo: "un esempio, un modello o un'immagine" })}${voce('file:immagine', 'inquadra', "Apri un'immagine…", { kbd: 'Ctrl O' })}${voce('file:apri', 'taccuino', 'Apri un seme…')}${voce('file:salva', 'entra', 'Salva il seme', { kbd: 'Ctrl S' })}${voce('file:png', 'schermo', "Esporta l'immagine (.png)")}${voce('file:testo', 'menu', 'Il seme come testo')}</div>
      <div class="voci">${voce('annulla', 'annulla', 'Annulla', { kbd: 'Ctrl Z' })}${voce('rifai', 'rifai', 'Rifai', { kbd: 'Ctrl Y' })}</div>`;
  }
  function paginaVista() {
    const c = C(), v = c?.vista, modo = (m) => bottone(`.tele [data-modo="${m}"]`), piatta = bottone('.tele [data-t="piatta"]'), spazio = [...(tele()?.querySelectorAll(':scope > button') || [])].find((b) => /nello spazio/.test(b.textContent));
    const piano = modo('piano');
    return `<h4>Che cosa si guarda</h4><div class="voci">${voce('modo:cosmo', 'cosmo', "Osserva l'universo (3D)", { on: v === 'cosmo', off: !modo('cosmo') || modo('cosmo').hidden })}${voce('modo:finestra', 'inquadra', 'La finestra', { on: v === 'finestra', off: !modo('finestra') || modo('finestra').hidden })}${voce('modo:piano', 'materia', piano?.textContent === "l'universo" ? "L'universo della cella" : 'Il piano della cella', { on: v === 'dettaglio' })}${voce('vai:spaziotempo', 'tempo', 'Lo spaziotempo', { on: v === 'spaziotempo', off: !(v === 'finestra' || v === 'dettaglio') })}${voce('vai:pattern', 'pattern', 'Il pattern', { on: v === 'pattern' })}</div>
      <h4>Lo spazio</h4><div class="voci">${piatta ? voce('piatta', 'clima', 'La mappa piatta', { titolo: 'la mappa di prima, con le regioni in cui entrare' }) : ''}${spazio ? voce('spazio', 'pianeta', 'Di nuovo nello spazio (3D)') : ''}${voce('passo', 'tempo', 'Il passo del tempo che ha senso qui', { off: !bottone('.tele [data-t="passo"]') })}${voce('schermo', 'schermo', document.fullscreenElement ? 'Esci dallo schermo pieno' : 'Schermo pieno')}</div>`;
  }
  function paginaImpostazioni() {
    const c = C(), ad = c?.mondo3d?.stato?.adattamento, colori = $('coloriForze');
    const occhio = ad && Number.isFinite(ad.LA) ? `${ad.LA >= 0.1 ? ad.LA.toPrecision(2).replace('.', ',') : ad.LA.toExponential(0).replace('e', '·10^')} cd/m²` : '–', visione = !ad ? '–' : ad.LA <= 1.0001e-6 ? 'alla sua soglia: quasi non vede' : ad.coni <= 0 ? 'notturna, senza colori' : ad.coni < 1 ? 'crepuscolo: i colori sbiadiscono' : 'diurna, a colori';
    return `<h4>L'occhio</h4><div class="riga-d"><span>adattato a</span><b>${occhio}</b></div><div class="riga-d"><span>la visione</span><b>${visione}</b></div><p class="nota" style="margin:8px 0 18px;color:var(--avorio-50)">L'occhio si adatta alla luce della fovea (2°): sotto la sua soglia ciò che c'è resta scuro.</p>
      <h4>Il visore</h4>
      <label class="inter">Le etichette nello spazio<input type="checkbox" data-v-imp="etichette" ${document.body.classList.contains('v-senza-etichette') ? '' : 'checked'}></label>
      <label class="inter">Linee colorate per forza (nella cella)<input type="checkbox" data-v-imp="colori" ${colori ? (colori.checked ? 'checked' : '') : 'disabled'}></label>
      <label class="inter">Schermo pieno<input type="checkbox" data-v-imp="schermo" ${document.fullscreenElement ? 'checked' : ''}></label>
      <div class="riga-d"><span>Le unità</span><b>metri (SI), anni luce, UA</b></div>`;
  }
  function paginaDiagnostica() {
    const c = C(), M = c?.mondo3d, s = M ? prova(() => M.statistiche()) : null, t = tele(), W = t?.clientWidth || 0, sc = prova(() => scala(W));
    const tele3 = M?.tela, ora = performance.now(); if (s && st.fot0) { st.fps = ((s.fotogrammi - st.fot0.n) * 1000) / Math.max(1, ora - st.fot0.t); } if (s) st.fot0 = { n: s.fotogrammi, t: ora };
    const righe = [['la camera', c?.vista || '–'], ['il livello', hud.q?.id || '–'], ['metri per pixel', sc ? lunghezza(sc.mpp) : '–'], ['lo schermo è largo', sc ? lunghezza(sc.larghezza) : '–'],
      ['la tela', t ? `${t.clientWidth} × ${t.clientHeight} px` : '–'], ['il buffer 3D', tele3 ? `${tele3.width} × ${tele3.height} (${(tele3.width / Math.max(1, tele3.height)).toFixed(3)} · tela ${(tele3.clientWidth / Math.max(1, tele3.clientHeight)).toFixed(3)})` : '–'],
      ['fotogrammi', s ? `${s.fotogrammi}${st.fps != null ? ` · ${st.fps.toFixed(1)} al secondo` : ''}` : '–'], ['le misure della cella', $('misure')?.textContent || '–']];
    return `<h4>I numeri</h4>${righe.map(([a, b]) => `<div class="riga-d"><span>${a}</span><b>${esc(b)}</b></div>`).join('')}<h4 style="margin-top:18px">La barra di scala</h4><p class="lungo">${esc(sc?.barra || '–')}</p>${s ? `<h4 style="margin-top:18px">Il motore</h4><p class="lungo">${esc(JSON.stringify(s, (k, v) => (typeof v === 'number' ? Math.round(v * 100) / 100 : v)).slice(0, 900))}</p>` : ''}`;
  }
  const PAGINE = { seme: paginaSeme, vista: paginaVista, impostazioni: paginaImpostazioni, diagnostica: paginaDiagnostica };
  function disegnaPagina() {
    for (const b of menu.querySelectorAll('[data-v-pagina]')) b.classList.toggle('on', b.dataset.vPagina === st.pagina);
    const f = PAGINE[st.pagina]; if (f) { const aperto = document.activeElement?.id === 'v-bolla'; if (!aperto) pagina.innerHTML = prova(f, ''); }
  }
  function apri(p = st.pagina) {
    if (p === 'taccuino') { chiudi(); taccuino(); return; }
    st.pagina = p; st.aperto = true; menu.classList.add('on'); velo.classList.add('on'); disegnaPagina();
    clearInterval(st.giro); st.giro = setInterval(() => { if (st.pagina === 'diagnostica' || st.pagina === 'impostazioni') disegnaPagina(); }, 700);
  }
  function chiudi() { st.aperto = false; menu.classList.remove('on'); if (!st.taccuino) velo.classList.remove('on'); clearInterval(st.giro); }
  menu.addEventListener('click', (e) => {
    const p = e.target.closest('[data-v-pagina]'); if (p) { apri(p.dataset.vPagina); return; }
    const b = e.target.closest('[data-v-azione]'); if (!b || b.disabled) return; const [az, arg] = b.dataset.vAzione.split(':');
    const premi = (sel) => { const x = bottone(sel); if (x) x.click(); return !!x; };
    if (az === 'file') { premi(`[data-file="${arg}"]`); chiudi(); return; }
    if (az === 'annulla' || az === 'rifai') { premi(`#${az}`); return; }
    if (az === 'caso') { chiudi(); azioni.caso(); return; }
    if (az === 'ramo') { premi('#pannello [data-ramo-p]:not([data-ramo-p="|0"])'); chiudi(); return; }
    if (az === 'ritorno') { premi('#pannello [data-ramo-p="|0"]'); chiudi(); return; }
    if (az === 'bolla') { const ok = C()?.vaiAllaBolla?.($('v-bolla')?.value || ''); hud.avvisa(ok ? 'Si va alla bolla scritta' : 'Questa bolla non si legge', { rosso: !ok }); if (ok) chiudi(); return; }
    if (az === 'modo') { premi(`.tele [data-modo="${arg}"]`); chiudi(); return; }
    if (az === 'vai') { C()?.vai(arg); chiudi(); return; }
    if (az === 'piatta') { premi('.tele [data-t="piatta"]'); chiudi(); return; }
    if (az === 'spazio') { const x = [...(tele()?.querySelectorAll(':scope > button') || [])].find((y) => /nello spazio/.test(y.textContent)); x?.click(); chiudi(); return; }
    if (az === 'passo') { premi('.tele [data-t="passo"]'); return; }
    if (az === 'schermo') { azioni.schermoPieno(); setTimeout(disegnaPagina, 300); }
  });
  menu.addEventListener('change', (e) => {
    const k = e.target.dataset.vImp; if (!k) return;
    if (k === 'etichette') document.body.classList.toggle('v-senza-etichette', !e.target.checked);
    if (k === 'colori') { const x = $('coloriForze'); if (x) { x.checked = e.target.checked; x.dispatchEvent(new Event('change', { bubbles: true })); } }
    if (k === 'schermo') azioni.schermoPieno();
  });
  menu.addEventListener('keydown', (e) => { if (e.target.id === 'v-bolla' && e.key === 'Enter') menu.querySelector('[data-v-azione="bolla"]')?.click(); });
  // un clic sulla scena (fuori dal menu e dal taccuino) li chiude; il velo non prende mai la mano: la rotella resta alla scena
  document.addEventListener('pointerdown', (e) => { if (!st.aperto && !st.taccuino) return; if (e.target.closest?.('.v-menu, .v-taccuino, .v-linguetta, dialog')) return; chiudi(); chiudiTaccuino(); }, true);

  // ---------- il taccuino
  function testoPannello() {
    const p = $('pannello'); if (!p) return ''; const k = p.cloneNode(true);
    k.querySelectorAll('button, input, select, .riga-bottoni, .cursore, .universo, .briciole, label.riga, .interr, .elenco').forEach((x) => x.remove());
    k.querySelectorAll('[id]').forEach((x) => x.removeAttribute('id')); k.querySelectorAll('[style]').forEach((x) => { if (x.tagName !== 'IMG') x.removeAttribute('style'); });
    return k.innerHTML.trim();
  }
  function disegnaFoglio() {
    for (const b of tac.querySelectorAll('[data-v-foglio]')) b.classList.toggle('on', b.dataset.vFoglio === st.foglio);
    if (st.foglio === 'guida') foglio.innerHTML = GUIDA;
    else if (st.foglio === 'qui') { const c = C(); foglio.innerHTML = `<h3>L'indirizzo</h3><p><b>${prova(() => catena(hud.q), []).map((a) => esc(a.nome)).join(' › ')}</b></p><h3>Che cosa c'è qui</h3><p>${esc($('dove')?.textContent || '')}</p>${$('errore')?.textContent ? `<p class="nota">${esc($('errore').textContent)}</p>` : ''}${c?.bolla ? `<h3>La bolla</h3><p class="nota" style="font-family:var(--cifre);word-break:break-all">${esc(c.bolla)}</p>` : ''}`; }
    else { const h = testoPannello(); foglio.innerHTML = h || '<p class="nota">Qui non ci sono spiegazioni.</p>'; }
  }
  function taccuino(f = st.foglio) { st.foglio = f; st.taccuino = true; tac.classList.add('on'); velo.classList.add('on'); disegnaFoglio(); foglio.scrollTop = 0; }
  function chiudiTaccuino() { st.taccuino = false; tac.classList.remove('on'); if (!st.aperto) velo.classList.remove('on'); }
  tac.addEventListener('click', (e) => { if (e.target.closest('.chiudi')) { chiudiTaccuino(); return; } const f = e.target.closest('[data-v-foglio]'); if (f) { st.foglio = f.dataset.vFoglio; disegnaFoglio(); } });
  return { apri, chiudi, taccuino, chiudiTaccuino, get aperto() { return st.aperto; }, get taccuinoAperto() { return st.taccuino; }, toggle() { if (st.aperto) chiudi(); else apri(); } };
}
