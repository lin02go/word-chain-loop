<div align="center">

![Word Loop](./og.png)

# Word Loop

Pick up the last two letters, keep the chain moving, and find your way back to the start.

[中文](./README.md) · [English](./README-en.md)

[Play online](https://word-chain-loop.pages.dev/word-chain-game) · [How to play](#how-to-play) · [Run locally](#run-locally) · [Deploy to Cloudflare Pages](#deploy-to-cloudflare-pages)

[![CI](https://github.com/lin02go/word-chain-loop/actions/workflows/ci.yml/badge.svg)](https://github.com/lin02go/word-chain-loop/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-2f6f55.svg)](./LICENSE)

</div>

Word Loop is a bilingual word-chain game built around two-letter connections. Watch the end of the current word, enter a new word that begins with those letters, and keep going until the chain closes. Word length can change along the way, and most rounds have more than one solution.

The front end uses plain HTML, CSS, and JavaScript with no runtime framework. Cloudflare Pages Functions and D1 provide optional accounts, cross-device progress sync, and player level submissions.

## How to play

Each new word must begin with the final two letters of the previous word:

~~~text
embrace → cede → deem
   ce       de      em
~~~

<code>embrace</code> begins with <code>em</code>, and <code>deem</code> ends with <code>em</code>, so the loop is complete.

A valid round follows a few rules:

- Words must contain at least three letters and exist in the game dictionary.
- A word cannot be reused in the same round. Reusing a different form of the same word is also rejected.
- Shorter solutions score better. Using a hint or revealing the answer marks the round as practice.

Casual mode generates games by difficulty. Campaign mode contains 100 fixed levels with move limits and three-star targets. Completing all of them unlocks the Hundred-Loop Chronicle achievement.

The Workshop lets signed-in players choose a starting word, complete a test loop, and submit the level for review. A starting word does not need to be pre-listed in the bundled game dictionary, but every word in the submitted route must pass an online English dictionary check. Approved submissions appear in the community collection.

## What is included

- 100 solver-verified campaign levels: 30 easy, 35 standard, and 35 hard.
- Casual and campaign modes, hints, undo, shortest-path answers, and personal records.
- A player Workshop with test runs, submissions, human moderation, and community levels.
- Nine achievements covering completed loops, unique starting pairs, optimal solutions, and full campaign completion.
- Chinese and English interfaces with pronunciation, phonetics, English definitions, and Chinese translations.
- An installable PWA whose core game assets remain available offline.
- Local guest progress and optional Cloudflare D1 sync for signed-in players.

## Run locally

You will need Node.js 22 or newer and pnpm 11.

~~~bash
git clone https://github.com/lin02go/word-chain-loop.git
cd word-chain-loop
pnpm install --frozen-lockfile
pnpm serve
~~~

Open <http://127.0.0.1:4173/word-chain-game>.

This static preview is enough for game, campaign, and PWA work. It does not start the account or cloud-save APIs.

### Run the full Cloudflare stack

Create a local environment file:

~~~bash
cp .dev.vars.example .dev.vars
~~~

On Windows PowerShell:

~~~powershell
Copy-Item .dev.vars.example .dev.vars
~~~

Replace <code>PASSWORD_PEPPER</code> in <code>.dev.vars</code> with a random value of at least 32 characters. The file is ignored by Git and must not be committed.

Initialize the local D1 database and start Pages:

~~~bash
pnpm exec wrangler d1 migrations apply DB --local
pnpm dev:cloudflare
~~~

The local database is separate from production. Account endpoints are served under <code>/api/*</code>.

## Checks

~~~bash
pnpm check
~~~

The full check covers project files, PWA caching, solvability of all 100 campaign levels, Workshop catalog and submission rules, legacy save migration, authentication, request-size limits, static routing, D1 types, and Pages Functions compilation.

Run only the campaign validator:

~~~bash
pnpm validate:campaign
~~~

Generate candidate starting words for future levels:

~~~bash
node tools/validate-campaign-levels.js --suggest --suggest-only
~~~

## Deploy to Cloudflare Pages

Forks should use their own D1 database:

~~~bash
pnpm exec wrangler d1 create word-chain-loop
~~~

Copy the database name and ID returned by Wrangler into [wrangler.jsonc](./wrangler.jsonc), then apply the production migration:

~~~bash
pnpm exec wrangler d1 migrations apply DB --remote
~~~

Add the password pepper as a Pages secret:

~~~bash
pnpm exec wrangler pages secret put PASSWORD_PEPPER --project-name word-chain-loop
~~~

Deploy the project:

~~~bash
pnpm deploy:cloudflare
~~~

For a Git-connected Cloudflare Pages project, use these settings:

| Setting | Value |
| --- | --- |
| Build command | <code>pnpm build:cloudflare</code> |
| Output directory | <code>cloudflare-dist</code> |
| D1 binding | <code>DB</code> |

Database changes belong in [migrations](./migrations). Back up production data before applying a new remote migration.

## Project layout

~~~text
assets/                  Icons and images
functions/               Cloudflare Pages Functions
migrations/              D1 database migrations
tools/                   Build, validation, and preview scripts
campaign-levels.js       Configuration for 100 campaign levels
campaign.js              Campaign flow and progress
achievements.js          Achievement definitions and tracking
workshop.js               Level creation, test runs, submission, and review UI
game.js                  Word graph and core game logic
service-worker.js        Offline cache and update handling
word-chain-game.html     Main game page
wrangler.jsonc           Pages and D1 configuration
~~~

## Data and third-party services

Guest progress stays in browser <code>localStorage</code>. Signed-in players can sync achievements, campaign progress, and records to D1. Passwords are never stored in plain text, and production deployments must define <code>PASSWORD_PEPPER</code>.

Definitions and pronunciation come from Free Dictionary API and Datamuse. Chinese translations use MyMemory. See [DICTIONARY_SOURCES.md](./DICTIONARY_SOURCES.md) and [THIRD_PARTY_NOTICES](./THIRD_PARTY_NOTICES/SCOWL-Copyright.txt) for dictionary provenance, licensing, and fallback behavior.

## Contributing

Read [CONTRIBUTING.md](./CONTRIBUTING.md) and run <code>pnpm check</code> before opening a pull request. Do not reorder existing campaign IDs: they are already stored in player save data.

Report security issues through GitHub private vulnerability reporting. Do not place account details, cookies, or database data in a public issue. See [SECURITY.md](./SECURITY.md) for details.

## License

Project code is available under the [MIT License](./LICENSE). Copyright © 2026 [lin02go](https://github.com/lin02go).

Third-party dictionary material is not covered by the project MIT license and remains subject to its own notices.
