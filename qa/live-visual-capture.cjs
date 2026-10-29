// Temporary live visual audit: browse the deployed production site, not local static assets.
// Explicitly screenshot the top, centre section and footer of every public page.
const {chromium}=require(process.env.SHOWSET_PLAYWRIGHT_MODULE||'playwright');
const fs=require('node:fs');
const pages=[
 ['home','/'],['studio','/our-studio/'],['work','/our-work/'],
 ['events','/events-experiences/'],['creative','/creative-design/'],
 ['digital','/digital-marketing/'],['production','/content-production/'],
 ['contact','/contact/'],['case1','/work/atmosphere-is-everything/']
];
(async()=>{
 const b=await chromium.launch({channel:'chromium',headless:true});
 const output=[];
 fs.mkdirSync('qa-results/live-visual',{recursive:true});
 try{
  for(const width of [390,768]){
   const ctx=await b.newContext({viewport:{width,height:844},deviceScaleFactor:1,hasTouch:width<=600,isMobile:width<=600});
   const p=await ctx.newPage();
   p.on('pageerror',err=>output.push({type:'pageerror',width,error:err.message,url:p.url()}));
   for(const [name,route] of pages){
    try{
     const res=await p.goto('https://showset-website.vercel.app'+route,{waitUntil:'domcontentloaded',timeout:45000});
     await p.waitForTimeout(1300);
     await p.evaluate(()=>document.fonts.ready);
     const diagnostic=await p.evaluate(()=>{
      const root=document.querySelector('.view.is-current')||document.querySelector('main');
      const visible=e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return r.height>0&&r.width>0&&s.display!=='none'&&s.visibility!=='hidden'};
      const viewport=innerWidth;
      const bad=[...(root?.querySelectorAll('h1,h2,h3,p,a,button,img')||[])].filter(visible).map(e=>{const r=e.getBoundingClientRect();return {tag:e.tagName,class:String(e.className).slice(0,45),text:e.tagName==='IMG'?'':e.textContent.trim().slice(0,60),left:Math.round(r.left),right:Math.round(r.right),height:Math.round(r.height),top:Math.round(r.top)}}).filter(e=>e.left < -5||e.right>viewport+5).slice(0,12);
      const header=document.querySelector('header'),foot=document.querySelector('footer'),identity=foot?.querySelector('.footer-identity'),discover=foot?.querySelector('.footer-links>div:first-child'),what=foot?.querySelector('.footer-links>div:nth-child(2)'),contact=foot?.querySelector('.footer-contact');
      const pos=e=>{const r=e?.getBoundingClientRect();return r?{x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height),display:getComputedStyle(e).display}:null};
      const headEls=[...(root?.querySelectorAll('h1,h2')||[])].filter(visible).slice(0,12).map(e=>({text:e.textContent.trim().slice(0,55),align:getComputedStyle(e).textAlign,font:Math.round(parseFloat(getComputedStyle(e).fontSize)),left:Math.round(e.getBoundingClientRect().left),width:Math.round(e.getBoundingClientRect().width)}));
      return {title:document.title,siteVersion:document.querySelector('[data-concept-ready]')?.dataset.conceptReady,docWidth:document.documentElement.scrollWidth,bodyWidth:document.body.scrollWidth,viewport,scrollHeight:document.documentElement.scrollHeight,header:pos(header),footer:{identity:pos(identity),discover:pos(discover),what:pos(what),contact:pos(contact)},overflowChildren:bad,headings:headEls};
     });
     output.push({type:'audit',width,page:name,route,http:res?.status(),diagnostic});
     for(const shot of ['hero','middle','footer']){
      if(shot==='hero')await p.evaluate(()=>scrollTo({top:0,behavior:'instant'}));
      if(shot==='middle')await p.evaluate(()=>scrollTo({top:document.documentElement.scrollHeight*.54,behavior:'instant'}));
      if(shot==='footer')await p.locator('footer').first().scrollIntoViewIfNeeded().catch(()=>{});
      await p.waitForTimeout(350);
      const jpg=await p.screenshot({type:'jpeg',quality:52,animations:'disabled'});
      fs.writeFileSync('qa-results/live-visual/'+name+'-'+width+'-'+shot+'.jpg',jpg);
      const key=name+':'+width+':'+shot,encoded=jpg.toString('base64');
      console.log('VISUAL_START:'+key+':'+encoded.length);
      for(let n=0;n<encoded.length;n+=12000)console.log('VISUAL_CHUNK:'+key+':'+encoded.slice(n,n+12000));
      console.log('VISUAL_END:'+key);
     }
    }catch(e){output.push({type:'error',page:name,width,message:e.message});}
   }
   await ctx.close();
  }
 }finally{await b.close();fs.writeFileSync('qa-results/live-visual/audit.json',JSON.stringify(output,null,2));console.log('VISUAL_AUDIT:'+JSON.stringify(output));}
})().catch(e=>{console.error('LIVE_VISUAL_AUDIT_FAILURE:'+e.stack);process.exitCode=1});
