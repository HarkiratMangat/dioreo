// ⛔ CLOSED TO NEW DETECTORS — 2026-09-16 21:59 EDT.
// Every check in this file was written AFTER Harkirat found the defect it detects: square-in-pill after "square shape
// inside of a pill button??", input-in-input after "search bar inside of a search bar", fixedCaptured after a popover
// flew off screen, splitBaseline after he drew a line through a chip. So it has never once prevented something he
// cared about — it is a ledger of defects already paid for, wearing a green exit code. His words, and they are right:
// "a check/test is a failure in your ability to create the element correct in the first place. This is a damn
// artifact, not the actual portal. A defined, small set of elements."
// It stays as a regression net for those six and takes no more. The rule that would have prevented the last one lives
// where a rule belongs — the ROW TYPES block at the top of b3/board.css. Four other scratch harnesses (audit, probe,
// sweep, shots — 34,857 bytes) were deleted in the same change. sweep-screens.cjs survives because it is NOT a test:
// it renders twelve full screens so the board gets looked at, which is the thing these files were substituting for.
// THE CLASS SWEEP — and it is deliberately SMALL, because most of this job is not a browser's.
//
// 🔴 HIS CORRECTION, 2026-09-16 17:47 EDT: "stop building tests for things you should be catching yourself in the
// first place. also pretty sure codebase-memory can do a large part of this test's job on its own."
// Both halves were right, and I checked rather than agreeing. With this kit indexed
// (`codebase-memory-mcp cli index_repository --repo_path <this dir>`), one `search_code` for
// `border-radius: ?[2-8]px` returned every candidate across four stylesheets in 16ms, no browser — and it found
// THREE this file had missed, including `.b3-sd-w i`, whose element I had already deleted so nothing rendered for
// the sweep to see, and which sat in gates.css where it would have beaten any override. It also lists a selector
// defined twice (`.dk-take` at 98 and 106), which is the load-order defect I walked into an hour earlier.
//
// So the division is: ANY question the SOURCE can answer goes to codebase-memory — every instance of a value, a
// duplicated selector, which file a rule lives in. What is left here is only what needs the CASCADE RESOLVED AND
// THE PAGE LAID OUT: whether a small mark's parent is actually round at render, whether a parent clips it anyway,
// whether a field ends up taller than the wrapper it sits in. Those cannot be read off the text.
// Three separate comments this round were the SAME defect wearing different class names (a square mark inside a
// fully-rounded pill), and each was fixed where he pointed rather than everywhere it lived. This walks the whole
// rendered board and reports every instance of the shapes he has had to name, so the next one is found by the
// sweep and not by him. Usage: node class-sweep.cjs   (exit 1 if anything is found)
const http=require('http'),fs=require('fs'),path=require('path');
const ROOT=__dirname;
const puppeteer=require(path.resolve(ROOT,'../../../node_modules/puppeteer-core'));
const T={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.json':'application/json','.svg':'image/svg+xml'};
const srv=http.createServer((q,r)=>{const p=path.join(ROOT,decodeURIComponent(q.url.split('?')[0]).replace(/^\/+/,'')||'index.html');
 fs.readFile(p,(e,b)=>{if(e){r.writeHead(404);return r.end('404');}r.writeHead(200,{'content-type':T[path.extname(p)]||'application/octet-stream','cache-control':'no-store'});r.end(b);});});
const MOCK=`window.__dbWrites=[];const docs=new Map(),subs=new Map();const fire=(p)=>(subs.get(p)||[]).forEach(fn=>fn({exists:docs.has(p),data:()=>docs.get(p)}));
window.claude={use:async(n)=>(n!=='db'?null:{doc:(p)=>({set:async d=>{docs.set(p,d);fire(p);},get:async()=>({exists:docs.has(p),data:()=>docs.get(p)}),onSnapshot:fn=>{subs.set(p,[...(subs.get(p)||[]),fn]);fn({exists:docs.has(p),data:()=>docs.get(p)});return()=>{};}})})};`;

const SWEEP = () => {
  const px=(v)=>parseFloat(v)||0;
  const isPill=(el)=>{const cs=getComputedStyle(el),r=el.getBoundingClientRect();
    const rad=cs.borderTopLeftRadius; if(rad.includes('%'))return px(rad)>=45;
    return r.height>0 && px(rad)>=Math.min(r.height,r.width)/2-0.6;};
  const named=(el)=>(el.className&&String(el.className).trim())||el.tagName.toLowerCase();
  const out={squareInPill:[],doubleAccent:[],loneRingless:[],inputInInput:[],fixedCaptured:[],splitBaseline:[]};

  // 1 · a mark with a SMALL radius sitting inside a fully-rounded control
  document.querySelectorAll('*').forEach((el)=>{
    const r=el.getBoundingClientRect(); if(r.width<3||r.width>40||r.height<3||r.height>40)return;
    const cs=getComputedStyle(el);
    if(cs.backgroundColor==='rgba(0, 0, 0, 0)'&&cs.boxShadow==='none')return;
    // ⚠️ TWO FALSE-POSITIVE CLASSES, both found by chasing 31 reported instances that were not defects:
    //  · a pill that CLIPS its children (`overflow:hidden`) already rounds them — the child's own radius is invisible;
    //  · a segmented pill's inner half is square ON PURPOSE where it butts its sibling, so only the OUTER corners
    //    matter. Reading `borderTopLeftRadius` alone called `0 999px 999px 0` square.
    const corners=[cs.borderTopLeftRadius,cs.borderTopRightRadius,cs.borderBottomRightRadius,cs.borderBottomLeftRadius].map(px);
    if(Math.max(...corners)>=Math.min(r.height,r.width)/2-0.6)return;   // round on at least one axis
    const p=el.parentElement; if(!p||!isPill(p))return;
    if(getComputedStyle(p).overflow!=='visible')return;                 // the parent clips it round
    if(p.getBoundingClientRect().height>64)return;
    out.squareInPill.push({el:named(el),parent:named(p),radius:cs.borderTopLeftRadius,w:+r.width.toFixed(0),h:+r.height.toFixed(0)});
  });

  // 6 · a name and the smaller label beside it, set on two different baselines
  // He drew a line through a selection chip and the smaller "Builds 1-5" sat off it. Words beside words share a
  // BASELINE; a box beside words shares a CENTRE line. This walks every inline row that holds two TEXT children of
  // different sizes and reports the pair whose baselines disagree. A box child (a button, a dot, an icon, a chip) is
  // skipped on purpose -- it is meant to be centred, and counting it was the first version's false positive.
  // A WRAPPER'S RANGE BOX IS THE UNION OF ITS CHILDREN, so a 13px name beside a 9.5px label inside one span gives a
  // bottom that belongs to neither and an estimate 1.3px out. Measure the FIRST text-bearing node instead, which is
  // the node whose baseline the wrapper actually contributes to its own row.
  const firstText=(el)=>{if(el.nodeType===3) return el; let n=el; for(let i=0;i<4;i+=1){const k=[...n.childNodes].find((x)=>
      (x.nodeType===3&&x.textContent.trim())||(x.nodeType===1&&x.textContent.trim()));
    if(!k||k.nodeType===3) return n; n=k;} return n;};
  const baselineOf=(el)=>{const t=firstText(el); const r=document.createRange(); r.selectNodeContents(t);
    const b=r.getBoundingClientRect(); if(!b.height) return null;
    const fs=parseFloat(getComputedStyle(t.nodeType===1?t:(el.nodeType===1?el:el.parentElement)).fontSize);
    // the range box spans ascent+descent; a font's descent is ~21% of the em in both faces used here
    return +(b.bottom - fs*0.21).toFixed(2);};
  const isBox=(el)=>{const cs=getComputedStyle(el); const r=el.getBoundingClientRect();
    return el.tagName==='BUTTON'||el.tagName==='SVG'||el.querySelector('svg')||cs.backgroundColor!=='rgba(0, 0, 0, 0)'
      ||cs.boxShadow!=='none'||(r.width<14&&r.height<14);};
  document.querySelectorAll('*').forEach((row)=>{
    const cs=getComputedStyle(row);
    if(!/flex|inline-flex/.test(cs.display)) return;
    if(cs.flexDirection.startsWith('column')) return;
    // A MULTI-LINE CHILD HAS NO SINGLE BASELINE TO SHARE. A wrapped paragraph beside a one-line label is a stacked
    // layout, not a misaligned row, and comparing them reports the line count rather than the alignment.
    const oneLine=(k)=>{const r=k.getBoundingClientRect(); const fs=parseFloat(getComputedStyle(k).fontSize);
      return r.height < fs*1.9;};
    // 🔴 A BARE TEXT NODE IS A CHILD TOO, and leaving it out is why this check could not see the row he pointed at.
    // The selection chip's weapon name is a text node, so `row.children` held one element and the row was skipped —
    // the instrument was blind to the exact defect it was written for. A text node is measured through a Range and
    // carries its parent's font size.
    const kids=[...row.childNodes].filter((k)=>{
      if(k.nodeType===3) return !!k.textContent.trim();
      if(k.nodeType!==1) return false;
      const r=k.getBoundingClientRect();
      return r.height>4&&r.width>4&&k.textContent.trim()&&!isBox(k)&&oneLine(k);});
    if(kids.length<2) return;
    const sizes=kids.map((k)=>parseFloat(getComputedStyle(k.nodeType===3?row:k).fontSize));
    if(Math.max(...sizes)-Math.min(...sizes)<0.4) return;      // same size: nothing to disagree about
    const bl=kids.map(baselineOf).filter((x)=>x!==null);
    if(bl.length<2) return;
    // A WRAPPED ROW IS NOT A MISALIGNED ROW. Children on two different lines have two different baselines by
    // definition, and counting them turned one real finding into a hundred. Only compare children that overlap
    // vertically -- i.e. that are actually sitting on the same line.
    const box=(k)=>{if(k.nodeType===1) return k.getBoundingClientRect();
      const r=document.createRange(); r.selectNodeContents(k); return r.getBoundingClientRect();};
    const tops=kids.map((k)=>box(k).top), bots=kids.map((k)=>box(k).bottom);
    if(Math.max(...tops)>=Math.min(...bots)) return;
    const off=+(Math.max(...bl)-Math.min(...bl)).toFixed(2);
    // ✅ ACCEPTED, with his reason. These rows were switched to baseline and he asked for them back: "There was
    // nothing wrong with them, why were they changed?" The control is a BOX in a row of boxes and it keeps the
    // centre line; the sub-2px text offset inside it is the price, paid knowingly. An accepted finding is named
    // here rather than left to inflate a number nobody then trusts.
    // The selection group head joins them for the same reason: he asked for the row to keep the centre line
    // ("misligned text" was the words above sitting off their own BEST badge), and its two text items sit at
    // OPPOSITE ENDS of a 1,100px row, where a sub-pixel baseline difference cannot be seen by anyone.
    // R1 (2026-10-04 12:27 EDT): the chip and history-filter paths now run through the chip boxes R1 added (.mt-chips, .b3-fgc); the rows are the same.
    const ACCEPTED=['section.pidx>ul.pidx-l>li>a','div.mt-r2>span.mt-grp>span.mt-chips>button.chip',
                    'div.b3-hi-f>div.b3-fg>div.b3-fgc>button.b3-fc',
                    'div.b3-sd-list>div.b3-sd-rows>div.b3-sd-g>div.b3-sd-gh'];
    const here=(()=>{const q=[];let n=row;for(let i=0;i<4&&n&&n!==document.body;i+=1){
      q.unshift(n.tagName.toLowerCase()+(n.id?'#'+n.id:'')+(n.className?'.'+String(n.className).trim().split(/\s+/)[0]:''));n=n.parentElement;}return q.join('>');})();
    if(ACCEPTED.includes(here)) return;
    if(off>0.8) out.splitBaseline.push({row:named(row),off,align:cs.alignItems,
      path:(()=>{const q=[];let n=row;for(let i=0;i<4&&n&&n!==document.body;i+=1){q.unshift(n.tagName.toLowerCase()+(n.id?'#'+n.id:'')+(n.className?'.'+String(n.className).trim().split(/\s+/)[0]:''));n=n.parentElement;}return q.join('>');})(),      text:row.textContent.trim().replace(/\s+/g,' ').slice(0,40),
      kids:kids.map((k,i)=>({t:(k.nodeType===3?'TEXT':k.tagName+'.'+String(k.className||'')).slice(0,20),fs:sizes[i]}))});
  });
  // one row per CLASS, worst first -- the class is the unit of work, not the instance
  const byCls=new Map();
  for(const r of out.splitBaseline){const k=r.row+'|'+r.kids.map((x)=>x.t).join(',');
    const prev=byCls.get(k); if(!prev||r.off>prev.off) byCls.set(k,{...r,n:(prev?prev.n:0)+1}); else prev.n+=1;}
  out.splitBaseline=[...byCls.values()].sort((a,b)=>b.off-a.off);

  // 2 · one accent drawn more than once inside a single header or row
  document.querySelectorAll('[style*="--c"]').forEach((row)=>{
    const c=getComputedStyle(row).getPropertyValue('--c').trim(); if(!c)return;
    const marks=[];
    const probe=(el,where)=>{const cs=getComputedStyle(el,where||null);
      const bg=cs.backgroundColor,r=(where?el:el).getBoundingClientRect();
      if(where&&cs.content==='none')return;
      if(!bg||bg==='rgba(0, 0, 0, 0)')return;
      const w=where?px(cs.width):r.width,h=where?px(cs.height):r.height;
      if(w>26||h>26||w<2||h<2)return;
      marks.push((where?named(el)+where:named(el)));};
    // ⚠️ A checkbox mark, a ladder bar and a separator are not accent repeats — the first run of this reported 125
    // "double accents" that were all one of those three, and an instrument with a 100% false-positive rate is one
    // nobody reads. Only marks that actually paint the row's own --c count.
    const isAccent=(el,where)=>{const cs=getComputedStyle(el,where||null);
      const bg=cs.backgroundColor; if(!bg||bg==='rgba(0, 0, 0, 0)')return false;
      const probe=document.createElement('span'); probe.style.color=c; document.body.appendChild(probe);
      const want=getComputedStyle(probe).color; probe.remove();
      return bg===want;};
    [...row.querySelectorAll('i,span,em'),row].forEach((el)=>{
      if(el.classList&&(el.classList.contains('cb')||el.classList.contains('sep')||el.closest('.lad')||el.closest('.b3-meter')||el.closest('.b3-pips')))return;
      if(isAccent(el)) probe(el);
      if(isAccent(el,'::before')) probe(el,'::before');
      if(isAccent(el,'::after')) probe(el,'::after');});
    if(marks.length>1) out.doubleAccent.push({row:named(row),marks:marks.slice(0,4)});
  });

  // 3 · one control in a run of controls with no ring while its siblings have one
  document.querySelectorAll('*').forEach((p)=>{
    const kids=[...p.children].filter((k)=>k.tagName==='BUTTON'||k.getAttribute('role')==='button');
    if(kids.length<2)return;
    // a TRANSPARENT ring is not a ring — `.b3-sd-code.as-btn` declares `inset 0 0 0 1px transparent` so its hover
    // can transition, and reading `boxShadow !== 'none'` counted that as an edge its neighbour was missing.
    const visible=(v)=>v!=='none'&&!/rgba\(0, 0, 0, 0\)|transparent/.test(v);
    const ring=kids.map((k)=>visible(getComputedStyle(k).boxShadow));
    const on=ring.filter(Boolean).length;
    // a segmented control's UNSELECTED option is meant to have no edge — that is the control working, not a defect
    const segmented=kids.every((k)=>k.hasAttribute('aria-pressed')||k.getAttribute('role')==='tab');
    // ✅ ACCEPTED: `.b3-sd-code.as-btn` is text on purpose, not a button box — "the gunsmith code should copy when
    // it's click, no separate button" — so it carries a transparent ring for its hover transition and none at rest.
    // It became a finding the moment its sibling × was given the ring he asked for.
    const codeIsText=kids.some((k)=>/b3-sd-code/.test(String(k.className||'')));
    if(!segmented&&!codeIsText&&on&&on<kids.length&&kids.every((k)=>k.getBoundingClientRect().height>18))
      out.loneRingless.push({group:named(p),of:kids.length,without:kids.filter((k,i)=>!ring[i]).map(named).slice(0,3)});
  });

  // 5 · A FIXED ELEMENT CAPTURED BY A TRANSFORMED ANCESTOR. Added 2026-09-16 18:34 EDT after the list's problem card
  // rendered 5,472px off screen with a correct `top: 12px`: a transform anywhere up the chain makes that ancestor the
  // containing block, so the number is right and the position is not. This is a RENDER question by construction —
  // the source cannot say which ancestor ends up transformed — so it belongs here rather than in the index.
  document.querySelectorAll('*').forEach((el)=>{
    if(getComputedStyle(el).position!=='fixed')return;
    const r=el.getBoundingClientRect(); if(r.width<2||r.height<2)return;
    const chain=[]; let p=el.parentElement;
    while(p&&p!==document.documentElement){const c=getComputedStyle(p);
      if(c.transform!=='none'||c.filter!=='none'||c.perspective!=='none'||c.backdropFilter!=='none'||c.contain.includes('paint')||c.contain.includes('layout'))
        chain.push(named(p)+(c.transform!=='none'?' transform':' filter/contain'));
      p=p.parentElement;}
    if(chain.length) out.fixedCaptured.push({el:named(el),by:chain.slice(0,3),rectTop:+r.top.toFixed(0),cssTop:getComputedStyle(el).top});
  });

  // 4 · a field painting its own box inside a styled wrapper
  document.querySelectorAll('input').forEach((el)=>{
    if(['checkbox','radio','range'].includes(el.type))return;
    const p=el.parentElement; if(!p)return;
    const pcs=getComputedStyle(p),cs=getComputedStyle(el);
    const styled=pcs.boxShadow!=='none'||pcs.backgroundColor!=='rgba(0, 0, 0, 0)'||pcs.borderTopWidth!=='0px';
    const ownBox=cs.borderTopWidth!=='0px'||cs.backgroundColor!=='rgba(0, 0, 0, 0)';
    if(styled&&ownBox&&el.getBoundingClientRect().height>p.getBoundingClientRect().height-0.5)
      out.inputInInput.push({field:named(el),wrapper:named(p)});
  });
  return out;
};

srv.listen(0,'127.0.0.1',async()=>{
 const port=srv.address().port;
 const br=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:'new',userDataDir:'/tmp/pins2-b3-class'});
 const pg=await br.newPage(); await pg.setViewport({width:1282,height:1200,deviceScaleFactor:1});
 await pg.evaluateOnNewDocument(MOCK);
 await pg.goto(`http://127.0.0.1:${port}/index.html`,{waitUntil:'networkidle0'});
 await pg.evaluate(()=>document.fonts.ready); await new Promise(r=>setTimeout(r,1700));
 // open every state the board can show, so the sweep sees the whole surface and not just what is mounted at rest
 await pg.evaluate(()=>{document.querySelectorAll('#g-armory-manifest .wg-r .wg-cb').forEach((c,i)=>{if(i<4)c.click();});});
 await new Promise(r=>setTimeout(r,500));
 await pg.evaluate(()=>{const t=document.querySelector('.b3-sd-tog'); if(t)t.click();});
 await pg.evaluate(()=>{const g=document.getElementById('g-export'); if(g){const b=[...g.querySelectorAll('button')].find(x=>/pick|choose/i.test(x.textContent)); if(b)b.click();}});
 await pg.evaluate(()=>{const w=document.querySelector('.b3-wr-main'); if(w)w.click();});
 await new Promise(r=>setTimeout(r,900));
 const res=await pg.evaluate(SWEEP);
 const total=Object.values(res).reduce((n,a)=>n+a.length,0);
 console.log(JSON.stringify({total,...res},null,1));
 await br.close(); srv.close();
 process.exit(total?1:0);
});
