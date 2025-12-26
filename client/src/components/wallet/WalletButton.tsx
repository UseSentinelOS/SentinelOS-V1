import { useState, useEffect } from "react";
import { Wallet, ExternalLink, Copy, Check, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ElectricButton } from "@/components/terminal/ElectricButton";
import { useWallet } from "@/hooks/useWallet";
import { cn } from "@/lib/utils";

export function WalletButton() {
  const { connected, connecting, publicKey, balance, connect, disconnect } = useWallet();
  const [copied, setCopied] = useState(false);

  const copyAddress = async () => {
    if (publicKey) {
      await navigator.clipboard.writeText(publicKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const truncatedAddress = publicKey
    ? `${publicKey.slice(0, 4)}...${publicKey.slice(-4)}`
    : "";

  if (!connected) {
    return (
      <ElectricButton
        onClick={connect}
        disabled={connecting}
        className="gap-2 font-mono uppercase tracking-wider text-xs"
        data-testid="button-connect-wallet"
      >
        <Wallet className="w-4 h-4" />
        {connecting ? "Connecting..." : "Connect Wallet"}
      </ElectricButton>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "gap-2 font-mono text-xs border-terminal-purple/30",
            "hover:border-terminal-purple/60"
          )}
          data-testid="button-wallet-menu"
        >
          <span className="w-2 h-2 rounded-full bg-terminal-green animate-pulse" />
          <span className="text-terminal-green">{balance?.toFixed(4)} SOL</span>
          <span className="text-muted-foreground">|</span>
          <span>{truncatedAddress}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="font-mono text-xs w-56">
        <DropdownMenuItem
          onClick={copyAddress}
          className="gap-2 cursor-pointer"
          data-testid="button-copy-address"
        >
          {copied ? (
            <Check className="w-4 h-4 text-terminal-green" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
          {copied ? "Copied!" : "Copy Address"}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() =>
            window.open(
              `https://explorer.solana.com/address/${publicKey}?cluster=devnet`,
              "_blank"
            )
          }
          className="gap-2 cursor-pointer"
          data-testid="button-view-explorer"
        >
          <ExternalLink className="w-4 h-4" />
          View on Explorer
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={disconnect}
          className="gap-2 cursor-pointer text-terminal-red focus:text-terminal-red"
          data-testid="button-disconnect-wallet"
        >
          <LogOut className="w-4 h-4" />
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
