const path=require('path'),fs=require('fs'),os=require('os');const puppeteer=require(path.resolve('node_modules/puppeteer-core'));const OUT=process.argv[2];
(async()=>{const b=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:'new',userDataDir:fs.mkdtempSync(path.join(os.tmpdir(),'pr-'))});
const open=async(url,wait)=>{const p=await b.newPage();await p.setViewport({width:1282,height:900});await p.goto(url,{waitUntil:'networkidle0'});if(wait)await p.waitForSelector(wait,{timeout:20000});await new Promise(r=>setTimeout(r,2500));return p};
const shotEl=async(p,sel,file)=>{const el=await p.$(sel);if(!el){console.log('missing',sel);return}await el.scrollIntoView();await new Promise(r=>setTimeout(r,500));await el.screenshot({path:OUT+'/'+file});console.log('ok',file)};
// board 1: three gates, in order G9 G10 G8
const b1=await open('http://127.0.0.1:8900/docs/superpowers/mockups/2026-09-14-pins2-board/index.html','aside.drawer');
await b1.evaluate(()=>['g9','g10','g8'].forEach((g,i)=>{const s=document.querySelectorAll('section.pb-gate')[i];if(s)s.id='gate-'+g}));
await shotEl(b1,'#gate-g9 .pb-stage','b1-g9.png');await shotEl(b1,'#gate-g10 .pb-stage','b1-g10.png');await shotEl(b1,'#gate-g8 .pb-stage','b1-g8.png');
// board 2: G11 broadcast manifest and G2
const b2=await open('http://127.0.0.1:8900/docs/superpowers/mockups/2026-09-14-pins2-board-2/index.html','#g4man *');
await shotEl(b2,'#g11bc','b2-g11bc.png');await shotEl(b2,'section[data-gate=g2]','b2-g2.png');
// board 4
const b4=await open('http://127.0.0.1:8900/docs/pins2/kit/board4.html','#c-admin');
const tr=async(id,label)=>{await b4.evaluate((id,label)=>{const t=[...document.querySelectorAll('#'+id+' .g-tries button')].find(x=>x.textContent.trim()===label);t&&t.click()},id,label);await new Promise(r=>setTimeout(r,2500))};
// Board 4 after round 1 (2026-09-21 15:13 EDT): no Try buttons open a surface; each section's head switch picks the state.
const st=async(id,label)=>{await b4.evaluate((id,label)=>{const t=[...document.querySelectorAll('#'+id+' .pb-ctl button')].find(x=>x.textContent.trim()===label);t&&t.click()},id,label);await new Promise(r=>setTimeout(r,1400))};
await st('c-new-build','Add build');await shotEl(b4,'#c-new-build .g-stage','b4-new.png');
await st('c-compare','One weapon');await shotEl(b4,'#c-compare .pb-panel','b4-compare.png');
await st('c-compare','Two weapons');await shotEl(b4,'#c-compare .pb-panel','b4-compare-two.png');
await b1.evaluate(()=>{const g=document.querySelector('#gate-g10');g.querySelectorAll('.pb-view').forEach(x=>{x.hidden=x.dataset.view!=='1'})});await shotEl(b1,'#gate-g10 .pb-stage','b1-g10-two.png');
await shotEl(b4,'#c-broadcast .g-stage','b4-bcman.png');
await st('c-broadcast','Posting');await shotEl(b4,'#c-broadcast .g-stage','b4-post.png');
await shotEl(b4,'#c-admin .b4-vb','b4-admin.png');
await b.close()})();
