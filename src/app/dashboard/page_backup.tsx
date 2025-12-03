"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import useSWR from "swr"
import toast, { Toaster } from "react-hot-toast"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface KPIData {
    todaySales: number
    todayProfit: number
    lowStockCount: number
    totalOrders: number
}

interface SalesData {
    labels: string[]
    data: number[]
}

interface TopProduct {
    name: string
    quantity: number
    revenue: number
}

interface StockAlert {
    id: string
    code: string
    name: string
    quantity: number
    availableStock: number
    reorderPoint: number
    severity: number
    supplierName: string
}

interface StockMovement {
    id: string
    type: string
    quantity: number
    reason: string | null
    createdAt: string
    product: {
        name: string
        code: string
    }
    user: {
        name: string
        email: string
    }
}

interface LiveSale {
    id: string
    orderNumber: string
    totalAmount: number
    paymentMethod: string
    customerName: string | null
    itemsCount: number
    createdAt: string
}

// SWR fetcher
const fetcher = (url: string) => fetch(url).then(res => res.json())

export default function DashboardPage() {
    const router = useRouter()
    const [user, setUser] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [kpiData, setKpiData] = useState<KPIData | null>(null)
    const [salesData, setSalesData] = useState<SalesData | null>(null)
    const [topProducts, setTopProducts] = useState<TopProduct[]>([])

    // Stock alerts with auto-refresh every 30 seconds
    const { data: stockAlertsData } = useSWR<{ success: boolean, data: StockAlert[], count: number }>(
        '/api/stock/alerts',
        fetcher,
        { refreshInterval: 30000 }
    )

    const stockAlerts = stockAlertsData?.data || []

    // Recent stock movements with auto-refresh every 30 seconds
    const { data: recentMovementsData } = useSWR<{ success: boolean, data: StockMovement[] }>(
        '/api/stock/movements?limit=5',
        fetcher,
        { refreshInterval: 30000 }
    )

    const recentMovements = recentMovementsData?.data || []

    // Live sales with polling every 4 seconds
    const { data: liveSalesData, mutate: mutateLiveSales } = useSWR<{ success: boolean, data: LiveSale[], count: number }>(
        '/api/dashboard/live-sales',
        fetcher,
        { refreshInterval: 4000 }
    )

    const liveSales: LiveSale[] = liveSalesData?.data || []
    const [previousSalesIds, setPreviousSalesIds] = useState<Set<string>>(new Set())

    // Effect to detect new sales
    useEffect(() => {
        if (liveSales.length > 0 && previousSalesIds.size > 0) {
            const newSales = liveSales.filter(sale => !previousSalesIds.has(sale.id))

            if (newSales.length > 0) {
                // Play sound
                const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmFgU7k9n1unEiBC13yO/eizEIHWq+8+OWT')
                audio.volume = 0.3
                audio.play().catch(() => console.log('Som bloqueado pelo navegador'))

                // Show toast for each new sale
                newSales.forEach(sale => {
                    toast.success(`💰 Nova venda: ${sale.orderNumber} - AOA ${sale.totalAmount.toLocaleString('pt-AO')}`, {
                        duration: 5000,
                        position: 'top-right'
                    })
                })

                // Refresh KPIs
                fetchDashboardData()
            }
        }

        // Update list of processed IDs
        setPreviousSalesIds(new Set(liveSales.map(s => s.id)))
    }, [liveSales])

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const response = await fetch('/api/me')
                if (!response.ok) {
                    router.push('/login')
                    return
                }
                const data = await response.json()

                if (data.user.role !== 'ADMIN') {
                    router.push('/login')
                    return
                }

                setUser(data.user)
                await fetchDashboardData()
            } catch (error) {
                router.push('/login')
            } finally {
                setLoading(false)
            }
        }

        checkAuth()
    }, [router])

    const fetchDashboardData = async () => {
        try {
            const [kpiRes, salesRes, productsRes] = await Promise.all([
                fetch('/api/dashboard/kpi'),
                fetch('/api/dashboard/sales'),
                fetch('/api/dashboard/top-products'),
            ])

            const kpi = await kpiRes.json()
            const sales = await salesRes.json()
            const products = await productsRes.json()

            setKpiData(kpi.data)
            setSalesData(sales)
            setTopProducts(products.data)
        } catch (error) {
            console.error('Error fetching dashboard data:', error)
        }
    }

    const handleLogout = async () => {
        await fetch('/api/logout', { method: 'POST' })
        router.push('/login')
    }

    if (loading) {
        return <DashboardSkeleton />
    }

    const chartData = salesData ? salesData.labels.map((label, index) => ({
        date: label,
        vendas: salesData.data[index],
    })) : []

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                            </div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                BizControl <span className="text-blue-600">360</span>
                            </h1>
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="text-right">
                                <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
                                <p className="text-xs text-gray-500">Administrador</p>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-semibold"
                            >
                                Sair
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Welcome */}
                <div className="mb-8">
                    <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
                    <p className="text-gray-600 mt-1">Visão geral do sistema</p>
                </div>

                {/* CRITICAL STOCK ALERTS - DESTAQUE */}
                {stockAlerts.length > 0 && (
                    <div className="mb-8 bg-gradient-to-r from-red-600 to-red-700 rounded-xl shadow-lg border-2 border-red-800 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center">
                                <svg className="w-8 h-8 text-white mr-3 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                                </svg>
                                <div>
                                    <h3 className="text-xl font-bold text-white">⚠️ Alertas de Estoque Crítico</h3>
                                    <p className="text-red-100 text-sm">{stockAlerts.length} produto(s) abaixo do ponto de reposição</p>
                                </div>
                            </div>
                            <Link
                                href="/stock/alerts"
                                className="px-6 py-3 bg-white text-red-600 rounded-lg hover:bg-red-50 transition-colors font-bold shadow-md"
                            >
                                Ver Todos →
                            </Link>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                            {stockAlerts.slice(0, 6).map((alert) => (
                                <div key={alert.id} className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-4">
                                    <p className="font-bold text-white text-lg">{alert.name}</p>
                                    <p className="text-red-100 text-sm mt-1">{alert.code}</p>
                                    <div className="flex items-center mt-3 space-x-3">
                                        <div>
                                            <p className="text-xs text-red-200">Estoque</p>
                                            <p className="text-2xl font-bold text-white">{alert.quantity}</p>
                                        </div>
                                        <p className="text-red-200 text-2xl">/</p>
                                        <div>
                                            <p className="text-xs text-red-200">Reposição</p>
                                            <p className="text-2xl font-bold text-red-200">{alert.reorderPoint}</p>
                                        </div>
                                    </div>
                                    <p className="text-xs text-red-100 mt-2">📦 {alert.supplierName}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {stockAlerts.length === 0 && (
                    <div className="mb-8 bg-gradient-to-r from-green-500 to-green-600 rounded-xl shadow-lg p-6">
                        <div className="flex items-center justify-center">
                            <svg className="w-12 h-12 text-white mr-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <div>
                                <h3 className="text-2xl font-bold text-white">✅ Tudo sob controle!</h3>
                                <p className="text-green-100 mt-1">Nenhum produto com estoque crítico</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <KPICard title="Vendas Hoje" value={`AOA ${kpiData?.todaySales.toLocaleString() || 0}`} icon="💰" color="blue" />
                    <KPICard title="Lucro Hoje" value={`AOA ${kpiData?.todayProfit.toLocaleString() || 0}`} icon="📈" color="green" />
                    <KPICard title="Estoque Baixo" value={kpiData?.lowStockCount.toString() || '0'} icon="⚠️" color="red" />
                    <KPICard title="Pedidos Hoje" value={kpiData?.totalOrders.toString() || '0'} icon="📦" color="purple" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Sales Chart */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Vendas dos Últimos 7 Dias</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip formatter={(value: number) => `AOA ${value.toLocaleString()}`} labelStyle={{ color: '#000' }} />
                                <Bar dataKey="vendas" fill="#3B82F6" radius={[8, 8, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Top Products */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top 5 Produtos Mais Vendidos</h3>
                        <div className="space-y-3">
                            {topProducts.length > 0 ? (
                                topProducts.map((product, index) => (
                                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-sm">
                                                {index + 1}
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900">{product.name}</p>
                                                <p className="text-sm text-gray-600">{product.quantity} unidades</p>
                                            </div>
                                        </div>
                                        <p className="font-semibold text-gray-900">AOA {product.revenue.toLocaleString()}</p>
                                    </div>
                                ))
                            ) : (
                                <p className="text-gray-500 text-center py-8">Nenhum produto vendido ainda</p>
                            )}
                        </div>
                    </div>

                    {/* Live Sales - Real Time */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                🔴 Vendas em Tempo Real
                                <span className="animate-pulse w-2 h-2 bg-green-500 rounded-full"></span>
                            </h3>
                            <span className="text-xs text-gray-500">Atualiza a cada 4s</span>
                        </div>
                        <div className="max-h-96 overflow-y-auto space-y-2">
                            {liveSales.length === 0 ? (
                                <div className="text-center py-12">
                                    <svg className="w-16 h-16 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                    <p className="text-gray-500">Aguardando vendas...</p>
                                    <p className="text-xs text-gray-400 mt-1">Últimos 10 minutos</p>
                                </div>
                            ) : (
                                liveSales.map(sale => (
                                    <div key={sale.id} className="border-l-4 border-green-500 pl-3 py-2 hover:bg-gray-50 rounded transition-colors">
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <p className="font-semibold text-sm text-gray-900">{sale.orderNumber}</p>
                                                <p className="text-xs text-gray-600 mt-0.5">
                                                    {sale.customerName || 'Cliente não identificado'} • {sale.itemsCount} {sale.itemsCount === 1 ? 'item' : 'itens'}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-green-600">
                                                    AOA {sale.totalAmount.toLocaleString('pt-AO')}
                                                </p>
                                                <p className="text-xs text-gray-500 mt-0.5">{sale.paymentMethod}</p>
                                            </div>
                                        </div>
                                        <p className="text-xs text-gray-400 mt-2">
                                            {new Date(sale.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                ))
                            )}
                        </div>
                        {liveSales.length > 0 && (
                            <div className="mt-4 pt-3 border-t text-xs text-gray-500 text-center">
                                {liveSales.length} {liveSales.length === 1 ? 'venda' : 'vendas'} nos últimos 10 minutos
                            </div>
                        )}
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">📊 Atividade Recente</h3>
                        <Link
                            href="/stock/movements"
                            className="text-sm text-blue-600 hover:text-blue-800 font-semibold"
                        >
                            Ver Tudo →
                        </Link>
                    </div>
                    <div className="space-y-3">
                        {recentMovements.length > 0 ? (
                            recentMovements.map((movement) => {
                                const isIncrease = movement.type === 'IN' || movement.type === 'ADJUSTMENT'
                                const timeAgo = getTimeAgo(movement.createdAt)
                                const actionText = getActionText(movement.type, movement.quantity, movement.product.name)

                                return (
                                    <div key={movement.id} className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                                        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${movement.type === 'IN' ? 'bg-green-100' :
                                            movement.type === 'OUT' ? 'bg-red-100' :
                                                movement.type === 'ADJUSTMENT' ? 'bg-yellow-100' :
                                                    'bg-blue-100'
                                            }`}>
                                            {movement.type === 'IN' ? (
                                                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                                                </svg>
                                            ) : movement.type === 'OUT' ? (
                                                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                                                </svg>
                                            ) : movement.type === 'ADJUSTMENT' ? (
                                                <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                                                </svg>
                                            ) : (
                                                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                                </svg>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-gray-900">
                                                <span className="font-semibold">{movement.user.name}</span>
                                                {' '}{actionText}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">{timeAgo}</p>
                                        </div>
                                    </div>
                                )
                            })
                        ) : (
                            <p className="text-gray-500 text-center py-8">Nenhuma atividade recente</p>
                        )}
                    </div>
                </div>
        </div>
            </main >
        </div >
    )
}

// Helper function to get time ago
function getTimeAgo(dateString: string): string {
    const now = new Date()
    const past = new Date(dateString)
    const diffMs = now.getTime() - past.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'agora mesmo'
    if (diffMins === 1) return 'há 1 minuto'
    if (diffMins < 60) return `há ${diffMins} minutos`
    if (diffHours === 1) return 'há 1 hora'
    if (diffHours < 24) return `há ${diffHours} horas`
    if (diffDays === 1) return 'ontem'
    if (diffDays < 7) return `há ${diffDays} dias`
    return past.toLocaleDateString('pt-BR')
}

// Helper function to get action text
function getActionText(type: string, quantity: number, productName: string): string {
    switch (type) {
        case 'IN':
            return `adicionou ${quantity}x ${productName}`
        case 'OUT':
            return `vendeu ${quantity}x ${productName}`
        case 'ADJUSTMENT':
            return `ajustou estoque de ${productName}`
        case 'TRANSFER':
            return `transferiu ${quantity}x ${productName}`
        default:
            return `movimentou ${quantity}x ${productName}`
    }
}
}

function KPICard({ title, value, icon, color }: { title: string; value: string; icon: string; color: string }) {
    const colorClasses = {
        blue: 'bg-blue-50 border-blue-200',
        green: 'bg-green-50 border-green-200',
        red: 'bg-red-50 border-red-200',
        purple: 'bg-purple-50 border-purple-200',
    }

    return (
        <div className={`${colorClasses[color as keyof typeof colorClasses]} rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow`}>
            <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-600">{title}</p>
                <span className="text-2xl">{icon}</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
    )
}

function DashboardSkeleton() {
    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="h-10 bg-gray-200 rounded animate-pulse w-64"></div>
                </div>
            </header>
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <div className="h-4 bg-gray-200 rounded animate-pulse mb-4 w-24"></div>
                            <div className="h-8 bg-gray-200 rounded animate-pulse w-32"></div>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    )
}
