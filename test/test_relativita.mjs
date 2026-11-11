// test_relativita.mjs — la relatività nel modello (src/camera/relativita.js): il ritmo del tempo, la sezione e il cono,
// i buchi neri, le geodetiche. Due specie di righe:
//   ✓  PROVE: coerenza interna (una legge contro un'altra via di calcolo, un limite esatto): se cadono la catena si ferma;
//   ·  RISCONTRI con il mondo vero, con l'intervallo deciso PRIMA (l'errore della misura, o il motivo scritto accanto):
//      se uno non rientra si stampa «≠ NON TORNA» e si va avanti. Le soglie non si allargano e i casi non si scelgono:
//      i corpi veri sono quelli che sono, e nel modello si prende il primo indirizzo che ha ciò che serve.
import assert from 'node:assert/strict';
import * as R from '../src/camera/relativita.js';
import { COSTANTI, ANNO, MSOLE, RSOLE, LSOLE, UA, raggioNanaBianca, raggioNeutroni, massaChandrasekhar } from '../src/camera/leggi.js';
import { osservatore } from '../src/camera/sezione.js';
import { sorgente } from '../src/camera/eventi.js';
import * as ST from '../src/camera/stelle.js';
import * as GA from '../src/camera/galassie.js';
import * as CO from '../src/camera/cosmo.js';
import * as S3 from '../src/camera/spazio3d.js';

let ok = 0; const T0 = performance.now(), nonTorna = [], tabella = [];
const prova = (nome, f) => { f(); ok++; console.log('  ✓', nome); };
const n = (x, c = 4) => (!Number.isFinite(x) ? String(x) : x !== 0 && (Math.abs(x) >= 1e5 || Math.abs(x) < 1e-3) ? x.toExponential(c - 1).replace('.', ',').replace('e+', 'e') : String(+x.toPrecision(c)).replace('.', ','));
const tra = (x, a, b, che) => assert.ok(x >= a && x <= b, `${che}: ${x} (atteso tra ${a} e ${b})`);
const vicino = (x, y, rel, che) => assert.ok(Math.abs(x - y) <= rel * Math.abs(y), `${che}: ${x} contro ${y} (entro ${rel})`);
// un riscontro col vero: stampa, registra per la tabella finale, non ferma
const confronta = (che, x, a, b, vero, unita = '') => { const d = x >= a && x <= b; console.log(`      ${d ? '·' : '≠ NON TORNA:'} ${che}: ${n(x)}${unita ? ' ' + unita : ''} (vero: ${vero}; chiesto tra ${n(a)} e ${n(b)})`); tabella.push([che, `${n(x)}${unita ? ' ' + unita : ''}`, vero, d ? 'torna' : 'NON TORNA']); if (!d) nonTorna.push(`${che}: ${n(x)} (vero ${vero})`); return d; };
const G = COSTANTI.G, C = COSTANTI.c, C2 = C * C, PI = Math.PI, GIORNO = 86400, SEC = 206264.806, MAS = SEC * 1e3, KPC = 3.0857e19, MPC = 1e3 * KPC, AL = C * ANNO;
const TERRA = { massa: 5.972e24, raggio: 6.371e6 }, rg = R.raggioGravitazionale;

console.log('\n— 1. IL RITMO DEL TEMPO —');
prova('campo debole e Schwarzschild esatto coincidono lontano; orbita circolare = √(1 − 3GM/rc²); più velocità si sommano come vettori', () => {
  const a = R.ritmo([{ massa: MSOLE, distanza: UA }]), b = R.ritmo([{ massa: MSOLE, distanza: UA }], { esatto: false });
  vicino(a.scarto, b.scarto, 1e-7, 'esatto e debole a 1 UA'); vicino(a.scarto, (G * MSOLE) / (C2 * UA), 1e-7, 'GM/rc²');
  // vicino a un oggetto compatto: fermo a 3 r_s, e in orbita circolare a 10 r_g con la velocità che misura chi sta fermo lì
  const M = 10 * MSOLE, r = 10 * rg(M), vloc = Math.sqrt((G * M) / (r - 2 * rg(M)));
  vicino(R.ritmo([{ massa: M, distanza: 6 * rg(M) }]).ritmo, Math.sqrt(1 - 1 / 3), 1e-12, 'fermo a 3 r_s');
  vicino(R.ritmo([{ massa: M, distanza: r, velocita: vloc }]).ritmo, R.ritmoInOrbita(M, r), 1e-12, 'orbita a 10 r_g'); vicino(R.ritmoInOrbita(M, r), Math.sqrt(0.7), 1e-12, '√(1 − 3/10)');
  assert.equal(R.ritmo([{ massa: M, distanza: 1.9 * rg(M) }]).dentroOrizzonte, true);
  // due velocità perpendicolari: i quadrati si sommano; parallele: (v1 + v2)²
  const p = R.ritmo([{ potenziale: 0, velocita: [3e4, 0, 0] }, { potenziale: 0, velocita: [0, 4e4, 0] }]).scarto, q = R.ritmo([{ potenziale: 0, velocita: [3e4, 0, 0] }, { potenziale: 0, velocita: [4e4, 0, 0] }]).scarto;
  vicino(p, 25e8 / (2 * C2), 1e-6, 'perpendicolari'); vicino(q, 49e8 / (2 * C2), 1e-6, 'parallele');
  // dentro una sfera omogenea: il campo debole e la soluzione interna di Schwarzschild coincidono per un corpo poco compatto
  const dc = R.ritmo([{ massa: TERRA.massa, distanza: 0, raggio: TERRA.raggio }]).scarto; vicino(dc, 1 - R.ritmoDentroOmogenea(TERRA.massa, TERRA.raggio, 0), 1e-6, 'centro di una Terra omogenea'); vicino(dc, (1.5 * G * TERRA.massa) / (C2 * TERRA.raggio), 1e-6, '3GM/2Rc²');
});
const sTerra = R.ritmo([{ nome: 'Terra', massa: TERRA.massa, distanza: TERRA.raggio }]).scarto;
// L_G = 6,969290134·10⁻¹⁰ è la costante che DEFINISCE il tempo terrestre rispetto a quello geocentrico (UAI 2000, ris. B1.9 [R]):
// il potenziale del geoide, rotazione e schiacciamento compresi; la sfera ferma di raggio medio ne differisce dello 0,13%
confronta('superficie della Terra, 1 − dτ/dt', sTerra, 6.969290134e-10 * 0.997, 6.969290134e-10 * 1.003, 'L_G = 6,9693e-10 (UAI); sfera ferma: entro 0,3%');
const aGPS = 2.656175e7, sGPS = R.ritmo([{ nome: 'Terra', massa: TERRA.massa, distanza: aGPS, velocita: Math.sqrt((G * TERRA.massa) / aGPS) }]).scarto;
// gli orologi GPS sono costruiti più lenti di 4,4647·10⁻¹⁰ (38,575 µs/giorno) perché in orbita vadano giusti [R]
confronta('orologio GPS rispetto al suolo', (sTerra - sGPS) * GIORNO * 1e6, 38.575 * 0.995, 38.575 * 1.005, '+38,575 (di progetto); entro 0,5%', 'µs/giorno');
console.log(`        (di cui gravità +${n(((G * TERRA.massa) / C2) * (1 / TERRA.raggio - 1 / aGPS) * GIORNO * 1e6)} e velocità −${n(((G * TERRA.massa) / (2 * aGPS * C2)) * GIORNO * 1e6)} µs/giorno)`);
const sSole = R.ritmo([{ nome: 'Sole', massa: MSOLE, distanza: RSOLE }]);
confronta('superficie del Sole, 1 − dτ/dt', sSole.scarto, 2.10e-6, 2.14e-6, '2,12e-6');
{ // la riga solare vista dalla Terra: il ritmo alla superficie del Sole contro quello di chi sta a terra, a 1 UA dal Sole
  const qui = R.ritmo([{ massa: MSOLE, distanza: UA }, { massa: TERRA.massa, distanza: TERRA.raggio }]);
  confronta('redshift gravitazionale del Sole visto da terra', R.redshiftGravitazionale(sSole.ritmo, qui.ritmo) * C, 638 - 6, 638 + 6, '638 ± 6 m/s (González Hernández et al. 2020 [R]); previsto 633', 'm/s'); }
{ // l'orbita della Terra: 1 − ⟨dTCG/dTCB⟩ = L_C = 1,48082686741·10⁻⁸ (UAI 2006, ris. B3 [R]: Sole e pianeti); qui solo il Sole, orbita circolare
  const s = R.ritmo([{ nome: 'Sole', massa: MSOLE, distanza: UA, velocita: Math.sqrt((G * MSOLE) / UA) }]).scarto;
  confronta('il centro della Terra in orbita attorno al Sole', s, 1.48082686741e-8 * 0.995, 1.48082686741e-8 * 1.005, 'L_C = 1,4808e-8 (UAI); solo Sole: entro 0,5%'); }
{ // Sirio B: massa dinamica 1,018 ± 0,011 M☉ (Bond et al. 2017 [R]); il raggio è quello del MODELLO (leggi.js raggioNanaBianca)
  const M = 1.018 * MSOLE, Rm = raggioNanaBianca(M), z = R.redshiftGravitazionale(R.ritmoFermo(M, Rm));
  confronta('nana bianca (Sirio B, raggio del modello): redshift', (z * C) / 1e3, 80.65 - 2 * 0.77, 80.65 + 2 * 0.77, '80,65 ± 0,77 km/s (Joyce et al. 2018 [V]); ±2σ', 'km/s');
  console.log(`        (raggio del modello ${n(Rm / 1e3)} km = ${n(Rm / RSOLE)} R☉; 1 − dτ/dt = ${n(1 - R.ritmoFermo(M, Rm))})`);
  const Mb = 0.6 * MSOLE; console.log(`        nana bianca tipica di 0,6 M☉ (modello: ${n(raggioNanaBianca(Mb) / 1e3)} km): 1 − dτ/dt = ${n(1 - R.ritmoFermo(Mb, raggioNanaBianca(Mb)))}`); }
{ // stella di neutroni: PSR J0030+0451, M = 1,44 M☉, R = 13,02 (+1,24 −1,06) km (Miller et al. 2019, NICER [V])
  const M = 1.44 * MSOLE, Rm = raggioNeutroni(M);
  confronta('stella di neutroni di 1,44 M☉: raggio del modello', Rm / 1e3, 13.02 - 1.06, 13.02 + 1.24, '13,02 +1,24 −1,06 km (NICER [V])', 'km');
  console.log(`        superficie con il raggio misurato: dτ/dt = ${n(R.ritmoFermo(M, 13.02e3))} (z = ${n(R.redshiftGravitazionale(R.ritmoFermo(M, 13.02e3)))}); con quello del modello: dτ/dt = ${n(R.ritmoFermo(M, Rm))}`);
  const f = ST.fine(15); console.log(`        il resto di una stella di 15 M☉ nel modello: ${f.tipo}, ${n(f.massa)} M☉, ${n(f.raggio / 1e3)} km → dτ/dt alla superficie = ${n(R.ritmoFermo(f.massa * MSOLE, f.raggio))}`); }
