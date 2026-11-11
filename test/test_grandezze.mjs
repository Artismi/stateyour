// test_grandezze.mjs — IL GRAFO DELLE GRANDEZZE messo alla prova su mondi veri.
//
// «Una formula dipende da variabili che dipendono da altre formule; tutto può partire dal basso o dall'alto ma deve
// essere collegato, calcolato in modo continuo, correlato.» Il grafo (src/camera/grandezze.js) dichiara chi dipende da
// chi e da quale fonte; qui lo si confronta con ciò che il programma fa davvero, su alcune centinaia di pianeti presi
// dalla fonte unica degli eventi (fino al livello del pianeta: niente superfici, costano dieci secondi l'una).
//   0. IL GRAFO          sta in piedi (ogni grandezza ha una fonte, i cicli sono dichiarati, ogni lettura è possibile)
//   A. UNA FONTE         ogni grandezza ricalcolata dalla sua fonte coincide con quella che il programma tiene; le sue
//                        copie sono uguali; le altre funzioni che calcolano la stessa cosa danno lo stesso numero
//   B. CONTINUITÀ        facendo variare un ingresso a passi dell'1% (tutto il resto fermo) l'uscita non salta: le
//                        SOGLIE NETTE trovate, divise tra fisiche (l'acqua gela) e di comodo (un taglio nostro)
//   C. CORRELAZIONE      gli archi dichiarati si vedono (l'uscita si muove; nel campione il segno è quello detto), e
//                        ciò che è legato senza essere dichiarato viene fuori
//   D. DAL BASSO         un valore osservato in basso impone un intervallo in alto, e l'intervallo contiene il vero
//   E. NUMERI A MANO     quante formule riscrivono un numero o una formula che nel grafo ha già una fonte
// LA PROVA NON FALLISCE PERCHÉ TROVA DIFETTI: li stampa («≠ NON TORNA», con i numeri). Fallisce solo se il grafo
// stesso è incoerente (grandezza senza fonte, ciclo non dichiarato, lettura impossibile, fonte che non esiste più).
//   node test/test_grandezze.mjs              la prova
//   node test/test_grandezze.mjs --rapporto   la prova, e riscrive reports/Mappa delle grandezze.md con ciò che trova

import assert from 'node:assert/strict';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import * as GZ from '../src/camera/grandezze.js';

const { GRANDEZZE, FONTI, CICLI, SOGLIE, RISOLUTORI, NUMERI_CON_FONTE, FORMULE_CON_FONTE, grandezza, valore, conValore, salto } = GZ;
const T0 = performance.now(), secondi = () => ((performance.now() - T0) / 1000).toFixed(0);
// IL TEMPO. La prova sta nella catena di `npm test`: ha `--tempo` secondi in tutto (50, se non si dice altro) e li divide
// tra le sue parti. Le fonti non costano tutte uguale (e il loro costo cambia quando i moduli cambiano): le più care si
// misurano su meno mondi e a passi più larghi, e ciò che non si è fatto in tempo a misurare viene DETTO, non taciuto.
// Per il rapporto si usa un tempo lungo:  node test/test_grandezze.mjs --tempo 900 --rapporto
const argomento = (nome, riserva) => { const i = process.argv.indexOf(nome); return i > 0 && process.argv[i + 1] ? Number(process.argv[i + 1]) : riserva; };
const TEMPO = argomento('--tempo', 50), entro = (parte) => (performance.now() - T0) / 1000 < TEMPO * parte;
const LUNGO = TEMPO >= 300, PARTI = { campione: 0.25, aperto: 0.46, chiuso: 0.56, sonde: 0.62, nonDichiarate: 0.70, dalBasso: 0.95 }; // a che frazione del tempo ogni parte deve aver finito
const costo = new Map(); // millisecondi per chiamata di ogni fonte, misurati qui
const cronometra = (fonte, f) => { const t = performance.now(), r = f(), c = costo.get(fonte) || { ms: 0, n: 0 }; c.ms += performance.now() - t; c.n++; costo.set(fonte, c); return r; };
const costoVero = new Map(); // lo stesso, misurato nelle scansioni (su mondi modificati)
const costoDi = (fonte, mondi = null) => { const v = costoVero.get(fonte); if (v && v.n > 20) return v.ms / v.n; const c = costo.get(fonte); if (c && c.n) return c.ms / c.n; if (!mondi || !mondi.length) return 0.1; for (const M of mondi.slice(0, 3)) { try { cronometra(fonte, () => GZ.chiama(fonte, M)); } catch { /* si prova il prossimo */ } } return costo.get(fonte)?.n ? costoDi(fonte) : 0.1; };
const sezione = (nome) => console.log(`\n${nome}  [${secondi()} s]`);
let ok = 0, storte = 0;
const prova = (nome, f) => { f(); ok++; console.log('  ✓', nome); };
const nonTorna = (testo) => { storte++; console.log('  ≠ NON TORNA —', testo); };
const cifre = (x, n = 3) => (typeof x !== 'number' ? String(x) : !Number.isFinite(x) ? (x > 0 ? '∞' : Number.isNaN(x) ? 'n.d.' : '−∞') : x !== 0 && (Math.abs(x) >= 1e5 || Math.abs(x) < 1e-3) ? x.toExponential(n - 1).replace('.', ',').replace('e+', 'e') : Number(x.toPrecision(n)).toString().replace('.', ','));
const pc = (x) => (x === Infinity ? 'cambia categoria' : `${cifre(100 * x, 2)}%`);
const R = { grafo: {}, fonte: [], copie: [], controlli: [], soglie: [], archi: [], staccati: [], nonDichiarate: [], correlazioni: [], dalBasso: [], numeri: [], formule: [] }; // ciò che va nel rapporto

// ---------- il codice dei moduli (per le righe e per i numeri scritti a mano)
const CARTELLA = new URL('../src/camera/', import.meta.url);
const testi = new Map();
const testo = (modulo) => { if (!testi.has(modulo)) { let t = null; try { t = readFileSync(new URL(modulo, CARTELLA), 'utf8'); } catch { t = null; } testi.set(modulo, t); } return testi.get(modulo); };
const rigaDi = (modulo, cerca) => { const t = testo(modulo); if (!t) return null; const i = t.indexOf(cerca); return i < 0 ? null : t.slice(0, i).split('\n').length; };
const rigaFunzione = (modulo, f) => rigaDi(modulo, `export function ${f}(`) ?? rigaDi(modulo, `export const ${f} =`) ?? rigaDi(modulo, `function ${f}(`);
const doveFonte = (k) => { const F = FONTI[k]; if (!F) return '—'; const r = rigaFunzione(F.modulo, F.funzione); return `${F.modulo}${r ? `:${r}` : ''} ${F.funzione}`; };
const senzaCommenti = (riga) => { const i = riga.indexOf('//'); return i < 0 ? riga : riga.slice(0, i); };

// =====================================================================================================
sezione('0. IL GRAFO');
// =====================================================================================================
const ARCHI = GZ.archi(), LIV = GZ.livelli();
const guai = GZ.coerenza();
const DETTI = ARCHI.filter((a) => !a.forse), POSSIBILI = ARCHI.filter((a) => a.forse);
prova(`il grafo sta in piedi: ${GRANDEZZE.length} grandezze, ${DETTI.length} archi detti (più ${POSSIBILI.length} possibili: ingressi che una fonte riceve, da misurare), ${Object.keys(FONTI).length} fonti, ${CICLI.length} cicli dichiarati, ${SOGLIE.length} soglie lette nel codice`, () => {
  assert.deepEqual(guai, [], `il grafo è incoerente:\n${guai.map((g) => `   · ${g.che} — ${g.dove}`).join('\n')}`);
});
prova('ogni fonte esiste nel suo modulo, e il modulo che la chiama la nomina', () => {
  for (const [k, F] of Object.entries(FONTI)) {
    assert.ok(testo(F.modulo), `fonte ${k}: non trovo ${F.modulo}`);
    assert.ok(rigaFunzione(F.modulo, F.funzione), `fonte ${k}: in ${F.modulo} non c'è più la funzione «${F.funzione}»`);
    const chi = F.chiamante.split(' ')[0]; if (chi.endsWith('.js') && chi !== F.modulo && testo(chi) && !testo(chi).includes(F.funzione)) nonTorna(`${chi} non nomina più «${F.funzione}» (${F.modulo}): il grafo dice che la chiama lui`);
  }
});
{ const perse = SOGLIE.filter((s) => !rigaDi(s.dove.modulo, s.dove.cerca));
  if (perse.length) for (const s of perse) nonTorna(`la soglia «${s.perche.slice(0, 70)}…» non si trova più in ${s.dove.modulo} (cercavo «${s.dove.cerca}»): il codice è cambiato, il grafo va aggiornato`);
  else console.log(`  ✓ le ${SOGLIE.length} soglie dichiarate si ritrovano tutte nel codice`); }
// il campione
const CAMPIONE = GZ.campioneDiMondi({ cosmi: 2, galassie: LUNGO ? 14 : 10, sistemi: LUNGO ? 6 : 5, basta: () => !entro(PARTI.campione) });
const tCampione = (performance.now() - T0) / 1000;
const quanti = (f) => CAMPIONE.filter(f).length;
console.log(`  il campione: ${CAMPIONE.length} pianeti veri di ${new Set(CAMPIONE.map((M) => `${M.via.cosmo}|${M.via.galassia}|${M.via.stella}`)).size} sistemi, ${new Set(CAMPIONE.map((M) => `${M.via.cosmo}|${M.via.galassia}`)).size} galassie, 2 cosmi`
  + ` (${quanti((M) => M.P.tipo === 'roccioso')} rocciosi, ${quanti((M) => M.P.tipo === 'ghiacciato')} ghiacciati, ${quanti((M) => M.P.tipo === 'gassoso')} gassosi; acqua liquida su ${quanti((M) => M.P.clima?.acqua === 'liquida')}); ${cifre((1000 * tCampione) / CAMPIONE.length, 2)} ms a pianeta`);
if (!entro(PARTI.campione)) nonTorna(`il campione si è fermato a ${CAMPIONE.length} pianeti perché il tempo era finito (${cifre(tCampione, 2)} s su ${TEMPO}): un pianeta costa ${cifre((1000 * tCampione) / CAMPIONE.length, 2)} ms. Con --tempo più lungo sono 50 sistemi`);
R.grafo = { grandezze: GRANDEZZE.length, archi: DETTI.length, possibili: POSSIBILI.length, fonti: Object.keys(FONTI).length, cicli: CICLI.length, soglie: SOGLIE.length, campione: CAMPIONE.length, msPerPianeta: (1000 * tCampione) / CAMPIONE.length, tempo: TEMPO, livelli: LIV.length,
  archiPerSpecie: DETTI.reduce((o, a) => { const k = a.attesa ? 'attesi' : a.specie; o[k] = (o[k] || 0) + 1; return o; }, {}) };
