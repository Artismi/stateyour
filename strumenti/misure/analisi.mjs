// analisi.mjs — gli indicatori di un fotogramma e il confronto tra due fotogrammi (funzioni pure, senza browser).
// Un fotogramma è { W, H, rgba: Uint8Array } in sRGB a 8 bit. Usato da giro.mjs; le soglie sono in SOGLIE, scritte una
// volta con la loro ragione e da non toccare dopo aver visto i risultati (se una soglia è sbagliata si dice, e si cambia
// con un nuovo nome di versione in SOGLIE.versione, così i numeri vecchi e nuovi non si mescolano).

export const SOGLIE = {
  versione: 1,
  // VUOTO. Un blocco di 8×8 pixel (a 480×300) è vuoto se è quasi nero (L* medio < 3: luminanza relativa < 0,33 %, sotto
  // la quale su uno schermo normale in una stanza illuminata non si distingue dal nero) o quasi uniforme (deviazione di L*
  // < 0,6 nel blocco: sotto la soglia di differenza appena percettibile, ΔE ≈ 1–2,3, quindi senza struttura visibile).
  bloccoNero: 3, bloccoUniforme: 0.6,
  // Un fotogramma è «vuoto» se il 95 % dei blocchi è vuoto: anche un campo di stelle rado o una galassia lontana coprono
  // più del 5 % dei blocchi (un punto di luce sporca almeno il suo blocco), quindi sopra il 95 % lo schermo non mostra niente.
  fotogrammaVuoto: 0.95,
  // SALTO e ANDATA/RITORNO. Si confrontano le due immagini sfocate di 3×3 pixel a 240×150 (lo schermo di serie è
  // a 800×500, cioè ~10 pixel dello schermo: il dettaglio nuovo che il figlio aggiunge sotto quella grana ha media nulla sulla cella del padre, la regola
  // del rapporto, quindi non conta). Un pixel è «cambiato» se ΔE76 > 15: sei volte la differenza appena percettibile
  // (2,3), cioè un altro colore, non una sfumatura. Il salto è oltre soglia se è cambiato più del 20 % della zona comune:
  // un quinto dello schermo che cambia colore in un quarto di decade è qualcosa che compare o sparisce, non un raffinamento.
  deltaE: 15, salto: 0.2, andataRitorno: 0.2,
  // MACCHIE SATURE. Un pixel è saturo se tutti e tre i canali sono ≥ 250. Una macchia è un'area connessa di pixel saturi
  // larga almeno lo 0,5 % dello schermo (a 800×500 un quadrato di ~45 pixel di lato): una stella o un riflesso sono pochi
  // pixel; sopra lo 0,5 % non è più un punto di luce ma una superficie bruciata.
  saturo: 250, macchia: 0.005,
  // BARRE. Una retta che attraversa lo schermo (lunga almeno metà del lato corto, a ogni angolo di 3 in 3 gradi) è una barra
  // se i suoi pixel sono quasi uguali (deviazione di L* < 1,5 lungo la retta) e se le due rette parallele ai due lati, alla
  // stessa distanza d (2, 4, 8 o 16 pixel a 480×300), sono entrambe diverse da lei (L* medio diverso di più di 10, o
  // deviazione > 6, cioè struttura): una fila dritta di pixel uguali che taglia una zona che non lo è. Un bordo dritto tra
  // due zone non conta (un lato è uguale a lei); il nero dello spazio non conta (i lati sono uguali a lei).
  barraDev: 1.5, barraDiversa: 10, barraStruttura: 6,
};

