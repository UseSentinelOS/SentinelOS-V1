import { cn } from "@/lib/utils";

type Status = "online" | "running" | "idle" | "paused" | "error" | "offline" | "completed";

interface StatusIndicatorProps {
  status: Status;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
  pulse?: boolean;
}

const statusConfig: Record<
  Status,
  { color: string; label: string; bgColor: string }
> = {
  online: {
    color: "bg-terminal-green",
    bgColor: "bg-terminal-green/20",
    label: "ONLINE",
  },
  running: {
    color: "bg-terminal-green",
    bgColor: "bg-terminal-green/20",
    label: "RUNNING",
  },
  idle: {
    color: "bg-terminal-yellow",
    bgColor: "bg-terminal-yellow/20",
    label: "IDLE",
  },
  paused: {
    color: "bg-terminal-yellow",
    bgColor: "bg-terminal-yellow/20",
    label: "PAUSED",
  },
  error: {
    color: "bg-terminal-red",
    bgColor: "bg-terminal-red/20",
    label: "ERROR",
  },
  offline: {
    color: "bg-muted-foreground",
    bgColor: "bg-muted-foreground/20",
    label: "OFFLINE",
  },
  completed: {
    color: "bg-terminal-blue",
    bgColor: "bg-terminal-blue/20",
    label: "COMPLETED",
  },
};

const sizeConfig = {
  sm: { dot: "w-2 h-2", text: "text-xs" },
  md: { dot: "w-2.5 h-2.5", text: "text-xs" },
  lg: { dot: "w-3 h-3", text: "text-sm" },
};

export function StatusIndicator({
  status,
  showLabel = false,
  size = "md",
  pulse = true,
}: StatusIndicatorProps) {
  const config = statusConfig[status];
  const sizes = sizeConfig[size];

  return (
    <div className="flex items-center gap-2">
      <span className="relative flex">
        <span
          className={cn(
            "rounded-full",
            sizes.dot,
            config.color,
            pulse && (status === "running" || status === "online") && "animate-pulse"
          )}
        />
        {pulse && (status === "running" || status === "online") && (
          <span
            className={cn(
              "absolute inset-0 rounded-full animate-ping",
              config.color,
              "opacity-50"
            )}
          />
        )}
      </span>
      {showLabel && (
        <span
          className={cn(
            "font-mono uppercase tracking-wider",
            sizes.text,
            status === "error" && "text-terminal-red",
            status === "running" && "text-terminal-green",
            status === "online" && "text-terminal-green",
            status === "idle" && "text-terminal-yellow",
            status === "paused" && "text-terminal-yellow",
            status === "completed" && "text-terminal-blue",
            status === "offline" && "text-muted-foreground"
          )}
        >
          {config.label}
        </span>
      )}
    </div>
  );
}
