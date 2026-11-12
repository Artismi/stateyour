// quanti.js — SOTTO L'ATOMO, COME LO VEDREBBE UNO STRUMENTO. Uno strato del nucleo (nucleo.js: { nome, aggiorna,
// disegna, sopra, libera }).
//
// Che cosa si vede, e perché (le leggi sono tutte in src/camera/quanti.js, con fonte e stato sperimentale):
//   · NON È LUCE. Sotto l'atomo nessuna luce visibile rimbalza e torna all'occhio. Come per il buco nero (buconero.js:
//     lì si segue la luce vera), qui si mostra ciò che misura uno strumento vero: un RIVELATORE DI POSIZIONE che, a ogni
//     misura, trova l'elettrone in un punto (il microscopio a fotoionizzazione di Stodolna et al. 2013, che compone
//     l'immagine dell'idrogeno elettrone per elettrone). Il verde è quello del fosforo P43 (545 nm) dello schermo dietro
//     le piastre a microcanali di quel rivelatore: è la luce dello strumento, non dell'atomo. Una riga a schermo lo dice.
//   · OGNI PUNTO È UN EVENTO: la misura k ha l'indirizzo «atomo/misura k» e l'istante t₀ + k·periodo nel tempo del
//     motore; il suo esito è tirato dalla |ψ|² dell'atomo (esatta per l'idrogeno; campo centrale di Slater per gli altri
//     atomi; Hartree-Fock della sua molecola se è legato, come l'ossigeno dell'acqua del modello). La nuvola non è
//     disegnata: emerge, misura dopo misura. Ogni punto è largo quanto la FINESTRA σ dello strumento.
//   · L'INDETERMINAZIONE: dalle ultime misure parte una SCIA, il cammino che l'elettrone farebbe in un'unità atomica di
//     tempo (2,4·10⁻¹⁷ s) con l'impulso misurato subito dopo la posizione. L'impulso esce dalla trasformata di Fourier
//     (FFT) dello stato ridotto dalla misura: con la finestra stretta i punti sono nitidi e le scie lunghe e sparse in ogni
//     verso; con la finestra larga i punti sono sfocati e le scie corte (`sigma` si cambia al volo).
//   · IL MOTO: una sovrapposizione (una PREPARAZIONE scelta da chi guarda: `atomo.preparazione`) oscilla al ritmo dei
//     battimenti; al tempo vero del motore è più veloce di un fotogramma e si vede la media (regola 11); rallentando il
//     tempo (10⁻¹⁶ s per secondo) la si vede muoversi. Per le sovrapposizioni le misure vecchie si spengono in un quarto
//     di battimento (è l'esposizione dello strumento); per gli stati fermi si accumulano.
//   · LA DECOERENZA: il tempo in cui l'ambiente (`ambiente`) distingue le parti della sovrapposizione (Joos-Zeh) è detto
//     nella riga: se è più corto di un battimento ciò che si vede è già un insieme di esiti, non una cosa che interferisce.
//   · IL NUCLEO: avvicinandosi al centro, le istantanee del nucleo (eventi «atomo/nucleo/istantanea j»): protoni e
//     neutroni ai posti tirati dalla densità misurata, ognuno con i suoi tre quark. I neutroni non hanno carica (li vede
//     una sonda di materia, non il rivelatore di carica): sono in blu, per convenzione; il quark u (+2/3) nel verde della
//     carica positiva, il d (−1/3) in magenta, con la luminosità proporzionale alla carica.
// Tutto pigro: lo stato si calcola solo per l'atomo guardato (in un worker), le misure solo per la finestra di tempo
// che si mostra (al più `memoria`), gli impulsi solo per le ultime `scie`.
//
// L'USO (anche sotto la vista degli atomi):
//   const q = creaQuanti(N, { atomo: atomoDaScena(scena, i), luogo: corpoDellaScena, scala: 1e-9 });
//     atomo   { Z, indirizzo, pos, molecola?, preparazione?, carica? } (camera/quanti.js `atomoDaScena`)
//     luogo   il corpo del nucleo nei cui assi stanno le posizioni della scena (null: la radice)
//     scala   metri per unità di atomo.pos (una scena in nm: 1e-9; se manca: atomo.scala, o 1)
//   altre opzioni (SCELTE DELLO STRUMENTO, non del mondo): sigma (a₀, 0,25), periodo (secondi di mondo tra due misure;
//   se manca: un 150-esimo dei secondi di mondo per secondo al momento della creazione), memoria (30000 misure), scie (48),
//   N (lato della griglia della FFT, 32), ambiente ({ n, massaKg, T, raggioM } o { fotoni: T }; se manca: il fondo
//   cosmico), didascalia (true), istantanee (160), worker (true), t0 (quando si accende lo strumento: adesso).
//   q.corpo è il corpo dell'atomo (la camera vi si può attaccare); q.opzioni si può cambiare (sigma); q.libera().
import * as Q from '../camera/quanti.js';
import { AU } from '../camera/quanti.js';

