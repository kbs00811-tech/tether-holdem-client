export function TableSkeleton() {
  return (
    <div className="flex h-full items-center justify-center bg-background">
      <div className="relative flex h-[400px] w-full max-w-4xl items-center justify-center">
        {/* Table outline */}
        <div className="absolute inset-0 rounded-full border-8 border-border/20 bg-card/50 animate-pulse" />
        
        {/* Player positions */}
        {[...Array(9)].map((_, i) => {
          const angle = (i * 360) / 9;
          const radius = 45;
          const x = 50 + radius * Math.cos((angle * Math.PI) / 180);
          const y = 50 + radius * Math.sin((angle * Math.PI) / 180);
          
          return (
            <div
              key={i}
              className="absolute h-16 w-20 rounded-lg bg-muted/50 animate-pulse"
              style={{
                left: `${x}%`,
                top: `${y}%`,
                transform: "translate(-50%, -50%)",
                animationDelay: `${i * 0.1}s`,
              }}
            />
          );
        })}
        
        {/* Center area */}
        <div className="z-10 flex flex-col items-center gap-2">
          <div className="h-4 w-32 rounded bg-muted/50 animate-pulse" />
          <div className="h-3 w-24 rounded bg-muted/30 animate-pulse" style={{ animationDelay: "0.2s" }} />
        </div>
      </div>
    </div>
  );
}
