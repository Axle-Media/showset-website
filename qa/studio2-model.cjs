const fs = require("fs"),
  path = require("path"),
  ts = require("typescript"),
  assert = require("node:assert/strict");
const cache = new Map();
function load(file) {
  file = path.resolve(file);
  if (cache.has(file)) return cache.get(file);
  const m = { exports: {} };
  cache.set(file, m.exports);
  const code = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  new Function("require", "module", "exports", code)(
    (name) => load(path.resolve(path.dirname(file), name + ".ts")),
    m,
    m.exports,
  );
  cache.set(file, m.exports);
  return m.exports;
}
const model = load("lib/studio2/model.ts"),
  registry = load("lib/studio2/registry.ts"),
  render = load("lib/studio2/render.ts");
const {
  makeNode,
  insertNode,
  moveNode,
  findNode,
  removeNode,
  cloneNode,
  assertWorkspace,
  newCustomPage,
} = model;
let roots = [];
const section = makeNode("section"),
  container = makeNode("container"),
  heading = makeNode("heading");
roots = insertNode(roots, section, null);
roots = insertNode(roots, container, section.id);
roots = insertNode(roots, heading, container.id);
assert.equal(findNode(roots, heading.id).props.text, "Your next big idea.");
assert.throws(() => moveNode(roots, section.id, container.id, 0), /itself/);
roots = moveNode(roots, heading.id, section.id, 0);
assert.equal(roots[0].children[0].id, heading.id);
assert.equal(findNode(roots, container.id).children.length, 0);
const clone = cloneNode(section);
assert.notEqual(clone.id, section.id);
const locked = { ...heading, locked: true };
assert.equal(removeNode([locked], locked.id).length, 1);
for (const [key, value, valid] of [
  ["fontSize", "48px", true],
  ["fontSize", "48", false],
  ["fontSize", "auto", false],
  ["fontSize", "24px 48px", false],
  ["padding", "-2px", false],
  ["margin", "-2px", true],
  ["color", "red;display:none", false],
  ["background", "url(https://tracker.test)", false],
  ["objectPosition", "101% 20%", false],
  ["opacity", 2, false],
])
  assert.equal(registry.validStyle(key, value), valid, `${key} ${value}`);
const h = makeNode("heading");
h.props.text = "<script>alert(1)</script>";
const button = makeNode("button");
button.props.href = "javascript:alert(1)";
const html = render.renderNodes([h, button]);
assert.ok(!html.includes("<script>"));
assert.ok(!html.includes("javascript:"));
const safe = structuredClone(require("../content/pages.json")),
  g = structuredClone(require("../content/globals.json"));
const w = {
  schemaVersion: 2,
  revision: 0,
  pages: safe,
  globals: g,
  media: [],
  updatedAt: new Date().toISOString(),
};
assertWorkspace(w);
w.pages["qa"] = newCustomPage("QA", "/qa/");
w.pages.qa.builder.roots = roots;
assertWorkspace(w);
w.pages.qa.builder.roots.push(roots[0]);
assert.throws(() => assertWorkspace(w), /Duplicate/);
w.pages.qa.builder.roots = [];
w.pages.qa.route = "/";
assert.throws(() => assertWorkspace(w), /unique/);
console.log(
  "PASS model CRUD, nesting/cycle/lock/route guards, CSS allowlist and escaped rendering.",
);

const legacyHome={...safe.home, title:'Owner custom title', privateExtension:{keep:'yes'}, sections:[]};
const adopted=model.adoptLegacy(structuredClone(require('../content/pages.json')),g,{home:legacyHome},{theme:{navy:'#102030'},ownerExtension:'retained'});
assert.equal(adopted.pages.home.title,'Owner custom title');assert.deepEqual(adopted.pages.home.sections,[]);assert.equal(adopted.pages.home.privateExtension.keep,'yes');assert.equal(adopted.globals.theme.navy,'#102030');assert.equal(adopted.globals.theme.teal,g.theme.teal);assert.equal(adopted.globals.ownerExtension,'retained');assert.throws(()=>model.adoptLegacy(structuredClone(require('../content/pages.json')),g,[],null),/valid record/);console.log('PASS additive legacy adoption retains empty arrays, authored values and unknown extension fields.');

