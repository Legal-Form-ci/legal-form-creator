import { NavLink } from "react-router-dom";
import { Mail, Send, ScrollText, Zap, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { to: "/admin/marketing", label: "Vue d'ensemble", icon: LayoutGrid, end: true },
  { to: "/admin/newsletter/compose", label: "Composer & Envoyer", icon: Send },
  { to: "/admin/newsletter", label: "Abonnés", icon: Mail },
  { to: "/admin/newsletter/automations", label: "Automatisations", icon: Zap },
  { to: "/admin/newsletter/logs", label: "Journal d'envois", icon: ScrollText },
];

export const MarketingTabs = () => {
  return (
    <div className="mb-6 overflow-x-auto">
      <div className="inline-flex items-center gap-1 rounded-lg border border-border bg-card p-1 min-w-full sm:min-w-0">
        {tabs.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            end={t.end}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )
            }
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </NavLink>
        ))}
      </div>
    </div>
  );
};

export default MarketingTabs;
