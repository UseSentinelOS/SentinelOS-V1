import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider } from "@/components/ui/sidebar";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { ScanlineOverlay } from "@/components/terminal/ScanlineOverlay";
import Dashboard from "@/pages/Dashboard";
import Agents from "@/pages/Agents";
import Transactions from "@/pages/Transactions";
import Activity from "@/pages/Activity";
import Wallet from "@/pages/Wallet";
import Swap from "@/pages/Swap";
import Settings from "@/pages/Settings";
import Profile from "@/pages/Profile";
import TokenPulse from "@/pages/TokenPulse";
import Watchlist from "@/pages/Watchlist";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/profile" component={Profile} />
      <Route path="/agents" component={Agents} />
      <Route path="/transactions" component={Transactions} />
      <Route path="/activity" component={Activity} />
      <Route path="/wallet" component={Wallet} />
      <Route path="/swap" component={Swap} />
      <Route path="/tokens" component={TokenPulse} />
      <Route path="/watchlist" component={Watchlist} />
      <Route path="/settings" component={Settings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const sidebarStyle = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3.5rem",
  } as React.CSSProperties;

  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AuthProvider>
            <SidebarProvider style={sidebarStyle}>
              <div className="flex h-screen w-full" data-testid="app-container">
                <AppSidebar />
                <main className="flex-1 flex flex-col overflow-hidden bg-background" data-testid="main-content">
                  <Router />
                </main>
              </div>
              <ScanlineOverlay intensity="light" />
            </SidebarProvider>
          </AuthProvider>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
