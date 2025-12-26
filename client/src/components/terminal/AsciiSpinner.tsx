import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

const spinnerFrames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

interface AsciiSpinnerProps {
  className?: string;
  speed?: number;
  text?: string;
}

export function AsciiSpinner({
  className,
  speed = 80,
  text,
}: AsciiSpinnerProps) {
  const [frameIndex, setFrameIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setFrameIndex((prev) => (prev + 1) % spinnerFrames.length);
    }, speed);

    return () => clearInterval(interval);
  }, [speed]);

  return (
    <span className={cn("font-mono text-terminal-purple", className)}>
      {spinnerFrames[frameIndex]}
      {text && <span className="ml-2">{text}</span>}
    </span>
  );
}
