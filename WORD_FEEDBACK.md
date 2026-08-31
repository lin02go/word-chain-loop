# Word feedback review workflow

Player reports are evidence for editorial review, not automatic dictionary
changes. Only signed-in players can submit reports. The API normalizes the
word, validates fixed reason/source fields, suppresses an equivalent open
report from the same player, and accepts at most ten reports per player per
hour.

Reports are stored in the D1 `word_feedback` table created by
`migrations/0002_word_feedback.sql`. Review the queue in creation order with:

```sql
SELECT id, word, reason, note, source, difficulty, game_mode, created_at
FROM word_feedback
WHERE status = 'new'
ORDER BY created_at, id;
```

## Editorial decision

Verify the word against an appropriate reproducible source before changing
the game dictionary. Then map an accepted report to the smallest suitable
override:

- `not_word`: add the word to `dictionary-overrides/deny.txt` only when it
  should be removed from every gameplay tier.
- `too_obscure`: normally add the word to
  `dictionary-overrides/unfeatured.txt`; this keeps it playable but removes it
  from preferred hints and familiar closing answers.
- `missing_word`: add the word and its tier to
  `dictionary-overrides/allow.txt` when the source policy permits it.
- `wrong_definition`: investigate the external definition providers. This
  usually does not change the SCOWL-derived gameplay dictionary.
- `other`: classify it explicitly before choosing an override.

Place the report ID, decision reason, and source reference in an adjacent
comment. This makes the change traceable without copying player account data
into Git.

Rebuild the runtime packs and verify the quality report:

```bash
node tools/build-dictionary-packs.mjs
pnpm validate:dictionary
pnpm audit:dictionary
pnpm validate:quality
```

After the reviewed change is committed, update the report status to
`accepted`. Use `rejected` when no change is warranted, and reserve
`reviewing` for reports still being investigated. Never mark a report accepted
before the matching override or provider fix is reproducible in the
repository.

```sql
UPDATE word_feedback
SET status = 'accepted', updated_at = CURRENT_TIMESTAMP
WHERE id = ? AND status IN ('new', 'reviewing');
```
