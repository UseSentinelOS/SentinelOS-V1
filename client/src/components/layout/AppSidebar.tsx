import { useLocation, Link } from "wouter";
import {
  Bot,
  LayoutDashboard,
  History,
  Settings,
  Wallet,
  Activity,
  Zap,
  Shield,
  ArrowLeftRight,
  User,
  Radio,
  Eye,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { GlitchText } from "@/components/terminal/GlitchText";
import logoImage from "@assets/Desain_tanpa_judul_(25)_1766740690478.png";
import { cn } from "@/lib/utils";

const mainNavItems = [
  {
    title: "dashboard",
    url: "/",
    icon: LayoutDashboard,
  },
  {
    title: "agents",
    url: "/agents",
    icon: Bot,
  },
  {
    title: "token pulse",
    url: "/tokens",
    icon: Radio,
  },
  {
    title: "watchlist",
    url: "/watchlist",
    icon: Eye,
  },
  {
    title: "transactions",
    url: "/transactions",
    icon: History,
  },
  {
    title: "activity",
    url: "/activity",
    icon: Activity,
  },
  {
    title: "swap",
    url: "/swap",
    icon: ArrowLeftRight,
  },
];

const settingsNavItems = [
  {
    title: "profile",
    url: "/profile",
    icon: User,
  },
  {
    title: "wallet",
    url: "/wallet",
    icon: Wallet,
  },
  {
    title: "settings",
    url: "/settings",
    icon: Settings,
  },
];

export function AppSidebar() {
  const [location] = useLocation();

  return (
    <Sidebar className="border-r border-sidebar-border" data-testid="sidebar">
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <Link href="/" className="flex items-center gap-3 group" data-testid="link-logo">
          <div className="relative w-10 h-10 animate-pulse-glow rounded-md overflow-hidden">
            <img
              src={logoImage}
              alt="SentinelOS"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="flex flex-col">
            <GlitchText
              as="span"
              className="font-display font-bold text-lg tracking-wider text-foreground"
              glitchOnHover
              glitchOnClick={false}
            >
              SENTINEL
            </GlitchText>
            <span className="text-[10px] font-mono text-terminal-purple uppercase tracking-widest">
              OS v1.0
            </span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupLabel className="font-mono text-xs uppercase tracking-widest text-muted-foreground px-2">
            <span className="text-terminal-green mr-1">{">"}</span>
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url}
                    className={cn(
                      "font-mono text-sm",
                      location === item.url &&
                        "bg-sidebar-accent text-terminal-purple"
                    )}
                  >
                    <Link href={item.url} data-testid={`nav-${item.title}`}>
                      <item.icon className="w-4 h-4" />
                      <span className="terminal-prompt">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="font-mono text-xs uppercase tracking-widest text-muted-foreground px-2">
            <span className="text-terminal-green mr-1">{">"}</span>
            System
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url}
                    className={cn(
                      "font-mono text-sm",
                      location === item.url &&
                        "bg-sidebar-accent text-terminal-purple"
                    )}
                  >
                    <Link href={item.url} data-testid={`nav-${item.title}`}>
                      <item.icon className="w-4 h-4" />
                      <span className="terminal-prompt">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
          <Shield className="w-3.5 h-3.5 text-terminal-green" />
          <span>ZK-Secured</span>
          <Zap className="w-3.5 h-3.5 text-terminal-purple ml-auto" />
          <span>Solana</span>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
