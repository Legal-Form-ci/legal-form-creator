
-- =========================================================================
-- LOT 1 : Rôles équipe granulaires
-- =========================================================================

-- 1. Étendre l'enum app_role
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'team_support';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'team_content';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'team_finance';
