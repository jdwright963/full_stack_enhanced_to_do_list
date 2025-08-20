// This file defines the "auth" router for our tRPC API. A router is a modular
// container for a group of related API procedures. This file contains the server-side
// business logic for custom authentication-related actions that we build ourselves,
// such as user registration.
//
// It is important to distinguish this from the main NextAuth.js handlers located at
// `/api/auth/[...nextauth]/route.ts`. That file handles the core, built-in
// authentication flows provided by the NextAuth.js library (like sign-in, sign-out,
// and OAuth callbacks). This router, in contrast, is for the custom procedures that
// we add to supplement that core functionality (like registration).

// Imports the main `z` object from the `zod` library. Zod is a TypeScript-first
// schema validation library. We use it here to define the exact shape, types, and
// constraints (e.g., `min(6)`) for the input data that our API procedures expect
// from the client, ensuring robust data validation and type safety.
import { z } from "zod";

// Imports the foundational "building blocks" from our main tRPC configuration file.
// - `createTRPCRouter`: The factory function we use to initialize a new router object.
// - `publicProcedure`: The base procedure for creating endpoints that do NOT require
//   a user to be authenticated. This is essential for a public-facing action like registration.
import { createTRPCRouter, publicProcedure } from "../trpc";

// Imports the globally initialized Prisma Client instance, which we have named `db`.
// This is our primary tool for interacting with the database. We will use it within our
// procedure resolvers to query (`.findUnique()`) and create (`.create()`) user records.
import { db } from "~/server/db";

// Imports the `bcryptjs` library, a crucial security tool for password management.
// We will use its `.hash()` method to securely hash the user's plain-text password
// before it is ever stored in the database. This ensures that even if the database
// were compromised, the user's actual passwords would not be exposed.
import bcrypt from "bcryptjs";

// Imports our custom `sendVerificationEmail` utility function from our email library.
// After successfully creating the user and their unique verification token, we will
// call this function to trigger the actual sending of the verification email via our
// configured email service (e.g., Resend or Mailtrap).
import { sendVerificationEmail } from "~/lib/email";

// Imports the built-in `crypto` module from Node.js. This is a standard, secure library
// provided by the Node.js runtime for cryptographic functionality. We will use its
// `randomBytes` method to generate a secure, random, and unique token that will be used
// for the user's one-time email verification link.
import crypto from "crypto";

