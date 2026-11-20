// hud.js — l'HUD sempre visibile, e nient'altro (PROGETTO_VISORE.md, § 3): la catena dell'indirizzo (dove sono?), il
// righello logaritmico della scala con l'ago (quanto è grande?), il mirino sul bersaglio con il nome e «A · entra» (che cosa
// guardo?), il tempo (quando?) e un solo avviso alla volta in basso.
// Il mirino veste la logica della camera (laboratorio.js, segni3d): l'anello del prossimo bersaglio e il suo nome li calcola
// lei; qui si leggono dalla pagina e si disegnano con gli angoli, il giro tratteggiato e l'etichetta. Quando l'anello non
// c'è (la cosa a cui si è attaccati riempie lo schermo) il mirino sta sul corpo stesso, proiettato con gli assi della camera.
import { ico, LIVELLI } from './icone.js';
import { C, quiOra, catena, scala, lunghezza, tempoOra, ORDINE } from './dati.js';

const NS = 'http://www.w3.org/2000/svg';
const D0 = 26, D1 = -15; // il righello: da 10²⁶ m (in alto) a 10⁻¹⁵ m (in basso)
// dove stanno le icone dei livelli sul righello (in decadi di metri: la grandezza tipica dello schermo a quel livello)
const POSTI = { cosmo: 25.2, galassia: 20.8, stella: 12.5, pianeta: 7.17, terreno: 1.8, materia: -3.5, atomo: -9.8, particella: -14.2 };
const prova = (f, d = null) => { try { return f(); } catch { return d; } };

