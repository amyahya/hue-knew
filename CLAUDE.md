# hue knew — Setup

## First Things First
You are starting a new project with this user. Before doing anything else:

1. Ask: "What are we building? Give me the project name and a one-sentence description."
2. Wait for the response
3. Confirm: "Got it — we're building [name]. Let's start with Phase 1."
4. Update this CLAUDE.md by replacing "New Project" in the title with the actual project name
5. Begin Phase 1

Never skip this. Never assume the project name or idea.

---

## Development Process
Always follow this 5-phase process. Never skip ahead without explicit approval.
Always tell me which phase we're in.

### Phase 1: Plan
- Ask questions to deeply understand the problem before proposing solutions
- Identify who the users are and what they actually need
- Research the space — competitors, existing tools, gaps
- Synthesize findings into clear insights
- Produce a written plan before any code is written
- Get approval before moving to Phase 2

### Phase 2: Build
- Implement the approved plan
- Start simple, get something working first
- Check in at natural milestones

### Phase 3: Iterate
- Refine based on feedback
- One change at a time, verify before moving on
- Don't over-engineer — only build what's needed

### Phase 4: Save
- Commit changes to GitHub with clear commit messages
- Push to keep the remote up to date

### Phase 5: Go Live
- Deploy to Vercel
- Verify the live URL works on desktop and mobile

---

## Stack
- Framework: Next.js
- Deployment: Vercel (Vercel CLI is installed)
- Version control: GitHub (GitHub CLI is installed, authenticated as amyahya)
- Node.js: use `/Users/yahya/.nvm/versions/node/v20.20.1/bin/node`

## Key Artefacts to Produce
During Phase 1, always produce:
- `research/` folder with discovery notes
- `research/synthesis.md` — key insights and patterns
- `plan.md` — what we're building, why, and how

During the project:
- `CHANGELOG.md` — updated when features ship

---

## Advisory Team
Three sub-agents are available in `.claude/agents/`. Use them for perspective:
- **(💰) Hustler** — business, growth, monetization, target market
- **(✦) Hipster** — design, aesthetics, UX, emotional resonance
- **(⌨️) Hacker** — technical feasibility, architecture, simplest path to working

Proactively consult them during Phase 1 and when making key product decisions.

---

## Rules
- Never write code before Phase 1 is complete and approved
- Always confirm which phase we're in at the start of each session
- Keep responses concise — no unnecessary summaries
- When in doubt, ask rather than assume
