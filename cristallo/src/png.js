// png.js — un PNG minimo in grigi (8 bit), per le immagini delle prove e degli strumenti (in Node).
import { writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
const CRC = new Int32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c; });
const crc = (b) => { let c = -1; for (const x of b) c = CRC[(c ^ x) & 255] ^ (c >>> 8); return (c ^ -1) >>> 0; };
const pezzo = (t, d) => { const T = Buffer.from(t), l = Buffer.alloc(4), c = Buffer.alloc(4); l.writeUInt32BE(d.length); c.writeUInt32BE(crc(Buffer.concat([T, d]))); return Buffer.concat([l, T, d, c]); };
// grigi: valori 0–255 riga per riga
export function scriviPNG(nome, grigi, W, H) {
  const r = Buffer.alloc(H * (W + 1));
  for (let y = 0; y < H; y++) { r[y * (W + 1)] = 0; for (let x = 0; x < W; x++) r[y * (W + 1) + 1 + x] = grigi[y * W + x]; }
  const ih = Buffer.alloc(13); ih.writeUInt32BE(W, 0); ih.writeUInt32BE(H, 4); ih[8] = 8; ih[9] = 0;
  writeFileSync(nome, Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), pezzo('IHDR', ih), pezzo('IDAT', deflateSync(r)), pezzo('IEND', Buffer.alloc(0))]));
}
