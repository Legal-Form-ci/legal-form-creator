import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface AdminPageHeaderProps {
  title: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  actions?: ReactNode;
  className?: string;
}

export const AdminPageHeader = ({ title, description, icon: Icon, actions, className }: AdminPageHeaderProps) => {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-border bg-gradient-to-br from-primary/10 via-card to-card p-5 sm:p-6 mb-6",
        className
      )}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start gap-3 sm:gap-4 min-w-0">
          {Icon && (
            <div className="shrink-0 p-2.5 sm:p-3 rounded-lg bg-primary/15 text-primary">
              <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
          )}
          <div className="min-w-0">
            <h1 className="font-heading font-bold text-xl sm:text-2xl lg:text-3xl text-foreground truncate">
              {title}
            </h1>
            {description && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{description}</p>
            )}
          </div>
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
      </div>
    </div>
  );
};

export default AdminPageHeader;
