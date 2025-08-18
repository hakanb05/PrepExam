import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useAuth } from '@/lib/auth-context'

interface ProfileData {
    id: string
    name: string
    email: string
    image: string | null
    emailOptIn: boolean
    verified: boolean
    stats: {
        completedExams: number
        totalAttempts: number
        purchasedExams: number
    }
}

export function useProfile() {
    const { data: session, update: updateSession } = useSession()
    const { refreshSession } = useAuth()
    const [profile, setProfile] = useState<ProfileData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchProfile = async () => {
        try {
            setLoading(true)
            setError(null)

            const response = await fetch('/api/profile')
            if (!response.ok) {
                throw new Error('Failed to fetch profile')
            }

            const data = await response.json()
            setProfile(data)
        } catch (err) {
            console.error('Error fetching profile:', err)
            setError(err instanceof Error ? err.message : 'Unknown error')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (session?.user && 'id' in session.user) {
            fetchProfile()
        } else {
            setLoading(false)
        }
    }, [session?.user])

    const updateProfile = async (updates: {
        name?: string
        emailOptIn?: boolean
    }) => {
        try {
            setError(null)

            const response = await fetch('/api/profile', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updates),
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Failed to update profile')
            }

            const updatedUser = await response.json()

            // Update local state
            setProfile(prev => prev ? { ...prev, ...updatedUser } : null)

            // Update NextAuth session
            await updateSession({
                ...session,
                user: {
                    ...session?.user,
                    name: updatedUser.name,
                    image: updatedUser.image
                }
            })

            // Refresh the session to update header
            await refreshSession()

            // Trigger global refresh event
            window.dispatchEvent(new CustomEvent('profileRefresh'))

            return updatedUser
        } catch (err) {
            console.error('Error updating profile:', err)
            setError(err instanceof Error ? err.message : 'Unknown error')
            throw err
        }
    }

    const uploadAvatar = async (file: File) => {
        try {
            setError(null)

            const formData = new FormData()
            formData.append('avatar', file)

            const response = await fetch('/api/profile/avatar', {
                method: 'POST',
                body: formData,
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Failed to upload avatar')
            }

            const data = await response.json()

            // Update local state
            setProfile(prev => prev ? { ...prev, image: data.imageUrl } : null)

            // Update NextAuth session
            await updateSession({
                ...session,
                user: {
                    ...session?.user,
                    image: data.imageUrl
                }
            })

            // Refresh the session to update header
            await refreshSession()

            // Trigger global refresh event
            window.dispatchEvent(new CustomEvent('profileRefresh'))

            return data.imageUrl
        } catch (err) {
            console.error('Error uploading avatar:', err)
            setError(err instanceof Error ? err.message : 'Unknown error')
            throw err
        }
    }

    const removeAvatar = async () => {
        try {
            setError(null)

            const response = await fetch('/api/profile/avatar', {
                method: 'DELETE',
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Failed to remove avatar')
            }

            // Update local state
            setProfile(prev => prev ? { ...prev, image: null } : null)

            // Update NextAuth session
            await updateSession({
                ...session,
                user: {
                    ...session?.user,
                    image: null
                }
            })

            // Refresh the session to update header
            await refreshSession()

            // Trigger global refresh event
            window.dispatchEvent(new CustomEvent('profileRefresh'))
        } catch (err) {
            console.error('Error removing avatar:', err)
            setError(err instanceof Error ? err.message : 'Unknown error')
            throw err
        }
    }

    const deleteAccount = async () => {
        try {
            setError(null)

            const response = await fetch('/api/profile', {
                method: 'DELETE',
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Failed to delete account')
            }

            // Import signOut dynamically to avoid SSR issues
            const { signOut } = await import('next-auth/react')

            // Sign out and redirect to login
            await signOut({
                redirect: true,
                callbackUrl: '/login'
            })
        } catch (err) {
            console.error('Error deleting account:', err)
            setError(err instanceof Error ? err.message : 'Unknown error')
            throw err
        }
    }

    return {
        profile,
        loading,
        error,
        updateProfile,
        uploadAvatar,
        removeAvatar,
        deleteAccount,
        refetch: fetchProfile
    }
}
