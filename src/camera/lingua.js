// lingua.js — il linguaggio dell'indirizzo come oggetto del programma (la specifica sta in LINGUA.md).
//
// Un indirizzo nomina un CILINDRO: tutti i mondi che cominciano con quel percorso, a quel tempo, in quei rami. Qui ci
// sono la sua forma scritta (una sola: quella di intreccio.js), la misura dei cilindri (quanto pesa un luogo, livello
// per livello, e che cosa si conta), la discesa a caso con quella misura dalla fonte unica del caso (eventi.js), e
// l'impronta del contenuto di un pianeta a una grana (regola 13).
//
//   leggi(testo) / scrivi(a)     la forma canonica: «cosmo 1/galassia 3/stella 53/pianeta 0/punto 12.5,-30/scala 10000
//                                @13797000000#{"disco/3/53":1}» (intreccio.js; cosmo.js scrive i rami come «1#{…}»:
//                                daVia / viaDi passano da una forma all'altra senza una terza)
//   peso(a)                      −log₂ P del cilindro, in bit, con le parti livello per livello
//   puntoACaso(seme)             la discesa dell'albero con quei pesi: deterministica dal seme
//   specialita(a)                i bit di a contro quelli tipici (la mediana di N punti a caso)
//   impronta(pianeta, grana)     la forma canonica delle grandezze del pianeta a quella grana, e il suo hash a 128 bit
//
// Leggi: Kraft (Σ 2^−ℓ(n) = 1 per un codice prefisso completo); HEALPix «nested» (Górski et al. 2005: 12·4^k pixel di
// area uguale). Dati: nessuno. PARAMETRI LIBERI (regola 2), tutti in OPZIONI e scritti nel risultato di peso():
//   codice      il peso dell'indice del cosmo: Elias γ (predefinito) o δ. Nessuna legge lo dà.
//   galassie    che cosa si conta tra le galassie di un cosmo: 'massa' in stelle (predefinito), 'stelle' (quante sono:
//               3 s per cosmo), 'uniforme'
//   pianeti     che cosa si conta tra i pianeti di un sistema: 'area' (predefinito: la superficie del pianeta e delle sue
//               lune; con il luogo uniforme in area, un punto è uniforme su tutte le superfici del sistema), 'massa',
//               'uniforme'
//   lune        se i punti stanno anche sulle lune (predefinito sì); corpi: 'area' (predefinito) o 'uniforme'
//   scala       il lato del luogo, in metri (predefinito 10 km), se l'indirizzo non lo dice: fissa l'ordine HEALPix
//   tempo       'eta' (predefinito: uniforme sulla vita della stella del luogo; senza stella, sull'età del cosmo) o
//               'adesso' (il tempo non si estrae: è l'oggi di chi guarda, peso 1, e ogni altro istante pesa 0)
//   granaTempo  la cella di tempo, in anni (predefinito 1)
// NON TORNA / MANCA (stampato da test_lingua): i rami non hanno probabilità (regola 5), quindi pesano 1; una «stella s»
// è una stella del CAMPIONE (galassie.js), che ne rappresenta `peso` vere: i bit per scegliere quella vera tra loro non
// ci sono; la misura dei punti su un pianeta è condizionata ad avere pianeti, e la costante di quel condizionamento
// (quante stelle hanno pianeti) non si calcola (servirebbe un sistema per stella): la si stima nella prova.
import { indirizzo, scrivi as scriviIntreccio, leggi as leggiIntreccio } from './intreccio.js';
import { sorgente } from './eventi.js';
import { cosmo, galassia, sistemaPigro, cosmoBase, ramiCosmo, cosmoCon, REGIONI } from './cosmo.js';
import { ANNI_OGGI } from './spazio3d.js';

export const OPZIONI = Object.freeze({ codice: 'gamma', galassie: 'massa', pianeti: 'area', lune: true, corpi: 'area', scala: 1e4, tempo: 'eta', granaTempo: 1 });
const opzioniDi = (o) => ({ ...OPZIONI, ...(o || {}) });
export const ORDINE_MASSIMO = 24; // HEALPix: 12·4²⁴ pixel stanno ancora negli interi esatti di un double (2⁵³)

