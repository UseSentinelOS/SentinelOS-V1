import { Bot, Activity, TrendingUp, Zap, DollarSign, CheckCircle } from "lucide-react";
import { TerminalWindow } from "@/components/terminal/TerminalWindow";
import { GlitchText } from "@/components/terminal/GlitchText";
import { cn } from "@/lib/utils";

interface StatItem {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: "up" | "down" | "neutral";
  color?: string;
}

interface AgentStatsProps {
  totalAgents: number;
  runningAgents: number;
  totalTransactions: number;
  totalVolume: number;
  avgSuccessRate: number;
  className?: string;
}

export function AgentStats({
  totalAgents,
  runningAgents,
  totalTransactions,
  totalVolume,
  avgSuccessRate,
  className,
}: AgentStatsProps) {
  const stats: StatItem[] = [
    {
      label: "Total Agents",
      value: totalAgents,
      icon: <Bot className="w-5 h-5" />,
      color: "text-terminal-purple",
    },
    {
      label: "Active",
      value: runningAgents,
      icon: <Activity className="w-5 h-5" />,
      color: "text-terminal-green",
    },
    {
      label: "Transactions",
      value: totalTransactions,
      icon: <Zap className="w-5 h-5" />,
      color: "text-terminal-blue",
    },
    {
      label: "Volume",
      value: `${totalVolume.toFixed(2)} SOL`,
      icon: <DollarSign className="w-5 h-5" />,
      color: "text-terminal-yellow",
    },
    {
      label: "Success Rate",
      value: `${avgSuccessRate.toFixed(1)}%`,
      icon: <CheckCircle className="w-5 h-5" />,
      color:
        avgSuccessRate >= 80
          ? "text-terminal-green"
          : avgSuccessRate >= 50
          ? "text-terminal-yellow"
          : "text-terminal-red",
    },
  ];

  return (
    <div className={cn("grid grid-cols-2 md:grid-cols-5 gap-4", className)}>
      {stats.map((stat, index) => (
        <TerminalWindow
          key={stat.label}
          variant="minimal"
          className="p-4"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1">
              <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
                {stat.label}
              </p>
              <GlitchText
                as="p"
                className={cn("text-xl font-display font-bold", stat.color)}
                glitchOnClick
                glitchOnHover={false}
              >
                {String(stat.value)}
              </GlitchText>
            </div>
            <div className={cn("p-2 rounded-md bg-card", stat.color)}>
              {stat.icon}
            </div>
          </div>
        </TerminalWindow>
      ))}
    </div>
  );
}
