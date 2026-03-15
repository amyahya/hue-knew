# Gap Analysis — hue knew PRD

## Technical Gaps

### Critical
- **Pantone data is proprietary** — cannot be legally bundled. Options:
  - Use `nearest-color` + a community color dataset (e.g. pantone-colors npm, which is MIT licensed with ~2000 colors)
  - Use RAL or NCS as an open alternative
  - Label it "closest named color" rather than claiming official Pantone accuracy
- **Stack decision unresolved** — PRD says "Vanilla JS or lightweight framework" but project is configured for Next.js. Recommendation: use Next.js — routing, API routes for AI proxy, and build pipeline come for free.
- **AI API key exposure** — client-side AI calls expose the key. Must use a Next.js API route as proxy.

### Important
- **Single-pixel sampling is noisy** — need 5×5 or 10×10 pixel average at tap point
- **Color space drift** — mobile cameras output wide-gamut color; canvas getImageData may drift. Needs explicit color space handling or a disclaimer.
- **iOS Safari `facingMode` silent failure** — rear camera request can fall back to front silently. Need explicit error detection.
- **Camera permission denied** — no UX for this state in the PRD. Need a recovery screen with browser settings guidance.
- **Canvas security errors** — getImageData can throw in certain contexts. Needs try/catch.

### Nice to Have
- **ASE binary format** — use an existing small library rather than rolling custom encoder
- **localStorage schema versioning** — no migration path if data model changes in v2
- **localStorage limits** — ~5MB cap; fine for v1 but worth noting

---

## UX/Product Gaps

### Critical
- **Two-tap friction unexplained** — tap → modal → tap "Identify" → see specs. If there's no reason for the intermediate step, collapse it: show specs immediately on tap.
- **No loupe / reticle** — precise color sampling on a phone screen needs a magnification aid. Standard in every pro color tool.
- **Empty state (Saved Colors)** — completely undesigned. First impression of the saved view.
- **Single toggle affordance** — users won't discover the saved view exists without a hint.

### Important
- **Capture moment needs design** — what does the user see immediately on tap? Freeze frame? Crosshair ripple? Color fill? This is the magic moment of the product and it's unspecified.
- **Photo upload missing** — sampling from camera roll is a common use case (e.g. screenshot of a website, photo from last week). Not in v1 scope but worth flagging.
- **Palette management underspecified** — create, rename, reorder, delete palettes — all unspecified in the PRD.
- **Color naming emotional register** — Pantone codes ("18-1750 TCX") vs evocative names ("dusty rose") serve different users. Need to decide which register to optimize for.

---

## Business / Growth Gaps

### Critical
- **No sharing** — saved colors locked to localStorage can't be shared. Sharing is free distribution. A "share color card" feature (native share sheet or copy link) is the single highest-leverage addition.
- **No defined primary user** — "anyone curious about color" is not a segment. Designer is the recommended primary user.
- **localStorage = data loss risk** — users who clear their browser lose everything. No backup, no export of the full saved list.

### Important
- **No monetization hypothesis** — even if not built in v1, a hypothesis is needed (Pro tier? Pantone accuracy? Sync across devices?).
- **No growth mechanism** — how does user 1–100 find this? Where does it get shared? What makes someone show it to a friend?
- **Competition unaddressed** — the PRD doesn't articulate why a designer would switch from their current workflow.

---

## Open Decisions (must resolve before Phase 2)

| # | Question | Options |
|---|----------|---------|
| 1 | Primary user | Designer / Developer / Casual |
| 2 | Pantone strategy | MIT dataset / RAL / drop it |
| 3 | Framework | Next.js (recommended) / Vanilla JS |
| 4 | Two-tap vs instant | Keep "Identify" step / show specs immediately |
| 5 | Photo upload in v1 | Yes / No |
| 6 | Share feature in v1 | Yes (color card) / No |
| 7 | Product personality | Wit + character / Pure minimal utility |
