// test_intreccio.mjs — l'indirizzo: dove, quando, in quale mondo (le regole stanno in INTRECCIO.md)
import assert from 'node:assert/strict';
import { indirizzo, scrivi, leggi, figlio, genitore, alTempo, nelRamo, eventiDi, puoToccare, luogo } from '../src/camera/intreccio.js';
let ok = 0; const prova = (nome, f) => { f(); ok++; console.log('  ✓', nome); };

prova('lo stesso indirizzo si scrive in un modo solo, e si rilegge uguale', () => {
  const a = indirizzo(['cosmo 1', 'galassia 3', 'stella 53', 'pianeta 0'], { tempo: 1.2e10, rami: { 'b/x': 2, 'a/y': 1, 'c/z': 0 } });
  const b = indirizzo(['cosmo 1', 'galassia 3', 'stella 53', 'pianeta 0'], { tempo: 1.2e10, rami: { 'a/y': 1, 'b/x': 2 } });
  assert.equal(scrivi(a), scrivi(b)); assert.deepEqual(leggi(scrivi(a)), a);
  assert.equal(scrivi(indirizzo(['cosmo 1'])), 'cosmo 1'); assert.deepEqual(leggi('cosmo 1/galassia 3'), indirizzo(['cosmo 1', 'galassia 3']));
});
prova('figli, genitori e tempi restano nello stesso mondo', () => {
  const a = indirizzo(['cosmo 1', 'galassia 3'], { rami: { e: 1 } }), f = figlio(a, 'stella 53');
  assert.equal(luogo(f), 'cosmo 1/galassia 3/stella 53'); assert.deepEqual(f.rami, a.rami); assert.deepEqual(genitore(f), a);
  assert.equal(alTempo(f, 5).tempo, 5); assert.equal(genitore(indirizzo(['cosmo 1'])), null);
});
prova('gli eventi di un luogo: stesso indirizzo stesso esito; un ramo cambia quell\'evento e solo quello', () => {
  const a = indirizzo(['cosmo 1', 'galassia 3', 'stella 53', 'pianeta 0']), c = eventiDi(a);
  assert.equal(c('impatto 12/dove'), eventiDi(indirizzo(['cosmo 1', 'galassia 3', 'stella 53', 'pianeta 0']))('impatto 12/dove'));
  const ev = `${luogo(a)}/impatto 12/dove`, d = eventiDi(nelRamo(a, ev, 1));
  assert.notEqual(c('impatto 12/dove'), d('impatto 12/dove')); assert.equal(c('impatto 13/dove'), d('impatto 13/dove'));
  assert.equal(scrivi(nelRamo(nelRamo(a, ev, 1), ev, 0)), scrivi(a)); // tornare all'esito di partenza è tornare al mondo di partenza
});
prova('un evento può toccare solo ciò che sta dentro il suo contenitore, e dopo di lui', () => {
  const pianeta = 'cosmo 1/galassia 3/stella 53/pianeta 0', ev = `${pianeta}/impatto 12/dove`;
  const sup = indirizzo([...pianeta.split('/'), 'superficie'], { tempo: 5e9 }), altro = indirizzo(['cosmo 1', 'galassia 3', 'stella 53', 'pianeta 1'], { tempo: 5e9 });
  assert.ok(puoToccare(ev, pianeta, sup, 4e9)); assert.ok(!puoToccare(ev, pianeta, altro, 4e9)); assert.ok(!puoToccare(ev, pianeta, alTempo(sup, 3e9), 4e9));
});
console.log(`intreccio: ${ok} prove, tutto ok`);
