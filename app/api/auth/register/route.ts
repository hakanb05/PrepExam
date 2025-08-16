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
      return NextResponse.json(
        { error: "User already exists", code: "EMAIL_TAKEN" },
        { status: 409 }
      )
    }

    const hashed = await hash(password, 10)
    await prisma.user.create({
      data: {
        name,
        email,
        password: hashed, // password is optioneel in schema, maar hier vullen we hem
        verified: true,
      },
    })

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
