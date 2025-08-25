// This file defines the "task" router for our tRPC API. A router is a collection of
// related procedures that handle a specific data entity or feature. This file contains
// all the server-side logic for task-related operations.

// Zod is a TypeScript-first schema validation library. In the T3 stack, it's used
// to define the expected shape and types of the input for your API procedures.
// This ensures that any data sent from the client to this endpoint is valid before
// your code even tries to process it.
import { z } from "zod";

// These are helper functions from the main tRPC configuration file (/server/api/trpc.ts).
// - createTRPCRouter is used to create a new router, which is like a container
//   for a group of related API endpoints (e.g., all endpoints for handling tasks).
// - publicProcedure is a basic building block for an API endpoint that does NOT
//   require the user to be authenticated. Anyone can call this endpoint.
import { createTRPCRouter, publicProcedure } from "../trpc";

  // Here, we're creating and exporting a router specifically for handling "task" operations.
  // This `taskRouter` will be merged into your main `appRouter` so that its endpoints
  // become accessible to the frontend under the `task` namespace (e.g., `api.task.getAll`).
  export const taskRouter = createTRPCRouter({

    // This defines the `getAll` API endpoint within the taskRouter.
  
    // - getAll: This is the name of the procedure. On the frontend, you'll call
    //   this using a hook like api.task.getAll.useQuery().
   
    // - publicProcedure: Specifies that this endpoint is publicly accessible and doesn't
    //   require a user to be logged in.
   
    // - .query(async ({ ctx }) => { ... }):  This declares it as a data-fetching
    //   operation. The function inside is the "resolver" that runs on the server.
   
    // - async ({ ctx }): The resolver function receives a ctx (context) object.
    //   The context is configured in your main tRPC file and contains things
    //   that every procedure might need, like the database connection (db) and user
    //   session info.
   
    // - return ctx.db.task.findMany(...): This is where Prisma comes in.
    //   - ctx.db is your Prisma Client instance, providing type-safe access to your database.
    //   - .task directly corresponds to the Task model in your schema.prisma.
    //   - .findMany() is a Prisma method to retrieve all records from the Task table.
    //   - { orderBy: { createdAt: "desc" } } is an option passed to findMany to sort
    //     the results by the createdAt field in descending order (newest tasks first).
   
    // The data returned by this function is automatically serialized by trpc and sent to the client.
    // tRPC also infers the TypeScript type of this return value (when trpc does this to the entire AppRouter), giving you full
    // end-to-end type safety on the frontend.
    getAll: publicProcedure.query(async ({ ctx }) => {
      return ctx.db.task.findMany({ orderBy: { createdAt: "desc" } });
    }),

    // This defines the `create` API endpoint within the `taskRouter`.
    // It's a `mutation` procedure, meaning it's designed for writing or changing data.
    // Its purpose is to create a new task in the database.
    //
    // - `create:`: The name of the procedure. The frontend will use a hook like
    //   `api.task.create.useMutation()` to call this endpoint.
    //
    // - `publicProcedure`: Again, this specifies that the endpoint is public and
    //   does not require user authentication.
    create: publicProcedure

      //   - `.input()`: Declares that this procedure expects input data from the client.
      //   - `z.object({...})`: Uses Zod to define the schema for the input. It must be
      //     a JavaScript object.
      //   - `{ title: z.string().min(1) }`: Specifies that the object must have a `title`
      //     property which must be a string with at least 1 character (it cannot be empty).
      //   - tRPC automatically validates incoming data against this schema.
      //     If the client sends invalid data (e.g., no title, or a title that isn't a string),
      //     tRPC will reject the request with an error before the mutation code even runs.
      // The `{ message: "..." }` is the second argument to `.min()`, providing a
      // specific error message if the title fails the validation.
      .input(z.object({ title: z.string().min(1, { message: "Task title cannot be empty." }) }))

      // - `.mutation(async ({ ctx, input }) => { ... })`: This declares the procedure as
      //   a "mutation" (a data-changing operation).
      //   - The resolver function receives two arguments:
      //     - `ctx`: The context object, containing our Prisma database client (`ctx.db`).
      //     - `input`: The validated and type-safe input data from the client. Because of the
      //       Zod schema, TypeScript knows that `input` is an object with a `title` property
      //       of type `string`.
      .mutation(async ({ ctx, input }) => {

        // - `return ctx.db.task.create({ data: { title: input.title } });`: This is the
        //   core logic that executes if the input is valid.
        //   - `ctx.db.task.create()`: Calls the `create` method on the Prisma `Task` model.
        //   - `{ data: { title: input.title } }`: Provides the data for the new task record.
        //     We set the `title` column to the value we received in the validated `input`.
        //   - Other fields like `id`, `completed`, `createdAt`, and `updatedAt` are handled
        //     automatically by Prisma/the database based on the `@default` rules in the schema.
        //
        // The newly created task object, including its database-generated ID and timestamps,
        // is returned by Prisma, and tRPC then sends it back to the client as the result
        // of the mutation.
        return ctx.db.task.create({ data: { title: input.title } });
      }),


    // Defines a new public procedure named 'toggle.
    toggle: publicProcedure

      // Specifies that this procedure requires input from the client.
      // Using Zod, it validates that the input is an object containing a string 'id'.
      .input(z.object({ id: z.string() }))

      // Defines this as a mutation (a data-changing operation) and provides the server-side function to run.
      .mutation(async ({ ctx, input }) => {

        // Checks if the task with the provided 'id' exists in the database.
        const task = await ctx.db.task.findUnique({ where: { id: input.id } });

        // If the task doesn't exist, throws an error.
        if (!task) throw new Error("Task not found");

        // If the task was found, update it in the database. The 'return' sends the updated task back to the client.
        return ctx.db.task.update({

          // Specifies that we want to update the task with the provided 'id'.
          where: { id: input.id },

          // Updates the 'completed' field to its opposite value.
          data: { completed: !task.completed },
        });
      }),

    // Defines a new public procedure named 'delete'.
    delete: publicProcedure

      // Specifies that this procedure requires input from the client.
      // Using Zod, it validates that the input is an object containing a string 'id'.
      .input(z.object({ id: z.string() }))

      // Defines this as a mutation (a data-changing operation) and provides the server-side function to run.
      .mutation(async ({ ctx, input }) => {

        // Deletes the task with the provided 'id' from the database.
        return ctx.db.task.delete({ where: { id: input.id } });
      }),
  });