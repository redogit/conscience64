import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { collectPublicRoutes } from './public-routes.mjs';

const workflow = await readFile(new URL('../.github/workflows/pages-sync.yml', import.meta.url), 'utf8');
const liveWorkflow = await readFile(new URL('../.github/workflows/pages-live-alias.yml', import.meta.url), 'utf8');
const redogitWorkflow = await readFile(new URL('../.github/workflows/redogit-local.yml', import.meta.url), 'utf8');

// Source synchronization and deployment verification are separate boundaries.
assert.match(workflow, /permissions:\s*\n\s+contents:\s*write\s*\n\s+pages:\s*read/, 'Pages source sync needs contents write plus read-only Pages status access');
assert.doesNotMatch(workflow, /pages:\s*write/, 'source sync must not claim Pages deployment authority');
assert.doesNotMatch(workflow, /actions:\s*write/, 'source sync must not need Actions write permission');
const push = workflow.indexOf('git push --force origin "$GITHUB_SHA:refs/heads/gh-pages"');
const verify = workflow.indexOf('git ls-remote origin refs/heads/gh-pages');
const deploymentStatus = workflow.indexOf('pages/deployments/${GITHUB_SHA}');
const repositoryDispatch = workflow.indexOf('repos/${GITHUB_REPOSITORY}/dispatches');
assert.ok(push >= 0, 'Pages source sync must advance gh-pages to the exact tested commit');
assert.ok(verify > push, 'Pages source sync must verify gh-pages after pushing');
assert.ok(deploymentStatus > verify, 'source sync must wait for the exact Pages deployment only after gh-pages matches main');
assert.ok(repositoryDispatch > deploymentStatus, 'live verification dispatch must occur only after the exact Pages deployment is observed');
assert.match(workflow, /test "\$deployment_status" = "succeed"/, 'source sync must fail closed unless the exact Pages deployment succeeds');
assert.match(workflow, /\\\"event_type\\\":\\\"pages-live-verify\\\"/, 'source sync must use the bounded repository-dispatch event type');
assert.match(workflow, /\\\"expected_sha\\\":\\\"\$GITHUB_SHA\\\"/, 'source sync must carry the synchronized SHA into live verification');
assert.match(workflow, /test "\$remote_sha" = "\$GITHUB_SHA"/, 'source sync must fail closed if gh-pages differs from main');
assert.doesNotMatch(workflow, /\/pages\/builds/, 'source sync must not call the default-branch Pages build API');
assert.doesNotMatch(workflow, /node tools\/check_public_reference_aliases\.mjs/, 'source sync must not execute live alias verification');
assert.doesNotMatch(workflow, /node tools\/check_public_routes\.mjs/, 'source sync must not execute live route verification');
assert.match(workflow, /SOURCE_SYNC_ONLY/, 'source sync must state the live-verification boundary explicitly');

assert.match(liveWorkflow, /page_build:/, 'live verification should retain the direct Pages-build observation trigger');
assert.doesNotMatch(liveWorkflow, /workflow_run:/, 'live verification must not rely on the rejected dynamic-workflow handoff');
assert.match(
  liveWorkflow,
  /repository_dispatch:\s*\n\s+types:\s*\[pages-live-verify\]/,
  'live verification must accept the bounded post-deployment repository dispatch'
);
assert.match(liveWorkflow, /workflow_dispatch:/, 'live verification must retain manual dispatch');
assert.match(liveWorkflow, /permissions:\s*\{\}/, 'live verifier must retain zero repository write permissions');
assert.match(liveWorkflow, /EXPECTED_SHA:\s*\$\{\{ github\.event\.client_payload\.expected_sha \}\}/, 'live verifier must receive the deployed SHA when repository-dispatched');
assert.match(liveWorkflow, /ref="\$\{EXPECTED_SHA:-main\}"/, 'live verification must use the dispatched SHA when present and current main otherwise');
assert.match(liveWorkflow, /git fetch --depth=1 origin "\$ref"/, 'live verification must materialize the selected intended public surface');
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

console.log(`PASS Pages boundary contract: exact source sync, exact deployment-status observation, bounded live dispatch, federation-trigger coverage, and ${routes.length} canonical public routes`);
