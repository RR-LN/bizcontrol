"use client"

import { useEffect, useState } from "react"
import useSWR from "swr"
import toast, { Toaster } from "react-hot-toast"
import Link from "next/link"

interface StockAlert {
    id: string
    code: string
    name: string
    quantity: number
    reorderPoint: number
    severity: number
    supplierName: string
}

const fetcher = (url: string) => fetch(url).then(res => res.json())

export default function StockAlertToast() {
    const [user, setUser] = useState<any>(null)
    const [previousAlertIds, setPreviousAlertIds] = useState<Set<string>>(new Set())
    const [hasInitialized, setHasInitialized] = useState(false)

    // Fetch current user
    useEffect(() => {
        const checkAuth = async () => {
            try {
                const response = await fetch('/api/me')
                if (response.ok) {
                    const data = await response.json()
                    // Only show for ADMIN and MANAGER
                    if (data.user.role === 'ADMIN' || data.user.role === 'MANAGER') {
                        setUser(data.user)
                    }
                }
            } catch (error) {
                console.error('Auth check error:', error)
            }
        }

        checkAuth()
    }, [])

    // Fetch stock alerts every 60 seconds (only for ADMIN/MANAGER)
    const { data: alertsData } = useSWR<{ success: boolean, data: StockAlert[], count: number }>(
        user ? '/api/stock/alerts' : null,
        fetcher,
        { refreshInterval: 60000 } // Check every 60 seconds
    )

    const alerts = alertsData?.data || []

    useEffect(() => {
        if (!user || alerts.length === 0) return

        // First load - just store IDs without showing notifications
        if (!hasInitialized) {
            setPreviousAlertIds(new Set(alerts.map(a => a.id)))
            setHasInitialized(true)
            return
        }

        // Check for new alerts
        const currentAlertIds = new Set(alerts.map(a => a.id))
        const newAlerts = alerts.filter(alert => !previousAlertIds.has(alert.id))

        if (newAlerts.length > 0) {
            // Play notification sound (optional)
            try {
                const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjOJ0fPTgjMGHm7A7+OZSA0PVqzn77BdGAdCmuH1xnIlBSyBzvLZijcIGWi77eifTRAMU6jj8LdjHAY4kdfyzHksBSR3x/DekEAKFF605uuqVRQKRp/g8r5sIQYzidHz04IzBh5uwO/jmUgND1as5++wXRgHQprh9cZyJQUsb')
                audio.volume = 0.3
                audio.play().catch(() => { }) // Ignore if autoplay blocked
            } catch (error) {
                // Audio failed, ignore
            }

            // Show toast for each new alert
            newAlerts.forEach(alert => {
                const percentage = ((alert.quantity / alert.reorderPoint) * 100).toFixed(0)
                const isCritical = (alert.quantity / alert.reorderPoint) * 100 < 50

                toast.custom(
                    (t) => (
                        <div
                            className={`${t.visible ? 'animate-enter' : 'animate-leave'
                                } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
                        >
                            <div className="flex-1 w-0 p-4">
                                <div className="flex items-start">
                                    <div className="flex-shrink-0 pt-0.5">
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isCritical ? 'bg-red-100' : 'bg-orange-100'
                                            }`}>
                                            <span className="text-2xl">{isCritical ? '🔴' : '🟠'}</span>
                                        </div>
                                    </div>
                                    <div className="ml-3 flex-1">
                                        <p className="text-sm font-bold text-gray-900">
                                            {isCritical ? '⚠️ ALERTA CRÍTICO' : '⚠️ ALERTA DE ESTOQUE'}
                                        </p>
                                        <p className="mt-1 text-sm font-semibold text-gray-900">
                                            {alert.name}
                                        </p>
                                        <p className="mt-1 text-xs text-gray-500">
                                            Código: {alert.code}
                                        </p>
                                        <div className="mt-2 flex items-center space-x-2">
                                            <div className={`px-2 py-1 rounded ${isCritical ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'
                                                }`}>
                                                <p className="text-xs font-bold">Estoque: {alert.quantity}</p>
                                            </div>
                                            <div className="px-2 py-1 bg-gray-100 text-gray-800 rounded">
                                                <p className="text-xs font-bold">Mínimo: {alert.reorderPoint}</p>
                                            </div>
                                            <div className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
                                                <p className="text-xs font-bold">{percentage}%</p>
                                            </div>
                                        </div>
                                        <p className="mt-2 text-xs text-gray-500">
                                            📦 Fornecedor: {alert.supplierName}
                                        </p>
                                        <div className="mt-3">
                                            <Link
                                                href="/stock/alerts"
                                                className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                                                onClick={() => toast.dismiss(t.id)}
                                            >
                                                Ver Todos os Alertas →
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex border-l border-gray-200">
                                <button
                                    onClick={() => toast.dismiss(t.id)}
                                    className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-gray-600 hover:text-gray-500 focus:outline-none"
                                >
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    ),
                    {
                        duration: Infinity, // Persists until clicked
                        position: 'top-right',
                    }
                )
            })

            // Update previous alert IDs
            setPreviousAlertIds(currentAlertIds)
        }
    }, [alerts, user, previousAlertIds, hasInitialized])

    // Only render Toaster for ADMIN/MANAGER
    if (!user) return null

    return (
        <Toaster
            position="top-right"
            toastOptions={{
                style: {
                    background: 'transparent',
                    boxShadow: 'none',
                    padding: 0,
                },
            }}
        />
    )
}
