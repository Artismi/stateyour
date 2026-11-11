// unita.js — le grandezze vere.
//
// Il motore lavora in unità sue: una regione è larga 1000 unità e la luce fa 40
// unità per unità di tempo. Qui si passa dalle grandezze vere (metri, secondi,
// tesla, masse delle particelle) a quelle del motore, in modo che i rapporti
// restino quelli veri: il raggio di un protone in un campo, la vita di un muone
// che corre, la distanza tra i pianeti.

export const C_LUCE = 2.998e8; // m/s
export const E_SU_MEC = 586.7; // e/(m_e·c), in 1/(T·m): lega il campo vero a quello del motore
export const ME_MEV = 0.511; // la massa dell'elettrone, in MeV
export const C_MOTORE = 40;

// le unità di un pezzo di spazio largo «lato» metri (1000 unità del motore)
export function unita(latoMetri, unitaPerLato = 1000) {
  const l = latoMetri / unitaPerLato, tu = (C_MOTORE * l) / C_LUCE;
  return {
    l, tu,
    B: (tesla) => C_MOTORE * E_SU_MEC * tesla * l, // il campo nel motore
    tempo: (secondi) => secondi / tu,
    metri: (u) => u * l,
  };
}

// la velocità (nel motore) di una particella di massa m (in masse dell'elettrone) e impulso p (MeV/c)
export const velocita = (pMeV, m) => { const pm = pMeV / (m * ME_MEV); return (C_MOTORE * pm) / Math.sqrt(1 + pm * pm); };

// il catalogo vero: masse in masse dell'elettrone, vite vere (convertite nel tempo del motore).
// camminoLibero: la strada media prima di un urto con la materia (dipende da quanta ce n'è).
// Le figlie. Con la relatività (è il caso di tutte le regioni del cosmo) vale la CINEMATICA VERA di mondo.js: «canali»
// elenca le figlie di ogni modo possibile, dal più ricco al più povero (nasce il primo per cui l'energia basta), con
// tutte le figlie, anche quelle che non si vedono e non si seguono («persa»: i neutrini, il nucleone e il nucleo
// colpiti): così energia, impulso e carica tornano. «bersaglio» è il corpo fermo contro cui avviene l'urto: un
// nucleone per il protone; per la luce un nucleo intero (ossigeno: i granelli dell'anello sono ghiaccio) che fa da
// «spettatore», cioè prende solo l'impulso che avanza. «figli» (angoli e quote) resta per i mondi senza relatività.
export function catalogoVero(u, { urtoProtone = Infinity, urtoFotone = Infinity } = {}) {
  const t = (s) => u.tempo(s), urtato = ['protone lento', 'neutrone'];
  return {
    protone: { q: 1, m: 1836.15, camminoLibero: urtoProtone, bersaglio: 'neutrone',
      canali: [[...urtato, 'pione+', 'pione-', 'pione0', 'pione0'], [...urtato, 'pione+', 'pione-', 'pione0'], [...urtato, 'pione+', 'pione-'], [...urtato, 'pione0'], urtato],
      figli: [
        { specie: 'protone lento', angolo: [-6, 6], quota: [0.45, 0.8] },
        { specie: 'pione+', angolo: [-25, 25], quota: [0.03, 0.15] },
        { specie: 'pione-', angolo: [-25, 25], quota: [0.03, 0.12] },
        { specie: 'pione0', angolo: [-20, 20], quota: [0.03, 0.15] },
        { specie: 'pione0', angolo: [-30, 30], quota: [0.02, 0.1] },
      ] },
    'protone lento': { q: 1, m: 1836.15 },
    'pione+': { q: 1, m: 273.13, vitaMedia: t(2.603e-8), canali: [['muone+', 'neutrino']], figli: [{ specie: 'muone+', angolo: [-3, 3], quota: [0.6, 1] }] },
    'pione-': { q: -1, m: 273.13, vitaMedia: t(2.603e-8), canali: [['muone-', 'neutrino']], figli: [{ specie: 'muone-', angolo: [-3, 3], quota: [0.6, 1] }] },
    pione0: { q: 0, m: 264.14, vitaMedia: t(8.5e-17), visibile: false, canali: [['fotone', 'fotone']], figli: [{ specie: 'fotone', angolo: [1, 12], quota: [0.2, 0.8] }, { specie: 'fotone', angolo: [-12, -1], quota: [0.2, 0.8] }] },
    'muone+': { q: 1, m: 206.77, vitaMedia: t(2.197e-6), canali: [['positrone', 'neutrino', 'neutrino']], figli: [{ specie: 'positrone', angolo: [-20, 20], quota: [0.1, 0.6] }] },
    'muone-': { q: -1, m: 206.77, vitaMedia: t(2.197e-6), canali: [['elettrone', 'neutrino', 'neutrino']], figli: [{ specie: 'elettrone', angolo: [-20, 20], quota: [0.1, 0.6] }] },
    // la luce si converte in una coppia solo urtando la materia (e solo se ha più energia della massa dei due)
    fotone: { luce: true, m: 1, camminoLibero: urtoFotone, bersaglio: 'nucleo', spettatore: true, canali: [['elettrone', 'positrone']], figli: [{ specie: 'elettrone', angolo: [1, 8], quota: [0.2, 0.8] }, { specie: 'positrone', angolo: [-8, -1], quota: [0.2, 0.8] }] },
    elettrone: { q: -1, m: 1 },
    positrone: { q: 1, m: 1 },
    // quelle che non si vedono e non si seguono
    neutrino: { luce: true, m: 1, visibile: false, persa: true },
    neutrone: { q: 0, m: 1838.68, visibile: false, persa: true },
    nucleo: { q: 8, m: 29156, visibile: false, persa: true },
  };
}

// le lunghezze dette a parole
export function fmtLunghezza(m) {
  const n = (x, d = 0) => x.toLocaleString('it-IT', { maximumFractionDigits: d });
  if (m < 1e-6) return `${n(m * 1e9, 1)} nm`;
  if (m < 1e-3) return `${n(m * 1e6, 1)} µm`;
  if (m < 1) return `${n(m * 1e3, 1)} mm`;
  if (m < 1e3) return `${n(m, 1)} m`;
  if (m < 1e9) return `${n(m / 1e3)} km`;
  if (m < 1e15) return `${n(m / 1.496e11, 2)} UA`;
  if (m < 3.086e19) return `${n(m / 9.461e15, 1)} anni luce`;
  if (m < 3.086e22) return `${n(m / 9.461e15)} anni luce`;
  return `${n(m / 3.086e22, 1)} milioni di parsec`;
}
