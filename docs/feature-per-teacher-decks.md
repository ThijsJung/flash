# Per-teacher decks

Allow teachers to create and own their own decks, with students enrolled in specific collections. This is Option B in the backend content model.

## Current state (Option A)

Content is shared — one set of collections/decks visible to all users. Auth only exists to persist per-user `reviews` rows.

## Target state (Option B)

Decks have an owner. Students are enrolled in collections. The deck list is filtered by enrollment.

## Migration

Additive and non-breaking. No review history is affected.

```sql
-- Add owner to decks (nullable; NULL = global/public)
ALTER TABLE decks ADD COLUMN owner_id uuid REFERENCES auth.users;

-- Enrollment join table
CREATE TABLE enrollments (
  user_id       uuid REFERENCES auth.users,
  collection_id uuid REFERENCES collections,
  PRIMARY KEY (user_id, collection_id)
);
```

RLS policy on `decks`/`collections` is updated to filter by enrollment. Existing shared decks are left with `owner_id = NULL` (treated as public) or backfilled to a designated admin user — one SQL statement either way.

## What doesn't change

`cards`, `reviews`, and all spaced repetition logic are untouched.
