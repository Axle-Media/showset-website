"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { defaultPages, defaultGlobals } from "@/lib/data";
import type { Workspace, Revision } from "@/lib/studio2/model";
import {CloudConflictError, type CloudStore} from "@/lib/studio2/cloud";
import {SaveCoordinator} from "@/lib/studio2/save-coordinator";
import { assertWorkspace, isLoopback, adoptLegacy } from "@/lib/studio2/model";
import {
  readStore,
  saveWorkspace,
  createBackup,
  downloadJson,
  revisions,
  savePreview,
  ConflictError,
} from "@/lib/studio2/storage";
export function useWorkspace(cloud:CloudStore|null=null) {
  const [workspace, setWorkspace] = useState<Workspace | null>(null),
    [ready, setReady] = useState(false),
    [local, setLocal] = useState<boolean | null>(null),
    [status, setStatus] = useState("Loading local workspace"),
    [error, setError] = useState(""),
    [history, setHistory] = useState<Revision[]>([]),
    [conflict, setConflict] = useState<Workspace | null>(null),
    [undo, setUndo] = useState<Workspace[]>([]),
    [redo, setRedo] = useState<Workspace[]>([]),
    [sequence, setSequence] = useState(0);
  const expected = useRef(0),
    savedSequence = useRef(0),
    saveCoordinator = useRef(new SaveCoordinator()),
    current = useRef(workspace),
    seq = useRef(sequence),
    label = useRef("Edit");
  current.current = workspace;
  seq.current = sequence;
  useEffect(() => {
    if(cloud){
      setLocal(true);
      cloud.read().then((saved)=>{
        if(saved){
          expected.current=saved.revision;
          setWorkspace(saved);
          setReady(true);
          setStatus("Shared draft loaded");
        } else {
          const seeded=adoptLegacy(defaultPages,defaultGlobals,null,null);
          expected.current=0;
          setWorkspace(seeded);
          setReady(true);
          setStatus("New private cloud workspace");
        }
      }).catch(e=>setError("Private draft unavailable: "+(e as Error).message));
      return;
    }
    if (!isLoopback(location.hostname)) {
      setLocal(false);
      return;
    }
    setLocal(true);
    readStore<Workspace>("documents", "draft")
      .then(async (saved) => {
        if (saved) {
          assertWorkspace(saved);
          expected.current = saved.revision;
          setWorkspace(saved);
          setReady(true);
          setStatus("Saved locally");
          setHistory(await revisions());
          return;
        }
        const rawPages = localStorage.getItem("showset-demo-pages"),
          rawGlobals = localStorage.getItem("showset-demo-globals"),
          pages = rawPages ? JSON.parse(rawPages) : null,
          globals = rawGlobals ? JSON.parse(rawGlobals) : null;
        const initial = adoptLegacy(
          defaultPages,
          defaultGlobals,
          pages,
          globals,
        );
        setWorkspace(initial);
        setStatus("Backup required before editing");
      })
      .catch((e) => setError("Your saved data was not changed. " + e.message));
  }, [cloud]);
  const save = useCallback(async () => {
    if (!current.current || !ready || conflict) return false;
    // No-op saves must not create a new revision and invalidate an existing
    // submitted review or an immutable release checkpoint.
    if (expected.current > 0 && savedSequence.current === seq.current) return true;
    return saveCoordinator.current.flush(async () => {
      const value = current.current!;
      const start = seq.current;
      setStatus(cloud ? "Saving to private cloud…" : "Saving locally…");
      setError("");
      try {
        const saved = cloud
          ? await cloud.save(value,expected.current)
          : await saveWorkspace(value, expected.current, label.current);
        expected.current = saved.revision;
        savedSequence.current = start;
        current.current = {
          ...current.current!,
          revision: saved.revision,
          updatedAt: saved.updatedAt,
        };
        setWorkspace(current.current);
        setStatus(start === seq.current
          ? (cloud ? "Saved to private cloud" : "Saved locally")
          : "Unsaved changes");
        if(!cloud){
          setHistory(await revisions());
          const channel = new BroadcastChannel("showset-studio2-updates");
          channel.postMessage({ revision: saved.revision });
          channel.close();
        }
        return true;
      } catch (e) {
        if (e instanceof ConflictError || e instanceof CloudConflictError) {
          setConflict(e.remote);
          // Remote deletion is not a recoverable draft; retain the local copy.
          if (!e.remote) setError("Shared draft was removed; export your work.");
          setStatus("Conflict: newer draft in another tab");
        } else {
          setError((e as Error).message);
          setStatus("Save failed: changes remain in this tab");
        }
        return false;
      }
    }, () => seq.current !== savedSequence.current);
  }, [ready, conflict, cloud]);
  useEffect(() => {
    if (!ready || !workspace || sequence === savedSequence.current || conflict)
      return;
    const timeout = setTimeout(() => {
      void save();
    }, 700);
    return () => clearTimeout(timeout);
  }, [workspace, sequence, ready, save, conflict]);
  useEffect(() => {
    if (!ready || cloud) return;
    const channel = new BroadcastChannel("showset-studio2-updates");
    channel.onmessage = (event) => {
      if (event.data?.revision > expected.current)
        setStatus(
          "A newer draft exists in another tab; save will check for conflicts",
        );
    };
    return () => channel.close();
  }, [ready,cloud]);
  useEffect(() => {
    const leave = (event: BeforeUnloadEvent) => {
      if (seq.current !== savedSequence.current) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", leave);
    return () => window.removeEventListener("beforeunload", leave);
  }, []);
  const edit = (fn: (w: Workspace) => Workspace, description = "Edit") => {
    const previous = current.current;
    if (!previous || !ready || conflict) return false;
    try {
      const next = fn(structuredClone(previous));
      assertWorkspace(next);
      setUndo((p) => [...p.slice(-49), previous]);
      setRedo([]);
      current.current = next;
      setWorkspace(next);
      label.current = description;
      seq.current += 1;
      setSequence(seq.current);
      setStatus("Unsaved changes");
      setError("");
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    }
  };
  const start = async () => {
    if (!workspace) return;
    if(cloud){
      setReady(true);
      setStatus("Private cloud ready");
      return;
    }
    try {
      const backup = await createBackup(workspace);
      downloadJson(backup, "SHOWSET-Studio-before-v2-" + Date.now() + ".json");
      const saved = await saveWorkspace(
        workspace,
        0,
        "Start Studio 2.0 after verified raw backup",
      );
      expected.current = saved.revision;
      setWorkspace(saved);
      setReady(true);
      setStatus("Saved locally");
      setHistory(await revisions());
    } catch (e) {
      setError((e as Error).message);
    }
  };
  const backup = async () => {
    if (!current.current) return false;
    try {
      downloadJson(
        await createBackup(current.current,!cloud,
          cloud ? (asset)=>cloud.getOriginal(asset) : undefined),
        "SHOWSET-Studio2-" + Date.now() + ".json",
      );
      setStatus("Complete backup, including original images, downloaded");
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    }
  };
  const preview = async () => {
    if (!workspace || conflict) return;
    try {
      if (!(await save())) return;
      if(cloud){
        setStatus("Shared draft saved. No public release or deployment.");
        return;
      }
      await savePreview(current.current!);
      setStatus("Local preview saved. No deployment has occurred.");
    } catch (e) {
      setError((e as Error).message);
    }
  };
  const requestReview = async (note:string):Promise<number|null> => {
    if(!cloud || conflict || !ready)return null;
    if(!(await save()))return null;
    try{
      const id=await cloud.requestReview(expected.current,note);
      setStatus("Review #"+id+" requested for saved draft revision "+
        expected.current+". No public deployment.");
      return id;
    }catch(e){
      setError("Review rejected: "+(e as Error).message);return null;
    }
  };
  const approve = async (reviewId:number):Promise<number|null> => {
    if(!cloud || conflict || !ready)return null;
    // Do not silently save new edits on top of an already requested review.
    if(seq.current!==savedSequence.current){
      setError("Save your changes and submit a new review before approval.");
      return null;
    }
    try{
      const release=await cloud.approve(expected.current,reviewId);
      setStatus("Release checkpoint #"+release+
        " approved. Public website NOT deployed.");
      return release;
    }catch(e){
      setError("Approval rejected: "+(e as Error).message);
      return null;
    }
  };
  const rollback = async (
    sourceReleaseId:number,latestReleaseId:number
  ):Promise<number|null> => {
    if(!cloud || conflict || !ready || !current.current)return null;
    if(seq.current!==savedSequence.current){
      setError("Unsaved edits must be backed up and resolved before rollback.");
      return null;
    }
    try{
      const releaseId=await cloud.rollback(
        sourceReleaseId,expected.current,latestReleaseId);
      const restored=await cloud.read();
      if(!restored)throw Error("Rollback completed but shared draft is unreadable.");
      expected.current=restored.revision;
      savedSequence.current=seq.current;
      current.current=restored;
      setWorkspace(restored);
      setUndo([]);setRedo([]);setConflict(null);
      setStatus("Rollback checkpoint #"+releaseId+
        " created from #"+sourceReleaseId+
        ". This does NOT deploy or undo a public website deployment.");
      return releaseId;
    }catch(e){
      setError("Rollback rejected: "+(e as Error).message);
      return null;
    }
  };
  const step = (direction: "undo" | "redo") => {
    if (!workspace || conflict) return;
    const source = direction === "undo" ? undo : redo,
      value = source.at(-1);
    if (!value) return;
    if (direction === "undo") {
      setUndo((p) => p.slice(0, -1));
      setRedo((p) => [...p, workspace]);
    } else {
      setRedo((p) => p.slice(0, -1));
      setUndo((p) => [...p, workspace]);
    }
    current.current = value;
    setWorkspace(value);
    seq.current += 1;
    setSequence(seq.current);
    label.current = direction === "undo" ? "Undo" : "Redo";
    setStatus("Unsaved changes");
  };
  const restore = (revision: Revision) =>
    edit(
      () => structuredClone(revision.workspace),
      "Restore revision " + revision.id,
    );
  const loadConflict = async () => {
    if (!conflict) return;
    if (!(await backup())) return;
    expected.current = conflict.revision;
    current.current = conflict;
    setWorkspace(conflict);
    setConflict(null);
    setUndo([]);
    setRedo([]);
    savedSequence.current = seq.current;
    setStatus("Latest draft loaded; your previous changes were backed up");
  };
  const backupRaw = async () => {
    try {
      downloadJson(
        await createBackup(cloud ? current.current : null, false,
          cloud ? (asset)=>cloud.getOriginal(asset) : undefined),
        "SHOWSET-original-recovery-" + Date.now() + ".json",
      );
    } catch (e) {
      setError((e as Error).message);
    }
  };
  return {
    backupRaw,
    workspace,
    ready,
    local,
    status,
    error,
    setError,
    history,
    conflict,
    canUndo: !!undo.length,
    canRedo: !!redo.length,
    edit,
    start,
    save,
    backup,
    preview,
    approve,
    requestReview,
    rollback,
    step,
    restore,
    loadConflict,
    revision: expected.current,
  };
}
