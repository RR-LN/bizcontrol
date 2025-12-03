"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import toast, { Toaster } from 'react-hot-toast'

interface Product {
    id: string
    code: string
    name: string
    sellingPrice: number
    stock: number
    availableStock: number
}

interface CartItem extends Product {
    quantity: number
}

type PaymentMethod = 'CASH' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'PIX'

export default function PointOfSalePage() {
    const router = useRouter()

    // Search
    const [searchQuery, setSearchQuery] = useState("")
    const [searchResults, setSearchResults] = useState<Product[]>([])
    const [searching, setSearching] = useState(false)

    // Cart
    const [cart, setCart] = useState<CartItem[]>([])
    const [selectedItem, setSelectedItem] = useState<CartItem | null>(null)
    const [tempQuantity, setTempQuantity] = useState("")

    // Payment
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH')
    const [amountReceived, setAmountReceived] = useState("")

    // Checkout
    const [processing, setProcessing] = useState(false)

    // Debounced search
    const handleSearch = async (query: string) => {
        setSearchQuery(query)

        if (query.trim().length === 0) {
            setSearchResults([])
            return
        }

        setSearching(true)
        try {
            const response = await fetch(`/api/pos/search?query=${encodeURIComponent(query)}`)
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

    const addToCart = (product: Product) => {
        const existingItem = cart.find(item => item.id === product.id)

        if (existingItem) {
            if (existingItem.quantity < product.availableStock) {
                setCart(cart.map(item =>
                    item.id === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                ))
                toast.success(`${product.name} quantidade aumentada`)
            } else {
                toast.error('Estoque insuficiente')
            }
        } else {
            setCart([...cart, { ...product, quantity: 1 }])
            toast.success(`${product.name} adicionado ao carrinho`)
        }

        setSearchQuery("")
        setSearchResults([])
    }

    const updateQuantity = (productId: string, newQuantity: number) => {
        const item = cart.find(i => i.id === productId)
        if (!item) return

        if (newQuantity <= 0) {
            removeFromCart(productId)
            return
        }

        if (newQuantity > item.availableStock) {
            toast.error(`Estoque máximo: ${item.availableStock}`)
            return
        }

        setCart(cart.map(i =>
            i.id === productId
                ? { ...i, quantity: newQuantity }
                : i
        ))
    }

    const removeFromCart = (productId: string) => {
        setCart(cart.filter(item => item.id !== productId))
        if (selectedItem?.id === productId) {
            setSelectedItem(null)
        }
        toast.success('Item removido')
    }

    const handleNumPad = (num: number) => {
        if (!selectedItem) return

        const newTempQty = tempQuantity + String(num)
        const newQty = parseInt(newTempQty)

        if (newQty <= selectedItem.availableStock && newQty <= 9999) {
            setTempQuantity(newTempQty)
        } else if (newQty > selectedItem.availableStock) {
            toast.error(`Estoque máximo: ${selectedItem.availableStock}`)
        }
    }

    const clearQuantity = () => {
        setTempQuantity("")
    }

    const confirmQuantity = () => {
        if (!selectedItem) return

        const newQty = parseInt(tempQuantity) || 1
        updateQuantity(selectedItem.id, newQty)
        setSelectedItem(null)
        setTempQuantity("")
    }

    const calculateTotal = () => {
        return cart.reduce((sum, item) => sum + (item.sellingPrice * item.quantity), 0)
    }

    const calculateChange = () => {
        const total = calculateTotal()
        const received = parseFloat(amountReceived) || 0
        return Math.max(0, received - total)
    }

    const handleCheckout = async () => {
        if (cart.length === 0) {
            toast.error('Carrinho vazio')
            return
        }

        const total = calculateTotal()
        const received = parseFloat(amountReceived) || 0

        if (paymentMethod === 'CASH' && received < total) {
            toast.error('Valor recebido é menor que o total')
            return
        }

        setProcessing(true)

        try {
            const response = await fetch('/api/pos/checkout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    items: cart.map(item => ({
                        productId: item.id,
                        quantity: item.quantity,
                        unitPrice: item.sellingPrice,
                    })),
                    paymentMethod,
                    discount: 0,
                }),
            })

            const data = await response.json()

            if (data.success) {
                toast.success(`Venda ${data.orderNumber} finalizada com sucesso! 🎉`)

                // Clear cart and reset
                setTimeout(() => {
                    setCart([])
                    setSelectedItem(null)
                    setAmountReceived("")
                    setPaymentMethod('CASH')
                }, 1500)
            } else {
                toast.error(data.error || 'Erro ao processar venda')
            }
        } catch (error) {
            toast.error('Erro ao processar venda')
        } finally {
            setProcessing(false)
        }
    }

    const total = calculateTotal()
    const change = calculateChange()

    return (
        <div className="min-h-screen bg-gray-100">
            <Toaster position="top-right" />

            <div className="grid grid-cols-1 lg:grid-cols-3 h-screen">
                {/* LEFT: Search & Cart */}
                <div className="lg:col-span-2 flex flex-col bg-white">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4">
                        <h1 className="text-2xl font-bold">💰 Ponto de Venda</h1>
                    </div>

                    {/* Search */}
                    <div className="p-4 border-b">
                        <div className="relative">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => handleSearch(e.target.value)}
                                placeholder="Buscar produto por código ou nome..."
                                className="w-full px-4 py-3 pr-10 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-lg"
                                autoFocus
                            />
                            {searching && (
                                <div className="absolute right-3 top-3">
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                                </div>
                            )}
                        </div>

                        {/* Search Results */}
                        {searchResults.length > 0 && (
                            <div className="mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                                {searchResults.map((product) => (
                                    <button
                                        key={product.id}
                                        onClick={() => addToCart(product)}
                                        className="w-full px-4 py-3 hover:bg-blue-50 border-b border-gray-100 text-left transition-colors"
                                    >
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <p className="font-semibold text-gray-900">{product.name}</p>
                                                <p className="text-sm text-gray-500">{product.code}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-blue-600">AOA {product.sellingPrice.toLocaleString()}</p>
                                                <p className="text-xs text-gray-500">Estoque: {product.availableStock}</p>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Cart */}
                    <div className="flex-1 overflow-y-auto p-4">
                        {cart.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                <svg className="w-24 h-24 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                </svg>
                                <p className="text-xl">Carrinho vazio</p>
                                <p className="text-sm">Busque produtos para adicionar</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {cart.map((item) => (
                                    <div
                                        key={item.id}
                                        onClick={() => {
                                            setSelectedItem(item)
                                            setTempQuantity("")
                                        }}
                                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${selectedItem?.id === item.id
                                                ? 'border-blue-500 bg-blue-50'
                                                : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <p className="font-semibold text-gray-900">{item.name}</p>
                                                <p className="text-sm text-gray-500">{item.code}</p>
                                            </div>
                                            <div className="flex items-center space-x-4">
                                                <div className="text-center">
                                                    <p className="text-xs text-gray-500">Qtd</p>
                                                    <p className="text-lg font-bold">{item.quantity}</p>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-xs text-gray-500">Preço</p>
                                                    <p className="text-lg font-semibold">AOA {item.sellingPrice.toLocaleString()}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xs text-gray-500">Subtotal</p>
                                                    <p className="text-xl font-bold text-blue-600">
                                                        AOA {(item.sellingPrice * item.quantity).toLocaleString()}
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        removeFromCart(item.id)
                                                    }}
                                                    className="text-red-600 hover:text-red-800 p-2"
                                                >
                                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Total */}
                    <div className="bg-gray-800 text-white p-6">
                        <div className="flex justify-between items-center">
                            <span className="text-2xl font-semibold">TOTAL</span>
                            <span className="text-4xl font-bold">AOA {total.toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                {/* RIGHT: Payment Panel */}
                <div className="bg-gray-50 p-6 flex flex-col space-y-4">
                    {/* Numeric Keypad */}
                    {selectedItem && (
                        <div className="bg-white rounded-lg p-4 border-2 border-blue-500">
                            <p className="text-sm font-semibold text-gray-700 mb-2">{selectedItem.name}</p>

                            {/* Quantity Display */}
                            <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4 mb-4 text-center">
                                <p className="text-xs text-gray-600 mb-1">Quantidade</p>
                                <p className="text-5xl font-bold text-blue-600">
                                    {tempQuantity || selectedItem.quantity}
                                </p>
                                <p className="text-xs text-gray-500 mt-2">
                                    Disponível: {selectedItem.availableStock}
                                </p>
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                                    <button
                                        key={num}
                                        onClick={() => handleNumPad(num)}
                                        className="bg-blue-600 text-white text-2xl font-bold py-4 rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                        {num}
                                    </button>
                                ))}
                                <button
                                    onClick={clearQuantity}
                                    className="bg-red-600 text-white text-xl font-bold py-4 rounded-lg hover:bg-red-700 transition-colors"
                                >
                                    C
                                </button>
                                <button
                                    onClick={() => handleNumPad(0)}
                                    className="bg-blue-600 text-white text-2xl font-bold py-4 rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    0
                                </button>
                                <button
                                    onClick={confirmQuantity}
                                    className="bg-green-600 text-white text-xl font-bold py-4 rounded-lg hover:bg-green-700 transition-colors"
                                >
                                    ✓
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Payment Method */}
                    <div className="bg-white rounded-lg p-4">
                        <p className="text-sm font-semibold text-gray-700 mb-3">Método de Pagamento</p>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={() => setPaymentMethod('CASH')}
                                className={`py-3 rounded-lg font-semibold transition-colors ${paymentMethod === 'CASH'
                                        ? 'bg-green-600 text-white'
                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    }`}
                            >
                                💵 Dinheiro
                            </button>
                            <button
                                onClick={() => setPaymentMethod('CREDIT_CARD')}
                                className={`py-3 rounded-lg font-semibold transition-colors ${paymentMethod === 'CREDIT_CARD'
                                        ? 'bg-green-600 text-white'
                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    }`}
                            >
                                💳 Cartão
                            </button>
                            <button
                                onClick={() => setPaymentMethod('DEBIT_CARD')}
                                className={`py-3 rounded-lg font-semibold transition-colors ${paymentMethod === 'DEBIT_CARD'
                                        ? 'bg-green-600 text-white'
                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    }`}
                            >
                                💳 Débito
                            </button>
                            <button
                                onClick={() => setPaymentMethod('PIX')}
                                className={`py-3 rounded-lg font-semibold transition-colors ${paymentMethod === 'PIX'
                                        ? 'bg-green-600 text-white'
                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    }`}
                            >
                                🔲 PIX
                            </button>
                        </div>
                    </div>

                    {/* Amount Received */}
                    {paymentMethod === 'CASH' && (
                        <div className="bg-white rounded-lg p-4">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Valor Recebido (AOA)
                            </label>
                            <input
                                type="number"
                                value={amountReceived}
                                onChange={(e) => setAmountReceived(e.target.value)}
                                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-2xl font-bold text-right"
                                placeholder="0"
                            />

                            {amountReceived && (
                                <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-700 font-semibold">Troco:</span>
                                        <span className="text-2xl font-bold text-blue-600">
                                            AOA {change.toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Finalize Button */}
                    <button
                        onClick={handleCheckout}
                        disabled={processing || cart.length === 0}
                        className="bg-gradient-to-r from-green-600 to-green-700 text-white py-6 rounded-lg font-bold text-xl hover:from-green-700 hover:to-green-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg"
                    >
                        {processing ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-3 h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
                                FINALIZAR VENDA
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}
