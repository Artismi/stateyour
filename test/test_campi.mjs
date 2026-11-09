// I campi: Lorentz, Stokes, Hooke. Le curve devono uscire dalle leggi.
import assert from 'node:assert/strict';
import { simula } from '../src/motore.js';

const vicino = (a, b, eps) => Math.abs(a - b) <= eps;

// 1. campo magnetico da solo: cerchio di raggio v/omega
{
  const v = 20, omega = 0.5, r = v / omega; // 40
  const p = {
    dt: 0.005, passi: 4000, limiti: [-500, -500, 500, 500],
    emettitori: [{ id: 'c', pos: [r, 0], angolo: 90, v }],
    campi: [{ id: 'B', tipo: 'magnetico', omega }],
  };
  const [tr] = simula(p);
  // il centro è in (0,0): la forza punta a sinistra del moto (omega > 0 = antiorario)
  for (const [x, y] of tr.punti) assert.ok(vicino(Math.hypot(x, y), r, 1e-3), `raggio ${Math.hypot(x, y)}`);
  console.log('ok  magnetico: cerchio di raggio v/ω');
}

// 2. magnetico + attrito: spirale logaritmica esatta attorno al centro asintotico
{
  const v0 = 30, omega = 1, gamma = 0.12;
  const p = {
    dt: 0.002, passi: 20000, limiti: [-500, -500, 500, 500],
    emettitori: [{ id: 's', pos: [0, 0], angolo: 0, v: v0 }],
    campi: [{ id: 'B', tipo: 'magnetico', omega }, { id: 'A', tipo: 'attrito', gamma }],
  };
  const [tr] = simula(p);
  // z(t) = z0 + v0 (e^{(iω−γ)t} − 1)/(iω−γ)  =>  centro z∞ = z0 − v0/(iω−γ)
  // 1/(iω−γ) = (−γ − iω)/(γ²+ω²)
  const den = gamma * gamma + omega * omega;
  const cx = 0 - v0 * (-gamma / den), cy = 0 - v0 * (-omega / den);
  // r(θ) = r0 e^{−(γ/ω) θ}: tra due passaggi a distanza di un giro il rapporto è e^{−2πγ/ω}
  const rapportoAtteso = Math.exp(-2 * Math.PI * gamma / omega);
  const polari = tr.punti.map(([x, y]) => ({ r: Math.hypot(x - cx, y - cy), th: Math.atan2(y - cy, x - cx) }));
  // srotolo l'angolo
  let giri = 0;
  for (let i = 1; i < polari.length; i++) {
    const grezzoPrima = polari[i - 1].th - 2 * Math.PI * giri;
    if (polari[i].th - grezzoPrima < -Math.PI) giri++;
    polari[i].th += 2 * Math.PI * giri;
  }
  const th0 = polari[0].th;
  let controlli = 0;
  for (let giro = 1; giro <= 2; giro++) {
    const i = polari.findIndex((q) => q.th >= th0 + 2 * Math.PI * giro);
    assert.ok(i > 0, `la spirale non compie il giro ${giro}`);
    const rapporto = polari[i].r / polari[0].r;
    assert.ok(vicino(rapporto, rapportoAtteso ** giro, 0.01 * rapportoAtteso ** giro), `giro ${giro}: rapporto ${rapporto} atteso ${rapportoAtteso ** giro}`);
    controlli++;
  }
  // l'angolo costante tra velocità e raggio: tan α = ω/γ
  console.log(`ok  magnetico + attrito: spirale logaritmica, rapporto per giro ${rapportoAtteso.toFixed(4)} (${controlli} giri verificati)`);
}

// 3. molla verso l'asse x: sinusoide con lunghezza d'onda 2π·vx/√k
{
  const vx = 10, vy = 6, k = 0.04; // √k = 0.2 => λ = 2π·10/0.2 = 314.16, ampiezza vy/√k = 30
  const p = {
    dt: 0.005, passi: 20000, limiti: [-50, -500, 1000, 500],
    emettitori: [{ id: 'o', pos: [0, 0], dir: [vx, vy], v: Math.hypot(vx, vy) }],
    campi: [{ id: 'K', tipo: 'molla', a: [0, 0], b: [1, 0], k }],
    regole: [{ quando: { tipo: 'attraversa', a: [700, 0], b: [700, 1] }, fai: [{ tipo: 'ferma' }] }],
  };
  const [tr] = simula(p);
  const lambda = 2 * Math.PI * vx / Math.sqrt(k), amp = vy / Math.sqrt(k);
  let maxY = 0;
  for (const [x, y] of tr.punti) {
    const atteso = amp * Math.sin(Math.sqrt(k) * x / vx);
    assert.ok(vicino(y, atteso, 1e-3), `x=${x.toFixed(2)}: y=${y.toFixed(4)} atteso ${atteso.toFixed(4)}`);
    maxY = Math.max(maxY, y);
  }
  assert.ok(vicino(maxY, amp, 1e-2), `ampiezza ${maxY} attesa ${amp}`);
  // gli zeri cadono a multipli di λ/2
  const zeri = tr.punti.slice(1).filter((q, i) => q[0] > 1 && Math.sign(q[1]) !== Math.sign(tr.punti[i][1]) && Math.abs(q[1]) < 1).map((q) => q[0]);
  assert.ok(zeri.length >= 4, 'pochi zeri');
  zeri.forEach((x, i) => assert.ok(vicino(x, (i + 1) * lambda / 2, 0.2), `zero ${i} in ${x}, atteso ${(i + 1) * lambda / 2}`));
  console.log(`ok  molla: sinusoide, λ = ${lambda.toFixed(2)}, ampiezza ${amp}`);
}

// 4. evento di distanza: ferma la spirale esattamente a r = 10 dal centro
{
  const p = {
    dt: 0.002, passi: 100000, limiti: [-500, -500, 500, 500],
    emettitori: [{ id: 's', pos: [60, 0], angolo: 90, v: 30 }],
    campi: [{ id: 'B', tipo: 'magnetico', omega: 0.5 }, { id: 'A', tipo: 'attrito', gamma: 0.1 }],
    regole: [{ quando: { tipo: 'distanza', da: [0, 0], r: 10, verso: 'dentro' }, fai: [{ tipo: 'ferma' }] }],
  };
  const [tr] = simula(p);
  assert.equal(tr.fine, 'fermata');
  const u = tr.punti[tr.punti.length - 1];
  assert.ok(vicino(Math.hypot(u[0], u[1]), 10, 1e-6), `fermata a distanza ${Math.hypot(u[0], u[1])}`);
  console.log(`ok  distanza: fermata esatta sul cerchio r = 10 dopo ${tr.passi} passi`);
}
console.log('test_campi: tutto ok');
