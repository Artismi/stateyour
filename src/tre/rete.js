// rete.js — LA RAGNATELA COSMICA COME SI VEDREBBE: la luce di tutte le galassie che non sono nell'elenco.
//
// Che cosa si disegna. Le galassie dell'elenco (spazio3d.js `scenaCosmo`) sono un campione: ognuna ne rappresenta
// `peso` vere (~10⁵). La luce di tutte le altre — galassie nane e non, mai elencate: la nebbia della regola 9 — sta
// dove sta la materia: addensata nei fogli, lungo i filamenti, nei nodi. Qui la materia è fatta dei suoi ELEMENTI
// (ragnatela.js: i nodi di una griglia, tutti della stessa massa, ognuno col suo tensore di marea): ogni elemento porta
// la densità che Zel'dovich gli dà a quel tempo, ρ/ρ̄ = 1/|Π(1 − D·λ_i)|, e la luce in proporzione (la somma di tutte è la
// luce di tutto il cosmo, Σ luminosità × peso del campione: nessun numero messo a mano): dove la materia è crollata
// lungo due assi (un filamento) la cella brilla qualche volta più della media, in un vuoto qualche volta meno. Niente linee, niente colori scelti: la
// tinta è la media (pesata con la luce) di quelle delle galassie del campione; quanto si vede lo decide l'esposizione.
// IL CONO DI LUCE: ciò che sta a distanza comovente χ si vede com'era quando la luce è partita: con la crescita D di
// allora (le strutture lontane sono meno marcate) e più debole di (1 + z)² (l'espansione); le due tabelle, in
// funzione di χ, le dà chi chiama (universo.js, da relativita.js `conoPassato`).
// PIGRO: tutto il toro a grana grossa (le onde del campo, ≥ 50 Mpc) e, attorno a chi guarda, una regione più fine con
// le onde più corte (`raffina`), rifatta in secondo piano quando ci si sposta; dentro la regione fine la grana grossa
// non si disegna (sarebbe la stessa luce due volte).
// COME: la nebbia è liscia e copre lo schermo decine di volte: la si disegna su un'immagine quattro volte più piccola
// per lato e la si aggiunge al fondo (sedici volte meno punti da riempire; non si vede la differenza).
// Che cosa NON è vero (dichiarato): gli elementi restano dove sono nati (lo spostamento di Zel'dovich, qualche Mpc,
// non è applicato: sotto la lunghezza delle onde più corte); dopo il crollo lungo un asse il volume non torna a
// crescere (la densità si ferma a 50 volte la media); la luce segue la massa (le galassie vere preferiscono i posti densi
// più di così); il colore lontano non è spostato verso il rosso (solo l'intensità).

const NT = 16; // punti delle tabelle lungo il cono
const V_RETE = `
in vec4 a_p; in vec4 a_l;    // posizione comovente (m, dall'angolo del toro) e lato della cella (m comoventi); i tre autovalori di marea
uniform mat4 u_proj; uniform mat3 u_vista; uniform float u_fc;
uniform vec3 u_occhio;       // chi guarda, nelle stesse coordinate
uniform vec4 u_k;            // luce di un elemento / (4π·E0) (in unità 10³⁰); fuoco in pixel dell'immagine piccola; lato massimo in pixel; fattore di scala di adesso
uniform vec4 u_toro;         // lato del toro (m comoventi); χ massimo delle tabelle; larghezza di un batuffolo rispetto alla sua cella; 0
uniform vec4 u_buco;         // la regione dove questa grana non si disegna: centro (m comoventi) e mezzo lato (0: nessuna)
uniform vec3 u_tab[${NT}];   // lungo il cono, a χ = k·χmax/${NT - 1}: la crescita D di quando la luce è partita, (a_e/a_o)², e 1/(media di ρ/ρ̄ sugli elementi) a quella D
out vec3 v_c;
void main() {
  vec3 rel = a_p.xyz - u_occhio; rel = mod(rel + 0.5 * u_toro.x, u_toro.x) - 0.5 * u_toro.x; // l'immagine più vicina (il toro si richiude)
  if (u_buco.w > 0.0) { vec3 q = a_p.xyz - u_buco.xyz; q = abs(mod(q + 0.5 * u_toro.x, u_toro.x) - 0.5 * u_toro.x); if (max(q.x, max(q.y, q.z)) < u_buco.w) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; } }
  vec3 es = u_vista * (rel * 1e-15); float chi = max(length(es), 1e-9); // (distanze in 10¹⁵ m: i quadrati di 10²⁵ non stanno in 32 bit)
  float x = clamp(chi * 1e15 / u_toro.y, 0.0, 1.0) * ${NT - 1}.0; int i = int(min(floor(x), ${NT - 2}.0)); vec3 tb = mix(u_tab[i], u_tab[i + 1], x - float(i));
  float vol = clamp(abs((1.0 - tb.x * a_l.x) * (1.0 - tb.x * a_l.y) * (1.0 - tb.x * a_l.z)), 0.02, 12.0);
  float lato = a_p.w * 1e-15 * u_toro.z / chi * u_k.y, visto = clamp(lato, 1.5, u_k.z);
  // la luce della cella sparsa sul suo disco: L/(4π·d²·E0) per angolo solido, rispetto al foglio bianco (E0/π); d = a·χ.
  // Quanta ne ha: in proporzione alla densità della materia lì, ρ/ρ̄ = 1/volume (la somma su tutte resta la luce del cosmo)
  float d = chi * u_k.w; v_c = vec3(u_k.x / (d * d)) * (tb.y * tb.z / vol) * (4.0 * u_k.y * u_k.y / (visto * visto));
  v_c *= 1.0 - smoothstep(0.5 * u_k.z, u_k.z, lato); // da dentro un elemento la sua luce è tutta intorno: svanisce
  vec4 pr = u_proj * vec4(es, 0.0);
  gl_Position = pr.w > 0.0 && lato < u_k.z ? vec4(pr.xy / pr.w, 0.0, 1.0) : vec4(2.0, 2.0, 2.0, 1.0); gl_PointSize = visto;
}`;
const F_RETE = `
in vec3 v_c; out vec4 o_col;
void main() { float q = length(gl_PointCoord - 0.5) * 2.0; if (q > 1.0) discard; float a = 1.0 - q * q; o_col = vec4(v_c * a * a * 1.5, 0.0); }`; // (1,5: il disco con questo profilo porta 2/3 della luce di uno pieno)
const F_COPIA = `in vec2 v_uv; uniform sampler2D u_img; uniform vec3 u_tinta; out vec4 o_col; void main() { o_col = vec4(texture(u_img, v_uv).r * u_tinta, 0.0); }`;

