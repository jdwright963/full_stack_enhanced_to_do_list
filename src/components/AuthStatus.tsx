// This file defines the `AuthStatus` component, a reusable piece of UI whose sole
// purpose is to display the current user's authentication state. As a component that
// needs to react to user-specific data (the session) and handle user actions (clicks),
// it must be a "Client Component", which is why it's marked with `"use client";`.
//
// It conditionally renders different UI based on the session status:
// - If the user is logged in, it displays a welcome message and a "Sign Out" button.
// - If the user is not logged in, it displays a "Sign In" button.

// This directive is essential. It marks this component as a "Client Component", meaning its
// JavaScript will be sent to and run in the user's browser. This is required because this
// component uses the `useSession` hook and handles user `onClick` events, which are
// interactive features that can only exist and run on the client side.
'use client';

// EDIT!!!
import Link from "next/link";

// This line imports three key client-side utilities from the `next-auth/react` library.
// These are the primary tools for interacting with the NextAuth.js system from the frontend.
//
// - `signIn`: A function you call to initiate the sign-in process. When called (e.g., from an
//   `onClick` handler), it will redirect the user to your configured sign-in page or, for OAuth
//   providers like Discord, to the provider's authorization screen.
//
// - `signOut`: A function you call to log the user out. When called, it will clear the user's
//   session cookie and redirect them back to the homepage.
//
// - `useSession`: This is a React "hook". Its job is to securely read the user's current
//   authentication state from the global `SessionProvider` (which we set up in `layout.tsx`).
//   It does not perform authentication itself; it simply reports the result. It returns an
//   object containing the session `data` (including the user's details if logged in) and a
//   `status` string ('loading', 'authenticated', or 'unauthenticated')
import { signIn, signOut, useSession } from "next-auth/react";

// This defines and exports a "Function Component" named `AuthStatus`.
// `export`: This keyword makes the component available to be imported and used in other files
// (for example, it could be placed in the main `layout.tsx` to appear on every page).
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
    // - `flex`: Enables a Flexbox layout.
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