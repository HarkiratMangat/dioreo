// Frames of the badge lab, set by the Web Animations API rather than by pausing — this page is static HTML with no
// re-render, so `currentTime` is exact and the wall-clock offset that corrupted three earlier sweeps cannot happen.
const http=require('http'),fs=require('fs'),path=require('path');
const pup=require(path.resolve(__dirname,'../../../node_modules/puppeteer-core'));
const ROOT=__dirname, SEL=process.argv[2]||'.v-surge .r', SLOTS=(process.argv[3]||'63,64,65,66,67,68,71,75').split(',').map(Number), TAG=process.argv[4]||'lab';
const T={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml'};
const s=http.createServer((q,r)=>{const p=path.join(ROOT,decodeURIComponent(q.url.split('?')[0]).replace(/^\/+/,''));
  fs.readFile(p,(e,b)=>{if(e){r.writeHead(404);return r.end('404')}r.writeHead(200,{'content-type':T[path.extname(p)]||'application/octet-stream','cache-control':'no-store'});r.end(b)})});
s.listen(0,'127.0.0.1',async()=>{const port=s.address().port;
const br=await pup.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:'new',userDataDir:path.join(require('os').tmpdir(),'pins2-lab')});
const pg=await br.newPage();const errs=[];pg.on('pageerror',e=>errs.push(String(e).slice(0,140)));
await pg.setViewport({width:900,height:1400,deviceScaleFactor:3});
await pg.goto(`http://127.0.0.1:${port}/badge-lab.html`,{waitUntil:'networkidle0'});
await pg.evaluate(()=>document.fonts.ready); await new Promise(r=>setTimeout(r,500));
fs.mkdirSync(path.join(ROOT,'shots'),{recursive:true});
const out=[];
for(const slot of SLOTS){
  const clip=await pg.evaluate((sel,sl)=>{
    const el=document.querySelector(sel); if(!el) return null;
    for(const a of document.getAnimations()){ a.pause(); a.currentTime = sl*33.33 + 16; }
    const r=el.getBoundingClientRect();
    return {x:Math.round(r.x+scrollX-6),y:Math.round(r.y+scrollY-6),width:Math.round(r.width+12),height:Math.round(r.height+12)};
  },SEL,slot);
  if(!clip){out.push([slot,'no selector']);continue}
  await new Promise(r=>setTimeout(r,80));
  await pg.screenshot({path:path.join(ROOT,'shots',`${TAG}-${String(slot).padStart(2,'0')}.png`),clip});
  out.push([slot,`${clip.width}x${clip.height}`]);
}
console.log(JSON.stringify({sel:SEL,shots:out,errs},null,1)); await br.close(); s.close();});
