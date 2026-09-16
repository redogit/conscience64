import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const workflow = await readFile(new URL('../.github/workflows/pages-sync.yml', import.meta.url), 'utf8');

assert.match(workflow, /permissions:\s*\n\s+contents:\s*write\s*\n\s+pages:\s*write/, 'Pages sync must request contents and Pages write permissions');
const push = workflow.indexOf('git push --force origin "$GITHUB_SHA:refs/heads/gh-pages"');
const verify = workflow.indexOf('git ls-remote origin refs/heads/gh-pages');
const requestBuild = workflow.indexOf('--request POST');
const latestBuild = workflow.indexOf('/pages/builds/latest');
const site = workflow.indexOf('/repos/${GITHUB_REPOSITORY}/pages"');
const liveAliases = workflow.indexOf('node tools/check_public_reference_aliases.mjs');
const liveRoutes = workflow.indexOf('node tools/check_public_routes.mjs');
assert.ok(push >= 0, 'Pages sync must advance gh-pages to the exact tested commit');
assert.ok(verify > push, 'Pages sync must verify the published branch after pushing');
assert.ok(requestBuild > verify, 'Pages build request must happen only after exact-commit verification');
assert.ok(latestBuild > requestBuild, 'Pages sync must observe the requested build after queueing it');
assert.ok(site > latestBuild, 'Pages site URL must be read only after the exact build closes');
assert.ok(liveAliases > site, 'live declared aliases must be checked only after the Pages build closes');
assert.ok(liveRoutes > liveAliases, 'all canonical public routes must be checked after exact alias verification');
assert.match(workflow, /test "\$remote_sha" = "\$GITHUB_SHA"/, 'Pages sync must fail closed if gh-pages differs from main');
assert.match(workflow, /Authorization: Bearer \$\{GITHUB_TOKEN\}/, 'Pages API calls must authenticate with the workflow token');
assert.match(workflow, /test "\$status" = "201"/, 'Pages sync must require GitHub to accept the Pages build request');
assert.match(workflow, /latest_http="\$\(curl[\s\S]*--write-out '%\{http_code\}'[\s\S]*pages\/builds\/latest/, 'latest-build observation must capture HTTP status instead of aborting on transient 404');
assert.match(workflow, /if \[ "\$latest_http" = "404" \]; then[\s\S]*continue/, 'a transient latest-build 404 must remain inside the bounded polling loop');
assert.match(workflow, /test "\$latest_http" = "200"/, 'non-404 latest-build responses must be explicitly constrained to HTTP 200');
assert.match(workflow, /test "\$build_status" = "built"/, 'Pages sync must not close while the Pages build is only queued');
assert.match(workflow, /test "\$build_commit" = "\$GITHUB_SHA"/, 'Pages build must correspond to the exact tested commit');
assert.match(workflow, /PAGES_URL="\$pages_url" GITHUB_SHA="\$GITHUB_SHA" node tools\/check_public_reference_aliases\.mjs/, 'Pages sync must verify the public declared aliases at the built site');
assert.match(workflow, /PAGES_URL="\$pages_url" GITHUB_SHA="\$GITHUB_SHA" node tools\/check_public_routes\.mjs/, 'Pages sync must verify all canonical public routes at the built site');

console.log('PASS Pages sync contract: exact source, bounded eventual-consistency observation, exact built commit, live aliases, and all canonical public routes');
