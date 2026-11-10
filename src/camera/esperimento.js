// esperimento.js — il seme come storia: le condizioni iniziali di una cella di
// spaziotempo, e il modo in cui la cella si ripete per fare il pattern.
//
// esperimento = {
//   nome, nota,
//   cella: un mondo (vedi mondo.js): masse, domini di campo/materia/mezzo,
//          specchi, il catalogo delle specie, le sorgenti. È TUTTO il seme:
//          il resto (ogni linea, ogni spessore, ogni occhio) è conseguenza.
//   ripetizione: { tipo: 'nessuna'|'quadrato'|'sfalsato'|'specchio', colonne, righe }
// }
//
// La ripetizione non aggiunge forme: dice solo che lo stesso evento accade in
// tante celle vicine, ognuna col suo campo. Una cella "a specchio" è lo stesso
// evento nell'universo riflesso: lì il campo magnetico ha il verso opposto (B
// è uno pseudoscalare), e la traccia è esattamente la riflessione di quella
// originale. Per questo basta simulare una cella sola.

import { simulaMondo } from './mondo.js';

export const clona = (o) => JSON.parse(JSON.stringify(o));

export function simulaCella(esp, opzioni) { return simulaMondo(esp.cella, opzioni); }

// le trasformazioni [a, b, c, d, e, f] (come canvas.setTransform) di ogni copia della cella
export function copie(esp) {
  const { larghezza: W, altezza: H } = esp.cella, r = esp.ripetizione || { tipo: 'nessuna' };
  if (r.tipo === 'nessuna') return [{ i: 0, j: 0, m: [1, 0, 0, 1, 0, 0], specchio: false }];
  const out = [];
  for (let j = 0; j < (r.righe ?? 3); j++) for (let i = 0; i < (r.colonne ?? 3); i++) {
    let dx = i * W, dy = j * H, specchio = false;
    if (r.tipo === 'sfalsato' && j % 2) dx += W / 2;
    if (r.tipo === 'specchio' && (i + j) % 2) specchio = true;
    out.push({ i, j, specchio, m: specchio ? [-1, 0, 0, 1, dx + W, dy] : [1, 0, 0, 1, dx, dy] });
  }
  return out;
}
export function dimensioneLastra(esp) {
  const { larghezza: W, altezza: H } = esp.cella, r = esp.ripetizione || { tipo: 'nessuna' };
  if (r.tipo === 'nessuna') return [W, H];
  return [W * (r.colonne ?? 3) + (r.tipo === 'sfalsato' ? W / 2 : 0), H * (r.righe ?? 3)];
}

// la storia di una traccia, in parole
export function storia(tr, esp) {
  if (tr.sagoma) return `Questa campitura è la sagoma di un corpo opaco appoggiato sulla lastra. Un lampo di luce uniforme, all'istante zero, ne ha impresso la forma piena: è un fotogramma, come una radiografia. ${tr.buchi.length ? `Ha ${tr.buchi.length} ${tr.buchi.length === 1 ? 'buco' : 'buchi'}, da cui la luce è passata.` : ''}`;
  const s = tr.specie, P = tr.punti, leggi = new Set(P.map((p) => p[5]).join('+').split('+'));
  const chi = s.luce ? `un raggio di luce (${s.nome || 'fotone'})` : `${s.nome ? `un ${s.nome}` : 'una particella'} (carica ${fmt(s.q ?? 0)}, massa ${fmt(s.m ?? 1)})`;
  const nascita = tr.madre ? `è nato al tempo ${fmt(P[0][3])} dal decadimento di un ${tr.madre.specie}` : `parte dalla sorgente ${tr.sorgente + 1} al tempo ${fmt(P[0][3])}`;
  const cosa = [];
  if (leggi.has('magnetico')) cosa.push('il campo magnetico lo fa girare');
  if (leggi.has('materia')) cosa.push('la materia lo frena e la curva si stringe');
  if (leggi.has('gravita')) cosa.push(s.luce ? 'una massa piega il suo cammino' : 'una massa lo attira');
  if (!cosa.length) cosa.push('nessuna forza: va dritto');
  const FINI = { ferma: 'si ferma: la macchia tonda in fondo è il picco di Bragg', decade: s.figli?.length ? 'decade: qui nascono le sue figlie' : 'decade in particelle neutre, invisibili: la linea finisce qui', fuori: 'esce dalla cella', tempo: 'la pellicola smette di registrare', assorbita: 'uno schermo nero lo ferma', caduta: 'cade sul corpo di una massa' };
  const lung = P.reduce((L, p, i) => (i && P[i - 1][2] && p[2] ? L + Math.hypot(p[0] - P[i - 1][0], p[1] - P[i - 1][1]) : L), 0);
  return `Questa linea è ${chi}. ${cap(nascita)}. Lungo la strada ${cosa.join(', ')}. Alla fine ${FINI[tr.fine] || tr.fine}. Lunghezza ${fmt(lung)}, dal tempo ${fmt(P[0][3])} al tempo ${fmt(P[P.length - 1][3])}.`;
}
export const fmt = (x) => { const t = Math.abs(x) >= 100 ? x.toFixed(0) : Math.abs(x) >= 10 ? x.toFixed(1) : Math.abs(x) >= 0.1 || x === 0 ? x.toFixed(2) : x.toPrecision(2); return t.includes('.') && !t.includes('e') ? t.replace(/0+$/, '').replace(/\.$/, '') : t; };
const cap = (s) => s[0].toUpperCase() + s.slice(1);