// il centro della Terra: il profilo di densità misurato dai terremoti (PREM: Dziewonski & Anderson 1981 [R], x = r/6371 km, g/cm³)
const PREM = (r) => { const x = r / 6.371e6, k = r / 1e3; return 1e3 * (k < 1221.5 ? 13.0885 - 8.8381 * x * x : k < 3480 ? 12.5815 - 1.2638 * x - 3.6426 * x * x - 5.5281 * x ** 3 : k < 5701 ? 7.9565 - 6.4761 * x + 5.5283 * x * x - 3.0807 * x ** 3 : k < 5771 ? 5.3197 - 1.4836 * x : k < 5971 ? 11.2494 - 8.0298 * x : k < 6151 ? 7.1089 - 3.8045 * x : k < 6346.6 ? 2.691 + 0.6924 * x : k < 6356 ? 2.9 : k < 6368 ? 2.6 : 1.02); };
prova('il profilo della Terra (PREM) ridà la massa della Terra; la sfera omogenea dà il potenziale esatto', () => {
  const P = R.potenzialeDaDensita(PREM, 6.371e6); vicino(P.massa, TERRA.massa, 2e-3, 'massa da PREM');
  const O = R.potenzialeDaDensita(() => 5514, 6.371e6), Mo = O.massa; vicino(O.potenziale(0), (-1.5 * G * Mo) / 6.371e6, 1e-6, 'centro omogeneo'); vicino(O.potenziale(3e6), (-G * Mo * (3 * 6.371e6 ** 2 - 9e12)) / (2 * 6.371e6 ** 3), 1e-6, 'a metà');
});
{ const P = R.potenzialeDaDensita(PREM, 6.371e6), eta = 4.5e9 * ANNO;
  const centro = R.scartoLungo([{ durata: eta, catena: [{ massa: P.massa, distanza: 0, raggio: 6.371e6, profilo: P }] }]), sup = R.scartoLungo([{ durata: eta, catena: [{ massa: P.massa, distanza: 6.371e6 }] }]);
  const omo = R.scartoLungo([{ durata: eta, catena: [{ massa: TERRA.massa, distanza: 0, raggio: 6.371e6 }] }]).scarto - R.scartoLungo([{ durata: eta, catena: [{ massa: TERRA.massa, distanza: 6.371e6 }] }]).scarto;
  confronta('il centro della Terra più giovane della superficie, in 4,5 Ga', (centro.scarto - sup.scarto) / ANNO, 2.4, 2.6, '2,5 anni (Uggerhøj et al. 2016 [V])', 'anni');
  console.log(`        (con una Terra omogenea: ${n(omo / ANNO)} anni; la differenza è il nucleo denso)`); }

// ---------- un luogo del modello: il primo pianeta roccioso della prima galassia del cosmo 1
const VIA = (() => { const Gx = CO.galassia(1, 0); for (let s = 0; s < Gx.stelle.length; s++) { if (Gx.stelle[s].stato !== 'in vita') continue; const Sis = CO.sistema(1, 0, s), p = Sis && Sis.pianeti ? Sis.pianeti.findIndex((q) => q.tipo === 'roccioso') : -1; if (p >= 0) return { cosmo: 1, galassia: 0, stella: s, pianeta: p, Gx, Sis }; } return null; })();
const MOTI = S3.motiRegione(VIA), ms = (v) => v.map((x) => x * 1e3);
const CATENA = (() => { const { Gx, Sis } = VIA, P = Sis.pianeti[VIA.pianeta], sg = S3.statoGalassia(1, 0, 0), i = VIA.stella, rKpc = Math.hypot(sg.pos[3 * i], sg.pos[3 * i + 1], sg.pos[3 * i + 2]) / KPC;
  return { rKpc, P, S: Sis.stella, catena: [
    { nome: 'alone e galassia', potenziale: R.potenzialeDaCurva((r) => GA.curvaRotazione(Gx.forma, r) * 1e3, rKpc), velocita: ms(MOTI.stella) },
    { nome: 'stella', massa: Sis.stella.massa * MSOLE, distanza: P.aM, velocita: ms(MOTI.pianeta) },
    { nome: 'pianeta', massa: P.massaKg, distanza: P.raggioM }] }; })();
prova(`un luogo del modello (cosmo 1/galassia 0/stella ${VIA.stella}/pianeta ${VIA.pianeta}): il ritmo dalla catena alone → stella → pianeta, più il moto della galassia`, () => {
  const r = R.ritmo(CATENA.catena, { velocita: ms(MOTI.galassia) });
  tra(r.scarto, 1e-9, 1e-4, 'scarto'); vicino(r.scarto, r.gravita + r.moto, 1e-4, 'somma delle parti al primo ordine');
  // il potenziale dalla curva di rotazione: per una massa puntiforme ridà −GM/r
  vicino(R.potenzialeDaCurva((x) => Math.sqrt((G * MSOLE) / x), UA), (-G * MSOLE) / UA, 1e-6, 'potenziale di Keplero dalla sua curva');
  console.log(`        a ${n(CATENA.rKpc)} kpc dal centro; stella di ${n(CATENA.S.massa)} M☉, pianeta a ${n(CATENA.P.aM / UA)} UA`);
  for (const p of r.parti) console.log(`        ${p.nome.padEnd(18)} gravità ${n(p.gravita)}   moto ${n(p.moto)}`);
  const vTot = Math.hypot(...[0, 1, 2].map((k) => (MOTI.pianeta[k] + MOTI.stella[k] + MOTI.galassia[k])));
  console.log(`        velocità rispetto al fondo: ${n(vTot)} km/s  →  1 − dτ/dt = ${n(r.scarto)}: in ${n(CATENA.S.eta / 1e9)} Ga di vita della stella l'orologio resta indietro di ${n((r.scarto * CATENA.S.eta))} anni`);
});

