// grafica.js — i dati diventano grafica (PROGETTO_VISORE.md, § 6). Ogni grandezza ha la sua forma, e la stessa grandezza ha
// la stessa forma in ogni scheda: la temperatura è sempre un termometro, l'aria un anello, l'acqua una goccia, le grandezze
// singole tessere con icona, cifra e una parola. Tutte funzioni pure: dati → una stringa HTML/SVG, larga quanto la scheda.
import { ico } from './icone.js';

export const L = 364; // la larghezza utile della scheda (400 − i margini)
const cl = (x, a, b) => Math.max(a, Math.min(b, x));
export const num1 = (x) => (Number.isFinite(x) ? x.toLocaleString('it-IT', { minimumFractionDigits: x < 10 ? 1 : 0, maximumFractionDigits: x < 10 ? 1 : 0 }) : '–');
export const num = (x, d = 0) => (Number.isFinite(x) ? x.toLocaleString('it-IT', { maximumFractionDigits: d, minimumFractionDigits: 0 }) : '–');
// due cifre significative, all'italiana, con la potenza di dieci quando serve
export function sig(x, n = 2) {
  if (!Number.isFinite(x)) return '–'; if (x === 0) return '0';
  const a = Math.abs(x); if (a >= 1e-3 && a < 1e6) return Number(x.toPrecision(n)).toLocaleString('it-IT', { maximumFractionDigits: 6 });
  const e = Math.floor(Math.log10(a)), m = x / 10 ** e; return `${Number(m.toPrecision(n)).toLocaleString('it-IT')}·10${apice(e)}`;
}
export const apice = (n) => String(n).replace('-', '⁻').split('').map((c) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[+c] ?? c).join('');
// le formule chimiche con i pedici (N2 → N₂, SO4(2-) → SO₄²⁻)
export function formula(s) {
  return String(s).replace(/\((\d?)([+-])\)$/, (m, n, seg) => `${n ? apice(+n) : ''}${seg === '+' ? '⁺' : '⁻'}`).replace(/(\d)([+-])$/, (m, n, seg) => `${apice(+n)}${seg === '+' ? '⁺' : '⁻'}`).replace(/([+-])$/, (m) => (m === '+' ? '⁺' : '⁻')).replace(/(?<=[A-Za-z)])(\d+)/g, (m) => m.split('').map((c) => '₀₁₂₃₄₅₆₇₈₉'[+c]).join(''));
}
// un'intestazione di sezione: icona, nome in maiuscolo spaziato, a destra il contesto in cifre
export const sezione = (icona, titolo, destra = '', corpo = '', cls = '') => `<div class="v-sez ${cls}"><h3>${icona ? ico(icona) : ''}<span class="t">${titolo}</span>${destra ? `<span class="d">${destra}</span>` : ''}</h3>${corpo}</div>`;
export const etichette = (lista) => `<div class="v-etichette">${lista.filter(Boolean).map((t) => `<span>${t}</span>`).join('')}</div>`;

