// This is the main configuration file for Playwright. The Playwright test runner reads this
// file before executing any tests to understand how they should be run, where to find them,
// what browser settings to use, and other important parameters.

// Imports the `defineConfig` helper function from the Playwright test library.
// This function's primary purpose is to provide TypeScript type-checking and autocompletion
// for your configuration object, which helps prevent typos and makes configuration much easier.
import { defineConfig } from '@playwright/test';

// We export this configuration object as the default export of this file.
//
// The `defineConfig` function is a helper whose only purpose is to provide TypeScript
// type-safety for your configuration. Think of it as an "official blueprint checker".
//
// 1. You provide it with your configuration object.
// 2. Internally, `defineConfig` is typed to only accept an object that perfectly matches
//    Playwright's official configuration shape (`PlaywrightTestConfig`).
// 3. As you type, TypeScript (and your code editor) will check your object against this
//    "blueprint", giving you autocompletion and instantly flagging any typos or invalid properties.
//
// At runtime, `defineConfig` is an "identity function"—it does nothing to your object and
// simply returns it as-is. Its entire value is in the development experience and preventing errors.
export default defineConfig({

  // This property tells Playwright where to look for your test files.
  // `'./e2e'`: This is a relative path that means "look in the 'e2e' folder located
  // in the same directory as this config file".
  testDir: './e2e',

  // This sets a global timeout for each individual test.
  // `60_000`: This is 60,000 milliseconds (60 seconds). The underscore `_` is a numeric separator
  // in TypeScript/JavaScript that has no effect on the value but makes large numbers easier to read.
  // If a single test (from `test(...)` to its end) takes longer than 60 seconds, it will be marked as "timed out" and failed.
  timeout: 60_000,

  // `globalSetup`: This property tells Playwright to run a script before any tests are executed.
  // It's the perfect place to prepare the test environment, such as cleaning and seeding a database.
  //
  // `'./e2e/global-setup.ts'`: We provide a relative path to our setup script. Playwright will
  // execute this file once at the beginning of the entire test run, ensuring all tests
  // start with a clean and predictable database state.
  globalSetup: './e2e/global-setup.ts',


  // `webServer`: This configuration block tells Playwright how to automatically
  // start your web application's server before running the tests.
  webServer: {

    // - 'cross-env NODE_ENV=test':
    //   - 'cross-env': This is a critical utility. It allows you to set environment variables
    //     (like NODE_ENV) in a way that works consistently across different operating systems
    //     (Windows, macOS, Linux). Without 'cross-env', the syntax for setting environment
    //     variables differs by OS (e.g., 'set VAR=value' on Windows vs. 'VAR=value' on Linux/macOS).
    //     So, 'cross-env' *enables* us to reliably set 'NODE_ENV=test' for the spawned process.
    //   - 'NODE_ENV=test': This sets the 'NODE_ENV' environment variable to 'test'.
    //     This is crucial because Next.js (and many Node.js apps) uses this variable to determine
    //     which environment-specific configurations or behaviors to apply. Setting it to 'test'
    //     signals the application to run in a testing context.
    //
    // - 'npm run dev':
    //   - This executes the 'dev' script defined in your 'package.json', typically running 'next dev'
    //     to start the Next.js development server.
    //
    // The combination of 'cross-env NODE_ENV=test' and Next.js's built-in behavior means that
    // the application will automatically load and use environment variables from '.env.test'
    // (if it exists) instead of or in addition to default '.env' files.
    command: 'cross-env NODE_ENV=test npm run dev',

    // This is the URL that Playwright will wait for before it starts running tests.
    // It must match the URL your application runs on.
    url: 'http://localhost:3000',
  },

  // The 'use' object is where you define global settings that apply to all tests.
  // These settings are passed down to every browser context Playwright creates.
  use: {

    // This is one of the most useful settings. It sets a base URL for all navigation actions.
    // Now, in your tests, instead of writing `await page.goto('http://localhost:3000/tasks');`,
    // you can simply write `await page.goto('/tasks');`. Playwright will automatically prepend the baseURL.
    baseURL: 'http://localhost:3000',

    // This setting controls whether the browser runs with a visible UI window.
    // `true`: This is "headless" mode. The browser runs in the background without a visible window.
    // This is faster and essential for running tests in a non-graphical environment like a CI/CD server.
    // For local debugging, you would often change this to `false` to watch the test run.
    headless: true,
  },

  // This setting controls how many test files Playwright will run in parallel.
  // `1`: This means tests will run sequentially, one after the other.
  // This is necessary because tests share a database
  // Isolation will be considered for future improvements.
  workers: 1,
});