// schede.js — la scheda del bersaglio (PROGETTO_VISORE.md, § 5): lo stemma del livello, il nome, una riga d'identità e le
// linguette a icone. Una scheda per livello: il pianeta (Sintesi, Aria, Clima, Mare, Interno, Origine), la stella, la
// galassia, il cosmo, il suolo, la materia, gli atomi, i quanti (in fondo allo zoom). Le schede mostrano grafica, non frasi:
// i testi lunghi stanno nel taccuino. Ogni scheda è { chiave, liv, nome, identita, linguette: [{ id, ico, nome, html() }], piede }.
import { ico } from './icone.js';
import { C, pianeta as datiPianeta, particelleDi, stella as datiStella, galassia as datiGalassia, cosmo as datiCosmo, materia as datiMateria, lunghezza } from './dati.js';
import { sezione, etichette, termometro, temperatura, bandaAcqua, anello, legendaGas, goccia, misurino, scalaPH, tessere, spettro, impilate, scalaLog, resa, spaccato, catenaCause, conteggi, hr, curva, mappaDensita, coloreCorpoNero, diagramma, hrPopolazione, barreLog, istogramma, mappaConSegni, num, num1, sig, formula, segnoMeno } from './grafica.js';
import { immagineSuperficie } from '../camera/geologia.js';
import { scenaAtomi } from '../camera/mappa.js';
import { stella as stellaDiSequenza } from '../camera/stelle.js';
import { TORO_M } from '../camera/cosmo.js';

const prova = (f, d = null) => { try { return f(); } catch { return d; } };
const ANNI = 3.156e7, G0 = 9.81, B_TERRA = 5e-5;
const una = (s, n = 110) => { s = String(s || '').replace(/\s+/g, ' ').trim(); const p = s.split(/(?<=[.;])\s/)[0]; return p.length > n ? `${p.slice(0, n - 1)}…` : p; };
const pannello = () => document.getElementById('pannello');
const classeSpettrale = (T) => (T > 30000 ? 'O' : T > 10000 ? 'B' : T > 7500 ? 'A' : T > 6000 ? 'F' : T > 5200 ? 'G' : T > 3700 ? 'K' : 'M');
const nota = (t) => `<p class="v-riga">${t}</p>`;
const aperto = (t) => `<button class="v-al-taccuino" data-v-taccuino="spiega">${t} ›</button>`;

