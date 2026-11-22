// finestra3d.js — il tasto F nello spazio: «una finestra bella a questa scala». Sulla mappa piatta la camera prova molte
// inquadrature e tiene quella che disegna di più (laboratorio.js, data-finestra-bella); nello spazio quella ricerca non si
// vede. Qui, invece, si sceglie con un criterio scritto un punto notevole della scala dove si è e ci si vola (vaiA).
// Premuto di nuovo, F va al secondo della classifica, poi al terzo… (cinque, poi si ricomincia).
//   cosmo     → la galassia nel punto più denso della ragnatela (il picco di densità più alto: un nodo)
//   galassia  → la stella in vita più calda (le stelle calde sono giovani: stanno ancora nelle nubi dei bracci)
//   stella    → il pianeta col clima più vicino ai 15 °C, prima quelli con l'acqua liquida
//   pianeta   → sulla faccia che vedi, il pendio più ripido fra celle vicine della carta: una costa alta o una catena
//               (sott'acqua il pendio conta un terzo: da sopra non si vede)
// → { frase } (l'avviso per chi guarda: dove si va e perché), o null se a questa scala non c'è niente da scegliere.
import { cosmo as cosmoDi, galassia as galassiaDi, sistema as sistemaDi } from '../camera/cosmo.js';
import { superficieDi } from '../camera/mappa.js';

const prova = (f, d = null) => { try { return f(); } catch { return d; } };
const QUANTI = 5;
let giro = { chiave: '', n: -1 };
// il prossimo della classifica (lista già in ordine), uno diverso a ogni pressione
function prossimo(chiave, lista) {
  if (!lista.length) return null;
  giro = giro.chiave === chiave ? { chiave, n: (giro.n + 1) % Math.min(QUANTI, lista.length) } : { chiave, n: 0 };
  return { x: lista[giro.n], k: giro.n + 1, di: Math.min(QUANTI, lista.length) };
}
const posto = (p) => (p.di > 1 ? ` (${p.k} di ${p.di})` : '');

// ---------- IL PIANETA: i punti notevoli della carta (alt, W × H, equirettangolare: lon da −π, lat da +π/2)
function puntiDelPianeta(se, R) {
  const { W, H, alt, mare } = se, out = [];
  for (let j = 1; j < H - 1; j++) {
    const lat = Math.PI / 2 - ((j + 0.5) / H) * Math.PI; if (Math.abs(lat) > 1.2) continue; // (non ai poli: la carta lì si stira)
    const dx = Math.max(1, (Math.cos(lat) * 2 * Math.PI * R) / W), dy = (Math.PI * R) / H;
    for (let i = 0; i < W; i++) {
      const k = j * W + i, h = alt[k], e = alt[j * W + ((i + 1) % W)], s = alt[(j + 1) * W + i];
      const pend = Math.max(Math.abs(e - h) / dx, Math.abs(s - h) / dy);
      const costa = (h >= mare) !== (e >= mare) || (h >= mare) !== (s >= mare);
      // (il fondo del mare non si vede da sopra: conta per un terzo, così vengono prima le coste e le catene)
      out.push({ i, j, lon: ((i + 0.5) / W) * 2 * Math.PI - Math.PI, lat, pend: costa || h >= mare ? pend : pend / 3, cosa: costa ? 'una costa alta' : h >= mare ? 'una catena di montagne' : 'un pendio sul fondo del mare' });
    }
  }
  out.sort((a, b) => b.pend - a.pend);
  // (punti distinti: non due della stessa montagna)
  const scelti = []; for (const p of out) { if (scelti.every((q) => Math.min(Math.abs(q.i - p.i), W - Math.abs(q.i - p.i)) + Math.abs(q.j - p.j) > W / 16)) scelti.push(p); if (scelti.length >= 40) break; }
  return scelti;
}
const versore = (lon, lat) => [Math.cos(lat) * Math.cos(lon), Math.sin(lat), -Math.cos(lat) * Math.sin(lon)]; // (come nucleo.js, vai)