console.log('\n— 2. LA SEZIONE E IL CONO —');
prova('UN EVENTO, DUE OSSERVATORI: lo stesso evento, coordinate diverse, intervallo uguale, simultaneità diversa', () => {
  // l'evento E: «adesso» (per chi sta fermo rispetto al fondo) su una stella a 10 anni luce lungo x. O è il qui-e-ora.
  const O = { t: 0, x: [0, 0, 0] }, E = { t: 0, x: [10 * AL, 0, 0] };
  const fermo = R.sezioneDi({ t: 0 }), verso = R.sezioneDi({ t: 0, moto: { velocita: [0.6 * C, 0, 0] } }), via = R.sezioneDi({ t: 0, moto: { velocita: [-0.6 * C, 0, 0] } });
  const a = fermo.vede(E), b = verso.vede(E), c = via.vede(E);
  // le coordinate cambiano…
  assert.equal(a.t, 0); vicino(b.t / ANNO, -7.5, 1e-12, 't′ per chi va verso la stella'); vicino(c.t / ANNO, 7.5, 1e-12, 't′ per chi se ne allontana'); vicino(b.x[0] / AL, 12.5, 1e-12, 'x′');
  // …l'intervallo no: lo stesso numero per tutti e tre (qui −100 anni luce²: separati nello spazio)
  const s2 = R.intervallo(O, E), s2b = R.intervallo({ t: 0, x: [0, 0, 0] }, b), s2c = R.intervallo({ t: 0, x: [0, 0, 0] }, c);
  vicino(s2b, s2, 1e-12, 'intervallo per chi va'); vicino(s2c, s2, 1e-12, 'intervallo per chi viene'); vicino(s2 / (AL * AL), -100, 1e-12, 's²');
  // e la relazione causale è la stessa per tutti: 'altrove'
  assert.equal(R.relazione(O, E), 'altrove'); assert.equal(R.relazione({ t: 0, x: [0, 0, 0] }, b), 'altrove'); assert.equal(R.relazione({ t: 0, x: [0, 0, 0] }, c), 'altrove');
  // il «presente» di chi va verso la stella contiene un evento della stella 6 anni DOPO quello del presente di chi sta fermo (v·x/c²)
  vicino(verso.adesso(E.x) / ANNO, 6, 1e-12, 'adesso(x) = v·x/c²'); vicino(verso.quando({ t: verso.adesso(E.x), x: E.x }), 0, 1e-9, 'quell\'evento è «adesso» per lui'); vicino(via.adesso(E.x) / ANNO, -6, 1e-12, 'e 6 anni prima per chi si allontana');
  console.log(`        E = (t 0; x 10 anni luce). Fermo: t′ = 0. A 0,6 c verso E: t′ = ${n(b.t / ANNO)} anni, x′ = ${n(b.x[0] / AL)} a.l. Via da E: t′ = +${n(c.t / ANNO)} anni. s² = ${n(s2 / (AL * AL))} a.l.² per tutti e tre.`);
  console.log(`        «adesso» su quella stella: t = 0 per chi sta fermo, t = +6 anni per chi le va incontro, t = −6 anni per chi se ne va: tre sezioni dello stesso spaziotempo.`);
});
prova('l\'ordine nel tempo di due eventi separati nello spazio dipende da chi guarda; quello di due eventi causali mai (300 osservatori dalla fonte degli eventi)', () => {
  const caso = sorgente('prova/relativita/osservatori'), A = { t: 0, x: [0, 0, 0] }, lontano = { t: 1, x: [3 * C, 0, 0] }, causale = { t: 1, x: [0.5 * C, 0.3 * C, 0] }; let prima = 0, dopo = 0;
  for (let i = 0; i < 300; i++) { const b = 0.99 * caso(`o ${i}/beta`), z = 2 * caso(`o ${i}/z`) - 1, f = 2 * PI * caso(`o ${i}/fi`), q = Math.sqrt(1 - z * z), s = R.sezioneDi({ t: 0, moto: { velocita: [b * C * q * Math.cos(f), b * C * q * Math.sin(f), b * C * z] } });
    const a = s.vede(A), l = s.vede(lontano), k = s.vede(causale);
    if (l.t > a.t) dopo++; else prima++; assert.ok(k.t > a.t, 'l\'effetto prima della causa'); assert.equal(R.relazione(a, k), 'prima'); assert.equal(R.relazione(a, l), 'altrove');
    vicino(R.intervallo(a, l), R.intervallo(A, lontano), 1e-9, 'intervallo'); vicino(R.intervallo(a, k), R.intervallo(A, causale), 1e-9, 'intervallo'); }
  assert.ok(prima > 0 && dopo > 0, 'tra 300 osservatori ce ne sono di entrambi i pareri'); console.log(`        evento lontano (separato nello spazio): per ${dopo} osservatori viene dopo, per ${prima} prima; evento causale: dopo per tutti e 300`);
});
prova('la stessa convenzione di sezione.js (osservatore): stesse coordinate nel piano', () => {
  const vista = { velocita: 0.37, direzione: 25 }, c = 40, O = osservatore(vista, [0, 0, 0], c), fi = (25 * PI) / 180;
  // (sezione.js lavora in unità in cui la luce va a c = 40; qui in metri e secondi: stessa formula con x/c)
  const s = R.sezioneDi({ t: 0, moto: { velocita: [0.37 * C * Math.cos(fi), 0.37 * C * Math.sin(fi), 0] } });
  for (const [x, y, t] of [[3, -2, 0.7], [-11, 4, -2.5], [0.2, 9, 5]]) { const a = O(x, y, t), b = s.vede({ t, x: [(x * C) / c, (y * C) / c, 0] }); vicino((b.x[0] * c) / C, a[0], 1e-10, 'x′'); vicino((b.x[1] * c) / C, a[1], 1e-10, 'y′'); vicino(b.t, a[2], 1e-10, 't′'); }
});
prova('a passo d\'uomo verso una galassia lontana: il «presente» laggiù si sposta di giorni (v·x/c²)', () => {
  const d = 2.5e6 * AL, s = R.sezioneDi({ t: 0, moto: { velocita: [1.4, 0, 0] } });
  vicino(s.scarto([d, 0, 0]), (1.4 * d) / C2, 1e-12, 'v·x/c²'); tra(s.scarto([d, 0, 0]) / GIORNO, 4, 4.5, 'giorni'); assert.ok(s.curvatura([d, 0, 0]) < 1e-3);
  console.log(`        1,4 m/s verso una galassia a 2,5 milioni di anni luce: «adesso» laggiù è ${n(s.scarto([d, 0, 0]) / GIORNO)} giorni più tardi che per chi sta fermo (e altrettanti prima per chi cammina nell'altro verso)`);
  // per la bolla del modello: la sua velocità rispetto al fondo, verso il centro della galassia vicina
  const v = ms([0, 1, 2].map((k) => MOTI.pianeta[k] + MOTI.stella[k] + MOTI.galassia[k])), sb = R.sezioneDi({ t: 0 }, { riferimento: v }), dir = v.map((x) => x / Math.hypot(...v));
  console.log(`        la bolla del modello va a ${n(Math.hypot(...v) / 1e3)} km/s rispetto al fondo: a 1 Mpc davanti a lei il suo «adesso» è ${n(sb.scarto(dir.map((x) => x * MPC)) / ANNO)} anni avanti rispetto al tempo cosmico`);
});
prova('due sezioni diverse si incrociano su un piano: lì (e solo lì) gli eventi sono «adesso» per entrambi', () => {
  const s1 = R.sezioneDi({ t: 0, moto: { velocita: [2e4, 0, 0] } }), s2 = R.sezioneDi({ t: 5, moto: { velocita: [-1e4, 3e4, 0] } }), I = R.incrocio(s1, s2);
  // un punto del piano n·x = d, più due direzioni nel piano
  const p0 = I.normale.map((x) => x * I.distanza), u = [-I.normale[1], I.normale[0], 0], w = [0, 0, 1];
  for (const [a, b] of [[0, 0], [3e12, -7e11], [-1e13, 4e13]]) { const x = [0, 1, 2].map((k) => p0[k] + a * u[k] + b * w[k]), e = { t: I.tempo(x), x }; vicino(s1.adesso(x), s2.adesso(x), 1e-9, 'stesso tempo'); assert.ok(Math.abs(s1.quando(e)) < 1e-6 && Math.abs(s2.quando(e)) < 1e-6, 'adesso per entrambi'); }
  const fuoriPiano = [0, 1, 2].map((k) => p0[k] + 1e12 * I.normale[k]); assert.ok(Math.abs(s1.adesso(fuoriPiano) - s2.adesso(fuoriPiano)) > 0.1, 'fuori dal piano i due «adesso» sono eventi diversi');
  assert.equal(R.incrocio(s1, R.sezioneDi({ t: 3, moto: { velocita: [2e4, 0, 0] } })), null);
});
prova('il cono passato: tempo di volo in un sistema legato; tempo di ritorno e redshift a distanze cosmiche; mai nel futuro', () => {
  const b = { t: 0 }; vicino(R.conoPassato(b, { distanza: UA }).ritardo, UA / C, 1e-12, 'dal Sole'); vicino(R.conoPassato(b, { posizione: [3e16, 4e16, 0] }).ritardo, 5e16 / C, 1e-12, 'vettore');
  // vicino: la legge di Hubble cz = H₀d; lontano: z = 1 ↔ a = ½, con il tempo della cosmologia di leggi.js
  const v = R.conoPassato(b, { comovente: 10 * MPC }); vicino(v.z * C, R.cosmo.H0 * 10 * MPC, 2e-3, 'cz = H₀d a 10 Mpc'); vicino(v.ritardo, (10 * MPC) / C, 2e-3, 'tempo di volo a 10 Mpc');
  const chi1 = R.cosmo.comovente(0.5, 1), l = R.conoPassato(b, { comovente: chi1 }); vicino(l.z, 1, 1e-9, 'z = 1'); vicino(l.ritardo, R.cosmo.tempo(1) - R.cosmo.tempo(0.5), 1e-9, 'tempo di ritorno');
  vicino(R.cosmo.tempo(1), R.T_OGGI, 1e-12, 'l\'età del cosmo è quella di leggi.js'); vicino(R.cosmo.scala(R.cosmo.tempo(0.37)), 0.37, 1e-12, 'a(t) e t(a) sono inverse');
  assert.equal(R.conoPassato(b, { comovente: 1.01 * R.cosmo.orizzonte(1) }).visibile, false);
  { const d = (1e-4 * C) / R.cosmo.H0, a = R.conoPassato(b, { comovente: d * 0.999999 }), z = R.conoPassato(b, { comovente: d * 1.000001 }); vicino(a.ritardo, z.ritardo, 3e-6, 'le due vie (sviluppo e integrale) si raccordano'); vicino(a.z, z.z, 3e-6, 'anche nel redshift'); vicino(R.conoPassato(b, { comovente: 1e3 }).ritardo, 1e3 / C, 1e-12, 'a un chilometro'); }
  for (const d of [1e3, 1e20, 1e24, 3e25, 3e26]) { assert.ok(R.conoPassato(b, { comovente: d }).t < 0); assert.ok(R.conoPassato(b, { distanza: d }).t < 0); }
  // una bolla nel passato vede meno lontano
  assert.ok(R.conoPassato({ t: -5e9 * ANNO }, { comovente: chi1 }).z > 1);
  console.log(`        dal Sole ${n(UA / C)} s; dal centro di una galassia a 8,2 kpc ${n((8.2 * KPC) / C / ANNO)} anni; a 1 Gpc (comovente): ${n(R.conoPassato(b, { comovente: 1e3 * MPC }).ritardo / ANNO / 1e9)} Ga fa, z = ${n(R.conoPassato(b, { comovente: 1e3 * MPC }).z)}; orizzonte ${n(R.cosmo.orizzonte(1) / MPC / 1e3)} Gpc`);
});
confronta('tempo di ritorno a z = 1 (cosmologia di leggi.js)', (R.cosmo.tempo(1) - R.cosmo.tempo(0.5)) / ANNO / 1e9, 7.7, 8.1, '7,9 Ga (Planck 2018 [R])', 'Ga');
confronta('orizzonte delle particelle oggi', R.cosmo.orizzonte(1) / MPC / 1e3, 14.0, 14.4, '14,2 Gpc [R] (con la radiazione, che in leggi.js non c\'è)', 'Gpc');
prova('la relazione causale: prima, dopo, altrove; sul cono; a distanze cosmiche', () => {
  const A = { t: 0, x: [0, 0, 0] }; assert.equal(R.relazione(A, { t: 10, x: [C * 5, 0, 0] }), 'prima'); assert.equal(R.relazione({ t: 10, x: [C * 5, 0, 0] }, A), 'dopo'); assert.equal(R.relazione(A, { t: 10, x: [C * 11, 0, 0] }), 'altrove'); assert.equal(R.relazione(A, { t: 10, x: [C * 10, 0, 0] }), 'prima'); assert.equal(R.relazione(A, A), 'stesso');
  const chi = R.cosmo.comovente(0.5, 1), t5 = R.cosmo.tempo(0.5) - R.T_OGGI; assert.equal(R.relazione({ t: t5, x: [0.99 * chi, 0, 0] }, A, { cosmico: true }), 'prima'); assert.equal(R.relazione({ t: t5, x: [1.01 * chi, 0, 0] }, A, { cosmico: true }), 'altrove');
});
{ const d = R.dipolo([369.82e3, 0, 0]); // la velocità del Sole rispetto al fondo: 369,82 ± 0,11 km/s (Planck 2018 [R])
  confronta('il dipolo del fondo per chi va a 369,82 km/s', d.ampiezza * 1e3, 3.36208 - 0.003, 3.36208 + 0.003, '3,36208 ± 0,00099 mK (Planck 2018 [R]); ±3σ', 'mK');
  prova('il dipolo: più caldo davanti, più freddo dietro, e T₀ di traverso al secondo ordine', () => { assert.ok(d.temperatura(0) > R.T_FONDO && d.temperatura(PI) < R.T_FONDO); vicino(d.temperatura(0) - d.temperatura(PI), 2 * d.ampiezza, 1e-5, 'ampiezza'); vicino(d.temperatura(PI / 2), R.T_FONDO, 1e-6, 'di traverso'); }); }
{ // nel modello: le velocità peculiari di tutte le galassie del cosmo 1 (cosmo3d: lo spettro vero, teoria lineare); il Gruppo
  // Locale va a 620 ± 15 km/s rispetto al fondo (Kogut et al. 1993 [R]): è un'estrazione; deve stare tra il 5° e il 95° percentile
  const V = S3.campoCosmo(1).motiGalassie().map((v) => Math.hypot(...v)).sort((a, b) => a - b), q = (p) => V[Math.min(V.length - 1, Math.floor(p * V.length))];
  confronta('la velocità del Gruppo Locale tra quelle delle galassie del modello (5°–95° percentile)', 620, q(0.05), q(0.95), `modello: mediana ${n(q(0.5))}, da ${n(q(0.05))} a ${n(q(0.95))} km/s`, 'km/s');
  const v = ms([0, 1, 2].map((k) => MOTI.pianeta[k] + MOTI.stella[k] + MOTI.galassia[k])), dm = R.dipolo(v);
  console.log(`        la bolla del modello: ${n(Math.hypot(...v) / 1e3)} km/s rispetto al fondo → dipolo di ${n(dm.ampiezza * 1e3)} mK (la galassia da sola: ${n(Math.hypot(...MOTI.galassia))} km/s)`); }
prova('REGOLA 12: l\'antenato comune sta nell\'intersezione dei coni passati', () => {
  const a = { t: 0, posizione: [0, 0, 0] }, b = { t: 0, posizione: [MPC, 0, 0] };
  // due bolle a 1 Mpc, adesso: un evento di un milione di anni fa presso la prima non può aver toccato la seconda
  const vicinoAllaPrima = R.antenatoNeiConi([a, b], { t: -1e6 * ANNO, posizione: [0, 0, 0] }); assert.equal(vicinoAllaPrima.dentro, false); assert.deepEqual(vicinoAllaPrima.fuori, [1]);
  assert.equal(R.antenatoNeiConi([a, b], { t: -4e6 * ANNO, posizione: [0, 0, 0] }).dentro, true);
  const u = R.ultimoAntenato([a, b]); vicino(u.t, -MPC / (2 * C), 1e-12, 'a metà strada, mezzo tempo di volo fa'); vicino(u.posizione[0], MPC / 2, 1e-12, 'a metà strada'); assert.ok(Math.abs(R.antenatoNeiConi([a, b], u).margine) < 1);
  // una bolla nel futuro dell'altra, abbastanza vicina: l'antenato più tardo è la più vecchia delle due
  const c = { t: -1e7 * ANNO, posizione: [MPC, 0, 0] }, u2 = R.ultimoAntenato([a, c]); assert.equal(u2.t, c.t); assert.equal(R.relazione(c, a), 'prima');
  // quattro bolle: la punta dell'intersezione sta nel cono di tutte, e nessun evento più tardo ci sta (provato su 200 punti)
  const B = [a, b, { t: -2e5 * ANNO, posizione: [0.3 * MPC, 0.8 * MPC, 0] }, { t: 1e5 * ANNO, posizione: [0.5 * MPC, 0.2 * MPC, 0.7 * MPC] }], u4 = R.ultimoAntenato(B), dentro = R.antenatoNeiConi(B, u4);
  assert.ok(dentro.dentro || Math.abs(dentro.margine) < 1e-6 * Math.abs(u4.t)); const caso = sorgente('prova/relativita/coni');
  for (let i = 0; i < 200; i++) { const x = [caso(`p ${i}/x`) * MPC, caso(`p ${i}/y`) * MPC, caso(`p ${i}/z`) * MPC], m = R.antenatoNeiConi(B, { t: u4.t, posizione: x }).margine; assert.ok(m <= Math.abs(u4.t) * 1e-3, 'nessun punto ha più margine della punta'); }
  // a distanze cosmiche: due galassie ai capi del toro del modello (3,7·10²⁵ m) hanno coni che si incontrano dopo l'inizio
  const g = [{ t: 0, posizione: [0, 0, 0] }, { t: 0, posizione: [1.85e25, 0, 0] }], uc = R.ultimoAntenato(g, { cosmico: true }); assert.ok(uc.esiste); assert.ok(R.antenatoNeiConi(g, { t: -R.T_OGGI * 0.999, posizione: [0.9e25, 0, 0] }, { cosmico: true }).dentro);
  // ma oltre due volte l'orizzonte no: quelle due bolle non hanno niente in comune nel passato
  const lontane = [{ t: 0, posizione: [0, 0, 0] }, { t: 0, posizione: [2.05 * R.cosmo.orizzonte(1), 0, 0] }]; assert.equal(R.ultimoAntenato(lontane, { cosmico: true }).esiste, false);
  console.log(`        due bolle a 1 Mpc: l'ultimo antenato possibile sta a metà strada, ${n(-u.t / ANNO / 1e6)} milioni di anni fa; ai capi del toro: ${n((R.T_OGGI + uc.t) / ANNO / 1e9)} Ga dopo l'inizio`);
});

