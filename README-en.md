<div align="center">

![Word Loop](./og.png)

# Word Loop

Pick up the last two letters, keep the chain moving, and find your way back to the start.

[中文](./README.md) · [English](./README-en.md)  
[Play online](https://word-chain-loop.pages.dev/word-chain-game) · [How to play](#how-to-play) · [Run locally](#run-locally) · [Deploy to Cloudflare Pages](#deploy-to-cloudflare-pages)  
[![CI](https://github.com/lin02go/word-chain-loop/actions/workflows/ci.yml/badge.svg)](https://github.com/lin02go/word-chain-loop/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-2f6f55.svg)](./LICENSE)

I came up with this word chain game back in high school, when it was still played only on paper. The rules are simple, but as a loop nears closure, you can often get stuck on the final two letters. Later, with the help of AI tools, I turned it into a web game.

The project is built without any frontend frameworks. The game interface is written in vanilla HTML, CSS and JavaScript, while accounts, cloud saves and player submissions are handled by Cloudflare Pages Functions and D1.

## How to play

Each new word must begin with the final two letters of the previous word:

```
embrace → cede → deem
   ce       de      em
```

`embrace` begins with `em`, and the final word `deem` ends with `em` — that completes the loop.

A valid round follows a few rules:

- Words must be at least 3 letters long.
- A word cannot be used twice in the same round, not even in a different inflected form.
- Using a hint or revealing the answer will mark the round as practice, and it will not count toward your best record.

Casual mode picks a random starting word based on difficulty. Campaign mode features 100 fixed levels, each with a move limit and a three-star target.

## Workshop

Signed-in players can create their own levels. Enter a starting word, and the system will calculate the closed loop route and the minimum number of steps required. You must complete the level yourself in a test run before you can submit it for review.

The starting word does not need to be in the built-in game dictionary beforehand, as long as it passes the online English dictionary check. Upon submission, the server will re-verify every word in your test run route. Approved levels will appear in the community level list; rejected submissions will keep the reviewer's feedback.

The moderation dashboard is only accessible to admin accounts. For how to set up an admin account after first deployment, see [Cloudflare Account Setup](./CLOUDFLARE_AUTH_SETUP.md).

## What's included

- Casual mode and 100-level campaign mode
- Hints, undo, shortest path solution and personal best records
- Level creation, test runs, submissions, moderation and community levels
- 9 achievements, plus Chinese and English interface support
- Word phonetics, pronunciation, English definitions and Chinese translations
- Word issue feedback, PWA installation and offline caching of core resources
- Local guest save data, and cross-device sync via D1 for signed-in players

## Run locally

You will need Node.js 22 or newer, and pnpm 11.

```
git clone https://github.com/lin02go/word-chain-loop.git
cd word-chain-loop
pnpm install --frozen-lockfile
pnpm serve
```

Open [http://127.0.0.1:4173/word-chain-game](http://127.0.0.1:4173/word-chain-game) in your browser.

This static preview is sufficient for debugging the game, levels and PWA, but does not include login, cloud save or submission APIs.

### Run the full Cloudflare stack

First copy the local environment variable example file:

```
cp .dev.vars.example .dev.vars
```

On Windows PowerShell:

```
Copy-Item .dev.vars.example .dev.vars
```

Replace `PASSWORD_PEPPER` in `.dev.vars` with a random string of at least 32 characters. This file is ignored by Git and must not be committed.

Initialize the local D1 database, then start Pages:

```
pnpm exec wrangler d1 migrations apply DB --local
pnpm dev:cloudflare
```

The local database is completely separate from the production database. Account and submission endpoints are served under `/api/*`.

## Checks

Run this before submitting code:

```
pnpm check
```

It validates project files and README links, dictionary reports, offline cache, all 100 campaign levels, workshop catalog, submission rules, authentication logic, request body size limits, D1 types and Pages Functions compilation.

To validate only the campaign levels:

```
pnpm validate:campaign
```

To generate candidate starting words for new levels:

```
node tools/validate-campaign-levels.js --suggest --suggest-only
```

## Deploy to Cloudflare Pages

After forking this project, create your own D1 database:

```
pnpm exec wrangler d1 create word-chain-loop
```

Copy the returned database name and ID into [wrangler.jsonc](./wrangler.jsonc), then run the remote migration:

```
pnpm exec wrangler d1 migrations apply DB --remote
```

Set the password pepper as a Pages secret:

```
pnpm exec wrangler pages secret put PASSWORD_PEPPER --project-name word-chain-loop
```

Deploy the production build:

```
pnpm deploy:cloudflare
```

If Pages is connected directly to GitHub, use these build settings:

| Setting | Value |
| --- | --- |
| Build command | `pnpm build:cloudflare` |
| Output directory | `cloudflare-dist` |
| D1 binding | `DB` |

Database schema changes should only be made through [migrations](./migrations). Always export a D1 backup before running a new migration on production.

## File map

```
assets/                  Icons and images
functions/               Cloudflare Pages Functions
migrations/              D1 database migrations
tools/                   Build, validation and local preview scripts
campaign-levels.js       100 campaign level configurations
campaign.js              Campaign flow and progress
achievements.js          Achievements and statistics
workshop.js              Level creation, test runs, submissions and moderation
game.js                  Word graph and core game logic
service-worker.js        Offline cache and version updates
word-chain-game.html     Main game page
wrangler.jsonc           Pages and D1 configuration
```

## Data and dictionaries

Guest progress is stored in the browser's `localStorage`. Signed-in players can sync their achievements, campaign progress and records to D1. Passwords are never stored in plain text, and production deployments must have `PASSWORD_PEPPER` set.

English definitions and pronunciation are provided by Free Dictionary API and Datamuse. Chinese translations use MyMemory. The source, licensing and fallback behavior of the word list are documented in [DICTIONARY_SOURCES.md](./DICTIONARY_SOURCES.md) and [THIRD_PARTY_NOTICES](./THIRD_PARTY_NOTICES/SCOWL-Copyright.txt).

For how submitted word issues enter the dictionary maintenance process, see [WORD_FEEDBACK.md](./WORD_FEEDBACK.md).

## Contributing

Before submitting a pull request, please read [CONTRIBUTING.md](./CONTRIBUTING.md) and run `pnpm check`. Do not reorder existing campaign IDs — they are already saved in player save data.

For security issues, please use GitHub's private vulnerability reporting. Do not post account details, cookies or database information in public issues. See [SECURITY.md](./SECURITY.md) for details.

## License

The project code is released under the [MIT License](./LICENSE). Copyright © 2026 [lin02go](https://github.com/lin02go).

Third-party dictionary materials remain under their respective licenses and are not covered by this project's MIT license.
