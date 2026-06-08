import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useTeamPermissions } from "@/hooks/useTeamPermissions";
import { ShieldAlert } from "lucide-react";

interface RequireRoleProps {
  pageKey?: string;
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Garde de route : vérifie que l'utilisateur a le droit d'accéder à une page
 * admin spécifique selon role_permissions. Les admins ont accès à tout.
 */
export const RequireRole = ({ pageKey, children, fallback }: RequireRoleProps) => {
  const { loading, isStaff, isAdmin, can } = useTeamPermissions();

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }

  if (!isStaff) return <Navigate to="/client/dashboard" replace />;

  if (!isAdmin && pageKey && !can(pageKey)) {
    return (
      fallback ?? (
        <div className="p-8 text-center space-y-3 max-w-md mx-auto">
          <ShieldAlert className="h-12 w-12 mx-auto text-destructive" />
          <h2 className="text-xl font-semibold">Accès refusé</h2>
          <p className="text-sm text-muted-foreground">
            Vous n'avez pas la permission d'accéder à cette page. Contactez un administrateur.
          </p>
        </div>
      )
    );
  }

  return <>{children}</>;
};

export default RequireRole;