// ---------- LA GRAMMATICA
// percorso := nome ('/' nome)* ; nome := ogni testo senza «/», «@», «#». Il luogo è il prefisso fatto di questi nomi, in
// quest'ordine: cosmo N (N ≥ 1) / galassia g / stella s / pianeta p [/ luna l] [/ (punto lon,lat | regione r)] [/ scala L].
// Quello che segue (o un nome che non è di questi) è il resto: le parti di un luogo che la misura non conta («buco»,
// «disco/embrione 12/incontro con 13», gli indirizzi degli eventi). Un indirizzo che non comincia da «cosmo N» è un
// indirizzo d'evento: è nella lingua, ma non è un luogo.
const LIVELLI = ['cosmo', 'galassia', 'stella', 'pianeta', 'luna', 'regione', 'punto', 'scala'];
const num = (x) => String(Number(x)); // la forma canonica di un numero: quella di String (andata e ritorno esatte)
const intero = (v, min) => /^(0|[1-9]\d*)$/.test(v) && Number(v) >= min && Number.isSafeInteger(Number(v));
const DOPO = { cosmo: ['galassia'], galassia: ['stella'], stella: ['pianeta'], pianeta: ['luna', 'punto', 'regione', 'scala'], luna: ['punto', 'regione', 'scala'], punto: ['scala'], regione: ['scala'], scala: [] };

// dall'indirizzo (di intreccio.js) alle sue parti: { cosmo, galassia, stella, pianeta, luna, regione, punto, scala, resto, tempo, rami }
export function analizza(a0) {
  const a = comeIndirizzo(a0), d = { cosmo: null, galassia: null, stella: null, pianeta: null, luna: null, regione: null, punto: null, scala: null, resto: [], tempo: a.tempo, rami: { ...a.rami } };
  let atteso = ['cosmo'], i = 0;
  for (; i < a.percorso.length; i++) {
    const nome = a.percorso[i], m = /^(\S+) (.+)$/.exec(nome), liv = m && LIVELLI.includes(m[1]) ? m[1] : null;
    if (!liv || !atteso.includes(liv)) break;
    const v = m[2];
    if (liv === 'cosmo') { if (!intero(v, 1)) throw new Error(`«${nome}»: il cosmo è un intero da 1 in su, scritto senza zeri davanti`); d.cosmo = Number(v); }
    else if (liv === 'punto') {
      const p = v.split(','), lon = Number(p[0]), lat = Number(p[1]);
      if (p.length !== 2 || !Number.isFinite(lon) || !Number.isFinite(lat) || lat < -90 || lat > 90 || lon <= -180 || lon > 180 || `${num(lon)},${num(lat)}` !== v) throw new Error(`«${nome}»: il punto è «punto lon,lat» in gradi (−180 < lon ≤ 180, −90 ≤ lat ≤ 90), con i numeri nella forma di String(Number)`);
      d.punto = [lon, lat];
    } else if (liv === 'scala') { if (!(Number(v) > 0) || !Number.isFinite(Number(v)) || num(v) !== v) throw new Error(`«${nome}»: la scala è un lato in metri, > 0, nella forma di String(Number)`); d.scala = Number(v); }
    else { if (!intero(v, 0)) throw new Error(`«${nome}»: ${liv} è un intero da 0 in su, scritto senza zeri davanti`); d[liv] = Number(v); }
    atteso = DOPO[liv];
  }
  // un nome di livello fuori posto (es. «cosmo 1/stella 5»: manca la galassia; una luna dopo il punto) non è un resto: è un errore
  if (d.cosmo != null && i < a.percorso.length) { const m = /^(\S+) /.exec(a.percorso[i]); if (m && LIVELLI.includes(m[1])) throw new Error(`«${a.percorso.slice(0, i + 1).join('/')}»: dopo «${a.percorso[i - 1]}» può venire ${atteso.length ? atteso.join(', ') : 'solo il resto'}, non ${m[1]}`); }
  if (d.cosmo == null) i = 0;
  d.resto = a.percorso.slice(i);
  return d;
}
// le parti → l'indirizzo (l'inverso di analizza)
export function componi(d) {
  const p = [];
  for (const l of ['cosmo', 'galassia', 'stella', 'pianeta', 'luna', 'regione']) if (d[l] != null) p.push(`${l} ${d[l]}`);
  if (d.punto) p.push(`punto ${num(d.punto[0])},${num(d.punto[1])}`);
  if (d.scala != null) p.push(`scala ${num(d.scala)}`);
  p.push(...(d.resto || []));
  return indirizzo(p, { tempo: d.tempo ?? null, rami: d.rami || null });
}
const comeIndirizzo = (a) => (typeof a === 'string' ? leggi(a) : a && a.percorso ? a : a && a.cosmo != null ? daVia(a) : (() => { throw new Error('un indirizzo è un testo, un indirizzo di intreccio.js o una via { cosmo, galassia, … }'); })());

