const path=require('path'),fs=require('fs'),os=require('os');const puppeteer=require(path.resolve('node_modules/puppeteer-core'));
(async()=>{const b=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:'new',userDataDir:fs.mkdtempSync(path.join(os.tmpdir(),'cr-'))});
const shot=async(url,wait,sel,out)=>{const p=await b.newPage();await p.setViewport({width:1282,height:888,deviceScaleFactor:2});await p.goto(url,{waitUntil:'networkidle0'});await p.waitForSelector(wait,{timeout:20000});await new Promise(r=>setTimeout(r,1200));
const el=await p.$(sel);if(!el){console.log('missing',sel);return}await el.scrollIntoView();await new Promise(r=>setTimeout(r,400));await el.screenshot({path:out});
const info=await p.evaluate((s)=>{const e=document.querySelector(s);const ix=e.querySelector('.wg-ix,.pb-ix');const ln=e.querySelector('.wg-line,.pb-gline');const g=(x,k)=>x?getComputedStyle(x)[k]:'-';return {ixText:ix&&ix.textContent,ixFont:g(ix,'fontFamily').slice(0,40),ixW:g(ix,'fontWeight'),ixSize:g(ix,'fontSize'),ixNum:g(ix,'fontVariantNumeric'),lineGap:g(ln,'gap')}},sel);console.log(out.split('/').pop(),JSON.stringify(info));await p.close()};
await shot('http://127.0.0.1:8900/docs/superpowers/mockups/2026-09-14-pins2-board-2/index.html','#g4man *','#g4man .pb-g',process.argv[2]+'/b2-group.png');
await shot('http://127.0.0.1:8900/docs/pins2/kit/board3e.html','#g-history .b3-hi-r','#g-armory-manifest .wg',process.argv[2]+'/b3-group.png');
await b.close()})();
