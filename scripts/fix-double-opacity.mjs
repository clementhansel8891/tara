/**
 * fix-double-opacity.mjs
 * Fixes malformed double-opacity Tailwind classes like:
 *   bg-secondary/5/50  ->  bg-secondary/5
 *   bg-primary/50/10   ->  bg-primary/50
 *   bg-success/10/50   ->  bg-success/10
 * Keeps the first opacity value, strips the invalid second one.
 */

import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join, relative } from 'path';

// Matches: bg-foo/N/M  text-foo/N/M  border-foo/N/M  etc.
// Captures the valid part (prefix/N) and discards the trailing /M
const DOUBLE_OPACITY = /\b((?:bg|text|border|ring|from|to|via|shadow|fill|stroke)-[a-zA-Z0-9-]+\/\d+)\/\d+/g;

function walkDir(dir) {
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory() && !['node_modules', '.git', 'dist', '.kiro', 'build', 'coverage'].includes(entry.name)) {
      files.push(...walkDir(full));
    } else if (entry.isFile() && /\.(tsx|ts|jsx|js|css)$/.test(entry.name)) {
      files.push(full);
    }
  }
  return files;
}

const root = process.cwd();
let totalFixed = 0;
const changedFiles = [];

for (const file of walkDir(join(root, 'src'))) {
  const original = readFileSync(file, 'utf8');
  const fixed = original.replace(DOUBLE_OPACITY, '$1');
  if (fixed !== original) {
    const matchCount = (original.match(DOUBLE_OPACITY) ?? []).length;
    writeFileSync(file, fixed, 'utf8');
    totalFixed += matchCount;
    changedFiles.push(relative(root, file));
  }
}

console.log(`Fixed ${totalFixed} malformed double-opacity classes in ${changedFiles.length} files:`);
changedFiles.forEach(f => console.log('  ' + f));
if (changedFiles.length === 0) console.log('  (none found — already clean)');