console.log('\n— 3. I BUCHI NERI —');
prova('Schwarzschild e Kerr: orizzonte, sfera dei fotoni, ultima orbita stabile, ergosfera, efficienza (i limiti esatti)', () => {
  const M = MSOLE, g = rg(M); vicino(R.orizzonte(M) / 1e3, 2.953, 1e-3, 'orizzonte del Sole (km)'); vicino(R.sferaFotoni(M) / g, 3, 1e-12, 'fotoni'); vicino(R.ultimaOrbitaStabile(M) / g, 6, 1e-12, 'ISCO'); vicino(R.ombra(M).raggio / g, Math.sqrt(27), 1e-12, 'ombra');
  vicino(R.orizzonte(M, 1) / g, 1, 1e-12, 'r₊ a = 1'); vicino(R.sferaFotoni(M, 1, 1) / g, 1, 1e-9, 'fotoni concordi a = 1'); vicino(R.sferaFotoni(M, 1, -1) / g, 4, 1e-12, 'fotoni contrari'); vicino(R.ultimaOrbitaStabile(M, 1, 1) / g, 1, 1e-9, 'ISCO concorde'); vicino(R.ultimaOrbitaStabile(M, 1, -1) / g, 9, 1e-12, 'ISCO contraria');
  vicino(R.ergosfera(M, 0.9, PI / 2) / g, 2, 1e-12, 'ergosfera all\'equatore'); vicino(R.ergosfera(M, 0.9, 0), R.orizzonte(M, 0.9), 1e-12, 'ai poli tocca l\'orizzonte');
  vicino(R.efficienza(0), 1 - Math.sqrt(8 / 9), 1e-12, 'efficienza a = 0'); vicino(R.efficienza(1), 1 - 1 / Math.sqrt(3), 1e-12, 'efficienza a = 1'); tra(R.efficienza(0.999999), 0.41, 1 - 1 / Math.sqrt(3), 'a → 1 ci arriva da sotto (ripida: (1 − a)^(1/3))'); tra(R.efficienza(0.998), 0.31, 0.33, 'a = 0,998 (Thorne 1974: 0,32)');
  vicino(R.giroOrizzonte(M, 1), C / (2 * g), 1e-12, 'giro dell\'orizzonte a = 1'); assert.equal(R.giroOrizzonte(M, 0), 0);
});
confronta('ombra di M87* (6,5·10⁹ M☉ a 16,8 Mpc): 2√27·GM/c²D', R.ombra(6.5e9 * MSOLE, 16.8 * MPC).diametro * SEC * 1e6, 42 - 3, 42 + 3, 'anello 42 ± 3 µas (EHT 2019 [V])', 'µas');
confronta('ombra di Sgr A* (4,297·10⁶ M☉ a 8,277 kpc [R: GRAVITY 2022])', R.ombra(4.297e6 * MSOLE, 8.277 * KPC).diametro * SEC * 1e6, 51.8 - 2.3, 51.8 + 2.3, 'anello 51,8 ± 2,3 µas (EHT 2022 [V])', 'µas');
prova('l\'ombra vista da vicino e la sezione di cattura della luce, 27π(GM/c²)², dai raggi integrati (Binet)', () => {
  const M = 10 * MSOLE, g = rg(M);
  for (const r0 of [1e4 * g, 30 * g, 10 * g, 4 * g]) { // l'angolo limite tra i raggi che cadono e quelli che fuggono, cercato per bisezione
    let lo = PI / 2, hi = PI; for (let k = 0; k < 40; k++) { const m = 0.5 * (lo + hi); if (R.raggioDiLuce({ M, r0, psi: m }).esito === 'cade') hi = m; else lo = m; }
    vicino(PI - 0.5 * (lo + hi), R.ombraDaVicino(M, r0), 2e-4, `raggio angolare dell'ombra da ${r0 / g} r_g`); if (r0 === 1e4 * g) vicino(R.raggioDiLuce({ M, r0, psi: 0.5 * (lo + hi) }).b / g, Math.sqrt(27), 2e-4, 'parametro d\'urto critico'); }
  vicino(R.sezioneDiCattura(M), PI * R.parametroCritico(M) ** 2, 1e-12, 'σ = πb_c²'); vicino(R.ombraDaVicino(M, 3 * g), PI / 2, 1e-9, 'sulla sfera dei fotoni l\'ombra è mezzo cielo'); assert.ok(R.ombraDaVicino(M, 2.5 * g) > PI / 2);
});
prova('Kerr: i raggi integrati nella forma di Kerr–Schild ridanno l\'ombra di Bardeen (a = 0: √27; a = 0,9 di taglio: schiacciata e spostata)', () => {
  const D = 2000, bordo = (a, inc, chi) => { // lungo la direzione chi sul cielo, da un punto dentro l'ombra: il raggio dove si passa da 'cade' a 'fugge'
    const O = R.ombraKerr(a, inc), c0 = [O.centro, 0], o = [Math.sin(inc), 0, Math.cos(inc)], eb = [-Math.cos(inc), 0, Math.sin(inc)], ea = [0, 1, 0]; let lo = 0, hi = 12;
    const esito = (rho) => { const al = c0[0] + rho * Math.cos(chi), be = rho * Math.sin(chi), x = [0, 1, 2].map((k) => D * o[k] + al * ea[k] + be * eb[k]); return R.raggioKerr(a, x, o, { k: 0.03 }); };
    for (let k = 0; k < 16; k++) { const m = 0.5 * (lo + hi); if (esito(m).esito === 'cade') lo = m; else hi = m; } const rho = 0.5 * (lo + hi);
    // lo stesso punto sul bordo analitico: l'intersezione della semiretta con la curva (interpolata tra i suoi punti)
    let vero = null; const P = O.punti; for (let i = 0; i < P.length; i++) { const p = P[i], q = P[(i + 1) % P.length], a1 = Math.atan2(p[1], p[0] - c0[0]), a2 = Math.atan2(q[1], q[0] - c0[0]); let d1 = a1 - chi, d2 = a2 - chi; d1 = Math.atan2(Math.sin(d1), Math.cos(d1)); d2 = Math.atan2(Math.sin(d2), Math.cos(d2)); if (d1 * d2 <= 0 && Math.abs(d1 - d2) < 1) { const f = d1 / (d1 - d2 || 1); vero = Math.hypot(p[0] - c0[0], p[1]) * (1 - f) + Math.hypot(q[0] - c0[0], q[1]) * f; break; } }
    return { rho, vero, H: esito(rho).H };
  };
  const s = bordo(0, PI / 2, 0.7); vicino(s.rho, Math.sqrt(27), 4e-3, 'a = 0: √27'); assert.ok(Math.abs(s.H) < 1e-6, 'H resta zero');
  const O = R.ombraKerr(0.9, PI / 2); tra(O.largo / (2 * Math.sqrt(27)), 0.85, 1, 'più stretta'); tra(O.alto / (2 * Math.sqrt(27)), 0.97, 1.03, 'alta quasi uguale'); assert.ok(O.centro > 0.5, 'spostata dalla parte che si allontana');
  for (const chi of [0, 0.9, PI / 2, 2.4, PI]) { const b = bordo(0.9, PI / 2, chi); vicino(b.rho, b.vero, 6e-3, `bordo dell'ombra a = 0,9, direzione ${chi}`); }
  console.log(`        a* = 0,9 vista di taglio: larga ${n(O.largo)} r_g, alta ${n(O.alto)} r_g (a* = 0: ${n(2 * Math.sqrt(27))}), centro spostato di ${n(O.centro)} r_g`);
});
prova('rotazione dal momento angolare; marea e raggio di marea; massa di Hills', () => {
  tra(R.spinDa(1.92e41, MSOLE), 0.19, 0.24, 'a* del Sole (J = 1,92·10⁴¹ kg m²/s [R])'); assert.ok(R.spinDa(5.86e33, TERRA.massa) > 100, 'la Terra non è compatta: a* ≫ 1');
  const Mh = R.massaDiHills(MSOLE, RSOLE); tra(Mh / MSOLE, 0.9e8, 1.3e8, 'Hills per il Sole (~10⁸ M☉)'); vicino(R.raggioDiMarea(Mh, MSOLE, RSOLE), R.raggioSchwarzschild(Mh), 1e-9, 'a quella massa r_t = r_s');
  const M = 4.297e6 * MSOLE, rt = R.raggioDiMarea(M, MSOLE, RSOLE); tra(rt / R.raggioSchwarzschild(M), 5, 15, 'il Sole attorno a Sgr A* si spezza a ~10 r_s');
  // una persona (2 m) all'orizzonte: 10 M☉ contro 10⁹ M☉
  console.log(`        il Sole attorno a un buco di 4,3·10⁶ M☉ si spezza a ${n(rt / UA)} UA (${n(rt / R.raggioSchwarzschild(M))} r_s); sopra ${n(Mh / MSOLE)} M☉ entra intero`);
  console.log(`        marea su 2 m all'orizzonte: ${n(R.marea(10 * MSOLE, R.orizzonte(10 * MSOLE), 2))} m/s² per 10 M☉, ${n(R.marea(1e9 * MSOLE, R.orizzonte(1e9 * MSOLE), 2))} m/s² per 10⁹ M☉`);
});
{ // Gravity Probe B: orbita polare a 642 km di quota; J della Terra = 5,86·10³³ kg m²/s [R]
  const r = TERRA.raggio + 642e3;
  confronta('precessione geodetica di Gravity Probe B', R.precessioneGeodetica(TERRA.massa, r) * ANNO * MAS, 6601.8 - 2 * 18.3, 6601.8 + 2 * 18.3, '6601,8 ± 18,3 mas/anno (misurata [V]; previsto 6606,1); ±2σ', 'mas/anno');
  confronta('trascinamento dei riferimenti (Gravity Probe B)', R.precessioneTrascinamentoPolare(5.86e33, r) * ANNO * MAS, 37.2 - 7.2, 37.2 + 7.2, '37,2 ± 7,2 mas/anno (misurata [V]; previsto 39,2)', 'mas/anno'); }
