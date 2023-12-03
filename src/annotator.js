const core = require("@actions/core");

function getSecretDetails(secretResults) {   
    let details = secretResults.catalog_control["details"] || `${secretResults.catalog_control["title"]} secret was found`;
    let recommendation = `Take immediate action to mitigate the risk of the identified secret by locating 
    where it is used, revoking it, and ensuring it is updated in all dependent systems.`;
    return `Details:\n${wrapWords(details)}\n\nRecommendation:ֿ\n${wrapWords(recommendation)}`;
}

function wrapWords(input, maxLineLength = 80) {
    const words = input.split(/\s+/);
    const lines = [];
    let currentLine = '';

    for (let i = 0; i < words.length; i++) {
        const word = words[i];
        if (currentLine.length + word.length > maxLineLength) {
            lines.push(currentLine.trim());
            currentLine = '';
        }
        currentLine += (currentLine ? ' ' : '') + word;
    }

    if (currentLine) {
        lines.push(currentLine.trim());
    }

    return lines.join('\n');
}


function extractSecretFinding(secretResults, annotations) {
    const currentCommit = process.env.GITHUB_SHA;

    for (const finding of secretResults.findings) {
        const finding_commit = finding["commit"]["hash"];
        const is_secret_in_current_commit = currentCommit.startsWith(finding_commit);

        if(!is_secret_in_current_commit) {
            continue;
        }

        annotations.push({
            file: finding["file_name"],
            startLine: finding.position["start_line"],
            endLine: finding.position["end_line"],
            priority: secretResults["priority"],
            status: secretResults["status"],
            title: `[${secretResults["priority"]}] ${secretResults.catalog_control["title"]}`,
            details: getSecretDetails(secretResults),
        });
    }
}


function extractAnnotations(results) {
    let annotations = [];
    for (const secretResults of results.results.secret_detection.results) {
        extractSecretFinding(secretResults, annotations);
    }

    return annotations;
}

function annotateChangesWithResults(results) {
    const annotations = extractAnnotations(results);
    annotations.forEach((annotation) => {
        let annotationProperties = {
            title: annotation.title,
            startLine: annotation.startLine,
            endLine: annotation.endLine,
            file: annotation.file,
        };
        if (annotation.status === "FAILED") {
            core.error(annotation.details, annotationProperties);
        } else {
            core.warning(annotation.details, annotationProperties);
        }
    });
}

module.exports = {
    annotateChangesWithResults,
};
