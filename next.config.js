// This `next.config.js` file is automatically generated and configured by `create-t3-app`.
// It is the central configuration file for the Next.js framework itself. While it starts
// mostly empty, you can use it to customize core Next.js behaviors like redirects, headers,
// and build process optimizations.
//
// The T3 stack adds a unique line (`import "./src/env.js"`) to this file. This line's purpose
// is to import and validate your environment variables using Zod at the very start of the
// build process. This ensures that your application will fail to build if any required
// environment variables (like a database URL or API key) are missing, preventing runtime
// errors in production.

/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";

/** @type {import("next").NextConfig} */
const config = {};

export default config;
