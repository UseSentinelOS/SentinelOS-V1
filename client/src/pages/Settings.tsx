import { Header } from "@/components/layout/Header";
import { TerminalWindow } from "@/components/terminal/TerminalWindow";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

export default function Settings() {
  return (
    <div className="flex flex-col h-full">
      <Header title="Settings" />

      <main className="flex-1 overflow-auto p-6 space-y-6 grid-background">
        <div className="space-y-1">
          <h2 className="font-display text-2xl font-bold tracking-wide">
            Settings
          </h2>
          <p className="text-sm text-muted-foreground font-mono">
            <span className="text-terminal-green">{">"}</span> Configure your
            SentinelOS preferences
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-4xl">
          <TerminalWindow title="appearance">
            <div className="p-6 space-y-6">
              <h3 className="font-display font-semibold">Appearance</h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="font-mono text-sm">Scanline Effect</Label>
                    <p className="text-xs text-muted-foreground">
                      Enable CRT scanline overlay
                    </p>
                  </div>
                  <Switch defaultChecked data-testid="switch-scanlines" />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="font-mono text-sm">Glitch Effects</Label>
                    <p className="text-xs text-muted-foreground">
                      Enable electric glitch animations
                    </p>
                  </div>
                  <Switch defaultChecked data-testid="switch-glitch" />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="font-mono text-sm">Reduced Motion</Label>
                    <p className="text-xs text-muted-foreground">
                      Minimize animations for accessibility
                    </p>
                  </div>
                  <Switch data-testid="switch-reduced-motion" />
                </div>
              </div>
            </div>
          </TerminalWindow>

          <TerminalWindow title="network">
            <div className="p-6 space-y-6">
              <h3 className="font-display font-semibold">Network</h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="font-mono text-sm">Network</Label>
                    <p className="text-xs text-muted-foreground">
                      Current Solana network
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className="font-mono text-terminal-green border-terminal-green/30"
                  >
                    Mainnet
                  </Badge>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="font-mono text-sm">RPC Endpoint</Label>
                    <p className="text-xs text-muted-foreground">
                      Solana RPC URL
                    </p>
                  </div>
                  <code className="text-xs font-mono text-muted-foreground">
                    api.mainnet-beta.solana.com
                  </code>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="font-mono text-sm">Auto-reconnect</Label>
                    <p className="text-xs text-muted-foreground">
                      Automatically reconnect wallet
                    </p>
                  </div>
                  <Switch defaultChecked data-testid="switch-auto-reconnect" />
                </div>
              </div>
            </div>
          </TerminalWindow>

          <TerminalWindow title="notifications">
            <div className="p-6 space-y-6">
              <h3 className="font-display font-semibold">Notifications</h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="font-mono text-sm">Agent Alerts</Label>
                    <p className="text-xs text-muted-foreground">
                      Notify on agent status changes
                    </p>
                  </div>
                  <Switch defaultChecked data-testid="switch-agent-alerts" />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="font-mono text-sm">Transaction Alerts</Label>
                    <p className="text-xs text-muted-foreground">
                      Notify on transaction completion
                    </p>
                  </div>
                  <Switch defaultChecked data-testid="switch-tx-alerts" />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="font-mono text-sm">Error Alerts</Label>
                    <p className="text-xs text-muted-foreground">
                      Notify on errors and failures
                    </p>
                  </div>
                  <Switch defaultChecked data-testid="switch-error-alerts" />
                </div>
              </div>
            </div>
          </TerminalWindow>

          <TerminalWindow title="about">
            <div className="p-6 space-y-6">
              <h3 className="font-display font-semibold">About</h3>

              <div className="space-y-4 font-mono text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Version</span>
                  <span>1.0.0</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Build</span>
                  <span className="text-terminal-purple">alpha</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Network</span>
                  <span className="text-terminal-green">Solana</span>
                </div>

                <Separator />

                <p className="text-xs text-muted-foreground leading-relaxed">
                  SentinelOS is an AI-Powered Zero-Knowledge Autonomous Agent
                  Ecosystem built on Solana. Deploy, monitor, and manage
                  autonomous AI agents for DeFi operations with unparalleled
                  security and privacy.
                </p>
              </div>
            </div>
          </TerminalWindow>
        </div>
      </main>
    </div>
  );
}
