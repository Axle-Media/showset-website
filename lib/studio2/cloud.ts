import type {MediaAsset,Workspace} from "./model";
import {assertWorkspace} from "./model";
import {detectedImageMime,imageDimensions} from "./image-validation";

/**
 * Hosting-independent, browser-facing SHOWSET cloud transport. Supabase
 * publishable keys are public. No service role, privileged SQL or access
 * decision is ever shipped into the browser. Database and Storage RLS are
 * the authority for every operation.
 */
export type CloudRole="owner"|"editor"|"publisher";
type Session={
  access_token:string;refresh_token:string;expires_in:number;
  token_type:string;user:{id:string;email?:string};
};
type DocumentRow={revision:number;document:Workspace};
const URL_KEY="NEXT_PUBLIC_SHOWSET_SUPABASE_URL";
const PUBLIC_KEY="NEXT_PUBLIC_SHOWSET_SUPABASE_PUBLISHABLE_KEY";
export const cloudConfig=()=>{
  const url=process.env.NEXT_PUBLIC_SHOWSET_SUPABASE_URL || "";
  const key=process.env.NEXT_PUBLIC_SHOWSET_SUPABASE_PUBLISHABLE_KEY || "";
  if (!/^https:\/\/[a-z0-9.-]+\.supabase\.co$/i.test(url)||!key)
    return null;
  return {url,key};
};
export class CloudConflictError extends Error {
  constructor(readonly remote:Workspace | null) {
    super("A newer shared draft exists. Export your changes before reloading.");
  }
}
export class CloudStore {
  private session:Session|null=null;
  private expiresAt=0;
  role:CloudRole|null=null;
  constructor(readonly config:{url:string;key:string}){}
  private async token():Promise<string>{
    if(!this.session)throw Error("Sign in to SHOWSET Studio.");
    if(Date.now()+60000 < this.expiresAt)return this.session.access_token;
    const data=await this.request<Session>("/auth/v1/token?grant_type=refresh_token",
      {method:"POST",body:JSON.stringify({refresh_token:this.session.refresh_token}),
        headers:{"Content-Type":"application/json"}},false);
    this.session=data;
    this.expiresAt=Date.now()+(data.expires_in||3600)*1000;
    return data.access_token;
  }
  private async request<T>(
    path:string,options:RequestInit={},authenticated=true,
  ):Promise<T>{
    const authorization=authenticated ? await this.token():null;
    const response=await fetch(this.config.url+path,{
      ...options,
      cache:"no-store",
      headers:{
        apikey:this.config.key,
        ...(authorization ? {Authorization:"Bearer "+authorization}:{}),
        ...options.headers,
      },
    });
    if(!response.ok){
      let message="Cloud request failed ("+response.status+").";
      try{
        const details=await response.json() as {message?:string;error_description?:string};
        message=details.message||details.error_description||message;
      }catch{}
      throw Error(message);
    }
    if(response.status===204)return undefined as T;
    const type=response.headers.get("content-type")||"";
    if(!type.includes("json"))return await response.blob() as T;
    return await response.json() as T;
  }
  async signIn(email:string,password:string):Promise<{id:string;email:string;role:CloudRole}>{
    const response=await this.request<Session>(
      "/auth/v1/token?grant_type=password",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({email,password}),
      },false,
    );
    this.session=response;
    this.expiresAt=Date.now()+response.expires_in*1000;
    try{
      const members=await this.request<{role:CloudRole;active:boolean}[]>(
        "/rest/v1/showset_studio_members?select=role,active&user_id=eq."+
          encodeURIComponent(response.user.id),
        {headers:{Accept:"application/json"}},
      );
      const member=members.find(m=>m.active);
      if(!member)throw Error("This account has not been invited to SHOWSET Studio.");
      this.role=member.role;
      return {id:response.user.id,email:response.user.email||email,role:member.role};
    }catch(error){
      await this.signOut();
      throw error;
    }
  }
  async signOut(){
    // Invalidate the editor immediately, before awaiting the network. No
    // pending request can reuse the in-memory credentials after logout.
    const token=this.session?.access_token;
    this.session=null;this.role=null;this.expiresAt=0;
    if(!token)return;
    try{
      await fetch(this.config.url+"/auth/v1/logout",{
        method:"POST",cache:"no-store",
        headers:{apikey:this.config.key,Authorization:"Bearer "+token},
      });
    }catch{
      // Clearing the in-memory session remains mandatory even if offline.
    }
  }
  private writable(){
    if(!this.role||!["owner","editor","publisher"].includes(this.role))
      throw Error("SHOWSET editor permissions required.");
  }
  async read():Promise<Workspace|null>{
    const rows=await this.request<DocumentRow[]>(
      "/rest/v1/showset_studio_workspaces?select=revision,document&id=eq.site",
      {headers:{Accept:"application/json"}},
    );
    if(!rows.length)return null;
    const value={...rows[0].document,revision:rows[0].revision};
    assertWorkspace(value);
    return value;
  }
  async save(value:Workspace,expected:number):Promise<Workspace>{
    this.writable();
    assertWorkspace(value);
    if(!Number.isInteger(expected)||expected<0)throw Error("Invalid expected revision.");
    const revision=expected+1;
    const next:Workspace={...value,revision,updatedAt:new Date().toISOString()};
    const body={id:"site",revision,document:next,updated_by:this.session!.user.id,
      updated_at:next.updatedAt};
    const path="/rest/v1/showset_studio_workspaces"+(expected
      ? "?id=eq.site&revision=eq."+expected:"");
    try{
      const rows=await this.request<DocumentRow[]>(path,{
        method:expected?"PATCH":"POST",
        headers:{"Content-Type":"application/json",
          Prefer:"return=representation"},
        body:JSON.stringify(body),
      });
      if(rows.length!==1)throw new CloudConflictError(await this.read());
      return {...next,revision:rows[0].revision};
    }catch(error){
      if(error instanceof CloudConflictError)throw error;
      // Initial insert races and unique-constraint conflicts also need a
      // remote snapshot, never a blind overwrite.
      if((error as Error).message.includes("duplicate key"))
        throw new CloudConflictError(await this.read());
      throw error;
    }
  }
  async latestApprovedRelease():Promise<{id:number;workspace:Workspace}|null>{
    const records=await this.request<{id:number;source_revision:number;
      snapshot:Workspace}[]>(
      "/rest/v1/showset_studio_releases?select=id,source_revision,snapshot&order=id.desc&limit=1"
    );
    if(!records.length)return null;
    const result=records[0],workspace={...result.snapshot,
      revision:result.source_revision};
    assertWorkspace(workspace);
    return {id:result.id,workspace};
  }
  async approve(expectedRevision:number):Promise<number>{
    if(!this.role||!["owner","publisher"].includes(this.role))
      throw Error("Publisher role required.");
    const id=await this.request<number>(
      "/rest/v1/rpc/showset_studio_publish",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({p_expected_revision:expectedRevision}),
      },
    );
    return id;
  }
  async putOriginal(file:File,id:string):Promise<void>{
    this.writable();
    if(!/^asset-[a-f0-9]{64}$/.test(id))
      throw Error("Invalid original media identifier.");
    if(file.size>8*1024*1024||
      !["image/jpeg","image/png","image/webp"].includes(file.type))
      throw Error("Only JPEG, PNG or WebP images up to 8 MB may be uploaded.");
    // MIME labels are user-controlled. Also validate the actual binary
    // signature and dimensions when called outside the normal image picker.
    const bytes=new Uint8Array(await file.arrayBuffer());
    if(detectedImageMime(bytes)!==file.type)
      throw Error("Original bytes do not match a supported image MIME type.");
    imageDimensions(bytes,file.type);
    // Media originals are immutable and addressed by their SHA-256 bytes.
    const digest=[...new Uint8Array(await crypto.subtle.digest(
      "SHA-256",bytes))]
      .map(byte=>byte.toString(16).padStart(2,"0")).join("");
    if(id!=="asset-"+digest)
      throw Error("Original image does not match its content-addressed ID.");
    try{
      await this.request(
        "/storage/v1/object/showset-studio-media/site/"+encodeURIComponent(id),{
          method:"POST",headers:{"Content-Type":file.type,"x-upsert":"false"},
          body:file,
        },
      );
    }catch(error){
      // Content-addressed originals are immutable, so the same photograph
      // may already have been uploaded by another authorised owner.
      if(!/already exists|duplicate/i.test((error as Error).message))
        throw error;
      const existing=await this.getOriginal({id});
      const digest=[...new Uint8Array(await crypto.subtle.digest(
        "SHA-256",await existing.arrayBuffer()))]
        .map(byte=>byte.toString(16).padStart(2,"0")).join("");
      if(id!=="asset-"+digest)
        throw Error("Remote original has a different checksum.");
    }
  }
  async getOriginal(asset:Pick<MediaAsset,"id">):Promise<Blob>{
    if(!/^asset-[a-f0-9]{64}$/.test(asset.id))
      throw Error("Invalid media ID in shared workspace.");
    const original=await this.request<Blob>(
      "/storage/v1/object/authenticated/showset-studio-media/site/"+
        encodeURIComponent(asset.id),
    );
    if(original.size>8*1024*1024)
      throw Error("Private original exceeds the media size limit.");
    const bytes=new Uint8Array(await original.arrayBuffer());
    const detected=detectedImageMime(bytes);
    if(!detected)
      throw Error("Private original is not a supported image.");
    imageDimensions(bytes,detected);
    const digest=[...new Uint8Array(await crypto.subtle.digest(
      "SHA-256",bytes))]
        .map(byte=>byte.toString(16).padStart(2,"0")).join("");
    if(asset.id!=="asset-"+digest)
      throw Error("Private original checksum does not match its media ID.");
    return original;
  }
  async imageUrls(media:MediaAsset[]):Promise<Record<string,string>>{
    const blobs=await Promise.all(media.map(async(asset)=>({
      id:asset.id,blob:await this.getOriginal(asset),
    })));
    const urls:Record<string,string>={};
    try{
      for(const value of blobs)
        urls[value.id]=URL.createObjectURL(value.blob);
      return urls;
    }catch(error){
      Object.values(urls).forEach(url=>URL.revokeObjectURL(url));
      throw error;
    }
  }
}
