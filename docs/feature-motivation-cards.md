# Motivation cards

Show an inspiring/fun image card at the 1/3 and 2/3 point of a study session, breaking up the flow before the final push.

## Behaviour

- Two motivation cards are injected into `state.deck` at roughly the 1/3 and 2/3 position when a session starts.
- Each shows a full-bleed image with a "Keep going!" (or similar) button to continue — no flip, no answer buttons.
- Images are picked **at session start** from the collection's image pool, so they are fixed for that session. This also allows pre-loading them in the background while the user is on the Ready screen.
- Images are drawn randomly from the pool. The pool is shuffled before picking so the same image is never shown twice in a row (and ideally not twice in the same session).

## Data — `collection` tab

A new tab in the Google Sheet called `collection` stores shared metadata for the collection. Initial columns:

| column | description |
|---|---|
| `image_url` | Public URL of the motivation image (hosted on S3) |

Future columns (for collection overview feature): `title`, `description`, `maintainer`, etc.

Images are **shared across all decks** in the collection.

## S3 hosting notes

- Bucket must be public-read.
- CORS must allow requests from the app's domain to avoid blocked images.
