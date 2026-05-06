# E2E Testing Setup Guide

This guide explains how to set up and run End-to-End (E2E) tests for the Chess Stats App using Detox.

## What is Detox?

Detox is a gray-box end-to-end testing framework for mobile apps. It allows you to test your React Native app on a real device or simulator, simulating real user interactions.

## Prerequisites

### Required Software

1. **Node.js** (v16 or higher)
2. **Xcode** (latest version) - for iOS testing
3. **Xcode Command Line Tools**:
   ```bash
   xcode-select --install
   ```
4. **Homebrew** (recommended for macOS):
   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```

### Install Detox CLI

Install Detox CLI globally:

```bash
npm install -g detox-cli
```

Verify installation:

```bash
detox --version
```

### Install applesimutils (iOS only)

Required for controlling iOS simulators:

```bash
brew tap wix/brew
brew install applesimutils
```

## Project Setup

### 1. Dependencies

All necessary dependencies are already installed in the project:

- `detox` - E2E testing framework
- `detox-expo-helpers` - Helpers for Expo apps
- `jest-circus` - Test runner for Detox

If you need to reinstall:

```bash
npm install --save-dev detox detox-expo-helpers jest-circus --legacy-peer-deps
```

### 2. Configuration

The project is already configured with:

- `.detoxrc.js` - Detox configuration
- `e2e/jest.config.js` - Jest configuration for E2E tests
- Test files in `e2e/` directory

### 3. Test IDs

Test IDs have been added to key components for E2E testing:

- Authentication screens: `google-sign-in-screen`, `link-account-screen`
- Main screens: `dashboard-screen`, `openings-screen`, `games-screen`, `search-screen`
- Interactive elements: buttons, inputs, lists

## Running Tests

### Step 1: Build the App

Before running tests, build the app for the simulator:

```bash
npm run test:e2e:build
```

Or manually:

```bash
detox build --configuration ios.sim.debug
```

This creates a debug build optimized for testing.

### Step 2: Run Tests

Run all E2E tests:

```bash
npm run test:e2e
```

Or manually:

```bash
detox test --configuration ios.sim.debug
```

### Run Specific Tests

Run a single test file:

```bash
detox test e2e/auth.test.js --configuration ios.sim.debug
```

Run tests matching a pattern:

```bash
detox test --configuration ios.sim.debug --grep "Dashboard"
```

### Debug Mode

Run tests with detailed logging:

```bash
detox test --configuration ios.sim.debug --loglevel trace
```

Run tests with debugger:

```bash
detox test --configuration ios.sim.debug --debug-synchronization 500
```

## Test Files

### Current Test Suites

1. **auth.test.js** - Authentication flow
   - Google Sign-In screen display
   - OAuth flow initiation
   - Account linking
   - Username validation

2. **dashboard.test.js** - Dashboard functionality
   - Performance metrics display
   - Data loading states
   - Pull-to-refresh
   - Offline mode

3. **games-openings.test.js** - Games and openings browsing
   - Game archives navigation
   - Opening analysis display
   - Tab navigation
   - State preservation

4. **player-search.test.js** - Player search
   - Search input and submission
   - Profile display
   - Statistics display
   - Error handling

## Important Implementation Notes

### Authentication Testing

The current tests include **commented-out** test implementations because:

1. **Google OAuth**: Real Google authentication requires:
   - Valid Google credentials
   - Browser interaction
   - OAuth callback handling

2. **Recommended Approaches**:
   - **Mock Authentication**: Mock the Supabase auth service
   - **Test Accounts**: Use dedicated test Google accounts
   - **Bypass Auth**: Create a test mode that skips authentication

### API Mocking

For reliable tests, you should:

1. **Mock Chess.com API**:
   - Use a mock server (e.g., `json-server`, `msw`)
   - Intercept network requests
   - Return consistent test data

2. **Test Data**:
   - Create fixtures for player profiles
   - Mock game archives
   - Provide known opening analysis results

### Enabling Tests

To enable the commented tests:

1. Set up authentication mocking
2. Create test data fixtures
3. Uncomment test implementations
4. Update with your test data

Example:

```javascript
// Before (commented):
// await element(by.id('google-sign-in-button')).tap();

// After (enabled with mock):
await element(by.id('google-sign-in-button')).tap();
await waitFor(element(by.id('link-account-screen')))
  .toBeVisible()
  .withTimeout(5000);
