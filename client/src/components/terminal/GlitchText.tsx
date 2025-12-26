import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";

interface GlitchTextProps {
  children: string;
  className?: string;
  as?: "h1" | "h2" | "h3" | "h4" | "p" | "span" | "div";
  glitchOnHover?: boolean;
  glitchOnClick?: boolean;
}

export function GlitchText({
  children,
  className,
  as: Component = "span",
  glitchOnHover = false,
  glitchOnClick = true,
}: GlitchTextProps) {
  const [isGlitching, setIsGlitching] = useState(false);

  const triggerGlitch = useCallback(() => {
    setIsGlitching(true);
    setTimeout(() => setIsGlitching(false), 200);
  }, []);

  return (
    <Component
      className={cn(
        "relative inline-block",
        isGlitching && "animate-glitch animate-rgb-split",
        className
      )}
      onMouseEnter={glitchOnHover ? triggerGlitch : undefined}
      onClick={glitchOnClick ? triggerGlitch : undefined}
      data-text={children}
    >
      {children}
      {isGlitching && (
        <>
          <span
            className="absolute inset-0 text-[#ff0000] opacity-70"
            style={{ clipPath: "inset(45% 0 35% 0)", transform: "translateX(-2px)" }}
            aria-hidden="true"
          >
            {children}
          </span>
          <span
            className="absolute inset-0 text-[#00ffff] opacity-70"
            style={{ clipPath: "inset(25% 0 55% 0)", transform: "translateX(2px)" }}
            aria-hidden="true"
          >
            {children}
          </span>
        </>
      )}
    </Component>
  );
}
