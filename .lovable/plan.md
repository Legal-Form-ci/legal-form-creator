# Migration complète — à exécuter manuellement dans le SQL Editor Supabase

> **Important** : exécutez ce script **en une seule transaction** dans le SQL Editor.
> Toutes les opérations sont **idempotentes** (utilisent `IF NOT EXISTS` / `ON CONFLICT DO NOTHING`).
> Lien rapide : https://supabase.com/dashboard/project/xwtmnzorzsvkamqemddk/sql/new

---

## Contenu

1. Attacher les triggers manquants (les fonctions existent mais ne sont pas attachées).
2. Ajouter les Foreign Keys manquantes (factures, paiements, documents, messages, notifications).
3. Ajouter les index sur toutes les FK pour les performances.
4. Backfills : recalculer `referral_balance`, `total_referred`, `referral_code` pour les profils existants.
5. Permissions (`GRANT`) sur les tables impactées pour confirmer que PostgREST y accède.

---

```sql
-- =====================================================================
-- LOT MIGRATION COMPLÈTE — Relations + triggers + backfills
-- Projet : xwtmnzorzsvkamqemddk (LegalForm)
-- =====================================================================

BEGIN;

-- ---------------------------------------------------------------------
-- 1) TRIGGERS MANQUANTS (les fonctions existent déjà côté DB)
-- ---------------------------------------------------------------------

-- 1.a) updated_at automatique sur les tables métier
DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'profiles','company_requests','service_requests','invoices','payments',
    'request_messages','request_documents_exchange','identity_documents',
    'notifications','support_tickets','newsletter_campaigns','newsletter_automations',
    'newsletter_subscribers','blog_posts','news','faq','forum_topics','forum_replies',
    'testimonials','companies_showcase','ebooks','page_contents','referral_withdrawals',
    'referral_events','site_settings','team_members','role_permissions','user_roles',
    'contact_messages','company_associates','created_companies'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=t)
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name=t AND column_name='updated_at')
       AND NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_set_updated_at_'||t) THEN
      EXECUTE format(
        'CREATE TRIGGER trg_set_updated_at_%I BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()',
        t, t
      );
    END IF;
  END LOOP;
END $$;

-- 1.b) Génération du code de parrainage à la création d'un profil
DROP TRIGGER IF EXISTS trg_generate_referral_code ON public.profiles;
CREATE TRIGGER trg_generate_referral_code
  BEFORE INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.generate_referral_code();

-- 1.c) Génération du public_id sur les articles de blog
DROP TRIGGER IF EXISTS trg_generate_blog_public_id ON public.blog_posts;
CREATE TRIGGER trg_generate_blog_public_id
  BEFORE INSERT ON public.blog_posts
  FOR EACH ROW WHEN (NEW.public_id IS NULL)
  EXECUTE FUNCTION public.generate_blog_public_id();

-- 1.d) Crédit du parrain à la première facture payée
DROP TRIGGER IF EXISTS trg_credit_referrer_on_payment ON public.invoices;
CREATE TRIGGER trg_credit_referrer_on_payment
  AFTER UPDATE OF status ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.credit_referrer_on_payment();

-- ---------------------------------------------------------------------
-- 2) FOREIGN KEYS MANQUANTES
-- ---------------------------------------------------------------------

-- Helper : ajoute une FK seulement si elle n'existe pas
CREATE OR REPLACE FUNCTION public._add_fk_if_missing(
  p_table text, p_column text, p_ref_table text, p_ref_column text,
  p_on_delete text DEFAULT 'CASCADE'
) RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  fk_name text := 'fk_'||p_table||'_'||p_column;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_schema='public' AND table_name=p_table AND constraint_name=fk_name
  ) THEN
    EXECUTE format(
      'ALTER TABLE public.%I ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES public.%I(%I) ON DELETE %s',
      p_table, fk_name, p_column, p_ref_table, p_ref_column, p_on_delete
    );
  END IF;
END $$;

-- Relations métier (toutes via profiles.user_id et non auth.users)
SELECT public._add_fk_if_missing('invoices','request_id','company_requests','id','SET NULL');
SELECT public._add_fk_if_missing('payments','invoice_id','invoices','id','CASCADE');
SELECT public._add_fk_if_missing('payments','request_id','company_requests','id','SET NULL');
SELECT public._add_fk_if_missing('request_documents_exchange','request_id','company_requests','id','CASCADE');
SELECT public._add_fk_if_missing('request_messages','request_id','company_requests','id','CASCADE');
SELECT public._add_fk_if_missing('company_associates','company_request_id','company_requests','id','CASCADE');
SELECT public._add_fk_if_missing('referral_events','referrer_id','profiles','user_id','CASCADE');
SELECT public._add_fk_if_missing('referral_events','referred_id','profiles','user_id','CASCADE');
SELECT public._add_fk_if_missing('referral_withdrawals','user_id','profiles','user_id','CASCADE');
SELECT public._add_fk_if_missing('forum_replies','topic_id','forum_topics','id','CASCADE');
SELECT public._add_fk_if_missing('ebook_downloads','ebook_id','ebooks','id','CASCADE');
SELECT public._add_fk_if_missing('newsletter_send_logs','campaign_id','newsletter_campaigns','id','CASCADE');

-- (Les FK vers auth.users restent en place — ne pas modifier)

-- ---------------------------------------------------------------------
-- 3) INDEX POUR PERFS (sur toutes les FK + colonnes filtrées)
-- ---------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_invoices_user_id          ON public.invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_request_id       ON public.invoices(request_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status           ON public.invoices(status);
CREATE INDEX IF NOT EXISTS idx_payments_invoice_id       ON public.payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_request_id       ON public.payments(request_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id          ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status           ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_company_requests_user_id  ON public.company_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_company_requests_status   ON public.company_requests(status);
CREATE INDEX IF NOT EXISTS idx_service_requests_user_id  ON public.service_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_status   ON public.service_requests(status);
CREATE INDEX IF NOT EXISTS idx_req_msgs_request_id       ON public.request_messages(request_id);
CREATE INDEX IF NOT EXISTS idx_req_msgs_sender_id        ON public.request_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_req_docs_request_id       ON public.request_documents_exchange(request_id);
CREATE INDEX IF NOT EXISTS idx_req_docs_uploaded_by      ON public.request_documents_exchange(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id     ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read        ON public.notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_identity_docs_user_id     ON public.identity_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_referral_events_referrer  ON public.referral_events(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referral_events_referred  ON public.referral_events(referred_id);
CREATE INDEX IF NOT EXISTS idx_referral_withdrawals_user ON public.referral_withdrawals(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_referred_by      ON public.profiles(referred_by);
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code    ON public.profiles(referral_code);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id        ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role           ON public.user_roles(role);
CREATE INDEX IF NOT EXISTS idx_newsletter_logs_campaign  ON public.newsletter_send_logs(campaign_id);
CREATE INDEX IF NOT EXISTS idx_newsletter_logs_status    ON public.newsletter_send_logs(status);
CREATE INDEX IF NOT EXISTS idx_forum_replies_topic       ON public.forum_replies(topic_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published      ON public.blog_posts(is_published, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_published            ON public.news(is_published, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_request_messages_created  ON public.request_messages(created_at DESC);

-- ---------------------------------------------------------------------
-- 4) BACKFILLS — données existantes
-- ---------------------------------------------------------------------

-- 4.a) Générer les referral_code manquants
UPDATE public.profiles
SET referral_code = 'LF' || upper(substr(md5(random()::text || user_id::text), 1, 6))
WHERE referral_code IS NULL;

-- 4.b) Recalculer total_referred + referral_count à partir de profiles.referred_by
UPDATE public.profiles p
SET total_referred = sub.cnt,
    referral_count = sub.cnt
FROM (
  SELECT referred_by AS uid, COUNT(*) AS cnt
  FROM public.profiles
  WHERE referred_by IS NOT NULL
  GROUP BY referred_by
) sub
WHERE p.user_id = sub.uid;

-- 4.c) Recalculer referral_balance + referral_earnings à partir des events crédités
UPDATE public.profiles p
SET referral_earnings = COALESCE(sub.total, 0)
FROM (
  SELECT referrer_id, SUM(amount) AS total
  FROM public.referral_events
  WHERE event_type = 'first_payment'
  GROUP BY referrer_id
) sub
WHERE p.user_id = sub.referrer_id;

-- referral_balance = earnings - retraits payés
UPDATE public.profiles p
SET referral_balance = GREATEST(0, COALESCE(p.referral_earnings,0) - COALESCE(w.paid, 0))
FROM (
  SELECT user_id, SUM(amount) AS paid
  FROM public.referral_withdrawals
  WHERE status IN ('paid','approved')
  GROUP BY user_id
) w
WHERE p.user_id = w.user_id;

-- 4.d) Marquer les factures avec request_id manquant via les paiements liés
UPDATE public.invoices i
SET request_id = p.request_id
FROM public.payments p
WHERE p.invoice_id = i.id AND i.request_id IS NULL AND p.request_id IS NOT NULL;

-- 4.e) Compteurs forum
UPDATE public.forum_topics t
SET replies_count = COALESCE(sub.cnt, 0)
FROM (SELECT topic_id, COUNT(*) AS cnt FROM public.forum_replies GROUP BY topic_id) sub
WHERE t.id = sub.topic_id;

-- ---------------------------------------------------------------------
-- 5) GRANTS (rappel : PostgREST exige des GRANTs explicites)
-- ---------------------------------------------------------------------

GRANT SELECT, INSERT, UPDATE, DELETE ON public.invoices TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.request_messages TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.request_documents_exchange TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.referral_events TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.referral_withdrawals TO authenticated;
GRANT ALL ON public.invoices, public.payments, public.request_messages,
            public.request_documents_exchange, public.notifications,
            public.referral_events, public.referral_withdrawals TO service_role;

-- Nettoyage helper
DROP FUNCTION IF EXISTS public._add_fk_if_missing(text, text, text, text, text);

COMMIT;

-- =====================================================================
-- VÉRIFICATIONS POST-MIGRATION (à exécuter séparément après le COMMIT)
-- =====================================================================
-- SELECT tgname, tgrelid::regclass FROM pg_trigger WHERE tgname LIKE 'trg_%' ORDER BY 1;
-- SELECT conname, conrelid::regclass FROM pg_constraint WHERE conname LIKE 'fk_%' ORDER BY 1;
-- SELECT COUNT(*) FROM public.profiles WHERE referral_code IS NULL; -- doit être 0
```

---

## Notes après exécution

- Une fois le script lancé, le frontend (déjà mis à jour) verra immédiatement :
  - Les triggers `updated_at` automatiques.
  - Le code de parrainage généré à chaque inscription.
  - Le crédit automatique du parrain à la première facture payée d'un filleul.
- Les types TypeScript (`src/integrations/supabase/types.ts`) ne changent pas (pas de nouvelle colonne).
- Si une FK refuse de s'appliquer pour cause de données orphelines, vérifiez la table concernée :
  ```sql
  SELECT * FROM public.payments p
  WHERE p.invoice_id IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM public.invoices i WHERE i.id = p.invoice_id);
  ```
  Supprimez ou nettoyez les orphelins puis relancez la section concernée.
