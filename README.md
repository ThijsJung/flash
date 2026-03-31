# Flash

A lightweight, browser-based flashcard app that reads decks from a public Google Sheet. No account, no install, no backend — just open and study.

**Live app:** https://thijsjung.github.io/flash/

## Features

- Decks loaded directly from a Google Sheet — update the sheet, changes appear instantly
- Card flip animation with free back-and-forth flipping
- Session size picker (10 / 20 / All) and order toggle (Shuffled / In order)
- Progress bar so you always know where you are in a session
- End-of-session summary
- Shareable links via `?sheet=SHEET_ID` query param

## Setting up your Google Sheet

1. Create a Google Sheet and set it to **"Anyone with the link can view"**
2. Make the **first tab an index** with these columns:

   | deck | description |
   |------|-------------|
   | Verbs | Common Turkish verbs |
   | Food & Drink | Eating and drinking |

3. Add one tab per deck, named exactly as listed in the index. Each deck tab needs:

   | front | back | notes |
   |-------|------|-------|
   | Hello | Merhaba | common greeting |

   `notes` is optional.

4. Paste your sheet URL into the app and start studying.

## Shareable link

To share a pre-loaded link, append the sheet ID to the app URL:

```
https://thijsjung.github.io/flash/?sheet=YOUR_SHEET_ID
```

The sheet ID is the long alphanumeric string in your Google Sheets URL:
`https://docs.google.com/spreadsheets/d/`**`YOUR_SHEET_ID`**`/edit`

## Local development

```bash
npm start
```

Opens the app at `http://localhost:8000`. A local server is required (opening `index.html` directly as a file will fail due to CORS).

## Project structure

```
flash/
  frontend/       # Static HTML/CSS/JS — the entire app
  docs/           # PM spec and architecture decision records
  .github/
    workflows/
      deploy.yml  # Deploys frontend/ to GitHub Pages on push to main
```

## Tech

Vanilla HTML, CSS, and JavaScript — no framework, no build step, no dependencies. Data is fetched from Google Sheets via the `gviz/tq` endpoint (no API key required).
