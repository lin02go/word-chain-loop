import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';
import { sites } from '@openai/sites-vite-plugin';

const toolsDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(toolsDir, '..');
const outDir = path.join(root, 'dist');
const clientDir = path.join(outDir, 'client');

const staticFiles = [
  'index.html',
  'word-chain-game.html',
  'manifest.webmanifest',
  'service-worker.js',
  'campaign.css',
  'word-definitions.css',
  'achievements.css',
  'user-system.css',
  'start-screen.css',
  'motion.css',
  'pwa.css',
  'dictionary.js',
  'campaign-levels.js',
  'campaign.js',
  'start-screen.js',
  'achievements.js',
  'user-system.js',
  'word-definitions.js',
  'motion.js',
  'pwa.js',
  'assets/icons/icon-32.png',
  'assets/icons/icon-180.png',
  'assets/icons/icon-192.png',
  'assets/icons/icon-512.png',
  'assets/icons/icon-maskable-512.png'
];

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

const workerPath = path.join(outDir, 'server', 'index.js');
await fs.mkdir(path.dirname(workerPath), { recursive: true });
await fs.copyFile(path.join(root, 'worker.js'), workerPath);

const requiredOutputs = [
  'server/index.js',
  '.openai/hosting.json',
  ...staticFiles.map((relativePath) => `client/${relativePath}`)
];

for (const relativePath of requiredOutputs) {
  await fs.access(path.join(outDir, relativePath));
}

console.log(`Sites build ready with ${staticFiles.length} offline assets.`);
