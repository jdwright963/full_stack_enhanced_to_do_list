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

  // Only render if the user is signed in
  if (!session?.user) return null;

  // The `return` statement defines the JSX that this component will render.
  return (

    // This `div` serves as the main container for the component's UI.
    // The `className` uses Tailwind CSS utilities to style it:
    //  - `flex`: This sets `display: flex`, which enables the "Flexbox" layout model for the form's 
    // direct children. By default, Flexbox arranges items in a horizontal row. This unlocks 
    // a powerful set of alignment properties for the elements direct children.
    //  - `justify-between`: places space between children so the brand sits left and the controls sit right.
    //  - `items-center`: vertically centers the row's children.
    // - `p-4`: Adds padding of `1rem` on all sides.
    // - `border-b`: Adds a 1px border to the bottom of the element.
    <div className="flex justify-between items-center p-4 border-b">

          {/* 
          Brand / primary site title
          Tailwind classes:
          - text-3xl       : default size (~1.875rem)
          - sm:text-4xl    : ≥640px (~2.25rem)
          - md:text-5xl    : ≥768px (~3rem)
          - lg:text-6xl    : ≥1024px (~3.75rem)
          - font-extrabold : very heavy font weight for prominence
          - text-blue-600  : applies the brand/primary blue color
        */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-blue-600">MyList.dev</h1>

        {/*
        // This `div` is Rendered if the user IS logged in. It is a container for the welcome message and sign-out button.
        // The `className` uses Tailwind CSS utilities to style it:
        // - `flex`: This enables a Flexbox layout, which places its direct children (the `<span>` and `<button>`)
        //   side-by-side in a row by default.
        // - `gap-2`: This creates a small, consistent space (`0.5rem`) between the flex items.
        // - `items-center`: This is a Flexbox property that vertically aligns the items in the center of the row,
        //   ensuring the text and the button are perfectly aligned with each other.
        */}
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
          {/* `onClick={() => signOut()}`: This is the event handler. When the button is clicked, this */}
          {/* anonymous arrow function is executed, which then calls the `signOut` function */}
          {/* imported from `next-auth/react` to initiate the sign-out process. */}
          
          {/* - `bg-red-600`: Sets the background color to a shade of red, a common UI convention for a "log out" or destructive action. */}
          {/* - `text-white`: Sets the text color to white for high contrast. */}
          {/* - `px-1 py-1`: Sets horizontal (`x`) and vertical (`y`) padding to control the button's size. */}
          {/* - `rounded`: Applies a default border-radius for slightly rounded corners. */}
          {/* - `hover:bg-red-700`: A "state variant" that applies a slightly darker red background only when the user's mouse is hovering over the button, providing interactive feedback. */}
          {/* - `transition`: Adds a smooth transition effect to all property changes (like the background color on hover). */}
          <button onClick={() => signOut()} className="bg-red-600 text-white px-1 py-1 rounded hover:bg-red-700 transition">
            Sign Out
          </button>
        </div>
    </div>
  );
}