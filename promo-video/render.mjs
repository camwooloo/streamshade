import { bundle } from '@remotion/bundler';
import { openBrowser, selectComposition, renderMedia, renderStill } from '@remotion/renderer';
import { mkdir, cp } from 'node:fs/promises';
import path from 'node:path';

const root=path.resolve('..');
const out=path.join(root,'Chrome Web Store Uploads');
await mkdir('public',{recursive:true});
for (const [source,dest] of [
 ['extension/icons/mark.svg','mark.svg'],
 ['extension/fonts/manrope-latin-600-normal.woff2','manrope.woff2'],
 ['extension/fonts/dm-mono-latin-400-normal.woff2','mono.woff2'],
 ['docs/images/popup.png','popup.png'],
 ['Chrome Web Store Uploads/Screenshot-03-Chat-and-Sidebar-1280x800.png','chat.png'],
 ['Chrome Web Store Uploads/Screenshot-05-Guided-Setup-1280x800.png','setup.png']
]) await cp(path.join(root,source),path.join('public',dest));
const serveUrl=await bundle({entryPoint:path.resolve('src/index.jsx'),publicDir:path.resolve('public')});
const browser=await openBrowser('chrome',{browserExecutable:process.env.STREAMSHADE_BROWSER || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
try {
 const composition=await selectComposition({serveUrl,id:'StreamshadePromo',puppeteerInstance:browser});
 const stillDir=path.join(root,'artifacts/video-preview');
 await mkdir(stillDir,{recursive:true});
 for(const frame of [70,240,440,630,840]) await renderStill({serveUrl,composition,puppeteerInstance:browser,frame,output:path.join(stillDir,`frame-${frame}.png`)});
 if(!process.argv.includes('--stills')) {
  let last=-1;
  await renderMedia({serveUrl,composition,puppeteerInstance:browser,codec:'h264',pixelFormat:'yuv420p',crf:18,concurrency:3,outputLocation:path.join(out,'Streamshade-Promo-Video-1920x1080.mp4'),onProgress:({progress})=>{const p=Math.floor(progress*10)*10;if(p>last){last=p;console.log(`Render ${p}%`);}}});
  console.log('Video saved: '+path.join(out,'Streamshade-Promo-Video-1920x1080.mp4'));
 }
} finally {await browser.close({silent:true});}
