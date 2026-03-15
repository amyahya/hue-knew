export interface SavedColor {
  id: string;
  hex: string;
  r: number;
  g: number;
  b: number;
  name: string;
  savedAt: number;
}

export interface Palette {
  id: string;
  name: string;
  colorIds: string[];
  createdAt: number;
}

interface Store {
  colors: SavedColor[];
  palettes: Palette[];
}

const KEY = "hue-knew-store";

function load(): Store {
  if (typeof window === "undefined") return { colors: [], palettes: [] };
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : { colors: [], palettes: [] };
  } catch {
    return { colors: [], palettes: [] };
  }
}

function save(store: Store) {
  localStorage.setItem(KEY, JSON.stringify(store));
}

export function getStore(): Store {
  return load();
}

export function saveColor(color: Omit<SavedColor, "id" | "savedAt">): SavedColor {
  const store = load();
  const entry: SavedColor = { ...color, id: crypto.randomUUID(), savedAt: Date.now() };
  store.colors = [entry, ...store.colors];
  save(store);
  return entry;
}

export function deleteColor(id: string) {
  const store = load();
  store.colors = store.colors.filter((c) => c.id !== id);
  store.palettes = store.palettes.map((p) => ({
    ...p,
    colorIds: p.colorIds.filter((cid) => cid !== id),
  }));
  save(store);
}

export function createPalette(name: string): Palette {
  const store = load();
  const palette: Palette = { id: crypto.randomUUID(), name, colorIds: [], createdAt: Date.now() };
  store.palettes = [...store.palettes, palette];
  save(store);
  return palette;
}

export function renamePalette(id: string, name: string) {
  const store = load();
  store.palettes = store.palettes.map((p) => (p.id === id ? { ...p, name } : p));
  save(store);
}

export function deletePalette(id: string) {
  const store = load();
  store.palettes = store.palettes.filter((p) => p.id !== id);
  save(store);
}

export function addColorToPalette(paletteId: string, colorId: string) {
  const store = load();
  store.palettes = store.palettes.map((p) =>
    p.id === paletteId && !p.colorIds.includes(colorId)
      ? { ...p, colorIds: [...p.colorIds, colorId] }
      : p
  );
  save(store);
}

export function removeColorFromPalette(paletteId: string, colorId: string) {
  const store = load();
  store.palettes = store.palettes.map((p) =>
    p.id === paletteId ? { ...p, colorIds: p.colorIds.filter((id) => id !== colorId) } : p
  );
  save(store);
}