prova('Hawking: temperatura, potenza ed evaporazione sono coerenti tra loro (dM/dt = −P/c²); entropia = k_B·A/4ℓ_P²', () => {
  const M = 1e12, h = R.hawking(M); vicino(h.potenza, (COSTANTI.hbar * C ** 6) / (15360 * PI * G * G * M * M), 2e-3, 'ħc⁶/15360πG²M²'); vicino(h.evaporazione, (M * C2) / (3 * h.potenza), 2e-3, 't = Mc²/3P');
  vicino(h.temperatura, (COSTANTI.hbar * C ** 3) / (8 * PI * G * M * COSTANTI.kB), 1e-12, 'ħc³/8πGMk_B'); vicino(R.massaCheEvapora(R.hawking(5e10).evaporazione), 5e10, 1e-9, 'inversa'); assert.equal(R.hawking(M, 1).temperatura, 0);
  const s = R.hawking(MSOLE); console.log(`        una massa solare: T = ${n(s.temperatura)} K (il fondo è a 2,7 K: oggi assorbe, non evapora), evaporazione in ${n(s.evaporazione / ANNO)} anni, entropia ${n(s.entropia / COSTANTI.kB)} k_B`);
  console.log(`        evapora nell'età del cosmo un buco di ${n(R.massaCheEvapora(R.T_OGGI))} kg (raggio ${n(R.raggioSchwarzschild(R.massaCheEvapora(R.T_OGGI)))} m)    [derivata, mai osservata]`);
});
prova('Eddington e Salpeter: i numeri noti, e lo stesso tempo che galassie.js porta scritto a mano (4,5·10⁸ anni a resa 1)', () => {
  tra(R.eddington(MSOLE), 1.25e31, 1.27e31, 'L_Edd per M☉ (1,26·10³¹ W)'); vicino((R.SIGMA_T * C) / (4 * PI * G * COSTANTI.mp) / ANNO, 4.5e8, 5e-3, 'σ_Tc/4πGm_p'); tra(R.tempoSalpeter(0.1) / ANNO / 1e6, 49, 51, 'Salpeter a resa 0,1 (Ma)');
});
prova('il disco sottile: il flusso di Page & Thorne integrato dà esattamente Ṁc²·(1 − E_isco); lontano è il disco newtoniano', () => {
  const M = 10 * MSOLE, g = rg(M), mdot = 1e15;
  for (const a of [0, 0.5, 0.9, 0.998]) { const d = R.discoSottile(M, mdot, a); let L = 0; const N = 6000, l0 = Math.log(d.interno), l1 = Math.log(1e7 * g), dl = (l1 - l0) / N;
    for (let i = 0; i < N; i++) { const r = Math.exp(l0 + (i + 0.5) * dl); L += 4 * PI * r * d.flusso(r) * d.energia(r) * r * dl; }
    L += (1.5 * G * M * mdot) / (1e7 * g); // la coda newtoniana oltre l'ultimo raggio: ∫4πr·3GMṀ/(8πr³)dr
    vicino(L, d.luminosita, 3e-3, `∫4πr·F·E dr = ηṀc² per a = ${a}`); vicino(d.flusso(1e6 * g), (3 * G * M * mdot) / (8 * PI * (1e6 * g) ** 3), 5e-3, 'limite newtoniano'); assert.equal(d.flusso(d.interno * 0.99), 0); }
  const d0 = R.discoSottile(M, mdot, 0); vicino(d0.rTmax / g, 9.55, 2e-2, 'il massimo di T a 9,55 r_g (a = 0)'); vicino(d0.omega(6 * g), C / (g * 6 ** 1.5), 1e-12, 'Ω di Keplero');
});
{ // una binaria X: 10 M☉ al 10% di Eddington. Le temperature misurate del bordo interno: kT ≈ 0,5–1,2 keV nei dischi luminosi [R]
  // (quella «di colore»: 1,7 volte quella efficace per la diffusione degli elettroni, Shimura & Takahara 1995 [R])
  const b = R.bucoNero({ massaKg: 10 * MSOLE }), d = R.discoSottile(10 * MSOLE, 0.1 * b.accrescimentoEddington, 0), keV = (COSTANTI.kB * d.Tmax) / (1e3 * COSTANTI.e);
  confronta('disco di una binaria X (10 M☉, 10% di Eddington): kT massima, per 1,7', 1.7 * keV, 0.5, 1.2, '0,5–1,2 keV [R]', 'keV');
  const q = R.bucoNero({ massaKg: 1e8 * MSOLE }), dq = R.discoSottile(1e8 * MSOLE, 0.1 * q.accrescimentoEddington, 0);
  console.log(`        T massima: ${n(d.Tmax)} K per 10 M☉ (raggi X), ${n(dq.Tmax)} K per 10⁸ M☉ (ultravioletto); luminosità ${n(d.luminosita / LSOLE)} e ${n(dq.luminosita / LSOLE)} L☉`); }
{ // PSR B1913+16 (Weisberg & Huang 2016 [V]: masse 1,438 e 1,390 M☉); periodo 27906,98 s ed eccentricità 0,6171334 [R]
  const m1 = 1.438 * MSOLE, m2 = 1.39 * MSOLE, P = 27906.98, e = 0.6171334, a = Math.cbrt(G * (m1 + m2) * (P / (2 * PI)) ** 2), s = R.spirale(m1, m2, a, e);
  confronta('PSR B1913+16: dP/dt per onde gravitazionali', s.dPeriodo / 1e-12, -2.398 * 1.0033, -2.398 * 0.9967, 'osservato (corretto) = 0,9983 ± 0,0016 volte −2,4026e-12 [V]; ±2σ', '·10⁻¹²');
  console.log(`        la coppia si fonde tra ${n(s.tempo / ANNO / 1e6)} milioni di anni (irraggia ${n(s.potenza)} W = ${n(s.potenza / LSOLE)} L☉ in onde gravitazionali)`);
  prova('Peters: l\'orbita circolare ridà (5/256)c⁵a⁴/(G³m₁m₂M); l\'eccentricità accorcia; la potenza è quella del quadrupolo', () => {
    const c = R.spirale(m1, m2, a, 0); vicino(c.tempo, (5 / 256) * ((C ** 5 * a ** 4) / (G ** 3 * m1 * m2 * (m1 + m2))), 1e-12, 'circolare'); vicino(R.spirale(m1, m2, a, 1e-4).tempo, c.tempo, 1e-3, 'e → 0 con continuità'); assert.ok(s.tempo < 0.2 * c.tempo);
    // dP/dt e potenza sono la stessa cosa: dE/dt = −P, E = −Gm₁m₂/2a, P_orb ∝ a^(3/2)
    vicino(c.dPeriodo, (-1.5 * c.periodo * c.potenza) / ((G * m1 * m2) / (2 * a)), 1e-9, 'dP/dt dalla potenza'); });
  // GW150914: 36 + 29 M☉ (alla sorgente), z = 0,09; il segnale sale da 35 a 250 Hz (LIGO 2016 [V]) in circa 0,2 s [R: figura 1]
  const z = 0.09; confronta('GW150914: tempo dalla frequenza di 35 Hz alla fusione', R.tempoDaFrequenza(36 * MSOLE * (1 + z), 29 * MSOLE * (1 + z), 35), 0.15, 0.25, '~0,2 s [R]', 's'); }
prova('dove sono: i resti delle stelle (stelle.fine) e il buco centrale delle galassie (galassie.js)', () => {
  let soglia = null; for (let m = 8; m <= 120; m += 1) { const f = ST.fine(m); if (f.tipo === 'buco nero') { soglia = m; break; } }
  const f = ST.fine(40), b = R.bucoDaResto(f); assert.ok(b && b.massaKg > 3 * MSOLE); vicino(b.orizzonte, f.raggio, 1e-9, 'lo stesso orizzonte di stelle.fine'); assert.equal(R.bucoDaResto(ST.fine(1)), null);
  console.log(`        nel modello diventano buchi neri le stelle da ${soglia} M☉ in su; una di 40 M☉ lascia ${n(f.massa)} M☉: orizzonte ${n(b.orizzonte / 1e3)} km, ombra ${n(b.ombra / 1e3)} km, T di Hawking ${n(b.hawking.temperatura)} K`);
  const c = R.bucoCentrale(VIA.Gx.forma); assert.ok(c.massaKg >= 1e5 * MSOLE); vicino(c.massaKg / MSOLE, VIA.Gx.forma.buco.M, 1e-12, 'la massa di galassie.js');
  // la frazione di Eddington: la stessa grandezza calcolata là (resa 0,1 scritta a mano) e qui (resa dall'ultima orbita stabile, 0,057)
  if (c.frazioneEddington > 0) vicino(c.frazioneEddington / VIA.Gx.forma.buco.eddington, c.efficienza / 0.1 / 0.9 * 0.9, 0.12, 'frazione di Eddington: qui e in galassie.js (a parte la resa)');
  console.log(`        galassia 0 del cosmo 1: ${n(c.massaKg / MSOLE)} M☉, orizzonte ${n(c.orizzonte / UA)} UA, ombra ${n(c.ombra / UA)} UA; accresce al ${n(c.frazioneEddington)} di Eddington${c.frazioneEddington < 0.01 ? ' (sotto l\'1%: il disco sottile non vale)' : ''}`);
  const tutti = CO.cosmo(1).galassie.map((g) => g.forma.buco).filter(Boolean), accesi = tutti.filter((x) => x.eddington > 0.01).length;
  console.log(`        nel cosmo 1: ${tutti.length} buchi centrali da ${n(Math.min(...tutti.map((x) => x.M)))} a ${n(Math.max(...tutti.map((x) => x.M)))} M☉; ${accesi} accrescono sopra l'1% di Eddington (lì vale il disco sottile)`);
});

console.log('\n— 4. LE GEODETICHE —');
confronta('deflessione della luce al bordo del Sole (esatta)', R.deflessione(MSOLE, RSOLE) * SEC, 1.7512 * (1 - 4e-4), 1.7512 * (1 + 4e-4), '1,7512″; misurata entro 2·10⁻⁴ (VLBI [V]); ±2σ', '″');
prova('la deflessione: tre vie (integrale esatto, Binet, la forma dello shader) danno lo stesso angolo, dal campo debole al bordo della cattura', () => {
  const M = MSOLE, g = rg(M); vicino(R.deflessione(M, RSOLE), R.deflessioneDebole(M, RSOLE), 1e-5, 'al bordo del Sole il primo ordine basta'); assert.equal(R.deflessione(M, 5 * g), Infinity);
  for (const b of [1000, 30, 8, 5.5, 5.25]) {
    const esatta = R.deflessione(M, b * g);
    // Binet: da molto lontano (r0 = 10⁶ r_g), con il parametro d'urto b
    const r0 = 1e6 * g, psi = PI - Math.asin((b * g * Math.sqrt(1 - (2 * g) / r0)) / r0), B = R.raggioDiLuce({ M, r0, psi, passo: 2e-4 }), viaBinet = B.angolo - (PI - Math.asin(b / 1e6));
    vicino(viaBinet, esatta, b > 100 ? 2e-3 : 2e-4, `Binet a b = ${b} r_g`);
    // la forma dello shader (unità r_g), con il passo dello shader: parte da (−X, 0, b) verso +x, con X = 60·b (almeno 300),
    // ed esce alla stessa distanza: della deflessione totale ne vede la parte X/√(X² + b²) (al primo ordine), cioè tutta entro 2·10⁻⁴
    const X = Math.max(300, 60 * b), T = R.tracciaRaggio([-X, 0, b], [1, 0, 0], { fuori: Math.hypot(X, b) }); assert.equal(T.esito, 'fugge');
    let ang = Math.atan2(-T.v[2], T.v[0]); while (ang < esatta - PI) ang += 2 * PI; vicino(ang, esatta, b > 6 ? 5e-3 : 2e-2, `la forma dello shader a b = ${b} r_g`);
  }
  assert.equal(R.tracciaRaggio([-300, 0, 5.15], [1, 0, 0]).esito, 'cade'); assert.equal(R.tracciaRaggio([-300, 0, 5.25], [1, 0, 0], { fuori: 300 }).esito, 'fugge');
  console.log(`        b = 8 r_g: ${n((R.deflessione(M, 8 * g) * 180) / PI)}°; b = 5,25 r_g (b_c = 5,196): ${n((R.deflessione(M, 5.25 * g) * 180) / PI)}° — la luce gira attorno prima di ripartire`);
});
{ // Terra–Marte in congiunzione superiore, il raggio radar che sfiora il Sole: andata e ritorno
  const rM = 1.524 * UA, dt = 2 * R.ritardoShapiro(MSOLE, UA, rM, RSOLE);
  confronta('ritardo di Shapiro Terra–Marte al bordo del Sole (andata e ritorno)', dt * 1e6, 240, 260, '~250 µs (Viking: Reasenberg et al. 1979 [R]); la formula è provata a 2·10⁻⁵ da Cassini [R]', 'µs');
  prova('il tempo esatto della luce in Schwarzschild meno la retta è il ritardo logaritmico (più il termine della coordinata)', () => {
    const rs = R.raggioSchwarzschild(MSOLE), eu = (r) => Math.sqrt(r * r - RSOLE * RSOLE) / C, atteso = (r) => (rs / C) * (Math.log((r + Math.sqrt(r * r - RSOLE * RSOLE)) / RSOLE) + 0.5 * Math.sqrt((r - RSOLE) / (r + RSOLE)));
    for (const r of [UA, rM]) { vicino(R.ritardoLuce(MSOLE, RSOLE, r), atteso(r), 1e-4, 'ritardo esatto contro primo ordine'); vicino(R.tempoLuce(MSOLE, RSOLE, r), eu(r) + atteso(r), 1e-9, 'tempo totale'); }
    // in campo forte il primo ordine non basta più: da 4 r_g a 100 r_g di un buco nero
    { const Mb = 10 * MSOLE, gb = rg(Mb), rsb = 2 * gb, x = (rsb / C) * (Math.log((100 + Math.sqrt(1e4 - 16)) / 4) + 0.5 * Math.sqrt(96 / 104)); assert.ok(R.ritardoLuce(Mb, 4 * gb, 100 * gb) > 1.2 * x, 'vicino a un buco nero il ritardo è più del primo ordine'); }
    // la parte logaritmica, sommata sui due tratti e raddoppiata, è la formula di Shapiro
    vicino(2 * (rs / C) * (Math.log((2 * UA) / RSOLE) + Math.log((2 * rM) / RSOLE)), dt, 1e-3, 'ln(4r₁r₂/b²)'); }); }
{ const P = 87.9691 * GIORNO, a = 5.790905e10, e = 0.20563, perSecolo = (x) => (x * SEC * 36525 * GIORNO) / P;
  confronta('precessione del perielio di Mercurio (esatta)', perSecolo(R.precessione(MSOLE, a, e)), 42.98 - 0.04, 42.98 + 0.04, '42,98 ± 0,04″ per secolo [R]', '″/secolo');
  // S2 attorno a Sgr A*: a = 0,12495″ a 8246,7 pc, e = 0,88466, M = 4,261·10⁶ M☉ (GRAVITY 2020 [R]); misurata: 12′ per orbita [V], f_SP = 1,10 ± 0,19 [R]
  const aS2 = ((0.12495 / SEC) * 8246.7 * KPC) / 1e3, pS2 = (R.precessione(4.261e6 * MSOLE, aS2, 0.88466) * 180 * 60) / PI;
  confronta('precessione di S2 attorno a Sgr A*, per orbita', pS2, 12.1 * (1.1 - 0.19), 12.1 * (1.1 + 0.19), '12′ per orbita [V], (1,10 ± 0,19) volte la relatività [R]', '′'); }
