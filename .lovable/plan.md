

# Plan d'implementation complet - LegalForm WebApp

Ce plan couvre toutes vos demandes, organise en phases prioritaires pour une execution efficace.

---

## Phase 1 : Corrections critiques et configuration de base

### 1.1 Corriger le `config.toml` (project_id incorrect)
Le fichier `supabase/config.toml` contient l'ancien project_id `qeznwyczskbjaeyhvuis` au lieu de `iagxlmcwmlnjgupmuwoh`. Cela empoche le bon fonctionnement des edge functions.

### 1.2 Creer le bucket de stockage
Aucun bucket de stockage n'existe actuellement. Migration SQL pour creer :
- Bucket `company-logos` (public) - pour logos, images d'articles, images de blog
- Politiques RLS pour permettre l'upload authentifie et la lecture publique

### 1.3 Creer la table `site_settings` si manquante
Le code reference deja `site_settings` (dans `useSiteSettings.tsx`). Verifier qu'elle existe, sinon la creer via migration.

### 1.4 Creer le compte super admin
La page `/admin/setup` existe deja avec les identifiants `admin@legalform.ci` / `@LegalForm2025`. L'edge function `create-super-admin` est fonctionnelle. Il suffit de naviguer vers `/admin/setup` pour l'initialiser.

---

## Phase 2 : Corrections des pages admin

### 2.1 Page "Base de donnees" bloquee sur chargement
Le `DatabaseManager.tsx` fait des requetes `select('*', { count: 'exact', head: true })` sur chaque table. Si les politiques RLS bloquent l'acces, ca reste en chargement infini. 
- Ajouter un `try/catch` avec timeout
- Afficher un message d'erreur si les tables ne sont pas accessibles
- S'assurer que les politiques RLS permettent aux admins de lire toutes les tables

### 2.2 Coherence du menu admin sur toutes les pages
`AdminLayout.tsx` est deja utilise par toutes les pages admin. Le menu sidebar est coherent. Verifier que TOUTES les pages admin l'utilisent bien (navigation "Utilisateurs" manquante dans le menu -- il faut l'ajouter).

Le menu actuel n'inclut PAS la page "Utilisateurs" (`/admin/users`) ni la page "FAQ" (`/admin/faq`). Les ajouter au tableau `navItems`.

### 2.3 Mode sombre/clair fonctionnel
Le bouton `toggleTheme` dans `AdminLayout` change seulement un etat local sans effet reel. Implementation :
- Integrer `next-themes` (deja installe) avec `ThemeProvider`
- Appliquer les classes Tailwind `dark:` dans le layout admin
- Synchroniser le theme entre les pages publiques et admin

### 2.4 Charte graphique admin = charte publique
L'admin utilise actuellement un theme slate/dark fixe. Pour harmoniser :
- Remplacer les couleurs hardcodees (`bg-slate-800`, `text-white`) par des variables CSS du theme (`bg-card`, `text-card-foreground`)
- Cela permettra aussi au mode clair de fonctionner

### 2.5 Responsivite des pages admin
Revue et correction de la responsivite sur toutes les pages admin. Les principales corrections :
- Tables avec `overflow-x-auto` partout
- Grilles adaptatives (`grid-cols-1 md:grid-cols-2 lg:grid-cols-4`)
- Formulaires en mode colonne sur mobile

---

## Phase 3 : Verification des fonctionnalites existantes

### 3.1 Affichage des clients avec codes de parrainage
La page `UsersManagement.tsx` requete deja les profils avec `referral_code`, `referral_link`, `referral_count`, `referral_earnings`. Le tableau les affiche. S'assurer que les politiques RLS permettent a l'admin de lire tous les profils.

### 3.2 Verification des prix sur les pages publiques
Apres analyse :
- **Index.tsx** : Aucun prix affiche (remplace par des avantages) -- OK
- **Pricing.tsx** : Aucun prix affiche, dit "devis personnalise" -- OK
- **Services.tsx** : Aucun prix affiche -- OK
- Les prix sont dans la page admin (Settings) uniquement -- OK

### 3.3 Redirection admin apres connexion
Le code dans `useAuth.tsx` redirige deja vers `/admin/dashboard` pour les roles admin/team et `/client/dashboard` pour les clients. Fonctionnel.

### 3.4 Assistant Legal Pro (LexIA)
Le chatbot appelle l'edge function `lexia-chat`. Verifier que le prompt systeme donne bien des fourchettes de prix sans montants exacts. Ajuster le prompt si necessaire.

---

## Phase 4 : Editeur de contenu IA avance

### 4.1 Upgrade de l'edge function `ai-content-generator`
- Accepter un input minimal (meme un seul mot, retirer la limite de 20 caracteres)
- Generer : titre, resume, contenu structure, categorie, tags, meta description, slug
- Ajouter un parametre `withImage` pour la generation d'image
- Utiliser le modele `google/gemini-2.5-flash-image` pour la generation d'images
- Stocker l'image generee dans le bucket de stockage
- Retourner l'URL de l'image

