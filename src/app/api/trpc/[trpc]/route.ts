// This file defines the main HTTP endpoint for the entire tRPC API. The special folder
// structure, `[trpc]`, is a "catch-all" dynamic route segment. This means this single
// file is responsible for handling ALL requests that start with `/api/trpc/`, such as:
//
// - `/api/trpc/task.getAll`
// - `/api/trpc/post.create`
//
// This file acts as the essential bridge between the standard HTTP protocol (used by the
// client's browser) and the internal, type-safe world of your tRPC routers and procedures.
// It receives incoming HTTP requests, provides them with the necessary "context" (like
// request headers), and then passes them to the tRPC router for processing.

// Imports the primary request handler from the tRPC server library.
// `fetchRequestHandler`: This is a pre-built function from tRPC that is specifically
// designed to work with modern, Fetch API-compatible environments like the Next.js App Router.
// Its job is to take a standard `Request` object and route it to the correct tRPC procedure.
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";

// Imports the `NextRequest` TypeScript type from the `next/server` library.
// `NextRequest` is an extension of the standard `Request` object, providing some additional
// Next.js-specific conveniences. We use this for type-safety in our handler function.
import { type NextRequest } from "next/server";

// Imports the validated environment variables from the T3 stack's environment management system.
// The `env` object provides type-safe access to your environment variables (from `.env`),
// ensuring that you don't accidentally use a variable that is missing or has the wrong type.
import { env } from "~/env";

// Imports the main `appRouter` from our server-side API configuration.
// The `appRouter` is the single, merged router that contains ALL of our application's
// tRPC procedures (e.g., `postRouter`, `taskRouter`, etc.). This is the "recipe book"
// that the request handler will use to find and execute the correct procedure.
import { appRouter } from "~/server/api/root";

// Imports a helper function from our main tRPC configuration file.
// `createTRPCContext`: This function is responsible for creating the "context" object that
// gets passed to every tRPC procedure. The context typically contains things that every
// procedure needs access to, like the database connection (`db`) and the user's session.
import { createTRPCContext } from "~/server/api/trpc";

/**
 * Creates the "context" for an incoming tRPC request.
 *
 * The "context" is a special object that gets passed to every single tRPC procedure
 * on the backend. It's a container for data and utilities that your API logic needs
 * to access, but that you don't want to pass in as an argument to every function.
 * Common examples include the database connection (`db`), the user's session, and
 * the incoming request headers.
 *
 * This `createContext` function is the bridge between a raw HTTP request and the tRPC
 * system. It takes the incoming `NextRequest` object and uses it to assemble the context
 * for that specific request.
 *
 * @param req The incoming HTTP request from the client.
 * @returns The tRPC context object.
 */
// We define an `async` function named `createContext` that will be called for each incoming API request.
const createContext = async (req: NextRequest) => {

    // This line calls the main `createTRPCContext` helper function (which we imported from `~/server/api/trpc`)
  // and immediately returns its result. This demonstrates a key architectural pattern:
  //
  // There are two separate create context functions because:
  //
  // 1. `createTRPCContext` (in `trpc.ts`): This is the **core, inner context creator**.
  //    Its job is to assemble the parts of the context that are the same regardless of where the
  //    request comes from (e.g., it always initializes the database connection `db`). It is also
  //    responsible for using the `headers` to find the user's session.
  //
  // 2. `createContext` (this function, here in `route.ts`): This is the **HTTP-specific wrapper**.
  //    Its only job is to handle a raw HTTP request, extract the necessary pieces (like the `headers`),
  //    and pass them in the correct format to the core `createTRPCContext` function.
  //
  // This separation allows the core context logic to be reused. For example, the server-side
  // tRPC caller in `~/trpc/server.ts` can also call `createTRPCContext` directly, but it provides
  // a different set of headers.
  return createTRPCContext({

    // Here, we are fulfilling the contract required by `createTRPCContext`. We pass an object
    // containing the `headers` from the incoming HTTP request (`req`). This is essential, as
    // the core context creator needs these headers to find the user's session cookie and
    // determine if they are authenticated.
    headers: req.headers,
  });
};

