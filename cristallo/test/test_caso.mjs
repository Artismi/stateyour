// test_caso.mjs — la fonte del caso con indirizzo.
// TOLLERANZE (dichiarate prima): i vettori noti al bit; logEsatto e cosGiro entro 4·10⁻¹⁶ (relativo) e 2·10⁻¹⁵
// (assoluto) dalle funzioni della libreria.
import { threefry4x32, chiaveDi, sorgente, logEsatto, cosGiro, senGiro } from '../src/caso.js';
import { prova, vero, sotto, fine, dice, numero } from './prova.mjs';

console.log('caso');
prova('Threefry-4x32-20 ridà i vettori noti di Random123', () => {
  const KAT = [
    ['00000000 00000000 00000000 00000000', '00000000 00000000 00000000 00000000', '9c6ca96a e17eae66 fc10ecd4 5256a7d8'],
    ['ffffffff ffffffff ffffffff ffffffff', 'ffffffff ffffffff ffffffff ffffffff', '2a881696 57012287 f6c7446e a16a6732'],
    ['243f6a88 85a308d3 13198a2e 03707344', 'a4093822 299f31d0 082efa98 ec4e6c89', '59cd1dbb b8879579 86b5d00c ac8b6d84'],
  ];
  const h = (s) => s.split(' ').map((x) => parseInt(x, 16));
  for (const [c, k, e] of KAT) vero(JSON.stringify(threefry4x32(h(c), h(k))) === JSON.stringify(h(e)), `vettore ${c}`);
});
prova('le chiavi per nome sono quelle di src/camera/eventi.js (valori copiati da lì)', () => {
  const attese = {
    '': '534f4ddf d249b067 72ab5ad6 87bacc9e', a: 'b4c5da4 53e36e2e ea8af4de d1685345',
    'cosmo 1/galassia 3/stella 53': 'a8d54c63 a30a3f29 839b8380 66376bef',
    'pattern è lungo più di quindici caratteri/🎲 7': 'edf31a12 e752f415 82072a48 a8dffdfe',
  };
  for (const [nome, k] of Object.entries(attese)) vero(chiaveDi(nome).map((x) => x.toString(16)).join(' ') === k, `chiave di «${nome}»`);
  const c = sorgente('prova');
  vero(c('x') === 0.5131082796155836, 'esito uniforme');
  vero(c.normale('y') === 0.13784091255191738, 'esito a campana');
});
prova('stesso indirizzo, stesso esito, in qualunque ordine', () => {
  const a = sorgente('pattern 1'), b = sorgente('pattern 1');
  const x = [0, 1, 2, 3].map((i) => a(`e ${i}`)), y = [3, 2, 1, 0].map((i) => b(`e ${i}`)).reverse();
  vero(JSON.stringify(x) === JSON.stringify(y), 'ordine');
  vero(a.sotto('vibra')('3,1,0/2') === sorgente('pattern 1/vibra')('3,1,0/2'), 'sotto');
});
prova('logaritmo e coseno scritti con operazioni esatte', () => {
  let el = 0, ec = 0;
  for (let i = 1; i < 20000; i++) {
    const x = i / 20000, y = Math.exp(40 * (x - 0.5));
    el = Math.max(el, Math.abs(logEsatto(y) - Math.log(y)) / Math.max(1, Math.abs(Math.log(y))));
    ec = Math.max(ec, Math.abs(cosGiro(x) - Math.cos(2 * Math.PI * x)), Math.abs(senGiro(x) - Math.sin(2 * Math.PI * x)));
  }
  dice('ln:', numero(el), ' cos/sin:', numero(ec));
  sotto(el, 4e-16, 'scarto del logaritmo'); sotto(ec, 2e-15, 'scarto del coseno');
});
fine('caso');
