"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface StockMovement {
    id: string
    type: string
    quantity: number
    reason: string | null
    reference: string | null
    createdAt: string
    product: {
        id: string
        code: string
        name: string
        image: string | null
    }
    user: {
        id: string
        name: string
        email: string
        role: string
    }
}

interface PaginationInfo {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNextPage: boolean
    hasPrevPage: boolean
}

export default function StockMovementsPage() {
    const router = useRouter()
    const [user, setUser] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [movements, setMovements] = useState<StockMovement[]>([])
    const [pagination, setPagination] = useState<PaginationInfo | null>(null)

    // Filters
    const [searchQuery, setSearchQuery] = useState("")
    const [typeFilter, setTypeFilter] = useState<string>("ALL")
    const [periodFilter, setPeriodFilter] = useState<number>(30)
    const [currentPage, setCurrentPage] = useState(1)

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const response = await fetch('/api/me')
                if (!response.ok) {
                    router.push('/login')
                    return
                }
                const data = await response.json()
                setUser(data.user)
            } catch (error) {
                router.push('/login')
            } finally {
                setLoading(false)
            }
        }

        checkAuth()
    }, [router])

    useEffect(() => {
        if (user) {
            fetchMovements()
        }
    }, [user, typeFilter, periodFilter, currentPage])

    const fetchMovements = async () => {
        try {
            setLoading(true)

            const params = new URLSearchParams()
            params.append('page', currentPage.toString())

            if (typeFilter !== 'ALL') {
                params.append('type', typeFilter)
            }

            const response = await fetch(`/api/stock/movements?${params.toString()}`)
            const data = await response.json()

            if (data.success) {
                setMovements(data.data)
                setPagination(data.pagination)
            }
        } catch (error) {
            console.error('Error fetching movements:', error)
        } finally {
            setLoading(false)
        }
    }

    const getTypeInfo = (type: string) => {
        switch (type) {
            case 'IN':
                return {
                    label: 'Entrada',
                    className: 'bg-green-100 text-green-800 border-green-300',
                    icon: '📥',
                    color: 'text-green-600'
                }
            case 'OUT':
                return {
                    label: 'Saída',
                    className: 'bg-red-100 text-red-800 border-red-300',
                    icon: '📤',
                    color: 'text-red-600'
                }
            case 'ADJUSTMENT':
                return {
                    label: 'Ajuste',
                    className: 'bg-yellow-100 text-yellow-800 border-yellow-300',
                    icon: '⚙️',
                    color: 'text-yellow-600'
                }
            case 'TRANSFER':
                return {
                    label: 'Transferência',
                    className: 'bg-blue-100 text-blue-800 border-blue-300',
                    icon: '🔄',
                    color: 'text-blue-600'
                }
            default:
                return {
                    label: type,
                    className: 'bg-gray-100 text-gray-800 border-gray-300',
                    icon: '📦',
                    color: 'text-gray-600'
                }
        }
    }

    const formatDateTime = (date: string) => {
        const d = new Date(date)
        return {
            date: d.toLocaleDateString('pt-BR'),
            time: d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        }
    }

    // Filter movements by search query (client-side)
    const filteredMovements = movements.filter(movement =>
        movement.product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        movement.product.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        movement.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        movement.user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (movement.reason && movement.reason.toLowerCase().includes(searchQuery.toLowerCase()))
    )

    if (loading && !user) {
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
                                <h1 className="text-2xl font-bold text-gray-900">📋 Movimentações de Estoque</h1>
                                <p className="text-sm text-gray-600">Histórico completo de entradas e saídas</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3">
                            <div className="text-sm text-gray-600">
                                {user?.role === 'OPERATOR' && '👤 Suas movimentações'}
                                {user?.role === 'MANAGER' && '🏪 Movimentações da loja'}
                                {user?.role === 'ADMIN' && '👁️ Todas as movimentações'}
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-4 text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-green-100 text-sm">Entradas</p>
                                <p className="text-2xl font-bold">
                                    {movements.filter(m => m.type === 'IN').length}
                                </p>
                            </div>
                            <span className="text-4xl">📥</span>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg p-4 text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-red-100 text-sm">Saídas</p>
                                <p className="text-2xl font-bold">
                                    {movements.filter(m => m.type === 'OUT').length}
                                </p>
                            </div>
                            <span className="text-4xl">📤</span>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg p-4 text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-yellow-100 text-sm">Ajustes</p>
                                <p className="text-2xl font-bold">
                                    {movements.filter(m => m.type === 'ADJUSTMENT').length}
                                </p>
                            </div>
                            <span className="text-4xl">⚙️</span>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-4 text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-blue-100 text-sm">Total</p>
                                <p className="text-2xl font-bold">{pagination?.total || 0}</p>
                            </div>
                            <span className="text-4xl">📦</span>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Search */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Buscar</label>
                            <div className="relative">
                                <svg className="absolute left-3 top-3 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <input
                                    type="text"
                                    placeholder="Produto, usuário ou motivo..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        {/* Type Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Tipo</label>
                            <select
                                value={typeFilter}
                                onChange={(e) => {
                                    setTypeFilter(e.target.value)
                                    setCurrentPage(1)
                                }}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="ALL">Todos</option>
                                <option value="IN">📥 Entrada</option>
                                <option value="OUT">📤 Saída</option>
                                <option value="ADJUSTMENT">⚙️ Ajuste</option>
                                <option value="TRANSFER">🔄 Transferência</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                        Data/Hora
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                        Produto
                                    </th>
                                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                        Tipo
                                    </th>
                                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                        Quantidade
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                        Usuário
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                        Motivo
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center">
                                            <div className="flex justify-center">
                                                <svg className="animate-spin h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredMovements.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center">
                                            <div className="flex flex-col items-center text-gray-500">
                                                <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                                </svg>
                                                <p className="text-lg font-semibold">Nenhuma movimentação encontrada</p>
                                                <p className="text-sm mt-1">
                                                    {searchQuery ? 'Tente ajustar sua busca' : 'Não há movimentações nos últimos 30 dias'}
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredMovements.map((movement) => {
                                        const typeInfo = getTypeInfo(movement.type)
                                        const dateTime = formatDateTime(movement.createdAt)

                                        return (
                                            <tr key={movement.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm">
                                                        <p className="font-semibold text-gray-900">{dateTime.date}</p>
                                                        <p className="text-gray-500">{dateTime.time}</p>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center">
                                                        {movement.product.image ? (
                                                            <img src={movement.product.image} alt={movement.product.name} className="w-10 h-10 rounded-lg object-cover mr-3" />
                                                        ) : (
                                                            <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center mr-3">
                                                                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                                                </svg>
                                                            </div>
                                                        )}
                                                        <div>
                                                            <p className="font-semibold text-gray-900">{movement.product.name}</p>
                                                            <p className="text-sm text-gray-500 font-mono">{movement.product.code}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold border ${typeInfo.className}`}>
                                                        {typeInfo.icon} {typeInfo.label}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`text-2xl font-bold ${typeInfo.color}`}>
                                                        {movement.type === 'OUT' ? '-' : '+'}{movement.quantity}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div>
                                                        <p className="font-medium text-gray-900">{movement.user.name}</p>
                                                        <p className="text-sm text-gray-500">{movement.user.email}</p>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="text-sm text-gray-900">{movement.reason || '-'}</p>
                                                    {movement.reference && (
                                                        <p className="text-xs text-gray-500 font-mono mt-1">Ref: {movement.reference}</p>
                                                    )}
                                                </td>
                                            </tr>
                                        )
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {pagination && pagination.totalPages > 1 && (
                        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                            <div className="flex items-center justify-between">
                                <div className="text-sm text-gray-700">
                                    Mostrando <span className="font-semibold">{((currentPage - 1) * pagination.limit) + 1}</span> até{' '}
                                    <span className="font-semibold">{Math.min(currentPage * pagination.limit, pagination.total)}</span> de{' '}
                                    <span className="font-semibold">{pagination.total}</span> movimentações
                                </div>
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => setCurrentPage(p => p - 1)}
                                        disabled={!pagination.hasPrevPage}
                                        className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Anterior
                                    </button>
                                    <button
                                        onClick={() => setCurrentPage(p => p + 1)}
                                        disabled={!pagination.hasNextPage}
                                        className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Próximo
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
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
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="bg-white rounded-lg p-4">
                            <div className="h-20 bg-gray-200 rounded animate-pulse"></div>
                        </div>
                    ))}
                </div>
                <div className="bg-white rounded-xl p-6">
                    <div className="h-96 bg-gray-200 rounded animate-pulse"></div>
                </div>
            </main>
        </div>
    )
}