// IL TERMOMETRO: da lo a hi °C, il colore dal freddo al caldo; la banda tratteggiata dell'acqua liquida alla pressione del
// pianeta; l'anello vuoto senz'aria (Teq) e l'arco di quanto aggiunge l'aria fino al punto pieno
export function termometro({ T, Teq = null, acqua = null, W = L }) {
  const vals = [T, Teq, ...(acqua || [])].filter(Number.isFinite);
  const lo = Math.min(-150, Math.floor((Math.min(...vals) - 20) / 50) * 50), hi = Math.max(150, Math.ceil((Math.max(...vals) + 20) / 50) * 50);
  const tx = (t) => 6 + ((cl(t, lo, hi) - lo) / (hi - lo)) * (W - 12), segno = (t) => (t > 0 ? '+' : t < 0 ? '−' : '');
  let s = '', sotto = null;
  if (acqua && acqua[1] > acqua[0]) s += `<rect x="${tx(acqua[0])}" y="10" width="${Math.max(2, tx(acqua[1]) - tx(acqua[0]))}" height="22" rx="5" fill="#8ecfe0" fill-opacity=".10" stroke="#8ecfe0" stroke-opacity=".38" stroke-dasharray="2 3"/><text class="lab" x="${cl(tx(acqua[0]) + 4, 6, W - 90)}" y="6" style="fill:#8ecfe0">ACQUA LIQUIDA</text>`;
  s += `<rect x="6" y="18" width="${W - 12}" height="6" rx="3" fill="url(#v-gr-termo)" opacity=".9"/>`;
  if (Number.isFinite(Teq) && Math.abs(T - Teq) > 3) {
    const a = tx(Teq), b = tx(T), d = Math.round(T - Teq);
    s += `<path d="M${a} 34 C ${a} 50, ${b} 50, ${b} 36" fill="none" stroke="rgba(244,236,223,.55)" stroke-width="1.2" stroke-dasharray="3 3"/><path d="M${b - 4} 40 L${b} 35 L${b + 4} 40" fill="none" stroke="rgba(244,236,223,.7)" stroke-width="1.2"/>`;
    s += `<text class="lab" x="${cl((a + b) / 2, 50, W - 50)}" y="60" text-anchor="middle">${segno(d)}${Math.abs(d)}° DALL'ARIA</text>`;
    s += `<circle cx="${a}" cy="21" r="6" fill="#1a050b" stroke="#8ecfe0" stroke-width="1.6"/><text x="${cl(a, 40, W - 40)}" y="${acqua && a + 48 > tx(acqua[0]) && a - 48 < tx(acqua[1]) ? 46 : 6}" text-anchor="middle">${segno(Math.round(Teq))}${Math.abs(Math.round(Teq))}° senz'aria</text>`;
    sotto = acqua && a + 48 > tx(acqua[0]) && a - 48 < tx(acqua[1]) ? a : null;
  }
  s += `<circle cx="${tx(T)}" cy="21" r="8" fill="#ff5a78" opacity=".35"/><circle cx="${tx(T)}" cy="21" r="5.5" fill="#f4ecdf" stroke="#ff5a78" stroke-width="2"/>`;
  if (sotto == null || sotto > 70) s += `<text x="6" y="46">${segno(lo)}${Math.abs(lo)}</text>`; if (sotto == null || sotto < W - 70) s += `<text x="${W - 6}" y="46" text-anchor="end">${segno(hi)}${Math.abs(hi)}</text>`;
  return `<svg class="v-termo" viewBox="0 0 ${W} 64" width="${W}" height="64">${s}</svg>`;
}
// il numero grande della temperatura
export const temperatura = (T, nota) => `<div class="v-grande"><b>${segnoMeno(Math.round(T))}</b><i>°C</i>${nota ? `<small>${nota}</small>` : ''}</div>`;
export const segnoMeno = (n) => (n < 0 ? `−${Math.abs(n)}` : String(n));
// l'acqua bolle più in alto con più pressione (Clausius–Clapeyron, calore latente 40,7 kJ/mol); sotto il punto triplo
// (611 Pa) non c'è liquido. → [0, ebollizione] in °C, o null
export function bandaAcqua(p) { if (!(p > 611)) return null; const Tb = 1 / (1 / 373.15 - (8.314 / 40700) * Math.log(p / 101325)); return [0, Tb - 273.15]; }

