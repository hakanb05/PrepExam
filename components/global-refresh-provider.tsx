"use client"

import React, { useState } from 'react'
import { GlobalRefreshContext } from '@/hooks/use-global-refresh'

interface GlobalRefreshProviderProps {
    children: React.ReactNode
}

export function GlobalRefreshProvider({ children }: GlobalRefreshProviderProps) {
    const [refreshKey, setRefreshKey] = useState(0)

    const triggerProfileRefresh = () => {
        // Trigger a custom event that profile components can listen to
        window.dispatchEvent(new CustomEvent('profileRefresh'))
    }

    const triggerDashboardRefresh = () => {
        // Trigger a custom event that dashboard components can listen to
        window.dispatchEvent(new CustomEvent('dashboardRefresh'))
    }

    return (
        <GlobalRefreshContext.Provider
            value={{
                triggerProfileRefresh,
                triggerDashboardRefresh
            }}
        >
            {children}
        </GlobalRefreshContext.Provider>
    )
}
