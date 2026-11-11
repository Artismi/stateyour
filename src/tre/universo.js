// universo.js — DAL COSMO AL SUOLO in uno spazio solo: la galassia, il cosmo, e chi tiene insieme i livelli.
//
// I dati vengono da spazio3d.js (scenaCosmo, scenaGalassia: posizioni in metri nel tempo, luminosità e colori veri, i
// campi continui); qui li si disegna col nucleo. Ogni livello è un RIFERIMENTO nell'albero dei corpi del nucleo:
//   il cosmo (la radice: un toro che si richiude) → una galassia (dove sta e come è girata) → un sistema → la stella,
//   i pianeti → le lune. La camera è una sola: entrando nell'influenza di una cosa si attacca a lei senza muoversi
//   (nucleo.js: `influenza`, `riattacca`), e ciò che serve a quel livello si prepara quando ci si avvicina.
// · IL COSMO: le galassie del campione sono punti con la loro luce e la loro tinta (luci.js); la rete di filamenti è
//   la densità della materia (campi.densita, una griglia 64³ che si richiude) resa come una nebbia leggera di batuffoli,
//   più fitti dove c'è più materia; col tempo tutto si allontana (il fattore di scala) e la rete cresce.
// · LA GALASSIA: le stelle del campione sono punti con luminosità e colore veri (ognuna ne rappresenta milioni: la
//   luce di tutte le altre è la luce diffusa); la luce diffusa viene dalla forma continua (gli anelli del disco col loro
//   spessore, i bracci dove la densità di stelle è più alta, la barra, lo sferoide), resa come batuffoli luminosi che
//   girano con i bracci; dove c'è più polvere la luce è più debole e più rossa.
// Che cosa NON è vero: i batuffoli sono un campione della forma (decine di migliaia: da dentro la galassia si vedono
// come nubi larghe, non come la Via Lattea in cielo); la polvere non fa ombra lungo la linea di vista.
import { V } from './nucleo.js';
import { creaPunti } from './luci.js';
import { creaSistema } from './sistema.js';
import { scenaCosmo, scenaGalassia } from '../camera/spazio3d.js';
import { sorgente } from '../camera/eventi.js';

const ANNO = 3.156e7, LUCE = 1e20; // (le luminosità passano alla scheda in unità di 10²⁰ W: una galassia vale 10¹⁷)
const lineare = (c) => (c / 255) ** 2.2;
const tiri = (nome) => { let s = sorgente('mondo3d').seme(nome); return () => (s = (s * 16807) % 2147483647) / 2147483647; };

