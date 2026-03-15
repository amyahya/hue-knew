"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { nearestColorName, rgbToCmyk, isLight } from "@/lib/color";
import { shareColor } from "@/lib/share";
import { useStorage } from "@/hooks/useStorage";
import SavedPanel from "@/components/SavedPanel";

interface SampledColor {
  hex: string;
  r: number;
  g: number;
  b: number;
}

// Map screen coords → video pixel coords, accounting for object-cover scaling
function toVideoCoords(
  video: HTMLVideoElement,
  clientX: number,
  clientY: number
): { vx: number; vy: number } {
  const rect = video.getBoundingClientRect();
  const videoAspect = video.videoWidth / video.videoHeight;
  const containerAspect = rect.width / rect.height;

  let renderWidth: number, renderHeight: number, offsetX: number, offsetY: number;
  if (videoAspect > containerAspect) {
    renderHeight = rect.height;
    renderWidth = renderHeight * videoAspect;
    offsetX = (rect.width - renderWidth) / 2;
    offsetY = 0;
  } else {
    renderWidth = rect.width;
    renderHeight = renderWidth / videoAspect;
    offsetX = 0;
    offsetY = (rect.height - renderHeight) / 2;
  }

  const scaleX = video.videoWidth / renderWidth;
  const scaleY = video.videoHeight / renderHeight;
  const vx = (clientX - rect.left - offsetX) * scaleX;
  const vy = (clientY - rect.top - offsetY) * scaleY;

  return {
    vx: Math.max(0, Math.min(video.videoWidth - 1, vx)),
    vy: Math.max(0, Math.min(video.videoHeight - 1, vy)),
  };
}

function rgbToHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");
}

