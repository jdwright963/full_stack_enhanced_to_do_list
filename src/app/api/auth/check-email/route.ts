// This file defines a server-side API route handler for HTTP POST requests.
// Its primary purpose is to check the database for the existence and verification status of an email address.
// This is a common utility for a login or registration page, allowing the frontend to provide specific
// user feedback (e.g., "Please verify your email") before attempting a full sign-in.
// It expects a JSON payload with an `email` property and returns a JSON response.

// Imports the `NextResponse` object from the "next/server" module.
// `NextResponse` is a specialized Next.js class that extends the standard web `Response` object.
// It provides convenient helper methods like `.json()` which automatically handle stringifying
// data and setting the correct "Content-Type": "application/json" header for us.
import { NextResponse } from "next/server";

// Import the Prisma client instance exported from the server `db` module.
// This is the DB client we use to run queries against the app's database.
import { db } from "~/server/db";

// Imports the main `z` object from the "zod" library. Zod is a powerful tool for runtime data validation,
// which helps ensure that data we receive matches the exact shape and type we expect.
import { z } from "zod";

// Define a Zod schema for the expected request body.
// This ensures we only accept an object that has an email string in valid email format.
const bodySchema = z.object({
  email: z.string().email(),
});

// `req: Request` is the TypeScript parameter declaration: `req` is the parameter name and 
// `Request` is the type annotation (the Fetch API Request interface, which provides methods 
// like `json()` and properties like `headers` and `method`).
export async function POST(req: Request) {

    // The `try` keyword begins a block dedicated to structured error handling.
    // Any code within this block is monitored for runtime exceptions. In this specific function,
    // potential failures include the request body not being valid JSON (`req.json()`), or an
    // error occurring during the database query (`db.user.findUnique`). If any such error
    // is thrown, the program immediately stops executing the `try` block and jumps to the
    // corresponding `catch` block to handle the error gracefully instead of crashing the server process.
    try {

        // The `req.json()` method reads the raw request body from the server and parses it from a JSON-formatted string
        // into a JavaScript object. This operation is asynchronous, so we `await` its completion. Critically, the result
        // is typed as `any` by default in TypeScript, which dangerously disables all type-checking. By explicitly casting the result
        // `as unknown`, we are telling TypeScript that we cannot trust the shape of this incoming data. This is a best
        // practice that forces us to perform a validation check (using Zod in the next line) before the data can be safely used.
        const raw = await req.json() as unknown;

        // Here we use our Zod schema to validate the `rawCheck` data. The `.safeParse()` method is used because it
        // never throws a program crashing error. Instead of halting execution (like `.parse()` would), it always returns
        // one of two possible objects:
        //  1. On success: `{ success: true, data: { ... } }` where `data` is the fully validated, type-safe data.
        //  2. On failure: `{ success: false, error: ZodError }` where `error` is a Zod-specific object containing
        //     detailed information about why the validation failed.
        // This allows us to handle validation failures gracefully in our own code, rather than jumping to the `catch` block.
        const parsed = bodySchema.safeParse(raw);

        // If parsing failed, this block immediately stops the function. It uses `NextResponse.json()`
        // to send a JSON response. The payload object, `{ exists: false, emailVerified: false }`, provides a
        // consistent, "safe" failure state for the frontend, explicitly setting both values to `false` because no
        // user could be checked. The `status: 200` (OK) signifies the request was handled gracefully.
        if (!parsed.success) {
            return NextResponse.json(
                { exists: false, emailVerified: false },
                { status: 200 }
            );
        }

        // This line uses object destructuring to extract the `email` property directly from the `parsed.data` object.
        // Since this code only runs after a successful Zod validation (`!parsed.success` was false), we are guaranteed
        // that `parsed.data` is a type-safe object that perfectly matches our `bodySchema`. The result is a new `email`
        // constant (which TypeScript correctly knows is a string), ready to be safely used in the database query below.
        const { email } = parsed.data;

        // This line executes an asynchronous database query using the Prisma client.
        // `const user`: Declares a constant `user` to store the result of the query.
        // `await db.user.findUnique(...)`: This calls the `findUnique` method on the `user` model of our database client (`db`).
        // `findUnique` is optimized for finding a single record based on a unique constraint.
        //   - `where: { email }`: This is the query's filter. It tells Prisma to find a record in the `user` table
        //     where the `email` column matches the value of our `email` variable.
        //   - `select: { emailVerified: true }`: This is a performance and security optimization. It tells Prisma exactly which fields to retrieve.
        //     - `emailVerified`: The key, representing the name of the field we want from the user record.
        //     - `true`: Prisma syntax — a boolean include flag that instructs Prisma to include this field in the returned object.
        //       It is NOT the database column's runtime value.
        //     Because of this, we avoid fetching the entire user object and only get the data we absolutely need.
        //
        // Crucially, based on the provided Prisma schema, the `emailVerified` field is a `DateTime?`.
        // Therefore, the `user` variable can end up in one of three states:
        // 1. If a user is found AND is verified, it will be an object containing a Date: `{ emailVerified: <DateTime object> }`.
        // 2. If a user is found BUT is not verified, it will be an object containing null: `{ emailVerified: null }`.
        // 3. If no user is found, the variable will be `null`.
        const user = await db.user.findUnique({
            where: { email },
            select: { emailVerified: true },
        });

        // This is the success path of the function, constructing and sending the final JSON response.
        // It uses the `NextResponse.json()` helper, which automatically stringifies the payload object
        // and sets the correct `Content-Type` header.
        return NextResponse.json(

            // This is the payload object that will be sent to the client.
            {
                // The `exists` key is set by explicitly converting the `user` variable to a boolean using `Boolean()`.
                // This results in `true` if `user` is an object (meaning the user was found) and `false`
                // if `user` is `null` (meaning the user was not found).
                exists: Boolean(user),

                // The `emailVerified` key is also converted to a strict boolean for a simple `true`/`false` response.
                // The optional chaining operator (`?.`) in `user?.emailVerified`. This operator
                // first checks if the `user` object exists; if `user` is `null` (not found), it immediately returns
                // `undefined` instead of throwing a "cannot read property of null" error. This safe access yields
                // one of three values: a Date object (if verified), `null` (if not verified), or `undefined` (if the user doesn't exist).
                // Finally, the `Boolean()` function is called on this result: a Date object becomes `true`, while both
                // `null` and `undefined` become `false`.
                emailVerified: Boolean(user?.emailVerified),
            },

            // The `{ status: 200 }` option sets the HTTP status code to "OK", confirming to the client
            // that the database check was performed successfully, regardless of the outcome.
            { status: 200 }
        );

    // This `catch` block acts as a safety net. It will only execute if an error is thrown
    // anywhere inside the preceding `try` block — for example, if the request body is not
    // valid JSON, or if the database is unreachable. The error itself is captured in the `err` variable.
    } catch (err) {

        // This line logs the captured error to the server's console, prefixed with a helpful message.
        // This is CRUCIAL for debugging. In a production environment, this line should be replaced
        // with a call to a dedicated logging service to track and alert on server-side failures.
        // Removing it entirely would cause errors to happen silently, making them impossible to fix.
        console.error("check-email error:", err);

        // After logging the internal error, this line sends a response back to the client.
        // The payload provides a consistent "failure" state for the frontend to handle. Critically,
        // the status is set to `500`, which stands for "Internal Server Error". This correctly
        // informs the client that the problem was on the server, not with the user's request.
        return NextResponse.json(
            { exists: false, emailVerified: false },
            { status: 500 }
        );
    }
}