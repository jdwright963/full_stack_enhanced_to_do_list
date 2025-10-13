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
test("unauthenticated access to /tasks redirects to login", async ({page}) => {

  // This line navigates the browser page to the '/tasks' route of the application.
  // 'await' ensures that the navigation attempt is complete before the next line of code executes.
  await page.goto("/tasks");

  // This line waits for the browser's URL to match a specific pattern after the navigation.
  // '**/login?callbackUrl=/tasks' is a glob pattern indicating that the URL should contain
  // '/login?callbackUrl=/tasks' at the end, regardless of the base domain.
  // This confirms that an unauthenticated access to '/tasks' has indeed redirected to the login page
  // with a callback URL parameter.
  // '{ timeout: 10000 }' specifies that Playwright should wait up to 10 seconds for this URL to be reached.
  await page.waitForURL("**/login?callbackUrl=/tasks", { timeout: 10000 });

  // This line performs an assertion to verify that the current URL of the page contains the string '/login'.
  // 'page.url()' retrieves the current URL of the browser page.
  // '.toContain("/login")' is an assertion from the 'expect' library that checks if the string '/login'
  // is present anywhere within the current URL. This confirms the redirection was successful.  
  expect(page.url()).toContain("/login");
});