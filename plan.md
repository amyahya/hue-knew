# hue knew — Product Plan

> know your color.

---

## What We're Building
A mobile web app: point your camera at anything, tap a color, instantly know exactly what it is. Full specs. A name that means something. Save and export your palette.

**Stack:** Next.js · localStorage · Canvas API · getUserMedia

---

## Who It's For
**Primary user: Designers and developers** who need to move a color from the physical world into their tools — fast, accurately, in every format they need.

---

## The Four Features

### 1. Camera Color Capture
- Full-screen live camera feed on load (rear camera, `facingMode: environment`)
- Tap anywhere → freeze frame → sample a 5×5 pixel average at tap point
- Show a **loupe** (magnified view) at tap point for precision
- Draw camera frame to hidden canvas on tap, read pixel data with `getImageData`
- Haptic feedback on tap (where supported)
- **Error states:** camera denied, HTTPS required, iOS fallback to front camera

### 2. Color Identification (instant on tap)
- Color specs appear immediately — no "Identify" button step
- Bottom sheet slides up with:
  - Large color swatch (the hero)
  - Color name (from MIT-licensed color dataset — `color-name-list` npm)
  - HEX, RGB, CMYK values
  - Closest named color from extended dataset (labeled honestly, not as "Pantone")
- Each value: one-tap copy to clipboard
- Optional: "Get richer name" → AI API call via Next.js API route (key never exposed client-side)

### 3. Save Colors & Palettes
- "Save" in the bottom sheet → saves to localStorage
- Single Saved Colors list by default
- Optional: organize into named palettes
  - Create palette → name it → move colors in
  - Rename, reorder, delete palettes
- **Empty state:** designed with a moment of charm — first impression matters

### 4. Palette Export
- From any palette or full saved list:
  - **PNG** — swatch grid (color square + name + HEX)
  - **CSS** — `:root { --color-name: #hex; }` custom properties
  - **JSON** — raw color data, all formats
  - **ASE** — Adobe Swatch Exchange (via existing open-source encoder)
- All exports tested on mobile Safari and Chrome

### 5. Share (added — growth mechanic)
- From the bottom sheet, share a single color card:
  - Native share sheet (Web Share API) on mobile
  - Fallback: copy a shareable image to clipboard
- Color card: swatch + name + HEX — clean, beautiful, brandable

---

## UI Principles
- Camera is full-screen at all times — no chrome
- Bottom sheet (iOS style) slides up on tap — never blocks camera
- Dark UI — colors pop against the interface
- **"hue knew" has wit** — color names, microcopy, and empty states should have personality
- Two-view app: Camera ↔ Saved Colors
  - Single persistent icon in bottom corner
  - First-time hint so users discover the saved view

---

## Technical Decisions

| Decision | Choice | Reason |
| --- | --- | --- |
| Framework | Next.js | Already configured; API routes for AI proxy |
| Camera | `getUserMedia` + `facingMode: environment` | Standard, works across mobile browsers |
| Pixel sampling | Canvas `getImageData`, 5×5 average | Single pixel is too noisy |
| Color naming | `color-name-list` npm (MIT) | 30,000+ evocative names, legally clean |
| "Pantone" | Drop official claim, use extended named color dataset | Pantone data is proprietary |
| AI naming | Claude via Next.js API route proxy | Never expose API key client-side |
| Storage | `localStorage` | No backend needed for v1 |
| ASE export | Use existing open-source library | Binary format — don't hand-roll |
| Sharing | Web Share API + canvas image fallback | Native feel on mobile |

---

## Out of Scope for v1
- User accounts / sync across devices
- Color theory tools (complementary, triadic, etc.)
- Backend / cloud storage
- Desktop optimization (degrades gracefully, not optimized)

## Backlog (post-v1)
- **Photo upload** — sample colors from existing photos/screenshots in camera roll

---

## Success in v1
- A designer can go from "I see a color" to "it's in my clipboard" in under 3 seconds
- Saved palettes export correctly in all 4 formats
- The product feels like it has a point of view — not just a utility
