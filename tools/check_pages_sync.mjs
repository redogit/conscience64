import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const workflow=await readFile(new URL('../.github/workflows/pages-sync.yml',import.meta.url),'utf8');
const liveWorkflow=await readFile(new URL('../.github/workflows/pages-live-alias.yml',import.meta.url),'utf8');
const approval=JSON.parse(await readFile(new URL('../PUBLIC_TESTBED_APPROVAL.json',import.meta.url),'utf8'));

assert.equal(approval.schema,'redogit/public-testbed-approval/v1');
assert.equal(approval.approved,true);
assert.equal(approval.scope,'public-testbed-only');
assert.equal(approval.issue,166);
assert.equal(approval.commercial_license_granted,false);
for(const key of [
  'source_isolation_required',
  'privacy_boundary_required',
  'experimental_label_required',
  'accessibility_required',
  'network_edge_verification_required'
])assert.equal(approval.review?.[key],true,'missing testbed approval review gate: '+key);

assert.ok(workflow.includes('permissions:\n  contents: write'),'testbed sync needs branch write authority');
assert.ok(!workflow.includes('pages: write')&&!workflow.includes('actions: write'),'testbed sync must not gain deployment/dispatch authority');
assert.ok(workflow.includes("'public-testbed/**'"),'testbed sources must trigger projection sync');
assert.ok(workflow.includes("'PUBLIC_TESTBED_APPROVAL.json'"),'scope authorization changes must trigger projection sync');
assert.ok(workflow.includes('node tools/check-public-testbed.mjs --revision "$GITHUB_SHA"'),'source sync must verify isolated projection at exact source SHA');
assert.ok(workflow.includes('node tools/build-public-testbed.mjs --root . --out "$OUT" --revision "$GITHUB_SHA"'),'source sync must build only the testbed projection');
assert.ok(workflow.includes('test ! -e "$OUT/README.md"'),'source sync must counterprobe repository-root leakage');
assert.ok(workflow.includes('git fetch --depth=1 origin gh-pages'),'source sync must observe prior projection for rollback lineage');
assert.ok(workflow.includes('lease_sha="$(git rev-parse HEAD)"'),'source sync must bind the predecessor branch revision');
assert.ok(workflow.includes('git rm -r -f .'),'source sync must clear the previous projection tree before copy');
assert.ok(workflow.includes('cp -a "$PROJECTION_DIR"/. .'),'source sync must copy the generated projection, not repository files');
assert.ok(workflow.includes('git commit -m "Publish public test bed from ${GITHUB_SHA}"'),'source sync must create a distinct projection commit');
assert.ok(workflow.includes('git push --force-with-lease=refs/heads/gh-pages:"$lease_sha" origin HEAD:refs/heads/gh-pages'),'publication must preserve lease safety while advancing only projection HEAD');
assert.ok(!workflow.includes('$GITHUB_SHA:refs/heads/gh-pages'),'source main commit must never be pushed directly to gh-pages');
assert.ok(!workflow.includes('PUBLIC_RELEASE_APPROVAL.json'),'testbed publication must not depend on the obsolete self-referential exact-SHA approval artifact');

for(const forbidden of [
  "'research/projects/**'",
  "'play/**'",
  "'coordinate-space/**'",
  "'analytics/**'",
  "'data-*.txt'"
])assert.ok(!workflow.includes(forbidden),'repository-wide publication trigger survived: '+forbidden);

assert.ok(liveWorkflow.includes('workflows: ["Sync Conscience64 public test bed"]'),'live verifier must follow the narrow source-sync workflow');
assert.ok(liveWorkflow.includes('types: [completed]'),'live verifier must follow completed sync runs');
assert.ok(liveWorkflow.includes('branches: [main]'),'live verifier must bind main source');
assert.ok(liveWorkflow.includes('permissions: {}'),'live verifier must retain zero configured repository permissions');
assert.ok(liveWorkflow.includes('EXPECTED_SOURCE_SHA:'),'live verifier must bind the exact main source revision');
assert.ok(liveWorkflow.includes('node tools/check-public-testbed.mjs --revision "$EXPECTED_SOURCE_SHA"'),'live verifier must reconstruct source projection');
assert.ok(liveWorkflow.includes('git ls-tree -r --name-only refs/remotes/origin/gh-pages'),'live verifier must inventory actual projection branch bytes');
assert.ok(liveWorkflow.includes('cmp "$EXPECTED/$rel" "$RUNNER_TEMP/published-file"'),'live verifier must compare exact expected and published bytes');
assert.ok(liveWorkflow.includes('node tools/check-public-testbed-edge.mjs'),'live verifier must inspect the network edge');
assert.ok(!liveWorkflow.includes('PUBLICATION_STATUS.json'),'pause-only surface must no longer be live authority');
assert.ok(!liveWorkflow.includes('PUBLIC_RELEASE_APPROVAL.json'),'live verifier must use testbed scope + exact manifest provenance, not self-referential approval');

const builder=await readFile(new URL('./build-public-testbed.mjs',import.meta.url),'utf8');
const edge=await readFile(new URL('./check-public-testbed-edge.mjs',import.meta.url),'utf8');
assert.ok(builder.includes("source_root:'public-testbed/'"));
assert.ok(builder.includes("publication_scope:'public-testbed-only'"));
assert.ok(edge.includes("'README.md'")&&edge.includes("'research/projects/README.md'")&&edge.includes("'play/index.html'"),'network edge must counterprobe repository-route leakage');

console.log('PASS Pages testbed contract: scope-authorized isolated source -> rollback-linked projection commit -> exact branch-byte comparison -> network-edge leakage counterprobes');
