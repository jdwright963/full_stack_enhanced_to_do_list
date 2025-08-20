// This file contains a comprehensive end-to-end test for the entire user
// authentication lifecycle. It simulates a new user's journey from registration
// and email verification through to a successful login and logout, ensuring all
// core auth features are working correctly.

// Imports the two fundamental building blocks from the Playwright test library.
// - `test`: A function used to declare a new, independent test case or a group of tests (`test.describe`).
// - `expect`: A function that provides assertion methods to check if various conditions are met
//   (e.g., is an element visible? does a value equal another value?).
import { test, expect } from "@playwright/test";

// Imports the `MailtrapClient` class from the `mailtrap` library. This is the main tool
// that allows our test script to programmatically interact with the Mailtrap API. We will use
// an instance of this client to fetch the contents of our test email inbox.
import { MailtrapClient } from "mailtrap";

// This line reads the `MAILTRAP_API_TOKEN` environment variable and stores it in a constant.
// `process.env`: This is a global object in Node.js that contains all environment variables for
// the current process. When Playwright runs this test, it will have loaded the variables from your
// `.env.test` file (for local runs) or from GitHub Secrets (for CI runs), making them available here.
// This token is a sensitive secret required to authenticate with the Mailtrap API.
const MAILTRAP_API_TOKEN = process.env.MAILTRAP_API_TOKEN;

// This line does the same as above, but for the `MAILTRAP_INBOX_ID`. This ID is a non-sensitive
// number that tells the Mailtrap API which specific inbox we want to interact with.
const MAILTRAP_INBOX_ID = process.env.MAILTRAP_INBOX_ID;

// This line reads the `MAILTRAP_ACCOUNT_ID` environment variable.
// Recent versions of the Mailtrap API client require this in addition to the API token.
// It specifies which Mailtrap user account the inbox belongs to.
const MAILTRAP_ACCOUNT_ID = process.env.MAILTRAP_ACCOUNT_ID;

