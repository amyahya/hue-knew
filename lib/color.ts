import nearestColor from "nearest-color";
import { colornames } from "color-name-list/bestof";

// Build lookup once, lazily
let _find: ReturnType<typeof nearestColor.from> | null = null;

function getFinder() {
  if (!_find) {
    const map: Record<string, string> = {};
    for (const c of colornames) map[c.name] = c.hex;
    _find = nearestColor.from(map);
  }
  return _find;
}

export function nearestColorName(hex: string): string {
  try {
    return getFinder()(hex).name;
  } catch {
    return "";
  }
}

export function rgbToCmyk(r: number, g: number, b: number) {
  const rr = r / 255;
  const gg = g / 255;
  const bb = b / 255;
  const k = 1 - Math.max(rr, gg, bb);
  if (k === 1) return { c: 0, m: 0, y: 0, k: 100 };
  const c = Math.round(((1 - rr - k) / (1 - k)) * 100);
  const m = Math.round(((1 - gg - k) / (1 - k)) * 100);
  const y = Math.round(((1 - bb - k) / (1 - k)) * 100);
  return { c, m, y, k: Math.round(k * 100) };
}

export function isLight(r: number, g: number, b: number): boolean {
  return 0.299 * r + 0.587 * g + 0.114 * b > 160;
}
