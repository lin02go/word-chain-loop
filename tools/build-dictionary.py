#!/usr/bin/env python3
"""Build the browser dictionary for Word Chain Loop from SCOWL v2.

The game accepts only lowercase ASCII English words, so this script deliberately
filters out entries containing spaces, punctuation, apostrophes, digits, or
diacritics after asking SCOWL to de-accent its word list.  It includes every
SCOWL word through size 80 (SCOWL's "a valid word" tier) for the five main
English spelling variants. It preserves SCOWL's original capitalization long
enough to exclude proper names and acronyms, filters flagged offensive terms,
and emits a compact tier marker alongside each word.

Usage:
    python tools/build-dictionary.py --scowl-dir <path-to-scowl-2>

SCOWL source and license: https://github.com/engramtech/scowl
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import shutil
import sqlite3
import subprocess
import sys
from datetime import date
from pathlib import Path


ASCII_WORD = re.compile(r"^[a-z]{3,}$")
ROOT = Path(__file__).resolve().parents[1]
OVERRIDES = ROOT / "dictionary-overrides"
SOURCE_REPOSITORY = "https://github.com/engramtech/scowl"


def read_scowl(scowl_dir: Path, size: int) -> set[str]:
    command = [
        sys.executable,
        str(scowl_dir / "scowl"),
        "word-list",
        str(scowl_dir / "scowl.db"),
        "--size",
        str(size),
        "--spellings",
        "A,B,Z,C,D",
        "--variant-level",
        "4",
        "--wo-poses",
        "abbr,s",
        "--categories",
        "",
        "--deaccent",
        "--nosuggest",
    ]
    result = subprocess.run(command, check=True, capture_output=True)
    text = result.stdout.decode("utf-8", errors="ignore")
    # Match before lowercasing. Capitalized SCOWL entries are normally proper
    # names or acronyms and are unsuitable for standard word-game play.
    return {word for word in text.splitlines() if ASCII_WORD.fullmatch(word)}


def read_lemma_data(scowl_dir: Path) -> tuple[set[str], dict[str, str]]:
    """Return canonical lemmas and a preferred word-to-lemma mapping."""
    lemmas: set[str] = set()
    lemma_map: dict[str, str] = {}
    with sqlite3.connect(scowl_dir / "scowl.db") as connection:
        rows = connection.execute(
            "select word.word, lemma.word "
            "from words as word join words as lemma on word.lemma_id = lemma.word_id"
        )
        for word, lemma in rows:
            if not ASCII_WORD.fullmatch(word) or not ASCII_WORD.fullmatch(lemma):
                continue
            if word == lemma:
                lemmas.add(word)
                lemma_map.setdefault(word, word)
            elif word not in lemma_map or lemma_map[word] == word:
                lemma_map[word] = lemma
    return lemmas, lemma_map


def base36_fixed(value: int, width: int = 4) -> str:
    digits = "0123456789abcdefghijklmnopqrstuvwxyz"
    encoded = "0" if value == 0 else ""
    while value:
        value, remainder = divmod(value, 36)
        encoded = digits[remainder] + encoded
    if len(encoded) > width:
        raise ValueError("dictionary index no longer fits the fixed-width lemma encoding")
    return encoded.rjust(width, "0")


def read_override_words(filename: str) -> set[str]:
    path = OVERRIDES / filename
    if not path.exists():
        return set()
    words: set[str] = set()
    for line_number, raw_line in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
        word = raw_line.split("#", 1)[0].strip()
        if not word:
            continue
        if not ASCII_WORD.fullmatch(word):
            raise ValueError(f"{path}:{line_number}: expected one lowercase ASCII word")
        words.add(word)
    return words


def read_allowed_words() -> dict[str, int]:
    path = OVERRIDES / "allow.txt"
    if not path.exists():
        return {}
    tier_names = {"common": 0, "standard": 1, "extended": 2}
    allowed: dict[str, int] = {}
    for line_number, raw_line in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
        fields = raw_line.split("#", 1)[0].split()
        if not fields:
            continue
        if len(fields) not in (1, 2) or not ASCII_WORD.fullmatch(fields[0]):
            raise ValueError(f"{path}:{line_number}: expected 'word [common|standard|extended]'")
        tier_name = fields[1] if len(fields) == 2 else "extended"
        if tier_name not in tier_names:
            raise ValueError(f"{path}:{line_number}: unknown tier {tier_name!r}")
        allowed[fields[0]] = tier_names[tier_name]
    return allowed


def source_revision(scowl_dir: Path, explicit_revision: str | None) -> str:
    if explicit_revision:
        return explicit_revision
    result = subprocess.run(
        ["git", "-C", str(scowl_dir), "rev-parse", "HEAD"],
        capture_output=True, text=True, check=False,
    )
    revision = result.stdout.strip()
    if result.returncode != 0 or not re.fullmatch(r"[0-9a-fA-F]{40}", revision):
        raise RuntimeError(
            "Unable to determine the SCOWL Git commit. Use a Git checkout or pass "
            "--source-revision with the immutable release/commit identifier."
        )
    return revision.lower()


def write_output(
    words: list[str], tiers: str, forms: str, starts: str,
    featured: str, lemma_ids: str, tier_counts: dict[str, int],
    revision: str, override_counts: dict[str, int]
) -> None:
    word_json = json.dumps(words, ensure_ascii=False, separators=(",", ","))
    meta_json = json.dumps(
        {"tierNames": ["common", "standard", "extended"], "counts": tier_counts},
        ensure_ascii=False,
        separators=(",", ":"),
    )
    output = ROOT / "dictionary.js"
    output.write_text(
        "// Generated by tools/build-dictionary.py; do not edit by hand.\n"
        "// Source: SCOWL v2, sizes 60/70/80, all main English spellings.\n"
        f"// Source revision: {revision}.\n"
        "// License and update procedure: DICTIONARY_SOURCES.md\n"
        f"// Words: {len(words)}.\n"
        f"var DICTIONARY={word_json};\n"
        f"var WORD_TIERS={json.dumps(tiers)};\n"
        f"var WORD_FORMS={json.dumps(forms)};\n"
        f"var WORD_STARTS={json.dumps(starts)};\n"
        f"var WORD_FEATURED={json.dumps(featured)};\n"
        f"var WORD_LEMMA_IDS={json.dumps(lemma_ids)};\n"
        f"var DICTIONARY_META={meta_json};\n",
        encoding="utf-8",
        newline="\n",
    )
    dictionary_sha256 = hashlib.sha256(output.read_bytes()).hexdigest()
    report = {
        "source": "SCOWL v2",
        "source_repository": SOURCE_REPOSITORY,
        "source_revision": revision,
        "provenance_status": "locked",
        "scowl_size": 80,
        "spellings": ["American", "British -ise", "British -ize", "Canadian", "Australian"],
        "build_parameters": {
            "sizes": {"common": 60, "standard": 70, "extended": 80, "start_baseline": 35},
            "spelling_codes": ["A", "B", "Z", "C", "D"],
            "variant_level": 4,
            "excluded_parts_of_speech": ["abbr", "s"],
            "categories": "",
            "deaccent": True,
            "ascii_lowercase_only": True,
            "minimum_length": 3,
        },
        "override_counts": override_counts,
        "word_count": len(words),
        "tier_counts": tier_counts,
        "lemma_count": sum(mark == "0" for mark in forms),
        "start_vocabulary_count": sum(mark == "1" for mark in starts),
        "featured_vocabulary_count": sum(mark == "1" for mark in featured),
        "minimum_length": min(map(len, words)),
        "maximum_length": max(map(len, words)),
        "generated_on": date.today().isoformat(),
        "dictionary_sha256": dictionary_sha256,
    }
    (ROOT / "dictionary-report.json").write_text(
        json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="\n"
    )


def copy_license_notice(scowl_dir: Path) -> None:
    """Ship SCOWL's upstream notice alongside every derived word list."""
    notices = ROOT / "THIRD_PARTY_NOTICES"
    notices.mkdir(exist_ok=True)
    shutil.copyfile(scowl_dir / "Copyright", notices / "SCOWL-Copyright.txt")


