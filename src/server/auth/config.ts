// This is the central configuration file for NextAuth.js (now Auth.js).
// It defines everything about how authentication works in your application, including which
// login methods to support (Providers), how to store user data (Adapter), and how to
// customize the session data (Callbacks).

// Imports the PrismaAdapter. This is the "glue" that tells NextAuth.js
// how to communicate with your Prisma database. It handles all the database operations
// like creating users, finding sessions, linking accounts, etc., automatically.
import { PrismaAdapter } from "@auth/prisma-adapter";

// Imports TypeScript types from the `next-auth` library. These are not runnable code;
// they are blueprints for ensuring our configuration is correct and type-safe.
// `DefaultSession`: The default shape of the user session object. We use this as a base to extend.
// `NextAuthConfig`: The type that our main `authConfig` object must satisfy, providing autocompletion and error checking.
import { type DefaultSession, type NextAuthConfig } from "next-auth";

// Imports the provider for a traditional email and password login system.
// Unlike OAuth providers, we must supply the logic to authorize the user ourselves.
import CredentialsProvider from "next-auth/providers/credentials";

// Imports the `bcryptjs` library, a critical security tool for hashing and safely comparing passwords.
// This ensures we never store plain-text passwords in our database.
import bcrypt from "bcryptjs";

// Imports our globally initialized Prisma Client instance from the server directory.
// This is the actual database connection object that will be used by the PrismaAdapter
// and our custom CredentialsProvider logic.
import { db } from "~/server/db";

