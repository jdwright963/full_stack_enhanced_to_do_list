// This file defines the `CreateTask` React component. Its sole responsibility is to 
// render an input field and a button that allow a user to create a new task.

// This directive is essential. It marks this file and all components within it as Client Components.
// This means their JavaScript will be sent to and executed in the user's browser. This is a requirement
// because this component needs to use client-side hooks (like `useState` and tRPC's `useMutation`) and
// handle user interactions (like form input and submission).
'use client';

// Imports the `useState` hook from the React library. This is a fundamental hook that allows
// function components to have "state" — variables whose changes will cause the component to
// re-render and update the UI. We will use it here to store the text the user is typing
// into the new task input field.
import { useState } from "react";

// This is the most important import for interacting with our backend.
// It imports the main `api` object from our central tRPC client-side setup file (`~/trpc/react.ts`).
// This `api` object is the "entry point" that contains all the fully type-safe React Query hooks
// that correspond to our backend's API procedures, like `api.task.create`.
import { api } from "~/trpc/react";

// This line defines and exports a new React "Function Component" named `CreateTask`.
// `export`: This makes the component available to be imported and used in other files (like a page).
// `function CreateTask()`: This is a standard JavaScript function declaration. In React, components are
// just functions that are responsible for returning some JSX (the UI structure) to be rendered on the screen.
export function CreateTask() {

  // This line initializes a state variable to manage the text content of the task input field.
  //
  // 1. `useState("")`: We call the `useState` hook with an initial value of an empty string `""`.
  //
  // 2. `const [title, setTitle] = ...`: We use "Array Destructuring" to unpack the array returned by `useState`.
  //    - `title`: This constant will hold the current value of the input field. We will use this to
  //      render the input's `value` and to get the text to send to the backend on submission.
  //    - `setTitle`: This is the "setter" function. We will call this function (e.g., `setTitle("new text")`)
  //      in our `onChange` handler to update the state and trigger a re-render.
  const [title, setTitle] = useState("");

  // This line calls the `api.useContext()` hook to get access to the tRPC utility client.
  // This hook returns a special `utils` object that acts as a programmatic API for directly
  // interacting with the client-side React Query cache. Its most important function is
  // `.invalidate()`, which we will use to trigger a data re-fetch after our mutation succeeds.
  const utils = api.useContext();

  // This line sets up the "mutation" for creating a new task.
  // A "mutation" is any operation that changes data on the server.
  //
  // `api.task.create.useMutation()`: This tRPC hook does NOT execute the API call immediately.
  // Instead, it returns a `createTask` object that contains everything needed to manage the
  // mutation's lifecycle, including a `.mutate()` function to trigger it and status flags
  // like `.isPending`.
  //
  // The hook takes a configuration object as its argument, allowing us to define "callbacks"
  // that run at different points in the mutation's lifecycle.
  const createTask = api.task.create.useMutation({
    
    // `onSuccess`: This is a callback function that React Query will automatically execute
    // ONLY IF the `create` mutation was successful on the server. This is the perfect place
    // to perform "cleanup" and "UI-syncing" actions after a successful data change.
    //
    // `() => { ... }`: We provide an arrow function that contains the sequence of actions to
    // perform on success.
    onSuccess: () => {

      // This is the first action to run on a successful mutation. We call the `setTitle`
      // state setter function and pass it an empty string. This clears the text from the
      // input field, providing immediate feedback to the user and preparing the form
      // for them to add another task.
      setTitle(""); 

      // This is the second, and most crucial, action. We use the `utils` object (from `api.useContext()`)
      // to invalidate the `task.getAll` query. This command tells React Query that the data
      // it has for the main task list is now stale. React Query then automatically re-fetches
      // the `task.getAll` query in the background. This causes the `TaskList` component to
      // re-render with the new data, making the newly created task appear in the list.
      utils.task.getAll.invalidate();
    },
  });

  // This is the component's main `return` statement. It defines the JSX that will be rendered
  // to the screen. The UI consists of a `<form>` element containing an input and a button.
  return (

      // This renders the HTML `<form>` element. Using a semantic `<form>` is the correct
    // way to handle user input submissions for accessibility and browser features.
    <form

      // `onSubmit`: This is the React event handler for the form's submission. It is triggered
      // when the user either clicks a button with `type="submit"` or presses the "Enter" key
      // while focused inside an input field within this form.
      // We provide it with an inline arrow function that contains our submission logic.
      onSubmit={(e) => {

        // `e.preventDefault()`: This is a critical first step. By default, submitting an HTML
        // form causes the browser to perform a full-page reload. This line stops that
        // default behavior, allowing us to handle the submission with our own client-side
        // JavaScript logic without a disruptive page refresh.
        e.preventDefault();

        // `createTask.mutate({ title })`: If the title is not empty, we call the `.mutate()` function
        // from the `createTask` object we created earlier with `useMutation`. This is the action
        // that actually triggers the API call to the backend `task.create` procedure.
        //
        // We are passing it a data payload object. This object's shape must match the Zod input
        // schema that we defined on the backend for this procedure.
        //
        // --- Understanding the `{ title }` Shorthand ---
        // The `{ title }` syntax is a modern JavaScript feature called "Object Property Shorthand".
        // It is a direct shortcut for writing `{ title: title }`.
        //
        // Because the name of our state variable (`title`) is the exact same as the name of the
        // property key that our backend API expects (`title`), we can use this shorthand to
        // avoid repetition. JavaScript automatically creates an object with a `title` key
        // and assigns it the value from our `title` state variable.
        if (title) createTask.mutate({ title });
      }}

      // The `className` prop applies several Tailwind CSS utility classes to style the form's layout.
      //
      // - `flex`: This is the most important class. It sets `display: flex`, which enables the
      //   "Flexbox" layout model for the form's direct children (the `<input>` and `<button>`).
      //   By default, Flexbox arranges items in a horizontal row.
      //
      // - `gap-2`: This is a Flexbox property that creates a small, consistent space (`0.5rem`)
      //   between the child elements (the input and the button). This is the modern way to
      //   add space without using margins.
      //
      // - `mb-4`: This utility adds a `margin-bottom` of `1rem` to the entire form, creating
      //   a clear separation between the "create task" form and the `TaskList` component below it.
      className="flex gap-2 mb-4"
    >

      {// This renders the main text `<input>` element where the user will type their new task.
      }
      <input

        // `value={title}`: This makes the input a "Controlled Component". Its displayed value is
        // directly controlled by our `title` state variable from `useState`. When the `title`
        // state changes, this input's value will automatically update on the next render.
        value={title}

        // `onChange`: This event handler fires on every single keystroke the user makes.
        // `(e) => setTitle(e.target.value)`: We provide an inline arrow function that, on every
        // change, calls our `setTitle` state setter function. It passes the new text content from
        // the input (`e.target.value`) as the new value for our `title` state. This completes
        // the "controlled loop": user types -> `onChange` fires -> state updates -> component re-renders
        // -> input `value` is updated.
        onChange={(e) => setTitle(e.target.value)}

        // `placeholder`: A standard HTML attribute that displays grayed-out, hint text inside the
        // input field when it is empty. This text disappears as soon as the user starts typing.
        placeholder="Add a new task..."

        // `className`: This prop applies several Tailwind CSS utility classes to style the input field.
        //
        // - `flex-1`: This is a powerful Flexbox utility that controls how an item grows to fill
        //   available space. It is the key to making the input field stretch to fill the container.
        //
        //   Imagine the parent `<form>` is a flexible container (because of the `flex` class).
        //   Inside it are two children: the `<input>` and the `<button>`.
        //
        //   1. First, the browser calculates the "natural" width of the button based on its text
        //      and padding (e.g., let's say it's 60px wide).
        //
        //   2. It then looks at the remaining space in the container.
        //
        //   3. The `flex-1` class on the `<input>` acts like an instruction: "Hey input field, you
        //      are designated as a 'grow' item. I want you to be greedy and expand your width to
        //      fill up ALL of the remaining free space in the container."
        //
        //   Because the `<button>` does not have `flex-1`, it keeps its natural width. The `<input>`
        //   stretches to fill the rest. This creates a common and highly responsive layout where
        //   one element is fixed in size and the other is flexible.
        //
        // - `border`: Applies a default 1px solid border.
        // - `px-2 py-1`: Sets horizontal and vertical padding inside the input for text spacing.
        // - `rounded`: Applies a `border-radius` for slightly rounded corners.
        // - `bg-gray-800 text-white`: Sets the background and text colors to match the dark theme.
        className="flex-1 border px-2 py-1 rounded bg-gray-800 text-white"

        // `disabled`: This is a standard HTML attribute for form elements. When `true`, it makes the
        // input field "read-only" and unfocusable, preventing the user from typing in it.
        //
        // `={createTask.isPending}`: We are dynamically binding this attribute to the `isPending`
        // status from our `createTask` mutation.
        //
        // - `createTask.isPending`: This is a boolean flag provided by React Query. It is `true`
        //   from the moment `.mutate()` is called until the server responds (either with success or an error).
        //
        // The result is that while the new task is being saved to the database, the input field
        // will be temporarily disabled. This is a great UX pattern that prevents the user from
        // trying to change the text while the submission is in progress.
        disabled={createTask.isPending}
      />

      {// This renders the main submission `<button>` for the form.
      }
      <button

        // `type="submit"`: A standard HTML attribute that designates this button as the primary
        // submission control for its parent `<form>`. Clicking it will trigger the `onSubmit`
        // event handler attached to the `<form>` element.
        type="submit"

        // `className`: This prop applies several Tailwind CSS utility classes to style the button.
        // - `bg-blue-600 text-white`: Sets the background and text colors.
        // - `px-3 py-1`: Sets the horizontal and vertical padding to control the button's size.
        // - `rounded`: Applies a `border-radius` for slightly rounded corners.
        // - `disabled:opacity-50`: This is a special "state variant" in Tailwind. It applies an
        //   opacity of 50% *only when* the button is in a `disabled` state. This visually
        //   "grays out" the button, clearly indicating to the user that it is temporarily inactive.
        className="bg-blue-600 text-white px-3 py-1 rounded disabled:opacity-50"

        // `disabled={createTask.isPending}`: Just like with the input, we are dynamically disabling
        // the button based on the mutation's `isPending` status. This is a crucial feature to
        // prevent the user from accidentally clicking the "Add" button multiple times and sending
        // duplicate requests to the server while the first one is still processing.
        disabled={createTask.isPending}
      >
        
        {// This is the visible text content displayed inside the button. Its content is rendered
        // conditionally to provide immediate feedback to the user about the submission status.
        //
        // `{createTask.isPending ? "Adding..." : "Add"}`: This is a "ternary operator", a compact
        // if-else statement embedded directly in the JSX.
        //
        // - The Condition (`createTask.isPending`): It checks the boolean status of the mutation.
        // - If `true`: The text "Adding..." is rendered inside the button.
        // - If `false`: The default text "Add" is rendered.
        //
        // This, combined with the `disabled` state, creates a very clear and responsive user experience.
        }
        {createTask.isPending ? "Adding..." : "Add"} 
      </button>
    </form>
  );
}