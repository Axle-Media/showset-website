const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const os=require("node:os");
const crypto=require("node:crypto");
const {execFileSync}=require("node:child_process");
const root=fs.mkdtempSync(path.join(os.tmpdir(),"showset-studio-release-"));
const bytes=Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9WlQzXkAAAAASUVORK5CYII=",
  "base64"
);
const hash=crypto.createHash("sha256").update(bytes).digest("hex");
const id="asset-"+hash;
const workspace={
  schemaVersion:2,revision:4,
  pages:{home:{slug:"home",route:"/",sections:[{id:"1",type:"hero",
    image:"asset:"+id,items:[]}] }},
  globals:{theme:{navy:"#0D2F49"},header:{links:[]}},
  media:[{id,name:"test.png",type:"image/png",size:bytes.length,
    width:1,height:1,alt:"Test",createdAt:"2026-10-29T00:00:00Z",tags:[]}],
  updatedAt:"2026-10-29T00:00:00Z",
};
const body={format:"showset-studio2-backup",version:2,
  at:"2026-10-29T00:00:00Z",origin:"https://staging.test",
  records:{},assets:[{id,type:"image/png",base64:bytes.toString("base64")}],
  workspace,
};
const checksum=crypto.createHash("sha256").update(JSON.stringify(body)).digest("hex");
const backup=path.join(root,"approved.json");
fs.writeFileSync(backup,JSON.stringify({...body,checksum}));
const script="scripts/prepare-studio-release.mjs";
try{
  const target=path.join(root,"stage");
  const dry=execFileSync(process.execPath,[script,backup,"--dry-run",
    "--target",target],{encoding:"utf8"});
  assert.match(dry,/No website source or public assets were modified/);
  assert.ok(!fs.existsSync(target));
  const applied=execFileSync(process.execPath,[script,backup,"--apply",
    "--target",target],{encoding:"utf8"});
  assert.match(applied,/no deployment performed/);
  const pages=JSON.parse(fs.readFileSync(path.join(target,"content/pages.json"),"utf8"));
  const relative="/media/studio/"+id+".png";
  assert.equal(pages.home.sections[0].image,relative);
  assert.deepEqual(fs.readFileSync(path.join(target,"public",relative.slice(1))),bytes);
  // Checksum tampering is rejected before any source write.
  const bad=path.join(root,"tampered.json");
  fs.writeFileSync(bad,JSON.stringify({...body,checksum:"0".repeat(64)}));
  assert.throws(()=>execFileSync(process.execPath,
    [script,bad,"--apply","--target",path.join(root,"bad-target")],
    {stdio:"pipe"}),/Command failed/);
  assert.ok(!fs.existsSync(path.join(root,"bad-target")));
  console.log("PASS signed-off backup verification, safe dry-run, original media rewrite and tamper rejection.");
}finally{fs.rmSync(root,{recursive:true,force:true});}
