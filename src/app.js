// app.js — la pagina: sceglie una partitura, la simula, la disegna.
import { simula } from './motore.js';
import { PARTITURE, generaOnda } from './partiture.js';

const tela = document.getElementById('tela');
const ctx = tela.getContext('2d');
const $ = (id) => document.getElementById(id);

const COLORI = ['#1c1b18', '#b8412b', '#2b5fb8', '#3b7d3a', '#9a5b1a', '#6b3fa0', '#1e7f82'];

// mondo: y verso l'alto; tela: y verso il basso
const W = tela.width, H = tela.height;
const X = (x) => x, Y = (y) => H - y;

function disegna(partitura, tracce) {
  ctx.clearRect(0, 0, W, H);
  // griglia leggera
  ctx.strokeStyle = '#ebe7dc'; ctx.lineWidth = 1;
  for (let x = 0; x <= W; x += 50) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  for (let y = 0; y <= H; y += 50) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

  // linee delle regole 'attraversa'
  for (const r of partitura.regole || []) {
    if (r.quando.tipo !== 'attraversa') continue;
    const [a, b] = [r.quando.a, r.quando.b];
    const d = [b[0] - a[0], b[1] - a[1]]; const l = Math.hypot(...d) || 1;
    const u = [d[0] / l * 2000, d[1] / l * 2000];
    ctx.save(); ctx.setLineDash([2, 6]); ctx.strokeStyle = '#b9b3a4'; ctx.beginPath();
    ctx.moveTo(X(a[0] - u[0]), Y(a[1] - u[1])); ctx.lineTo(X(a[0] + u[0]), Y(a[1] + u[1])); ctx.stroke(); ctx.restore();
  }

  // interfacce
  for (const i of partitura.interfacce || []) {
    ctx.save();
    if (i.tipo === 'specchio') { ctx.strokeStyle = '#2b5fb8'; ctx.lineWidth = 3; }
    else if (i.tipo === 'rifrazione') { ctx.strokeStyle = '#2b5fb8'; ctx.lineWidth = 2; ctx.setLineDash([4, 3]); }
    else { ctx.strokeStyle = '#333'; ctx.lineWidth = 4; }
    if (i.acceso === false) ctx.globalAlpha = 0.3;
    ctx.beginPath(); ctx.moveTo(X(i.a[0]), Y(i.a[1])); ctx.lineTo(X(i.b[0]), Y(i.b[1])); ctx.stroke();
    if (i.tipo === 'rifrazione') {
      ctx.fillStyle = '#2b5fb8'; ctx.font = '10px ui-monospace, monospace'; ctx.globalAlpha = 0.8;
      const mx = (i.a[0] + i.b[0]) / 2, my = (i.a[1] + i.b[1]) / 2;
      const d = [i.b[0] - i.a[0], i.b[1] - i.a[1]]; const l = Math.hypot(...d) || 1;
      const nrm = [-d[1] / l, d[0] / l];
      ctx.textAlign = 'center';
      ctx.fillText(`n=${i.n1 ?? 1}`, X(mx + nrm[0] * 14), Y(my + nrm[1] * 14) + 3);
      ctx.fillText(`n=${i.n2 ?? 1}`, X(mx - nrm[0] * 14), Y(my - nrm[1] * 14) + 3);
    }
    ctx.restore();
  }

  // masse
  for (const m of partitura.masse || []) {
    const r = 3 + Math.cbrt(Math.max(m.M, 1)) / 6;
    ctx.beginPath(); ctx.arc(X(m.pos[0]), Y(m.pos[1]), r, 0, Math.PI * 2);
    if (m.acceso === false) { ctx.strokeStyle = '#b8412b'; ctx.lineWidth = 1.5; ctx.stroke(); }
    else { ctx.fillStyle = '#b8412b'; ctx.fill(); }
  }

  // traiettorie
  tracce.forEach((tr, k) => {
    ctx.strokeStyle = COLORI[k % COLORI.length]; ctx.lineWidth = tr.eventi.length > 80 ? 0.8 : 1.4; ctx.lineJoin = 'round';
    ctx.beginPath();
    let penna = false;
    for (const [x, y, su] of tr.punti) {
      if (su && !penna) { ctx.moveTo(X(x), Y(y)); penna = true; }
      else if (su) ctx.lineTo(X(x), Y(y));
      else penna = false;
    }
    ctx.stroke();
    // gli eventi: piccoli segni
    for (const e of tr.eventi) {
      if (e.attraversa !== undefined || e.tocca) {
        ctx.fillStyle = COLORI[k % COLORI.length];
        ctx.beginPath(); ctx.arc(X(e.pos[0]), Y(e.pos[1]), 2.2, 0, Math.PI * 2); ctx.fill();
      }
    }
  });

  // emettitori
  for (const e of partitura.emettitori || []) {
    const ang = e.dir ? Math.atan2(e.dir[1], e.dir[0]) : (e.angolo ?? 0) * Math.PI / 180;
    ctx.save(); ctx.translate(X(e.pos[0]), Y(e.pos[1])); ctx.rotate(-ang);
    ctx.fillStyle = '#1c1b18'; ctx.beginPath(); ctx.moveTo(9, 0); ctx.lineTo(-4, 5); ctx.lineTo(-4, -5); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
}

let corrente = null;

function mostra(partitura) {
  corrente = partitura;
  $('errore').textContent = '';
  let tracce;
  try { tracce = simula(partitura); }
  catch (err) { $('errore').textContent = String(err); return; }
  disegna(partitura, tracce);
  const righe = tracce.map((t) => `${t.id}: ${t.passi} passi, ${t.eventi.length} eventi, fine: ${t.fine}`);
  $('nota').textContent = `${partitura.nome || ''}\n${righe.join('\n')}`;
}

function scriviJson(partitura) {
  $('json').value = JSON.stringify(partitura, (k, v) => (typeof v === 'number' ? Number(v.toFixed(6)) : v), 1)
    .replace(/\[\s+([-\d.e]+),\s+([-\d.e]+)\s+\]/g, '[$1, $2]');
}

// ---- cursori dell'onda ----
const cursori = ['L', 'f', 'n', 'GM'];
function leggiCursori() {
  const o = Object.fromEntries(cursori.map((k) => [k, Number($(k).value)]));
  o.alterna = $('alterna').checked;
  if (o.f >= o.L) { o.f = o.L - 1; $('f').value = o.f; }
  return o;
}
function aggiornaFormule(o) {
  const b = Math.sqrt(o.f * (o.L - o.f)), e = Math.abs(o.L / 2 - o.f) / (o.L / 2);
  const v0 = Math.sqrt(o.GM * (2 / o.f - 2 / o.L));
  const rapporto = (o.f / (o.L - o.f)) ** 2;
  $('formule').innerHTML =
    `<label>dalle formule</label>` +
    `a = L/2 = ${(o.L / 2).toFixed(1)} &nbsp; b = √(f·(L−f)) = ${b.toFixed(1)} &nbsp; e = ${e.toFixed(3)}<br>` +
    `v₀ = √(GM·(2/f − 2/L)) = ${v0.toFixed(2)}` +
    (o.alterna ? `<br>offset alternato f, L−f: masse tutte uguali` : `<br>offset costante: M<sub>i+1</sub>/M<sub>i</sub> = (f/(L−f))² = ${rapporto.toFixed(3)}`);
  cursori.forEach((k) => ($('o' + k).value = $(k).value));
}
function daCursori() {
  const o = leggiCursori();
  aggiornaFormule(o);
  const p = generaOnda({ ...o, x0: 80, y0: 300 });
  scriviJson(p); mostra(p);
}
cursori.forEach((k) => $(k).addEventListener('input', daCursori));
$('alterna').addEventListener('change', daCursori);

// ---- scelta della partitura ----
const sel = $('scelta');
for (const nome of Object.keys(PARTITURE)) {
  const op = document.createElement('option'); op.value = nome; op.textContent = nome; sel.appendChild(op);
}
function scegli(nome) {
  const p = PARTITURE[nome]();
  const eOnda = nome.startsWith('onda_') && nome !== 'onda_tratteggiata';
  $('cursori').style.display = eOnda ? '' : 'none';
  if (eOnda) {
    // riporto i cursori ai valori della partitura scelta
    const masse = p.masse; const x0 = p.emettitori[0].pos[0];
    const f = masse[0].pos[0] - x0;
    const alterna = nome !== 'onda_decrescente';
    if (masse.length > 1) {
      // con offset alternato x(m1) − x(m0) = 2L − 2f, con offset costante = L
      const dx = masse[1].pos[0] - masse[0].pos[0];
      $('L').value = alterna ? Math.round((dx + 2 * f) / 2) : Math.round(dx);
    }
    $('f').value = f; $('n').value = masse.length; $('GM').value = masse[0].M; $('alterna').checked = alterna;
    daCursori();
    return;
  }
  scriviJson(p); mostra(p);
}
sel.addEventListener('change', () => scegli(sel.value));

$('genera').addEventListener('click', () => {
  try { const p = JSON.parse($('json').value); $('cursori').style.display = 'none'; mostra(p); }
  catch (err) { $('errore').textContent = 'JSON non valido: ' + err.message; }
});
$('scarica').addEventListener('click', () => {
  const blob = new Blob([$('json').value], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
  a.download = `${(corrente && corrente.nome ? corrente.nome : 'partitura').replace(/[^\w]+/g, '_')}.json`; a.click();
});

const iniziale = location.hash.slice(1);
sel.value = PARTITURE[iniziale] ? iniziale : 'onda_ellissi';
scegli(sel.value);
