# GitHub Actions Workflows

This directory contains GitHub Actions workflows for CI/CD.

## Workflows

### `unit-tests.yml`
Runs unit tests on pull requests and pushes to main/master branches.

**Triggers:**
- Pull requests to `master` or `main`
- Pushes to `master` or `main`

**What it does:**
1. Checks out the code
2. Sets up Node.js 20.x
3. Installs dependencies with `npm ci`
4. Runs unit tests with `npm run test:unit:run`
5. Uploads test coverage artifacts (if available)

**Requirements:**
- Tests must pass for PRs to be mergeable (if branch protection is enabled)
- Uses `npm ci` for faster, reliable, reproducible builds

### `copilot-setup-steps.yml`
Copilot-specific setup workflow (for GitHub Copilot integration).

## Branch Protection

To require tests to pass before merging:

1. Go to repository Settings → Branches
2. Add a branch protection rule for `master`/`main`
3. Enable "Require status checks to pass before merging"
4. Select "Run Unit Tests" from the list

## Local Testing

To test workflows locally before pushing:

```bash
# Install act (GitHub Actions local runner)
# macOS: brew install act
# Or download from: https://github.com/nektos/act

# Run the unit tests workflow
act pull_request
```

## Troubleshooting

**Tests fail in CI but pass locally:**
- Check Node.js version (CI uses 20.x)
- Ensure all dependencies are in `package.json` (not just `package-lock.json`)
- Check for environment-specific code that might behave differently

**Workflow doesn't run:**
- Ensure the workflow file is in `.github/workflows/`
- Check that the branch name matches (`master` or `main`)
- Verify the workflow file has valid YAML syntax

