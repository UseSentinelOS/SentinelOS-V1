import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { RefreshCw, Filter } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { AgentActivityLog } from "@/components/agents/AgentActivityLog";
import { AsciiSpinner } from "@/components/terminal/AsciiSpinner";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ActivityLog, Agent } from "@shared/schema";

export default function Activity() {
  const [agentFilter, setAgentFilter] = useState<string>("all");
  const [levelFilter, setLevelFilter] = useState<string>("all");

  const { data: agents = [] } = useQuery<Agent[]>({
    queryKey: ["/api/agents"],
  });

  const {
    data: logs = [],
    isLoading,
    refetch,
    isFetching,
  } = useQuery<ActivityLog[]>({
    queryKey: ["/api/activity-logs"],
  });

  const filteredLogs = logs.filter((log) => {
    const matchesAgent =
      agentFilter === "all" || log.agentId.toString() === agentFilter;
    const matchesLevel = levelFilter === "all" || log.level === levelFilter;
    return matchesAgent && matchesLevel;
  });

  return (
    <div className="flex flex-col h-full">
      <Header title="Activity" />

      <main className="flex-1 overflow-auto p-6 space-y-6 grid-background">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="font-display text-2xl font-bold tracking-wide">
              Activity Logs
            </h2>
            <p className="text-sm text-muted-foreground font-mono">
              <span className="text-terminal-green">{">"}</span> Real-time agent
              activity and system events
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <Select value={agentFilter} onValueChange={setAgentFilter}>
              <SelectTrigger
                className="w-40 font-mono text-xs"
                data-testid="select-agent-filter"
              >
                <Filter className="w-3.5 h-3.5 mr-2" />
                <SelectValue placeholder="Agent" />
              </SelectTrigger>
              <SelectContent className="font-mono">
                <SelectItem value="all">All Agents</SelectItem>
                {agents.map((agent) => (
                  <SelectItem key={agent.id} value={agent.id.toString()}>
                    {agent.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger
                className="w-32 font-mono text-xs"
                data-testid="select-level-filter"
              >
                <SelectValue placeholder="Level" />
              </SelectTrigger>
              <SelectContent className="font-mono">
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="error">Error</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
              className="gap-2 font-mono text-xs"
              data-testid="button-refresh-activity"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`}
              />
              refresh
            </Button>
          </div>
        </div>

        <div className="text-xs font-mono text-muted-foreground">
          <span className="text-terminal-green">{">"}</span> Showing{" "}
          {filteredLogs.length} of {logs.length} log entries
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <AsciiSpinner text="Loading activity logs..." />
          </div>
        ) : (
          <AgentActivityLog logs={filteredLogs} maxHeight="calc(100vh - 300px)" />
        )}
      </main>
    </div>
  );
}
