// This file is a Server Component. Interactive components are rendered as Client Components.
import { redirect } from "next/navigation";
import { auth } from "~/server/auth";
import { CreateTask } from "~/components/CreateTask"; // Corrected import path
import { TaskList } from "~/components/TaskList";   // Corrected import path
import LogoutButton from "~/components/LogoutButton";
// ...existing code...

// This is now an async Server Component. It runs entirely on the server.
export default async function TasksPage() {
  // 1. Securely get the session on the server.
  const session = await auth();

  console.log("--- SESSION ON /tasks PAGE ---:", session);

  // 2. This is the server-side security guard.
  // If there is no session, we redirect to the login page immediately.
  // The user will never see any part of this page's HTML.
  if (!session?.user) {
    // We redirect them to the login page, and we pass a `callbackUrl`
    // so they are sent back here after they log in.
    redirect("/login?callbackUrl=/tasks");
  }

  // 3. If the user is authenticated, we render the page content.
  return (
    <main className="max-w-xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">
        Tasks for <span className="text-purple-400">{session.user.name ?? session.user.email}</span>
      </h1>
      {/* Render LogoutButton as a Client Component, just like CreateTask and TaskList */}
      <div className="mb-4 flex justify-end">
        <LogoutButton />
      </div>
      <CreateTask />
      <TaskList />
      {/* ...existing tasks UI... */}
    </main>
  );
}

// // This is a Next.js App Router directive. It declares this file as a "Client Component".
// // This is essential because Client Components are the ones that can run in the user's browser,
// // allowing us to use interactive features like React Hooks (`useState`, `useEffect`) and event handlers (`onClick`).
// 'use client';

// // Imports the primary hook from NextAuth.js for handling client-side authentication.
// // This `useSession` hook will give us the user's session data, including their name, email, and
// // the overall authentication status (e.g., 'loading', 'authenticated', or 'unauthenticated').
// import { useSession } from "next-auth/react";

// // Imports a function from the Next.js navigation library.
// // This `redirect` function allows us to programmatically send the user to a different page.
// // We'll use this to protect the page by redirecting unauthenticated users back to the homepage.
// import { redirect } from "next/navigation";

// // Imports our initialized, type-safe tRPC client. This `api` object is the "magic" of the T3 stack.
// // It's our gateway to the backend, allowing us to call our API procedures (like `task.getAll` or `task.create`)
// // as if they were local functions, with full autocompletion and type-safety.
// import { api } from "../../utils/api";

// // Imports the fundamental React hook for adding and managing state within a component.
// // "State" is any data that can change over time and cause the component to re-render.
// // We will use `useState` to keep track of what the user is typing into the "new task" input field.
// import { useState } from "react";

// // Defines the main React component for this page. The `export default` makes it the
// // primary export of this file, allowing Next.js to recognize it as the component
// // to render for the associated route (e.g., /tasks).
// export default function TasksPage() {


//   // This is the core authentication check. We call the `useSession` hook to get the user's session info.
//   // We use object destructuring to pull two key values from the hook's return object:
//   // `data` is renamed to `session` for better readability. It's the user session object if logged in, otherwise null.
//   // `status` is a string that tells us the current auth state: 'loading', 'authenticated', or 'unauthenticated'.
//   const { data: session, status } = useSession();

//   // This is a "guard clause" to handle the initial loading state. While NextAuth checks the
//   // session with the server, `status` will be 'loading'.
//   // By returning JSX here, we stop the rest of the component from running and show the user a
//   // helpful loading message, preventing any flash of content.
//   if (status === "loading") {
//     // The component's execution stops here until the authentication check is complete.
//     return <p>Loading...</p>;
//   }

//   // This is the second, and most important, guard clause. It runs *after* the loading is finished.
//   // If the `session` object is null, it means the user is confirmed to be unauthenticated.
//   if (!session) {

//     // We immediately stop rendering this component and call the `redirect` function.
//     // This securely navigates the user back to the homepage, protecting the page's content.
//     return redirect("/");
//   }

//   // If the user is authenticated, the rest of the component logic runs.
//   // This hook is a powerful tRPC utility that gives us direct access to the underlying React Query cache.
//   // Its primary purpose is to let us manually control the cached data, for instance, by "invalidating" it
//   // to trigger a re-fetch, which is crucial for keeping our UI up-to-date after a mutation.
//   const utils = api.useContext();

//   // This is a tRPC "query" hook. It calls the `getAll` procedure on our `task` router on the server.
//   // It automatically handles fetching, caching, loading, and error states for us.
//   // We destructure its return value:
//   // - `data: tasks = []`: We take the `data` property (which will be the array of tasks) and rename it to `tasks`
//   //   for clarity. We also provide a default value of an empty array `[]`. This is a critical safety measure
//   //   that prevents our app from crashing if we try to `.map()` over `tasks` while it's still loading (and is `undefined`).
//   // - `isLoading`: A boolean that is `true` only during the initial fetch for this data.
//   const { data: tasks = [], isLoading } = api.task.getAll.useQuery();

