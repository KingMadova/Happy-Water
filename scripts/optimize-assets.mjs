// scripts/optimize-assets.mjs
import sharp from "sharp";
import { mkdirSync, writeFileSync, copyFileSync, existsSync } from "fs";

const JOBS = [
  ["assets/drop-3d.png", 512],   // affichée ~260px → 512 suffit largement (@2x)
  ["assets/tab-home-3d.png", 128],     // affichée 28px → 128 = net @3x
  ["assets/tab-history-3d.png", 128],
  ["assets/tab-settings-3d.png", 128],
];

mkdirSync("assets/originals", { recursive: true }); // sauvegarde des originaux

for (const [file, size] of JOBS) {
  if (!existsSync(file)) { console.log("️  absent :", file); continue; }
  const backup = file.replace("assets/", "assets/originals/");
  if (!existsSync(backup)) copyFileSync(file, backup);
  const buf = await sharp(file)
    .resize(size, size)
    .png({ compressionLevel: 9, palette: true, quality: 80 })
    .toBuffer();
  writeFileSync(file, buf);
  console.log(`✅ ${file} → ${(buf.length / 1024).toFixed(0)} Ko (${size}px)`);
}