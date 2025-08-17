// This file defines the `AuthStatus` component, a reusable piece of UI with the sole
// purpose to display the current user's authentication state.
//
// It conditionally renders different UI based on the session status:
// - If the user is logged in, it displays a welcome message and a "Sign Out" button.
// - If the user is not logged in, it displays a "Sign In" button.

// This directive is essential. It marks this component as a "Client Component", meaning its
// JavaScript will be sent to and run in the user's browser. This is required because this
// component uses the `useSession` hook and handles user `onClick` events, which are
// interactive features that can only exist and run on the client side.
'use client';

// This line imports three key client-side utilities from the `next-auth/react` library.
//
// - `signIn`: A powerful, multi-purpose function to initiate the sign-in process. Its
//   behavior depends on the arguments provided:
//   - `signIn()` (with no arguments): Redirects the user to your configured sign-in page (`/login`).
//     This is used for links or buttons that start the login flow.
//   - `signIn('credentials', { ...data })`: Sends the user's credentials (e.g., email/password)
//     to the backend to actually perform the authentication. This is used inside the login form.
//
// - `signOut`: A function you call to log the user out. When called, it will clear the user's
//   session cookie and reload the page to reflect the unauthenticated state.
//
// - `useSession`: A React hook that securely reads the user's current authentication state from
//   the global `SessionProvider`. It returns the session `data` and a `status` string.
import { signIn, signOut, useSession } from "next-auth/react";

// This defines and exports a "Function Component" named `AuthStatus`.
// `export`: This keyword makes the component available to be imported and used in other files
export function AuthStatus() {

  // This line calls the `useSession` hook to get the current authentication state.
  //
  // - `useSession()`: This hook communicates with the global `<SessionProvider>` to get the session data.
  // - `const { ... } = ...`: This is "object destructuring". The `useSession` hook returns an object
  //   that looks like `{ data: Session | null, status: "loading" | "authenticated" | "unauthenticated" }`.
  // - `data: session`: This is destructuring with renaming. It takes the `data` property from the
  //   returned object and creates a new local constant named `session`.
  //
  // The `session` constant will be the full session object if the user is logged in, or `null` if they are not.
  const { data: session } = useSession();

  // The `return` statement defines the JSX that this component will render.
  return (

    // This `div` serves as the main container for the component's UI.
    // The `className` uses Tailwind CSS utilities to style it:
    //  - `flex`: This sets `display: flex`, which enables the "Flexbox" layout model for the form's 
    // direct children. By default, Flexbox arranges items in a horizontal row. This unlocks 
    // a powerful set of alignment properties for the elements direct children.
    // - `justify-end`: A Flexbox property that aligns the content to the far right (end) of the container.
    // - `p-4`: Adds padding of `1rem` on all sides.
    // - `border-b`: Adds a 1px border to the bottom of the element.
    <div className="flex justify-end p-4 border-b">

      {/* This is a "ternary operator", the standard way to do conditional rendering in JSX. */}
      {/* It checks a condition and renders one of two different pieces of UI based on the result. */}
      {/*
        The Condition: `session?.user`
        - `session?`: This is "optional chaining". It safely checks if the `session` object exists.
          If `session` is `null` or `undefined`, the entire expression immediately evaluates to `undefined`
          (which is "falsy") without causing an error.
        - `.user`: If `session` does exist, it then accesses the `user` property.
        - The entire condition is "truthy" if the user is logged in, and "falsy" if they are not.
      */}
      {session?.user ? (

        // This `div` is Rendered if the user IS logged in. It is a container for the welcome message and sign-out button.
        // The `className` uses Tailwind CSS utilities to style it:
        // - `flex`: This enables a Flexbox layout, which places its direct children (the `<span>` and `<button>`)
        //   side-by-side in a row by default.
        // - `gap-2`: This creates a small, consistent space (`0.5rem`) between the flex items.
        // - `items-center`: This is a Flexbox property that vertically aligns the items in the center of the row,
        //   ensuring the text and the button are perfectly aligned with each other.
        <div className="flex gap-2 items-center">

          {/* This `<span>` displays the personalized welcome message. */}
          {/* A `<span>` is a generic "inline" container. Unlike a `<div>` or `<p>` which */}
          {/* are "block" elements that create a new line, a `<span>` flows naturally with the surrounding */}
          {/* text. It is the perfect choice here because we just need a simple, unstyled wrapper for the text */}
          {/* that will sit nicely next to the button inside our flex container. */}
          {/* The curly braces `{}` embed a JavaScript expression into the JSX. */}
          {/* We are accessing the `email` property from the `user` object within the `session` and rendering it as text. */}
          <span>Welcome, {session.user.email}</span>

          {/* This renders a clickable "Sign Out" button. */}
          {/* `onClick={() => signOut()}`: This is the event handler. */}
          {/* - `onClick`: Specifies the function to run when this button is clicked. */}
          {/* - `() => signOut()`: This is an "anonymous arrow function". When the button is clicked, this */}
          {/* arrow function is executed. Its only job is to then call the `signOut` function that was */}
          {/* imported from `next-auth/react`. This initiates the sign-out process. */}
          <button onClick={() => signOut()}>Sign Out</button>
        </div>

      // The `:` separates the "true" case from the "false" case in the ternary operator.
      ) : (

        // This is rendered if the user is not logged in.
        // This renders a single, clickable "Sign In" button.
        // `onClick={() => signIn()}`: This event handler works just like the sign-out button.
        // When clicked, the anonymous arrow function calls the `signIn` function imported from `next-auth/react`.
        // This will redirect the user to the login page.
        <button onClick={() => signIn()}>Sign In</button>
      )}
    </div>
  );
}