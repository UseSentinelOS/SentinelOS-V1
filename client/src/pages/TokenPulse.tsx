import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Zap, TrendingUp, TrendingDown, RefreshCw, Search, ExternalLink, AlertTriangle } from "lucide-react";

interface DiscoveredToken {
  id: number;
  mintAddress: string;
  symbol: string | null;
  name: string | null;
  price: number | null;
  priceChange24h: number | null;
  volume24h: number | null;
  marketCap: number | null;
  holders: number | null;
  riskScore: number | null;
  discoveredAt: string;
}

export default function TokenPulse() {
  const [searchTerm, setSearchTerm] = useState("");
  
  const { data: tokens = [], isLoading, refetch, isRefetching } = useQuery<DiscoveredToken[]>({
    queryKey: ["/api/tokens/discovered"],
  });

  const filteredTokens = tokens.filter(token => 
    token.symbol?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    token.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    token.mintAddress.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatPrice = (price: number | null) => {
    if (!price) return "$0.00";
    if (price < 0.0001) return `$${price.toExponential(2)}`;
    return `$${price.toFixed(6)}`;
  };

  const formatVolume = (volume: number | null) => {
    if (!volume) return "$0";
    if (volume >= 1000000) return `$${(volume / 1000000).toFixed(2)}M`;
    if (volume >= 1000) return `$${(volume / 1000).toFixed(2)}K`;
    return `$${volume.toFixed(2)}`;
  };

  const getRiskBadge = (score: number | null) => {
    if (!score) return <Badge variant="secondary">Unknown</Badge>;
    if (score <= 3) return <Badge className="bg-terminal-green/20 text-terminal-green">Low Risk</Badge>;
    if (score <= 6) return <Badge className="bg-yellow-500/20 text-yellow-500">Medium</Badge>;
    return <Badge className="bg-red-500/20 text-red-500">High Risk</Badge>;
  };

  return (
    <div className="space-y-6 p-4 overflow-y-auto h-full">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-md bg-terminal-purple/20">
            <Zap className="w-6 h-6 text-terminal-purple" />
          </div>
          <div>
            <h1 className="text-2xl font-mono font-bold">Token Pulse</h1>
            <p className="text-sm text-muted-foreground font-mono">
              Discover new tokens from Axiom.trade
            </p>
          </div>
        </div>
        <Button 
          variant="outline" 
          onClick={() => refetch()}
          disabled={isRefetching}
          className="gap-2"
          data-testid="button-refresh-tokens"
        >
          <RefreshCw className={`w-4 h-4 ${isRefetching ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search tokens..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 font-mono"
                data-testid="input-search-tokens"
              />
            </div>
            <Badge variant="outline" className="font-mono">
              {filteredTokens.length} tokens
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground font-mono">Loading tokens...</p>
            </div>
          ) : filteredTokens.length === 0 ? (
            <div className="text-center py-12">
              <AlertTriangle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground font-mono mb-2">No tokens discovered yet</p>
              <p className="text-xs text-muted-foreground font-mono">
                Tokens from Axiom.trade Pulse will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTokens.map((token) => (
                <div
                  key={token.id}
                  className="p-4 rounded-md border bg-card hover-elevate cursor-pointer"
                  data-testid={`token-card-${token.id}`}
                >
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-[200px]">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono font-bold text-lg">
                          {token.symbol || "???"}
                        </span>
                        {getRiskBadge(token.riskScore)}
                      </div>
                      <p className="text-sm text-muted-foreground font-mono">
                        {token.name || "Unknown Token"}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground font-mono truncate max-w-[200px]">
                          {token.mintAddress.slice(0, 8)}...{token.mintAddress.slice(-8)}
                        </span>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={() => window.open(`https://solscan.io/token/${token.mintAddress}`, "_blank")}
                          data-testid={`button-view-token-${token.id}`}
                        >
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="font-mono font-bold text-lg">
                        {formatPrice(token.price)}
                      </p>
                      <div className="flex items-center justify-end gap-1">
                        {(token.priceChange24h ?? 0) >= 0 ? (
                          <TrendingUp className="w-4 h-4 text-terminal-green" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-red-500" />
                        )}
                        <span className={`text-sm font-mono ${(token.priceChange24h ?? 0) >= 0 ? "text-terminal-green" : "text-red-500"}`}>
                          {token.priceChange24h?.toFixed(2) || "0.00"}%
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-xs text-muted-foreground font-mono">Volume 24h</p>
                      <p className="font-mono">{formatVolume(token.volume24h)}</p>
                    </div>

                    <div className="text-right">
                      <p className="text-xs text-muted-foreground font-mono">Holders</p>
                      <p className="font-mono">{token.holders?.toLocaleString() || "—"}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
