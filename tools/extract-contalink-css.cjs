// Extrae el CSS de ContalinkShell a un módulo compartido (sin reescribir a mano).
const fs = require('fs');
const path = require('path');
const shellPath = path.join('alumnos', 'src', 'sims', 'ContalinkShell.tsx');
const src = fs.readFileSync(shellPath, 'utf8');
const m = src.match(/<style>\{`([\s\S]*?)`\}<\/style>/);
if (!m) { console.error('BLOQUE-STYLE-NO-ENCONTRADO'); process.exit(1); }
let css = m[1];
// Tema claro forzado: en móvil oscuro los inputs nativos se pintaban negros.
css = css.replace(
  '.clk-shell { background: #f8fafc;',
  '.clk-shell { background: #f8fafc; color-scheme: light;'
);
const out = `// ContalinkStyles — CSS compartido del shell claro Contalink.\n// Lo usa ContalinkShell y cualquier página que monte Sims sin el shell\n// (ej. PaginaPolizasPrueba). Fuente única: no duplicar a mano.\nexport const CONTALINK_CSS = \`${css}\`;\n\nexport function ContalinkStyles() {\n  return <style>{CONTALINK_CSS}</style>;\n}\n`;
fs.writeFileSync(path.join('alumnos', 'src', 'sims', 'ContalinkStyles.tsx'), out);
const replaced = src.replace(/<style>\{`[\s\S]*?`\}<\/style>/, '<ContalinkStyles />');
fs.writeFileSync(shellPath, replaced);
console.log('EXTRAIDO-OK css-chars=' + css.length);