// ---------- gli esperimenti di partenza: ognuno è un evento fisico possibile

const C = 30;
const tondo = (x) => Math.round(x * 1000) / 1000;

// IL FIORE. Al centro un nucleo fermo decade e lancia N fotoni a raggiera. Ogni
// fotone (invisibile, come nelle camere a bolle) dopo un breve tratto si
// converte in una coppia elettrone-positrone. Nel campo magnetico le due
// cariche girano in versi opposti e si richiudono una verso l'altra: è il
// petalo. La materia le frena; dove si fermano lasciano la punta. Un nucleo di
// rinculo pesante si ferma quasi subito: il bottone al centro.
export function fiore(N = 6) {
  const figli = [];
  for (let k = 0; k < N; k++) figli.push({ specie: 'fotone', angolo: tondo((360 * k) / N), quota: 1 });
  figli.push({ specie: 'rinculo', angolo: 0, v: 3.2 });
  return {
    nome: 'il fiore',
    nota: 'un nucleo decade in fotoni a raggiera; ogni fotone diventa una coppia + e −, che il campo magnetico richiude in un petalo',
    cella: {
      larghezza: 200, altezza: 200, c: C, G: 1, bordo: 'aperto', tempo: 12,
      fondo: { B: 0, K: 0, },
      domini: [{ nome: 'il campo del fiore', forma: { tipo: 'cerchio', centro: [100, 100], r: 92 }, B: 0.32, K: 42, }],
      masse: [], pareti: [],
      pellicola: { w0: 0.9, saturazione: 4, vRif: 9 },
      specie: {
        nucleo: { q: 0, m: 4, vita: 0.001, figli },
        fotone: { luce: true, m: 0.62, vita: 0.45, visibile: false, figli: [{ specie: 'elettrone', angolo: 42, quota: 0.5 }, { specie: 'positrone', angolo: -42, quota: 0.5 }] },
        elettrone: { q: -1, m: 1 },
        positrone: { q: 1, m: 1 },
        rinculo: { q: 2, m: 12 },
      },
      sorgenti: [{ pos: [100, 100], dir: -Math.PI / 2, v: 0.0001, specie: 'nucleo' }],
    },
    ripetizione: { tipo: 'quadrato', colonne: 4, righe: 3 },
  };
}

// LA VOLUTA. Una particella neutra sale e decade in due cariche opposte: il
// campo le fa girare in versi opposti, la materia le frena: due spirali
// simmetriche che finiscono nell'occhio (il picco di Bragg).
export function voluta() {
  return {
    nome: 'la voluta',
    nota: 'una neutra decade in + e −: girano in versi opposti e si avvolgono finché la materia le ferma',
    cella: {
      larghezza: 200, altezza: 200, c: C, G: 1, bordo: 'aperto', tempo: 90,
      fondo: { B: 0, K: 0, },
      domini: [{ nome: 'il campo', forma: { tipo: 'tutto' }, B: 0.3, K: 4, }],
      masse: [], pareti: [],
      pellicola: { w0: 1.1, saturazione: 4.5, vRif: 7 },
      specie: {
        kaone: { q: 0, m: 2, vita: 5, visibile: false, figli: [{ specie: 'pi+', angolo: -24, quota: 0.5 }, { specie: 'pi-', angolo: 24, quota: 0.5 }] },
        'pi+': { q: 1, m: 1 }, 'pi-': { q: -1, m: 1 },
      },
      sorgenti: [{ pos: [100, 190], dir: -Math.PI / 2, v: 9, specie: 'kaone' }],
    },
    ripetizione: { tipo: 'specchio', colonne: 4, righe: 2 },
  };
}

