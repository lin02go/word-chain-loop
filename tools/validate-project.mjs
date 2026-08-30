import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const required = [
  'README.md', 'LICENSE', 'CHANGELOG.md', 'CONTRIBUTING.md', 'SECURITY.md', '.editorconfig',
  '.gitattributes', '.gitignore', '.github/workflows/ci.yml', '.dev.vars.example',
  'wrangler.jsonc', 'worker-configuration.d.ts', 'migrations/0001_email_accounts.sql',
  'THIRD_PARTY_NOTICES/SCOWL-Copyright.txt',
];
const failures = required.filter((file) => !fs.existsSync(path.join(root, file)))
  .map((file) => `Missing project file: ${file}`);

const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
if (packageJson.version !== '2.0.0') failures.push('package.json must identify the 100-level release as 2.0.0');
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
if (!config.observability?.enabled) failures.push('Wrangler observability must be enabled');
if (!config.compatibility_flags?.includes('nodejs_compat')) failures.push('Wrangler nodejs_compat flag is missing');

if (failures.length) {
  console.error('Project validation failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`Project validation passed: ${required.length} release files and README links verified.`);
