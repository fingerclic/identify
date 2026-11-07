# Identify — migration PostgreSQL isolée (préparation, 2026-11-07)

**STATUT : EN PRÉPARATION, NE PAS DÉPLOYER.** Cette branche n'est pas un SSO prêt pour la production. Elle ne doit pas être fusionnée avant les contrôles ci-dessous.

## Périmètre et responsabilités

- Identify = source unique des identités, rôles, sessions et autorisations.
- API centrale / Core = données métier ; **aucune migration directe ni réutilisation** de leur base de données.
- My Studio = projets, profils métier et accès actuellement liés à Supabase Auth ; garder les identifiants de projets et les règles RLS existantes jusqu'à la transition maîtrisée.
- Base PostgreSQL Identify **dédiée**, sauvegardes et droits séparés. `IDENTIFY_DATABASE_URL` ne doit jamais pointer sur la base API principale ou celle de My Studio.

## Ce qui est réalisé dans cette branche

- `src/server/prisma.ts` utilise maintenant le vrai `PrismaClient`, sans stockage JSON.
- `prisma/schema.prisma` utilise `IDENTIFY_DATABASE_URL`; codes `MYSTUDIO`, `CORE`, `FINT`, `CMS` et `WORKSPACE` ajoutés.
- `prisma/seed.ts` n'initialise que le catalogue des rôles, des permissions et des applications **après opt-in explicite**. Aucun compte administrateur, secret OAuth, mot de passe ou droit applicatif global.
- L'inscription crée l'utilisateur, le profil et les préférences avec des écritures relationnelles atomiques. Le rôle `USER` est attribué mais **aucune autorisation applicative par défaut**.
- L'octroi/retrait d'accès applicatif exige `apps:manage`.
- Vérification en lecture seule : `scripts/db-preflight.ts`.

## Étapes sur base de STAGING uniquement

1. Créer une nouvelle base/projet PostgreSQL dédiée à Identify, un utilisateur avec droits limités, et une sauvegarde externe chiffrée. **Ne pas utiliser la base de l'API actuelle.**
2. Sur une copie de travail, renseigner localement `IDENTIFY_DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET` (valeurs fortes, distinctes), et `NODE_ENV=development`. Ne jamais copier les valeurs dans GitHub ou le chat.
3. `npm ci` ; `npm run db:generate` ; `npm run db:validate` ; `npm run db:preflight`. Avant migration, le précontrôle doit indiquer que la connexion fonctionne et que les tables ne sont pas encore installées.
4. Générer un schéma SQL initial **dans un environnement isolé** : `npm run db:migrate:create`. Revoir le fichier SQL créé dans `prisma/migrations/`, puis le committer. **Il n'est pas encore présent dans cette branche ; aucune migration n'a été exécutée.**
5. Sur la base de staging uniquement : `npm run db:migrate:deploy`, puis `IDENTIFY_SEED_REFERENCE_DATA=YES npm run db:seed:reference`. Vérifier les rôles, les liens permissions et les codes d'applications.
6. Créer un compte de test non privilégié. Tester l'inscription, la connexion, les contrôles d'habilitation, les sessions, les révocations et la persistance au redémarrage.
7. Récupérer **de manière privée** une sauvegarde de l'instance Identify réellement utilisée. Inventorier les comptes, UUID / identifiants, organisations, liens et autorisations. Ne pas utiliser le `data_store.json` historique GitHub comme source présumée de production.
8. Établir une migration **avec table de correspondance**, sauvegarde complète, journal d'import et procédure de retour arrière. Ne pas réutiliser les secrets, mots de passe de démonstration, jetons de sessions, refresh tokens ou clés API du dépôt public. L'authentification des utilisateurs importés devra suivre une procédure de réinitialisation / réactivation sûre.
9. Finaliser OAuth/OIDC : vrai ID token, JWKS vérifiable, `iss/aud`, S256 PKCE, validation client et redirections, envoi e-mail de récupération, gestion du consentement, rotation et révocation des tokens.
10. Recette de staging avec Nexus, l'API et My Studio, ensuite seulement planifier une bascule contrôlée et réversible.

## Règles de sécurité et limites

- Les anciennes clés / sessions présentes dans l'historique Git doivent être considérées exposées et révoquées. Supprimer un fichier de la branche n'efface pas l'historique.
- Ne jamais exécuter `prisma db push`, `migrate reset`, `drop` ni une migration d'écriture sur les bases métier existantes.
- Le schéma SQL initial, l'inventaire des données de production, les tests de bout en bout et le déploiement ne sont **pas** encore achevés.
- Les domaines dans le catalogue sont des cibles d'architecture et ne prouvent pas leur disponibilité en ligne.
- Les routes de récupération du mot de passe et le SSO historique par URL sont désactivés dans la branche de sécurité jusqu'à leur remplacement.

## Critères de validation avant fusion

- CI `npm run lint`, `npm run build`, `npm run db:validate` et tests d'intégration réussis.
- Migration SQL examinée et testée sur base vierge et sur copie de données contrôlée.
- Plan de reprise/rollback et tests de restauration documentés.
- Aucun secret présent dans le code actuel, aucun secret historiquement exposé encore valide.
- Parcours utilisateurs sans rupture sur Nexus / My Studio, aucun élargissement des accès.
- Validation humaine explicite du changement de source d'identité et de la bascule.
