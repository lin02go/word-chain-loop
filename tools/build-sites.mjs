import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';
import { sites } from '@openai/sites-vite-plugin';

const toolsDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(toolsDir, '..');
const outDir = path.join(root, 'dist');
const clientDir = path.join(outDir, 'client');

const serviceWorkerSource = await fs.readFile(path.join(root, 'service-worker.js'), 'utf8');
const shellMatch = serviceWorkerSource.match(/var SHELL_FILES = \[([\s\S]*?)\];/);
if (!shellMatch) throw new Error('Unable to read the service worker asset list.');
const shellFiles = Array.from(shellMatch[1].matchAll(/'([^']+)'/g), (match) =>
  match[1].replace(/^\.\//, '')
).filter(Boolean);
const staticFiles = ['_routes.json', 'service-worker.js', ...new Set(shellFiles)];

await build({
  root,
  plugins: [sites()],
  publicDir: false,
  build: {
    outDir,
    emptyOutDir: true
  }
});

for (const relativePath of staticFiles) {
  const source = path.join(root, relativePath);
  const destination = path.join(clientDir, relativePath);
  await fs.mkdir(path.dirname(destination), { recursive: true });
  await fs.copyFile(source, destination);
}

await build({
  root,
  configFile: false,
  publicDir: false,
  build: {
    outDir: path.join(outDir, 'server'),
    emptyOutDir: true,
    ssr: path.join(root, 'worker.js'),
    rollupOptions: { output: { entryFileNames: 'index.js', format: 'es' } },
  },
});

const migrationDir = path.join(outDir, '.openai', 'drizzle');
await fs.mkdir(migrationDir, { recursive: true });
for (const migration of await fs.readdir(path.join(root, 'migrations'))) {
  if (migration.endsWith('.sql')) {
    await fs.copyFile(path.join(root, 'migrations', migration), path.join(migrationDir, migration));
  }
}

const requiredOutputs = [
  'server/index.js',
  '.openai/hosting.json',
  '.openai/drizzle/0001_email_accounts.sql',
  ...staticFiles.map((relativePath) => `client/${relativePath}`)
];

for (const relativePath of requiredOutputs) {
  await fs.access(path.join(outDir, relativePath));
}

console.log(`Sites build ready with ${staticFiles.length} offline assets.`);
