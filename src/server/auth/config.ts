// --- Purpose of this file ---
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

// Imports the pre-configured provider for "Sign in with Discord". This object contains all the
// logic for handling the OAuth 2.0 flow with Discord.
import DiscordProvider from "next-auth/providers/discord";

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

    // We are initializing the `CredentialsProvider` for a custom email/password login flow.
    // It takes a configuration object as its argument.
    CredentialsProvider({

      // `name`: This is the display name for this login method, which can be used on a sign-in page.
      name: "Credentials",

      // `credentials`: This object defines the input fields that NextAuth.js should automatically
      // generate on a default sign-in page. We won't use that page, but this is still good practice.
      credentials: {

        // Defines the 'email' input field.
        email: { label: "Email", type: "text" },

        // Defines the 'password' input field.
        password: { label: "Password", type: "password" },
      },
      

      // // `authorize`: This is the MOST IMPORTANT part of the CredentialsProvider.
      // // It's an `async` function where we must write our own custom logic to verify a user's credentials.
      // // NextAuth.js will call this function with the `credentials` (email/password) submitted by the user.
      // // Our job is to return the user object if they are valid, or null/throw an error if they are not.
      // async authorize(credentials) {
      
      //   // Safely access the 'email' and 'password' properties from the credentials object using optional chaining (`?.`).
      //   // This prevents an error if the `credentials` object is null or undefined.
      //   const email = credentials?.email;
      //   const password = credentials?.password;
        
      //   // This is a crucial validation and security check. It runs before we even try to query the database.
      //   // It checks three conditions:
      //   // 1. `!email`: Is the email value missing (null, undefined, or an empty string)?
      //   // 2. `typeof email !== 'string'`: Is the email value not a string? This protects against unexpected data types.
      //   // 3. `!credentials.password`: Is the password value missing?
      //   // If any of these are true, it means the request is invalid.
      //   if (!email || typeof email !== 'string' || !credentials.password) {

      //     // We `throw new Error` to immediately stop the authorization process.
      //     // NextAuth.js will catch this error and display a "Missing credentials" message to the user.
      //     throw new Error("Missing credentials");
      //   }
      
      //   // If the credentials are not missing, we proceed to query the database using our Prisma Client (`db`).
      //   // The `await` keyword pauses execution until the database query is complete.
      //   // `db.user.findUnique`: This Prisma method searches for a single user record.
      //   const user = await db.user.findUnique({

      //     // The `where` clause tells Prisma what to search for. We are looking for a user whose `email` column
      //     // exactly matches the email provided by the user in the login form.
      //     where: { email },

      //     // The `select` clause is an optimization. Instead of fetching the entire user record,
      //     // we are telling Prisma to only return the specific fields we need for authorization.
      //     select: {
      //       id: true,
      //       email: true,
      //       password: true,
      //       emailVerified: true,
      //       name: true,
      //       image: true,
      //     },
      //   });

      //   // This is the first check after the database query. If the `user` object is null,
      //   // it means no user was found with that email address in our database.
      //   if (!user) throw new Error("No user found");

      //   // This is a business logic check. If the user exists but hasn't verified their email yet,
      //   // we deny the login and tell them to check their email.
      //   if (!user.emailVerified) throw new Error("Please verify your email");

    
      //   // This is the core password verification step.
      //   // We use the `bcrypt.compare` function, which is designed for this specific, secure purpose.
      //   // It takes the plain-text `password` from the login form and the hashed `user.password` from the database.
      //   // It will securely hash the login password and see if it matches the stored hash, returning `true` or `false`.
      //   const isValid = await bcrypt.compare(password, user.password);

      //   // If `bcrypt.compare` returns false, the passwords do not match.
      //   if (!isValid) throw new Error("Invalid password");

      //   // If we've passed all the checks (user exists, email is verified, password is valid),
      //   // we return the `user` object.
      //   // NextAuth.js sees this successful return and proceeds to create a session for this user.
      //   return user;
      // },

      // EDIT!!!
      async authorize(credentials) {
      
        const email = credentials?.email;
        const password = credentials?.password;
        
        // --- START OF FIX ---
        // This is a "type guard". It checks that the variables are not just present,
        // but are also of the correct type (string).
        if (typeof email !== 'string' || typeof password !== 'string') {
          throw new Error("Invalid credentials provided.");
        }
        // --- END OF FIX ---

        const user = await db.user.findUnique({
          where: { email },
          // No need for select here, let's get the full user object
        });

        if (!user || !user.password) {
          // If no user or if the user record somehow has no password
          throw new Error("No user found with this email.");
        }
        
        if (!user.emailVerified) {
          throw new Error("Please verify your email before logging in.");
        }
    
        // Now, TypeScript knows that both `password` (from credentials)
        // and `user.password` (from the database) are guaranteed to be strings.
        const isValid = await bcrypt.compare(password, user.password);

        if (!isValid) {
          throw new Error("Incorrect password.");
        }

        return user;
      },
// EDIT!!!

    }),

    // This initializes the pre-configured provider for "Sign in with Discord".
    // This provider handles the entire OAuth 2.0 flow with Discord automatically.
    DiscordProvider({

  // `clientId`: Your application's public ID, obtained from the Discord Developer Portal.
  // `process.env.DISCORD_CLIENT_ID`: This safely loads the ID from your environment variables (`.env` file).
  // `!`: The non-null assertion operator. It tells TypeScript, "I guarantee this environment variable will exist at runtime".
  // This is common in config files where the app shouldn't start if the variable is missing.
  clientId: process.env.DISCORD_CLIENT_ID!,

  // `clientSecret`: Your application's private secret key from the Discord Developer Portal.
  // This must be kept secure and should never be exposed on the frontend.
  clientSecret: process.env.DISCORD_CLIENT_SECRET!,

// This closes the `DiscordProvider` configuration object.
}),

  // This square bracket closes the `providers` array.
  ],

  // The 'adapter' key tells NextAuth.js how and where to store user data permanently.
  // We are providing the `PrismaAdapter`, which we configured by passing it our database client instance (`db`).
  // This adapter will automatically handle creating users, sessions, accounts, etc., in our database
  // using the Prisma schema we defined earlier.
  adapter: PrismaAdapter(db),

  session: {
    strategy: "database", // Explicitly tell NextAuth to use the database strategy.
  },

  // The 'callbacks' object allows us to customize the behavior of the authentication flow at specific points.
  // We can hook into events like sign-in, session creation, and JWT generation.
  callbacks: {

     jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },

     async signIn({ user, account }) {
      // Allow OAuth providers (like Discord) to sign in without any extra checks.
      if (account?.provider !== "credentials") {
        return true;
      }

      // For a credentials sign-in, we must ensure the user's email is verified.
      // We look up the user in the database again to get the most up-to-date information.
      const existingUser = await db.user.findUnique({
        where: { id: user.id },
      });

      // If the user's email is not verified, return `false` to prevent the sign-in.
      if (!existingUser?.emailVerified) {
        return false;
      }

      // If all checks pass, return `true` to allow the sign-in to proceed.
      // This is the step that ensures the session is properly created for credentials users.
      return true;
    },

    // The `session` callback is triggered whenever a user's session is checked.
    // Its purpose is to customize the `session` object that is returned to the client.
    // It receives the default `session` and the `user` object from the database.
    session: ({ session, token }) => ({

      // We start by returning a new object, copying all the properties from the original session.
      ...session,

      // We then override the `user` property within the session.
      user: {

        // We copy all the original properties from the session's user object (like name, email, image).
        ...session.user,

        // And here, we add our custom property: the user's `id` from the database `user` object.
        // This is what makes the user's ID available on the client-side `useSession` hook,
        // thanks to the Module Augmentation we did at the top of the file.
        id: token.id as string,
      },

    // This closes the new session object being returned.
    }),

  // This curly brace closes the `callbacks` object.
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