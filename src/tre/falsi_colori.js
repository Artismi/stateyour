// falsi_colori.js — LA SCALA DEI FALSI COLORI (lo strumento «temperatura» del visore, src/visore/strumenti.js, e pianeta.js).
// Turbo (Mikhailov 2019, «Turbo, an improved rainbow colormap for visualization», Google AI Blog): dal blu scuro del freddo al
// rosso scuro del caldo, con la luminosità che sale e poi scende senza salti (si legge anche in bianco e nero meglio
// dell'arcobaleno «jet»), nell'approssimazione polinomiale del suo autore (sRGB, x in [0, 1]).
export const TURBO = Object.freeze({
  r: [0.13572138, 4.6153926, -42.66032258, 132.13108234, -152.94239396, 59.28637943],
  g: [0.09140261, 2.19418839, 4.84296658, -14.18503333, 4.27729857, 2.82956604],
  b: [0.1066733, 12.64194608, -60.58204836, 110.36276771, -89.90310912, 27.34824973],
});
const pol = (c, x) => c[0] + x * (c[1] + x * (c[2] + x * (c[3] + x * (c[4] + x * c[5]))));
// → [r, g, b] sRGB in [0, 1]
export function turbo(x) { const t = Math.max(0, Math.min(1, x)); return [pol(TURBO.r, t), pol(TURBO.g, t), pol(TURBO.b, t)].map((v) => Math.max(0, Math.min(1, v))); }
const f = (v) => v.map((x) => x.toFixed(8)).join(', ');
export const GLSL_TURBO = `
vec3 turbo(float x) { float t = clamp(x, 0.0, 1.0), t2 = t * t, t3 = t2 * t, t4 = t2 * t2, t5 = t4 * t;
  vec4 v4 = vec4(1.0, t, t2, t3); vec2 v2 = vec2(t4, t5);
  return clamp(vec3(dot(v4, vec4(${f(TURBO.r.slice(0, 4))})) + dot(v2, vec2(${f(TURBO.r.slice(4))})),
                    dot(v4, vec4(${f(TURBO.g.slice(0, 4))})) + dot(v2, vec2(${f(TURBO.g.slice(4))})),
                    dot(v4, vec4(${f(TURBO.b.slice(0, 4))})) + dot(v2, vec2(${f(TURBO.b.slice(4))}))), 0.0, 1.0); }`;
