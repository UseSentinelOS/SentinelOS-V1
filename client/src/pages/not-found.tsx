import { Home, AlertTriangle } from "lucide-react";
import { TerminalWindow } from "@/components/terminal/TerminalWindow";
import { GlitchText } from "@/components/terminal/GlitchText";
import { ElectricButton } from "@/components/terminal/ElectricButton";
import { TypewriterText } from "@/components/terminal/TypewriterText";

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-screen p-6 grid-background">
      <TerminalWindow title="error_404" className="max-w-md w-full">
        <div className="p-8 space-y-6 text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-terminal-red/20 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-terminal-red" />
          </div>

          <div className="space-y-2">
            <GlitchText
              as="h1"
              className="font-display text-4xl font-bold text-terminal-red"
              glitchOnHover
            >
              404
            </GlitchText>
            <h2 className="font-display text-xl font-semibold">
              Page Not Found
            </h2>
          </div>

          <div className="font-mono text-sm text-muted-foreground space-y-1">
            <p>
              <span className="text-terminal-red">[ERR]</span>{" "}
              <TypewriterText
                text="The requested resource could not be located."
                speed={20}
                showCursor={false}
              />
            </p>
            <p className="text-xs">
              <span className="text-terminal-green">{">"}</span> Check the URL
              or return to the dashboard.
            </p>
          </div>

          <ElectricButton
            className="gap-2 font-mono uppercase"
            onClick={() => window.location.href = "/"}
          >
            <Home className="w-4 h-4" />
            Return Home
          </ElectricButton>
        </div>
      </TerminalWindow>
    </div>
  );
}
