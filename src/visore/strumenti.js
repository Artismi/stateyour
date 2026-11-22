// strumenti.js — GLI STRUMENTI DEL VISORE. La vista normale è l'occhio umano vero (nucleo.js, OCCHIO: Ferwerda et al. 1996):
// il buio resta buio. Gli strumenti sono un'altra cosa: si mettono davanti all'occhio, si accendono e si spengono, e
// ognuno dice in parole semplici che cosa fa e che cosa si sta vedendo.
//
// IL REGISTRO: ogni strumento è { id, nome, icona, tasto, pronto, fa, vedi, applica(M, acceso), misura(M) }:
//   · `fa` — una frase: che cosa fa (per chiunque, anche un bambino);
//   · `vedi` — una frase: che cosa stai vedendo quando è acceso;
//   · `applica(M, acceso)` — l'effetto sulla resa: lo mette o lo toglie nel motore 3D (M = window.__camera.mondo3d);
//   · `misura(M)` — il numero breve per l'indicatore dell'HUD (per esempio «×3·10⁶»), o '' se non c'è;
//   · `pronto: false` — lo strumento è nel registro ma non ancora fatto: la voce resta spenta, con «in arrivo».
// Aggiungerne uno è aggiungere una voce qui: il cassetto, il tasto rapido e l'indicatore lo prendono da sé.
//
// QUI DENTRO NON C'È DOM in cima: il registro e il suo stato si provano anche fuori dal navigatore (test/test_strumenti.mjs).
// `creaStrumenti` (in fondo) è la parte del visore: l'indicatore nell'HUD, il suggerimento gentile, e l'aggancio al motore.

// l'esponente scritto in apice: 6 → «⁶», −12 → «⁻¹²»
import { turbo } from '../tre/falsi_colori.js';

const APICI = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
export const apice = (n) => String(n).split('').map((c) => APICI[c] ?? c).join('');
// un fattore come lo si legge: ×1, ×30, ×3·10⁶
export function fattore(G) {
  if (!(G > 0) || !Number.isFinite(G)) return '';
  const n = Math.floor(Math.log10(G) + 1e-9), m = Math.round(G / 10 ** n);
  const [mm, nn] = m >= 10 ? [1, n + 1] : [m, n];
  if (nn <= 1) return `×${Math.round(G)}`;
  return mm === 1 ? `×10${apice(nn)}` : `×${mm}·10${apice(nn)}`;
}

const occhioDi = (M) => (M && M.stato && M.stato.visione) || null;

export const STRUMENTI = [
  {
    id: 'amplificatore', nome: 'Amplificatore di luce', icona: 'amplificatore', tasto: 'L', pronto: true,
    fa: 'Moltiplica la luce che arriva, come un visore notturno o una foto fatta tenendo aperto l’obiettivo a lungo: così vedi anche ciò che per i tuoi occhi è troppo buio.',
    vedi: 'Le cose vere, con i loro colori, ma molte volte più luminose: il numero ×10ⁿ dice quante. Il buio tra le cose resta buio.',
    // (nucleo.js: G porta la luce media del campo a 4 cd/m² sullo schermo, la segue in 1,5 s; mai sotto ×1)
    applica(M, acceso) { if (M && M.vista && M.vista.occhio) M.vista.occhio.amplificatore = !!acceso; },
    misura(M) { const o = occhioDi(M); return o ? fattore(o.G) : ''; },
  },
  {
    id: 'temperatura', nome: 'Falsi colori della temperatura', icona: 'clima', tasto: 'K', pronto: true,
    fa: 'Colora la superficie del pianeta secondo quanto è calda: blu il freddo, rosso il caldo.',
    vedi: 'Non i colori veri, ma una mappa del caldo e del freddo del suolo e del mare, senza l’aria e le nuvole davanti; la scala si adatta a ciò che guardi, come in una termocamera: i numeri accanto alla striscia dei colori dicono il più freddo e il più caldo che hai davanti.',
    // (pianeta.js: la temperatura della superficie, del mare di mare.js con i vortici e della terra di meteo.js, nella scala Turbo
    // di falsi_colori.js tra il più freddo e il più caldo attorno all'occhio, che pianeta.js scrive in opzioni.scalaTemperatura)
    applica(M, acceso) { if (M && M.opzioni) M.opzioni.falsiColori = acceso ? 'temperatura' : null; },
    misura(M) { const s = M && M.opzioni && M.opzioni.scalaTemperatura; if (!s) return ''; const d = s.max - s.min < 0.5 ? 2 : s.max - s.min < 5 ? 1 : 0, c = (T) => `${(T - 273.15).toLocaleString('it-IT', { minimumFractionDigits: d, maximumFractionDigits: d })} °C`;
      const stri = [0, 0.25, 0.5, 0.75, 1].map((x) => `rgb(${turbo(x).map((v) => Math.round(255 * v)).join(',')}) ${x * 100}%`).join(', ');
      return `${c(s.min)} <span style="display:inline-block;width:5em;height:0.7em;vertical-align:middle;border-radius:2px;background:linear-gradient(90deg, ${stri})"></span> ${c(s.max)}`; },
  },
  {
    id: 'infrarosso', nome: 'Infrarosso', icona: 'infrarosso', tasto: 'H', pronto: false,
    fa: 'Vede la luce che i nostri occhi non vedono: quella del calore, che esce dalle stelle e dalla polvere tiepida.',
    vedi: 'Le stelle e la polvere calda che brillano anche dove, a occhio, c’è solo nero.',
    applica() {}, misura: () => '',
  },
];
export const strumento = (id) => STRUMENTI.find((s) => s.id === id) || null;

