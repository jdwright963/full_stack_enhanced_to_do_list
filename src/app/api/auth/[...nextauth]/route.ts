// This file is the main API endpoint for all NextAuth.js (Auth.js) operations. Its
// special folder structure, `[...nextauth]`, is a "catch-all" dynamic route segment.
// This means this single file is responsible for handling ALL requests that start with
// `/api/auth/`, such as:
//
// - `/api/auth/signin`         (To start the login process)
// - `/api/auth/signout`        (To log the user out)
// - `/api/auth/session`        (For the client to get the current session state)
// - `/api/auth/callback/[provider]` (The URL providers like Discord redirect back to)
//
// This file acts as a simple but crucial bridge, connecting the Next.js routing system
// to the internal request handling logic of the NextAuth.js library.

// This line imports the `handlers` object from our central server-side authentication
// configuration file (`~/server/auth/index.ts`).
//
// When we call `NextAuth(authConfig)` in our auth setup, the `NextAuth` function returns
// an object that contains several properties. One of these properties is `handlers`.
// The `handlers` object itself contains pre-built functions for handling HTTP requests,
// specifically a `GET` function and a `POST` function. These functions contain all the
// complex internal logic of NextAuth.js to process different authentication actions.
import { handlers } from "~/server/auth";

// This line is a concise way to export the pre-built handler functions from NextAuth.js
// so that the Next.js App Router can use them.
//
// `const { GET, POST } = handlers;`: This is JavaScript's "object destructuring". It does two things:
// 1. It accesses the `handlers` object that we just imported.
// 2. It pulls the `GET` property out of `handlers` and creates a new constant named `GET`.
// 3. It pulls the `POST` property out of `handlers` and creates a new constant named `POST`.
//
// `export`: This keyword makes these new `GET` and `POST` constants available to Next.js.
//
// When a `route.ts` file exports a function named `GET`, Next.js automatically uses that function
// to handle all incoming GET requests to this URL. The same applies to `POST`.
// By exporting the `GET` and `POST` functions that NextAuth.js provided for us, we are effectively
// saying: "Hey Next.js, for any GET or POST request to `/api/auth/...`, just forward it
// directly to the NextAuth.js library to handle."
export const { GET, POST } = handlers;