// ogni lettura deve essere possibile: in almeno un mondo del campione, o (per ciò che nel campione non capita, e per la
// superficie) almeno il campo deve esistere nel codice del modulo che lo produce
prova('ogni grandezza si legge da un oggetto vero del programma', () => {
  for (const g of GRANDEZZE) {
    if (g.soloDallaFonte) continue;
    const n = g.campione === false ? 0 : quanti((M) => valore(g.nome, M) !== undefined && valore(g.nome, M) !== g.seManca || (g.seManca !== undefined && GZ.copie(g.nome, M).length > 0));
    g._letture = n;
    if (n > 0) continue;
    const posti = g.leggi.primo || [g.leggi], campo = String(posti[0].da ?? posti[0]).split('.').filter((k) => k !== 'length').pop(), F = FONTI[g.fonte];
    const c = [F?.modulo, F?.chiamante?.split(' ')[0], 'cosmo.js'].filter(Boolean).some((m) => testo(m)?.includes(campo));
    assert.ok(c, `lettura impossibile: «${g.nome}» si leggerebbe da ${JSON.stringify(g.leggi)}, ma nessun mondo del campione ce l'ha e il campo «${campo}» non compare in ${F?.modulo}`);
    if (g.campione !== false) nonTorna(`«${g.nome}» (${g.descrizione}) non c'è in NESSUNO dei ${CAMPIONE.length} pianeti del campione: il campo ${posti[0].da ?? posti[0]} esiste nel codice ma non capita mai`);
  }
});

// =====================================================================================================
sezione('A. UNA FONTE');
// =====================================================================================================
const TOLL = 1e-9;
const indirizzo = GZ.indirizzoDi;
// A1. ricalcolata dalla sua fonte, con i suoi ingressi letti dallo stesso mondo
{ let provate = 0, diverse = 0, fuori = 0;
  const perFonte = new Map();
  for (const M of CAMPIONE) { M._ris = {}; }
  for (const g of GRANDEZZE) {
    const F = g.fonte ? FONTI[g.fonte] : null; if (!F?.chiama || g.campione === false) continue;
    let n = 0, div = 0, max = 0, es = null, errori = 0, fuoriDominio = 0, primoErrore = '';
    for (const M of CAMPIONE) {
      if (!GZ.valePer(g.vale, M)) { if (!g.soloDallaFonte && valore(g.nome, M) !== undefined) fuoriDominio++; continue; }
      const prog = g.soloDallaFonte ? undefined : valore(g.nome, M); if (!g.soloDallaFonte && prog === undefined) continue;
      let ric; try { if (!(g.fonte in M._ris)) M._ris[g.fonte] = cronometra(g.fonte, () => GZ.chiama(g.fonte, M)); ric = GZ.ricalcola(g.nome, M, M._ris[g.fonte]); } catch (e) { errori++; primoErrore ||= e.message; continue; }
      if (g.soloDallaFonte) { M._solo ||= {}; M._solo[g.nome] = ric; n++; continue; }
      n++; const s = salto(prog, ric); if (s > TOLL) { div++; if (s > max) { max = s; es = { dove: indirizzo(M), programma: prog, fonte: ric }; } }
    }
    if (!g.soloDallaFonte) { provate++; if (div) diverse++; }
    if (fuoriDominio) fuori++;
    R.fonte.push({ nome: g.nome, fonte: g.fonte, dove: doveFonte(g.fonte), n, diversi: div, max, esempio: es, errori, primoErrore, fuoriDominio, vale: g.vale || null, solo: !!g.soloDallaFonte });
    if (errori) nonTorna(`${g.nome}: la fonte ${doveFonte(g.fonte)} lancia in ${errori} mondi su ${n + errori} («${primoErrore.slice(0, 90)}»)`);
    if (div) nonTorna(`${g.nome}: ricalcolata da ${doveFonte(g.fonte)} è diversa in ${div} mondi su ${n} (scarto massimo ${pc(max)}: il programma tiene ${cifre(es.programma, 6)}, la fonte dà ${cifre(es.fonte, 6)}, in ${es.dove})`);
  }
  for (const M of CAMPIONE) delete M._ris;
  console.log(`  ${provate} grandezze ricalcolate dalla loro fonte su ${CAMPIONE.length} mondi: ${provate - diverse} coincidono ovunque (entro 10⁻⁹), ${diverse} no`);
  // quelle che il programma non tiene e quelle che la fonte non copre
  const inLinea = GRANDEZZE.filter((g) => g.fonte && FONTI[g.fonte].inLinea), solo = GRANDEZZE.filter((g) => g.soloDallaFonte), storia = GRANDEZZE.filter((g) => g.fonte && FONTI[g.fonte].storia);
  console.log(`  non ricalcolabili: ${storia.length} escono da una storia di eventi (disco, galassia, lune), ${inLinea.length} da una formula scritta in linea (${inLinea.map((g) => g.nome).join(', ')}), ${GRANDEZZE.filter((g) => g.campione === false).length} stanno sulla superficie`);
  console.log(`  ${solo.length} grandezze il programma non le tiene in nessun oggetto: chi le vuole le ricalcola (${solo.map((g) => g.nome).join(', ')})`);
  R.grafo.inLinea = inLinea.map((g) => g.nome); R.grafo.soloDallaFonte = solo.map((g) => g.nome);
  // dove la fonte dichiarata non si applica: o il valore viene da un'altra formula (due fonti a seconda del ramo), o qui semplicemente non lo si è controllato
  for (const r of R.fonte) if (r.fuoriDominio) { const g = grandezza(r.nome); r.altraFormula = g.fuoriDominio || null; if (g.fuoriDominio) nonTorna(`DUE FONTI ${r.nome}: in ${r.fuoriDominio} mondi (${Object.entries(g.vale).map(([k, w]) => `${k} non è ${w.join(' o ')}`).join('; ')}) il valore non viene da ${doveFonte(g.fonte)}: ${g.fuoriDominio}`); }
  { const nc = R.fonte.filter((r) => r.fuoriDominio && !r.altraFormula); if (nc.length) console.log(`  (non controllate fuori dal dominio in cui il grafo sa richiamare la fonte: ${nc.map((r) => `${r.nome} in ${r.fuoriDominio} mondi`).join(', ')})`); }
}
// A2. le copie della stessa grandezza nello stesso oggetto
{ for (const g of GRANDEZZE) {
    if (!g.altrove || g.campione === false) continue;
    const perCopia = new Map();
    for (const M of CAMPIONE) { const c = GZ.copie(g.nome, M); if (c.length < 2) continue;
      for (const q of c.slice(1)) { const r = perCopia.get(q.dove) || { n: 0, div: 0, max: 0, es: null, scarti: [] }; r.n++; const s = salto(c[0].valore, q.valore); if (s > TOLL) { r.div++; r.scarti.push(Math.min(s, 2)); if (s > r.max) { r.max = s; r.es = { dove: indirizzo(M), a: c[0].valore, b: q.valore }; } } perCopia.set(q.dove, r); r.primo = c[0].dove; } }
    for (const [dove, r] of perCopia) { const medio = r.scarti.length ? r.scarti.sort((u, w) => u - w)[Math.floor(r.scarti.length / 2)] : 0; R.copie.push({ nome: g.nome, primo: r.primo, copia: dove, n: r.n, diversi: r.div, max: r.max, medio, esempio: r.es });
      if (r.div) nonTorna(`${g.nome}: la copia ${dove} è diversa da ${r.primo} in ${r.div} mondi su ${r.n} (scarto massimo ${pc(r.max)}, tipico ${pc(medio)}: ${cifre(r.es.a, 6)} contro ${cifre(r.es.b, 6)}, in ${r.es.dove})`); }
  }
  const tot = R.copie.length, male = R.copie.filter((c) => c.diversi).length;
  console.log(`  ${tot} copie della stessa grandezza in posti diversi dello stesso oggetto: ${tot - male} sempre uguali, ${male} no`);
}
// A3. I DOPPIONI: altre funzioni (o altri posti) che calcolano la stessa grandezza
{ for (const g of GRANDEZZE) for (const c of g.controlli || []) {
    let n = 0, div = 0, max = 0, es = null, somma = 0, errori = 0;
    for (const M of CAMPIONE) {
      if (!GZ.valePer(c.vale || g.vale, M)) continue;
      const prog = g.soloDallaFonte ? M._solo?.[g.nome] : valore(g.nome, M); if (prog === undefined || prog === null) continue;
      let altro; try { if (c.fonte) { const r = (M._vie ||= {})[c.fonte] ??= GZ.chiama(c.fonte, M); altro = c.esce ? GZ.daPercorso(r, typeof c.esce === 'string' ? c.esce : c.esce.da) : r; } else { const x = GZ.daPercorso(M, c.leggi.da); altro = typeof x === 'number' ? x * (c.leggi.per ?? 1) : x; } } catch { errori++; continue; }
      if (altro === undefined || altro === null) continue;
      n++; const s = salto(prog, altro); if (s > TOLL) { div++; somma += Math.min(s, 2); if (s > max) { max = s; es = { dove: indirizzo(M), programma: prog, altro }; } }
    }
    const dove = c.fonte ? doveFonte(c.fonte) : c.leggi.da;
    R.controlli.push({ nome: g.nome, fonte: doveFonte(g.fonte), altro: dove, nota: c.nota, n, diversi: div, max, medio: div ? somma / div : 0, esempio: es, errori });
    if (div) nonTorna(`DOPPIONE ${g.nome}: ${dove} dà un altro numero in ${div} mondi su ${n} (scarto massimo ${pc(max)}, tipico ${pc(div ? somma / div : 0)}: ${cifre(es.programma, 6)} contro ${cifre(es.altro, 6)}, in ${es.dove}) — ${c.nota}`);
  }
  const tot = R.controlli.length, male = R.controlli.filter((c) => c.diversi).length;
  console.log(`  ${tot} seconde vie per la stessa grandezza (un'altra funzione, un altro posto): ${tot - male} danno lo stesso numero, ${male} un numero diverso`);
}

