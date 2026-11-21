// sistema.js — UN SISTEMA PLANETARIO nello spazio, per il motore 3D (nucleo.js).
//
// La stella, i pianeti e le lune stanno dove sono davvero in quel momento (spazio3d.js `corpiSistema`: orbite
// inclinate ed eccentriche, assi, giri), in metri, e si muovono col tempo del mondo. Da lontano ogni corpo è una sfera
// illuminata dalla stella (un gigante gassoso con le sue fasce, un pianeta con gli anelli); la stella è una sfera che
// brilla, col suo alone; le orbite sono linee sottili. Avvicinandosi a un pianeta solido, quello diventa il pianeta
// vero di pianeta.js — lo STESSO corpo: stesso posto, stesso asse, stesso giro — con rilievo, mare, aria e nuvole.
// La camera si attacca da sé al corpo dentro la cui influenza entra (nucleo.js: `influenza`).
//
// uso:  const sis = creaSistema(N, { via: { cosmo, galassia, stella }, superficie: (viaPianeta) => superficieDi(viaPianeta),
//                                    genitore (il corpo-riferimento della galassia, o niente), posizione, assi });
//       N.attacca(sis.nodo, { distanza: … });   sis.pianeta(i) → il corpo del pianeta i;   sis.libera()
import { V, GLSL_PROFONDITA_V, GLSL_PROFONDITA_F, coloreCorpoNero, luminanzaUno } from './nucleo.js';
import { creaPianeta, fabbricaAnello, V_SFERA, F_SFERA } from './pianeta.js';
import { creaPunti } from './luci.js';
import { sistema, ramiCosmo } from '../camera/cosmo.js';
import { nomeFonte } from './bolla.js';
import { corpiSistema, scenaSistema } from '../camera/spazio3d.js';
import { creaBucoNero } from './buconero.js';
import { COSTANTI } from '../camera/leggi.js';
import { creaMinori } from './minori.js';

// un buco nero nel mondo: lo strato di buconero.js (nel modo «scena»: piega ciò che gli altri hanno disegnato) più il
// TEMPO PROPRIO di chi gli sta vicino: per chi sta fermo a r il suo secondo vale 1/√(1 − 2r_g/r) secondi di chi sta
// lontano (relativita.js `ritmoFermo`); lo si dice al nucleo (`tempo.ritmo`), che fa scorrere il mondo di conseguenza.
// Sopra 10⁵ r_g la differenza è sotto una parte su centomila e non si tocca niente.
export function bucoNelMondo(N, opzioni) {
  const b = creaBucoNero(N, { accrescimento: 0, modo: 'scena', luce: null, ...opzioni }), aggiorna = b.aggiorna;
  b.aggiorna = (S) => { aggiorna.call(b, S); const r = b.stato.distanza; if (r > 2.02 && r < 1e5) N.tempo.ritmo = Math.min(N.tempo.ritmo || 1, Math.sqrt(1 - 2 / r)); };
  return b;
}

const UA = 1.495978707e11;
const V_ORBITA = `
in vec3 a_p; uniform mat4 u_proj; uniform mat3 u_vista, u_quadro; uniform float u_fc; uniform vec3 u_C; out float v_w; out float v_d;
void main() { vec3 e = u_vista * (u_C + u_quadro * a_p); v_d = length(e); gl_Position = u_proj * vec4(e, 1.0);${GLSL_PROFONDITA_V} }`;
const F_ORBITA = `
in float v_w; in float v_d; uniform float u_fc; uniform vec4 u_tinta; out vec4 o_col; // (una linea sottile, aggiunta alla luce che c'è)
void main() { o_col = vec4(u_tinta.rgb, 0.0);${GLSL_PROFONDITA_F} }`;

