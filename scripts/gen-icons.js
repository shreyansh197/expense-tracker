const sharp = require("sharp");
const fs = require("fs");
const path = require("path");
const iconsDir = "public/icons";

const svgBuf = fs.readFileSync(path.join(iconsDir, "spendly-icon.svg"));

async function gen() {
  const sizes = [
    { name: "icon-192.png", size: 192, pad: 0 },
    { name: "icon-512.png", size: 512, pad: 0 },
    { name: "icon-maskable-192.png", size: 192, pad: 0.12 },
    { name: "icon-maskable-512.png", size: 512, pad: 0.12 },
  ];

  for (const s of sizes) {
    const inner = Math.round(s.size * (1 - s.pad * 2));
    const offset = Math.round(s.size * s.pad);

    if (s.pad > 0) {
      // Maskable: solid background + centred icon (no clipping for safe zone)
      const bgSvg = Buffer.from(
        `<svg xmlns="http://www.w3.org/2000/svg" width="${s.size}" height="${s.size}"><rect width="${s.size}" height="${s.size}" fill="#0a0f1e"/></svg>`,
      );
      const iconResized = await sharp(svgBuf)
        .resize(inner, inner)
        .png()
        .toBuffer();
      await sharp(bgSvg)
        .composite([{ input: iconResized, top: offset, left: offset }])
        .png()
        .toFile(path.join(iconsDir, s.name));
    } else {
      await sharp(svgBuf)
        .resize(s.size, s.size)
        .png()
        .toFile(path.join(iconsDir, s.name));
    }
    console.log("Generated", s.name);
  }

  // Also generate a 32x32 favicon-ready PNG
  await sharp(svgBuf)
    .resize(32, 32)
    .png()
    .toFile(path.join(iconsDir, "favicon-32.png"));
  console.log("Generated favicon-32.png");

  // Apple touch icon 180x180
  await sharp(svgBuf)
    .resize(180, 180)
    .png()
    .toFile(path.join(iconsDir, "apple-touch-icon.png"));
  console.log("Generated apple-touch-icon.png");
}

gen().catch((err) => {
  console.error(err);
  process.exit(1);
});
