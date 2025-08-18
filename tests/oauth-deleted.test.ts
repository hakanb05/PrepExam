import { prisma } from "./setup/prisma"
import { POST as OAuthCheckPOST } from "@/app/api/auth/oauth-deleted-check/route"
import { POST as OAuthRecoverPOST } from "@/app/api/auth/oauth-recover/route"

describe("OAuth Deleted Account Handling", () => {
    it("detects deleted OAuth account", async () => {
        console.log("Testing: OAuth deleted check should detect deleted accounts")

        // Create a deleted OAuth user
        await prisma.user.create({
            data: {
                email: "oauth-deleted@example.com",
                name: "OAuth Deleted User",
                verified: true,
                deletedAt: new Date()
            }
        })

        const req = new Request("http://localhost/api/auth/oauth-deleted-check", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: "oauth-deleted@example.com"
            }),
        })

        const res = await OAuthCheckPOST(req)
        expect(res.status).toBe(200)

        const data = await res.json()
        expect(data.userExists).toBe(true)
        expect(data.isDeleted).toBe(true)
        expect(data.userName).toBe("OAuth Deleted User")
    })

    it("returns false for non-existent OAuth user", async () => {
        console.log("Testing: OAuth deleted check should return false for non-existent users")

        const req = new Request("http://localhost/api/auth/oauth-deleted-check", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: "nonexistent-oauth@example.com"
            }),
        })

        const res = await OAuthCheckPOST(req)
        expect(res.status).toBe(200)

        const data = await res.json()
        expect(data.userExists).toBe(false)
    })

    it("returns not deleted for active OAuth user", async () => {
        console.log("Testing: OAuth deleted check should return not deleted for active users")

        // Create an active OAuth user
        await prisma.user.create({
            data: {
                email: "oauth-active@example.com",
                name: "OAuth Active User",
                verified: true
                // deletedAt is null (not deleted)
            }
        })

        const req = new Request("http://localhost/api/auth/oauth-deleted-check", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: "oauth-active@example.com"
            }),
        })

        const res = await OAuthCheckPOST(req)
        expect(res.status).toBe(200)

        const data = await res.json()
        expect(data.userExists).toBe(true)
        expect(data.isDeleted).toBe(false)
    })

    it("recovers deleted OAuth account with verification", async () => {
        console.log("Testing: OAuth recover should restore deleted accounts with verified=true")

        // Create a deleted OAuth user
        await prisma.user.create({
            data: {
                email: "oauth-recover@example.com",
                name: "Old OAuth Name",
                verified: false, // Was previously false
                deletedAt: new Date()
            }
        })

        const req = new Request("http://localhost/api/auth/oauth-recover", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: "oauth-recover@example.com",
                name: "New OAuth Name",
                image: "https://example.com/avatar.jpg"
            }),
        })

        const res = await OAuthRecoverPOST(req)
        expect(res.status).toBe(200)

        const data = await res.json()
        expect(data.success).toBe(true)

        // Check user was recovered with updated data
        const user = await prisma.user.findUnique({ where: { email: "oauth-recover@example.com" } })
        expect(user).not.toBeNull()
        expect(user!.deletedAt).toBeNull()
        expect(user!.name).toBe("New OAuth Name")
        expect(user!.image).toBe("https://example.com/avatar.jpg")
        expect(user!.verified).toBe(true) // OAuth users should be verified
    })

    it("fails to recover non-deleted OAuth account", async () => {
        console.log("Testing: OAuth recover should fail for non-deleted accounts")

        // Create a normal (non-deleted) OAuth user
        await prisma.user.create({
            data: {
                email: "oauth-normal@example.com",
                name: "Normal OAuth User",
                verified: true
                // deletedAt is null (not deleted)
            }
        })

        const req = new Request("http://localhost/api/auth/oauth-recover", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: "oauth-normal@example.com",
                name: "Updated Name"
            }),
        })

        const res = await OAuthRecoverPOST(req)
        expect(res.status).toBe(400)
    })

    it("fails OAuth recover for non-existent user", async () => {
        console.log("Testing: OAuth recover should fail for non-existent users")

        const req = new Request("http://localhost/api/auth/oauth-recover", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: "doesnotexist@example.com",
                name: "Some Name"
            }),
        })

        const res = await OAuthRecoverPOST(req)
        expect(res.status).toBe(400)
    })
})
