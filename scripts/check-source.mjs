import fs from 'node:fs';import path from 'node:path';
const pages=JSON.parse(fs.readFileSync('content/pages.json','utf8'));let bad=[];
const allowed=new Set(['hero','pagehero','split','story','services','work','dot','cta','visual','items','accordion','contact']);
for(const [slug,page] of Object.entries(pages)){
 if(!Array.isArray(page.sections)||!page.sections.length)bad.push(slug+': missing sections');
 for(const s of page.sections){if(!allowed.has(s.type))bad.push(slug+': invalid section '+s.type);if(s.image?.startsWith('/media/')&&!fs.existsSync('public'+s.image))bad.push(slug+': missing '+s.image);for(const item of s.items||[])if(item.image?.startsWith('/media/')&&!fs.existsSync('public'+item.image))bad.push(slug+': missing '+item.image)}
}
console.log(`${Object.keys(pages).length} pages; ${Object.values(pages).reduce((n,p)=>n+p.sections.length,0)} sections; ${bad.length} errors`);bad.forEach(console.error);process.exitCode=bad.length?1:0;
