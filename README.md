# Orca Shift Left Security Action

[GitHub Action](https://github.com/features/actions)
for [Orca Shift Left Security](https://orca.security/solutions/shift-left-security/)

#### More info can be found in the official Orca Shift Left Security<a href="https://docs.orcasecurity.io/v1/docs/shift-left-security"> documentation</a>



### Table of Contents
  - [Table of Contents](#table-of-contents)
  - [Usage](#usage)
    - [Workflow](#workflow)
    - [Inputs](#inputs)
  - [Checks](#checks)
  - [Annotations](#annotations)
  - [Scan Summary](#scan-summary)
  - [Upload SARIF report](#upload-sarif-report)


## Usage

### Workflow

```yaml
name: Sample Orca Secrets Scan Workflow
  # Trigger the workflow on push and pull requests
on: [push, pull_request]
jobs:
  orca-secrets-scan:
    name: Orca secrets Scan
    runs-on: ubuntu-latest
    env:
      PROJECT_KEY: <project key> # Set the desired project to run the cli scanning with
    steps:
      # Checkout your repository under $GITHUB_WORKSPACE, so your job can access it
      - name: Checkout Repository
        uses: actions/checkout@v3
        with:
          fetch-depth: 0       

      - name: Run Orca Secrets Scan
        uses: orcasecurity/shiftleft-secrets-action@v1
        with:
          api_token: ${{ secrets.ORCA_SECURITY_API_TOKEN }}
          project_key: ${{ env.PROJECT_KEY }}
```


> [!NOTE]
> Utilizing **fetch-depth=0** is essential for a valid git history scan.



### Inputs

| Variable                    | Example Value &nbsp; | Description &nbsp;                                                                | Type    | Required | Default |
| --------------------------- | -------------------- | --------------------------------------------------------------------------------- | ------- | -------- | ------- |
| api_token                   |                      | Orca API Token used for Authentication                                            | String  | Yes      | N/A     |
| project_key                 | my-project-key       | Project Key name                                                                  | String  | Yes      | N/A     |
| path                        | sub-dir              | Path to scan                                                                      | String  | No       | .       |
| format                      | json                 | Format for displaying the results                                                 | String  | No       | table   |
| output                      | results/             | Output directory for scan results                                                 | String  | No       | N/A     |
| no_color                    | false                | Disable color output                                                              | Boolean | No       | false   |
| exit_code                   | 10                   | Exit code for failed execution due to policy violations                           | Integer | No       | 3       |
| control_timeout             | 30                   | Number of seconds the control has to execute before being canceled                | Integer | No       | 60      |
| silent                      | false                | Disable logs and warnings output                                                  | Boolean | No       | false   |
| console_output              | json                 | Prints results to console in the provided format (only when --output is provided) | String  | No       | cli     |
| config                      | config.json          | path to configuration file (json, yaml or toml)                                   | String  | No       | N/A     |
| show_annotations            | true                 | show GitHub annotations on pull requests                                          | Boolean | No       | true    |
| exceptions_filepath         | n/a                  | exceptions YAML filepath. (File should be mounted)                                | String  | No       | false   |
| num_cpu                     | 10                   | Number of logical CPUs to be used for secret scanning (default 10)                | Integer | No       | 10      |
| show_failed_issues_only     | n/a                  | show only failed issues                                                           | Boolean | No       | false   |
| from-commit                 | n/a                  | the commit to search *from*                                                       | String  | No       | N/A     |
| to-commit                   | n/a                  | the commit to search *to*                                                         | String  | No       | N/A     |
| disable-git-scan            | true                 | flag that indicates that the CLI will not scan git history for secrets            | Boolean | No       | false   |
| ignore-git-history-baseline | true                 | forces a full history scan                                                        | Boolean | No       | false   |


## Checks
Upon adding the action, two new checks will become visible on pull requests:

![](/assets/checks_preview.png)

* For the push event, the scanning process will target and analyze only the most recent push.
* Conversely, for the pull_request event, the scanning will encompass every commit that forms part of the pull request, diligently searching for any potential secrets.


## Annotations
After scanning, the action will add the results as annotations in a pull request:

![](/assets/secret_annotation_preview.png)
>  **NOTE:**  Annotations can be disabled by setting the "show_annotation" input to "false"


## Scan Summary
Every action will provide a clear scan summary output, and by clicking the 'View in code' link, you will be directed to the precise location of the secret.

![](/assets/secrets_summary_preview.png)

## Upload SARIF report
If you have [GitHub code scanning](https://docs.github.com/en/github/finding-security-vulnerabilities-and-errors-in-your-code/about-code-scanning) available you can use Orca Shift Left Security as a scanning tool
> **NOTE:**  Code scanning is available for all public repositories. Code scanning is also available in private repositories owned by organizations that use GitHub Enterprise Cloud and have a license for GitHub Advanced Security.

Configuration:

```yaml
name: Test Orca Secrets action - Sarif

on: [push, pull_request]

jobs:
  secrets_scan_job:
    runs-on: ubuntu-latest
    permissions:
      security-events: write
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0
      - name: Scan Secrets
        id: orcasecurity_secrets_scan
        uses: orcasecurity/shiftleft-secrets-action@v1
        with:
          api_token:
            ${{ secrets.ORCA_SECURITY_API_TOKEN }}
          project_key:
            "default"
          format:
            "sarif"
          output:
            "results/"
          console_output: "table"
      - name: Upload SARIF file
        uses: github/codeql-action/upload-sarif@v2
        if: ${{ always() && steps.orcasecurity_secrets_scan.outputs.exit_code != 1 }}
        with:
          sarif_file: results/secrets.sarif
```

The results list can be found on the security tab of your GitHub project and should look like the following image
![](/assets/code_scanning_list.png)


An entry should describe the error and in which line it occurred 
![](/assets/code_scanning_entry.png)

