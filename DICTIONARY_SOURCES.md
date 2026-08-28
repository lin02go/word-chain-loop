# Dictionary data

The shipped word list is generated from [SCOWL v2](https://github.com/engramtech/scowl),
the Spell Checker Oriented Word Lists. It includes American, British, Canadian,
and Australian spellings and emits three cumulative gameplay levels: SCOWL 60
(`common`), 70 (`standard`), and 80 (`extended`). The compact `WORD_TIERS`
string is aligned by index with `DICTIONARY`. `WORD_FORMS` marks canonical
lemmas (`0`) versus derived/inflected forms (`1`), allowing normal word forms
in play while reserving starting-word status for canonical lemmas. `WORD_STARTS`
further restricts openings to canonical lemmas in the stricter SCOWL 35 set.
`WORD_LEMMA_IDS` is a fixed-width base-36 index back into `DICTIONARY`; the
runtime uses it to prevent reuse of another inflection from the same family.

The build excludes abbreviations, contractions, punctuation, digits,
non-ASCII forms, capitalized entries (normally proper names or acronyms), and
SCOWL entries flagged at the default vulgar/offensive levels. Filtering takes
place before lowercasing so a proper name cannot become an ordinary-looking
game word simply by losing its capital letter.

SCOWL's combined work is available under an MIT-like, BSD-compatible license.
The applicable upstream notices are shipped as
`THIRD_PARTY_NOTICES/SCOWL-Copyright.txt`; keep that file when distributing an
updated dictionary.

## Updating the list

1. Download or clone the SCOWL v2 branch.
2. Run `python tools/build-dictionary.py --scowl-dir <path-to-scowl-2>`.
3. Deploy both the generated `dictionary.js` and `dictionary-report.json`.

The game constructs a separate graph for each difficulty from the generated
tiers and checks reachability against words already used in the current round.

## Product policy

The file is an acceptance dictionary, not a promise that every entry is common.
Only quality-controlled common/standard entries can become starting words;
extended entries are reserved for harder play. Player-submitted words should
enter a reviewed supplemental list with a recorded source and approval date.