// =====================================================================================================
sezione('B. CONTINUITÀ');
// =====================================================================================================
// i mondi su cui far variare gli ingressi: pochi, ma di specie diverse (tipo, stato dell'acqua, crosta, stella)
function scelti(k, filtro = () => true) {
  const classi = new Map(); for (const M of CAMPIONE) { if (!filtro(M)) continue; const c = `${M.P.tipo}|${String(M.P.clima?.acqua).slice(0, 7)}|${M.P.interno?.tettonica}|${M.S.stato}|${M.P.bloccato}`; if (!classi.has(c)) classi.set(c, []); classi.get(c).push(M); }
  const out = [], liste = [...classi.values()].sort((a, b) => b.length - a.length); for (let giro = 0; out.length < k && giro < 50; giro++) for (const l of liste) if (l[giro] && out.length < k) out.push(l[giro]);
  return out;
}
// l'intervallo entro cui far variare una grandezza: quello fisico dichiarato, o quello del campione
const estremi = new Map();
function intervallo(nome) {
  if (estremi.has(nome)) return estremi.get(nome);
  const g = grandezza(nome); let I = g.intervallo || null;
  if (!I) { const xs = CAMPIONE.map((M) => valore(nome, M)).filter((x) => typeof x === 'number' && isFinite(x)); if (xs.length > 5) { const lo = Math.min(...xs), hi = Math.max(...xs); if (hi > lo) I = [lo, hi]; } }
  estremi.set(nome, I); return I;
}
const scrivibile = GZ.siScrive;
const alternativeDi = (g, M) => { const ora = valore(g.nome, M); return (GZ.tipoDi(g) === 'b' ? [true, false] : g.alternative || []).filter((x) => x !== ora); };
// LE SOGLIE DICHIARATE CHE SPIEGANO UN SALTO tra due punti vicini di una scansione. Una soglia è la CAUSA se la sua
// grandezza attraversa il valore dichiarato muovendosi di poco (è l'ingresso stesso, o un antenato dell'uscita che lì
// passa liscio); se anche lei salta, è un effetto. In ordine: (1) soglie numeriche attraversate lisce; (2) un nome che
// cambia (tipo, stato, regime) ed è l'ingresso o un genitore diretto dell'uscita; (3) una categoria dello stesso ciclo
// dichiarato che cambia (lo stato dell'acqua, quando clima e aria saltano insieme da un ramo all'altro); (4) la soglia
// dell'uscita su sé stessa.
const ANT = new Map(GRANDEZZE.map((g) => [g.nome, GZ.antenati(g.nome, true)]));
function soglieAttraversate(x, p1, p2, M, uscita, fonte) {
  const val = (su, p) => (su === x ? p.x : su in p.o ? p.o[su] : undefined), ant = ANT.get(uscita), lisce = [], nomi = [], delCiclo = [], proprie = [];
  for (const s of SOGLIE) {
    if (s.fonti && !s.fonti.includes(fonte)) continue;
    const a1 = val(s.su, p1), a2 = val(s.su, p2); if (a1 === undefined || a2 === undefined || a1 === a2) continue;
    if (s.a == null) { if (s.su === x) continue; // (l'ingresso che si sta facendo variare «cambia» sempre: non è una spiegazione)
      if (s.su === uscita) proprie.push(s); else if (ARCHI.some((q) => q.da === s.su && q.a === uscita && !q.attesa)) nomi.push(s);
      else if (grandezza(s.su).tipo && CICLI.some((c) => c.membri.includes(s.su) && c.membri.includes(uscita))) delCiclo.push(s);
      continue; }
    if (typeof a1 !== 'number' || typeof a2 !== 'number') continue;
    let a = s.a; if (typeof a === 'function') { try { a = a(conValore(M, x, p1.x)); } catch { continue; } }
    if (!((a1 - a) * (a2 - a) <= 0)) continue;
    if (s.su === uscita) { proprie.push(s); continue; }
    if ((s.su === x || ant.has(s.su)) && (s.su === x || salto(a1, a2) < 0.1)) lisce.push(s);
  }
  return lisce.length ? lisce : nomi.length ? nomi : delCiclo.length ? delCiclo : proprie;
}
const specieDi = (colpite) => (!colpite.length ? 'non dichiarata' : colpite.some((s) => s.specie === 'comodo') ? 'comodo' : 'fisica');
// se nessuna soglia spiega il salto: è un CICLO dichiarato che salta da uno stato stabile all'altro? (l'uscita è del
// ciclo, e almeno un'altra grandezza del ciclo salta insieme a lei)
function cicloCheSalta(p1, p2, uscita) { for (const c of CICLI) { if (!c.salta || !c.membri.includes(uscita)) continue;
  if (c.membri.some((n) => n !== uscita && n in p1.o && GZ.saltoSopra(p1.o[n], p2.o[n], grandezza(n).trascurabile ?? 0) > 0.1)) return c; } return null; }
const SOGLIA_NETTA = 0.30;
const misure = new Map(); // «da→a» → { planets… }
const misura = (da, a, fonte, chiuso = false) => { const k = `${da}→${a}${chiuso ? ' (anello chiuso)' : ''}`; if (!misure.has(k)) misure.set(k, { da, a, fonte, chiuso, mondi: 0, mossi: 0, saltoMax: 0, peggiore: null, segni: [], elasticita: [], soglie: [] }); return misure.get(k); };
const nonDich = new Map();
const perFonte = (f) => GZ.usciteDi(f).map((g) => g.nome);
// gli ingressi dichiarati di una fonte: ciò da cui le sue uscite dipendono e che non è una sua uscita
function ingressiDi(f) { const U = new Set(perFonte(f)), I = new Map(); for (const a of ARCHI) if (U.has(a.a) && !U.has(a.da)) { if (!I.has(a.da)) I.set(a.da, new Set()); I.get(a.da).add(a.a); } return I; }
// dentro una fonte, x arriva a un'uscita B se c'è un cammino x → … → B fatto di archi le cui punte sono uscite della fonte
function raggiunte(f, x) { const U = new Set(perFonte(f)), visti = new Set(), coda = [x]; while (coda.length) { const n = coda.pop(); for (const a of ARCHI) if (a.da === n && U.has(a.a) && !visti.has(a.a)) { visti.add(a.a); coda.push(a.a); } } return visti; }

