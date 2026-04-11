export function RoomCardSkeleton() {
  return (
    <div className="rounded-lg border border-border bg-card p-4 animate-pulse">
      <div className="mb-3 flex items-start justify-between">
        <div className="h-5 w-32 rounded bg-muted/50" />
        <div className="h-6 w-16 rounded-full bg-muted/50" />
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="h-4 w-20 rounded bg-muted/30" />
          <div className="h-4 w-24 rounded bg-muted/30" />
        </div>
        <div className="flex items-center justify-between">
          <div className="h-4 w-16 rounded bg-muted/30" />
          <div className="h-4 w-20 rounded bg-muted/30" />
        </div>
      </div>
      
      <div className="mt-4 h-9 w-full rounded bg-muted/50" />
    </div>
  );
}
