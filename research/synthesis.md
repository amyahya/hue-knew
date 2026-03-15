# Research Synthesis — hue knew

## What We're Building
A mobile web app that lets you point your camera at anything, tap to capture a color, and instantly know exactly what it is — with full color specs, a name that means something, and the ability to save and export your palette.

## The Core Insight
Every designer, decorator, and curious person has had the moment: *"What color is that?"* — staring at a wall, a piece of clothing, a sunset. Existing tools are either too locked to an ecosystem (Adobe), too brand-specific (Sherwin-Williams), or require going through a full native app install. There's no fast, precise, beautiful mobile web tool that just answers the question.

## Who We're Building For
**Primary: Designers and developers** — people who need a color from the physical world *in their tools* immediately. They care about accuracy, all four formats (HEX, RGB, CMYK, Pantone), and fast export.

**Secondary (same feature set):** Developers who want physical → CSS instantly.

**Latent audience (don't optimize for v1, but don't exclude):** Home decorators, stylists, curious people — they'll use it if it's good, and they're the ones who share it.

## The Differentiators
1. **Speed** — specs on tap, no extra steps
2. **Precision** — pixel averaging, loupe/reticle, honest accuracy
3. **Personality** — "hue knew" has wit; the product should too. Color names that feel human, not clinical.
4. **Shareable** — a color card you can send someone. This is the growth mechanic.

## What the PRD Gets Right
- Full-screen camera as the hero
- Dark UI so colors pop
- iOS sheet modal pattern
- localStorage for v1 (no backend needed yet)
- Export formats that cover the right use cases
- No login friction

## What the PRD Needs to Resolve
1. **Pantone data source** — use MIT-licensed community dataset or rename to "closest named color"
2. **Collapse the two-tap flow** — show specs immediately on tap, no "Identify" button needed
3. **Add a loupe** — standard for precise color picking, essential for trust
4. **Design the capture moment** — the tap → color reveal is the magic moment; it needs animation/feedback
5. **Add sharing** — color card via native share sheet; this is how the product spreads
6. **Design empty states** — especially the first time someone opens Saved Colors
7. **Use Next.js** — already configured, API routes solve the AI key exposure problem

## v1 Scope Recommendation
Keep the PRD's four features but with these amendments:
- Collapse to instant specs on tap (no "Identify" button)
- Add loupe/reticle on tap
- Replace "Pantone" with MIT color dataset, clearly labeled
- Add share color card (native share sheet)
- Design the capture animation
- Clarify palette management interactions
