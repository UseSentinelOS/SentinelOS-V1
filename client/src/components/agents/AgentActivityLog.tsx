import { useEffect, useRef } from "react";
import { formatDistanceToNow } from "date-fns";
import { TerminalWindow } from "@/components/terminal/TerminalWindow";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ActivityLog } from "@shared/schema";
import { cn } from "@/lib/utils";

interface AgentActivityLogProps {
  logs: ActivityLog[];
  className?: string;
  maxHeight?: string;
  autoScroll?: boolean;
}

const levelColors: Record<string, string> = {
  info: "text-terminal-blue",
  success: "text-terminal-green",
  warning: "text-terminal-yellow",
  error: "text-terminal-red",
};

const levelPrefixes: Record<string, string> = {
  info: "[INFO]",
  success: "[OK]",
  warning: "[WARN]",
  error: "[ERR]",
};

export function AgentActivityLog({
  logs,
  className,
  maxHeight = "300px",
  autoScroll = true,
}: AgentActivityLogProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  return (
    <TerminalWindow title="activity_log" className={className}>
      <ScrollArea
        className="p-4 font-mono text-xs"
        style={{ maxHeight }}
        ref={scrollRef as React.RefObject<HTMLDivElement>}
      >
        {logs.length === 0 ? (
          <div className="text-muted-foreground py-8 text-center">
            <span className="text-terminal-green">{">"}</span> No activity yet...
          </div>
        ) : (
          <div className="space-y-1">
            {logs.map((log, index) => (
              <div
                key={log.id}
                className={cn(
                  "flex gap-2 animate-terminal-line",
                  "opacity-0"
                )}
                style={{
                  animationDelay: `${index * 50}ms`,
                  animationFillMode: "forwards",
                }}
                data-testid={`log-entry-${log.id}`}
              >
                <span className="text-muted-foreground shrink-0 w-16">
                  {log.createdAt
                    ? formatDistanceToNow(new Date(log.createdAt), {
                        addSuffix: false,
                      })
                    : "now"}
                </span>
                <span
                  className={cn(
                    "shrink-0 w-14",
                    levelColors[log.level || "info"]
                  )}
                >
                  {levelPrefixes[log.level || "info"]}
                </span>
                <span className="text-foreground">{log.action}</span>
                {log.details && (
                  <span className="text-muted-foreground truncate">
                    - {log.details}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </TerminalWindow>
  );
}
