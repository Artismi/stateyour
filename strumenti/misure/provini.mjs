// provini.mjs — il foglio di provini del giro: una riga per tratto (andata, ritorno) di ogni indirizzo, un riquadro per
// fotogramma con la foto e gli indicatori a colori (verde sotto metà soglia, giallo tra metà soglia e soglia, rosso oltre).
// uso diretto (rifà riassunto e foglio da un giro.json): node strumenti/nodo.cjs strumenti/misure/provini.mjs <cartella con giro.json>
import { writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { riassunto, riassuntoMd } from './riassunto.mjs';

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const metri = (w) => { if (!(w > 0)) return '?'; const e = Math.floor(Math.log10(w)); return `${(w / 10 ** e).toFixed(1)}·10^${e} m`; };

export function scriviProvini(cartella, { fotogrammi, riassunto: R, soglie: S, modo, passo }) {
  const colore = (v, soglia, alto = true) => { if (v == null) return 'grigio'; const x = alto ? v / soglia : soglia / Math.max(v, 1e-9); return x > 1 ? 'rosso' : x > 0.5 ? 'giallo' : 'verde'; };
  const tessera = (f) => {
    const tag = (nome, v, c, tit) => `<span class="t ${c}" title="${esc(tit)}">${nome} ${v}</span>`;
    const s = f.salto, ar = f.andataRitorno;
    return `<figure class="${f.pronto ? '' : 'nonpronto'}" id="${esc(f.indirizzo)}-${f.tratto}-${f.i}"><img loading="lazy" src="${esc(f.file)}" alt=""><figcaption>
<b>${metri(f.larghezza)}</b> <i>${esc(f.stato)}</i><br>
${tag('vuota', (100 * f.vuota).toFixed(0) + '%', colore(f.vuota, S.fotogrammaVuoto), 'frazione di blocchi 8×8 quasi neri o quasi uniformi')}
${tag('salto', s ? (100 * s.cambiata).toFixed(0) + '%' : '–', colore(s?.cambiata, S.salto), s ? `ΔE medio ${s.deltaE}; fattore vero ${s.fattore} contro ${s.dichiarato} dichiarato` : 'primo del tratto')}
${tag('macchie', f.macchie, f.macchie ? 'rosso' : f.macchiaMax > S.macchia / 2 ? 'giallo' : 'verde', `area satura più grande ${(100 * f.macchiaMax).toFixed(2)} %`)}
${tag('barre', f.barre, f.barre ? 'rosso' : 'verde', (f.barreDove || []).map((b) => `${b.angolo}° a ${b.s} px, L* ${b.L}`).join('; '))}
${tag('A/R', ar ? (100 * ar.cambiata).toFixed(0) + '%' : '–', colore(ar?.cambiata, S.andataRitorno), ar ? `col ritorno #${ar.con} (${ar.statoRitorno}), ΔE ${ar.deltaE}` : 'senza confronto')}
<br><small>L* ${f.Lmedio.toFixed(1)} · dettaglio ${f.dettaglio.toFixed(1)} · ${f.attesa} ms${f.pronto ? '' : ' · NON PRONTO: ' + esc((f.occupato || []).join(', '))} · ${esc(f.cursore?.chi || '')}</small></figcaption></figure>`;
  };
  const gruppi = new Map(); for (const f of fotogrammi) { const k = `${f.indirizzo} — ${f.tratto}`; if (!gruppi.has(k)) gruppi.set(k, []); gruppi.get(k).push(f); }
  const lista = (a) => (a && a.length ? `<ul>${a.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : '');
  const html = `<!DOCTYPE html><html lang="it"><head><meta charset="utf-8"><title>Provini del giro dello zoom</title><style>
body{font:13px/1.35 system-ui,sans-serif;background:#16171a;color:#ddd;margin:16px}h1{font-size:18px}h2{font-size:15px;margin-top:22px}
table{border-collapse:collapse}td,th{border:1px solid #444;padding:3px 8px;text-align:left}
.fila{display:flex;flex-wrap:wrap;gap:6px}figure{margin:0;width:244px;background:#222;border:1px solid #333;padding:2px}figure.nonpronto{border-color:#a60}
img{width:240px;height:150px;display:block;background:#000}figcaption{font-size:11px;padding:2px}
.t{display:inline-block;padding:0 4px;border-radius:3px;margin:1px 1px 0 0;color:#111}.verde{background:#6c6}.giallo{background:#ec5}.rosso{background:#e55}.grigio{background:#888}
small{color:#999}ul{margin:4px 0}</style></head><body>
<h1>Il giro dello zoom — ${esc(modo)}, un fotogramma ogni ${passo} di decade</h1>
<table><tr><th>indicatore</th><th>quanti</th><th>soglia</th></tr>
<tr><td>scale vuote</td><td>${R.scaleVuote.n}</td><td>≥ ${100 * S.fotogrammaVuoto} % di blocchi vuoti</td></tr>
<tr><td>salti oltre soglia</td><td>${R.salti.n} su ${R.salti.confrontati}</td><td>> ${100 * S.salto} % della zona comune con ΔE > ${S.deltaE}</td></tr>
<tr><td>fotogrammi con macchie sature</td><td>${R.macchie.n}</td><td>area connessa satura ≥ ${100 * S.macchia} %</td></tr>
<tr><td>fotogrammi con barre</td><td>${R.barre.n}</td><td>retta uniforme (σ L* < ${S.barraDev}) tra due lati diversi</td></tr>
<tr><td>andata/ritorno oltre soglia</td><td>${R.andataRitorno.n} su ${R.andataRitorno.confrontati}</td><td>> ${100 * S.andataRitorno} % cambiato</td></tr>
<tr><td>fotogrammi non pronti</td><td>${R.nonPronti}</td><td>la vista non ha finito entro l'attesa</td></tr></table>
<h2>Salti peggiori</h2>${lista(R.salti.peggiori)}<h2>Scale vuote</h2>${lista(R.scaleVuote.dove)}<h2>Andata e ritorno peggiori</h2>${lista(R.andataRitorno.peggiori)}
${[...gruppi].map(([k, a]) => `<h2>${esc(k)} (${a.length})</h2><div class="fila">${a.map(tessera).join('')}</div>`).join('\n')}
</body></html>`;
  writeFileSync(join(cartella, 'provini.html'), html);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const c = process.argv[2], G = JSON.parse(readFileSync(join(c, 'giro.json'), 'utf8')), R = riassunto(G.fotogrammi);
  writeFileSync(join(c, 'riassunto.json'), JSON.stringify(R, null, 1)); writeFileSync(join(c, 'riassunto.md'), riassuntoMd(R));
  scriviProvini(c, { fotogrammi: G.fotogrammi, riassunto: R, soglie: G.soglie, modo: G.modo, passo: G.passo }); console.log(join(c, 'provini.html'));
}
