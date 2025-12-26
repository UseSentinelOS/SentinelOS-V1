import { cn } from "@/lib/utils";

interface TerminalWindowProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  showDots?: boolean;
  variant?: "default" | "minimal";
  "data-testid"?: string;
}

export function TerminalWindow({
  title = "terminal",
  children,
  className,
  showDots = true,
  variant = "default",
  "data-testid": dataTestId,
}: TerminalWindowProps) {
  return (
    <div
      className={cn(
        "terminal-window rounded-md overflow-hidden",
        variant === "default" && "glow-border",
        className
      )}
      data-testid={dataTestId || `terminal-${title}`}
    >
      {variant === "default" && (
        <div className="terminal-header">
          {showDots && (
            <div className="flex gap-1.5">
              <span className="terminal-dot red" />
              <span className="terminal-dot yellow" />
              <span className="terminal-dot green" />
            </div>
          )}
          <span className="ml-2 text-xs text-muted-foreground font-mono uppercase tracking-wider">
            {title}
          </span>
        </div>
      )}
      <div className="relative">
        {children}
        <div className="absolute inset-0 pointer-events-none scanline-overlay opacity-30" />
      </div>
    </div>
  );
}
