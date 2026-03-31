# Flash — MVP Product Spec

## Problem
Existing flashcard tools (Anki, Memrise) don't allow easy custom deck uploads and have poor visual design. The goal is a lightweight, browser-based flashcard app that is visually inviting enough to keep the user coming back.

## Data Source
- Google Sheets (public, "Anyone with the link can view")
- One Sheets file = all decks
- One tab = one deck
- Column structure:

| A | B | C |
|---|---|---|
| `front` | `back` | `notes` |
| Hello | Merhaba | common greeting |

Row 1 is the header row. Cards start at row 2. The `notes` column is optional.

## User Flow

1. User opens the app
2. Google Sheets URL is pre-filled (remembered from last visit) or user pastes a new one
3. App loads all tab names → user picks a deck
4. Study session begins:
   - Card front (EN) is shown
   - User clicks/taps to flip → back (TR) and optional notes are revealed
   - User self-rates: **Know it** or **Still learning**
   - Progress bar advances
5. After the last card: summary screen showing X / Y known

## MVP Scope

| Feature | In MVP |
|---|---|
| Load deck from public Google Sheet URL | Yes |
| Remember Sheet URL in browser (localStorage) | Yes |
| Tab picker = deck picker | Yes |
| Card flip with animation | Yes |
| Progress bar | Yes |
| Know it / Still learning buttons | Yes |
| End-of-session summary screen | Yes |
| Clean, warm, spacious visual design | Yes |
| EN → TR direction only | Yes |
| Reverse cards (TR → EN) | No — later |
| Spaced repetition | No — later |
| Progress persistence across sessions | No — later |
| Loop through "still learning" cards | No — later |
| Card IDs | No — later |
| Audio pronunciation | No — later |

## Design Direction
- Inspired by Duolingo: progress bar, warm colors, animations
- Fix Anki's main sin: poor use of screen space
- Mobile-first, but works on desktop too
