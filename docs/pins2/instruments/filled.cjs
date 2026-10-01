const path=require('path'),fs=require('fs'),os=require('os');const puppeteer=require(path.resolve('node_modules/puppeteer-core'));const OUT=process.argv[2];
(async()=>{const b=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:'new',userDataDir:fs.mkdtempSync(path.join(os.tmpdir(),'fl-'))});
const open=async(url,wait)=>{const p=await b.newPage();await p.setViewport({width:1282,height:1100});await p.goto(url,{waitUntil:'networkidle0'});if(wait)await p.waitForSelector(wait,{timeout:20000});await new Promise(r=>setTimeout(r,2500));return p};
const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));
const b1=await open('http://127.0.0.1:8900/docs/superpowers/mockups/2026-09-14-pins2-board/index.html','aside.drawer');
for(const [lab,file] of [['New build','b1-drawer-g9.png'],['Post an announcement','b1-drawer-g8.png']]){const el=await b1.$(`aside.drawer[aria-label="${lab}"]`);await el.scrollIntoView();await sleep(400);await el.screenshot({path:OUT+'/'+file})}
const g10=await b1.evaluateHandle(()=>document.querySelectorAll('section.pb-gate')[1].querySelector('.pb-stage'));await g10.asElement().screenshot({path:OUT+'/b1-g10.png'});
const b4=await open('http://127.0.0.1:8900/docs/pins2/kit/board4.html','#c-admin');
const clickIn=async(sec,words,within)=>b4.evaluate((sec,words,within)=>{const root=document.getElementById(sec);const scope=within?(root.querySelector(within)||document.querySelector(within)):root;const h=[...scope.querySelectorAll('button,[role=tab],a,li,[role=option]')].filter(b=>!b.closest('.g-tries')).find(b=>b.textContent.replace(/\s+/g,' ').trim().toLowerCase().includes(words.toLowerCase()));if(h){h.scrollIntoView({block:'center'});h.click();return h.textContent.trim().slice(0,40)}return null},sec,words,within);
const type=async(sec,sel,text)=>b4.evaluate((sec,sel,text)=>{const e=document.querySelector('#'+sec+' '+sel)||document.querySelector(sel);if(!e)return false;e.focus();const set=Object.getOwnPropertyDescriptor(e.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype,'value').set;set.call(e,text);e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));return true},sec,sel,text);
// Compare, one weapon
console.log('cmp',await clickIn('c-compare','compare'));await sleep(1200);console.log('pick',await clickIn('c-compare','or just'));await sleep(1500);
await (await b4.$('#c-compare .g-stage')).screenshot({path:OUT+'/b4-g10.png'});
// New build, filled
console.log('nb',await clickIn('c-new-build','new build'));await sleep(1200);
console.log('w',await type('c-new-build','.drawer.open input[placeholder*="eapon" i]','BAL-27'));await sleep(600);console.log('opt',await clickIn('c-new-build','BAL-27','.drawer.open [role=listbox], .drawer.open .pb-menu, .drawer.open ul'));await sleep(600);
console.log('code',await type('c-new-build','.drawer.open input[placeholder*="1C" i], .drawer.open input[name*=code i], .drawer.open .pb-codefield input','1C2C4A8A9B'));await sleep(900);
const d9=await b4.$('#c-new-build .drawer.open');if(d9)await d9.screenshot({path:OUT+'/b4-drawer-g9.png'});
// Post, filled
console.log('post',await clickIn('c-broadcast','post announcement'));await sleep(1200);
console.log('t',await type('c-broadcast','.drawer.open textarea','# New Legendary draw is live\nThe Kilo Bolt-Action draw opens today. Check /draw prices before you spin.'));
console.log('ban',await type('c-broadcast','.drawer.open input[placeholder^="https" i]','https://example.com/kilo-draw.png'));
await sleep(1200);const d8=await b4.$('#c-broadcast .drawer.open');if(d8)await d8.screenshot({path:OUT+'/b4-drawer-g8.png'});
await b.close()})();
