// Package the approved website exactly as supplied, without rebuilding the gallery.
import { cp, mkdir, rm, stat } from 'node:fs/promises';

await rm('dist', { recursive: true, force: true });
await mkdir('dist/gallery', { recursive: true });
const options = { recursive: true, filter: source => !source.endsWith('.DS_Store') };
for (const name of ['index.html', 'favicon.png', 'hero.PNG', 'assets', 'new', 'gallery-entry.js']) {
  await cp(name, `dist/${name}`, options);
}
for (const name of ['index.html', 'gallery.css', 'bootstrap.js', 'content.json', 'curation.json', 'media', 'build', 'src']) {
  await cp(`gallery/${name}`, `dist/gallery/${name}`, options);
}
for (const name of ['CNAME', '.nojekyll']) {
  if (await stat(name).catch(() => null)) await cp(name, `dist/${name}`);
}
console.log('Packaged the approved portfolio and gallery in dist/.');
