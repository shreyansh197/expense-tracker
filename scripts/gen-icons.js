/* eslint-disable @typescript-eslint/no-require-imports */
const sharp = require("sharp");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const iconsDir = "public/icons";

const svgBuf = fs.readFileSync(path.join(iconsDir, "spendly-icon.svg"));
const iconHash = crypto
  .createHash("md5")
  .update(svgBuf)
  .digest("hex")
  .slice(0, 8);

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

  // Generate ICO favicon (48x48 PNG wrapped in ICO container)
  const faviconPng = await sharp(svgBuf).resize(48, 48).png().toBuffer();
  // ICO format: header + directory entry + PNG data
  const icoHeader = Buffer.alloc(6);
  icoHeader.writeUInt16LE(0, 0); // reserved
  icoHeader.writeUInt16LE(1, 2); // type: 1 = ICO
  icoHeader.writeUInt16LE(1, 4); // count: 1 image
  const icoDir = Buffer.alloc(16);
  icoDir.writeUInt8(48, 0); // width
  icoDir.writeUInt8(48, 1); // height
  icoDir.writeUInt8(0, 2); // color palette
  icoDir.writeUInt8(0, 3); // reserved
  icoDir.writeUInt16LE(1, 4); // color planes
  icoDir.writeUInt16LE(32, 6); // bits per pixel
  icoDir.writeUInt32LE(faviconPng.length, 8); // image size
  icoDir.writeUInt32LE(22, 12); // offset (6 + 16 = 22)
  const ico = Buffer.concat([icoHeader, icoDir, faviconPng]);
  // Write into src/app/ so Next.js serves it at /favicon.ico
  fs.writeFileSync(path.join("src", "app", "favicon.ico"), ico);
  console.log("Generated src/app/favicon.ico");

  // Copy icon.png and apple-icon.png into src/app/ for Next.js metadata
  await sharp(svgBuf)
    .resize(192, 192)
    .png()
    .toFile(path.join("src", "app", "icon.png"));
  console.log("Generated src/app/icon.png");

  await sharp(svgBuf)
    .resize(180, 180)
    .png()
    .toFile(path.join("src", "app", "apple-icon.png"));
  console.log("Generated src/app/apple-icon.png");

  // Write icon version hash for cache-busting
  fs.writeFileSync(
    path.join(iconsDir, "version.json"),
    JSON.stringify({ hash: iconHash }) + "\n",
  );
  console.log("Wrote icon version:", iconHash);

  // Update manifest.json icon URLs with cache-busting query
  const manifestPath = path.join("public", "manifest.json");
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
  manifest.icons = manifest.icons.map((icon) => ({
    ...icon,
    src: icon.src.split("?")[0] + `?v=${iconHash}`,
  }));
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
  console.log("Updated manifest.json with icon version");

  // Bump CACHE_NAME in sw.js so installed PWAs pick up the new SW
  const swPath = path.join("public", "sw.js");
  let sw = fs.readFileSync(swPath, "utf-8");
  sw = sw.replace(
    /const CACHE_NAME = "[^"]+";/,
    `const CACHE_NAME = "expense-tracker-icons-${iconHash}";`,
  );
  fs.writeFileSync(swPath, sw);
  console.log("Updated sw.js CACHE_NAME");
}

gen().catch((err) => {
  console.error(err);
  process.exit(1);
});
