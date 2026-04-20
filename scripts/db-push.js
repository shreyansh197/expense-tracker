// Run `prisma db push` only when DATABASE_URL is available (e.g. on Vercel).
// Skips gracefully in local dev where the env var is usually absent.

const { execSync } = require("child_process");

if (!process.env.DATABASE_URL) {
  console.log("⏭  Skipping prisma db push (no DATABASE_URL)");
  process.exit(0);
}

try {
  console.log("🔄 Running prisma db push...");
  execSync("npx prisma db push", { stdio: "inherit" });
} catch (err) {
  console.error("❌ prisma db push failed:", err.message);
  process.exit(1);
}
