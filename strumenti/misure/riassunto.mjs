// riassunto.mjs — i pochi numeri complessivi del giro (da giro.json): scale vuote, salti oltre soglia, macchie, barre,
// andata e ritorno, scala dichiarata contro fattore vero. Usato da giro.mjs e da provini.mjs (che rifà riassunto e foglio).
import { SOGLIE } from './analisi.mjs';

export function riassunto(F) {
  const fmt = (w) => (w > 0 ? `${w.toExponential(1)} m` : '?');
  const intervalli = (lista) => { const out = []; for (const f of lista) { const u = out[out.length - 1]; if (u && u.ind === f.indirizzo && u.tr === f.tratto && f.i === u.ultimo + 1) { u.ultimo = f.i; u.a = f.larghezza; u.n++; } else out.push({ ind: f.indirizzo, tr: f.tratto, primo: f.i, ultimo: f.i, da: f.larghezza, a: f.larghezza, n: 1 }); } return out.map((u) => `${u.ind} ${u.tr}: ${fmt(u.da)} → ${fmt(u.a)} (${u.n})`); };
  const salti = F.filter((f) => f.salto && f.salto.cambiata > SOGLIE.salto).sort((a, b) => b.salto.cambiata - a.salto.cambiata);
  const ar = F.filter((f) => f.andataRitorno), arOltre = ar.filter((f) => f.andataRitorno.cambiata > SOGLIE.andataRitorno).sort((a, b) => b.andataRitorno.cambiata - a.andataRitorno.cambiata);
  const conSalto = F.filter((f) => f.salto), fattori = conSalto.filter((f) => !f.vuoto && f.dettaglio > 1).map((f) => Math.abs(Math.log2(f.salto.fattore / f.salto.dichiarato))).sort((a, b) => a - b);
  const riga = (f, v) => `${f.indirizzo} ${f.tratto} #${f.i} a ${fmt(f.larghezza)} [${f.stato}]: ${v}`;
  const cime = {}; for (const f of F) { const k = `${f.indirizzo} ${f.tratto}`; const c = (cime[k] ||= { fotogrammi: 0, da: f.larghezza, a: f.larghezza, nonPronti: 0 }); c.fotogrammi++; c.a = f.larghezza; if (!f.pronto) c.nonPronti++; }
  return {
    fotogrammi: F.length, tratti: cime,
    scaleVuote: { n: F.filter((f) => f.vuoto).length, dove: intervalli(F.filter((f) => f.vuoto)) },
    salti: { n: salti.length, confrontati: conSalto.length, mediana: conSalto.length ? +conSalto.map((f) => f.salto.cambiata).sort((a, b) => a - b)[conSalto.length >> 1].toFixed(3) : null, peggiori: salti.slice(0, 8).map((f) => riga(f, `cambiata ${(100 * f.salto.cambiata).toFixed(0)} %, ΔE ${f.salto.deltaE}`)) },
    macchie: { n: F.filter((f) => f.macchie > 0).length, peggiori: F.filter((f) => f.macchie > 0).sort((a, b) => b.macchiaMax - a.macchiaMax).slice(0, 5).map((f) => riga(f, `${(100 * f.macchiaMax).toFixed(1)} % dello schermo`)) },
    barre: { n: F.filter((f) => f.barre > 0).length, dove: F.filter((f) => f.barre > 0).slice(0, 8).map((f) => riga(f, `${f.barre} (${f.barreDove.map((b) => `${b.angolo}°`).join(', ')})`)) },
    andataRitorno: { confrontati: ar.length, n: arOltre.length, media: ar.length ? +(ar.reduce((s, f) => s + f.andataRitorno.cambiata, 0) / ar.length).toFixed(3) : null, peggiori: arOltre.slice(0, 8).map((f) => riga(f, `cambiata ${(100 * f.andataRitorno.cambiata).toFixed(0)} % (ritorno: ${f.andataRitorno.statoRitorno})`)) },
    scala: { fattoreVeroControDichiarato_mediana_log2: fattori.length ? +fattori[fattori.length >> 1].toFixed(2) : null, oltreUnOttava: fattori.filter((x) => x >= 1).length, contati: fattori.length },
    nonPronti: F.filter((f) => !f.pronto).length,
  };
}
export function riassuntoMd(R) {
  const l = [`# Il giro dello zoom: riassunto`, '', `${R.fotogrammi} fotogrammi; non pronti entro l'attesa: ${R.nonPronti}.`, ''];
  for (const [k, c] of Object.entries(R.tratti)) l.push(`- ${k}: ${c.fotogrammi} fotogrammi, da ${c.da?.toExponential(1)} a ${c.a?.toExponential(1)} m (non pronti ${c.nonPronti})`);
  l.push('', `| indicatore | quanti | soglia |`, `|---|---|---|`,
    `| scale vuote | ${R.scaleVuote.n} | ≥ ${100 * SOGLIE.fotogrammaVuoto} % di blocchi vuoti |`,
    `| salti oltre soglia | ${R.salti.n} su ${R.salti.confrontati} (mediana ${R.salti.mediana}) | > ${100 * SOGLIE.salto} % cambiato |`,
    `| fotogrammi con macchie | ${R.macchie.n} | area satura ≥ ${100 * SOGLIE.macchia} % |`,
    `| fotogrammi con barre | ${R.barre.n} | retta uniforme tra lati diversi |`,
    `| andata/ritorno oltre soglia | ${R.andataRitorno.n} su ${R.andataRitorno.confrontati} (media ${R.andataRitorno.media}) | > ${100 * SOGLIE.andataRitorno} % cambiato |`,
    `| fattore di zoom vero ≠ dichiarato, oltre un'ottava (solo fotogrammi non vuoti, con dettaglio > 1) | ${R.scala.oltreUnOttava} su ${R.scala.contati} (mediana \\|log₂\\| ${R.scala.fattoreVeroControDichiarato_mediana_log2}) | |`, '');
  const sez = (t, a) => { if (a.length) l.push(`## ${t}`, '', ...a.map((x) => `- ${x}`), ''); };
  sez('Scale vuote', R.scaleVuote.dove); sez('Salti peggiori', R.salti.peggiori); sez('Macchie', R.macchie.peggiori); sez('Barre', R.barre.dove); sez('Andata e ritorno peggiori', R.andataRitorno.peggiori);
  return l.join('\n');
}