prova('le particelle: l\'orbita integrata precede quanto dice l\'integrale esatto, anche in campo forte; energia conservata', () => {
  const M = 10 * MSOLE, g = rg(M), a = 40 * g, e = 0.3, rp = a * (1 - e), ra = a * (1 + e);
  // la velocità al pericentro che dà quell'apocentro: da E e L dell'orbita con i due punti di svolta
  // E e L dell'orbita con quei due punti di svolta: V²(r_p) = V²(r_a) = E²
  const A = (r) => 1 - (2 * g) / r, L2 = (C2 * (A(ra) - A(rp))) / (A(rp) / (rp * rp) - A(ra) / (ra * ra)), E = Math.sqrt(A(rp) * (1 + L2 / (C2 * rp * rp)));
  const gam = E / Math.sqrt(A(rp)), vt = C * Math.sqrt(1 - 1 / (gam * gam)), O = R.orbita({ M, r0: rp, vt, durata: 40 * 2 * PI * Math.sqrt(a ** 3 / (G * M)), passo: 5e-4 });
  assert.equal(O.esito, 'legata'); vicino(O.E, E, 1e-12, 'E'); vicino(O.L * O.L, L2, 1e-9, 'L²'); assert.ok(O.pericentri.length > 10);
  const perGiro = (O.pericentri[O.pericentri.length - 1] - O.pericentri[0]) / (O.pericentri.length - 1) - 2 * PI; vicino(perGiro, R.precessione(M, a, e), 2e-4, 'precessione integrata contro esatta');
  assert.ok(R.precessione(M, a, e) > 1.05 * R.precessioneDebole(M, a, e), 'in campo forte il primo ordine non basta'); assert.equal(R.precessione(M, 6 * g, 0.5), Infinity);
  console.log(`        a = 40 r_g, e = 0,3: ${n((perGiro * 180) / PI)}° per giro (primo ordine: ${n((R.precessioneDebole(M, a, e) * 180) / PI)}°)`);
});
prova('cattura e caduta: la barriera del potenziale efficace decide chi cade; il tempo proprio di caduta è quello della cicloide', () => {
  const M = 10 * MSOLE, g = rg(M), r0 = 2000 * g;
  // una particella quasi ferma lontano (E ≈ 1): cade se L < 4GM/c
  for (const [k, atteso] of [[3.9, 'cade'], [4.1, 'fugge']]) { const L = (k * G * M) / C, A0 = 1 - (2 * g) / r0;
    // E = 1: il fattore di Lorentz misurato da chi sta fermo a r0 è 1/√A₀; la parte trasversa è L/(r0·γ)
    const gt = 1 / Math.sqrt(A0), v = C * Math.sqrt(1 - 1 / (gt * gt)), vtt = L / (r0 * gt), vrr = -Math.sqrt(Math.max(0, v * v - vtt * vtt));
    const O = R.orbita({ M, r0, vr: vrr, vt: vtt, fuori: 1.2 * r0, passo: 2e-3 }); vicino(O.E, 1, 1e-9, 'E = 1'); assert.equal(O.esito, atteso, `L = ${k} GM/c`); assert.equal(R.cattura(M, O.E, O.L).cade, atteso === 'cade'); }
  assert.equal(R.cattura(M, 0.99, (3.4 * G * M) / C).cade, true, 'sotto √12 GM/c non c\'è barriera'); vicino(R.cattura(M, 1, (4 * G * M) / C).barriera, 1, 1e-12, 'a L = 4GM/c la barriera vale 1'); vicino(R.cattura(M, 1, (4 * G * M) / C).rMassimo / g, 4, 1e-9, 'e sta a 4 r_g');
  vicino(R.sezioneDiCatturaLenta(M, 1e5), PI * ((4 * G * M) / (C * 1e5)) ** 2, 1e-12, 'σ = π(4GM/cv)²');
  // caduta da fermo a 50 r_g: integrata fino all'orizzonte, contro la cicloide; e fino al centro
  const r1 = 50 * g, O = R.orbita({ M, r0: r1, passo: 5e-4 }); assert.equal(O.esito, 'cade'); vicino(O.tau, R.tempoDiCaduta(M, r1, 2 * g), 1e-3, 'tempo proprio fino all\'orizzonte'); vicino(R.tempoDiCaduta(M, r1, 0), (PI / 2) * Math.sqrt(r1 ** 3 / (2 * G * M)), 1e-12, 'fino al centro');
  console.log(`        da fermo a 50 r_g di un buco di 10 M☉: ${n(O.tau * 1e3)} ms di tempo proprio fino all'orizzonte, altri ${n((R.tempoDiCaduta(M, r1, 0) - R.tempoDiCaduta(M, r1, 2 * g)) * 1e6)} µs fino al centro (da fuori: mai)    [sotto l'orizzonte: aperta]`);
});
prova('il fattore Doppler-gravitazionale del disco: di faccia è √(1 − 3/r); il lato che viene incontro è più blu', () => {
  vicino(R.fattoreDisco(6, 1e9, 0), Math.sqrt(0.5) / Math.sqrt(1 - 2e-9), 1e-12, 'di faccia a 6 r_g, visto da 10⁹ r_g'); assert.ok(R.fattoreDisco(6, 1e9, 5) > 1 && R.fattoreDisco(6, 1e9, -5) < 0.6); vicino(R.redshiftGravitazionale(R.ritmoFermo(MSOLE, 3 * R.raggioSchwarzschild(MSOLE))), 1 / Math.sqrt(1 - 1 / 3) - 1, 1e-12, 'redshift da 3 r_s');
});
{ // le lenti: una galassia ellittica con σ = 250 km/s a z = 0,3 e sorgente a z = 1; un ammasso con σ = 1200 km/s a z = 0,2 e sorgente a z = 2
  confronta('raggio di Einstein di una galassia (σ = 250 km/s, z 0,3 → 1)', R.raggioEinsteinIsoterma(250e3, 0.3, 1) * SEC, 0.8, 1.8, '~1″: le lenti SLACS stanno tra 0,8″ e 1,8″ [R]', '″');
  confronta('raggio di Einstein di un ammasso (σ = 1200 km/s, z 0,2 → 2)', R.raggioEinsteinIsoterma(1200e3, 0.2, 2) * SEC, 15, 50, '15–50″ negli ammassi ricchi [R]', '″');
  prova('massa puntiforme e sfera isoterma coincidono quando la massa dentro l\'anello è la stessa; nel modello: la galassia 0', () => {
    const s = 250e3, t = R.raggioEinsteinIsoterma(s, 0.3, 1), Dl = R.distanzaAngolare(0.3), Mdentro = (PI * s * s * t * Dl) / G; vicino(R.raggioEinstein(Mdentro, { zl: 0.3, zs: 1 }), t, 1e-9, 'M(<θ_E) = πσ²θ_E·D_l/G');
    vicino(R.raggioEinstein(MSOLE, { Dl: 4 * KPC, Ds: 8 * KPC }) * MAS, 1.0, 2e-2, 'una stella a metà strada verso il centro galattico: 1 mas (microlente)');
    const V = GA.curvaRotazione(VIA.Gx.forma, 10) * 1e3; console.log(`        la galassia 0 del modello (V = ${n(V / 1e3)} km/s a 10 kpc → σ = V/√2), messa a z = 0,3 davanti a una sorgente a z = 1: θ_E = ${n(R.raggioEinsteinIsoterma(V / Math.SQRT2, 0.3, 1) * SEC)}″`); }); }

