# TestSprite Integration Guide

This document explains how to use TestSprite MCP Server alongside the existing testing tools in the pendingsystem project.

## Overview

TestSprite MCP Server provides AI-powered automated testing capabilities that complement our existing testing stack:
- Unit tests: Vitest with React Testing Library
- E2E tests: Playwright
- AI-powered tests: TestSprite (new)

## Setup

1. **Get API Key**: Sign up at TestSprite and obtain your API key from the dashboard
2. **Update Configuration**: Replace `YOUR_API_KEY_HERE` in `mcp.json` with your actual API key:

```json
{
  "mcpServers": {
    "TestSprite": {
      "command": "npx",
      "args": ["@testsprite/testsprite-mcp@latest"],
      "env": {
        "API_KEY": "your-actual-api-key-here"
      }
    }
  }
}
```

3. **IDE Setup**: Configure your IDE (Cursor, VS Code, Claude, etc.) to use MCP servers

## Usage

### Using TestSprite in Your IDE

1. With your project open in an MCP-compatible IDE
2. Use the prompt: `Help me test this project with TestSprite.`
3. Drag your project folder into the AI assistant chat
4. The AI will analyze your code and generate appropriate tests

### TestSprite Capabilities

TestSprite will automatically handle:
- Reading your product requirements
- Analyzing your codebase
- Generating comprehensive test plans
- Creating executable test scripts
- Executing tests in secure cloud environments
- Providing detailed results and actionable insights
- Suggesting fixes for identified issues

### Integration with Existing Tests

TestSprite works alongside your existing testing tools:

```bash
# Run existing unit tests
npm test

# Run existing E2E tests
npm run e2e

# Use TestSprite via IDE prompt
# "Help me test this project with TestSprite."
```

## Testing Coverage

TestSprite complements our existing coverage by providing:

### Frontend Testing
- Business-flow E2E testing
- User journey navigation
- Form flows & validation
- Visual states & layouts
- Interactive components & stateful UI
- Authorization & auth flows
- Error handling (UI)

### Backend Testing
- Functional API workflows
- Contract & schema validation
- Error handling & resilience
- Authorization & authentication
- Boundary & edge cases
- Data integrity & persistence
- Security testing

## Best Practices

1. Use TestSprite for exploratory and AI-powered testing
2. Continue using Vitest for unit tests
3. Continue using Playwright for specific E2E scenarios
4. Leverage TestSprite for finding edge cases that manual tests might miss
5. Use TestSprite's AI insights to improve existing test coverage

## Troubleshooting

### Node.js Version
Ensure you're using Node.js >= 22:
```bash
node --version
```

### IDE Configuration
- For Cursor: Disable "Run in Sandbox" mode for full functionality
- For VS Code: Use MCP extension and configure the server properly

## Resources

- [TestSprite Documentation](https://docs.testsprite.com/mcp/getting-started/overview)
- [Existing Testing Guide](QA_AND_DEBUGGING_RULES.md)
