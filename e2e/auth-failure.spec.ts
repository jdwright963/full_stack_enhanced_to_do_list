
// This line imports the necessary modules from the Playwright test library.
// 'test' is the main function used to define a test block.
// 'expect' is the assertion library used to make checks in the test.
import { test, expect } from '@playwright/test';

// This defines the start of a test case block.
// `"shows error for wrong credentials"`: This is a human-readable title for the test that will appear in test reports.
// `async ({ page }) => { ... }`: This is an asynchronous function that contains the actual test logic.
//   - Playwright automatically provides a single OBJECT containing test 'fixtures' (tools) to this function.
//   - The `{ page }` syntax is a JavaScript feature called 'object destructuring'. It's a shortcut that says:
//     "From the incoming fixtures object, extract the `page` property and make it available as a local variable."
//   - The `page` object itself is the primary tool for interacting with the web page, like a remote control for the browser.
test('shows error for wrong credentials', async ({ page }) => {

    // This line navigates the browser page to the '/login' route of the application.
    // 'await' ensures that the navigation is complete before the next line of code executes.
    await page.goto('/login');

    // This line locates an input field with the label 'Email' and fills it with the text 'noone@example.com'.
    // 'await' ensures that the fill action is complete before proceeding.
    await page.getByLabel('Email').fill('noone@example.com');

    // This line locates an input field with the label 'Password' and fills it with the text 'wrongpassword'.
    // 'await' ensures that the fill action is complete before proceeding.
    await page.getByLabel('Password').fill('wrongpassword');

    // This line locates a button element that has the text 'Login' (case-insensitive due to /Login/i regular expression)
    // and then clicks it.
    // 'await' ensures that the click action is complete before proceeding.
    await page.getByRole('button', { name: /Login/i }).click();

    // This line performs an assertion.
    // It waits for an element containing the text 'Incorrect email or password' to be visible on the page.
    // 'expect(page.locator('text=Incorrect email or password'))' gets a locator for the specified text.
    // '.toBeVisible({ timeout: 10000 })' asserts that this element becomes visible within a maximum of 10 seconds (10000 milliseconds).
    // 'await' ensures that the assertion waits for the element to be visible before concluding the test.
    await expect(page.locator('text=Incorrect email or password')).toBeVisible({ timeout: 10000 });
});