// icone.js — le icone del visore (PROGETTO_VISORE.md, § 4): un solo tratto 1,6 su una griglia di 24, angoli tondi, nessun
// riempimento salvo un punto. Un unico sprite SVG di <symbol>, messo una volta nella pagina; `ico(id)` ne fa un <svg>.
// Le venti del progetto (livelli, azioni, schede, menu) più poche di servizio: le tessere (gravità, giorno, campo, calore,
// massa, età), il pattern come livello in fondo allo zoom, e le voci del menu (seme, vista, taccuino, impostazioni,
// diagnostica). I glifi universali (chiudi, freccia, riproduci) non contano.

const SIMBOLI = {
  // i livelli della scala (8) e il pattern, in fondo
  cosmo: '<circle cx="5" cy="6" r="1.7"/><circle cx="18.5" cy="5" r="1.7"/><circle cx="12" cy="12.5" r="2"/><circle cx="5.5" cy="18.5" r="1.7"/><circle cx="19" cy="18" r="1.7"/><path d="M6.4 7.1 10.4 11M17.2 6.2 13.5 11M10.3 13.7 6.8 17.3M13.8 13.6 17.6 17M6.7 6 16.8 5.1"/>',
  galassia: '<path d="M12 12.2c.9-.9 2.6-.6 3 .8.6 2-1.3 3.9-3.6 3.9-3 0-5-2.6-4.4-5.6.8-3.7 5-5.6 8.5-4.4"/><path d="M12 11.8c-.9.9-2.6.6-3-.8-.6-2 1.3-3.9 3.6-3.9 3 0 5 2.6 4.4 5.6-.8 3.7-5 5.6-8.5 4.4"/><circle cx="12" cy="12" r=".9" fill="currentColor"/>',
  stella: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1"/>',
  pianeta: '<circle cx="12" cy="12" r="7.5"/><path d="M12 4.5c-3 2-3.9 5-3.9 7.5s.9 5.5 3.9 7.5" opacity=".55"/><path d="M4.6 10.4c2.5 1 5.4 1.3 8 .9M5 14.6c2.8.6 5.8.5 8.6-.4" opacity=".55"/>',
  terreno: '<path d="M2.5 18.5 8 10.5l3.2 4.4L14.5 9l7 9.5z"/><path d="M6 21h12" opacity=".55"/><path d="M13.2 11.3l1.3 1.4 1-1.3" opacity=".7"/>',
  materia: '<path d="M12 2.8 19.8 7.3v9.4L12 21.2 4.2 16.7V7.3z"/><path d="M12 12.1 19.8 7.3M12 12.1 4.2 7.3M12 12.1v9.1" opacity=".6"/>',
  atomo: '<ellipse cx="12" cy="12" rx="9.5" ry="3.8" transform="rotate(30 12 12)"/><ellipse cx="12" cy="12" rx="9.5" ry="3.8" transform="rotate(-30 12 12)"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/>',
  particella: '<path d="M3 20.5c3.6-1.2 6.8-3.8 8.6-7.6"/><path d="M11.6 12.9 19.2 8"/><path d="M11.6 12.9c1.2 2.4 3.6 4 6.4 4.4" stroke-dasharray="1.5 2.2"/><circle cx="20" cy="7.4" r="1.6" fill="currentColor"/>',
  pattern: '<path d="M4 4h7v7H4zM13 13h7v7h-7z"/><path d="M13 4h7v7h-7zM4 13h7v7H4z" opacity=".45"/><circle cx="12" cy="12" r="1.3" fill="currentColor"/>',
  // le azioni (6)
  mirino: '<path d="M3.5 8.5v-5h5M15.5 3.5h5v5M20.5 15.5v5h-5M8.5 20.5h-5v-5"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/>',
  entra: '<path d="M4 12.5a8 8 0 0 0 16 0"/><path d="M12 2.5v11M7.8 9.4 12 13.6l4.2-4.2"/>',
  esci: '<path d="M4 12.5a8 8 0 0 0 16 0"/><path d="M12 13.6v-11M7.8 6.7 12 2.5l4.2 4.2"/>',
  tempo: '<circle cx="12" cy="12.5" r="8.5"/><path d="M12 7.5v5l3.5 2.2M9.5 2.5h5"/>',
  inquadra: '<path d="M3.5 8V3.5H8M16 3.5h4.5V8M20.5 16v4.5H16M8 20.5H3.5V16"/><path d="M12 7.2l1.3 3.5 3.5 1.3-3.5 1.3L12 16.8l-1.3-3.5L7.2 12l3.5-1.3z"/>',
  dado: '<rect x="3.5" y="3.5" width="17" height="17" rx="4"/><circle cx="8.5" cy="8.5" r="1.2" fill="currentColor"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/><circle cx="15.5" cy="15.5" r="1.2" fill="currentColor"/>',
  // le schede (5) e il menu (1)
  aria: '<path d="M3 9h11.5a2.8 2.8 0 1 0-2.7-3.4"/><path d="M3 13.5h16a2.8 2.8 0 1 1-2.7 3.4"/><path d="M3 18h7"/>',
  clima: '<path d="M10 14.6V5a2 2 0 1 1 4 0v9.6a4 4 0 1 1-4 0z"/><path d="M12 9.5v7.2" stroke-width="2.2"/><path d="M17.5 6h2.5M17.5 9.5h2.5" opacity=".55"/>',
  acqua: '<path d="M12 2.8c3.4 4.4 6.3 8 6.3 11.6a6.3 6.3 0 0 1-12.6 0C5.7 10.8 8.6 7.2 12 2.8z"/><path d="M8.8 14.6a3.3 3.3 0 0 0 2.6 3.1" opacity=".6"/>',
  interno: '<path d="M12 3.5a8.5 8.5 0 1 0 8.5 8.5H12z"/><path d="M12 7.5a4.5 4.5 0 1 0 4.5 4.5" opacity=".6"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/>',
  ramo: '<path d="M7 21V9.5M7 13c0-3 2.2-4.3 5.2-4.6 3-.3 5-1.6 5.6-4.4"/><circle cx="7" cy="7" r="2.3"/><circle cx="18" cy="3.8" r="1.5" fill="currentColor"/>',
  menu: '<circle cx="5.5" cy="6.5" r="1.3" fill="currentColor"/><circle cx="5.5" cy="12" r="1.3" fill="currentColor"/><circle cx="5.5" cy="17.5" r="1.3" fill="currentColor"/><path d="M10 6.5h9.5M10 12h9.5M10 17.5h6"/>',
  // di servizio: le tessere
  gravita: '<path d="M12 3v11M7.5 10 12 14.5 16.5 10M4 20h16"/>',
  giorno: '<circle cx="12" cy="12" r="7.5"/><path d="M12 4.5a7.5 7.5 0 0 1 0 15z" fill="currentColor" fill-opacity=".35" stroke="none"/><path d="M2 12h2.5M19.5 12H22"/>',
  campo: '<path d="M7 4v8a5 5 0 0 0 10 0V4"/><path d="M4.5 4h5M14.5 4h5" stroke-width="2.4"/>',
  calore: '<path d="M12 21c-3.6 0-6-2.4-6-5.6 0-3.4 3-5.2 3.6-9.4 2.2 1.6 3.2 3.6 3.2 5.4 1-.6 1.6-1.8 1.8-3 1.9 1.6 3.4 4 3.4 7 0 3.2-2.4 5.6-6 5.6z"/>',
  massa: '<path d="M6.5 9h11l2 11.5h-15z"/><circle cx="12" cy="6" r="2.5"/>',
  eta: '<path d="M7 3h10M7 21h10M8 3c0 5 8 5 8 9s-8 4-8 9M16 3c0 5-8 5-8 9s8 4 8 9"/>',
  lago: '<path d="M3 15c2-1.5 4-1.5 6 0s4 1.5 6 0 4-1.5 6 0"/><path d="M3 19c2-1.5 4-1.5 6 0s4 1.5 6 0 4-1.5 6 0" opacity=".55"/><path d="M8 11l4-6 4 6" opacity=".55"/>',
  sorgente: '<path d="M4 20h16"/><path d="M9 20c0-4 1.5-6 3-8M15 20c0-4-1.5-6-3-8"/><path d="M10 7c0-1.5 2-1.5 2-3M14 8c0-1.5 2-1.5 2-3" opacity=".6"/>',
  // le voci del menu
  seme: '<path d="M12 21c-4.4 0-7-3.4-7-7.5C5 8 9 4.5 12 3c3 1.5 7 5 7 10.5 0 4.1-2.6 7.5-7 7.5z"/><path d="M12 21V10" opacity=".6"/>',
  vista: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
  taccuino: '<path d="M5 3.5h11.5a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H5z"/><path d="M8.5 3.5v17M11.5 8h4M11.5 11.5h4" opacity=".6"/>',
  impostazioni: '<circle cx="12" cy="12" r="3"/><path d="M12 2.8v2.6M12 18.6v2.6M2.8 12h2.6M18.6 12h2.6M5.5 5.5l1.8 1.8M16.7 16.7l1.8 1.8M5.5 18.5l1.8-1.8M16.7 7.3l1.8-1.8"/>',
  diagnostica: '<path d="M2.5 12h4l2.5-6 4 12 2.5-6h6"/>',
  schermo: '<path d="M3.5 8V3.5H8M16 3.5h4.5V8M20.5 16v4.5H16M8 20.5H3.5V16"/>',
  annulla: '<path d="M9 5 4.5 9.5 9 14"/><path d="M4.5 9.5h9a6 6 0 0 1 0 12h-3"/>',
  rifai: '<path d="M15 5l4.5 4.5L15 14"/><path d="M19.5 9.5h-9a6 6 0 0 0 0 12h3"/>',
  // glifi universali
  'g-chiudi': '<path d="M6 6l12 12M18 6 6 18"/>',
  'g-sep': '<path d="M9 5l7 7-7 7"/>',
};
const PIENI = {
  'g-indietro': '<path d="M11.5 5v14L2.5 12zM21.5 5v14l-9-7z"/>',
  'g-pausa': '<rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/>',
  'g-avanti': '<path d="M2.5 5v14l9-7zM12.5 5v14l9-7z"/>',
  'g-gioca': '<path d="M6 4.5v15l13-7.5z"/>',
};
// lo sprite, una volta nella pagina
export function metteSprite() {
  if (document.getElementById('v-sprite')) return;
  const d = document.createElement('div'); d.id = 'v-sprite'; d.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
  d.innerHTML = `<svg width="0" height="0"><defs>${Object.entries(SIMBOLI).map(([k, s]) => `<symbol id="i-${k}" viewBox="0 0 24 24">${s}</symbol>`).join('')}${Object.entries(PIENI).map(([k, s]) => `<symbol id="i-${k}" viewBox="0 0 24 24">${s}</symbol>`).join('')}<linearGradient id="v-gr-termo" x1="0" x2="1"><stop offset="0" stop-color="#6fb7d4"/><stop offset=".42" stop-color="#cfe6ea"/><stop offset=".56" stop-color="#f4ecdf"/><stop offset=".8" stop-color="#f2a65a"/><stop offset="1" stop-color="#e2683f"/></linearGradient></defs></svg>`;
  document.body.prepend(d);
}
// un'icona: <svg class="ico"> che usa il simbolo; `pieno` per i glifi del tempo (riempiti, non a tratto)
export const ico = (id, cls = '') => `<svg class="ico${PIENI[id] ? ' pieno' : ''}${cls ? ` ${cls}` : ''}" aria-hidden="true"><use href="#i-${id}"/></svg>`;
// le icone dei livelli, nell'ordine dello zoom
export const LIVELLI = ['cosmo', 'galassia', 'stella', 'pianeta', 'terreno', 'materia', 'atomo', 'particella', 'pattern'];
