import { useState } from "react";
import {
  Wallet as WalletIcon,
  Copy,
  Check,
  ExternalLink,
  RefreshCw,
  Send,
  Download,
  Globe,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { TerminalWindow } from "@/components/terminal/TerminalWindow";
import { GlitchText } from "@/components/terminal/GlitchText";
import { ElectricButton } from "@/components/terminal/ElectricButton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useWallet } from "@/hooks/useWallet";
import { cn } from "@/lib/utils";

export default function Wallet() {
  const { connected, publicKey, balance, connect, disconnect, refreshBalance } =
    useWallet();
  const [copied, setCopied] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const copyAddress = async () => {
    if (publicKey) {
      await navigator.clipboard.writeText(publicKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRefreshBalance = async () => {
    setIsRefreshing(true);
    await refreshBalance();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  return (
    <div className="flex flex-col h-full">
      <Header title="Wallet" />

      <main className="flex-1 overflow-auto p-6 space-y-6 grid-background">
        <div className="space-y-1">
          <h2 className="font-display text-2xl font-bold tracking-wide">
            Wallet Management
          </h2>
          <p className="text-sm text-muted-foreground font-mono">
            <span className="text-terminal-green">{">"}</span> Connect and manage
            your Solana wallet
          </p>
        </div>

        {!connected ? (
          <TerminalWindow title="wallet_connect" className="max-w-md">
            <div className="p-8 space-y-6 text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-terminal-purple/20 flex items-center justify-center">
                <WalletIcon className="w-8 h-8 text-terminal-purple" />
              </div>
              <div className="space-y-2">
                <h3 className="font-display font-semibold text-lg">
                  Connect Your Wallet
                </h3>
                <p className="text-sm text-muted-foreground font-mono">
                  Connect a Solana wallet to interact with your agents and view
                  your balances.
                </p>
              </div>
              <ElectricButton
                onClick={connect}
                className="gap-2 font-mono uppercase"
                data-testid="button-connect-wallet-page"
              >
                <WalletIcon className="w-4 h-4" />
                Connect Wallet
              </ElectricButton>
              <p className="text-xs text-muted-foreground">
                Supports Phantom and other Solana wallets
              </p>
            </div>
          </TerminalWindow>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TerminalWindow title="wallet_info">
              <div className="p-6 space-y-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-mono text-muted-foreground uppercase">
                      Connected Wallet
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-terminal-green animate-pulse" />
                      <span className="text-sm font-mono text-terminal-green">
                        Connected
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={disconnect}
                    className="font-mono text-xs text-terminal-red hover:text-terminal-red"
                    data-testid="button-disconnect"
                  >
                    Disconnect
                  </Button>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-mono text-muted-foreground uppercase">
                    Address
                  </p>
                  <div className="flex items-center gap-2 p-3 bg-card rounded-md border border-border">
                    <code className="flex-1 text-sm font-mono text-foreground break-all">
                      {publicKey}
                    </code>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={copyAddress}
                      data-testid="button-copy-address-page"
                    >
                      {copied ? (
                        <Check className="w-4 h-4 text-terminal-green" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() =>
                        window.open(
                          `https://explorer.solana.com/address/${publicKey}`,
                          "_blank"
                        )
                      }
                      data-testid="button-view-explorer-page"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-mono text-muted-foreground uppercase">
                      Network
                    </p>
                  </div>
                  <div className="p-3 bg-card rounded-md border border-border">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-muted-foreground" />
                      <span className="font-mono text-sm">Mainnet Beta</span>
                      <Badge variant="outline" className="ml-auto font-mono text-xs text-terminal-green border-terminal-green/30">
                        Production
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-mono text-muted-foreground uppercase">
                      Balance
                    </p>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleRefreshBalance}
                      disabled={isRefreshing}
                      className="gap-1.5 font-mono text-xs"
                      data-testid="button-refresh-balance"
                    >
                      <RefreshCw
                        className={cn(
                          "w-3.5 h-3.5",
                          isRefreshing && "animate-spin"
                        )}
                      />
                      refresh
                    </Button>
                  </div>
                  <div className="p-4 bg-card rounded-md border border-border">
                    <GlitchText
                      as="p"
                      className="text-3xl font-display font-bold text-terminal-green"
                      glitchOnClick
                    >
                      {`${balance?.toFixed(6) || "0.000000"} SOL`}
                    </GlitchText>
                    <p className="text-xs text-muted-foreground mt-1 font-mono">
                      on Solana Mainnet
                    </p>
                  </div>
                </div>
              </div>
            </TerminalWindow>

            <TerminalWindow title="quick_actions">
              <div className="p-6 space-y-4">
                <h3 className="font-display font-semibold">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    className="h-auto py-4 flex-col gap-2 font-mono text-xs"
                    onClick={() =>
                      window.open(
                        "https://faucet.solana.com/",
                        "_blank"
                      )
                    }
                    data-testid="button-request-airdrop"
                  >
                    <Download className="w-5 h-5 text-terminal-purple" />
                    Request Airdrop
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto py-4 flex-col gap-2 font-mono text-xs"
                    disabled
                    data-testid="button-send-tokens"
                  >
                    <Send className="w-5 h-5" />
                    Send Tokens
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground font-mono text-center">
                  More features coming soon...
                </p>
              </div>
            </TerminalWindow>
          </div>
        )}
      </main>
    </div>
  );
}
