
-- =========================================================================
-- LOT 1 (suite) : Helpers + role_permissions
-- =========================================================================

CREATE OR REPLACE FUNCTION public.has_any_role(_user_id uuid, _roles app_role[])
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = ANY(_roles)
  )
$$;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin'::app_role, 'team'::app_role, 'team_support'::app_role, 'team_content'::app_role, 'team_finance'::app_role)
  )
$$;

REVOKE EXECUTE ON FUNCTION public.has_any_role(uuid, app_role[]) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_staff(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_any_role(uuid, app_role[]) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_staff(uuid) TO authenticated, service_role;

-- Table de permissions par rôle
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role app_role NOT NULL,
  page_key text NOT NULL,
  can_view boolean NOT NULL DEFAULT true,
  can_edit boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(role, page_key)
);

GRANT SELECT ON public.role_permissions TO authenticated;
GRANT ALL ON public.role_permissions TO service_role;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can read role_permissions"
  ON public.role_permissions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Only admins manage role_permissions"
  ON public.role_permissions FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Seed permissions par défaut
INSERT INTO public.role_permissions (role, page_key, can_view, can_edit) VALUES
  ('admin', '*', true, true),
  ('team', 'dashboard', true, false),
  ('team', 'companies', true, true),
  ('team', 'messages', true, true),
  ('team', 'tickets', true, true),
  ('team_support', 'dashboard', true, false),
  ('team_support', 'messages', true, true),
  ('team_support', 'tickets', true, true),
  ('team_support', 'contacts', true, true),
  ('team_support', 'lexia', true, false),
  ('team_content', 'dashboard', true, false),
  ('team_content', 'news', true, true),
  ('team_content', 'faq', true, true),
  ('team_content', 'forum', true, true),
  ('team_content', 'testimonials', true, true),
  ('team_content', 'showcase', true, true),
  ('team_content', 'pages', true, true),
  ('team_content', 'newsletter', true, true),
  ('team_finance', 'dashboard', true, false),
  ('team_finance', 'invoices', true, true),
  ('team_finance', 'payments', true, true),
  ('team_finance', 'companies', true, true),
  ('team_finance', 'referral-withdrawals', true, true)
ON CONFLICT (role, page_key) DO NOTHING;

-- =========================================================================
-- LOT 4 : Module parrainage
-- =========================================================================

-- Colonnes profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS referral_code text UNIQUE,
  ADD COLUMN IF NOT EXISTS referred_by uuid REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS referral_balance numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_referred integer NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON public.profiles(referral_code);
CREATE INDEX IF NOT EXISTS idx_profiles_referred_by ON public.profiles(referred_by);

-- Table d'événements
CREATE TABLE IF NOT EXISTS public.referral_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL,
  referred_id uuid NOT NULL,
  event_type text NOT NULL CHECK (event_type IN ('signup','first_payment','payout','adjustment')),
  amount numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'completed',
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.referral_events TO authenticated;
GRANT ALL ON public.referral_events TO service_role;
ALTER TABLE public.referral_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see their own referral events"
  ON public.referral_events FOR SELECT TO authenticated
  USING (referrer_id = auth.uid() OR referred_id = auth.uid() OR public.is_admin(auth.uid()));

CREATE POLICY "Admins manage all referral events"
  ON public.referral_events FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE INDEX IF NOT EXISTS idx_referral_events_referrer ON public.referral_events(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referral_events_referred ON public.referral_events(referred_id);

-- Génération du code de parrainage
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_code text;
  attempt int := 0;
BEGIN
  IF NEW.referral_code IS NOT NULL THEN
    RETURN NEW;
  END IF;
  LOOP
    new_code := 'LF' || upper(substr(md5(random()::text || NEW.user_id::text), 1, 6));
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE referral_code = new_code) THEN
      NEW.referral_code := new_code;
      RETURN NEW;
    END IF;
    attempt := attempt + 1;
    IF attempt > 10 THEN
      NEW.referral_code := 'LF' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8));
      RETURN NEW;
    END IF;
  END LOOP;
END;
$$;

DROP TRIGGER IF EXISTS trg_generate_referral_code ON public.profiles;
CREATE TRIGGER trg_generate_referral_code
  BEFORE INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.generate_referral_code();

-- Backfill : codes pour profils existants
UPDATE public.profiles SET referral_code = 'LF' || upper(substr(md5(random()::text || user_id::text), 1, 6))
WHERE referral_code IS NULL;

-- Crédit automatique sur première facture payée
CREATE OR REPLACE FUNCTION public.credit_referrer_on_payment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referrer uuid;
  v_commission numeric;
  v_is_first boolean;
BEGIN
  -- Déclencher seulement quand le statut passe à 'paid'
  IF NEW.status <> 'paid' OR (OLD.status = 'paid') THEN
    RETURN NEW;
  END IF;

  -- Trouver le parrain du client
  SELECT referred_by INTO v_referrer FROM public.profiles WHERE user_id = NEW.user_id;
  IF v_referrer IS NULL THEN RETURN NEW; END IF;

  -- Vérifier si c'est la première facture payée du filleul
  SELECT NOT EXISTS (
    SELECT 1 FROM public.invoices
    WHERE user_id = NEW.user_id AND status = 'paid' AND id <> NEW.id
  ) INTO v_is_first;

  IF NOT v_is_first THEN RETURN NEW; END IF;

  -- 10% de commission
  v_commission := round(COALESCE(NEW.amount, 0) * 0.10);

  IF v_commission <= 0 THEN RETURN NEW; END IF;

  -- Créditer le solde du parrain
  UPDATE public.profiles
    SET referral_balance = referral_balance + v_commission,
        total_referred = total_referred + 1
    WHERE user_id = v_referrer;

  -- Enregistrer l'événement
  INSERT INTO public.referral_events (referrer_id, referred_id, event_type, amount, metadata)
  VALUES (v_referrer, NEW.user_id, 'first_payment', v_commission,
          jsonb_build_object('invoice_id', NEW.id, 'invoice_amount', NEW.amount));

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_credit_referrer ON public.invoices;
CREATE TRIGGER trg_credit_referrer
  AFTER UPDATE OF status ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.credit_referrer_on_payment();
