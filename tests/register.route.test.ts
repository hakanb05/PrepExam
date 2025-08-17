import { prisma } from "./setup/prisma"
import { POST as RegisterPOST } from "@/app/api/auth/register/route"

describe("POST /api/auth/register", () => {
  it("maakt user aan met gehasht password", async () => {
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
  })

  it("faalt bij bestaande email", async () => {
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
