// --- Purpose of this file ---
// This file contains an end-to-end (E2E) test for the main task management feature.
// It simulates a real user's entire journey: adding, completing, and deleting a task,
// verifying at each step that the UI behaves as expected.

// Imports the two fundamental building blocks from the Playwright test library.
// `test`: A function used to declare a new, independent test case.
// `expect`: A function that provides assertion methods to check if conditions are met (e.g., is an element visible?).
import { test, expect } from "@playwright/test";

// This defines the start of a test case block.
// `"Task flow: add, toggle, delete"`: This is a human-readable title for the test that will appear in test reports.
// `async ({ page }) => { ... }`: This is an asynchronous function that contains the actual test logic.
//   - Playwright automatically provides a single OBJECT containing test 'fixtures' (tools) to this function.
//   - The `{ page }` syntax is a JavaScript feature called 'object destructuring'. It's a shortcut that says:
//     "From the incoming fixtures object, extract the `page` property and make it available as a local variable."
//   - The `page` object itself is the primary tool for interacting with the web page, like a remote control for the browser.
test("Task flow: add, toggle, delete", async ({ page }) => {

  // This is the first action the test performs. `await` is used because network actions are asynchronous.
  // `page.goto(...)`: Instructs the browser controlled by Playwright to navigate to the specified URL.
  // In this case, it's the tasks page of your locally running application.
  await page.goto("http://localhost:3000/tasks");

  // This is a "Locator". It's a recipe for finding an element on the page. It doesn't find it yet, just defines how.
  // `page.getByPlaceholder(...)`: A user-facing locator that finds an `<input>` element by its placeholder text.
  // This is a robust way to select elements because it's how a real user would identify them.
  const input = page.getByPlaceholder("Add a task...");

  // This creates another locator, this time for the 'Add' button.
  // `page.getByRole("button", ...)`: Finds an element by its accessible role.
  // `{ name: /add/i }`: This option refines the locator. It looks for a button whose accessible name
  // contains the text "add". The `/.../i` makes the match case-insensitive (so "Add", "add", or "ADD" would all match).
  const addButton = page.getByRole("button", { name: /add/i });

  // This is the first user interaction. `await` ensures the test waits for the action to complete.
  // `input.fill(...)`: This simulates a user typing the provided string into the input field we located earlier.
  await input.fill("Write Playwright test");

  // This is the second user interaction.
  // `addButton.click()`: This simulates a user clicking the 'Add' button we located.
  // This action should trigger the form submission and create the new task.
  await addButton.click();

  // This creates a new Locator that finds an element on the page based on its visible text content.
  // It defines the recipe for finding an element that exactly matches the string "Write Playwright test".
  // This is how we'll refer to the new task item that should have been created by the previous steps.
  const taskText = page.getByText("Write Playwright test");

  // This is the first "assertion" of the test. An assertion is a check that must be true for the test to pass.
  // `await expect(...)`: The `expect` function takes a Locator (or a value) and returns an "asserter" object.
  // The `await` is crucial because Playwright will automatically wait for a short period for the condition to become true.
  // `.toBeVisible()`: This is the assertion condition. It checks if the element found by the `taskText` locator
  // is actually visible on the page. If the task was not created and added to the DOM, this will fail.
  await expect(taskText).toBeVisible();

  // This performs the next user action. It finds the element using the `taskText` locator and simulates a click on it.
  // Based on the application's code, this click should trigger the "toggle complete" functionality.
  await taskText.click();

  // This is the second assertion. It checks if the previous action had the correct effect on the UI.
  // `await expect(taskText)`: We are asserting something about the same `taskText` element.
  // `.toHaveClass(...)`: This assertion condition checks the `class` attribute of the HTML element.
  // It takes a Regular Expression `/line-through/` as an argument, which means it will pass if the `class`
  // attribute contains the string "line-through". This verifies that the task was visually marked as complete.
  await expect(taskText).toHaveClass(/line-through/);

  // This creates a "relative" Locator, which is a highly robust way to find an element
  // by chaining searches together, starting from an element we've already found (`taskText`).
  // This ensures we interact with the correct delete button belonging only to this specific task.
  //
  // The locator chain breaks down like this:
  // 1. `taskText.locator(...)`: The search starts from our `taskText` `<span>` element, not the whole page.
  // 2. `".. >> button"`: This is the selector string that defines the path from our start to our target.
  //    - `..`: A standard CSS selector that means "go up to the immediate parent element". This moves the
  //      search context from the `<span>` to its parent `<li>`, which acts as the container for the entire task row.
  //    - `>>`: A Playwright-specific separator for readability in chained selectors.
  //    - `button`: A CSS selector that means "now, from the parent `<li>`, find a descendant element that is a `<button>`".
  // 3. `{ hasText: "Delete" }`: This is a final filtering option. After finding the button(s) inside the `<li>`,
  //    it ensures we only select the one that has the exact visible text "Delete".
  const deleteButton = taskText.locator(".. >> button", { hasText: "Delete" });

  // This action simulates a user clicking the specific delete button we just located.
  await deleteButton.click();

  // This is the final assertion of the test flow.
  // `await expect(taskText)`: We are again asserting something about the original `taskText` element.
  // `.not`: This is a "negator". It inverts the next assertion. So instead of checking if it's visible, we check if it's NOT visible.
  // `.toBeVisible()`: The same assertion condition as before.
  // The entire line reads: "Expect the element located by `taskText` to NOT be visible". This confirms the deletion was successful.
  await expect(taskText).not.toBeVisible();
});