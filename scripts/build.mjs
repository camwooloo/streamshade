import './adapt-vaft.mjs';
import { cp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { DEFAULTS } from '../extension/shared.js';
const root = path.resolve('dist/streamshade');
const workspace = path.resolve('.');
if (root !== path.join(workspace, 'dist', 'streamshade') || !root.startsWith(workspace + path.sep)) throw new Error('Invalid generated output path');
await rm(root, { recursive: true, force: true });
await mkdir(root, { recursive: true });
await writeFile('extension/config.js', `// Generated from shared.js\nglobalThis.StreamshadeDefaults = Object.freeze(${JSON.stringify(DEFAULTS)});\n`);
await mkdir('extension/fonts', { recursive: true });
for (const [family, filename] of [
  ['manrope', 'manrope-latin-400-normal.woff2'],
  ['manrope', 'manrope-latin-600-normal.woff2'],
  ['dm-mono', 'dm-mono-latin-400-normal.woff2']
]) await cp(`node_modules/@fontsource/${family}/files/${filename}`, `extension/fonts/${filename}`);
for (const size of [16, 32, 48, 128]) await sharp('extension/icons/mark.svg').resize(size, size).png().toFile(`extension/icons/icon${size}.png`);
await cp('extension', root, { recursive: true });
await cp('reference/LICENSE', `${root}/LICENSE-VAFT.txt`);
await cp('README.md', `${root}/README.md`);
await cp('INSTALL.md', `${root}/INSTALL.md`);
await cp('LICENSE', `${root}/LICENSE`);
await cp('VALIDATION.md', `${root}/VALIDATION.md`);
await cp('THIRD_PARTY_NOTICES.md', `${root}/THIRD_PARTY_NOTICES.md`);
for (const family of ['manrope', 'dm-mono']) await cp(`node_modules/@fontsource/${family}/LICENSE`, `${root}/fonts/LICENSE-${family}.txt`);
const manifest = JSON.parse(await readFile(`${root}/manifest.json`, 'utf8'));
console.log(`Built ${manifest.name} ${manifest.version}\nLoad unpacked: ${root}`);
