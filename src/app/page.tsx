// This file defines the React component for the application's homepage (`/`).
// By default in the Next.js App Router, this is a "Server Component", meaning it
// runs on the server to fetch initial data and generate the static HTML for the page.
// Its primary logic is to fetch some initial data, check the user's authentication
// status, and either redirect logged-in users to their dashboard or display the
// public-facing homepage content.

// Imports the `Link` component, which is Next.js's primary tool for client-side navigation.
// It enables fast page transitions without a full-page reload by pre-fetching the linked page's content.
import Link from "next/link";

// Imports the `redirect` function from the Next.js navigation library. This function is
// specifically designed to be used within Server Components. When called, it stops the
// rendering process and sends a redirect instruction to the browser. We will use this to
// send logged-in users away from the homepage to their tasks page.
import { redirect } from "next/navigation";

// Imports the server-side `auth` object from our NextAuth.js configuration (`~/server/auth/index.ts`).
// This object is wrapped in React's `cache` function, which is a performance optimization.
// Calling `await auth()` inside this Server Component securely gets the current user's session
// without making a separate client-side API call.
import { auth } from "~/server/auth";

// This defines and exports the main React component for the homepage.
// `export default`: Makes this component the primary export for this file, as required by Next.js.
// `async function Home()`: This is a key feature of Server Components. The `async` keyword allows us
// to use `await` for data fetching and other asynchronous operations directly within the component's body.
// The code inside this function will execute entirely on the server.
export default async function Home() {

  // This line securely fetches the current user's session data directly on the server.
  // `await`: Pauses the rendering of this component on the server until the session has been retrieved.
  // `auth()`: This is the server-side function we imported from `~/server/auth`. It inspects the
  // incoming request for a valid session cookie. If found, it returns the full session object;
  // otherwise, it returns `null`.
  const session = await auth();

    // This is a server-side "guard clause" that handles redirection for authenticated users.
  // `if (session?.user)`: This condition uses "optional chaining". It safely checks if `session`
  // exists, and if it does, it checks for the `user` property. This is a concise way to
  // check if the user is currently logged in.
  if (session?.user) {

    // If the user is logged in, we call the `redirect` function imported from `next/navigation`.
    // This immediately stops the rendering of the rest of this component's JSX and sends a
    // redirect instruction (HTTP 307) to the browser, sending the user to their `/tasks` page.
    // This prevents logged-in users from ever seeing the public homepage.
    redirect("/tasks");
  }

  // The `return` statement specifies the JSX that will be rendered as the page's HTML.
  return (

    // The `<main>` tag is a semantic HTML element for the primary content of the page.
    // The `className` uses Tailwind CSS utilities to style the main container.
    // - `flex flex-col`: Enables a flexbox layout and sets its direction to a column.
    // - `min-h-screen`: Ensures the container takes up at least the full height of the browser viewport.
    // - `items-center`: Horizontally centers the items in the column.
    // - `justify-center`: Vertically centers the items in the column.
    // - `bg-gradient-to-b from-gray-800 to-gray-900`: Creates a vertical background gradient.
    // - `text-white`: Sets the default text color to white.
    // - `px-4`: Adds horizontal padding.
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-gray-800 to-gray-900 text-white px-4">

      {// This renders the main heading for the homepage. As an `<h1>` tag, it is the most
      // important heading on the page for both users and search engine optimization (SEO).
      //
      // The `className` prop applies several Tailwind CSS utility classes to style the heading:
      // - `text-5xl`: Sets a very large base `font-size` of `3rem`.
      // - `font-extrabold`: Sets the `font-weight` to `800`, making the text very bold and impactful.
      // - `tracking-tight`: Reduces the `letter-spacing`, pulling the letters slightly closer together for a compact, modern look.
      // - `text-center`: Applies `text-align: center`, horizontally centering the text within its container.
      // - `sm:text-[4rem]`: This is a "responsive" utility. The `sm:` prefix is a breakpoint that targets
      //   "small" screens (640px wide) and up. This means on very small mobile devices, the font size will
      //   be `3rem`, but on tablets and desktops, it will be an even larger `4rem`.
      }
      <h1 className="text-5xl font-extrabold tracking-tight text-center sm:text-[4rem]">
              
          {/* The content inside the `<h1>` is composed of two parts to achieve the colored text effect:
          1. A plain text node: "Welcome to " (including the important trailing space).
          2. A `<span>` element that follows immediately.

          A `<span>` is a generic "inline" container. Unlike a `<div>` which creates a new block,
          a `<span>` does not create a line break. Its primary purpose is to act as a "hook"
          to apply styles or behavior to a specific piece of text within a larger block.
          
          By placing "FocusTasks" inside this styled span, we can apply a different color
          to it without affecting the "Welcome to " text. The `text-purple-400` class
          sets the text color for only this part of the heading, creating the branded highlight.
        */}
        Welcome to <span className="text-purple-400">FocusTasks</span>
      </h1>

      {// This renders the descriptive paragraph or "tagline" below the main heading.
      // The `className` prop applies several Tailwind CSS utilities to style this paragraph.
      // - `mt-6`: Sets a `margin-top` of `1.5rem` to create a deliberate space below the main heading.
      // - `text-xl`: Sets a large `font-size` (`1.25rem`) to make it easily readable, but smaller than the `<h1>`.
      // - `text-center`: Applies `text-align: center` to keep the text aligned with the centered heading.
      // - `text-white/80`: This is a Tailwind syntax for color opacity. It sets the text color to white
      //   but with 80% opacity. This makes the tagline visually less prominent than the main heading,
      //   creating a clear visual hierarchy.
      // - `max-w-xl`: Sets a `max-width` of `36rem`. This is a readability best practice that prevents the
      //   line length of the paragraph from becoming too long on wide desktop screens.
      }
      <p className="mt-6 text-xl text-center text-white/80 max-w-xl">
        A simple and private task manager to help you focus on what matters most.
      </p>

      {// This `div` acts as a container for the call-to-action buttons (the Links).
      // Grouping them in a `div` allows us to apply a layout model (Flexbox) to them as a single unit.
      //
      // The `className` styles this container:
      // - `mt-10`: Sets a large `margin-top` of `2.5rem` to create significant separation between
      //   the descriptive text and the action buttons.
      // - `flex`: Sets `display: flex`. This enables a Flexbox layout, which by default places
      //   its direct children (the two Links) side-by-side in a row.
      // - `gap-6`: A Flexbox/Grid property that sets a `gap` of `1.5rem` *between* the child elements.
      //   This is the modern, clean way to create space between items without using margins.
      }
      <div className="mt-10 flex gap-6">

        {// This renders a Next.js `Link` component that is styled to look like a primary button.
        // A Link component is Next.js's replacement for the standard `<a>` tag.
        // It provides a major performance benefit: "client-side navigation". When a user clicks this
        // link, Next.js intercepts the click, fetches the content for the new page in the background,
        // and swaps the UI without a full-page reload, making the site feel incredibly fast.
        }
        <Link

          // EDIT!!!
          // The `href` prop specifies the destination path. This will navigate to the `/login` page.
          href="/login?callbackUrl=/tasks"

          // The `className` styles the link to visually appear as a large, primary button.
          // - `rounded`: Applies a default `border-radius` for rounded corners.
          // - `bg-purple-600`: Sets the background color to the site's primary brand color (purple).
          // - `px-6 py-3`: Sets horizontal and vertical padding to control the button's size.
          // - `text-lg font-semibold`: Makes the text large and semi-bold.
          // - `hover:bg-purple-700`: A "state variant". It applies a slightly darker background color
          //   only when the user's mouse is hovering over the link, providing interactive feedback.
          // - `transition`: Adds a smooth transition effect to all property changes (like the background color on hover).
          className="rounded bg-purple-600 px-6 py-3 text-lg font-semibold hover:bg-purple-700 transition"
        >

          {/* This is the visible text content of the link/button. */}
          Sign In
        </Link>

        {/* This renders a second Next.js `Link` component, styled as a secondary button. */}
        <Link

          // The `href` prop specifies that this link will navigate to the `/register` page.
          href="/register"

          // The `className` is very similar to the primary button for consistency, with one key difference.
          // - `bg-gray-700`: The background color is a neutral gray. This is a common UI design pattern
          //   to make the "Sign In" button (the primary action) stand out more than the "Sign Up"
          //   button (the secondary action).
          // - `hover:bg-gray-600`: The hover state darkens the gray background.
          // - The other classes (`rounded`, `px-6`, etc.) are the same to maintain consistent size and style.
          className="rounded bg-gray-700 px-6 py-3 text-lg font-semibold hover:bg-gray-600 transition"
        >

          {/* This is the visible text content of the link/button. */}
          Sign Up
        </Link>
      </div>
    </main>
  );
}