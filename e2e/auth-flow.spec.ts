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

                console.log('userMessage keys:', Object.keys(userMessage));
                console.log('userMessage raw:', JSON.stringify(userMessage, null, 2));

                // const messageBody = userMessage.html_body ?? userMessage.text_body ?? userMessage.body;
                // const match = messageBody?.match(/\/verify-email\/([a-zA-Z0-9\-_]+)/);

                // Fetch the final, rendered HTML content for the specific message.
                const htmlBody = await client.testing.messages.getHtmlMessage(inboxId, userMessage.id);

                // Now that we have the HTML as a string, use a robust regular expression
                // to find the verification link and capture the token from its `href` attribute.
                const match = htmlBody.match(/href="http:\/\/localhost:3000\/verify-email\/([^"]+)"/);

                if (match?.[1]) {


                    verificationToken = match[1];


                    console.log(`Verification token found: ${verificationToken}`);


                    break;
                }
            }


            await new Promise(resolve => setTimeout(resolve, 2000));
        }

    
        expect(verificationToken, "Could not find verification token in Mailtrap inbox.").not.toBeNull();

    
        await page.goto(`/verify-email/${verificationToken}`);

    
        await page.waitForURL("/login?verified=true");

    
        await page.getByLabel("Email").fill(uniqueEmail);


        await page.getByLabel("Password").fill(password);


        await page.getByRole("button", { name: "Login" }).click();

    
        await page.waitForURL("/tasks");


        await expect(page.getByRole("heading", { name: `Tasks for ${uniqueEmail}` })).toBeVisible();

    
        await page.getByRole("button", { name: "Log Out" }).click();


        await page.waitForURL("/login?callbackUrl=/tasks");


        // Now that we have navigated to the login page, we assert that the main
        // "Login" heading is visible. This confirms that we are on the correct page
        // before we try to fill in the form.
        await expect(page.getByRole("heading", { name: "Login" })).toBeVisible();
  });
});