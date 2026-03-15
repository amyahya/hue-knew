import { isLight } from "./color";

interface ShareColor {
  hex: string;
  r: number;
  g: number;
  b: number;
  name: string;
}

// Build a square color card canvas and return it as a Blob
function buildCard(color: ShareColor): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const SIZE = 600;
    const canvas = document.createElement("canvas");
    canvas.width = SIZE;
    canvas.height = SIZE;
    const ctx = canvas.getContext("2d")!;

    // Background — the color itself
    ctx.fillStyle = color.hex;
    ctx.fillRect(0, 0, SIZE, SIZE);

    // Subtle inner shadow at bottom for contrast
    const grad = ctx.createLinearGradient(0, SIZE * 0.55, 0, SIZE);
    grad.addColorStop(0, "rgba(0,0,0,0)");
    grad.addColorStop(1, "rgba(0,0,0,0.35)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, SIZE, SIZE);

    const textColor = isLight(color.r, color.g, color.b)
      ? "rgba(0,0,0,0.85)"
      : "rgba(255,255,255,0.9)";
    const subtleColor = isLight(color.r, color.g, color.b)
      ? "rgba(0,0,0,0.4)"
      : "rgba(255,255,255,0.45)";

    // Color name
    ctx.fillStyle = textColor;
    ctx.font = "bold 52px -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(color.name, 48, SIZE - 120);

    // HEX value
    ctx.fillStyle = subtleColor;
    ctx.font = "32px 'SF Mono', 'Fira Mono', monospace";
    ctx.fillText(color.hex.toUpperCase(), 48, SIZE - 68);

    // Watermark
    ctx.fillStyle = subtleColor;
    ctx.font = "22px -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.textAlign = "right";
    ctx.fillText("hue knew", SIZE - 48, SIZE - 68);

    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Canvas toBlob failed"));
    }, "image/png");
  });
}

export type ShareResult = "shared" | "copied" | "error";

export async function shareColor(color: ShareColor): Promise<ShareResult> {
  const text = `${color.name} — ${color.hex.toUpperCase()}\nrgb(${color.r}, ${color.g}, ${color.b})`;

  try {
    const blob = await buildCard(color);
    const file = new File([blob], "color.png", { type: "image/png" });

    // Web Share API with file support (mobile)
    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      await navigator.share({
        title: color.name,
        text,
        files: [file],
      });
      return "shared";
    }

    // Web Share API without file (some desktop browsers)
    if (navigator.share) {
      await navigator.share({ title: color.name, text });
      return "shared";
    }

    // Fallback: copy text to clipboard
    await navigator.clipboard.writeText(text);
    return "copied";
  } catch (err) {
    // User cancelled share — not an error
    if (err instanceof Error && err.name === "AbortError") return "shared";
    // Last resort clipboard fallback
    try {
      await navigator.clipboard.writeText(text);
      return "copied";
    } catch {
      return "error";
    }
  }
}
