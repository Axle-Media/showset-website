const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const ts=require("typescript");
const source=fs.readFileSync("lib/studio2/save-coordinator.ts","utf8");
const output=ts.transpileModule(source,{compilerOptions:{
  module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,
}}).outputText;
const mod={exports:{}};
vm.runInNewContext("(function(exports,module){"+output+"\n})")(mod.exports,mod);
const {SaveCoordinator}=mod.exports;

async function test(){
  // A preview requested while autosave is pending must wait for the save;
  // it must not fail or create an unnecessary second revision.
  let sequence=1,saved=0,writes=0,active=0,maxActive=0;
  const releases=[];
  const persist=async()=>{
    writes++;active++;maxActive=Math.max(maxActive,active);
    const captured=sequence;
    await new Promise(resolve=>releases.push(resolve));
    saved=captured;active--;return true;
  };
  const coordinator=new SaveCoordinator();
  const dirty=()=>sequence!==saved;
  const initial=coordinator.flush(persist,dirty);
  const preview=coordinator.flush(persist,dirty);
  assert.equal(writes,1,"Preview must reuse the in-progress autosave");
  releases.shift()();
  assert.equal(await initial,true);
  assert.equal(await preview,true);
  assert.equal(writes,1,"No redundant write after an already-finished save");

  // A user edit during the first save requires a second sequential write
  // before a waiting preview/approval can claim the new content is saved.
  sequence=2;
  const oldSave=coordinator.flush(persist,dirty);
  sequence=3;
  const approval=coordinator.flush(persist,dirty);
  assert.equal(writes,2);
  releases.shift()();
  assert.equal(await oldSave,true);
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(writes,3,"Waiting approval must flush the newer edit");
  assert.equal(maxActive,1,"No two writes to the same draft may overlap");
  assert.equal(saved,2);
  releases.shift()();
  assert.equal(await approval,true);
  assert.equal(saved,3,"Approved content must match the latest saved revision");

  // A failed request must propagate failure to waiters, without retrying
  // under the same optimistic revision or publishing stale content.
  const rejectCoordinator=new SaveCoordinator();
  let failureWrites=0,releaseFailure;
  const fail=async()=>{
    failureWrites++;
    await new Promise(resolve=>{releaseFailure=resolve;});
    return false;
  };
  const first=rejectCoordinator.flush(fail,()=>true);
  const second=rejectCoordinator.flush(fail,()=>true);
  releaseFailure();
  assert.equal(await first,false);
  assert.equal(await second,false);
  assert.equal(failureWrites,1,"Failed write must not be retried silently");
  assert.equal(await rejectCoordinator.flush(async()=>{failureWrites++;return true},()=>false),true);
  assert.equal(failureWrites,2,"Explicit retry remains possible");
  console.log("PASS Studio concurrent saves serialised; preview waits; newer edits flush; failed saves halt release.");
}
test().catch(error=>{console.error(error);process.exitCode=1;});
