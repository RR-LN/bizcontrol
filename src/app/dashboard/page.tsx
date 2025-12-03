"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import useSWR from "swr"
import { toast, Toaster } from "react-hot-toast"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import {
    AlertTriangle,
    ShoppingCart,
    Package,
    CreditCard,
    DollarSign,
    TrendingUp,
    LogOut,
    Truck,
    BarChart3,
    ArrowUpRight,
    LineChart,
    Receipt,
    PackageX,
    Calendar,
    Plus,
    Activity
} from "lucide-react"

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

export default function DashboardPageNew() {
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

                // Show toast
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
            console.error('Error fetching data:', error)
        }
    }

    const handleLogout = async () => {
        await fetch('/api/logout', { method: 'POST' })
        router.push('/login')
    }

    if (loading) return <DashboardSkeleton />

    const chartData = salesData ? salesData.labels.map((label, index) => ({
        date: label,
        vendas: salesData.data[index],
    })) : []

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50">
            <Toaster position="top-right" toastOptions={{
                style: {
                    background: 'rgb(15 23 42)',
                    color: 'white',
                    borderRadius: '8px',
                },
            }} />

            {/* Header */}
            <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-primary text-white grid place-items-center shadow-lg">
                                <BarChart3 className="w-5 h-5" />
                            </div>
                            <div>
                                <h1 className="text-xl font-extrabold tracking-tight">Painel da Loja</h1>
                                <p className="text-sm text-slate-500">Visão em 3s: problemas primeiro</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button variant="ghost" size="sm" onClick={handleLogout}>
                                <LogOut className="w-4 h-4 mr-2" />
                                Sair
                            </Button>
                            <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-primary text-white text-sm">
                                    {user?.name?.charAt(0) || 'A'}
                                </AvatarFallback>
                            </Avatar>
                        </div>
                    </div>
                </div>
            </header>

            {/* Critical Alert Banner */}
            {stockAlerts.length > 0 ? (
                <div className="sticky top-16 z-30 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-3">
                    <Card className="border-red-500/50 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md border-2 shadow-xl animate-pulse">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-red-600 text-white grid place-items-center animate-pulse">
                                        <AlertTriangle className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-red-700 dark:text-red-400 flex items-center gap-2">
                                            ⚠️ Alertas de Estoque Crítico
                                        </CardTitle>
                                        <CardDescription>
                                            {stockAlerts.length} produto(s) abaixo do ponto de reposição
                                        </CardDescription>
                                    </div>
                                </div>
                                <Button asChild variant="destructive">
                                    <Link href="/stock/alerts">
                                        <Truck className="w-4 h-4 mr-2" />
                                        Repor Agora
                                        <Badge variant="destructive" className="ml-2 animate-pulse">
                                            {stockAlerts.length}
                                        </Badge>
                                    </Link>
                                </Button>
                            </div>
                        </CardHeader>
                    </Card>
                </div>
            ) : null}

            <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <KPICardNew
                        title="Vendas Hoje"
                        value={`AOA ${kpiData?.todaySales.toLocaleString('pt-AO') || 0}`}
                        icon={<CreditCard className="w-5 h-5" />}
                        color="blue"
                        trend="+12%"
                    />
                    <KPICardNew
                        title="Lucro Hoje"
                        value={`AOA ${kpiData?.todayProfit.toLocaleString('pt-AO') || 0}`}
                        icon={<DollarSign className="w-5 h-5" />}
                        color="green"
                        trend="Saudável"
                    />
                    <KPICardNew
                        title="Estoque Baixo"
                        value={kpiData?.lowStockCount.toString() || '0'}
                        icon={<Package className="w-5 h-5" />}
                        color="red"
                        trend="Urgente"
                    />
                    <KPICardNew
                        title="Pedidos Hoje"
                        value={kpiData?.totalOrders.toString() || '0'}
                        icon={<ShoppingCart className="w-5 h-5" />}
                        color="purple"
                        trend="Ativo"
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Sales Chart */}
                    <Card className="col-span-1">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-lg">Vendas dos Últimos 7 Dias</CardTitle>
                                <CardDescription>Vendas e pedidos</CardDescription>
                            </div>
                            <Button variant="outline" size="sm">
                                <Calendar className="w-4 h-4 mr-2" />
                                Semana
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-800" />
                                    <XAxis dataKey="date" tick={{ fill: 'rgb(100 116 139)' }} />
                                    <YAxis tick={{ fill: 'rgb(100 116 139)' }} />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'rgb(15 23 42)',
                                            border: 'none',
                                            borderRadius: '8px',
                                            color: 'white'
                                        }}
                                        formatter={(value: number) => `AOA ${value.toLocaleString('pt-AO')}`}
                                    />
                                    <Bar
                                        dataKey="vendas"
                                        fill="rgb(38 103 255)"
                                        radius={[8, 8, 0, 0]}
                                        className="transition-all hover:fill-blue-700"
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Live Sales */}
                    <Card className="col-span-1">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div className="flex items-center gap-2">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    🔴 Vendas em Tempo Real
                                    <span className="animate-pulse w-2 h-2 bg-green-500 rounded-full"></span>
                                </CardTitle>
                                <Badge variant="secondary" className="text-xs animate-pulse">
                                    AO VIVO
                                </Badge>
                            </div>
                            <span className="text-xs text-slate-500">4s</span>
                        </CardHeader>
                        <CardContent>
                            <div className="max-h-96 overflow-y-auto space-y-2">
                                {liveSales.length === 0 ? (
                                    <div className="text-center py-12">
                                        <ShoppingCart className="w-16 h-16 mx-auto text-slate-300 mb-3" />
                                        <p className="text-slate-500">Aguardando vendas...</p>
                                        <p className="text-xs text-slate-400 mt-1">Últimos 10 minutos</p>
                                    </div>
                                ) : (
                                    liveSales.map(sale => (
                                        <div key={sale.id} className="border-l-4 border-green-500 pl-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors cursor-pointer">
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1">
                                                    <p className="font-semibold text-sm">{sale.orderNumber}</p>
                                                    <p className="text-xs text-slate-500 mt-0.5">
                                                        {sale.customerName || 'Cliente não identificado'} • {sale.itemsCount} {sale.itemsCount === 1 ? 'item' : 'itens'}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-bold text-green-600">
                                                        AOA {sale.totalAmount.toLocaleString('pt-AO')}
                                                    </p>
                                                    <p className="text-xs text-slate-500 mt-0.5">{sale.paymentMethod}</p>
                                                </div>
                                            </div>
                                            <p className="text-xs text-slate-400 mt-2">
                                                {new Date(sale.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                        <CardFooter>
                            <p className="text-xs text-slate-500 text-center w-full">
                                {liveSales.length || 0} {liveSales.length === 1 ? 'venda' : 'vendas'} nos últimos 10 minutos
                            </p>
                        </CardFooter>
                    </Card>
                </div>

                {/* Top Products */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-lg">Top 5 Produtos Mais Vendidos</CardTitle>
                            <CardDescription>Desempenho por receita</CardDescription>
                        </div>
                        <Link href="/products">
                            <Button variant="outline" size="sm">
                                <Activity className="w-4 h-4 mr-2" />
                                Ver Todos
                            </Button>
                        </Link>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {topProducts.length > 0 ? (
                                topProducts.map((product, index) => (
                                    <div key={index} className="flex items-center justify-between p-3 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-8 h-8 rounded-md bg-primary/10 text-primary grid place-items-center font-bold text-sm">
                                                {index + 1}
                                            </div>
                                            <div>
                                                <p className="font-medium">{product.name}</p>
                                                <p className="text-sm text-slate-500">{product.quantity} unidades</p>
                                            </div>
                                        </div>
                                        <p className="font-semibold">AOA {product.revenue.toLocaleString('pt-AO')}</p>
                                    </div>
                                ))
                            ) : (
                                <p className="text-slate-500 text-center py-8">Nenhum produto vendido ainda</p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-lg">📊 Atividade Recente</CardTitle>
                            <CardDescription>Movimentações de estoque</CardDescription>
                        </div>
                        <Link href="/stock/movements">
                            <Button variant="ghost" size="sm">
                                Ver Tudo <ArrowUpRight className="w-4 h-4 ml-1" />
                            </Button>
                        </Link>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {recentMovements.length > 0 ? (
                                recentMovements.map((movement) => {
                                    const isIncrease = movement.type === 'IN' || movement.type === 'ADJUSTMENT'
                                    const timeAgo = getTimeAgo(movement.createdAt)
                                    const actionText = getActionText(movement.type, movement.quantity, movement.product.name)

                                    return (
                                        <div key={movement.id} className="flex items-start space-x-3 p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                                            <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${movement.type === 'IN' ? 'bg-green-100 text-green-600' :
                                                    movement.type === 'OUT' ? 'bg-red-100 text-red-600' :
                                                        movement.type === 'ADJUSTMENT' ? 'bg-yellow-100 text-yellow-600' :
                                                            'bg-blue-100 text-blue-600'
                                                }`}>
                                                {movement.type === 'IN' ? (
                                                    <TrendingUp className="w-5 h-5" />
                                                ) : movement.type === 'OUT' ? (
                                                    <ShoppingCart className="w-5 h-5" />
                                                ) : (
                                                    <Activity className="w-5 h-5" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm text-slate-900 dark:text-slate-100">
                                                    <span className="font-semibold">{movement.user.name}</span>
                                                    {' '}{actionText}
                                                </p>
                                                <p className="text-xs text-slate-500 mt-1">{timeAgo}</p>
                                            </div>
                                            <Badge variant="outline" className="text-xs">
                                                {movement.type}
                                            </Badge>
                                        </div>
                                    )
                                })
                            ) : (
                                <p className="text-slate-500 text-center py-8">Nenhuma atividade recente</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </main>
        </div>
    )
}

// Componente KPI Card melhorado
function KPICardNew({
    title,
    value,
    icon,
    color,
    trend
}: {
    title: string;
    value: string;
    icon: React.ReactNode;
    color: 'blue' | 'green' | 'red' | 'purple';
    trend: string;
}) {
    const colorClasses = {
        blue: 'bg-blue-100 text-blue-700 border-blue-200',
        green: 'bg-green-100 text-green-700 border-green-200',
        red: 'bg-red-100 text-red-700 border-red-200',
        purple: 'bg-purple-100 text-purple-700 border-purple-200',
    }

    return (
        <Card className={`border-2 ${colorClasses[color]} hover:shadow-lg transition-all duration-300 hover:-translate-y-1`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <div className="h-10 w-10 rounded-lg grid place-items-center">
                    {icon}
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                <Badge variant="secondary" className="mt-2 text-xs font-semibold">
                    {trend}
                </Badge>
            </CardContent>
        </Card>
    )
}

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

function DashboardSkeleton() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
            <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <div className="container mx-auto px-4 py-3">
                    <div className="flex items-center justify-between">
                        <Skeleton className="h-10 w-64" />
                        <Skeleton className="h-10 w-24" />
                    </div>
                </div>
            </header>
            <main className="container mx-auto px-4 py-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <Skeleton key={i} className="h-32 w-full" />
                    ))}
                </div>
            </main>
        </div>
    )
}