function suPianeta(c, q) {
  const v = q.via, P = prova(() => sistemaDi(v.cosmo, v.galassia, v.stella).pianeti[v.pianeta]); if (!P) return null;
  if (P.tipo === 'gassoso' || !P.interno) return { frase: 'Un gigante di gas: niente coste né catene da inquadrare' };
  const Sx = prova(() => superficieDi(v)); if (!Sx?.se) return { frase: 'La superficie si sta ancora calcolando: riprova fra poco' };
  const M = c.mondo3d, corpo = prova(() => c.universo3d.sistema().pianeta(v.pianeta)); if (!M || !corpo) return null;
  const R = corpo.raggio, d = M.camera.corpo === corpo ? prova(() => M.dove()) : null, quota = d?.quota ?? 4 * R;
  // la faccia che si vede: dalla distanza della camera (vicino al suolo, solo i dintorni)
  const D = R + Math.max(0, quota), soglia = d ? Math.max(0.5, Math.min(0.995, R / D + 0.2)) : -1, qui = d ? versore(d.lon, d.lat) : null;
  const tutti = puntiDelPianeta(Sx.se, Sx.se.raggioM || R), visti = qui ? tutti.filter((p) => { const u = versore(p.lon, p.lat); return u[0] * qui[0] + u[1] * qui[1] + u[2] * qui[2] > soglia; }) : tutti;
  const lista = visti.length ? visti : tutti, scelta = prossimo(`p|${JSON.stringify(v)}|${visti.length ? Math.round(10 * soglia) : 'tutto'}`, lista); if (!scelta) return null;
  const p = scelta.x;
  if (quota < 0.25 * R) { // (sul suolo: ci si mette sopra, guardando in giù)
    M.vai({ lon: p.lon, lat: p.lat, quota: Math.max(3000, Math.min(quota, 0.02 * R)), alza: -0.8 });
  } else {
    const V = M.V, A = M.assettoDi(corpo, M.tempo.t), pc = corpo.punto ? corpo.punto(p.lon, p.lat, 0) : V.per(versore(p.lon, p.lat), R);
    M.vaiA({ rif: corpo, C: V.mv(A, pc), arrivo: 0.15 * R, raggio: 0.03 * R, nome: p.cosa });
  }
  return { frase: `F: ${p.cosa}${posto(scelta)}. Criterio: il pendio più ripido sulla faccia che vedi` };
}

// ---------- LA STELLA, LA GALASSIA, IL COSMO
function suStella(c, q) {
  const v = q.via, S = prova(() => sistemaDi(v.cosmo, v.galassia, v.stella)); if (!S?.pianeti?.length) return null;
  const lista = S.pianeti.map((P, i) => ({ i, acqua: P.clima?.acqua === 'liquida', dT: Math.abs((P.clima?.T ?? 0) - 288) })).sort((a, b) => (b.acqua - a.acqua) || (a.dT - b.dT));
  const s = prossimo(`s|${JSON.stringify(v)}`, lista); if (!s || !c.universo3d.vaiA({ galassia: v.galassia, stella: v.stella, pianeta: s.x.i }, {})) return null;
  return { frase: `F: il pianeta ${s.x.i + 1}${posto(s)}. Criterio: il clima più vicino ai 15 °C, prima l'acqua liquida` };
}
function suGalassia(c, q) {
  const v = q.via, Gx = prova(() => galassiaDi(v.cosmo, v.galassia)); if (!Gx) return null;
  const lista = Gx.stelle.map((s, i) => ({ i, T: s.stato === 'in vita' ? s.T : 0 })).filter((x) => x.T > 0).sort((a, b) => b.T - a.T);
  const s = prossimo(`g|${v.cosmo}|${v.galassia}`, lista); if (!s || !c.universo3d.vaiA({ galassia: v.galassia, stella: s.x.i }, {})) return null;
  return { frase: `F: la stella ${s.x.i + 1}, ${Math.round(s.x.T).toLocaleString('it-IT')} K${posto(s)}. Criterio: la più calda, cioè giovane, nelle nubi dove nasce` };
}
function suCosmo(c, q) {
  const v = q.via, Cx = prova(() => cosmoDi(v.cosmo)); if (!Cx) return null;
  const lista = Cx.galassie.map((g, i) => ({ i, peso: g.peso })).sort((a, b) => b.peso - a.peso);
  const s = prossimo(`c|${v.cosmo}`, lista); if (!s || !c.universo3d.vaiA({ galassia: s.x.i }, {})) return null;
  return { frase: `F: la galassia ${s.x.i + 1}${posto(s)}. Criterio: il punto più denso della ragnatela, un nodo` };
}
export function finestraIn3D(c, q) {
  if (!c?.universo3d || !q?.tre || !q.via) return null;
  if (q.id === 'pianeta' || q.id === 'terreno') return suPianeta(c, q);
  if (q.id === 'stella') return suStella(c, q);
  if (q.id === 'galassia') return suGalassia(c, q);
  if (q.id === 'cosmo') return suCosmo(c, q);
  return null;
}
