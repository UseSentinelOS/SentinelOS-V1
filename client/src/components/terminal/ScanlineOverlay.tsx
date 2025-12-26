import { cn } from "@/lib/utils";

interface ScanlineOverlayProps {
  className?: string;
  intensity?: "light" | "medium" | "heavy";
}

export function ScanlineOverlay({
  className,
  intensity = "light",
}: ScanlineOverlayProps) {
  const opacityMap = {
    light: "opacity-20",
    medium: "opacity-40",
    heavy: "opacity-60",
  };

  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-0 z-[9999]",
        opacityMap[intensity],
        className
      )}
      aria-hidden="true"
    >
      <div
        className="absolute inset-0"
        style={{
          background: `repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            hsl(var(--terminal-purple) / 0.03) 2px,
            hsl(var(--terminal-purple) / 0.03) 4px
          )`,
        }}
      />
      <div
        className="absolute inset-0 animate-scanline"
        style={{
          background: `linear-gradient(
            180deg,
            transparent 0%,
            hsl(var(--terminal-purple) / 0.05) 50%,
            transparent 100%
          )`,
          height: "100px",
        }}
      />
    </div>
  );
}