// `test.describe()` is a function from Playwright used to group related test cases together
// into a "test suite". This is great for organization, as all tests within this block will
// appear under the "Authentication Flow" heading in the test report.
test.describe("Authentication Flow", () => {

    // These constants define the test data that will be used for this run. They are defined
    // inside the `describe` block so they are accessible to all tests within this suite.
    //
    // This line creates a new, unique email address for every single test run.
    // - `Date.now()`: A JavaScript function that returns the current timestamp in milliseconds.
    // - By embedding this timestamp in the email, we guarantee that the user has never been
    //   registered before, which is crucial for making the test reliable and repeatable.
    const uniqueEmail = `testuser_${Date.now()}@example.com`;

    // This defines a static, hardcoded password for our test user. Since this is only for
    // testing and the database is wiped before each run, using a simple password is secure.
    const password = "password123";

    // This is the declaration of our main test case within the suite.
    // `"User can register..."`: A descriptive, human-readable title for this specific test.
    // `async ({ page }) => { ... }`: The asynchronous function containing the actual test steps.
    //   Playwright provides the `page` fixture, which is our main tool for browser interaction.
    test("User can register, verify email, log in, and log out", async ({ page }) => {

        // This is a "pre-condition" check or a "sanity check". Its job is to ensure that the
        // environment is correctly configured before we even attempt to interact with the browser.
        if (!MAILTRAP_API_TOKEN || !MAILTRAP_INBOX_ID || !MAILTRAP_ACCOUNT_ID) {

            // If the variables are missing, we immediately `throw new Error`. This will cause the
            // test to fail instantly with a clear, explicit error message. This is much better
            // than letting the test continue and fail later with a more cryptic network timeout
            // error when it tries to connect to Mailtrap with no credentials.
            throw new Error("Mailtrap environment variables are not set.");
        }

        // This is the first browser action. It instructs the Playwright-controlled browser to
        // navigate to the `/register` page. We use a relative path because the `baseURL`
        // is configured in `playwright.config.ts`.
        await page.goto("/register");

        // This line finds the email input field and simulates a user typing in the unique email.
        // `page.getByLabel("Email")`: This is an accessibility-first "locator". It finds an
        // `<input>` element that is programmatically linked to a `<label>` with the exact text "Email".
        // `.fill(uniqueEmail)`: This method types the value of our `uniqueEmail` constant into the input field.
        await page.getByLabel("Email").fill(uniqueEmail);

        // This line does the same for the password field, finding it by its label and filling it
        // with the value of our `password` constant.
        await page.getByLabel("Password").fill(password);

        // This line finds the registration button and simulates a user click to submit the form.
        // `page.getByRole("button", { name: "Register" })`: This locator finds an element with the
        // accessible role of "button" that has the exact name "Register".
        // `.click()`: This method simulates a mouse click on the located button.
        await page.getByRole("button", { name: "Register" }).click();

        // This is a crucial "wait" condition and our first implicit assertion. After submitting
        // the form, we expect the application to redirect us to the login page.
        // `page.waitForURL("/login")`: This command tells Playwright to pause the test and wait
        // until the browser's URL changes to end with `/login`. If the redirect doesn't happen
        // within the timeout period, the test will fail.
        await page.waitForURL("/login");

        // This line creates and configures a new instance of the `MailtrapClient`.
        // We pass a configuration object to its constructor, providing the necessary
        // credentials to authenticate and authorize our API calls.
        const client = new MailtrapClient({ 
            token: MAILTRAP_API_TOKEN,
            accountId: parseInt(MAILTRAP_ACCOUNT_ID),

        });

        // This line prepares the Inbox ID for use with the Mailtrap client.
        // `process.env.MAILTRAP_INBOX_ID` reads the ID from the environment variables as a string.
        // However, the `getMessages` method from the Mailtrap client library expects the ID to be a
        // number. `parseInt()` is a standard JavaScript function that parses a string and returns an integer.
        const inboxId = parseInt(MAILTRAP_INBOX_ID);

        // This line declares a variable that will eventually hold the verification token we extract
        // from the email. We use `let` instead of `const` because its value will be reassigned
        // inside the loop below.
        //
        // `string | null`: This is a TypeScript "union type". It declares that this variable can
        // hold one of two types: either a `string` (once we find the token) or `null` (its initial state).
        //
        // `= null`: We initialize the variable to `null`. This represents the starting state where
        // we have not yet found the token.
        let verificationToken: string | null = null;

        // This is the beginning of a "polling" loop. Polling is a common strategy in E2E tests for
        // handling asynchronous events that take an unknown amount of time, like email delivery.
        // Instead of waiting a fixed amount of time, we will repeatedly check the inbox until we
        // find what we're looking for or until we time out.
        //
        // `for (let i = 0; i < 15; i++)`: This `for` loop will execute its body a maximum of 15 times.
        // Since we will wait 2 seconds at the end of each iteration, this gives the email up to
        // 30 seconds to arrive before the test fails.
        for (let i = 0; i < 15; i++) {

            // This is the main API call within our loop.
            // `await client.testing.messages.get(inboxId)`: We are calling the `get`
            // method on our Mailtrap client instance, passing it the ID of the inbox we want to check.
            // This method returns a Promise that resolves with an array of all the message objects
            // currently in that inbox.
            const messages = await client.testing.messages.get(inboxId);

            // This line searches through the array of all messages retrieved from the inbox.
            // `.find(...)`: A standard JavaScript array method that iterates over each `msg` object
            // in the `messages` array and returns the *first one* for which the provided condition is true.
            //
            // `msg => msg.to_email === uniqueEmail`: This is the "predicate" function. For each message,
            // it checks if the `to_email` property exactly matches the `uniqueEmail` string we
            // generated at the start of the test.
            //
            // The `userMessage` constant will hold the full message object if found, or `undefined` if not.
            const userMessage = messages.find(msg => msg.to_email === uniqueEmail);

            // This `if` block executes only if the `.find()` method above was successful and an email
            // sent to our test user was found in the inbox.
            if (userMessage) {

                // Fetch the final, rendered HTML content for the specific message.
                const htmlBody = await client.testing.messages.getHtmlMessage(inboxId, userMessage.id);

                // This line uses a Regular Expression to search the `htmlBody` string for our verification link
                // and extract the unique token from it.
                //
                // - `htmlBody.match()`: This is a standard JavaScript string method. Its job is to search the `htmlBody`
                //   string for a match against the provided regular expression.
                //
                //   - If it finds no match, it returns `null`.
                //
                //   - If it finds a match, it returns a special "Array-like" object containing the results.
                //     For example, if the link is `.../verify-email/abc123token"`, the `match` object would be:
                //     [
                //       'href="http://localhost:3000/verify-email/abc123token"', // index 0: The full match
                //       'abc123token',                                         // index 1: The first captured group
                //       // ... plus other properties like 'index' and 'input'
                //     ]
                //     This structure is why we later access `match[1]` to get just the token.
                //
                // - `/.../`: These forward slashes are the delimiters that define a Regular Expression literal.
                //
                // - `href="http:\/\/localhost:3000\/verify-email\/`: This matches the literal, static
                //   part of the URL. The `\` is an "escape character" that tells the regex engine to treat
                //   the following `/` as a normal character, not the end of the regex.
                //
                // - `(`...`)`: This is the crucial "Capturing Group". It tells the regex engine to not only
                //   match the pattern inside but to also capture and save the matched text as a separate result.
                //
                // - `[^"]+`: This is the pattern inside the capturing group. It means "match one or more (+)
                //   characters that are NOT (^) a double quote (")".
                //
                // - `"`: Finally, the regex matches the literal closing double quote of the `href` attribute.
                //
                // In summary, the regex says: "Find the verification link, and capture all the characters
                // that make up the token until you hit the closing quote."
                const match = htmlBody.match(/href="http:\/\/localhost:3000\/verify-email\/([^"]+)"/);

                // This `if` statement checks if our regular expression successfully found a match.
                // The `.match()` method returns an array if successful, or `null` if not.
                //
                // `match?.[1]`: This is a combination of two JavaScript features:
                // 1. `?.` (Optional Chaining): This safely checks if the `match` variable is not `null`
                //    or `undefined`. If it is, the entire expression short-circuits to `undefined`
                //    without causing an error.
                // 2. `[1]`: If `match` exists, we then access its element at index 1. When a regex
                //    with a capturing group `(...)` is successful, the array it returns contains:
                //    - `match[0]`: The full string that was matched (e.g., `href="..."`).
                //    - `match[1]`: The content of the first capturing group (the token itself).
                //
                // This condition is "truthy" only if a match was found AND it contained our captured token.
                if (match?.[1]) {

                    // If the condition is true, we have successfully extracted the token.
                    // We assign the value of the captured group (`match[1]`) to our `verificationToken`
                    // variable, which we declared earlier in the test.
                    verificationToken = match[1];

                    // This is a crucial command. The `break` statement immediately terminates the
                    // `for` loop. Since we have found the token, there is no need to continue polling
                    // the inbox.
                    break;
                }
            }

            // This line is the final step in each iteration of our polling loop.
            // It creates a 2-second pause before the loop runs again. This prevents us from
            // spamming the Mailtrap API with requests too quickly. The `await new Promise(...)`
            // pattern is the standard way to create a delay in an `async` function.
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        // This is a crucial assertion. It checks that our polling loop was successful.
        // `expect(verificationToken, ...)`: We are asserting something about the `verificationToken` variable.
        //
        // The second argument, `"Could not find..."`, is a powerful feature of Playwright's `expect`.
        // It provides a custom, human-readable error message that will be displayed in the test
        // report if this specific assertion fails. This makes debugging much easier.
        //
        // `.not.toBeNull()`: This is a chained assertion.
        // - `.not`: A "negator" that inverts the condition that follows.
        // - `.toBeNull()`: A matcher that checks if a value is `null`.
        // The entire expression reads: "Expect the `verificationToken` to NOT be `null`."
        // If the loop timed out and the token was never found, this will fail the test immediately.
        expect(verificationToken, "Could not find verification token in Mailtrap inbox.").not.toBeNull();

        // Now that we have successfully extracted the token, this line simulates the user clicking the verification link.
        // `await page.goto(...)`: Instructs the browser to navigate to a new URL.
        // `` `/verify-email/${verificationToken}` ``: We use a "template literal" (backticks) to construct
        // the dynamic verification URL by embedding our captured `verificationToken`.
        await page.goto(`/verify-email/${verificationToken}`);

        // This is another "wait" condition. After visiting the verification link, we expect the
        // server to process the token and then redirect us back to the login page.
        // `await page.waitForURL(...)`: This command tells Playwright to pause the test and wait
        // until the browser's URL has changed to exactly match `/login?verified=true`. This
        // confirms that the email verification was successful on the backend.
        await page.waitForURL("/login?verified=true");

        // Now that the user is verified and back on the login page, we can proceed with the login step.
        // This line finds the email input field by its associated label and fills it with our unique test email.
        await page.getByLabel("Email").fill(uniqueEmail);

        // This line finds the password input field by its associated label and fills it with our test password.
        await page.getByLabel("Password").fill(password);

        // This line finds the login button by its accessible role and name and simulates a user click.
        // This action submits the login form with the user's credentials.
        await page.getByRole("button", { name: "Login" }).click();

        // This is a "wait" condition that also acts as an assertion. We expect a successful login
        // to redirect the user to their main dashboard. This command tells Playwright to pause
        // the test and wait until the browser's URL changes to end with `/tasks`. If this
        // redirect does not happen, the test will fail, indicating a problem with the login process.
        await page.waitForURL("/tasks");

        // This is the final assertion for the successful login. It confirms that the correct
        // content has been rendered on the tasks page.
        // `page.getByRole("heading", ...)`: This locator finds the main heading element on the page.
        // `name: \`Tasks for ${uniqueEmail}\``: We are using a template literal to construct the
        // expected text of the heading, which should be personalized with the user's email.
        // `.toBeVisible()`: This assertion checks that the heading with the correct text is actually
        // visible on the screen, confirming a successful end-to-end login and page render.
        await expect(page.getByRole("heading", { name: `Tasks for ${uniqueEmail}` })).toBeVisible();

        // This begins the final step of the test: logging the user out.
        // It finds the "Sign Out" button by its accessible role and name and simulates a click.
        await page.getByRole("button", { name: "Sign Out" }).click();

        // This is the wait condition for the logout action. We expect that after logging out
        // from a protected page, the application will redirect the user back to the login page.
        // The `callbackUrl` is often added automatically by NextAuth.js to indicate the page the
        // user was on before being logged out.
        await page.waitForURL("/login?callbackUrl=/tasks");

        // Now that we have navigated to the login page, we assert that the main
        // "Login" heading is visible. This confirms that we are on the correct page
        // before we try to fill in the form.
        await expect(page.getByRole("heading", { name: "Login" })).toBeVisible();
  });
});