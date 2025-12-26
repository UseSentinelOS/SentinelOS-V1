import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Search, Filter, RefreshCw, Grid, List } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { AgentCard } from "@/components/agents/AgentCard";
import { CreateAgentDialog } from "@/components/agents/CreateAgentDialog";
import { TerminalInput } from "@/components/terminal/TerminalInput";
import { AsciiSpinner } from "@/components/terminal/AsciiSpinner";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Agent, InsertAgent } from "@shared/schema";
import { cn } from "@/lib/utils";

export default function Agents() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const {
    data: agents = [],
    isLoading,
    refetch,
  } = useQuery<Agent[]>({
    queryKey: ["/api/agents"],
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

  const executeAgentMutation = useMutation({
    mutationFn: async (id: number) => {
      const agent = agents.find(a => a.id === id);
      const decisionRes = await apiRequest("POST", `/api/agents/${id}/decide`, {});
      const decision = await decisionRes.json();
      
      const actionParams: Record<string, unknown> = {};
      if (decision.action === "swap") {
        actionParams.inputToken = "SOL";
        actionParams.outputToken = "USDC";
        actionParams.amount = 0.01;
      } else if (decision.action === "stake") {
        actionParams.token = "SOL";
        actionParams.amount = 0.01;
      }
      
      const execRes = await apiRequest("POST", `/api/agents/${id}/execute`, {
        action: decision.action,
        parameters: actionParams,
      });
      return execRes.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/agents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activity-logs/recent"] });
      toast({
        title: data.simulation ? "Simulated Action Complete" : "Action Executed",
        description: data.simulation 
          ? `${data.action} executed in dev mode - real execution after publish`
          : `Successfully executed ${data.action}`,
      });
    },
    onError: (error) => {
      toast({
        title: "Execution Failed",
        description: error instanceof Error ? error.message : "Failed to execute agent action",
        variant: "destructive",
      });
    },
  });

  const filteredAgents = agents.filter((agent) => {
    const matchesSearch =
      searchQuery === "" ||
      agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.description?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || agent.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex flex-col h-full">
      <Header title="Agents" />

      <main className="flex-1 overflow-auto p-6 space-y-6 grid-background">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative w-64">
              <TerminalInput
                placeholder="search agents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                data-testid="input-search-agents"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger
                className="w-32 font-mono text-xs"
                data-testid="select-status-filter"
              >
                <Filter className="w-3.5 h-3.5 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="font-mono">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="running">Running</SelectItem>
                <SelectItem value="idle">Idle</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="error">Error</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center border border-border rounded-md">
              <Button
                size="icon"
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                onClick={() => setViewMode("grid")}
                className="rounded-r-none"
                data-testid="button-view-grid"
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                size="icon"
                variant={viewMode === "list" ? "secondary" : "ghost"}
                onClick={() => setViewMode("list")}
                className="rounded-l-none"
                data-testid="button-view-list"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="gap-2 font-mono text-xs"
              data-testid="button-refresh-agents"
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

        <div className="text-xs font-mono text-muted-foreground">
          <span className="text-terminal-green">{">"}</span> Showing{" "}
          {filteredAgents.length} of {agents.length} agents
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <AsciiSpinner text="Loading agents..." />
          </div>
        ) : filteredAgents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
            <p className="font-mono text-muted-foreground">
              {searchQuery || statusFilter !== "all"
                ? "No agents match your filters."
                : "No agents deployed yet."}
            </p>
            {searchQuery === "" && statusFilter === "all" && (
              <p className="text-xs text-muted-foreground">
                Click "Deploy Agent" to create your first autonomous AI agent.
              </p>
            )}
          </div>
        ) : (
          <div
            className={cn(
              viewMode === "grid"
                ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
                : "flex flex-col gap-4"
            )}
          >
            {filteredAgents.map((agent) => (
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
                onExecute={(id) => executeAgentMutation.mutate(id)}
                isExecuting={executeAgentMutation.isPending}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
