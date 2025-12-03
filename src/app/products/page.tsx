"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

interface Product {
    id: string
    code: string
    name: string
    image: string | null
    sellingPrice: number
    stocks: Array<{
        quantity: number
        reserved: number
    }>
    category: {
        name: string
    } | null
    supplier: {
        name: string
    } | null
}

export default function ProductsPage() {
    const router = useRouter()
    const [products, setProducts] = useState<Product[]>([])
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [sortByStock, setSortByStock] = useState(false)

    useEffect(() => {
        fetchProducts()
    }, [])

    useEffect(() => {
        filterAndSortProducts()
    }, [searchTerm, sortByStock, products])

    const fetchProducts = async () => {
        try {
            const response = await fetch('/api/products')
            const data = await response.json()

            if (data.success) {
                setProducts(data.data)
                setFilteredProducts(data.data)
            }
        } catch (error) {
            console.error('Error fetching products:', error)
        } finally {
            setLoading(false)
        }
    }

    const filterAndSortProducts = () => {
        let filtered = products

        // Filter by search term
        if (searchTerm) {
            filtered = products.filter(product =>
                product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                product.code.toLowerCase().includes(searchTerm.toLowerCase())
            )
        }

        // Sort by stock if enabled
        if (sortByStock) {
            filtered = [...filtered].sort((a, b) => {
                const stockA = a.stocks.reduce((sum, s) => sum + s.quantity, 0)
                const stockB = b.stocks.reduce((sum, s) => sum + s.quantity, 0)
                return stockA - stockB // Low stock first
            })
        }

        setFilteredProducts(filtered)
    }

    const getTotalStock = (stocks: Array<{ quantity: number }>) => {
        return stocks.reduce((sum, stock) => sum + stock.quantity, 0)
    }

    const getStockBadgeColor = (stock: number, product: Product) => {
        // Assuming minStockLevel is available or use default of 10
        if (stock === 0) return 'bg-red-100 text-red-700 border-red-300'
        if (stock <= 10) return 'bg-yellow-100 text-yellow-700 border-yellow-300'
        return 'bg-green-100 text-green-700 border-green-300'
    }

    if (loading) {
        return <ProductsPageSkeleton />
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Produtos</h1>
                            <p className="text-sm text-gray-600 mt-1">Gerenciar catálogo de produtos</p>
                        </div>
                        <button
                            onClick={() => router.push('/products/new')}
                            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all font-semibold shadow-md flex items-center"
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Novo Produto
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Filters */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
                    <div className="flex flex-col md:flex-row gap-4 items-center">
                        {/* Search */}
                        <div className="flex-1 relative w-full">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Buscar por nome ou código..."
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        {/* Sort Toggle */}
                        <button
                            onClick={() => setSortByStock(!sortByStock)}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center whitespace-nowrap ${sortByStock
                                    ? 'bg-blue-100 text-blue-700 border border-blue-300'
                                    : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                                }`}
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                            </svg>
                            {sortByStock ? 'Ordenado: Estoque Baixo' : 'Ordenar por Estoque'}
                        </button>

                        {/* Results Count */}
                        <div className="text-sm text-gray-600 whitespace-nowrap">
                            {filteredProducts.length} produto(s)
                        </div>
                    </div>
                </div>

                {/* Products Table */}
                {filteredProducts.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                        <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                        </svg>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            {searchTerm ? 'Nenhum produto encontrado' : 'Nenhum produto cadastrado'}
                        </h3>
                        <p className="text-gray-600 mb-4">
                            {searchTerm ? 'Tente buscar com outros termos' : 'Comece adicionando seu primeiro produto'}
                        </p>
                        {!searchTerm && (
                            <button
                                onClick={() => router.push('/products/new')}
                                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                            >
                                Adicionar Primeiro Produto
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Imagem
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Código
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Nome
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Categoria
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Preço
                                        </th>
                                        <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Estoque
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Ações
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredProducts.map((product) => {
                                        const totalStock = getTotalStock(product.stocks)
                                        return (
                                            <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                                                {/* Image */}
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {product.image ? (
                                                        <img
                                                            src={product.image}
                                                            alt={product.name}
                                                            className="w-12 h-12 object-cover rounded-lg border border-gray-200"
                                                        />
                                                    ) : (
                                                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200">
                                                            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                            </svg>
                                                        </div>
                                                    )}
                                                </td>

                                                {/* Code */}
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="text-sm font-mono font-semibold text-gray-900">
                                                        {product.code}
                                                    </span>
                                                </td>

                                                {/* Name */}
                                                <td className="px-6 py-4">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {product.name}
                                                    </div>
                                                </td>

                                                {/* Category */}
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {product.category ? (
                                                        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                                                            {product.category.name}
                                                        </span>
                                                    ) : (
                                                        <span className="text-sm text-gray-400">-</span>
                                                    )}
                                                </td>

                                                {/* Price */}
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    <span className="text-sm font-semibold text-gray-900">
                                                        AOA {Number(product.sellingPrice).toLocaleString()}
                                                    </span>
                                                </td>

                                                {/* Stock */}
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    <span className={`px-3 py-1 text-sm font-semibold rounded-full border ${getStockBadgeColor(totalStock, product)}`}>
                                                        {totalStock}
                                                    </span>
                                                </td>

                                                {/* Actions */}
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    <button
                                                        onClick={() => alert('Edição em desenvolvimento')}
                                                        className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                                                    >
                                                        Editar
                                                    </button>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </main>
        </div>
    )
}

function ProductsPageSkeleton() {
    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="h-8 bg-gray-200 rounded animate-pulse w-64"></div>
                </div>
            </header>
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12">
                    <div className="space-y-4">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    )
}