// This line begins the definition of our authentication-specific router.
// `export const authRouter = ...`: We are creating a constant named `authRouter` and exporting
// it so it can be merged into our main `appRouter` in `~/server/api/root.ts`.
//
// `createTRPCRouter({ ... })`: We call the factory function we imported from the tRPC setup.
// It takes a single object as its argument. The keys of this object will be the names of the
// procedures (e.g., `register`), and the values will be the procedure definitions themselves.
export const authRouter = createTRPCRouter({

  // This line defines a new "procedure" (an API endpoint) within our `authRouter`.
  // The key, `register`, becomes the name of the procedure. On the client side, this will be
  // accessed via `api.auth.register`.
  //
  // `publicProcedure`: We are using the `publicProcedure` builder, which we imported. This
  // designates the `register` endpoint as publicly accessible, meaning a user does NOT
  // need to be logged in to call it, which is essential for a registration form.
  register: publicProcedure

    // This method is chained to the `publicProcedure` to define and validate the input
    // that this `register` endpoint expects from the client.
    //
    // `z.object({ ... })`: We are using the imported `z` object from the Zod library to define
    // the input's schema. `z.object()` specifies that the incoming data must be a JavaScript object.
    // The keys and validation rules inside this object define the required shape of that data.
    //
    // If the client sends data that does not match this schema, tRPC will automatically reject
    // the request with a detailed validation error before the mutation logic is ever executed.
    .input(z.object({

      // This line defines the validation rule for the `email` field.
      // `z.string()`: Specifies that the `email` must be a string.
      // `.email()`: A chained validator that further requires the string to be in a
      // valid email format (e.g., "user@domain.com").
      email: z.string().email(),

      // This line defines the validation rule for the `password` field.
      // `z.string()`: Specifies that the `password` must be a string.
      // `.min(6)`: A chained validator that enforces a minimum length, requiring the
      // password string to be at least 6 characters long.
      password: z.string().min(6),
    }))

    // This method is chained last and defines the actual server-side logic for the procedure.
    // `.mutation()`: This designates the procedure as a "mutation", which is a tRPC term
    // for any operation that creates, updates, or deletes data. The function passed to it is
    // the "resolver".
    //
    // A resolver is the core function of any API endpoint. It's the server-side code that
    // "resolves" the client's request. Its job is to take the request's context (`ctx`) and
    // validated input (`input`), perform the necessary business logic (like talking to a
    // database or another API), and then return a result to the client.
    //
    // `async ({ input }) => { ... }`: This is our resolver function.
    // - `async`: We mark the function as `async` because it will perform asynchronous
    //   database operations using `await`.
    // - `({ input })`: The resolver receives a single object argument containing `ctx` and `input`.
    //   We are using object destructuring to extract only the `input` property, which holds the
    //   client's data after it has been successfully validated by our Zod schema.
    .mutation(async ({ input }) => {

      // This line defines the validation rule for the `password` field.
      // `z.string()`: Specifies that the `password` must be a string.
      // `.min(6)`: A chained validator that enforces a minimum length, requiring the
      // password string to be at least 6 characters long.
      const { email, password } = input;

    // This line queries the database to check if a user with the provided email already exists.
      // `await`: Pauses the execution of the resolver until the database query completes.
      // `db.user.findUnique`: This is a Prisma Client method that searches for a single record
      // in the `User` table based on a unique field.
      // `{ where: { email } }`: This specifies the search criteria. The `{ email }` is a
      // shorthand for `{ email: email }`, telling Prisma to find a user whose `email` column
      // exactly matches the email from our `input`. The `existingUser` constant will either
      // hold the found user object or `null` if no match is found.
      const existingUser = await db.user.findUnique({ where: { email } });

      // This is a "guard clause" to prevent duplicate user accounts.
      // `if (existingUser)`: This condition is "truthy" if the `findUnique` query above
      // successfully found a user object (meaning the email is already in use).
      if (existingUser) {

        // If a user already exists, we immediately stop the registration process by throwing an error.
        // In a tRPC mutation, throwing an error like this will automatically be caught by tRPC,
        // which will then send a formatted error response back to the client. The client-side
        // `onError` callback of the `useMutation` hook will be triggered with this exact message.
        throw new Error("Email already in use");
      }

      // This line securely hashes the user's plain-text password.
      // `await bcrypt.hash(password, 10)`: We are calling the asynchronous `hash` method from the
      // `bcryptjs` library.
      // - `password`: The plain-text password string that the user provided.
      // - `10`: The "salt rounds" or "cost factor". This number determines how computationally
      //   expensive the hashing process is. A higher number is more secure but slower. `10` is a
      //   common and secure default. The result is a long, secure hash string.
      const hashedPassword = await bcrypt.hash(password, 10);

      // This line generates a cryptographically secure, random token for email verification.
      // `crypto.randomBytes(32)`: This method from Node.js's built-in `crypto` module generates
      // 32 random bytes, producing a highly unpredictable value.
      // `.toString("hex")`: This method converts those raw bytes into a hexadecimal string
      // (e.g., "a1b2c3..."), which is a URL-safe and easy-to-store format. This token will
      // be unique for every new user.
      const verificationToken = crypto.randomBytes(32).toString("hex");

      // Now that all checks have passed and all necessary data has been generated, this line
      // creates the new user record in the database.
      // `await db.user.create({ ... })`: We call the `create` method on our Prisma `User` model,
      // which will insert a new row into the `User` table. The `await` keyword pauses
      // execution until the database write operation is complete. The newly created user
      // object, including its database-generated ID, is then assigned to the `newUser` constant.
      const newUser = await db.user.create({

        // The `data` property is a required key for a Prisma `create` operation. Its value is an
        // object where the keys are the names of the columns in your `User` table and the values
        // are the data you want to insert for this new user record.
        data: {

          // We set the `email` column to the value of the `email` constant. This is using
          // JavaScript's "object property shorthand" syntax, which is a shortcut for `email: email`.
          email,

          // We set the `password` column to the `hashedPassword` string we generated earlier
          // with bcrypt. We are safely storing the secure hash, not the user's plain-text password.
          password: hashedPassword,

          // This line creates a default `name` for the user based on their email address.
          // `email.split('@')[0]`:
          // - `email.split('@')`: This splits the email string into an array of two parts at the `@` symbol.
          //   (e.g., "johndoe@example.com" becomes `["johndoe", "example.com"]`).
          // - `[0]`: We then access the first element of that array, which is the part before the `@`.
          // This provides a sensible, non-empty default username.
          name: email.split('@')[0],

          // We set the `verificationToken` column to the secure, random token we generated with `crypto`.
          // This uses the property shorthand for `verificationToken: verificationToken`.
          verificationToken,
        },
      });

      // This is a "side effect" that runs after the user has been successfully created in the database.
      // `await sendVerificationEmail(...)`: We call our imported email utility function. The `await` ensures
      // that our mutation will not return a success response to the client until the email has been
      // successfully handed off to our email service (e.g., Resend or Mailtrap).
      //
      // We pass two arguments:
      // - `newUser.email!`: The email address of the user we just created. The `!` is a TypeScript
      //   "non-null assertion". We are telling the compiler, "I am 100% certain that `newUser.email`
      //   is not null or undefined," which is safe because we just created the user with a valid email.
      // - `verificationToken`: The unique token generated for this user.
      await sendVerificationEmail(newUser.email!, verificationToken);

      // This is the final step of the resolver. The object returned here is what will be sent
      // back to the client as the successful result of the mutation.
      // The client-side `onSuccess` callback of the `useMutation` hook will receive this object
      // as its data payload.
      return { message: "Registration successful! Please check your email to verify your account." };
    }),
});