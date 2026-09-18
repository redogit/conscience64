import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { collectPublicRoutes } from './public-routes.mjs';

const workflow = await readFile(new URL('../.github/workflows/pages-sync.yml', import.meta.url), 'utf8');
const liveWorkflow = await readFile(new URL('../.github/workflows/pages-live-alias.yml', import.meta.url), 'utf8');
const redogitWorkflow = await readFile(new URL('../.github/workflows/redogit-local.yml', import.meta.url), 'utf8');

// Source synchronization and deployment verification are separate boundaries.
assert.match(workflow, /permissions:\s*\n\s+contents:\s*write/, 'Pages source sync needs contents write permission');
assert.doesNotMatch(workflow, /pages:\s*(read|write)/, 'source sync must not gain Pages deployment observation or deployment authority');
assert.doesNotMatch(workflow, /actions:\s*write/, 'source sync must not gain Actions dispatch authority');
const push = workflow.indexOf('git push --force origin "$GITHUB_SHA:refs/heads/gh-pages"');
const verify = workflow.indexOf('git ls-remote origin refs/heads/gh-pages');
assert.ok(push >= 0, 'Pages source sync must advance gh-pages to the exact tested commit');
assert.ok(verify > push, 'Pages source sync must verify gh-pages after pushing');
assert.match(workflow, /test "\$remote_sha" = "\$GITHUB_SHA"/, 'source sync must fail closed if gh-pages differs from main');
assert.doesNotMatch(workflow, /\/pages\/deployments\//, 'source sync must not observe Pages deployment status');
assert.doesNotMatch(workflow, /\/dispatches/, 'source sync must not dispatch another workflow or repository event');
assert.doesNotMatch(workflow, /node tools\/check_public_reference_aliases\.mjs/, 'source sync must not execute live alias verification');
assert.doesNotMatch(workflow, /node tools\/check_public_routes\.mjs/, 'source sync must not execute live route verification');
assert.match(workflow, /SOURCE_SYNC_ONLY/, 'source sync must state the deployment-trigger boundary explicitly');

assert.doesNotMatch(liveWorkflow, /page_build:/, 'live verification must not rely on the rejected page_build handoff');
assert.match(
  liveWorkflow,
  /workflow_run:\s*\n\s+workflows:\s*\["Sync Conscience64 Pages source"\]\s*\n\s+types:\s*\[completed\]\s*\n\s+branches:\s*\[main\]/,
  'live verification must follow the repo-owned source-sync workflow on main'
);
assert.doesNotMatch(
  liveWorkflow,
  /workflows:\s*\["pages build and deployment"\]/,
  'live verification must not rely on the rejected dynamic native Pages workflow_run handoff'
);
assert.match(
  liveWorkflow,
  /github\.event_name != 'workflow_run' \|\| github\.event\.workflow_run\.conclusion == 'success'/,
  'automatic live verification must execute only after successful source sync'
);
assert.match(liveWorkflow, /permissions:\s*\{\}/, 'live verifier must retain zero configured repository permissions');
assert.doesNotMatch(liveWorkflow, /pages:\s*(read|write)/, 'live verifier must not gain Pages permission');
assert.doesNotMatch(liveWorkflow, /actions:\s*write/, 'live verifier must not gain Actions write permission');
assert.match(
  liveWorkflow,
  /EXPECTED_SHA:\s*\$\{\{ github\.event_name == 'workflow_run' && github\.event\.workflow_run\.head_sha \|\| '' \}\}/,
  'live verifier must bind the exact source-sync head SHA'
);
assert.match(liveWorkflow, /ref="\$\{EXPECTED_SHA:-main\}"/, 'automatic verification must use the exact source-sync SHA and manual/PR verification may use current main');
assert.match(liveWorkflow, /git fetch --depth=1 origin "\$ref"/, 'live verification must materialize only the selected intended public surface');
assert.match(liveWorkflow, /pages\/deployments\/\$\{EXPECTED_SHA\}/, 'live verifier must observe the exact commit-scoped Pages deployment');
assert.match(liveWorkflow, /X-GitHub-Api-Version:\s*2026-03-10/, 'live verifier must pin the current GitHub REST API version');
assert.match(liveWorkflow, /GITHUB_TOKEN:\s*\$\{\{ github\.token \}\}/, 'live verifier may authenticate the public deployment-status observation only with its zero-permission workflow token');
assert.match(liveWorkflow, /Authorization:\s*Bearer \$\{GITHUB_TOKEN\}/, 'deployment-status observation must use authenticated rate-limit identity');
assert.match(liveWorkflow, /test "\$deployment_status" = "succeed"/, 'live verifier must fail closed unless the exact Pages deployment succeeds');
const ghPagesReads = liveWorkflow.match(/git ls-remote origin refs\/heads\/gh-pages/g) ?? [];
assert.ok(ghPagesReads.length >= 2, 'live verifier must bind gh-pages to the expected SHA before and after deployment observation');
assert.match(liveWorkflow, /test "\$remote_sha" = "\$EXPECTED_SHA"/, 'live verifier must fail closed if gh-pages differs from the source-sync SHA');
assert.match(liveWorkflow, /node tools\/check_public_reference_aliases\.mjs/, 'live verifier must check declared historical aliases');
assert.match(liveWorkflow, /node tools\/check_public_routes\.mjs/, 'live verifier must check the complete canonical public route inventory');

assert.match(workflow, /research\/federation\/\*\*/, 'Pages source sync must run when a federation pointer or observation page changes');
assert.match(workflow, /\.github\/workflows\/pages-live-alias\.yml/, 'Pages source sync must run when the live verifier changes so the merged automatic path is re-exercised');
const redogitFederationTriggers = redogitWorkflow.match(/research\/federation\/\*\*/g) ?? [];
assert.ok(redogitFederationTriggers.length >= 2, 'REDOGIT verification must run for federation changes on both push and pull_request');
const redogitLiveVerifierTriggers = redogitWorkflow.match(/\.github\/workflows\/pages-live-alias\.yml/g) ?? [];
assert.ok(redogitLiveVerifierTriggers.length >= 2, 'REDOGIT verification must independently check live-verifier changes on both push and pull_request');

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

console.log(`PASS Pages boundary contract: exact source sync, repo-owned completion handoff, authenticated zero-permission exact deployment observation, federation-trigger coverage, and ${routes.length} canonical public routes`);
