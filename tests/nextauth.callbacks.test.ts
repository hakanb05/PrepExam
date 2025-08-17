import { describe, it, expect } from "vitest"
import { authOptions } from "@/app/api/auth/[...nextauth]/auth-options"

describe("NextAuth signIn callback (OAuth)", () => {
  it("stuurt nieuwe OAuth user zonder naam naar /auth/complete-profile", async () => {
    const cb = authOptions.callbacks!.signIn!
    const redirect = await cb({
      user: { id: "tmp", email: "new@oauth.com", name: "" } as any,
      account: { provider: "google" } as any,
      profile: {} as any,
      email: {} as any,
      credentials: {} as any,
    })

    expect(redirect).toBe("/auth/complete-profile")
  })

  it("laat door als naam aanwezig is", async () => {
    const cb = authOptions.callbacks!.signIn!
    const ok = await cb({
      user: { id: "tmp", email: "ok@oauth.com", name: "Jonas" } as any,
      account: { provider: "google" } as any,
      profile: {} as any,
      email: {} as any,
      credentials: {} as any,
    })

    expect(ok).toBe(true)
  })
})