let nScansioni = 0, nChiamate = 0;
function registra(f, x, M, sc, chiuso) {
  const U = chiuso ? Object.keys(RISOLUTORI[f].uscite) : perFonte(f), arriva = chiuso ? new Set(U) : raggiunte(f, x), g = grandezza(x);
  nScansioni++; nChiamate += sc.punti.length;
  const griglia = sc.punti;
  for (const n of U) {
    const zero = grandezza(n)?.trascurabile ?? 0, vs = griglia.map((p) => p.o[n]), mosso = vs.some((y) => GZ.saltoSopra(y, vs[0], zero) > TOLL);
    const diretto = chiuso || ARCHI.some((a) => a.da === x && a.a === n);
    if (!chiuso && mosso && !arriva.has(n)) { const k = `${x}→${n}`, r = nonDich.get(k) || { da: x, a: n, fonte: f, mondi: 0, max: 0, es: null }; r.mondi++; const tot = Math.max(...vs.map((y) => GZ.saltoSopra(y, vs[0], zero))); if (tot >= r.max) { r.max = tot; r.es = { dove: indirizzo(M), da: vs[0], a: vs.find((y) => GZ.saltoSopra(y, vs[0], zero) === tot) }; } nonDich.set(k, r); continue; }
    if (!diretto) continue;
    const m = misura(x, n, f, chiuso); m.mondi++; if (mosso) m.mossi++;
    // segno ed elasticità: dagli estremi della scansione
    const num = griglia.filter((p) => typeof p.o[n] === 'number' && isFinite(p.o[n]));
    if (num.length > 2) { const a = num[0], b = num[num.length - 1]; if (b.o[n] !== a.o[n]) m.segni.push(Math.sign(b.o[n] - a.o[n])); if (sc.modo === 'rel' && a.o[n] > 0 && b.o[n] > 0) m.elasticita.push(Math.log(b.o[n] / a.o[n]) / Math.log(b.x / a.x)); }
    const s = sc.salti[n]; if (!s || !(s.a1 > 0)) continue;
    if (s.a1 > m.saltoMax) { m.saltoMax = s.a1; m.peggiore = { dove: indirizzo(M), x1: s.x1, x2: s.x2, v1: s.v1, v2: s.v2, gradino: s.gradino }; }
    if (s.a1 > SOGLIA_NETTA) { const p1 = griglia.find((p) => p.x === s.x1), p2 = griglia.find((p) => p.x === s.x2), colpite = p1 && p2 ? soglieAttraversate(x, p1, p2, M, n, f) : [], ciclo = s.gradino && !colpite.length && p1 && p2 ? cicloCheSalta(p1, p2, n) : null;
      const q = s.gradino || !s.unPasso ? s : s.unPasso; // (un gradino si mostra dove è stretto; una salita ripida ai due capi del passo dell'1%)
      m.soglie.push({ dove: indirizzo(M), x1: q.x1, x2: q.x2, v1: q.v1, v2: q.v2, salto: s.a1, gradino: s.gradino, specie: ciclo ? 'ciclo' : s.gradino ? specieDi(colpite) : s.stretto === false ? 'non stretta' : 'ripida', colpite: s.gradino ? colpite : [], ciclo: ciclo?.nome }); }
  }
  void g;
}
// B1. gli archi ad anello aperto: ogni fonte che si può chiamare, ogni suo ingresso dichiarato.
// A GIRI: prima un mondo per ogni (fonte, ingresso), dalle fonti meno care; poi il secondo mondo…; finché c'è tempo.
const APERTE = Object.keys(FONTI).filter((k) => FONTI[k].chiama && !FONTI[k].risolutore && perFonte(k).length);
const interni = new Map(); // per gli archi interni: i punti di tutte le scansioni di una fonte
// (quanti mondi, quanti punti larghi, quante strette, fino a che passo, e il tetto alle chiamate di una scansione)
const passoPer = (c) => (c < 0.5 ? { giri: 10, larghi: 64, raffina: 2, fine: 1e-3, massimo: Infinity } : c < 5 ? { giri: 5, larghi: 32, raffina: 2, fine: 1e-2, massimo: 110 } : LUNGO ? { giri: 3, larghi: 20, raffina: 1, fine: 0.1, massimo: 56 } : { giri: 2, larghi: 12, raffina: 1, fine: 0.25, massimo: 26 });
const saltatiPerTempo = new Map(); // «fonte: ingresso» → quanti mondi non fatti
function unMondo(f, x, M, chiuso, come) {
  const g = grandezza(x), U = chiuso ? Object.keys(RISOLUTORI[f].uscite) : perFonte(f);
  if (valore(x, M) === undefined && g.seManca === undefined) return;
  if (GZ.tipoDi(g) === 'n') { const J = intervallo(x); if (!J) return;
    let sc; const t0 = performance.now(); try { sc = GZ.scansione(f, x, M, { lo: J[0], hi: J[1], larghi: come.larghi, raffina: come.raffina, fine: come.fine, massimo: come.massimo }); } catch { return; }
    { const c = costoVero.get(f) || { ms: 0, n: 0 }; c.ms += performance.now() - t0; c.n += sc.punti.length; costoVero.set(f, c); } // (quanto costa la fonte su un mondo modificato: la memoria dei moduli lì non aiuta)
    registra(f, x, M, sc, chiuso); if (!chiuso) { if (!interni.has(f)) interni.set(f, []); interni.get(f).push({ M, sc }); }
    return; }
  // un ingresso a categorie: si prova ogni alternativa
  const ora = valore(x, M), base = GZ.uscite(f, M), arriva = chiuso ? null : raggiunte(f, x);
  for (const alt of alternativeDi(g, M)) { const o = GZ.uscite(f, conValore(M, x, alt)); nChiamate++;
    for (const n of U) { const s = salto(base[n], o[n]);
      if (!chiuso && !ARCHI.some((a) => a.da === x && a.a === n)) { if (s > TOLL && !arriva.has(n)) { const k = `${x}→${n}`, r = nonDich.get(k) || { da: x, a: n, fonte: f, mondi: 0, max: 0, es: null }; r.mondi++; if (s >= r.max) { r.max = s; r.es = { dove: indirizzo(M), da: base[n], a: o[n] }; } nonDich.set(k, r); } continue; }
      const m = misura(x, n, f, chiuso); m.mondi++; if (s > TOLL) m.mossi++; m.categoria = true;
      if (s > m.saltoMax) { m.saltoMax = s; m.peggiore = { dove: indirizzo(M), x1: ora, x2: alt, v1: base[n], v2: o[n], gradino: true }; }
      if (s > SOGLIA_NETTA) { const colpite = SOGLIE.filter((q) => q.su === x && q.a == null); m.soglie.push({ dove: indirizzo(M), x1: ora, x2: alt, v1: base[n], v2: o[n], salto: s, gradino: true, specie: colpite.length ? specieDi(colpite) : g.specieCategoria || 'non dichiarata', colpite }); } } }
}
function aGiri(fonti, chiuso, finoA) {
  const compiti = [];
  for (const f of fonti) { const ingressi = chiuso ? RISOLUTORI[f].ingressi : [...ingressiDi(f).keys()], valido = chiuso ? (M) => M.P.tipo !== 'gassoso' : (M) => perFonte(f).some((n) => GZ.valePer(grandezza(n).vale, M));
    const c = costoDi(f, scelti(3, valido)), come = chiuso ? (c < 20 || LUNGO ? { giri: 3, larghi: 20, raffina: 1, fine: 0.1, massimo: 56 } : { giri: 2, larghi: 12, raffina: 1, fine: 0.25, massimo: 26 }) : passoPer(c), mondi = scelti(come.giri, valido);
    ingressi.forEach((x, ordine) => { if (scrivibile(x)) mondi.forEach((M, giro) => compiti.push({ f, x, M, giro, c, come, ordine })); }); }
  compiti.sort((a, b) => a.giro - b.giro || a.c - b.c || a.ordine - b.ordine);
  for (const t of compiti) { const stima = (t.c * Math.min(t.come.massimo, t.come.larghi + 40)) / 1000; // (secondi che questa scansione può costare: se non ci stanno, si salta)
    if (!entro(finoA) || (performance.now() - T0) / 1000 + stima > TEMPO * finoA + 1) { const k = `${t.f}: ${t.x}`, r = saltatiPerTempo.get(k) || { f: t.f, x: t.x, mai: t.giro === 0 && ![...misure.values()].some((m) => m.fonte === t.f && m.da === t.x), n: 0 }; r.n++; saltatiPerTempo.set(k, r); continue; } unMondo(t.f, t.x, t.M, chiuso, t.come); }
}
aGiri(APERTE, false, PARTI.aperto);
// gli archi interni a una fonte (A e B escono dalla stessa chiamata): lungo le scansioni già fatte, dove A si sposta di
// meno dell'1% e B salta
for (const [f, lista] of interni) {
  const U = perFonte(f);
  for (const a of ARCHI) { if (!U.includes(a.a) || !U.includes(a.da)) continue;
    const gA = grandezza(a.da), JA = intervallo(a.da), m = misura(a.da, a.a, f); m.interno = true;
    const viste = new Set();
    for (const { M, sc } of lista) {
      if (!raggiunte(f, sc.x).has(a.da) && sc.x !== a.da) continue; // (l'ingresso che si muove deve muovere A)
      if (!viste.has(M)) { viste.add(M); m.mondi++; }
      let mosso = false; const zeroB = grandezza(a.a).trascurabile ?? 0;
      // (lungo una scansione A e B si muovono insieme perché si muove l'ingresso: il loro verso NON è la dipendenza
      // di B da A, quindi qui non si misura un segno; si guarda solo se B salta dove A passa liscia)
      for (let k = 0; k + 1 < sc.punti.length; k++) { const p = sc.punti[k], q = sc.punti[k + 1], A1 = p.o[a.da], A2 = q.o[a.da], B1 = p.o[a.a], B2 = q.o[a.a]; if (A1 === undefined || A2 === undefined) continue;
        const sB = GZ.saltoSopra(B1, B2, zeroB); if (sB > TOLL) mosso = true;
        if (!(sB > 0) || GZ.passi(p.x, q.x, sc.modo, sc.lo, sc.hi) > 1.0001) continue; // (solo passi dell'ingresso entro l'1%)
        let piccolo; if (typeof A1 !== 'number') piccolo = A1 !== A2; // A è una categoria: conta quando cambia
        else if (A1 === A2) continue; // A fermo: il salto di B non è suo
        else piccolo = (gA.passo !== 'ass' && A1 > 0 && A2 > 0 ? Math.abs(Math.log(A2 / A1)) / Math.log(1.01) : JA ? Math.abs(A2 - A1) / (0.01 * (JA[1] - JA[0])) : Infinity) <= 1.0001;
        if (!piccolo) continue;
        if (sB > m.saltoMax) { m.saltoMax = sB; m.peggiore = { dove: indirizzo(M), x1: A1, x2: A2, v1: B1, v2: B2, gradino: true, via: sc.x }; }
        if (sB > SOGLIA_NETTA) { const colpite = soglieAttraversate(sc.x, p, q, M, a.a, f), ciclo = colpite.length ? null : cicloCheSalta(p, q, a.a); if (!m.soglie.some((s) => s.dove === indirizzo(M))) m.soglie.push({ dove: indirizzo(M), x1: A1, x2: A2, v1: B1, v2: B2, salto: sB, gradino: true, specie: ciclo ? 'ciclo' : specieDi(colpite), colpite, via: sc.x, ciclo: ciclo?.nome }); }
      }
      if (mosso && !m._mossi?.has(M)) { (m._mossi ||= new Set()).add(M); m.mossi++; }
    }
  }
}
// B2. ad anello chiuso: il risolutore del ciclo clima-aria, con tutte le retroazioni
aGiri(Object.keys(RISOLUTORI), true, PARTI.chiuso);
// B3. il bilancio
{ const forse = (m) => !m.chiuso && POSSIBILI.some((a) => a.da === m.da && a.a === m.a) && !(m.mossi > 0); // (un arco possibile che non muove niente non è un arco)
  const tutte = [...misure.values()].filter((m) => !forse(m)), aperte = tutte.filter((m) => !m.chiuso), chiuse = tutte.filter((m) => m.chiuso);
  const conSoglia = (L, specie) => L.filter((m) => m.soglie.some((s) => s.specie === specie));
  console.log(`  ${nScansioni} scansioni, ${nChiamate} chiamate alle fonti; ${aperte.length} archi misurati ad anello aperto (di cui ${aperte.filter((m) => m.interno).length} interni a una fonte), ${chiuse.length} ad anello chiuso (clima e aria insieme)`);
  { const care = [...costo.entries()].map(([f, c]) => [f, c.ms / c.n]).filter(([, c]) => c >= 0.5).sort((a, b) => b[1] - a[1]);
    console.log(`  quanto costa una chiamata: ${care.map(([f, c]) => `${f} ${cifre(c, 2)} ms`).join(', ') || 'tutte sotto mezzo millisecondo'}`);
    const mai = [...saltatiPerTempo.values()].filter((r) => r.mai), meno = [...saltatiPerTempo.values()].filter((r) => !r.mai);
    if (mai.length) nonTorna(`NON MISURATI PER IL TEMPO (${TEMPO} s in tutto): ${mai.length} ingressi mai fatti variare — ${mai.map((r) => `${r.x} in ${r.f}`).join(', ')}. Con --tempo più lungo si misurano`);
    if (meno.length) console.log(`  (per il tempo, ${meno.length} ingressi sono stati fatti variare su meno mondi del previsto)`);
    R.grafo.costi = care.map(([f, c]) => ({ fonte: f, ms: c })); R.grafo.nonMisuratiPerTempo = mai.map((r) => `${r.x} in ${r.f}`); }
  const nonMisurati = DETTI.filter((a) => a.specie === 'legge' && !a.attesa && !misure.has(`${a.da}→${a.a}`)), nonScrivibili = nonMisurati.filter((a) => !scrivibile(a.da)), altri = nonMisurati.filter((a) => scrivibile(a.da));
  { const pm = POSSIBILI.map((a) => misure.get(`${a.da}→${a.a}`)).filter(Boolean), veri = pm.filter((m) => m.mossi > 0);
    console.log(`  archi possibili (ingressi che una fonte riceve, non detti per quell'uscita): ${pm.length} misurati su ${POSSIBILI.length}; ${veri.length} muovono l'uscita (sono archi veri: entrano nel grafo misurato), ${pm.length - veri.length} no`);
    R.grafo.possibiliMisurati = pm.length; R.grafo.possibiliVeri = veri.length; R.confermati = veri.map((m) => ({ da: m.da, a: m.a })); }
  console.log(`  archi detti «legge» non misurati: ${nonMisurati.length} su ${DETTI.filter((a) => a.specie === 'legge' && !a.attesa).length} — ${nonScrivibili.length} perché l'ingresso non è tenuto in nessun oggetto (${[...new Set(nonScrivibili.map((a) => a.da))].join(', ') || '—'}), ${altri.length} per il tempo o perché nessun mondo scelto li muove`);
  R.grafo.archiMisurati = aperte.length; R.grafo.archiChiusi = chiuse.length; R.grafo.archiNonMisurabili = nonScrivibili.map((a) => `${a.da}→${a.a}`); R.grafo.archiNonMisurati = altri.length; R.grafo.archiLegge = DETTI.filter((a) => a.specie === 'legge' && !a.attesa).length; R.grafo.scansioni = nScansioni; R.grafo.chiamate = nChiamate;
  for (const [nome, L] of [['anello aperto', aperte], ['anello chiuso', chiuse]]) {
    const nette = L.filter((m) => m.soglie.length);
    console.log(`  ${nome}: ${L.filter((m) => m.saltoMax <= SOGLIA_NETTA).length} archi senza salti oltre il 30% per passo dell'1%; ${nette.length} con una soglia netta: ${conSoglia(L, 'fisica').length} toccano una soglia fisica, ${conSoglia(L, 'comodo').length} una di comodo, ${conSoglia(L, 'ciclo').length} il salto di un ciclo tra due stati stabili, ${conSoglia(L, 'non dichiarata').length} una non dichiarata, ${conSoglia(L, 'ripida').length} una salita ripida ma continua, ${conSoglia(L, 'non stretta').length} non strette fino in fondo (chiamate finite)`);
  }
  // per soglia dichiarata: quanti archi fa saltare
  const perSoglia = new Map();
  for (const m of tutte) for (const s of m.soglie) for (const q of s.colpite) { const r = perSoglia.get(q) || { soglia: q, archi: new Set(), max: 0, es: null }; r.archi.add(`${m.da}→${m.a}${m.chiuso ? ' (chiuso)' : ''}`); if (s.salto >= r.max) { r.max = s.salto; r.es = { arco: `${m.da}→${m.a}`, ...s }; } perSoglia.set(q, r); }
  const ordine = [...perSoglia.values()].sort((a, b) => b.archi.size - a.archi.size || b.max - a.max);
  for (const specie of ['comodo', 'fisica']) { const L = ordine.filter((r) => r.soglia.specie === specie);
    console.log(`  soglie ${specie === 'comodo' ? 'DI COMODO' : 'FISICHE'} toccate: ${L.length} su ${SOGLIE.filter((s) => s.specie === specie).length} dichiarate`);
    for (const r of L) { const s = r.soglia, riga = rigaDi(s.dove.modulo, s.dove.cerca), testoRiga = `${s.su}${s.a == null ? ' (quando cambia)' : typeof s.a === 'function' ? '' : ` a ${cifre(s.a)}`}: ${s.perche}`;
      if (specie === 'comodo') nonTorna(`SOGLIA DI COMODO [${s.dove.modulo}${riga ? `:${riga}` : ''}] ${testoRiga} — fa saltare ${r.archi.size} archi (il peggiore ${r.es.arco}: ${cifre(r.es.v1)} → ${cifre(r.es.v2)}, ${pc(r.max)})`);
      else console.log(`    · fisica [${s.dove.modulo}${riga ? `:${riga}` : ''}] ${testoRiga} — ${r.archi.size} archi`);
      R.soglie.push({ specie, su: s.su, a: typeof s.a === 'function' ? 'dipende dal mondo' : s.a, perche: s.perche, sanare: s.sanare || '', modulo: s.dove.modulo, riga, archi: [...r.archi], max: r.max, esempio: r.es && { arco: r.es.arco, dove: r.es.dove, x1: r.es.x1, x2: r.es.x2, v1: r.es.v1, v2: r.es.v2 } }); }
  }
  // i cicli che saltano da uno stato stabile all'altro
  for (const c of CICLI) { const L = tutte.filter((m) => m.soglie.some((s) => s.ciclo === c.nome)); if (!L.length) continue;
    const peggio = L.map((m) => ({ m, s: m.soglie.filter((q) => q.ciclo === c.nome).sort((a, b) => b.salto - a.salto)[0] })).sort((a, b) => b.s.salto - a.s.salto)[0];
    console.log(`    · il ciclo «${c.nome}» salta tra due stati stabili su ${L.length} archi (il peggiore ${peggio.m.da} → ${peggio.m.a}${peggio.m.chiuso ? ' (anello chiuso)' : ''}: ${cifre(peggio.s.v1, 4)} → ${cifre(peggio.s.v2, 4)}, ${pc(peggio.s.salto)}, tra ${cifre(peggio.s.x1, 5)} e ${cifre(peggio.s.x2, 5)}, in ${peggio.s.dove})`);
    R.soglie.push({ specie: 'ciclo', su: c.nome, a: null, perche: c.salta, sanare: '', modulo: FONTI[c.chiude].modulo, riga: rigaFunzione(FONTI[c.chiude].modulo, FONTI[c.chiude].funzione), archi: L.map((m) => `${m.da}→${m.a}${m.chiuso ? ' (chiuso)' : ''}`), max: peggio.s.salto, esempio: { arco: `${peggio.m.da}→${peggio.m.a}`, dove: peggio.s.dove, x1: peggio.s.x1, x2: peggio.s.x2, v1: peggio.s.v1, v2: peggio.s.v2 } }); }
  // i salti che nessuna soglia dichiarata spiega, e le salite ripide
  for (const specie of ['non dichiarata', 'ripida']) {
    const L = tutte.filter((m) => m.soglie.some((s) => s.specie === specie)).sort((a, b) => b.saltoMax - a.saltoMax);
    for (const m of L) { const s = m.soglie.filter((q) => q.specie === specie).sort((a, b) => b.salto - a.salto)[0], F = FONTI[m.fonte];
      const riga = `${m.da} → ${m.a}${m.chiuso ? ' (anello chiuso)' : ''}: tra ${cifre(s.x1, 5)} e ${cifre(s.x2, 5)} l'uscita va da ${cifre(s.v1, 4)} a ${cifre(s.v2, 4)} (${pc(s.salto)}) in ${m.soglie.filter((q) => q.specie === specie).length} mondi su ${m.mondi} [${doveFonte(m.fonte)}]${s.via ? ` (muovendo ${s.via})` : ''}`;
      if (specie === 'non dichiarata') nonTorna(`SOGLIA NON DICHIARATA ${riga}`); else console.log(`    · salita ripida ma continua: ${riga}`);
      R.soglie.push({ specie, su: m.da, a: null, perche: specie === 'ripida' ? 'salita ripida ma continua (a passi più fini il salto si scioglie)' : 'un salto che nessuna soglia dichiarata nel grafo spiega', sanare: '', modulo: F.modulo, riga: rigaFunzione(F.modulo, F.funzione), archi: [`${m.da}→${m.a}${m.chiuso ? ' (chiuso)' : ''}`], max: s.salto, esempio: { arco: `${m.da}→${m.a}`, dove: s.dove, x1: s.x1, x2: s.x2, v1: s.v1, v2: s.v2 }, mondi: m.soglie.filter((q) => q.specie === specie).length, su_mondi: m.mondi }); }
    if (specie === 'ripida' && !L.length) console.log('    · nessuna salita ripida ma continua oltre il 30% per passo');
  }
  for (const m of tutte) R.archi.push({ da: m.da, a: m.a, fonte: m.fonte, chiuso: m.chiuso, interno: !!m.interno, categoria: !!m.categoria, mondi: m.mondi, mossi: m.mossi, saltoMax: m.saltoMax, peggiore: m.peggiore, segno: m.segni.length ? Math.sign(m.segni.reduce((u, w) => u + w, 0)) : 0, concordi: m.segni.length ? Math.abs(m.segni.reduce((u, w) => u + w, 0)) / m.segni.length : 0, elasticita: m.elasticita.length ? m.elasticita.slice().sort((u, w) => u - w)[Math.floor(m.elasticita.length / 2)] : null, soglie: m.soglie.map((s) => s.specie) });
}