// ---------- colore
const LIN = new Float32Array(256); for (let i = 0; i < 256; i++) { const c = i / 255; LIN[i] = c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; }
const fLab = (t) => (t > 216 / 24389 ? Math.cbrt(t) : (841 / 108) * t + 4 / 29);
// L*, a*, b* (D65) di tutta l'immagine; Y: luminanza relativa
export function lab(F) {
  const n = F.W * F.H, L = new Float32Array(n), A = new Float32Array(n), B = new Float32Array(n), Y = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const r = LIN[F.rgba[4 * i]], g = LIN[F.rgba[4 * i + 1]], b = LIN[F.rgba[4 * i + 2]];
    const x = (0.4124 * r + 0.3576 * g + 0.1805 * b) / 0.95047, y = 0.2126 * r + 0.7152 * g + 0.0722 * b, z = (0.0193 * r + 0.1192 * g + 0.9505 * b) / 1.08883;
    const fx = fLab(x), fy = fLab(y), fz = fLab(z); L[i] = 116 * fy - 16; A[i] = 500 * (fx - fy); B[i] = 200 * (fy - fz); Y[i] = y;
  }
  return { W: F.W, H: F.H, L, A, B, Y };
}
// metà della risoluzione (media di 2×2)
export function dimezza(F) {
  const W = F.W >> 1, H = F.H >> 1, o = new Uint8Array(W * H * 4);
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) for (let c = 0; c < 4; c++) { const a = (2 * j * F.W + 2 * i) * 4 + c; o[(j * W + i) * 4 + c] = (F.rgba[a] + F.rgba[a + 4] + F.rgba[a + 4 * F.W] + F.rgba[a + 4 * F.W + 4] + 2) >> 2; }
  return { W, H, rgba: o };
}
function sfoca(X, W, H) { // scatola 3×3, ai bordi la media dei vicini che ci sono
  const o = new Float32Array(W * H);
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) { let s = 0, n = 0; for (let b = -1; b <= 1; b++) { const y = j + b; if (y < 0 || y >= H) continue; for (let a = -1; a <= 1; a++) { const x = i + a; if (x < 0 || x >= W) continue; s += X[y * W + x]; n++; } } o[j * W + i] = s / n; }
  return o;
}
export function labSfocato(F) { const c = lab(F); return { W: c.W, H: c.H, L: sfoca(c.L, c.W, c.H), A: sfoca(c.A, c.W, c.H), B: sfoca(c.B, c.W, c.H) }; }

// ---------- gli indicatori di un fotogramma (a 480×300)
export function indicatori(F) {
  const C = lab(F), { W, H, L, Y } = C, n = W * H;
  let sY = 0, sL = 0; for (let i = 0; i < n; i++) { sY += Y[i]; sL += L[i]; }
  // vuoto: blocchi 8×8
  let bv = 0, bt = 0;
  for (let by = 0; by + 8 <= H; by += 8) for (let bx = 0; bx + 8 <= W; bx += 8) { let s = 0, s2 = 0; for (let j = 0; j < 8; j++) for (let i = 0; i < 8; i++) { const v = L[(by + j) * W + bx + i]; s += v; s2 += v * v; } const m = s / 64, sd = Math.sqrt(Math.max(0, s2 / 64 - m * m)); bt++; if (m < SOGLIE.bloccoNero || sd < SOGLIE.bloccoUniforme) bv++; }
  // dettaglio: energia ad alta frequenza, valore efficace del laplaciano di L* (in unità di L*)
  let e = 0, ne = 0; for (let j = 1; j < H - 1; j++) for (let i = 1; i < W - 1; i++) { const k = j * W + i, l = 4 * L[k] - L[k - 1] - L[k + 1] - L[k - W] - L[k + W]; e += l * l; ne++; }
  // macchie sature: componenti connesse (4 vicini) di pixel con i tre canali ≥ 250
  const sat = new Uint8Array(n); let ns = 0; for (let i = 0; i < n; i++) if (F.rgba[4 * i] >= SOGLIE.saturo && F.rgba[4 * i + 1] >= SOGLIE.saturo && F.rgba[4 * i + 2] >= SOGLIE.saturo) { sat[i] = 1; ns++; }
  let maxMacchia = 0, macchie = 0; const pila = new Int32Array(n);
  for (let i0 = 0; i0 < n; i0++) { if (sat[i0] !== 1) continue; let top = 0, area = 0; pila[top++] = i0; sat[i0] = 2;
    while (top) { const k = pila[--top]; area++; const x = k % W, y = (k / W) | 0; if (x > 0 && sat[k - 1] === 1) { sat[k - 1] = 2; pila[top++] = k - 1; } if (x < W - 1 && sat[k + 1] === 1) { sat[k + 1] = 2; pila[top++] = k + 1; } if (y > 0 && sat[k - W] === 1) { sat[k - W] = 2; pila[top++] = k - W; } if (y < H - 1 && sat[k + W] === 1) { sat[k + W] = 2; pila[top++] = k + W; } }
    if (area > maxMacchia) maxMacchia = area; if (area >= SOGLIE.macchia * n) macchie++; }
  const barre = trovaBarre(L, W, H);
  return {
    luminanza: sY / n, Lmedio: sL / n, vuota: bv / bt, dettaglio: Math.sqrt(e / ne),
    saturi: ns / n, macchiaMax: maxMacchia / n, macchie, barre: barre.length, barreDove: barre.slice(0, 4),
    vuoto: bv / bt >= SOGLIE.fotogrammaVuoto,
  };
}

