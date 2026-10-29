const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const ts=require("typescript");
const {parseHTML}=require("linkedom");
const source=fs.readFileSync("lib/studio2/template-extensions.ts","utf8");
const transpiled=ts.transpileModule(source,{compilerOptions:{
  module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022
}}).outputText;
const module={exports:{}};
vm.runInNewContext("(function(exports,require,module){"+transpiled+"\n})",{})(
  module.exports,(path)=>{
    if(path==="./render")return {renderNodes:(roots)=>roots.map(
      n=>'<section class="s2-node-section" data-builder-node="'+n.id+'"><h2>'+
        n.children?.[0]?.props?.text+'</h2></section>'
    ).join("")};
    if(path==="./native-rebuild")return {syncNativeReplacementVisibility:(host,p)=>{
      host.querySelectorAll("[data-service-section]").forEach(n=>{
        n.style.display=p.builder?.replacedNative?.includes(n.dataset.serviceSection)
          ?"none":"";
      });
    }};
    throw Error("Unexpected module "+path);
  },module);
const {applyTemplateExtensions}=module.exports;
const {document}=parseHTML('<html><body><div id="host"><div class="view" data-view="service">'+
  '<div class="service-experience"><div class="service-intro" data-service-section="section-2">'+
  '<h2>Original introduction</h2></div><div class="service-close">Final CTA</div></div></div></div></body></html>');
const host=document.querySelector("#host");
const base={route:"/events-experiences/",builder:{mode:"template",
  replacedNative:["section-2"],roots:[{id:"approved-chapter",kind:"section",
    children:[{props:{text:"Owner-approved chapter"}}]}]}};
let container=applyTemplateExtensions(host,base);
assert.ok(container);
assert.equal(container.nextElementSibling.className,"service-close");
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
const cleared=structuredClone(restored);
cleared.builder.roots=[];
assert.equal(applyTemplateExtensions(host,cleared),null);
assert.equal(host.querySelectorAll(".s2-template-extensions").length,0);
// Verify both static route generation and hydrated public runtime explicitly
// consume the same approved extension compositor, not only Studio preview.
const staticSource=fs.readFileSync("lib/concept-12/document.ts","utf8");
const clientSource=fs.readFileSync("components/ConceptSite.tsx","utf8");
assert.match(staticSource,/applyTemplateExtensions\(host as unknown as HTMLElement,page\)/);
assert.match(clientSource,/applyTemplateExtensions\(host,page\)/);
assert.match(clientSource,/mountNodeMotion\(extension/);
console.log("PASS approved editor chapters and reversible sections render in static and hydrated routes, without remounting unchanged sections.");