// =====================================================================================================
sezione('C. CORRELAZIONE');
// =====================================================================================================
// la tabella del campione: ogni grandezza numerica (i sì/no come 0 e 1) in ogni mondo
const colonna = new Map();
for (const g of GRANDEZZE) { if (g.campione === false || GZ.tipoDi(g) === 'c' || GZ.tipoDi(g) === 'campo') continue;
  colonna.set(g.nome, CAMPIONE.map((M) => { const x = g.soloDallaFonte ? M._solo?.[g.nome] : valore(g.nome, M); return typeof x === 'boolean' ? (x ? 1 : 0) : typeof x === 'number' && isFinite(x) ? x : NaN; })); }
const ranghi = (v) => { const idx = v.map((x, i) => [x, i]).sort((a, b) => a[0] - b[0]), r = new Array(v.length); for (let i = 0; i < idx.length;) { let j = i; while (j + 1 < idx.length && idx[j + 1][0] === idx[i][0]) j++; for (let k = i; k <= j; k++) r[idx[k][1]] = (i + j) / 2; i = j + 1; } return r; };
// (due grandezze della stella o della galassia valgono lo stesso per tutti i pianeti di un sistema: si conta una riga
// per sistema, se no dieci pianeti della stessa stella sembrerebbero dieci conferme)
const SISTEMA = CAMPIONE.map((M) => `${M.via.cosmo}|${M.via.galassia}|${M.via.stella}`), PRIMO_DEL_SISTEMA = SISTEMA.map((k, i) => SISTEMA.indexOf(k) === i);
const GALASSIA = CAMPIONE.map((M) => `${M.via.cosmo}|${M.via.galassia}`), PRIMO_DELLA_GALASSIA = GALASSIA.map((k, i) => GALASSIA.indexOf(k) === i);
const delPianeta = (nome) => grandezza(nome).livello === 'pianeta', dellaGalassia = (nome) => ['cosmo', 'galassia'].includes(grandezza(nome).livello);
function spearman(a, b, righe = null) { const xa = [], xb = []; for (let i = 0; i < a.length; i++) if (!Number.isNaN(a[i]) && !Number.isNaN(b[i]) && (!righe || righe[i])) { xa.push(a[i]); xb.push(b[i]); } const n = xa.length; if (n < (righe ? 20 : 30)) return { rho: NaN, n };
  const ra = ranghi(xa), rb = ranghi(xb), m = (n - 1) / 2; let sab = 0, saa = 0, sbb = 0; for (let i = 0; i < n; i++) { sab += (ra[i] - m) * (rb[i] - m); saa += (ra[i] - m) ** 2; sbb += (rb[i] - m) ** 2; } return { rho: saa > 0 && sbb > 0 ? sab / Math.sqrt(saa * sbb) : NaN, n }; }
