# Dictionary editorial overrides

These files are the small, reviewable product-policy layer on top of SCOWL.
They are deliberately kept separate from the generated dictionary.

- `allow.txt`: add a word that SCOWL does not currently emit. The optional
  second field is `common`, `standard`, or `extended` (default: `extended`).
- `deny.txt`: remove a word from every gameplay tier.
- `featured.txt`: treat an additional canonical word as a familiar hint or
  closing answer. The generated baseline is canonical SCOWL 60 vocabulary.
- `unfeatured.txt`: keep a word playable, but prevent the game from selecting
  it as a preferred hint or familiar closer. Start eligibility remains a
  separate SCOWL 35 flag and is not changed by these two files.

Use lowercase ASCII words of at least three letters, one entry per line.
Comments begin with `#`. Every non-obvious change should include a short reason
and a source or issue reference in an adjacent comment.

Runtime pack generation applies featured overrides directly, so editorial
changes can be tested without rebuilding SCOWL. The full SCOWL build applies
the same overrides idempotently.

The build fails on malformed entries. `pnpm validate:dictionary` also verifies
that denied words are absent, allowed words are present, metadata remains
aligned, runtime packs match the canonical dictionary, and the recorded hashes
are current.
