# Flash — Feature backlog

## Study

- **Motivation cards** — inject a fun/inspirational image card at the 1/3 and 2/3 point of a session; see [feature-motivation-cards.md](feature-motivation-cards.md) for design details

## Deck picker

- **Search decks** — filter the deck list by name or description
- **Group decks** — organise decks into collapsible groups in the index sheet

## Data / sheet structure

- **Admin view** — once the backend is live, a deck management UI so collaborators (e.g. a teacher) can build and edit decks without touching Google Sheets directly
- **Per-teacher decks** — allow teachers to own decks and enroll students in collections; see [feature-per-teacher-decks.md](feature-per-teacher-decks.md) for migration details

## Search

- **Cross-deck card search** — search for a word and find the matching card(s) across all decks; tap a result to jump straight into studying that card

## Performance

- **Lazy card loading** — defer loading cards until the Ready screen instead of on app boot, so the initial load feels faster

## Nice to have

- **Multiple collections** — allow switching between different sheets/collections; currently the app is tied to a single sheet at startup
- **App language** — allow the user to set the UI language