// LA FORMA SCRITTA. Una sola, quella di intreccio.js: «percorso@tempo#{rami}», con i rami in ordine di chiave e senza
// gli esiti 0. leggi è severa: un testo che non è già nella forma canonica (un numero scritto in un altro modo, i rami
// in un altro ordine) non si legge, perché per la fonte del caso due testi diversi sono due luoghi diversi.
export function leggi(testo, { severo = true } = {}) {
  if (typeof testo !== 'string' || !testo.length) throw new Error('un indirizzo scritto è un testo non vuoto');
  let a; try { a = leggiIntreccio(testo); } catch (e) { throw new Error(`«${testo}» non si legge: ${e.message} (un nome non può contenere «#», «@» o «/»)`); }
  if (a.percorso.some((n) => !n.length)) throw new Error(`«${testo}»: un nome vuoto`);
  if (a.tempo != null && !Number.isFinite(a.tempo)) throw new Error(`«${testo}»: il tempo è un numero di anni dall'inizio del cosmo`);
  for (const [k, v] of Object.entries(a.rami)) if (!Number.isSafeInteger(v)) throw new Error(`«${testo}»: l'esito dell'evento «${k}» è un intero`);
  analizza(a); // (la grammatica del luogo)
  const c = scriviIntreccio(a);
  if (severo && c !== testo) throw new Error(`«${testo}» non è nella forma canonica: «${c}»`);
  return a;
}
export function scrivi(a0) { const a = comeIndirizzo(a0); analizza(a); return scriviIntreccio(a); }
export const canonico = (testo) => scrivi(leggi(testo, { severo: false }));

// DA E VERSO LA «VIA» di cosmo.js e della mappa: { cosmo, galassia, stella, pianeta, luna?, regione? }, con i rami del
// cosmo scritti nel suo numero («1#{…}», cosmo.js cosmoRamo). I rami passano dal numero all'indirizzo e ritorno.
export function daVia(via, { tempo = null, rami = null, punto = null, scala = null, resto = [] } = {}) {
  const r = { ...ramiCosmo(via.cosmo), ...(rami || {}) };
  return componi({ cosmo: cosmoBase(via.cosmo), galassia: via.galassia, stella: via.stella, pianeta: via.pianeta, luna: via.luna, regione: via.regione, punto, scala, resto, tempo, rami: r });
}
export function viaDi(a0) {
  const d = analizza(a0), v = {}; if (d.cosmo == null) return v;
  v.cosmo = Object.keys(d.rami).length ? cosmoCon(d.cosmo, d.rami) : d.cosmo;
  for (const l of ['galassia', 'stella', 'pianeta', 'luna', 'regione']) if (d[l] != null) v[l] = d[l];
  return v;
}

// ---------- HEALPix «nested» (Górski et al. 2005; l'algoritmo è quello di healpix_base): z = cos θ, φ in [0, 2π)
const JRLL = [2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4], JPLL = [1, 3, 5, 7, 0, 2, 4, 6, 1, 3, 5, 7];
function xy2pix(ix, iy, k) { let p = 0, b = 1; for (let i = 0; i < k; i++, b *= 4) p += ((ix >> i) & 1) * b + ((iy >> i) & 1) * 2 * b; return p; }
function pix2xy(p, k) { let ix = 0, iy = 0; for (let i = 0; i < k; i++) { const d = p % 4; p = Math.floor(p / 4); ix |= (d & 1) << i; iy |= (d >> 1) << i; } return [ix, iy]; }
export function ang2pixNest(k, z, phi) {
  const ns = 2 ** k, za = Math.abs(z); let tt = (phi / (Math.PI / 2)) % 4; if (tt < 0) tt += 4;
  let face, ix, iy;
  if (za <= 2 / 3) {
    const t1 = ns * (0.5 + tt), t2 = ns * (z * 0.75), jp = Math.floor(t1 - t2), jm = Math.floor(t1 + t2), ifp = Math.floor(jp / ns), ifm = Math.floor(jm / ns);
    face = ifp === ifm ? (ifp | 4) : ifp < ifm ? ifp : ifm + 8; ix = jm & (ns - 1); iy = ns - (jp & (ns - 1)) - 1;
  } else {
    const ntt = Math.min(3, Math.floor(tt)), tp = tt - ntt, tmp = ns * Math.sqrt(3 * (1 - za));
    const jp = Math.min(ns - 1, Math.floor(tp * tmp)), jm = Math.min(ns - 1, Math.floor((1 - tp) * tmp));
    if (z >= 0) { face = ntt; ix = ns - jm - 1; iy = ns - jp - 1; } else { face = ntt + 8; ix = jp; iy = jm; }
  }
  return face * 4 ** k + xy2pix(ix, iy, k);
}
// il centro del pixel: [z, φ]
export function pix2angNest(k, pix) {
  const ns = 2 ** k, npf = 4 ** k, face = Math.floor(pix / npf), [ix, iy] = pix2xy(pix - face * npf, k), jr = JRLL[face] * ns - ix - iy - 1;
  let nr, z;
  if (jr < ns) { nr = jr; z = 1 - (nr * nr) / (3 * ns * ns); } else if (jr > 3 * ns) { nr = 4 * ns - jr; z = (nr * nr) / (3 * ns * ns) - 1; } else { nr = ns; z = ((2 * ns - jr) * 2) / (3 * ns); }
  let t = JPLL[face] * nr + ix - iy; if (t < 0) t += 8 * nr;
  return [z, (Math.PI / 4) * (t / nr)];
}
// dal punto (gradi) al pixel e ritorno; il punto si scrive con le cifre che bastano a ritrovare lo stesso pixel
const GR = 180 / Math.PI;
export const pixelDi = (k, lon, lat) => ang2pixNest(k, Math.sin(lat / GR), ((lon / GR) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI));
export function puntoDelPixel(k, pix) {
  const [z, phi] = pix2angNest(k, pix); let lon = phi * GR; if (lon > 180) lon -= 360; const lat = Math.asin(Math.max(-1, Math.min(1, z))) * GR;
  for (let d = Math.max(0, Math.ceil(Math.log10((8 * 2 ** k) / 58.6))); d <= 17; d++) {
    const L = Number(lon.toFixed(d)) || 0, B = Number(lat.toFixed(d)) || 0, Lc = L <= -180 ? L + 360 : L;
    if (pixelDi(k, Lc, B) === pix) return [Lc, B];
  }
  return [lon, lat];
}
// l'ordine HEALPix di un luogo di lato L su un corpo di raggio R: il primo il cui pixel (lato R·√(π/3)/2^k) non supera L
export const ordineDi = (R, L) => Math.max(0, Math.min(ORDINE_MASSIMO, Math.ceil(Math.log2((R * Math.sqrt(Math.PI / 3)) / L))));

