import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';
import { sites } from '@openai/sites-vite-plugin';

const toolsDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(toolsDir, '..');
const outDir = path.join(root, 'dist');

const staticFiles = [
  'index.html',
  'word-chain-game.html',
  'manifest.webmanifest',
  'service-worker.js',
  'campaign.css',
  'word-definitions.css',
  'achievements.css',
  'start-screen.css',
  'motion.css',
  'pwa.css',
  'dictionary.js',
  'campaign-levels.js',
  'campaign.js',
  'start-screen.js',
  'achievements.js',
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
  const destination = path.join(outDir, relativePath);
  await fs.mkdir(path.dirname(destination), { recursive: true });
  await fs.copyFile(source, destination);
}

const workerPath = path.join(outDir, 'server', 'index.js');
await fs.mkdir(path.dirname(workerPath), { recursive: true });
await fs.writeFile(workerPath, `export default {
  async fetch(request, env) {
    if (env && env.ASSETS && typeof env.ASSETS.fetch === 'function') {
      return env.ASSETS.fetch(request);
    }
    return new Response('Word Loop assets are unavailable.', {
      status: 500,
      headers: { 'content-type': 'text/plain; charset=utf-8' }
    });
  }
};
`, 'utf8');

const requiredOutputs = [
  'server/index.js',
  '.openai/hosting.json',
  ...staticFiles
];

for (const relativePath of requiredOutputs) {
  await fs.access(path.join(outDir, relativePath));
}

console.log(`Sites build ready with ${staticFiles.length} offline assets.`);
