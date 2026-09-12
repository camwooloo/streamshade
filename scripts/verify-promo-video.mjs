import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

const video = await readFile('Chrome Web Store Uploads/Streamshade-Promo-Video-1920x1080.mp4');
const server = createServer((req,res) => {
  if (req.url !== '/video.mp4') return res.writeHead(200,{'Content-Type':'text/html'}).end('<body style="margin:0;background:#101617"><video src="/video.mp4" muted preload="auto" style="width:960px;height:540px"></video></body>');
  const match = /^bytes=(\d+)-(\d*)$/.exec(req.headers.range || '');
  const start = match ? Number(match[1]) : 0;
  const end = match?.[2] ? Math.min(Number(match[2]),video.length-1) : video.length-1;
  res.writeHead(match?206:200,{'Content-Type':'video/mp4','Accept-Ranges':'bytes','Content-Length':end-start+1,...(match?{'Content-Range':`bytes ${start}-${end}/${video.length}`}:{})});
  res.end(video.subarray(start,end+1));
});
await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
const browser=await chromium.launch({headless:true,executablePath:process.env.STREAMSHADE_BROWSER || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
try {
  const page=await browser.newPage({viewport:{width:960,height:540}});
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  await page.waitForFunction(()=>document.querySelector('video').readyState>=2);
  const metadata=await page.locator('video').evaluate(v=>({width:v.videoWidth,height:v.videoHeight,duration:v.duration,error:v.error?.message || null}));
  assert.equal(metadata.width,1920);assert.equal(metadata.height,1080);assert.ok(Math.abs(metadata.duration-30)<0.1);assert.equal(metadata.error,null);
  for(const seconds of [2.3,8,14.6,21,28]) {
    await page.locator('video').evaluate((v,t)=>new Promise((resolve,reject)=>{v.addEventListener('seeked',resolve,{once:true});v.addEventListener('error',reject,{once:true});v.currentTime=t;}),seconds);
    assert.equal(await page.locator('video').evaluate(v=>v.error),null);
    await page.screenshot({path:`artifacts/video-preview/decoded-${seconds}.png`});
  }
  await writeFile('Chrome Web Store Uploads/video-validation.json',JSON.stringify({...metadata,bytes:video.length,decodedSceneSamples:[2.3,8,14.6,21,28]},null,2));
  console.log(JSON.stringify(metadata));
} finally {await browser.close();await new Promise(resolve=>server.close(resolve));}
