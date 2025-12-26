import { forwardRef } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface TerminalInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  prompt?: string;
}

export const TerminalInput = forwardRef<HTMLInputElement, TerminalInputProps>(
  ({ className, prompt = ">", ...props }, ref) => {
    return (
      <div className="relative flex items-center">
        <span className="absolute left-3 text-terminal-green font-mono text-sm pointer-events-none">
          {prompt}
        </span>
        <Input
          ref={ref}
          className={cn(
            "pl-8 font-mono bg-transparent border-terminal-purple/30",
            "focus:border-terminal-purple focus:ring-terminal-purple/30",
            "placeholder:text-muted-foreground/50",
            className
          )}
          {...props}
        />
      </div>
    );
  }
);

TerminalInput.displayName = "TerminalInput";
