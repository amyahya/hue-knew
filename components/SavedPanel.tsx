"use client";

import { useState } from "react";
import { isLight } from "@/lib/color";
import type { SavedColor, Palette } from "@/lib/storage";
import { exportPng, exportCss, exportJson, exportAse } from "@/lib/export";

interface Props {
  colors: SavedColor[];
  palettes: Palette[];
  onClose: () => void;
  onDeleteColor: (id: string) => void;
  onAddPalette: (name: string) => void;
  onRenamePalette: (id: string, name: string) => void;
  onDeletePalette: (id: string) => void;
  onAddToPalette: (paletteId: string, colorId: string) => void;
  onRemoveFromPalette: (paletteId: string, colorId: string) => void;
}

export default function SavedPanel({
  colors,
  palettes,
  onClose,
  onDeleteColor,
  onAddPalette,
  onRenamePalette,
  onDeletePalette,
  onAddToPalette,
  onRemoveFromPalette,
}: Props) {
  const [tab, setTab] = useState<"colors" | "palettes">("colors");
  const [newPaletteName, setNewPaletteName] = useState("");
  const [showNewPaletteInput, setShowNewPaletteInput] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [expandedPalette, setExpandedPalette] = useState<string | null>(null);
  // Which color is showing its action menu
  const [activeColorId, setActiveColorId] = useState<string | null>(null);
  // Add-to-palette picker state
  const [addingColorId, setAddingColorId] = useState<string | null>(null);

  function submitNewPalette() {
    const name = newPaletteName.trim();
    if (!name) return;
    onAddPalette(name);
    setNewPaletteName("");
    setShowNewPaletteInput(false);
  }

  function submitRename(id: string) {
    const name = renameValue.trim();
    if (name) onRenamePalette(id, name);
    setRenamingId(null);
  }

  return (
    <div className="absolute inset-0 z-20 flex flex-col bg-zinc-950">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-12 pb-4">
        <h2 className="text-xl font-semibold text-white">Saved</h2>
        <button
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/50 active:bg-white/20"
        >
          ✕
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-5 pb-4">
        {(["colors", "palettes"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium capitalize transition ${
              tab === t
                ? "bg-white text-black"
                : "bg-white/10 text-white/50 active:bg-white/15"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 pb-8">
        {tab === "colors" && (
          <>
            {colors.length === 0 ? (
              <p className="mt-12 text-center text-sm text-white/30">
                No saved colors yet. Tap a color to save it.
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {colors.map((c) => (
                  <ColorCard
                    key={c.id}
                    color={c}
                    palettes={palettes}
                    isActive={activeColorId === c.id}
                    isAddingToPalette={addingColorId === c.id}
                    onTap={() =>
                      setActiveColorId(activeColorId === c.id ? null : c.id)
                    }
                    onDelete={() => {
                      onDeleteColor(c.id);
                      setActiveColorId(null);
                    }}
                    onAddToPalette={() => {
                      setAddingColorId(c.id);
                      setActiveColorId(null);
                    }}
                    onPickPalette={(pid) => {
                      onAddToPalette(pid, c.id);
                      setAddingColorId(null);
                    }}
                    onCancelPalette={() => setAddingColorId(null)}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {tab === "palettes" && (
          <div className="space-y-3">
            {/* New palette button */}
            {showNewPaletteInput ? (
              <div className="flex gap-2">
                <input
                  autoFocus
                  value={newPaletteName}
                  onChange={(e) => setNewPaletteName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") submitNewPalette();
                    if (e.key === "Escape") setShowNewPaletteInput(false);
                  }}
                  placeholder="Palette name"
                  className="flex-1 rounded-xl bg-white/10 px-4 py-2.5 text-sm text-white outline-none placeholder:text-white/30"
                />
                <button
                  onClick={submitNewPalette}
                  className="rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-black"
                >
                  Create
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowNewPaletteInput(true)}
                className="w-full rounded-xl border border-dashed border-white/20 py-3 text-sm text-white/40 active:bg-white/5"
              >
                + New palette
              </button>
            )}

            {palettes.length === 0 && !showNewPaletteInput && (
              <p className="mt-8 text-center text-sm text-white/30">
                No palettes yet.
              </p>
            )}

            {palettes.map((p) => {
              const paletteColors = p.colorIds
                .map((id) => colors.find((c) => c.id === id))
                .filter(Boolean) as SavedColor[];

              return (
                <div key={p.id} className="rounded-2xl bg-white/5">
                  {/* Palette header */}
                  <div className="flex items-center gap-3 px-4 py-3">
                    {/* Color strip preview */}
                    <div className="flex gap-1">
                      {paletteColors.slice(0, 5).map((c) => (
                        <div
                          key={c.id}
                          className="h-6 w-6 rounded-md"
                          style={{ backgroundColor: c.hex }}
                        />
                      ))}
                      {paletteColors.length === 0 && (
                        <div className="h-6 w-6 rounded-md bg-white/10" />
                      )}
                    </div>

                    {renamingId === p.id ? (
                      <input
                        autoFocus
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") submitRename(p.id);
                          if (e.key === "Escape") setRenamingId(null);
                        }}
                        onBlur={() => submitRename(p.id)}
                        className="flex-1 rounded-lg bg-white/10 px-2 py-1 text-sm text-white outline-none"
                      />
                    ) : (
                      <button
                        className="flex-1 text-left text-sm font-medium text-white"
                        onClick={() =>
                          setExpandedPalette(
                            expandedPalette === p.id ? null : p.id
                          )
                        }
                      >
                        {p.name}
                        <span className="ml-2 text-xs text-white/30">
                          {paletteColors.length}
                        </span>
                      </button>
                    )}

                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setRenamingId(p.id);
                          setRenameValue(p.name);
                        }}
                        className="text-xs text-white/30 active:text-white/60"
                      >
                        ✎
                      </button>
                      <button
                        onClick={() => onDeletePalette(p.id)}
                        className="text-xs text-white/30 active:text-red-400"
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  {/* Expanded colors */}
                  {expandedPalette === p.id && (
                    <div className="border-t border-white/8 px-4 pt-2 pb-4">
                      {paletteColors.length > 0 ? (
                        <div className="grid grid-cols-3 gap-2 mb-4">
                          {paletteColors.map((c) => (
                            <div key={c.id} className="relative">
                              <div
                                className="h-16 w-full rounded-xl"
                                style={{ backgroundColor: c.hex }}
                              />
                              <p className="mt-1 text-center font-mono text-xs text-white/50 uppercase">
                                {c.hex}
                              </p>
                              <button
                                onClick={() => onRemoveFromPalette(p.id, c.id)}
                                className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-zinc-900 text-[10px] text-white/50 active:text-red-400"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-white/30 py-2 mb-3">
                          No colors yet — save a color and add it here.
                        </p>
                      )}

                      {/* Export buttons */}
                      {paletteColors.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          <p className="w-full text-xs text-white/30 mb-1">Export</p>
                          {(["PNG", "CSS", "JSON", "ASE"] as const).map((fmt) => (
                            <button
                              key={fmt}
                              onClick={() => {
                                if (fmt === "PNG") exportPng(p, paletteColors);
                                if (fmt === "CSS") exportCss(p, paletteColors);
                                if (fmt === "JSON") exportJson(p, paletteColors);
                                if (fmt === "ASE") exportAse(p, paletteColors);
                              }}
                              className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-mono text-white/60 active:bg-white/20"
                            >
                              {fmt}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function ColorCard({
  color,
  palettes,
  isActive,
  isAddingToPalette,
  onTap,
  onDelete,
  onAddToPalette,
  onPickPalette,
  onCancelPalette,
}: {
  color: SavedColor;
  palettes: Palette[];
  isActive: boolean;
  isAddingToPalette: boolean;
  onTap: () => void;
  onDelete: () => void;
  onAddToPalette: () => void;
  onPickPalette: (paletteId: string) => void;
  onCancelPalette: () => void;
}) {
  const light = isLight(color.r, color.g, color.b);

  if (isAddingToPalette) {
    return (
      <div className="rounded-2xl bg-white/8 p-2 space-y-1.5">
        <p className="text-xs text-white/40 px-1">Add to…</p>
        {palettes.length === 0 ? (
          <p className="text-xs text-white/30 px-1">No palettes</p>
        ) : (
          palettes.map((p) => (
            <button
              key={p.id}
              onClick={() => onPickPalette(p.id)}
              className="w-full rounded-lg bg-white/10 px-2 py-1.5 text-left text-xs text-white truncate active:bg-white/20"
            >
              {p.name}
            </button>
          ))
        )}
        <button
          onClick={onCancelPalette}
          className="w-full rounded-lg py-1 text-xs text-white/30 active:text-white/60"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <button className="w-full" onClick={onTap}>
        <div
          className="h-20 w-full rounded-2xl"
          style={{ backgroundColor: color.hex }}
        >
          {isActive && (
            <div className="flex h-full w-full flex-col items-center justify-center gap-1 rounded-2xl bg-black/40">
              <button
                onClick={(e) => { e.stopPropagation(); onAddToPalette(); }}
                className="rounded-lg bg-white/20 px-3 py-1 text-xs text-white active:bg-white/40"
              >
                + Palette
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                className="rounded-lg bg-red-500/40 px-3 py-1 text-xs text-white active:bg-red-500/70"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </button>
      <p
        className="mt-1 text-center font-mono text-xs truncate"
        style={{ color: "rgba(255,255,255,0.5)" }}
      >
        {color.name || color.hex}
      </p>
    </div>
  );
}
