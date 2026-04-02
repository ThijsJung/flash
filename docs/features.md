# Flash — Feature backlog

## Bugs

- **Keyboard shortcuts broken on desktop** — arrow key shortcuts during study are not working

## Study

- **Reverse cards** — study back to front instead of front to back
- **Repeat deck (slice)** — repeat the exact same collection of cards
- **Session size slider** — replace the fixed size buttons (10 / 20 / All) with a slider for picking any number of cards

## Deck picker

- **Search decks** — filter the deck list by name or description
- **Group decks** — organise decks into collapsible groups in the index sheet

## Data / sheet structure

- **Flat card structure** — consolidate all cards into a single `cards` tab with columns `front · back · notes · deck_id`, alongside the existing `index` tab (`id · title · description`). Enables cross-deck search for free and maps cleanly to a future database schema. Replaces the current one-tab-per-deck model.
- **Admin view** — once the backend is live, a deck management UI so collaborators (e.g. a teacher) can build and edit decks without touching Google Sheets directly

## Search

- **Cross-deck card search** — find a card across all decks by typing a word; natural result of the flat card structure above

## Nice to have

- **App language** — allow the user to set the UI language