// cosmo: il numero del cosmo; luce: W di tutta la nebbia (Σ L·peso del campione); tinta: [r, g, b] lineari (massimo 1)
export function creaRete(N, { cosmo, luce, tinta = [1, 0.9, 0.8], toroM, opzioni = {} } = {}) {
  const gl = N.gl, O = { grossa: 48, fine: 44, latoFine: 0.22, kmaxFine: 72, riduzione: 4, larghezza: 1.7, media: 0.05, ...opzioni };
  const prg = N.programma(V_RETE, F_RETE, { a_p: 0, a_l: 1 }), prgCopia = N.programma(N.V_SCHERMO, F_COPIA), massimo = Math.min(256, Math.floor(gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE)[1]));
  const insieme = () => { const vao = gl.createVertexArray(), b = gl.createBuffer(); return { vao, b, n: 0, dati: null, cellaM: 0, centro: null, mezzo: 0 }; };
  function metti(o, d) { gl.bindVertexArray(o.vao); gl.bindBuffer(gl.ARRAY_BUFFER, o.b); gl.bufferData(gl.ARRAY_BUFFER, d.dati, gl.STATIC_DRAW); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 32, 0); gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 32, 16); gl.bindVertexArray(null); o.n = d.celle ** 3; o.dati = d.dati; o.cellaM = d.cellaM; }
  const grossa = insieme(), fine = insieme(); let filo = null, nRichiesta = 0, inCorso = null, msUltimo = 0, pronta = false, errore = null;
  function chiedi(regione, celle, kmax) { if (!filo) { filo = new Worker(new URL('./rete.worker.js', import.meta.url), { type: 'module' }); filo.onmessage = (e) => arrivata(e.data); filo.onerror = (e) => { errore = e.message; inCorso = null; }; }
    inCorso = { n: ++nRichiesta, regione }; filo.postMessage({ n: inCorso.n, cosmo, regione, celle, kmax }); }
  function arrivata(d) { const r = inCorso; inCorso = null; if (d.errore) { errore = d.errore; console.error('la ragnatela non si è potuta calcolare:', d.errore); return; } msUltimo = d.ms;
    if (!r || d.n !== r.n) return; if (!r.regione) { metti(grossa, d); pronta = true; } else { metti(fine, d); fine.centro = r.regione.centro; fine.mezzo = r.regione.lato / 2; } N.cambia(); }
  chiedi(null, O.grossa, 0);
  // l'immagine piccola su cui si disegna la nebbia
  let img = null, tel = null, iw = 0, ih = 0;
  function immagine(W, H) { const w = Math.max(8, Math.ceil(W / O.riduzione)), h = Math.max(8, Math.ceil(H / O.riduzione)); if (w === iw && h === ih) return; if (img) { gl.deleteTexture(img); gl.deleteFramebuffer(tel); } iw = w; ih = h; img = N.immagine(w, h, 'rgba16f', null); tel = N.telaio(img, null); }
  const tab = new Float32Array(3 * NT), stato = { E: 0, elementi: 0, ms: 0 };
  // la media di ρ/ρ̄ = 1/|Π(1 − D·λ)| sugli elementi (uno ogni 5 della grana grossa), a una data crescita D
  const medie = new Map(); function mediaDensita(D) { const k = Math.round(D * 2000); let m = medie.get(k); if (m != null) return m; const A = grossa.dati; if (!A) return 1; let s = 0, c = 0;
    for (let q = 0; q < grossa.n; q += 5) { const v = Math.min(12, Math.max(0.02, Math.abs((1 - D * A[8 * q + 4]) * (1 - D * A[8 * q + 5]) * (1 - D * A[8 * q + 6])))); s += 1 / v; c++; } m = s / c; if (medie.size > 400) medie.clear(); medie.set(k, m); return m; }
  const o = {
    stato, pronta: () => pronta, errore: () => errore, opzioni: O,
    // occhio: [x, y, z] comoventi (m); a: il fattore di scala di adesso; tabelle: (χ) → [D, (a_e/a_o)²]; chiMax
    aggiorna(S, occhio, a, tabella, chiMax) {
      for (let k = 0; k < NT; k++) { const v = tabella((k * chiMax) / (NT - 1)); tab[3 * k] = v[0]; tab[3 * k + 1] = v[1]; tab[3 * k + 2] = 1 / mediaDensita(v[0]); } o._occhio = occhio; o._a = a; o._chiMax = chiMax;
      // la regione fine segue chi guarda: la si rifà quando ci si è spostati di un quinto del suo lato dal suo centro
      // (centrata su un nodo della grana grossa e larga un numero dispari di celle grosse: ne copre di intere)
      const lato = O.latoFine * toroM;
      if (pronta && !inCorso && O.fine > 0) { let lontano = Infinity; if (fine.centro) { lontano = 0; for (let k = 0; k < 3; k++) { let x = occhio[k] - fine.centro[k]; x -= Math.round(x / toroM) * toroM; lontano = Math.max(lontano, Math.abs(x)); } }
        if (lontano > lato / 5) { const passo = toroM / O.grossa; chiedi({ centro: occhio.map((x) => Math.round(x / passo) * passo), lato: (2 * Math.floor(lato / passo / 2) + 1) * passo }, O.fine, O.kmaxFine); } }
      // quanta luce arriva dalla nebbia (un elemento ogni 37 della grana grossa): per l'esposizione
      if (grossa.dati) { let E = 0; const D = grossa.dati, n = grossa.n, Lel = luce / n; for (let q = 0; q < n; q += 37) { let d2 = 0; for (let k = 0; k < 3; k++) { let x = D[8 * q + k] - occhio[k]; x -= Math.round(x / toroM) * toroM; d2 += x * x; } E += Lel / (4 * Math.PI * Math.max(d2, D[8 * q + 3] ** 2) * a * a); } stato.E = E * 37; }
      stato.elementi = grossa.n + fine.n; stato.ms = msUltimo;
      // la luce che l'occhio chiede: che la nebbia valga in media `media` (i filamenti, qualche volta di più)
      return stato.E > 0 ? (Math.PI * stato.E) / (O.media * 4 * Math.PI) : 0;
    },
    disegna(S, forza = 1) {
      if (!grossa.n || !o._occhio) return; immagine(S.W, S.H);
      const prima = gl.getParameter(gl.FRAMEBUFFER_BINDING), u = prg.u, oc = o._occhio;
      gl.bindFramebuffer(gl.FRAMEBUFFER, tel); gl.viewport(0, 0, iw, ih); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE);
      gl.useProgram(prg.p); gl.uniformMatrix4fv(u.u_proj, false, S.proj); gl.uniformMatrix3fv(u.u_vista, false, S.vista); gl.uniform3f(u.u_occhio, oc[0], oc[1], oc[2]); gl.uniform3fv(u.u_tab, tab);
      const fuoco = S.fuoco / O.riduzione, una = (ins, buco) => { if (!ins.n) return; const Lel = (luce * (ins.cellaM / toroM) ** 3) / 1e30;
        gl.uniform4f(u.u_k, (Lel * forza) / (4 * Math.PI * S.E0), fuoco, massimo, o._a); gl.uniform4f(u.u_toro, toroM, o._chiMax, O.larghezza, 0);
        gl.uniform4f(u.u_buco, buco ? buco.centro[0] : 0, buco ? buco.centro[1] : 0, buco ? buco.centro[2] : 0, buco ? buco.mezzo : 0); gl.bindVertexArray(ins.vao); gl.drawArrays(gl.POINTS, 0, ins.n); };
      una(grossa, fine.n ? fine : null); una(fine, null); gl.bindVertexArray(null);
      // sull'immagine vera: aggiunta al fondo, con la sua tinta
      gl.bindFramebuffer(gl.FRAMEBUFFER, prima); gl.viewport(0, 0, S.W, S.H); gl.useProgram(prgCopia.p); N.lega(0, img, prgCopia.u.u_img); gl.uniform3f(prgCopia.u.u_tinta, tinta[0], tinta[1], tinta[2]); S.schermo(); gl.disable(gl.BLEND);
    },
    libera() { if (filo) filo.terminate(); for (const x of [grossa, fine]) { gl.deleteBuffer(x.b); gl.deleteVertexArray(x.vao); } if (img) { gl.deleteTexture(img); gl.deleteFramebuffer(tel); } gl.deleteProgram(prg.p); gl.deleteProgram(prgCopia.p); },
  };
  return o;
}