//   // This is a tRPC "mutation" hook. It prepares a function to call the `create` procedure on our `task` router.
//   // Unlike a query, it doesn't run immediately. It gives us a function (`createTask.mutate`) to call when we're ready.
//   const createTask = api.task.create.useMutation({

//     // This is an options object. The `onSuccess` callback runs automatically after the mutation is successful.
//     // Here, we call `utils.task.getAll.invalidate()` to tell tRPC that the cached data for `getAll` is now stale.
//     // This automatically triggers a re-fetch of the tasks, so our new task appears on the screen without a manual refresh.
//     onSuccess: () => utils.task.getAll.invalidate(),
//   });

//   // This hook prepares a function to call the `toggle` procedure to mark a task as complete/incomplete.
//   const toggleTask = api.task.toggle.useMutation({

//     // It uses the exact same `onSuccess` pattern: after toggling a task, invalidate the list to re-fetch
//     // and show the updated state (e.g., the line-through text).
//     onSuccess: () => utils.task.getAll.invalidate(),
//   });

//   // This hook prepares a function to call the `delete` procedure to remove a task.
//   const deleteTask = api.task.delete.useMutation({

//     // Once again, after a successful deletion, we invalidate the query cache to trigger a re-fetch of the
//     // task list, causing the deleted task to disappear from the UI automatically.
//     onSuccess: () => utils.task.getAll.invalidate(),
//   });

//   // This is the standard React `useState` hook. It creates a piece of state to manage the user's input.
//   // `title` holds the current string value of the input field.
//   // `setTitle` is the function we'll use to update that value.
//   // We initialize it with an empty string `""`.
//   const [title, setTitle] = useState("");

//   //The original JSX is rendered only for authenticated users
//   // The `return` statement begins the JSX block that defines the component's UI.
//   return (

//     // The `<main>` tag semantically represents the primary content of the page.
//     // The `className` uses Tailwind CSS for styling. Let's break down each class:
//     // `max-w-xl`: Sets the `max-width` property to `36rem`. This prevents the container from becoming too wide on large screens.
//     // `mx-auto`: Sets the left and right `margin` to `auto`. This is a classic CSS trick to horizontally center a block-level element.
//     // `p-4`: Sets `padding` on all sides to `1rem`. This adds some breathing room inside the container.
//     <main className="max-w-xl mx-auto p-4">

//       {// This renders the main heading for the page.
//       // The `className` uses Tailwind to style the text:
//       // `text-2xl`: Sets the `font-size` to `1.5rem`, making the text large.
//       // `font-bold`: Sets the `font-weight` to `700`, making the text bold.
//       // `mb-4`: Sets the `margin-bottom` to `1rem`, adding space below the heading.
//       }
//       <h1 className="text-2xl font-bold mb-4">Tasks</h1>

//       {// This is the HTML form element used to capture user input for creating a new task.
//       }
//       <form

//         // This `onSubmit` prop defines a function to run when the form is submitted.
//         onSubmit={(e) => {

//           // Stops the browser's default action of reloading the entire page.
//           e.preventDefault();

//           // A simple validation check to ensure the user has typed something before submitting.
//           if (title) {

//             // If `title` is not empty, we call the `mutate` function provided by our `createTask` tRPC hook.
//             createTask.mutate({ title });
//           }

//           // After submitting, we reset the input field by calling `setTitle` with an empty string.
//           setTitle("");
//         }}

//         // The `className` uses Tailwind to style the form's layout:
//         // `flex`: Sets `display: flex`, enabling a flexbox layout for its children (the input and button).
//         // `gap-2`: Sets the `gap` property to `0.5rem`, creating space between the flex items.
//         // `mb-4`: Sets `margin-bottom` to `1rem`, adding space below the entire form.
//         className="flex gap-2 mb-4"
//       >

//         {// The text input where the user types the new task title. This is a "controlled component".
// }
//         <input

//           // The `value` of the input is directly bound to the `title` variable from our `useState` hook.
//           value={title}

//           // The `onChange` event fires on every keystroke, updating the `title` state.
//           onChange={(e) => setTitle(e.target.value)}

//           // The `placeholder` text is shown in the input field when it is empty.
//           placeholder="Add a task..."

//           // The `className` uses Tailwind to style the input field itself:
//           // `flex-1`: Sets `flex: 1 1 0%`. This is a flexbox utility that makes the input grow to fill all available space.
//           // `border`: Adds a solid, 1px gray border around the input.
//           // `px-2`: Sets `padding-left` and `padding-right` to `0.5rem`, giving the text inside some horizontal space.
//           // `py-1`: Sets `padding-top` and `padding-bottom` to `0.25rem` for vertical space.
//           // `rounded`: Sets the `border-radius` to `0.25rem`, making the corners slightly rounded.
//           className="flex-1 border px-2 py-1 rounded"
//         />

