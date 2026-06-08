# Plan — Finalisation complète production

4 lots livrés en parallèle. Tout passe par migrations + edge functions + UI admin/client + notifications déjà en place.

## Lot 1 — Rôles équipe granulaires & permissions

**Migration DB**
- Étendre l'enum `app_role` : `admin`, `team_support`, `team_content`, `team_finance`, `team`, `client`.
- Helper `public.has_any_role(_user_id uuid, _roles app_role[])` (SECURITY DEFINER).
- Helper `public.is_staff(_user_id uuid)` = admin OU tout team_*.
- Mettre à jour les policies RLS sensibles (factures, paiements, tickets, messages, contenus) pour utiliser `has_any_role` au lieu de `is_admin` seul.
- Table `role_permissions` (role → pages autorisées) pour piloter le menu admin.

**UI**
- `useTeamPermissions()` hook → expose `{canManageUsers, canManageContent, canManageFinance, canManageSupport, canManageSettings}`.
- `AdminLayout` : filtrage dynamique du menu selon rôle.
- `TeamManagement` : invitation membre + sélection rôle granulaire + révocation, envoi mail d'invitation.
- Garde de route `<RequireRole roles={[...]} />` sur chaque page `/admin/*`.

## Lot 2 — CRUD & relations clients ↔ demandes ↔ factures ↔ paiements ↔ documents

**Audit & corrections**
- Vérifier FK : `service_requests.user_id`, `company_requests.user_id`, `invoices.request_id`, `payments.invoice_id`, `request_documents_exchange.request_id`, `identity_documents.user_id`.
- Ajouter les FK manquantes + index.
- Trigger `set_updated_at` sur toutes les tables métier qui n'en ont pas.

**Edge functions** (toutes best-effort, ne bloquent pas le métier)
- `request-status-change` : update statut → notif client (in-app + email) + log audit.
- `invoice-lifecycle` : create/send/paid → mail + notif + génération PDF.
- `document-exchange-notify` : upload admin → alerte client ; upload client → alerte admins selon rôle (support/finance).
- `payment-confirmation` : webhook FedaPay déjà ok, brancher notif admin finance + email reçu client.

**UI**
- `ClientDashboard` : timeline unifiée (demandes, documents, factures, messages) avec actions CRUD.
- `CompanyDetail` (admin) : onglets Documents / Factures / Paiements / Messages / Historique — tous CRUD live.
- Boutons « marquer payée », « renvoyer facture », « générer reçu », « clôturer demande ».

## Lot 3 — Contenus publics (Blog, News, FAQ, Forum, Témoignages, Showcase, Pages, Ebooks)

- Audit CRUD admin de chaque table : create/edit/delete/publish/draft, image cover, SEO meta.
- Modération : témoignages et forum_replies → workflow `pending → approved/rejected` + notif auteur.
- Affichage public : vérifier filtre `is_published=true` partout + tri + pagination.
- Ebooks : tracker `ebook_downloads` + email avec lien sécurisé.
- `PageContentsAdmin` : édition WYSIWYG des blocs Home/About/Services/Contact.

## Lot 4 — Module parrainage (referral) finalisé

**Migration**
- Colonnes manquantes sur `profiles` : `referral_code` (unique, auto-généré), `referred_by` (uuid → profiles), `referral_balance` (numeric, default 0), `total_referred` (int, default 0).
- Table `referral_events` : `referrer_id`, `referred_id`, `event_type` (signup/first_payment/payout), `amount`, `status`.
- Trigger : à la première facture payée d'un filleul → créditer 10% au parrain dans `referral_balance` + insérer event.
- `referral_withdrawals` déjà existe → brancher workflow.

**Edge functions**
- `referral-generate-code` : à la création profil.
- `referral-credit` : déclenché par trigger paiement.
- `referral-payout-approve` : admin valide retrait → notif + email + statut updated.

**UI**
- `ReferralSection` (client) : code perso, lien à partager (boutons WhatsApp/FB/copier), solde, historique events, formulaire demande retrait (MTN/Orange/Wave).
- `/admin/referral-withdrawals` : liste demandes, approuver/rejeter, notes admin, export CSV.
- Bandeau dashboard client : « Tu as X filleuls / Y FCFA disponibles ».

## Ordre d'exécution

1. Migration unique consolidée (roles + permissions + referral + FK manquantes + triggers).
2. Edge functions déployées en parallèle.
3. Hooks + composants partagés (`useTeamPermissions`, `RequireRole`).
4. Pages admin & client mises à jour en parallèle par lot.
5. Vérif build + smoke test des principaux flux.

## Détails techniques

- Aucune modification du logo email (déjà OK).
- Réutilisation de `src/lib/notify.ts` et `notify-message-thread`.
- Pas de changement design system, juste tokens existants.
- Tous les `service_role` côté edge functions ; jamais exposés client.

## Hors scope

- Pas de refonte UI/UX, pas de nouveau provider de paiement, pas de migration de stack.
- Pas de tests E2E automatisés (uniquement vérifs build + lints).