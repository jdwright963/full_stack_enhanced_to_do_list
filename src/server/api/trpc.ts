// This is the foundational configuration file for the tRPC server. It does not contain
// any API logic itself. Instead, its primary purpose is to initialize the tRPC backend
// and export the reusable "building blocks" that are used to create your API.
//
// The key pieces created and exported from this file are:
//
// 1. CONTEXT CREATION (`createTRPCContext`):
//    A helper function that defines the data available to every tRPC procedure.
//    This is where you can access the database connection (`db`) and the user's
//    session information.
//
// 2. T-RPC INITIALIZATION (`t`):
//    The core instance of tRPC, which connects the context, a data transformer
//    (`superjson` for handling complex types like dates), and a custom error
//    formatter for validation errors.
//
// 3. REUSABLE PROCEDURES (`publicProcedure`, `protectedProcedure`):
//    These are the basic units for building your API endpoints. The `publicProcedure`
//    is for unauthenticated access, while the `protectedProcedure` enforces that a
//    user must be logged in to access the endpoint.
//
// 4. ROUTER FACTORY (`createTRPCRouter`):
//    A helper function for creating new routers and structuring your API into
//    logical modules (e.g., `postRouter`, `userRouter`).

/**
 * YOU PROBABLY DON'T NEED TO EDIT THIS FILE, UNLESS:
 * 1. You want to modify request context (see Part 1).
 * 2. You want to create a new middleware or type of procedure (see Part 3).
 *
 * TL;DR - This is where all the tRPC server stuff is created and plugged in. The pieces you will
 * need to use are documented accordingly near the end.
 */

// Imports the core functions from the tRPC server library. These are the fundamental
// building blocks for creating the entire tRPC backend.
// - `initTRPC`: The main factory function. This is the starting point for everything.
//   We call this to get our tRPC instance (`t`), which we then use to create routers,
//   procedures, and middleware.
// - `TRPCError`: A dedicated error class for throwing structured, HTTP-mappable errors
//   from within your procedures (e.g., for `UNAUTHORIZED` or `NOT_FOUND` scenarios).
import { initTRPC, TRPCError } from "@trpc/server";

// Imports `superjson`, a library for serializing and deserializing data.
// Standard JSON can't handle complex types like `Date`.
// `superjson` acts as a "transformer", converting these types into a format that can be
// sent over the network and then converting them back to their original types on the
// client.
import superjson from "superjson";

// Imports the specific error class from `zod`, the validation library used by tRPC.
// When a procedure's input fails validation, `zod` throws a `ZodError`. We import
// this type here specifically for the `errorFormatter`, so we can detect if a failure
// was due to a validation error and format it in a structured way for the client.
import { ZodError } from "zod";

// Imports the `auth` function from our central server-side authentication setup.
// This function, provided by NextAuth.js, is the primary way to access the current
// user's session on the server. We call it within our context creator to make
// session data available to every tRPC procedure.
import { auth } from "~/server/auth";

// Imports the globally initialized Prisma Client instance (`db`) from our database setup file.
// This object provides the direct interface to our database. By adding it to the tRPC
// context, every API procedure gains access to the database, enabling them to
// perform queries and mutations efficiently.
import { db } from "~/server/db";

/**
 * 1. CONTEXT
 *
 * This section defines the "contexts" that are available in the backend API.
 *
 * These allow you to access things when processing a request, like the database, the session, etc.
 *
 * This helper generates the "internals" for a tRPC context. The API handler and RSC clients each
 * wrap this and provides the required context.
 *
 * @see https://trpc.io/docs/server/context
 */

// This line defines and exports the main function for creating our tRPC context.
// `export`: Makes this function available to be imported by other server-side files.
// `async`: Declares the function as asynchronous because it needs to use `await` to get the user's session.
// `(opts: { headers: Headers })`: Specifies that the function accepts a single argument, `opts`, which is an
// object containing the incoming `Headers` of the request. This allows request-specific data to be passed into the context.
export const createTRPCContext = async (opts: { headers: Headers }) => {

  // This line retrieves the current user's session.
  // `await`: Pauses execution until the `auth()` Promise resolves.
  // `auth()`: This is the NextAuth.js function that reads the request (e.g., cookies) to determine the currently logged-in user.
  // The result, which is either the user's session object or `null` if they are not logged in, is stored in the `session` constant.
  const session = await auth();

  // This line returns the fully constructed context object. This object is the
  // will be passed as the `ctx` argument to every single tRPC procedure that is executed.
  return {

    // The `db` property is added to the context. This uses JavaScript's shorthand property
    // syntax, which is equivalent to writing `db: db`. By including it, every tRPC
    // procedure can access the Prisma Client instance via `ctx.db` to perform database operations.
    db,

    // The `session` property is also added using shorthand syntax (`session: session`). It contains
    // the user's session data (or `null` if they are unauthenticated) retrieved from `auth()`.
    // This allows procedures to check for authentication status and access user details via `ctx.session`.
    session,

    // The spread syntax (`...`) is used to take all properties from the `opts` object
    // and merge them directly into the context object. In this case, it adds the `headers` property
    // from the function's arguments. This makes the context extensible, as any additional
    // properties passed in `opts` in the future will automatically be included.
    ...opts,
  };
};

