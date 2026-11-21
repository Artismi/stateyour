// pennello.js — come si disegna una linea con spessore.
//
// La linea è una lista di punti [x, y, w]: w è lo spessore nel mondo, che il
// motore ha calcolato dalla particella (spessore · velocità / velocità
// iniziale, con le cessioni ai rami). Il pennello ne fa un corpo:
//   'pieno'     il contorno a destra e a sinistra, riempito: il tratto vero
//   'contorno'  i due bordi senza riempimento: il doppio filo delle tavole
//   'filo'      la linea sottile di prima, senza spessore
// I bordi si ottengono spostando ogni punto lungo la normale di ±w/2; le
// estremità sono arrotondate.

export function bordi(punti) {
  const n = punti.length, sx = [], dx = [];
  for (let i = 0; i < n; i++) {
    const a = punti[Math.max(0, i - 1)], b = punti[Math.min(n - 1, i + 1)];
    let tx = b[0] - a[0], ty = b[1] - a[1];
    const l = Math.hypot(tx, ty) || 1; tx /= l; ty /= l;
    const h = (punti[i][2] ?? 0) / 2;
    sx.push([punti[i][0] - ty * h, punti[i][1] + tx * h]);
    dx.push([punti[i][0] + ty * h, punti[i][1] - tx * h]);
  }
  return { sx, dx };
}

// ctx: canvas 2D; X, Y: dal mondo ai pixel; k: pixel per unità del mondo
export function pennella(ctx, punti, X, Y, k, stile = 'pieno', colore = '#1c1b18', minimo = 0.5) {
  if (punti.length < 2) return;
  const spesso = punti.some((p) => (p[2] ?? 0) * k > minimo);
  if (stile === 'filo' || !spesso) {
    ctx.strokeStyle = colore; ctx.lineWidth = 1;
    ctx.beginPath();
    punti.forEach((p, i) => (i ? ctx.lineTo(X(p[0]), Y(p[1])) : ctx.moveTo(X(p[0]), Y(p[1]))));
    ctx.stroke();
    return;
  }
  // sotto il minimo visibile lo spessore resta un capello
  const P = punti.map((p) => [p[0], p[1], Math.max(p[2] ?? 0, minimo / k)]);
  const { sx, dx } = bordi(P);
  const cappuccio = (p, verso) => {
    const r = Math.max(p[2] / 2 * k, 0.25);
    ctx.arc(X(p[0]), Y(p[1]), r, 0, Math.PI * 2, verso);
  };
  if (stile === 'pieno') {
    ctx.fillStyle = colore;
    ctx.beginPath();
    sx.forEach((q, i) => (i ? ctx.lineTo(X(q[0]), Y(q[1])) : ctx.moveTo(X(q[0]), Y(q[1]))));
    for (let i = dx.length - 1; i >= 0; i--) ctx.lineTo(X(dx[i][0]), Y(dx[i][1]));
    ctx.closePath();
    ctx.fill('nonzero');
    ctx.beginPath(); cappuccio(P[0]); ctx.fill();
    ctx.beginPath(); cappuccio(P[P.length - 1]); ctx.fill();
  } else {
    ctx.strokeStyle = colore; ctx.lineWidth = 0.9;
    for (const lato of [sx, dx]) {
      ctx.beginPath();
      lato.forEach((q, i) => (i ? ctx.lineTo(X(q[0]), Y(q[1])) : ctx.moveTo(X(q[0]), Y(q[1]))));
      ctx.stroke();
    }
    // chiude le estremità
    for (const i of [0, P.length - 1]) {
      ctx.beginPath(); ctx.moveTo(X(sx[i][0]), Y(sx[i][1])); ctx.lineTo(X(dx[i][0]), Y(dx[i][1])); ctx.stroke();
    }
  }
}

// Più linee insieme. Nel 'contorno' i bordi seguono l'unione dei corpi, come il
// doppio filo delle tavole: prima tutti i corpi in inchiostro, appena più
// larghi, poi tutti i corpi in colore carta sopra.
// voci: [{ punti, colore }]
export function pennellaTutte(ctx, voci, X, Y, k, stile = 'pieno', carta = '#fbfaf6') {
  if (stile !== 'contorno') { for (const v of voci) pennella(ctx, v.punti, X, Y, k, stile, v.colore); return; }
  const corpo = (punti, extra) => punti.map((p) => [p[0], p[1], Math.max(p[2] ?? 0, 0.6 / k) + extra / k]);
  for (const v of voci) if (v.punti.length > 1) pennella(ctx, corpo(v.punti, 1.8), X, Y, k, 'pieno', v.colore || '#1c1b18', 0);
  for (const v of voci) if (v.punti.length > 1) pennella(ctx, corpo(v.punti, 0), X, Y, k, 'pieno', carta, 0);
}
