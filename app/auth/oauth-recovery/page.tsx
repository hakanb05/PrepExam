"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle, User } from "lucide-react"
import { signIn } from "next-auth/react"

export default function OAuthRecoveryPage() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    const email = searchParams.get("email")
    const name = searchParams.get("name")
    const image = searchParams.get("image")
    const provider = searchParams.get("provider")

    useEffect(() => {
        if (!email || !provider) {
            router.push("/login")
        }
    }, [email, provider, router])

    const handleRecover = async () => {
        if (!email) return

        try {
            setLoading(true)
            setError("")

            const response = await fetch('/api/auth/oauth-recover', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, name, image })
            })

            if (response.ok) {
                // Now sign in with OAuth
                await signIn(provider!, {
                    callbackUrl: "/",
                    redirect: true
                })
            } else {
                const data = await response.json()
                setError(data.error || "Failed to recover account")
            }
        } catch (err) {
            setError("An error occurred while recovering your account")
        } finally {
            setLoading(false)
        }
    }

    const handleCancel = () => {
        router.push("/login")
    }

    if (!email || !provider) {
        return null
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="flex justify-center mb-4">
                        <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-full">
                            <AlertCircle className="h-8 w-8 text-orange-600 dark:text-orange-400" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl">Account Recovery</CardTitle>
                    <CardDescription>
                        We found a previously deleted account for this email address.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {error && (
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                        </div>
                    )}

                    <div className="flex items-center space-x-3 p-4 bg-muted rounded-lg">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <User className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <p className="font-medium">{name || email}</p>
                            <p className="text-sm text-muted-foreground">{email}</p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <p className="text-sm text-muted-foreground">
                            Would you like to recover your account and restore your data? This will reactivate your account and you'll be able to access all your previous information.
                        </p>
                    </div>

                    <div className="flex space-x-3">
                        <Button
                            variant="outline"
                            onClick={handleCancel}
                            className="flex-1"
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleRecover}
                            className="flex-1"
                            disabled={loading}
                        >
                            {loading ? "Recovering..." : "Recover Account"}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