```

## Troubleshooting

### Common Issues

#### 1. "Cannot find element" errors

**Problem**: Test can't find an element by testID

**Solutions**:
- Verify the element has a `testID` prop
- Check if element is rendered conditionally
- Use `--loglevel trace` to see element tree
- Try `by.text()` instead of `by.id()`

#### 2. Build failures

**Problem**: App fails to build for testing

**Solutions**:
```bash
# Clean Detox cache
detox clean-framework-cache
detox build-framework-cache

# Rebuild app
detox build --configuration ios.sim.debug

# Check Xcode for errors
open ios/chessstatsapp.xcworkspace
```

#### 3. Tests timeout

**Problem**: Tests hang or timeout

**Solutions**:
- Increase timeout: `.withTimeout(20000)`
- Check if app is stuck on loading screen
- Verify network requests complete
- Use `device.disableSynchronization()` for animations

#### 4. Simulator issues

**Problem**: Simulator doesn't launch or behaves incorrectly

**Solutions**:
```bash
# List available simulators
xcrun simctl list devices

# Boot specific simulator
xcrun simctl boot "iPhone 15"

# Reset simulator
xcrun simctl erase "iPhone 15"
```

#### 5. Detox server connection issues

**Problem**: Can't connect to Detox server

**Solutions**:
- Ensure no other Detox instances are running
- Kill any hanging processes:
  ```bash
  killall -9 node
  ```
- Restart Metro bundler

### Debug Strategies

1. **Take Screenshots**:
   ```javascript
   await device.takeScreenshot('debug-screenshot');
   ```

2. **Log Element Tree**:
   ```bash
   detox test --configuration ios.sim.debug --loglevel trace
   ```

3. **Run Single Test**:
   ```bash
   detox test e2e/auth.test.js --configuration ios.sim.debug
   ```

4. **Manual Testing**:
   - Build and run app in simulator
   - Verify UI elements exist
   - Check testID props

## Best Practices

### 1. Use testID Consistently

Always add `testID` to testable elements:

```jsx
<TouchableOpacity testID="submit-button" onPress={handleSubmit}>
  <Text>Submit</Text>
</TouchableOpacity>
```

### 2. Wait for Elements

Use `waitFor()` for async operations:

```javascript
await waitFor(element(by.id('dashboard-screen')))
  .toBeVisible()
  .withTimeout(10000);
```

### 3. Avoid Hardcoded Delays

Don't use `setTimeout()`, use `waitFor()`:

```javascript
// Bad
await new Promise(resolve => setTimeout(resolve, 3000));

// Good
await waitFor(element(by.id('data-loaded')))
  .toBeVisible()
  .withTimeout(5000);
```

### 4. Test User Flows

Focus on complete user journeys:

```javascript
it('should complete sign-in and view dashboard', async () => {
  await element(by.id('google-sign-in-button')).tap();
  await waitFor(element(by.id('link-account-screen'))).toBeVisible();
  await element(by.id('username-input')).typeText('testuser');
  await element(by.id('link-account-button')).tap();
  await waitFor(element(by.id('dashboard-screen'))).toBeVisible();
});
```

### 5. Keep Tests Independent

Each test should work in isolation:

```javascript
beforeEach(async () => {
  await device.reloadReactNative();
});
```

## Continuous Integration

### GitHub Actions Example

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci --legacy-peer-deps
      
      - name: Install Detox CLI
        run: npm install -g detox-cli
      
      - name: Build app
        run: detox build --configuration ios.sim.release
      
      - name: Run tests
        run: detox test --configuration ios.sim.release --cleanup
      
      - name: Upload screenshots
        if: failure()
        uses: actions/upload-artifact@v2
        with:
          name: detox-screenshots
          path: artifacts/
```

## Next Steps

1. **Set Up Mocking**: Implement API mocking for reliable tests
2. **Create Test Data**: Build fixtures for consistent test data
3. **Enable Tests**: Uncomment and complete test implementations
4. **Add More Tests**: Cover additional user flows
5. **CI Integration**: Set up automated testing in CI/CD pipeline

## Resources

- [Detox Documentation](https://wix.github.io/Detox/)
- [Detox with Expo](https://docs.expo.dev/guides/detox/)
- [Jest Matchers](https://wix.github.io/Detox/docs/api/matchers)
- [Detox Actions](https://wix.github.io/Detox/docs/api/actions)
- [Detox Troubleshooting](https://wix.github.io/Detox/docs/troubleshooting/building-the-app)

## Support

For issues or questions:

1. Check the [Detox GitHub Issues](https://github.com/wix/Detox/issues)
2. Review the [Detox Troubleshooting Guide](https://wix.github.io/Detox/docs/troubleshooting/building-the-app)
3. Consult the test files in `e2e/` for examples
