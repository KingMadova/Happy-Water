// scripts/make-water-sound.mjs
// Génère un "plouf" d'eau (WAV 16 bits mono, ~0.7 s) sans aucune dépendance.
import { mkdirSync, writeFileSync } from "fs";

const SR = 44100;
const DUR = 0.7;
const N = Math.floor(SR * DUR);
const out = new Float32Array(N);

// Couche 1 : "ploup" grave (bulle qui implose) — sweep descendant
let ph1 = 0;
for (let i = 0; i < N; i++) {
  const t = i / SR;
  const f = 170 + 560 * Math.exp(-t * 9);
  ph1 += (2 * Math.PI * f) / SR;
  out[i] += 0.85 * Math.exp(-t * 11) * Math.sin(ph1);
}

// Couche 2 : "tic" aigu de la goutte qui touche (décalé de 20 ms)
let ph2 = 0;
const start2 = Math.floor(0.02 * SR);
for (let i = start2; i < N; i++) {
  const t = (i - start2) / SR;
  const f = 1500 * Math.exp(-t * 30) + 700;
  ph2 += (2 * Math.PI * f) / SR;
  out[i] += 0.3 * Math.exp(-t * 45) * Math.sin(ph2);
}

// Couche 3 : léger splash (bruit atténué)
for (let i = 0; i < N; i++) {
  const t = i / SR;
  out[i] += 0.06 * Math.exp(-t * 22) * (Math.random() * 2 - 1);
}

// Normalisation + fade out final (anti-clic)
let peak = 0;
for (const s of out) peak = Math.max(peak, Math.abs(s));
const fadeStart = N - Math.floor(0.05 * SR);
for (let i = 0; i < N; i++) {
  let s = (out[i] / peak) * 0.9;
  if (i > fadeStart) s *= (N - i) / (N - fadeStart);
  out[i] = s;
}

// Écriture WAV
mkdirSync("assets/sounds", { recursive: true });
const buf = Buffer.alloc(44 + N * 2);
buf.write("RIFF", 0); buf.writeUInt32LE(36 + N * 2, 4); buf.write("WAVE", 8);
buf.write("fmt ", 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20);
buf.writeUInt16LE(1, 22); buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 2, 28);
buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34);
buf.write("data", 36); buf.writeUInt32LE(N * 2, 40);
for (let i = 0; i < N; i++) buf.writeInt16LE(Math.round(out[i] * 32767), 44 + i * 2);
writeFileSync("assets/sounds/water-drop.wav", buf);
console.log("✅ assets/sounds/water-drop.wav généré (" + (buf.length / 1024).toFixed(0) + " Ko)");