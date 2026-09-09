import { build } from 'esbuild';
import { mkdir, readFile, writeFile, cp, stat, readdir } from 'node:fs/promises';
import sharp from 'sharp';
import { extractContent } from './content.mjs';
const items = await extractContent();
const escape = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
for (const item of items) {
  const meta = await sharp(`gallery/${item.image}`).metadata();
  item.width = meta.width; item.height = meta.height;
  item.physicalHeight = item.physicalWidth * meta.height / meta.width;
  if (item.physicalHeight > 2.25) { item.physicalWidth *= 2.25 / item.physicalHeight; item.physicalHeight = 2.25; }
  if (item.video) await stat(`gallery/${item.video}`);
}
await mkdir('gallery/build', { recursive: true });
await writeFile('gallery/content.json', JSON.stringify(items, null, 2));
const catalogue = ['work', 'creative'].map(room => `<section class="collection" aria-labelledby="${room}-title"><div class="collection-heading"><span class="eyebrow">${room === 'work' ? '01' : '02'}</span><h2 id="${room}-title">${room === 'work' ? 'Selected Work' : 'Creative Vision'}</h2></div><div class="collection-grid">${items.filter(i => i.room === room).map(i => `<article id="work-${i.id}"><a class="catalogue-image" href="${escape(i.image)}" data-inspect="${escape(i.id)}" aria-label="Explore ${escape(i.title)}"><img src="${escape(i.image)}" alt="${escape(i.title)} — ${escape(i.category)}" width="${i.width}" height="${i.height}" loading="lazy"></a><p class="eyebrow">${escape(i.category)}</p><h3>${escape(i.title)}</h3><p>${escape(i.description)}</p>${i.video ? `<a href="${escape(i.video)}" data-film="${i.id}">Play film ↗</a>` : `<a href="${escape(i.image)}" data-inspect="${i.id}">View artwork ↗</a>`}</article>`).join('')}</div></section>`).join('');
const template = await readFile('gallery/template.html', 'utf8');
await writeFile('gallery/index.html', template.replace('<!-- CATALOGUE -->', catalogue));
await build({ entryPoints: ['gallery/src/experience.js'], bundle:true, splitting:true, format:'esm', outdir:'gallery/build', minify:true, target:'es2022', legalComments:'linked', metafile:true }).then(async result => {
  await writeFile('docs/bundle-report.json', JSON.stringify(result.metafile.outputs, null, 2));
});
await mkdir('dist/gallery', { recursive:true });
for (const name of ['index.html', 'favicon.png', 'hero.PNG', 'assets', 'new', 'gallery-entry.js']) await cp(name, `dist/${name}`, {recursive:true});
for (const name of ['index.html', 'gallery.css', 'bootstrap.js', 'content.json', 'media', 'build']) await cp(`gallery/${name}`, `dist/gallery/${name}`, {recursive:true});
const sizes = await Promise.all((await readdir('gallery/build')).map(async name => ({name, bytes:(await stat(`gallery/build/${name}`)).size})));
console.log(JSON.stringify({ works:items.length, bundles:sizes }, null, 2));
