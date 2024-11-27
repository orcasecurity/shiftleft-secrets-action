const handlebars = require("handlebars");
const fs = require("fs");
const summary = require("@actions/core/lib/summary");

const template = `{{#if secrets.length}}
# Orca Security Secrets Scan Summary
⚠️ Please take action to mitigate the risk of the identified secrets by revoking them, and if already in use, updating all dependent systems

| **NAME**  | **FILE PATH** | **Match** | **COMMIT** | **STATUS** |   |
| --------- | ------------  | ------------ | ---------- | ---------- | - |
{{#each secrets}}
| {{{name}}} | {{filePath}} | {{{match}}} | {{commitSha}} | {{status}} | [View in code]({{{linkToFinding}}}) |
{{/each}}
{{/if}}
`;

const secretsDescriptionTemplate = handlebars.compile(template);

function generateSecretsDescriptionText(secretFindings) {
  const result = secretsDescriptionTemplate({ secrets: secretFindings });

  return result.replace(/\n$/, "");
}

function generateGithubFindingLink(
  repositoryName,
  commitSha,
  fileName,
  startLine,
  endLine,
) {
  if (!commitSha) {
    return "";
  }

  return `https://github.com/${repositoryName}/blob/${commitSha}/${fileName}#L${startLine}-L${endLine}`;
}

function extractSecretFinding(secretResults, secrets) {
  for (const finding of secretResults.findings) {
    secrets.push({
      name: secretResults.catalog_control["title"],
      filePath: finding["file_name"],
      match: finding["match"],
      commitSha: finding["commit"]["hash"],
      status: secretResults["status"],
      linkToFinding: generateGithubFindingLink(
        process.env.GITHUB_REPOSITORY,
        finding["commit"]["hash"],
        finding["file_name"],
        finding.position["start_line"],
        finding.position["end_line"],
      ),
    });
  }
}

function extractSecrets(results) {
  let secrets = [];
  for (const secretResults of results.results.secret_detection.results) {
    extractSecretFinding(secretResults, secrets);
  }

  return secrets;
}

function generateResultSummary(results) {
  const summaryResults = generateSecretsDescriptionText(
    extractSecrets(results),
  );
  const filePath = process.env.GITHUB_STEP_SUMMARY;
  summary.summary.addRaw(summaryResults);
  fs.appendFileSync(filePath, summaryResults);
}

module.exports = {
  generateResultSummary,
};
