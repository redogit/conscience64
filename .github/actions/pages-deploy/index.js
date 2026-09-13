const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

async function main() {
  const runtimeDir = required('PAGES_RUNTIME_DIR');
  const runnerTemp = required('RUNNER_TEMP');
  const githubToken = required('GITHUB_TOKEN');
  const repository = required('GITHUB_REPOSITORY');
  const buildVersion = required('GITHUB_SHA');
  const pagesEnvironment = required('PAGES_ENVIRONMENT');
  const oidcRequestUrl = required('ACTIONS_ID_TOKEN_REQUEST_URL');
  const oidcRequestToken = required('ACTIONS_ID_TOKEN_REQUEST_TOKEN');
  const outputFile = required('GITHUB_OUTPUT');
  required('ACTIONS_RUNTIME_TOKEN');
  required('ACTIONS_RESULTS_URL');

  const artifactTar = path.join(runnerTemp, 'artifact.tar');
  if (!fs.existsSync(artifactTar)) {
    throw new Error(`Pages artifact tar was not found: ${artifactTar}`);
  }

  const artifactModuleUrl = pathToFileURL(
    path.join(runtimeDir, 'node_modules', '@actions', 'artifact', 'lib', 'artifact.js')
  ).href;
  const { DefaultArtifactClient } = await import(artifactModuleUrl);
  const artifactClient = new DefaultArtifactClient();

  const upload = await artifactClient.uploadArtifact(
    'github-pages',
    [artifactTar],
    runnerTemp,
    { retentionDays: 1 }
  );

  if (!upload?.id) {
    throw new Error('GitHub Actions artifact upload completed without an artifact id.');
  }
  console.log(`Uploaded github-pages artifact ${upload.id} (${upload.size ?? 'unknown'} bytes).`);

  const oidcResponse = await fetch(oidcRequestUrl, {
    headers: {
      Authorization: `Bearer ${oidcRequestToken}`,
      Accept: 'application/json'
    }
  });
  if (!oidcResponse.ok) {
    throw new Error(`OIDC token request failed with HTTP ${oidcResponse.status}.`);
  }
  const oidc = await oidcResponse.json();
  if (!oidc?.value) throw new Error('OIDC token response did not contain a token.');

  const apiBase = process.env.GITHUB_API_URL || 'https://api.github.com';
  const apiHeaders = {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${githubToken}`,
    'Content-Type': 'application/json'
  };

  const createUrl = `${apiBase}/repos/${repository}/pages/deployments`;
  const createResponse = await fetch(createUrl, {
    method: 'POST',
    headers: apiHeaders,
    body: JSON.stringify({
      artifact_id: Number(upload.id),
      environment: pagesEnvironment,
      pages_build_version: buildVersion,
      oidc_token: oidc.value
    })
  });

  const createText = await createResponse.text();
  let deployment;
  try {
    deployment = createText ? JSON.parse(createText) : {};
  } catch {
    deployment = { message: createText };
  }
  if (!createResponse.ok) {
    throw new Error(
      `Pages deployment creation failed with HTTP ${createResponse.status}: ${deployment.message || 'unknown error'}`
    );
  }

  const statusUrl = deployment.status_url;
  const pageUrl = deployment.page_url || '';
  if (!statusUrl) throw new Error('Pages deployment response did not contain status_url.');

  const finalErrors = new Set([
    'deployment_failed',
    'deployment_perms_error',
    'deployment_content_failed',
    'deployment_cancelled',
    'deployment_lost'
  ]);

  const deadline = Date.now() + 10 * 60 * 1000;
  while (Date.now() < deadline) {
    await new Promise(resolve => setTimeout(resolve, 5000));
    const statusResponse = await fetch(statusUrl, { headers: apiHeaders });
    if (!statusResponse.ok) {
      console.log(`Pages deployment status returned HTTP ${statusResponse.status}; retrying.`);
      continue;
    }

    const statusBody = await statusResponse.json();
    const status = statusBody.status;
    console.log(`Pages deployment status: ${status}`);

    if (status === 'succeed') {
      fs.appendFileSync(outputFile, `page_url=${pageUrl}\n`);
      if (process.env.GITHUB_STEP_SUMMARY) {
        fs.appendFileSync(
          process.env.GITHUB_STEP_SUMMARY,
          `GitHub Pages deployment succeeded${pageUrl ? `: ${pageUrl}` : '.'}\n`
        );
      }
      return;
    }

    if (finalErrors.has(status)) {
      throw new Error(`Pages deployment ended with status: ${status}`);
    }
  }

  throw new Error('Timed out waiting for GitHub Pages deployment to finish.');
}

main().catch(error => {
  console.error(error?.stack || String(error));
  process.exitCode = 1;
});
