import { useState, useCallback, useRef, forwardRef } from "react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Spark {
  id: number;
  x: number;
  y: number;
  angle: number;
}

interface ElectricButtonProps extends ButtonProps {
  electricColor?: string;
  sparkCount?: number;
}

export const ElectricButton = forwardRef<HTMLButtonElement, ElectricButtonProps>(
  (
    {
      children,
      className,
      onClick,
      electricColor = "hsl(var(--terminal-purple))",
      sparkCount = 6,
      ...props
    },
    ref
  ) => {
    const [sparks, setSparks] = useState<Spark[]>([]);
    const [isGlitching, setIsGlitching] = useState(false);
    const internalRef = useRef<HTMLButtonElement>(null);
    const buttonRef = ref || internalRef;
    const sparkIdRef = useRef(0);

    const handleClick = useCallback(
      (e: React.MouseEvent<HTMLButtonElement>) => {
        setIsGlitching(true);
        setTimeout(() => setIsGlitching(false), 150);

        const target = e.currentTarget;
        if (target) {
          const rect = target.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;

          const newSparks: Spark[] = Array.from({ length: sparkCount }, () => ({
            id: sparkIdRef.current++,
            x,
            y,
            angle: Math.random() * 360,
          }));

          setSparks((prev) => [...prev, ...newSparks]);

          setTimeout(() => {
            setSparks((prev) =>
              prev.filter((s) => !newSparks.find((ns) => ns.id === s.id))
            );
          }, 400);
        }

        onClick?.(e);
      },
      [onClick, sparkCount]
    );

    return (
      <Button
        ref={buttonRef as React.RefObject<HTMLButtonElement>}
        className={cn(
          "relative overflow-visible transition-all duration-100",
          isGlitching && "animate-glitch-skew",
          className
        )}
        onClick={handleClick}
        style={
          {
            "--electric-color": electricColor,
          } as React.CSSProperties
        }
        {...props}
      >
        {children}
        {sparks.map((spark) => (
          <span
            key={spark.id}
            className="pointer-events-none absolute z-50"
            style={{
              left: spark.x,
              top: spark.y,
              transform: `rotate(${spark.angle}deg)`,
            }}
          >
            <span
              className="absolute h-0.5 w-3 animate-[spark_0.4s_ease-out_forwards]"
              style={{
                background: `linear-gradient(90deg, ${electricColor}, transparent)`,
                transformOrigin: "left center",
              }}
            />
          </span>
        ))}
        <style>{`
          @keyframes spark {
            0% {
              opacity: 1;
              transform: scaleX(0) translateX(0);
            }
            50% {
              opacity: 1;
              transform: scaleX(1) translateX(10px);
            }
            100% {
              opacity: 0;
              transform: scaleX(0.5) translateX(25px);
            }
          }
        `}</style>
      </Button>
    );
  }
);

ElectricButton.displayName = "ElectricButton";
