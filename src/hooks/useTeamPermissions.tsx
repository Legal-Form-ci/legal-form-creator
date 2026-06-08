import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type AppRole = "admin" | "team" | "team_support" | "team_content" | "team_finance" | "client";

export interface TeamPermissions {
  loading: boolean;
  role: AppRole | null;
  isStaff: boolean;
  isAdmin: boolean;
  allowedPages: Set<string>;
  can: (pageKey: string) => boolean;
}

const STAFF_ROLES: AppRole[] = ["admin", "team", "team_support", "team_content", "team_finance"];

export const useTeamPermissions = (): TeamPermissions => {
  const { userRole, loading: authLoading } = useAuth();
  const [allowedPages, setAllowedPages] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const role = (userRole as AppRole | null) ?? null;
  const isAdmin = role === "admin";
  const isStaff = role ? STAFF_ROLES.includes(role) : false;

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!role || !isStaff) {
        setAllowedPages(new Set());
        setLoading(false);
        return;
      }
      if (isAdmin) {
        setAllowedPages(new Set(["*"]));
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from("role_permissions")
        .select("page_key, can_view")
        .eq("role", role)
        .eq("can_view", true);
      if (cancelled) return;
      setAllowedPages(new Set((data || []).map((r: any) => r.page_key)));
      setLoading(false);
    };
    if (!authLoading) load();
    return () => {
      cancelled = true;
    };
  }, [role, isStaff, isAdmin, authLoading]);

  const can = (pageKey: string) => isAdmin || allowedPages.has("*") || allowedPages.has(pageKey);

  return { loading: loading || authLoading, role, isStaff, isAdmin, allowedPages, can };
};
