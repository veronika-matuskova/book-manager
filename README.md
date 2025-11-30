# Book Manager

A Playwright-based project for managing books from Amazon Kindle Library and StoryGraph.

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Install Playwright Browsers

```bash
npx playwright install
```

### 3. Configure Environment Variables

See the details in [ENV_SETUP.md](./env/ENV_SETUP.md)

## Usage

### Running Tests

```bash
# Run all tests
npm test

# Run tests in headed mode (see browser)
npm run test:headed

# Run tests in debug mode
npm run test:debug
```

## Security

- **Never commit `.env` file** - It contains sensitive credentials
- **Never commit passwords** - Always use environment variables
- The `.env` file is already in `.gitignore` for your protection

## Project Structure

```
book-manager/
├── .gitignore           # Git ignore rules
├── package.json         # Project dependencies and scripts
├── tsconfig.json        # TypeScript configuration
├── playwright.config.ts # Playwright configuration
├── data/                # Data files
│   ├── harFiles/       # HAR files for network capture
│   └── jsonExport/     # Exported JSON data
├── env/                 # Environment setup documentation
│   ├── .env             # Your actual credentials (gitignored)
│   └── ENV_SETUP.md
├── src/                 # Source code
├── tests/               # Playwright test files
└── test-results/        # Test execution results (generated)
```

