const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const ts=require("typescript");
const {parseHTML}=require("linkedom");
const source=fs.readFileSync("lib/studio2/template-extensions.ts","utf8");
const transpiled=ts.transpileModule(source,{compilerOptions:{
  module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022
}}).outputText;
const sandboxModule={exports:{}};
vm.runInNewContext("(function(exports,require,module){"+transpiled+"\n})",{})(
  sandboxModule.exports,(path)=>{
    if(path==="./render")return {renderNodes:(roots)=>roots.map(
      n=>'<section class="s2-node-section" data-builder-node="'+n.id+'"><h2>'+
        n.children?.[0]?.props?.text+'</h2></section>'
    ).join("")};
    if(path==="./native-rebuild")return {
      activeNativeReplacements:(p)=>(p.builder?.replacedNative||[]).flatMap(sourceId=>{
        const id=p.builder.nativeReplacementNodes?.[sourceId];
        const node=p.builder.roots.find(root=>root.id===id);
        return node&&!node.hidden?[{sourceId,node}]:[];
      }),
      syncNativeReplacementVisibility:(host,p)=>{
        const active=new Set((p.builder?.replacedNative||[]).filter(id=>{
          const node=p.builder.roots.find(root=>root.id===
            p.builder.nativeReplacementNodes?.[id]);
          return node&&!node.hidden;
        }));
        host.querySelectorAll("[data-service-section]").forEach(n=>{
          n.style.display=active.has(n.dataset.serviceSection)?"none":"";
        });
      },
    };
    throw Error("Unexpected module "+path);
  },sandboxModule);
const {applyTemplateExtensions}=sandboxModule.exports;
const {document}=parseHTML('<html><body><div id="host"><div class="view" data-view="service">'+
  '<div class="service-experience"><div class="service-intro" data-service-section="section-2">'+
  '<h2>Original introduction</h2></div><div class="service-close">Final CTA</div></div></div></div></body></html>');
const host=document.querySelector("#host");
const base={route:"/events-experiences/",builder:{mode:"template",
  replacedNative:["section-2"],nativeReplacementNodes:{"section-2":"approved-chapter"},
  roots:[{id:"approved-chapter",kind:"section",
    children:[{props:{text:"Owner-approved chapter"}}]}]}};
let container=applyTemplateExtensions(host,base);
assert.ok(container);
assert.equal(container.nextElementSibling.className,"service-intro",
  "Rebuilt introduction must remain at the introduction, not jump before the closing CTA");
assert.equal(container.dataset.studio2NativeExtension,"section-2");
assert.match(host.innerHTML,/Owner-approved chapter/);
assert.equal(host.querySelector(".service-intro").style.display,"none");
const same=container.querySelector("section");
container=applyTemplateExtensions(host,base);
assert.equal(container.querySelector("section"),same,
  "A selection-only rerender must not destroy an unchanged chapter");
const revised=structuredClone(base);
revised.builder.roots[0].children[0].props.text="A revised chapter";
container=applyTemplateExtensions(host,revised);
assert.match(container.textContent,/A revised chapter/);
const restored=structuredClone(revised);
restored.builder.replacedNative=[];
container=applyTemplateExtensions(host,restored);
assert.equal(host.querySelector(".service-intro").style.display,"");
assert.equal(host.querySelectorAll("[data-studio2-native-extension]").length,0,
  "Restoring the original removes its on-page replacement without deleting content");
assert.equal(container,null);
const archived=structuredClone(restored);
archived.builder.roots[0].hidden=true;
assert.equal(applyTemplateExtensions(host,archived),null,
  "Archived-only restored sections must leave no empty wrapper");
const cleared=structuredClone(restored);
cleared.builder.roots=[];
assert.equal(applyTemplateExtensions(host,cleared),null);
assert.equal(host.querySelectorAll(".s2-template-extensions").length,0);
// Additional owner sections still stay before the approved final CTA.
const added=structuredClone(base);
added.builder.roots.push({id:"new-section",kind:"section",
  children:[{props:{text:"New independent chapter"}}]});
container=applyTemplateExtensions(host,added);
assert.equal(container.dataset.studio2TemplateExtensions,"true");
assert.equal(container.nextElementSibling.className,"service-close");
assert.equal(host.querySelector('[data-studio2-native-extension="section-2"]')
  .nextElementSibling.className,"service-intro");
assert.equal(host.querySelectorAll(".s2-template-extensions > section").length,2);
assert.match(host.innerHTML,/New independent chapter/);
// Unmapped legacy originals are not suppressed, even if a replacement ID is recorded.
const missing=structuredClone(base);
missing.builder.nativeReplacementNodes={"section-2":"missing-node"};
applyTemplateExtensions(host,missing);
assert.notEqual(host.querySelector(".service-intro").style.display,"none");
assert.equal(host.querySelectorAll("[data-studio2-native-extension]").length,0);
// Verify both static route generation and hydrated public runtime explicitly
// consume the same approved extension compositor, not only Studio preview.
const staticSource=fs.readFileSync("lib/concept-12/document.ts","utf8");
const clientSource=fs.readFileSync("components/ConceptSite.tsx","utf8");
assert.match(staticSource,/applyTemplateExtensions\(host as unknown as HTMLElement,page\)/);
assert.match(clientSource,/applyTemplateExtensions\(host,page\)/);
assert.match(clientSource,/mountNodeMotion\(host/);
console.log("PASS approved editor chapters and reversible sections render in static and hydrated routes, without remounting unchanged sections.");