export default function CameraView() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const sampleCanvasRef = useRef<HTMLCanvasElement>(null);
  const loupeCanvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const touchActiveRef = useRef(false);
  const lastTouchRef = useRef<{ x: number; y: number } | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [sampledColor, setSampledColor] = useState<SampledColor | null>(null);
  const [showSheet, setShowSheet] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const storage = useStorage();

  // Start camera
  useEffect(() => {
    async function start() {
      try {
        const s = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1080 } },
          audio: false,
        });
        streamRef.current = s;
        if (videoRef.current) videoRef.current.srcObject = s;
      } catch {
        try {
          const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
          streamRef.current = s;
          if (videoRef.current) videoRef.current.srcObject = s;
        } catch {
          setError("Camera access denied. Allow camera permissions and reload.");
        }
      }
    }
    start();
    return () => streamRef.current?.getTracks().forEach((t) => t.stop());
  }, []);

  // Size overlay canvas to screen
  useEffect(() => {
    function resize() {
      const c = loupeCanvasRef.current;
      if (!c) return;
      c.width = window.innerWidth;
      c.height = window.innerHeight;
    }
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  const sampleAt = useCallback((clientX: number, clientY: number): SampledColor | null => {
    const video = videoRef.current;
    const canvas = sampleCanvasRef.current;
    if (!video || !canvas || video.readyState < 2) return null;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return null;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    const { vx, vy } = toVideoCoords(video, clientX, clientY);
    const half = 2;
    const px = Math.max(half, Math.min(video.videoWidth - half - 1, Math.round(vx)));
    const py = Math.max(half, Math.min(video.videoHeight - half - 1, Math.round(vy)));

    const data = ctx.getImageData(px - half, py - half, 5, 5).data;
    let r = 0, g = 0, b = 0;
    for (let i = 0; i < data.length; i += 4) {
      r += data[i]; g += data[i + 1]; b += data[i + 2];
    }
    r = Math.round(r / 25);
    g = Math.round(g / 25);
    b = Math.round(b / 25);

    return { hex: rgbToHex(r, g, b), r, g, b };
  }, []);

  const drawLoupe = useCallback((clientX: number, clientY: number) => {
    const video = videoRef.current;
    const canvas = loupeCanvasRef.current;
    if (!video || !canvas || video.readyState < 2) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const LOUPE_R = 64;
    const ZOOM = 6;
    const cx = Math.max(LOUPE_R + 8, Math.min(canvas.width - LOUPE_R - 8, clientX));
    const cy = Math.max(LOUPE_R + 8, clientY - 120);

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, LOUPE_R, 0, Math.PI * 2);
    ctx.clip();

    const { vx, vy } = toVideoCoords(video, clientX, clientY);
    const srcW = (LOUPE_R * 2) / ZOOM;
    const srcH = (LOUPE_R * 2) / ZOOM;
    // Convert source size from screen pixels to video pixels
    const rect = video.getBoundingClientRect();
    const videoAspect = video.videoWidth / video.videoHeight;
    const containerAspect = rect.width / rect.height;
    const renderWidth = videoAspect > containerAspect ? rect.height * videoAspect : rect.width;
    const scaleX = video.videoWidth / renderWidth;
    const srcWv = srcW * scaleX;
    const srcHv = srcH * scaleX;

    ctx.drawImage(
      video,
      vx - srcWv / 2, vy - srcHv / 2, srcWv, srcHv,
      cx - LOUPE_R, cy - LOUPE_R, LOUPE_R * 2, LOUPE_R * 2
    );
    ctx.restore();

    ctx.beginPath();
    ctx.arc(cx, cy, LOUPE_R, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255,255,255,0.95)";
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.strokeStyle = "rgba(255,255,255,0.9)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx - 10, cy); ctx.lineTo(cx + 10, cy);
    ctx.moveTo(cx, cy - 10); ctx.lineTo(cx, cy + 10);
    ctx.stroke();
  }, []);

  const clearLoupe = useCallback(() => {
    const canvas = loupeCanvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  }, []);

  useEffect(() => {
    const canvas = loupeCanvasRef.current;
    if (!canvas) return;

    function onTouchStart(e: TouchEvent) {
      e.preventDefault();
      touchActiveRef.current = true;
      const t = e.touches[0];
      lastTouchRef.current = { x: t.clientX, y: t.clientY };
      drawLoupe(t.clientX, t.clientY);
    }

    function onTouchMove(e: TouchEvent) {
      e.preventDefault();
      const t = e.touches[0];
      lastTouchRef.current = { x: t.clientX, y: t.clientY };
      drawLoupe(t.clientX, t.clientY);
    }

    function onTouchEnd(e: TouchEvent) {
      e.preventDefault();
      touchActiveRef.current = false;
      clearLoupe();
      const pos = lastTouchRef.current;
      if (pos) {
        const color = sampleAt(pos.x, pos.y);
        if (color) {
          setSampledColor(color);
          setShowSheet(true);
        }
      }
      lastTouchRef.current = null;
    }

    canvas.addEventListener("touchstart", onTouchStart, { passive: false });
    canvas.addEventListener("touchmove", onTouchMove, { passive: false });
    canvas.addEventListener("touchend", onTouchEnd, { passive: false });
    return () => {
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchmove", onTouchMove);
      canvas.removeEventListener("touchend", onTouchEnd);
    };
  }, [drawLoupe, clearLoupe, sampleAt]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    const color = sampleAt(e.clientX, e.clientY);
    if (color) {
      setSampledColor(color);
      setShowSheet(true);
    }
  }, [sampleAt]);

  if (error) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-black px-8 text-center text-white">
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 h-full w-full object-cover"
      />

      <canvas ref={sampleCanvasRef} className="hidden" />

      <canvas
        ref={loupeCanvasRef}
        className="absolute inset-0"
        style={{ touchAction: "none", cursor: "crosshair" }}
        onClick={handleClick}
      />

      {!sampledColor && (
        <p className="pointer-events-none absolute bottom-10 left-0 right-0 text-center text-sm text-white/40 select-none">
          Tap anywhere to identify a color
        </p>
      )}

      {/* Saved colors button */}
      <button
        onClick={() => setShowSaved(true)}
        className="absolute top-12 right-5 flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-2 text-sm text-white/70 backdrop-blur-md active:bg-black/60"
        aria-label="Saved colors"
      >
        <span>⊞</span>
        {storage.colors.length > 0 && (
          <span className="text-xs text-white/50">{storage.colors.length}</span>
        )}
      </button>

      {showSheet && sampledColor && (
        <ColorSheet
          color={sampledColor}
          onClose={() => setShowSheet(false)}
          onSave={(name) => {
            storage.save({ hex: sampledColor.hex, r: sampledColor.r, g: sampledColor.g, b: sampledColor.b, name });
          }}
          isSaved={storage.colors.some((c) => c.hex === sampledColor.hex)}
        />
      )}

      {showSaved && (
        <SavedPanel
          colors={storage.colors}
          palettes={storage.palettes}
          onClose={() => setShowSaved(false)}
          onDeleteColor={storage.removeColor}
          onAddPalette={storage.addPalette}
          onRenamePalette={storage.updatePaletteName}
          onDeletePalette={storage.removePalette}
          onAddToPalette={storage.addToPalette}
          onRemoveFromPalette={storage.removeFromPalette}
        />
      )}
    </div>
  );
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button
      onClick={copy}
      className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-mono text-white/70 transition active:bg-white/20"
    >
      <span className="uppercase tracking-wider">{label}</span>
      <span className="text-white/40">{copied ? "✓" : "⎘"}</span>
    </button>
  );
}

