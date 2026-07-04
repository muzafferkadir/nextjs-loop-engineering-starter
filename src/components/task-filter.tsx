"use client";

import { useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { TASK_PRIORITIES, TASK_STATUSES } from "@/db/schema";
import { priorityLabel, statusLabel } from "@/lib/tasks";

const selectClassName =
  "h-9 rounded-md border border-input bg-transparent px-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

export function TaskFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const statusRef = useRef<HTMLSelectElement>(null);
  const priorityRef = useRef<HTMLSelectElement>(null);

  // Build the next URL from both selects' current DOM values rather than
  // the searchParams snapshot: changing one select right after the other
  // (before the previous navigation commits) would otherwise drop it.
  function navigate() {
    const params = new URLSearchParams();
    const status = statusRef.current?.value;
    const priority = priorityRef.current?.value;
    if (status && status !== "all") params.set("status", status);
    if (priority && priority !== "all") params.set("priority", priority);
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  return (
    <div className="flex gap-2">
      <select
        ref={statusRef}
        aria-label="Filter by status"
        className={selectClassName}
        defaultValue={searchParams.get("status") ?? "all"}
        onChange={navigate}
      >
        <option value="all">All statuses</option>
        {TASK_STATUSES.map((status) => (
          <option key={status} value={status}>
            {statusLabel(status)}
          </option>
        ))}
      </select>
      <select
        ref={priorityRef}
        aria-label="Filter by priority"
        className={selectClassName}
        defaultValue={searchParams.get("priority") ?? "all"}
        onChange={navigate}
      >
        <option value="all">All priorities</option>
        {TASK_PRIORITIES.map((priority) => (
          <option key={priority} value={priority}>
            {priorityLabel(priority)}
          </option>
        ))}
      </select>
    </div>
  );
}
