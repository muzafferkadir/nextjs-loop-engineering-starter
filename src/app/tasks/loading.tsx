export default function TasksLoading() {
  return (
    <main className="mx-auto max-w-2xl space-y-6 p-4 py-10">
      <div className="h-8 w-32 animate-pulse rounded-md bg-muted" />
      <div className="h-9 w-full animate-pulse rounded-md bg-muted" />
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    </main>
  );
}
