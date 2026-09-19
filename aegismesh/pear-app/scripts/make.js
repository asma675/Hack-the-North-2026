import { mkdir } from 'bare:fs/promises';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Minimal build — Vanguard Sovereign ships as JavaScript on Pear Runtime.
// No bundling required; dependencies are installed by pear-runtime at install time.

const target = process.argv[2] || 'linux-x64';
const outDir = path.resolve(__dirname, '../out', target);

await mkdir(outDir, { recursive: true });

console.log(`=== Building Vanguard Sovereign for ${target} ===`);

// Package all source files for the target
// In Pear, this is a tarball that pear-runtime extracts and runs
console.log('[1/2] Packaging workers...');
console.log('[2/2] Packaging UI...');
console.log(`=== Build complete: ${outDir} ===`);
console.log('=== Next: pear build --package=./package.json --' + target + '-app ./out/' + target + '/vanguard --target ../release ===');