// L'ANELLO DELL'ARIA: la composizione in un anello, la pressione al centro
const COLORI_GAS = ['#f4ecdf', '#e9a9b6', '#8ecfe0', '#f2a65a', '#b59ad9', '#9fd3a8'];
export function anello(gas, centro, sotto, D = 96) {
  const r = 40, giro = 2 * Math.PI * r; let a0 = -90, s = `<circle cx="52" cy="52" r="${r}" fill="none" stroke="rgba(244,236,223,.06)" stroke-width="13"/>`;
  gas.forEach(([, f], i) => { const p = f * 100, gap = p < 1 ? 0 : 1.4, len = Math.max((p / 100) * 360 - gap, 1.6), col = COLORI_GAS[i % COLORI_GAS.length];
    s += `<circle cx="52" cy="52" r="${r}" fill="none" stroke="${col}" stroke-width="13" stroke-dasharray="${(len / 360) * giro} ${giro}" transform="rotate(${a0 + gap / 2} 52 52)"${p < 1 ? ` style="filter:drop-shadow(0 0 3px ${col})"` : ''}/>`; a0 += (p / 100) * 360; });
  s += `<text x="52" y="${sotto ? 53 : 57}" text-anchor="middle" class="c">${centro}</text>${sotto ? `<text x="52" y="67" text-anchor="middle" class="s">${sotto}</text>` : ''}`;
  return `<svg class="v-anello" viewBox="0 0 104 104" width="${D}" height="${D}">${s}</svg>`;
}
export function legendaGas(gas) {
  return gas.map(([g, f], i) => { const col = COLORI_GAS[i % COLORI_GAS.length], p = f * 100; return `<div class="v-leg" style="--c:${col};--p:${cl(p, 0.6, 100).toFixed(1)}%"><i></i><span>${formula(g)}</span><em></em><b>${p >= 10 ? num(p) : num(p, 1)} %</b></div>`; }).join('');
}
// LA GOCCIA, riempita fino al livello (0…1)
export function goccia(pieno = 0.6, W = 58) {
  const y = (1 - cl(pieno, 0, 1)).toFixed(3);
  return `<svg class="v-goccia" viewBox="0 0 24 27" width="${W}" height="${(W * 27) / 24}"><defs><linearGradient id="v-gr-g${Math.round(pieno * 100)}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8ecfe0" stop-opacity=".12"/><stop offset="${y}" stop-color="#8ecfe0" stop-opacity=".12"/><stop offset="${y}" stop-color="#8ecfe0" stop-opacity=".85"/><stop offset="1" stop-color="#4f9fbf" stop-opacity=".95"/></linearGradient></defs><path d="M12 1.5c3.8 5 7.2 9.1 7.2 13.3a7.2 7.2 0 0 1-14.4 0C4.8 10.6 8.2 6.5 12 1.5z" fill="url(#v-gr-g${Math.round(pieno * 100)})" stroke="#8ecfe0" stroke-width=".9"/><path d="M7.6 15.6a4.2 4.2 0 0 0 3.3 3.9" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width=".9" stroke-linecap="round"/></svg>`;
}
// UN MISURINO: un nome, un valore, una barra piena fino a `frazione`, una tacca di riferimento (la Terra)
export function misurino({ t, valore, frazione, colore = 'linear-gradient(90deg,#4f9fbf,#8ecfe0)', rif = null }) {
  return `<div class="v-mis"><div class="t">${t}<b>${valore}</b></div><div class="pista"><div class="pieno" style="width:${(100 * cl(frazione, 0, 1)).toFixed(1)}%;background:${colore}"></div>${rif ? `<div class="rif" style="left:${(100 * cl(rif.x, 0, 1)).toFixed(1)}%" data-t="${rif.t}"></div>` : ''}</div></div>`;
}
// la scala del pH, da acido (rosa) a basico (azzurro), con il cursore
export function scalaPH(pH) {
  const p = Number.isFinite(pH) ? pH : 7, dice = p < 6.5 ? 'acido' : p > 7.5 ? 'basico' : 'neutro';
  return `<div class="v-mis"><div class="t">pH<b>${num(p, 1)} · ${dice}</b></div><div class="pista ph"><div class="seg" style="left:${((100 * cl(p, 0, 14)) / 14).toFixed(1)}%"></div></div></div>`;
}
// LE TESSERE: icona, cifra e una parola (al più tre per riga)
export function tessere(lista) {
  return `<div class="v-tessere" style="--n:${Math.min(3, lista.length)}">${lista.filter(Boolean).map((x) => `<div${x.p != null ? ` style="--p:${(100 * cl(x.p, 0, 1)).toFixed(1)}%"` : ''}${x.titolo ? ` title="${x.titolo}"` : ''}>${ico(x.ico)}<b>${x.v}</b><small>${x.parola}</small>${x.p != null ? '<i class="mini"></i>' : ''}</div>`).join('')}</div>`;
}
// LO SPETTRO di una stella: l'arcobaleno pesato dalla curva del corpo nero a T, la curva, le righe più forti (Balmer, il
// calcio, il sodio), il picco di Wien tratteggiato
const RIGHE = [[393.4, 1.6, 0.9], [396.8, 1.6, 0.9], [410.2, 0.7, 0.5], [434, 0.8, 0.55], [486.1, 1, 0.7], [516.7, 0.9, 0.6], [527, 0.7, 0.5], [589, 0.9, 0.85], [589.6, 0.9, 0.85], [656.3, 1.1, 0.75], [686.7, 0.7, 0.5], [718.5, 0.6, 0.45]];
let idSpettro = 0;
export function spettro(T, alto = 50) {
  const id = `v-arc${idSpettro++}`, lam = (x) => 380 + (x / 360) * 370;
  const col = (l) => { const t = (l - 380) / 370, st = [[0, [110, 70, 190]], [0.18, [70, 110, 230]], [0.32, [80, 200, 220]], [0.45, [120, 210, 120]], [0.58, [235, 225, 110]], [0.72, [245, 160, 70]], [0.88, [230, 70, 60]], [1, [150, 30, 40]]]; for (let i = 1; i < st.length; i++) if (t <= st[i][0]) { const u = (t - st[i - 1][0]) / (st[i][0] - st[i - 1][0]); return st[i - 1][1].map((v, j) => Math.round(v + (st[i][1][j] - v) * u)); } return st.at(-1)[1]; };
  const planck = (l) => { const x = l * 1e-9; return 1 / (x ** 5 * (Math.exp(1.4388e-2 / (x * T)) - 1)); };
  let pm = 0; for (let x = 0; x <= 360; x += 4) pm = Math.max(pm, planck(lam(x)));
  let s = `<defs><linearGradient id="${id}" x1="0" x2="1">`;
  for (let i = 0; i <= 36; i++) { const l = lam(i * 10), [r, g, b] = col(l), v = planck(l) / pm; s += `<stop offset="${i / 36}" stop-color="rgb(${r},${g},${b})" stop-opacity="${(0.18 + 0.82 * v).toFixed(2)}"/>`; }
  s += `</linearGradient></defs><rect width="360" height="46" fill="#0d0306"/><rect y="20" width="360" height="26" fill="url(#${id})"/>`;
  for (const [l, w, o] of RIGHE) s += `<rect x="${(((l - 380) / 370) * 360).toFixed(1)}" y="20" width="${w}" height="26" fill="#0d0306" opacity="${o}"/>`;
  s += ['400', '500', '600', '700'].map((t) => `<text x="${(((+t - 380) / 370) * 360).toFixed(1)}" y="9" text-anchor="middle">${t}</text>`).join('') + '<text x="356" y="9" text-anchor="end">nm</text>';
  let d = 'M0 46'; for (let x = 0; x <= 360; x += 6) d += `L${x} ${(44 - (30 * planck(lam(x))) / pm).toFixed(1)}`;
  const wien = 2.898e6 / T; s += `<path d="${d}" fill="none" stroke="#f4ecdf" stroke-opacity=".75" stroke-width="1.2"/>`;
  if (wien > 380 && wien < 750) { const x = ((wien - 380) / 370) * 360; s += `<line x1="${x}" x2="${x}" y1="12" y2="46" stroke="#ff5a78" stroke-width="1" stroke-dasharray="2 2"/>`; }
  return `<svg class="v-spettro" viewBox="0 0 360 46" preserveAspectRatio="none" style="height:${alto}px">${s}</svg>`;
}
// il colore di un corpo nero a T (per la tinta della stella): l'approssimazione di Tanner Helland, abbastanza per un pallino
export function coloreCorpoNero(T) {
  const t = T / 100; let r, g, b;
  if (t <= 66) { r = 255; g = 99.47 * Math.log(t) - 161.12; b = t <= 19 ? 0 : 138.52 * Math.log(t - 10) - 305.04; } else { r = 329.7 * (t - 60) ** -0.1332; g = 288.12 * (t - 60) ** -0.0755; b = 255; }
  return `rgb(${[r, g, b].map((x) => Math.round(cl(x, 0, 255))).join(',')})`;
}
// BARRE IMPILATE: le parti di un tutto (l'energia per la chimica dell'aria), con la legenda in cifre
const COLORI_PARTI = ['#f2a65a', '#b59ad9', '#8ecfe0', '#9fd3a8', '#e9a9b6', '#f4ecdf'];
export function impilate(parti, unita = '') {
  const tot = parti.reduce((n, p) => n + Math.max(0, p.v), 0) || 1; let x = 0;
  const barre = parti.map((p, i) => { const w = (100 * Math.max(0, p.v)) / tot, s = `<i style="left:${x.toFixed(2)}%;width:${Math.max(0.6, w).toFixed(2)}%;background:${COLORI_PARTI[i % COLORI_PARTI.length]}"></i>`; x += w; return s; }).join('');
  const leg = parti.map((p, i) => `<div><i style="background:${COLORI_PARTI[i % COLORI_PARTI.length]}"></i><span>${p.nome}</span><b>${sig(p.v)}${unita ? ` ${unita}` : ''}</b></div>`).join('');
  return `<div class="v-impilate"><div class="barra">${barre}</div><div class="leg">${leg}</div></div>`;
}
// UNA SCALA LOGARITMICA con un punto e i riferimenti (la pressione rispetto alla Terra, la dose, il calore)
export function scalaLog({ v, lo, hi, rif = [], unita = '', colore = 'var(--rosa-300)' }) {
  const x = (q) => (100 * cl((Math.log10(q) - Math.log10(lo)) / (Math.log10(hi) - Math.log10(lo)), 0, 1)).toFixed(1);
  const tacche = []; for (let e = Math.ceil(Math.log10(lo)); e <= Math.floor(Math.log10(hi)); e++) tacche.push(`<i class="tac" style="left:${x(10 ** e)}%"></i>`);
  return `<div class="v-log"><div class="pista">${tacche.join('')}${rif.map((r) => `<div class="rif" style="left:${x(r.v)}%" data-t="${r.t}"></div>`).join('')}<div class="pt" style="left:${v > 0 ? x(v) : 0}%;background:${colore}"></div></div><div class="estremi"><span>${sig(lo, 1)} ${unita}</span><span>${sig(hi, 1)} ${unita}</span></div></div>`;
}
// TRE TACCHE da «niente» a «molto» (la resa dei mattoni della vita)
export function resa(livello, parole = ['niente', 'poco', 'molto']) {
  return `<div class="v-resa">${[0, 1, 2].map((i) => `<i class="${i <= livello ? 'on' : ''}"></i>`).join('')}<span>${parole[cl(livello, 0, 2)]}</span></div>`;
}
// LO SPACCATO dell'interno: la sfera tagliata, il nucleo in scala (liquido o solido), la crosta, le linee del campo se c'è la dinamo
export function spaccato({ nucleo = 0.5, liquido = false, dinamo = false, crosta = 0.01, gassoso = false, D = 150 }) {
  const c = 75, R = 52, rn = R * cl(nucleo, 0.05, 0.95), rc = R * (1 - cl(crosta * 4, 0.02, 0.12));
  let s = '';
  if (dinamo) for (const k of [1.25, 1.55, 1.9]) s += `<path d="M${c} ${c - R * 0.98} C ${c + R * k * 1.15} ${c - R * k}, ${c + R * k * 1.15} ${c + R * k}, ${c} ${c + R * 0.98} M${c} ${c - R * 0.98} C ${c - R * k * 1.15} ${c - R * k}, ${c - R * k * 1.15} ${c + R * k}, ${c} ${c + R * 0.98}" fill="none" stroke="#8ecfe0" stroke-opacity=".35" stroke-width="1" stroke-dasharray="3 3"/>`;
  s += `<circle cx="${c}" cy="${c}" r="${R}" fill="${gassoso ? 'rgba(242,166,90,.18)' : 'rgba(233,169,182,.16)'}" stroke="rgba(244,236,223,.55)" stroke-width="1.2"/>`;
  // il taglio: un quarto aperto, con gli strati dentro
  s += `<path d="M${c} ${c} L${c + R} ${c} A${R} ${R} 0 0 0 ${c} ${c - R} Z" fill="#14040a"/>`;
  s += `<path d="M${c} ${c} L${c + rc} ${c} A${rc} ${rc} 0 0 0 ${c} ${c - rc} Z" fill="${gassoso ? 'rgba(242,166,90,.35)' : 'rgba(217,138,155,.42)'}"/>`;
  s += `<path d="M${c} ${c} L${c + rn} ${c} A${rn} ${rn} 0 0 0 ${c} ${c - rn} Z" fill="${liquido ? 'url(#v-gr-nucleo)' : 'rgba(244,236,223,.5)'}"${liquido ? '' : ' stroke="rgba(244,236,223,.8)" stroke-dasharray="2 2"'}/>`;
  s += `<path d="M${c} ${c - R} V${c} H${c + R}" fill="none" stroke="rgba(244,236,223,.5)" stroke-width="1"/>`;
  s += `<circle cx="${c}" cy="${c}" r="${rn}" fill="none" stroke="rgba(244,236,223,.25)" stroke-width="1"/>`;
  return `<svg class="v-spaccato" viewBox="0 0 150 150" width="${D}" height="${D}"><defs><radialGradient id="v-gr-nucleo"><stop offset="0" stop-color="#ffd27a"/><stop offset="1" stop-color="#f2a65a"/></radialGradient></defs>${s}</svg>`;
}
// LA CATENA DELLE CAUSE: passi in verticale, ognuno con l'icona, il nome e un numero
export function catenaCause(passi) {
  return `<ol class="v-cause">${passi.map((p) => `<li>${ico(p.ico)}<div><b>${p.titolo}</b><span>${p.numero}</span></div></li>`).join('')}</ol>`;
}
// I CONTEGGI con icona («5 × il getto del buco nero»)
export function conteggi(lista) {
  return `<div class="v-conti">${lista.map((x) => `<div>${ico(x.ico)}<b>${x.n}</b><span>${x.testo}</span></div>`).join('')}</div>`;
}
// IL DIAGRAMMA H-R in piccolo: la temperatura (calda a sinistra) e la luminosità, la sequenza principale, il punto
export function hr(T, Lsol) {
  const W = 150, H = 96, x = (t) => 8 + ((Math.log10(40000) - Math.log10(cl(t, 2300, 40000))) / (Math.log10(40000) - Math.log10(2300))) * (W - 16), y = (l) => H - 8 - ((Math.log10(cl(l, 1e-4, 1e6)) + 4) / 10) * (H - 16);
  let d = ''; for (let t = 2400; t <= 38000; t *= 1.15) { const l = (t / 5772) ** 6.5; d += `${d ? 'L' : 'M'}${x(t).toFixed(1)} ${y(l).toFixed(1)}`; }
  return `<svg class="v-hr" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}"><rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="8" fill="rgba(244,236,223,.03)" stroke="rgba(244,236,223,.1)"/><path d="${d}" fill="none" stroke="rgba(244,236,223,.22)" stroke-width="7" stroke-linecap="round"/><circle cx="${x(5772)}" cy="${y(1)}" r="2" fill="none" stroke="rgba(244,236,223,.5)"/><circle cx="${x(T)}" cy="${y(Lsol)}" r="4.5" fill="${coloreCorpoNero(T)}" stroke="#ff5a78" stroke-width="1.6"/><text x="8" y="${H - 2}" class="s">caldo</text><text x="${W - 8}" y="${H - 2}" text-anchor="end" class="s">freddo</text></svg>`;
}
// UNA CURVA nel tempo (la storia delle stelle di una galassia), con l'adesso
export function curva(xs, ys, { W = L, H = 70, ora = null, colore = '#e9a9b6' } = {}) {
  const n = Math.min(xs.length, ys.length); if (n < 2) return '';
  const x0 = xs[0], x1 = xs[n - 1], yM = Math.max(...Array.from(ys).slice(0, n), 1e-30), px = (v) => 4 + ((v - x0) / (x1 - x0 || 1)) * (W - 8), py = (v) => H - 14 - (v / yM) * (H - 24);
  let d = `M${px(xs[0])} ${H - 14}`; for (let i = 0; i < n; i++) d += `L${px(xs[i]).toFixed(1)} ${py(ys[i]).toFixed(1)}`; d += `L${px(xs[n - 1])} ${H - 14}Z`;
  return `<svg class="v-curva" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}"><path d="${d}" fill="${colore}" fill-opacity=".18" stroke="${colore}" stroke-width="1.3"/>${ora != null ? `<line x1="${px(ora)}" x2="${px(ora)}" y1="4" y2="${H - 14}" stroke="#ff5a78" stroke-dasharray="2 2"/>` : ''}<text x="4" y="${H - 2}" class="s">${num(x0, 1)}</text><text x="${W - 4}" y="${H - 2}" text-anchor="end" class="s">${num(x1, 1)} miliardi di anni</text></svg>`;
}
// UNA MAPPA DI DENSITÀ (N × N valori) come immagine: dal vuoto (scuro) ai nodi (rosa chiaro)
export function mappaDensita(griglia, N) {
  if (typeof document === 'undefined' || !griglia || !(N > 0)) return '';
  const cv = document.createElement('canvas'); cv.width = cv.height = N; const x = cv.getContext('2d'), im = x.createImageData(N, N); let lo = Infinity, hi = -Infinity;
  for (let i = 0; i < N * N; i++) { const v = griglia[i]; if (v < lo) lo = v; if (v > hi) hi = v; }
  for (let i = 0; i < N * N; i++) { const t = Math.pow(cl((griglia[i] - lo) / (hi - lo || 1), 0, 1), 1.6); im.data[4 * i] = 30 + 225 * t; im.data[4 * i + 1] = 8 + 180 * t * t; im.data[4 * i + 2] = 20 + 170 * t * t; im.data[4 * i + 3] = 255; }
  x.putImageData(im, 0, 0); return `<img class="v-mappa quadra" src="${cv.toDataURL()}" alt="la densità della materia del cosmo">`;
}

