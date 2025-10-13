// This line imports the necessary modules from the Playwright test library.
// 'test' is the main function used to define a test block.
// 'expect' is the assertion library used to make checks in the test.
import { test, expect } from "@playwright/test";

// This defines the start of a test case block.
// `"adding a task that is too long does not create a task"`: This is a human-readable title for the test that will appear in test reports.
// `async ({ page }) => { ... }`: This is an asynchronous function that contains the actual test logic.
//   - Playwright automatically provides a single OBJECT containing test 'fixtures' (tools) to this function.
//   - The `{ page }` syntax is a JavaScript feature called 'object destructuring'. It's a shortcut that says:
//     "From the incoming fixtures object, extract the `page` property and make it available as a local variable."
//   - The `page` object itself is the primary tool for interacting with the web page, like a remote control for the browser.
test("adding a task that is too long does not create a task", async ({ page }) => {

  // Navigate to the login page
  await page.goto("/login");

  // Fill in email and password for a valid user
  await page.getByLabel("Email").fill("jdwright963@gmail.com");
  await page.getByLabel("Password").fill("Password123!");

  // Click the login button
  await page.getByRole("button", { name: /login/i }).click();

  // Wait for the URL to change to the tasks page after successful login
  // This implicitly confirms login and navigation to the correct page.
  await page.waitForURL("**/tasks", { timeout: 20000 });

  // Locate all list item elements.
  const tasks = page.locator('li');

  // Get the initial count of tasks currently visible on the page before attempting to add a new one.
  const initialCount = await tasks.count();

  // Locate the task input field
  const taskInput = page.getByPlaceholder("Add a new task...");

  // Create a string that exceeds the 255-character limit (e.g., 256 characters)
  const longText = "x".repeat(256);

  // Fill the task input with the too-long text
  await taskInput.fill(longText);

  // Locate the add task button and click it
  await page.getByRole("button", { name: /add/i }).click();

  // Assert that the specific error message becomes visible on the page
  await expect(page.getByText("Task title must be at most 255 characters.")).toBeVisible({ timeout: 10000 });

  // Re-count tasks after invalid add
  const finalCount = await tasks.count();

  // Check that no new task was added by comparing the count before and after the failed attempt.
  expect(finalCount).toBe(initialCount);
});