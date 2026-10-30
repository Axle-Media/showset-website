const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const ts=require("typescript");
const validationModule={exports:{}};
const validationScript=ts.transpileModule(
  fs.readFileSync("lib/studio2/image-validation.ts","utf8"),{
    compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022},
  }).outputText;
vm.runInNewContext("(function(exports,module){"+validationScript+"\n})")(
  validationModule.exports,validationModule
);
const source=fs.readFileSync("lib/studio2/cloud.ts","utf8");
const transpiled=ts.transpileModule(source,{
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022},
}).outputText;
const database={row:null,releases:[],reviews:[],users:new Map()};
const response=(value,status=200,headers={"content-type":"application/json"})=>
  new Response(status===204?null:JSON.stringify(value),{status,headers});
let calls=[];
async function fakeFetch(url,init){
  const path=new URL(url).pathname;
  calls.push({path,method:init.method||"GET",headers:init.headers});
  if(path==="/auth/v1/token"){
    const credentials=JSON.parse(init.body);
    const identity=credentials.email==="owner@showset.test"
      ? {id:"owner-id",email:"owner@showset.test",role:"owner"}
      : {id:"editor-id",email:"editor@showset.test",role:"editor"};
    database.users.set(identity.id,identity);
    return response({access_token:"token-"+identity.id,
      refresh_token:"refresh-"+identity.id,expires_in:3600,
      token_type:"bearer",user:{id:identity.id,email:identity.email}});
  }
  const uid=(init.headers.Authorization||"").replace("Bearer token-","");
  const identity=database.users.get(uid);
  if(!identity)return response({message:"Not authenticated"},401);
  if(path.endsWith("/showset_studio_members"))
    return response([{role:identity.role,active:true}]);
  if(path.endsWith("/showset_studio_workspaces")){
    if(init.method==="POST"){
      if(database.row)return response({message:"duplicate key"},409);
      database.row=JSON.parse(init.body);return response([database.row],201);
    }
    if(init.method==="PATCH"){
      const expected=Number(new URL(url).searchParams.get("revision").slice(3));
      if(!database.row||database.row.revision!==expected)return response([]);
      database.row=JSON.parse(init.body);return response([database.row]);
    }
    return response(database.row?[database.row]:[]);
  }
  if(path.endsWith("/showset_studio_reviews"))
    return response([...database.reviews].reverse());
  if(path.endsWith("/showset_studio_releases")){
    const query=new URL(url).searchParams;
    const wanted=query.get("id");
    const rows=wanted?database.releases.filter(r=>r.id===Number(wanted.slice(3)))
      :[...database.releases].reverse();
    return response(query.get("select")?.includes("snapshot")?rows:
      rows.map(({snapshot,...entry})=>entry));
  }
  if(path.endsWith("/rpc/showset_studio_request_review")){
    const {p_expected_revision,p_note}=JSON.parse(init.body);
    if(p_expected_revision!==database.row?.revision)
      return response({message:"Draft changed"},409);
    if(database.reviews.some(r=>r.source_revision===p_expected_revision))
      return response({message:"Duplicate review"},409);
    const id=database.reviews.length+1;
    database.reviews.push({id,source_revision:p_expected_revision,
      note:p_note,requested_by:uid,created_at:"2026-10-30T00:00:00Z",
      snapshot:structuredClone(database.row.document)});
    return response(id);
  }
  if(path.endsWith("/rpc/showset_studio_publish")){
    if(identity.role!=="owner")return response({message:"Permission denied"},403);
    const {p_expected_revision,p_review_id}=JSON.parse(init.body);
    const review=database.reviews.find(r=>r.id===p_review_id);
    if(p_expected_revision!==database.row?.revision || !review ||
       review.source_revision!==p_expected_revision ||
       JSON.stringify(review.snapshot)!==JSON.stringify(database.row.document))
      return response({message:"Stale review"},409);
    if(database.releases.some(r=>r.source_revision===p_expected_revision))
      return response({message:"Duplicate release"},409);
    const id=database.releases.length+1;
    database.releases.push({id,source_revision:p_expected_revision,
      snapshot:structuredClone(database.row.document),published_by:uid,
      review_id:p_review_id,restored_from:null,created_at:"2026-10-30T00:00:00Z"});
    return response(id);
  }
  if(path.endsWith("/rpc/showset_studio_rollback")){
    if(identity.role!=="owner")return response({message:"Permission denied"},403);
    const {p_source_release_id,p_expected_revision,
      p_expected_latest_release_id}=JSON.parse(init.body);
    const latest=database.releases.at(-1),
      previous=database.releases.find(r=>r.id===p_source_release_id);
    if(!previous || !latest || latest.id!==p_expected_latest_release_id ||
       latest.id===p_source_release_id ||
       p_expected_revision!==database.row?.revision ||
       latest.source_revision!==database.row.revision ||
       JSON.stringify(latest.snapshot)!==JSON.stringify(database.row.document))
      return response({message:"Rollback blocked"},409);
    const revision=database.row.revision+1;
    const restored={...structuredClone(previous.snapshot),revision,
      updatedAt:"2026-10-30T00:00:01Z"};
    database.row={...database.row,revision,document:restored};
    const id=database.releases.length+1;
    database.releases.push({id,source_revision:revision,snapshot:restored,
      published_by:uid,review_id:null,restored_from:p_source_release_id,
      created_at:"2026-10-30T00:00:01Z"});
    return response(id);
  }
  if(path.includes("/object/showset-studio-media/"))
    return response({Key:"site/test"},201);
  return response({message:"Unknown route"},404);
}
const sandboxModule={exports:{}};
const load=vm.runInNewContext(
  "(function(exports,require,module,process,fetch,URL,Blob,Date){"+
    transpiled+"\n})",
  {Response,Uint8Array},
);
load(sandboxModule.exports,(name)=>{
  if(name==="./image-validation")return validationModule.exports;
  if(name==="./model")return {assertWorkspace:(workspace)=>{
    assert.equal(workspace.schemaVersion,2);
  }};
  throw Error("Unexpected module "+name);
},sandboxModule,{
  env:{
    NEXT_PUBLIC_SHOWSET_SUPABASE_URL:"https://showset-test.supabase.co",
    NEXT_PUBLIC_SHOWSET_SUPABASE_PUBLISHABLE_KEY:"sb_publishable_test",
  },
},fakeFetch,URL,Blob,Date);
const {CloudStore,CloudConflictError,cloudConfig}=sandboxModule.exports;
(async()=>{
  const config=cloudConfig();
  assert.ok(config);
  const owner=new CloudStore(config),editor=new CloudStore(config);
  await owner.signIn("owner@showset.test","secret");
  await editor.signIn("editor@showset.test","secret");
  assert.equal(owner.role,"owner");assert.equal(editor.role,"editor");
  assert.equal(await owner.read(),null);
  const document={schemaVersion:2,revision:0,pages:{home:{}},
    media:[],globals:{theme:{}},updatedAt:""};
  const first=await owner.save(document,0);
  assert.equal(first.revision,1);
  const stale=await editor.read();
  assert.equal(stale.revision,1);
  const next=await owner.save(first,1);
  assert.equal(next.revision,2);
  await assert.rejects(()=>editor.save(stale,1),CloudConflictError);
  const reviewId=await editor.requestReview(2,"Ready for review");
  assert.equal(reviewId,1);
  assert.equal((await owner.listReviews()).length,1);
  await assert.rejects(()=>editor.approve(2,reviewId),/Publisher role required/);
  const checkpoint=await owner.approve(2,reviewId);
  assert.equal(checkpoint,1);
  assert.equal(database.releases.length,1);
  assert.equal(database.releases[0].source_revision,2);
  assert.equal((await owner.releaseSnapshot(1)).revision,2);
  const changed=await owner.save(next,2);
  await assert.rejects(()=>owner.approve(3,reviewId),/Stale review/);
  await assert.rejects(()=>owner.rollback(1,3,1),/Rollback blocked/);
  const review2=await editor.requestReview(3,"Second release");
  const second=await owner.approve(3,review2);
  assert.equal(second,2);
  const restoreId=await owner.rollback(1,3,2);
  assert.equal(restoreId,3);
  assert.equal((await owner.read()).revision,4);
  assert.equal((await owner.listReleases())[0].restored_from,1);
  await assert.rejects(()=>owner.rollback(1,4,2),/Rollback blocked/);
  assert.equal(changed.revision,3);
  assert.ok(calls.every(c=>!JSON.stringify(c.headers).includes("service_role")));
  assert.ok(calls.some(c=>c.path==="/auth/v1/token"&&!c.headers.Authorization),
    "sign-in sends publishable key, never forged JWT");
  owner.signOut();
  await assert.rejects(()=>owner.read(),/Sign in/);
  console.log("PASS cloud invite roles, auth, CAS conflicts, publisher-only immutable snapshots and no service credentials.");
})().catch(e=>{console.error(e);process.exitCode=1});
