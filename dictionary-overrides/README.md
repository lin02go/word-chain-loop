# Dictionary editorial overrides

These files are the small, reviewable product-policy layer on top of SCOWL.
They are deliberately kept separate from the generated dictionary.

- `allow.txt`: add a word that SCOWL does not currently emit. The optional
  second field is `common`, `standard`, or `extended` (default: `extended`).
- `deny.txt`: remove a word from every gameplay tier.
- `featured.txt`: allow a canonical word to be selected as a start/quality
  word in addition to the SCOWL 35 baseline.
- `unfeatured.txt`: keep a word playable, but prevent the game from selecting
  it as a start or treating it as a familiar closer.

Use lowercase ASCII words of at least three letters, one entry per line.
Comments begin with `#`. Every non-obvious change should include a short reason
and a source or issue reference in an adjacent comment.

The build fails on malformed entries. `pnpm validate:dictionary` also verifies
that denied words are absent, allowed words are present, metadata remains
aligned, runtime packs match the canonical dictionary, and the recorded hashes
are current.
