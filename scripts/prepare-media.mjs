import sharp from 'sharp';
import { mkdir, stat } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { extractContent } from './content.mjs';
await mkdir('gallery/media', { recursive: true });
const run = args => new Promise((resolve, reject) => {
  const child = spawn('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], { stdio: 'inherit' });
  child.on('error', reject); child.on('exit', code => code === 0 ? resolve() : reject(new Error(`ffmpeg exited ${code}`)));
});
for (const item of await extractContent()) {
  const image = `gallery/${item.image}`;
  const exists = await stat(image).catch(() => null);
  if (!exists) {
    if (item.video) await run(['-ss', item.id === 'creative-portfolio' ? '12' : '3', '-i', item.source, '-frames:v', '1', '-vf', 'scale=1024:-2', '-c:v', 'libwebp', '-quality', '85', image]);
    else await sharp(item.source).rotate().resize({width:1024,height:1024,fit:'inside',withoutEnlargement:true}).webp({quality:85}).toFile(image);
  }
  if (item.video && !await stat(`gallery/${item.video}`).catch(() => null)) {
    await run(['-i', item.source, '-vf', 'scale=1280:-2,fps=24', '-c:v', 'libx264', '-preset', 'fast', '-crf', '27', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '96k', '-movflags', '+faststart', `gallery/${item.video}`]);
  }
  console.log(`Prepared ${item.title}`);
}
