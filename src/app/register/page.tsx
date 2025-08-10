 // This file defines the Next.js App Router page for the  `/register` route. 

// This directive is essential. It marks this component as a "Client Component", meaning its
// JavaScript will be sent to and run in the user's browser. This is required because this
// component uses hooks (`useState`, `useRouter`) and handles user interactions (form input and submission),
// which can only happen on the client side.
"use client";

// Imports the `useState` hook from the React library. This is a fundamental hook that allows
// function components to have "state" which are variables whose changes will cause the component to
// re-render and update the UI. We will use it to store the user's input for email and password,
// and to track the form's loading status during submission.
import { useState } from "react";

// Imports the `useRouter` hook from Next.js's App Router navigation library.
// This hook gives us access to the router instance, which allows us to programmatically
// navigate the user to a different page, such as redirecting to the `/login` page after
// a successful registration.
import { useRouter } from "next/navigation";

// Imports the `toast` function from the `react-hot-toast` library. This is a utility for
// displaying small, non-intrusive notification pop-ups (toasts) to provide immediate
// feedback to the user, such as "Registration successful!" or an error like "Email already in use".
import { toast } from "react-hot-toast";

// Defines and exports the main React component for the registration page.
// `export default`: This makes this component the primary export of this file, allowing
//  the Next.js routing system to find and render it for the `/register` route.
export default function RegisterPage() {

  // Calls the `useRouter` hook to get access to the Next.js router instance.
  // The returned `router` object contains methods for programmatic navigation. We will use
  // its `router.push()` method to redirect the user to the login page after they successfully register.
  const router = useRouter();

  // This line initializes a state variable to manage the data for the entire registration form.
  // We use an object to keep all related form fields grouped together.
  //
  // 1. `useState({ email: "", password: "" })`: This calls the `useState` hook, passing it an
  //    initial value: an object with `email` and `password` keys set to empty strings.
  // 2. Return Value: The `useState` hook ALWAYS returns an array with exactly two elements:
  //    `[ currentValue, setterFunction ]`.
  // 3. `const [formData, setFormData] = ...`: This is "Array Destructuring". It unpacks the array:
  //    - `formData`: The first variable is assigned the first element of the array (the current state object).
  //    - `setFormData`: The second variable is assigned the second element (the function to update this state and triggers a re-render).
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  // This line initializes a separate boolean state variable to track the form's submission status.
  //
  // 1. `useState(false)`: We call `useState` with an initial value of `false`, as the form is not
  //    submitting when the page first loads.
  // 2. Return Value: This hook call returns the array `[ false, [function] ]` on the initial render.
  // 3. `const [isLoading, setIsLoading] = ...`: We use array destructuring again.
  //    - `isLoading`: This variable will hold the current loading status (`true` or `false`).
  //    - `setIsLoading`: This is the function we'll call to change the loading state and trigger
  //      a re-render to update the UI (e.g., disable the button and change its text).
  const [isLoading, setIsLoading] = useState(false);

  // This function is an event handler. Its purpose is to be executed every time a user
  // interacts with a form input. Specifically, it will be attached to the `onChange` prop of
  // our input fields in the JSX below. The `onChange` event fires on every single keystroke,
  // which means this function will run each time the user types or deletes a character.
  //
  // Instead of creating a separate handler for each input (like `handleEmailChange`),
  // this single function can handle all of them by using the `name` attribute of the HTML
  // input to dynamically update the correct piece of state.
  //
  // 1. `const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {`
  //    - This is an arrow function expression. We are defining a function and assigning it to a
  //      constant variable named `handleChange`. This is the standard way to define functions
  //      inside a React component.
  //
  // 2. `(e: React.ChangeEvent<HTMLInputElement>)`
  //    - `(`...`)`: These parentheses contain the parameter list for the function.
  //
  //    - `e`: The name of the single parameter this function accepts. When the `onChange` event
  //      fires, React automatically calls this handler and passes a "Synthetic Event" object
  //      as this argument. Different browsers (Chrome, Firefox, etc.) can have minor
  //      differences in their native event objects. React creates a "Synthetic Event" as a
  //      consistent, cross-browser wrapper. This ensures properties like `e.target.value`
  //      work identically for every user on every browser.
  //
  //    - `:`: The colon begins a TypeScript "type annotation," which specifies the data type of the `e` parameter.
  //
  //    - `React.ChangeEvent<HTMLInputElement>`: This is the specific data type for the `e` parameter.
  //
  //      - `React.ChangeEvent` (The Base Type): The base type for any change event.
  //
  //      - `<...>` (The Generic Syntax): The angle brackets make the base type more specific.
  //
  //      - `HTMLInputElement` (The Specific Type): This specifies that the event is guaranteed
  //        to have come from a standard HTML `<input>` element. `HTMLInputElement` is a globally
  //        available type provided by TypeScript's built-in DOM library.
  //
  //    By providing this very specific data type, our code becomes safer and our editor can provide
  //    perfect autocompletion for properties like `e.target.value` and `e.target.name`.
  //
  // 3. `=>`: This is the "arrow" that separates the parameter list from the function's body.
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {

    // This line updates the form's state whenever the user types into an input field.
    // `setFormData(...)`: We call the state setter function to provide the new state.
    // `{ ... }`: We are creating a new object for the updated state.
    // `...formData`: This is the "spread syntax". It copies all the current key-value pairs from the
    //   `formData` object into this new object. This is crucial because it ensures that when we update
    //   one field (like 'email'), we don't lose the value of the other fields (like 'password').
    // 
    // `[e.target.name]: e.target.value`: This is a computed property name. It's the key to making this function reusable.
    // The brackets [] around a property name are a special signal to the JavaScript engine. They mean:
    // "Don't use what's inside the brackets as a literal key. Instead, treat it as an expression, evaluate it 
    // first, and then use the result of that expression as the property name."
    // 
    //   - `e.target`: Refers to the specific `<input>` element the user typed into.
    //   - `e.target.name`: Gets the `name` attribute from that input (e.g., "email" or "password").
    //   - `e.target.value`: Gets the new text content of that input.
    //   This syntax dynamically sets the key in our new state object. If the user typed in the email
    //   field, this line effectively becomes `email: "new-email-value"`.
    setFormData({...formData, [e.target.name]: e.target.value,});
  };

  // This defines the asynchronous event handler function that will be executed when the user submits the form.
  // This function is assigned to the `onSubmit` prop of the `<form>` element in the JSX below.
  //
  // - `const handleSubmit = ...`: An "Arrow Function" is defined and assigned to a constant named `handleSubmit`.
  // - `async`: This keyword is essential. It declares that this function contains asynchronous operations (the `await signIn` call)
  //   and allows us to use the `await` keyword inside it to pause execution.
  // - `(e: React.FormEvent)`: The parameter list.
  //   - `e`: The name of the parameter that will hold React's "Synthetic Event" object.
  //   - `: React.FormEvent`: This is the TypeScript data type for the `e` parameter. It specifies that this
  //     is a `FormEvent` (like a submission), which is different from a `ChangeEvent` (like typing).
  const handleSubmit = async (e: React.FormEvent) => {

    // This is a CRITICAL line for single-page applications (SPAs).
    // By default, when a browser form is submitted, the browser performs a full-page reload.
    // `e.preventDefault()`: This method on the event object stops that default browser behavior, allowing
    // us to handle the form submission with our own JavaScript logic without a page refresh.
    e.preventDefault();

    // We immediately call our state setter function to set the loading status to `true`.
    // This will trigger a re-render of the component, which will update the UI to show a
    // "Registering..." message and disable the submit button, preventing duplicate submissions.
    setIsLoading(true);

    // The `try...catch...finally` block is a robust pattern for handling asynchronous operations
    // that might fail, such as a network request. The code we expect to work goes in the `try` block.
    try {

      // This line uses the standard browser `fetch` API to send a network request to our backend.
      // `await`: This keyword pauses the execution of the `handleSubmit` function here until the
      // server has responded. The `Response` object from the server is then stored in the `res` variable.
      //
      // Arguements:
      // 1. The URL: `"/api/register"`
      //    - This is a relative URL pointing to the server-side API endpoint that will handle
      //      the user registration logic.
      //    - In our Next.js project, this URL corresponds to the handler file located at
      //      `src/app/api/register/route.ts`.
      //
      // 2. The `options` object: This configures the details of the request.
      const res = await fetch("/api/register", {

        // `method: "POST"`: We specify the HTTP method as POST. This is the standard method for sending
        // data to a server to create a new resource (in this case, a new user account).
        method: "POST",

        // `headers`: This object provides metadata about our request.
        headers: {

          // `"Content-Type": "application/json"`: This header is essential. It tells the server that the
          // data we are sending in the `body` of this request is formatted as a JSON string.
          // The server will use this information to parse the body correctly.
          "Content-Type": "application/json",
        },

        // `body`: This contains the actual data payload we are sending to the server.
        // `JSON.stringify(formData)`: We take our `formData` state object (which contains the
        // user's email and password) and serialize it into a JSON string (e.g., `'{"email":"...","password":"..."}'`).
        body: JSON.stringify(formData),
      });

      // After receiving the initial response, we need to read and parse its body content.
      // `await res.json()`: This is an asynchronous method that takes the response stream from the server
      // and parses it as JSON. The `await` keyword pauses execution until this parsing is complete.
      // The resulting JavaScript object (e.g., `{ message: 'User created' }` or `{ error: 'Email already exists' }`)
      // is stored in the `data` variable.
      const data = await res.json();

      // This is a critical check for the success of the HTTP request itself.
      // `res.ok` is a boolean property on the response object that is `true` only if the HTTP status
      // code was in the successful range (200-299). It will be `false` for client or server errors (4xx, 5xx).
      if (!res.ok) {

        // If the response was not successful (e.g., the server returned a 400 Bad Request error because
        // the email was already in use), we `throw new Error`. This immediately stops the execution
        // of the `try` block and transfers control to the `catch` block below.
        // `data.error || "Something went wrong"`: This constructs the error message. We first try to use
        // the specific error message sent from our backend in the `data.error` property. If that
        // doesn't exist for some reason, we use a generic fallback message.
        throw new Error(data.error || "Something went wrong");
      }

      // If the code reaches this point, it means `res.ok` was true and the user was successfully created on the backend.
      // We use the `react-hot-toast` library to display a success notification pop-up to the user.
      // This message clearly informs the user of the successful registration and tells them the next step.
      toast.success("Account created! Check your email to verify.");

      // After notifying the user, we programmatically navigate them to the login page.
      // `router.push("/login")`: This method from the Next.js `useRouter` hook redirects the user's
      // browser to the `/login` route, where they can now attempt to sign in.
      router.push("/login");

    // The `catch` block will execute if any error was thrown at any point inside the `try` block.
    // This could be a network failure (e.g., the user is offline and `fetch` fails) or the
    // explicit `throw new Error(...)` we triggered if the server responded with an error status.
    // `error`: This variable contains the error object that was "caught". We are typing it as `any`
    // for simplicity, as the type of thrown errors can be unpredictable.
    } catch (error: any) {

      // `toast.error(error.message)`: We display an error notification toast to the user.
      // We access the `.message` property of the `error` object (e.g., "Email already in use")
      // to provide specific feedback about what went wrong.
      toast.error(error.message);

    // The `finally` block is a special part of the `try...catch` statement.
    // The code inside `finally` will always be executed, regardless of whether the `try`
    // block completed successfully or the `catch` block was triggered by an error.
    // This makes it the perfect place for "cleanup" code.
    } finally {

      // `setIsLoading(false)`: We call our state setter function to update the `loading` state to `false`.
      // This ensures that the UI is reset (the button is re-enabled, the text changes back to "Register")
      // no matter what the outcome of the API call was, allowing the user to try again if necessary.
      setIsLoading(false);
    }
  };

  // The `return` statement specifies the UI that this component will render to the screen.
  // The code inside the parentheses is JSX, a syntax extension for JavaScript that
  // allows you to write HTML-like code to describe the component's structure.
  return (

    // This `div` acts as the main full-screen container for the entire registration page.
    // The `className` uses Tailwind CSS utilities to style it.
    //
    // - `flex`: This is the key to the layout. It sets `display: flex`, which enables "Flexbox".
    //   Flexbox is a modern CSS layout model designed for arranging items in a single dimension
    //   (either a row or a column). When you apply `display: flex` to a container, you "unlock"
    //   a powerful set of alignment properties for its direct children.
    //
    // - `min-h-screen`: Sets `min-height: 100vh` (100% of the viewport height), ensuring the container
    //   takes up at least the full height of the browser window.
    //
    // - `items-center`: A Flexbox property. It aligns the children (the form) along the "cross axis".
    //   For a default row-based flex container, this means it centers the form vertically.
    //
    // - `justify-center`: A Flexbox property. It aligns the children along the "main axis".
    //   For a default row-based flex container, this means it centers the form horizontally.
    //   By combining `items-center` and `justify-center`, we achieve perfect centering on the page.
    //
    // - `bg-gray-900`: Sets the background color to a very dark gray.
    // - `text-white`: Sets the default text color for all child elements to white.
    <div className="flex min-h-screen items-center justify-center bg-gray-900 text-white">

      {// This renders the HTML `<form>` element, which will contain all the registration inputs and the submit button.
      // `onSubmit={handleSubmit}`: When the user submits the form, React will call our `handleSubmit` function.
      //
      // The `className` styles the form itself to look like a card.
      // - `w-full`: Sets `width: 100%`.
      // - `max-w-md`: Sets a `max-width` of `28rem` (`448px`).
      //
      //   This is a standard responsive design pattern. On small screens (narrower
      //   than `28rem`), the form will be `w-full`, perfectly fitting the screen. On large screens,
      //   the form will stop growing at `max-w-md`. The form is then centered on the page by the
      //   `justify-center` flexbox property of its parent `<div>`.
      //
      // - `space-y-6`: Adds vertical space (`margin-top`) between all direct children of the form
      //   (the heading, the input divs, and the button), creating consistent spacing.
      // - `bg-gray-800`: Sets the form's background color.
      // - `p-8`: Adds large padding (`2rem`) inside the form.
      // - `rounded-lg`: Applies rounded corners.
      // - `shadow`: Adds a subtle box-shadow.
      }
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md space-y-6 rounded-lg bg-gray-800 p-8 shadow-lg"
      >

        {// This renders the main heading for the registration form.
        // The `className` uses Tailwind CSS utilities to style the text.
        // - `text-3xl`: Sets a large `font-size`.
        // - `font-bold`: Sets the `font-weight` to bold.
        }
        <h2 className="text-3xl font-bold">Register</h2>

        {// This `div` acts as a container or wrapper for the email label and its corresponding input field.
        // This grouping helps with layout and ensures the `space-y-6` on the parent `<form>` works correctly.
        }
        <div>

          {// This renders the visible text label for the email input field.
          // `htmlFor="email"`: This is a crucial accessibility attribute. It programmatically links this
          // label to the input field that has a matching `id` of "email". When a user clicks this
          // label, the browser will automatically focus the cursor inside the email input box.
          // The `className` styles the label text.
          // - `block`: Sets `display: block`, which makes the label take up its own line.
          // - `text-sm`: Sets a small `font-size`.
          // - `font-medium`: Sets a medium `font-weight`.
          }
          <label htmlFor="email" className="block text-sm font-medium">
            Email
          </label>

          {// This renders the actual `<input>` element for the user to type in their email.
          // It's a "Controlled Component" because its value is controlled by React state.
          }
          <input

            // `type="email"`: A standard HTML attribute that instructs the browser on how to treat this input field.
            // This provides several important, free benefits for user experience and validation:
            // 1. Mobile Keyboard Optimization: On most mobile devices, the browser will display a keyboard
            //    that is optimized for email entry, featuring prominent '@' and '.' keys.
            // 2. Built-in Validation: If this input is inside a `<form>` tag, many browsers will prevent
            //    submission if the text entered does not conform to a standard email address format (e.g., text@text.com).
            // 3. Accessibility: It provides semantic meaning to screen readers, which can announce to the
            //    user that this is an "email edit text field".
            type="email"

            // `name="email"`: This HTML attribute is essential for our reusable `handleChange` function.
            // The handler's logic uses this string "email" as the key to update the correct
            // property in our `formData` state object.
            name="email"

            // `id="email"`: This ID is used to link the `<label>` above to this input via the `htmlFor` attribute.
            // This is essential for accessibility.
            id="email"

            // `value={formData.email}`: This binds the input's displayed value directly to our
            // `formData.email` state variable, making React the single source of truth.
            value={formData.email}

            // `onChange={handleChange}`: This event handler fires on every keystroke. It calls our
            // `handleChange` function, which updates the state, triggering a re-render to show the new character.
            onChange={handleChange}

            // `required`: A standard HTML attribute that prevents the user from submitting the form if this field is empty.
            required

            // `className`: This applies Tailwind CSS utility classes for styling.
            // - `mt-1`: Adds a small `margin-top` to create space between the label and the input.
            // - `w-full`: Makes the input take up 100% of its container's width.
            // - `rounded-md`: Applies a medium `border-radius` for rounded corners.
            // - `border border-gray-700`: Applies a 1px solid border with a specific gray color.
            // - `bg-gray-900`: Sets the input's background color.
            // - `p-2`: Adds padding inside the input field.
            className="mt-1 w-full rounded-md border border-gray-700 bg-gray-900 p-2"
          />
        </div>

        {// This `div` acts as a container for the password label and its corresponding input field.
        // This grouping helps with layout and the `space-y-6` utility on the parent form.
        }
        <div>

          {// This renders the visible text label for the password input field.
          // `htmlFor="password"`: This accessibility attribute links this label to the input field
          // that has a matching `id` of "password". When a user clicks this label, the browser
          // will automatically focus the cursor inside the password input box.
          // The `className` styles the label the same as the email label.
          }
          <label htmlFor="password" className="block text-sm font-medium">
            Password
          </label>

          {// This renders the `<input>` element for the user's password. It's also a "Controlled Component".
          }
          <input

            // `type="password"`: A standard and important HTML attribute for password fields.
            // It instructs the browser to obscure the characters as the user types them (e.g., showing dots `••••••`
            // or asterisks `******`), which is a fundamental security practice.
            type="password"

            // `name="password"`: This HTML attribute is essential. Our reusable `handleChange` function uses
            // this string "password" as the key to update the correct `password` property in our `formData` state.
            name="password"

            // `id="password"`: This ID is used to link the `<label>` above to this input via the `htmlFor` attribute,
            // which is essential for accessibility.
            id="password"

            // `value={formData.password}`: This forces the input's displayed value to be determined solely by
            // our `formData.password` state variable, making React the single source of truth.
            value={formData.password}

            // `onChange={handleChange}`: We reuse the exact same event handler as the email input. On every
            // keystroke, this function is called, and it updates the `password` part of our `formData` state.
            onChange={handleChange}

            // `required`: A standard HTML attribute that prevents the user from submitting the form if this field is empty.
            required

            // `className`: This applies the exact same Tailwind CSS styling as the email input for a consistent UI.
            className="mt-1 w-full rounded-md border border-gray-700 bg-gray-900 p-2"
          />
        </div>

        {// This renders the main action button that submits the registration form.
        }
        <button

          // `type="submit"`: A standard HTML attribute. This is what makes this button the default
          // submit button for the parent `<form>`. Clicking it (or pressing Enter in an input field)
          // will trigger the `onSubmit` event handler attached to the `<form>` tag.
          type="submit"

          // `disabled={isLoading}`: This is a dynamic attribute that controls whether the button is clickable.
          // Its value is directly bound to our `isLoading` state variable.
          // - When `isLoading` is `true` (while the API call is in progress), the button's `disabled`
          //   attribute will be set, making it unclickable. This is a crucial UX feature to prevent
          //   the user from sending multiple registration requests.
          // - When `isLoading` is `false`, the `disabled` attribute is removed, and the button is active.
          disabled={isLoading}

          // `className`: This applies Tailwind CSS utility classes for styling, including special "state variants"
          // that change the button's appearance based on its state (hover, disabled).
          // - `w-full`: Makes the button take up 100% of its container's width.
          // - `rounded-md`: Applies a medium `border-radius` for rounded corners.
          // - `bg-blue-600`: Sets the default background color to a shade of blue.
          // - `px-4 py-2`: Applies horizontal (`x`) and vertical (`y`) padding to control the button's size.
          // - `font-semibold`: Sets the `font-weight` to semi-bold.
          // - `text-white`: Sets the text color to white.
          // - `hover:bg-blue-700`: This is a "state variant". It applies a slightly darker blue background color
          //   only when the user's mouse is hovering over the button, providing visual feedback.
          // - `disabled:opacity-50`: This is another state variant. It applies an opacity of 50% only when
          //   the button is in a `disabled` state (when `isLoading` is true). This visually indicates to the
          //   user that the button is temporarily inactive by making it look "grayed out".
          className="w-full rounded-md bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {// This is the text displayed inside the button. Its content is rendered conditionally
          // based on the current value of the `isLoading` state variable, providing immediate
          // visual feedback to the user about the form's submission status.
          // We use a "ternary operator" (`condition ? value_if_true : value_if_false`) for this logic.
          }
          {isLoading ? "Registering..." : "Register"}
        </button>
      </form>
    </div>
  );
}
