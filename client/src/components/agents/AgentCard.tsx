import { Play, Pause, Trash2, Settings, Activity, Zap } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TerminalWindow } from "@/components/terminal/TerminalWindow";
import { StatusIndicator } from "@/components/terminal/StatusIndicator";
import { GlitchText } from "@/components/terminal/GlitchText";
import type { Agent } from "@shared/schema";
import { cn } from "@/lib/utils";

interface AgentCardProps {
  agent: Agent;
  onPause?: (id: number) => void;
  onResume?: (id: number) => void;
  onDelete?: (id: number) => void;
  onSettings?: (id: number) => void;
  onSelect?: (id: number) => void;
  onExecute?: (id: number) => void;
  isSelected?: boolean;
  isExecuting?: boolean;
}

const taskTypeLabels: Record<string, string> = {
  defi_swap: "DeFi Swap",
  yield_farming: "Yield Farm",
  auto_dca: "Auto DCA",
  hedging: "Hedging",
  payment: "Payment",
  arbitrage: "Arbitrage",
  monitoring: "Monitor",
};

export function AgentCard({
  agent,
  onPause,
  onResume,
  onDelete,
  onSettings,
  onSelect,
  onExecute,
  isSelected,
  isExecuting,
}: AgentCardProps) {
  const isRunning = agent.status === "running";
  const isPaused = agent.status === "paused";

  return (
    <TerminalWindow
      title={`agent_${agent.id}`}
      className={cn(
        "cursor-pointer transition-all duration-200",
        isSelected && "ring-2 ring-terminal-purple"
      )}
    >
      <div
        className="p-4 space-y-4"
        onClick={() => onSelect?.(agent.id)}
        data-testid={`card-agent-${agent.id}`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <GlitchText
                as="h3"
                className="font-display font-semibold text-foreground truncate"
                glitchOnClick={false}
                glitchOnHover
              >
                {agent.name}
              </GlitchText>
              <StatusIndicator
                status={agent.status as "running" | "idle" | "paused" | "error"}
                showLabel
                size="sm"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1 font-mono truncate">
              {agent.description || "No description"}
            </p>
          </div>
          <Badge variant="secondary" className="font-mono text-xs shrink-0">
            {taskTypeLabels[agent.taskType] || agent.taskType}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs font-mono">
          <div className="space-y-1">
            <span className="text-muted-foreground">Balance</span>
            <p className="text-terminal-green font-semibold">
              {(agent.currentBalance || 0).toFixed(4)} SOL
            </p>
          </div>
          <div className="space-y-1">
            <span className="text-muted-foreground">Budget Limit</span>
            <p className="text-foreground">
              {(agent.budgetLimit || 0).toFixed(2)} SOL
            </p>
          </div>
          <div className="space-y-1">
            <span className="text-muted-foreground">Transactions</span>
            <p className="text-foreground">{agent.totalTransactions || 0}</p>
          </div>
          <div className="space-y-1">
            <span className="text-muted-foreground">Success Rate</span>
            <p
              className={cn(
                "font-semibold",
                (agent.successRate || 0) >= 80
                  ? "text-terminal-green"
                  : (agent.successRate || 0) >= 50
                  ? "text-terminal-yellow"
                  : "text-terminal-red"
              )}
            >
              {(agent.successRate || 0).toFixed(1)}%
            </p>
          </div>
        </div>

        <div
          className="flex items-center gap-2 pt-2 border-t border-border"
          onClick={(e) => e.stopPropagation()}
        >
          {isRunning && (
            <>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onExecute?.(agent.id)}
                disabled={isExecuting}
                className="text-terminal-purple hover:text-terminal-purple gap-1.5 font-mono text-xs"
                data-testid={`button-execute-agent-${agent.id}`}
              >
                <Zap className={cn("w-3.5 h-3.5", isExecuting && "animate-pulse")} />
                {isExecuting ? "exec..." : "exec"}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onPause?.(agent.id)}
                className="text-terminal-yellow hover:text-terminal-yellow gap-1.5 font-mono text-xs"
                data-testid={`button-pause-agent-${agent.id}`}
              >
                <Pause className="w-3.5 h-3.5" />
                pause
              </Button>
            </>
          )}
          {(isPaused || agent.status === "idle") && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onResume?.(agent.id)}
              className="text-terminal-green hover:text-terminal-green gap-1.5 font-mono text-xs"
              data-testid={`button-resume-agent-${agent.id}`}
            >
              <Play className="w-3.5 h-3.5" />
              run
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onSettings?.(agent.id)}
            className="gap-1.5 font-mono text-xs"
            data-testid={`button-settings-agent-${agent.id}`}
          >
            <Settings className="w-3.5 h-3.5" />
            config
          </Button>
          <div className="flex-1" />
          <Button
            size="icon"
            variant="ghost"
            onClick={() => onDelete?.(agent.id)}
            className="text-terminal-red hover:text-terminal-red"
            data-testid={`button-delete-agent-${agent.id}`}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </TerminalWindow>
  );
}
