# Refonte globale LegalForm + corrections mailing

L'ampleur demandée (refonte complète public + admin + premium + tous formulaires/dashboards + 5 chantiers mailing) représente plusieurs dizaines d'heures de travail. Pour livrer du **propre**, je découpe en lots livrables. Tu valides ce plan, j'enchaîne lot par lot sans nouvelles questions.

---

## LOT 1 — Fondations design (charte + popup) — *immédiat*

1. **Charte graphique alignée logo** dans `src/index.css` :
   - Primary teal `#0f766e` (déjà en place, on le garde — c'est la couleur du logo)
   - Accent or/jaune réservé aux highlights (CTA secondaires, badges premium)
   - Tokens : `--surface`, `--surface-elevated`, `--border-soft`, `--shadow-premium`, `--gradient-hero`, `--radius-premium`
   - Typo : Inter (UI) + Playfair Display (titres premium)
2. **Fix WelcomePopup responsive** : `max-w-[min(560px,calc(100vw-2rem))]`, `max-h-[calc(100dvh-2rem)]`, scroll interne, padding mobile, fermeture tactile.
3. Spacing system unifié (8/12/16/24/32/48/64).

## LOT 2 — Navbar + Hero carousel actualités

1. **Header refait** inspiré Belife :
   - Top-bar fine (contact + réseaux + langue)
   - Nav principale centrée, espacée, avec mega-menu sur "Services"
   - Bouton "Mon Espace" / "Connexion" **détaché**, pill arrondi, gradient teal→teal-glow, ombre douce
   - Menu mobile drawer plein écran
2. **Hero carousel actualités** sur `/` :
   - Pull `news` table (limit 5, ordre `published_at desc`)
   - Embla autoplay 6s, flèches, dots, pause au hover
   - Slide : image full-bleed + overlay gradient + titre + résumé + CTA "Lire l'article"
   - Responsive 16:9 desktop, 4:3 tablette, 4:5 mobile

## LOT 3 — Mailing : éditeur visuel + logs + monitoring

1. **Page `/admin/newsletter/logs`** : filtres campagne / provider / statut / date + recherche email + colonne provider (parse `via:brevo|via:resend` depuis `error_message`).
2. **Monitoring temps-réel** : abonnement realtime sur `newsletter_send_logs` filtré par campagne, barre de progression live, compteurs succès/échec, liste des échecs déroulable.
3. **Éditeur visuel campagnes** : bloc-builder (Header / Texte / Image / Bouton / Séparateur / Citation), réordonnable, upload image vers bucket `newsletter-assets`, upload document → lien attaché, preview live, sérialisation JSON + génération HTML branded.
4. **Auto-send Actualités/Opportunités** : table `newsletter_automations` (source, frequency, segment, time_of_day, last_run_at, is_active), edge function `auto-newsletter-dispatch` planifiée par pg_cron (toutes les heures) qui crée et envoie une campagne pour chaque actualité/opportunité non encore diffusée selon les règles.

## LOT 4 — Refonte pages publiques

Pages : Home, Services, Pricing, About, Contact, Blog, News, Forum, Testimonials, FAQ, Ebooks, Showcase.
Patterns : sections aérées (py-20 lg:py-28), grilles 12 cols, cards `rounded-2xl shadow-premium`, micro-anims `fade-in` + `hover-scale`, illustrations / icônes Lucide cohérentes.

## LOT 5 — Refonte espaces authentifiés

- Client : Dashboard, Profile, Messages, RequestDetail, Payment.
- Admin : tous les modules sous `/admin/*` — sidebar repensée, headers de page unifiés, tableaux responsive (cards en mobile), formulaires en `<Form>` shadcn cohérents.
- Premium : badges, gradient or, séparation visuelle claire.

## LOT 6 — QA responsive globale

Pass mobile (375), tablette (768), desktop (1280, 1536) sur chaque page modifiée. Correction overflows, alignements, touch targets ≥44px.

---

## Ce que je fais MAINTENANT si tu approuves

Je démarre **LOT 1 + LOT 2 + popup fix** dans un seul cycle (les fondations conditionnent tout le reste). Puis j'enchaîne LOT 3 (mailing complet) dans le cycle suivant. LOT 4–6 viendront ensuite, page par page, en te montrant l'avancement.

Ordre : **1+2 → 3 → 4 → 5 → 6**.

Approuve pour que je lance LOT 1+2 immédiatement.