def main() -> None:
    parser = argparse.ArgumentParser(description="Build Word Chain Loop's SCOWL-based dictionary.")
    parser.add_argument("--scowl-dir", type=Path, required=True, help="Path to an unpacked SCOWL v2 checkout")
    parser.add_argument(
        "--source-revision",
        help="Immutable SCOWL commit/release identifier; auto-detected for Git checkouts",
    )
    args = parser.parse_args()
    scowl_dir = args.scowl_dir.resolve()
    if not (scowl_dir / "scowl").is_file() or not (scowl_dir / "scowl.db").is_file():
        parser.error("--scowl-dir must contain both scowl and scowl.db")
    revision = source_revision(scowl_dir, args.source_revision)
    start_core = read_scowl(scowl_dir, 35)
    common = read_scowl(scowl_dir, 60)
    standard = read_scowl(scowl_dir, 70)
    extended = read_scowl(scowl_dir, 80)
    lemmas, lemma_map = read_lemma_data(scowl_dir)
    allowed = read_allowed_words()
    denied = read_override_words("deny.txt")
    featured_additions = read_override_words("featured.txt")
    featured_removals = read_override_words("unfeatured.txt")
    for word, tier in allowed.items():
        extended.add(word)
        lemmas.add(word)
        lemma_map[word] = word
        if tier <= 1:
            standard.add(word)
        if tier == 0:
            common.add(word)
    for collection in (start_core, common, standard, extended, lemmas):
        collection.difference_update(denied)
    # A denied lemma can still be referenced by an allowed inflection. Make
    # that surviving word its own family root so every encoded lemma index
    # always points at an entry that is actually shipped.
    for word in extended:
        if lemma_map.get(word, word) not in extended:
            lemma_map[word] = word
            lemmas.add(word)
    start_words = start_core - denied
    featured_words = (common | featured_additions) - featured_removals - denied
    if not extended:
        raise RuntimeError("SCOWL extraction returned no usable words")
    words = sorted(extended)
    tiers = "".join("0" if word in common else "1" if word in standard else "2" for word in words)
    forms = "".join("0" if lemma_map.get(word, word) == word else "1" for word in words)
    starts = "".join(
        "1" if word in start_words and lemma_map.get(word, word) == word else "0"
        for word in words
    )
    featured = "".join(
        "1" if word in featured_words and lemma_map.get(word, word) == word else "0"
        for word in words
    )
    word_indexes = {word: index for index, word in enumerate(words)}
    lemma_ids = "".join(
        base36_fixed(word_indexes.get(lemma_map.get(word, word), index))
        for index, word in enumerate(words)
    )
    tier_counts = {
        "common": sum(mark == "0" for mark in tiers),
        "standard": sum(mark == "1" for mark in tiers),
        "extended": sum(mark == "2" for mark in tiers),
    }
    override_counts = {
        "allowed": len(allowed),
        "denied": len(denied),
        "featured_additions": len(featured_additions),
        "featured_removals": len(featured_removals),
    }
    write_output(words, tiers, forms, starts, featured, lemma_ids, tier_counts, revision, override_counts)
    copy_license_notice(scowl_dir)
    subprocess.run(["node", str(ROOT / "tools" / "build-dictionary-packs.mjs")], check=True)
    print(f"Wrote {len(words):,} filtered and tiered words to {ROOT / 'dictionary.js'}")


if __name__ == "__main__":
    main()