// LO STATO: quali sono accesi (all'avvio nessuno: la vista normale è l'occhio)
const accesi = new Set(), ascolti = new Set();
export const acceso = (id) => accesi.has(id);
export const elencoAccesi = () => STRUMENTI.filter((s) => accesi.has(s.id));
export function accendi(id, si = !accesi.has(id)) {
  const s = strumento(id); if (!s || !s.pronto) return false;
  if (si) accesi.add(id); else accesi.delete(id);
  for (const f of ascolti) f(id, !!si);
  return !!si;
}
export const ascolta = (f) => { ascolti.add(f); return () => ascolti.delete(f); };
// l'effetto di tutti sul motore (anche su un motore nuovo: lo si richiama a ogni giro)
export function applicaTutti(M) { for (const s of STRUMENTI) if (s.pronto) s.applica(M, accesi.has(s.id)); }

// ---------- la parte del visore: l'indicatore nell'HUD e il suggerimento gentile
export function creaStrumenti(schermo, { hud, ico }) {
  const el = document.createElement('div'); el.className = 'v-chip v-strumenti'; el.hidden = true; el.setAttribute('role', 'status');
  schermo.querySelector('.v-hud')?.appendChild(el);
  const C = () => window.__camera || null;
  // IL SUGGERIMENTO: se con l'occhio solo la scena resta sotto la soglia di visione per più di qualche secondo, il visore
  // propone una volta (per sessione) l'amplificatore. Non lo accende mai da sé.
  const SOTTO_PER = 4000; let sottoDa = 0, proposto = false;
  ascolta((id, si) => { if (id === 'amplificatore' && si) proposto = true; aggiorna(); });
  function aggiorna() {
    const c = C(), M = c && c.mondo3d, tre = !!(hud.q && hud.q.tre && M);
    if (tre) applicaTutti(M);
    const lista = elencoAccesi();
    el.hidden = !lista.length;
    if (lista.length) {
      const h = lista.map((s) => { const m = tre ? s.misura(M) : ''; return `<span class="uno" title="${s.nome}: ${s.vedi}">${ico(s.icona)}<b>${s.nome}</b>${m ? `<i>${m}</i>` : tre ? '' : '<small>qui non serve</small>'}</span>`; }).join('');
      if (el.innerHTML !== h) el.innerHTML = h;
    }
    const o = tre ? occhioDi(M) : null, ora = performance.now();
    if (o && o.sottoSoglia && !acceso('amplificatore') && !proposto && !(M.volo)) { if (!sottoDa) sottoDa = ora; if (ora - sottoDa > SOTTO_PER) { proposto = true; hud.avvisa('Qui è troppo buio per i tuoi occhi. Vuoi vedere di più? L accende l’amplificatore di luce', { durata: 9000 }); } }
    else sottoDa = 0;
  }
  setInterval(aggiorna, 250);
  return { aggiorna };
}
