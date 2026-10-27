import {readFileSync,existsSync} from 'node:fs';
import assert from 'node:assert/strict';
const pages=JSON.parse(readFileSync('content/pages.json','utf8'));
const cases=Object.values(pages).filter(p=>p.route.startsWith('/work/'));
const source=value=>{assert(typeof value==='string'&&value.trim(),'Missing case-study photograph');assert(value.startsWith('/')||value.startsWith('https://'),'Unsafe photo URL');if(value.startsWith('/'))assert(existsSync('public'+value),'Missing asset '+value)};
for(const p of cases){
 const s=p.caseExperience;assert(s,p.slug+': missing cinematic content');
 for(const key of['openingTitle','openingBody','secondBody'])assert(s[key]?.trim(),p.slug+': missing '+key);
 source(s.openingImage);source(s.secondImage);
 for(const key of['brief','intention','approach']){assert(s[key]?.heading?.trim()&&s[key]?.body?.trim(),p.slug+': incomplete '+key);source(s[key].image??s[key].images?.find(Boolean));}
 assert(Array.isArray(s.gallery)&&s.gallery.length,p.slug+': empty gallery');s.gallery.forEach(p=>{source(p.src);assert(p.alt?.trim(),'Gallery description required')});
 for(const partner of s.partners||[])if(partner.logo)source(partner.logo);
}
assert.equal(new Set(cases.map(p=>p.caseExperience.openingTitle)).size,cases.length,'Repeated project headline');
assert.equal(new Set(cases.map(p=>JSON.stringify(p.caseExperience.gallery))).size,cases.length,'Repeated gallery configuration');
console.log(`Validated ${cases.length} complete, distinct cinematic case studies and their local assets.`);
