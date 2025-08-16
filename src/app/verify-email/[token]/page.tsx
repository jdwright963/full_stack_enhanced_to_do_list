// This file defines a Next.js App Router page that uses a "Dynamic Route Segment".
// Since this is a "Server Component" by default, the entire logic inside this file runs
// exclusively ON THE SERVER when a user visits a matching URL.
//
// In file-based routing, a regular route is a fixed path, like `/about`. A dynamic route,
// however, is a flexible path that can match many different URLs. The special folder name `[token]`
// is a dynamic segment. It acts as a wildcard, telling Next.js that this page should handle any URL
// that follows the pattern `/verify-email/some-value-here`. The `some-value-here` part can be
// anything, and it will be captured as a parameter named "token"

// Imports our globally initialized Prisma Client instance from the server directory (`~/server/db`).
// This direct database access is only possible because this is a Server Component.
import { db } from "~/server/db";

// Imports the `redirect` function from the Next.js navigation library. This version of `redirect` is
// specifically designed for use in Server Components. When called, it stops the current server-side
// rendering process and immediately sends an HTTP redirect response to the user's browser.
import { redirect } from "next/navigation";

// This is a TypeScript "interface", which defines a "contract" or "shape" for an object.
// We are creating an interface named `VerifyEmailPageProps` to describe the `props` object that
// Next.js will automatically pass to our component because it's handling a dynamic route.
interface VerifyEmailPageProps {

  // `params`: This is a special prop that Next.js automatically provides to any page component
  // that is rendered by a dynamic route. Its value is a plain object where the keys correspond
  // to the dynamic segments in the URL.
  params: 

    // `Promise<{ token: string }>`: This type definition states that the `params` prop is a
    // Promise that, when awaited, will "resolve" to an object with a `token` property.
    //
    // - `{ token: string }`: This is the shape of the resolved object.
    // - `token`: The name of this property is crucial. It MUST EXACTLY MATCH the name
    //   used in the dynamic route segment's folder name: `[token]`.
    // - `: string`: This guarantees that the `token` value from the URL will be a string.
    Promise<{ token: string }>;
}

// This defines and exports the main Server Component for this page.
// `export default`: Makes this the primary export, required by Next.js for page components.
// `async function VerifyEmailPage(...)`: The `async` keyword is critical. It allows us to use `await`
// for asynchronous operations like database queries directly inside the component body.
//
// The parameter block `({ params }: VerifyEmailPageProps)` does two things:
// 1. `({ params })`: This is JavaScript object destructuring. The component receives a single `props`
//    object from Next.js, and this syntax immediately extracts the `params` property from it.
// 2. `: VerifyEmailPageProps`: This is a TypeScript type annotation. It tells the compiler that the
//    `props` object must conform to the `VerifyEmailPageProps` interface we defined earlier,
//    ensuring that `params` and `params.token` exist and are correctly typed.
export default async function VerifyEmailPage({ params }: VerifyEmailPageProps) {

// This two-step process is required to access the `token` because the `params` prop is a Promise.
// We cannot access its properties until it has been resolved.
//
// 1. `const paramsValue = await params;`:
//    - The `await` keyword pauses the function's execution until the `params` Promise is fulfilled.
//    - Once resolved, the "unwrapped" value—a plain object like `{ token: "some-value-from-url" }`—is
//      assigned to the `paramsValue` constant.
//
// 2. `const { token } = paramsValue;`:
//    - Now that we have the plain `paramsValue` object, we can safely use object destructuring.
//    - This syntax extracts the `token` property from the object and creates a new constant
//      named `token` containing its value.
  const paramsValue = await params;
  const { token } = paramsValue;

  // This is a "guard clause" that performs a basic check.
  // `if (!token)`: This condition is true if the `token` extracted from the URL is missing for any reason
  // (e.g., an empty string, null, or undefined).
  if (!token) {

    // If the token is missing, we stop execution and return a simple paragraph of JSX.
    // Next.js will render this HTML and send it to the browser as a simple error page.
    return <p>Invalid verification link.</p>;
  }

  // This line performs the database lookup to find a user associated with the provided token.
  // `await`: Pauses the function's execution until the database query completes.
  // `db.user.findFirst()`: This Prisma method searches the `User` table for the first record
  // that matches the specified `where` criteria. It returns the user object or `null`.
  const user = await db.user.findFirst({ 
    
    // The `where` clause specifies the filtering conditions.
    // It tells Prisma to find a user where the `verificationToken` column's value
    // is exactly equal to the `token` we extracted from the URL.
    where: { verificationToken: token } });

  // This is the second and most important guard clause. It handles an invalid or expired token.
  // `if (!user)`: This condition checks if the `user` variable is `null`, which is what Prisma
  // returns when no matching record is found in the database.
  if (!user) {

    // If no user was found, we stop and return a different error message.
    // This provides more specific feedback to the user than the generic "invalid link" message.
    return <p>Invalid or expired verification token.</p>;
  }

  // This line updates the user's record in the database to mark their email as verified.
  // This is an asynchronous "write" operation.
  // `await`: Pauses the function's execution until the database update is successfully completed.
  // `db.user.update()`: This is the Prisma Client method for modifying an existing record in the `User` table.
  // It takes a single object argument with `where` and `data` properties.
  await db.user.update({

    // The `where` clause is an object that specifies exactly which user record to update.
    // To update a record, you must provide a value for a unique field like `id`.
    // `{ id: user.id }`: This tells Prisma to find the user whose `id` column matches the `id`
    // of the `user` object we just fetched from the database.
    where: { id: user.id },

    // The `data` clause is an object that specifies which fields to change and what their new values should be.
    // Any fields not mentioned here will be left unchanged.
    data: {

      // `emailVerified: new Date()`: We set the `emailVerified` field in the database to the
      // current date and time. Storing a timestamp is a common and robust pattern to know
      // not just if a user verified, but also when. 
      emailVerified: new Date(),

      // `verificationToken: null`: This is a crucial security step. We set the `verificationToken`
      // field back to `null` in the database. This effectively "burns" the token, ensuring it can
      // only be used once. If we didn't do this, the same verification link could be used repeatedly.
      verificationToken: null,
    },
  });

  // This is the final step for a successful verification. Instead of returning JSX to render,
  // we call the `redirect` function that we imported from `next/navigation`.
  // `redirect()`: This function, when called in a Server Component, immediately stops the rendering
  // process and sends an HTTP redirect response to the user's browser.
  // `"/login?verified=true"`: This is the destination URL.
  //   - `/login`: We send the user to the login page.
  //   - `?verified=true`: We are adding a "query parameter" to the URL. This is a clever way to
  //     pass a small piece of information to the next page. The login page can read this
  //     parameter and optionally display a "Success! Your email has been verified. Please log in." message.
  return redirect("/login?verified=true");
}
