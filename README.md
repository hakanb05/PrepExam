# PrepExam

PrepExam is a practice platform for USMLE with authentication (email/password and Google OAuth).  
Built with **Next.js 15**, **NextAuth**, **Prisma**, **Postgres**, **Tailwind**, and **shadcn/ui**.

---

## 🚀 Quick Start

### Requirements
- Node.js 18+ and pnpm
- Docker (for Postgres)
- Google OAuth Client (Web type: CLIENT_ID and SECRET)

### 1. Install dependencies
```bash
pnpm install

### 2. Start Postgres with Docker
docker compose up -d

### 3. 

Create .env for development and .env.test for tests:

### 4. Run migrations and seed
pnpm db:deploy
pnpm db:seed

### 5. Start the app
pnpm dev

### 🧪 Tests

Reset and prepare the test database:
pnpm test:hard-reset

### Run the test suite:
pnpm test
