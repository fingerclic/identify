/**
 * Read-only database preflight. Never prints the connection URL or credentials.
 * Run ONLY against a dedicated Identify development/staging database.
 */
import { prisma } from '../src/server/prisma';

async function main() {
  const rows = await prisma.$queryRaw<Array<{
    database_name: string;
    schema_name: string;
    db_role: string;
    users_table: string | null;
    applications_table: string | null;
  }>>`
    SELECT
      current_database() AS database_name,
      current_schema() AS schema_name,
      current_user AS db_role,
      to_regclass('"User"')::text AS users_table,
      to_regclass('"Application"')::text AS applications_table
  `;

  const info = rows[0];
  if (!info) throw new Error('No result from PostgreSQL preflight.');
  console.log(JSON.stringify({
    connected: true,
    database: info.database_name,
    schema: info.schema_name,
    dbRole: info.db_role,
    identityTablesPresent: Boolean(info.users_table && info.applications_table)
  }, null, 2));
}

main()
  .catch((error) => {
    console.error('Identify database preflight failed:', error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
