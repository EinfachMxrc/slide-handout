// Konvertiert eine TTF in das three.js typeface.json-Format,
// aber NUR die für „Cue" gebrauchten Glyphen — winzig dadurch (~5kB).
//
// Aufruf:
//   node scripts/build-cue-font.mjs <input.ttf> <output.typeface.json>

import opentype from "opentype.js";
import { writeFileSync } from "node:fs";

const [, , inPath, outPath] = process.argv;
if (!inPath || !outPath) {
  console.error("usage: build-cue-font.mjs <in.ttf> <out.typeface.json>");
  process.exit(1);
}

const font = opentype.loadSync(inPath);
const wanted = "Cue";

const glyphs = {};
for (const ch of wanted) {
  const glyph = font.charToGlyph(ch);
  if (!glyph) continue;
  let o = "";
  for (const cmd of glyph.path.commands) {
    if (cmd.type === "M") o += `m ${cmd.x} ${cmd.y} `;
    else if (cmd.type === "L") o += `l ${cmd.x} ${cmd.y} `;
    else if (cmd.type === "Q") o += `q ${cmd.x} ${cmd.y} ${cmd.x1} ${cmd.y1} `;
    else if (cmd.type === "C")
      o += `b ${cmd.x} ${cmd.y} ${cmd.x1} ${cmd.y1} ${cmd.x2} ${cmd.y2} `;
    else if (cmd.type === "Z") o += "z ";
  }
  glyphs[ch] = {
    ha: glyph.advanceWidth ?? 0,
    x_min: glyph.xMin ?? 0,
    x_max: glyph.xMax ?? 0,
    o: o.trim(),
  };
}

const out = {
  glyphs,
  familyName: font.names.fontFamily?.en ?? "Custom",
  ascender: font.ascender,
  descender: font.descender,
  underlinePosition: font.tables.post?.underlinePosition ?? 0,
  underlineThickness: font.tables.post?.underlineThickness ?? 0,
  boundingBox: {
    yMin: font.tables.head?.yMin ?? 0,
    xMin: font.tables.head?.xMin ?? 0,
    yMax: font.tables.head?.yMax ?? 0,
    xMax: font.tables.head?.xMax ?? 0,
  },
  resolution: font.unitsPerEm,
  original_font_information: {},
  cssFontWeight: "normal",
  cssFontStyle: "normal",
};

writeFileSync(outPath, JSON.stringify(out));
console.log(`wrote ${outPath} with glyphs: ${Object.keys(glyphs).join("")}`);
