// This file is the server-side entry point and configuration for using tRPC within
// React Server Components (RSCs). It is NOT created by default in older T3 apps
// but is a core part of the modern T3 architecture for the Next.js App Router.
// This entire file should ONLY ever be imported into Server Components.

// This is not a standard import; it's a special package that acts as a guard.
// Its only purpose is to ensure that this module is never accidentally imported into a
// Client Component (a file with "use client" at the top). If a client-side file
// tries to import this module, the build process will fail with a clear error.
// This is a critical security and performance feature, guaranteeing that server-only logic,
// database connections, and secrets are never bundled and sent to the user's browser.
import "server-only";

// Imports a factory function from the tRPC library, specifically from its module designed
// for React Server Components (`rsc`).
// `createHydrationHelpers`: This function is the main tool for bridging server-fetched data
// with the client-side React Query cache. "Hydration" is the process of taking the state
// (the data) generated on the server and using it as the initial state on the client.
// This prevents the client from having to immediately re-fetch the same data the server
// just fetched, providing a seamless user experience with no loading spinners for initial data.
import { createHydrationHelpers } from "@trpc/react-query/rsc";

// Imports a dynamic function from Next.js that is specific to the App Router.
// `headers()`: This function can only be used inside Server Components. When called, it returns
// a read-only object containing the incoming HTTP request headers for the current request.
// This is necessary so that our server-side tRPC context can be aware of the request details.
import { headers } from "next/headers";

// Imports a new, powerful memoization function from the React library itself, designed for Server Components.
// `cache`: The `cache` function wraps another function. It ensures that for the duration of a single
// server render pass, the wrapped function is only executed ONCE. If multiple different components
// in the render tree call the same cached function, all subsequent calls after the first one will
// receive the cached result instead of re-executing it. This is a crucial optimization to prevent
// redundant database queries or API calls within the same 
import { cache } from "react";

// Imports two crucial pieces from The main tRPC router definition file (`/server/api/root.ts`).
// The `~/` is a path alias that points to your `src` directory, making imports cleaner.
// - `type AppRouter`: This is NOT JavaScript code; it's a TypeScript "type definition". The `type` keyword
//   ensures that only the type information is imported, which has no impact on the final JavaScript bundle.
//   `AppRouter` is the "blueprint" or "instruction manual" that describes the exact shape of your entire API:
//   all its routers, procedures, inputs, and outputs. We need this type to ensure that the caller we create
//   and the hydration helpers are fully type-safe.
import { createCaller, type AppRouter } from "~/server/api/root";

// Imports the function responsible for creating the tRPC context object. This function is defined
// in your main tRPC setup file (`/server/api/trpc.ts`).
// The "context" is an object containing resources that every tRPC procedure needs access to, such as
// the database connection (`db`) and information about the incoming request (like headers).
// We need to be able to create this context here so that when our server-side caller executes a
// procedure, that procedure receives the necessary context to do its job.
import { createTRPCContext } from "~/server/api/trpc";

// Imports a local helper function from a neighboring file in this directory.
// `createQueryClient`: This is a factory function whose only job is to create a new instance of the
// React Query `QueryClient`. In this server-side context, this `QueryClient` acts as a temporary,
// per-request cache. When a Server Component fetches data using the tRPC caller, the result is
// stored in this server-side cache. This cache is then passed down to the client to "hydrate"
// the client-side cache, preventing the need for an immediate re-fetch in the browser.
import { createQueryClient } from "./query-client";