// le barre: rette a ogni angolo (di 3 in 3 gradi), a ogni distanza dal centro (di pixel in pixel)
function trovaBarre(L, W, H) {
  const cx = (W - 1) / 2, cy = (H - 1) / 2, D = Math.ceil(Math.hypot(W, H) / 2), minimo = 0.5 * Math.min(W, H), trovate = [];
  for (let ga = 0; ga < 180; ga += 3) {
    const t = (ga * Math.PI) / 180, ux = Math.cos(t), uy = Math.sin(t), nx = -uy, ny = ux, M = new Float32Array(2 * D + 1), S = new Float32Array(2 * D + 1), N = new Int32Array(2 * D + 1);
    for (let s = -D; s <= D; s++) { let a = 0, a2 = 0, c = 0; const ox = cx + s * nx, oy = cy + s * ny;
      for (let q = -D; q <= D; q++) { const x = Math.round(ox + q * ux), y = Math.round(oy + q * uy); if (x < 0 || y < 0 || x >= W || y >= H) continue; const v = L[y * W + x]; a += v; a2 += v * v; c++; }
      const k = s + D; N[k] = c; if (c) { M[k] = a / c; S[k] = Math.sqrt(Math.max(0, a2 / c - (a / c) ** 2)); } }
    const diversa = (k, j) => N[j] >= minimo && (Math.abs(M[j] - M[k]) > SOGLIE.barraDiversa || S[j] > SOGLIE.barraStruttura);
    for (let k = 0; k <= 2 * D; k++) { if (N[k] < minimo || S[k] >= SOGLIE.barraDev) continue;
      for (const d of [2, 4, 8, 16]) { if (k - d < 0 || k + d > 2 * D) continue; if (diversa(k, k - d) && diversa(k, k + d)) { const prima = trovate[trovate.length - 1];
        // (le rette vicine, per angolo e distanza, sono la stessa barra)
        if (prima && Math.abs(prima.angolo - ga) <= 6 && Math.abs(prima.s - (k - D)) <= 6) { prima.s = k - D; prima.angolo = ga; } else trovate.push({ angolo: ga, s: k - D, L: +M[k].toFixed(1) }); break; } } }
  }
  return trovate;
}

// ---------- il confronto: il fotogramma a scala più grossa (più metri per pixel), ingrandito di F attorno al punto c
// (pixel della tela, normalizzati 0..1), contro quello a scala più fine. Si prova F in un intervallo attorno al rapporto
// delle scale (×2^(±1), a passi di 2^(1/4)) e si tiene il migliore: il «fattore vero» misurato, accanto a quello dichiarato.
export function confronta(grosso, fine, rapporto, c = [0.5, 0.5], { cerca = true } = {}) {
  const { W, H } = fine, cx = c[0] * W, cy = c[1] * H, prove = cerca ? [-4, -3, -2, -1, 0, 1, 2, 3, 4].map((j) => rapporto * 2 ** (j / 4)) : [rapporto];
  let meglio = null;
  for (const F of prove) {
    let s = 0, cambiati = 0, n = 0;
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
      const x = cx + (i - cx) / F, y = cy + (j - cy) / F; if (x < 0 || y < 0 || x > W - 1 || y > H - 1) continue;
      const x0 = Math.floor(x), y0 = Math.floor(y), x1 = Math.min(W - 1, x0 + 1), y1 = Math.min(H - 1, y0 + 1), fx = x - x0, fy = y - y0;
      const bil = (X) => (X[y0 * W + x0] * (1 - fx) + X[y0 * W + x1] * fx) * (1 - fy) + (X[y1 * W + x0] * (1 - fx) + X[y1 * W + x1] * fx) * fy;
      const k = j * W + i, dL = bil(grosso.L) - fine.L[k], dA = bil(grosso.A) - fine.A[k], dB = bil(grosso.B) - fine.B[k], dE = Math.sqrt(dL * dL + dA * dA + dB * dB);
      s += dE; n++; if (dE > SOGLIE.deltaE) cambiati++;
    }
    if (!n) continue; const r = { deltaE: s / n, cambiata: cambiati / n, fattore: F, comune: n / (W * H) };
    if (!meglio || r.deltaE < meglio.deltaE) meglio = r;
  }
  return meglio ? { ...meglio, dichiarato: rapporto } : null;
}