### 4.2 Nouveau composant `AIContentGenerator` ameliore
- Popup avec 2 options : "Avec image" / "Sans image"
- Indicateur de progression pendant la generation
- Remplissage automatique de TOUS les champs du formulaire (titre, resume, contenu, categorie, tags, auteur, slug, meta description)
- Le titre genere en majuscules, le resume en italique

### 4.3 Editeur WYSIWYG reel
L'editeur actuel est un textarea Markdown avec preview. Pour un vrai WYSIWYG :
- Utiliser `contentEditable` avec DOMPurify (deja installe) pour le rendu
- Barre d'outils avec formatage (gras, italique, titres, listes, tableaux)
- Aucun code HTML visible pour l'utilisateur
- Le contenu est stocke en Markdown en base, rendu en HTML dans l'editeur et sur les pages publiques via `react-markdown` + `rehype-raw`

### 4.4 Generation d'images IA
- Edge function appelle `google/gemini-2.5-flash-image` avec un prompt derive du contenu
- Image generee uploadee automatiquement dans le bucket `company-logos/blog/`
- URL retournee et injectee dans le champ `cover_image`
- L'utilisateur peut remplacer/supprimer l'image a tout moment

---

## Phase 5 : Deploiement cPanel / SafariCloud

### 5.1 Configuration du deploiement
Le deploiement sur cPanel via Git necessite :
- Corriger `.cpanel.yml` avec le bon chemin et la bonne version de Node
- Ajouter un fichier `.htaccess` dans le dossier `dist/` pour le routing SPA (toutes les routes redirigees vers `index.html`)
- Le fichier `index.js` a la racine n'est pas necessaire pour un build Vite

### 5.2 Fichier `.htaccess` pour le routing SPA
```text
RewriteEngine On
RewriteBase /
RewriteRule ^index\.html$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]
```

### 5.3 Alternative : GitHub Actions
Creer un workflow `.github/workflows/deploy.yml` qui :
1. Build le projet avec `npm run build`
2. Deploie via FTP/SFTP vers SafariCloud
3. Copie le `.htaccess` dans le dossier de deploiement

### 5.4 Variables d'environnement pour le build
S'assurer que les variables `VITE_SUPABASE_URL` et `VITE_SUPABASE_PUBLISHABLE_KEY` sont disponibles lors du build sur cPanel (soit dans `.env`, soit dans les variables d'environnement du serveur).

---

## Phase 6 : Synchronisation complete DB

### 6.1 Toutes les pages connectees a Supabase
Les tables existent deja (blog_posts, company_requests, profiles, user_roles, site_settings, etc.). Les pages frontend les utilisent deja. Verifier que :
- Les parametres du site sont lus depuis `site_settings` partout (via `useSiteSettings`)
- Les modifications dans la page Parametres sont synchronisees en temps reel (deja implemente via Realtime)

### 6.2 Politiques RLS completes
Creer/verifier les politiques RLS pour toutes les tables :
- `profiles` : lecture par l'utilisateur lui-meme + admins, ecriture par l'utilisateur
- `user_roles` : lecture par admins, creation uniquement via edge function
- `blog_posts` : lecture publique, ecriture par admins
- `site_settings` : lecture publique, ecriture par admins
- `company_requests` : lecture/ecriture par le proprietaire + admins
- Toutes les autres tables avec des politiques appropriees

---

## Resume des fichiers a modifier/creer

| Fichier | Action |
|---------|--------|
| `supabase/config.toml` | Corriger project_id |
| Migration SQL | Bucket storage + RLS policies |
| `src/pages/admin/AdminLayout.tsx` | Ajouter items menu manquants, theme dynamique |
| `src/pages/admin/DatabaseManager.tsx` | Fix chargement infini |
| `src/pages/admin/NewsManagement.tsx` | Editeur WYSIWYG + AI ameliore |
| `src/components/AIContentGenerator.tsx` | Popup avec options image |
| `supabase/functions/ai-content-generator/index.ts` | Support image + input minimal |
| `src/App.tsx` | Ajouter ThemeProvider |
| `.htaccess` | Creer pour routing SPA |
| `.cpanel.yml` | Corriger configuration |
| `.github/workflows/deploy.yml` | Creer workflow CI/CD |

---

## Ordre d'execution recommande

Vu l'ampleur du travail, je recommande de proceder en **3 messages** :

1. **Message 1** : Phases 1-2 (config, storage, corrections admin, theme)
2. **Message 2** : Phases 3-4 (verifications, editeur IA avance)
3. **Message 3** : Phases 5-6 (deploiement, RLS completes)

Chaque phase est independante et testable separement.

