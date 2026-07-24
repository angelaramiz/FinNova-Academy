import { execSync } from 'child_process';
import { writeFileSync, readdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');

function run(cmd) {
  try { return execSync(cmd, { cwd: rootDir, encoding: 'utf-8' }).trim(); }
  catch { return null; }
}

const commitCount = run('git rev-list --count HEAD') || '0';
const shortHash = run('git rev-parse --short HEAD') || 'unknown';
const branch = run('git rev-parse --abbrev-ref HEAD') || 'unknown';
const commitDate = run('git log -1 --format=%cI') || new Date().toISOString();
const version = `0.1.${commitCount}`;

// Generar version.json en la raíz (usado por frontend y backend)
const data = { version, build: shortHash, branch, time: new Date().toISOString(), commitDate };
writeFileSync(resolve(rootDir, 'version.json'), JSON.stringify(data, null, 2) + '\n', 'utf-8');

// Generar version.ts para frontend (alumnos)
const tsContent = [
  '// Auto-generated - do not edit',
  `export const VERSION = '${version}';`,
  `export const BUILD_HASH = '${shortHash}';`,
  `export const BUILD_BRANCH = '${branch}';`,
  `export const BUILD_TIME = '${new Date().toISOString()}';`,
  `export const COMMIT_TIME = '${commitDate}';`,
  '',
].join('\n');
writeFileSync(resolve(rootDir, 'alumnos', 'src', 'version.ts'), tsContent, 'utf-8');

// Generar version.ts para backend (dentro del submodule)
writeFileSync(resolve(rootDir, 'backend', 'src', 'version.ts'), tsContent, 'utf-8');

console.log(`Version ${version} (${shortHash}) → version.json, alumnos, backend`);
