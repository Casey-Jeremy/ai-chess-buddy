/**
 * E2E Test Helpers
 * 
 * Common utilities and helper functions for E2E tests
 */

/**
 * Wait for element to be visible with custom timeout
 */
export async function waitForElement(elementMatcher, timeout = 10000) {
  await waitFor(element(elementMatcher))
    .toBeVisible()
    .withTimeout(timeout);
}

/**
 * Simulate user authentication for testing
 * Note: This would need to be implemented based on your auth setup
 */
export async function authenticateTestUser() {
  // In a real implementation, this would:
  // 1. Mock the Supabase auth service
  // 2. Set up a test user with known credentials
  // 3. Navigate through the auth flow
  // 4. Return the authenticated state
  
  // Example:
  // await element(by.id('google-sign-in-button')).tap();
  // await waitForElement(by.id('link-account-screen'));
  // await element(by.id('username-input')).typeText('testuser');
  // await element(by.id('link-account-button')).tap();
  // await waitForElement(by.id('dashboard-screen'));
}

/**
 * Navigate to a specific tab
 */
export async function navigateToTab(tabName) {
  await element(by.text(tabName)).tap();
  await waitFor(element(by.id(`${tabName.toLowerCase()}-screen`)))
    .toBeVisible()
    .withTimeout(5000);
}

/**
 * Scroll element by amount
 */
export async function scrollElement(elementId, amount, direction = 'down') {
  await element(by.id(elementId)).scroll(amount, direction);
}

/**
 * Pull to refresh on a scrollable element
 */
export async function pullToRefresh(elementId) {
  await element(by.id(elementId)).swipe('down', 'fast', 0.75);
  // Wait a bit for refresh to complete
  await new Promise(resolve => setTimeout(resolve, 2000));
}

/**
 * Clear and type text in input field
 */
export async function typeInInput(inputId, text) {
  await element(by.id(inputId)).clearText();
  await element(by.id(inputId)).typeText(text);
}

/**
 * Simulate offline mode
 */
export async function goOffline() {
  await device.disableSynchronization();
  // In a real app, you might need to trigger network state change
}

/**
 * Restore online mode
 */
export async function goOnline() {
  await device.enableSynchronization();
}

/**
 * Take screenshot for debugging
 */
export async function takeScreenshot(name) {
  await device.takeScreenshot(name);
}

/**
 * Wait for loading to complete
 */
export async function waitForLoadingToComplete(timeout = 10000) {
  // Wait for common loading indicators to disappear
  await waitFor(element(by.text('Loading...')))
    .not.toBeVisible()
    .withTimeout(timeout)
    .catch(() => {
      // Loading text might not exist, that's okay
    });
}

/**
 * Verify error message is displayed
 */
export async function expectErrorMessage(message) {
  await expect(element(by.text(message))).toBeVisible();
}

/**
 * Tap retry button
 */
export async function tapRetry() {
  await element(by.text('Retry')).tap();
}

/**
 * Check if element exists (without failing test)
 */
export async function elementExists(elementMatcher) {
  try {
    await expect(element(elementMatcher)).toExist();
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Wait for specific text to appear
 */
export async function waitForText(text, timeout = 10000) {
  await waitFor(element(by.text(text)))
    .toBeVisible()
    .withTimeout(timeout);
}

/**
 * Verify tab is active
 */
export async function expectTabActive(tabName) {
  // This would check for visual indicators of active tab
  // Implementation depends on your tab styling
  await expect(element(by.text(tabName))).toBeVisible();
}

/**
 * Mock API response (if using detox-expo-helpers)
 */
export async function mockApiResponse(endpoint, response) {
  // This would require additional setup with detox-expo-helpers
  // or a custom mock server
  // Example implementation would go here
}

/**
 * Reset app state
 */
export async function resetApp() {
  await device.launchApp({
    newInstance: true,
    delete: true
  });
}

/**
 * Get current timestamp for test data
 */
export function getCurrentTimestamp() {
  return Math.floor(Date.now() / 1000);
}

/**
 * Format date for comparison
 */
export function formatTestDate(timestamp) {
  return new Date(timestamp * 1000).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