console.log('\n— 5. LE LENTI: più immagini, più tempi —');
const MODELLO0 = VIA.Gx.forma.modello, Z_L = 0.5, Z_S = 2;
prova('la deflessione dei profili ellittici (integrali di Keeton) obbedisce a ∇·α = 2κ e ∇×α = 0, sul profilo vero della galassia 0', () => {
  const L = R.lente(R.massaDaModello(MODELLO0, { z: Z_L, inclinazione: 1.1, angolo: 0.3, schiacciata: 0.7 }), { z: Z_S, beta: [1e-7, 2e-7] }), tE = L.raggioEinstein, h = 1e-3 * tE;
  for (const [x, y] of [[0.4, -0.7], [1.3, 0.2], [-0.15, 0.1], [2.2, 1.9]]) { const X = x * tE, Y = y * tE, a = L.deflessione(X + h, Y), b = L.deflessione(X - h, Y), c = L.deflessione(X, Y + h), d = L.deflessione(X, Y - h), div = (a[0] - b[0] + c[1] - d[1]) / (2 * h), rot = (a[1] - b[1] - c[0] + d[0]) / (2 * h);
    vicino(div, 2 * L.kappa(X, Y), 2e-4, `∇·α = 2κ in (${x}, ${y}) θ_E`); assert.ok(Math.abs(rot) < 2e-4 * Math.abs(div), '∇×α = 0'); }
  // il potenziale è quello di cui α è il gradiente
  const X = 0.8 * tE, Y = 0.5 * tE; vicino((L.potenziale(X + h, Y) - L.potenziale(X - h, Y)) / (2 * h), L.deflessione(X, Y)[0], 1e-5, '∂ψ/∂x = α_x');
});
prova('una massa puntiforme: due immagini con gli ingrandimenti esatti, la loro somma è la curva di Paczyński, il ritardo quello noto; allineata: un anello', () => {
  const Dl = 4 * KPC, Ds = 8 * KPC, tE = R.raggioEinstein(MSOLE, { Dl, Ds });
  for (const u of [0.1, 0.5, 1.7]) { const L = R.lente({ distanza: Dl, massa: MSOLE }, { distanza: Ds, beta: [u * tE, 0] }); assert.equal(L.immagini.length, 2); vicino(L.raggioEinstein, tE, 1e-6, 'θ_E');
    const q = Math.sqrt(u * u + 4), piu = L.immagini.find((m) => m.parita === 'minimo'), meno = L.immagini.find((m) => m.parita === 'sella'); vicino(piu.theta[0] / tE, (u + q) / 2, 1e-8, 'θ₊'); vicino(meno.theta[0] / tE, (u - q) / 2, 1e-8, 'θ₋');
    vicino(piu.ingrandimento, 0.5 + (u * u + 2) / (2 * u * q), 1e-5, 'μ₊'); vicino(meno.ingrandimento, 0.5 - (u * u + 2) / (2 * u * q), 1e-5, 'μ₋'); vicino(L.ingrandimentoTotale, R.microlente({ M: MSOLE, Dl, Ds }).ingrandimento(u), 1e-5, 'A(u)');
    assert.equal(piu.ritardo, 0); vicino(meno.ritardo, ((4 * G * MSOLE) / C ** 3) * (0.5 * u * q + Math.log((q + u) / (q - u))), 1e-6, 'il ritardo tra le due immagini (Refsdal 1964)'); }
  const A = R.lente({ distanza: Dl, massa: MSOLE }, { distanza: Ds, beta: [0, 0] }); assert.equal(A.anello, true); vicino(A.raggioEinstein, tE, 1e-6, 'anello di Einstein'); assert.equal(A.ingrandimentoTotale, Infinity);
  const m = R.microlente({ M: 0.3 * MSOLE, Dl: 6 * KPC, Ds: 8 * KPC, u0: 0.1, v: 2e5 }); vicino(m.curva(0), m.picco, 1e-12, 'il massimo'); vicino(m.picco, 10.04, 1e-3, 'A(0,1) = 10,04'); assert.ok(m.curva(3 * m.tempoEinstein) < 1.02);
  console.log(`        microlente tipica verso il centro galattico (0,3 M☉ a 6 kpc, sorgente a 8 kpc, 200 km/s): θ_E = ${n(m.raggioEinstein * MAS)} mas, dura ${n(m.tempoEinstein / GIORNO)} giorni (osservate: per lo più 10–40 giorni [R])`);
});
confronta('raggio di Einstein di 10¹² M☉ a metà strada (z 0,5 → 2)', R.raggioEinstein(1e12 * MSOLE, { zl: Z_L, zs: Z_S }) * SEC, 0.5, 2.5, '~1″ [R] (tutta la massa dentro l\'anello)', '″');
{ // LA CROCE: la galassia 0 del modello (profilo vero: alone + disco inclinato di 63° + sferoide schiacciato 0,7) a z = 0,5, sorgente a z = 2
  const massa = R.massaDaModello(MODELLO0, { z: Z_L, inclinazione: 1.1, angolo: 0.3, schiacciata: 0.7 }), curve = R.lente(massa, { z: Z_S, beta: [1e-9, 0] }, { curve: true, griglia: 64 }), tE = curve.raggioEinstein;
  // la caustica interna (l'astroide: viene dalla curva critica di fuori); la sorgente a un terzo del suo raggio minimo, a 30° dall'asse
  const astro = curve.caustiche.filter((_, i) => Math.hypot(...curve.critiche[i]) > 0.6 * tE).map((q) => Math.hypot(q[0], q[1])), rMin = Math.min(...astro), rMax = Math.max(...astro), fi = 0.3 + PI / 6;
  const Q = R.lente(massa, { z: Z_S, beta: [0.33 * rMin * Math.cos(fi), 0.33 * rMin * Math.sin(fi)] }, { bolla: { t: 0 }, griglia: 128 }), vive = Q.immagini.filter((m) => Math.abs(m.ingrandimento) > 0.05);
  prova('dentro la caustica interna la sorgente dà una croce: quattro immagini (due minimi e due selle) più quella centrale spenta; fuori, due più una', () => {
    assert.equal(Q.immagini.length, 5, 'cinque immagini'); assert.equal(vive.length, 4, 'quattro vive'); assert.equal(vive.filter((m) => m.parita === 'minimo').length, 2); assert.equal(vive.filter((m) => m.parita === 'sella').length, 2);
    const centrale = Q.immagini.find((m) => m.parita === 'massimo'); assert.ok(centrale && Math.abs(centrale.ingrandimento) < 0.05 && Math.hypot(...centrale.theta) < 0.1 * tE, 'la quinta è al centro, spenta');
    const F = R.lente(massa, { z: Z_S, beta: [3 * rMax * Math.cos(fi), 3 * rMax * Math.sin(fi)] }); assert.equal(F.immagini.length % 2, 1, 'numero dispari'); assert.equal(F.immagini.filter((m) => Math.abs(m.ingrandimento) > 0.05).length, 2);
    // ogni immagine è un punto stazionario del tempo d'arrivo: θ − α(θ) = β
    for (const m of Q.immagini) { const a = Q.deflessione(m.theta[0], m.theta[1]); assert.ok(Math.hypot(m.theta[0] - a[0] - 0.33 * rMin * Math.cos(fi), m.theta[1] - a[1] - 0.33 * rMin * Math.sin(fi)) < 1e-8 * tE); }
    // IL CONO: la stessa sorgente, più epoche; tutte nel passato, e chi arriva più tardi mostra un istante precedente
    const cono = R.conoPassato({ t: 0 }, { comovente: R.cosmo.comovente(1 / (1 + Z_S), 1) }); vicino(Q.immagini[0].tEmissione, cono.t, 1e-12, 'la prima immagine sta sul cono');
    for (let i = 1; i < Q.immagini.length; i++) { assert.ok(Q.immagini[i].tEmissione < 0); assert.ok(Q.immagini[i].ritardo > Q.immagini[i - 1].ritardo); vicino(Q.immagini[0].tEmissione - Q.immagini[i].tEmissione, Q.immagini[i].ritardo / (1 + Z_S), 0.02, 'Δt/(1 + z_s) prima'); }
  });
  console.log(`        galassia 0 (alone ${n(MODELLO0.Mh)} M☉) a z = 0,5, sorgente a z = 2: θ_E = ${n(tE * SEC)}″; caustica interna larga ${n(2 * rMax * SEC)}″`);
  for (const m of Q.immagini) console.log(`        immagine a (${n(m.theta[0] * SEC, 3)}″, ${n(m.theta[1] * SEC, 3)}″)  ingrandimento ${n(m.ingrandimento, 3).padStart(7)}  ${m.parita.padEnd(7)}  arriva ${n(m.ritardo / GIORNO, 3)} giorni dopo la prima: mostra la sorgente ${n(m.ritardo / (1 + Z_S) / GIORNO, 3)} giorni più giovane`);
  confronta('croce di una galassia: il ritardo più lungo tra le quattro immagini vive', Math.max(...vive.map((m) => m.ritardo)) / GIORNO, 1, 100, 'da ~1 a ~100 giorni nelle croci osservate (HE 0435: 2–14; PG 1115: 10–25; RX J1131: fino a 91 [R])', 'giorni');
  // VICINO A UNA CAUSTICA: le due immagini che stanno per fondersi, seguite mentre la sorgente si avvicina alla piega
  prova('vicino a una caustica l\'ingrandimento cresce come 1/√distanza, fino alle migliaia (la stella Earendel)', () => {
    // il punto della caustica interna più vicino al centro (il mezzo di una piega, lontano dalle cuspidi) e il punto della curva
    // critica da cui viene, rifinito lungo la sua semiretta: det(∂β/∂θ) = 0
    const fuoriC = curve.critiche.map((q, i) => i).filter((i) => Math.hypot(...curve.critiche[i]) > 0.6 * tE), iMin = fuoriC.reduce((m, i) => (Math.hypot(...curve.caustiche[i]) < Math.hypot(...curve.caustiche[m]) ? i : m), fuoriC[0]);
    const fc = Math.atan2(curve.critiche[iMin][1], curve.critiche[iMin][0]), dir = [Math.cos(fc), Math.sin(fc)], det = (r) => { const J = Q.jacobiano(r * dir[0], r * dir[1]); return J[0] * J[3] - J[1] * J[2]; }; let lo = 0.6 * tE, hi = 1.6 * tE; assert.ok(det(lo) * det(hi) < 0);
    for (let k = 0; k < 60; k++) { const m = 0.5 * (lo + hi); if (det(m) * det(lo) > 0) lo = m; else hi = m; } const rc = 0.5 * (lo + hi), tc = [rc * dir[0], rc * dir[1]], a = Q.deflessione(tc[0], tc[1]), bc = [tc[0] - a[0], tc[1] - a[1]], nb = Math.hypot(bc[0], bc[1]);
    // la sorgente dentro la caustica, sulla retta che va da quel punto al centro: a un quarto della strada le immagini sono cinque,
    // e la coppia che si fonderà sulla piega è il minimo e la sella più vicini a quel punto della curva critica
    const verso = [-bc[0] / nb, -bc[1] / nb], D0 = (0.25 * nb) / tE, dista = (m) => Math.hypot(m.theta[0] - tc[0], m.theta[1] - tc[1]);
    const L5 = R.lente(massa, { z: Z_S, beta: [bc[0] + D0 * tE * verso[0], bc[1] + D0 * tE * verso[1]] }, { griglia: 160 }); assert.equal(L5.immagini.length, 5, 'dentro la caustica: cinque immagini');
    const coppia = [L5.immagini.filter((m) => m.parita === 'minimo').sort((x, y) => dista(x) - dista(y))[0], L5.immagini.filter((m) => m.parita === 'sella').sort((x, y) => dista(x) - dista(y))[0]];
    let p = coppia.map((m) => m.theta), mu = [], dist = []; for (let d = D0; d > 1e-10; d /= 2) { const b = [bc[0] + d * tE * verso[0], bc[1] + d * tE * verso[1]], q = p.map((t) => Q.segui(t, b)); if (!q[0] || !q[1] || q[0].ingrandimento * q[1].ingrandimento > 0) break; p = q.map((x) => x.theta); mu.push(Math.abs(q[0].ingrandimento) + Math.abs(q[1].ingrandimento)); dist.push(d); }
    assert.ok(mu.length > 12, 'la coppia si lascia seguire per molti dimezzamenti'); const i1 = 4, i2 = mu.length - 1, esp = Math.log(mu[i2] / mu[i1]) / Math.log(dist[i2] / dist[i1]); tra(esp, -0.56, -0.44, 'esponente della legge (−½)'); assert.ok(mu[i2] > 1000, 'migliaia');
    const k1000 = dist[mu.findIndex((x) => x > 1000)], Dsor = R.distanzaAngolare(Z_S);
    console.log(`        a ${n(dist[i1])} θ_E dalla piega: ×${n(mu[i1])}; a ${n(dist[i2])} θ_E: ×${n(mu[i2])} (esponente ${n(esp)}); oltre ×1000 quando la sorgente sta entro ${n(k1000 * tE * SEC * 1e6)} µas = ${n((k1000 * tE * Dsor) / 3.0857e16)} pc dalla caustica: solo una stella singola ci sta (Earendel: ×1000–40000 [R])`);
  }); }
{ // L'AMMASSO: un alone di 10¹⁵ M☉ con la concentrazione e il raggio che danno le leggi di galassie.js, a z = 0,54 (come MACS J1149), sorgente a z = 1,49
  const zA = 0.54, zS = 1.49, a = 1 / (1 + zA), Mh = 1e15, Rv = GA.dentro.raggioViriale(Mh, a), c = GA.dentro.concentrazione(Mh, a), massa = { z: zA, componenti: [{ sigma: R.sigmaNFW(Mh * MSOLE, Rv * KPC, c), q: 0.75, angolo: 0 }] };
  const L0 = R.lente(massa, { z: zS, beta: [1e-9, 0] }), tE = L0.raggioEinstein;
  confronta('raggio di Einstein di un ammasso di 10¹⁵ M☉ (alone del modello, z 0,54 → 1,49)', tE * SEC, 10, 50, '10–50″ negli ammassi ricchi [R]', '″');
  // più immagini solo se la sorgente sta dentro la caustica di fuori (quella «radiale», che viene dalla curva critica interna):
  // la si mette a metà del suo raggio minimo, a 0,4 rad dall'asse
  const curve = R.lente(massa, { z: zS, beta: [1e-9, 0] }, { curve: true, griglia: 64 }), radiale = curve.caustiche.filter((_, i) => Math.hypot(...curve.critiche[i]) < 0.6 * tE).map((q) => Math.hypot(q[0], q[1]));
  if (tE > 0 && radiale.length) { const rr = 0.5 * Math.min(...radiale), L = R.lente(massa, { z: zS, beta: [rr * Math.cos(0.4), rr * Math.sin(0.4)] }, { griglia: 128 }), vive = L.immagini.filter((m) => Math.abs(m.ingrandimento) > 0.05), ritardo = vive.length > 1 ? Math.max(...vive.map((m) => m.ritardo)) : 0;
    prova('ammasso: numero dispari di immagini anche qui', () => { assert.equal(L.immagini.length % 2, 1); assert.ok(L.immagini.length >= 3); });
    confronta('ammasso: il ritardo più lungo tra le immagini vive', ritardo / ANNO, 0.3, 30, '~1 anno per la supernova Refsdal (MACS J1149 [R]); 2,3 anni in SDSS J1004+4112 [R]', 'anni');
    console.log(`        (R_v = ${n(Rv / 1e3)} Mpc, c = ${n(c)}; ${L.immagini.length} immagini, ${vive.length} vive: ${vive.map((m) => `×${n(m.ingrandimento, 3)} dopo ${n(m.ritardo / ANNO, 3)} anni`).join(', ')}; separazione massima ${n(Math.max(...vive.map((m) => Math.hypot(m.theta[0] - vive[0].theta[0], m.theta[1] - vive[0].theta[1]))) * SEC)}″)`); } }