export function creaSistema(N, { via, superficie = () => null, genitore = null, posizione = null, assi = null, opzioni = {} } = {}) {
  const gl = N.gl, O = { orbite: true, dettaglio: true, ...opzioni }, Sis = sistema(via.cosmo, via.galassia, via.stella), defs = corpiSistema(via.cosmo, via.galassia, via.stella);
  if (!defs.length) return null; // la stella non è ancora nata
  // (la luce della stella col suo colore vero, a luminanza 1: un foglio bianco sotto di lei vale 1. L'occhio che si adatta a
  // quel colore — prima qui, a mano, «0,45 + 0,55·colore» — è in nucleo.js: OCCHIO, von Kries col grado di CIECAM02)
  const Tstella = Sis.stella.T || 5772, nero = coloreCorpoNero(Tstella), coloreLuce = luminanzaUno(nero);
  // il riferimento del sistema (il suo baricentro, coi suoi assi): dentro la galassia, se c'è, altrimenti la radice
  const lontanoMax = Math.max(1, ...Sis.pianeti.map((P) => P.aM || 0));
  const nodo = N.corpo({ nome: `sistema ${via.stella}`, luogo: `stella ${via.stella}`, genitore, posizione, assi, raggio: 0, influenza: Math.max(3 * lontanoMax, 40 * UA) });
  const corpi = [], schede = [];
  // LE VELOCITÀ dei corpi (per il cono di luce del nucleo: un corpo si vede dov'era quando è partita la luce): due stati
  // del sistema a un minuto l'uno dall'altro, una volta per istante (prima tutti a t − 60 s, poi tutti a t: così chi
  // tiene lo stato in spazio3d.js lo rifà due volte per fotogramma, non due per corpo)
  const PASSO_V = 60, memoV = { t: NaN, v: defs.map(() => [0, 0, 0]) }, _pa = defs.map(() => [0, 0, 0]), _pb = [0, 0, 0];
  const velocitaDi = (k) => (t, out = [0, 0, 0]) => {
    if (memoV.t !== t) { for (let j = 0; j < defs.length; j++) defs[j].posizione(t - PASSO_V, _pa[j]); for (let j = 0; j < defs.length; j++) { defs[j].posizione(t, _pb); const v = memoV.v[j]; v[0] = (_pb[0] - _pa[j][0]) / PASSO_V; v[1] = (_pb[1] - _pa[j][1]) / PASSO_V; v[2] = (_pb[2] - _pa[j][2]) / PASSO_V; } memoV.t = t; }
    const v = memoV.v[k]; out[0] = v[0]; out[1] = v[1]; out[2] = v[2]; return out; };
  for (const c of defs) {
    const g = c.genitore < 0 ? nodo : corpi[c.genitore], P = c.cosa === 'pianeta' ? Sis.pianeti[c.id] : null, L = c.cosa === 'luna' ? Sis.pianeti[c.pianeta].lune.find((l) => l.id === c.id) : null;
    // (il nome del suo luogo, per la bolla — bolla.js —, e i suoi periodi: quando il tempo corre troppo per vederlo girare, il nucleo lo ferma)
    const luogo = c.cosa === 'stella' ? null : `${c.cosa} ${c.id}`, periodi = P ? { giro: P.bloccato ? 0 : P.giorno || 0, orbita: P.anno || 0 } : L ? { giro: L.periodo || 0, orbita: L.periodo || 0 } : null;
    const corpo = N.corpo({ ...c, luogo, periodi, velocita: velocitaDi(corpi.length), genitore: g, solido: true, assetto: c.assetto || null, luce: c.cosa === 'stella' ? { colore: coloreLuce, T: Tstella } : null,
      // fin dove la camera si attacca a questo corpo: un pianeta 50 raggi (ma dentro l'orbita della sua prima luna larga), una luna 12
      influenza: c.cosa === 'pianeta' ? 50 * c.raggio : c.cosa === 'luna' ? Math.min(12 * c.raggio, 0.3 * (L?.aM || 1e12)) : 0 });
    corpi.push(corpo); schede.push({ c, corpo, P, L, anello: P && P.anello && typeof P.anello.densita === 'function' ? fabbricaAnello(N, P) : null, vero: null, rel: [0, 0, 0], sole: [1, 0, 0], E: 0 });
  }
  const stella = corpi[0]; nodo.stella = stella; stella.luminosita = defs[0].luminosita;
  // se la «stella» è un buco nero (il resto di una stella grande: stelle.fine), lo si vede com'è: l'ombra e il cielo
  // piegato attorno. La massa è quella del suo orizzonte (spazio3d.js dà il raggio di Schwarzschild); niente disco: il
  // modello non gli dà niente da inghiottire. Sotto 2,5 r_g non si scende (lì chi sta fermo non esiste quasi più).
  const eBuco = Sis.stella.stato === 'buco nero' || (!(defs[0].luminosita > 0) && defs[0].raggio < 1e6 && Sis.stella.massa > 2.5), massaBuco = eBuco ? (defs[0].raggio * COSTANTI.c ** 2) / (2 * COSTANTI.G) : 0;
  const buco = eBuco ? bucoNelMondo(N, { corpo: stella, massaKg: massaBuco, radice: nomeFonte(via, 'buco'), rami: ramiCosmo(via.cosmo) }) : null; // (la radice: un nome per la fonte del caso, quello di sempre — bolla.js `nomeFonte`)
  if (buco) { stella.raggio = 2.5 * buco.raggioGravitazionale; stella.influenza = 2000 * buco.raggioGravitazionale; }
  const punti = creaPunti(N), alone = punti.insieme(1), segni = punti.insieme(defs.length), posS = new Float32Array(3 * defs.length), luceS = new Float32Array(4 * defs.length), prgSfera = N.programma(V_SFERA, F_SFERA, { a_angolo: 0 });
  const quadrato = (() => { const vao = gl.createVertexArray(), b = gl.createBuffer(); gl.bindVertexArray(vao); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0); gl.bindVertexArray(null); return { vao, b }; })();
  // le orbite: 2048 lati ciascuna, riferite al corpo attorno a cui girano (gli elementi sono quelli di oggi). (Erano 256: la
  // spezzata si staccava dalla curva vera di a·(1 − cos(π/256)) ≈ 7,5·10⁻⁵·a, 11 000 km a 1 UA, e accanto al pianeta la linea
  // passava lontano da lui; con 2048 lati lo scarto è 1,2·10⁻⁶·a, e da mezzo centesimo di a — dove la linea comincia a vedersi,
  // sotto — vale un quarto di milliradiante, meno di mezzo punto dello schermo)
  const orbite = (() => {
    if (!O.orbite) return []; const sc = scenaSistema(via.cosmo, via.galassia, via.stella, 0), out = []; let k = 0;
    for (const q of sc.corpi) { const s = schede[k++]; if (!q.orbita || !s) continue; const { a, e, assi: [Pv, Qv] } = q.orbita, n = 2049, v = new Float32Array(3 * n), b = a * Math.sqrt(1 - e * e);
      for (let i = 0; i < n; i++) { const E = (i / (n - 1)) * 2 * Math.PI, x = a * (Math.cos(E) - e), y = b * Math.sin(E); for (let d = 0; d < 3; d++) v[3 * i + d] = x * Pv[d] + y * Qv[d]; }
      const vao = gl.createVertexArray(), buf = gl.createBuffer(); gl.bindVertexArray(vao); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, v, gl.STATIC_DRAW); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0); gl.bindVertexArray(null);
      out.push({ vao, buf, n, attorno: s.corpo.genitore, luna: s.c.cosa === 'luna', a, v: Float64Array.from(v), nrm: [Pv[1] * Qv[2] - Pv[2] * Qv[1], Pv[2] * Qv[0] - Pv[0] * Qv[2], Pv[0] * Qv[1] - Pv[1] * Qv[0]] }); }
    return out;
  })();
  let prgOrbita = null; const u9 = new Float32Array(9), pos1 = new Float32Array(3), luce1 = new Float32Array(4);
  // QUANTO SI VEDE UN'ORBITA da dove sta l'occhio (c: il corpo attorno a cui gira, visto dall'occhio; q: gli assi del sistema
  // per righe; l'occhio nel riferimento dell'orbita è qᵀ·(−c)). Un'orbita è un segno per chi la guarda dall'alto:
  // · DI TAGLIO — l'occhio quasi nel suo piano rispetto a quanto ne dista: altezza sul piano / distanza dal punto più vicino
  //   della linea sotto 0,03 — è una retta (o due, il lato vicino e quello lontano) che attraversa tutta la vista: all'avvio,
  //   accanto al pianeta, le orbite degli altri pianeti e delle sue lune. Si spegne lì, piena da 0,12 (7°);
  // · se l'occhio sta quasi SULLA linea (accanto al corpo che la percorre: dentro la sua sfera di Hill e oltre) la linea gli
  //   passa accanto, a qualunque altezza: si spegne sotto mezzo centesimo di a, piena a due centesimi.
  const rampa = (x, a, b) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  function vistaOrbita(o, c, q) {
    const x = -(q[0] * c[0] + q[3] * c[1] + q[6] * c[2]), y = -(q[1] * c[0] + q[4] * c[1] + q[7] * c[2]), z = -(q[2] * c[0] + q[5] * c[1] + q[8] * c[2]), v = o.v, nn = o.nrm;
    let m = Infinity;
    for (let i = 0; i < o.n - 1; i++) { const ax = v[3 * i], ay = v[3 * i + 1], az = v[3 * i + 2], bx = v[3 * i + 3] - ax, by = v[3 * i + 4] - ay, bz = v[3 * i + 5] - az, px = x - ax, py = y - ay, pz = z - az, bb = bx * bx + by * by + bz * bz;
      const f = bb > 0 ? Math.max(0, Math.min(1, (px * bx + py * by + pz * bz) / bb)) : 0, dx = px - f * bx, dy = py - f * by, dz = pz - f * bz, d2 = dx * dx + dy * dy + dz * dz; if (d2 < m) m = d2; }
    const dOrb = Math.sqrt(m), alto = Math.abs(x * nn[0] + y * nn[1] + z * nn[2]);
    return rampa(alto / Math.max(dOrb, 1e-9), 0.03, 0.12) * rampa(dOrb / o.a, 0.005, 0.02);
  }

  const strato = {
    nome: 'sistema',
    aggiorna(S) {
      const cam = N.camera;
      for (const s of schede) {
        S.versoCorpo(s.corpo, s.rel); const d = V.lungo(s.rel);
        if (s.corpo !== stella) { const vs = N.tra(s.corpo, stella, S.t); s.E = stella.luminosita / (4 * Math.PI * V.scal(vs, vs)); V.norma(vs, s.sole); }
        S.bersaglio({ p: s.rel, raggio: s.corpo.raggio, corpo: s.corpo });
        // il pianeta vero: lo si prepara quando ci si avvicina (uno alla volta), lo si lascia quando si è lontani
        if (O.dettaglio && s.P && s.P.tipo !== 'gassoso' && s.P.interno) {
          const vicino = d < 400 * s.corpo.raggio;
          if (vicino && !s.vero) { for (const x of schede) if (x.vero && x !== s) { x.vero.libera(); x.vero = null; } const viaP = { ...via, pianeta: s.c.id }; s.vero = creaPianeta(N, { P: s.P, stella: Sis.stella, via: viaP, superficie: () => superficie(viaP), corpi: { pianeta: s.corpo, stella }, opzioni: O.pianeta || {} }); }
          else if (!vicino && s.vero && d > 900 * s.corpo.raggio) { s.vero.libera(); s.vero = null; }
        }
      }
      // la luce che l'occhio chiede: quella della stella dove si è (se non lo dice già un pianeta vero vicino)
      const dS = V.lungo(schede[0].rel), suPianeta = schede.some((s) => s.vero && V.lungo(s.rel) < 400 * s.corpo.raggio);
      if (!suPianeta && dS < 30 * nodo.influenza) S.proponiLuce((0.6 * stella.luminosita) / (4 * Math.PI * Math.max(dS, stella.raggio * 3) ** 2));
      // i segnaposto: un pianeta lontano è molto più piccolo di un punto dello schermo e quasi buio; perché si veda dov'è gli si
      // mette un puntino del suo colore, sempre della stessa forza (non è luce vera: è un segno)
      { let k = 0; const forza = (0.35 * 4 * Math.PI * S.E0 * 20) / (Math.PI * S.fuoco * S.fuoco) / 1e20, px = (2 * S.tanY) / S.H;
        for (const s of schede) { if (s.corpo === stella || s.c.cosa === 'luna') continue; const d2 = V.scal(s.rel, s.rel); if (s.corpo.raggio / Math.sqrt(d2) > 0.7 * px) continue; const col = s.c.colore || [170, 170, 165]; posS.set(s.rel, 3 * k); luceS.set([(col[0] / 255) * forza * d2, (col[1] / 255) * forza * d2, (col[2] / 255) * forza * d2, 1], 4 * k); k++; }
        segni.metti(posS, luceS, k); }
      pos1.set(schede[0].rel); luce1.set([nero[0] * stella.luminosita * 1e-20, nero[1] * stella.luminosita * 1e-20, nero[2] * stella.luminosita * 1e-20, 1]); alone.metti(pos1, luce1, 1);
    },
    disegna(S, passata) {
      if (passata === 'solido') {
        const u = prgSfera.u; gl.useProgram(prgSfera.p); gl.bindVertexArray(quadrato.vao);
        gl.uniformMatrix4fv(u.u_proj, false, S.proj); gl.uniformMatrix3fv(u.u_vista, false, S.vista); gl.uniform1f(u.u_fc, S.fc); gl.uniform1f(u.u_espo, 1); gl.uniform1f(u.u_notte, (S.luceGalassia || 0) / 4 / S.E0); gl.uniform2f(u.u_minimo, (1.6 * S.tanY * 2) / S.H, 0);
        // (un buco nero non è una sfera nera: lo disegna il suo strato)
        for (const s of schede) {
          if (s.vero || (buco && s.corpo === stella)) continue; const c = s.corpo; gl.uniform4f(u.u_sfera, s.rel[0], s.rel[1], s.rel[2], c.raggio);
          if (c === stella) { gl.uniform4f(u.u_tinta, nero[0], nero[1], nero[2], Math.min(6.5e4, S.espo(stella.luminosita / (4 * Math.PI * c.raggio ** 2))) /* (al più quanto l'immagine a 16 bit tiene) */); gl.uniform4f(u.u_ombra, 0, 0, 0, 0); gl.uniform4f(u.u_asse, 0, 1, 0, 0); gl.uniform3f(u.u_luce, 0, 0, 0); gl.uniform3f(u.u_sole, 1, 0, 0); }
          else {
            const col = s.c.colore || [170, 170, 165], k = S.espo(s.E), gas = s.P && s.P.tipo === 'gassoso', A = c.assetto ? S.assetto(c) : null; gl.uniform4f(u.u_tinta, (col[0] / 255) ** 2.2, (col[1] / 255) ** 2.2, (col[2] / 255) ** 2.2, 0);
            gl.uniform3f(u.u_luce, coloreLuce[0] * k, coloreLuce[1] * k, coloreLuce[2] * k); gl.uniform3fv(u.u_sole, s.sole); gl.uniform4f(u.u_asse, A ? A[1] : 0, A ? A[4] : 1, A ? A[7] : 0, gas ? 1 : 0);
            // l'ombra del pianeta sulla sua luna
            const g = s.c.cosa === 'luna' ? schede.find((x) => x.corpo === c.genitore) : null; if (g) gl.uniform4f(u.u_ombra, g.rel[0], g.rel[1], g.rel[2], g.corpo.raggio); else gl.uniform4f(u.u_ombra, 0, 0, 0, 0);
          }
          gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        }
        gl.bindVertexArray(null); return;
      }
      if (passata !== 'velato') return;
      for (const s of schede) if (s.anello) s.anello.disegna(S, { centro: s.rel, A: S.assetto(s.corpo), sole: s.sole, luce: coloreLuce, espo: S.espo(s.E), schiaccia: 1 - Math.min(0.3, s.P.schiacciamento || 0) });
      alone.disegna(S, 1e20, 1.5); segni.disegna(S, 1e20, 1.5);
      if (orbite.length) { // le orbite: più tenui da vicino (quando il corpo è grande sullo schermo non servono)
        if (!prgOrbita) prgOrbita = N.programma(V_ORBITA, F_ORBITA, { a_p: 0 }); const u = prgOrbita.u, q = N.quadro(nodo, S.t) || V.identita(); gl.useProgram(prgOrbita.p);
        gl.uniformMatrix4fv(u.u_proj, false, S.proj); gl.uniformMatrix3fv(u.u_vista, false, S.vista); gl.uniform1f(u.u_fc, S.fc); for (let c = 0; c < 3; c++) for (let r = 0; r < 3; r++) u9[3 * c + r] = q[3 * r + c]; gl.uniformMatrix3fv(u.u_quadro, false, u9);
        const dS = V.lungo(schede[0].rel);
        for (const o of orbite) { const c = S.versoCorpo(o.attorno); let vista = Math.min(1, dS / (0.02 * o.a)) * (o.luna ? 0.5 : 1) * Math.min(1, (30 * nodo.influenza) / Math.max(dS, 1)); if (vista < 0.02) continue;
          vista *= vistaOrbita(o, c, q); if (vista < 0.02) continue;
          gl.uniform3f(u.u_C, c[0], c[1], c[2]); gl.uniform4f(u.u_tinta, 0.05 * vista, 0.065 * vista, 0.1 * vista, 1); gl.bindVertexArray(o.vao); gl.drawArrays(gl.LINE_STRIP, 0, o.n); }
        gl.bindVertexArray(null);
      }
    },
  };
  N.aggiungi(strato);
  // i corpi minori (minori.js): la polvere che diffonde la luce della stella, i corpi delle fasce, le comete attive
  const minori = O.minori === false || buco ? null : creaMinori(N, { via, nodo, stella, luminosita: stella.luminosita, raggioStella: stella.raggio, T: Tstella, coloreLuce, opzioni: O.minori || {} });
  return {
    nodo, stella, corpi, schede, Sis, coloreLuce, minori,
    pianeta: (i) => schede.find((s) => s.c.cosa === 'pianeta' && s.c.id === i)?.corpo || null,
    vero: () => schede.find((s) => s.vero)?.vero || null, scheda: (corpo) => schede.find((s) => s.corpo === corpo) || null,
    // che cosa è un corpo, in parole (per la riga in basso)
    descrivi(corpo) { const s = schede.find((x) => x.corpo === corpo); if (!s) return ''; if (s.c.cosa === 'stella') return `la stella: ${Tstella.toFixed(0)} K, raggio ${(corpo.raggio / 6.957e8).toFixed(2)} raggi solari`; if (s.P) return `il pianeta ${s.c.id + 1}: ${s.P.tipo}, raggio ${(corpo.raggio / 1000).toFixed(0)} km, a ${((s.P.aM || 0) / UA).toFixed(2)} UA${s.P.anello ? ', con gli anelli' : ''}${(s.P.lune || []).length ? `, ${(s.P.lune || []).length} lune` : ''}`; return `una luna del pianeta ${s.c.pianeta + 1}: raggio ${(corpo.raggio / 1000).toFixed(0)} km`; },
    buco, libera() { N.togli(strato); if (minori) minori.libera(); if (buco) N.togli(buco); for (const s of schede) { if (s.vero) s.vero.libera(); if (s.anello) s.anello.libera(); } for (const o of orbite) { gl.deleteBuffer(o.buf); gl.deleteVertexArray(o.vao); } punti.libera(); gl.deleteBuffer(quadrato.b); gl.deleteVertexArray(quadrato.vao);
      for (const c of [nodo, ...corpi]) { const i = N.corpi.indexOf(c); if (i >= 0) N.corpi.splice(i, 1); } },
  };
}
