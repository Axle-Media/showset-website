// Real mouse, wheel and native touch input across >=3 complete cycles each way.
const {chromium}=require(process.env.SHOWSET_PLAYWRIGHT_MODULE||'playwright'),fs=require('fs'),path=require('path');const base=process.env.SHOWSET_BASE_URL||'http://localhost:3001',out=process.env.SHOWSET_FINAL_EVIDENCE_DIR||'qa-results/case-final';fs.mkdirSync(out,{recursive:true});const checks=[],ck=(name,pass,detail)=>{checks.push({name,pass:!!pass,detail});console.log(pass?'PASS':'FAIL',name,detail??'')};
(async()=>{const b=await chromium.launch({channel:'chrome',headless:true});try{
for(const mode of ['mouse','wheel','touch']){const touch=mode==='touch',c=await b.newContext({viewport:{width:touch?390:1440,height:900},hasTouch:touch,isMobile:touch}),p=await c.newPage();await p.goto(base+'/work/atmosphere-is-everything/');await p.waitForSelector('[data-case-ready=true]');await p.evaluate(()=>document.fonts.ready);const g=p.locator('[data-case-gallery]');await g.scrollIntoViewIfNeeded();await p.waitForTimeout(300);const period=await g.evaluate(e=>[...e.querySelectorAll('[data-case-image]')].reduce((n,el)=>n+el.getBoundingClientRect().width+parseFloat(getComputedStyle(e).columnGap),0));const box=await g.boundingBox(),y=Math.max(100,box.y+Math.min(130,box.height*.4)),cd=touch?await c.newCDPSession(p):null;
let lastDirection=0;
for(const dir of [1,-1]){let distance=0,wraps=0,gestures=0;
 // Native inertia can cross a boundary between samples: meet both independent requirements before stopping.
 while((distance*dir<period*3.05||wraps<3)&&gestures<85){const before=await g.evaluate(e=>e.scrollLeft);
 if(mode==='wheel'){await g.hover();await p.mouse.wheel(dir*600,0);await p.waitForTimeout(65)}
 else if(mode==='mouse'){const a=box.x+box.width*(dir===1?.85:.15),z=box.x+box.width*(dir===1?.15:.85);await p.mouse.move(a,y);await p.mouse.down();await p.mouse.move(z,y,{steps:10});await p.mouse.up();await p.waitForTimeout(135)}
 else{const a=dir===1?330:60,z=dir===1?60:330;await cd.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:a,y}]});for(let i=1;i<=12;i++){await cd.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:a+(z-a)*i/12,y}]});await p.waitForTimeout(10)}await p.waitForTimeout(40);await cd.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await p.waitForTimeout(90)}
 const after=await g.evaluate(e=>e.scrollLeft);let delta=after-before;if(delta>period/2){delta-=period;wraps++}if(delta< -period/2){delta+=period;wraps++}distance+=delta;gestures++;
 if(lastDirection!==dir&&gestures===1)ck(mode+' immediate direction reversal',delta*dir>5,{delta});lastDirection=dir;
 }
 ck(mode+' three full cycles '+(dir>0?'forward':'reverse'),distance*dir>=period*3&&wraps>=3,{distance,period,wraps,gestures});ck(mode+' drag/gesture never opens image viewer',await p.locator('[data-case-lightbox]').isHidden());
 await p.screenshot({path:path.join(out,'loop-'+mode+'-'+dir+'.png')});
}
// Let native touch inertia finish before comparing a controlled coordinate reset.
for(let i=0;i<10;i++){const x=await g.evaluate(e=>e.scrollLeft);await p.waitForTimeout(200);if(Math.abs(await g.evaluate(e=>e.scrollLeft)-x)<.1)break}
// Just before/after the physical scroll-coordinate reset, visible logical geometry is identical.
await g.evaluate((e,period)=>{e.scrollLeft=period*2-8},period);await p.waitForTimeout(120);const geometry=await g.evaluate((e,period)=>{const read=()=>[...e.children].map(el=>({id:el.dataset.caseImageId,x:el.getBoundingClientRect().x,w:el.clientWidth})).filter(el=>el.x+el.w>e.getBoundingClientRect().x&&el.x<e.getBoundingClientRect().right);e.scrollLeft=period*2+8;return read()},period);await p.waitForTimeout(120);const reset=await g.evaluate(e=>[...e.children].map(el=>({id:el.dataset.caseImageId,x:el.getBoundingClientRect().x,w:el.clientWidth})).filter(el=>el.x+el.w>e.getBoundingClientRect().x&&el.x<e.getBoundingClientRect().right));ck(mode+' boundary reset preserves visible photographs and positions',geometry.length===reset.length&&geometry.every((e,i)=>e.id===reset[i].id&&Math.abs(e.x-reset[i].x)<1.1),{geometry,reset});await p.screenshot({path:path.join(out,'boundary-'+mode+'.png')});
await p.setViewportSize({width:touch?768:1024,height:800});await p.waitForTimeout(200);ck(mode+' resize retains bounded clones and accessible originals',await g.evaluate(e=>e.querySelectorAll('.case-gallery-clone').length===e.querySelectorAll('[data-case-image]').length*2));await c.close();
}
}finally{await b.close();fs.writeFileSync(path.join(out,'infinite-checks.json'),JSON.stringify(checks,null,2));if(checks.some(x=>!x.pass))process.exitCode=1}})().catch(e=>{console.error(e);fs.writeFileSync(path.join(out,'infinite-checks.json'),JSON.stringify(checks,null,2));process.exitCode=1});
