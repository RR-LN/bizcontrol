"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import useSWR from "swr"

interface StockAlert {
    id: string
    code: string
    name: string
    quantity: number
    availableStock: number
    reserved: number
    reorderPoint: number
    severity: number
    supplierName: string
    supplierEmail: string | null
    supplierPhone: string | null
    supplierId: string | null
    image: string | null
}

// SWR fetcher
const fetcher = (url: string) => fetch(url).then(res => res.json())

export default function StockAlertsPage() {
    const router = useRouter()
    const [user, setUser] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")

    // Fetch alerts with auto-refresh every 30 seconds
    const { data: alertsData, isLoading } = useSWR<{ success: boolean, data: StockAlert[], count: number }>(
        '/api/stock/alerts',
        fetcher,
        { refreshInterval: 30000 }
    )

    const alerts = alertsData?.data || []

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const response = await fetch('/api/me')
                if (!response.ok) {
                    router.push('/login')
                    return
                }
                const data = await response.json()

                // Check if user is ADMIN or MANAGER
                if (data.user.role !== 'ADMIN' && data.user.role !== 'MANAGER') {
                    router.push('/login')
                    return
                }

                setUser(data.user)
            } catch (error) {
                router.push('/login')
            } finally {
                setLoading(false)
            }
        }

        checkAuth()
    }, [router])

    const getStatusInfo = (quantity: number, reorderPoint: number) => {
        const percentage = (quantity / reorderPoint) * 100

        if (percentage < 50) {
            return {
                label: 'Crítico',
                className: 'bg-red-100 text-red-800 border border-red-300',
                icon: '🔴'
            }
        } else if (percentage < 100) {
            return {
                label: 'Atenção',
                className: 'bg-orange-100 text-orange-800 border border-orange-300',
                icon: '🟠'
            }
        } else {
            return {
                label: 'Normal',
                className: 'bg-green-100 text-green-800 border border-green-300',
                icon: '🟢'
            }
        }
    }

    // Filter alerts by search query
    const filteredAlerts = alerts.filter(alert =>
        alert.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        alert.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        alert.supplierName.toLowerCase().includes(searchQuery.toLowerCase())
    )

    if (loading) {
        return <LoadingSkeleton />
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                </svg>
                            </Link>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">⚠️ Alertas de Estoque Crítico</h1>
                                <p className="text-sm text-gray-600">Produtos que precisam de reposição urgente</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3">
                            {isLoading && (
                                <div className="flex items-center text-sm text-gray-500">
                                    <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Atualizando...
                                </div>
                            )}
                            <div className="px-4 py-2 bg-red-100 text-red-700 rounded-lg font-semibold">
                                {alerts.length} Produto(s) Crítico(s)
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg p-6 text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-red-100 text-sm font-medium">Crítico (&lt; 50%)</p>
                                <p className="text-4xl font-bold mt-2">
                                    {alerts.filter(a => (a.quantity / a.reorderPoint) * 100 < 50).length}
                                </p>
                            </div>
                            <div className="text-5xl">🔴</div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-orange-100 text-sm font-medium">Atenção (50-100%)</p>
                                <p className="text-4xl font-bold mt-2">
                                    {alerts.filter(a => {
                                        const pct = (a.quantity / a.reorderPoint) * 100
                                        return pct >= 50 && pct < 100
                                    }).length}
                                </p>
                            </div>
                            <div className="text-5xl">🟠</div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-blue-100 text-sm font-medium">Total de Alertas</p>
                                <p className="text-4xl font-bold mt-2">{alerts.length}</p>
                            </div>
                            <div className="text-5xl">📦</div>
                        </div>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
                    <div className="relative">
                        <svg className="absolute left-3 top-3 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Buscar por produto, código ou fornecedor..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                        Produto
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                        Código
                                    </th>
                                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                        Estoque Atual
                                    </th>
                                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                        Ponto Reposição
                                    </th>
                                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                        Déficit
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                        Fornecedor
                                    </th>
                                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                        Ações
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredAlerts.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="px-6 py-12 text-center">
                                            <div className="flex flex-col items-center justify-center text-gray-500">
                                                <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <p className="text-xl font-semibold">Nenhum alerta encontrado</p>
                                                <p className="text-sm mt-2">
                                                    {searchQuery ? 'Tente ajustar sua busca' : 'Todos os produtos estão com estoque adequado! ✅'}
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredAlerts.map((alert) => {
                                        const status = getStatusInfo(alert.quantity, alert.reorderPoint)
                                        const percentage = ((alert.quantity / alert.reorderPoint) * 100).toFixed(0)

                                        return (
                                            <tr key={alert.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center">
                                                        {alert.image ? (
                                                            <img src={alert.image} alt={alert.name} className="w-12 h-12 rounded-lg object-cover mr-3" />
                                                        ) : (
                                                            <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center mr-3">
                                                                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                                                </svg>
                                                            </div>
                                                        )}
                                                        <div>
                                                            <p className="font-semibold text-gray-900">{alert.name}</p>
                                                            <p className="text-sm text-gray-500">Disponível: {alert.availableStock}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="font-mono text-sm text-gray-700">{alert.code}</span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className="flex flex-col items-center">
                                                        <span className="text-2xl font-bold text-gray-900">{alert.quantity}</span>
                                                        <span className="text-xs text-gray-500">{percentage}%</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className="text-lg font-semibold text-gray-700">{alert.reorderPoint}</span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className="text-lg font-bold text-red-600">-{alert.severity}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div>
                                                        <p className="font-medium text-gray-900">{alert.supplierName}</p>
                                                        {alert.supplierEmail && (
                                                            <p className="text-sm text-gray-500">{alert.supplierEmail}</p>
                                                        )}
                                                        {alert.supplierPhone && (
                                                            <p className="text-sm text-gray-500">{alert.supplierPhone}</p>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${status.className}`}>
                                                        {status.icon} {status.label}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <button
                                                        onClick={() => alert('Funcionalidade de Gerar Pedido em desenvolvimento')}
                                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold"
                                                    >
                                                        📋 Gerar Pedido
                                                    </button>
                                                </td>
                                            </tr>
                                        )
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Footer Info */}
                <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start">
                        <svg className="w-6 h-6 text-blue-600 mr-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        <div className="flex-1">
                            <p className="text-sm font-semibold text-blue-900">Atualização Automática</p>
                            <p className="text-sm text-blue-700 mt-1">
                                Esta página atualiza automaticamente a cada 30 segundos para mostrar os alertas mais recentes.
                            </p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}

function LoadingSkeleton() {
    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="h-8 bg-gray-200 rounded animate-pulse w-64"></div>
                </div>
            </header>
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <div className="h-20 bg-gray-200 rounded animate-pulse"></div>
                        </div>
                    ))}
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
                </div>
            </main>
        </div>
    )
}
