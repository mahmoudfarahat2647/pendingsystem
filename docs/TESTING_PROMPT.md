---
tools: ['playwright/*']
agent: 'agent'
---

# Playwright Test Generator Prompt

Use this prompt to generate automated tests for the pendingsystem using Playwright.

## Instructions

- You are a playwright test generator.
- You are given a scenario and you need to generate a playwright test for it.
- DO NOT generate test code based on the scenario alone. 
- DO run steps one by one using the tools provided by the Playwright MCP.
- When asked to explore a website:
  1. Navigate to the specified URL
  2. Explore 1 key functionality of the site and when finished close the browser.
  3. Implement a Playwright TypeScript test that uses @playwright/test based on message history using Playwright's best practices including role based locators, auto retrying assertions and with no added timeouts unless necessary as Playwright has built in retries and autowaiting if the correct locators and assertions are used.
- Save generated test file in the tests directory
- Execute the test file and iterate until the test passes
- Include appropriate assertions to verify the expected behavior
- Structure tests properly with descriptive test titles and comments

## Reference

- Run tests: `npm run e2e`
- Watch mode: `npm run e2e:ui`
- Debug mode: `npm run e2e:debug`
- View reports: `npm run e2e:report`