// This block creates the specific "context"
// that our server-side tRPC caller will use. The context is an object that provides essential resources
// (like request headers and the database connection) to every tRPC procedure that gets called.
// 
// This line defines a new constant named `createContext`. The value assigned to it is not just a
// function, but a new, "memoized" version of that function created by React's `cache`.
//
// 1. `cache(...)`: This is a new, powerful function provided by the React library, designed specifically
//    for use in Server Components. Its purpose is to perform "memoization".
//    Memoization is a performance optimization technique. When you wrap a function in `cache`, you are
//    creating a new version of that function with a short-term memory. The first time this new function
//    is called during a single server render, it will execute the original function and store the result.
//    If any other component in the same server render tries to call this exact same cached function again,
//    it will NOT re-execute the original function. Instead, it will instantly return the stored (cached) result.
//
//    Imagine you have three different Server Components on the same page, and each one makes a tRPC call
//    (e.g., `<Header>`, `<Sidebar>`, `<MainContent>`). Without `cache`, each tRPC call would independently
//    try to create its own context, potentially leading to redundant work (like re-reading headers).
//    By wrapping this in `cache`, we guarantee that the context is created exactly ONCE per server request,
//    and all three components will share the exact same context object.
//
//  `async () => { ... }`: This is the original, asynchronous arrow function that we are passing
  //  to `cache`. This function contains the actual logic for building the tRPC context.
  //  It's `async` because it needs to use `await` to get the request headers.

/**
 * This wraps the `createTRPCContext` helper and provides the required context for the tRPC API when
 * handling a tRPC call from a React Server Component.
 */
const createContext = cache( async () => {

    // This line creates a new `Headers` object. The `Headers` API is a standard web API
    // for working with HTTP headers in an object-oriented way.
    // `await headers()`: We are calling the `headers()` function imported from `next/headers`. This function
    // can only be used in Server Components and asynchronously retrieves the incoming request headers.
    // `new Headers(...)`: We pass the plain object from `headers()` into the `Headers` constructor to get
    // a mutable, standardized `Headers` instance that has useful methods like `.get()` and `.set()`.
  const heads = new Headers(await headers());

  // This line modifies the `Headers` object by adding a new, custom header to it.
  //
  // `heads.set(key, value)`: This is a standard method on the `Headers` object. Its job is to
  // set a header to a specific value. If a header with the given key already exists, this
  // method will overwrite its value. If it does not exist, it will be created as a new
  // key-value pair.
  //
  // - The Key: `"x-trpc-source"`
  //   This is the name of our custom header. The `x-` prefix is a long-standing (though no longer
  //   required) convention for non-standard, application-specific headers.
  //
  // - The Value: `"rsc"`
  //   This is the value we are assigning to our header. It acts as a "flag" or "label" to identify
  //   the origin of this request.
  //
  // The purpose of this entire line is to tag the request. When our tRPC backend receives
  // the request, it can look for this `x-trpc-source` header. If it sees the value is `rsc`
  // (for React Server Component), it knows the call originated from server-side code, not
  // from a client-side browser fetch. This can be useful for debugging or for applying
  // different logic based on the source of the call.
  heads.set("x-trpc-source", "rsc");

  // This is the return statement for our anonymous async function. The value returned here
  // is what will be cached by React's `cache` function.
  // `createTRPCContext`: We are calling the function we imported from `~/server/api/trpc`.
  // This is the original, generic helper function that knows how to create the context
  // required by our tRPC procedures (which mainly involves creating the Prisma `db` instance).
  // It accepts an `opts` object with details about the request.
return createTRPCContext({

    // ` headers: heads `: We are passing a configuration object to `createTRPCContext`.
    //
    //   - `headers`: This is the property that the `createTRPCContext` function expects.
    //
    //   - `heads`: This is the `Headers` object that we created and modified in the previous steps.
    //     It contains all the original request headers plus our custom `x-trpc-source: rsc` header.
    //
    // By passing these headers, we are providing the necessary request information so that tRPC
    // procedures on the backend can, if needed, access them to make decisions (e.g., for
    // authentication or logging).
    headers: heads,
  });
});

// This line creates a memoized version of our `createQueryClient` helper function.
//
// Let's break down the structure: `const getQueryClient = cache(createQueryClient);`
//
// 1. `createQueryClient`: This is the original function we imported from `./query-client`.
//    Its only job is to return a `new QueryClient()`.
//
// 2. `cache(...)`: We are wrapping our original function with React's `cache` function.
//    This creates a new, memoized function. Just like with `createContext`, this is a critical
//    performance optimization for Server Components. It ensures that for the duration of a single
//    server render, a `QueryClient` instance is created exactly ONCE.
//
// 3. `const getQueryClient = ...`: We are assigning this new, cached function to a constant.
//    Now, if multiple components in the same render tree need the query client, the first one
//    that calls `getQueryClient()` will create it, and all subsequent calls will instantly
//    receive the same, cached instance without creating new ones.
const getQueryClient = cache(createQueryClient);