console.log('\n— 6. I CASI LIMITE —');
prova('il tempo proprio lungo la luce è zero: il limite v → c di Δt·√(1 − v²/c²); ma il fotone non ha un riferimento', () => {
  const d = 10 * AL, tau = []; for (const k of [1, 2, 4, 8, 12]) { const v = C * (1 - 10 ** -k), p = R.tempoProprio({ t: 0, x: [0, 0, 0] }, { t: d / v, x: [d, 0, 0] }); assert.equal(p.tipo, 'tempo'); assert.equal(p.riferimento, true); vicino(p.tau, (d / v) * Math.sqrt(1 - (v / C) ** 2), 1e-6, 'τ'); tau.push(p.tau); }
  for (let i = 1; i < tau.length; i++) assert.ok(tau[i] < tau[i - 1]); assert.ok(tau[tau.length - 1] < 1e-5 * tau[0]);
  const luce = R.tempoProprio({ t: 0, x: [0, 0, 0] }, { t: d / C, x: [d, 0, 0] }); assert.equal(luce.tipo, 'luce'); assert.equal(luce.tau, 0); assert.equal(luce.riferimento, false); assert.equal(R.relazione({ t: 0, x: [0, 0, 0] }, { t: d / C, x: [d, 0, 0] }), 'prima');
  assert.throws(() => R.sezioneDi({ t: 0, moto: { velocita: [C, 0, 0] } }), /velocità della luce/); assert.ok(Number.isNaN(R.tempoProprio({ t: 0, x: [0, 0, 0] }, { t: 1, x: [2 * C, 0, 0] }).tau));
  console.log(`        dieci anni luce: a 0,9 c il viaggiatore vive ${n(tau[0] / ANNO)} anni, a 0,99 c ${n(tau[1] / ANNO)}, a (1 − 10⁻¹²) c ${n(tau[4] / GIORNO * 24 * 60)} minuti; la luce: 0 — un limite, non un punto di vista`);
});
prova('la bolla che cade: dall\'orizzonte alla fine al più π·GM/c³; r dentro è un tempo; la marea spezza fuori o dentro secondo la massa; che cosa vede', () => {
  const sole = R.cadutaNelBuco(MSOLE, { massa: MSOLE, raggio: RSOLE }), sgr = R.cadutaNelBuco(4e6 * MSOLE, { massa: MSOLE, raggio: RSOLE }), m87 = R.cadutaNelBuco(6e9 * MSOLE, { massa: MSOLE, raggio: RSOLE });
  tra(sole.tempoMassimo * 1e6, 15, 16, '~15 µs per una massa solare'); tra(sgr.tempoMassimo, 55, 70, '~1 minuto per 4·10⁶ M☉'); tra(m87.tempoMassimo / GIORNO, 0.9, 1.2, '~1 giorno per 6·10⁹ M☉');
  // le due vie: la cicloide di chi cade da fermo da r0, tra l'orizzonte e il centro; da fermo appena sopra l'orizzonte è il massimo, da lontano (4/3)GM/c³
  const M = 4e6 * MSOLE, rs = R.raggioSchwarzschild(M), tra2 = (r0) => R.tempoDiCaduta(M, r0, 0) - R.tempoDiCaduta(M, r0, rs);
  vicino(tra2(rs * (1 + 1e-9)), sgr.tempoMassimo, 1e-4, 'da fermo sull\'orizzonte: π·GM/c³'); vicino(tra2(1e5 * rs), sgr.tempoDaLontano, 1e-4, 'da lontano (10⁵ r_s): (4/3)·GM/c³'); vicino(sgr.tempoRimasto(rs), sgr.tempoMassimo, 1e-12, 'tempo rimasto all\'orizzonte');
  // r è un tempo: più piccolo è r, meno ne resta, per chiunque; e qualunque caduta ne usa meno del massimo
  let prima = Infinity; for (const x of [1, 0.8, 0.5, 0.2, 0.01]) { const t = sgr.tempoRimasto(x * rs); assert.ok(t < prima); prima = t; assert.ok(R.tempoDiCaduta(M, 30 * rs, 0) - R.tempoDiCaduta(M, 30 * rs, x * rs) <= t * (1 + 1e-12), 'nessuno dura più del massimo'); }
  assert.equal(sgr.tempoRimasto(0), 0); assert.equal(sgr.vede(0).aperta, true); assert.equal(sgr.singolarita.aperta, true);
  // la marea: una stella come il Sole si spezza FUORI da un buco di 4·10⁶ M☉ e DENTRO (cioè entra intera) uno di 6·10⁹
  assert.equal(sgr.siSpezza.dentro, false); assert.equal(m87.siSpezza.dentro, true); assert.equal(sole.siSpezza.dentro, false);
  // che cosa vede: fuori, è l'ombra di chi sta fermo vista con l'aberrazione di chi cade a β = √(r_s/r) (via indipendente)
  for (const x of [50, 5, 1.6]) { const r = x * rs, b = Math.sqrt(1 / x), ps = R.ombraDaVicino(M, r), atteso = Math.acos((Math.cos(ps) + b) / (1 + b * Math.cos(ps))); vicino(sgr.vede(r).ombra, atteso, 1e-9, `l'ombra per chi cade, a ${x} r_s`); }
  vicino((sgr.vede(rs).ombra * 180) / PI, (Math.acos(23 / 31) * 180) / PI, 1e-9, 'all\'orizzonte: acos(23/31) = 42°'); vicino(sgr.vede(rs).sopra, 0.5, 1e-12, 'la luce dallo zenit: al rosso di un fattore 2'); tra((sgr.vede(1e-6 * rs).ombra * 180) / PI, 89.9, 90, 'alla fine: mezzo cielo');
  let pr = 0; for (const x of [100, 10, 3, 1.5, 1, 0.5, 0.1, 0.001]) { const o = sgr.vede(x * rs).ombra; assert.ok(o > pr, 'l\'ombra cresce cadendo'); pr = o; }
  console.log(`        dall'orizzonte alla fine, al più: ${n(sole.tempoMassimo * 1e6)} µs (1 M☉), ${n(sgr.tempoMassimo)} s (4·10⁶ M☉), ${n(m87.tempoMassimo / 3600)} ore (6·10⁹ M☉); cadendo da lontano: ${n(sgr.tempoDaLontano)} s`);
  console.log(`        il Sole si spezza a ${n(sgr.siSpezza.r / sgr.orizzonte)} r_s da 4·10⁶ M☉ (fuori: lo si vede) e a ${n(m87.siSpezza.r / m87.orizzonte)} r_s da 6·10⁹ M☉ (dentro: entra intero)`);
  console.log(`        chi cade vede il disco nero largo ${n((sgr.vede(10 * rs).ombra * 180) / PI)}° a 10 r_s, ${n((sgr.vede(rs).ombra * 180) / PI)}° all'orizzonte (non tutto il cielo), 90° alla fine; il cielo sopra non diventa blu: ν/ν₀ = ${n(sgr.vede(rs).sopra)}    [dentro: derivata; a r = 0: aperta]`);
});
prova('ciò che resta ricostruibile: tre numeri; i passati compatibili sono e^(S/k), S/k = 4πGM²/ħc (a* = 0)', () => {
  const p = R.passatiCompatibili(R.bucoNero({ massaKg: MSOLE })); assert.deepEqual(p.parametri, ['massa', 'momento angolare', 'carica']); vicino(p.lnPassati, (4 * PI * G * MSOLE ** 2) / (COSTANTI.hbar * C), 1e-9, 'S/k_B'); tra(p.lnPassati, 1.0e77, 1.1e77, '10⁷⁷ per una massa solare');
  vicino(R.passatiCompatibili({ massaKg: 3 * MSOLE }).lnPassati, 9 * p.lnPassati, 1e-9, 'va come M²'); assert.ok(R.passatiCompatibili({ massaKg: MSOLE, spin: 0.9 }).lnPassati < p.lnPassati, 'a parità di massa, ruotando l\'area è minore');
  // due buchi che si fondono: l'area (e i passati compatibili) non diminuisce mai — GW150914: 36 + 29 → 62 M☉, a* ≈ 0,67 [R]
  const prima = R.passatiCompatibili({ massaKg: 36 * MSOLE }).lnPassati + R.passatiCompatibili({ massaKg: 29 * MSOLE }).lnPassati, dopo = R.passatiCompatibili({ massaKg: 62 * MSOLE, spin: 0.67 }).lnPassati; assert.ok(dopo > prima, 'teorema dell\'area (Hawking 1971)');
  console.log(`        un buco di 1 M☉: 10^(${n(p.log10Passati)}) passati compatibili (il Sole, da stella, ha un'entropia di ~10⁵⁸ k_B: cadendo, l'informazione persa è quasi tutta) — GW150914: da 10^(${n(prima / Math.LN10)}) a 10^(${n(dopo / Math.LN10)})    [derivata, mai misurata]`);
});
{ // l'orizzonte delle particelle nel tempo: la fonte buona è ragnatela.js (con la radiazione); la si importa, se c'è
  let TAB = null; try { TAB = (await import('../src/camera/ragnatela.js')).dentro.TAB; } catch (e) { console.log('        (ragnatela.js non si è aperta: ' + e.message + ')'); }
  const oggi = R.orizzonteParticelle(0, TAB), aRic = 1 / 1090, tRic = R.cosmo.tempo(aRic) - R.T_OGGI, ric = R.orizzonteParticelle(tRic, TAB), senza = R.orizzonteParticelle(tRic);
  if (TAB) confronta('orizzonte delle particelle oggi (da ragnatela.js, con la radiazione)', oggi.comovente / MPC / 1e3, 14.0, 14.4, '14,2 Gpc [R]', 'Gpc');
  prova('l\'orizzonte delle particelle cresce col tempo; alla ricombinazione la regione in contatto causale era piccola', () => { assert.ok(ric.comovente < 0.05 * oggi.comovente); assert.ok(R.orizzonteParticelle(-5e9 * ANNO, TAB).comovente < oggi.comovente); vicino(ric.proprio, ric.a * ric.comovente, 1e-12, 'proprio = a·comovente'); });
  console.log(`        alla ricombinazione (a = 1/1090): ${n(ric.comovente / MPC)} Mpc comoventi = ${n(ric.proprio / MPC)} Mpc di allora (${ric.fonte}); senza la radiazione verrebbe ${n(senza.comovente / MPC)} Mpc`); }

console.log('\n— LO STATO SPERIMENTALE (relativita.js STATO) —');
prova('ogni legge dichiara il suo stato: misurata (con la misura), derivata e mai osservata, aperta', () => {
  for (const s of R.STATO) { assert.ok(['misurata', 'derivata e mai osservata', 'aperta'].includes(s.stato), s.legge); assert.ok(s.legge && s.misura && s.fonte && s.funzioni); }
  for (const st of ['misurata', 'derivata e mai osservata', 'aperta']) { console.log(`      ${st.toUpperCase()}`); for (const s of R.STATO.filter((x) => x.stato === st)) console.log(`        · ${s.legge}`); }
});

console.log('\n— RISCONTRI: modello / vero —'); for (const r of tabella) console.log(`  ${r[3] === 'torna' ? '·' : '≠'} ${r[0]} | ${r[1]} | ${r[2]} | ${r[3]}`);
console.log(`\ntest_relativita: ${ok} prove passate in ${((performance.now() - T0) / 1e3).toFixed(1)} s` + (nonTorna.length ? `; ${nonTorna.length} riscontri con il vero NON TORNANO:` : '; tutti i riscontri con il vero tornano'));
for (const x of nonTorna) console.log('  ≠ NON TORNA: ' + x);
