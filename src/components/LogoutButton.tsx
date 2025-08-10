// This file defines the `LogoutButton` React component.
// Its sole responsibility is to provide a user interface element (a button) that,
// when clicked, triggers the NextAuth.js client-side `signOut` function. This function
// handles the entire process of logging the user out, including clearing the session
// cookie and redirecting the user.
//
// This component is designed to be a reusable, self-contained piece of UI that can be
// easily dropped into any part of the application where a logout action is needed,
// such as in a user profile dropdown or a main navigation bar.

// This directive is essential. It marks this file and all components within it as "Client Components".
// This means their JavaScript will be sent to and executed in the user's browser. This is a requirement
// because this component needs to handle a client-side user interaction (an `onClick` event) and call
// a client-side function (`signOut`).
"use client"

// This line imports the `signOut` function from the `next-auth/react` library.
// This is the primary client-side function for logging a user out. When called, it communicates
// with the NextAuth.js backend to invalidate the user's session, clear the session cookie from
// the browser, and then, by default, reload the page to reflect the unauthenticated state.
import { signOut } from "next-auth/react";

// DELETE????
// This line imports the main `React` object from the 'react' library.
// While modern versions of React with the new JSX transform don't always require this import
// to be visible for JSX to work, it's still a good practice for clarity and is sometimes
// needed for accessing other React-specific features.
import React from "react";

// This line defines and exports a new React "Function Component" named `LogoutButton`.
// `export default`: This makes the component the primary export of this file, allowing it to be
// easily imported into other components.
// 
// `function LogoutButton()`: This is a standard JavaScript function declaration. In React, components
// are just functions that are responsible for returning some JSX to be rendered on the screen.
export default function LogoutButton() {

  // The `return` statement specifies the UI that this component will render.
  // The code inside the parentheses is JSX, a syntax extension for JavaScript that
  // allows you to write HTML-like code to describe the component's structure.
  return (

    // This renders a standard HTML `<button>` element. Using a semantic `<button>` is
    // important for accessibility, as screen readers will correctly announce it as an
    // interactive "button" to users with visual impairments.
    <button

      // `onClick`: This is the React event handler for a mouse click. We are providing it with a
      // function that will be executed *only when* the user clicks on this button.
      //
      // `() => signOut()`: We use an inline arrow function as the event handler. This is a crucial
      // pattern in React. It creates a new function that, when executed, calls the `signOut` function
      // that we imported from `next-auth/react`.
      //
      // The `() => ...` wrapper ensures that `signOut()` is only called at the moment the click happens,
      // not when the component first renders.
      onClick={() => signOut()}

      // `className`: This prop applies a string of Tailwind CSS utility classes to style the button.
      // Using Tailwind here instead of inline styles ensures a consistent design system, leverages
      // theme values, and easily handles interactive states like hover.
      //
      // Layout & Sizing:
      // - `rounded`: Applies a default `border-radius` to give the button slightly rounded corners.
      // - `px-4`: Sets horizontal padding (`padding-left` and `padding-right`) to `1rem`.
      // - `py-2`: Sets vertical padding (`padding-top` and `padding-bottom`) to `0.5rem`.
      //
      // Color & Typography:
      // - `border-none`: Explicitly removes any default browser border from the button.
      // - `bg-red-600`: Sets the background color to a specific shade of red from the Tailwind
      //   color palette. Red is a common UI convention for a "log out" action.
      // - `font-bold`: Sets the `font-weight` to bold to make the text more prominent.
      // - `text-white`: Sets the text color to white for high contrast against the red background.
      //
      // Interactivity (State Variants):
      // - `hover:bg-red-700`: This is a "state variant". It applies a slightly darker shade of red
      //   to the background ONLY when the user's mouse is hovering over the button. This provides
      //   clear, visual feedback that the element is interactive.
      className="rounded border-none bg-red-600 px-4 py-2 font-bold text-white hover:bg-red-700"
    >

      {/* The text displayed in the button. */}
      Log Out
    </button>
  );
}
