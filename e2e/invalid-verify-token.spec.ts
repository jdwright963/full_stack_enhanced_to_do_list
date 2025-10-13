// This line imports the necessary modules from the Playwright test library.
// 'test' is the main function used to define a test block.
// 'expect' is the assertion library used to make checks in the test.
import { test, expect } from "@playwright/test";

// This defines the start of a test case block.
// `"unauthenticated access to /tasks redirects to login"`: This is a human-readable title for the test that will appear in test reports.
// `async ({ page }) => { ... }`: This is an asynchronous function that contains the actual test logic.
//   - Playwright automatically provides a single OBJECT containing test 'fixtures' (tools) to this function.
//   - The `{ page }` syntax is a JavaScript feature called 'object destructuring'. It's a shortcut that says:
//     "From the incoming fixtures object, extract the `page` property and make it available as a local variable."
//   - The `page` object itself is the primary tool for interacting with the web page, like a remote control for the browser.
test("visiting verify-email with an invalid token shows an error or redirects with failure", async ({ page }) => {

  // This line declares a constant variable named `bogusToken` and assigns it a string value.
  // This string represents a deliberately invalid or non-existent email verification token,
  // which will be used to simulate an unsuccessful email verification attempt.
  const bogusToken = "this-token-does-not-exist-or-is-expired";

  // This line navigates the browser page to a specific URL: `/verify-email/${bogusToken}`.
  // It constructs the URL dynamically by embedding the `bogusToken` variable into the path.
  // This simulates a user attempting to verify their email with an invalid token.
  // 'await' ensures that the navigation is complete before the next line of code executes.
  await page.goto(`/verify-email/${bogusToken}`);

  // This line performs an assertion to verify that an element containing the specific error text is visible on the page.
  // `page.getByText(/invalid or expired verification token/i)` gets a Playwright Locator for any element
  // whose text content matches the regular expression `/invalid or expired verification token/i` (case-insensitive).
  // `.toBeVisible()` is an assertion that checks if the element found by the locator is currently visible in the browser viewport.
  // This confirms that the application correctly displays an error message when an invalid verification token is used.
  await expect(page.getByText(/invalid or expired verification token/i)).toBeVisible();
}); 