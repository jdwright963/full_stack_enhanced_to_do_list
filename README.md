# Create T3 App

This is a [T3 Stack](https://create.t3.gg/) project bootstrapped with `create-t3-app`.

Docs for different technologies used in this project:

- [Next.js](https://nextjs.org)
- [NextAuth.js](https://next-auth.js.org)
- [Prisma](https://prisma.io)
- [Drizzle](https://orm.drizzle.team)
- [Tailwind CSS](https://tailwindcss.com)
- [tRPC](https://trpc.io)

## Learn More

To learn more about the [T3 Stack](https://create.t3.gg/), take a look at the following resources:

- [Documentation](https://create.t3.gg/)
- [Learn the T3 Stack](https://create.t3.gg/en/faq#what-learning-resources-are-currently-available) — Check out these awesome tutorials

You can check out the [create-t3-app GitHub repository](https://github.com/t3-oss/create-t3-app) — your feedback and contributions are welcome!

## How do I deploy this?

Follow our deployment guides for [Vercel](https://create.t3.gg/en/deployment/vercel), [Netlify](https://create.t3.gg/en/deployment/netlify) and [Docker](https://create.t3.gg/en/deployment/docker) for more information.








# Full Stack Enhanced To‑Do List (T3 Stack)

A production-style, type-safe task management application built with the T3 Stack (Next.js App Router, tRPC, Prisma, NextAuth, Tailwind, Zod, React Query) plus email and password based authentication, Playwright end‑to‑end tests, and backend API tests.

---

## Table of Contents
1. Overview
2. Tech Stack
3. Core Features
4. Project Structure
5. Data & Persistence
6. Environment Variables & Validation
7. Installation & Local Development
8. Database Management (Prisma)
9. Authentication & Authorization
10. Email Flow (Verification)
11. API Layer (tRPC)
12. UI Components
13. Pages / Routes
14. Caching & Hydration
15. Testing (Playwright + Python API Tests)
16. Continuous Integration (GitHub Actions)
17. Docker (Playwright)
18. Useful NPM Scripts
19. Code Quality (ESLint / Prettier / TypeScript)
20. Tailwind & Styling
21. Deployment Notes
22. Troubleshooting

---

## 1. Overview
A secure task list application demonstrating:
- Credentials-based auth with email verification.
- Strong environment variable validation using Zod.
- Type-safe end‑to‑end data path via tRPC.
- Prisma PostgreSQL persistence.
- Deterministic testing environments (isolated schemas per CI job).
- E2E coverage for auth + task lifecycle.

---

## 2. Tech Stack
- Runtime / Framework: Next.js ([next.config.js](next.config.js))
- API Transport: tRPC ([`server.api.trpc`](src/server/api/trpc.ts), [`server.api.root`](src/server/api/root.ts))
- ORM: Prisma ([prisma/schema.prisma](prisma/schema.prisma))
- Auth: NextAuth (credentials) ([`server.auth.config`](src/server/auth/config.ts), [`server.auth.index`](src/server/auth/index.ts))
- State / Data Fetching: React Query + tRPC hooks ([`trpc.react`](src/trpc/react.tsx))
- Server Components + RSC hydration helpers ([`trpc.server`](src/trpc/server.ts))
- Styling: Tailwind ([tailwind.config.ts](tailwind.config.ts), [src/styles/globals.css](src/styles/globals.css))
- Email: Nodemailer ([`lib.email`](src/lib/email.ts))
- Validation: Zod ([`env`](src/env.js))
- Testing:
  - Playwright E2E ([playwright.config.ts](playwright.config.ts), [e2e/](e2e))
  - Python requests ([tests_api/test_api.py](tests_api/test_api.py))
- CI: GitHub Actions ([.github/workflows/playwright.yml](.github/workflows/playwright.yml), .github/workflows/backend_tests.yml)

---

## 3. Core Features
- Account registration with email + password.
- Email verification token flow.
- Protected `/tasks` area with redirect on unauthenticated access.
- CRUD: create, toggle complete, delete tasks ([`taskRouter`](src/server/api/routers/task.ts)).
- Fast and reliable UI updates: After you add, update, or delete a task, the app instantly refreshes the task list so you always see the latest data—no waiting or stale info.
- Complete end-to-end tests: Automated tests cover the entire user journey, including registration, email verification, logging in, managing tasks, and logging out.
- Consistent test database: Before running tests, the database is wiped and filled with known data to guarantee repeatable, reliable results (see [`global-setup`](e2e/global-setup.ts)).

---

## 4. Project Structure
```
src/
  app/              (App Router pages & layouts)
  components/       (Client components)
  server/           (Auth + database + tRPC server setup)
  lib/              (Utilities)
  trpc/             (tRPC client setup, React Query integration, and hydration helpers for both client and server)
  styles/           (Global styles)
prisma/             (Prisma schema & migrations)
e2e/                (Playwright test specs + global setup)
tests_api/          (Python API tests)
.github/workflows/  (CI pipelines)
```

Key files:
- Environment validation: [src/env.js](src/env.js)
- Root layout: [src/app/layout.tsx](src/app/layout.tsx)
- Auth pages: [src/app/login/page.tsx](src/app/login/page.tsx), [src/app/register/page.tsx](src/app/register/page.tsx)
- Protected tasks page: [src/app/tasks/page.tsx](src/app/tasks/page.tsx)
- Dynamic email verification: [src/app/verify-email/[token]/page.tsx](src/app/verify-email/%5Btoken%5D/page.tsx)
- API endpoint (tRPC): [src/app/api/trpc/[trpc]/route.ts](src/app/api/trpc/%5Btrpc%5D/route.ts)
- NextAuth endpoint: [src/app/api/auth/[...nextauth]/route.ts](src/app/api/auth/%5B...nextauth%5D/route.ts)

---

## 5. Data & Persistence
- PostgreSQL database (local: `start-database.sh`).
- Prisma Client singleton ([`server.db`](src/server/db.ts)) prevents connection storms during hot reload.
- Models: User + Task (+ standard NextAuth models).
- Migrations applied via `npx prisma migrate dev` locally; `migrate deploy` for production.

---

## 6. Environment Variables & Validation
All environment variables are strictly validated at build and startup using Zod schemas in [`env`](src/env.js). This validation runs automatically when the app is launched (see [next.config.js](next.config.js)), ensuring that any missing or invalid variables are caught at build time.

Templates:
- Runtime app: [.env.example](.env.example)
- Testing: [.env.example.test](.env.example.test)

Never commit real secrets. Required (non-exhaustive):
- `DATABASE_URL`
- `AUTH_SECRET` / `NEXTAUTH_SECRET`
- SMTP: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM`
- Public: `NEXT_PUBLIC_APP_URL`
- Mailtrap (tests): `MAILTRAP_API_TOKEN`, `MAILTRAP_INBOX_ID`, `MAILTRAP_ACCOUNT_ID`

---

## 7. Installation & Local Development
Prerequisites: Node 18+, npm, Docker (or Podman) for Postgres, optional Python (for backend tests).

```bash
# Install all dependencies exactly as specified in package-lock.json
npm ci

# Start a local PostgreSQL database instance (for WSL, Linux, or macOS)
./start-database.sh

# Apply any new database migrations (creates or updates tables as needed)
npx prisma migrate dev

# Generate the Prisma Client based on your schema
# This command reads the `prisma/schema.prisma` file and generates a fully type-safe
# database client inside the `node_modules/@prisma/client` directory. This step is
# essential for the application code to be able to talk to the database with
# autocompletion and type-safety. While the "postinstall" script automates this,
# running it manually here ensures the client is up-to-date.
npx prisma generate

# Start the Next.js development server
npm run dev
```

Visit http://localhost:3000.

---

## 8. Database Management (Prisma)
Common commands:
```bash

# This is your primary command for evolving the database schema during development.
# It's an interactive, multi-step workflow that:
# 1. Compares your `prisma/schema.prisma` file to the state of your development database.
# 2. If it detects changes, it generates a new, timestamped SQL migration file in the `prisma/migrations` folder.
# 3. It then prompts you in the terminal to give this new migration a descriptive name.
# 4. Finally, it applies the newly created migration to your database.
npx prisma migrate dev  

# This is for applying migrations to production or CI/CD databases.
# It does NOT compare schemas or generate any new files. Its only job is to look at the
# committed migration files in the `prisma/migrations` folder and run any that have not yet been
# applied to the target database. This ensures that deployments are predictable and repeatable,
# only applying the exact changes that have been saved in version control.
npx prisma migrate deploy  

# This command directly synchronizes the database with the `prisma/schema.prisma` file,
# but it does NOT create a migration history file. It compares the schema and the database
# and applies the necessary changes to make them match. This is very useful for rapid prototyping,
# initial project setup, or preparing temporary test databases where you don't need a
# versioned history of changes. It should NOT be used for production or collaborative team workflows.
npx prisma db push  

# This command launches Prisma Studio, a modern, browser-based Graphical User Interface (GUI) for the database.
# It starts a local web server and opens a new tab in the browser, giving you a spreadsheet-like
# interface to view, edit, and delete data in the tables. It's an excellent tool for
# debugging and manually inspecting the data in the development database without having to write SQL queries.
npx prisma studio             
```

---

## 9. Authentication & Authorization
- Credentials provider (email/password) in [`authConfig`](src/server/auth/config.ts).
- Password hashing (bcrypt) at registration (implemented inside `register` mutation logic).
- Session strategy: JWT.
- Email verification enforced before login (logic inside `authorize` in [`authConfig`](src/server/auth/config.ts)).
- Exposed handlers: [`auth.handlers`](src/server/auth/index.ts) consumed by NextAuth route: [src/app/api/auth/[...nextauth]/route.ts](src/app/api/auth/%5B...nextauth%5D/route.ts).

---

## 10. Email Flow (Verification)
- Outbound email via Nodemailer transporter ([`transporter`](src/lib/email.ts)).
- Mailtrap recommended for test/CI inbox capture.
- Verification token stored (model detail in Prisma schema).
- User clicks `/verify-email/:token` page → token lookup → marks `emailVerified` → redirect to login.

---

## 11. API Layer (tRPC)
- Core setup: [`createTRPCContext`, `publicProcedure`, `protectedProcedure`](src/server/api/trpc.ts).
- Routers merged in [`appRouter`](src/server/api/root.ts).
- Server caller, hydration, React Query caching, and memoization: [`trpc.server`](src/trpc/server.ts).
- Client hooks factory: [`trpc.react`](src/trpc/react.tsx).

Task endpoints (examples in [`taskRouter`](src/server/api/routers/task.ts)):
- `task.getAll`
- `task.create`
- `task.toggle`
- `task.delete`

Auth custom endpoint: [`authRouter.register`](src/server/api/routers/auth.ts).

---

## 12. UI Components
- Create Task: [src/components/CreateTask.tsx](src/components/CreateTask.tsx)
- Task List: [src/components/TaskList.tsx](src/components/TaskList.tsx)
- Auth Status banner: [src/components/AuthStatus.tsx](src/components/AuthStatus.tsx)
- Hydration boundary: provided by [`HydrateClient`](src/trpc/server.ts)

---

## 13. Pages / Routes
| Route | Description |
|-------|-------------|
| `/` | Marketing / landing redirect logic |
| `/login` | Credentials login form |
| `/register` | Registration + client validation |
| `/verify-email/[token]` | Email verification |
| `/tasks` | Protected task dashboard |
| `/api/trpc/*` | tRPC endpoint ([route file](src/app/api/trpc/%5Btrpc%5D/route.ts)) |
| `/api/auth/*` | NextAuth handlers |

---

## 14. Caching & Hydration
- Server-side caller + React Query prefetch via [`createHydrationHelpers`](src/trpc/server.ts).
- Client hydration through provider in root layout ([layout](src/app/layout.tsx)).
- Query invalidation after mutations (`utils.task.getAll.invalidate()` pattern in components).

---

## 15. Testing
### 15.1 Playwright E2E
Files:
- Config: [playwright.config.ts](playwright.config.ts)
- Global DB setup / seed: [e2e/global-setup.ts](e2e/global-setup.ts)

<!-- A "spec" file describes the expected behavior and steps for a feature, and Playwright runs these files to check that the app works as intended. -->
- Auth flow spec: [e2e/auth-flow.spec.ts](e2e/auth-flow.spec.ts)
- Task flow spec: [e2e/task-flow.spec.ts](e2e/task-flow.spec.ts)

Run locally:
```bash
# Copy the test environment template and manually fill in required values
cp .env.example.test .env.test

# Run Playwright tests (this will automatically start the dev server)
npx playwright test
```

### 15.2 Backend API (Python)
- Test file: [tests_api/test_api.py](tests_api/test_api.py)
- Install deps: `pip install -r requirements.txt`
- Run server (`npm run dev`) then:
```bash
pytest tests_api/
```

### 15.3 Deterministic DB State
- `global-setup.ts` truncates tables and seeds verified user.
    
    **What does "truncate" mean?**  
    In this context, "truncate" means **deleting all data** from certain database tables before tests run. The script [`e2e/global-setup.ts`](e2e/global-setup.ts) connects to the test database and removes every record from tables like `Task`, `User`, `Account`, and `Session`. This guarantees that the database is completely empty and clean before each test run, so tests always start from the same state.
    
    **Seeds verified user:**  
    After cleaning the database, the script creates a test user whose email is already marked as verified. This user is used by automated tests to log in and check features that require authentication.

- CI isolates schemas with `?schema=playwright_e2e` / `?schema=backend_tests`.

    In Continuous Integration (CI), each type of test (like Playwright E2E or backend API tests) uses a **separate database schema**. A schema is like a separate copy of the database structure and data. By adding `?schema=playwright_e2e` or `?schema=backend_tests` to the database connection string, each test job gets its own isolated environment. This prevents tests from interfering with each other and ensures reliable, repeatable results.
---

## 16. Continuous Integration (GitHub Actions)
Workflows:
- Playwright E2E: [.github/workflows/playwright.yml](.github/workflows/playwright.yml)
  - Installs Node.js and dependencies, sets up browser binaries, resets and migrates the test database, isolates DB schema, starts the Next.js server automatically, and runs Playwright tests in headless mode.
- Backend tests: `.github/workflows/backend_tests.yml` (file not listed above but referenced)
  - Starts the Next.js dev server, waits for it to be healthy, runs Python API tests (`pytest`), and prints logs for debugging.

Both:
- Use secrets from GitHub settings for environment variables (never stored in the repo).
- Append `?schema=<job>` to `DATABASE_URL` so each workflow uses a separate, isolated database schema—this prevents tests from interfering with each other and ensures reliable results.

---

## 17. Docker (Playwright)
- Deterministic environment using [Dockerfile.playwright](Dockerfile.playwright) (inherits Playwright-maintained image).
- Run ad-hoc:
```bash

# This command builds a Docker image for running Playwright tests:
# - 'docker build' is the command to build a Docker image from a Dockerfile.
# - '-f Dockerfile.playwright' tells Docker to use the file named 'Dockerfile.playwright' for build instructions (instead of the default 'Dockerfile').
# - '-t playwright-tests' tags (names) the resulting image as 'playwright-tests' so you can reference it easily later.
# - '.' (dot) specifies the build context, which means Docker will use the current directory and all its files as input for the build.
docker build -f Dockerfile.playwright -t playwright-tests .

# This command runs the Playwright tests inside a Docker container:
# - 'docker run' starts a new container from a specified image.
# - '--rm' tells Docker to automatically remove the container after it finishes running, so you don't have leftover containers.
# - 'playwright-tests' is the name of the image to run (the one you built above).
# When this runs, Docker starts a container using the Playwright image, executes the default command  ('npx playwright test'), and then deletes the container when done.
docker run --rm playwright-tests
```

---

## 18. Useful NPM Scripts (package.json)

> **How to run these scripts:**  
> Use `npm run <script-name>` in your terminal.  
> For example, to start the dev server, run:  
> ```bash
> npm run dev
> ```
> The table below lists the script names as defined in `package.json`.

| Script | Purpose |
|--------|---------|
| `dev` | Starts the Next.js development server using Turbo (fast refresh, hot reload, local development). |
| `build` | Creates a production-ready build of your Next.js app (optimizes code, prepares for deployment). |
| `preview` | Runs the built app locally as it would in production (lets you test the final build before deploying). |
| `lint` / `lint:fix` | Runs ESLint to check your code for errors and style issues; lint:fix also automatically fixes problems it can. |
| `typecheck` / `check` | Checks your code for TypeScript errors; check may also run linting together with type checks. |
| `format:check` / `format:write` | Uses Prettier to check code formatting (format:check) or automatically format code (format:write). |
| `db:generate` | Runs `prisma migrate dev`, which applies migrations and generates the Prisma client. |
| `db:migrate` | Deploys database migrations to your production or CI database. |
| `db:push` | Pushes your Prisma schema changes directly to the database (no migration history, for quick prototyping). |
| `db:studio` | Opens Prisma Studio, a web GUI for viewing and editing your database tables. |
| `postinstall` | Runs after dependencies are installed; typically generates the Prisma client automatically. |

---

## 19. Code Quality
- **ESLint config:** [eslint.config.js](eslint.config.js)  
  ESLint checks the code for errors, potential bugs, and enforces coding style rules.

- **Prettier config:** [prettier.config.js](prettier.config.js)  
  Prettier automatically formats the code for consistent style (indentation, quotes, etc.).

- **Tailwind class sorting via `prettier-plugin-tailwindcss`:**  
  This plugin ensures Tailwind CSS utility classes are always ordered consistently in the code.

- **Full strict TypeScript:** [tsconfig.json](tsconfig.json)  
  TypeScript is set to strict mode, catching more type errors and enforcing safer code.

---

## 20. Tailwind & Styling
- Tailwind setup: [tailwind.config.ts](tailwind.config.ts)
- Global CSS: [src/styles/globals.css](src/styles/globals.css)

---

## 22. Deployment Notes

- **Vercel compatible (App Router):**  
  The project uses Next.js App Router, which is fully supported by Vercel. You can deploy directly to Vercel without extra configuration, and features like server components and API routes will work out of the box.

- **Ensure all required environment variables are configured in your hosting provider:**  
  Before deploying, make sure you set all necessary environment variables (like `DATABASE_URL`, `NEXTAUTH_SECRET`, SMTP credentials, etc.) in your hosting provider’s dashboard. Missing variables will cause build or runtime errors.

- **Use `migrate deploy` in the build step (Prisma):**  
  In production, run `npx prisma migrate deploy` during your build/deploy process. This command applies any new database migrations to keep the schema up to date. It’s safer and more predictable than development commands.

- **Skip validation for container builds (optional): `SKIP_ENV_VALIDATION=true`:**  
  If you’re building Docker containers and want to skip strict environment variable validation (for example, when some variables are only set at runtime), you can set the environment variable `SKIP_ENV_VALIDATION=true`. This disables the Zod validation step during the build.
---

## 23. Troubleshooting
| Symptom | Cause | Fix |
|---------|-------|-----|
| Auth always failing | Missing `AUTH_SECRET` / `NEXTAUTH_SECRET` | Set secrets & rebuild |
| Email not sent | Bad SMTP credentials | Compare `.env` and email provider |
| Playwright timeout on startup | App not ready | Check server logs artifact / extend `webServer` timeout |
| Prisma connection errors | Multiple dev hot reloads | Ensure singleton pattern (see [`server.db`](src/server/db.ts)) |
| Env validation failure | Missing variable | Compare with [.env.example](.env.example) |

---

## 24. Future Enhancements
- Password reset flow.
- Role-based authorization.
- Pagination / filtering of tasks.
- Containerized full stack (Docker Compose).
- Metrics / tracing.

---

## License
Not specified.
