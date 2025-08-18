import { prisma } from "./setup/prisma"
import { POST as RegisterPOST } from "@/app/api/auth/register/route"

describe("POST /api/auth/register", () => {
  it("maakt user aan met gehasht password", async () => {
    console.log("Testing: Registration should create user with hashed password and verified=false")

    const req = new Request("http://localhost/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Test User", email: "test@example.com", password: "Kaas38!" }),
    })

    const res = await RegisterPOST(req)
    expect(res.status).toBe(200)

    const u = await prisma.user.findUnique({ where: { email: "test@example.com" } })
    expect(u).not.toBeNull()
    expect(u!.password).toBeTruthy()
    expect(u!.password!.startsWith("$2")).toBe(true) // bcrypt hash
    expect(u!.verified).toBe(false) // Manual registration should not be verified
  })

  it("faalt bij bestaande email", async () => {
    console.log("Testing: Registration should fail for existing active email")

    await prisma.user.create({
      data: { email: "exists@example.com", name: "Exists", password: "$2b$10abcdefghijklmnopqrstuv" },
    })

    const req = new Request("http://localhost/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "X", email: "exists@example.com", password: "whatever" }),
    })
    const res = await RegisterPOST(req)
    expect(res.status).toBe(409)
  })
})