// ---------- L'INDICE DEL COSMO: un codice prefisso completo (Kraft: Σ 2^−ℓ = 1). LIBERO.
const lg = (n) => { let k = 0; while (n >= 2 ** (k + 1)) k++; return k; }; // ⌊log₂ n⌋, esatto
export const lunghezzaGamma = (n) => 2 * lg(n) + 1;
export const lunghezzaDelta = (n) => { const L = lg(n); return L + 2 * lg(L + 1) + 1; };
export const lunghezzaCodice = (n, codice = 'gamma') => (codice === 'delta' ? lunghezzaDelta(n) : lunghezzaGamma(n));
// un intero dal codice: il gruppo k = ⌊log₂ n⌋ ha peso 2^−(k+1) (γ) o 2^−ℓγ(k+1) (δ), poi uniforme nel gruppo. Solo
// raddoppi e parti intere (esatti). Il cosmo deve stare negli interi esatti (n < 2⁵³): con δ la coda oltre (circa il 2%)
// si riestrae, e lo si dice (fuori).
function gruppoGamma(u) { let k = 0; while (u < 0.5 && k < 52) { u *= 2; k++; } return k; }
function interoDalCodice(serie, codice) {
  for (let t = 0; t < 64; t++) {
    const u = serie(3 * t), v = serie(3 * t + 1);
    let k = gruppoGamma(u);
    if (codice === 'delta') { const m = 2 ** k + Math.floor(serie(3 * t + 2) * 2 ** k); if (m - 1 > 52) continue; k = m - 1; }
    return { n: 2 ** k + Math.floor(v * 2 ** k), tentativi: t + 1 };
  }
  return { n: 1, tentativi: 64 };
}

// ---------- I NUCLEI PER LIVELLO (O5): per ogni livello, i figli con il loro peso e che cosa si conta
const memo = new Map(); const ricorda = (k, f) => { if (!memo.has(k)) { if (memo.size > 256) memo.delete(memo.keys().next().value); memo.set(k, f()); } return memo.get(k); };
const cosmoDi = (d) => (Object.keys(d.rami).length ? cosmoCon(d.cosmo, d.rami) : d.cosmo);
const somma = (v) => v.reduce((s, x) => s + x, 0);
const normalizza = (pesi, nomi) => { const W = somma(pesi); return pesi.map((w, i) => ({ nome: nomi(i), p: W > 0 ? w / W : 0, w })); };

