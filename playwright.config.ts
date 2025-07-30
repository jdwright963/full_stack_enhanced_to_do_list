// --- Purpose of this file ---
// This is the main configuration file for Playwright. The Playwright test runner reads this
// file before executing any tests to understand how they should be run, where to find them,
// what browser settings to use, and other important parameters.

// Imports the `defineConfig` helper function from the Playwright test library.
// This function's primary purpose is to provide TypeScript type-checking and autocompletion
// for your configuration object, which helps prevent typos and makes configuration much easier.
import { defineConfig } from '@playwright/test';

// We export this configuration object as the default export of this file.
// `defineConfig` is a wrapper around our configuration object for the type-safety benefits mentioned above.
// defineConfig is a very simple function. It takes one argument (your configuration object) and immediately
// returns it without changing it. This is known as an "identity function".
// It tells TypeScript about the object. The function is typed to expect an object that perfectly matches the 
// shape of a valid Playwright configuration (PlaywrightTestConfig). We are essentially asking TypeScript to 
// validate our object against Playwright's official blueprint.
export default defineConfig({

  // This property tells Playwright where to look for your test files.
  // `'./e2e'`: This is a relative path that means "look in the 'e2e' folder located
  // in the same directory as this config file". This is why we renamed the folder to `e2e`.
  testDir: './e2e',

  // This sets a global timeout for each individual test.
  // `30_000`: This is 30,000 milliseconds (30 seconds). The underscore `_` is a numeric separator
  // in TypeScript/JavaScript that has no effect on the value but makes large numbers easier to read.
  // If a single test (from `test(...)` to its end) takes longer than 30 seconds, it will be marked as "timed out" and failed.
  timeout: 30_000,



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
});