const rho2 = (A, B) => spearman(colonna.get(A), colonna.get(B), dellaGalassia(A) && dellaGalassia(B) ? PRIMO_DELLA_GALASSIA : !delPianeta(A) && !delPianeta(B) ? PRIMO_DEL_SISTEMA : null);
// LA CORRELAZIONE PARZIALE (sui ranghi): quanto A e B vanno insieme TOLTO ciò che spiegano gli altri ingressi di B. È il
// confronto giusto con una dipendenza diretta: nel campione gli ingressi si muovono insieme (un pianeta grande è anche
// pesante), e la correlazione semplice mescola tutto.
function parziale(A, B, altri) {
  const nomi = [A, B, ...altri], cols = nomi.map((n) => colonna.get(n)), righe = []; for (let i = 0; i < CAMPIONE.length; i++) if (cols.every((c) => !Number.isNaN(c[i]))) righe.push(i);
  const n = righe.length, k = altri.length; if (n < 30 || n < 6 * (k + 2)) return null;
  const R0 = cols.map((c) => { const r = ranghi(righe.map((i) => c[i])), m = (n - 1) / 2; let v = 0; for (const x of r) v += (x - m) ** 2; const sd = Math.sqrt(v / n) || 1; return r.map((x) => (x - m) / sd); });
  if (!k) { let sab = 0; for (let i = 0; i < n; i++) sab += R0[0][i] * R0[1][i]; return { rho: sab / n, n, tolti: 0 }; }
  // i minimi quadrati di A e di B sugli altri (equazioni normali, con una briciola sulla diagonale per gli ingressi quasi uguali)
  const X = R0.slice(2), XtX = X.map((xi) => X.map((xj) => { let v = 0; for (let i = 0; i < n; i++) v += xi[i] * xj[i]; return v; })); for (let i = 0; i < k; i++) XtX[i][i] += 1e-6 * n;
  const risolvi = (y) => { const Mx = XtX.map((r, i) => [...r, X[i].reduce((v, xi, t) => v + xi * y[t], 0)]);
    for (let c = 0; c < k; c++) { let pv = c; for (let r = c + 1; r < k; r++) if (Math.abs(Mx[r][c]) > Math.abs(Mx[pv][c])) pv = r; [Mx[c], Mx[pv]] = [Mx[pv], Mx[c]]; if (Math.abs(Mx[c][c]) < 1e-12) continue; for (let r = 0; r < k; r++) if (r !== c) { const f = Mx[r][c] / Mx[c][c]; for (let q = c; q <= k; q++) Mx[r][q] -= f * Mx[c][q]; } }
    const beta = Mx.map((r, i) => (Math.abs(r[i]) < 1e-12 ? 0 : r[k] / r[i])); return y.map((v, t) => v - X.reduce((u, xi, i) => u + beta[i] * xi[t], 0)); };
  const ra = risolvi(R0[0]), rb = risolvi(R0[1]); let sab = 0, saa = 0, sbb = 0; for (let i = 0; i < n; i++) { sab += ra[i] * rb[i]; saa += ra[i] ** 2; sbb += rb[i] ** 2; }
  return saa > 1e-9 * n && sbb > 1e-9 * n ? { rho: sab / Math.sqrt(saa * sbb), n, tolti: k } : null;
}
function pendenzaLog(a, b) { let n = 0, sx = 0, sy = 0, sxx = 0, sxy = 0; for (let i = 0; i < a.length; i++) if (a[i] > 0 && b[i] > 0) { const x = Math.log(a[i]), y = Math.log(b[i]); n++; sx += x; sy += y; sxx += x * x; sxy += x * y; } const d = n * sxx - sx * sx; return n > 30 && d > 0 ? (n * sxy - sx * sy) / d : null; }
// C1. I FILI STACCATI: archi DETTI in cui l'uscita non si muove mai, qualunque valore prenda l'ingresso. Prima di dirlo
// si sonda largo: tre valori dell'ingresso (gli estremi e il mezzo, o ogni alternativa) su tutti i mondi del campione
// in cui la fonte vale (meno, se costa): se in qualcuno l'uscita si muove, il filo c'è (vale solo a certe condizioni).
const sonde = new Map();
function sonda(f, x) { const k = `${f}|${x}`; if (sonde.has(k)) return sonde.get(k);
  const g = grandezza(x), U = perFonte(f), J = GZ.tipoDi(g) === 'n' ? intervallo(x) : null, c = costoDi(f), r = { n: 0, mossi: Object.fromEntries(U.map((n) => [n, 0])) };
  const mondi = CAMPIONE.filter((M) => U.some((n) => GZ.valePer(grandezza(n).vale, M))).slice(0, c < 0.5 ? 400 : c < 5 ? 80 : LUNGO ? 30 : 8);
  for (const M of mondi) { if (valore(x, M) === undefined && g.seManca === undefined) continue;
    const prove = J ? (g.passo !== 'ass' && J[0] > 0 ? [J[0], Math.sqrt(J[0] * J[1]), J[1]] : [J[0], 0.5 * (J[0] + J[1]), J[1]]) : alternativeDi(g, M); let base; try { base = GZ.uscite(f, M); } catch { continue; } if (base.errore) continue; r.n++;
    const visti = new Set(); for (const alt of prove) { let o; try { o = GZ.uscite(f, conValore(M, x, alt)); } catch { continue; } for (const n of U) if (!visti.has(n) && GZ.saltoSopra(base[n], o[n], grandezza(n).trascurabile ?? 0) > TOLL) { visti.add(n); r.mossi[n]++; } } }
  sonde.set(k, r); return r; }
{ const misurati = [...misure.values()].filter((m) => !m.chiuso && !m.interno); let condizionati = 0;
  for (const m of misurati) { const a = DETTI.find((q) => q.da === m.da && q.a === m.a); if (!a || m.mossi > 0) continue;
    const s = entro(PARTI.sonde) || LUNGO ? sonda(m.fonte, m.da) : { n: 0, mossi: {} }; if (s.mossi[m.a] > 0) { condizionati++; continue; }
    const mondi = Math.max(m.mondi, s.n); if (mondi < 4 && !a.attesa) continue;
    R.staccati.push({ da: m.da, a: m.a, specie: a.attesa ? 'atteso dalla fisica, assente nel codice' : 'detto nel grafo, ma l\'uscita non si muove', nota: a.nota || '', dove: doveFonte(m.fonte), mondi, peso: a.attesa ? 2 : 1 });
    nonTorna(`FILO STACCATO ${m.da} → ${m.a}: su ${mondi} mondi, facendo variare ${m.da} su tutto il suo intervallo, ${m.a} non si muove mai [${doveFonte(m.fonte)}]${a.nota ? ` — ${a.attesa ? 'atteso dalla fisica: ' : ''}${a.nota}` : ''}`); }
  if (condizionati) console.log(`  (${condizionati} archi detti non si muovono nei pochi mondi delle scansioni ma sì sondando tutto il campione: valgono solo a certe condizioni)`);
  // gli archi attesi il cui ingresso non si può nemmeno scrivere (il programma non lo tiene)
  for (const a of ARCHI) if (a.attesa && !misure.has(`${a.da}→${a.a}`)) { R.staccati.push({ da: a.da, a: a.a, specie: 'atteso dalla fisica, assente nel codice', nota: a.nota || '', dove: doveFonte(a.fonte), mondi: 0, peso: 2 }); nonTorna(`FILO STACCATO ${a.da} → ${a.a}: ${a.nota} (l'ingresso non è tenuto in nessun oggetto: la fonte non può leggerlo) [${doveFonte(a.fonte)}]`); }
}
// C2. nel campione: le due grandezze vanno insieme nel verso che la dipendenza dice? Si confronta la correlazione
// PARZIALE (tolti gli altri ingressi dichiarati della stessa uscita) con il segno dichiarato o, se non è dichiarato,
// con quello misurato facendo variare l'ingresso da solo.
{ let visti = 0, concordi = 0, deboli = 0, nonGiudicabili = 0, contrari = 0;
  for (const a of ARCHI) { if (!colonna.has(a.da) || !colonna.has(a.a)) continue; if (a.forse && !(misure.get(`${a.da}→${a.a}`)?.mossi > 0)) continue; const { rho, n } = rho2(a.da, a.a); if (Number.isNaN(rho)) continue;
    const m = misure.get(`${a.da}→${a.a}`), somma = m ? m.segni.reduce((u, w) => u + w, 0) : 0, mis = m && m.segni.length ? { segno: Math.sign(somma), concordi: Math.abs(somma) / m.segni.length } : null;
    const atteso = a.segno ?? (mis && mis.concordi > 0.8 ? mis.segno : 0), el = m && m.elasticita.length ? m.elasticita.slice().sort((u, w) => u - w)[Math.floor(m.elasticita.length / 2)] : a.esp ?? null, pend = pendenzaLog(colonna.get(a.da), colonna.get(a.a));
    const altri = ARCHI.filter((q) => q.a === a.a && q.da !== a.da && !q.attesa && (!q.forse || misure.get(`${q.da}→${q.a}`)?.mossi > 0) && colonna.has(q.da) && colonna.get(q.da).some((v, i, c) => !Number.isNaN(v) && v !== c.find((w) => !Number.isNaN(w)))).map((q) => q.da), par = delPianeta(a.da) || delPianeta(a.a) ? parziale(a.da, a.a, altri) : null;
    const riga = { da: a.da, a: a.a, specie: a.attesa ? 'attesa' : a.specie, rho, n, parziale: par?.rho ?? null, tolti: par?.tolti ?? null, atteso, misurato: mis?.segno ?? null, dichiarato: a.segno ?? null, elasticita: el, pendenza: pend, dove: doveFonte(a.fonte) };
    R.correlazioni.push(riga);
    if (a.attesa) continue;
    if (a.segno && mis && mis.concordi > 0.8 && mis.segno && mis.segno !== a.segno && !m.interno) { riga.guasto = 'segno dichiarato contrario a quello misurato'; R.staccati.push({ da: a.da, a: a.a, specie: 'il grafo dichiara un segno, la fonte ne mostra un altro', nota: `dichiarato ${a.segno > 0 ? '+' : '−'}, misurato ${mis.segno > 0 ? '+' : '−'} facendo variare l'ingresso da solo su ${m.mondi} mondi`, dove: riga.dove, mondi: m.mondi, peso: 3 }); nonTorna(`SEGNO ${a.da} → ${a.a}: il grafo dichiara ${a.segno > 0 ? '+' : '−'}, ma facendo variare l'ingresso da solo l'uscita va ${mis.segno > 0 ? 'su' : 'giù'} [${riga.dove}]`); continue; }
    if (!atteso) continue;
    const r = par ? par.rho : a.specie === 'storia' ? rho : null; if (r == null) { nonGiudicabili++; continue; } visti++;
    if (Math.sign(r) === atteso && Math.abs(r) >= 0.1) { concordi++; continue; }
    const come = par ? `correlazione parziale ${cifre(r, 2)} (tolti ${par.tolti} altri ingressi; semplice ${cifre(rho, 2)}) su ${par.n} mondi` : `ρ = ${cifre(rho, 2)} su ${n} ${delPianeta(a.da) || delPianeta(a.a) ? 'mondi' : 'sistemi'}`;
    if (Math.abs(r) < (a.specie === 'storia' ? 0.1 : 0.25)) { deboli++; riga.guasto = 'nel campione non si vede';
      if (a.specie === 'storia') { R.staccati.push({ da: a.da, a: a.a, specie: 'dichiarato (esce da una storia), ma nel campione non si vede', nota: `${come}; atteso ${atteso > 0 ? '+' : '−'}`, dove: riga.dove, mondi: n, peso: 4 }); nonTorna(`FILO CHE NON SI VEDE ${a.da} → ${a.a}: esce da una storia e il grafo dice ${atteso > 0 ? '+' : '−'}, ma nel campione ${come} [${riga.dove}]`); } continue; }
    riga.guasto = 'correlazione contraria'; contrari++; if (a.segno == null) continue; // (dove il segno è solo misurato, il confronto è tra due misure: si conta, non si denuncia)
    R.staccati.push({ da: a.da, a: a.a, specie: 'nel campione legate al contrario di come la dipendenza dice', nota: `${come}; la dipendenza ${a.segno ? 'dichiarata' : 'misurata'} è ${atteso > 0 ? '+' : '−'}`, dove: riga.dove, mondi: n, peso: a.specie === 'storia' ? 3 : 5 });
    nonTorna(`CORRELAZIONE CONTRARIA ${a.da} → ${a.a}: la dipendenza è ${atteso > 0 ? '+' : '−'}, nel campione ${come} [${riga.dove}]`);
  }
  console.log(`  ${visti} archi con un segno atteso e abbastanza mondi: in ${concordi} il campione (tolti gli altri ingressi) va nel verso che la dipendenza dice, in ${deboli} il legame è troppo debole per vederlo, in ${contrari} va al contrario (si denunciano solo quelli a cui il grafo dà un segno); ${nonGiudicabili} non giudicabili (troppo pochi mondi per togliere gli altri ingressi)`);
  // l'ordine di grandezza della pendenza: dove la dipendenza è una legge di potenza e il campione la segue bene
  const forti = R.correlazioni.filter((r) => r.elasticita != null && r.pendenza != null && Math.abs(r.rho) > 0.7 && Math.abs(r.elasticita) > 0.05);
  const lontane = forti.filter((r) => Math.sign(r.pendenza) !== Math.sign(r.elasticita) || Math.abs(r.pendenza / r.elasticita) > 3 || Math.abs(r.pendenza / r.elasticita) < 1 / 3);
  console.log(`  pendenza: ${forti.length} archi dove il campione segue bene l'ingresso (|ρ| > 0,7): in ${forti.length - lontane.length} la pendenza del campione sta entro un fattore 3 dall'esponente della dipendenza`);
  for (const r of lontane) { r.pendenzaLontana = true; console.log(`    · ${r.da} → ${r.a}: esponente della dipendenza ${cifre(r.elasticita, 2)}, pendenza nel campione ${cifre(r.pendenza, 2)} (altri ingressi si muovono insieme a questo)`); }
  R.grafo.correlazione = { visti, concordi, deboli, contrari: visti - concordi - deboli, nonGiudicabili, pendenzeForti: forti.length, pendenzeLontane: lontane.length };
}
// C3. LE DIPENDENZE NON DICHIARATE
{ // (a) alla fonte: un ingresso che il grafo non dichiara, fatto variare, muove l'uscita (visto nelle scansioni di B)
  // e in più: ogni altra grandezza che si può scrivere, spostata una volta, per le fonti che ricevono l'oggetto intero
  const tutteScrivibili = GRANDEZZE.filter((g) => scrivibile(g.nome)).map((g) => g.nome);
  const nonProvate = [];
  for (const f of APERTE.slice().sort((a, b) => costoDi(a) - costoDi(b))) { const U = perFonte(f), dichiarati = ingressiDi(f), mondi = scelti(costoDi(f) < 5 ? 3 : 1, (M) => U.some((n) => GZ.valePer(grandezza(n).vale, M)));
    if (!entro(PARTI.nonDichiarate) || (costoDi(f) >= 5 && !LUNGO)) { nonProvate.push(f); continue; }
    for (const x of tutteScrivibili) { if (dichiarati.has(x) || U.includes(x)) continue; const g = grandezza(x);
      if ((FONTI[f].rifa || []).some((r) => ANT.get(r).has(x))) continue; // (la chiamata rifà da sé una grandezza che dipende da x: non è una lettura nascosta)
      for (const M of mondi) { const ora = valore(x, M); if (ora === undefined) continue;
        // (se scrivere x cambia anche un ingresso dichiarato, i due stanno nello stesso campo dell'oggetto: non è una dipendenza nascosta)
        { const prova1 = GZ.tipoDi(g) === 'n' ? (typeof ora === 'number' && ora !== 0 ? ora * 1.37 : 0.1) : alternativeDi(g, M)[0]; if (prova1 === undefined) continue; const M1 = conValore(M, x, prova1); if ([...dichiarati.keys()].some((d) => salto(valore(d, M), valore(d, M1)) > TOLL)) continue; }
        const prove = GZ.tipoDi(g) === 'n' ? (typeof ora === 'number' && ora !== 0 ? [ora * 1.37, ora / 1.37] : [0.1]) : alternativeDi(g, M); let base = null;
        for (const alt of prove) { let o; try { base ||= GZ.uscite(f, M); o = GZ.uscite(f, conValore(M, x, alt)); } catch { continue; }
          for (const n of U) { const s = GZ.saltoSopra(base[n], o[n], grandezza(n).trascurabile ?? 0); if (!(s > 1e-6)) continue; const k = `${x}→${n}`, r = nonDich.get(k) || { da: x, a: n, fonte: f, mondi: 0, max: 0, es: null }; r.mondi++; if (s >= r.max) { r.max = s; r.es = { dove: indirizzo(M), da: base[n], a: o[n], x: ora, x2: alt }; } nonDich.set(k, r); } } } } }
  if (nonProvate.length) nonTorna(`NON PROVATE PER IL TEMPO: le fonti ${nonProvate.join(', ')} non sono state sollecitate con ingressi non dichiarati`);
  R.grafo.ablazioneNonProvata = nonProvate;
  for (const r of [...nonDich.values()].sort((a, b) => b.max - a.max)) { R.nonDichiarate.push({ come: 'alla fonte', da: r.da, a: r.a, dove: doveFonte(r.fonte), mondi: r.mondi, max: r.max, esempio: r.es });
    nonTorna(`DIPENDENZA NON DICHIARATA ${r.da} → ${r.a}: il grafo non la dice, ma cambiando ${r.da} la fonte ${doveFonte(r.fonte)} dà un altro ${r.a} (${cifre(r.es.da, 4)} → ${cifre(r.es.a, 4)}, ${pc(r.max)}; in ${r.es.dove})`); }
  // (b) nel campione: coppie legate (|ρ| alto) che nel grafo non hanno niente in comune (né un cammino, né un antenato)
  const ant = new Map(GRANDEZZE.map((g) => [g.nome, GZ.antenati(g.nome, true)])), nomi = [...colonna.keys()], MONDI_MINIMI = Math.max(30, Math.min(100, Math.round(CAMPIONE.length / 3))); let coppie = 0;
  const legate = [];
  for (let i = 0; i < nomi.length; i++) for (let j = i + 1; j < nomi.length; j++) { const A = nomi[i], B = nomi[j], aA = ant.get(A), aB = ant.get(B);
    if (aA.has(B) || aB.has(A)) continue; let comune = false; for (const q of aA) if (aB.has(q)) { comune = true; break; } if (comune) continue;
    coppie++; const tutteEDue = !delPianeta(A) && !delPianeta(B), { rho, n } = rho2(A, B); if (!Number.isNaN(rho) && n >= (tutteEDue ? 25 : MONDI_MINIMI) && Math.abs(rho) >= (tutteEDue ? 0.5 : 0.4)) legate.push({ A, B, rho, n, sistemi: tutteEDue }); }
  legate.sort((a, b) => Math.abs(b.rho) - Math.abs(a.rho));
  console.log(`  nel campione: ${coppie} coppie di grandezze che nel grafo non hanno niente in comune (né un cammino né un antenato): ${legate.length} sono legate lo stesso (|ρ| ≥ 0,4 su almeno ${MONDI_MINIMI} mondi; tra grandezze della stella o della galassia, |ρ| ≥ 0,5 su almeno 25 sistemi)`);
  for (const r of legate) { R.nonDichiarate.push({ come: 'nel campione', da: r.A, a: r.B, dove: `${doveFonte(grandezza(r.A).fonte)} / ${doveFonte(grandezza(r.B).fonte)}`, mondi: r.n, max: Math.abs(r.rho), rho: r.rho });
    nonTorna(`LEGATE SENZA CHE IL GRAFO LO DICA ${r.A} ↔ ${r.B}: ρ = ${cifre(r.rho, 2)} su ${r.n} ${r.sistemi ? 'sistemi' : 'mondi'}, e nel grafo non hanno né un cammino né un antenato in comune`); }
}

