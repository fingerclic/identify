# Fingerclic Identify

Gestion des identités de l'écosystème Fingerclic : utilisateurs, rôles, permissions, sessions et applications.

## État du code

**Branche de sécurisation / migration PostgreSQL : staging uniquement, non déployable en production.**

Le client Prisma réel utilise désormais `IDENTIFY_DATABASE_URL` pour une base PostgreSQL **dédiée**. Le stockage JSON de démonstration n'est plus utilisé. Les comptes My Studio et la base de l'API centrale ne sont pas modifiés.

### Préparation locale

1. Installer les dépendances : `npm ci`.
2. Copier `.env.example` vers un fichier `.env` local et définir **des secrets différents et privés** ainsi qu'une URL de base PostgreSQL isolée.
3. Générer le client : `npm run db:generate`.
4. Valider le schéma : `npm run db:validate`.
5. Contrôler la connexion sans modification : `npm run db:preflight`.
6. En staging uniquement : préparer/revoir une migration SQL, l'appliquer avec `npm run db:migrate:deploy`, puis initialiser les données de référence avec `IDENTIFY_SEED_REFERENCE_DATA=YES npm run db:seed:reference`.
7. Vérifier types et build : `npm run lint` et `npm run build`.

La migration SQL produite par GitHub Actions est **un aperçu de génération** ; elle n'est pas encore une migration validée et déployée. Voir [le plan de migration](docs/IDENTIFY_POSTGRESQL_MIGRATION.md) et [le rapport de sécurité](SECURITY_REVIEW_2026-11-07.md).

## Limitations à résoudre avant toute mise en service

- Terminer OAuth/OIDC et le SSO réels (PKCE S256, signature asymétrique, JWKS, client authentication, consentement).
- Ajouter la récupération sécurisée de mot de passe par e-mail.
- Préserver et migrer les identités/autorités existantes uniquement après inventaire et test de restauration.
- Renouveler tous les secrets historiquement exposés et invalider les sessions affectées.
- Exécuter des tests d'intégration et définir un retour arrière vérifié.

**Ne pas fusionner ni déployer cette branche tant que ces conditions ne sont pas satisfaites.**
