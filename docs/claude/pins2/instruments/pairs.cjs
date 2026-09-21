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
const b4=await open('http://127.0.0.1:8900/local/pins2-board-3/redo/board4.html','#c-admin');
const tr=async(id,label)=>{await b4.evaluate((id,label)=>{const t=[...document.querySelectorAll('#'+id+' .g-tries button')].find(x=>x.textContent.trim()===label);t&&t.click()},id,label);await new Promise(r=>setTimeout(r,2500))};
await tr('c-new-build','Open New build');await shotEl(b4,'#c-new-build .g-stage','b4-new.png');
await tr('c-compare','Open Compare');await shotEl(b4,'#c-compare .g-stage','b4-compare.png');
await b4.evaluate(()=>{const s=document.querySelector('#c-broadcast .g-stage');s.scrollTop=s.scrollHeight});await new Promise(r=>setTimeout(r,800));await shotEl(b4,'#c-broadcast .g-stage','b4-bcman.png');
await tr('c-broadcast','Post announcement');await shotEl(b4,'#c-broadcast .g-stage','b4-post.png');
await shotEl(b4,'#c-admin .g-stage','b4-admin.png');
await b.close()})();
