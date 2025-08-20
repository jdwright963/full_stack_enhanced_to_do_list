// This file is the primary "root" router for the entire tRPC server. It acts as the
// central hub or assembly point where all the modular, feature-specific routers
// (e.g., `postRouter`, `taskRouter`) are combined into a single, unified API.

// Imports the core helper functions from the main tRPC configuration file.
// `createTRPCRouter`: A helper function to build a new tRPC router.
// `createCallerFactory`: A helper to create a "caller" for invoking procedures on the server-side.
import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";

// Imports the `taskRouter` we created. It contains all API procedures related to tasks.
import { taskRouter } from "./routers/task";

// Imports the `authRouter` we created. It contains all API procedures related to authentication.
import { authRouter } from "./routers/auth";

/**
 * This is the primary, or "root", router for your entire server.
 * It acts as a container that merges all the other modular routers (like taskRouter)
 * into a single, unified API structure.
 */

// This line creates our main `appRouter` by calling the `createTRPCRouter` helper function.
// `createTRPCRouter` takes a single configuration object where we "mount" all of our
// feature-specific routers (like `taskRouter`) onto different namespaces.
//
// We then immediately `export` the resulting `appRouter` object. Its primary consumer
// is the Next.js API route handler (at `src/app/api/trpc/[trpc]/route.ts`), which uses
// this router to process all incoming API requests from the client.
export const appRouter = createTRPCRouter({

  // This merges the `taskRouter` and `authRouter` into the main `appRouter` under the `task` and `auth` namespaces.
  // Frontend access will look like `api.task.getAll`, `api.task.create`, etc.
  task: taskRouter,
  auth: authRouter,
});

// This is the important line for type-safety.
// We are not exporting the router's logic. Instead, we are exporting its "shape" as a TypeScript type.
// The `typeof` operator inspects the `appRouter` object and infers a detailed type definition
// that includes all namespaces, procedures, their inputs (from Zod), and their outputs.
// This `AppRouter` type is what the tRPC client on the frontend imports to give you
// full end-to-end autocompletion and type-safety.
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API. It allows you to call the API and invoke
 * procedures from other server-side code (like in Next.js API routes or `getServerSideProps`)
 * without making an actual HTTP request. It's a direct, type-safe function call.
 * @example
 * const trpc = createCaller(createContext); // `createContext` would be your context-generating function
 * const allPosts = await trpc.post.all();
 */

// The `createCallerFactory` takes your main `appRouter` as an argument
// and returns a new function, `createCaller`, which you can then use to build a server-side caller instance.
export const createCaller = createCallerFactory(appRouter);
