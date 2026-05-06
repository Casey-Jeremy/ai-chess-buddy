# E2E Tests with Detox

This directory contains End-to-End (E2E) tests for the Chess Stats App using Detox.

## Overview

The E2E tests verify the complete user flows and interactions in the app, including:

- **Authentication Flow** (`auth.test.js`): Google Sign-In and Chess.com account linking
- **Dashboard** (`dashboard.test.js`): Performance metrics and data display
- **Games & Openings** (`games-openings.test.js`): Browsing game archives and opening analysis
- **Player Search** (`player-search.test.js`): Searching for and viewing other players

## Prerequisites

Before running E2E tests, ensure you have:

1. **Xcode** installed (for iOS simulator)
2. **iOS Simulator** running
3. **Detox CLI** installed globally:
   ```bash
   npm install -g detox-cli
   ```

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Build the app for testing:
   ```bash
   detox build --configuration ios.sim.debug
   ```

## Running Tests

### Run all tests:
```bash
detox test --configuration ios.sim.debug
```

### Run specific test file:
```bash
detox test e2e/auth.test.js --configuration ios.sim.debug
```

### Run with specific device:
```bash
detox test --configuration ios.sim.debug --device-name="iPhone 15"
```

### Run in debug mode:
```bash
detox test --configuration ios.sim.debug --loglevel trace
```

## Test Structure

Each test file follows this structure:

```javascript
describe('Feature Name', () => {
  beforeAll(async () => {
    // Launch app once before all tests
    await device.launchApp({ newInstance: true });
  });

  beforeEach(async () => {
    // Reset state before each test
    await device.reloadReactNative();
  });

  it('should do something', async () => {
    // Test implementation
  });
});
```

## Important Notes

### Authentication Testing

The current tests include placeholders for authentication flows. To fully test authentication:

1. **Mock Supabase Auth**: Set up mocks for the Supabase authentication service
2. **Test Credentials**: Use test Google accounts or mock OAuth responses
3. **State Management**: Implement helpers to set up authenticated state

### API Mocking

For reliable E2E tests, consider:

1. **Mock Chess.com API**: Use a mock server or intercept network requests
2. **Test Data**: Create consistent test data for predictable results
3. **Offline Testing**: Test offline mode by disabling network in tests

### Test Data

The tests assume certain data exists:

- A test Chess.com account with game history
- Known usernames for search tests (e.g., 'hikaru', 'magnuscarlsen')
- Consistent API responses

### Debugging

If tests fail:

1. **Take Screenshots**: Tests can capture screenshots on failure
2. **Check Logs**: Use `--loglevel trace` for detailed logs
3. **Run Simulator**: Manually verify the app works in simulator
4. **Check Test IDs**: Ensure all elements have correct `testID` props

## Configuration

The Detox configuration is in `.detoxrc.js`:

- **Apps**: Defines build commands and binary paths
- **Devices**: Specifies simulator types
- **Configurations**: Combines apps and devices

## Continuous Integration

To run tests in CI:

1. Set up iOS simulator in CI environment
2. Build the app: `detox build --configuration ios.sim.release`
3. Run tests: `detox test --configuration ios.sim.release --cleanup`

## Helper Functions

Common test utilities are in `helpers.js`:

- `waitForElement()`: Wait for element to appear
- `navigateToTab()`: Navigate between tabs
- `pullToRefresh()`: Simulate pull-to-refresh
- `goOffline()`/`goOnline()`: Test offline mode
- `takeScreenshot()`: Capture screenshots

## Best Practices

1. **Use testID**: Always add `testID` props to elements you want to test
2. **Wait for Elements**: Use `waitFor()` for async operations
3. **Avoid Hardcoded Delays**: Use `waitFor()` instead of `setTimeout()`
4. **Test User Flows**: Focus on complete user journeys, not individual components
5. **Keep Tests Independent**: Each test should work in isolation
6. **Clean Up**: Reset state between tests

## Troubleshooting

### "Cannot find element" errors
- Verify the element has a `testID` prop
- Check if element is actually rendered
- Use `--loglevel trace` to see element tree

### Tests timeout
- Increase timeout in test: `.withTimeout(20000)`
- Check if app is stuck on a screen
- Verify network requests complete

### Build failures
- Clean build: `detox clean-framework-cache && detox build-framework-cache`
- Rebuild app: `detox build --configuration ios.sim.debug`
- Check Xcode for build errors

## Resources

- [Detox Documentation](https://wix.github.io/Detox/)
- [Detox with Expo](https://docs.expo.dev/guides/detox/)
- [Jest Matchers](https://wix.github.io/Detox/docs/api/matchers)
- [Detox Actions](https://wix.github.io/Detox/docs/api/actions)
