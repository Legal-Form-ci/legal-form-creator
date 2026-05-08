import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";
import { 
  LayoutDashboard, Users, Building2, FileText, MessageSquare, Settings, CreditCard,
  Star, LogOut, Menu, X, ChevronDown, ChevronRight, BarChart3, Briefcase, Newspaper,
  Database, Sun, Moon, Shield, Wallet, BookOpen, HelpCircle, MessagesSquare, Contact,
  Trophy, UserCog, Receipt, IdCard
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { NotificationPanel } from "@/components/admin/NotificationPanel";
import logo from "@/assets/logo.png";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

interface NavGroup {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  items: NavItem[];
}

const AdminLayout = ({ children }: { children?: React.ReactNode }) => {
  const { user, userRole, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Admin dark mode is stored separately from public site
  const getInitialAdminDarkMode = () => {
    if (typeof window === "undefined") return true;
    const saved = localStorage.getItem("admin-theme");
    if (saved === "light") return false;
    return true; // Default dark for admin
  };

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [isDarkMode, setIsDarkMode] = useState(getInitialAdminDarkMode);

  const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotifications } = useRealtimeNotifications(userRole === 'admin');

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate("/auth", { replace: true });
      return;
    }
    if (userRole !== null && userRole !== "admin" && userRole !== "team") {
      navigate("/client/dashboard", { replace: true });
    }
  }, [user, userRole, loading, navigate]);

  // Apply admin theme ONLY to admin scope, restore public theme on unmount
  useEffect(() => {
    // Save current public theme
    const publicTheme = localStorage.getItem("theme");
    
    // Apply admin theme
    document.documentElement.classList.toggle("dark", isDarkMode);
    localStorage.setItem("admin-theme", isDarkMode ? "dark" : "light");

    return () => {
      // Restore public theme when leaving admin
      const shouldBeDark = publicTheme === "dark";
      document.documentElement.classList.toggle("dark", shouldBeDark);
    };
  }, [isDarkMode]);

  // Auto-open group containing active route
  useEffect(() => {
    navGroups.forEach((group) => {
      if (group.items.some((item) => location.pathname === item.href)) {
        setOpenGroups((prev) => ({ ...prev, [group.label]: true }));
      }
    });
  }, [location.pathname]);

  const navGroups: NavGroup[] = [
    {
      label: "Général",
      icon: LayoutDashboard,
      items: [
        { label: "Tableau de bord", href: "/admin/dashboard", icon: LayoutDashboard },
        { label: "Statistiques", href: "/admin/analytics", icon: BarChart3 },
      ]
    },
    {
      label: "Clients & Demandes",
      icon: Users,
      items: [
        { label: "Créations d'entreprise", href: "/admin/companies", icon: Building2 },
        { label: "Demandes de services", href: "/admin/services", icon: Briefcase },
        { label: "Documents ID", href: "/admin/identity-documents", icon: IdCard },
        { label: "Utilisateurs", href: "/admin/users", icon: Users },
      ]
    },
    {
      label: "Communication",
      icon: MessageSquare,
      items: [
        { label: "Messagerie", href: "/admin/messages", icon: MessagesSquare },
        { label: "Contacts", href: "/admin/contacts", icon: Contact },
        { label: "Tickets", href: "/admin/tickets", icon: MessageSquare },
        { label: "Conversations Legal Pro", href: "/admin/lexia", icon: MessageSquare },
      ]
    },
    {
      label: "Contenu",
      icon: Newspaper,
      items: [
        { label: "Actualités", href: "/admin/news", icon: Newspaper },
        { label: "Newsletter — Abonnés", href: "/admin/newsletter", icon: Newspaper },
        { label: "Newsletter — Composer", href: "/admin/newsletter/compose", icon: Newspaper },
        { label: "Newsletter — Journal", href: "/admin/newsletter/logs", icon: Newspaper },
        { label: "Forum", href: "/admin/forum", icon: MessagesSquare },
        { label: "Témoignages", href: "/admin/testimonials", icon: Star },
        { label: "Réalisations", href: "/admin/showcase", icon: Trophy },
        { label: "FAQ", href: "/admin/faq", icon: HelpCircle },
      ]
    },
    {
      label: "Finances",
      icon: CreditCard,
      items: [
        { label: "Paiements", href: "/admin/payments", icon: CreditCard },
        { label: "Factures", href: "/admin/invoices", icon: Receipt },
        { label: "Retraits parrainage", href: "/admin/referral-withdrawals", icon: Wallet },
      ]
    },
    {
      label: "Système",
      icon: Settings,
      items: [
        { label: "Équipe interne", href: "/admin/team", icon: UserCog },
        { label: "Base de données", href: "/admin/database", icon: Database },
        { label: "Documentation", href: "/admin/documentation", icon: BookOpen },
        { label: "Paramètres", href: "/admin/settings", icon: Settings },
      ]
    },
  ];

  const toggleGroup = (label: string) => {
    setOpenGroups(prev => ({ ...prev, [label]: !prev[label] }));
  };

  const toggleTheme = () => {
    setIsDarkMode((prev) => !prev);
  };

  const isActive = (href: string) => location.pathname === href;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const renderNavItems = (items: NavItem[], onClickExtra?: () => void) => (
    items.map((item) => {
      const Icon = item.icon;
      return (
        <button
          key={item.href}
          onClick={() => { navigate(item.href); onClickExtra?.(); }}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2 rounded-md transition-all text-left text-sm",
            isActive(item.href)
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <Icon className="h-4 w-4 flex-shrink-0" />
          <span className="flex-1 truncate">{item.label}</span>
          {item.badge && item.badge > 0 && (
            <Badge className="bg-destructive text-destructive-foreground text-xs h-5 min-w-[20px] flex items-center justify-center">{item.badge}</Badge>
          )}
        </button>
      );
    })
  );

  return (
    <div className="admin-theme-scope min-h-screen bg-background text-foreground flex">
      {/* Sidebar - Desktop */}
      <aside className={cn(
        "fixed left-0 top-0 h-full bg-card border-r border-border transition-all duration-300 z-40 hidden lg:flex flex-col",
        sidebarOpen ? "w-64" : "w-16"
      )}>
        <div className="p-3 border-b border-border flex items-center gap-3">
          <img src={logo} alt="Legal Form" className="h-9 w-9 flex-shrink-0" />
          {sidebarOpen && (
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-sm text-primary truncate">Legal Form</span>
              <span className="text-[10px] text-muted-foreground">Administration</span>
            </div>
          )}
        </div>

        <nav className="flex-1 py-2 px-2 space-y-1 overflow-y-auto scrollbar-thin">
          {sidebarOpen ? (
            navGroups.map((group) => {
              const GroupIcon = group.icon;
              const isOpen = openGroups[group.label] ?? false;
              const hasActive = group.items.some(i => isActive(i.href));
              return (
                <div key={group.label}>
                  <button
                    onClick={() => toggleGroup(group.label)}
                    className={cn(
                      "w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs font-semibold uppercase tracking-wider transition-colors",
                      hasActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <GroupIcon className="h-4 w-4 flex-shrink-0" />
                    <span className="flex-1 text-left">{group.label}</span>
                    <ChevronRight className={cn("h-3 w-3 transition-transform", isOpen && "rotate-90")} />
                  </button>
                  {isOpen && (
                    <div className="ml-2 pl-2 border-l border-border space-y-0.5 mb-1">
                      {renderNavItems(group.items)}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            navGroups.flatMap(g => g.items).map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.href}
                  onClick={() => navigate(item.href)}
                  title={item.label}
                  className={cn(
                    "w-full flex items-center justify-center p-2.5 rounded-md transition-all",
                    isActive(item.href)
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className="h-5 w-5" />
                </button>
              );
            })
          )}
        </nav>

        <div className="p-2 border-t border-border space-y-1">
          {sidebarOpen && (
            <div className="flex justify-center mb-1">
              <NotificationPanel
                notifications={notifications}
                unreadCount={unreadCount}
                onMarkAsRead={markAsRead}
                onMarkAllAsRead={markAllAsRead}
                onClear={clearNotifications}
              />
            </div>
          )}
          <Button variant="ghost" size="sm" onClick={toggleTheme} className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-muted h-9">
            {isDarkMode ? <Sun className="h-4 w-4 mr-2" /> : <Moon className="h-4 w-4 mr-2" />}
            {sidebarOpen && (isDarkMode ? "Mode clair" : "Mode sombre")}
          </Button>
          <Button variant="ghost" size="sm" onClick={signOut} className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-muted h-9">
            <LogOut className="h-4 w-4 mr-2" />
            {sidebarOpen && "Déconnexion"}
          </Button>
        </div>

        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute -right-3 top-20 bg-card border border-border rounded-full p-1 hover:bg-accent transition-colors shadow-sm"
        >
          <ChevronDown className={cn("h-3 w-3 transition-transform", sidebarOpen ? "-rotate-90" : "rotate-90")} />
        </button>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-card border-b border-border z-50 flex items-center justify-between px-3">
        <div className="flex items-center gap-2">
          <img src={logo} alt="Legal Form" className="h-7 w-7" />
          <span className="font-bold text-sm text-primary">Legal Form</span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleTheme}>
            {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <NotificationPanel notifications={notifications} unreadCount={unreadCount} onMarkAsRead={markAsRead} onMarkAllAsRead={markAllAsRead} onClear={clearNotifications} />
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2">
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 bg-background z-40 pt-14 overflow-y-auto">
          <nav className="p-3 space-y-1">
            {navGroups.map((group) => {
              const GroupIcon = group.icon;
              const isOpen = openGroups[group.label] ?? false;
              return (
                <div key={group.label}>
                  <button onClick={() => toggleGroup(group.label)} className="w-full flex items-center gap-2 px-3 py-2.5 rounded-md text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <GroupIcon className="h-4 w-4" />
                    <span className="flex-1 text-left">{group.label}</span>
                    <ChevronRight className={cn("h-3 w-3 transition-transform", isOpen && "rotate-90")} />
                  </button>
                  {isOpen && (
                    <div className="ml-3 pl-3 border-l border-border space-y-0.5 mb-2">
                      {renderNavItems(group.items, () => setMobileMenuOpen(false))}
                    </div>
                  )}
                </div>
              );
            })}
            <div className="pt-3 border-t border-border mt-3">
              <Button variant="ghost" size="sm" onClick={signOut} className="w-full justify-start text-muted-foreground hover:text-foreground">
                <LogOut className="h-4 w-4 mr-2" />Déconnexion
              </Button>
            </div>
          </nav>
        </div>
      )}

      {/* Main Content */}
      <main className={cn(
        "flex-1 transition-all duration-300 min-h-screen",
        "lg:ml-64 pt-14 lg:pt-0",
        !sidebarOpen && "lg:ml-16"
      )}>
        <div className="p-4 md:p-6">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
