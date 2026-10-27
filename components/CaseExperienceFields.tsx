"use client";
import { primaryChapterImage } from "@/lib/concept-12/chapter-image";
import type { CaseExperience, CaseStoryChapter, PageData } from "@/lib/types";

type Props={page:PageData;updatePage:(updater:(page:PageData)=>PageData)=>void};
const field=(label:string,value:string,onChange:(value:string)=>void,multiline=false)=>(
 <label className="studio-field" key={label}>{label}
 {multiline?<textarea aria-label={label} value={value} rows={4} onChange={e=>onChange(e.target.value)}/>:
 <input aria-label={label} value={value} onChange={e=>onChange(e.target.value)}/>}
 </label>
);
export default function CaseExperienceFields({page,updatePage}:Props){
 const story=page.caseExperience;
 const save=(next:CaseExperience)=>updatePage(p=>({...p,caseExperience:next}));
 if(!story)return <div className="studio-item"><div className="studio-pane-title">Cinematic case study</div>
  <p className="studio-hint">Create an editable story to use the pinned chapter template and gallery.</p>
  <button type="button" onClick={()=>save({
   openingTitle:page.sections[0]?.headline||page.title,openingBody:page.sections[0]?.body||"",
   openingImage:page.sections[0]?.image||"/media/evening.webp",
   secondImage:"/media/rigging.webp",secondBody:"Discover how the idea came to life.",
   brief:{heading:"The brief.",body:"",images:[]},
   intention:{heading:"The intention.",body:"",images:[]},
   approach:{heading:"The approach.",body:"",images:[]},
   gallery:[],partners:[]})}>+ Enable cinematic story editing</button></div>;
 const set=(key:keyof CaseExperience,value:unknown)=>save({...story,[key]:value});
 const updateChapter=(key:"brief"|"intention"|"approach",chapter:CaseStoryChapter)=>set(key,chapter);
 return <div className="studio-item">
  <div className="studio-pane-title">Cinematic case study</div>
  <p className="studio-hint">Changes appear in the case-study preview. The homepage design system controls typography, colours and buttons.</p>
  <label className="studio-check"><input type="checkbox" checked={Boolean(story.demo)} onChange={e=>set("demo",e.target.checked)}/> Fictional demonstration data (not a completed client project)</label>
  {field("Opening headline",story.openingTitle,v=>set("openingTitle",v))}
  {field("Opening paragraph",story.openingBody,v=>set("openingBody",v),true)}
  {field("Opening full-screen image URL",story.openingImage,v=>set("openingImage",v))}
  {field("Second scene headline",story.secondTitle||"This is how we made it happen.",v=>set("secondTitle",v))}
  {field("Second scene image URL",story.secondImage,v=>set("secondImage",v))}
  {field("Second scene paragraph",story.secondBody,v=>set("secondBody",v),true)}
  {(["brief","intention","approach"] as const).map(key=>{
   const chapter=story[key];
   const images=chapter.images||[];
   return <div className="studio-item" key={key}>
    <div className="studio-pane-title">{key[0].toUpperCase()+key.slice(1)}</div>
    {field("Heading",chapter.heading,v=>updateChapter(key,{...chapter,heading:v}))}
    {field("Body text",chapter.body,v=>updateChapter(key,{...chapter,body:v}),true)}
    {field("Primary photograph URL",chapter.image??primaryChapterImage(chapter),v=>updateChapter(key,{...chapter,image:v}))}
    {field("Photograph description",chapter.imageAlt||"",v=>updateChapter(key,{...chapter,imageAlt:v}))}
    {images.length>0&&<p className="studio-hint">Previous chapter photos are retained. Changing the primary photograph does not remove them.</p>}

   </div>;
  })}
  <div className="studio-pane-title">Photography gallery after the story</div>
  {story.gallery.map((photo,i)=><div className="studio-item" key={i}>
   {field("Photo "+(i+1)+" URL",photo.src,v=>set("gallery",story.gallery.map((p,j)=>j===i?{...p,src:v}:p)))}
   {field("Photo description",photo.alt,v=>set("gallery",story.gallery.map((p,j)=>j===i?{...p,alt:v}:p)))}
   {(["credit","creditHref","license","licenseHref"] as const).map(k=>field(({credit:"Photo credit",creditHref:"Credit link",license:"Licence",licenseHref:"Licence link"})[k],photo[k]||"",v=>set("gallery",story.gallery.map((p,j)=>j===i?{...p,[k]:v}:p))))}
   <div className="studio-item-actions">
    <button disabled={i===0} type="button" onClick={()=>{const next=[...story.gallery];[next[i-1],next[i]]=[next[i],next[i-1]];set("gallery",next)}}>Move up</button>
    <button type="button" onClick={()=>set("gallery",story.gallery.filter((_,j)=>j!==i))}>Remove</button>
   </div>
  </div>)}
  <button type="button" onClick={()=>set("gallery",[...story.gallery,{id:crypto.randomUUID(),src:"/media/details.webp",alt:"Event photograph"}])}>+ Add gallery photo</button>
  <div className="studio-pane-title">Companies involved</div>
  <p className="studio-hint">This section hides automatically when there are no partners.</p>
  {(story.partners||[]).map((partner,i)=><div className="studio-item" key={i}>
   {(["name","role","logo","href"] as const).map(k=>field(k==="logo"?"Optional logo URL":k==="href"?"Optional website":k,partner[k]||"",v=>set("partners",(story.partners||[]).map((p,j)=>j===i?{...p,[k]:v}:p))))}
   <button type="button" disabled={i===0} onClick={()=>{const next=[...(story.partners||[])];[next[i-1],next[i]]=[next[i],next[i-1]];set("partners",next)}}>Move company up</button>
   <button type="button" disabled={i===(story.partners||[]).length-1} onClick={()=>{const next=[...(story.partners||[])];[next[i+1],next[i]]=[next[i],next[i+1]];set("partners",next)}}>Move company down</button>
   <button type="button" onClick={()=>set("partners",(story.partners||[]).filter((_,j)=>j!==i))}>Remove company</button>
  </div>)}
  <button type="button" onClick={()=>set("partners",[...(story.partners||[]),{name:"New partner",role:"",logo:"",href:""}])}>+ Add company</button>
 </div>;
}
