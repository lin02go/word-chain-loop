import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const toolsDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(toolsDir, '..');
const outDir = path.join(root, 'cloudflare-dist');
const serviceWorkerSource = await fs.readFile(path.join(root, 'service-worker.js'), 'utf8');
const shellMatch = serviceWorkerSource.match(/var SHELL_FILES = \[([\s\S]*?)\];/);
if (!shellMatch) throw new Error('Unable to read the service worker asset list.');

const shellFiles = Array.from(shellMatch[1].matchAll(/'([^']+)'/g), (match) =>
  match[1].replace(/^\.\//, '')
).filter(Boolean);
const staticFiles = ['_routes.json', 'service-worker.js', ...new Set(shellFiles)];

await fs.rm(outDir, { recursive: true, force: true });
for (const relativePath of staticFiles) {
  const source = path.join(root, relativePath);
  const destination = path.join(outDir, relativePath);
  await fs.mkdir(path.dirname(destination), { recursive: true });
  await fs.copyFile(source, destination);
}

console.log(`Cloudflare Pages build ready with ${staticFiles.length} assets.`);
