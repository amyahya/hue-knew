import type { SavedColor, Palette } from "./storage";

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function safeName(name: string): string {
  return name.replace(/[^a-z0-9]/gi, "-").toLowerCase();
}

// ── PNG ────────────────────────────────────────────────────────────────────
export function exportPng(palette: Palette, colors: SavedColor[]) {
  const swatchSize = 120;
  const labelHeight = 48;
  const padding = 16;
  const cols = Math.min(colors.length, 6);
  const rows = Math.ceil(colors.length / cols);
  const w = cols * swatchSize + (cols + 1) * padding;
  const h = rows * (swatchSize + labelHeight) + (rows + 1) * padding + 40; // 40 for title

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;

  // Background
  ctx.fillStyle = "#111111";
  ctx.fillRect(0, 0, w, h);

  // Title
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.font = "bold 14px monospace";
  ctx.textAlign = "left";
  ctx.fillText(palette.name, padding, 26);

  colors.forEach((c, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = padding + col * (swatchSize + padding);
    const y = 40 + padding + row * (swatchSize + labelHeight + padding);

    // Swatch
    ctx.fillStyle = c.hex;
    ctx.beginPath();
    ctx.roundRect(x, y, swatchSize, swatchSize, 12);
    ctx.fill();

    // Hex label
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.font = "11px monospace";
    ctx.textAlign = "center";
    ctx.fillText(c.hex.toUpperCase(), x + swatchSize / 2, y + swatchSize + 18);

    // Name label
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.font = "10px sans-serif";
    const name = c.name.length > 16 ? c.name.slice(0, 14) + "…" : c.name;
    ctx.fillText(name, x + swatchSize / 2, y + swatchSize + 34);
  });

  canvas.toBlob((blob) => {
    if (blob) triggerDownload(blob, `${safeName(palette.name)}.png`);
  });
}

// ── CSS ────────────────────────────────────────────────────────────────────
export function exportCss(palette: Palette, colors: SavedColor[]) {
  const lines = [
    `/* ${palette.name} — exported from hue knew */`,
    `:root {`,
    ...colors.map((c, i) => {
      const varName = `--color-${safeName(c.name) || i + 1}`;
      return `  ${varName}: ${c.hex.toUpperCase()}; /* rgb(${c.r}, ${c.g}, ${c.b}) */`;
    }),
    `}`,
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/css" });
  triggerDownload(blob, `${safeName(palette.name)}.css`);
}

// ── JSON ───────────────────────────────────────────────────────────────────
export function exportJson(palette: Palette, colors: SavedColor[]) {
  const data = {
    name: palette.name,
    exportedFrom: "hue knew",
    colors: colors.map((c) => ({
      name: c.name,
      hex: c.hex.toUpperCase(),
      rgb: { r: c.r, g: c.g, b: c.b },
    })),
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  triggerDownload(blob, `${safeName(palette.name)}.json`);
}

// ── ASE ────────────────────────────────────────────────────────────────────
// Adobe Swatch Exchange binary format (v1.0)
// Spec: https://www.adobe.com/devnet-apps/photoshop/fileformatashtml/#50577411_pgfId-1055819
export function exportAse(palette: Palette, colors: SavedColor[]) {
  // Encode a single color block
  function colorBlock(color: SavedColor): ArrayBuffer {
    const nameUtf16 = encodeUtf16BE(color.name);
    const nameLenBytes = nameUtf16.byteLength; // includes null terminator
    const blockLen = 2 + nameLenBytes + 4 + 3 * 4 + 2; // nameLen field + name + model + floats + type
    const buf = new ArrayBuffer(2 + 4 + blockLen);
    const view = new DataView(buf);
    let off = 0;
    view.setUint16(off, 0x0001, false); off += 2; // block type: color
    view.setUint32(off, blockLen, false); off += 4; // block length
    view.setUint16(off, (nameLenBytes / 2), false); off += 2; // name length in UTF-16 chars
    new Uint8Array(buf, off, nameLenBytes).set(new Uint8Array(nameUtf16)); off += nameLenBytes;
    // Color model: "RGB " (4 ASCII bytes)
    [0x52, 0x47, 0x42, 0x20].forEach((b) => { view.setUint8(off++, b); });
    view.setFloat32(off, color.r / 255, false); off += 4;
    view.setFloat32(off, color.g / 255, false); off += 4;
    view.setFloat32(off, color.b / 255, false); off += 4;
    view.setUint16(off, 0, false); // color type: global
    return buf;
  }

  function groupBlock(name: string, type: 0xC001 | 0xC002): ArrayBuffer {
    if (type === 0xC002) {
      const buf = new ArrayBuffer(6);
      const v = new DataView(buf);
      v.setUint16(0, 0xC002, false);
      v.setUint32(2, 0, false);
      return buf;
    }
    const nameUtf16 = encodeUtf16BE(name);
    const blockLen = 2 + nameUtf16.byteLength;
    const buf = new ArrayBuffer(2 + 4 + blockLen);
    const view = new DataView(buf);
    let off = 0;
    view.setUint16(off, 0xC001, false); off += 2;
    view.setUint32(off, blockLen, false); off += 4;
    view.setUint16(off, nameUtf16.byteLength / 2, false); off += 2;
    new Uint8Array(buf, off).set(new Uint8Array(nameUtf16));
    return buf;
  }

  function encodeUtf16BE(str: string): ArrayBuffer {
    // null-terminated UTF-16 BE
    const buf = new ArrayBuffer((str.length + 1) * 2);
    const view = new DataView(buf);
    for (let i = 0; i < str.length; i++) {
      view.setUint16(i * 2, str.charCodeAt(i), false);
    }
    view.setUint16(str.length * 2, 0, false); // null terminator
    return buf;
  }

  const blocks: ArrayBuffer[] = [
    groupBlock(palette.name, 0xC001),
    ...colors.map(colorBlock),
    groupBlock("", 0xC002),
  ];

  const totalBlocks = 1 + colors.length + 1; // group start + colors + group end
  const headerSize = 12; // "ASEF" + version + block count
  const totalSize = headerSize + blocks.reduce((s, b) => s + b.byteLength, 0);

  const result = new ArrayBuffer(totalSize);
  const view = new DataView(result);
  const bytes = new Uint8Array(result);

  // Header
  [0x41, 0x53, 0x45, 0x46].forEach((b, i) => bytes[i] = b); // "ASEF"
  view.setUint32(4, 0x00010000, false); // version 1.0
  view.setUint32(8, totalBlocks, false);

  let offset = headerSize;
  for (const block of blocks) {
    bytes.set(new Uint8Array(block), offset);
    offset += block.byteLength;
  }

  const blob = new Blob([result], { type: "application/octet-stream" });
  triggerDownload(blob, `${safeName(palette.name)}.ase`);
}
