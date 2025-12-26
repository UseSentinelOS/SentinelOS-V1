import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowDown, Loader2, Zap, Shield, AlertTriangle } from "lucide-react";

declare global {
  interface Window {
    solana?: {
      signAndSendTransaction: (params: { serializedTransaction: Uint8Array }) => Promise<{ signature: string }>;
    };
  }
}
import { Header } from "@/components/layout/Header";
import { TerminalWindow } from "@/components/terminal/TerminalWindow";
import { GlitchText } from "@/components/terminal/GlitchText";
import { ElectricButton } from "@/components/terminal/ElectricButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useWallet } from "@/hooks/useWallet";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";

interface Token {
  symbol: string;
  mint: string;
  decimals: number;
  name: string;
}

interface Quote {
  inputMint: string;
  outputMint: string;
  inAmount: string;
  outAmount: string;
  priceImpactPct: string;
  routePlan: Array<{
    swapInfo: {
      label: string;
      inAmount: string;
      outAmount: string;
    };
    percent: number;
  }>;
}

export default function Swap() {
  const { connected, publicKey } = useWallet();
  const { toast } = useToast();
  
  const [inputAmount, setInputAmount] = useState("");
  const [inputToken, setInputToken] = useState("SOL");
  const [outputToken, setOutputToken] = useState("USDC");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [slippage, setSlippage] = useState(0.5);

  const { data: tokens = [] } = useQuery<Token[]>({
    queryKey: ["/api/swap/tokens"],
  });

  const quoteMutation = useMutation({
    mutationFn: async () => {
      const input = tokens.find((t) => t.symbol === inputToken);
      const output = tokens.find((t) => t.symbol === outputToken);
      
      if (!input || !output || !inputAmount) {
        throw new Error("Invalid swap parameters");
      }

      const amount = Math.floor(parseFloat(inputAmount) * Math.pow(10, input.decimals));
      const slippageBps = Math.floor(slippage * 100);
      
      const response = await apiRequest("POST", "/api/swap/quote", {
        inputMint: input.mint,
        outputMint: output.mint,
        amount,
        slippageBps,
      });
      
      if (!response.ok) {
        throw new Error("Failed to get quote from Jupiter");
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      setQuote(data);
    },
    onError: (error) => {
      toast({
        title: "Quote Failed",
        description: error instanceof Error ? error.message : "Failed to get quote",
        variant: "destructive",
      });
    },
  });

  const swapMutation = useMutation({
    mutationFn: async () => {
      if (!quote || !publicKey) {
        throw new Error("Missing quote or wallet connection");
      }

      const response = await apiRequest("POST", "/api/swap/transaction", {
        quoteResponse: quote,
        userPublicKey: publicKey,
      });
      
      if (!response.ok) {
        throw new Error("Failed to create swap transaction");
      }
      
      const data = await response.json();
      
      if (data.swapTransaction && window.solana) {
        const binaryString = atob(data.swapTransaction);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const { signature } = await window.solana.signAndSendTransaction({
          serializedTransaction: bytes,
        });
        return { signature, ...data };
      }
      
      return data;
    },
    onSuccess: (data) => {
      if (data.signature) {
        toast({
          title: "Swap Successful",
          description: `Transaction: ${data.signature.slice(0, 8)}...${data.signature.slice(-8)}`,
        });
        setQuote(null);
        setInputAmount("");
      } else {
        toast({
          title: "Swap Transaction Created",
          description: "Sign the transaction in your wallet to complete the swap.",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Swap Failed",
        description: error instanceof Error ? error.message : "Failed to create swap",
        variant: "destructive",
      });
    },
  });

  const handleSwapTokens = () => {
    const temp = inputToken;
    setInputToken(outputToken);
    setOutputToken(temp);
    setQuote(null);
  };

  const formatOutputAmount = () => {
    if (!quote) return "0.00";
    const output = tokens.find((t) => t.mint === quote.outputMint);
    if (!output) return "0.00";
    const amount = parseInt(quote.outAmount) / Math.pow(10, output.decimals);
    return amount.toFixed(6);
  };

  useEffect(() => {
    if (inputAmount && parseFloat(inputAmount) > 0) {
      const debounce = setTimeout(() => {
        quoteMutation.mutate();
      }, 500);
      return () => clearTimeout(debounce);
    }
  }, [inputAmount, inputToken, outputToken]);

  return (
    <div className="flex flex-col h-full">
      <Header title="Swap" />

      <main className="flex-1 overflow-auto p-6 space-y-6 grid-background">
        <div className="space-y-1">
          <h2 className="font-display text-2xl font-bold tracking-wide">
            <GlitchText glitchOnHover glitchOnClick={false}>
              Token Swap
            </GlitchText>
          </h2>
          <p className="text-sm text-muted-foreground font-mono">
            <span className="text-terminal-green">{">"}</span> Swap tokens via Jupiter aggregator on Solana mainnet
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-4xl">
          <TerminalWindow title="swap_interface" data-testid="terminal-swap">
            <div className="p-6 space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="font-mono text-xs uppercase text-muted-foreground">
                    You Pay
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={inputAmount}
                      onChange={(e) => setInputAmount(e.target.value)}
                      className="font-mono text-lg bg-card/50 border-terminal-purple/30"
                      data-testid="input-swap-amount"
                    />
                    <Select value={inputToken} onValueChange={setInputToken}>
                      <SelectTrigger className="w-32 font-mono" data-testid="select-input-token">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {tokens.map((token) => (
                          <SelectItem
                            key={token.mint}
                            value={token.symbol}
                            disabled={token.symbol === outputToken}
                          >
                            {token.symbol}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-center">
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={handleSwapTokens}
                    className="rounded-full"
                    data-testid="button-swap-tokens"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label className="font-mono text-xs uppercase text-muted-foreground">
                    You Receive
                  </Label>
                  <div className="flex gap-2">
                    <div className="flex-1 flex items-center px-3 bg-card/50 border border-terminal-purple/30 rounded-md">
                      <span className="font-mono text-lg text-terminal-green">
                        {quoteMutation.isPending ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          formatOutputAmount()
                        )}
                      </span>
                    </div>
                    <Select value={outputToken} onValueChange={setOutputToken}>
                      <SelectTrigger className="w-32 font-mono" data-testid="select-output-token">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {tokens.map((token) => (
                          <SelectItem
                            key={token.mint}
                            value={token.symbol}
                            disabled={token.symbol === inputToken}
                          >
                            {token.symbol}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {quote && (
                  <div className="p-3 bg-card/30 rounded-md space-y-2 font-mono text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Price Impact</span>
                      <span className={cn(
                        parseFloat(quote.priceImpactPct) > 1 ? "text-terminal-red" : "text-terminal-green"
                      )}>
                        {parseFloat(quote.priceImpactPct).toFixed(4)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Route</span>
                      <span className="text-foreground">
                        {quote.routePlan?.map((r) => r.swapInfo.label).join(" → ") || "Direct"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Slippage</span>
                      <span className="text-foreground">{slippage}%</span>
                    </div>
                  </div>
                )}

                {quoteMutation.isError && (
                  <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-md flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-destructive mt-0.5" />
                    <div className="text-xs font-mono">
                      <p className="text-destructive font-semibold">Quote Failed</p>
                      <p className="text-muted-foreground mt-1">
                        Unable to fetch quote from Jupiter. Please check your connection and try again.
                      </p>
                    </div>
                  </div>
                )}

                <div className="pt-4">
                  {!connected ? (
                    <p className="text-center text-sm text-muted-foreground font-mono">
                      Connect wallet to swap
                    </p>
                  ) : (
                    <ElectricButton
                      onClick={() => swapMutation.mutate()}
                      disabled={!quote || swapMutation.isPending}
                      className="w-full gap-2 font-mono uppercase"
                      data-testid="button-execute-swap"
                    >
                      {swapMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Zap className="w-4 h-4" />
                      )}
                      {swapMutation.isPending ? "Creating Transaction..." : "Swap"}
                    </ElectricButton>
                  )}
                </div>
              </div>
            </div>
          </TerminalWindow>

          <div className="space-y-6">
            <TerminalWindow title="zk_privacy" data-testid="terminal-zk">
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-terminal-purple" />
                  <h3 className="font-display font-semibold">ZK Privacy Engine</h3>
                </div>
                <p className="text-sm text-muted-foreground font-mono">
                  All swaps can be executed with zero-knowledge proofs for maximum privacy.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-card/30 rounded-md">
                    <span className="font-mono text-sm">Balance Proofs</span>
                    <Badge variant="outline" className="text-terminal-green border-terminal-green/30">
                      Active
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-card/30 rounded-md">
                    <span className="font-mono text-sm">Private Transactions</span>
                    <Badge variant="outline" className="text-terminal-green border-terminal-green/30">
                      Active
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-card/30 rounded-md">
                    <span className="font-mono text-sm">zkML Inference</span>
                    <Badge variant="outline" className="text-terminal-purple border-terminal-purple/30">
                      Beta
                    </Badge>
                  </div>
                </div>
              </div>
            </TerminalWindow>

            <TerminalWindow title="swap_info">
              <div className="p-6 space-y-4">
                <h3 className="font-display font-semibold">How It Works</h3>
                <ul className="space-y-2 text-sm text-muted-foreground font-mono">
                  <li className="flex items-start gap-2">
                    <span className="text-terminal-green">1.</span>
                    <span>Jupiter finds the best route across all Solana DEXs</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-terminal-green">2.</span>
                    <span>ZK proofs verify your balance without revealing amounts</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-terminal-green">3.</span>
                    <span>Transaction is signed by your wallet and executed on-chain</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-terminal-green">4.</span>
                    <span>Receive tokens directly to your wallet</span>
                  </li>
                </ul>
              </div>
            </TerminalWindow>
          </div>
        </div>
      </main>
    </div>
  );
}
