"use client"

import { useState, useEffect } from "react"
import useSWR from "swr"
import Link from "next/link"

interface LiveSale {
    id: string
    orderNumber: string
    totalAmount: number
    paymentMethod: string
    customerName: string | null
    itemsCount: number
    createdAt: string
}

const fetcher = (url: string) => fetch(url).then(r => r.json())

export default function NotificationBell() {
    const [isOpen, setIsOpen] = useState(false)
    const [viewedSaleIds, setViewedSaleIds] = useState<Set<string>>(new Set())

    // Load viewed IDs from localStorage
    useEffect(() => {
        const stored = localStorage.getItem('viewedSaleIds')
        if (stored) {
            setViewedSaleIds(new Set(JSON.parse(stored)))
        }
    }, [])

    // Fetch live sales every 4 seconds
    const { data: liveSalesData } = useSWR<{ success: boolean, data: LiveSale[] }>(
        '/api/dashboard/live-sales',
        fetcher,
        { refreshInterval: 4000 }
    )

    const liveSales = liveSalesData?.data || []

    // Filter to last 5 minutes
    const fiveMinutesAgo = new Date()
    fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5)

    const recentSales = liveSales.filter(sale =>
        new Date(sale.createdAt) >= fiveMinutesAgo
    ).slice(0, 5)

    // Count unviewed sales
    const unviewedCount = recentSales.filter(sale => !viewedSaleIds.has(sale.id)).length

    const markAllAsViewed = () => {
        const newViewedIds = new Set([...viewedSaleIds, ...recentSales.map(s => s.id)])
        setViewedSaleIds(newViewedIds)
        localStorage.setItem('viewedSaleIds', JSON.stringify([...newViewedIds]))
    }

    const handleOpen = () => {
        setIsOpen(!isOpen)
        if (!isOpen) {
            // Mark as viewed when opening
            setTimeout(() => markAllAsViewed(), 500)
        }
    }

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement
            if (!target.closest('.notification-bell')) {
                setIsOpen(false)
            }
        }

        if (isOpen) {
            document.addEventListener('click', handleClickOutside)
            return () => document.removeEventListener('click', handleClickOutside)
        }
    }, [isOpen])

    return (
        <div className="notification-bell relative">
            <button
                onClick={handleOpen}
                className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
                {/* Bell Icon */}
                <svg
                    className={`w-6 h-6 ${unviewedCount > 0 ? 'animate-bounce' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                </svg>

                {/* Badge */}
                {unviewedCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                        {unviewedCount > 9 ? '9+' : unviewedCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                    {/* Header */}
                    <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900">🔔 Vendas Recentes</h3>
                        <span className="text-xs text-gray-500">Últimos 5 min</span>
                    </div>

                    {/* Sales List */}
                    <div className="max-h-96 overflow-y-auto">
                        {recentSales.length === 0 ? (
                            <div className="px-4 py-8 text-center">
                                <svg className="w-12 h-12 mx-auto text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                                <p className="text-sm text-gray-500">Nenhuma venda recente</p>
                            </div>
                        ) : (
                            recentSales.map((sale) => {
                                const isNew = !viewedSaleIds.has(sale.id)
                                const timeAgo = getTimeAgo(sale.createdAt)

                                return (
                                    <div
                                        key={sale.id}
                                        className={`px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 ${isNew ? 'bg-blue-50' : ''
                                            }`}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <p className="font-semibold text-sm text-gray-900">
                                                        {sale.orderNumber}
                                                    </p>
                                                    {isNew && (
                                                        <span className="px-2 py-0.5 bg-blue-500 text-white text-xs font-bold rounded">
                                                            NOVO
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-gray-600 mt-1">
                                                    {sale.customerName || 'Cliente não identificado'}
                                                </p>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {sale.itemsCount} {sale.itemsCount === 1 ? 'item' : 'itens'} • {sale.paymentMethod}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-green-600">
                                                    AOA {sale.totalAmount.toLocaleString('pt-AO')}
                                                </p>
                                                <p className="text-xs text-gray-400 mt-1">{timeAgo}</p>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>

                    {/* Footer */}
                    {recentSales.length > 0 && (
                        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
                            <Link
                                href="/dashboard"
                                className="block text-center text-sm font-semibold text-blue-600 hover:text-blue-800"
                                onClick={() => setIsOpen(false)}
                            >
                                Ver Dashboard Completo →
                            </Link>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

// Helper function to calculate time ago
function getTimeAgo(dateString: string): string {
    const now = new Date()
    const past = new Date(dateString)
    const diffMs = now.getTime() - past.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffSecs = Math.floor(diffMs / 1000)

    if (diffSecs < 10) return 'agora'
    if (diffSecs < 60) return `${diffSecs}s atrás`
    if (diffMins === 1) return '1 min atrás'
    if (diffMins < 60) return `${diffMins} min atrás`
    return past.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}
