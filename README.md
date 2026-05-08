# Legal Form - Plateforme de Création d'Entreprises en Côte d'Ivoire

Propulsé par **IKNov** | [legalform.ci](https://www.legalform.ci)

## Présentation

Legal Form est la plateforme #1 de création d'entreprises en Côte d'Ivoire, couvrant toute la zone OHADA. Elle permet aux entrepreneurs de créer leur entreprise 100% en ligne : SARL, SARLU, EI, Association, ONG, GIE, SCI, Coopérative, Fondation, et Filiale étrangère.

## Stack Technique

- **Frontend** : React 18 + TypeScript + Vite 5 + Tailwind CSS
- **Backend** : Supabase (Auth, Database, Edge Functions, Storage)
- **IA** : IKNov AI Gateway (Gemini) pour l'assistant LexIA, le générateur d'articles et la traduction automatique
- **Paiement** : FedaPay (Mobile Money, Carte bancaire)
- **Langues** : Français (défaut), Anglais, Espagnol — traduction automatique du contenu dynamique

## Fonctionnalités

- Formulaire de création d'entreprise multi-étapes
- Tableau de bord client avec suivi en temps réel
- Tableau de bord administrateur complet
- Système de facturation et paiement en ligne
- Assistant IA « LexIA » pour le conseil juridique
- Générateur d'articles IA avec images
- Blog / Actualités avec partage social
- Forum communautaire
- Système de parrainage
- FAQ dynamique
- Traduction automatique multilingue
- Notifications en temps réel

## Démarrage

```bash
npm install
npm run dev
```

## Variables d'environnement

Les variables Supabase sont configurées automatiquement via `.env` :
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_PROJECT_ID`

## Déploiement

Le frontend se déploie via le bouton **Publish**. Les Edge Functions et migrations se déploient automatiquement.

## Licence

Propriétaire — IKNov © 2025-2026
