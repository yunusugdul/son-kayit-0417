import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { gzipSync } from 'node:zlib';

async function list(dir) {
  const children = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const child of children) {
    const full = join(dir, child.name);
    files.push(...(child.isDirectory() ? await list(full) : [full]));
  }
  return files;
}

const files = await Promise.all((await list('dist')).map(async (path) => {
  const buffer = await readFile(path);
  return { path: relative('dist', path), bytes: buffer.byteLength, gzipBytes: gzipSync(buffer).byteLength };
}));
const rawBytes = files.reduce((sum, file) => sum + file.bytes, 0);
const gzipBytes = files.reduce((sum, file) => sum + file.gzipBytes, 0);
const result = { note: 'Yerel gzip kestirimi; gerçek CDN transfer ölçümü değildir.', rawBytes, gzipBytes, files };
await mkdir('artifacts', { recursive: true });
await writeFile('artifacts/size-report.json', JSON.stringify(result, null, 2));
console.log(`dist: ${rawBytes} bayt ham / ${gzipBytes} bayt tahmini gzip`);
for (const file of files) console.log(`  ${file.path}: ${file.bytes} ham, ${file.gzipBytes} gzip`);
