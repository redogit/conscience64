import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const workflow = await readFile(new URL('../.github/workflows/pages-sync.yml', import.meta.url), 'utf8');

assert.match(workflow, /permissions:\s*\n\s+contents:\s*write\s*\n\s+pages:\s*write/, 'Pages sync must request contents and Pages write permissions');
const push = workflow.indexOf('git push --force origin "$GITHUB_SHA:refs/heads/gh-pages"');
const verify = workflow.indexOf('git ls-remote origin refs/heads/gh-pages');
const build = workflow.indexOf('/repos/${GITHUB_REPOSITORY}/pages/builds');
assert.ok(push >= 0, 'Pages sync must advance gh-pages to the exact tested commit');
assert.ok(verify > push, 'Pages sync must verify the published branch after pushing');
assert.ok(build > verify, 'Pages build request must happen only after exact-commit verification');
assert.match(workflow, /test "\$remote_sha" = "\$GITHUB_SHA"/, 'Pages sync must fail closed if gh-pages differs from main');
assert.match(workflow, /Authorization: Bearer \$\{GITHUB_TOKEN\}/, 'Pages build request must authenticate with the workflow token');
assert.match(workflow, /test "\$status" = "201"/, 'Pages sync must require GitHub to accept the Pages build request');

console.log('PASS Pages sync contract: exact source commit, explicit Pages build request, and fail-closed publication verification');
