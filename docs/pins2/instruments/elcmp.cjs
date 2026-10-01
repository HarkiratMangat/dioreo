// Pair every element of board 1's drawer with the same-path element of Board 4's, and print property differences.
const path=require('path'),fs=require('fs'),os=require('os');const puppeteer=require(path.resolve('node_modules/puppeteer-core'));
const WHICH=process.argv[2]||'g8';
(async()=>{const b=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:'new',userDataDir:fs.mkdtempSync(path.join(os.tmpdir(),'ec-'))});
const open=async(url,wait)=>{const p=await b.newPage();await p.setViewport({width:1282,height:1100});await p.goto(url,{waitUntil:'networkidle0'});if(wait)await p.waitForSelector(wait,{timeout:20000});await new Promise(r=>setTimeout(r,2500));return p};
const P=['display','width','height','padding-top','padding-right','padding-bottom','padding-left','gap','grid-template-columns','font-size','font-weight','font-family','line-height','letter-spacing','color','background-color','border-top-width','border-top-color','border-radius','box-shadow','margin-top','margin-left'];
const grab=(p,root)=>p.evaluate((root,P)=>{const r=document.querySelector(root);if(!r)return null;const out={};const walk=(el,pathS)=>{let i=0;for(const c of el.children){if(c.closest('svg')&&c.tagName.toLowerCase()!=='svg')continue;const cls=(c.getAttribute('class')||'').split(/\s+/).filter(x=>x&&!/^(b1|open|wide)$/.test(x)).sort().join('.');const k=pathS+'>'+c.tagName.toLowerCase()+(cls?'.'+cls:'');const key=out[k]?k+'#'+(++i):k;const cs=getComputedStyle(c);if(cs.display!=='none')out[key]=P.map(x=>cs.getPropertyValue(x));walk(c,k)}};walk(r,'');return out},root,P);
const b1=await open('http://127.0.0.1:8900/docs/superpowers/mockups/2026-09-14-pins2-board/index.html','aside.drawer');
const A=await grab(b1,WHICH==='g8'?'aside.drawer[aria-label="Post an announcement"] .pb-view[data-view="0"]':'aside.drawer[aria-label="New build"]');
const b4=await open('http://127.0.0.1:8900/docs/pins2/kit/board4.html','#c-admin');
await b4.evaluate(()=>{const s=document.getElementById('c-broadcast');const h=[...s.querySelectorAll('button')].filter(b=>!b.closest('.g-tries')).find(b=>/post announcement/i.test(b.textContent));h&&h.click()});await new Promise(r=>setTimeout(r,1500));
await b4.evaluate(()=>{const set=(sel,t)=>{const e=document.querySelector(sel);if(!e)return;const d=Object.getOwnPropertyDescriptor(e.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype,'value').set;d.call(e,t);e.dispatchEvent(new Event('input',{bubbles:true}))};set('#c-broadcast .drawer.open textarea','# New Legendary draw is live\nThe Kilo Bolt-Action draw opens today. Check /draw prices before you spin.');set('#post-starts','in 3 days')});await new Promise(r=>setTimeout(r,1500));
const Bm=await grab(b4,'#c-broadcast .drawer.open');
// board 1's view wrapper holds .dw-b > .bed and the footer; board 4's drawer holds header + .dw-b > .bed + footer. Align on the .bed subtree and the footer.
const norm=(o)=>Object.fromEntries(Object.entries(o||{}).map(([k,v])=>[k.replace(/^.*?>div\.dw-b/,'DWB').replace(/^.*?>footer\.dw-f/,'FOOT'),v]).filter(([k])=>/^(DWB|FOOT)/.test(k)));
const a=norm(A),z=norm(Bm);let miss=0,diff=0;const lines=[];
for(const k of Object.keys(a)){if(!z[k]){miss++;lines.push('MISSING on board 4: '+k);continue}P.forEach((p,i)=>{if(a[k][i]!==z[k][i]&&!(p==='width'&&Math.abs(parseFloat(a[k][i])-parseFloat(z[k][i]))<2)){diff++;lines.push(`${k.slice(-70)} · ${p}: board1 ${a[k][i].slice(0,40)} | board4 ${z[k][i].slice(0,40)}`)}})}
for(const k of Object.keys(z))if(!a[k])lines.push('EXTRA on board 4: '+k);
console.log(JSON.stringify({board1:Object.keys(a).length,board4:Object.keys(z).length,missing:miss,diffs:diff}));console.log(lines.slice(0,70).join('\n'));await b.close()})();