const NUCLEI = {
  galassia(d, O) {
    const nc = cosmoDi(d), C = cosmo(nc);
    const voci = ricorda(`g|${nc}|${O.galassie}`, () => normalizza(C.galassie.map((G, i) => (O.galassie === 'uniforme' ? 1 : O.galassie === 'stelle' ? galassia(nc, i).stelleVere : G.forma.massaStelle)), (i) => i));
    return { voci, conta: O.galassie === 'uniforme' ? 'le galassie del campione del cosmo, una uguale all\'altra' : O.galassie === 'stelle' ? 'le stelle vere di ogni galassia (galassie.js stelleVere)' : 'la massa in stelle di ogni galassia (galassie.js massaStelle)' };
  },
  stella(d) {
    const nc = cosmoDi(d), Gx = galassia(nc, d.galassia);
    return { voci: ricorda(`s|${nc}|${d.galassia}`, () => normalizza(Gx.stelle.map((s) => s.peso), (i) => i)), conta: `le stelle vere che ogni stella del campione rappresenta (galassie.js peso: ~${Math.round(Gx.pesoCampione).toExponential(1)}; le ultime supernove 1)`, nota: 'condizionata ad avere pianeti se si scende più giù: la costante (quante stelle hanno pianeti) non è calcolata' };
  },
  pianeta(d, O) {
    const nc = cosmoDi(d), S = sistemaPigro(nc, d.galassia, d.stella), lune = (P) => (O.lune ? P.lune || [] : []);
    const w = (P) => (O.pianeti === 'uniforme' ? 1 : O.pianeti === 'massa' ? P.massaKg + somma(lune(P).map((l) => l.massaKg || 0)) : P.raggioM ** 2 + somma(lune(P).map((l) => (l.raggioM || 0) ** 2)));
    return { voci: ricorda(`p|${nc}|${d.galassia}|${d.stella}|${O.pianeti}|${O.lune}`, () => normalizza(S.pianeti.map(w), (i) => i)), conta: O.pianeti === 'uniforme' ? 'i pianeti del sistema, uno uguale all\'altro' : O.pianeti === 'massa' ? `la massa di ogni pianeta${O.lune ? ' con le sue lune' : ''}` : `la superficie di ogni pianeta${O.lune ? ' e delle sue lune' : ''} (4πR²)`, S };
  },
  // il corpo dentro il sistema di un pianeta: il pianeta stesso (nome null) o una sua luna
  corpo(d, O) {
    const P = sistemaPigro(cosmoDi(d), d.galassia, d.stella).pianeti[d.pianeta], L = O.lune ? P.lune || [] : [];
    const w = (c) => (O.corpi === 'uniforme' ? 1 : (c.raggioM || 0) ** 2);
    const voci = normalizza([w(P), ...L.map(w)], (i) => (i === 0 ? null : L[i - 1].id));
    return { voci, conta: O.lune ? (O.corpi === 'uniforme' ? 'il pianeta e le sue lune, uno uguale all\'altro' : 'la superficie del pianeta e di ogni luna') : 'solo il pianeta (lune escluse)', P, L };
  },
};
const raggioDelCorpo = (d, O) => { const { P } = NUCLEI.corpo(d, O); if (d.luna == null) return P.raggioM; const l = (P.lune || []).find((x) => x.id === d.luna); return l ? l.raggioM : NaN; };
const nascitaDi = (d) => (d.stella != null ? ANNI_OGGI - sistemaPigro(cosmoDi(d), d.galassia, d.stella).stella.eta : 0);

