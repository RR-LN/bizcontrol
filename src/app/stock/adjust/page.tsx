"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import toast, { Toaster } from "react-hot-toast"

interface Product {
    id: string
    code: string
    name: string
    image: string | null
    availableStock: number
}

export default function StockAdjustPage() {
    const router = useRouter()
    const [user, setUser] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    // Product search
    const [searchQuery, setSearchQuery] = useState("")
    const [searchResults, setSearchResults] = useState<Product[]>([])
    const [searching, setSearching] = useState(false)

    // Selected product and adjustment
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
    const [newQuantity, setNewQuantity] = useState<string>("")
    const [reason, setReason] = useState("")
    const [submitting, setSubmitting] = useState(false)

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
                    toast.error('Acesso negado. Apenas Admin e Manager podem ajustar estoque.')
                    router.push('/dashboard')
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

    // Debounced search
    useEffect(() => {
        const delaySearch = setTimeout(() => {
            if (searchQuery.trim().length > 0) {
                searchProducts()
            } else {
                setSearchResults([])
            }
        }, 300)

        return () => clearTimeout(delaySearch)
    }, [searchQuery])

    const searchProducts = async () => {
        setSearching(true)
        try {
            const response = await fetch(`/api/pos/search?query=${encodeURIComponent(searchQuery)}`)
            const data = await response.json()

            if (data.success) {
                setSearchResults(data.data)
            }
        } catch (error) {
            console.error('Search error:', error)
        } finally {
            setSearching(false)
        }
    }

    const selectProduct = (product: Product) => {
        setSelectedProduct(product)
        setNewQuantity(product.availableStock.toString())
        setSearchQuery("")
        setSearchResults([])
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!selectedProduct) {
            toast.error('Selecione um produto')
            return
        }

        if (!newQuantity || isNaN(parseInt(newQuantity))) {
            toast.error('Digite uma quantidade válida')
            return
        }

        if (!reason.trim()) {
            toast.error('Digite o motivo do ajuste')
            return
        }

        const qty = parseInt(newQuantity)
        if (qty < 0) {
            toast.error('Quantidade não pode ser negativa')
            return
        }

        if (qty === selectedProduct.availableStock) {
            toast.error('A nova quantidade é igual à atual')
            return
        }

        setSubmitting(true)

        try {
            const response = await fetch('/api/stock/adjust', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    productId: selectedProduct.id,
                    newQuantity: qty,
                    reason: reason.trim(),
                }),
            })

            const data = await response.json()

            if (data.success) {
                toast.success(`Estoque de ${selectedProduct.name} ajustado com sucesso!`)

                // Reset form
                setTimeout(() => {
                    setSelectedProduct(null)
                    setNewQuantity("")
                    setReason("")
                }, 1500)
            } else {
                toast.error(data.error || 'Erro ao ajustar estoque')
            }
        } catch (error) {
            toast.error('Erro ao ajustar estoque')
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) {
        return <LoadingSkeleton />
    }

    const difference = selectedProduct && newQuantity
        ? parseInt(newQuantity) - selectedProduct.availableStock
        : 0

    return (
        <div className="min-h-screen bg-gray-50">
            <Toaster position="top-right" />

            {/* Header */}
            <header className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center space-x-4">
                        <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">⚙️ Ajuste de Estoque</h1>
                            <p className="text-sm text-gray-600">Corrija quantidades no inventário</p>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Warning Alert */}
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-yellow-700 font-semibold">
                                ⚠️ Atenção: Esta ação irá modificar o estoque permanentemente
                            </p>
                            <p className="text-xs text-yellow-600 mt-1">
                                Certifique-se de que a nova quantidade está correta antes de confirmar.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    {/* Product Search */}
                    <div className="mb-6">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            1. Selecione o Produto
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Buscar por código ou nome do produto..."
                                className="w-full px-4 py-3 pr-10 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-lg"
                                disabled={!!selectedProduct}
                            />
                            {searching && (
                                <div className="absolute right-3 top-3">
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                                </div>
                            )}
                        </div>

                        {/* Search Results */}
                        {searchResults.length > 0 && !selectedProduct && (
                            <div className="mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                                {searchResults.map((product) => (
                                    <button
                                        key={product.id}
                                        type="button"
                                        onClick={() => selectProduct(product)}
                                        className="w-full px-4 py-3 hover:bg-blue-50 border-b border-gray-100 text-left transition-colors"
                                    >
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center">
                                                {product.image ? (
                                                    <img src={product.image} alt={product.name} className="w-12 h-12 rounded-lg object-cover mr-3" />
                                                ) : (
                                                    <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center mr-3">
                                                        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                                        </svg>
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="font-semibold text-gray-900">{product.name}</p>
                                                    <p className="text-sm text-gray-500">{product.code}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs text-gray-500">Estoque Atual</p>
                                                <p className="text-lg font-bold text-blue-600">{product.availableStock}</p>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Selected Product */}
                        {selectedProduct && (
                            <div className="mt-4 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        {selectedProduct.image ? (
                                            <img src={selectedProduct.image} alt={selectedProduct.name} className="w-16 h-16 rounded-lg object-cover mr-4" />
                                        ) : (
                                            <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center mr-4">
                                                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                                </svg>
                                            </div>
                                        )}
                                        <div>
                                            <p className="font-bold text-gray-900 text-lg">{selectedProduct.name}</p>
                                            <p className="text-sm text-gray-600">{selectedProduct.code}</p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSelectedProduct(null)
                                            setNewQuantity("")
                                        }}
                                        className="text-red-600 hover:text-red-800"
                                    >
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {selectedProduct && (
                        <>
                            {/* Stock Info */}
                            <div className="mb-6 grid grid-cols-3 gap-4">
                                <div className="bg-gray-50 p-4 rounded-lg text-center">
                                    <p className="text-xs text-gray-600 mb-1">Estoque Atual</p>
                                    <p className="text-3xl font-bold text-gray-900">{selectedProduct.availableStock}</p>
                                </div>
                                <div className="bg-blue-50 p-4 rounded-lg text-center">
                                    <p className="text-xs text-blue-600 mb-1">Nova Quantidade</p>
                                    <p className="text-3xl font-bold text-blue-600">{newQuantity || '0'}</p>
                                </div>
                                <div className={`p-4 rounded-lg text-center ${difference > 0 ? 'bg-green-50' : difference < 0 ? 'bg-red-50' : 'bg-gray-50'
                                    }`}>
                                    <p className="text-xs text-gray-600 mb-1">Diferença</p>
                                    <p className={`text-3xl font-bold ${difference > 0 ? 'text-green-600' : difference < 0 ? 'text-red-600' : 'text-gray-900'
                                        }`}>
                                        {difference > 0 ? '+' : ''}{difference}
                                    </p>
                                </div>
                            </div>

                            {/* New Quantity */}
                            <div className="mb-6">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    2. Nova Quantidade
                                </label>
                                <input
                                    type="number"
                                    value={newQuantity}
                                    onChange={(e) => setNewQuantity(e.target.value)}
                                    min="0"
                                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-2xl font-bold text-center"
                                    placeholder="0"
                                    required
                                />
                            </div>

                            {/* Reason */}
                            <div className="mb-6">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    3. Motivo do Ajuste
                                </label>
                                <textarea
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    rows={4}
                                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none resize-none"
                                    placeholder="Ex: Inventário físico, produto danificado, erro de sistema, etc."
                                    required
                                />
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={submitting || !selectedProduct || !newQuantity || !reason.trim()}
                                className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-bold text-lg hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg"
                            >
                                {submitting ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-3 h-6 w-6 text-white" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Processando...
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Confirmar Ajuste
                                    </>
                                )}
                            </button>
                        </>
                    )}
                </form>

                {/* Info */}
                <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start">
                        <svg className="w-6 h-6 text-blue-600 mr-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        <div className="flex-1">
                            <p className="text-sm font-semibold text-blue-900">Sobre Ajustes de Estoque</p>
                            <ul className="text-sm text-blue-700 mt-2 space-y-1 list-disc list-inside">
                                <li>Ajustes são registrados no histórico de movimentações</li>
                                <li>O motivo é obrigatório para auditoria</li>
                                <li>Apenas Admin e Manager podem fazer ajustes</li>
                                <li>A ação é irreversível, confira os dados antes de confirmar</li>
                            </ul>
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
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="h-8 bg-gray-200 rounded animate-pulse w-64"></div>
                </div>
            </header>
            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white rounded-xl p-6">
                    <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
                </div>
            </main>
        </div>
    )
}
