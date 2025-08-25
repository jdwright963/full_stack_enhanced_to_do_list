// This file defines the `CreateTask` React component. Its sole responsibility is to 
// render an input field and a button that allow a user to create a new task.

// This directive is essential. It marks this file and all components within it as Client Components.
// This means their JavaScript will be sent to and executed in the user's browser. This is a requirement
// because this component needs to use client-side hooks (like `useState` and tRPC's `useMutation`) and
// handle user interactions (like form input and submission).
'use client';

// Imports the `toast` function from the `react-hot-toast` library. This is a utility for
// displaying small, non-intrusive notification pop-ups (toasts) to provide immediate
// feedback to the user, such as "Registration successful!" or an error like "Email already in use".
import { toast } from "react-hot-toast";

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
      // We use void, because the `utils.task.getAll.invalidate()` function is asynchronous and returns a 
      // `Promise`. The `@typescript-eslint/no-floating-promises` rule requires that we handle this promise
      // (e.g., with `await` or `.catch()`).
      //
      // We want to trigger the re-fetch, but we don't need to *wait* for it to complete. The user
      // experience is better if the input clears instantly.
      //
      // The `void` operator is a standard way to explicitly signal to TypeScript and ESLint that
      // we are intentionally not handling the promise. It evaluates the expression and then returns
      // `undefined`, satisfying the linter rule and clearly documenting our intent to ignore the result.
      void utils.task.getAll.invalidate();
    },

    // This callback runs automatically if the mutation fails (for example, if the input is invalid).
    onError: (error) => {
      
    // This line attempts to extract field-specific validation errors from the error object returned by tRPC.
    // The error object from tRPC may have a nested structure, where:
    // - The top-level `error` object may or may not have a `data` property (depending on the error type).
    // - If present, `data` may have a `zodError` property, which contains validation errors produced by Zod.
    // - The `zodError` object may have a `fieldErrors` property.
    // 
    // The `fieldErrors` property is an object (sometimes called a dictionary or map).
    // Each key in this object is the name of a field in the form (for example: "email" or "password").
    // The value for each key is always an array of strings, where each string is a separate error message
    // describing why that particular field failed validation.
    // 
    // For example, if both the email and password fields are invalid, `fieldErrors` might look like:
    // {
    //   email: ["Please enter a valid email address."],
    //   password: ["Password must be at least 6 characters long.", "Password must contain a special character."]
    // }
    // 
    // Note: 
    // - A single field can have multiple error messages if it fails more than one Zod validation rule.
    // - If a field passes all validation, it will not appear in the `fieldErrors` object at all.
    // 
    // The use of `?.` (optional chaining) after each property ensures that if any part of the chain is
    // missing or undefined, the whole expression will safely resolve to `undefined` rather than throwing an error.
      const fieldErrors = error?.data?.zodError?.fieldErrors;

    // This `if` statement checks whether fieldErrors exists (i.e., is not `undefined` or `null`).
    // If it does, that means there are validation errors to process and display to the user.
      if (fieldErrors) {

        // `Object.values(fieldErrors)` retrieves all the values (i.e., arrays of error messages) from the fieldErrors object.
        // For example, with the previous example, this produces: [["Please enter a valid email address."], ["Password must be at least 6 characters long.", "Password must contain a special character."]]
        // The `.flat()` method then flattens this array of arrays into a single array of error messages:
        // ["Please enter a valid email address.", "Password must be at least 6 characters long.", "Password must contain a special character."]
        // The `.forEach((msg) => { ... })` method then iterates through each error message in this
        // flattened array, executing the function body once for each message. The parameter `msg`
        // represents the current error message being processed during that iteration.
        Object.values(fieldErrors).flat().forEach((msg) => {
          
          // `if (msg)` checks if the current error message is truthy (not undefined, null, or an empty string).
          // This ensures that only valid, non-empty error messages are shown to the user.
          // If the check passes, `toast.error(msg)` displays the error message as a toast notification on the screen.
          if (msg) toast.error(msg);
        });
      }
      
      // If there were no Zod field validation errors, this block checks for a general error message.
      // The `error.message` property is available on standard JavaScript Error objects and many tRPC errors.
      // If such a message exists, it will be displayed to the user as a toast notification.
      else if (error.message) {
        toast.error(error.message);
      }
      
      // If there is neither a field validation error nor a general error message, this block executes.
      // This is a fallback to handle unexpected error cases where no specific details are available.
      // It displays a generic error toast to let the user know something went wrong, even if the backend
      // didn't provide further information.
      else {
        toast.error("An unexpected error occurred.");
      }
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

        // `createTask.mutate({ title })`: We call the `.mutate()` function
        // from the `createTask` object we created earlier with `useMutation`. This is the action
        // that actually triggers the API call to the backend `task.create` procedure.
        //
        // We are passing it a data payload object. This object's shape must match the Zod input
        // schema that we defined on the backend for this procedure.
        //
        // The `{ title }` syntax is a modern JavaScript feature called "Object Property Shorthand".
        // It is a direct shortcut for writing `{ title: title }`.
        //
        // Because the name of our state variable (`title`) is the exact same as the name of the
        // property key that our backend API expects (`title`), we can use this shorthand to
        // avoid repetition. JavaScript automatically creates an object with a `title` key
        // and assigns it the value from our `title` state variable.
        createTask.mutate({ title });
      }}

      // The `className` prop applies several Tailwind CSS utility classes to style the form's layout.
      //
      //  - `flex`: This sets `display: flex`, which enables the "Flexbox" layout model for the form's 
      // direct children. By default, Flexbox arranges items in a horizontal row. This unlocks 
      // a powerful set of alignment properties for the elements direct children.
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
        //   opacity of 50% only when the button is in a `disabled` state. This visually
        //   "grays out" the button, clearly indicating to the user that it is temporarily inactive.
        // - `hover:bg-blue-700`: A "state variant". It applies a slightly darker background color
        //   only when the user's mouse is hovering over the link, providing interactive feedback.
        // - `transition`: Adds a smooth transition effect to all property changes (like the background color on hover).
        className="bg-blue-600 text-white px-3 py-1 rounded disabled:opacity-50 hover:bg-blue-700 transition"

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