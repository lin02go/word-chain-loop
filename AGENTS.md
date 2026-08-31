# Project Instructions

## Synchronized release workflow

- Treat GitHub and Cloudflare as two required parts of the same production release.
- When the user asks to publish, deploy, release, or put project updates online, update both targets unless the user explicitly excludes one of them:
  - GitHub repository: `https://github.com/lin02go/word-chain-loop`
  - Cloudflare Pages project: `word-chain-loop`, production branch `main`
  - Production site: `https://word-chain-loop.pages.dev/word-chain-game`
  - Cloudflare D1 database: `lin02go`
- Use this release order:
  1. Review the pending diff and run `npm run check`.
  2. Commit all relevant project changes and push the resulting commit to `origin/main`.
  3. Check remote D1 migrations and apply any pending migrations before deploying code that depends on them.
  4. Run `npm run deploy:cloudflare` to deploy the same working tree to the Cloudflare Pages production branch.
  5. Verify that GitHub contains the release commit, Cloudflare lists the new deployment as `Production` on `main`, the production URL returns successfully, and D1 has no pending migrations.
- Do not report a release as complete when only GitHub or only Cloudflare has been updated. If either side fails, clearly identify which side is out of sync and continue with safe retries when possible.
- In the final release report, include the Git commit ID, Cloudflare deployment URL or ID, production URL, migration status, and verification results.
- Do not commit secrets, Wrangler credentials, `.dev.vars`, or local Cloudflare state.
