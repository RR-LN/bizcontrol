"use client"

import { useEffect, useState, useMemo, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import useSWR from "swr"
import { toast, Toaster } from "react-hot-toast"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts"

// IMPORTANTE: Ajuste os caminhos abaixo conforme a estrutura do seu projeto
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"

import {
  AlertTriangle,
  ShoppingCart,
  Package,
  CreditCard,
  DollarSign,
  LogOut,
  Truck,
  BarChart3,
  ArrowUpRight,
  Calendar,
  Activity,
  TrendingUp,
  TrendingDown,
} from "lucide-react"

// --- Interfaces ---

interface User {
  name: string
  email: string
  role: string
}

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
  type: "IN" | "OUT" | "ADJUSTMENT" | "TRANSFER"
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

// --- Fetcher & Utils ---

const fetcher = (url: string) => fetch(url).then((res) => res.json())

function generateSparklineData(baseValue: number): number[] {
  const days = 7
  const variation = baseValue * 0.15
  return Array.from({ length: days }, () => {
    const randomVariation = (Math.random() - 0.5) * 2 * variation
    return Math.max(0, baseValue + randomVariation)
  })
}

const NOTIFICATION_SOUND = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmFgU7k9n1unEiBC13yO/eizEIHWq+8+OWT'

// --- Main Component ---

export default function DashboardPageNew() {
  const router = useRouter()
  const audioRef = useRef<HTMLAudioElement | null>(null)
  
  // Auth State
  const { data: userData, error: userError } = useSWR('/api/me', fetcher)
  
  // Dashboard Data Hooks (Parallel Fetching)
  const { data: kpiResult } = useSWR<{ data: KPIData }>('/api/dashboard/kpi', fetcher)
  const { data: salesResult } = useSWR<SalesData>('/api/dashboard/sales', fetcher)
  const { data: productsResult } = useSWR<{ data: TopProduct[] }>('/api/dashboard/top-products', fetcher)
  
  // Real-time Data Hooks
  const { data: stockAlertsResult } = useSWR<{ data: StockAlert[] }>(
    '/api/stock/alerts', 
    fetcher, 
    { refreshInterval: 30000 }
  )
  
  const { data: movementsResult } = useSWR<{ data: StockMovement[] }>(
    '/api/stock/movements?limit=5', 
    fetcher, 
    { refreshInterval: 30000 }
  )

  const { data: liveSalesResult } = useSWR<{ data: LiveSale[] }>(
    '/api/dashboard/live-sales', 
    fetcher, 
    { refreshInterval: 4000 }
  )

  // Derived State
  const user = userData?.user
  const isLoading = !userData && !userError
  const kpiData = kpiResult?.data
  const salesData = salesResult
  const topProducts = productsResult?.data || []
  const stockAlerts = stockAlertsResult?.data || []
  const recentMovements = movementsResult?.data || []
  const liveSales = liveSalesResult?.data || []

  // Sales Notification Logic
  const [previousSalesIds, setPreviousSalesIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    // Initialize Audio once
    audioRef.current = new Audio(NOTIFICATION_SOUND)
    audioRef.current.volume = 0.3
  }, [])

  useEffect(() => {
    // Auth Guard
    if (userData && userData.user.role !== 'ADMIN') {
      router.push('/login')
    } else if (userError) {
      router.push('/login')
    }
  }, [userData, userError, router])

  useEffect(() => {
    // Live Sales Notification
    if (liveSales.length > 0 && previousSalesIds.size > 0) {
      const newSales = liveSales.filter((sale) => !previousSalesIds.has(sale.id))
      
      if (newSales.length > 0) {
        audioRef.current?.play().catch(() => console.log('Áudio bloqueado'))
        
        newSales.forEach((sale) => {
          toast.success(
            <div className="flex flex-col">
              <span className="font-bold">Nova venda: {sale.orderNumber}</span>
              <span className="text-sm">AOA {sale.totalAmount.toLocaleString('pt-AO')}</span>
            </div>, 
            { duration: 5000, position: 'top-right', icon: '💰' }
          )
        })
      }
    }
    setPreviousSalesIds(new Set(liveSales.map((s) => s.id)))
  }, [liveSales]) // Removed previousSalesIds from deps to avoid loop, managed inside

  const handleLogout = async () => {
    await fetch('/api/logout', { method: 'POST' })
    router.push('/login')
  }

  // Memoized Chart Data
  const chartData = useMemo(() => {
    if (!salesData) return []
    return salesData.labels.map((label, index) => ({
      date: label,
      vendas: salesData.data[index],
    }))
  }, [salesData])

  if (isLoading || !kpiData) return <DashboardSkeleton />

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-sky-500/30">
      <Toaster 
        position="top-right" 
        toastOptions={{
          style: {
            background: 'rgb(15 23 42)',
            color: 'white',
            borderRadius: '12px',
            border: '1px solid rgb(51 65 85)',
          },
        }} 
      />

      {/* Header */}
      <DashboardHeader user={user} onLogout={handleLogout} />

      {/* Critical Alerts */}
      {stockAlerts.length > 0 && <CriticalStockBanner count={stockAlerts.length} />}

      <main className="container mx-auto px-4 sm:px-6 py-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {/* KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KPICardNew
            title="Vendas Hoje"
            value={`AOA ${kpiData.todaySales.toLocaleString('pt-AO')}`}
            icon={<CreditCard className="w-5 h-5" />}
            color="sky"
            trend="vs. ontem"
            sparklineData={generateSparklineData(kpiData.todaySales)}
          />
          <KPICardNew
            title="Lucro Hoje"
            value={`AOA ${kpiData.todayProfit.toLocaleString('pt-AO')}`}
            icon={<DollarSign className="w-5 h-5" />}
            color="emerald"
            trend="vs. ontem"
            sparklineData={generateSparklineData(kpiData.todayProfit)}
          />
          <KPICardNew
            title="Estoque Baixo"
            value={kpiData.lowStockCount.toString()}
            icon={<Package className="w-5 h-5" />}
            color="red"
            trend="urgente"
            sparklineData={generateSparklineData(kpiData.lowStockCount)}
          />
          <KPICardNew
            title="Pedidos Hoje"
            value={kpiData.totalOrders.toString()}
            icon={<ShoppingCart className="w-5 h-5" />}
            color="violet"
            trend="vs. ontem"
            sparklineData={generateSparklineData(kpiData.totalOrders)}
          />
        </div>

        {/* Charts & Live Feed Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sales Chart (Takes 2 columns) */}
          <div className="lg:col-span-2 bg-slate-900/50 border border-slate-800/60 rounded-xl p-6 backdrop-blur-sm">
            <div className="flex flex-row items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-50 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-sky-400" />
                  Performance de Vendas
                </h3>
                <p className="text-sm text-slate-400 mt-1">Receita nos últimos 7 dias</p>
              </div>
              <Button variant="outline" size="sm" className="border-slate-700 bg-slate-800/50 text-slate-300 hover:bg-slate-700 hover:text-white">
                <Calendar className="w-4 h-4 mr-2" /> Semana
              </Button>
            </div>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#38bdf8" stopOpacity={1} />
                    <stop offset="100%" stopColor="#0284c7" stopOpacity={0.8} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  tick={{ fill: '#94a3b8', fontSize: 12 }} 
                  stroke="#475569" 
                  tickLine={false} 
                  axisLine={false} 
                  dy={10}
                />
                <YAxis 
                  tick={{ fill: '#94a3b8', fontSize: 12 }} 
                  stroke="#475569" 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(value) => `${value / 1000}k`}
                />
                <Tooltip
                  cursor={{ fill: '#1e293b', opacity: 0.4 }}
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    border: '1px solid rgb(51, 65, 85)',
                    borderRadius: '8px',
                    color: 'white',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
                  }}
                  formatter={(value: number) => [`AOA ${value.toLocaleString('pt-AO')}`, 'Vendas']}
                />
                <Bar 
                  dataKey="vendas" 
                  fill="url(#colorGradient)" 
                  radius={[6, 6, 0, 0]} 
                  maxBarSize={50}
                  animationDuration={1500}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Live Sales Feed (Takes 1 column) */}
          <div className="lg:col-span-1">
             <LiveSalesFeed sales={liveSales} />
          </div>
        </div>

        {/* Bottom Section: Top Products & Recent Movements */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <TopProductsList products={topProducts} />
          <RecentMovementsList movements={recentMovements} />
        </div>

      </main>
    </div>
  )
}

