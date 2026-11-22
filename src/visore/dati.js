// dati.js — la piccola interfaccia tra la camera e il visore. Il visore non calcola fisica: legge ciò che la camera
// (laboratorio.js, esposto in window.__camera) e i moduli del modello (cosmo.js, mappa.js, risalita.js) già sanno, e lo
// mette in una forma che l'HUD e le schede disegnano. Qui stanno: dove si è (il livello e la via), la catena
// dell'indirizzo, la scala dello schermo, il tempo, e le schede di ciò che si guarda (pianeta, stella, galassia, cosmo…).
import { sistema as sistemaDi, galassia as galassiaDi, cosmo as cosmoDi, cosmoBase, ramiCosmo } from '../camera/cosmo.js';
import { superficieDi, superficieInCalcolo, rocciaDi } from '../camera/mappa.js';
import { fmtLunghezza } from '../camera/unita.js';
import { risalita } from '../camera/risalita.js';
import { luogoDaAria } from '../camera/materia.js';

export const C = () => window.__camera || null;
const tre = (c) => !!(c && c.mondo3d && c.universo3d);
const prova = (f, d = null) => { try { return f(); } catch { return d; } };

// ---------- DOVE SI È: uno dei livelli dello zoom (icone.js, LIVELLI) e la via { cosmo, galassia, stella, pianeta }
export function quiOra() {
  const c = C(); if (!c) return { id: 'cosmo', via: null };
  const cm = c.camMappa, cosa = prova(() => c.cosa(), '');
  if (cosa === 'la scala quantistica') return { id: 'particella', via: cm?.via };
  if (c.vistaAtomi) return { id: 'atomo', via: cm?.via, acqua: !!cm?.suAcqua };
  if (tre(c)) {
    const v = prova(() => c.universo3d.viaOra(), { cosmo: cm?.via?.cosmo ?? 1 }); let id = v.pianeta != null ? 'pianeta' : v.stella != null ? 'stella' : v.galassia != null ? 'galassia' : 'cosmo', quota = null;
    const M = c.mondo3d, corpo = M.camera.corpo;
    if (id === 'pianeta' && corpo?.punto && corpo.raggio > 0) { const d = prova(() => M.dove()); if (d && Number.isFinite(d.quota)) { quota = d.quota; if (d.quota < 0.25 * corpo.raggio) id = 'terreno'; } }
    return { id, via: v, tre: true, quota };
  }
  // (sulla mappa piatta la via della camera è sempre intera: la si taglia al livello dove si è, perché la catena non
  // mostri il pianeta quando si guarda la galassia o il cosmo)
  if (cm) { const v = cm.via ? { ...cm.via } : cm.via; if (v && cm.livello < 3) { delete v.pianeta; if (cm.livello < 2) delete v.stella; if (cm.livello < 1) delete v.galassia; }
    return { id: ['cosmo', 'galassia', 'stella', 'pianeta', 'terreno', 'materia'][Math.min(5, cm.livello)], via: v, tre: false, acqua: !!cm.suAcqua }; }
  return { id: 'cosmo', via: null };
}
export const ORDINE = ['cosmo', 'galassia', 'stella', 'pianeta', 'terreno', 'materia', 'atomo', 'particella'];
const breve = (s, n = 22) => { s = String(s || '').replace(/\s*\(.*$/, '').replace(/^(il|la|lo|l'|i|gli|le) /i, ''); return s.length > n ? `${s.slice(0, n - 1)}…` : s; };
const Maiuscola = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);
// LA CATENA DELL'INDIRIZZO: un anello per livello, fino a quello dove si è (l'unico col nome per intero)
export function catena(q = quiOra()) {
  const c = C(), v = q.via || {}, out = []; if (!c) return out;
  const ramo = v.cosmo != null && Object.keys(prova(() => ramiCosmo(v.cosmo), {}) || {}).length > 0;
  if (v.cosmo != null) out.push({ liv: 'cosmo', n: `${cosmoBase(v.cosmo)}${ramo ? '′' : ''}`, nome: `Cosmo ${cosmoBase(v.cosmo)}${ramo ? ' (un ramo)' : ''}` });
  if (v.galassia != null) out.push({ liv: 'galassia', n: v.galassia + 1, nome: `Galassia ${v.galassia + 1}` });
  if (v.stella != null) out.push({ liv: 'stella', n: v.stella + 1, nome: `Stella ${v.stella + 1}` });
  if (v.pianeta != null) out.push({ liv: 'pianeta', n: v.pianeta + 1, nome: `Pianeta ${v.pianeta + 1}` });
  const fondo = ORDINE.indexOf(q.id);
  if (fondo >= 4) out.push({ liv: 'terreno', n: 'suolo', nome: 'Il suolo' });
  if (fondo >= 5) { const r = prova(() => rocciaDi(c.camMappa)); out.push({ liv: 'materia', n: breve(r?.nome || (q.acqua ? 'acqua' : 'roccia'), 14), nome: Maiuscola(breve(r?.nome || (q.acqua ? "l'acqua" : 'la roccia'), 26)) }); }
  if (fondo >= 6) out.push({ liv: 'atomo', n: 'atomi', nome: q.acqua ? 'Le molecole' : 'Gli atomi' });
  if (fondo >= 7) out.push({ liv: 'particella', n: 'quanti', nome: 'I quanti' });
  if (!out.length) out.push({ liv: q.id, n: q.id, nome: Maiuscola(q.id) });
  out[out.length - 1].qui = true; return out;
}
// ---------- LA SCALA: metri per pixel, la larghezza dello schermo, il tratto della barra lineare (dalla barra della camera)
export function scala(Wpx) {
  const c = C(); const mpp = prova(() => c.mpp()); if (!(mpp > 0)) return null;
  const b = document.getElementById('barraScala'), i = b?.querySelector('i'), sp = b?.querySelector('span');
  return { mpp, larghezza: mpp * Wpx, tratto: i ? parseFloat(i.style.width) || 0 : 0, trattoNome: sp ? sp.textContent.split(' · ')[0] : '', barra: sp ? sp.textContent : '' };
}
export function lunghezza(m) { if (!(m > 0)) return '–'; if (m >= 3.086e19) { const kal = m / 9.461e18; return kal >= 1000 ? `${(kal / 1000).toLocaleString('it-IT', { maximumFractionDigits: 1 })} milioni di anni luce` : `${kal.toLocaleString('it-IT', { maximumFractionDigits: 0 })} mila anni luce`; } return fmtLunghezza(m); }
// ---------- IL TEMPO: nello spazio quello del mondo (pausa, velocità); sotto la superficie è adesso
const ANNO = 31557600, VEL = [1, 60, 600, 3600, 21600, 86400, 604800, 2592000, ANNO, 100 * ANNO, 1e4 * ANNO, 1e6 * ANNO, 1e8 * ANNO];
const durata = (s) => (s < 60 ? `${s} s` : s < 3600 ? `${s / 60} min` : s < 86400 ? `${s / 3600} h` : s < ANNO ? `${Math.round(s / 86400)} g` : s < 1e6 * ANNO ? `${(s / ANNO).toLocaleString('it-IT')} anni` : `${(s / ANNO / 1e6).toLocaleString('it-IT')} Ma`);
export function tempoOra() {
  const c = C(); if (!c) return null;
  if (c.mondo3d) { const T = c.mondo3d.tempo, k = VEL.findIndex((v) => v >= T.velocita), span = document.querySelector('.tele [data-t="passo"]')?.parentNode?.querySelector('span');
    return { tre: true, pausa: !!T.pausa, testo: T.pausa ? 'in pausa' : (span?.textContent || (T.velocita === 1 ? 'tempo vero' : '')), rapporto: `1 s = ${durata(T.velocita)}`, tacche: 1 + Math.min(3, Math.floor(Math.max(0, k) / 3.3)) }; }
  return { tre: false, fermo: true, testo: 'adesso', rapporto: 'lo stato di oggi', tacche: 0 };
}

// ---------- LE SCHEDE: i dati di ciò che si guarda, già calcolati dal modello
export function pianeta(v) {
  if (!v || v.pianeta == null) return null; const S = prova(() => sistemaDi(v.cosmo, v.galassia, v.stella)); const P = S?.pianeti?.[v.pianeta]; if (!P) return null;
  const solido = P.interno && P.tipo !== 'gassoso', Sx = solido ? prova(() => superficieDi(v)) : null, calcola = solido && !Sx && prova(() => superficieInCalcolo(v), false);
  return { v, S, P, St: S.stella, Sx, calcola, cl: P.clima, T: (Sx ? Sx.cl.Tglobale : P.clima.T) - 273.15, Teq: P.clima.Teq - 273.15 };
}
const risalite = new Map();
export function particelleDi(v, P) {
  const k = `${v.cosmo}|${v.galassia}|${v.stella}|${v.pianeta}`; if (risalite.has(k)) return risalite.get(k);
  const r = prova(() => { const Gx = galassiaDi(v.cosmo, v.galassia), St = Gx.stelle[v.stella]; return risalita(luogoDaAria({ P }), { P, stella: St, galassia: Gx, posizione: St.pos }); });
  risalite.set(k, r); if (risalite.size > 8) risalite.delete(risalite.keys().next().value); return r;
}
export function stella(v) {
  if (!v || v.stella == null) return null; const S = prova(() => sistemaDi(v.cosmo, v.galassia, v.stella)); if (!S) return null;
  const Gx = prova(() => galassiaDi(v.cosmo, v.galassia)); return { v, S, St: S.stella, Gx, L: S.disco?.Lstella ?? null };
}
export function galassia(v) { if (!v || v.galassia == null) return null; const Gx = prova(() => galassiaDi(v.cosmo, v.galassia)); return Gx ? { v, Gx, F: Gx.G.forma, G: Gx.G } : null; }
export function cosmo(v) { if (!v) return null; const Cx = prova(() => cosmoDi(v.cosmo)); return Cx ? { v, Cx } : null; }
export function materia() { const c = C(); const r = prova(() => rocciaDi(c.camMappa)); return r ? { r, cm: c.camMappa } : null; }