export function creaHud(schermo, { azioni }) {
  const hud = document.createElement('div'); hud.className = 'v-hud';
  hud.innerHTML = `
    <div class="v-chip v-catena" role="navigation" aria-label="dove sei"></div>
    <button class="v-chip v-tempo" title="il tempo: clic per il passo e la fetta">${ico('tempo')}<b>tempo vero</b><span class="vel"><i></i><i></i><i></i><i></i></span><small></small></button>
    <div class="v-righello" title="la scala: trascina l'ago per avvicinarti o allontanarti; clic su un'icona per andare a quel livello"></div>
    <div class="v-barra"><i></i><span></span></div>
    <svg class="v-mirino"><circle class="giro"/><path class="ang"/><path class="ang"/><path class="ang"/><path class="ang"/><path class="card"/><path class="guida"/><circle class="punto" r="2.6"/></svg>
    <div class="v-etichetta" hidden title="apri la scheda (I)"><div class="r1">${ico('pianeta')}<span></span></div><div class="r2"></div><div class="tasto-a"><kbd>A</kbd><span>entra</span></div></div>
    <div class="v-chip v-avviso" hidden role="status"><span class="punto"></span><span class="t"></span></div>`;
  schermo.appendChild(hud);
  const $ = (s) => hud.querySelector(s);
  const elCatena = $('.v-catena'), elTempo = $('.v-tempo'), elRighello = $('.v-righello'), elBarra = $('.v-barra'), svg = $('.v-mirino'), elEtichetta = $('.v-etichetta'), elAvviso = $('.v-avviso');
  const stato = { q: { id: 'cosmo' }, chiaveCatena: '', mirino: null, nomeMirino: '', alto: 0 };

  // ---------- LA CATENA: ogni anello porta su a quel livello; l'ultimo è «qui»
  function disegnaCatena(q) {
    const anelli = catena(q), k = JSON.stringify(anelli); stato.ultimo = anelli.at(-1); if (k === stato.chiaveCatena) return; stato.chiaveCatena = k;
    elCatena.innerHTML = anelli.map((a, i) => `${i ? ico('g-sep', 'sep') : ''}<button class="${a.qui ? 'qui' : ''}" data-liv="${a.liv}" title="${a.qui ? `${a.nome}: la sua scheda (I)` : `vola a ${a.nome.toLowerCase()}`}">${ico(a.liv)}${a.qui ? a.nome : a.n}</button>`).join('');
  }
  elCatena.addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; if (b.classList.contains('qui')) azioni.scheda(true); else azioni.vaiAlLivello(b.dataset.liv); });

  // ---------- IL RIGHELLO: una tacca per decade, le icone dei livelli, la banda di ciò che si vede (da un pixel alla
  // larghezza dello schermo), l'ago sulla larghezza dello schermo
  const y = (d) => 16 + ((D0 - d) / (D0 - D1)) * (stato.alto - 32);
  function costruisciRighello() {
    const H = elRighello.clientHeight; if (!H || H === stato.alto) return; stato.alto = H; let h = '';
    for (let d = D0; d >= D1; d--) h += `<i class="tacca" style="top:${y(d).toFixed(1)}px;width:${d % 5 === 0 ? 9 : 5}px;opacity:${d % 5 === 0 ? 1 : 0.55}"></i>`;
    h += '<div class="vista"></div>';
    for (const [id, d] of Object.entries(POSTI)) h += `<button class="liv" data-liv="${id}" style="top:${y(d).toFixed(1)}px" title="${id === 'terreno' ? 'il suolo' : id === 'particella' ? 'le particelle' : `il livello: ${id}`}">${ico(id)}</button>`;
    h += '<div class="ago"></div><div class="lettura"><b></b><small>largo lo schermo</small></div>';
    elRighello.innerHTML = h;
  }
  function aggiornaRighello(q, sc) {
    costruisciRighello(); const ago = elRighello.querySelector('.ago'), let_ = elRighello.querySelector('.lettura'), banda = elRighello.querySelector('.vista'); if (!ago) return;
    const qui = q.id === 'pattern' ? (q.materia ? 'particella' : null) : q.id;
    for (const b of elRighello.querySelectorAll('.liv')) b.classList.toggle('qui', b.dataset.liv === qui);
    if (!sc) { ago.hidden = let_.hidden = banda.hidden = true; return; }
    ago.hidden = let_.hidden = banda.hidden = false;
    const dL = Math.max(D1, Math.min(D0, Math.log10(sc.larghezza))), d1 = Math.max(D1, Math.min(D0, Math.log10(sc.mpp)));
    ago.style.top = `${y(dL).toFixed(1)}px`; let_.style.top = `${y(dL).toFixed(1)}px`; let_.querySelector('b').textContent = lunghezza(sc.larghezza);
    banda.style.top = `${(y(dL) - 9).toFixed(1)}px`; banda.style.height = `${(y(d1) - y(dL) + 18).toFixed(1)}px`;
    // (l'icona del livello coperta dall'ago scende dentro la banda, sotto l'ago)
    for (const b of elRighello.querySelectorAll('.liv')) { const d = POSTI[b.dataset.liv], yy = y(d); b.style.top = `${(Math.abs(yy - y(dL)) < 14 ? y(dL) + 22 : yy).toFixed(1)}px`; }
  }
  elRighello.addEventListener('click', (e) => { const b = e.target.closest('.liv'); if (!b || trascinato) return; azioni.vaiAlLivello(b.dataset.liv); });
  // trascinare l'ago (o il righello): lo zoom, come la rotella (in giù si avvicina)
  let presa = null, trascinato = false;
  elRighello.addEventListener('pointerdown', (e) => { if (e.target.closest('.liv')) return; presa = e.clientY; trascinato = false; elRighello.setPointerCapture(e.pointerId); });
  elRighello.addEventListener('pointermove', (e) => { if (presa == null) return; const dy = e.clientY - presa; if (Math.abs(dy) < 6) return; trascinato = true; presa = e.clientY; azioni.ghiera(dy > 0 ? -1 : 1, Math.min(3, Math.round(Math.abs(dy) / 6))); });
  const lascia = () => { presa = null; setTimeout(() => { trascinato = false; }, 0); }; elRighello.addEventListener('pointerup', lascia); elRighello.addEventListener('pointercancel', lascia);

  // ---------- IL TEMPO
  function aggiornaTempo() {
    const t = tempoOra(); if (!t) return;
    elTempo.querySelector('b').textContent = t.testo || '–'; elTempo.querySelector('small').textContent = t.rapporto || '';
    elTempo.classList.toggle('pausa', !!t.pausa);
    [...elTempo.querySelectorAll('.vel i')].forEach((i, k) => i.classList.toggle('on', k < t.tacche));
    elTempo.querySelector('.vel').hidden = !t.tre;
  }
  elTempo.addEventListener('click', () => azioni.popTempo());

  // ---------- IL MIRINO
  const [giro, a1, a2, a3, a4, card, guida, punto] = svg.children, angoli = [a1, a2, a3, a4];
  // dal vettore occhio → cosa (assi del mondo) al punto dello schermo, come la camera (laboratorio.js, aSchermo)
  function proietta(S, p, W, H) {
    const a = S.assi; if (!a || !p) return null; const x = p[0] * a[0] + p[1] * a[3] + p[2] * a[6], yy = p[0] * a[1] + p[1] * a[4] + p[2] * a[7], z = p[0] * a[2] + p[1] * a[5] + p[2] * a[8]; if (z >= 0) return null;
    return { x: W / 2 + (x / -z / S.tanX) * (W / 2), y: H / 2 - (yy / -z / S.tanY) * (H / 2), k: H / 2 / (Math.hypot(p[0], p[1], p[2]) * S.tanY) };
  }
  function bersaglio(W, H) {
    const c = C(), q = stato.q; if (!c || q.id === 'pattern') return null;
    if (q.tre) {
      const seg = schermo.querySelector('.segni3d'), an = seg?.children[0], nm = seg?.children[1];
      if (an && !an.hidden && an.style.left) return { x: parseFloat(an.style.left), y: parseFloat(an.style.top), r: parseFloat(an.style.width) / 2 - 5, nome: nm?.textContent || '', tipo: 'anello', volo: an.classList.contains('fermo') };
      const M = c.mondo3d, S = M.stato, corpo = M.camera.corpo;
      if (corpo?.raggio > 0 && S.versoCorpo) { const p = prova(() => S.versoCorpo(corpo, [0, 0, 0])), s = p ? proietta(S, p, W, H) : null; if (s) { const r = corpo.raggio * s.k; if (r > 8 && r < 0.62 * H && s.x > 0 && s.x < W && s.y > 0 && s.y < H) return { x: s.x, y: s.y, r, tipo: 'corpo', diametro: 2 * corpo.raggio }; } }
    }
    return { x: W / 2, y: H / 2, r: Math.min(W, H) * 0.075, tipo: 'centro' };
  }
  function nomeDelBersaglio(b) {
    const q = stato.q, ultimo = stato.ultimo; // (la catena si rifà cinque volte al secondo, non a ogni fotogramma)
    if (b.tipo === 'anello') return { nome: b.nome.replace(/^in volo verso /, ''), r2: b.volo ? 'in volo' : 'doppio clic · vola', liv: /galassia/.test(b.nome) ? 'galassia' : /stella/.test(b.nome) ? 'stella' : /luna|pianeta/.test(b.nome) ? 'pianeta' : 'mirino' };
    let r2 = '';
    if (b.tipo === 'corpo') r2 = `Ø ${lunghezza(b.diametro)}${q.quota != null ? ` · a ${lunghezza(Math.max(0, q.quota))}` : ''}`;
    else if (q.id === 'terreno' && q.quota != null) r2 = `a ${lunghezza(Math.max(0, q.quota))} dal suolo`;
    else if (q.id === 'atomo') { const d = document.getElementById('dove')?.textContent || ''; if (d && d.length < 90 && !/Rotella|rotella/.test(d)) r2 = d; }
    return { nome: ultimo?.nome || '', r2, liv: ultimo?.liv || q.id };
  }
  function disegnaMirino() {
    const W = schermo.querySelector('.tele')?.clientWidth || schermo.clientWidth, H = schermo.clientHeight;
    const b = bersaglio(W, H); stato.mirino = b;
    if (!b) { svg.style.display = 'none'; elEtichetta.hidden = true; return; }
    svg.style.display = ''; const centro = b.tipo === 'centro', r = Math.max(10, b.r), k = r + (centro ? 6 : 20), Lg = centro ? Math.min(14, r * 0.5) : Math.max(8, Math.min(30, r * 0.4));
    svg.setAttribute('width', W); svg.setAttribute('height', H);
    giro.setAttribute('cx', b.x); giro.setAttribute('cy', b.y); giro.setAttribute('r', r + 12); giro.style.display = centro ? 'none' : '';
    [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([sx, sy], i) => angoli[i].setAttribute('d', `M${b.x + sx * k} ${b.y + sy * (k - Lg)}V${b.y + sy * k}H${b.x + sx * (k - Lg)}`));
    card.setAttribute('d', centro ? `M${b.x - 4} ${b.y}H${b.x + 4}M${b.x} ${b.y - 4}V${b.y + 4}` : [[0, -1], [1, 0], [0, 1], [-1, 0]].map(([sx, sy]) => `M${b.x + sx * (r + 6)} ${b.y + sy * (r + 6)}L${b.x + sx * (r + 16)} ${b.y + sy * (r + 16)}`).join(''));
    // l'etichetta, in alto a destra del mirino (a sinistra se non c'è posto), con la guida dall'angolo
    const n = nomeDelBersaglio(b); stato.nomeMirino = n.nome;
    const e1 = elEtichetta.querySelector('.r1 span'), e2 = elEtichetta.querySelector('.r2'); if (e1.textContent !== n.nome) e1.textContent = n.nome; if (e2.textContent !== n.r2) e2.textContent = n.r2;
    const uso = elEtichetta.querySelector('.r1 use'); if (uso.getAttribute('href') !== `#i-${n.liv}`) uso.setAttribute('href', `#i-${n.liv}`);
    elEtichetta.hidden = !n.nome; if (!n.nome) { guida.setAttribute('d', ''); punto.style.display = 'none'; return; }
    const lw = elEtichetta.offsetWidth || 160, lh = elEtichetta.offsetHeight || 60, x0 = b.x + k * 0.72, y0 = b.y - k * 0.72;
    let lx = b.x + k + 24, ly = b.y - k - lh + 6, destra = true;
    if (lx + lw > W - 12) { lx = b.x - k - 24 - lw; destra = false; }
    if (lx < 80) { lx = Math.min(W - lw - 12, Math.max(80, b.x - lw / 2)); }
    ly = Math.max(72, Math.min(H - lh - 110, ly));
    elEtichetta.style.left = `${lx.toFixed(1)}px`; elEtichetta.style.top = `${ly.toFixed(1)}px`;
    const gx = destra ? lx - 10 : lx + lw + 10, gy = ly + 8;
    guida.setAttribute('d', centro ? '' : `M${(destra ? x0 : b.x - k * 0.72).toFixed(1)} ${y0.toFixed(1)}L${gx.toFixed(1)} ${Math.min(gy + 30, y0).toFixed(1)}V${gy.toFixed(1)}`);
    punto.style.display = centro ? 'none' : ''; punto.setAttribute('cx', (destra ? x0 : b.x - k * 0.72).toFixed(1)); punto.setAttribute('cy', y0.toFixed(1));
    // (l'etichetta della camera che dice lo stesso nome del mirino si nasconde: un nome solo per cosa)
    for (const s of schermo.querySelectorAll('.segni3d > span:not(.meta)')) s.style.visibility = s.textContent && s.textContent.toLowerCase() === n.nome.toLowerCase() ? 'hidden' : '';
  }
  elEtichetta.addEventListener('click', (e) => { if (e.target.closest('.tasto-a')) azioni.entra(); else azioni.scheda(true); });

  // ---------- L'AVVISO: uno alla volta, sparisce da solo
  let timerAvviso = 0, ultimoAvviso = '';
  function avvisa(testo, { rosso = false, durata = 5200 } = {}) {
    testo = String(testo || '').replace(/\s+/g, ' ').trim(); if (!testo) return; if (testo.length > 110) testo = `${testo.slice(0, 108)}…`;
    if (testo === ultimoAvviso && !elAvviso.hidden) { clearTimeout(timerAvviso); timerAvviso = setTimeout(() => { elAvviso.hidden = true; }, durata); return; }
    ultimoAvviso = testo; elAvviso.querySelector('.t').textContent = testo; elAvviso.classList.toggle('rosso', rosso); elAvviso.hidden = false;
    clearTimeout(timerAvviso); timerAvviso = setTimeout(() => { elAvviso.hidden = true; }, durata);
  }

  // ---------- il giro: il mirino a ogni fotogramma, il resto cinque volte al secondo
  let ultimoLento = 0;
  function giroHud(ora) {
    requestAnimationFrame(giroHud);
    if (ora - ultimoLento > 200) {
      ultimoLento = ora; stato.q = prova(quiOra, stato.q) || stato.q;
      prova(() => disegnaCatena(stato.q));
      const W = schermo.querySelector('.tele')?.clientWidth || schermo.clientWidth, sc = prova(() => scala(W));
      prova(() => aggiornaRighello(stato.q, sc));
      if (sc && sc.tratto > 0) { elBarra.hidden = false; elBarra.querySelector('i').style.width = `${sc.tratto.toFixed(1)}px`; elBarra.querySelector('span').textContent = sc.trattoNome; } else elBarra.hidden = true;
      prova(aggiornaTempo);
    }
    prova(disegnaMirino);
  }
  requestAnimationFrame(giroHud);
  window.addEventListener('resize', () => { stato.alto = 0; });
  return { avvisa, get q() { return stato.q; }, get mirino() { return stato.mirino; }, aggiornaOra: () => { ultimoLento = 0; stato.chiaveCatena = ''; } };
}
export { ORDINE, LIVELLI };