// ---------- una galassia
export function creaGalassia(N, punti, { via, genitore = null, posizione = null, opzioni = {} } = {}) {
  // (le stelle del campione sono una su cento milioni: da lontano ogni punto porta una parte della luce di quelle che
  // rappresenta — il suo `peso`: è il principio della nebbia —; avvicinandosi torna a essere una stella sola. Solo una
  // parte (`puntiLuce`, un ventesimo): la luce di una galassia non sta in duemila punti, e messa tutta lì li farebbe
  // accecanti; il resto è la luce diffusa.)
  const O = { batuffoli: 60000, diffusa: 0.95, puntiLuce: 0.05, frammenti: 5e6, ...opzioni }; let sc = scenaGalassia(via.cosmo, via.galassia, N.tempo.t), tScena = N.tempo.t;
  const Rg = sc.riferimento.raggio, n = sc.punti.n, assi = sc.nelGenitore.assi, q0 = [assi[0][0], assi[1][0], assi[2][0], assi[0][1], assi[1][1], assi[2][1], assi[0][2], assi[1][2], assi[2][2]]; // (per righe: le colonne sono i tre assi)
  const nodo = N.corpo({ nome: `galassia ${via.galassia}`, genitore, posizione, assi: q0, raggio: 0, influenza: 3 * Rg });
  const stelle = punti.insieme(n), pos = new Float32Array(3 * n), luce = new Float32Array(4 * n);
  function luciStelle() { const P = sc.punti; for (let i = 0; i < n; i++) { const L = P.esiste[i] ? P.luminosita[i] / LUCE : 0; luce[4 * i] = L * lineare(P.colore[3 * i]); luce[4 * i + 1] = L * lineare(P.colore[3 * i + 1]); luce[4 * i + 2] = L * lineare(P.colore[3 * i + 2]); luce[4 * i + 3] = L > 0 ? 1 : 0; } }
  luciStelle();
  // la luce diffusa: batuffoli presi dagli anelli del disco (più dove c'è più massa di stelle) e dallo sferoide; ognuno
  // porta la sua parte della luce di tutta la galassia; i bracci (e la polvere) si leggono dalla densità in quel punto
  const nube = (() => {
    const r = tiri(`galassia ${via.cosmo}/${via.galassia}`), C = sc.campi, A = C.anelli, nA = A.r.length, pesi = [], K = O.batuffoli, d = new Float32Array(8 * K); let tot = 0;
    // (l'anello i va da bordo[i] a bordo[i + 1])
    for (let i = 0; i < nA; i++) { const r0 = A.bordo[i], r1 = A.bordo[i + 1], m = A.stelle[i] * Math.PI * Math.max(0, r1 * r1 - r0 * r0); pesi.push(m); tot += m; }
    const sfer = C.sferoide.massaKg || 0, parteSfer = sfer / (sfer + tot || 1), Ltot = sc.daLontano.luminosita / LUCE, tinta = sc.daLontano.colore || [255, 240, 220];
    let somma = 0; const w = new Float32Array(K);
    for (let k = 0; k < K; k++) {
      let x, y, z, taglia, col;
      if (r() < parteSfer) { // lo sferoide (profilo di Hernquist): stelle vecchie, giallastre
        const u = Math.sqrt(r() * 0.92), rr = (C.sferoide.scala * u) / (1 - u), ct = 2 * r() - 1, st = Math.sqrt(1 - ct * ct), fi = 2 * Math.PI * r(); x = rr * st * Math.cos(fi); y = rr * st * Math.sin(fi); z = rr * ct * (C.sferoide.schiacciata || 1);
        taglia = Math.max(0.012 * Rg, 0.5 * rr); col = [1, 0.82, 0.6]; w[k] = 1;
      } else { // il disco: un anello a caso (in proporzione alla massa), un angolo, un'altezza con la legge sech²
        let m = r() * tot, i = 0; while (i < nA - 1 && m > pesi[i]) { m -= pesi[i]; i++; }
        const r0 = A.bordo[i], r1 = A.bordo[i + 1], rr = Math.sqrt(r0 * r0 + r() * (r1 * r1 - r0 * r0)), fi = 2 * Math.PI * r(), z0 = A.spessore[i] || 0.01 * Rg; x = rr * Math.cos(fi); y = rr * Math.sin(fi); z = z0 * Math.atanh(Math.max(-0.995, Math.min(0.995, 2 * r() - 1)));
        // quanto vale la densità vera lì rispetto alla media dell'anello: i bracci, la barra
        const qui = C.densita(x, y, z), media = (A.stelle[i] / (2 * z0)) / Math.cosh(z / z0) ** 2, rapporto = media > 0 ? Math.max(0.15, Math.min(6, qui.stelle / media)) : 1, polvere = qui.polvere / (qui.stelle + 1e-30);
        const giovane = Math.max(0, Math.min(1, (rapporto - 1) * 0.8)), buio = 1 / (1 + 60 * polvere); // nei bracci stelle giovani e azzurre; dove c'è polvere, meno luce e più rossa
        w[k] = rapporto * (0.45 + 0.55 * buio); taglia = Math.max(0.018 * Rg, 3 * z0, 0.5 * (r1 - r0)); col = [1 - 0.25 * giovane + 0.1 * (1 - buio), 0.88 - 0.05 * giovane, 0.72 + 0.4 * giovane - 0.2 * (1 - buio)];
      }
      d.set([x, y, z, taglia, col[0] * tinta[0] / 255, col[1] * tinta[1] / 255, col[2] * tinta[2] / 255, 1], 8 * k); somma += w[k];
    }
    for (let k = 0; k < K; k++) { const f = (Ltot * w[k]) / somma; d[8 * k + 4] *= f; d[8 * k + 5] *= f; d[8 * k + 6] *= f; }
    const o = punti.nube(d, K); o.dati = d; o.K = K; return o;
  })();
  const omega = sc.campi.bracci.velocitaAngolare || 0, rel = [0, 0, 0], eG = [0, 0, 0], eGr = [0, 0, 0]; let spenta = -1;
  const strato = {
    nome: `galassia ${via.galassia}`, nodo,
    aggiorna(S) {
      // le stelle si muovono: la scena si rifà quando il tempo è cambiato di mille anni (prima non si sposta niente che si veda)
      if (Math.abs(S.t - tScena) > 1e3 * ANNO) { sc = scenaGalassia(via.cosmo, via.galassia, S.t); tScena = S.t; luciStelle(); }
      S.versoCorpo(nodo, rel); const q = N.quadro(nodo, S.t), P = sc.punti.pos; V.tv(q, [-rel[0], -rel[1], -rel[2]], eG); // l'occhio nel riferimento della galassia
      { const a = -omega * (S.t - tScena0), c = Math.cos(a), s2 = Math.sin(a); eGr[0] = c * eG[0] - s2 * eG[1]; eGr[1] = s2 * eG[0] + c * eG[1]; eGr[2] = eG[2]; } // (e in quello dei batuffoli, che girano coi bracci)
      let fMax = 0, vicina = -1, dv = Infinity;
      for (let i = 0; i < n; i++) { const x = P[3 * i] - eG[0], y = P[3 * i + 1] - eG[1], z = P[3 * i + 2] - eG[2], d2 = x * x + y * y + z * z;
        pos[3 * i] = q[0] * x + q[1] * y + q[2] * z; pos[3 * i + 1] = q[3] * x + q[4] * y + q[5] * z; pos[3 * i + 2] = q[6] * x + q[7] * y + q[8] * z;
        if (luce[4 * i + 3] > 0 || i === spenta) { const f = sc.punti.luminosita[i] / (4 * Math.PI * d2); if (f > fMax && i !== spenta) fMax = f; if (d2 < dv) { dv = d2; vicina = i; } S.bersaglio({ p: [pos[3 * i], pos[3 * i + 1], pos[3 * i + 2]], raggio: 6e12, stella: i, galassia: via.galassia }); } }
      strato.vicina = vicina; strato.distanzaVicina = Math.sqrt(dv); strato.distanza = V.lungo(rel);
      stelle.metti(pos, luce, n);
      // la luce che l'occhio chiede tra le stelle: che la più brillante in cielo valga qualche unità al suo centro
      // la luce che l'occhio chiede: quella diffusa della galassia (contata su un batuffolo ogni trenta). Da dentro riempie il
      // cielo e deve restare tenue; da fuori sta tutta in un disco piccolo, che deve valere quasi uno
      // (nello stesso giro si conta quanti pixel coprirebbero tutti i batuffoli: se sono troppi se ne disegnano meno, più forti)
      { let E = 0, carico = 0; const D = nube.dati, cap = punti.massimo;
        for (let k = 0; k < nube.K; k += 30) { const x = D[8 * k] - eGr[0], y = D[8 * k + 1] - eGr[1], z = D[8 * k + 2] - eGr[2], t2 = D[8 * k + 3] ** 2, d2 = x * x + y * y + z * z; E += Math.max(D[8 * k + 4], D[8 * k + 5], D[8 * k + 6]) / Math.max(d2, t2);
          const lato = (D[8 * k + 3] * S.fuoco) / Math.sqrt(d2 + 1); if (lato < cap) carico += Math.max(1.5, lato) ** 2; }
        carico *= 30 * 0.785; strato.quanti = Math.max(3000, Math.min(nube.K, Math.round((nube.K * O.frammenti) / Math.max(carico, 1))));
        E *= (30 * LUCE) / (4 * Math.PI); const angolo = Math.min(4 * Math.PI, Math.max(1e-5, Math.PI * (Rg / Math.max(strato.distanza, Rg * 0.3)) ** 2));
        if (strato.distanza < 60 * Rg) S.proponiLuce((Math.PI * E) / ((angolo > 6 ? 0.25 : 2.2) * angolo)); }
    },
    disegna(S, passata) {
      if (passata !== 'velato') return;
      const q = N.quadro(nodo, S.t), g = V.mm(q, V.giro([0, 0, 1], omega * (S.t - tScena0))); // i batuffoli girano con i bracci
      const peso = sc.punti.peso; nube.disegna(S, rel, g, LUCE * O.diffusa, 1, 0, { lato: punti.massimo, quanti: strato.quanti, forza: nube.K / (strato.quanti || nube.K) }); stelle.disegna(S, LUCE, 1, [O.puntiLuce * (typeof peso === 'number' ? peso : peso?.[0] || 1), 0.004 * Rg, 0.25 * Rg]);
    },
    // dove sta la stella i nel riferimento della galassia (per il sistema che le si attacca), e spegnerne il punto quando il suo sistema c'è
    posStella: (i, o = [0, 0, 0]) => { const P = sc.punti.pos; o[0] = P[3 * i]; o[1] = P[3 * i + 1]; o[2] = P[3 * i + 2]; return o; },
    spegni(i) { if (spenta >= 0) { const L = sc.punti.esiste[spenta] ? 1 : 0; luce[4 * spenta + 3] = L; } spenta = i; if (i >= 0) luce[4 * i + 3] = 0; },
    scena: () => sc, raggio: Rg,
    libera() { N.togli(strato); stelle.libera(); nube.libera(); const i = N.corpi.indexOf(nodo); if (i >= 0) N.corpi.splice(i, 1); },
  };
  const tScena0 = tScena; N.aggiungi(strato); return strato;
}

