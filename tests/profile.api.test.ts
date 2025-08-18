import { prisma } from "./setup/prisma"
import { GET as ProfileGET, PATCH as ProfilePATCH, DELETE as ProfileDELETE } from "@/app/api/profile/route"
import { getServerSession } from "next-auth"

// Mock getServerSession to return our test user
vi.mock("next-auth", async () => {
    const actual = await vi.importActual<any>("next-auth")
    return { ...actual, getServerSession: vi.fn() }
})

describe("Profile API Routes", () => {
    let testUser: any
    let testCounter = 0

    beforeEach(async () => {
        testCounter++
        testUser = await prisma.user.create({
            data: {
                email: `profile${testCounter}@example.com`,
                name: "Profile Test User",
                verified: true,
                emailOptIn: true
            }
        })

            ; (getServerSession as any).mockResolvedValue({
                user: { id: testUser.id, email: testUser.email, name: testUser.name }
            })
    })

    describe("GET /api/profile", () => {
        it("returns user profile with stats", async () => {
            console.log("Testing: Profile GET should return user data with statistics")

            const req = new Request("http://localhost/api/profile")
            const res = await ProfileGET(req)

            expect(res.status).toBe(200)
            const data = await res.json()

            expect(data.id).toBe(testUser.id)
            expect(data.email).toBe(testUser.email)
            expect(data.name).toBe("Profile Test User")
            expect(data.verified).toBe(true)
            expect(data.emailOptIn).toBe(true)
            expect(data.stats).toBeDefined()
            expect(data.stats.totalAttempts).toBeDefined()
            expect(data.stats.purchasedExams).toBeDefined()
        })

        it("returns 401 for unauthenticated user", async () => {
            console.log("Testing: Profile GET should return 401 for unauthenticated users")

                ; (getServerSession as any).mockResolvedValue(null)

            const req = new Request("http://localhost/api/profile")
            const res = await ProfileGET(req)

            expect(res.status).toBe(401)
        })
    })

    describe("PATCH /api/profile", () => {
        it("updates user name and emailOptIn", async () => {
            console.log("Testing: Profile PATCH should update name and emailOptIn")

            const req = new Request("http://localhost/api/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: "Updated Name",
                    emailOptIn: false
                })
            })

            const res = await ProfilePATCH(req)
            expect(res.status).toBe(200)

            const data = await res.json()
            expect(data.success).toBe(true)
            expect(data.user.name).toBe("Updated Name")

            // Check database was updated
            const updatedUser = await prisma.user.findUnique({ where: { id: testUser.id } })
            expect(updatedUser!.name).toBe("Updated Name")
            expect(updatedUser!.emailOptIn).toBe(false)
        })

        it("fails with short name", async () => {
            console.log("Testing: Profile PATCH should fail with name too short")

            const req = new Request("http://localhost/api/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: "X" // Too short
                })
            })

            const res = await ProfilePATCH(req)
            expect(res.status).toBe(400)
        })

        it("preserves image field when updating other fields", async () => {
            console.log("Testing: Profile PATCH should preserve image when updating other fields")

            // First set an image
            await prisma.user.update({
                where: { id: testUser.id },
                data: { image: "/uploads/avatars/test.jpg" }
            })

            const req = new Request("http://localhost/api/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: "New Name Only"
                })
            })

            const res = await ProfilePATCH(req)
            expect(res.status).toBe(200)

            // Check image was preserved
            const updatedUser = await prisma.user.findUnique({ where: { id: testUser.id } })
            expect(updatedUser!.name).toBe("New Name Only")
            expect(updatedUser!.image).toBe("/uploads/avatars/test.jpg") // Should be preserved
        })
    })

    describe("DELETE /api/profile", () => {
        it("soft deletes user account", async () => {
            console.log("Testing: Profile DELETE should soft delete user account")

            const req = new Request("http://localhost/api/profile", {
                method: "DELETE"
            })

            const res = await ProfileDELETE(req)
            expect(res.status).toBe(200)

            const data = await res.json()
            expect(data.success).toBe(true)

            // Check user was soft deleted
            const deletedUser = await prisma.user.findUnique({ where: { id: testUser.id } })
            expect(deletedUser!.deletedAt).not.toBeNull()
        })

        it("returns 401 for unauthenticated user", async () => {
            console.log("Testing: Profile DELETE should return 401 for unauthenticated users")

                ; (getServerSession as any).mockResolvedValue(null)

            const req = new Request("http://localhost/api/profile", {
                method: "DELETE"
            })

            const res = await ProfileDELETE(req)
            expect(res.status).toBe(401)
        })
    })
})
