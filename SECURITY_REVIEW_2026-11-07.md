# Identify P0 security review — 2026-11-07

## Status

**Draft only — DO NOT MERGE OR DEPLOY.** Production currently relies on code paths which must be replaced or migrated before these fail-closed changes can be deployed.

## Changes in this branch

- Require distinct, strong `JWT_SECRET` and `JWT_REFRESH_SECRET`; no public fallback secrets.
- Require explicit development bootstrap credentials and Nexus OAuth client secret; remove literal development credentials from source.
- Block production startup if the JSON-backed Prisma shim is still in use.
- Remove tracked `prisma/data_store.json` and ignore it henceforth.
- Exact-match OAuth redirect URI allowlisting.
- Stop returning email-verification tokens in registration API responses.
- Temporarily disable password recovery until an out-of-band email delivery provider is implemented; never return reset secrets via public API.
- Set short-lived (15 minute) HttpOnly session cookies and `Secure` in production.
- Disable unrestricted logout redirects and legacy cross-app SSO JWT-in-query-string handoff.

## Important: secrets remain compromised until rotated

Deleting a file from the latest branch does **not** remove its contents from the Git history, releases, archives, clones, or forks. Treat all previously committed JWT fallback keys, OAuth client secrets, account credentials, API keys, and session / refresh tokens in JSON files as potentially exposed. Rotate **server-side** credentials and revoke sessions securely after identifying live users and dependencies. Do not paste any secret into issues, pull requests, screenshots or chats.

## Production prerequisites

1. Inventory the deployed Identify hosting, runtime, environment and backups. Determine if production is running this codebase, and if any JSON data needs preserving.
2. Replace the in-process JSON Prisma mock with a real, isolated PostgreSQL Prisma instance. Build migrations, backups and reversible user/session migration with role and application-grant mapping. Do not overwrite the existing central API or My Studio user stores.
3. Rotate exposed credentials, invalidate leaked tokens, and audit the development super-admin and OAuth clients.
4. Implement and test email verification/reset via a trusted delivery service, token hashing, expiry, single-use, and response enumeration controls.
5. Complete OIDC implementation: proper asymmetric signing and public JWKS, `iss`/`aud` claims, issuer configured from trusted settings, strict Authorization Code + S256 PKCE requirements, client verification, atomic code consumption, CSRF/state validation, consent, and verified registered post-logout redirects.
6. Remove `token` query parameter acceptance for authentication. Bind authenticated sessions to revocation and inactivity enforcement.
7. Integrate My Studio's existing Supabase Auth and the API's separate auth into an explicit migration and claim-trust plan; retain existing user/project IDs and permission constraints.
8. Test compilation, login/register/logout, refresh rotation, recovery, JWT revocation, OAuth negative tests and end-to-end SSO in staging. No production deployment or automatic merge until checks pass.

## Scope and known limitations

The code changes are **preparatory security guardrails**, not a working production SSO implementation. The current JSON shim is explicitly blocked in production. Legacy SSO and forgot-password endpoints intentionally return an error until replacement flows are built. A review of OAuth endpoints and permissions is still necessary.

Tests not executed in this branch authoring session (no checked-out Node dependency environment); GitHub file writes alone are not build/test verification.
