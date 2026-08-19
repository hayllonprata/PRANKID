import "dotenv/config";
import { applyNormalizedDatabaseUrl, describeDatabaseUrl } from "./lib/database-url.js";

try {
  const url = applyNormalizedDatabaseUrl();
  process.stderr.write(`Prisma DATABASE_URL ok: ${describeDatabaseUrl(url)}\n`);
  process.stdout.write(url);
} catch (error) {
  const message = error instanceof Error ? error.message : "DATABASE_URL inválida";
  process.stderr.write(`${message}\n`);
  process.exit(1);
}
