// terra_asciutta.mjs — per le prove del suolo (test_suolo, test_coerenza_scale): IL PUNTO DI TERRA del primo mare con il vento
// del catalogo (mare_col_vento.mjs). Nessun seme scelto: si scende di tessera in tessera (geologia.js) fino a quella del padre
// del suolo (suolo.js LIVELLO_PADRE); in ognuna la cella asciutta (3×3 celle senza mare né lago) più ripida, e la tessera sotto
// è quella che la contiene; al primo livello tra le sue sedici tessere. È strutturale: se la geologia cambia, si trova un
// altro punto, e le prove valgono lo stesso. Dice anche quanta parte delle terre della mappa intera resta asciutta nelle
// tessere del primo livello (le tessere riempiono di laghi le conche: è di geologia.js, e le prove lo stampano).
import * as GE from '../src/camera/geologia.js';
import { LIVELLO_PADRE } from '../src/camera/suolo.js';

const asciutta = (t, i, j) => { for (let b = -1; b <= 1; b++) for (let a = -1; a <= 1; a++) { const q = (j + b) * t.W + i + a; if (t.alt[q] < t.mare || (t.lago && t.lago[q] > 0)) return false; } return true; };
// (lontano dai poli, |lat| ≤ 60°: là la griglia in longitudine e latitudine stringe le celle e le pendenze si gonfiano)
function piuRipida(t) { let best = null; const [, v0, , v1] = t.rett || [0, 0, 1, 1]; for (let j = 2; j < t.H - 2; j++) { if (Math.abs(90 - (v0 + ((j + 0.5) / t.H) * (v1 - v0)) * 180) > 60) continue; for (let i = 2; i < t.W - 2; i++) { if (!asciutta(t, i, j)) continue; const c = j * t.W + i, s = Math.hypot(t.alt[c + 1] - t.alt[c - 1], t.alt[c + t.W] - t.alt[c - t.W]); if (!best || s > best.s) best = { i, j, s }; } } return best; }
export function terraAsciutta(S, { livello = LIVELLO_PADRE } = {}) {
  const { se, cl } = S; let best = null, t = null, terre = 0, asciutte = 0;
  for (let ty = 0; ty < 4; ty++) for (let tx = 0; tx < 4; tx++) { const q = GE.tessera(S.k, se, cl, 1, tx, ty, S.seme); for (let k = 0; k < q.W * q.H; k++) if (!(q.alt[k] < q.mare)) { terre++; if (!(q.lago && q.lago[k] > 0)) asciutte++; } const b = piuRipida(q); if (b && (!best || b.s > best.s)) { best = b; t = q; } }
  if (!best) return null;
  for (let L = 2; L <= livello; L++) { const [u0, v0, u1, v1] = t.rett, u = u0 + ((best.i + 0.5) / t.W) * (u1 - u0), v = v0 + ((best.j + 0.5) / t.H) * (v1 - v0), n = 4 ** L;
    const q = GE.tessera(S.k, se, cl, L, Math.floor(u * n), Math.floor(v * n), S.seme), b = piuRipida(q); if (!b) return null; t = q; best = b; }
  const [u0, v0, u1, v1] = t.rett, u = u0 + ((best.i + 0.5) / t.W) * (u1 - u0), v = v0 + ((best.j + 0.5) / t.H) * (v1 - v0);
  return { lon: u * 360 - 180, lat: 90 - v * 180, livello, tessera: t, cella: best, asciuttePrimoLivello: terre > 0 ? asciutte / terre : 0 };
}
