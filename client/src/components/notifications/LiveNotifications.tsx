import { useEffect } from "react";
import { Wifi, WifiOff, Zap, Bot, ArrowRightLeft, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useWebSocket, type WebSocketMessage } from "@/hooks/useWebSocket";
import { cn } from "@/lib/utils";
import { queryClient } from "@/lib/queryClient";

interface LiveNotificationsProps {
  showStatus?: boolean;
}

export function LiveNotifications({ showStatus = true }: LiveNotificationsProps) {
  const { isConnected, lastMessage } = useWebSocket();
  const { toast } = useToast();

  useEffect(() => {
    if (!lastMessage) return;

    switch (lastMessage.type) {
      case "agent_created":
        toast({
          title: "Agent Deployed",
          description: `New agent "${(lastMessage.data as { name?: string })?.name || "Unknown"}" is now active.`,
        });
        queryClient.invalidateQueries({ queryKey: ["/api/agents"] });
        queryClient.invalidateQueries({ queryKey: ["/api/activity-logs"] });
        break;

      case "agent_status_changed":
        const statusData = lastMessage.data as { agent?: { name?: string }; newStatus?: string };
        toast({
          title: "Agent Status Changed",
          description: `${statusData.agent?.name || "Agent"} is now ${statusData.newStatus}.`,
        });
        queryClient.invalidateQueries({ queryKey: ["/api/agents"] });
        queryClient.invalidateQueries({ queryKey: ["/api/activity-logs"] });
        break;

      case "agent_updated":
        queryClient.invalidateQueries({ queryKey: ["/api/agents"] });
        break;

      case "agent_deleted":
        const deleteData = lastMessage.data as { name?: string };
        toast({
          title: "Agent Deleted",
          description: `${deleteData.name || "Agent"} has been removed.`,
          variant: "destructive",
        });
        queryClient.invalidateQueries({ queryKey: ["/api/agents"] });
        break;

      case "transaction_created":
        toast({
          title: "New Transaction",
          description: "A new transaction has been recorded.",
        });
        queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
        queryClient.invalidateQueries({ queryKey: ["/api/activity-logs"] });
        break;
    }
  }, [lastMessage, toast]);

  if (!showStatus) return null;

  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1.5 font-mono text-xs",
        isConnected
          ? "text-terminal-green border-terminal-green/30"
          : "text-terminal-red border-terminal-red/30"
      )}
      data-testid="badge-connection-status"
    >
      {isConnected ? (
        <>
          <Wifi className="w-3 h-3" />
          Live
        </>
      ) : (
        <>
          <WifiOff className="w-3 h-3" />
          Offline
        </>
      )}
    </Badge>
  );
}
