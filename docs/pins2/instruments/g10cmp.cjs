// Board 1 · G10 (one weapon) against Board 4's Compare, element by element, paired by class path.
const path=require('path'),fs=require('fs'),os=require('os');const puppeteer=require(path.resolve('node_modules/puppeteer-core'));const OUT=process.argv[2];
(async()=>{const b=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:'new',userDataDir:fs.mkdtempSync(path.join(os.tmpdir(),'gc-'))});
const open=async(url,wait)=>{const p=await b.newPage();await p.setViewport({width:1282,height:1100});await p.goto(url,{waitUntil:'networkidle0'});if(wait)await p.waitForSelector(wait,{timeout:20000});await new Promise(r=>setTimeout(r,2500));return p};
const P=['display','height','padding-top','padding-right','padding-bottom','padding-left','gap','font-size','font-weight','font-family','line-height','letter-spacing','color','background-color','border-top-width','border-top-color','border-radius','box-shadow','text-transform'];
const grab=(p,root)=>p.evaluate((root,P)=>{const r=document.querySelector(root);if(!r)return null;const out={};const cnt={};r.querySelectorAll('*').forEach(c=>{if(c.closest('svg')&&c.tagName.toLowerCase()!=='svg')return;const cls=(c.getAttribute('class')||'').split(/\s+/).filter(x=>x&&x!=='b1').sort().join('.');if(!cls)return;const k=c.tagName.toLowerCase()+'.'+cls;cnt[k]=(cnt[k]||0)+1;if(cnt[k]>1)return;const cs=getComputedStyle(c);if(cs.display!=='none')out[k]=P.map(x=>cs.getPropertyValue(x))});return out},root,P);
const b1=await open('http://127.0.0.1:8900/docs/superpowers/mockups/2026-09-14-pins2-board/index.html','aside.drawer');
await b1.evaluate(()=>{document.querySelectorAll('section.pb-gate')[1].id='g10'});const A=await grab(b1,'#g10 .pb-view[data-view="0"]');
const b4=await open('http://127.0.0.1:8900/docs/pins2/kit/board4.html','#c-admin');
await b4.evaluate(async()=>{const s=document.getElementById('c-compare');const f=(w)=>[...s.querySelectorAll('button,[role=tab]')].filter(b=>!b.closest('.g-tries')).find(b=>b.textContent.trim().toLowerCase().includes(w));f('compare').click();await new Promise(r=>setTimeout(r,1200));const o=f('or just');o&&o.click()});await new Promise(r=>setTimeout(r,1800));
const Z=await grab(b4,'#c-compare #compare');
if(OUT){const e=await b4.$('#c-compare #compare');await e.screenshot({path:OUT})}
let lines=[],d=0;for(const k of Object.keys(A)){if(!Z[k]){lines.push('MISSING '+k);continue}P.forEach((p,i)=>{if(A[k][i]!==Z[k][i]){d++;lines.push(`${k.slice(0,48)} · ${p}: b1 ${A[k][i].slice(0,34)} | b4 ${Z[k][i].slice(0,34)}`)}})}
Object.keys(Z).forEach(k=>{if(!A[k])lines.push('EXTRA '+k)});
console.log(JSON.stringify({b1:Object.keys(A).length,b4:Object.keys(Z).length,diffs:d}));console.log(lines.slice(0,60).join('\n'));await b.close()})();
