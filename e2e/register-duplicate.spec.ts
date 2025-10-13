// This line imports the necessary modules from the Playwright test library.
// 'test' is the main function used to define a test block.
// 'expect' is the assertion library used to make checks in the test.
import { test, expect } from '@playwright/test';

// This defines the start of a test case block.
// `"registering with an existing email shows an error"`: This is a human-readable title for the test that will appear in test reports.
// `async ({ page }) => { ... }`: This is an asynchronous function that contains the actual test logic.
//   - Playwright automatically provides a single OBJECT containing test 'fixtures' (tools) to this function.
//   - The `{ page }` syntax is a JavaScript feature called 'object destructuring'. It's a shortcut that says:
//     "From the incoming fixtures object, extract the `page` property and make it available as a local variable."
//   - The `page` object itself is the primary tool for interacting with the web page, like a remote control for the browser.
test('registering with an existing email shows an error', async ({ page }) => {

  // Navigate to the register page
  await page.goto('/register');

  // Define an email that is known to exist in the system and a password
  const seededEmail = 'jdwright963@gmail.com';
  const password = 'Password123!';

  // Fill in the email and password fields
  await page.getByLabel('Email').fill(seededEmail);
  await page.getByLabel('Password').fill(password);

  // Locate and click the register button
  const submitBtn = page.getByRole('button', { name: /register/i });
  await submitBtn.click();

  // Assert that the specific error message "email already in use" is visible anywhere on the page.
  // Playwright's `getByText` automatically waits for the element to appear and become visible.
  await expect(page.getByText(/email already in use/i)).toBeVisible({ timeout: 10000 });
});