// ---------- IL PESO DI UN CILINDRO
// → { bit: −log₂P, P, parti: [{ livello, nome, p, bit, conta }], completo, fuori, opzioni }. Le parti si sommano (in bit):
// P è il prodotto dei nuclei lungo il percorso (O7). Un livello che non c'è nell'indirizzo non costa niente (il
// cilindro lo contiene tutto).
export function peso(a0, opzioni = {}) {
  const O = opzioniDi(opzioni), a = comeIndirizzo(a0), d = analizza(a), parti = [];
  const metti = (livello, nome, p, conta, extra = {}) => parti.push({ livello, nome, p, bit: p > 0 ? -Math.log2(p) : Infinity, conta, ...extra });
  const fine = (nota) => { const bit = somma(parti.map((x) => x.bit)); return { bit, P: 2 ** -bit, parti, completo: !d.resto.length, fuori: d.resto, nota, opzioni: O, testo: scriviIntreccio(a) }; };
  if (d.cosmo == null) return { ...fine('non è un luogo: è un indirizzo d\'evento (non comincia da «cosmo N»); la misura non lo conta'), bit: NaN, P: NaN };
  metti('cosmo', `cosmo ${d.cosmo}`, 2 ** -lunghezzaCodice(d.cosmo, O.codice), `l'indice del cosmo con il codice di Elias ${O.codice === 'delta' ? 'δ' : 'γ'}: 2^−ℓ(n), ℓ(${d.cosmo}) = ${lunghezzaCodice(d.cosmo, O.codice)} (LIBERO: nessuna legge dà una frequenza dei cosmi)`);
  if (d.galassia != null) { const K = NUCLEI.galassia(d, O), v = K.voci[d.galassia]; metti('galassia', `galassia ${d.galassia}`, v ? v.p : 0, K.conta, v ? {} : { nota: `il cosmo ha ${K.voci.length} galassie` }); }
  if (d.stella != null) { const K = NUCLEI.stella(d, O), v = K.voci[d.stella]; metti('stella', `stella ${d.stella}`, v ? v.p : 0, K.conta, { nota: v ? K.nota : `la galassia ha ${K.voci.length} stelle nel campione` }); }
  if (d.pianeta != null) { const K = NUCLEI.pianeta(d, O), v = K.voci[d.pianeta]; metti('pianeta', `pianeta ${d.pianeta}`, v ? v.p : 0, K.conta, v ? {} : { nota: `il sistema ha ${K.voci.length} pianeti` }); }
  const suCorpo = d.pianeta != null && (d.luna != null || d.punto || d.regione != null);
  if (suCorpo && d.regione == null) { const K = NUCLEI.corpo(d, O), v = K.voci.find((x) => x.nome === d.luna); metti('corpo', d.luna == null ? 'il pianeta stesso' : `luna ${d.luna}`, v ? v.p : 0, K.conta); }
  if (d.regione != null) metti('luogo', `regione ${d.regione}`, d.regione < REGIONI ? 1 / REGIONI : 0, `le ${REGIONI} regioni della magnetosfera della biblioteca (cosmo.js), uguali (LIBERO)`);
  if (d.punto) {
    const L = d.scala ?? O.scala, R = raggioDelCorpo(d, O), k = ordineDi(R, L);
    metti('luogo', `punto ${d.punto.join(',')}`, 1 / (12 * 4 ** k), `l'area sulla superficie: il pixel HEALPix nested di ordine ${k} (12·4^${k} di area uguale, lato ≈ ${(R * Math.sqrt(Math.PI / 3) / 2 ** k).toPrecision(3)} m, per una scala di ${L} m${d.scala == null ? ' (predefinita: l\'indirizzo non la dice)' : ''})`, { ordine: k, pixel: pixelDi(k, d.punto[0], d.punto[1]) });
  }
  if (d.scala != null) metti('scala', `scala ${d.scala}`, 1, 'la scala non si estrae: è la grana a cui si guarda, scelta da chi guarda (peso 1); fissa il cilindro del luogo');
  // il tempo
  if (O.tempo === 'adesso') metti('tempo', d.tempo == null ? 'adesso' : `@${d.tempo}`, d.tempo == null || Math.abs(d.tempo - ANNI_OGGI) < O.granaTempo / 2 ? 1 : 0, 'il tempo non si estrae: è l\'oggi di chi guarda (peso 1; ogni altro istante pesa 0). LIBERO');
  else {
    const nascita = nascitaDi(d), eta = ANNI_OGGI - nascita, dt = O.granaTempo, t = d.tempo ?? ANNI_OGGI - dt / 2, j = Math.floor((t - nascita) / dt);
    const p = t < nascita || t > ANNI_OGGI ? 0 : Math.min(dt, eta - j * dt) / eta;
    metti('tempo', d.tempo == null ? 'adesso' : `@${d.tempo}`, p, `uniforme sulla vita ${d.stella != null ? 'della stella del luogo' : 'del cosmo'} (${eta.toPrecision(4)} anni), a celle di ${dt} anni (LIBERO: su un tempo infinito non c'è uniforme; i «momenti d'osservatore» non si contano perché nessun modulo sa ancora dire dove c'è un osservatore)`, p ? {} : { nota: t < nascita ? 'prima che la stella nascesse' : 'nel futuro: lo stato si sa solo fino a oggi' });
  }
  const nr = Object.keys(d.rami).length;
  metti('rami', nr ? `${nr} ${nr === 1 ? 'evento' : 'eventi'} andati diversamente` : 'nessun ramo', 1, 'MANCA: gli esiti degli eventi non hanno probabilità (regola 5, C4): ogni ramo pesa 1, dichiarato');
  return fine(d.resto.length ? `il resto «${d.resto.join('/')}» non è un luogo della grammatica: non è contato` : null);
}

