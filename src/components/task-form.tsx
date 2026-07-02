"use client";

import { useActionState, useEffect, useRef } from "react";
import { createTask, type TaskFormState } from "@/app/tasks/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const initialState: TaskFormState = { error: null };

export function TaskForm() {
  const [state, formAction, pending] = useActionState(createTask, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!pending && !state.error) {
      formRef.current?.reset();
    }
  }, [pending, state.error]);

  return (
    <form ref={formRef} action={formAction} className="space-y-2">
      <div className="flex gap-2">
        <Input
          name="title"
          placeholder="Add a task…"
          aria-label="Task title"
          required
        />
        <select
          name="priority"
          aria-label="Priority"
          defaultValue="medium"
          className="h-9 rounded-md border border-input bg-transparent px-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
        <Button type="submit" disabled={pending}>
          {pending ? "Adding…" : "Add"}
        </Button>
      </div>
      {state.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}
    </form>
  );
}
