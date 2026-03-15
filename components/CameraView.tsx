"use client";

import { useRef, useState, useEffect, useCallback } from "react";

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
    // video wider than container → height fills, sides crop
    renderHeight = rect.height;
    renderWidth = renderHeight * videoAspect;
    offsetX = (rect.width - renderWidth) / 2;
    offsetY = 0;
  } else {
    // video taller than container → width fills, top/bottom crop
    renderWidth = rect.width;
    renderHeight = renderWidth / videoAspect;
    offsetX = 0;
    offsetY = (rect.height - renderHeight) / 2;
  }

  const scaleX = video.videoWidth / renderWidth;
  const scaleY = video.videoHeight / renderHeight;
  const vx = ((clientX - rect.left) - offsetX) * scaleX;
  const vy = ((clientY - rect.top) - offsetY) * scaleY;

  return {
    vx: Math.max(0, Math.min(video.videoWidth - 1, vx)),
    vy: Math.max(0, Math.min(video.videoHeight - 1, vy)),
  };
}

function rgbToHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");
}

// Perceived luminance — decides whether text on the color swatch should be black or white
function isLight(r: number, g: number, b: number): boolean {
  return 0.299 * r + 0.587 * g + 0.114 * b > 160;
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
        // iOS Safari fallback: request any camera without facingMode constraint
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
    const half = 2; // 5×5 grid
    const px = Math.max(half, Math.min(video.videoWidth - half - 1, Math.round(vx)));
    const py = Math.max(half, Math.min(video.videoHeight - half - 1, Math.round(vy)));

    const data = ctx.getImageData(px - half, py - half, 5, 5).data;
    let r = 0, g = 0, b = 0;
    for (let i = 0; i < data.length; i += 4) {
      r += data[i]; g += data[i + 1]; b += data[i + 2];
    }
    const count = 25;
    r = Math.round(r / count);
    g = Math.round(g / count);
    b = Math.round(b / count);

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
    // Position loupe above finger, clamped to screen
    const cx = Math.max(LOUPE_R + 8, Math.min(canvas.width - LOUPE_R - 8, clientX));
    const cy = Math.max(LOUPE_R + 8, clientY - 120);

    // Clip to circle
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, LOUPE_R, 0, Math.PI * 2);
    ctx.clip();

    // Draw zoomed video region
    const { vx, vy } = toVideoCoords(video, clientX, clientY);
    const rect = video.getBoundingClientRect();
    const scaleX = video.videoWidth / rect.width;
    const scaleY = video.videoHeight / rect.height;
    // source rect in video pixels
    const srcW = (LOUPE_R * 2) / ZOOM / scaleX * scaleX; // simplify: LOUPE_R*2/ZOOM in video px
    const srcH = (LOUPE_R * 2) / ZOOM / scaleY * scaleY;
    const srcX = vx - srcW / 2;
    const srcY = vy - srcH / 2;

    ctx.drawImage(
      video,
      srcX, srcY, srcW, srcH,
      cx - LOUPE_R, cy - LOUPE_R, LOUPE_R * 2, LOUPE_R * 2
    );
    ctx.restore();

    // White ring
    ctx.beginPath();
    ctx.arc(cx, cy, LOUPE_R, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255,255,255,0.95)";
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Crosshair
    ctx.strokeStyle = "rgba(255,255,255,0.9)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx - 10, cy); ctx.lineTo(cx + 10, cy);
    ctx.moveTo(cx, cy - 10); ctx.lineTo(cx, cy + 10);
    ctx.stroke();
  }, []);

  const clearLoupe = useCallback(() => {
    const canvas = loupeCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx?.clearRect(0, 0, canvas.width, canvas.height);
  }, []);

  // Non-passive touch listeners (required for preventDefault to work)
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

  // Mouse click for desktop testing
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
      {/* Live camera feed */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 h-full w-full object-cover"
      />

      {/* Hidden canvas for pixel sampling */}
      <canvas ref={sampleCanvasRef} className="hidden" />

      {/* Loupe overlay — touch/click target */}
      <canvas
        ref={loupeCanvasRef}
        className="absolute inset-0"
        style={{ touchAction: "none", cursor: "crosshair" }}
        onClick={handleClick}
      />

      {/* Tap hint */}
      {!sampledColor && (
        <p className="pointer-events-none absolute bottom-10 left-0 right-0 text-center text-sm text-white/40 select-none">
          Tap anywhere to identify a color
        </p>
      )}

      {/* Color sheet */}
      {showSheet && sampledColor && (
        <ColorSheet
          color={sampledColor}
          onClose={() => setShowSheet(false)}
        />
      )}
    </div>
  );
}

function ColorSheet({ color, onClose }: { color: SampledColor; onClose: () => void }) {
  const light = isLight(color.r, color.g, color.b);

  return (
    <div className="absolute bottom-0 left-0 right-0 rounded-t-2xl bg-black/80 backdrop-blur-xl">
      {/* Drag handle */}
      <div className="flex justify-center pt-3 pb-1">
        <div className="h-1 w-10 rounded-full bg-white/20" />
      </div>

      <div className="flex items-center gap-4 px-6 py-5">
        {/* Swatch */}
        <div
          className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-2xl shadow-xl"
          style={{ backgroundColor: color.hex }}
        >
          <span
            className="font-mono text-xs font-semibold uppercase"
            style={{ color: light ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.5)" }}
          >
            {color.hex}
          </span>
        </div>

        {/* Values */}
        <div className="flex-1">
          <p className="font-mono text-2xl font-semibold uppercase tracking-wide text-white">
            {color.hex}
          </p>
          <p className="mt-1 font-mono text-sm text-white/50">
            rgb({color.r}, {color.g}, {color.b})
          </p>
        </div>

        {/* Close */}
        <button
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/60 active:bg-white/20"
          aria-label="Close"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
