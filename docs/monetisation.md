# Monetisation

**Goal:** cover costs, not generate profit. The app should be free for students and self-sustaining for the maintainer.

**Infrastructure costs are low:** Supabase free tier handles thousands of active users; Pro tier ($25/month) kicks in only at scale. GitHub Pages is free indefinitely. One teacher licence sale per year covers the worst-case hosting bill.

Core constraints: no ads, no student subscriptions. Students study for free, always.

## Options

### Voluntary donations
A "buy me a coffee" link. Zero effort to add. Realistically covers hosting costs and not much more. Worth having, not worth counting on.

### Per-teacher licence
A flat annual fee (€50–150/year) for a teacher to create and manage their own decks. Students remain free. Simple to reason about, easy to sell, and a teacher can often expense this without approval.

**This is the recommended starting point.**

### Per-school licence
One contract with a school or IT department covering all teachers. More revenue per deal, but involves procurement and a longer sales cycle. A natural step up once per-teacher licencing is validated.

### Course provider licence
Same model as per-school, targeting language schools and tutoring platforms. They have budget and a clear ROI in student retention and results.

## Freemium split

Keep studying completely free. Charge only for the creation side:
- Teacher accounts
- Deck management UI
- Student progress analytics

Students never pay. Teachers and institutions pay for tools that make their job easier. Clean moral line, easy pitch.

## How to validate before building

Stripe supports one-time payment links that can be shared without any backend integration. Test willingness to pay at the per-teacher level before writing a single line of billing code.