// --- Sub-components ---

function DashboardHeader({ user, onLogout }: { user: any, onLogout: () => void }) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/60 bg-slate-950/80 backdrop-blur-xl">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-sky-500/20 to-blue-600/20 text-sky-400 grid place-items-center border border-slate-700/50 shadow-lg shadow-sky-500/10">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-50 tracking-tight">Painel da Loja</h1>
              <p className="text-xs text-slate-500 font-medium">Visão geral do negócio</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onLogout}
              className="text-slate-400 hover:text-red-400 hover:bg-red-950/30 transition-colors"
            >
              <LogOut className="w-4 h-4 mr-2" /> Sair
            </Button>
            <div className="flex items-center gap-3 pl-4 border-l border-slate-800">
               <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-slate-200">{user?.name || 'Admin'}</p>
                  <p className="text-xs text-slate-500">{user?.role || 'Gerente'}</p>
               </div>
               <Avatar className="h-9 w-9 border-2 border-slate-800 cursor-pointer hover:border-sky-500/50 transition-colors">
                <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-xs font-bold">
                  {user?.name?.charAt(0) || 'A'}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

function CriticalStockBanner({ count }: { count: number }) {
  return (
    <div className="sticky top-[80px] z-30 mx-auto max-w-7xl px-4 sm:px-6 py-4 animate-in slide-in-from-top-4 fade-in duration-500">
      <div className="border border-red-500/30 bg-gradient-to-r from-red-950/95 to-rose-950/95 backdrop-blur-md rounded-xl shadow-2xl shadow-red-900/20 overflow-hidden relative">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150"></div>
        <div className="p-4 relative z-10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-red-500/20 text-red-400 grid place-items-center shadow-[0_0_15px_rgba(239,68,68,0.4)] animate-pulse">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-red-100 flex items-center gap-2">
                  Ação Necessária: Estoque Crítico
                </h3>
                <p className="text-sm text-red-300/70">
                  {count} {count === 1 ? 'produto atingiu' : 'produtos atingiram'} o nível mínimo de reposição.
                </p>
              </div>
            </div>
            <Link href="/stock/alerts" className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto bg-red-600 hover:bg-red-500 text-white border-0 shadow-lg shadow-red-900/40 font-semibold transition-all hover:scale-105 active:scale-95">
                <Truck className="w-4 h-4 mr-2" /> Resolver Agora
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

function LiveSalesFeed({ sales }: { sales: LiveSale[] }) {
  return (
    <div className="h-full bg-slate-900/50 border border-slate-800/60 rounded-xl p-6 flex flex-col">
      <div className="flex flex-row items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-bold text-slate-50">Vendas Agora</h3>
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto pr-2 space-y-3 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
        {sales.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
            <ShoppingCart className="w-12 h-12 mb-3 text-slate-600" />
            <p className="text-slate-400 text-sm">Aguardando novos pedidos...</p>
          </div>
        ) : (
          sales.map((sale) => (
            <div
              key={sale.id}
              className="group relative overflow-hidden bg-slate-800/40 hover:bg-slate-800 p-4 rounded-lg border border-slate-700/50 hover:border-slate-600 transition-all duration-300"
            >
               <div className="flex justify-between items-start relative z-10">
                <div>
                   <p className="font-bold text-slate-200 text-sm">{sale.orderNumber}</p>
                   <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-600"></span>
                      {sale.customerName || 'Cliente Balcão'}
                   </p>
                </div>
                <div className="text-right">
                   <p className="text-emerald-400 font-bold text-sm">AOA {sale.totalAmount.toLocaleString('pt-AO')}</p>
                   <p className="text-[10px] uppercase tracking-wider text-slate-500 mt-0.5">{sale.paymentMethod}</p>
                </div>
               </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function TopProductsList({ products }: { products: TopProduct[] }) {
  return (
    <div className="bg-slate-900/50 border border-slate-800/60 rounded-xl p-6">
      <div className="flex flex-row items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-slate-50">Top Produtos</h3>
          <p className="text-sm text-slate-400 mt-1">Líderes de receita</p>
        </div>
        <Link href="/products">
          <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
            <Activity className="w-4 h-4 mr-2" /> Detalhes
          </Button>
        </Link>
      </div>
      <div className="space-y-3">
        {products.length > 0 ? (
          products.map((product, index) => (
            <div key={index} className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-800/50 transition-colors group">
              <div className="flex items-center gap-4">
                <span className={`
                  w-8 h-8 rounded-lg grid place-items-center text-sm font-bold
                  ${index === 0 ? 'bg-yellow-500/20 text-yellow-500' : 
                    index === 1 ? 'bg-slate-400/20 text-slate-400' :
                    index === 2 ? 'bg-orange-500/20 text-orange-500' : 
                    'bg-slate-800 text-slate-500'}
                `}>
                  {index + 1}
                </span>
                <div>
                  <p className="font-medium text-slate-200 text-sm group-hover:text-white transition-colors">{product.name}</p>
                  <p className="text-xs text-slate-500">{product.quantity} vendidos</p>
                </div>
              </div>
              <p className="font-mono text-sm font-semibold text-slate-300">
                <span className="text-slate-600 mr-1">AOA</span>
                {product.revenue.toLocaleString('pt-AO')}
              </p>
            </div>
          ))
        ) : (
          <p className="text-slate-500 text-center py-8 text-sm">Nenhum dado disponível</p>
        )}
      </div>
    </div>
  )
}

function RecentMovementsList({ movements }: { movements: StockMovement[] }) {
  return (
    <div className="bg-slate-900/50 border border-slate-800/60 rounded-xl p-6">
      <div className="flex flex-row items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-slate-50">Movimentações</h3>
          <p className="text-sm text-slate-400 mt-1">Histórico recente de estoque</p>
        </div>
        <Link href="/stock/movements">
          <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
             Ver Tudo <ArrowUpRight className="w-4 h-4 ml-1" />
          </Button>
        </Link>
      </div>
      <div className="space-y-4">
        {movements.map((movement) => {
           const isPositive = movement.type === 'IN';
           return (
            <div key={movement.id} className="flex items-start gap-4 p-3 rounded-lg hover:bg-slate-800/30 transition-colors border border-transparent hover:border-slate-800">
              <div className={`p-2 rounded-full ${isPositive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                {isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                   <p className="text-sm font-medium text-slate-200">
                     {movement.type === 'IN' ? 'Entrada de Estoque' : movement.type === 'OUT' ? 'Saída por Venda' : 'Ajuste Manual'}
                   </p>
                   <span className="text-xs text-slate-500">{new Date(movement.createdAt).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5 truncate">
                  <span className="text-slate-300 font-semibold">{movement.product.name}</span>
                </p>
                <div className="flex items-center gap-2 mt-2">
                   <Badge variant="outline" className="text-[10px] h-5 border-slate-700 text-slate-400">
                      {movement.user.name.split(' ')[0]}
                   </Badge>
                   <span className={`text-xs font-mono font-bold ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {isPositive ? '+' : '-'}{movement.quantity} uni
                   </span>
                </div>
              </div>
            </div>
           )
        })}
        {movements.length === 0 && <p className="text-slate-500 text-center py-8 text-sm">Nenhuma movimentação</p>}
      </div>
    </div>
  )
}

function KPICardNew({
  title,
  value,
  icon,
  color,
  trend,
  sparklineData,
}: {
  title: string
  value: string
  icon: React.ReactNode
  color: "sky" | "emerald" | "red" | "violet"
  trend: string
  sparklineData: number[]
}) {
  const colorConfig = {
    sky: { iconBg: "bg-sky-500/20", iconColor: "text-sky-400", sparklineColor: "#0ea5e9" },
    emerald: { iconBg: "bg-emerald-500/20", iconColor: "text-emerald-400", sparklineColor: "#10b981" },
    red: { iconBg: "bg-red-500/20", iconColor: "text-red-400", sparklineColor: "#ef4444" },
    violet: { iconBg: "bg-violet-500/20", iconColor: "text-violet-400", sparklineColor: "#8b5cf6" },
  }

  const config = colorConfig[color]
  const sparklineChartData = sparklineData.map((val, idx) => ({ value: val, day: idx + 1 }))

  return (
    <div className="group bg-slate-900/50 border border-slate-800/60 rounded-xl p-6 hover:bg-slate-800/80 hover:border-slate-700/80 transition-all duration-300 relative overflow-hidden backdrop-blur-sm">
      <div className="absolute top-0 right-0 p-4 opacity-50 group-hover:opacity-100 transition-opacity">
         <div className={`p-2 rounded-lg ${config.iconBg} ${config.iconColor}`}>
            {icon}
         </div>
      </div>

      <div className="relative z-10">
        <h3 className="text-sm font-medium text-slate-400">{title}</h3>
        <div className="text-2xl font-bold text-slate-50 mt-2 tracking-tight">{value}</div>
        <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
           <span className="text-emerald-400 font-medium flex items-center">
             <TrendingUp className="w-3 h-3 mr-1" />
             2.5%
           </span> 
           {trend}
        </p>
      </div>

      <div className="h-14 -mx-6 -mb-6 mt-4 opacity-50 group-hover:opacity-80 transition-opacity">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={sparklineChartData}>
            <defs>
              <linearGradient id={`gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={config.sparklineColor} stopOpacity={0.2} />
                <stop offset="100%" stopColor={config.sparklineColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="value"
              stroke={config.sparklineColor}
              strokeWidth={2}
              fill={`url(#gradient-${color})`}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-slate-950 p-6 space-y-8">
      <div className="flex justify-between items-center">
         <div className="flex items-center gap-4">
            <Skeleton className="h-12 w-12 rounded-xl bg-slate-800" />
            <div className="space-y-2">
               <Skeleton className="h-6 w-48 bg-slate-800" />
               <Skeleton className="h-4 w-32 bg-slate-800" />
            </div>
         </div>
         <Skeleton className="h-10 w-32 bg-slate-800" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-40 w-full bg-slate-900/50 rounded-xl border border-slate-800" />
        ))}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <Skeleton className="lg:col-span-2 h-96 bg-slate-900/50 rounded-xl" />
         <Skeleton className="h-96 bg-slate-900/50 rounded-xl" />
      </div>
    </div>
  )
}