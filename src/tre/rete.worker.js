// rete.worker.js — gli elementi di materia della ragnatela cosmica, preparati fuori dal filo dell'interfaccia.
//
// Il campo è quello di ragnatela.js (le onde del toro, ognuna un evento; `raffina` aggiunge le più corte restando
// identico sulle lunghe). `classiSuGriglia` dà, su una griglia di tutto il toro o di una regione, il tensore di marea
// di ogni nodo: ogni nodo è un ELEMENTO DI MATERIA (tutti della stessa massa); nell'approssimazione di Zel'dovich il
// suo volume al tempo t è |Π(1 − D(t)·λ_i)| volte quello iniziale, con λ_i gli autovalori del tensore. Qui si mandano
// alla vista, per ogni elemento: dove sta (metri comoventi di oggi, dall'angolo del toro), quanto è larga la sua cella
// (m comoventi) e i tre autovalori: il volume a ogni tempo (e quindi lungo il cono di luce) lo fa la scheda grafica.
// Messaggi: { n, cosmo, regione: null | { centro: [m], lato: m }, celle, kmax } → { n, dati: Float32Array(8·celle³), celle, cellaM, toroM, ms }
import { classiSuGriglia, raffina, ondeDi, dentro } from '../camera/ragnatela.js';

self.onmessage = (e) => {
  const d = e.data, t0 = performance.now();
  try {
    const O = ondeDi(d.cosmo), campo = d.kmax > O.kmax ? raffina(d.cosmo, d.kmax) : O, reg = d.regione ? { centro: d.regione.centro, lato: d.regione.lato, celle: d.celle } : null;
    const G = classiSuGriglia(campo, reg, { celle: d.celle }), n = G.n, F = G.campo, dati = new Float32Array(8 * n * n * n), l = [0, 0, 0], L = O.toroM;
    for (let k = 0, q = 0; k < n; k++) for (let j = 0; j < n; j++) for (let i = 0; i < n; i++, q++) {
      dentro.autovalori(F.xx[q], F.yy[q], F.zz[q], F.xy[q], F.xz[q], F.yz[q], l);
      // (dentro la sua cella l'elemento sta in un punto a caso — sempre lo stesso: dipende dal suo posto —: tutti al centro,
      // visti lungo le file della griglia, farebbero righe che non ci sono)
      const h = (m) => { let v = Math.imul(q + 1, 0x9e3779b1) ^ Math.imul(m + 7 + d.celle, 0x85ebca6b); v = Math.imul(v ^ (v >>> 15), 0xc2b2ae35); return ((v ^ (v >>> 13)) >>> 0) / 4294967296 - 0.5; };
      const x = (G.origine[0] + (i + h(1)) * G.passo) * L, y = (G.origine[1] + (j + h(2)) * G.passo) * L, z = (G.origine[2] + (k + h(3)) * G.passo) * L;
      dati.set([x, y, z, G.latoCellaM, l[0], l[1], l[2], 1], 8 * q);
    }
    self.postMessage({ n: d.n, dati, celle: n, cellaM: G.latoCellaM, toroM: L, kmax: campo.kmax, ms: performance.now() - t0 }, [dati.buffer]);
  } catch (err) { self.postMessage({ n: d.n, errore: String((err && err.stack) || err) }); }
};
