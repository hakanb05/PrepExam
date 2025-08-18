import { prisma } from "./setup/prisma"
import { POST as RegisterPOST } from "@/app/api/auth/register/route"
import { POST as CheckDeletedPOST } from "@/app/api/auth/check-deleted/route"
import { POST as RecoverPOST } from "@/app/api/auth/recover-account/route"
import { hash } from "bcryptjs"

describe("Deleted Account Handling", () => {
    it("allows registration with deleted account email (reactivates account)", async () => {
        console.log("Testing: Registration with deleted account email should reactivate account")

        // Create a deleted user
        const hashedPassword = await hash("OldPassword123!", 10)
        await prisma.user.create({
            data: {
                email: "deleted@example.com",
                name: "Deleted User",
                password: hashedPassword,
                verified: true,
                deletedAt: new Date()
            }
        })

        // Try to register with same email
        const req = new Request("http://localhost/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: "New Name",
                email: "deleted@example.com",
                password: "NewPassword123!"
            }),
        })

        const res = await RegisterPOST(req)
        expect(res.status).toBe(200)

        const responseData = await res.json()
        expect(responseData.reactivated).toBe(true)

        // Check user was reactivated
        const user = await prisma.user.findUnique({ where: { email: "deleted@example.com" } })
        expect(user).not.toBeNull()
        expect(user!.deletedAt).toBeNull()
        expect(user!.name).toBe("New Name")
        expect(user!.verified).toBe(false) // Should be false for manual registration
    })

    it("creates new user with verified=false for manual registration", async () => {
        console.log("Testing: Manual registration should create user with verified=false")

        const req = new Request("http://localhost/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: "Manual User",
                email: "manual@example.com",
                password: "Password123!"
            }),
        })

        const res = await RegisterPOST(req)
        expect(res.status).toBe(200)

        const user = await prisma.user.findUnique({ where: { email: "manual@example.com" } })
        expect(user).not.toBeNull()
        expect(user!.verified).toBe(false) // Manual registration should not be verified
        expect(user!.deletedAt).toBeNull()
    })

    it("detects deleted account during login check", async () => {
        console.log("Testing: Check-deleted API should detect deleted accounts with valid credentials")

        // Create a deleted user
        const hashedPassword = await hash("TestPassword123!", 10)
        await prisma.user.create({
            data: {
                email: "logintest@example.com",
                name: "Login Test",
                password: hashedPassword,
                verified: true,
                deletedAt: new Date()
            }
        })

        const req = new Request("http://localhost/api/auth/check-deleted", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: "logintest@example.com",
                password: "TestPassword123!"
            }),
        })

        const res = await CheckDeletedPOST(req)
        expect(res.status).toBe(200)

        const data = await res.json()
        expect(data.userExists).toBe(true)
        expect(data.isDeleted).toBe(true)
        expect(data.userName).toBe("Login Test")
    })

    it("returns false for non-existent user in login check", async () => {
        console.log("Testing: Check-deleted API should return false for non-existent users")

        const req = new Request("http://localhost/api/auth/check-deleted", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: "nonexistent@example.com",
                password: "AnyPassword123!"
            }),
        })

        const res = await CheckDeletedPOST(req)
        expect(res.status).toBe(200)

        const data = await res.json()
        expect(data.userExists).toBe(false)
    })

    it("returns false for wrong password in login check", async () => {
        console.log("Testing: Check-deleted API should return false for wrong password")

        // Create a deleted user
        const hashedPassword = await hash("CorrectPassword123!", 10)
        await prisma.user.create({
            data: {
                email: "wrongpass@example.com",
                name: "Wrong Pass Test",
                password: hashedPassword,
                verified: true,
                deletedAt: new Date()
            }
        })

        const req = new Request("http://localhost/api/auth/check-deleted", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: "wrongpass@example.com",
                password: "WrongPassword123!"
            }),
        })

        const res = await CheckDeletedPOST(req)
        expect(res.status).toBe(200)

        const data = await res.json()
        expect(data.userExists).toBe(false)
    })

    it("recovers deleted account with valid credentials", async () => {
        console.log("Testing: Recover account API should restore deleted accounts")

        // Create a deleted user
        const hashedPassword = await hash("RecoverPassword123!", 10)
        await prisma.user.create({
            data: {
                email: "recover@example.com",
                name: "Recover Test",
                password: hashedPassword,
                verified: true,
                deletedAt: new Date()
            }
        })

        const req = new Request("http://localhost/api/auth/recover-account", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: "recover@example.com",
                password: "RecoverPassword123!"
            }),
        })

        const res = await RecoverPOST(req)
        expect(res.status).toBe(200)

        const data = await res.json()
        expect(data.success).toBe(true)

        // Check user was recovered
        const user = await prisma.user.findUnique({ where: { email: "recover@example.com" } })
        expect(user).not.toBeNull()
        expect(user!.deletedAt).toBeNull()
    })

    it("fails to recover with wrong password", async () => {
        console.log("Testing: Recover account API should fail with wrong password")

        // Create a deleted user
        const hashedPassword = await hash("CorrectPassword123!", 10)
        await prisma.user.create({
            data: {
                email: "recoverFail@example.com",
                name: "Recover Fail Test",
                password: hashedPassword,
                verified: true,
                deletedAt: new Date()
            }
        })

        const req = new Request("http://localhost/api/auth/recover-account", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: "recoverFail@example.com",
                password: "WrongPassword123!"
            }),
        })

        const res = await RecoverPOST(req)
        expect(res.status).toBe(401)
    })

    it("fails to recover non-deleted account", async () => {
        console.log("Testing: Recover account API should fail for non-deleted accounts")

        // Create a normal (non-deleted) user
        const hashedPassword = await hash("NormalPassword123!", 10)
        await prisma.user.create({
            data: {
                email: "normal@example.com",
                name: "Normal User",
                password: hashedPassword,
                verified: true
                // deletedAt is null (not deleted)
            }
        })

        const req = new Request("http://localhost/api/auth/recover-account", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: "normal@example.com",
                password: "NormalPassword123!"
            }),
        })

        const res = await RecoverPOST(req)
        expect(res.status).toBe(400)
    })
})