/**
 * 2. INITIALIZATION
 *
 * This is where the tRPC API is initialized, connecting the context and transformer. We also parse
 * ZodErrors so that you get typesafety on the frontend if your procedure fails due to validation
 * errors on the backend.
 */

// This line initializes the tRPC backend by creating a single, reusable instance, conventionally named `t`.
// This instance is created using `initTRPC`, which acts as a "factory builder".
//
// A "factory builder" is an object whose main purpose is to configure and construct another, more
// complex object. In this case, `initTRPC` is the tool used to build our `t` instance. This `t` instance
// then becomes the central hub for constructing all other parts of our API: routers, procedures, and middleware.
//
// The initialization process is a chain of method calls:
//
// 1. `initTRPC.context<...>()`: Informs the tRPC instance about the type of the function
//    that will be used to create the context for each request.
//    - The `<typeof createTRPCContext>` generic uses TypeScript's `typeof` operator to get the
//      full type signature of our `createTRPCContext` function (its parameters and what it returns).
//    - This allows tRPC to correctly infer the type of the `ctx` object in all procedures,
//      so TypeScript knows it contains `db`, `session`, etc., making our API fully type-safe.
//
// 2. `.create({...})`: Finalizes the instance, applying our global configuration, such as a data
//    transformer and a custom error formatter.
const t = initTRPC.context<typeof createTRPCContext>().create({

  // This property configures the data transformer. We are telling tRPC to use `superjson`.
  // Standard JSON cannot handle complex JavaScript types like `Date`.
  // `superjson` solves this by intelligently serializing these types on the server and
  // deserializing them back to their original form on the client, ensuring data integrity.
  transformer: superjson,

  // This function allows us to customize the format of errors that are sent to the client.
  // It receives the default error `shape` and the original `error` object that was thrown on the server.
  // Our goal here is to provide more detailed validation errors to the frontend.
  errorFormatter({ shape, error }) {

    // This return statement constructs the final, custom-formatted error object that will be
    // sent to the client. We are building a new object from scratch here.
    return {

      // This is the most important step for preserving tRPC's standard error structure.
      // The `shape` parameter is the default, pre-formatted error object that tRPC would normally send.
      // It contains essential properties like `message`, `code`, and a basic `data` object.
      // By using the spread syntax (`...shape`), we copy all of those default properties into our new object,
      // ensuring the client receives a consistent and predictable error format.
      ...shape,

      // Now that we've copied the defaults, we can override the `data` property to add more detail.
      // This allows us to inject our custom error information without losing the standard fields.
      data: {

        // We again use the spread syntax to copy any properties from the original `shape.data` object.
        // This is a defensive best practice to ensure we don't accidentally discard any useful
        // default data that tRPC might have included.
        ...shape.data,

        // This is our main addition: we are adding a new `zodError` property to the `data` payload.
        // Its value is determined by a ternary operator (a compact if-else statement).
        zodError:

          // The condition: This checks if the underlying cause of the server error was a Zod validation error.
          // The `error.cause` property gives us the original error before tRPC wrapped it.
          // The `instanceof ZodError` check safely determines if the error came from the Zod library.
          // The `?` is the start of a ternary operator, which is a compact if/else statement.
          // It means: "If the preceding condition was true, then execute the following expression."
          //
          // `error.cause.flatten()`: This is the expression executed if the error IS a ZodError.
          // The `.flatten()` method is a Zod utility that transforms the complex, nested error object
          // into a simple, "flat" object. This new object is much easier to work with on the
          // front-end.
          // 
          // The `:` is the second part of the ternary operator.
          // It means: "...otherwise, if the condition was false, execute the expression that comes after."
          //
          // `null`: This is the value returned if the error was NOT a ZodError. It signifies the
          // absence of validation errors, which is a clean and predictable value for the client to check against.
          //
          // The trailing `,` indicates that this entire line is a property within an object literal.
          // It separates this key-value pair from the next one in the object.
          // For example:
          //   {
          //     message: "An error occurred.",
          //     zodError: error.cause instanceof ZodError ? error.cause.flatten() : null, // <- our line
          //     nextProperty: "some other value"
          //   }
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

/**
 * Create a server-side caller.
 *
 * @see https://trpc.io/docs/server/server-side-calls
 */

// This line exports `t.createCallerFactory`, an advanced tRPC feature for creating
// "server-side callers". A server-side caller allows you to execute your tRPC
// procedures directly from your server-side code (e.g., in a Server Component or API
// route) without making an HTTP request. It's like calling a function instead of
// fetching from an endpoint.
//
// The `createCallerFactory` itself is a "factory for a factory".
// - Its job is to create a `createCaller` function.
// - That `createCaller` function, in turn, is what you use to create the actual `caller` object.
//
// While powerful, for applications with a structure like this one, we don't
// need to use this export directly. A pre-configured caller is created 
// in your main router file (`~/server/api/root.ts`), and that's the one we use.
export const createCallerFactory = t.createCallerFactory;

/**
 * 3. ROUTER & PROCEDURE (THE IMPORTANT BIT)
 *
 * These are the pieces you use to build your tRPC API. You should import these a lot in the
 * "/src/server/api/routers" directory.
 */

/**
 * This is how you create new routers and sub-routers in your tRPC API.
 *
 * @see https://trpc.io/docs/router
 */

// The `t` object we initialized earlier is our tRPC instance and acts as a builder.
// It contains all the core methods for constructing our API, one of which is `t.router`.
// This line simply exports that `t.router` method under a more descriptive alias, `createTRPCRouter`.
//
// This is one of the most important building blocks for your entire API.
// `createTRPCRouter` is a factory function whose only job is to create a new "router" object.
// A router acts as a namespace or a container for a group of related API procedures.
// For example, you can create a `postRouter` to hold all procedures related to posts
// (`getAll`, `create`, `delete`, etc.) and a separate `userRouter` for user-related tasks.
//
// These individual routers can then be merged together into a single, main `appRouter`.
// This modular approach is the key to organizing a large and maintainable tRPC API.
// We import and use this function extensively in the `/src/server/api/routers/` directory.
export const createTRPCRouter = t.router;

/**
 * Middleware for timing procedure execution and adding an artificial delay in development.
 *
 * You can remove this if you don't like it, but it can help catch unwanted waterfalls by simulating
 * network latency that would occur in production but not in local development.
 */

// Similar to `t.router`, the main `t` instance we initialized provides `t.middleware`, a method for creating custom middleware.
// Middleware is a function that wraps a procedure's execution, allowing you to run code before and after the
// procedure's main logic. This is ideal for handling concerns like logging, authentication, or, in this case,
// performance monitoring and simulating network latency during development.
//
// This specific `timingMiddleware` is designed for development debugging and has two main functions:
// 1. It logs the execution time of every procedure to the console.
// 2. It introduces a small, random artificial delay to simulate real-world network latency.
//
// The implementation follows this pattern:
//
// 1. `t.middleware(...)`: The method call on our `t` instance that starts the middleware definition.
//
// 2. `async ({ next, path }) => { ... }`: The argument to `.middleware` is an async function that receives a context object.
//    We destructure two key properties from this object:
//    - `next`: A function that you must `await` to pass control to the next middleware in the
//   chain, or eventually to the procedure's resolver itself. The value returned by `await next()`
//   is the final, computed result from the end of the execution chain. Any code before `await next()`
//   runs before the main logic. Any code after it runs after the main logic has completed.
//    - `path`: A string representing the full dot-notation path of the procedure being called (e.g., "post.getAll"),
//      which is useful for logging.
const timingMiddleware = t.middleware(async ({ next, path }) => {

  // This line captures the exact moment the middleware begins execution by getting the
  // current timestamp in milliseconds since the epoch. This `start` value will be used
  // later, after the procedure has finished, to calculate the total execution duration.
  const start = Date.now();

  // This conditional check ensures that the artificial delay logic only ever runs
  // during local development.
  // `t._config.isDev`: This is an internal tRPC flag that is automatically set to `true`
  // when the server is running in a development environment (e.g., `NODE_ENV === 'development'`).
  // This is a crucial guard to prevent intentionally slowing down the production application.
  if (t._config.isDev) {

    // This line calculates a random duration for the artificial delay, generating an integer
    // between 100 and 499 (inclusive). The calculation breaks down as follows:
    //
    // 1. `Math.random()`: Generates a random float from 0 up to (but not including) 1.
    //
    // 2. `... * 400`: Scales the range to be from 0 up to 399.99...
    //
    // 3. `Math.floor(...)`: Rounds the result down to the nearest integer, giving a value
    //    from 0 to 399.
    //
    // 4. `... + 100`: Adds a 100-millisecond base, shifting the final range to be
    //    between 100 and 499 milliseconds.
    const waitMs = Math.floor(Math.random() * 400) + 100;


    // The goal of this line is to pause the execution of this `async` function for a set number of
    // milliseconds.
    // 1. `await`: This is the keyword that actually pauses the function. It tells the JavaScript
    //    engine to wait at this line until the operation on its right (the `Promise`) is "fulfilled".
    //    While it's waiting, it doesn't block the rest of the
    //    application, allowing other tasks to run.
    //
    // 2. `new Promise(...)`: This creates a new `Promise` object. A Promise is a placeholder for a
    //    future value; it represents the eventual completion (or failure) of an asynchronous operation.
    //    It starts in a "pending" state.
    //
    // 3. `((resolve) => { ... })`: This is the "executor function". It's an anonymous arrow function
    //    that you write and pass directly to the `Promise` constructor. It contains the instructions
    //    for the asynchronous task.
    //
    //    The `Promise` constructor takes your executor function and does the following:
    //
    //    a) It creates a special, internal function that has the power to mark the Promise as "fulfilled" (successful).
    //
    //    b) It then calls the executor function, passing its newly created "fulfillment" function
    //       as the very first argument.
    //
    //    c) `(resolve)`: This is the name of the parameter that the executor function receives.
    //    By universal convention, this first parameter—the function that signals success—is named `resolve`.
    //    Note that `resolve` is not the name of your executor function. It is the local variable name for the
    //    "success callback" that the Promise machinery gave to the function.
    //
    // 4. `setTimeout(callback, delay)`: This is a standard JavaScript function. It schedules a
    //    `callback` function to be executed after a `delay` in milliseconds. It does NOT pause code execution.
    //
    // 5. `setTimeout(resolve, waitMs)`: We are passing the `resolve`
    //    function itself as the `callback` to `setTimeout`. This creates a simple instruction:
    //    "After `waitMs` milliseconds have passed, execute the `resolve()` function."
    //
    // The Sequence of Events:
    //
    // 1. A new `Promise` is created and is immediately `await`ed, pausing the `timingMiddleware` function.
    // 2. The `Promise` constructor runs our executor, which calls `setTimeout`.
    // 3. `setTimeout` schedules the `resolve` function to run in the future (after `waitMs` ms).
    // 4. After the delay, the timer finishes, and `setTimeout` executes `resolve()`.
    // 5. Calling `resolve()` fulfills the Promise.
    // 6. The `await` keyword sees that the Promise is now fulfilled and allows the `timingMiddleware` function to resume execution.
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }
  
  // 1. `next()`: This function, provided by tRPC, represents "the rest of the call stack".
  //    Calling `next()` passes control to the next middleware in the chain, or if there are
  //    no more, it executes the actual procedure's resolver (the `.query` or `.mutation` function).
  //    It returns a Promise that will eventually resolve with the final data from the procedure.
  //
  // 2. `await`: This is the JavaScript keyword that pauses the execution of *this* middleware.
  //    It patiently waits for the entire downstream call stack (all other middlewares and the
  //    final procedure) to finish their work and for the Promise from `next()` to resolve.
  //
  // 3. `const result = ...`: Once the procedure at the end of the chain has returned its data
  //    (e.g., a list of users from the database), the `await` completes. The returned data is
  //    "unwrapped" from the Promise and assigned to the `result` constant. This `result` is
  //    the final value that will ultimately be sent back to the client.
  const result = await next();

  // Now that `await next()` has completed, the procedure is finished, and we can resume our "after" logic.
  // This line captures the exact moment the middleware's "after" logic begins by getting the current
  // timestamp in milliseconds.
  const end = Date.now();

  // 1. `` `...` ``: These are "template literals" (or template strings) in JavaScript. They allow
  //    for easy embedding of variables and expressions directly into a string.
  //
  // 2. `${path}`: This is an "interpolation". The value of the `path` variable (e.g., "post.getAll"),
  //    which was provided to our middleware, is inserted directly into the string.
  //
  // 3. `${end - start}`: This is another interpolation that performs a calculation inline. It subtracts
  //    the `start` timestamp (captured when the middleware began) from the `end` timestamp (captured
  //    just now). The result of this subtraction is the total duration of the procedure's execution
  //    in milliseconds.
  //
  // 4. `console.log(...)`: This is a standard Node.js function that prints the formatted string to
  //    the server's console output, providing a useful debugging log for monitoring API performance.
  console.log(`[TRPC] ${path} took ${end - start}ms to execute`);

  // This line concludes the middleware's execution. Its job is to take the final data
  // from the procedure and pass it back up the execution chain so it can eventually
  // be sent to the client.
  //
  // The `result` constant holds the actual data payload that the tRPC procedure's resolver
  // returned. A realistic procedure would fetch data from a database, like this:
  //
  //   .query(async ({ ctx, input }) => {
  //     return await ctx.db.post.findUnique({ where: { id: input.id } });
  //   })
  //
  // In that scenario, the `result` variable would hold the full post object retrieved
  // from the database, for example: `{ id: 123, name: 'My First Post', ... }`.
  //
  // By returning this `result`, we ensure that this rich data object continues its journey
  // back up the call stack, is serialized by `superjson`, and is sent as the body of the
  // HTTP response to the client that made the request.
  return result;
});

/**
 * Public (unauthenticated) procedure
 *
 * This is the base piece you use to build new queries and mutations on your tRPC API. It does not
 * guarantee that a user querying is authorized, but you can still access user session data if they
 * are logged in.
 */

// This line creates the reusable "public" procedure.
//
// 1. `t.procedure`: This is the most basic, foundational procedure builder from our tRPC instance (`t`).
//    By itself, it has no middleware and performs no checks. It's open to everyone.
//
// 2. `.use(timingMiddleware)`: We then use the `.use()` method to apply our custom `timingMiddleware`.
//    This means that every procedure built with `publicProcedure` will automatically have its execution
//    timed and will have the artificial development delay applied.
//
// The result is a pre-configured procedure that developers can import and use to build any API
// endpoint that does not require user authentication.
export const publicProcedure = t.procedure.use(timingMiddleware);

/**
 * Protected (authenticated) procedure
 *
 * If you want a query or mutation to ONLY be accessible to logged in users, use this. It verifies
 * the session is valid and guarantees `ctx.session.user` is not null.
 *
 * @see https://trpc.io/docs/procedures
 */

// This line creates the reusable "protected" procedure, which enforces user authentication.
// It is constructed by chaining together multiple middleware.
export const protectedProcedure = t.procedure

  // First, we apply the same `timingMiddleware` that the public procedure uses. This ensures
  // that all our procedures, public or protected, have consistent performance logging.
  .use(timingMiddleware)

  // Next, we chain a second, inline middleware using `.use()`. This new middleware's entire
  // purpose is to perform the authentication check.
  .use(({ ctx, next }) => {

    // This is the core authentication check. It verifies that the user is logged in.
    // The `!ctx.session?.user` condition is true if:
    //  - `ctx.session` is null or undefined.
    //  - `ctx.session` exists, but `ctx.session.user` is null or undefined.
    // The `?.` is the "optional chaining" operator, which prevents a runtime error if `ctx.session` is null.
    if (!ctx.session?.user) {

      // If the user is not authenticated, we immediately stop the execution by throwing a special error.
      // `TRPCError` is a dedicated error class from tRPC. By using a standard `code` like "UNAUTHORIZED",
      // tRPC automatically maps this to the correct HTTP status code (401) in the final response,
      // providing a clear, structured error to the client.
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    // If the check above passes, we know the user is authenticated. This line then does two things:
    // 1. (Runtime) It calls `next()` to proceed to the next middleware or the final procedure resolver.
    // 2. (Type-Safety) It passes a new, refined context object to the rest of the execution chain.
    //
    // This is a critical pattern for type safety in tRPC.
    return next({

      // We are providing a new `ctx` object for all downstream resolvers.
      ctx: {
        
        // This is the most important part for type-safety. After this point, any subsequent middleware
        // or the final procedure resolver will receive this new, refined context object.
        //
        // We are creating a new `session` object where the `user` property is guaranteed to exist.
        // The `if` check we just performed acts like a "bouncer" at the door—it throws out anyone
        // who doesn't have a `user` session.
        //
        // By constructing this new context, we are giving TypeScript a powerful guarantee. It can now
        // infer that for any code that runs *after* this middleware, the type of `ctx.session.user` is
        // no longer `User | null`, but simply `User`.
        //
        // This eliminates the need for annoying null-checks in every single protected procedure.
        // You can safely write `ctx.session.user.id` without TypeScript complaining that the user might be null.
        session: { ...ctx.session, user: ctx.session.user },
      },
    });
  });
