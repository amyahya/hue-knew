# Session Summary — 15 Mar 2026, 23:14

## What We Did
Phase 1 (Plan) for **hue knew** — a mobile web app to identify colors from a live camera feed.

No code was written. This was a full planning and research session.

---

## Artefacts Produced

| File | Contents |
|------|----------|
| `research/competitors.md` | Landscape analysis — Adobe Color, Coolors, ColorSnap, native apps, and what they all miss |
| `research/users.md` | 4 user types identified; designer/developer chosen as primary user |
| `research/gaps.md` | Full gap analysis from PRD review + advisory team (Hustler, Hipster, Hacker) |
| `research/synthesis.md` | Key insights, what the original PRD gets right/wrong, v1 scope recommendation |
| `plan.md` | Final product plan — locked and approved |

---

## The Product (from plan.md)

**hue knew** — point your camera at anything, tap a color, instantly know what it is.

**Primary user:** Designers and developers
**Stack:** Next.js · localStorage · Canvas API · getUserMedia

### 5 Features in v1
1. **Camera Color Capture** — full-screen live camera, tap anywhere, 5×5 pixel average sampling, loupe/reticle for precision
2. **Color Identification** — instant specs on tap (no "Identify" button), bottom sheet with swatch + name + HEX/RGB/CMYK, copy to clipboard. Optional "Get richer name" via Claude AI.
3. **Save Colors & Palettes** — localStorage, single saved list + optional named palettes, create/rename/reorder/delete
4. **Palette Export** — PNG, CSS, JSON, ASE
5. **Share** — Web Share API color card (swatch + name + HEX); this is the growth mechanic

---

## Decisions Made

| Decision | Outcome |
|----------|---------|
| Framework | Next.js (already configured, API routes solve AI key exposure) |
| Color naming dataset | `color-name-list` npm — MIT licensed, 30,000+ evocative names |
| Pantone | Dropped — data is proprietary. Use color-name-list instead, labeled honestly |
| Two-tap flow | Removed "Identify" button — specs show instantly on tap |
| AI for richer names | Claude, via Next.js API route proxy (key never client-side) |
| Photo upload | Backlog — build after live camera ships |
| Pixel sampling | 5×5 average, not single pixel (too noisy) |
| Loupe/reticle | In scope — required for precision on mobile |
| Sharing | In scope — Web Share API + canvas image fallback |

---

## What's Working
- Phase 1 is complete and approved
- `plan.md` is the source of truth — no open questions remaining
- GitHub repo ready: `https://github.com/amyahya/hue-knew`
- Vercel already connected to that repo

---

## What's Not Working / Blockers
- **Session ended before scaffolding** — the Next.js project has NOT been created yet
- The old folder was named `cc-hue-knew - R2` which caused npm naming errors. User renamed it to `cc-hue-knew` at `/Users/yahya/Documents/cc-hue-knew`
- The terminal session was stuck on the old path — user needs to relaunch Claude Code from the new directory

---

## Next Steps (Phase 2: Build)

### Immediate — first thing in next session
1. Scaffold Next.js project inside `/Users/yahya/Documents/cc-hue-knew`:
   ```bash
   npx create-next-app@latest . --typescript --tailwind --app --no-git --yes
   ```
   *(Use node at `/Users/yahya/.nvm/versions/node/v20.20.1/bin/node`)*

2. Initialize git and connect to existing repo:
   ```bash
   git init
   git remote add origin https://github.com/amyahya/hue-knew
   git add .
   git commit -m "initial scaffold: fresh Next.js project"
   git push --force origin main
   ```
   *(Force push confirmed by user — wipes old failed PWA)*

3. Verify Vercel picks up the deploy

### After scaffold is live
- Build Feature 1: Camera Color Capture (full-screen camera, tap, canvas pixel sampling, loupe)
- Then Feature 2: Color Identification (bottom sheet, color-name-list, copy to clipboard)
- Then Feature 3: Save Colors
- Then Feature 4: Export
- Then Feature 5: Share

---

## Key Warnings for Next Session
- **Do not use `getUserMedia` without HTTPS** — local dev on `localhost` is fine, but any other HTTP will silently fail
- **iOS Safari `facingMode`** — add explicit error handling for silent fallback to front camera
- **AI API key** — must go through a Next.js API route, never call Claude directly from client
- **ASE export** — use an existing open-source library, don't hand-roll the binary format
