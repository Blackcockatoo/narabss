const fs = require('fs');
const path = require('path');

const root = process.cwd();
const out = path.join(root, 'dist');

const SKIP = new Set([
  '.git',
  '.github',
  'node_modules',
  'dist',
  '.vercel',
  '.netlify'
]);

const SKIP_FILES = new Set([
  'package-lock.json'
]);

function copyDir(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    if (SKIP.has(entry.name) || SKIP_FILES.has(entry.name)) continue;
    const src = path.join(from, entry.name);
    const dest = path.join(to, entry.name);
    if (entry.isDirectory()) {
      copyDir(src, dest);
    } else if (entry.isFile()) {
      fs.copyFileSync(src, dest);
    }
  }
}

fs.rmSync(out, { recursive: true, force: true });
copyDir(root, out);
fs.writeFileSync(path.join(out, '.nojekyll'), '');
console.log('Nara B$S static site built to dist/');
