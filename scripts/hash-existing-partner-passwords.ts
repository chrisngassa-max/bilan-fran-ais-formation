import { createClient } from "@supabase/supabase-js"
import * as bcrypt from "bcryptjs"
import * as dotenv from "dotenv"
dotenv.config()

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing environment variables.")
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

async function run() {
  const { data: comptes, error } = await supabase
    .from("partenaire_comptes")
    .select("id, email, password_hash")

  if (error) {
    console.error("Error reading partner accounts:", error)
    return
  }

  for (const c of comptes ?? []) {
    if (c.password_hash.startsWith("$2a$") || c.password_hash.startsWith("$2b$")) {
      console.log(`Skipping already hashed password for: ${c.email}`)
      continue
    }

    const hashed = await bcrypt.hash(c.password_hash, 10)
    const { error: updateError } = await supabase
      .from("partenaire_comptes")
      .update({ password_hash: hashed })
      .eq("id", c.id)

    if (updateError) {
      console.error(`Failed to update password for ${c.email}:`, updateError)
    } else {
      console.log(`Successfully migrated password for: ${c.email}`)
    }
  }
}

run()