//         {// The form's submit button. Clicking this triggers the `onSubmit` event handler on the `<form>`.
//           // The `className` uses Tailwind to style the button:
//           // `bg-blue-600`: Sets the `background-color` to a specific shade of blue from Tailwind's color palette.
//           // `text-white`: Sets the `color` of the text to white.
//           // `px-3`: Sets horizontal `padding` to `0.75rem`.
//           // `py-1`: Sets vertical `padding` to `0.25rem`.
//           // `rounded`: Sets `border-radius` to `0.25rem` to match the input field.
// }
//         <button type="submit" className="bg-blue-600 text-white px-3 py-1 rounded">

//           {/* Text inside the button */}
//           Add
//         </button>
//       </form>

//       {/* // This is a ternary operator, the standard way to do conditional rendering in JSX.
//       // It checks the `isLoading` boolean from our `useQuery` hook. */}
//       {isLoading ? (

//         // If `isLoading` is true, the user sees this simple loading message.
//         <p>Loading tasks...</p>

//       // This colon separates the "true" case from the "false" case in the ternary operator.
//       ) : (

//         // If `isLoading` is false (the data has arrived), this block is rendered.
//         // The `<ul>` tag creates an unordered list to hold our tasks.
//         // The `className` uses a Tailwind utility to manage the layout of its children:
//         // `space-y-2`: This applies a vertical margin (`margin-top: 0.5rem`) between all direct children, creating consistent spacing.
//         <ul className="space-y-2">

//           {/* We open a JavaScript expression to iterate over the `tasks` array using the `.map()` method. 
//           For each `task` object in the array, this will return an `<li>` element. */}
//           {tasks.map((task) => (

//             // The `<li>` represents a single list item (a single task).
//             // `key={task.id}`: This is a critical prop for React. It must be a unique, stable string or number.
//             // React uses this key to efficiently track, update, and reorder items in a list without re-rendering everything.
//             // The `className` uses Tailwind to style the list item:
//             // `flex`: Enables a flexbox layout.
//             // `justify-between`: Pushes the flex children (the task title and the delete button) to opposite ends of the container.
//             // `items-center`: Vertically aligns the children in the center of the container.
//             // `border`: Adds a 1px solid gray border.
//             // `p-2`: Sets `padding` on all sides to `0.5rem`.
//             // `rounded`: Sets `border-radius` to `0.25rem` for slightly rounded corners.
//             <li key={task.id} className="flex justify-between items-center border p-2 rounded">

//               {/* The `<span>` tag is a generic inline container for the task's title. */}
//               <span

//                 // This attaches a click event handler. When the span is clicked, it executes the provided arrow function.
//                 // The function calls `toggleTask.mutate`, passing the unique ID of the current task in the loop.
//                 // This triggers the API call to toggle the task's completion status.
//                 onClick={() => toggleTask.mutate({ id: task.id })}

//                 // This `className` is dynamic, built using a JavaScript template literal (backticks).
//                 // It allows us to combine static classes with conditionally applied classes.
//                 // `cursor-pointer`: This class is always applied, changing the mouse cursor to a pointer on hover to indicate it's clickable.
//                 // `${ ... }`: This embeds a JavaScript expression inside the string.
//                 // `task.completed ? "line-through text-gray-500" : ""`: This is another ternary operator.
//                 // If `task.completed` is true, it adds the classes "line-through" (to strike through the text) and "text-gray-500" (to make it gray).
//                 // If `task.completed` is false, it adds an empty string, so no extra classes are applied.
//                 className={`cursor-pointer ${task.completed ? "line-through text-gray-500" : ""}`}
//               >

//                 {/* We render the `title` property of the current `task` object inside the span. */}
//                 {/* This is the actual task text the user sees on the screen. */}
//                 {task.title}

//               </span>

//               {/* This renders a `<button>` element.*/}
//               <button

//                 // This attaches a click event handler to the delete button.
//                 // Just like the toggle handler, this arrow function creates a closure. It 'remembers'
//                 // the unique `id` of the `task` from this specific iteration of the loop.
//                 // When clicked, it calls the `mutate` function from our `deleteTask` tRPC hook,
//                 // passing the specific task's ID to the backend to be deleted.
//                 onClick={() => deleteTask.mutate({ id: task.id })}

//                 // The `className` uses Tailwind to style the button for a clear user experience.
//                 // `text-red-500`: Sets the `color` of the text to a specific shade of red, indicating a destructive action.
//                 // `hover:underline`: This is a state variant. It applies the `text-decoration: underline` style only when
//                 // the user's mouse is hovering over the button, providing visual feedback.
//                 className="text-red-500 hover:underline"
//               >

//                 {/* The `<button>`'s inner text is set to "Delete". */}
//                 Delete
//               </button>
//             </li>
//           ))}
//         </ul>
//       )}
//     </main>
//   );
// }

