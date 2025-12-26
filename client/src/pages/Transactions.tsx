import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/Header";
import { TransactionHistory } from "@/components/transactions/TransactionHistory";
import { AsciiSpinner } from "@/components/terminal/AsciiSpinner";
import { queryClient } from "@/lib/queryClient";
import type { Transaction } from "@shared/schema";

export default function Transactions() {
  const {
    data: transactions = [],
    isLoading,
    refetch,
    isFetching,
  } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
  });

  return (
    <div className="flex flex-col h-full">
      <Header title="Transactions" />

      <main className="flex-1 overflow-auto p-6 space-y-6 grid-background">
        <div className="space-y-1">
          <h2 className="font-display text-2xl font-bold tracking-wide">
            Transaction History
          </h2>
          <p className="text-sm text-muted-foreground font-mono">
            <span className="text-terminal-green">{">"}</span> View all agent
            transactions and blockchain activity
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <AsciiSpinner text="Loading transactions..." />
          </div>
        ) : (
          <TransactionHistory
            transactions={transactions}
            onRefresh={() => refetch()}
            isLoading={isFetching}
          />
        )}
      </main>
    </div>
  );
}
