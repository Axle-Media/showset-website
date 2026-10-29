"use client";
import {useState} from "react";
import type {MediaAsset,Workspace} from "@/lib/studio2/model";
import {mediaUsage,parseTags,searchMedia} from "@/lib/studio2/media-usage";
import {DraftField} from "./Inspector";

export default function MediaManager({
  media,workspace,urls,query,onUpload,onUpdate,onUse,canUse,
}:{
  media:MediaAsset[];
  workspace:Workspace;
  urls:Record<string,string>;
  query:string;
  onUpload:(file:File)=>void;
  onUpdate:(id:string,change:{name?:string;alt?:string;tags?:string[]})=>void;
  onUse:(asset:MediaAsset)=>void;
  canUse:boolean;
}){
  const [tag,setTag]=useState("");
  const [order,setOrder]=useState("recent");
  const [error,setError]=useState("");
  const tags=[...new Set(media.flatMap(asset=>asset.tags))].sort();
  const filtered=searchMedia(media,query,tag).sort((a,b)=>
    order==="name" ? a.name.localeCompare(b.name):
    b.createdAt.localeCompare(a.createdAt)
  );
  return <div className="s2-media-manager">
    <label className="s2-upload">
      Upload original photographs
      <input type="file" accept="image/png,image/jpeg,image/webp" multiple
        onChange={e=>{
          const files=[...e.target.files||[]];
          e.target.value="";
          files.forEach(onUpload);
        }}/>
    </label>
    <div className="s2-media-filters">
      <label className="s2-field">Tag
        <select aria-label="Filter by tag" value={tag}
          onChange={e=>setTag(e.target.value)}>
          <option value="">All tags</option>
          {tags.map(item=><option key={item} value={item}>{item}</option>)}
        </select>
      </label>
      <label className="s2-field">Sort
        <select aria-label="Sort media" value={order}
          onChange={e=>setOrder(e.target.value)}>
          <option value="recent">Newest first</option>
          <option value="name">Name A–Z</option>
        </select>
      </label>
    </div>
    {error && <p className="s2-hint" role="alert">{error}</p>}
    <p className="s2-hint">{filtered.length} original{filtered.length===1?"":"s"}
      {canUse ? " · select Use image to replace the selected photograph":
        " · select an image or gallery item first to replace it"}</p>
    <div className="s2-media-list">
      {filtered.map(asset=>{
        const usage=mediaUsage(workspace,asset.id);
        return <section className="s2-media-card" key={asset.id}>
          {urls[asset.id] && <img src={urls[asset.id]} alt={asset.alt||asset.name}
            loading="lazy"/>}
          <div className="s2-media-meta">
            <strong>{asset.name}</strong>
            <small>{asset.width} × {asset.height} · original retained</small>
            <small>{usage.total} reference{usage.total===1?"":"s"}
              {usage.pages.length ? " · "+usage.pages.map(p=>p.title).join(", "):""}
              {usage.reusable ? " · saved templates":""}
              {usage.global ? " · global branding":""}
            </small>
          </div>
          <button type="button" disabled={!canUse}
            onClick={()=>onUse(asset)} className="s2-secondary">Use image</button>
          <details>
            <summary>Details and tags</summary>
            <label className="s2-field">Library name
              <DraftField value={asset.name} onCommit={value=>{
                const name=value.trim();
                if(!name||name.length>180){
                  setError("Image names must contain 1–180 characters.");return;
                }
                setError("");onUpdate(asset.id,{name});
              }}/>
            </label>
            <label className="s2-field">Default alt text
              <DraftField value={asset.alt} onCommit={value=>{
                if(value.length>500){setError("Alt text is too long.");return;}
                setError("");onUpdate(asset.id,{alt:value});
              }} multi/>
            </label>
            <label className="s2-field">Tags (comma-separated)
              <DraftField value={asset.tags.join(", ")} onCommit={value=>{
                try{onUpdate(asset.id,{tags:parseTags(value)});setError("");}
                catch(e){setError((e as Error).message);}
              }}/>
            </label>
            <p className="s2-hint">
              Renaming or tagging does not change the image bytes or any
              existing page placement. No shared original is deleted here.
            </p>
          </details>
        </section>;
      })}
      {!filtered.length && <p className="s2-hint">No original images match your filters.</p>}
    </div>
  </div>;
}