/**
 * This is a TypeScript feature called "Module Augmentation". Its purpose is to "reach into"
 * the original type definitions from the `next-auth` library and add our own custom properties
 * to them. This ensures that our custom session object remains fully type-safe throughout the application.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
// We declare that we are augmenting the 'next-auth' module.
declare module "next-auth" {

  // We are redefining the `Session` interface.
  // `extends DefaultSession` means our new interface will have all the properties of the original, plus our additions.
  interface Session extends DefaultSession {

    // We are adding a new definition for the `user` object within the session.
    user: {

      // This is our custom property: we are adding the user's `id` to the session.
      id: string;

      // `& DefaultSession["user"]` merges our custom property with all the original properties
      // from the default user object (like `name`, `email`, `image`).
    } & DefaultSession["user"];
  }
}

// This exports the main configuration object for NextAuth.js so it can be used by the NextAuth handler.
// The `satisfies NextAuthConfig` at the end of the object is a TypeScript feature that checks
// if our object's shape correctly matches the required `NextAuthConfig` type, giving us type safety.
export const authConfig = {

  // The 'providers' key is an array where we define all the different ways a user can sign in.
  // Each element in this array is a configured authentication provider.
  providers: [

    // We are initializing the `CredentialsProvider` provider for a custom email/password login flow.
    // It takes a configuration object as its argument.
    CredentialsProvider({

      // `name`: This is the display name for this login method, which can be used on a sign-in page.
      name: "Email / Password",

      // `credentials`: This object defines the input fields that NextAuth.js should automatically
      // generate on a default sign-in page. We won't use that page, but this is still good practice.
      credentials: {

        // Defines the 'email' input field.
        email: { label: "Email", type: "text" },

        // Defines the 'password' input field.
        password: { label: "Password", type: "password" },
      },

      // `authorize`: This is the MOST IMPORTANT part of the CredentialsProvider.
      // It's an `async` function where we must write our own custom logic to verify a user's credentials.
      // NextAuth.js will call this function with the `credentials` (email/password) submitted by the user.
      // Our job is to return the user object if they are valid, or null/throw an error if they are not.
      async authorize(credentials) {
      
        // Safely access the 'email' and 'password' properties from the credentials object using optional chaining (`?.`).
        // This prevents an error if the `credentials` object is null or undefined.
        const email = credentials?.email;
        const password = credentials?.password;
        
        // This is a "type guard". It checks that the variables are not just present,
        // but are also of the correct type (string).
        if (typeof email !== 'string' || typeof password !== 'string') {
          throw new Error("Invalid credentials provided.");
        }

        // If the credentials are not missing, we proceed to query the database using our Prisma Client (`db`).
        // The `await` keyword pauses execution until the database query is complete.
        // `db.user.findUnique`: This Prisma method searches for a single user record.
        const user = await db.user.findUnique({

          // The `where` clause tells Prisma what to search for. We are looking for a user whose `email` column
          // exactly matches the email provided by the user in the login form.
          where: { email },

          // The `select` clause is an optimization. Instead of fetching the entire user record,
          // we are telling Prisma to only return the specific fields we need for authorization.
          // select: {
          //   id: true,
          //   email: true,
          //   password: true,
          //   emailVerified: true,
          //   name: true,
          //   image: true,
          // },
        });

        // This is a critical security and logic check performed after the database query.
        // The `if (!user?.password)` condition will be true if:
        //
        // 1. No user was found with the provided email (`user` is null).
        // 2. A user was found, but their `password` field is null.
        //
        // The `?.` is the "optional chaining" operator. It safely handles the first case. If `user`
        // is null, the expression short-circuits to `undefined` without throwing an error, and the
        // `if` condition becomes true.
        //
        // By throwing the same generic error message in both cases, we avoid a "user enumeration"
        // vulnerability. An attacker cannot use this endpoint to determine which email addresses
        // are registered in our system, as they will get the same response either way.
        if (!user?.password) {
          throw new Error("No user found with this email.");
        }
        
        // If the user exists but hasn't verified their email yet,
        // we deny the login and tell them to check their email.
        if (!user.emailVerified) {
          throw new Error("Please verify your email before logging in.");
        }
    
        // We use the `bcrypt.compare` function, which is designed for this specific, secure purpose.
        // It takes the plain-text `password` from the login form and the hashed `user.password` from the database.
        // It will securely hash the login password and see if it matches the stored hash, returning `true` or `false`.
        const isValid = await bcrypt.compare(password, user.password);

        // If `bcrypt.compare` returns false, the passwords do not match.
        if (!isValid) {
          throw new Error("Incorrect password.");
        }

        // If we've passed all the checks (user exists, email is verified, password is valid),
        // we return the `user` object.
        // NextAuth.js sees this successful return and proceeds to create a session for this user.
        return user;
      },
    }),
  ],

  // The 'adapter' key tells NextAuth.js how and where to store user data permanently.
  // We are providing the `PrismaAdapter`, which we configured by passing it our database client instance (`db`).
  // This adapter will automatically handle creating users, sessions, accounts, etc., in our database
  // using the Prisma schema we defined earlier.
  adapter: PrismaAdapter(db),

  session: {

    // Use JSON Web Tokens for session management. The session data is encoded in a
    // secure cookie, and the database is not queried on every request to check the session.
    strategy: "jwt",

        // The `maxAge` option specifies the maximum age of the session cookie in seconds.
        // In this case, we're setting the maximum age to 30 days (30 * 24 * 60 * 60 seconds).
        // This means that the session cookie will be valid for 30 days from the time it's created,
        // after which it will expire and the user will be logged out.
        // This value can be adjusted based on the specific requirements of your application,
        // such as the desired length of time a user should remain logged in.
        maxAge: 30 * 24 * 60 * 60,
  },

  // The 'callbacks' object allows us to customize the behavior of the authentication flow at specific points.
  // We can hook into events like sign-in, session creation, and JWT generation.
  callbacks: {

    /**
     * This callback is the core of the JWT strategy. It is invoked every time a session is
     * accessed, allowing you to control the token's content. The returned value is then
     * encrypted and stored in a browser cookie.
     *
     * This function is called in two distinct scenarios:
     *
     * 1. On Initial Sign-In (Creation):
     *    - This happens only once, immediately after the user successfully authenticates.
     *    - The `user` object from the database IS passed to this function.
     *    - The purpose is to transfer data from the database `user` object (like `id`, `role`) into the token.
     *
     * 2. On Subsequent Session Checks (Verification & Update):
     *    - This happens on every request where a session is checked. This is triggered by actions like:
     *      - Calling `useSession()` on the client-side.
     *      - Calling `auth()` on the server-side.
     *      - Accessing a page or API route protected by NextAuth.js middleware.
     *    - During these checks, the `user` object is `undefined`. You only have the token that
     *      was created during the initial sign-in.
     *    - The purpose is to verify the existing token. This is also where you could implement logic to
     *      update the token, for example, by refreshing an OAuth access token.
     *
     * @param {object} token The JWT payload.
     * @param {object} user The user object from the database, ONLY available on initial sign-in.
     * @returns The token that will be encrypted and saved.
     */

    // The `jwt` callback is declared as `async`, allowing for potential database lookups if needed.
    // It destructures its argument to directly access the `token` and `user` objects.
    // In NextAuth.js, jwt is a reserved callback name that is automatically called when a session is accessed.
    async jwt({ token, user }) {

      // Debug logging
      console.log("JWT callback", { token, user });

      // This if statement checks if the `user` object is present. This is only true on the initial sign-in,
      // because that is the only time the `user` object is passed to this callback.
      if (user) {

        // We are "enriching" the token with the user's database ID.
        token.id = user.id;
      }

      // Return the token, now containing the user ID, to be saved in the cookie.
      return token;
    },

   /**
     * The `session` callback is invoked after the `jwt` callback on every session access.
     * Its purpose is to customize the session object that is returned to the client.
     * With the JWT strategy, it receives the `token` from the `jwt` callback and the default `session` object.
     *
     * @param {object} session The default session object, pre-filled with basic data like `name` and `email`.
     * @param {object} token The token object returned from the `jwt` callback, containing our custom data.
     * @returns The final, enriched session object that will be made available to the client-side code.
     */
    session: ({ session, token }) => 
      
      // This parenthesis opens the object that will be implicitly returned by the arrow function.
      ({

      // The spread syntax (...) is used here to create a shallow copy of all properties
      // from the original `session` object and place them into this new object we are building.
      // This ensures we preserve essential top-level properties like `session.expires`.
      ...session,

      // We are explicitly overwriting the `user` property that was just copied from the original session.
      // The new value for `user` will be the object defined below.
      user: {

        // Inside our new `user` object, we again use the spread syntax. This time, we copy all
        // properties from the original `session.user` object (which are `name`, `email`, and `image`).
        // This ensures we don't lose the default user data.
        ...session.user,

        // This is the key customization. We are adding a new property, `id`, to our `user` object.
        // The value, `token.id`, is retrieved from the `token` object that was passed down from the `jwt` callback.
        //
        // The `as string` is a TypeScript "type assertion". We need it because:
        // 1. In the `jwt` callback, we add the `id` property to the `token` object.
        // 2. However, TypeScript's default type definition for the `token` object (the `JWT` type from `next-auth/jwt`)
        //    does not include an `id` property.
        // 3. This assertion tells TypeScript to override its static type analysis and trust us that `token.id` exists and is a string.
        //
        // This is different from the `declare module "next-auth"` block we defined earlier. That block updates the
        // final Session type, not the intermediate JWT type that is used here as an input.
        id: token.id as string,
      },
    }),
  },

  // The 'pages' object allows us to override the default pages NextAuth.js uses.
  pages: {

    // `signIn`: If an unauthenticated user tries to access a protected page, NextAuth.js will
    // redirect them to this path. We are setting it to our custom `/login` page.
    signIn: "/login",

    // `error`: If an error occurs during sign-in (e.g., invalid credentials), NextAuth.js will
    // redirect the user to this path. We're also sending them back to `/login`, where we can
    // display an error message.
    error: "/login",
  },

// This final curly brace closes the entire `authConfig` configuration object.
// `satisfies NextAuthConfig`: This is a TypeScript operator that checks if our `authConfig` object's
// structure is valid according to the `NextAuthConfig` type, ensuring we haven't made any typos
// or configured something incorrectly. It provides type safety for our entire configuration.
} satisfies NextAuthConfig;