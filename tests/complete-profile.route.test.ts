import { prisma } from "./setup/prisma"
import { POST as CompleteProfilePOST } from "@/app/api/auth/complete-profile/route"
import { getServerSession } from "next-auth"

// mock getServerSession to return our “logged in” OAuth user
vi.mock("next-auth", async () => {
  const actual = await vi.importActual<any>("next-auth")
  return { ...actual, getServerSession: vi.fn() }
})

describe("POST /api/auth/complete-profile", () => {
  it("zet naam voor OAuth user zonder naam", async () => {
    const user = await prisma.user.create({
      data: { email: "oauth@example.com", name: "", image: "https://picsum.photos/96", verified: false },
    })

    ;(getServerSession as any).mockResolvedValue({
      user: { id: user.id, email: user.email, name: user.name ?? "" },
    })

    const req = new Request("http://localhost/api/auth/complete-profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "New OAuth Name" }),
    })

    const res = await CompleteProfilePOST(req)
    expect(res.status).toBe(200)

    const updated = await prisma.user.findUnique({ where: { id: user.id } })
    expect(updated!.name).toBe("New OAuth Name")
    expect(updated!.verified).toBe(true)
  })
})