// L'ORBITA. Una massa ferma, e alcune cariche lente che le passano accanto: la
// gravità le trattiene, un filo di campo magnetico fa ruotare l'ellisse. Ne
// esce la rosetta, la stessa figura delle orbite che precedono.
export function orbita() {
  const sorgenti = [[100, 52, 4.4], [100, 30, 3.6], [100, 66, 5.2]].map(([x, y, v]) => ({ pos: [x, y], dir: 0, v, specie: 'satellite' }));
  return {
    nome: "l'orbita",
    nota: 'una massa ferma trattiene alcune cariche lente; un campo debole fa ruotare le loro ellissi in rosette',
    cella: {
      larghezza: 200, altezza: 200, c: C, G: 1, bordo: 'aperto', tempo: 90,
      fondo: { B: 0.012, K: 0 },
      domini: [],
      masse: [{ nome: 'la massa', pos: [100, 100], M: 900, R: 7 }],
      pellicola: { w0: 0.6, saturazione: 3, vRif: 5 },
      specie: { satellite: { q: 0.4, m: 1 } },
      sorgenti,
    },
    ripetizione: { tipo: 'quadrato', colonne: 3, righe: 2 },
  };
}

// LA PALMETTA. Una neutra pesante decade in un ventaglio di cariche alterne: il
// campo apre il ventaglio in foglie che si arricciano verso l'esterno.
export function palmetta(N = 7) {
  const figli = [];
  for (let k = 0; k < N; k++) { const a = -70 + (140 * k) / (N - 1); figli.push({ specie: a < 0 ? 'meno' : a > 0 ? 'più' : 'neutra', angolo: tondo(a), quota: tondo(0.15 - 0.07 * Math.abs(a) / 70) }); }
  return {
    nome: 'la palmetta',
    nota: 'una neutra decade in un ventaglio di cariche: quelle a sinistra sono negative e girano verso sinistra, quelle a destra positive e girano verso destra',
    cella: {
      larghezza: 200, altezza: 200, c: C, G: 1, bordo: 'aperto', tempo: 60,
      fondo: { B: 0, K: 0, },
      domini: [{ nome: 'il campo', forma: { tipo: 'tutto' }, B: 0.22, K: 7, }],
      masse: [], pareti: [],
      pellicola: { w0: 1, saturazione: 4, vRif: 7 },
      specie: {
        madre: { q: 0, m: 6, vita: 3.2, visibile: false, figli },
        'più': { q: 1, m: 1 }, meno: { q: -1, m: 1 }, neutra: { q: 0, m: 1, visibile: false },
      },
      sorgenti: [{ pos: [100, 150], dir: -Math.PI / 2, v: 10, specie: 'madre' }],
    },
    ripetizione: { tipo: 'sfalsato', colonne: 4, righe: 3 },
  };
}

export const PRESET = { fiore, voluta, palmetta, orbita };

// ---------- la stessa storia in un mondo più grande (o più piccolo)
// Una similitudine della fisica: le lunghezze e i tempi si moltiplicano per k,
// le velocità restano. Allora il campo diventa B/k (r = m·v/(q·B)), la materia
// K/k (la gittata va come 1/K), le masse M·k (v² = G·M/r), la pellicola w0·k.
export function scalaCella(cella, k) {
  const c = clona(cella), S = (p) => p.map((x) => x * k);
  c.larghezza *= k; c.altezza *= k; c.tempo = (c.tempo ?? 200) * k;
  if (c.fondo) { c.fondo.B = (c.fondo.B ?? 0) / k; c.fondo.K = (c.fondo.K ?? 0) / k; }
  for (const d of c.domini || []) {
    const f = d.forma;
    if (f.centro) f.centro = S(f.centro);
    if (typeof f.r === 'number') f.r *= k; else if (Array.isArray(f.r)) f.r = S(f.r);
    if (f.punti) f.punti = f.punti.map(S);
    if (d.B != null) d.B /= k; if (d.K != null) d.K /= k;
  }
  for (const m of c.masse || []) { m.pos = S(m.pos); m.M *= k; m.R = (m.R ?? 0) * k; }
  for (const p of c.pareti || []) { p.a = S(p.a); p.b = S(p.b); }
  if (c.pellicola) c.pellicola.w0 = (c.pellicola.w0 ?? 1) * k;
  for (const s of Object.values(c.specie || {})) if (s.vita != null) s.vita *= k;
  for (const s of c.sorgenti || []) { s.pos = S(s.pos); if (s.t0) s.t0 *= k; }
  return c;
}
const elemento = (esp, k = 1) => { const c = centraCella(esp.cella).cella; return { nome: esp.nome, nota: esp.nota, cella: k === 1 ? c : scalaCella(c, k), posti: [] }; };