// This line creates the actual "server-side caller". This is the object that will allow
// our Server Components to execute tRPC procedures directly.
//
// 1. `createCaller`: This is the factory function we imported from `~/server/api/root.ts`.
//    It is designed to take one argument: a function that can create a tRPC context.
//
// 2. `createContext`: This is the argument we are passing. It is the memoized (`cache`d) function
//    we defined just above, which knows how to create the tRPC context for a server-side request.
//
// 3. `const caller = ...`: The `createCaller` function returns a fully-typed, asynchronous object.
//    This `caller` object now mirrors the exact shape of our `AppRouter`. You can use it to call
//    any of your API procedures as if they were just local async functions, for example:
//    `await caller.post.hello({ text: "world" })`.
//
//    When you call a procedure on this `caller`, it will internally use the `createContext` function
//    you provided to get the necessary context (like the database connection) before executing the procedure's logic.
const caller = createCaller(createContext);

// 1. `createHydrationHelpers<AppRouter>(...)`: This is the main factory function call.
//    - `createHydrationHelpers`: The function we imported from `@trpc/react-query/rsc`. Its job is to
//      generate a set of helper tools. Think of this function as a generic "Blueprint Factory".
//
//    - `<AppRouter>`: This is a TypeScript "Generic Type Argument". This is the most important
//      part for achieving type-safety. Imagine the `createHydrationHelpers` function is a generic factory that makes custom-fitted tools.
//      - The function itself is the machine (`createHydrationHelpers`).
//      - The Generic Type Argument you pass in the angle brackets `<...>` is the **custom mold or blueprint**
//        you feed into the machine.
//
//      The `AppRouter` type is the complete, detailed blueprint of our entire API (all its procedures,
//      inputs, and outputs). By writing `<AppRouter>`, we are giving our custom API blueprint to the
//      factory. The factory machine then uses this blueprint to produce a set of helper tools that are
//      perfectly shaped to work with our specific API.
//
//      Without this, the factory would produce generic, untyped tools. With `<AppRouter>`, the `api`
//      object it produces will know exactly that a procedure like `api.task.getAll` exists and that
//      it returns an array of tasks, giving us perfect autocompletion and error checking.
//
// 2. The Arguments to `createHydrationHelpers`:
//    These are the "raw materials" we give to the factory machine.
//    - `caller`: The first argument is our server-side `caller` object. This is the "engine" the factory
//      will put inside the tools it builds.
//    - `getQueryClient`: The second argument is our memoized `getQueryClient` function. This is the
//      "power source" (the cache) that the tools will use.
//
// 3. The Return Value of `createHydrationHelpers`:
//    - The factory function returns a single object containing the finished products, perfectly
//      custom-built according to our `AppRouter` blueprint.
//
// 4. `export const { trpc: api, HydrateClient } = ...`: This is a single line that unpacks the finished
//    products from the factory and exports them for use in other files.
//    - `{ ... }`: This is "object destructuring". We are opening the box from the factory.
//
//    - `trpc: api`: This is destructuring with a rename. It means:
//      "Take the tool labeled `trpc` from the box, but I want to call it `api` in my code."
//      The `api` object is now our fully-typed, server-side tRPC caller that Server Components will
//      use to fetch data (e.g., `await api.post.getAll()`).
//
//    - `HydrateClient`: This is standard destructuring. It means:
//      "Take the tool labeled `HydrateClient` from the box and call it `HydrateClient`." This component's
//      job is to take the data fetched on the server and use it to pre-fill the client's cache,
//      preventing the browser from having to re-fetch the same data.
export const { trpc: api, HydrateClient } = createHydrationHelpers<AppRouter>(
  caller,
  getQueryClient,
);
