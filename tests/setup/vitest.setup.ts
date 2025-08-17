import { config as dotenv } from 'dotenv'

// laad je test-env (eigen DB/schema of dezelfde met andere url)
dotenv({ path: '.env.test' })