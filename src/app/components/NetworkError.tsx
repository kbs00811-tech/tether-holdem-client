import { WifiOff, RefreshCw } from "lucide-react";
import { Button } from "./ui/button";

interface NetworkErrorProps {
  onRetry?: () => void;
}

export function NetworkError({ onRetry }: NetworkErrorProps) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center p-8 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
        <WifiOff className="h-10 w-10 text-destructive" />
      </div>
      
      <h3 className="mb-2 text-xl font-semibold text-foreground">
        Connection Failed
      </h3>
      
      <p className="mb-6 max-w-md text-sm text-muted-foreground">
        서버에 Connection Failed. 인터넷 연결을 확인하고 Retry해주세요.
      </p>
      
      <Button onClick={onRetry} className="gap-2">
        <RefreshCw className="h-4 w-4" />
        Retry
      </Button>
    </div>
  );
}
