const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const failures = [];

function fail(message) {
  failures.push(message);
}

function read(relativePath) {
  const absolutePath = path.join(root, relativePath);
  if (!fs.existsSync(absolutePath)) {
    fail(`Missing file: ${relativePath}`);
    return '';
  }
  return fs.readFileSync(absolutePath, 'utf8');
}

function pngSize(relativePath) {
  const absolutePath = path.join(root, relativePath);
  if (!fs.existsSync(absolutePath)) {
    fail(`Missing icon: ${relativePath}`);
    return null;
  }
  const buffer = fs.readFileSync(absolutePath);
  if (buffer.length < 24 || buffer.toString('ascii', 1, 4) !== 'PNG') {
    fail(`Invalid PNG: ${relativePath}`);
    return null;
  }
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

const manifestText = read('manifest.webmanifest');
let manifest = null;
try {
  manifest = JSON.parse(manifestText);
} catch (error) {
  fail(`Manifest JSON is invalid: ${error.message}`);
}

if (manifest) {
  ['name', 'short_name', 'start_url', 'scope', 'display', 'theme_color', 'background_color'].forEach((key) => {
    if (!manifest[key]) fail(`Manifest is missing ${key}`);
  });
  if (manifest.display !== 'standalone') fail('Manifest display must be standalone');
  if (!Array.isArray(manifest.icons) || manifest.icons.length < 2) {
    fail('Manifest needs at least 192px and 512px icons');
  } else {
    manifest.icons.forEach((icon) => {
      const size = pngSize(icon.src);
      const declared = String(icon.sizes || '').split('x').map(Number);
      if (size && (size.width !== declared[0] || size.height !== declared[1])) {
        fail(`Icon dimensions do not match manifest: ${icon.src}`);
      }
    });
  }
  const startFile = manifest.start_url.replace(/^\.\//, '').split(/[?#]/)[0];
  if (!fs.existsSync(path.join(root, startFile))) fail(`Manifest start_url is missing: ${manifest.start_url}`);
}

const workerText = read('service-worker.js');
const pwaText = read('pwa.js');
const gameText = read('game.js');
try { new vm.Script(workerText, { filename: 'service-worker.js' }); } catch (error) { fail(error.message); }
try { new vm.Script(pwaText, { filename: 'pwa.js' }); } catch (error) { fail(error.message); }
try { new vm.Script(gameText, { filename: 'game.js' }); } catch (error) { fail(error.message); }

const shellMatch = workerText.match(/var SHELL_FILES = \[([\s\S]*?)\];/);
if (!shellMatch) {
  fail('Unable to find SHELL_FILES in service-worker.js');
} else {
  const shellFiles = Array.from(shellMatch[1].matchAll(/'([^']+)'/g), (match) => match[1]);
  shellFiles.forEach((item) => {
    if (item === './') return;
    const relativePath = item.replace(/^\.\//, '').split(/[?#]/)[0];
    if (!fs.existsSync(path.join(root, relativePath))) fail(`Service Worker asset is missing: ${item}`);
  });
}

const html = read('word-chain-game.html');
if (!/rel="manifest" href="manifest\.webmanifest"/.test(html)) fail('Game page does not link the manifest');
if (!/navigator\.serviceWorker\.register\('\.\/service-worker\.js'/.test(pwaText)) fail('PWA script does not register the Service Worker');
if (/\son[a-z]+\s*=/i.test(html)) fail('Game page contains inline event handlers');
if (!/<script src="dictionary\.js\?[^">]+" defer><\/script>/.test(html)) fail('Dictionary script must load with defer');

const inlineScripts = Array.from(html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi), (match) => match[1]);
if (inlineScripts.length) fail('Game page should not contain inline scripts');
inlineScripts.forEach((script, index) => {
  try { new vm.Script(script, { filename: `word-chain-game.inline-${index + 1}.js` }); }
  catch (error) { fail(error.message); }
});

if (shellMatch) {
  const cached = new Set(Array.from(shellMatch[1].matchAll(/'([^']+)'/g), (match) => match[1].replace(/^\.\//, '')));
  const pageAssets = Array.from(html.matchAll(/<(?:script|link)\b[^>]*(?:src|href)="([^"?#]+)(?:[?#][^"]*)?"/gi), (match) => match[1]);
  pageAssets.forEach((asset) => {
    if (!/^https?:/.test(asset) && !cached.has(asset)) fail(`Page asset is missing from the offline shell: ${asset}`);
  });
}

if (failures.length) {
  console.error('PWA validation failed:');
  failures.forEach((message) => console.error(`- ${message}`));
  process.exit(1);
}

console.log(`PWA validation passed: ${manifest.icons.length} manifest icons, external game assets cached.`);