const FOSFORO = [0.25, 1.0, 0.18], COL = [FOSFORO, FOSFORO, [0.32, 0.42, 0.95], FOSFORO, [0.95, 0.3, 0.9]]; // elettrone, protone, neutrone, u, d
const V_PUNTI = `
in vec4 a_p; in vec2 a_q;        // posizione (unità dello strato) e k; tipo (0 e⁻, 1 p, 2 n, 3 u, 4 d) e luce propria
uniform mat4 u_proj; uniform mat3 u_vista, u_quadro; uniform vec3 u_centro;
uniform float u_k, u_kmin, u_esposizione, u_fuoco, u_luce, u_massimo, u_passato; uniform vec4 u_sig; uniform float u_sigE;
out vec3 v_col; out float v_luce;
void main() {
  float eta = u_k - a_p.w; int tipo = int(a_q.x + 0.5);
  if (a_p.w < u_kmin || eta < -0.5) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); gl_PointSize = 0.0; return; }
  vec3 e = u_vista * (u_centro + u_quadro * a_p.xyz); vec4 pr = u_proj * vec4(e, 1.0);
  gl_Position = pr.w > 0.0 ? vec4(pr.xy / pr.w, 0.0, 1.0) : vec4(2.0, 2.0, 2.0, 1.0);
  float sg = tipo == 0 ? u_sigE : tipo == 1 || tipo == 2 ? u_sig.x : u_sig.y;
  float vero = 2.5 * sg * u_fuoco / max(1e-9, -e.z), s = clamp(vero, 1.5, u_massimo);
  gl_PointSize = s;
  v_col = tipo == 0 ? vec3(${COL[0]}) : tipo == 1 ? vec3(${COL[1]}) : tipo == 2 ? vec3(${COL[2]}) : tipo == 3 ? vec3(${COL[3]}) : vec3(${COL[4]});
  float f = eta < 0.5 ? 1.0 : u_passato * exp(-eta / u_esposizione), k = tipo >= 3 ? (sg / u_sig.x) * (sg / u_sig.x) : 1.0;
  v_luce = u_luce * a_q.y * f * k / max(2.25, vero * vero);
}`;
const F_PUNTI = `in vec3 v_col; in float v_luce; out vec4 o; void main() { vec2 d = gl_PointCoord * 2.0 - 1.0; float r2 = dot(d, d); if (r2 > 1.0) discard; o = vec4(v_col * v_luce * 3.2 * exp(-4.5 * r2), 0.0); }`;
const V_SCIE = `in vec4 a_p; uniform mat4 u_proj; uniform mat3 u_vista, u_quadro; uniform vec3 u_centro; out float v_luce;
void main() { vec3 e = u_vista * (u_centro + u_quadro * a_p.xyz); vec4 pr = u_proj * vec4(e, 1.0); gl_Position = pr.w > 0.0 ? vec4(pr.xy / pr.w, 0.0, 1.0) : vec4(2.0, 2.0, 2.0, 1.0); v_luce = a_p.w; }`;
const F_SCIE = `in float v_luce; out vec4 o; void main() { o = vec4(vec3(${FOSFORO}) * v_luce, 0.0); }`;

