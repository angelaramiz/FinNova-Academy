import { execSync } from 'child_process';
import { writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function run(cmd) {
  try { return execSync(cmd, { encoding: 'utf-8' }).trim(); }
  catch { return null; }
}

// Main repo (FinNova-Academy) - not the backend submodule
const commitCount = run('git rev-list --count HEAD') || '0';
const shortHash = run('git rev-parse --short HEAD') || 'unknown';
const branch = run('git rev-parse --abbrev-ref HEAD') || 'unknown';
const commitDate = run('git log -1 --format=%cI') || new Date().toISOString();
const version = `0.1.${commitCount}`;

const content = [
  '// Auto-generated - do not edit',
  `export const VERSION = '${version}';`,
  `export const BUILD_HASH = '${shortHash}';`,
  `export const BUILD_BRANCH = '${branch}';`,
  `export const BUILD_TIME = '${new Date().toISOString()}';`,
  `export const COMMIT_TIME = '${commitDate}';`,
  '',
].join('\n');

const outputPath = resolve(__dirname, '../src/version.ts');
writeFileSync(outputPath, content, 'utf-8');
console.log(`Frontend version: ${version} (${shortHash}, ${branch})`);
