# Chromatic Setup Guide

Chromatic is a visual regression testing platform for Storybook. This guide describes how to configure Chromatic for the Plan Tour project.

## What is Chromatic?

Chromatic automatically:

- Builds Storybook on every commit
- Takes snapshots of all stories
- Compares with previous versions
- Detects visual changes
- Allows you to accept or reject changes

## Step 1: Create an Account

1. Go to [chromatic.com](https://www.chromatic.com/)
2. Sign in via GitHub
3. Click "Add project"
4. Select the `tour-planner` repository

## Step 2: Get the Project Token

After adding the project:

1. Copy the displayed **Project Token**
2. Save it securely - you'll need it in the next steps

## Step 3: Local Configuration

Create a configuration file for local use:

```bash
cp .chromatic.config.example.json .chromatic.config.json
```

Open `.chromatic.config.json` and paste your token:

```json
{
  "projectToken": "chpt_your_actual_token_here",
  "buildScriptName": "build-storybook",
  "storybookBuildDir": "storybook-static",
  "onlyChanged": true,
  "exitZeroOnChanges": true,
  "exitOnceUploaded": true,
  "autoAcceptChanges": "main"
}
```

**⚠️ Note:** The `.chromatic.config.json` file is in `.gitignore` and should not be committed!

## Step 4: GitHub Actions Configuration

Add the token as a GitHub Secret:

1. Go to your repository Settings on GitHub
2. Click **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `CHROMATIC_PROJECT_TOKEN`
5. Secret: Paste your Project Token
6. Click **Add secret**

## Step 5: First Run

Run Chromatic locally:

```bash
npm run test:chromatic
```

This will:

1. Build Storybook (`npm run build-storybook`)
2. Upload the build to Chromatic
3. Create baseline snapshots
4. Display a link to the results

## Step 6: Review in Chromatic UI

1. Click the link from the output (or go to chromatic.com)
2. See all stories as snapshots
3. On the first run, everything will be "New" - accept them as the baseline

## CI/CD Workflow

After configuration, Chromatic runs automatically:

### Pull Request

1. You open a PR
2. GitHub Actions runs the `test.yml` workflow
3. The `chromatic` job builds and uploads snapshots
4. Chromatic compares with the baseline
5. If there are differences - shows them in the PR as a check

### Main Branch

1. After merging to `main`
2. Chromatic updates the baseline automatically (thanks to `autoAcceptChanges: "main"`)

## Usage

### Local Testing

```bash
# Run Chromatic
npm run test:chromatic

# Chromatic automatically:
# - Detects changes in stories
# - Compares only changed components (onlyChanged: true)
# - Exits with code 0 even if there are changes (exitZeroOnChanges: true)
```

### Accepting Changes

**In Chromatic UI:**

1. Go to the build on chromatic.com
2. See the differences (diff view)
3. Click ✓ Approve or ✗ Deny for each change

**Automatically:**

- Changes on the `main` branch are auto-accepted

### Rejecting Changes

If Chromatic shows unintended changes:

1. Reject them in the UI
2. Fix the code
3. Push a new commit
4. Chromatic will run again

## Configuration Options

### `.chromatic.config.json`

| Option              | Description                               |
| ------------------- | ----------------------------------------- |
| `projectToken`      | Chromatic project token                   |
| `buildScriptName`   | Script for building Storybook             |
| `storybookBuildDir` | Directory with built Storybook            |
| `onlyChanged`       | Test only changed components              |
| `exitZeroOnChanges` | Exit 0 even if there are changes (for CI) |
| `exitOnceUploaded`  | Exit right after upload (faster)          |
| `autoAcceptChanges` | Auto-accept changes on specified branch   |

### Advanced Options

```json
{
  "projectToken": "...",
  "skip": "true", // Skip test (useful in branch names)
  "ignoreLastBuildOnBranch": "main", // Ignore last build from branch
  "externals": ["public/**"], // Additional files to track
  "fileHashing": true, // Hash files for better caching
  "zip": true // Compress before upload
}
```

## Pull Request Integration

Chromatic adds a status check to PRs:

- ✓ **Passed** - No visual changes
- ⚠️ **Changes detected** - Found changes, requires review
- ✗ **Failed** - Build error

Click "Details" next to the check to see changes.

## Free Tier Limits

Chromatic's free plan offers:

- **5,000 snapshots/month**
- Unlimited number of users
- All basic features

Monitor usage in Settings → Billing on chromatic.com

## Snapshot Optimization

### Reduce Number of Stories

Instead of 10 similar stories:

```typescript
export const PrimarySmall: Story = { ... };
export const PrimaryMedium: Story = { ... };
export const PrimaryLarge: Story = { ... };
// ... x10 combinations
```

Use one story with all variants:

```typescript
export const AllVariants: Story = {
  render: () => (
    <div className="flex gap-4">
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
    </div>
  ),
};
```

### Skip Non-Visual Stories

```typescript
export const Interactive: Story = {
  parameters: {
    chromatic: { disableSnapshot: true },
  },
};
```

### Delay for Animations

```typescript
export const WithAnimation: Story = {
  parameters: {
    chromatic: { delay: 300 }, // Wait 300ms before snapshot
  },
};
```

## Troubleshooting

### Problem: "Project token is invalid"

**Solution:**

- Check if the token is correctly copied
- Check for spaces at the beginning/end
- Verify the token on chromatic.com

### Problem: Build timeouts

**Solution:**

```bash
# Build Storybook locally first
npm run build-storybook

# Check for errors
```

### Problem: Too many snapshots

**Solution:**

- Enable `onlyChanged: true` in configuration
- Reduce number of stories (see Optimization)
- Use `disableSnapshot` for stories that don't require testing

### Problem: Changes are not detected

**Solution:**

- Make sure Storybook is up to date: `npm run storybook`
- Clear cache: `rm -rf node_modules/.cache`
- Rebuild: `npm run build-storybook`

## Resources

- [Chromatic Documentation](https://www.chromatic.com/docs/)
- [Storybook Testing](https://storybook.js.org/docs/react/writing-tests/introduction)
- [Visual Testing Best Practices](https://www.chromatic.com/docs/test)

## Support

Problems with Chromatic?

- Documentation: https://www.chromatic.com/docs/
- Discord: https://discord.gg/storybook
- Email: support@chromatic.com