// ---------- la composizione: tanti elementi, un reticolo infinito
// composizione = { nome, nota, reticolo: { a, b }, elementi: [{ nome, nota, cella, posti: [{ pos, rot, specchio }] }] }
// Ogni elemento è un evento fisico nella sua cella; i posti dicono dove il
// centro della cella cade dentro la piastrella del reticolo, ruotato (gradi) e
// forse riflesso (l'universo riflesso, con B rovesciato). La piastrella si
// ripete all'infinito lungo a e b.
export function trasformaPosto(cella, posto, origine = [0, 0]) {
  const r = ((posto.rot ?? 0) * Math.PI) / 180, c = Math.cos(r), s = Math.sin(r), f = posto.specchio ? -1 : 1;
  const W2 = cella.larghezza / 2, H2 = cella.altezza / 2;
  // T(pos) · R(rot) · S(f, 1) · T(−W/2, −H/2)
  const a = c * f, b = s * f, cc = -s, d = c;
  return [a, b, cc, d, origine[0] + posto.pos[0] - (a * W2 + cc * H2), origine[1] + posto.pos[1] - (b * W2 + d * H2)];
}

export const COMPOSIZIONI = {
  'fiori e riempitivi': () => {
    const fi = elemento(fiore(6)), st = elemento({ ...fiore(4), nome: 'la stellina', nota: 'lo stesso evento del fiore, con quattro fotoni e in un mondo più piccolo' }, 0.42), vo = elemento({ ...voluta(), nome: 'le volute' }, 0.36);
    fi.posti.push({ pos: [0, 0], rot: 0 });
    st.posti.push({ pos: [125, 125], rot: 45 });
    vo.posti.push({ pos: [125, 0], rot: 90 }, { pos: [0, 125], rot: 0 });
    return { nome: 'fiori e riempitivi', nota: 'un fiore per piastrella; tra i fiori una stellina e due coppie di volute', reticolo: { a: [250, 0], b: [0, 250] }, elementi: [fi, st, vo] };
  },
  'volute a specchio': () => {
    const vo = elemento(voluta()), pa = elemento(palmetta(), 0.55);
    vo.posti.push({ pos: [0, 0], rot: 0 }, { pos: [110, 95], rot: 180, specchio: true });
    pa.posti.push({ pos: [110, 0], rot: 0 }, { pos: [0, 95], rot: 180 });
    return { nome: 'volute a specchio', nota: 'volute e palmette alternate, a righe capovolte', reticolo: { a: [220, 0], b: [0, 190] }, elementi: [vo, pa] };
  },
  'palmette sfalsate': () => {
    const pa = elemento(palmetta()), fi = elemento({ ...fiore(5), nome: 'il bocciolo' }, 0.4);
    pa.posti.push({ pos: [0, 0], rot: 0 });
    fi.posti.push({ pos: [100, 80], rot: 0 });
    return { nome: 'palmette sfalsate', nota: 'palmette su un reticolo sfalsato, un bocciolo tra l\'una e l\'altra', reticolo: { a: [200, 0], b: [100, 160] }, elementi: [pa, fi] };
  },
  'orbite': () => {
    const or = elemento(orbita());
    or.posti.push({ pos: [0, 0], rot: 0 }, { pos: [100, 100], rot: 90 });
    return { nome: 'orbite', nota: 'rosette di cariche intorno a masse ferme, a scacchiera', reticolo: { a: [200, 0], b: [0, 200] }, elementi: [or] };
  },
};
export const ELEMENTI = { fiore: () => fiore(6), stellina: () => fiore(4), voluta, palmetta, orbita };
export const nuovoElemento = (chi, k = 1) => elemento(ELEMENTI[chi](), k);

// spostare tutto un mondo non cambia la sua fisica: si porta il centro del
// disegno nel centro della cella, così il posto cade dove cade il motivo
export function centraCella(cella) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const t of simulaMondo(cella)) for (const p of t.punti) if (p[2]) { x0 = Math.min(x0, p[0] - p[4] / 2); x1 = Math.max(x1, p[0] + p[4] / 2); y0 = Math.min(y0, p[1] - p[4] / 2); y1 = Math.max(y1, p[1] + p[4] / 2); }
  if (!isFinite(x0)) return { cella, raggio: 1 };
  const dx = cella.larghezza / 2 - (x0 + x1) / 2, dy = cella.altezza / 2 - (y0 + y1) / 2, c = clona(cella), T = (p) => [p[0] + dx, p[1] + dy];
  for (const d of c.domini || []) { if (d.forma.centro) d.forma.centro = T(d.forma.centro); if (d.forma.punti) d.forma.punti = d.forma.punti.map(T); }
  for (const m of c.masse || []) m.pos = T(m.pos);
  for (const p of c.pareti || []) { p.a = T(p.a); p.b = T(p.b); }
  for (const s of c.sorgenti || []) s.pos = T(s.pos);
  return { cella: c, raggio: Math.max(x1 - x0, y1 - y0) / 2 };
}