// =============================================================================================== IL PIANETA
function tessereVitali(d) {
  const { P, cl } = d;
  return tessere([
    { ico: 'gravita', v: `${num(cl.g / G0, 2)} g`, parola: 'gravità', p: cl.g / G0 / 3, titolo: `${num(cl.g, 1)} m/s²` },
    P.bloccato ? { ico: 'giorno', v: `${num(P.anno / 86400)} g`, parola: 'giorno = anno' } : { ico: 'giorno', v: P.giorno < 172800 ? `${num(P.giorno / 3600)} h` : `${num(P.giorno / 86400)} g`, parola: 'il giorno' },
    { ico: 'campo', v: `${num((P.B0 || 0) * 1e9)} nT`, parola: `${(100 * (P.B0 || 0)) / B_TERRA < 1 ? num((100 * (P.B0 || 0)) / B_TERRA, 1) : num((100 * (P.B0 || 0)) / B_TERRA)} % della Terra`, p: (P.B0 || 0) / B_TERRA, titolo: 'il campo magnetico; la Terra: circa 50.000 nT' },
  ]);
}
const gasDi = (P, n = 3) => (P.atmosfera ? Object.entries(P.atmosfera.gas).sort((x, y) => y[1] - x[1]).filter(([, f]) => f > 0.001).slice(0, n) : []);
const pressione = (cl) => (Number.isFinite(cl.pressione) ? cl.pressione / 1e5 : null);
function seAria(d, grande = false) {
  const { P, cl } = d, bar = pressione(cl), gas = gasDi(P, grande ? 5 : 3);
  if (bar == null) return sezione('aria', 'Aria', 'un gigante di gas', `<div class="v-aria">${anello(gas.length ? gas : [['H2', 1]], '∞', 'gas', grande ? 120 : 96)}<div class="leg">${legendaGas(gas)}</div></div>`);
  if (!gas.length || bar < 1e-5) return sezione('aria', 'Aria', 'nessuna atmosfera', '');
  return sezione('aria', 'Aria', `${num1(bar)} bar · ${sig(bar / 1.013, 1)} × Terra`, `<div class="v-aria${grande ? ' grande' : ''}">${anello(gas, num1(bar), 'BAR', grande ? 120 : 96)}<div class="leg">${legendaGas(gas)}${etichette([P.atmosfera.riducente ? 'riducente' : 'ossidata', 'niente vita'])}</div></div>`);
}
const tipoMare = (s) => (s < 0.5 ? 'acqua dolce' : s < 17 ? 'mare salmastro' : s < 50 ? 'mare salato' : 'salamoia');
function seAcqua(d) {
  const { cl, Sx, calcola } = d, M = Sx?.mare;
  if (cl.acqua !== 'liquida') return sezione('acqua', 'Acqua', cl.acqua || 'niente', `<div class="v-acqua">${goccia(0)}<div>${nota(cl.acqua === 'ghiaccio' ? 'tutta gelata' : cl.acqua === 'vapore' ? "solo vapore nell'aria" : "nessun'acqua in superficie")}</div></div>`);
  if (!M) return sezione('acqua', 'Acqua', 'liquida', `<div class="v-acqua">${goccia(0.6)}<div>${nota(calcola ? 'il mare si sta formando…' : 'il mare: avvicinati per calcolarlo')}</div></div>`);
  if (!M.esiste) return sezione('acqua', 'Acqua', 'niente mare', nota(una(M.motivo || 'Qui non c\'è acqua liquida in superficie.')));
  return sezione('acqua', 'Acqua', `liquida · ${tipoMare(M.salinitaMedia)}`, `<div class="v-acqua">${goccia(Math.min(0.9, 0.35 + 0.55 * (M.frazioneMare ?? 0.6)))}<div>${misurino({ t: 'salinità', valore: `${num(M.salinitaMedia, 1)} g/kg`, frazione: M.salinitaMedia / 40, rif: { x: 35 / 40, t: 'Terra' } })}${scalaPH(M.pH)}</div></div>`);
}
function sintesiPianeta(d) {
  const { P, cl, T, Teq, St, v } = d, gassoso = P.tipo === 'gassoso';
  return sezione('clima', 'Temperatura in superficie', '', temperatura(T, gassoso ? 'dove la pressione è di un bar' : 'media in superficie') + termometro({ T, Teq, acqua: bandaAcqua(cl.pressione) }))
    + seAria(d) + seAcqua(d)
    + sezione('stella', 'La luce che riceve', `stella ${v.stella + 1} · ${num(St.T)} K`, spettro(St.T))
    + `<div class="v-sez">${tessereVitali(d)}</div>`;
}
function ariaPianeta(d) {
  const { P, cl, v } = d, pre = P.prebiotica, bar = pressione(cl), idro = cl.acqua === 'liquida' && P.interno?.vulcani > 0;
  let h = seAria(d, true);
  if (bar != null && bar > 1e-5) h += sezione('', 'La pressione', 'rispetto alla Terra', scalaLog({ v: bar, lo: 1e-3, hi: 1e3, rif: [{ v: 1.013, t: 'Terra' }], unita: 'bar' }));
  if (pre) h += sezione('ramo', 'I mattoni della vita', 'la resa delle reazioni', resa(pre.HCN > 0.1 ? 2 : pre.HCN > 1e-3 ? 1 : 0, ['quasi niente', 'poco', 'molto']) + etichette([P.atmosfera?.riducente ? 'aria riducente' : 'aria ossidata', cl.acqua === 'liquida' ? 'acqua liquida' : 'senz\'acqua', idro ? 'sorgenti calde' : '', pre.autocatalisi ? 'zuccheri da soli' : '']));
  const E = P.energiaChimica?.superficie;
  if (E) { const nomi = { ultravioletto: 'ultravioletto', fulmini: 'fulmini', cosmici: 'raggi cosmici', aurore: 'aurore', radioattivita: 'radioattività' }; h += sezione('particella', 'Le particelle, qui', 'energia per la chimica', impilate(Object.keys(nomi).filter((k) => Number.isFinite(E[k])).map((k) => ({ nome: nomi[k], v: E[k] })), 'W/m²')); }
  const ris = particelleDi(v, P), Sv = ris?.dose?.totale?.Sv;
  if (Sv > 0) h += sezione('', 'La dose', `${sig(Sv * 1e3)} mSv all'anno`, scalaLog({ v: Sv * 1e3, lo: 0.01, hi: 1e4, rif: [{ v: 2.4, t: 'Terra' }], unita: 'mSv', colore: '#f2a65a' }));
  return h + aperto('che cosa fanno qui le particelle, per esteso');
}
const mappe = new Map();
function mappaDelPianeta(d) {
  const { Sx, cl } = d; if (!Sx) return null; const k = Sx.k; if (mappe.has(k)) return mappe.get(k);
  const url = prova(() => { const sf = Sx.se, px = immagineSuperficie(sf, cl.T, Sx.cl), cv = document.createElement('canvas'); cv.width = sf.W; cv.height = sf.H; cv.getContext('2d').putImageData(new ImageData(px, sf.W, sf.H), 0, 0); return cv.toDataURL(); });
  mappe.set(k, url); if (mappe.size > 4) mappe.delete(mappe.keys().next().value); return url;
}
function climaPianeta(d) {
  const { P, Sx, calcola, cl } = d; let h = '';
  const url = mappaDelPianeta(d);
  h += sezione('clima', 'La mappa', Sx ? `${Sx.se.placche > 1 ? `${Sx.se.placche} placche · ` : ''}${Sx.se.vulcani?.length ?? 0} vulcani` : '', url ? `<img class="v-mappa" src="${url}" alt="la mappa del pianeta">` : nota(calcola ? 'la superficie si sta formando: deriva, clima, erosione…' : P.tipo === 'gassoso' ? 'un gigante di gas: nessuna superficie' : 'la superficie si calcola avvicinandosi'));
  if (P.bloccato) h += sezione('stella', 'Luce e ombra', 'bloccato dalle maree', `<div class="v-blocco"><svg viewBox="0 0 120 64" width="120" height="64"><circle cx="78" cy="32" r="24" fill="#14040a" stroke="rgba(244,236,223,.5)"/><path d="M78 8a24 24 0 0 0 0 48z" fill="rgba(242,166,90,.55)"/><circle cx="12" cy="32" r="7" fill="${coloreCorpoNero(d.St.T)}"/><path d="M22 32h26" stroke="rgba(244,236,223,.35)" stroke-dasharray="2 3"/></svg><div>${etichette(['giorno eterno', 'notte eterna'])}${nota(`un giro in ${num(P.anno / 86400)} giorni, la stessa faccia alla stella`)}</div></div>`);
  else h += sezione('pianeta', "L'asse", `${num(P.obliquita)}° · le stagioni`, `<div class="v-blocco"><svg viewBox="0 0 120 64" width="120" height="64"><circle cx="60" cy="32" r="20" fill="rgba(233,169,182,.14)" stroke="rgba(244,236,223,.5)"/><line x1="${60 - 28 * Math.sin((P.obliquita * Math.PI) / 180)}" y1="${32 - 28 * Math.cos((P.obliquita * Math.PI) / 180)}" x2="${60 + 28 * Math.sin((P.obliquita * Math.PI) / 180)}" y2="${32 + 28 * Math.cos((P.obliquita * Math.PI) / 180)}" stroke="#ff5a78" stroke-width="1.6"/><line x1="60" y1="2" x2="60" y2="62" stroke="rgba(244,236,223,.25)" stroke-dasharray="2 3"/></svg><div>${nota(`gira in ${num(P.giorno / 3600)} ore; l'anno dura ${num(P.anno / 86400)} giorni`)}</div></div>`);
  const ghiaccio = Sx ? Sx.cl.ghiaccio : cl.ghiaccio;
  h += `<div class="v-sez">${tessere([{ ico: 'acqua', v: `${num(100 * (ghiaccio || 0))} %`, parola: 'ghiaccio', p: ghiaccio || 0 }, { ico: 'aria', v: `${num(100 * (cl.nuvole || 0))} %`, parola: 'nuvole', p: cl.nuvole || 0 }, { ico: 'tempo', v: `${num(P.anno / 86400)} g`, parola: "l'anno" }])}</div>`;
  return h + aperto('il clima e la superficie, per esteso');
}
function marePianeta(d) {
  const { Sx, calcola, cl } = d, M = Sx?.mare;
  if (!M) return seAcqua(d) + (cl.acqua === 'liquida' ? nota(calcola ? 'il mare si sta formando…' : '') : '');
  if (!M.esiste) return seAcqua(d);
  const ioni = Object.entries(M.ioni || {}).map(([f, x]) => [f, typeof x === 'number' ? x : x?.moliPerKg ?? 0]).filter(([, x]) => x > 1e-6).sort((p, q) => q[1] - p[1]).slice(0, 6);
  const lx = (x) => Math.max(0, Math.min(1, (Math.log10(x) + 6) / 6.3));
  let h = seAcqua(d);
  if (ioni.length) h += sezione('atomo', 'Gli ioni', 'moli per kg', `<div class="v-ioni">${ioni.map(([f, x]) => `<div><span>${formula(f)}</span><em style="--p:${(100 * lx(x)).toFixed(1)}%"></em><b>${sig(x)}</b></div>`).join('')}</div>`);
  h += sezione('lago', 'Laghi e sorgenti', '', conteggi([{ ico: 'lago', n: M.laghi?.length ?? 0, testo: M.laghi?.some((l) => l.pH > 9) ? 'laghi, alcuni di soda' : 'laghi' }, { ico: 'sorgente', n: M.sorgentiCalde?.length ?? 0, testo: 'sorgenti calde sul fondo' }]));
  // la pozza scaldata dal basso: l'immagine e il regime li ha già calcolati la camera (il pannello di laboratorio.js)
  const img = pannello()?.querySelector('img[alt="la convezione nella pozza"]'), testo = [...(pannello()?.querySelectorAll('p.nota') || [])].map((p) => p.textContent).find((t) => /Rayleigh/.test(t)), reg = testo?.match(/→\s*([^.]+)\./)?.[1], prof = testo?.match(/profonda ([\d.,]+ cm)/)?.[1];
  if (img || reg) h += sezione('acqua', 'Una pozza', [prof, reg].filter(Boolean).join(' · '), img ? `<img class="v-mappa quadra piccola" src="${img.src}" alt="la convezione nella pozza">` : '');
  return h + aperto('il mare, per esteso');
}
function internoPianeta(d) {
  const { P, Sx } = d, it = P.interno; if (!it) return nota('nessun dato sull\'interno');
  const gassoso = P.tipo === 'gassoso';
  let h = sezione('interno', 'Lo spaccato', gassoso ? 'idrogeno metallico' : `nucleo ${it.dinamo ? 'liquido' : 'solido'}`, `<div class="v-interno">${spaccato({ nucleo: it.nucleo ?? 0.5, liquido: !!it.dinamo, dinamo: !!it.dinamo, crosta: it.crosta ?? 0.01, gassoso })}<div>${etichette([gassoso ? 'gigante di gas' : it.tettonica === 'a placche' ? 'a placche' : it.tettonica === 'ferma' ? 'guscio fermo' : 'guscio con vulcani', it.dinamo ? 'dinamo' : 'niente campo'])}${nota(`nucleo largo il ${num(100 * (it.nucleo ?? 0))} % del raggio`)}</div></div>`);
  h += `<div class="v-sez">${tessere([{ ico: 'calore', v: `${num(it.q ?? 0, 3)}`, parola: 'W/m² dal fondo', p: (it.q ?? 0) / 0.087 / 2, titolo: 'la Terra: 0,087 W/m²' }, { ico: 'campo', v: `${num((P.B0 || 0) * 1e9)} nT`, parola: 'il campo', p: (P.B0 || 0) / B_TERRA }, { ico: 'terreno', v: Sx ? `${Sx.se.vulcani?.length ?? 0}` : `${it.vulcani ?? 0}`, parola: 'vulcani' }])}</div>`;
  return h + aperto("l'interno, per esteso");
}
function originePianeta(d) {
  const { P, St, v } = d, Gg = prova(() => datiGalassia(v)?.G),dopo = Gg ? (13.8e9 - St.eta - Gg.formazione / ANNI) / 1e9 : null;
  let h = sezione('ramo', 'Perché è fatto così', '', catenaCause([
    { ico: 'cosmo', titolo: "L'inizio", numero: Gg ? `densità ${num(Gg.peso, 1)} × la media` : '' },
    { ico: 'galassia', titolo: `La galassia ${v.galassia + 1}`, numero: Gg ? `stelle da ${num(Gg.formazione / ANNI / 1e9, 1)} miliardi di anni` : '' },
    { ico: 'stella', titolo: 'Le generazioni di stelle', numero: `metalli ${num(St.Z, 2)} × Sole${dopo != null ? ` · nata ${num(Math.max(0, dopo), 1)} Ga dopo` : ''}` },
    { ico: 'materia', titolo: 'Il disco', numero: P.tipo === 'roccioso' ? `ferro ${num(100 * (P.composizione?.ferro ?? 0))} %` : P.tipo === 'ghiacciato' ? 'roccia e ghiaccio' : 'un nucleo che cattura il gas' },
    { ico: 'pianeta', titolo: `Il pianeta ${v.pianeta + 1}`, numero: P.interno && P.tipo !== 'gassoso' ? `nucleo ${num(100 * P.interno.nucleo)} % · ${P.interno.dinamo ? 'dinamo' : 'niente campo'}` : 'gas attorno al nucleo' },
  ]));
  const b = pannello()?.querySelector('[data-ramo-p]:not([data-ramo-p="|0"])');
  if (b) h += sezione('ramo', 'Il pianeta parallelo', 'un evento diverso', nota(una(b.parentNode?.textContent?.replace(b.textContent, '').replace('↩ il cosmo di partenza', '') || '', 120)));
  return h + aperto('perché è fatto così, per esteso');
}
function piedePianeta(d) {
  if (d.P.tipo === 'gassoso') return '';
  const ritorno = pannello()?.querySelector('[data-ramo-p="|0"]');
  return `<button class="v-ramo" data-v-ramo="1">${ico('ramo')}Un pianeta parallelo<small>un impatto diverso</small></button>${ritorno ? `<button class="v-ramo secondo" data-v-ramo="0">${ico('annulla')}Il cosmo di partenza</button>` : ''}`;
}
function schedaPianeta(q, terreno = false) {
  const d = datiPianeta(q.via); if (!d) return null; const { P, v } = d;
  const lin = [
    { id: 'sintesi', ico: 'pianeta', nome: 'Sintesi', html: () => sintesiPianeta(d) },
    { id: 'aria', ico: 'aria', nome: 'Aria', html: () => ariaPianeta(d) },
    { id: 'clima', ico: 'clima', nome: 'Clima', html: () => climaPianeta(d) },
    { id: 'mare', ico: 'acqua', nome: 'Mare', html: () => marePianeta(d) },
    { id: 'interno', ico: 'interno', nome: 'Interno', html: () => internoPianeta(d) },
    { id: 'origine', ico: 'ramo', nome: 'Origine', html: () => originePianeta(d) },
  ];
  // (sul suolo le linguette di ciò che sta sotto i piedi: il punto, il clima, il mare, l'aria)
  if (terreno) lin.splice(0, lin.length, { id: 'qui', ico: 'terreno', nome: 'Qui', html: () => quiSulSuolo(q, d) }, lin[2], lin[3], lin[1]);
  return { chiave: `${terreno ? 't' : 'p'}|${JSON.stringify(v)}|${!!d.Sx}|${!!d.Sx?.mare}`, liv: terreno ? 'terreno' : 'pianeta', nome: terreno ? 'Il suolo' : `Pianeta ${v.pianeta + 1}`,
    identita: terreno ? `del pianeta ${v.pianeta + 1}` : `${P.tipo}${P.bloccato ? ' · volge sempre la stessa faccia alla stella' : ` · un giorno di ${num(P.giorno / 3600)} ore`}`, linguette: lin, piede: () => piedePianeta(d) };
}
// =============================================================================================== IL SUOLO
const gradi = (lon, lat) => `${num(Math.abs((lat * 180) / Math.PI), 2)}° ${lat >= 0 ? 'N' : 'S'} · ${num(Math.abs((lon * 180) / Math.PI), 2)}° ${lon >= 0 ? 'E' : 'O'}`;
function quiSulSuolo(q, d) {
  const c = C(), M = c?.mondo3d, g = prova(() => M.dove()); if (!g) return nota('il punto: avvicinati al suolo');
  const pi = prova(() => c.universo3d.sistema()?.vero()), i = pi ? prova(() => pi.info(g.lon, g.lat)) : null;
  return sezione('terreno', 'Il punto', gradi(g.lon, g.lat), tessere([
    { ico: 'esci', v: lunghezza(Math.max(0, g.quota)), parola: 'dal suolo' },
    i ? (i.acqua ? { ico: 'acqua', v: lunghezza(i.profondita), parola: 'di mare sotto' } : { ico: 'terreno', v: `${num(i.quota)} m`, parola: 'la quota' }) : null,
    { ico: 'clima', v: `${segnoMeno(Math.round(d.T))} °C`, parola: 'in media' },
  ].filter(Boolean))) + seAcqua(d);
}
// =============================================================================================== LA STELLA
function schedaStella(q) {
  const d = datiStella(q.via); if (!d) return null; const { S, St, v, L } = d;
  const cs = classeSpettrale(St.T);
  const sintesi = () => sezione('stella', 'La luce', `${num(St.T)} K · classe ${cs}`, spettro(St.T, 58))
    + sezione('clima', 'Il colore', '', `<div class="v-colore"><i style="background:${coloreCorpoNero(St.T)};box-shadow:0 0 22px ${coloreCorpoNero(St.T)}"></i>${hr(St.T, L ?? (St.massa ** 3.5))}</div>`)
    + `<div class="v-sez">${tessere([{ ico: 'massa', v: `${num(St.massa, 2)}`, parola: 'masse solari', p: St.massa / 2 }, { ico: 'eta', v: `${num(St.eta / 1e9, 1)} Ga`, parola: "l'età", p: St.eta / 13.8e9 }, { ico: 'atomo', v: `${num(St.Z, 2)} ×`, parola: 'metalli · Sole', p: St.Z / 2 }])}</div>`;
  const pianeti = () => sezione('pianeta', 'I pianeti', `${S.pianeti.length}`, `<div class="v-pianeti">${S.pianeti.map((P, i) => `<button data-v-vola-pianeta="${i}" class="${v.pianeta === i ? 'qui' : ''}"><i style="background:rgb(${(P.colore || [200, 190, 170]).join(',')});width:${Math.max(8, Math.min(26, 6 + Math.sqrt(P.raggioM / 1e6) * 4)).toFixed(0)}px;height:${Math.max(8, Math.min(26, 6 + Math.sqrt(P.raggioM / 1e6) * 4)).toFixed(0)}px"></i><b>${i + 1}</b><span>${P.tipo}</span><em>${segnoMeno(Math.round(P.clima.T - 273.15))} °C</em><small>${num(P.aM / 1.496e11, 2)} UA</small></button>`).join('')}</div>`);
  const disco = () => { const D = S.disco || {}; return sezione('materia', 'Il disco', 'da cui sono nati i pianeti', tessere([{ ico: 'massa', v: sig((D.massaKg || 0) / 5.97e24), parola: 'masse della Terra' }, { ico: 'acqua', v: `${num(D.neve ?? 0, 2)} UA`, parola: 'la linea della neve' }, { ico: 'eta', v: `${num((D.vita ?? 0) / 1e6, 1)} Ma`, parola: 'la sua vita' }])) + aperto('perché è fatto così, per esteso'); };
  return { chiave: `s|${JSON.stringify(v)}`, liv: 'stella', nome: `Stella ${v.stella + 1}`, identita: `classe ${cs} · ${St.stato} · ${St.componente || ''}`.replace(/ · $/, ''), linguette: [{ id: 'sintesi', ico: 'stella', nome: 'Sintesi', html: sintesi }, { id: 'pianeti', ico: 'pianeta', nome: 'Pianeti', html: pianeti }, { id: 'disco', ico: 'ramo', nome: 'Origine', html: disco }], piede: () => '' };
}
// =============================================================================================== LA GALASSIA
// la popolazione per il diagramma H-R: dal catalogo della galassia (cosmo.js) la temperatura e lo stato di ogni stella; la
// luminosità la dà stelle.js per quelle in vita (massa, metalli, età), Stefan–Boltzmann col raggio per le nane bianche;
// le giganti, che nel catalogo non hanno raggio, al gruppo rosso (~50 L☉). Stelle di neutroni e buchi neri non hanno luce
// da mettere: si contano.
const popolazioni = new Map();
function popolazione(Gx, k) {
  if (popolazioni.has(k)) return popolazioni.get(k);
  const punti = [], stati = {};
  for (const s of Gx.stelle) {
    stati[s.stato] = (stati[s.stato] || 0) + 1;
    const L = s.stato === 'in vita' ? prova(() => stellaDiSequenza(s.massa, { Z: s.Z, eta: s.eta }).L) : s.stato === 'nana bianca' && s.raggioM > 0 ? (s.raggioM / 6.957e8) ** 2 * (s.T / 5772) ** 4 : s.stato === 'gigante rossa' ? 50 : null;
    if (L > 0 && s.T > 0) punti.push({ T: s.T, L, colore: `rgb(${(s.colore || [255, 255, 255]).join(',')})`, r: s.stato === 'in vita' ? 1.2 : 1.8 });
  }
  const r = { punti, stati }; popolazioni.set(k, r); if (popolazioni.size > 4) popolazioni.delete(popolazioni.keys().next().value); return r;
}
const STATI = [['in vita', 'stella', 'in vita'], ['gigante rossa', 'calore', 'giganti rosse'], ['nana bianca', 'atomo', 'nane bianche'], ['stella di neutroni', 'campo', 'stelle di neutroni'], ['buco nero', 'interno', 'buchi neri']];
function schedaGalassia(q) {
  const d = datiGalassia(q.via); if (!d) return null; const { F, G, Gx, v } = d, k = `g|${JSON.stringify(v)}`;
  const masse = () => barreLog([{ nome: 'stelle', v: F.massaStelle, colore: '#f2a65a' }, { nome: 'gas freddo', v: F.massaGas, colore: '#8ecfe0' }, { nome: 'gas caldo', v: F.massaCalda, colore: '#b59ad9' }, { nome: 'buco nero', v: F.buco?.M, colore: '#ff5a78' }, { nome: 'alone, in tutto', v: F.alone?.massa, colore: 'rgba(244,236,223,.45)' }], 'M☉');
  const sintesi = () => sezione('galassia', 'La forma', `${F.classe || F.tipo}${F.bracci?.numero && F.tipo === 'spirale' ? ` · ${F.bracci.numero} bracci` : ''}${F.barra ? ' · barrata' : ''}`, tessere([{ ico: 'massa', v: sig(F.massaStelle), parola: 'masse solari' }, { ico: 'aria', v: sig(F.massaGas), parola: 'masse di gas' }, { ico: 'giorno', v: `${num(F.velocita)} km/s`, parola: 'la rotazione' }]))
    + sezione('massa', 'Le masse', 'in masse del Sole', masse())
    + sezione('stella', 'Le stelle', '', tessere([{ ico: 'stella', v: sig(Gx.stelleVere ?? Gx.stelle.length), parola: 'stelle' }, { ico: 'eta', v: `${num(G.formazione / ANNI / 1e9, 1)} Ga`, parola: 'le prime stelle' }, { ico: 'cosmo', v: `${num(G.peso, 1)} ×`, parola: 'la densità' }]));
  const stelle = () => { const p = popolazione(Gx, k), n = Gx.stelle.length;
    return sezione('stella', 'Il diagramma H-R', `${num(n)} stelle del catalogo`, hrPopolazione(p.punti)) + sezione('eta', 'A che punto sono', '', conteggi(STATI.filter(([s]) => p.stati[s]).map(([s, i, t]) => ({ ico: i, n: num(p.stati[s]), testo: t })))); };
  const anelli = () => { const A = F.anelli; if (!A?.r) return nota('nessun dato per anello');
    const r = Array.from(A.r), pieni = Array.from(A.sigmaStelle).filter((x) => x > 0).length;
    if (pieni < 3) return sezione('galassia', 'Il disco', 'quasi vuoto', nota('quasi tutta la luce sta nello sferoide, al centro')) + sezione('massa', 'Le masse', '', masse());
    return sezione('stella', 'Il profilo di luce', 'L☉ per kpc² · dal centro', diagramma([{ xs: r, ys: Array.from(A.luce).map((x, i) => x / A.area[i]), colore: '#f2a65a' }], { logX: true, logY: true, etX: 'kpc' }))
      + sezione('atomo', 'I metalli', 'per anello · × il Sole', diagramma([{ xs: r, ys: Array.from(A.Z), colore: '#b59ad9' }], { logX: true, etX: 'kpc' }))
      + sezione('aria', 'Stelle e gas', 'M☉ per kpc²', diagramma([{ xs: r, ys: Array.from(A.sigmaStelle), colore: '#f2a65a' }, { xs: r, ys: Array.from(A.sigmaGas), colore: '#8ecfe0' }], { logX: true, logY: true, etX: 'kpc' }) + etichette(['arancio: stelle', 'azzurro: gas'])); };
  const storia = () => { const s = F.storia; return sezione('tempo', 'La storia delle stelle', 'stelle nate per anno', s?.t ? curva(Array.from(s.t), Array.from(s.sfr)) : nota('nessuna storia')) + (s?.gas ? sezione('aria', 'Il gas', 'quanto ne resta', curva(Array.from(s.t), Array.from(s.gas), { colore: '#8ecfe0' })) : '') + (s?.stelle ? sezione('massa', 'Le stelle', 'la massa che si accumula', curva(Array.from(s.t), Array.from(s.stelle), { colore: '#f2a65a' })) : ''); };
  const buco = () => { const B = F.buco; if (!B) return nota('nessun buco nero al centro'); return sezione('galassia', 'Il buco nero', `${sig(B.M)} masse del Sole`, tessere([{ ico: 'calore', v: `${sig(B.potenzaW)} W`, parola: 'la potenza' }, { ico: 'diagnostica', v: `${num(100 * (B.attivita ?? 0))} %`, parola: "l'attività", p: B.attivita }, { ico: 'entra', v: sig(B.eddington), parola: 'di Eddington' }])) + (Gx.sorgenti ? sezione('particella', 'Le sorgenti', 'getti, supernove, …', conteggi(Object.entries((Array.isArray(Gx.sorgenti) ? Gx.sorgenti : []).reduce((o, s) => { const k = s.tipo || s.nome || 'sorgente'; o[k] = (o[k] || 0) + 1; return o; }, {})).slice(0, 5).map(([k, n]) => ({ ico: /getto|buco/.test(k) ? 'galassia' : 'stella', n, testo: k })))) : ''); };
  return { chiave: k, liv: 'galassia', nome: `Galassia ${v.galassia + 1}`, identita: `${F.tipo}${F.ambiente ? ` · nel ${F.ambiente}` : ''}`, linguette: [{ id: 'sintesi', ico: 'galassia', nome: 'Sintesi', html: sintesi }, { id: 'stelle', ico: 'stella', nome: 'Stelle', html: stelle }, { id: 'anelli', ico: 'atomo', nome: 'Anelli', html: anelli }, { id: 'storia', ico: 'tempo', nome: 'Storia', html: storia }, { id: 'buco', ico: 'interno', nome: 'Centro', html: buco }], piede: () => '' };
}
// =============================================================================================== IL COSMO
// dove si è nella ragnatela: dalla densità dell'inizio (cosmo.js, settanta onde) nel punto della galassia guardata, o di
// quella più vicina alla camera. Il criterio della forma è la curvatura della densità (le derivate seconde delle onde):
// piega in giù in due direzioni → un nodo; in una → un filamento; in nessuna, o sotto la media, → un vuoto.
const MPC = 3.0857e22, LATO_MPC = TORO_M / MPC;
function nellaRagnatela(Cx, x, y) {
  let d = 0, xx = 0, yy = 0, xy = 0; const P = 2 * Math.PI;
  for (const m of Cx.modi) { const c = m.a * Math.cos(P * (m.kx * x + m.ky * y) + m.fi); d += c; xx -= c * (P * m.kx) ** 2; yy -= c * (P * m.ky) ** 2; xy -= c * P * P * m.kx * m.ky; }
  const t = (xx + yy) / 2, r = Math.sqrt(((xx - yy) / 2) ** 2 + xy * xy), giu = (t + r < 0 ? 1 : 0) + (t - r < 0 ? 1 : 0), z = (d - Cx.media) / (Cx.sigma || 1);
  return { delta: d, z, forma: giu === 2 && z > 0 ? 'nodo' : giu >= 1 && z > -0.3 ? 'filamento' : 'vuoto' };
}
function schedaCosmo(q) {
  const d = datiCosmo(q.via); if (!d) return null; const { Cx, v } = d, tipi = {};
  for (const g of Cx.galassie) tipi[g.tipo] = (tipi[g.tipo] || 0) + 1;
  const gi = v.galassia ?? prova(() => C().universo3d.cosmo.vicina) ?? Cx.galassie.reduce((m, g, i, a) => (g.peso > a[m].peso ? i : m), 0), g = Cx.galassie[gi];
  const dist = (h) => { let dx = h.pos[0] - g.pos[0], dy = h.pos[1] - g.pos[1]; dx -= Math.round(dx); dy -= Math.round(dy); return Math.hypot(dx, dy) * LATO_MPC; };
  const RAGGI = [100, 200, 400], vicini = RAGGI.map((R) => Cx.galassie.filter((h) => h !== g && dist(h) < R).length);
  const mappa = () => mappaConSegni(Cx.griglia, Cx.N, Cx.galassie.map((h) => ({ x: h.pos[0] - Math.floor(h.pos[0]), y: h.pos[1] - Math.floor(h.pos[1]) })), g && { x: g.pos[0] - Math.floor(g.pos[0]), y: g.pos[1] - Math.floor(g.pos[1]), r: RAGGI[1] / LATO_MPC });
  const sintesi = () => sezione('cosmo', 'La materia', 'la densità, in una fetta', mappa()) + sezione('galassia', 'Le galassie', `${Cx.galassie.length}`, conteggi(Object.entries(tipi).map(([t, n]) => ({ ico: 'galassia', n, testo: t }))));
  const ragnatela = () => { if (!g) return nota('nessuna galassia');
    const w = nellaRagnatela(Cx, g.pos[0], g.pos[1]);
    // lo spettro di potenza: ogni onda dell'inizio un punto (k = 2π·|n|/lato, la potenza a²), e la legge che le ha fatte (a ∝ k^−1,25)
    const ks = Cx.modi.map((m) => (2 * Math.PI * Math.hypot(m.kx, m.ky)) / LATO_MPC), ps = Cx.modi.map((m) => m.a * m.a), kk = [...ks].sort((a, b) => a - b), k0 = kk[0], k1 = kk[kk.length - 1];
    const norma = Cx.modi.reduce((s, m) => s + m.a * m.a * Math.hypot(m.kx, m.ky) ** 2.5, 0) / Cx.modi.length, legge = [k0, k1].map((k) => norma * ((k * LATO_MPC) / (2 * Math.PI)) ** -2.5);
    return sezione('mirino', 'Dove sta', `galassia ${gi + 1}`, tessere([{ ico: 'cosmo', v: w.forma, parola: 'la forma', titolo: 'dalla curvatura della densità: nodo se piega in giù in due direzioni, filamento in una, vuoto in nessuna' }, { ico: 'massa', v: `${w.z >= 0 ? '+' : '−'}${num(Math.abs(w.z), 1)} σ`, parola: 'la densità', p: (w.z + 3) / 6 }, { ico: 'galassia', v: num(vicini[1]), parola: `entro ${RAGGI[1]} Mpc` }]))
      + sezione('cosmo', 'La densità locale', 'fra tutti i punti del cosmo', istogramma(Cx.griglia, w.delta, { etichetta: `galassia ${gi + 1}` }))
      + sezione('galassia', 'Le vicine', 'galassie del catalogo', conteggi(RAGGI.map((R, i) => ({ ico: 'galassia', n: vicini[i], testo: `entro ${R} Mpc` }))))
      + sezione('diagnostica', 'Lo spettro di potenza', 'le onde dell\'inizio', diagramma([{ xs: [k0, k1], ys: legge, colore: 'rgba(244,236,223,.35)' }, { xs: ks, ys: ps, colore: '#e9a9b6', punti: true }], { logX: true, logY: true, etX: 'k · 1/Mpc' }) + etichette(['punti: le 70 onde', 'linea: la legge del modello'])); };
  const elenco = () => sezione('galassia', 'Le più grandi', 'clic: vola lì', `<div class="v-pianeti">${Cx.galassie.map((g, i) => [g, i]).sort((a, b) => b[0].peso - a[0].peso).slice(0, 10).map(([g, i]) => `<button data-v-vola-galassia="${i}" class="${v.galassia === i ? 'qui' : ''}">${ico('galassia')}<b>${i + 1}</b><span>${g.tipo}</span><em>${num(g.peso, 1)} ×</em><small>densità</small></button>`).join('')}</div>`);
  return { chiave: `c|${v.cosmo}|${gi}`, liv: 'cosmo', nome: `Cosmo ${v.cosmo}`, identita: `${Cx.galassie.length} galassie · lo spazio si richiude su sé stesso`, linguette: [{ id: 'sintesi', ico: 'cosmo', nome: 'Sintesi', html: sintesi }, { id: 'ragnatela', ico: 'mirino', nome: 'Ragnatela', html: ragnatela }, { id: 'galassie', ico: 'galassia', nome: 'Galassie', html: elenco }], piede: () => '' };
}
// =============================================================================================== LA MATERIA, GLI ATOMI, I QUANTI
function schedaMateria(q) {
  const d = datiMateria(); if (!d) return null; const { r } = d, pd = datiPianeta(q.via);
  const qui = () => sezione('materia', r.acqua ? "L'acqua" : r.suolo ? 'Il suolo' : 'La roccia', `una finestra larga ${lunghezza(r.larghezzaM)}`, nota(una(r.frase, 140)) + tessere([{ ico: 'schermo', v: lunghezza(r.larghezzaM), parola: 'il campione' }, r.punto?.profondo != null ? { ico: 'acqua', v: lunghezza(r.punto.profondo), parola: 'di profondità' } : null, pd ? { ico: 'clima', v: `${segnoMeno(Math.round(pd.T))} °C`, parola: 'in media' } : null].filter(Boolean)) + aperto('che cosa si vede, per esteso'));
  const lin = [{ id: 'qui', ico: 'materia', nome: 'Materia', html: qui }];
  if (pd) lin.push({ id: 'mare', ico: 'acqua', nome: 'Mare', html: () => marePianeta(pd) }, { id: 'interno', ico: 'interno', nome: 'Interno', html: () => internoPianeta(pd) });
  return { chiave: `m|${r.nome}|${r.larghezzaM}`, liv: 'materia', nome: r.nome.replace(/\s*\(.*$/, '').replace(/^./, (x) => x.toUpperCase()), identita: lunghezza(r.larghezzaM), linguette: lin, piede: () => '' };
}
function schedaAtomi(q) {
  const c = C(), sc = prova(() => scenaAtomi(c.camMappa)), dove = document.getElementById('dove')?.textContent || '';
  const atomi = () => sezione('atomo', q.acqua ? 'Le molecole' : 'Gli atomi', '', nota(una(sc?.che || 'gli atomi di questo punto', 140)) + (dove && dove.length < 120 ? sezione('mirino', 'Sotto il cursore', '', nota(dove)) : '') + aperto('che cosa si vede, per esteso'));
  return { chiave: `a|${sc?.chiave || ''}`, liv: 'atomo', nome: q.acqua ? 'Le molecole' : 'Gli atomi', identita: una(sc?.che || '', 60), linguette: [{ id: 'atomi', ico: 'atomo', nome: 'Atomi', html: atomi }], piede: () => '' };
}
function schedaQuanti() {
  return { chiave: 'q', liv: 'particella', nome: 'I quanti', identita: "dentro l'atomo", linguette: [{ id: 'quanti', ico: 'particella', nome: 'Quanti', html: () => nota("La scala quantistica dell'atomo che si guardava: le particelle e i campi. È la scala più piccola: qui lo zoom finisce.") + aperto('la guida') }], piede: () => '' };
}
// la scheda del livello dove si è (null: niente da mostrare)
export function schedaDi(q) {
  try {
    switch (q.id) {
      case 'pianeta': return schedaPianeta(q);
      case 'terreno': return q.via?.pianeta != null ? schedaPianeta(q, true) : null;
      case 'stella': return schedaStella(q);
      case 'galassia': return schedaGalassia(q);
      case 'cosmo': return schedaCosmo(q);
      case 'materia': return schedaMateria(q);
      case 'atomo': return schedaAtomi(q);
      case 'particella': return schedaQuanti(q);
      default: return null;
    }
  } catch (err) { console.warn('la scheda non si è potuta fare', err); return null; }
}
