# Testing & Verification Guidelines

1. **Browser Testing & Screenshots**:
   - DO NOT run tests in the browser (e.g. browser subagents or automated browser testing) when you can simply ask the user for screenshots.
   - Prefer asking the user for visual confirmation and screenshots rather than taking over the browser.

2. **Automated Test Execution**:
   - DO NOT run tests (e.g. unit/integration test suites like `npm test` / vitest) unless the session is about to end or explicitly instructed by the user.
