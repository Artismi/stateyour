// rotella.js — LA ROTELLA, uguale in tutte le viste (lo spazio in 3D, la scala quantistica, la roccia e le sue finestre, gli
// atomi). Il giudizio dell'utente: «se vai indietro con lo zoom poi è difficile tornare avanti, e viceversa; la navigazione è
// labirintica». La regola, semplice come in Google Earth o in «Powers of Ten»:
//  · uno scatto cambia SOLO la scala, di un passo fisso: un decimo di decade (il fattore 10^(1/10) ≈ 1,26), uguale nei due
//    versi. Nessun oggetto scelto dall'app, nessun passo che dipende da ciò che c'è vicino;
//  · lo zoom è verso il punto sotto il cursore, fissato al primo scatto del gesto (come Cesium), e lì resta fino alla fine
//    del gesto (una pausa di PAUSA ms): quindi N scatti avanti e N indietro col cursore fermo riportano esattamente dove si era;
//  · l'inerzia è dolce e uguale nei due versi: ogni scatto aggiunge il suo logaritmo a una velocità, che i fotogrammi
//    consumano con il tempo caratteristico TAU (s), senza perderne niente (la somma dei passi è la somma degli scatti).
// Uso: const r = creaRotella({ inizio: (x, y) => ancora, passo: (L, ancora) => …, fine?: () => … });
//      tela.addEventListener('wheel', (e) => { e.preventDefault(); r.scatto(lnScatto(e), x, y); }, { passive: false });
// (L > 0 allontana, L < 0 avvicina: è il logaritmo naturale del fattore di cui cresce la larghezza dello schermo.)
export const PASSO = Math.LN10 / 10; // ln del fattore di uno scatto: un decimo di decade
export const TAU = 0.08, PAUSA = 250, LIMITE = 0.35; // (s; ms; il più che un fotogramma consuma, in ln)

// il logaritmo di uno scatto della rotella vera (deltaY: 100 pixel per scatto nei navigatori, 3 righe, o una pagina); in
// avanti (deltaY < 0) avvicina. Lo stesso |deltaY| nei due versi dà lo stesso passo, quindi andata e ritorno si annullano
export function lnScatto(e) {
  const n = e.deltaMode === 1 ? e.deltaY / 3 : e.deltaMode === 2 ? e.deltaY * 3 : e.deltaY / 100;
  return Number.isFinite(n) ? n * PASSO : 0;
}

// quanto della velocità tocca a un fotogramma lungo dt secondi (tutta, se resta poco: niente code infinite)
export function consuma(vel, dt) {
  let L = vel * (dt > 0 ? 1 - Math.exp(-dt / TAU) : 1); L = Math.max(-LIMITE, Math.min(LIMITE, L));
  return Math.abs(vel - L) < 1e-4 ? vel : L;
}

// un gesto con la sua inerzia, per le viste che non hanno un ciclo di fotogrammi proprio (un requestAnimationFrame suo)
export function creaRotella({ inizio, passo, fine = null }) {
  let g = null, giro = 0, prima = 0;
  const avanti = (ms) => {
    giro = 0; if (!g) return; const dt = prima ? Math.min(0.1, (ms - prima) / 1000) : 1 / 60; prima = ms;
    if (g.vel !== 0) { const L = consuma(g.vel, dt); g.vel -= L; if (Math.abs(g.vel) < 1e-12) g.vel = 0; passo(L, g.ancora); }
    if (g.vel === 0 && performance.now() - g.ultimo > PAUSA) { g = null; prima = 0; if (fine) fine(); return; }
    giro = requestAnimationFrame(avanti);
  };
  return {
    scatto(L, x, y) { if (!L) return; const ora = performance.now(); if (!g) g = { ancora: inizio(x, y), vel: 0 }; g.ultimo = ora; g.vel += L; if (!giro) { prima = 0; giro = requestAnimationFrame(avanti); } },
    // la velocità che resta (per passarla alla vista che prende il posto di questa, a metà gesto)
    get resto() { return g ? g.vel : 0; },
    ferma() { const v = g ? g.vel : 0; g = null; if (giro) cancelAnimationFrame(giro); giro = 0; prima = 0; return v; },
    get attivo() { return !!g; },
  };
}