const fmt = (x, c = 2) => (!Number.isFinite(x) ? '∞' : Math.abs(x) >= 1e4 || (Math.abs(x) < 1e-2 && x !== 0) ? x.toExponential(c - 1).replace('.', ',').replace('e', '·10^').replace('+', '') : String(+x.toPrecision(c)).replace('.', ','));
const tempoUmano = (s) => (!Number.isFinite(s) ? 'mai' : s < 1e-12 ? `${fmt(s * 1e15)} fs` : s < 1e-9 ? `${fmt(s * 1e12)} ps` : s < 1e-6 ? `${fmt(s * 1e9)} ns` : s < 1 ? `${fmt(s * 1e3)} ms` : s < 3.2e7 ? `${fmt(s)} s` : `${fmt(s / 3.156e7)} anni`);

export function creaQuanti(N, opzioni = {}) {
  const O = { atomo: null, luogo: null, scala: null, sigma: 0.25, periodo: null, memoria: 30000, scie: 48, N: 32, ambiente: null, didascalia: true, istantanee: 160, worker: true, t0: N.tempo.t, tVolo: 1, ...opzioni };
  const gl = N.gl, A = { ...O.atomo }, scala = O.scala ?? A.scala ?? 1, pos = (A.pos || [0, 0, 0]).map((v) => v * scala), indirizzo = A.indirizzo || `atomo Z=${A.Z}`;
  const tau = O.periodo || Math.max(1e-30, Math.abs(N.tempo.velocita || 1) / 150), t0 = O.t0, K = O.memoria;
  // ---------- la decoerenza (camera/quanti.js `decoerenza`): Δx tra le parti della preparazione, l'atomo grande quanto il suo raggio
  let deco = null;
  const conPeso = (A.preparazione || []).filter((t) => (Array.isArray(t.c) ? Math.hypot(t.c[0], t.c[1]) : Math.abs(t.c)) > 0);
  if (conPeso.length > 1) {
    const [p1, p2] = conPeso, dx = Math.abs(p1.l - p2.l) === 1 ? (2 * Q.dipoloRadiale(p1.n, p1.l, p2.n, p2.l, A.Z)) / Math.sqrt(3) : Math.abs(Q.rMedio(p1.n, p1.l, A.Z) - Q.rMedio(p2.n, p2.l, A.Z));
    deco = Q.decoerenza({ ambiente: O.ambiente || { fotoni: 2.7255 }, raggioM: Math.max(Q.rMedio(p1.n, p1.l, A.Z), Q.rMedio(p2.n, p2.l, A.Z)) * AU.a0, separazioneM: dx * AU.a0 });
    A.tempoDecoerenza = deco.tempo;
  }
  const nuc = Q.nucleo(A.Z), est0 = 4 * Q.rMedio(1, 0, Math.max(1, A.Z === 1 ? 1 : 1.5)) + 4;
  const corpo = N.corpo({ nome: `atomo ${A.Z}`, luogo: O.luogo, genitore: O.luogo, raggio: est0 * AU.a0, posizione: (t, o) => { o[0] = pos[0]; o[1] = pos[1]; o[2] = pos[2]; return o; } });
  // ---------- lo stato e le misure (nel worker)
  let info = null, errore = null, inAttesa = false, haLo = -1, haHi = -2;
  const dati = new Float32Array(4 * K), tipi = new Float32Array(2 * K), impulsi = new Map();
  let wk = null;
  const ricevi = (m) => {
    if (m.tipo === 'pronto') { info = m.info; corpo.raggio = Math.min(info.estensione, 40) * AU.a0; N.cambia(); return; }
    if (m.tipo === 'errore') { errore = m.messaggio; inAttesa = false; console.error('quanti:', m.messaggio); return; }
    if (m.tipo !== 'misure') return; inAttesa = false;
    if (m.chiesta !== generazione) return; // (una risposta vecchia, dopo un salto nel tempo)
    for (let k = m.da; k <= m.a; k++) { const o = 8 * (k - m.da), s = k % K; dati[4 * s] = m.dati[o]; dati[4 * s + 1] = m.dati[o + 1]; dati[4 * s + 2] = m.dati[o + 2]; dati[4 * s + 3] = k; tipi[2 * s] = 0; tipi[2 * s + 1] = 1; if (Number.isFinite(m.dati[o + 3])) impulsi.set(k, [m.dati[o + 3], m.dati[o + 4], m.dati[o + 5]]); }
    if (haHi < m.da - 1 || haLo < 0) haLo = m.da; haHi = m.a; for (const k of impulsi.keys()) if (k < haHi - 4 * O.scie) impulsi.delete(k);
    sporco = true; N.cambia();
  };
  let generazione = 0, sporco = false, statoLocale = null;
  if (O.worker && typeof Worker !== 'undefined') { try { wk = new Worker(new URL('./quanti.worker.js', import.meta.url), { type: 'module' }); wk.onmessage = (e) => ricevi(e.data); } catch { wk = null; } }
  const manda = (m) => { if (wk) wk.postMessage(m); else setTimeout(() => { // (senza worker: lo stesso lavoro qui, a pezzi)
    try { if (m.tipo === 'stato') { statoLocale = Q.statoDi(m.atomo); ricevi({ tipo: 'pronto', info: { tipo: statoLocale.tipo, elettroni: statoLocale.elettroni, estensione: statoLocale.estensione, energia: statoLocale.energia ?? null, componenti: statoLocale.componenti.map((c) => c.nome), periodoBattimento: statoLocale.periodoBattimento ?? null } }); }
      else { const n = m.a - m.da + 1, out = new Float32Array(8 * n); for (let k = m.da; k <= m.a; k++) { const r = Q.misura(statoLocale, m.indirizzo, k, { t: (k * m.tau) / AU.t, sigma: m.sigma, impulso: k >= m.impulsoDa, N: m.N }), o = 8 * (k - m.da); out.set([r.x[0], r.x[1], r.x[2], r.p ? r.p[0] : NaN, r.p ? r.p[1] : NaN, r.p ? r.p[2] : NaN, r.componente, 0], o); } ricevi({ tipo: 'misure', da: m.da, a: m.a, dati: out, chiesta: m.chiesta }); } }
    catch (err) { ricevi({ tipo: 'errore', messaggio: String(err) }); } }, 0); };
  manda({ tipo: 'stato', atomo: A });
  let sigmaUsata = O.sigma;
  function chiedi(kNow) {
    if (!info || inAttesa || kNow < 0) return;
    const lo = Math.max(0, kNow - K + 1), svuota = () => { haLo = -1; haHi = -2; generazione++; impulsi.clear(); for (let s = 0; s < K; s++) dati[4 * s + 3] = -1e30; sporco = true; };
    if (O.sigma !== sigmaUsata) { sigmaUsata = O.sigma; svuota(); } // (un altro strumento: le misure si rifanno)
    if (haHi > kNow || (haHi >= 0 && haHi < lo - 1)) svuota(); // (salto nel tempo)
    const da = Math.max(lo, haHi + 1); if (da > kNow) return;
    const pezzo = info.tipo === 'molecola' ? 1500 : 4000, a = Math.min(kNow, da + pezzo - 1);
    // gli impulsi solo per le ultime misure (quelle che hanno la scia)
    inAttesa = true; manda({ tipo: 'misure', da, a, sigma: O.sigma, tau, impulsoDa: Math.max(da, kNow - O.scie + 1), N: O.N, indirizzo, chiesta: generazione });
  }
  // ---------- il nucleo: le istantanee (sul filo della pagina: sono poche e piccole)
  const nNuc = nuc.A, perIst = nNuc * 4, KN = O.istantanee, datiN = new Float32Array(4 * KN * perIst), tipiN = new Float32Array(2 * KN * perIst), fatteN = new Map();
  function istantanee(jNow) { let cambiato = false; const lo = Math.max(0, jNow - KN + 1);
    for (let j = lo; j <= jNow; j++) { const s = j % KN; if (fatteN.get(s) === j) continue; fatteN.set(s, j); cambiato = true; const ist = Q.istantanea(nuc, `${indirizzo}/nucleo`, j); let q = s * perIst;
      for (const nu of ist.nucleoni) { const put = (p, tipo, luce) => { datiN.set([p[0], p[1], p[2], j], 4 * q); tipiN[2 * q] = tipo; tipiN[2 * q + 1] = luce; q++; }; put(nu.pos, nu.tipo === 'p' ? 1 : 2, nu.tipo === 'p' ? 1 : 0.6); for (const k of nu.quark) put(k.pos, k.sapore === 'u' ? 3 : 4, k.sapore === 'u' ? 2 / 3 : 1 / 3); }
      for (; q < (s + 1) * perIst; q++) datiN[4 * q + 3] = -1e30; }
    return cambiato; }
  // ---------- la scheda grafica
  const prg = N.programma(V_PUNTI, F_PUNTI, { a_p: 0, a_q: 1 }), prgS = N.programma(V_SCIE, F_SCIE, { a_p: 0 });
  const vao = gl.createVertexArray(), bP = gl.createBuffer(), bQ = gl.createBuffer(), vaoN = gl.createVertexArray(), bPN = gl.createBuffer(), bQN = gl.createBuffer(), vaoS = gl.createVertexArray(), bS = gl.createBuffer();
  const prepara = (v, bp, bq, p, q) => { gl.bindVertexArray(v); gl.bindBuffer(gl.ARRAY_BUFFER, bp); gl.bufferData(gl.ARRAY_BUFFER, p, gl.DYNAMIC_DRAW); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 0, 0); gl.bindBuffer(gl.ARRAY_BUFFER, bq); gl.bufferData(gl.ARRAY_BUFFER, q, gl.DYNAMIC_DRAW); gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 0, 0); gl.bindVertexArray(null); };
  for (let s = 0; s < K; s++) dati[4 * s + 3] = -1e30; prepara(vao, bP, bQ, dati, tipi); prepara(vaoN, bPN, bQN, datiN, tipiN);
  const scie = new Float32Array(8 * O.scie); gl.bindVertexArray(vaoS); gl.bindBuffer(gl.ARRAY_BUFFER, bS); gl.bufferData(gl.ARRAY_BUFFER, scie, gl.DYNAMIC_DRAW); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 0, 0); gl.bindVertexArray(null);
  // ---------- la riga a schermo
  let riga = null; if (O.didascalia && typeof document !== 'undefined' && N.tela.parentNode) { riga = document.createElement('div'); riga.style.cssText = 'position:absolute;left:10px;right:10px;bottom:8px;color:#cfe8c8;font:12px/1.3 system-ui,sans-serif;text-shadow:0 0 3px #000;pointer-events:none;white-space:nowrap;overflow:hidden;text-overflow:ellipsis'; N.tela.parentNode.appendChild(riga); }
  const _v = [0, 0, 0], u9 = new Float32Array(9), stato = { kNow: -1, misure: 0, distanza: 0, nucleoVisibile: false, info: () => info, decoerenza: deco, periodo: tau, t0 };
  let kmin = 0, esposizione = 1e30, nScie = 0, jNow = -1;
  const strato = {
    nome: 'quanti', corpo, stato, opzioni: O, nucleo: nuc,
    aggiorna(S) {
      S.versoCorpo(corpo, _v); const d = Math.hypot(_v[0], _v[1], _v[2]); stato.distanza = d;
      const kNow = Math.floor((S.t - t0) / tau); stato.kNow = kNow; chiedi(kNow);
      kmin = Math.max(0, kNow - K + 1, haLo); stato.misure = haHi >= kmin ? Math.min(haHi, kNow) - kmin + 1 : 0;
      esposizione = info && info.periodoBattimento ? Math.max(4, info.periodoBattimento / 4 / tau) : 1e30;
      if (sporco) { gl.bindBuffer(gl.ARRAY_BUFFER, bP); gl.bufferSubData(gl.ARRAY_BUFFER, 0, dati); gl.bindBuffer(gl.ARRAY_BUFFER, bQ); gl.bufferSubData(gl.ARRAY_BUFFER, 0, tipi); sporco = false; }
      // le scie: dalla posizione misurata, l'impulso misurato subito dopo per tVolo unità atomiche di tempo (m = 1)
      nScie = 0; for (let k = Math.min(kNow, haHi); k > Math.min(kNow, haHi) - O.scie && k >= kmin; k--) { const p = impulsi.get(k); if (!p) continue; const s = k % K, x = dati[4 * s], y = dati[4 * s + 1], z = dati[4 * s + 2], l = Math.exp(-(kNow - k) / (O.scie / 3)) * 0.6; scie.set([x, y, z, l, x + p[0] * O.tVolo, y + p[1] * O.tVolo, z + p[2] * O.tVolo, 0], 8 * nScie); nScie++; }
      if (nScie) { gl.bindBuffer(gl.ARRAY_BUFFER, bS); gl.bufferSubData(gl.ARRAY_BUFFER, 0, scie, 0, 8 * nScie); }
      // il nucleo: si calcola solo quando sullo schermo è più largo di mezzo pixel
      const rN = (nuc.raggio || 1) * 1e-15; stato.nucleoVisibile = d > 0 && (rN / d) * S.fuoco > 0.5;
      if (stato.nucleoVisibile) { jNow = kNow; if (istantanee(jNow)) { gl.bindBuffer(gl.ARRAY_BUFFER, bPN); gl.bufferSubData(gl.ARRAY_BUFFER, 0, datiN); gl.bindBuffer(gl.ARRAY_BUFFER, bQN); gl.bufferSubData(gl.ARRAY_BUFFER, 0, tipiN); } }
      // i bersagli per la rotella: l'atomo da fuori, poi il nucleo
      const rA = corpo.raggio * 0.25; if (d > 2 * rA) S.bersaglio({ p: _v.slice(), raggio: rA, corpo }); else if (d > 3 * rN) S.bersaglio({ p: _v.slice(), raggio: rN, corpo });
    },
    disegna(S, passata) {
      if (passata !== 'velato') return; const d = stato.distanza; if (!(d > 0)) return;
      const q = N.quadro(O.luogo, S.t) || [1, 0, 0, 0, 1, 0, 0, 0, 1]; for (let c = 0; c < 3; c++) for (let r = 0; r < 3; r++) u9[3 * c + r] = q[3 * r + c];
      gl.disable(gl.DEPTH_TEST); gl.blendFunc(gl.ONE, gl.ONE);
      const usa = (p, unita) => { gl.useProgram(p.p); gl.uniformMatrix4fv(p.u.u_proj, false, S.proj); gl.uniformMatrix3fv(p.u.u_vista, false, S.vista); gl.uniformMatrix3fv(p.u.u_quadro, false, u9); gl.uniform3f(p.u.u_centro, _v[0] / unita, _v[1] / unita, _v[2] / unita); };
      // gli elettroni (in a₀)
      if (stato.misure > 0) {
        usa(prg, AU.a0); const rPx = Math.max(6, ((info ? Math.min(info.estensione, 40) : 4) * 0.35 * AU.a0 / d) * S.fuoco), area = Math.min(Math.PI * rPx * rPx, S.W * S.H); // (la luce di tutte le misure non supera quella che riempie lo schermo)
        gl.uniform1f(prg.u.u_k, stato.kNow); gl.uniform1f(prg.u.u_kmin, kmin); gl.uniform1f(prg.u.u_esposizione, esposizione); gl.uniform1f(prg.u.u_fuoco, S.fuoco); gl.uniform1f(prg.u.u_massimo, 96);
        gl.uniform1f(prg.u.u_luce, (0.35 * area) / Math.max(30, Math.min(stato.misure, esposizione * 3))); gl.uniform1f(prg.u.u_passato, 1); gl.uniform1f(prg.u.u_sigE, Math.max(O.sigma, 0.02)); gl.uniform4f(prg.u.u_sig, 0.5, 0.06, 0, 0);
        gl.bindVertexArray(vao); gl.drawArrays(gl.POINTS, 0, K);
        if (nScie) { usa(prgS, AU.a0); gl.bindVertexArray(vaoS); gl.drawArrays(gl.LINES, 0, 2 * nScie); }
      }
      // il nucleo (in fm): l'istantanea di adesso piena, le precedenti che si spengono
      if (stato.nucleoVisibile) {
        usa(prg, 1e-15); gl.uniform1f(prg.u.u_k, jNow); gl.uniform1f(prg.u.u_kmin, Math.max(0, jNow - KN + 1)); gl.uniform1f(prg.u.u_esposizione, KN / 2); gl.uniform1f(prg.u.u_fuoco, S.fuoco); gl.uniform1f(prg.u.u_massimo, 256);
        const vn = (2.5 * 0.5 * S.fuoco) / Math.max(1e-6, d / 1e-15); gl.uniform1f(prg.u.u_luce, 0.25 * Math.max(2.25, vn * vn)); gl.uniform1f(prg.u.u_passato, 0.03); gl.uniform1f(prg.u.u_sigE, O.sigma); gl.uniform4f(prg.u.u_sig, 0.5, 0.06, 0, 0); // (σ del nucleone: la sua carica, r ≈ 0,84 fm/√3; dei quark: la risoluzione dello strumento)
        gl.bindVertexArray(vaoN); gl.drawArrays(gl.POINTS, 0, KN * perIst);
      }
      gl.bindVertexArray(null); gl.enable(gl.DEPTH_TEST); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    },
    sopra() {
      if (!riga) return; const n = stato.misure, vicino = stato.nucleoVisibile;
      let decoTesto = 'stato stazionario: niente che interferisca';
      if (deco && info && info.periodoBattimento) decoTesto = deco.tempo > (info && info.periodoBattimento || 0) * 4 ? `decoerenza ${tempoUmano(deco.tempo)} (Joos–Zeh): sovrapposizione che interferisce (~${fmt(deco.tempo / info.periodoBattimento)} battimenti)` : `decoerenza ${tempoUmano(deco.tempo)} (Joos–Zeh): già un insieme di esiti, non interferisce`;
      riga.textContent = errore ? `quanti: ${errore.split('\n')[0]}` : vicino
        ? `Non è luce: ogni punto è un nucleone o un quark dove una misura lo troverebbe · istantanea ${jNow}, Z = ${nuc.Z}, A = ${nuc.A} · colore = carica (blu n, verde +, magenta −)`
        : `Non è luce: ogni punto è una misura (un evento) di un rivelatore di posizione, nel verde del suo fosforo · ${n} misure, σ = ${fmt(O.sigma)} a₀ · ${decoTesto}`;
    },
    libera() { if (wk) wk.terminate(); if (riga) riga.remove(); for (const b of [bP, bQ, bPN, bQN, bS]) gl.deleteBuffer(b); for (const v of [vao, vaoN, vaoS]) gl.deleteVertexArray(v); gl.deleteProgram(prg.p); gl.deleteProgram(prgS.p); N.togliCorpo && N.togliCorpo(corpo); },
  };
  N.aggiungi(strato); return strato;
}
