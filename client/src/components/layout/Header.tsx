import { SidebarTrigger } from "@/components/ui/sidebar";
import { WalletButton } from "@/components/wallet/WalletButton";
import { NetworkStatus } from "@/components/layout/NetworkStatus";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { LiveNotifications } from "@/components/notifications/LiveNotifications";

interface HeaderProps {
  title?: string;
}

export function Header({ title }: HeaderProps) {
  return (
    <header
      className="flex items-center justify-between gap-4 p-3 border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-40"
      data-testid="header"
    >
      <div className="flex items-center gap-3">
        <SidebarTrigger
          className="text-muted-foreground hover:text-foreground"
          data-testid="button-sidebar-toggle"
        />
        {title && (
          <h1
            className="font-display font-semibold text-lg tracking-wide"
            data-testid="text-page-title"
          >
            {title}
          </h1>
        )}
      </div>
      <div className="flex items-center gap-4">
        <LiveNotifications />
        <NetworkStatus />
        <ThemeToggle />
        <WalletButton />
      </div>
    </header>
  );
}