// ---------------------------------------------------------------------------------------------- LE GALASSIE E IL COSMO
// UN DIAGRAMMA a punti o a linea, con gli assi in scala logaritmica o lineare (il profilo di luce, i metalli per anello,
// lo spettro di potenza). serie: [{ xs, ys, colore, punti (true: solo punti), r }]; tacche: le potenze di dieci sugli assi
// logaritmici. Ciò che non è finito (o ≤ 0 su un asse logaritmico) non si disegna.
export function diagramma(serie, { W = L, H = 96, logX = false, logY = false, etX = '', etY = '', ora = null } = {}) {
  const buono = (v, lg) => Number.isFinite(v) && (!lg || v > 0), tx = (v) => (logX ? Math.log10(v) : v), ty = (v) => (logY ? Math.log10(v) : v);
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  for (const s of serie) for (let i = 0; i < Math.min(s.xs.length, s.ys.length); i++) { if (!buono(s.xs[i], logX) || !buono(s.ys[i], logY)) continue; const x = tx(s.xs[i]), y = ty(s.ys[i]); x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  if (!(x1 > x0)) return '';
  if (!(y1 > y0)) { y0 -= 1; y1 += 1; } else if (!logY) { y0 = Math.min(0, y0); y1 *= 1.08; } else { y0 -= 0.1; y1 += 0.1; }
  const sx = 30, dx = W - 8, sy = 6, gy = H - 16, px = (v) => sx + ((tx(v) - x0) / (x1 - x0)) * (dx - sx), py = (v) => gy - ((ty(v) - y0) / (y1 - y0)) * (gy - sy);
  let tac = '';
  if (logY) { const p = Math.max(1, Math.ceil((y1 - y0) / 4)); for (let e = Math.ceil(y0); e <= y1; e += p) tac += `<line x1="${sx}" x2="${dx}" y1="${py(10 ** e).toFixed(1)}" y2="${py(10 ** e).toFixed(1)}" stroke="rgba(244,236,223,.07)"/><text x="${sx - 3}" y="${(py(10 ** e) + 3).toFixed(1)}" text-anchor="end" class="s">10${apice(e)}</text>`; }
  else for (const f of [0.5, 1]) { const v = y0 + f * (y1 - y0) / 1.08; tac += `<line x1="${sx}" x2="${dx}" y1="${py(v).toFixed(1)}" y2="${py(v).toFixed(1)}" stroke="rgba(244,236,223,.07)"/><text x="${sx - 3}" y="${(py(v) + 3).toFixed(1)}" text-anchor="end" class="s">${sig(v, 1)}</text>`; }
  if (logX) { const p = Math.max(1, Math.ceil((x1 - x0) / 4)); for (let e = Math.ceil(x0); e <= x1; e += p) tac += `<text x="${px(10 ** e).toFixed(1)}" y="${H - 4}" text-anchor="middle" class="s">10${apice(e)}</text>`; }
  else tac += `<text x="${sx}" y="${H - 4}" class="s">${sig(x0, 2)}</text><text x="${dx}" y="${H - 4}" text-anchor="end" class="s">${sig(x1, 2)}</text>`;
  const tracce = serie.map((s) => {
    const pts = []; for (let i = 0; i < Math.min(s.xs.length, s.ys.length); i++) if (buono(s.xs[i], logX) && buono(s.ys[i], logY)) pts.push([px(s.xs[i]), py(s.ys[i])]);
    if (s.punti) return pts.map(([x, y]) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${s.r ?? 1.8}" fill="${s.colore}" fill-opacity=".8"/>`).join('');
    return pts.length > 1 ? `<path d="${pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join('')}" fill="none" stroke="${s.colore}" stroke-width="1.5" stroke-linejoin="round"/>${pts.map(([x, y]) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="1.6" fill="${s.colore}"/>`).join('')}` : '';
  }).join('');
  const linea = ora != null && buono(ora, logX) ? `<line x1="${px(ora).toFixed(1)}" x2="${px(ora).toFixed(1)}" y1="${sy}" y2="${gy}" stroke="#ff5a78" stroke-dasharray="2 2"/>` : '';
  return `<svg class="v-curva" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}"><rect x="${sx}" y="${sy}" width="${dx - sx}" height="${gy - sy}" rx="4" fill="rgba(244,236,223,.03)"/>${tac}${linea}${tracce}${etX ? `<text x="${dx - 4}" y="${sy + 9}" text-anchor="end" class="s">${etX}</text>` : ''}${etY ? `<text x="${sx + 4}" y="${sy + 9}" class="s">${etY}</text>` : ''}</svg>`;
}
// IL DIAGRAMMA H-R DI UNA POPOLAZIONE: ogni stella del catalogo un punto del suo colore (la temperatura, calda a
// sinistra, e la luminosità in L☉), sulla striscia della sequenza principale; i riferimenti: il Sole.
export function hrPopolazione(stelle, { W = L, H = 150 } = {}) {
  const lt0 = Math.log10(40000), lt1 = Math.log10(2300), x = (t) => 30 + ((lt0 - Math.log10(cl(t, 2300, 40000))) / (lt0 - lt1)) * (W - 38), y = (l) => H - 16 - ((Math.log10(cl(l, 1e-5, 1e6)) + 5) / 11) * (H - 22);
  let d = ''; for (let t = 2400; t <= 38000; t *= 1.15) d += `${d ? 'L' : 'M'}${x(t).toFixed(1)} ${y((t / 5772) ** 6.5).toFixed(1)}`;
  let tac = ''; for (const e of [-4, -2, 0, 2, 4, 6]) tac += `<line x1="30" x2="${W - 8}" y1="${y(10 ** e).toFixed(1)}" y2="${y(10 ** e).toFixed(1)}" stroke="rgba(244,236,223,.06)"/><text x="27" y="${(y(10 ** e) + 3).toFixed(1)}" text-anchor="end" class="s">10${apice(e)}</text>`;
  const pt = stelle.filter((s) => s.T > 0 && s.L > 0).map((s) => `<circle cx="${x(s.T).toFixed(1)}" cy="${y(s.L).toFixed(1)}" r="${s.r ?? 1.3}" fill="${s.colore}" fill-opacity=".75"/>`).join('');
  return `<svg class="v-hr v-curva" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}"><rect x="30" y="4" width="${W - 38}" height="${H - 20}" rx="6" fill="rgba(244,236,223,.03)"/>${tac}<path d="${d}" fill="none" stroke="rgba(244,236,223,.12)" stroke-width="9" stroke-linecap="round"/>${pt}<circle cx="${x(5772)}" cy="${y(1)}" r="3.5" fill="none" stroke="#ff5a78" stroke-width="1.3"/><text x="${x(5772) + 6}" y="${y(1) - 4}" class="s">il Sole</text><text x="30" y="${H - 4}" class="s">40.000 K · caldo</text><text x="${W - 8}" y="${H - 4}" text-anchor="end" class="s">freddo · 2.300 K</text><text x="34" y="13" class="s">L☉</text></svg>`;
}
// BARRE SU SCALA LOGARITMICA (le masse di una galassia: stelle, gas, gas caldo, buco nero, che stanno tra loro come 1 a 1000)
export function barreLog(lista, unita = '') {
  const v = lista.filter((x) => x.v > 0); if (!v.length) return '';
  const hi = Math.ceil(Math.log10(Math.max(...v.map((x) => x.v)))), lo = Math.min(hi - 3, Math.floor(Math.log10(Math.min(...v.map((x) => x.v)))));
  return `<div class="v-barre">${v.map((x, i) => `<div><span>${x.nome}</span><em style="--p:${(100 * cl((Math.log10(x.v) - lo) / (hi - lo), 0.02, 1)).toFixed(1)}%;--c:${x.colore || COLORI_PARTI[i % COLORI_PARTI.length]}"></em><b>${sig(x.v)}${unita ? ` ${unita}` : ''}</b></div>`).join('')}<div class="scala"><span>10${apice(lo)}</span><span>10${apice(hi)}</span></div></div>`;
}
// UN ISTOGRAMMA (quanto spesso ogni valore, sul campo intero) con il valore di un punto segnato
export function istogramma(valori, segno = null, { W = L, H = 64, n = 32, etichetta = '' } = {}) {
  let lo = Infinity, hi = -Infinity; for (const v of valori) { if (v < lo) lo = v; if (v > hi) hi = v; } if (!(hi > lo)) return '';
  const c = new Array(n).fill(0); for (const v of valori) c[Math.min(n - 1, Math.floor(((v - lo) / (hi - lo)) * n))]++;
  const m = Math.max(...c), bw = (W - 8) / n, x = (v) => 4 + ((cl(v, lo, hi) - lo) / (hi - lo)) * (W - 8);
  const barre = c.map((k, i) => { const h = ((H - 18) * k) / m, t = i / (n - 1); return `<rect x="${(4 + i * bw + 0.5).toFixed(1)}" y="${(H - 14 - h).toFixed(1)}" width="${(bw - 1).toFixed(1)}" height="${h.toFixed(1)}" rx="1" fill="rgb(${Math.round(60 + 180 * t)},${Math.round(30 + 140 * t * t)},${Math.round(50 + 130 * t * t)})"/>`; }).join('');
  return `<svg class="v-curva" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">${barre}${segno != null ? `<line x1="${x(segno).toFixed(1)}" x2="${x(segno).toFixed(1)}" y1="2" y2="${H - 14}" stroke="#ff5a78" stroke-width="1.6"/><text x="${cl(x(segno), 30, W - 30).toFixed(1)}" y="9" text-anchor="middle" class="s">${etichetta || 'qui'}</text>` : ''}<text x="4" y="${H - 3}" class="s">vuoti</text><text x="${W - 4}" y="${H - 3}" text-anchor="end" class="s">nodi</text></svg>`;
}
// LA MAPPA DI DENSITÀ CON I SEGNI: le galassie (puntini) e il punto dove si è (l'anello rosa), con il cerchio dei vicini.
// punti: [{ x, y } in frazioni del lato]; qui: { x, y, r (il raggio del cerchio, in frazioni) }
export function mappaConSegni(griglia, N, punti = [], qui = null) {
  const img = mappaDensita(griglia, N); if (!img) return '';
  const p = punti.map((q) => `<circle cx="${(100 * q.x).toFixed(2)}" cy="${(100 * q.y).toFixed(2)}" r=".7" fill="rgba(244,236,223,.75)"/>`).join('');
  const s = qui ? `<circle cx="${(100 * qui.x).toFixed(2)}" cy="${(100 * qui.y).toFixed(2)}" r="${(100 * (qui.r || 0)).toFixed(2)}" fill="none" stroke="rgba(255,90,120,.6)" stroke-dasharray="1.5 1.5" stroke-width=".5"/><circle cx="${(100 * qui.x).toFixed(2)}" cy="${(100 * qui.y).toFixed(2)}" r="2.2" fill="none" stroke="#ff5a78" stroke-width=".9"/>` : '';
  return `<div class="v-mappa-segni">${img}<svg viewBox="0 0 100 100" preserveAspectRatio="none">${p}${s}</svg></div>`;
}
