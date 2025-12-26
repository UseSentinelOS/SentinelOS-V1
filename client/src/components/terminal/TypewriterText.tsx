import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface TypewriterTextProps {
  text: string;
  speed?: number;
  className?: string;
  showCursor?: boolean;
  onComplete?: () => void;
  startDelay?: number;
}

export function TypewriterText({
  text,
  speed = 30,
  className,
  showCursor = true,
  onComplete,
  startDelay = 0,
}: TypewriterTextProps) {
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const indexRef = useRef(0);

  useEffect(() => {
    indexRef.current = 0;
    setDisplayedText("");
    setIsTyping(true);

    const startTimeout = setTimeout(() => {
      const interval = setInterval(() => {
        if (indexRef.current < text.length) {
          setDisplayedText(text.slice(0, indexRef.current + 1));
          indexRef.current++;
        } else {
          clearInterval(interval);
          setIsTyping(false);
          onComplete?.();
        }
      }, speed);

      return () => clearInterval(interval);
    }, startDelay);

    return () => clearTimeout(startTimeout);
  }, [text, speed, startDelay, onComplete]);

  return (
    <span className={cn("font-mono", className)}>
      {displayedText}
      {showCursor && (
        <span
          className={cn(
            "inline-block w-2 h-4 ml-0.5 bg-terminal-green align-middle",
            isTyping ? "animate-blink" : "opacity-0"
          )}
          aria-hidden="true"
        />
      )}
    </span>
  );
}
