// The `~/` is a path alias configured in `tsconfig.json`, pointing to the `src/` directory.
// This prevents messy relative paths like `../../../`.
// import { postRouter } from "~/server/api/routers/post";

// Imports the core helper functions from the main tRPC configuration file.
// `createTRPCRouter`: A helper function to build a new tRPC router.
// `createCallerFactory`: A helper to create a "caller" for invoking procedures on the server-side.
import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";

// Imports the `taskRouter` we created. It contains all API procedures related to tasks.
import { taskRouter } from "./routers/task";

/**
 * This is the primary, or "root", router for your entire server.
 * It acts as a container that merges all the other modular routers (like postRouter, taskRouter)
 * into a single, unified API structure.
 */
// We export `appRouter` so it can be used by the Next.js tRPC handler to create the actual API endpoint.
export const appRouter = createTRPCRouter({

  // This merges the `postRouter` into the main `appRouter` under the `post` namespace.
  // On the frontend, all procedures inside `postRouter` will be accessed via `api.post.procedureName`.
  // post: postRouter,

  // This merges the `taskRouter` into the main `appRouter` under the `task` namespace.
  // Frontend access will look like `api.task.getAll`, `api.task.create`, etc.
  task: taskRouter,

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
