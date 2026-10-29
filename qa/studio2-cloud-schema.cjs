const fs=require("node:fs");
const assert=require("node:assert/strict");
const sql=fs.readFileSync("docs/studio2-cloud-schema.sql","utf8");
// Static fail-fast lint for PostgreSQL function delimiters. Contract tests do
// not execute migrations; staging still requires a real PostgreSQL test.
const bodies=[...sql.matchAll(/create or replace function\s+([\w.]+)\s*\([^)]*\)[\s\S]*?\bas\s+(\$[a-zA-Z_0-9]*\$)/gi)];
assert.equal(bodies.length,2,"Expected verifier trigger and publish RPC functions");
const quotes=(sql.match(/\$\$/g)||[]).length;
assert.equal(quotes,4,"Both functions must have balanced dollar delimiters");
assert.ok(!/\bas\s+\$(?![\w$])/i.test(sql),"Invalid single-dollar function delimiter");
assert.match(sql,/showset_studio_verify_release\(\)[\s\S]*?security invoker/i);
assert.match(sql,/showset_studio_publish\([\s\S]*?security invoker/i);
for(const table of ["members","workspaces","releases"])
  assert.ok(sql.includes("alter table public.showset_studio_"+table+" enable row level security;"));
assert.match(sql,/grant execute on function public\.showset_studio_publish\(bigint\) to authenticated/);
assert.match(sql,/revoke all on public\.showset_studio_members,[\s\S]*?from anon,authenticated/);
assert.ok(!/security definer/i.test(sql),"No privileged definer functions permitted");
console.log("PASS cloud SQL delimiters, invoker controls, protected tables and explicit authenticated grants. Live PostgreSQL/RLS verification still required.");
