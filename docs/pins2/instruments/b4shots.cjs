const path=require('path'),fs=require('fs'),os=require('os');const puppeteer=require(path.resolve('node_modules/puppeteer-core'));const OUT=process.argv[2];
(async()=>{const b=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:'new',userDataDir:fs.mkdtempSync(path.join(os.tmpdir(),'b4-'))});
const p=await b.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,200)));p.on('console',m=>{if(m.type()==='error')errs.push('console: '+m.text().slice(0,160))});
await p.setViewport({width:1282,height:900});await p.goto('http://127.0.0.1:8900/docs/pins2/kit/board4.html',{waitUntil:'networkidle0'});await new Promise(r=>setTimeout(r,3000));
const ids=await p.evaluate(()=>[...document.querySelectorAll('section[id^=c-]')].map(s=>s.id));console.log('sections',ids.join(' '));
const clickTry=async(id,label)=>p.evaluate((id,label)=>{const s=document.getElementById(id);const t=[...s.querySelectorAll('.g-tries button')].find(x=>x.textContent.trim()===label);if(t){t.click();return true}return false},id,label);
for(const id of ids){const el=await p.$('#'+id);await el.scrollIntoView();await new Promise(r=>setTimeout(r,700));
 const info=await p.evaluate((id)=>{const s=document.getElementById(id);const st=s.querySelector('.g-stage');return {stageH:st?Math.round(st.getBoundingClientRect().height):0,kids:st?st.querySelectorAll('*').length:0,tries:[...s.querySelectorAll('.g-tries button')].map(b=>b.textContent.trim())}},id);console.log(id,JSON.stringify(info));
 await el.screenshot({path:`${OUT}/${id}.png`});
 for(const t of info.tries){if(await clickTry(id,t)){await new Promise(r=>setTimeout(r,1200));await el.screenshot({path:`${OUT}/${id}--${t.replace(/\W+/g,'-')}.png`});const d=await p.evaluate((id)=>{const s=document.getElementById(id);const dw=s.querySelector('.drawer.open, [role=dialog]');return dw?dw.getAttribute('aria-label')||dw.className:'no drawer'},id);console.log('  try',t,'→',d)}}}
console.log('errors',errs.length);errs.slice(0,8).forEach(e=>console.log('  ',e));await b.close()})();
