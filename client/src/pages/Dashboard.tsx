import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, RefreshCw } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { AgentCard } from "@/components/agents/AgentCard";
import { AgentStats } from "@/components/agents/AgentStats";
import { AgentActivityLog } from "@/components/agents/AgentActivityLog";
import { CreateAgentDialog } from "@/components/agents/CreateAgentDialog";
import { TerminalWindow } from "@/components/terminal/TerminalWindow";
import { TypewriterText } from "@/components/terminal/TypewriterText";
import { AsciiSpinner } from "@/components/terminal/AsciiSpinner";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Agent, ActivityLog, InsertAgent } from "@shared/schema";
import { cn } from "@/lib/utils";

export default function Dashboard() {
  const { toast } = useToast();

  const {
    data: agents = [],
    isLoading: agentsLoading,
    refetch: refetchAgents,
  } = useQuery<Agent[]>({
    queryKey: ["/api/agents"],
  });

  const { data: recentLogs = [], isLoading: logsLoading } = useQuery<ActivityLog[]>({
    queryKey: ["/api/activity-logs", "recent"],
  });

  const createAgentMutation = useMutation({
    mutationFn: async (data: Partial<InsertAgent>) => {
      return apiRequest("POST", "/api/agents", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/agents"] });
      toast({
        title: "Agent Deployed",
        description: "Your new agent is now active.",
      });
    },
    onError: () => {
      toast({
        title: "Deployment Failed",
        description: "Failed to deploy agent. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateAgentMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      return apiRequest("PATCH", `/api/agents/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/agents"] });
    },
  });

  const deleteAgentMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/agents/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/agents"] });
      toast({
        title: "Agent Deleted",
        description: "Agent has been successfully removed.",
      });
    },
  });

  const runningAgents = agents.filter((a) => a.status === "running").length;
  const totalTransactions = agents.reduce(
    (sum, a) => sum + (a.totalTransactions || 0),
    0
  );
  const totalVolume = agents.reduce(
    (sum, a) => sum + (a.currentBalance || 0),
    0
  );
  const avgSuccessRate =
    agents.length > 0
      ? agents.reduce((sum, a) => sum + (a.successRate || 0), 0) / agents.length
      : 0;

  return (
    <div className="flex flex-col h-full">
      <Header title="Dashboard" />

      <main className="flex-1 overflow-auto p-6 space-y-6 grid-background">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="font-display text-2xl font-bold tracking-wide">
              <TypewriterText text="System Overview" speed={40} showCursor={false} />
            </h2>
            <p className="text-sm text-muted-foreground font-mono">
              <span className="text-terminal-green">{">"}</span> Monitor and manage your AI agents
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetchAgents()}
              className="gap-2 font-mono text-xs"
              data-testid="button-refresh-dashboard"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              refresh
            </Button>
            <CreateAgentDialog
              onSubmit={(data) => createAgentMutation.mutate(data)}
              isLoading={createAgentMutation.isPending}
            />
          </div>
        </div>

        <AgentStats
          totalAgents={agents.length}
          runningAgents={runningAgents}
          totalTransactions={totalTransactions}
          totalVolume={totalVolume}
          avgSuccessRate={avgSuccessRate}
        />

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-semibold text-lg">
                Active Agents
              </h3>
              <span className="text-xs font-mono text-muted-foreground">
                {agents.length} total
              </span>
            </div>

            {agentsLoading ? (
              <div className="flex items-center justify-center py-12">
                <AsciiSpinner text="Loading agents..." />
              </div>
            ) : agents.length === 0 ? (
              <TerminalWindow title="no_agents">
                <div className="p-8 text-center space-y-4">
                  <p className="font-mono text-muted-foreground">
                    <span className="text-terminal-green">{">"}</span> No agents deployed yet.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Click "Deploy Agent" to create your first autonomous AI agent.
                  </p>
                </div>
              </TerminalWindow>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {agents.map((agent) => (
                  <AgentCard
                    key={agent.id}
                    agent={agent}
                    onPause={(id) =>
                      updateAgentMutation.mutate({ id, status: "paused" })
                    }
                    onResume={(id) =>
                      updateAgentMutation.mutate({ id, status: "running" })
                    }
                    onDelete={(id) => deleteAgentMutation.mutate(id)}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <h3 className="font-display font-semibold text-lg">
              Recent Activity
            </h3>
            {logsLoading ? (
              <div className="flex items-center justify-center py-12">
                <AsciiSpinner text="Loading activity..." />
              </div>
            ) : (
              <AgentActivityLog logs={recentLogs} maxHeight="500px" />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
