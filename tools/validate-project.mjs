import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const required = [
  'README.md', 'WORD_FEEDBACK.md', 'LICENSE', 'CHANGELOG.md', 'CONTRIBUTING.md', 'SECURITY.md', '.editorconfig',
  '.gitattributes', '.gitignore', '.github/workflows/ci.yml', '.dev.vars.example',
  'wrangler.jsonc', 'worker-configuration.d.ts', 'migrations/0001_email_accounts.sql', 'migrations/0002_word_feedback.sql',
  'migrations/0003_custom_level_workshop.sql', 'migrations/0004_password_reset_tokens.sql',
  'workshop.js', 'workshop.css', 'reset-password.html', 'reset-password.css', 'reset-password.js',
  'functions/api/auth/reset-password.js',
  'functions/api/word-feedback.js', 'functions/_lib/feedback.js',
  'functions/api/custom-levels.js', 'functions/api/community-levels.js', 'functions/api/admin/custom-levels.js',
  'functions/_lib/custom-levels.js', 'functions/_generated/custom-level-catalog.js',
  'THIRD_PARTY_NOTICES/SCOWL-Copyright.txt',
  'DICTIONARY_SOURCES.md', 'dictionary.js', 'dictionary-core.js', 'dictionary-extended.js',
  'dictionary-report.json', 'dictionary-quality-report.json', 'dictionary-overrides/README.md', 'dictionary-overrides/allow.txt',
  'dictionary-overrides/deny.txt', 'dictionary-overrides/featured.txt', 'dictionary-overrides/unfeatured.txt',
];
const failures = required.filter((file) => !fs.existsSync(path.join(root, file)))
  .map((file) => `Missing project file: ${file}`);

const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
if (packageJson.version !== '2.1.1') failures.push('package.json must identify the secure password reset release as 2.1.1');
if (packageJson.license !== 'MIT') failures.push('package.json must declare the MIT license');
if (!String(packageJson.packageManager || '').startsWith('pnpm@')) failures.push('packageManager must pin pnpm');
if (!packageJson.scripts?.check?.includes('validate:project')) failures.push('check must include validate:project');

const readme = fs.readFileSync(path.join(root, 'README.md'), 'utf8');
for (const match of readme.matchAll(/\]\((\.\/[^)#]+)(?:#[^)]+)?\)/g)) {
  const relative = decodeURIComponent(match[1].slice(2));
  if (!fs.existsSync(path.join(root, relative))) failures.push(`README link is missing: ${relative}`);
}

const config = JSON.parse(fs.readFileSync(path.join(root, 'wrangler.jsonc'), 'utf8'));
if (!config.d1_databases?.some((binding) => binding.binding === 'DB')) failures.push('Wrangler config must expose the DB binding');
if (!config.compatibility_flags?.includes('nodejs_compat')) failures.push('Wrangler nodejs_compat flag is missing');

if (failures.length) {
  console.error('Project validation failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`Project validation passed: ${required.length} release files and README links verified.`);
