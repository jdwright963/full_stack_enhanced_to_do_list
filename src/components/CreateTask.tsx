// src/app/tasks/_components/CreateTask.tsx (Corrected)
'use client';

import { useState } from "react";
import { api } from "~/trpc/react";

export function CreateTask() {
  const [title, setTitle] = useState("");
  const utils = api.useContext();

  const createTask = api.task.create.useMutation({
    onSuccess: () => {
      setTitle(""); // Clear input on success
      utils.task.getAll.invalidate(); // Refetch tasks
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (title) createTask.mutate({ title });
      }}
      className="flex gap-2 mb-4"
    >
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Add a new task..."
        className="flex-1 border px-2 py-1 rounded bg-gray-800 text-white"
        // --- CHANGE 1 ---
        disabled={createTask.isPending} // Corrected from isLoading to isPending
      />
      <button
        type="submit"
        className="bg-blue-600 text-white px-3 py-1 rounded disabled:opacity-50"
        // --- CHANGE 2 ---
        disabled={createTask.isPending} // Corrected from isLoading to isPending
      >
        {/* --- CHANGE 3 --- */}
        {createTask.isPending ? "Adding..." : "Add"} {/* Corrected from isLoading to isPending */}
      </button>
    </form>
  );
}