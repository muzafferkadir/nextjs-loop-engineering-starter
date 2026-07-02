"use client";

import { Button } from "@/components/ui/button";

export default function TasksError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex max-w-2xl flex-col items-center gap-4 p-4 py-20 text-center">
      <h1 className="text-xl font-semibold">Something went wrong</h1>
      <p className="text-sm text-muted-foreground">
        {error.digest ? `Error reference: ${error.digest}` : "Failed to load tasks."}
      </p>
      <Button onClick={reset} variant="outline">
        Try again
      </Button>
    </main>
  );
}