// This line defines a constant named `handler`. The value assigned to it is an arrow function.
// This `handler` function will be the primary function responsible for processing all incoming tRPC requests.
// `(req: NextRequest)`: The handler function is defined to accept one argument, `req`, which is the
// incoming `NextRequest` object from the Next.js server.
const handler = (req: NextRequest) =>

  // The arrow function immediately returns the result of calling `fetchRequestHandler`.
  // This `fetchRequestHandler` is the core utility imported from tRPC that orchestrates the entire API call.
  // It takes a single, large configuration object with all the necessary pieces to process the request.
  fetchRequestHandler({

    // `endpoint`: This property tells the tRPC handler what the base path for the tRPC API is.
    // This is used internally by tRPC for various purposes, including generating full URLs in error messages.
    endpoint: "/api/trpc",

    // `req`: This passes the original, unmodified `NextRequest` object directly into the tRPC handler.
    // The handler needs this to read the request's method (GET/POST), headers, and body.
    req,

    // `router`: This provides the tRPC handler with your actual API "recipe book".
    // `appRouter`: We pass the main, merged `appRouter` that we imported. The handler will use this
    // router to look up the correct procedure based on the URL path (e.g., `task.getAll`).
    router: appRouter,

    // `createContext`: This property is given a function that tRPC will call to generate the
    // context for this specific request. This is the crucial link to our context creation logic.
    // `() => createContext(req)`: We provide an anonymous arrow function. When tRPC needs the context,
    // it will execute this function. The function then calls our own `createContext` helper,
    // passing along the current `req` object. This ensures that every API call gets a fresh
    // context object tailored to its specific request.
    createContext: () => createContext(req),

    // The `onError` property is a special callback function that tRPC will execute only if
    // an unexpected error occurs during the processing of a procedure. This is used for logging and debugging.
    onError:

          // This is a "ternary operator" (`condition ? value_if_true : value_if_false`).
      // It's used here to make the error logging behavior conditional based on the environment.
      //
      // The Condition: `env.NODE_ENV === "development"`
      //
      //   `NODE_ENV` is the single most important and universally recognized environment variable in the
      //   Node.js ecosystem. It's a string that tells your application in what "mode" it is currently
      //   running. By convention, it has two primary values:
      //   - `"development"`: When you are running the app on your local machine for development (e.g., via `npm run dev`).
      //   - `"production"`: When the app has been built and deployed to a live server for users.
      //
      //   Frameworks and libraries (like Next.js, React, and Express) check the value of `NODE_ENV`
      //   and change their behavior accordingly. For example, in "development" mode, they provide
      //   detailed error messages, enable hot-reloading, and skip optimizations. In "production" mode,
      //   they provide generic error messages, disable developer features, and enable all performance
      //   optimizations (like code minification).
      // 
      //   Next.js automatically sets `process.env.NODE_ENV` for you. It's set to `"development"` when you run
      //   `next dev`, and to `"production"` when you run `next build` and `next start`.
      //
      //   The T3 Stack Way:
      //   Instead of accessing `process.env.NODE_ENV` directly, we are using `env.NODE_ENV`. This `env` object
      //   is imported from `~/env`. It is the output of the T3 stack's Zod-based environment variable
      //   validation system. This ensures that `NODE_ENV` is not only present but also correctly typed
      //   as either `"development"`, `"production"`, or `"test"`, providing an extra layer of safety.
      //
      //   This condition simply checks if the application is currently running in development mode.
      env.NODE_ENV === "development"

        // The `?` separates the condition from the "true" case.
        // If the app is in development mode, we provide this detailed error logging function to the `onError` callback.
        // This is an anonymous arrow function that tRPC will call with an object containing error details.
        // We use object destructuring `{ path, error }` to immediately extract these properties into local variables.
        ? ({ path, error }) => {

            // `console.error()`: We log the error to the server's console using `console.error` for better visibility and formatting in most terminals.
            console.error(

              // 1. `[ERROR]`: This is a "log level prefix". It's a best practice in logging to
              //    categorize messages by severity (e.g., [INFO], [WARN], [ERROR]). This makes logs
              //    much easier to read, search, and filter, especially in a production environment.
              //
              // 2. `tRPC failed on`: A static, human-readable string to provide context.
              //
              // 3. `${path ?? "<no-path>"}`: This embeds the path of the failed tRPC procedure.
              //    - `path`: This variable, provided by the `onError` callback, holds the string
              //      representation of the procedure that was called (e.g., "task.create").
              //    - `??`: The "nullish coalescing operator". This is a safety check. It checks if the
              //      value on its left (`path`) is either `null` or `undefined`. If it is, this
              //      operator returns the value on its right (`"<no-path>"`). Otherwise, it returns
              //      the value on the left. This prevents the log message itself from crashing if the
              //      path is unexpectedly missing.
              //
              // 4. `: `: A static separator.
              //
              // 5. `${error.message}`: This embeds the actual error message from the `Error` object
              //    that was thrown in the tRPC procedure. This provides the specific reason for the
              //    failure (e.g., "Invalid password" or "Input validation failed").
              //
              // If a user tried to create a task with an empty name, the final log message in the
              // server's terminal would look like this:
              // `[ERROR] tRPC failed on task.create: Input validation failed: "name" must be at least 1 character long`
              `[ERROR] tRPC failed on ${path ?? "<no-path>"}: ${error.message}`,
            );
          }
        
        // The `:` separates the "true" case (development) from the "false" case (production) of the ternary operator.
        // If the app is NOT in development mode, we provide `undefined` as the value for the `onError` property.
        // In the context of a JavaScript object, setting a property's value to `undefined` is often treated
        // the same as if the property was not defined at all.
        // This effectively disables this custom console logging behavior in production. Logging verbose
        // errors to a production server's console is generally not useful and can be a security risk.
        // In a real-world production app, this would be replaced with a proper logging service
        // that sends the error data to a monitoring platform like Sentry, LogRocket, or Datadog.
        : undefined,
  });

// This is the final and crucial line that makes our tRPC handler work with the Next.js App Router.
// The App Router's convention is to look for exported functions named after HTTP methods (`GET`, `POST`, `DELETE`, etc.)
// in a `route.ts` file. This line exports our single handler function to fulfill that requirement for both GET and POST requests.
//
// - `export { ... }`: This is JavaScript's "named export" syntax. It allows us to export one or more
//   values from a file by their name.
//
// - `handler as GET`: This is "export aliasing".
//   - `handler`: The name of the constant we defined above, which holds our tRPC request handler function.
//   - `as`: This keyword renames the export.
//   - `GET`: The new name for the export.
//   This entire expression means: "Take the `handler` function and export it, but tell the outside world its name is `GET`."
//   Now, when Next.js looks for an exported `GET` function to handle a GET request, it will find this.
//
// - `,`: The comma separates the multiple named exports.
//
// - `handler as POST`: This does the exact same thing again. It takes the *very same* `handler` function
//   and exports it a second time, but this time under the alias `POST`. Now, Next.js will also use this
//   handler for incoming POST requests.
//
// By exporting the same handler for both methods, we let the internal tRPC `fetchRequestHandler`
// correctly route the request, as tRPC uses GET for queries and POST for mutations by convention.
export { handler as GET, handler as POST };
