import { config as load } from "dotenv"
load({ path: ".env.test" })

if (!process.env.DATABASE_URL?.includes("usml_db_test")) {
  throw new Error("Tests must use usml_db_test database. Check .env.test")
}
