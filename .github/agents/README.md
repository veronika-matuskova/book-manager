# Playwright Agents

This directory contains Playwright agents that use the Playwright MCP (Model Context Protocol) server to interact with your tests.

## Available Agents

### 1. playwright-test-planner
**Purpose**: Creates comprehensive test plans for web applications

**When to use**: When you need to explore a website or web application and create a detailed test plan covering all functionality.

**How it works**:
- Navigates and explores the application interface
- Identifies interactive elements, forms, and navigation paths
- Creates detailed test scenarios with step-by-step instructions
- Saves the test plan as a markdown file

### 2. playwright-test-generator
**Purpose**: Generates automated browser tests from test plans

**When to use**: When you have a test plan and want to generate actual Playwright test code.

**How it works**:
- Reads test plans from the `specs/` directory
- Executes each step in real-time using Playwright tools
- Generates test code based on the executed actions
- Saves the generated tests to the `tests/` directory

### 3. playwright-test-healer
**Purpose**: Debugs and fixes failing Playwright tests

**When to use**: When you have failing tests that need to be debugged and fixed.

**How it works**:
- Runs all tests to identify failures
- Uses Playwright's debug tools to investigate errors
- Analyzes selectors, timing issues, and assertion failures
- Automatically fixes the test code
- Verifies fixes by re-running tests

## Running the Agents

### Option 1: Using Cursor's Agent Interface

If you're using Cursor with agent support:
1. Open the agent picker (usually via a command palette or UI)
2. Select one of the Playwright agents:
   - `playwright-test-planner`
   - `playwright-test-generator`
   - `playwright-test-healer`
3. Follow the agent's prompts

### Option 2: Running the MCP Server Directly

The agents require the Playwright MCP server. You can run it manually:

```bash
# Run in headed mode (default, shows browser)
npx playwright run-test-mcp-server

# Run in headless mode
npx playwright run-test-mcp-server --headless

# Specify a config file
npx playwright run-test-mcp-server -c playwright.config.ts

# Run on a specific port
npx playwright run-test-mcp-server --port 3000
```

### Option 3: Using with MCP Clients

If you're using an MCP client, configure it to use the Playwright MCP server:

```json
{
  "mcpServers": {
    "playwright-test": {
      "command": "npx",
      "args": ["playwright", "run-test-mcp-server"]
    }
  }
}
```

## Prerequisites

1. **Install Playwright browsers** (if not already installed):
   ```bash
   npx playwright install
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

## Example Workflow

1. **Create a test plan**:
   - Use `playwright-test-planner` to explore your application
   - The agent will create a test plan in `specs/`

2. **Generate tests**:
   - Use `playwright-test-generator` with the test plan
   - Tests will be generated in `tests/`

3. **Run and fix tests**:
   - Run tests: `npm test`
   - If tests fail, use `playwright-test-healer` to debug and fix them

## Configuration

The agents use your `playwright.config.ts` file for configuration. Make sure it's properly set up before running the agents.

## Troubleshooting

- **MCP server not found**: Make sure Playwright is installed (`npm install @playwright/test playwright`)
- **Browser not launching**: Run `npx playwright install` to install browsers
- **Port conflicts**: Use `--port` flag to specify a different port
- **Config issues**: Verify `playwright.config.ts` is valid

