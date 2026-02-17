/**
 * Seed script: crée l’enseignant et les élèves dans Supabase Auth.
 * Le trigger handle_new_user crée automatiquement les profils (table profiles).
 *
 * Usage (à la racine du projet) :
 *   node scripts/seed-users.mjs
 *
 * Dans .env.local : NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY
 * (clé secrète : Dashboard Supabase → Settings → API)
 */

import { createRequire } from "module";
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const { createClient } = require("@supabase/supabase-js");

// Charger .env.local (racine du projet = dossier parent du script)
const envPath = resolve(__dirname, "..", ".env.local");
if (existsSync(envPath)) {
  const content = readFileSync(envPath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'")))
      val = val.slice(1, -1);
    process.env[key] = val;
  }
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Variables manquantes dans .env.local (à la racine du projet) :");
  if (!url) console.error("  - NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co");
  if (!serviceKey) console.error("  - SUPABASE_SERVICE_ROLE_KEY=ta_clé_secrète (Dashboard Supabase → Settings → API)");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

const DEFAULT_PASSWORD = "SvtNotes2025!";

const users = [
  { email: "abdelmajid.bouamair@gmail.com", name: "Abdelmajid Bouamair", role: "teacher" },
  { email: "hamza.bouamair@svt.local", name: "Hamza Bouamair", role: "student" },
  { email: "abdelkbir.bouamair@svt.local", name: "Abdelkbir Bouamair", role: "student" },
];

async function main() {
  for (const u of users) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: u.email,
      password: DEFAULT_PASSWORD,
      email_confirm: true,
      user_metadata: { name: u.name, role: u.role },
    });
    if (error) {
      if (error.message?.includes("already been registered")) {
        console.log(`Déjà existant : ${u.email} (${u.name})`);
      } else {
        console.error(`Erreur pour ${u.email}:`, error.message);
      }
      continue;
    }
    console.log(`Créé : ${u.email} (${u.name}, ${u.role})`);
  }
  console.log("\nMot de passe par défaut pour tous :", DEFAULT_PASSWORD);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