// ---------- il cosmo
export function creaCosmo(N, punti, { cosmo, opzioni = {} } = {}) {
  const O = { batuffoli: 70000, rete: 1, ...opzioni }; let sc = scenaCosmo(cosmo, N.tempo.t), tScena = N.tempo.t;
  const n = sc.punti.n, radice = N.corpo({ nome: `cosmo ${cosmo}`, raggio: 0 }), gal = punti.insieme(n), pos = new Float32Array(3 * n), luce = new Float32Array(4 * n);
  let lato = sc.riferimento.periodico[0]; const lato0 = lato, nascosta = new Set();
  function luci() { const P = sc.punti; for (let i = 0; i < n; i++) { const L = P.esiste[i] && !nascosta.has(i) ? P.luminosita[i] / LUCE : 0, c = P.colore; luce[4 * i] = L * lineare(c[3 * i]); luce[4 * i + 1] = L * lineare(c[3 * i + 1]); luce[4 * i + 2] = L * lineare(c[3 * i + 2]); luce[4 * i + 3] = L > 0 ? 1 : 0; } }
  luci();
  // la rete: batuffoli messi a caso nel toro, tenuti in proporzione a quanta materia c'è lì (1 + δ)², con la griglia di oggi
  const rete = (() => {
    const g = sc.campi.densita; if (!g || !g.delta) return null; const r = tiri(`rete ${cosmo}`), K = O.batuffoli, d = new Float32Array(8 * K), m = g.n; let k = 0, giri = 0;
    while (k < K && giri++ < K * 60) { const x = r(), y = r(), z = r(), q = g.delta[Math.min(m - 1, Math.floor(z * m)) * m * m + Math.min(m - 1, Math.floor(y * m)) * m + Math.min(m - 1, Math.floor(x * m))] * (g.crescita || 1), peso = Math.max(0, 1 + q) ** 2; if (r() * 14 > peso) continue;
      const forte = Math.min(1, peso / 14); d.set([x * lato, y * lato, z * lato, (lato / m) * (1.6 - 0.8 * forte), 0.09 + 0.1 * forte, 0.07 + 0.07 * forte, 0.15 + 0.1 * forte, 1], 8 * k); k++; }
    return punti.nube(d.subarray(0, 8 * k), k);
  })();
  const occhio = [0, 0, 0];
  const strato = {
    nome: 'cosmo', radice,
    aggiorna(S) {
      // il cosmo si espande e le galassie invecchiano: la scena si rifà quando il tempo è cambiato di dieci milioni di anni
      if (Math.abs(S.t - tScena) > 1e7 * ANNO) { sc = scenaCosmo(cosmo, S.t, { griglia: false }); tScena = S.t; lato = sc.riferimento.periodico[0]; luci(); }
      const v = S.versoCorpo(radice); occhio[0] = -v[0]; occhio[1] = -v[1]; occhio[2] = -v[2];
      // se si è attaccati al cosmo, lo spazio si richiude: uscendo da un lato si rientra dall'altro
      const cam = N.camera; if (cam.corpo === radice) for (let k = 0; k < 3; k++) { if (cam.pos[k] < 0) cam.pos[k] += lato; else if (cam.pos[k] >= lato) cam.pos[k] -= lato; }
      const P = sc.punti.pos; let fMax = 0, vicina = -1, dv = Infinity;
      for (let i = 0; i < n; i++) { let d2 = 0; for (let k = 0; k < 3; k++) { let x = P[3 * i + k] - occhio[k]; x -= Math.round(x / lato) * lato; pos[3 * i + k] = x; d2 += x * x; } // l'immagine più vicina
        if (!sc.punti.esiste[i]) continue; if (d2 < dv) { dv = d2; vicina = i; } if (luce[4 * i + 3] > 0) { const f = sc.punti.luminosita[i] / (4 * Math.PI * d2); if (f > fMax) fMax = f; }
        S.bersaglio({ p: [pos[3 * i], pos[3 * i + 1], pos[3 * i + 2]], raggio: sc.punti.raggio[i], galassia: i }); }
      strato.vicina = vicina; strato.distanzaVicina = Math.sqrt(dv); gal.metti(pos, luce, n);
      S.proponiLuce((fMax * Math.PI * S.fuoco * S.fuoco) / 20 / 10);
    },
    disegna(S, passata) {
      if (passata !== 'velato') return; const k = lato / lato0;
      if (rete && O.rete) rete.disegna(S, [-occhio[0], -occhio[1], -occhio[2]], [k, 0, 0, 0, k, 0, 0, 0, k], 0, 0.075 * O.rete * (strato.dentro ? 0.12 : 1) * Math.min(1, 3e-9 / S.E0), lato); // (da dentro una galassia la rete del cosmo quasi non si vede; con l'occhio chiuso per la luce di una galassia vicina o di una stella, per niente)
      gal.disegna(S, LUCE, 1.5);
    },
    // dove sta la galassia i (l'immagine più vicina all'occhio), nel riferimento del cosmo
    posGalassia: (i, o = [0, 0, 0]) => { const P = sc.punti.pos; for (let k = 0; k < 3; k++) { const x = P[3 * i + k] - occhio[k]; o[k] = P[3 * i + k] - Math.round(x / lato) * lato; } return o; },
    nascondi(i, si) { if (si) nascosta.add(i); else nascosta.delete(i); luci(); }, scena: () => sc, lato: () => lato,
    libera() { N.togli(strato); gal.libera(); if (rete) rete.libera(); },
  };
  N.aggiungi(strato); return strato;
}