// =====================================================================================================
sezione('D. DAL BASSO');
// =====================================================================================================
// Un valore osservato in basso → l'intervallo che impone a un ingresso in alto (tutto il resto com'è in quel mondo, o
// dichiarato ignoto) → l'intervallo deve contenere il valore vero del mondo da cui si è partiti.
const banda = (x, r) => [x * (1 - r), x * (1 + r)];
const serraDelCampione = (() => { const xs = CAMPIONE.map((M) => valore('aria.serra', M)).filter((x) => x > 0); return [Math.min(...xs), Math.max(...xs)]; })();
const liquida = (M) => M.P.tipo !== 'gassoso' && M.P.clima?.acqua === 'liquida' && valore('clima.temperatura', M) >= 273.15 && valore('clima.temperatura', M) < 647;
const CASI = [
  { nome: 'acqua liquida in superficie → temperatura (bolle.js chiede) → luce della stella, con serra e pressione note', quando: liquida, mondi: 8,
    osserva: (M) => { const q = GZ.chiedeDalBasso('acqua liquida', M); return { grandezza: 'clima.temperatura', osservato: q.osservazioni['clima.temperatura'] }; }, ingressi: ['stella.luminosita', 'orbita.distanza'] },
  { nome: 'acqua liquida in superficie → temperatura → serra dell\'aria (τ), con la luce nota', quando: liquida, mondi: 8,
    osserva: (M) => ({ grandezza: 'clima.temperatura', osservato: GZ.chiedeDalBasso('acqua liquida', M).osservazioni['clima.temperatura'] }), ingressi: ['aria.serra'] },
  { nome: 'acqua liquida in superficie → temperatura → luce della stella, SENZA sapere la serra (tutta quella del campione)', quando: liquida, mondi: 5,
    osserva: (M) => ({ grandezza: 'clima.temperatura', osservato: GZ.chiedeDalBasso('acqua liquida', M).osservazioni['clima.temperatura'] }), ingressi: ['stella.luminosita'], opz: { liberi: { 'aria.serra': serraDelCampione }, punti: 80 } },
  { nome: 'acqua liquida in superficie → distanza dalla stella, ad anello chiuso (clima e aria insieme: la fascia abitabile di quel pianeta)', quando: liquida, mondi: 4,
    osserva: () => ({ grandezza: 'acqua.stato', osservato: 'liquida' }), ingressi: ['orbita.distanza'], opz: { chiuso: 'climaEAria', punti: 40 } },
  { nome: 'ghiaccio in superficie → temperatura (bolle.js chiede) → luce della stella', quando: (M) => M.P.tipo !== 'gassoso' && M.P.clima?.acqua === 'ghiaccio' && M.P.Lw > 0 && valore('clima.temperatura', M) < 273.15 && valore('aria.pressione', M) >= 611, mondi: 8,
    osserva: (M) => ({ grandezza: 'clima.temperatura', osservato: GZ.chiedeDalBasso('ghiaccio', M).osservazioni['clima.temperatura'] }), ingressi: ['stella.luminosita'] },
  { nome: 'campo magnetico osservato (±10%) → durata del giorno (la rotazione ordina la dinamo) ed età', quando: (M) => M.P.tipo !== 'gassoso' && M.P.interno?.dinamo && M.P.interno?.rossby != null, mondi: 8,
    osserva: (M) => ({ grandezza: 'interno.campo', osservato: banda(valore('interno.campo', M), 0.1) }), ingressi: ['pianeta.giorno', 'stella.eta'] },
  { nome: 'campo magnetico acceso (dinamo: sì) → nucleo liquido: raggio minimo ed età massima del pianeta', quando: (M) => M.P.tipo !== 'gassoso' && M.P.interno?.dinamo, mondi: 8,
    osserva: () => ({ grandezza: 'interno.dinamo', osservato: true }), ingressi: ['pianeta.raggio', 'stella.eta'] },
  { nome: 'crosta a placche → massa ed età del pianeta', quando: (M) => M.P.interno?.tettonica === 'a placche', mondi: 8,
    osserva: () => ({ grandezza: 'interno.tettonica', osservato: 'a placche' }), ingressi: ['pianeta.massa', 'stella.eta', 'pianeta.acqua'] },
  { nome: 'raggio osservato (±2%) → massa del pianeta', quando: (M) => GZ.valePer(grandezza('pianeta.raggio').vale, M), mondi: 8,
    osserva: (M) => ({ grandezza: 'pianeta.raggio', osservato: banda(valore('pianeta.raggio', M), 0.02) }), ingressi: ['pianeta.massa'] },
  { nome: 'luce della stella osservata (±5%) → massa della stella', quando: (M) => GZ.valePer(grandezza('stella.luminosita').vale, M), mondi: 8,
    osserva: (M) => ({ grandezza: 'stella.luminosita', osservato: banda(valore('stella.luminosita', M), 0.05) }), ingressi: ['stella.massa'], opz: { lo: 0.08, hi: 8, punti: 300 } },
  { nome: 'stessa faccia alla stella (bloccato: sì) → distanza massima dalla stella', quando: (M) => M.P.bloccato === true, mondi: 8,
    osserva: () => ({ grandezza: 'pianeta.bloccato', osservato: true }), ingressi: ['orbita.distanza'] },
  { nome: 'magnetopausa osservata (±5%) → campo magnetico del pianeta', quando: (M) => GZ.valePer(grandezza('spazio.magnetopausa').vale, M) && valore('spazio.magnetopausa', M) > 0 && isFinite(valore('spazio.magnetopausa', M)), mondi: 8,
    osserva: (M) => ({ grandezza: 'spazio.magnetopausa', osservato: banda(valore('spazio.magnetopausa', M), 0.05) }), ingressi: ['interno.campo'] },
];
{ let casi = 0, contenuti = 0, prove = 0, dentro = 0;
  // (le fonti care: meno mondi, meno punti, bordi meno fini; prima i casi che costano meno; se il tempo è finito il caso si dice non provato)
  for (const c of CASI) { const primo = CAMPIONE.find(c.quando); c._primo = primo; c._costo = primo ? costoDi(c.opz?.chiuso || grandezza(c.osserva(primo).grandezza).fonte, scelti(3, c.quando)) * (c.opz?.liberi ? 2 : 1) : 0; }
  for (const c of CASI) {
    const primo = c._primo, cc = c._costo;
    const opz = { ...(c.opz || {}), ...(cc < 0.2 ? {} : cc < 5 ? { punti: Math.min(c.opz?.punti ?? 120, LUNGO ? 80 : 32), fino: 16 } : LUNGO ? { punti: 32, fino: 12 } : { punti: 12, fino: 5 }) }, quantiMondi = cc < 0.2 || LUNGO ? c.mondi : cc < 5 ? Math.min(c.mondi, 4) : 2;
    const stima = (cc * ((opz.punti ?? 120) + 2 * (opz.fino ?? 24)) * c.ingressi.length * Math.min(quantiMondi, 2)) / 1000;
    if (primo && (!entro(PARTI.dalBasso) || (performance.now() - T0) / 1000 + stima > TEMPO * PARTI.dalBasso + 1)) { console.log(`  ○ ${c.nome}: non provato, il tempo è finito`); R.dalBasso.push({ nome: c.nome, mondi: 0, righe: [], perTempo: true }); continue; }
    const mondi = scelti(quantiMondi, c.quando); if (!mondi.length) { console.log(`  ○ ${c.nome}: nessun mondo del campione ha questa osservazione`); R.dalBasso.push({ nome: c.nome, mondi: 0, righe: [] }); continue; }
    casi++; const righe = [];
    for (const x of c.ingressi) { let n = 0, si = 0, larghezza = 0, es = null, vuoti = 0;
      for (const M of mondi) { let oss, r; try { oss = c.osserva(M); r = GZ.impone(oss.grandezza, oss.osservato, x, M, opz); } catch (e) { console.log(`    (errore su ${indirizzo(M)}: ${e.message.slice(0, 80)})`); continue; }
        const vero = valore(x, M); n++; prove++; if (!r.intervallo) { vuoti++; continue; }
        const haDentro = r.contiene(vero); if (haDentro) { si++; dentro++; }
        const g = grandezza(x), rel = g.passo !== 'ass' && r.tutto[0] > 0; larghezza += r.pezzi.reduce((s, [a, b]) => s + (rel ? Math.log(b / a) / Math.log(r.tutto[1] / r.tutto[0]) : (b - a) / (r.tutto[1] - r.tutto[0])), 0);
        if (!es || !haDentro) es = { dove: indirizzo(M), osservato: oss.osservato, intervallo: r.intervallo, pezzi: r.pezzi.length, vero, dentro: haDentro }; }
      const riga = { ingresso: x, n, dentro: si, vuoti, larghezza: n - vuoti ? larghezza / (n - vuoti) : 0, esempio: es }; righe.push(riga);
      const testoEs = es ? ` (es. ${es.dove}: osservato ${Array.isArray(es.osservato) ? `${cifre(es.osservato[0], 4)}…${cifre(es.osservato[1], 4)}` : es.osservato} ⇒ ${x} tra ${cifre(es.intervallo?.[0], 4)} e ${cifre(es.intervallo?.[1], 4)}${es.pezzi > 1 ? ` in ${es.pezzi} pezzi` : ''}; vero ${cifre(es.vero, 4)})` : '';
      if (si === n && n > 0) { contenuti++; console.log(`  ✓ ${c.nome} ⇒ ${x}: l'intervallo dedotto contiene il vero in ${si} mondi su ${n}, ed è largo in media ${cifre(100 * riga.larghezza, 2)}% dell'intervallo possibile${testoEs}`); }
      else nonTorna(`DAL BASSO ${c.nome} ⇒ ${x}: l'intervallo dedotto contiene il vero in ${si} mondi su ${n}${vuoti ? ` (${vuoti} vuoti)` : ''}${testoEs}`);
    }
    R.dalBasso.push({ nome: c.nome, mondi: mondi.length, righe });
  }
  console.log(`  ${casi} casi, ${prove} deduzioni: in ${dentro} l'intervallo dedotto contiene il valore vero del pianeta da cui si è partiti`);
  R.grafo.dalBasso = { casi, prove, dentro };
}

