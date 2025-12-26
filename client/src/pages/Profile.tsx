import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useWallet } from "@/hooks/useWallet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Wallet, Copy, ExternalLink, User, Shield, ArrowDownToLine, ArrowUpFromLine, AlertCircle } from "lucide-react";

export default function Profile() {
  const { user, managedWallet, isAuthenticated, isLoading, login, logout, updateProfile, refreshManagedWallet } = useAuth();
  const { connected, publicKey, balance, connect } = useWallet();
  const { toast } = useToast();
  
  const [username, setUsername] = useState(user?.username || "");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || "");
  const [isSaving, setIsSaving] = useState(false);
  const [depositAmount, setDepositAmount] = useState("0.1");
  const [withdrawAmount, setWithdrawAmount] = useState("0.1");
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);

  const depositMutation = useMutation({
    mutationFn: async (amount: number) => {
      const res = await apiRequest("POST", "/api/wallet/deposit", { amount });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to initiate deposit");
      }
      return res.json();
    },
    onSuccess: (data) => {
      toast({ 
        title: "Deposit initiated", 
        description: `Send ${depositAmount} SOL to your managed wallet address` 
      });
      setIsDepositOpen(false);
    },
    onError: (error: Error) => {
      toast({ title: error.message, variant: "destructive" });
    },
  });

  const withdrawMutation = useMutation({
    mutationFn: async (amount: number) => {
      const res = await apiRequest("POST", "/api/wallet/withdraw", { amount, destinationAddress: publicKey });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to process withdrawal");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Withdrawal initiated", description: "Processing your withdrawal request" });
      setIsWithdrawOpen(false);
      refreshManagedWallet();
    },
    onError: (error: Error) => {
      toast({ title: error.message, variant: "destructive" });
    },
  });

  const handleConnect = async () => {
    if (!connected) {
      await connect();
    }
  };

  const handleLogin = async () => {
    try {
      await login();
      toast({ title: "Login successful", description: "Welcome to SentinelOS!" });
    } catch (error) {
      console.error("Login error:", error);
      const message = error instanceof Error ? error.message : "Could not verify wallet signature";
      toast({ title: "Login failed", description: message, variant: "destructive" });
    }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      await updateProfile({ username: username || undefined, avatarUrl: avatarUrl || undefined });
      toast({ title: "Profile updated", description: "Your profile has been saved." });
    } catch (error) {
      toast({ title: "Error", description: "Failed to save profile", variant: "destructive" });
    }
    setIsSaving(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied", description: "Address copied to clipboard" });
  };

  if (!connected) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-4 rounded-full bg-terminal-green/10">
              <Wallet className="w-12 h-12 text-terminal-green" />
            </div>
            <CardTitle className="font-mono text-xl">Connect Wallet</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-muted-foreground font-mono text-sm">
              Connect your Phantom wallet to access SentinelOS
            </p>
            <Button 
              onClick={handleConnect} 
              className="w-full bg-terminal-green text-black hover:bg-terminal-green/90"
              data-testid="button-connect-wallet"
            >
              Connect Phantom Wallet
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (connected && !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-4 rounded-full bg-terminal-purple/10">
              <Shield className="w-12 h-12 text-terminal-purple" />
            </div>
            <CardTitle className="font-mono text-xl">Sign In to SentinelOS</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 bg-muted rounded-md">
              <p className="text-xs font-mono text-muted-foreground mb-1">Connected Wallet</p>
              <p className="font-mono text-sm truncate">{publicKey}</p>
            </div>
            <p className="text-center text-muted-foreground font-mono text-sm">
              Sign a message to verify wallet ownership and create your account
            </p>
            <Button 
              onClick={handleLogin} 
              disabled={isLoading}
              className="w-full bg-terminal-purple text-white hover:bg-terminal-purple/90"
              data-testid="button-sign-in"
            >
              {isLoading ? "Signing..." : "Sign In with Wallet"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-mono font-bold text-terminal-green">Profile</h1>
        <Button variant="outline" onClick={logout} data-testid="button-logout">
          Disconnect
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="font-mono flex items-center gap-2">
              <User className="w-5 h-5" />
              User Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="w-16 h-16">
                <AvatarImage src={user?.avatarUrl || undefined} />
                <AvatarFallback className="bg-terminal-green/20 text-terminal-green font-mono">
                  {user?.username?.[0]?.toUpperCase() || publicKey?.slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-mono font-semibold">{user?.username || "Anonymous"}</p>
                <p className="text-xs text-muted-foreground font-mono">
                  {publicKey?.slice(0, 8)}...{publicKey?.slice(-8)}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <Label className="font-mono text-xs">Username</Label>
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  className="font-mono"
                  data-testid="input-username"
                />
              </div>
              <div>
                <Label className="font-mono text-xs">Avatar URL</Label>
                <Input
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://example.com/avatar.png"
                  className="font-mono"
                  data-testid="input-avatar-url"
                />
              </div>
              <Button 
                onClick={handleSaveProfile} 
                disabled={isSaving}
                className="w-full"
                data-testid="button-save-profile"
              >
                {isSaving ? "Saving..." : "Save Profile"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-mono flex items-center gap-2">
              <Wallet className="w-5 h-5" />
              Your Wallet
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 bg-muted rounded-md">
              <p className="text-xs text-muted-foreground font-mono mb-1">Phantom Wallet</p>
              <div className="flex items-center justify-between gap-2">
                <p className="font-mono text-sm truncate">{publicKey}</p>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  onClick={() => copyToClipboard(publicKey || "")}
                  data-testid="button-copy-wallet"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-lg font-mono font-bold text-terminal-green mt-2">
                {balance?.toFixed(4) || "0"} SOL
              </p>
            </div>
          </CardContent>
        </Card>

        {managedWallet && (
          <Card className="md:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <CardTitle className="font-mono flex items-center gap-2">
                  <Shield className="w-5 h-5 text-terminal-purple" />
                  Sentinel Managed Wallet
                  <Badge variant="secondary" className="ml-2">Agent Trading</Badge>
                </CardTitle>
                <Button variant="outline" size="sm" onClick={refreshManagedWallet}>
                  Refresh Balance
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-terminal-purple/10 border border-terminal-purple/30 rounded-md">
                <p className="text-xs text-muted-foreground font-mono mb-2">
                  This wallet is controlled by SentinelOS for automated agent trading
                </p>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <p className="font-mono text-sm truncate">{managedWallet.publicKey}</p>
                  <div className="flex gap-1">
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      onClick={() => copyToClipboard(managedWallet.publicKey)}
                      data-testid="button-copy-managed"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      onClick={() => window.open(`https://solscan.io/account/${managedWallet.publicKey}`, "_blank")}
                      data-testid="button-view-solscan"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <p className="text-2xl font-mono font-bold text-terminal-purple">
                  {managedWallet.balance?.toFixed(4) || "0"} SOL
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Dialog open={isDepositOpen} onOpenChange={setIsDepositOpen}>
                  <DialogTrigger asChild>
                    <Button className="gap-2" data-testid="button-deposit">
                      <ArrowDownToLine className="w-4 h-4" />
                      Deposit to Managed Wallet
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle className="font-mono">Deposit SOL</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <div className="p-3 bg-terminal-green/10 border border-terminal-green/30 rounded-md">
                        <p className="text-xs text-muted-foreground font-mono mb-1">Deposit Address</p>
                        <p className="font-mono text-sm break-all">{managedWallet.publicKey}</p>
                      </div>
                      <div>
                        <Label className="font-mono text-xs">Amount (SOL)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={depositAmount}
                          onChange={(e) => setDepositAmount(e.target.value)}
                          className="font-mono"
                          data-testid="input-deposit-amount"
                        />
                      </div>
                      <div className="flex items-start gap-2 p-3 bg-muted rounded-md">
                        <AlertCircle className="w-4 h-4 mt-0.5 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground font-mono">
                          Send SOL from your Phantom wallet to the address above. After sending, click confirm to update your balance.
                        </p>
                      </div>
                      <Button
                        onClick={() => depositMutation.mutate(parseFloat(depositAmount))}
                        disabled={depositMutation.isPending}
                        className="w-full"
                        data-testid="button-confirm-deposit"
                      >
                        {depositMutation.isPending ? "Processing..." : "Initiate Deposit"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog open={isWithdrawOpen} onOpenChange={setIsWithdrawOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="gap-2" data-testid="button-withdraw">
                      <ArrowUpFromLine className="w-4 h-4" />
                      Withdraw to Phantom
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle className="font-mono">Withdraw SOL</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <div className="p-3 bg-muted rounded-md">
                        <p className="text-xs text-muted-foreground font-mono mb-1">Available Balance</p>
                        <p className="font-mono text-lg font-bold text-terminal-purple">
                          {managedWallet.balance?.toFixed(4) || "0"} SOL
                        </p>
                      </div>
                      <div>
                        <Label className="font-mono text-xs">Amount to Withdraw (SOL)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          max={managedWallet.balance || 0}
                          value={withdrawAmount}
                          onChange={(e) => setWithdrawAmount(e.target.value)}
                          className="font-mono"
                          data-testid="input-withdraw-amount"
                        />
                      </div>
                      <div className="p-3 bg-muted rounded-md">
                        <p className="text-xs text-muted-foreground font-mono mb-1">Destination</p>
                        <p className="font-mono text-sm truncate">{publicKey}</p>
                      </div>
                      <Button
                        onClick={() => withdrawMutation.mutate(parseFloat(withdrawAmount))}
                        disabled={withdrawMutation.isPending || parseFloat(withdrawAmount) > (managedWallet.balance || 0)}
                        className="w-full"
                        data-testid="button-confirm-withdraw"
                      >
                        {withdrawMutation.isPending ? "Processing..." : "Withdraw"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <p className="text-xs text-muted-foreground font-mono text-center">
                Deposit SOL to this wallet to fund your AI agents for automated trading
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
