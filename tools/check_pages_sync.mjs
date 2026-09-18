import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { collectPublicRoutes } from './public-routes.mjs';

const workflow = await readFile(new URL('../.github/workflows/pages-sync.yml', import.meta.url), 'utf8');
const liveWorkflow = await readFile(new URL('../.github/workflows/pages-live-alias.yml', import.meta.url), 'utf8');
const redogitWorkflow = await readFile(new URL('../.github/workflows/redogit-local.yml', import.meta.url), 'utf8');

// Source synchronization and deployment verification are separate boundaries.
assert.match(workflow, /permissions:\\s*\\n\\s+contents:\\s*write/, 'Pages source sync needs contents write permission');
assert.doesNotMatch(workflow, /pages:\\s*(read|write)/, 'source sync must not gain Pages deployment authority');
assert.doesNotMatch(workflow, /actions:\\s*write/, 'source sync must not gain Actions dispatch authority');
assert.match(workflow, /PUBLIC_RELEASE_APPROVAL\\.json/, 'source sync must depend on the explicit release-approval artifact');
assert.match(workflow, /data\\.get\\('approved'\\) is True/, 'source sync must require explicit owner approval');
assert.match(workflow, /data\\.get\\('approved_sha'\\) == os\\.environ\\['GITHUB_SHA'\\]/, 'approval must bind the exact source revision');
assert.match(workflow, /privacy_safe'\\) is True/, 'approval must include privacy review');
assert.match(workflow, /link_surface_reviewed'\\) is True/, 'approval must include link-surface review');
assert.match(workflow, /dependent_surfaces_reviewed'\\) is True/, 'approval must include dependent-surface review');
assert.match(workflow, /PUBLICATION_HELD/, 'unapproved revisions must hold publication rather than mutate gh-pages');
const leaseRead = workflow.indexOf('lease_sha="$(git ls-remote origin refs/heads/gh-pages');
const push = workflow.indexOf('git push --force-with-lease=refs/heads/gh-pages:"$lease_sha" origin "$GITHUB_SHA:refs/heads/gh-pages"');
const verify = workflow.indexOf('remote_sha="$(git ls-remote origin refs/heads/gh-pages');
assert.ok(leaseRead >= 0, 'approved publication must observe the current gh-pages head before mutation');
assert.ok(push > leaseRead, 'approved publication must use an explicit lease bound to the observed gh-pages head');
assert.ok(verify > push, 'approved publication must verify gh-pages after pushing');
assert.match(workflow, /test "\\$remote_sha" = "\\$GITHUB_SHA"/, 'approved publication must fail closed if gh-pages differs from the exact approved revision');
assert.doesNotMatch(workflow, /\\/pages\\/deployments\\//, 'source sync must not observe Pages deployment status');
assert.doesNotMatch(workflow, /\\/dispatches/, 'source sync must not dispatch another workflow or repository event');
assert.doesNotMatch(workflow, /node tools\\/check_public_reference_aliases\\.mjs/, 'source sync must not execute live alias verification');
assert.doesNotMatch(workflow, /node tools\\/check_public_routes\\.mjs/, 'source sync must not execute live route verification');
assert.match(workflow, /SOURCE_SYNC_ONLY/, 'approved source sync must state the deployment-trigger boundary explicitly');

assert.doesNotMatch(liveWorkflow, /page_build:/, 'live verification must not rely on page_build');
assert.match(
  liveWorkflow,
  /workflow_run:\\s*\\n\\s+workflows:\\s*\\["Sync Conscience64 Pages source"\\]\\s*\\n\\s+types:\\s*\\[completed\\]\\s*\\n\\s+branches:\\s*\\[main\\]/,
  'live verification must follow the repo-owned source-sync workflow on main'
);
assert.match(
  liveWorkflow,
  /github\\.event_name != 'workflow_run' \\|\\| github\\.event\\.workflow_run\\.conclusion == 'success'/,
  'automatic live verification must execute only after successful source sync'
);
assert.match(liveWorkflow, /permissions:\\s*\\{\\}/, 'live verifier must retain zero configured repository permissions');
assert.doesNotMatch(liveWorkflow, /pages:\\s*(read|write)/, 'live verifier must not gain Pages permission');
assert.doesNotMatch(liveWorkflow, /actions:\\s*write/, 'live verifier must not gain Actions write permission');
assert.match(liveWorkflow, /EXPECTED_SHA:/, 'live verifier must bind an intended exact source SHA');
assert.match(liveWorkflow, /PUBLICATION_MODE=\\$mode/, 'live verifier must resolve approved versus held publication state');
assert.match(liveWorkflow, /PUBLIC_RELEASE_APPROVAL\\.json/, 'live verifier must read the explicit approval artifact');
assert.match(liveWorkflow, /published_sha=.*refs\\/remotes\\/origin\\/gh-pages/s, 'live verifier must inspect the actual gh-pages revision');
assert.match(liveWorkflow, /test "\\$published_sha" = "\\$EXPECTED_SHA"/, 'approved live state must bind gh-pages to the exact approved revision');
assert.match(liveWorkflow, /PUBLICATION_STATUS\\.json/, 'held live state must verify the publication-hold artifact');
assert.match(liveWorkflow, /public_projection.*paused/s, 'held live state must require the paused projection state');
assert.match(liveWorkflow, /approval_required.*True/s, 'held live state must require explicit approval');
assert.match(liveWorkflow, /canonical_authority.*False/s, 'held public URL must not be canonical authority');
assert.match(liveWorkflow, /pages\\/deployments\\/\\$\\{EXPECTED_SHA\\}/, 'approved live state must observe the exact commit-scoped Pages deployment');
assert.match(liveWorkflow, /env\\.PUBLICATION_MODE == 'approved'/, 'deployment and canonical route checks must be approval-gated');
assert.match(liveWorkflow, /node tools\\/check_public_reference_aliases\\.mjs/, 'approved live verifier must check declared aliases');
assert.match(liveWorkflow, /node tools\\/check_public_routes\\.mjs/, 'approved live verifier must check canonical public routes');
assert.match(liveWorkflow, /Public publication paused/, 'held live verifier must require the minimal pause notice at the network edge');
assert.match(liveWorkflow, /PRIVATE_BY_DEFAULT/, 'held live verifier must require the public privacy boundary marker');

assert.match(workflow, /research\/federation\/\*\*/, 'Pages source sync must run when a federation pointer or observation page changes');
assert.match(workflow, /\.github\/workflows\/pages-live-alias\.yml/, 'Pages source sync must run when the live verifier changes so the merged automatic path is re-exercised');
const redogitFederationTriggers = redogitWorkflow.match(/research\/federation\/\*\*/g) ?? [];
assert.ok(redogitFederationTriggers.length >= 2, 'REDOGIT verification must run for federation changes on both push and pull_request');
const redogitLiveVerifierTriggers = redogitWorkflow.match(/\.github\/workflows\/pages-live-alias\.yml/g) ?? [];
assert.ok(redogitLiveVerifierTriggers.length >= 2, 'REDOGIT verification must independently check live-verifier changes on both push and pull_request');
const redogitWorkflowWildcards = redogitWorkflow.match(/\.github\/workflows\/\*\*/g) ?? [];
assert.ok(redogitWorkflowWildcards.length >= 2, 'REDOGIT verification must run for every workflow carrier change on both push and pull_request');
assert.match(redogitWorkflow, /Psych\.parse_file/, 'REDOGIT must parse workflow YAML carriers before semantic contract checks');

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
