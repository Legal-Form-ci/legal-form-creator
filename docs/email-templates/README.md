# Email Templates Legal Form - Instructions

## Templates HTML pour Supabase Auth

Ces templates doivent être copiés dans :
**Supabase Dashboard → Authentication → Email Templates**

URL : https://supabase.com/dashboard/project/xwtmnzorzsvkamqemddk/auth/templates

## Liens de redirection à configurer

Dans **Authentication → URL Configuration** :
- Site URL : `https://www.legalform.ci`
- Redirect URLs :
  - `https://www.legalform.ci/auth/callback`
  - `https://www.legalform.ci/client/dashboard`
  - `https://www.legalform.ci/admin/dashboard`
  - `https://www.legalform.ci/login`
  - `https://www.legalform.ci/auth`
  - `https://www.legalform.ci/reset-password`
  - `https://www.legalform.ci/forgot-password`

## Templates disponibles

1. `confirm-signup.html` - Confirmation d'inscription
2. `invite-user.html` - Invitation utilisateur
3. `magic-link.html` - Connexion par lien magique
4. `change-email.html` - Changement d'email
5. `reset-password.html` - Réinitialisation mot de passe
6. `reauthentication.html` - Réauthentification