// ---------- tutti i livelli insieme
// via = { cosmo, galassia, stella, pianeta } (quanto basta per il livello da cui si parte); livello: 'cosmo' | 'galassia'
// | 'sistema' | 'pianeta'. → { cosmo, galassia(), sistema(), dove() (in parole), libera() }
export function creaUniverso(N, { via, livello = 'pianeta', superficie = () => null, opzioni = {} } = {}) {
  N.opzioni.attaccoDaSe = true;
  const punti = creaPunti(N), cosmo = creaCosmo(N, punti, { cosmo: via.cosmo, opzioni: opzioni.cosmo });
  let G = null, Sis = null;
  function apriGalassia(i) { if (G && G.via.galassia === i) return G; chiudiSistema(); if (G) { cosmo.nascondi(G.via.galassia, false); G.libera(); } const v = { cosmo: via.cosmo, galassia: i };
    G = creaGalassia(N, punti, { via: v, genitore: cosmo.radice, posizione: (t, o) => cosmo.posGalassia(i, o), opzioni: opzioni.galassia }); G.via = v; cosmo.nascondi(i, true); return G; }
  function chiudiSistema() { if (!Sis) return; if (G) G.spegni(-1); const cam = N.camera; let c = cam.corpo, dentro = false; while (c) { if (c === Sis.nodo) dentro = true; c = c.genitore; } if (dentro) N.riattacca(G ? G.nodo : cosmo.radice); Sis.libera(); Sis = null; }
  function apriSistema(i) { if (Sis && Sis.via.stella === i) return Sis; chiudiSistema(); const v = { cosmo: via.cosmo, galassia: G.via.galassia, stella: i }, sc = G.scena();
    if (!sc.punti.esiste[i]) return null; const A = scenaAssi(v);
    const s = creaSistema(N, { via: v, superficie, genitore: G.nodo, posizione: (t, o) => G.posStella(i, o), assi: A, opzioni: opzioni.sistema }); if (!s) return null; Sis = s; Sis.via = v; G.spegni(i); return Sis; }
  // (gli assi del sistema nella galassia: da spazio3d.js, per righe con le colonne = i tre assi)
  let assiSistema = null; import('../camera/spazio3d.js').then((m) => { assiSistema = m.assiSistema; });
  const scenaAssi = (v) => { const a = assiSistema ? assiSistema(v.cosmo, v.galassia, v.stella) : [[1, 0, 0], [0, 1, 0], [0, 0, 1]]; return [a[0][0], a[1][0], a[2][0], a[0][1], a[1][1], a[2][1], a[0][2], a[1][2], a[2][2]]; };
  // chi governa: a ogni fotogramma si guarda che cosa c'è vicino e lo si prepara (o lo si lascia)
  const governo = { nome: 'livelli', aggiorna(S) {
    if (cosmo.vicina >= 0) { const r = cosmo.scena().punti.raggio[cosmo.vicina]; if (cosmo.distanzaVicina < 14 * r && (!G || G.via.galassia !== cosmo.vicina)) apriGalassia(cosmo.vicina); }
    cosmo.dentro = !!G && G.distanza < 2.5 * G.raggio;
    if (G && assiSistema) { if (G.vicina >= 0 && G.distanzaVicina < 4e15 && (!Sis || Sis.via.stella !== G.vicina)) apriSistema(G.vicina); else if (Sis && G.distanzaVicina > 1.2e16) chiudiSistema(); }
  } };
  N.strati.unshift(governo);
  // guardare un riferimento da una direzione (nei suoi assi: z è la normale al suo piano) e da una distanza
  function guardaDa(nodo, distanza, alto = 0.5, giro = 0.6) {
    const q = N.quadro(nodo, N.tempo.t) || V.identita(), loc = [Math.cos(alto) * Math.cos(giro), Math.cos(alto) * Math.sin(giro), Math.sin(alto)], dir = V.mv(q, loc), cam = N.camera;
    cam.corpo = nodo; cam.solidale = false; cam.pos = V.per(dir, distanza); cam.assi = N.assiDa(V.per(dir, -1), V.mv(q, [0, 0, 1])); cam.perno = null; N.cambia();
  }
  // la partenza
  function parti() {
    if (livello === 'cosmo' || via.galassia == null) { const sc = cosmo.scena(), i = via.galassia ?? 0, P = sc.punti.pos; N.camera.corpo = cosmo.radice; guardaDa(cosmo.radice, 1, 0.4, 0.5); N.camera.pos = [P[3 * i] + 0.12 * cosmo.lato(), P[3 * i + 1] + 0.05 * cosmo.lato(), P[3 * i + 2] + 0.09 * cosmo.lato()]; N.camera.assi = N.assiDa(V.norma([-0.12, -0.05, -0.09]), [0, 0, 1]); return; }
    apriGalassia(via.galassia); if (livello === 'galassia' || via.stella == null) return guardaDa(G.nodo, 2.6 * G.raggio, 0.55, 0.7);
    if (!assiSistema) return false; apriSistema(via.stella); if (!Sis) return guardaDa(G.nodo, 2.6 * G.raggio);
    if (livello === 'sistema' || via.pianeta == null) { const lontano = Math.max(...Sis.Sis.pianeti.map((p) => p.aM || 0), 1e11); return guardaDa(Sis.nodo, 2.4 * lontano, 0.5, 0.8); }
    const c = Sis.pianeta(via.pianeta); N.attacca(c, { distanza: 3.2 * c.raggio, lat: 0.25 });
  }
  let partito = false; const aspetta = { nome: 'partenza', aggiorna() { if (!partito && (assiSistema || livello === 'cosmo' || livello === 'galassia')) { partito = parti() !== false; } } };
  N.camera.corpo = cosmo.radice; N.strati.unshift(aspetta);
  return {
    cosmo, galassia: () => G, sistema: () => Sis, guardaDa, pronto: () => partito, apriGalassia, apriSistema,
    // a che cosa è attaccata la camera, come «via» della mappa: { cosmo, galassia, stella, pianeta } fin dove si è dentro
    viaOra() { const v = { cosmo: via.cosmo }; let c = N.camera.corpo, inG = false, inS = false; for (let x = c; x; x = x.genitore) { if (G && x === G.nodo) inG = true; if (Sis && x === Sis.nodo) inS = true; }
      if (inG) v.galassia = G.via.galassia; if (inS) { v.stella = Sis.via.stella; const s = Sis.scheda(c); if (s && s.c.cosa === 'pianeta') v.pianeta = s.c.id; else if (s && s.c.cosa === 'luna') v.pianeta = s.c.pianeta; } return v; },
    // dove si è, dal livello più grande al più piccolo (per la riga in basso)
    percorso() { const v = this.viaOra(), out = [`il cosmo ${v.cosmo}`]; if (v.galassia != null) out.push(`la galassia ${v.galassia + 1}`); if (v.stella != null) out.push(`il sistema della stella ${v.stella + 1}`); if (v.pianeta != null) out.push(`il pianeta ${v.pianeta + 1}`); return out; },
    libera() { chiudiSistema(); if (G) G.libera(); cosmo.libera(); punti.libera(); for (const s of [governo, aspetta]) { const i = N.strati.indexOf(s); if (i >= 0) N.strati.splice(i, 1); } },
  };
}
