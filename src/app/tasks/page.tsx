import { redirect } from "next/navigation";
import { auth } from "~/server/auth";
import { CreateTask } from "~/components/CreateTask";
import { TaskList } from "~/components/TaskList";   
import LogoutButton from "~/components/LogoutButton";

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