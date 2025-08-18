import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { hash } from "bcryptjs"

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json()

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({ where: { email } })

    if (existing) {
      // If user exists but is deleted, allow reactivation
      if (existing.deletedAt) {
        const hashed = await hash(password, 10)
        console.log("Reactivating deleted user:", { name, email })

        await prisma.user.update({
          where: { email },
          data: {
            name,
            password: hashed,
            verified: false, // Reset verification for manual registration
            deletedAt: null, // Reactivate account
          },
        })

        return NextResponse.json({ ok: true, reactivated: true })
      } else {
        return NextResponse.json(
          { error: "User already exists", code: "EMAIL_TAKEN" },
          { status: 409 }
        )
      }
    }

    const hashed = await hash(password, 10)
    console.log("User registered:", { name, email })
    await prisma.user.create({
      data: {
        name,
        email,
        password: hashed, // password is optioneel in schema, maar hier vullen we hem want user had dit ingevuld en voor handmatige logins.
        verified: false, // Manual registration requires email verification
      },
    })

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
