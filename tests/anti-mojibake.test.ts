import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Firmas de mojibake (UTF-8 mal interpretado como CP1252/Latin-1 y re-guardado):
//   â†  → flechas (→, ←, ↑, ↓)
//   ðŸ  → emojis de 4 bytes (📊, 🔀, etc.)
//   Â·  → punto medio (·)
//   âš  → símbolos (⚡, ⚙)
//   â€  → comillas/prima (", ', –, —)
//   Ã„  → vocales con tilde doble-encoded (á, é, í, ó, ú)
//   âž  → ➤
//   âœ  → ✅ / ❌
//   â¬  → ⬆ / ⬇
//   â–  → ─
//   ï¸  → variation selector FE0F
const MOJIBAKE_PATTERNS = [
  /â†/, /âš/, /â‡/, /â¬/, /âœ/, /âž/, /â–/, /â—/, /â€/, /â€™/, /â€œ/, /â€š/,
  /ðŸ/, /ðŸ–/, /Â·/, /Ã‚/, /Ã¢/, /Ã±/, /Ã­/, /Ã³/, /Ã©/, /Ã¡/, /Ãº/, /Ã¤/, /Ã¼/,
  /ï¸/, /Å¸/, /Ã°/, /âˆ'/,
];

const SOURCE_DIRS = [
  path.resolve(__dirname, '../alumnos/src'),
  path.resolve(__dirname, '../staff/src'),
];

function listSourceFiles(dir: string): string[] {
  const out: string[] = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules') continue;
      out.push(...listSourceFiles(full));
    } else if (/\.(ts|tsx|js|jsx|json|html|css|md)$/.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

describe('anti-mojibake — fuentes del simulador', () => {
  const files = SOURCE_DIRS.flatMap(listSourceFiles);

  it('escanea todos los archivos fuente buscando secuencias de mojibake', () => {
    expect(files.length).toBeGreaterThan(0);
    const offenders: { file: string; line: number; match: string }[] = [];

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      const lines = content.split('\n');
      lines.forEach((line, idx) => {
        for (const pattern of MOJIBAKE_PATTERNS) {
          if (pattern.test(line)) {
            offenders.push({ file, line: idx + 1, match: pattern.source });
            break;
          }
        }
      });
    }

    expect(offenders).toEqual([]);
  });
});
