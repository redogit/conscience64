import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { collectPublicRoutes } from './public-routes.mjs';

const workflow = await readFile(new URL('../.github/workflows/pages-sync.yml', import.meta.url), 'utf8');
const liveWorkflow = await readFile(new URL('../.github/workflows/pages-live-alias.yml', import.meta.url), 'utf8');
const redogitWorkflow = await readFile(new URL('../.github/workflows/redogit-local.yml', import.meta.url), 'utf8');

// Publication, deployment observation, and live verification are deliberately separate authority surfaces.
assert.match(workflow, /permissions:\s*\{\}/, 'source-sync workflow must default to zero permissions');
assert.match(
  workflow,
  /publish-source:\s*\n\s+permissions:\s*\n\s+contents:\s*write/,
  'only the publication job may receive contents write'
);
assert.match(
  workflow,
  /observe-exact-pages-deployment:\s*\n\s+needs:\s*publish-source[\s\S]*?permissions:\s*\n\s+pages:\s*read/,
  'deployment observation must be a separate read-only Pages job after publication'
);
assert.doesNotMatch(workflow, /pages:\s*write/, 'no source-sync job may claim Pages deployment authority');
assert.doesNotMatch(workflow, /actions:\s*write/, 'source sync must not gain Actions dispatch authority');

const push = workflow.indexOf('git push --force origin "$GITHUB_SHA:refs/heads/gh-pages"');
const verify = workflow.indexOf('git ls-remote origin refs/heads/gh-pages');
const observeJob = workflow.indexOf('observe-exact-pages-deployment:');
const deploymentStatus = workflow.indexOf('pages/deployments/${GITHUB_SHA}');
assert.ok(push >= 0, 'publication job must advance gh-pages to the exact tested commit');
assert.ok(verify > push, 'publication job must verify gh-pages after pushing');
assert.ok(observeJob > verify, 'read-only deployment observation must remain separate from publication');
assert.ok(deploymentStatus > observeJob, 'exact deployment API observation must occur only in the observer job');
assert.match(workflow, /test "\$remote_sha" = "\$GITHUB_SHA"/, 'publication must fail closed if gh-pages differs from main');
assert.match(workflow, /Authorization: Bearer \$\{GITHUB_TOKEN\}/, 'read-only deployment observer must use its scoped token rather than shared unauthenticated quota');
assert.match(workflow, /test "\$deployment_status" = "succeed"/, 'deployment observer must fail closed unless the exact Pages deployment succeeds');
assert.match(workflow, /DEPLOYMENT_OBSERVED_ONLY/, 'observer must state its read-only authority boundary');
assert.doesNotMatch(workflow, /\/dispatches/, 'source sync must not dispatch another workflow or repository event');
assert.doesNotMatch(workflow, /node tools\/check_public_reference_aliases\.mjs/, 'source sync must not execute live alias verification');
assert.doesNotMatch(workflow, /node tools\/check_public_routes\.mjs/, 'source sync must not execute live route verification');
assert.match(workflow, /SOURCE_SYNC_ONLY/, 'publication job must state its source-only authority boundary');

assert.doesNotMatch(liveWorkflow, /page_build:/, 'live verification must not rely on the rejected page_build handoff');
assert.match(
  liveWorkflow,
  /workflow_run:\s*\n\s+workflows:\s*\["Sync Conscience64 Pages source"\]\s*\n\s+types:\s*\[completed\]\s*\n\s+branches:\s*\[main\]/,
  'live verification must follow successful completion of the repo-owned source-sync workflow'
);
assert.match(
  liveWorkflow,
  /github\.event_name != 'workflow_run' \|\| github\.event\.workflow_run\.conclusion == 'success'/,
  'automatic live verification must execute only after source sync and deployment observation succeed'
);
assert.match(liveWorkflow, /permissions:\s*\{\}/, 'live verifier must retain zero repository permissions');
assert.match(
  liveWorkflow,
  /EXPECTED_SHA:\s*\$\{\{ github\.event_name == 'workflow_run' && github\.event\.workflow_run\.head_sha \|\| '' \}\}/,
  'live verifier must bind the exact completed workflow head SHA'
);
assert.match(liveWorkflow, /ref="\$\{EXPECTED_SHA:-main\}"/, 'automatic verification must materialize the exact workflow SHA');
assert.match(liveWorkflow, /git fetch --depth=1 origin "\$ref"/, 'live verification must materialize only the selected intended public surface');
assert.doesNotMatch(liveWorkflow, /pages\/deployments\//, 'zero-permission live verifier must not consume the Pages REST deployment endpoint');
assert.doesNotMatch(liveWorkflow, /Authorization:\s*Bearer/, 'zero-permission live verifier must not acquire repository API credentials');
const ghPagesReads = liveWorkflow.match(/git ls-remote origin refs\/heads\/gh-pages/g) ?? [];
assert.ok(ghPagesReads.length >= 2, 'live verifier must bind gh-pages to the expected SHA before and after network-edge checks');
assert.match(liveWorkflow, /test "\$remote_sha" = "\$EXPECTED_SHA"/, 'live verifier must fail closed if gh-pages differs from the completed workflow SHA');
assert.match(liveWorkflow, /node tools\/check_public_reference_aliases\.mjs/, 'live verifier must check declared historical aliases');
assert.match(liveWorkflow, /node tools\/check_public_routes\.mjs/, 'live verifier must check the complete canonical public route inventory');

assert.match(workflow, /research\/federation\/\*\*/, 'Pages source sync must run when a federation pointer or observation page changes');
const redogitFederationTriggers = redogitWorkflow.match(/research\/federation\/\*\*/g) ?? [];
assert.ok(redogitFederationTriggers.length >= 2, 'REDOGIT verification must run for federation changes on both push and pull_request');

const routes = await collectPublicRoutes();
const requiredRoutes = [
  '',
  'play/',
  'play/mmo-world/',
  'play/mmo-world/forge/',
  'play/mmo/',
  'play/mmo/simple/',
  'play/explorer-world/',
  'play/fuzzball-hidden/',
  'play/musilanguage/',
  'play/musilanguage/radio.html',
  'play/musilanguage/radio.htm',
  'analytics/',
  'coordinate-space/',
  'research/projects/',
  'research/federation/s1-models/'
];
for (const route of requiredRoutes) assert.ok(routes.includes(route), `canonical public route inventory missing ${route || '/'}`);
assert.ok(routes.length >= 30, `canonical public route inventory is unexpectedly narrow: ${routes.length}`);

console.log(`PASS Pages boundary contract: separated contents-write publication, pages-read observation, repo-owned completion handoff, zero-permission live verification, and ${routes.length} canonical public routes`);
