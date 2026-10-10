const path=require('path'),fs=require('fs'),os=require('os');const puppeteer=require('/Applications/Claude Code/Diors-Builds/node_modules/puppeteer-core');const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{const b=await puppeteer.launch({executablePath:(process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'),headless:'new',userDataDir:fs.mkdtempSync(path.join(os.tmpdir(),'cl-'))});const p=await b.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));await p.setViewport({width:1282,height:1400,deviceScaleFactor:2});await p.setCacheEnabled(false);
await p.goto('http://127.0.0.1:8900/docs/pins2/s4-board/spec.html',{waitUntil:'networkidle0',timeout:90000});await p.waitForFunction(()=>window.__specReady,{timeout:30000});await sleep(3000);
const C=await p.evaluate(()=>window.__colours);fs.writeFileSync('cl-data.json',JSON.stringify(C,null,1));
await p.addStyleTag({content:'.spec .sbar{position:static!important}'});const el=await p.$('#colours');if(el)await el.screenshot({path:'/Applications/Claude Code/Diors-Builds/local/pins2/s4/work/lead/spec-check/sec-colours.png'});
// OKLCH of each words colour
const ok=(hx)=>{const c=[1,3,5].map(i=>parseInt(hx.slice(i,i+2),16)/255).map(x=>x<=0.04045?x/12.92:((x+0.055)/1.055)**2.4);const l=0.4122214708*c[0]+0.5363325363*c[1]+0.0514459929*c[2],m=0.2119034982*c[0]+0.6806995451*c[1]+0.1073969566*c[2],s=0.0883024619*c[0]+0.2817188376*c[1]+0.6299787005*c[2];const [L_,M_,S_]=[l,m,s].map(Math.cbrt);const L=0.2104542553*L_+0.7936177850*M_-0.0040720468*S_,a=1.9779984951*L_-2.4285922050*M_+0.4505937099*S_,bb=0.0259040371*L_+0.7827717662*M_-0.8086757660*S_;return{L,C:Math.hypot(a,bb)}};
const hues=[...new Set(Object.keys(C).map(k=>k.split('|')[0]))];const R=[100,86,80,74,68];
console.log('hue      '+R.map(r=>(''+r).padStart(14)).join(''));
for(const h of hues){const base=ok(C[h+'|tint|100'].hx);console.log(h.padEnd(9)+R.map(r=>{const v=C[h+'|tint|'+r];const o=ok(v.hx);return (v.cr.toFixed(1)+' dL'+((o.L-base.L)*100).toFixed(0)+' C'+Math.round(o.C/base.C*100)+'%').padStart(14)}).join(''));}
for(const r of R){const vs=hues.map(h=>[h,C[h+'|tint|'+r].cr]);const mn=vs.reduce((a,b)=>b[1]<a[1]?b:a);console.log('ratio',r,'min contrast',mn[1].toFixed(2),mn[0],'| under 4.5:',vs.filter(v=>v[1]<4.5).map(v=>v[0]).join(','));}
console.log('errors',errs);await b.close();})();
