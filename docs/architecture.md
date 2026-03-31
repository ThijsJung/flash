# Flash — Architecture Decisions

## ADR-001: Vanilla HTML/CSS/JS, no framework, no bundler

**Decision:** Plain HTML, CSS, and JS. No React, Vue, Svelte, or build tooling.

**Reasoning:** The MVP is a small, single-screen app with no complex state management. A framework adds dependency surface area and build complexity without buying anything at this scale.

**Revisit when:** the app grows to multiple routes, shared state becomes hard to manage, or a backend integration makes a framework's ecosystem valuable.

---

## ADR-002: Hand-rolled CSS, no utility framework

**Decision:** One `style.css` file, written by hand.

**Reasoning:** Visual design is a first-class concern (Anki's poor UX is the reason this app exists). Hand-rolled CSS gives full control with zero build step. Tailwind via CDN would add a network dependency and restrict design flexibility.

**Revisit when:** the stylesheet grows unwieldy or a design system is needed across multiple surfaces.

---

## ADR-003: Google Sheets as data source via `gviz/tq`

**Decision:** Fetch data from public Google Sheets using the unauthenticated `gviz/tq` endpoint.

**Reasoning:** No API key, no backend, no OAuth flow. The sheet owner controls the data and can update decks without touching the app. One Sheets file, one tab per deck.

**Expected URL shape:**
```
https://docs.google.com/spreadsheets/d/{ID}/gviz/tq?tqx=out:json&sheet={tabName}
```

**Revisit when:** Google deprecates the endpoint, or decks need to be private (requires OAuth).

---

## ADR-004: Monorepo

**Decision:** Frontend and future backend live in one repository.

**Reasoning:** Features that span frontend and backend (e.g. spaced repetition) can be delivered in a single PR. Separate repos add coordination overhead with no benefit for a small project.

**Structure:**
```
flash/
  frontend/    ← current MVP
  backend/     ← placeholder, not yet implemented
  docs/
```

---

## ADR-005: GitHub Pages + GitHub Actions for hosting and CI/CD

**Decision:** Static frontend hosted on GitHub Pages, deployed via GitHub Actions from the `frontend/` folder on push to `main`.

**Reasoning:** Zero infrastructure to manage, free for public repos, deploy in ~30 seconds. Fits a no-build-step static site perfectly.

**Revisit when:** a backend is introduced — at that point CloudFront + S3 (AWS) or Vercel/Netlify become more natural fits.

---

## ADR-006: Backend deferred — AWS vs. Supabase TBD

**Decision:** No backend for MVP. Backend technology choice is open.

**Candidates:**
- **AWS** (Lambda + API Gateway + DynamoDB/RDS + Cognito) — familiar ecosystem, full control
- **Supabase** — auth + database + REST API with near-zero infra overhead

**Triggers for decision:** implementing spaced repetition (requires persistence) or user accounts (requires auth).

---

## ADR-007: No tests for MVP

**Decision:** No test suite in the MVP.

**Reasoning:** The app is small, visual, and has no backend logic to unit test. The cost of setting up a test framework outweighs the benefit at this stage.

**Revisit when:** the app is stable enough that regressions become a real concern. Playwright E2E is the preferred path — no bundler required, tests the real browser experience.
