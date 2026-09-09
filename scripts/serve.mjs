import http from 'node:http';
import { stat, readFile, open } from 'node:fs/promises';
import path from 'node:path';
const root = path.resolve(process.env.SERVE_DIST ? 'dist' : '.');
const types = {'.html':'text/html','.js':'text/javascript','.json':'application/json','.css':'text/css','.png':'image/png','.PNG':'image/png','.webp':'image/webp','.mp4':'video/mp4','.mov':'video/quicktime'};
http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    let file = path.resolve(root, '.' + decodeURIComponent(url.pathname));
    if (!file.startsWith(root + path.sep) && file !== root) {res.writeHead(403).end();return;}
    if ((await stat(file)).isDirectory()) {
      if (!url.pathname.endsWith('/')) {res.writeHead(301,{Location:url.pathname+'/'+url.search}).end();return;}
      file = path.join(file, 'index.html');
    }
    const size = (await stat(file)).size;
    const headers = {'Content-Type':types[path.extname(file)] || 'application/octet-stream','Accept-Ranges':'bytes','Cache-Control':'no-cache'};
    const range = req.headers.range?.match(/^bytes=(\d+)-(\d*)$/);
    if (range) {
      const start = +range[1], end = Math.min(range[2] ? +range[2] : size - 1, size - 1);
      if (start >= size || end < start) {res.writeHead(416,{'Content-Range':`bytes */${size}`}).end();return;}
      res.writeHead(206, {...headers,'Content-Range':`bytes ${start}-${end}/${size}`,'Content-Length':end-start+1});
      const handle = await open(file); handle.createReadStream({start,end}).pipe(res);
    } else {res.writeHead(200,{...headers,'Content-Length':size});res.end(await readFile(file));}
  } catch {res.writeHead(404).end('Not found');}
}).listen(4174, () => console.log(`Portfolio preview: http://localhost:4174 (${root})`));
