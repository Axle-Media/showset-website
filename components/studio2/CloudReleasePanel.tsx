"use client";
import {useCallback,useEffect,useState} from "react";
import type {CloudReview,CloudRelease,CloudStore} from "@/lib/studio2/cloud";
import {createBackup,downloadJson} from "@/lib/studio2/storage";

type Props={
  cloud:CloudStore;
  currentRevision:number;
  onRequest:(note:string)=>Promise<number|null>;
  onApprove:(reviewId:number)=>Promise<number|null>;
  onRollback:(releaseId:number,latestReleaseId:number)=>Promise<number|null>;
  onClose:()=>void;
};
export default function CloudReleasePanel({
  cloud,currentRevision,onRequest,onApprove,onRollback,onClose,
}:Props){
  const [reviews,setReviews]=useState<CloudReview[]>([]);
  const [releases,setReleases]=useState<CloudRelease[]>([]);
  const [note,setNote]=useState("");
  const [error,setError]=useState("");
  const [busy,setBusy]=useState(false);
  const [loading,setLoading]=useState(true);
  const canPublish=cloud.role==="owner"||cloud.role==="publisher";
  const refresh=useCallback(async()=>{
    const [incoming,history]=await Promise.all([
      cloud.listReviews(),cloud.listReleases()]);
    setReviews(incoming);setReleases(history);
  },[cloud]);
  useEffect(()=>{
    let mounted=true;
    Promise.all([cloud.listReviews(),cloud.listReleases()])
      .then(([incoming,history])=>{
        if(mounted){setReviews(incoming);setReleases(history);}
      }).catch(e=>{if(mounted)setError((e as Error).message);})
      .finally(()=>{if(mounted)setLoading(false);});
    return ()=>{mounted=false;};
  },[cloud]);
  const perform=async(fn:()=>Promise<unknown>)=>{
    setError("");setBusy(true);
    try{await fn();await refresh();}
    catch(e){setError((e as Error).message);}
    finally{setBusy(false);}
  };
  const pending=reviews.filter(r=>!releases.some(
    release=>release.review_id===r.id
  ));
  const isCurrent=(revision:number)=>revision===currentRevision;
  return <section className="s2-release-panel" aria-label="Private release review">
    <header className="s2-release-head">
      <div><h2>Review and release history</h2>
      <p>Private approval checkpoints only. Public deployment remains separate.</p></div>
      <button type="button" onClick={onClose} aria-label="Close release review"
        className="s2-secondary">Close</button>
    </header>
    {error&&<p role="alert" className="s2-release-error">{error}</p>}
    <p className="s2-hint">Current shared revision: {currentRevision}.
      A request captures the saved server-side snapshot; later edits
      invalidate its approval.</p>
    <form className="s2-release-request" onSubmit={event=>{
      event.preventDefault();
      void perform(async()=>{
        const id=await onRequest(note.trim());
        if(id===null)throw Error("Review request was not saved. Check the editor status.");
        setNote("");
      });
    }}>
      <label htmlFor="s2-review-note">Review note</label>
      <textarea id="s2-review-note" maxLength={1000} rows={2}
        placeholder="What changed, and what should be checked?"
        value={note} onChange={event=>setNote(event.target.value)}/>
      <button type="submit" disabled={busy||loading} className="s2-primary">
        Request review of saved draft
      </button>
    </form>
    <h3>Awaiting review</h3>
    {loading?<p>Loading private release records…</p>:
      pending.length===0?<p className="s2-hint">No outstanding review requests.</p>:
      <div className="s2-release-list">
        {pending.map(review=><article key={review.id} className="s2-release-item">
          <div><strong>Review #{review.id} · revision {review.source_revision}</strong>
            <small>{new Date(review.created_at).toLocaleString("en-ZA")}</small>
            {review.note&&<p>{review.note}</p>}
          </div>
          {canPublish&&<button disabled={busy||!isCurrent(review.source_revision)}
            onClick={()=>void perform(async()=>{
              if(!window.confirm("Approve reviewed revision "+review.source_revision+
                " as an immutable checkpoint? This does not publish the website."))return;
              const result=await onApprove(review.id);
              if(result===null)throw Error("Approval failed. Check the editor status.");
            })}>Approve checkpoint</button>}
          {!isCurrent(review.source_revision)&&
            <span className="s2-hint">Stale: submit a new review</span>}
        </article>)}
      </div>
    }
    <h3>Immutable release history</h3>
    {!loading&&!releases.length&&
      <p className="s2-hint">No approved checkpoints have been created.</p>}
    <div className="s2-release-list">
      {releases.map((release,index)=><article
        key={release.id} className="s2-release-item">
        <div><strong>Checkpoint #{release.id} · revision {release.source_revision}</strong>
          <small>{new Date(release.created_at).toLocaleString("en-ZA")}
            {release.restored_from!==null
              ?" · Restored from #"+release.restored_from
              :" · Approved review #"+release.review_id}
          </small>
        </div>
        <div className="s2-release-actions">
          <button type="button" className="s2-secondary" disabled={busy}
            onClick={()=>void perform(async()=>{
              const snapshot=await cloud.releaseSnapshot(release.id);
              const backup=await createBackup(snapshot,false,
                asset=>cloud.getOriginal(asset));
              downloadJson(backup,"SHOWSET-checkpoint-"+release.id+".json");
            })}>Export verified copy</button>
          {canPublish&&index>0&&
            <button type="button" disabled={busy||
              !releases[0]||releases[0].source_revision!==currentRevision}
              onClick={()=>void perform(async()=>{
                if(!window.confirm("Create a new private checkpoint from #"+
                  release.id+"? This changes the shared draft, not the live website. "+
                  "It is only permitted when the draft matches the latest checkpoint."))return;
                const result=await onRollback(release.id,releases[0].id);
                if(result===null)throw Error("Rollback was blocked. Check the editor status.");
              })}>Restore as new checkpoint</button>}
        </div>
      </article>)}
    </div>
    <p className="s2-hint">Rollback preserves all historical releases.
      It cannot replace an unreviewed draft. A public-site rollback requires
      the separate source build, QA and deployment process.</p>
  </section>;
}