// =====================================================================================================
sezione('E. NUMERI E FORMULE SCRITTI A MANO DOVE ESISTE UNA FONTE');
// =====================================================================================================
{ const ESCLUSI = new Set(['grandezze.js', 'stelle_tabella.js']), file = readdirSync(CARTELLA).filter((f) => f.endsWith('.js') && !ESCLUSI.has(f)).sort();
  const conta = (lista, chiave) => { let righeTot = 0;
    for (const q of lista) { const dove = []; let n = 0;
      for (const f of file) { if (q.casa.includes(f)) continue; const righe = testo(f).split('\n'); let nf = 0, prima = 0;
        righe.forEach((r, i) => { const c = senzaCommenti(r); if (/^\s*(import|export const [A-Z_]+ = Object\.freeze)/.test(c) && chiave === 'numeri') return; const m = c.match(new RegExp(q.motivo.source, 'g')); if (m) { nf += m.length; prima ||= i + 1; } });
        if (nf) { n += nf; dove.push({ file: f, quante: nf, riga: prima }); } }
      dove.sort((a, b) => b.quante - a.quante); righeTot += n;
      R[chiave].push({ nome: q.nome || q.grandezza, che: q.che, fonte: q.fonte || `grafo: ${q.grandezza} (${doveFonte(grandezza(q.grandezza).fonte)})`, quante: n, file: dove.length, dove });
      if (n) nonTorna(`${chiave === 'numeri' ? 'NUMERO A MANO' : 'FORMULA RISCRITTA'} ${q.nome || q.grandezza} (${q.che}): ${n} volte in ${dove.length} moduli fuori da casa sua (${dove.slice(0, 4).map((d) => `${d.file}:${d.riga}${d.quante > 1 ? ` ×${d.quante}` : ''}`).join(', ')}${dove.length > 4 ? ', …' : ''}); la fonte: ${q.fonte || q.grandezza}`);
    } return righeTot; };
  const nNum = conta(NUMERI_CON_FONTE, 'numeri'), nFor = conta(FORMULE_CON_FONTE, 'formule');
  console.log(`  in ${file.length} moduli: ${nNum} numeri scritti a mano che hanno già un nome (${R.numeri.filter((r) => r.quante).length} numeri diversi), ${nFor} formule riscritte in linea per grandezze che hanno una fonte`);
  R.grafo.numeriAMano = nNum; R.grafo.formuleRiscritte = nFor; R.grafo.moduli = file.length;
}

// =====================================================================================================
// IL CONTO
// =====================================================================================================
const doppioni = [...R.fonte.filter((r) => r.diversi), ...R.copie.filter((r) => r.diversi), ...R.controlli.filter((r) => r.diversi), ...R.fonte.filter((r) => r.altraFormula)];
const diComodo = R.soglie.filter((s) => s.specie === 'comodo'), nonDichiarateSoglie = R.soglie.filter((s) => s.specie === 'non dichiarata');
R.conto = { doppioni: doppioni.length, soglieDiComodo: diComodo.length, soglieFisiche: R.soglie.filter((s) => s.specie === 'fisica').length, cicliCheSaltano: R.soglie.filter((s) => s.specie === 'ciclo').length, soglieNonDichiarate: nonDichiarateSoglie.length, saliteRipide: R.soglie.filter((s) => s.specie === 'ripida').length,
  filiStaccati: R.staccati.length, dipendenzeNonDichiarate: R.nonDichiarate.length, secondi: Number(secondi()) };
console.log(`\ngrandezze: ${ok} prove, il grafo sta in piedi (${GRANDEZZE.length} grandezze, ${DETTI.length} archi detti, ${R.grafo.possibiliVeri} misurati in più); ${storte} voci «≠ NON TORNA»: ${R.conto.doppioni} doppioni, ${R.conto.soglieDiComodo} soglie di comodo (+${R.conto.soglieNonDichiarate} salti non dichiarati; ${R.conto.soglieFisiche} soglie fisiche), ${R.conto.filiStaccati} fili staccati, ${R.conto.dipendenzeNonDichiarate} dipendenze non dichiarate, ${R.grafo.numeriAMano} numeri e ${R.grafo.formuleRiscritte} formule scritti a mano; dal basso ${R.grafo.dalBasso.dentro}/${R.grafo.dalBasso.prove} (${secondi()} s)`);

if (process.argv.includes('--json')) writeFileSync(process.argv[process.argv.indexOf('--json') + 1], JSON.stringify(R, (k, v) => (typeof v === 'number' && !Number.isFinite(v) ? String(v) : v), 1));
if (process.argv.includes('--rapporto')) { const { scriviRapporto } = await import('../strumenti/rapporto_grandezze.mjs'); const dove = scriviRapporto(R, { GZ, LIV, ARCHI, doveFonte, rigaDi, cifre, pc }); console.log(`rapporto scritto: ${dove}`); }
