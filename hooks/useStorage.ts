"use client";

import { useState, useCallback, useEffect } from "react";
import {
  getStore,
  saveColor,
  deleteColor,
  createPalette,
  renamePalette,
  deletePalette,
  addColorToPalette,
  removeColorFromPalette,
  type SavedColor,
  type Palette,
} from "@/lib/storage";

export function useStorage() {
  const [colors, setColors] = useState<SavedColor[]>([]);
  const [palettes, setPalettes] = useState<Palette[]>([]);

  function refresh() {
    const store = getStore();
    setColors(store.colors);
    setPalettes(store.palettes);
  }

  useEffect(() => {
    refresh();
  }, []);

  const save = useCallback(
    (color: Omit<SavedColor, "id" | "savedAt">) => {
      const entry = saveColor(color);
      refresh();
      return entry;
    },
    []
  );

  const removeColor = useCallback((id: string) => {
    deleteColor(id);
    refresh();
  }, []);

  const addPalette = useCallback((name: string) => {
    const p = createPalette(name);
    refresh();
    return p;
  }, []);

  const updatePaletteName = useCallback((id: string, name: string) => {
    renamePalette(id, name);
    refresh();
  }, []);

  const removePalette = useCallback((id: string) => {
    deletePalette(id);
    refresh();
  }, []);

  const addToPalette = useCallback((paletteId: string, colorId: string) => {
    addColorToPalette(paletteId, colorId);
    refresh();
  }, []);

  const removeFromPalette = useCallback((paletteId: string, colorId: string) => {
    removeColorFromPalette(paletteId, colorId);
    refresh();
  }, []);

  return {
    colors,
    palettes,
    save,
    removeColor,
    addPalette,
    updatePaletteName,
    removePalette,
    addToPalette,
    removeFromPalette,
  };
}
