import { prisma } from "./setup/prisma"
import { hash } from "bcryptjs"
import { verifyCredentials } from "@/lib/auth-logic"

describe("verifyCredentials", () => {
  it("werkt met juist wachtwoord", async () => {
    await prisma.user.create({
      data: { email: "x@example.com", name: "X", password: await hash("Kaas38!", 10) },
    })
    const user = await verifyCredentials("x@example.com", "Kaas38!")
    expect(user?.email).toBe("x@example.com")
  })

  it("faalt met fout wachtwoord", async () => {
    const user = await verifyCredentials("x@example.com", "nope")
    expect(user).toBeNull()
  })
})
