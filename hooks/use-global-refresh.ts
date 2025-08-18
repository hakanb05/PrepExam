import { createContext, useContext } from 'react'

interface GlobalRefreshContextType {
    triggerProfileRefresh: () => void
    triggerDashboardRefresh: () => void
}

export const GlobalRefreshContext = createContext<GlobalRefreshContextType | undefined>(undefined)

export function useGlobalRefresh() {
    const context = useContext(GlobalRefreshContext)
    if (!context) {
        throw new Error('useGlobalRefresh must be used within a GlobalRefreshProvider')
    }
    return context
}
