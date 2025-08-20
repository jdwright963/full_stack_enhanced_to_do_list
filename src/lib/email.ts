// This file acts as a central library for all email-related functionality in the application.
// Its primary responsibility is to configure and export a single, reusable Nodemailer `transporter`
// object. By creating the transporter here once, it can be imported and used by various parts of the
// backend (like sending verification emails or password resets) without duplicating the SMTP
// connection logic. This improves efficiency and maintainability.

// Nodemailer is a popular and powerful Node.js module for sending emails via an SMTP server.
import nodemailer from "nodemailer";

// This line creates and exports a constant named `transporter`.
// `export`: This makes the `transporter` object available to be imported into other server-side files.
// `const`: Declares that this objects value will not be reassigned.
// The transporter is created only ONCE when this module is first loaded by the application,
// and then the same instance is reused for all subsequent email sending, which is very efficient.
export const transporter = nodemailer.createTransport({

  // `host`: The hostname of the SMTP (Simple Mail Transfer Protocol) server to connect to.
  // This value is loaded securely from the project's environment variables.
  host: process.env.SMTP_HOST,

  // `port`: The port number on the SMTP server for the connection.
  // `parseInt(...)`: Environment variables are always read as strings, so `parseInt` is
  // used to convert the value into an integer, which is the required type.
  //
  // `process.env.SMTP_PORT ?? "587"`: This is a robust pattern for providing a default value.
  // - The "nullish coalescing operator" (`??`) checks if the value on its left
  //   (`process.env.SMTP_PORT`) is either `null` or `undefined`.
  // - If it is, the operator returns the fallback value on its right (`"587"`).
  //   Port 587 is a very common port for modern email submission.
  // - Otherwise, it returns the value from the environment variable.
  //
  // This is safer than the logical OR (`||`) because `||` would incorrectly use the
  // fallback for any "falsy" string (like an empty string `""`), whereas `??`
  // would correctly use the empty string if it were present.
  port: parseInt(process.env.SMTP_PORT ?? "587"),

  // `secure`: A boolean that configures the connection's security protocol.
  // `false`: This is typically used for connections on port 587 that use STARTTLS. The connection
  // begins in plain text and is then explicitly upgraded to a secure (encrypted) connection.
  secure: false,

  // `auth`: This object contains the credentials required to authenticate with the SMTP server.
  auth: {

    // `user`: The username for the SMTP account. This value is loaded securely from the environment variables.
    // For some services like Resend, this might be a static string (e.g., "resend"), while for others it's a specific username.
    user: process.env.SMTP_USER,

    // `pass`: The password for the SMTP account. For modern email services, this is almost always an
    // auto-generated, secure "API Key" rather than a human-readable password. This is a highly
    // sensitive secret and must be loaded from environment variables.
    pass: process.env.SMTP_PASS,
  },
});

// This defines and exports an asynchronous utility function specifically for sending verification emails.
// `export`: Makes this function available to be imported and used by other server-side files.
// `async`: Declares that this function performs asynchronous operations (like sending an email) and will return a Promise.
// It accepts two arguments, both explicitly typed as strings for TypeScript safety:
// - `email`: The recipient's email address.
// - `token`: The unique, single-use verification token generated for this user.
export async function sendVerificationEmail(email: string, token: string) {

  // This line builds the full verification URL that will be sent to the user.
  // It uses a template literal to combine the app's public base URL (from environment variables)
  // with the verification route and the user's unique token as a path segment.
  // Example result: "http://localhost:3000/verify-email/abc123token"
  // This URL will be clickable in the email and is used to verify the user's account.
  const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email/${token}`;

  // This line executes the email sending operation.
  // `await`: This keyword pauses the execution of the `sendVerificationEmail` function until the
  // `sendMail` method has finished communicating with the SMTP server and the email is sent (or an error occurs).
  // `transporter.sendMail()`: This is the core method from our reusable Nodemailer transporter object.
  // It takes a single object that defines every aspect of the email to be sent.
  await transporter.sendMail({

    // `from`: Specifies the sender's information using the standard `"Display Name" <email@address.com>` format.
    // The "Display Name" (e.g., `"No Reply"`) is the name the recipient sees in their inbox.
    // The actual sending address (`<${process.env.EMAIL_FROM}>`) is dynamically inserted from the environment variables.
    // CRITICAL: For emails to be delivered reliably and avoid spam folders, this sending address MUST
    // be an address that is authorized and verified with the email service provider (e.g., Resend, SendGrid).
    from: `"No Reply" <${process.env.EMAIL_FROM}>`,

    // `to`: This property specifies the recipient's email address.
    // `email`: We use the `email` variable that was passed as an argument into this function.
    to: email,

    // `subject`: This property sets the subject line of the email.
    subject: "Verify your email",

    // `html`: This property defines the body of the email using HTML, allowing for rich content like links and formatting.
    // We use a template literal (backticks `` ` ``) to easily construct the HTML string.
    // `<a href="${verifyUrl}">`: This creates a clickable hyperlink. The `href` attribute is set to the
    // unique verification URL we constructed earlier, making the link functional.
    // `${verifyUrl}`: Inside the link, we also display the URL as the visible text. This is a good practice for
    // security, as it allows users to see the destination of the link before clicking.
    html: `<p>Click the link below to verify your email:</p><p><a href="${verifyUrl}">${verifyUrl}</a></p>`,
  });
}
