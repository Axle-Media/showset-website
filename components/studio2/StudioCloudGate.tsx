"use client";
import {useState} from "react";
import Studio2 from "./Studio2";
import {cloudConfig,CloudStore,type CloudRole} from "@/lib/studio2/cloud";
import "./studio2.css";

/** Invite-only shared staging. Passwords are sent directly to Supabase Auth;
 * the editor itself receives only a scoped in-memory session object. */
export default function StudioCloudGate(){
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [client,setClient]=useState<CloudStore|null>(null);
  const [owner,setOwner]=useState<{email:string;role:CloudRole}|null>(null);
  const [error,setError]=useState("");
  const [busy,setBusy]=useState(false);
  const config=cloudConfig();
  if(!config)
    return <main className="studio2 s2-unavailable">
      <h1>Private SHOWSET Studio is not configured.</h1>
      <p>The public website remains available. Cloud editing is disabled.</p>
    </main>;
  if(!client)
    return <main className="studio2 s2-welcome" style={{minHeight:"100svh"}}>
      <img src="/brand/approved-wordmark.png" alt="SHOWSET"/>
      <p className="s2-eyebrow">SHOWSET · Private staging</p>
      <h1>Welcome to the studio.</h1>
      <p>Owner accounts only. Changes remain private until approved and
        deployed through the separate release process.</p>
      <form style={{display:"grid",gap:14,width:"min(100%,410px)",textAlign:"left"}}
        onSubmit={async event=>{
          event.preventDefault();
          setBusy(true);setError("");
          const next=new CloudStore(config);
          try{
            const identity=await next.signIn(email.trim(),password);
            setOwner({email:identity.email,role:identity.role});
            setClient(next);setPassword("");
          }catch(e){setError((e as Error).message);}
          finally{setBusy(false);}
        }}>
        <label htmlFor="showset-cloud-email">Owner email</label>
        <input id="showset-cloud-email" type="email" autoComplete="username"
          required maxLength={254} value={email}
          onChange={e=>setEmail(e.target.value)}/>
        <label htmlFor="showset-cloud-password">Password</label>
        <input id="showset-cloud-password" type="password" autoComplete="current-password"
          required value={password} onChange={e=>setPassword(e.target.value)}/>
        {error&&<p role="alert">{error}</p>}
        <button type="submit" className="s2-primary" disabled={busy}>
          {busy?"Checking permissions…":"Sign in to private Studio"}
        </button>
      </form>
      <p className="s2-hint">No public registration. An owner must invite and
        authorise each account.</p>
    </main>;
  return <>
    <div className="s2-cloud-session" role="status">
      Private staging · {owner?.email} · {owner?.role}
      <button onClick={()=>{
        client.signOut();setClient(null);setOwner(null);setPassword("");
      }}>Sign out</button>
    </div>
    <Studio2 cloud={client}/>
  </>;
}
