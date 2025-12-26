import { ExternalLink, ArrowUpRight, ArrowDownLeft, RefreshCw } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { TerminalWindow } from "@/components/terminal/TerminalWindow";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Transaction } from "@shared/schema";
import { cn } from "@/lib/utils";

interface TransactionHistoryProps {
  transactions: Transaction[];
  className?: string;
  onRefresh?: () => void;
  isLoading?: boolean;
}

const txTypeLabels: Record<string, { label: string; icon: React.ReactNode }> = {
  swap: { label: "SWAP", icon: <RefreshCw className="w-3 h-3" /> },
  send: { label: "SEND", icon: <ArrowUpRight className="w-3 h-3" /> },
  receive: { label: "RECV", icon: <ArrowDownLeft className="w-3 h-3" /> },
  stake: { label: "STAKE", icon: <ArrowUpRight className="w-3 h-3" /> },
  unstake: { label: "UNSTAKE", icon: <ArrowDownLeft className="w-3 h-3" /> },
};

const statusColors: Record<string, string> = {
  pending: "bg-terminal-yellow/20 text-terminal-yellow border-terminal-yellow/30",
  confirmed: "bg-terminal-green/20 text-terminal-green border-terminal-green/30",
  failed: "bg-terminal-red/20 text-terminal-red border-terminal-red/30",
};

export function TransactionHistory({
  transactions,
  className,
  onRefresh,
  isLoading,
}: TransactionHistoryProps) {
  const truncateHash = (hash: string) =>
    `${hash.slice(0, 8)}...${hash.slice(-6)}`;

  return (
    <TerminalWindow title="transaction_history" className={className}>
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="font-mono text-xs text-muted-foreground">
            <span className="text-terminal-green">{">"}</span> ls -la ./transactions
          </div>
          {onRefresh && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onRefresh}
              disabled={isLoading}
              className="gap-1.5 font-mono text-xs"
              data-testid="button-refresh-transactions"
            >
              <RefreshCw
                className={cn("w-3.5 h-3.5", isLoading && "animate-spin")}
              />
              refresh
            </Button>
          )}
        </div>

        <ScrollArea className="h-[400px]">
          {transactions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground font-mono text-sm">
              <p>No transactions found.</p>
              <p className="text-xs mt-1">
                Transactions will appear here once agents start operating.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-12 gap-2 text-xs font-mono text-muted-foreground uppercase tracking-wider py-2 border-b border-border">
                <div className="col-span-2">Time</div>
                <div className="col-span-2">Type</div>
                <div className="col-span-2">Amount</div>
                <div className="col-span-3">TX Hash</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-1" />
              </div>

              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="grid grid-cols-12 gap-2 items-center py-3 border-b border-border/50 hover:bg-card/50 transition-colors"
                  data-testid={`row-transaction-${tx.id}`}
                >
                  <div className="col-span-2 text-xs font-mono text-muted-foreground">
                    {tx.createdAt
                      ? formatDistanceToNow(new Date(tx.createdAt), {
                          addSuffix: true,
                        })
                      : "just now"}
                  </div>
                  <div className="col-span-2">
                    <div className="flex items-center gap-1.5">
                      {txTypeLabels[tx.txType]?.icon}
                      <span className="font-mono text-xs">
                        {txTypeLabels[tx.txType]?.label || tx.txType.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="col-span-2 font-mono text-sm">
                    <span
                      className={cn(
                        tx.txType === "send" || tx.txType === "stake"
                          ? "text-terminal-red"
                          : "text-terminal-green"
                      )}
                    >
                      {tx.txType === "send" || tx.txType === "stake" ? "-" : "+"}
                      {(tx.amount || 0).toFixed(4)}
                    </span>
                    <span className="text-muted-foreground ml-1">
                      {tx.tokenSymbol || "SOL"}
                    </span>
                  </div>
                  <div className="col-span-3 font-mono text-xs text-muted-foreground">
                    {tx.txHash ? truncateHash(tx.txHash) : "-"}
                  </div>
                  <div className="col-span-2">
                    <Badge
                      variant="outline"
                      className={cn(
                        "font-mono text-xs uppercase",
                        statusColors[tx.status]
                      )}
                    >
                      {tx.status}
                    </Badge>
                  </div>
                  <div className="col-span-1 flex justify-end">
                    {tx.txHash && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="w-7 h-7"
                        onClick={() =>
                          window.open(
                            `https://explorer.solana.com/tx/${tx.txHash}?cluster=devnet`,
                            "_blank"
                          )
                        }
                        data-testid={`button-view-tx-${tx.id}`}
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>
    </TerminalWindow>
  );
}
