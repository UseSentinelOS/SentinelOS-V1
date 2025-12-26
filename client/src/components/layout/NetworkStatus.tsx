import { useState, useEffect } from "react";
import { Wifi, WifiOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const network = "mainnet";

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <div className="flex items-center gap-2">
      <Badge
        variant="outline"
        className={cn(
          "font-mono text-xs uppercase gap-1.5",
          isOnline
            ? "border-terminal-green/30 text-terminal-green"
            : "border-terminal-red/30 text-terminal-red"
        )}
        data-testid="badge-network-status"
      >
        {isOnline ? (
          <Wifi className="w-3 h-3" />
        ) : (
          <WifiOff className="w-3 h-3" />
        )}
        {network}
      </Badge>
    </div>
  );
}
