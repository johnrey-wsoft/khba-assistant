import { Skeleton } from "@/components/ui/skeleton";

// Shown in the chat pane (the sidebar layout persists) while a conversation's
// history loads on the server during navigation.
export default function Loading() {
  return (
    <div className="flex min-w-0 flex-1 flex-col">
      {/* Header */}
      <div className="flex flex-none items-center gap-3 border-b border-border bg-card/85 px-6 py-3">
        <Skeleton className="size-9 rounded-md" />
        <div className="flex flex-1 flex-col gap-1.5">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>

      {/* Messages */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6">
          <div className="flex justify-end">
            <Skeleton className="h-10 w-2/3 rounded-2xl" />
          </div>
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-11/12" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="mt-1 h-20 w-full rounded-xl" />
          </div>
          <div className="flex justify-end">
            <Skeleton className="h-10 w-1/2 rounded-2xl" />
          </div>
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-10/12" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
      </div>

      {/* Composer */}
      <div className="flex-none border-t border-border p-4">
        <Skeleton className="h-12 w-full rounded-2xl" />
      </div>
    </div>
  );
}