// ---------- LA DISCESA A CASO (O7 come campionamento): ogni livello con il peso di peso(), dalla fonte unica del caso
// sotto l'indirizzo «lingua/punto a caso/<seme>», un evento per livello con lo stesso nome qualunque sia il prefisso: così
// puntoACaso(s, { da: un inizio di puntoACaso(s) }) è puntoACaso(s) (la discesa condizionata a un luogo noto).
// opzioni: quelle di peso, più `da` (un inizio di indirizzo già fissato) e `fino` (il livello a cui fermarsi: 'cosmo',
// 'galassia', 'stella', 'pianeta', 'corpo', 'luogo', 'tempo').
const ORDINE = ['cosmo', 'galassia', 'stella', 'pianeta', 'corpo', 'luogo', 'tempo'];
const scegli = (voci, u) => { const W = somma(voci.map((v) => v.p)); let s = 0; for (const v of voci) { s += v.p; if (u * W < s) return v; } return voci.filter((v) => v.p > 0).at(-1); };
export function puntoACaso(seme, opzioni = {}) {
  const O = opzioniDi(opzioni), c = sorgente(`lingua/punto a caso/${seme}`), fino = ORDINE.indexOf(O.fino || 'tempo'), arriva = (l) => ORDINE.indexOf(l) <= fino;
  const d = O.da ? analizza(comeIndirizzo(O.da)) : { ...analizza(indirizzo(['cosmo 1'])), cosmo: null }; // (senza inizio: tutto da estrarre)
  const note = [];
  if (d.cosmo == null) { const r = interoDalCodice(c.serie('cosmo'), O.codice); d.cosmo = r.n; if (r.tentativi > 1) note.push(`indice del cosmo riestratto ${r.tentativi - 1} volte (oltre 2⁵³)`); }
  if (arriva('galassia') && d.galassia == null) d.galassia = scegli(NUCLEI.galassia(d, O).voci, c('galassia')).nome;
  if (arriva('stella') && d.stella == null) {
    const voci = NUCLEI.stella(d, O).voci;
    if (!arriva('pianeta')) d.stella = scegli(voci, c('stella/tentativo 0')).nome;
    else { for (let t = 0; t < 32 && d.stella == null; t++) { const s = scegli(voci, c(`stella/tentativo ${t}`)).nome; if (sistemaPigro(cosmoDi(d), d.galassia, s).pianeti.length) d.stella = s; else note.push(`stella ${s} senza pianeti: riestratta`); }
      if (d.stella == null) return { indirizzo: null, testo: null, bit: Infinity, note: [...note, 'nessuna stella con pianeti in 32 tentativi'] }; }
  }
  if (arriva('pianeta') && d.pianeta == null) d.pianeta = scegli(NUCLEI.pianeta(d, O).voci, c('pianeta')).nome;
  if (arriva('corpo') && d.luna == null && d.punto == null && d.regione == null) { const v = scegli(NUCLEI.corpo(d, O).voci, c('corpo')); d.luna = v.nome; }
  if (arriva('luogo') && d.punto == null && d.regione == null) {
    const L = d.scala ?? O.scala, k = ordineDi(raggioDelCorpo(d, O), L), s = c.serie('luogo');
    let pix = Math.floor(s(0) * 12); for (let i = 1; i <= k; i++) pix = pix * 4 + Math.floor(s(i) * 4); // l'albero HEALPix, un figlio su quattro per livello
    d.punto = puntoDelPixel(k, pix); d.scala = L;
  }
  if (arriva('tempo') && d.tempo == null && O.tempo !== 'adesso') {
    const nascita = nascitaDi(d), eta = ANNI_OGGI - nascita, dt = O.granaTempo, M = eta / dt, j = Math.min(Math.ceil(M) - 1, Math.floor(c('tempo') * M));
    d.tempo = nascita + (j * dt + Math.min(eta, (j + 1) * dt)) / 2;
  }
  const a = componi(d), P = peso(a, O);
  return { indirizzo: a, testo: scriviIntreccio(a), bit: P.bit, peso: P, note };
}

// ---------- QUANTO È SPECIALE UN INDIRIZZO: i suoi bit contro quelli di N punti a caso con le stesse opzioni
export function specialita(a0, { N = 100, seme = 'specialità', ...opzioni } = {}) {
  const O = opzioniDi(opzioni), bit = peso(a0, O).bit, campione = [];
  for (let i = 0; i < N; i++) { const r = puntoACaso(`${seme}/${i}`, O); if (r.indirizzo) campione.push(r.bit); }
  campione.sort((x, y) => x - y);
  const mediana = campione.length ? (campione[(campione.length - 1) >> 1] + campione[campione.length >> 1]) / 2 : NaN;
  return { bit, mediana, scarto: bit - mediana, quantile: campione.filter((b) => b <= bit).length / Math.max(1, campione.length), N: campione.length, campione,
    dice: !(bit === bit) ? 'non è un luogo' : bit > mediana ? `più speciale del tipico di ${(bit - mediana).toFixed(1)} bit` : `più comune del tipico di ${(mediana - bit).toFixed(1)} bit` };
}

// ---------- LA DISTANZA TRA RAMI (O12, di lato): quanti eventi sono andati diversamente tra due indirizzi dello stesso
// luogo. Il peso di ciascuno manca (C4): la distanza è il conteggio, e lo dice.
export function distanzaRami(a0, b0) {
  const a = comeIndirizzo(a0), b = comeIndirizzo(b0), chiavi = new Set([...Object.keys(a.rami), ...Object.keys(b.rami)]), diversi = [...chiavi].filter((k) => (a.rami[k] || 0) !== (b.rami[k] || 0)).sort();
  return { eventi: diversi.length, diversi, stessoLuogo: a.percorso.join('/') === b.percorso.join('/'), peso: null, nota: 'il peso degli esiti manca (regola 5): la distanza è il numero di eventi diversi' };
}

