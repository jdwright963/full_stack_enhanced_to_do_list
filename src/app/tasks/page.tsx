// This file defines the main page for authenticated users, located at the `/tasks` route.
// This is a "Server Component" by default, allowing it to perform secure, server-side
// data fetching and authentication checks before any UI is sent to the browser.

// Imports the `redirect` function from the Next.js navigation library. This is the server-side
// version of the function. When called within a Server Component, it immediately stops the
// rendering process and sends an HTTP redirect response to the browser. We use it here to
// enforce our protected route by sending unauthenticated users to the login page.
import { redirect } from "next/navigation";

// Imports the `auth` function from our central server-side authentication setup.
// This is the primary and most secure way to access the current user's session data on the
// server. We will call this function to check if a user is logged in before rendering the page.
import { auth } from "~/server/auth";

// Imports the `CreateTask` component from our components library. This is a "Client Component"
// responsible for rendering the form that allows users to add a new task. By importing it here,
// we are composing our server-rendered page with an interactive, client-side piece of UI.
import { CreateTask } from "~/components/CreateTask";

// This is another interactive Client Component. Its job is to handle the "read" part
// of the CRUD functionality: it will fetch all the user's tasks using a tRPC query
// and render them as a list.
import { TaskList } from "~/components/TaskList";   

// This line defines and exports the main React component for this page.
// `export default`: The standard syntax that allows the Next.js App Router to find and
// render this component for the `/tasks` route.
// `async function TasksPage()`: The `async` keyword is critical. It declares this as an
// async Server Component, which is what enables us to perform server-side data fetching
// (like `await auth()`) directly within the function body before any UI is rendered.
export default async function TasksPage() {
  
  // Because this is an async Server Component, we can call and `await` our server-side `auth()`
  // function directly. This line securely retrieves the current user's session from the request's
  // cookie. The `await` keyword pauses the rendering of this component on the server until the
  // session data is available. The resulting `session` object (or `null` if the user is not
  // logged in) is stored in this constant and will be used for the authentication check below.
  const session = await auth();

  // This is a guard clause, a fundamental pattern for creating protected routes. Its job is to
  // check for authentication before rendering any of the page's main content.
  //
  // `!session?.user`: This condition uses optional chaining (`?.`) to safely check if a valid user
  // object exists within the session. The `!` inverts the result. The condition is `true` if the
  // user is NOT logged in (either `session` is null, or `session.user` is null).
  if (!session?.user) {
    
    // If the user is not authenticated, we immediately call the server-side `redirect` function.
    // This stops the rendering of this page and sends an HTTP redirect response to the browser.
    //
    // `"/login?callbackUrl=/tasks"`: This is the destination URL.
    // - `/login`: We send the unauthenticated user to the login page.
    // - `?callbackUrl=/tasks`: This is a crucial query parameter. We are telling the login page,
    //   "After this user successfully logs in, please send them right back here to the `/tasks` page."
    //   This ensures a smooth user experience.
    redirect("/login?callbackUrl=/tasks");
  }

  // If the `if` check above did not run, it means the user IS authenticated, and we can proceed
  // to render the main UI for the page. This `return` statement will only ever be reached by a logged-in user.
  return (

    // This renders the `<main>` HTML element, a semantic tag for the primary content of the page.
    // The `className` uses Tailwind CSS utilities to style the layout.
    // - `max-w-xl`: Sets a `max-width` on the container. This improves readability on wide screens by
    //   preventing the text lines from becoming too long.
    // - `mx-auto`: A standard trick for centering a block-level element. When a `max-width` is set,
    //   `mx-auto` applies automatic margins to the left and right, pushing the container into the center.
    // - `p-4`: Applies a consistent padding of `1rem` on all sides of the main content area.
    <main className="max-w-xl mx-auto p-4">

      {// This renders the main heading for the page. The `className` prop applies a string of
      // Tailwind CSS utility classes to style the text.
      //
      // - `text-2xl`: Sets the font size. Corresponds to the CSS `font-size: 1.5rem;` (24px)
      //   and an appropriate `line-height: 2rem;` (32px).
      //
      // - `font-bold`: Sets the font weight. Corresponds to the CSS `font-weight: 700;`.
      //
      // - `mb-4`: Adds a margin to the bottom of the element. Corresponds to the CSS
      //   `margin-bottom: 1rem;` (16px), creating space between the heading and the content below.
      }
      <h1 className="text-2xl font-bold mb-4">

        {/* This static text is the first part of the heading. The trailing space is important for visual separation. */}
        {/* This `<span>` is an inline element used to apply a different style to the user's email. */}
        {/* - `text-purple-400`: Sets the text color to a specific shade of purple from the Tailwind theme, */}
        {/*   creating a branded highlight for the dynamic user data. */}
        {/* `{session.user.email}`: This embeds the user's email directly into the heading. It is safe to access `session.user` */}
        {/* here because the guard clause `if (!session?.user)` earlier in the component guarantees it exists. */}
        Tasks for <span className="text-purple-400">{session.user.email}</span>
      </h1>

      {/* This renders our imported `CreateTask` component. This Client Component contains the */}
      {/* input field and "Add" button for creating new tasks. */}
      <CreateTask />

      {/* This renders our imported `TaskList` component. This Client Component is responsible for */}
      {/* fetching and displaying the list of all the user's current tasks. */}
      <TaskList />
    </main>
  );
}