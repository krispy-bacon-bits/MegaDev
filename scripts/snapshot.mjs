// Copies kb pages from the static build into rendered/, as the desk sees them: the built HTML with its
// styles inlined and the app scripts taken out, so one file opens anywhere.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const pages = process.argv.slice(2);
if (!pages.length) pages.push('kb/incidents/4471-split');

for (const page of pages) {
  const html = readFileSync(join('build', `${page}.html`), 'utf8')
    .replace(/<link\b[^>]*rel="modulepreload"[^>]*>\s*/g, '')
    .replace(/<link\b[^>]*rel="stylesheet"[^>]*\bdisabled\b[^>]*>\s*/g, '')
    .replace(/<script\b[\s\S]*?<\/script>\s*/g, '');
  const out = join('rendered', page, 'index.html');
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, html);
  console.log(`rendered ${page} → ${out}`);
}
