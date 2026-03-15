# Color Capture - PRD

## Overview
A mobile web app that lets users point their camera at anything, tap to capture the color, and get full color specs. Clean, minimal, fast.

---

## User Flow
1. Open app → full-screen camera view
2. User taps anywhere on the camera feed
3. Small modal appears: color square of the tapped pixel + "Identify" button
4. User taps **"Identify"** → color specs expand in the modal
5. User taps **"Save"** → color saved to their list, modal dismisses back to camera
6. **Or** user taps **"X" / swipe down** → modal dismisses, camera is live again for a new tap
7. User taps the **palette icon** (bottom corner) → navigates to Saved Colors / palette management view
8. From Saved Colors, user taps **camera icon** → returns to camera view

---

## Feature 1: Camera Color Capture
- Full-screen live camera feed on load
- Tap anywhere on feed to sample the pixel color at that point
- Show a small bottom modal with:
  - Square swatch of the captured color
  - "Identify" button
  - "Cancel" / dismiss button
- Test: Tapping on a solid-colored surface returns a color within 200ms
- Test: Modal appears without interrupting the camera feed

---

## Feature 2: Color Identification
- On-device pixel sampling is the default (instant, no API call)
- Color name matched from a local color name dataset (closest named color)
- Optional: "Enhance name" button triggers an AI API call for a richer name (e.g. "dusty rose" instead of "pink")
- **Pantone matching** — map the captured color to its closest Pantone name (e.g. "Pantone 2728 C", "Klein Blue") — this is the differentiator
- Specs shown after identify:
  - Color name (e.g. "Slate Blue")
  - HEX (e.g. `#6A5ACD`)
  - RGB (e.g. `rgb(106, 90, 205)`)
  - CMYK (e.g. `cmyk(48, 56, 0, 20)`)
- Each value has a one-tap copy-to-clipboard button
- Test: All 4 color formats display correctly for any sampled color
- Test: Copy button copies the correct format string to clipboard

---

## Feature 3: Save Colors
- "Save" button in the identify modal saves the color
- Colors land in a single **Saved Colors** list (default)
- Users can optionally organize saved colors into **named palettes**
  - Create palette → give it a name → move colors into it
- Saved list is persistent (localStorage or IndexedDB)
- Test: Saved color appears in list immediately after saving
- Test: User can create a palette, name it, and move a color into it in under 4 taps

---

## Feature 4: Palette Export
- From any palette or the full saved list, user can export:
  - **PNG** — swatch grid image (color squares + codes)
  - **CSS** — CSS custom properties (`:root { --color-name: #hex; }`)
  - **ASE** — Adobe Swatch Exchange (for Figma/Illustrator)
  - **JSON** — raw color data with all formats
- Test: Each export format downloads correctly on mobile Safari and Chrome
- Test: PNG swatch includes color name and HEX for each color
- Test: CSS file uses color names as variable names (slugified)

---

## UI Decisions
- Camera is full-screen at all times — no chrome, no clutter
- Modal slides up from the bottom on tap (iOS sheet style)
- Color swatch in modal is large and dominant — the color is the hero
- Modal actions: Identify, Save, Copy (per format), X to dismiss — nothing else
- Dismissing the modal (X or swipe down) returns camera to live/active state immediately — user can tap a new area right away
- **Navigation:** two-view app — Camera view and Saved Colors view
  - Single persistent icon in the bottom corner to toggle between views
  - Camera icon → go to camera; Palette icon → go to saved colors
  - No tabs bar, no nav header — keep full screen real estate for camera
- Dark UI so colors pop against the interface
- Subtle haptic feedback on tap (where supported)

---

## Technical Decisions
- **Framework:** Vanilla JS or lightweight framework (no heavy SPA needed)
- **Camera API:** `getUserMedia` with `facingMode: environment` (rear camera)
- **Pixel sampling:** Draw camera frame to a hidden `<canvas>`, read pixel at tap coordinates with `getImageData`
- **Color naming:** Local dataset (e.g. `color-name` npm package) for instant offline matching
- **AI enhance:** Optional API call for richer color name — only triggered on user request
- **Storage:** `localStorage` for saved colors and palettes (no backend needed for v1)
- **Export:** PNG via canvas, CSS/JSON via Blob download, ASE via binary encoding
- **No login required** — everything is local to the device in v1
