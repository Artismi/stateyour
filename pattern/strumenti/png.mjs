// png.mjs — un lettore PNG minimo per Node (8 bit, non interlacciato):
// grigio, grigio con alfa, RGB, RGBA. Basta per le tavole e per i test.
import { readFileSync } from 'node:fs';
import { inflateSync } from 'node:zlib';

export function leggiPNG(percorso) {
  const b = readFileSync(percorso);
  if (b.readUInt32BE(0) !== 0x89504e47) throw new Error('non è un PNG');
  let o = 8, W = 0, H = 0, prof = 0, tipo = 0, inter = 0;
  const idat = [];
  while (o < b.length) {
    const n = b.readUInt32BE(o), t = b.toString('ascii', o + 4, o + 8), d = b.subarray(o + 8, o + 8 + n);
    if (t === 'IHDR') { W = d.readUInt32BE(0); H = d.readUInt32BE(4); prof = d[8]; tipo = d[9]; inter = d[12]; }
    else if (t === 'IDAT') idat.push(d);
    else if (t === 'IEND') break;
    o += 12 + n;
  }
  if (prof !== 8 || inter !== 0 || ![0, 2, 4, 6].includes(tipo)) throw new Error(`PNG non gestito: profondità ${prof}, tipo ${tipo}, interlacciato ${inter}`);
  const bpp = { 0: 1, 2: 3, 4: 2, 6: 4 }[tipo];
  const raw = inflateSync(Buffer.concat(idat)), riga = W * bpp, out = new Uint8Array(W * H * bpp);
  for (let y = 0; y < H; y++) {
    const f = raw[y * (riga + 1)], src = y * (riga + 1) + 1, dst = y * riga;
    for (let x = 0; x < riga; x++) {
      const a = x >= bpp ? out[dst + x - bpp] : 0, su = y ? out[dst - riga + x] : 0, c = x >= bpp && y ? out[dst - riga + x - bpp] : 0;
      let v = raw[src + x];
      if (f === 1) v += a; else if (f === 2) v += su; else if (f === 3) v += (a + su) >> 1;
      else if (f === 4) { const p = a + su - c, pa = Math.abs(p - a), pb = Math.abs(p - su), pc = Math.abs(p - c); v += pa <= pb && pa <= pc ? a : pb <= pc ? su : c; }
      out[dst + x] = v & 255;
    }
  }
  // tutto in RGB
  const rgb = new Uint8Array(W * H * 3);
  for (let i = 0; i < W * H; i++) {
    if (bpp >= 3) { rgb[i * 3] = out[i * bpp]; rgb[i * 3 + 1] = out[i * bpp + 1]; rgb[i * 3 + 2] = out[i * bpp + 2]; }
    else rgb[i * 3] = rgb[i * 3 + 1] = rgb[i * 3 + 2] = out[i * bpp];
  }
  return { larghezza: W, altezza: H, canali: 3, dati: rgb };
}