// ---------- L'IMPRONTA DEL CONTENUTO (O8, regola 13), prima versione: per un pianeta
// La forma canonica delle grandezze del pianeta alla grana g (un intero ≥ 0; DICHIARATA, e LIBERA la scelta dei campi):
//   · grandezze positive (massa, raggio, semiasse, anno, giorno, temperatura, pressione, masse delle lune): la casella
//     ⌊2^g·log₂ x⌋ (larghezza 2^−g in log₂: un fattore 2 a g = 0, lo 0,3% a g = 8)
//   · frazioni in [0, 1] (eccentricità, albedo, composizione): ⌊2^g·x⌋; angoli (obliquità): ⌊2^g·obliquità/180°⌋
//   · categorie, a ogni grana: tipo, stato dell'acqua, giro bloccato, retrogrado, regime della crosta, gas tenuti, anelli,
//     numero di lune. Le lune sono un insieme: si mettono in ordine di massa (la forma canonica per isomorfismo)
// Le caselle a grana g+1 stanno dentro quelle a grana g (⌊2y⌋/2 → ⌊y⌋: moltiplicare per 2 è esatto), quindi uguali a
// grana fine ⇒ uguali a grana grossa (O3). Non entrano l'indirizzo, la fase dell'orbita né l'ora: è il contenuto.
// Hash: FNV-1a a 128 bit (Fowler, Noll, Vo) sui byte UTF-8 della forma: non crittografico, LIBERO.
const qlog = (x, g) => (x > 0 && Number.isFinite(x) ? Math.floor(Math.log2(x) * 2 ** g) : x === 0 ? 'zero' : x === Infinity ? 'inf' : x == null || x !== x ? '-' : `neg${qlog(-x, g)}`);
const q01 = (x, g) => (x == null || x !== x ? '-' : Math.floor(x * 2 ** g));
export function formaCanonica(P, g = 8) {
  if (!P || P.raggioM == null) throw new Error('impronta: serve un pianeta di sistema() (o il suo indirizzo)');
  const cl = P.clima || {}, lune = [...(P.lune || [])].sort((x, y) => (y.massaKg || 0) - (x.massaKg || 0)), comp = P.composizione || {};
  const campi = [
    ['grana', g], ['tipo', P.tipo], ['acqua', cl.acqua ?? '-'], ['bloccato', !!P.bloccato], ['retrogrado', !!P.retrogrado], ['crosta', P.interno?.tettonica ?? '-'],
    ['tenuti', [...(cl.tenuti || [])].sort().join('+')], ['anelli', !!(P.anello && P.anello.massaKg > 0)], ['lune', lune.length],
    ['massa', qlog(P.massaKg, g)], ['raggio', qlog(P.raggioM, g)], ['semiasse', qlog(P.aM, g)], ['anno', qlog(P.anno, g)], ['giorno', qlog(Math.abs(P.giorno), g)],
    ['T', qlog(cl.T, g)], ['pressione', qlog(cl.pressione, g)], ['eccentricita', q01(P.eccentricita, g)], ['albedo', q01(cl.albedo, g)], ['obliquita', q01((P.obliquita ?? NaN) / 180, g)],
    ['composizione', Object.keys(comp).sort().map((k) => `${k}:${q01(comp[k], g)}`).join('+')], ['masseLune', lune.map((l) => qlog(l.massaKg, g)).join('+')],
  ];
  return { testo: campi.map(([k, v]) => `${k}=${v}`).join(';'), campi: Object.fromEntries(campi) };
}
const FNV_BASE = 0x6c62272e07bb014262b821756295c58dn, FNV_PRIMO = 0x0000000001000000000000000000013bn, M128 = (1n << 128n) - 1n;
export function hash128(testo) { let h = FNV_BASE; for (const b of new TextEncoder().encode(testo)) h = ((h ^ BigInt(b)) * FNV_PRIMO) & M128; return h.toString(16).padStart(32, '0'); }
const pianetaDi = (x) => { if (x && x.raggioM != null) return x; const d = analizza(comeIndirizzo(x)); if (d.pianeta == null) throw new Error('impronta: l\'indirizzo deve arrivare al pianeta'); return sistemaPigro(cosmoDi(d), d.galassia, d.stella).pianeti[d.pianeta]; };
export function impronta(stato, grana = 8) { const f = formaCanonica(pianetaDi(stato), grana); return { hash: hash128(f.testo), forma: f.testo, campi: f.campi, grana }; }
export const uguali = (a, b, grana = 8) => impronta(a, grana).hash === impronta(b, grana).hash;
