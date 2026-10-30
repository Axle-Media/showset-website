const fs=require("node:fs");
const assert=require("node:assert/strict");
const sql=fs.readFileSync("docs/studio2-cloud-schema.sql","utf8");
// Static fail-fast lint for PostgreSQL function delimiters. Contract tests do
// not execute migrations; staging still requires a real PostgreSQL test.
const bodies=[...sql.matchAll(/create or replace function\s+([\w.]+)\s*\([^)]*\)[\s\S]*?\bas\s+(\$[a-zA-Z_0-9]*\$)/gi)];
assert.equal(bodies.length,5,"Expected review, publish and rollback security functions");
const quotes=(sql.match(/\$\$/g)||[]).length;
assert.equal(quotes,10,"All five SQL functions must have balanced dollar delimiters");
assert.ok(!/\bas\s+\$(?![\w$])/i.test(sql),"Invalid single-dollar function delimiter");
assert.match(sql,/showset_studio_verify_release\(\)[\s\S]*?security invoker/i);
assert.match(sql,/showset_studio_publish\([\s\S]*?security invoker/i);
for(const table of ["members","workspaces","reviews","releases"])
  assert.ok(sql.includes("alter table public.showset_studio_"+table+" enable row level security;"));
assert.ok(sql.includes("grant execute on function public.showset_studio_publish(bigint,bigint) to authenticated;"));
assert.ok(sql.includes("grant execute on function public.showset_studio_request_review(bigint,text) to authenticated;"));
assert.ok(sql.includes("grant execute on function public.showset_studio_rollback(bigint,bigint,bigint) to authenticated;"));
assert.ok(sql.includes("create policy \"Active editors request reviews\""));
assert.ok(sql.includes("requested_by = (select auth.uid())"));
assert.ok(sql.includes("Rollback blocked: current draft differs from latest release"));
assert.ok(sql.includes("review_doc is distinct from current_doc"));
assert.ok(sql.includes("reviewed_document is distinct from stored_document"));
assert.match(sql,/revoke all on public\.showset_studio_members,[\s\S]*?from anon,authenticated/);
assert.ok(!/security definer/i.test(sql),"No privileged definer functions permitted");
console.log("PASS cloud SQL delimiters, invoker controls, protected tables and explicit authenticated grants. Live PostgreSQL/RLS verification still required.");
