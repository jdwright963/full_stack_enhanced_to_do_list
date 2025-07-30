// src/app/tasks/_components/TaskList.tsx
'use client';

import { api } from "~/trpc/react";

export function TaskList() {
  const utils = api.useContext();
  const { data: tasks = [], isLoading } = api.task.getAll.useQuery();

  const toggleTask = api.task.toggle.useMutation({
    onSuccess: () => utils.task.getAll.invalidate(),
  });

  const deleteTask = api.task.delete.useMutation({
    onSuccess: () => utils.task.getAll.invalidate(),
  });

  if (isLoading) {
    return <p>Loading tasks...</p>;
  }

  return (
    <ul className="space-y-2">
      {tasks.map((task) => (
        <li key={task.id} className="flex justify-between items-center border p-2 rounded border-gray-700">
          <span
            onClick={() => toggleTask.mutate({ id: task.id })}
            className={`cursor-pointer ${task.completed ? "line-through text-gray-500" : ""}`}
          >
            {task.title}
          </span>
          <button
            onClick={() => deleteTask.mutate({ id: task.id })}
            className="text-red-500 hover:underline"
          >
            Delete
          </button>
        </li>
      ))}
    </ul>
  );
}