// prova.mjs — il banco minimo delle prove: prova(nome, fn), numeri stampati, uscita 1 se qualcosa fallisce.
let falliti = 0, fatti = 0;
export function prova(nome, fn) {
  const t = performance.now();
  try { fn(); fatti++; console.log(`  ✓ ${nome}  (${((performance.now() - t) / 1000).toFixed(2)} s)`); }
  catch (e) { falliti++; console.log(`  ✗ ${nome}\n      ${e.stack?.split('\n').slice(0, 3).join('\n      ') ?? e}`); }
}
export function vero(c, msg) { if (!c) throw new Error(msg); }
export function sotto(x, lim, msg) { if (!(x < lim)) throw new Error(`${msg}: ${x} non è sotto ${lim}`); }
export function sopra(x, lim, msg) { if (!(x > lim)) throw new Error(`${msg}: ${x} non è sopra ${lim}`); }
export const numero = (x) => (Math.abs(x) >= 1e-3 && Math.abs(x) < 1e5 ? x.toPrecision(4) : x.toExponential(2));
export function dice(...r) { console.log('      ' + r.join(' ')); }
export function fine(titolo) {
  console.log(`${titolo}: ${fatti} passate, ${falliti} fallite`);
  if (falliti) process.exitCode = 1;
}