function ColorSheet({
  color,
  onClose,
  onSave,
  isSaved,
}: {
  color: SampledColor;
  onClose: () => void;
  onSave: (name: string) => void;
  isSaved: boolean;
}) {
  const [aiName, setAiName] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [saved, setSaved] = useState(isSaved);
  const [shareStatus, setShareStatus] = useState<"idle" | "sharing" | "copied" | "error">("idle");

  const cmyk = rgbToCmyk(color.r, color.g, color.b);
  const colorName = nearestColorName(color.hex);
  const light = isLight(color.r, color.g, color.b);

  const rgbStr = `rgb(${color.r}, ${color.g}, ${color.b})`;
  const cmykStr = `cmyk(${cmyk.c}%, ${cmyk.m}%, ${cmyk.y}%, ${cmyk.k}%)`;

  async function getRicherName() {
    setAiLoading(true);
    try {
      const res = await fetch("/api/name-color", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hex: color.hex, r: color.r, g: color.g, b: color.b }),
      });
      const data = await res.json();
      setAiName(data.name ?? null);
    } catch {
      // silently fail — not critical
    } finally {
      setAiLoading(false);
    }
  }

  return (
    <div className="absolute bottom-0 left-0 right-0 rounded-t-2xl bg-zinc-900/95 backdrop-blur-xl">
      {/* Handle */}
      <div className="flex justify-center pt-3 pb-2">
        <div className="h-1 w-10 rounded-full bg-white/20" />
      </div>

      {/* Swatch + name */}
      <div className="flex items-start gap-4 px-5 pb-4">
        <div
          className="h-20 w-20 flex-shrink-0 rounded-2xl shadow-xl flex items-end justify-center pb-1"
          style={{ backgroundColor: color.hex }}
        >
          <span
            className="font-mono text-[10px] font-semibold uppercase"
            style={{ color: light ? "rgba(0,0,0,0.45)" : "rgba(255,255,255,0.45)" }}
          >
            {color.hex}
          </span>
        </div>

        <div className="flex-1 min-w-0 pt-1">
          {/* Color name */}
          <p className="text-white font-semibold text-lg leading-tight truncate">
            {aiName ?? colorName}
          </p>
          {aiName && (
            <p className="text-white/40 text-xs mt-0.5 truncate">{colorName}</p>
          )}

          {/* AI name button */}
          {!aiName && (
            <button
              onClick={getRicherName}
              disabled={aiLoading}
              className="mt-2 flex items-center gap-1.5 rounded-lg bg-white/8 px-3 py-1.5 text-xs text-white/50 transition active:bg-white/15 disabled:opacity-40"
            >
              {aiLoading ? (
                <span className="animate-pulse">Finding a poetic name…</span>
              ) : (
                <>✦ <span>Get a richer name</span></>
              )}
            </button>
          )}
        </div>

        <button
          onClick={onClose}
          className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-white/50 text-sm active:bg-white/20 mt-1"
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      {/* Save + Share buttons */}
      <div className="px-5 pb-3 flex gap-3">
        <button
          onClick={() => {
            if (!saved) {
              onSave(aiName ?? colorName);
              setSaved(true);
            }
          }}
          className={`flex-1 rounded-xl py-3 text-sm font-semibold transition ${
            saved
              ? "bg-white/8 text-white/30"
              : "bg-white text-black active:bg-white/80"
          }`}
        >
          {saved ? "Saved ✓" : "Save color"}
        </button>

        <button
          onClick={async () => {
            setShareStatus("sharing");
            const result = await shareColor({
              hex: color.hex,
              r: color.r,
              g: color.g,
              b: color.b,
              name: aiName ?? colorName,
            });
            setShareStatus(result === "copied" ? "copied" : "idle");
            if (result === "copied") setTimeout(() => setShareStatus("idle"), 2000);
          }}
          disabled={shareStatus === "sharing"}
          className="flex items-center justify-center gap-1.5 rounded-xl bg-white/10 px-5 py-3 text-sm text-white/70 transition active:bg-white/20 disabled:opacity-40"
        >
          {shareStatus === "sharing" ? (
            <span className="animate-pulse text-xs">…</span>
          ) : shareStatus === "copied" ? (
            <span className="text-xs">Copied ✓</span>
          ) : (
            <span>↑ Share</span>
          )}
        </button>
      </div>

      {/* Values */}
      <div className="border-t border-white/8 px-5 py-4 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs text-white/40 w-10">HEX</span>
          <span className="font-mono text-sm text-white/80 uppercase flex-1 px-3">{color.hex}</span>
          <CopyButton value={color.hex.toUpperCase()} label="copy" />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-white/40 w-10">RGB</span>
          <span className="font-mono text-sm text-white/80 flex-1 px-3">{rgbStr}</span>
          <CopyButton value={rgbStr} label="copy" />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-white/40 w-10">CMYK</span>
          <span className="font-mono text-sm text-white/80 flex-1 px-3">{cmykStr}</span>
          <CopyButton value={cmykStr} label="copy" />
        </div>
      </div>

      {/* Safe area pad */}
      <div className="h-6" />
    </div>
  );
}
