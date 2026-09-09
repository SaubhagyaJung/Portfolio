import { readFile } from 'node:fs/promises';
import { parseHTML } from 'linkedom';
import path from 'node:path';
export const slug = value => value.toLowerCase().replace(/\.[^.]+$/, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
export async function extractContent() {
  const { document } = parseHTML(await readFile('index.html', 'utf8'));
  const projects = [...document.querySelectorAll('.accordion-slice')].map((el, i) => {
    const title = el.querySelector('.slice-name').textContent.trim();
    const source = el.querySelector('video').getAttribute('src');
    const id = slug(title);
    return { id, title, category: el.querySelector('.slice-type').textContent.trim(), year: null,
      description: 'Curated web projects crafted with precision and care.', descriptionSource: 'Selected Work section introduction',
      source, image: `media/${id}.webp`, video: `media/${id}.mp4`, room: 'work',
      position: i<4 ? [-11.12, 1.9, 7.5 - i * 5] : [-7.98, 1.9, i===4 ? -4.8 : 4.8], rotation: i<4 ? Math.PI / 2 : -Math.PI / 2, physicalWidth: i<4 ? 3.2 : 2.3, exhibited:i<6, displayType: 'film' };
  });
  const unique = new Map();
  for (const el of document.querySelectorAll('.creative-card')) {
    const img = el.querySelector('img');
    if (!img) continue;
    const source = img.getAttribute('src');
    if (unique.has(source)) {
      const previous = unique.get(source);
      if (!previous.category.includes(img.alt)) previous.category += ` / ${img.alt}`;
      continue;
    }
    const rawTitle = el.querySelector('.creative-name')?.textContent.trim();
    const label = path.basename(source).replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
    const title = rawTitle || label.replace(/\b\w/g, c => c.toUpperCase());
    unique.set(source, {id: slug(path.basename(source)), title, category: img.alt, year: null,
      titleSource: rawTitle ? 'portfolio' : 'filename', source,
      description: 'Curated artistic ventures crafted with precision and conceptual depth.',
      descriptionSource: 'Creative Vision section introduction', image: `media/${slug(path.basename(source))}.webp`, room: 'creative', displayType: 'print' });
  }
  const art = [...unique.values()].map((item, i) => ({ ...item,
    position: i < 6 ? [11.12, 1.85, 9 - i * 3.6] : i<10 ? [-5.4 + (i - 6) * 3.6, 1.85, -11.12] : [7.98,1.85,i===10 ? -4.8 : 4.8],
    rotation: i < 6 ? -Math.PI / 2 : i<10 ? 0 : Math.PI/2, physicalWidth: 1.65, exhibited:i<12 }));
  const curation=JSON.parse(await readFile('gallery/curation.json','utf8'));
  return [...projects, ...art].map(item=>{
    const overrides=curation.items[item.id] || {};
    for(const key of ['title','description','category','year','projectUrl'])if(overrides[key])item[key]=overrides[key];
    if(overrides.title)item.titleSource='curated';
    if(overrides.description)item.descriptionSource='curated';
    if(item.projectUrl && !/^https?:\/\//.test(item.projectUrl))throw new Error(`Invalid project URL for ${item.id}`);
    return item;
  });
}
