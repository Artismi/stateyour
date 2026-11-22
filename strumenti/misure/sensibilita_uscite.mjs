// sensibilita_uscite.mjs — LE USCITE MISURABILI su cui sensibilita.mjs misura i numeri a mano: la luce della galassia 0 del cosmo 1 e delle prime 20
// (forma.luce, in L☉); sul pianeta d'avvio (il numero 5689: cosmo 1, galassia 0, stella 29, pianeta 10; la fase e le uscite si chiamano ancora «217») la pressione, la temperatura (P.clima.T e
// la media della superficie), la frazione di terre (come indirizzi.mjs), la salinità e il pH del mare; sulla Terra di prova di
// test_mare.mjs (seme 13) le stesse, più la parte coperta dal mare. Ogni numero esce in JSON su una riga.
// uso: node strumenti/nodo.cjs strumenti/misure/sensibilita_uscite.mjs <cartella src> [gal|217|terra|tutte]
const R = process.argv[2], solo = process.argv[3] || 'tutte';
const out = {}; const t0 = Date.now();
const prova = (n, f) => { try { f(); } catch (e) { out[n + '_errore'] = String(e.message).slice(0, 80); } };
const frazioneTerre = (se) => { let terra = 0, tot = 0; for (let j = 0; j < se.H; j++) { const w = Math.sin(((j + 0.5) / se.H) * Math.PI); for (let i = 0; i < se.W; i++) { tot += w; if (!(se.alt[j * se.W + i] < se.mare)) terra += w; } } return terra / tot; };
const CO = await import(R + '/camera/cosmo.js'), GE = await import(R + '/camera/geologia.js'), MA = await import(R + '/camera/mare.js'), EV = await import(R + '/camera/eventi.js');
if (solo === 'tutte' || solo === 'gal' || solo === 'pian') prova('galassia', () => { const C = CO.cosmo(1); out.Lgal0 = C.galassie[0].forma.luce; let s = 0; for (const g of C.galassie.slice(0, 20)) s += g.forma.luce; out.Lgal20 = s; out.nGal = C.galassie.length; });
if (solo === 'pian') prova('p217', () => { const P = CO.sistema(1, 0, 1).pianeti[2]; out.p217_bar = P.clima.pressione / 1e5; out.p217_T = P.clima.T; out.p217_massa = P.massaKg / 5.972e24; }); // (il modo «pian»: solo il cosmo e il sistema, senza superficie: pochi secondi)
if (solo === 'tutte' || solo === '217') {
  prova('p217', () => {
    const P = CO.sistema(1, 0, 29).pianeti[10], k = JSON.stringify({ cosmo: 1, galassia: 0, stella: 29, pianeta: 10 });
    out.p217_bar = P.clima.pressione / 1e5; out.p217_T = P.clima.T; out.p217_massa = P.massaKg / 5.972e24;
    const sf = GE.superficiePianeta(k, P, P.interno, P.origine), cl = GE.climaSuperficie(k, P, sf), se = GE.erosione(k, sf, cl);
    out.p217_terre = frazioneTerre(se); out.p217_Tsup = cl.Tglobale;
    const M = MA.mare(P, sf, cl, se, EV.sorgente('misure/217/mare')); out.p217_sal = M.salinitaMedia; out.p217_pH = M.pH;
  });
}
if (solo === 'tutte' || solo === 'terra') prova('terra', () => {
  const P = { tipo: 'roccioso', raggioM: 6.371e6, massaKg: 5.97e24, composizione: { ferro: 0.32, acqua: 0.02 }, Lw: 3.828e26, aM: 1.496e11, anno: 3.156e7, giorno: 86164, obliquita: 23.4, bloccato: false, clima: { Teq: 255, pressione: 1e5, T: 288, acqua: 'liquida' },
    atmosfera: { gas: { N2: 0.78, O2: 0.21, CO2: 2.8e-4 }, pressione: 1e5 }, Mstella: 1.989e30, lune: [{ id: 0, massaKg: 7.35e22, aM: 3.844e8, raggioM: 1.737e6 }] };
  const it = GE.interno(P, { eta: 4.5e9, Z: 1 }); it.acquaKg = 1.4e21; P.interno = it;
  const sf = GE.superficiePianeta('mare-terra', P, it, 13), cl = GE.climaSuperficie('mare-terra', P, sf), se = GE.erosione('mare-terra', sf, cl);
  out.terra_terre = frazioneTerre(se); out.terra_Tsup = cl.Tglobale;
  const T = MA.mare(P, sf, cl, se, EV.sorgente('prova/terra/mare')); out.terra_sal = T.salinitaMedia; out.terra_pH = T.pH; out.terra_mare = T.frazioneMare;
});
out.ms = Date.now() - t0;
if (solo !== 'mare') console.log(JSON.stringify(out));
// IL MODO «mare» (node … <src> mare <lista.json>): per i numeri di mare.js, che servono solo a mare(), la superficie, il
// clima e l'erosione si fanno una volta; poi per ogni numero della lista si scrive una copia di mare.js accanto all'originale
// (così le sue dipendenze sono le stesse, già caricate), con quel numero cambiato, e si rifà solo mare(). Una riga JSON per voce.
if (solo === 'mare') {
  const { readFileSync, writeFileSync, rmSync } = await import('node:fs');
  const lista = JSON.parse(readFileSync(process.argv[4], 'utf8')), fonte = readFileSync(R + '/camera/mare.js', 'utf8');
  const P1 = CO.sistema(1, 0, 29).pianeti[10], k1 = JSON.stringify({ cosmo: 1, galassia: 0, stella: 29, pianeta: 10 });
  const sf1 = GE.superficiePianeta(k1, P1, P1.interno, P1.origine), cl1 = GE.climaSuperficie(k1, P1, sf1), se1 = GE.erosione(k1, sf1, cl1);
  const P2 = { tipo: 'roccioso', raggioM: 6.371e6, massaKg: 5.97e24, composizione: { ferro: 0.32, acqua: 0.02 }, Lw: 3.828e26, aM: 1.496e11, anno: 3.156e7, giorno: 86164, obliquita: 23.4, bloccato: false, clima: { Teq: 255, pressione: 1e5, T: 288, acqua: 'liquida' },
    atmosfera: { gas: { N2: 0.78, O2: 0.21, CO2: 2.8e-4 }, pressione: 1e5 }, Mstella: 1.989e30, lune: [{ id: 0, massaKg: 7.35e22, aM: 3.844e8, raggioM: 1.737e6 }] };
  const it = GE.interno(P2, { eta: 4.5e9, Z: 1 }); it.acquaKg = 1.4e21; P2.interno = it;
  const sf2 = GE.superficiePianeta('mare-terra', P2, it, 13), cl2 = GE.climaSuperficie('mare-terra', P2, sf2), se2 = GE.erosione('mare-terra', sf2, cl2);
  const misura = (M) => { const o = {}; try { const a = M.mare(P1, sf1, cl1, se1, EV.sorgente('misure/217/mare')); o.p217_sal = a.salinitaMedia; o.p217_pH = a.pH; } catch (e) { o.p217_errore = String(e.message).slice(0, 80); }
    try { const b = M.mare(P2, sf2, cl2, se2, EV.sorgente('prova/terra/mare')); o.terra_sal = b.salinitaMedia; o.terra_pH = b.pH; o.terra_mare = b.frazioneMare; } catch (e) { o.terra_errore = String(e.message).slice(0, 80); } return o; };
  console.log(JSON.stringify({ base: misura(MA), base2: misura(MA) })); // (due volte: mare() non deve cambiare ciò che riceve)
  let n = 0;
  for (const v of lista) {
    const t = v.testo.replace(/^-/, ''), p = `${R}/camera/mare_sensibilita_${process.pid}_${n++}.js`;
    if (fonte.slice(v.off, v.off + t.length) !== t) { console.log(JSON.stringify({ ...v, o: { errore: 'il testo non torna' } })); continue; }
    writeFileSync(p, fonte.slice(0, v.off) + String(+(Math.abs(v.valore) * v.k).toPrecision(12)) + fonte.slice(v.off + t.length));
    let o; try { o = misura(await import(p)); } catch (e) { o = { errore: String(e.message).slice(0, 80) }; } rmSync(p);
    const riga = JSON.stringify({ file: v.file, riga: v.riga, colonna: v.colonna, k: v.k, o }); console.log(riga); writeFileSync(process.argv[4] + '.esiti', riga + '\n', { flag: 'a' });
  }
}
