// Run `prisma db push` only when DATABASE_URL is available (e.g. on Vercel).
// Skips gracefully in local dev where the env var is usually absent.
// Has a 60-second timeout so builds don't hang if the DB is unreachable.
// Non-fatal: a failure here won't block the Next.js build.
// Switches Supabase pooler port 6543 → direct port 5432 (PgBouncer breaks prepared stmts).

const { execSync } = require("child_process");

if (!process.env.DATABASE_URL) {
  console.log("⏭  Skipping prisma db push (no DATABASE_URL)");
  process.exit(0);
}

// Supabase pooler (port 6543) uses PgBouncer which breaks prisma db push.
// Swap to direct connection (port 5432) for schema operations.
let dbUrl = process.env.DATABASE_URL;
dbUrl = dbUrl.replace(/:6543\//, ":5432/");

try {
  console.log("🔄 Running prisma db push (60s timeout)...");
  execSync("npx prisma db push --skip-generate", {
    stdio: "inherit",
    timeout: 60_000,
    env: { ...process.env, DATABASE_URL: dbUrl },
  });
  console.log("✅ prisma db push succeeded");
} catch (err) {
  if (err.killed) {
    console.warn(
      "⚠️  prisma db push timed out after 60s — skipping (DB may be unreachable)",
    );
  } else {
    console.warn("⚠️  prisma db push failed — skipping:", err.message);
  }
  // Exit 0 so the build continues — schema sync is best-effort
  process.exit(0);
}
