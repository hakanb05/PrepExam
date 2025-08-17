#!/usr/bin/env bash
set -euo pipefail

# read .env.test
export $(grep -v '^#' .env.test | xargs)

# Parse host, port, user from DATABASE_URL
HOST="localhost"
PORT="5432"
USER="usml"

# Databases used in .env.test
DB_MAIN="usml_db_test"
DB_SHADOW="usml_db_test_shadow"

echo "Dropping test databases…"
psql -h "$HOST" -p "$PORT" -U "$USER" -d postgres -v ON_ERROR_STOP=1 <<SQL
DROP DATABASE IF EXISTS "$DB_MAIN";
DROP DATABASE IF EXISTS "$DB_SHADOW";
SQL

echo "Creating test databases…"
psql -h "$HOST" -p "$PORT" -U "$USER" -d postgres -v ON_ERROR_STOP=1 <<SQL
CREATE DATABASE "$DB_MAIN";
CREATE DATABASE "$DB_SHADOW";
SQL

echo "Applying migrations on $DB_MAIN…"
PRISMA_IGNORE_ENV_FILES=1 dotenv -e .env.test -- prisma migrate deploy

echo "✅ Test DB hard-reset klaar."
