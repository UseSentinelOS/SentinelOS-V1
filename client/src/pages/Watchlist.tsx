import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Eye, Plus, Trash2, TrendingUp, TrendingDown, Bell, Zap, ExternalLink } from "lucide-react";

interface WatchlistItem {
  id: number;
  userId: string;
  tokenMint: string;
  symbol: string | null;
  name: string | null;
  targetBuyPrice: number | null;
  targetSellPrice: number | null;
  autoTradeEnabled: boolean | null;
  maxBuyAmount: number | null;
  alertsEnabled: boolean | null;
  notes: string | null;
  addedAt: string;
}

export default function Watchlist() {
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newToken, setNewToken] = useState({
    tokenMint: "",
    symbol: "",
    name: "",
    targetBuyPrice: "",
    targetSellPrice: "",
    autoTradeEnabled: false,
    maxBuyAmount: "0.1",
    alertsEnabled: true,
  });

  const { data: watchlist = [], isLoading } = useQuery<WatchlistItem[]>({
    queryKey: ["/api/watchlist"],
    enabled: isAuthenticated,
  });

  const addMutation = useMutation({
    mutationFn: async (data: typeof newToken) => {
      const res = await apiRequest("POST", "/api/watchlist", {
        tokenMint: data.tokenMint,
        symbol: data.symbol || null,
        name: data.name || null,
        targetBuyPrice: data.targetBuyPrice ? parseFloat(data.targetBuyPrice) : null,
        targetSellPrice: data.targetSellPrice ? parseFloat(data.targetSellPrice) : null,
        autoTradeEnabled: data.autoTradeEnabled,
        maxBuyAmount: data.maxBuyAmount ? parseFloat(data.maxBuyAmount) : 0.1,
        alertsEnabled: data.alertsEnabled,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to add token");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/watchlist"] });
      setIsAddOpen(false);
      setNewToken({
        tokenMint: "",
        symbol: "",
        name: "",
        targetBuyPrice: "",
        targetSellPrice: "",
        autoTradeEnabled: false,
        maxBuyAmount: "0.1",
        alertsEnabled: true,
      });
      toast({ title: "Token added to watchlist" });
    },
    onError: () => {
      toast({ title: "Failed to add token", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/watchlist/${id}`);
      if (!res.ok && res.status !== 204) {
        throw new Error("Failed to delete token");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/watchlist"] });
      toast({ title: "Token removed from watchlist" });
    },
    onError: (error: Error) => {
      toast({ title: error.message, variant: "destructive" });
    },
  });

  const toggleAutoTrade = useMutation({
    mutationFn: async ({ id, enabled }: { id: number; enabled: boolean }) => {
      const res = await apiRequest("PATCH", `/api/watchlist/${id}`, { autoTradeEnabled: enabled });
      if (!res.ok) {
        throw new Error("Failed to update auto-trade");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/watchlist"] });
    },
    onError: (error: Error) => {
      toast({ title: error.message, variant: "destructive" });
    },
  });

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <Eye className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground font-mono">
              Connect your wallet to access your watchlist
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 overflow-y-auto h-full">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-md bg-terminal-green/20">
            <Eye className="w-6 h-6 text-terminal-green" />
          </div>
          <div>
            <h1 className="text-2xl font-mono font-bold">Watchlist</h1>
            <p className="text-sm text-muted-foreground font-mono">
              Monitor tokens and enable auto-trading
            </p>
          </div>
        </div>
        
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" data-testid="button-add-token">
              <Plus className="w-4 h-4" />
              Add Token
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-mono">Add Token to Watchlist</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label className="font-mono text-xs">Token Mint Address</Label>
                <Input
                  value={newToken.tokenMint}
                  onChange={(e) => setNewToken({ ...newToken, tokenMint: e.target.value })}
                  placeholder="Token mint address..."
                  className="font-mono"
                  data-testid="input-token-mint"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-mono text-xs">Symbol</Label>
                  <Input
                    value={newToken.symbol}
                    onChange={(e) => setNewToken({ ...newToken, symbol: e.target.value })}
                    placeholder="e.g. BONK"
                    className="font-mono"
                    data-testid="input-symbol"
                  />
                </div>
                <div>
                  <Label className="font-mono text-xs">Name</Label>
                  <Input
                    value={newToken.name}
                    onChange={(e) => setNewToken({ ...newToken, name: e.target.value })}
                    placeholder="Token name"
                    className="font-mono"
                    data-testid="input-name"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-mono text-xs">Target Buy Price (USD)</Label>
                  <Input
                    type="number"
                    step="0.000001"
                    value={newToken.targetBuyPrice}
                    onChange={(e) => setNewToken({ ...newToken, targetBuyPrice: e.target.value })}
                    placeholder="0.00001"
                    className="font-mono"
                    data-testid="input-buy-price"
                  />
                </div>
                <div>
                  <Label className="font-mono text-xs">Target Sell Price (USD)</Label>
                  <Input
                    type="number"
                    step="0.000001"
                    value={newToken.targetSellPrice}
                    onChange={(e) => setNewToken({ ...newToken, targetSellPrice: e.target.value })}
                    placeholder="0.001"
                    className="font-mono"
                    data-testid="input-sell-price"
                  />
                </div>
              </div>
              <div>
                <Label className="font-mono text-xs">Max Buy Amount (SOL)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={newToken.maxBuyAmount}
                  onChange={(e) => setNewToken({ ...newToken, maxBuyAmount: e.target.value })}
                  placeholder="0.1"
                  className="font-mono"
                  data-testid="input-max-amount"
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-terminal-purple" />
                  <Label className="font-mono text-sm">Enable Auto-Trade</Label>
                </div>
                <Switch
                  checked={newToken.autoTradeEnabled}
                  onCheckedChange={(checked) => setNewToken({ ...newToken, autoTradeEnabled: checked })}
                  data-testid="switch-auto-trade"
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-terminal-green" />
                  <Label className="font-mono text-sm">Price Alerts</Label>
                </div>
                <Switch
                  checked={newToken.alertsEnabled}
                  onCheckedChange={(checked) => setNewToken({ ...newToken, alertsEnabled: checked })}
                  data-testid="switch-alerts"
                />
              </div>
              <Button
                onClick={() => addMutation.mutate(newToken)}
                disabled={!newToken.tokenMint || addMutation.isPending}
                className="w-full"
                data-testid="button-confirm-add"
              >
                {addMutation.isPending ? "Adding..." : "Add to Watchlist"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-mono flex items-center justify-between gap-4">
            <span>Your Tokens</span>
            <Badge variant="outline" className="font-mono">
              {watchlist.length} watching
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground font-mono">Loading watchlist...</p>
            </div>
          ) : watchlist.length === 0 ? (
            <div className="text-center py-12">
              <Eye className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground font-mono mb-2">No tokens in watchlist</p>
              <p className="text-xs text-muted-foreground font-mono">
                Add tokens to monitor prices and enable auto-trading
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {watchlist.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-md border bg-card"
                  data-testid={`watchlist-item-${item.id}`}
                >
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-[200px]">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono font-bold text-lg">
                          {item.symbol || "Unknown"}
                        </span>
                        {item.autoTradeEnabled && (
                          <Badge className="bg-terminal-purple/20 text-terminal-purple">
                            <Zap className="w-3 h-3 mr-1" />
                            Auto
                          </Badge>
                        )}
                        {item.alertsEnabled && (
                          <Badge variant="outline">
                            <Bell className="w-3 h-3 mr-1" />
                            Alerts
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground font-mono">
                        {item.name || "Unknown Token"}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground font-mono truncate max-w-[200px]">
                          {item.tokenMint.slice(0, 8)}...{item.tokenMint.slice(-8)}
                        </span>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={() => window.open(`https://solscan.io/token/${item.tokenMint}`, "_blank")}
                          data-testid={`button-solscan-${item.id}`}
                        >
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 text-right">
                      {item.targetBuyPrice && (
                        <div className="flex items-center gap-2 justify-end">
                          <TrendingDown className="w-4 h-4 text-terminal-green" />
                          <span className="text-sm font-mono">
                            Buy at ${item.targetBuyPrice.toFixed(6)}
                          </span>
                        </div>
                      )}
                      {item.targetSellPrice && (
                        <div className="flex items-center gap-2 justify-end">
                          <TrendingUp className="w-4 h-4 text-red-500" />
                          <span className="text-sm font-mono">
                            Sell at ${item.targetSellPrice.toFixed(6)}
                          </span>
                        </div>
                      )}
                      {item.maxBuyAmount && (
                        <span className="text-xs text-muted-foreground font-mono">
                          Max: {item.maxBuyAmount} SOL
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Switch
                        checked={item.autoTradeEnabled || false}
                        onCheckedChange={(checked) => 
                          toggleAutoTrade.mutate({ id: item.id, enabled: checked })
                        }
                        data-testid={`switch-auto-${item.id}`}
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => deleteMutation.mutate(item.id)}
                        data-testid={`button-delete-${item.id}`}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
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
