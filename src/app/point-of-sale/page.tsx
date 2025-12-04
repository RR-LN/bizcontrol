"use client"

import { useState, useEffect, useCallback } from "react"
import { Search, Plus, Minus, Trash2, ShoppingCart, Info, UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { toast } from "sonner"
import { useDebounce } from "@/hooks/useDebounce"

interface Product {
    id: string
    code: string
    name: string
    image?: string | null
    sellingPrice: number
    costPrice?: number
    stock: number
    availableStock: number
}

interface CartItem extends Product {
    quantity: number
}

type PaymentMethod = 'CASH' | 'M_PESA' | 'MULTICAIXA' | 'BANK_TRANSFER'

interface User {
    id: string
    role: 'ADMIN' | 'MANAGER' | 'OPERATOR' | 'VIEWER'
}

export default function PointOfSalePage() {
    // User state
    const [user, setUser] = useState<User | null>(null)
    const [loadingUser, setLoadingUser] = useState(true)

    // Search & Products
    const [searchQuery, setSearchQuery] = useState("")
    const [products, setProducts] = useState<Product[]>([])
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
    const [loadingProducts, setLoadingProducts] = useState(false)

    // Cart
    const [cart, setCart] = useState<CartItem[]>([])

    // Payment
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null)
    const [showPaymentPopover, setShowPaymentPopover] = useState(false)

    // Customer
    const [customerId, setCustomerId] = useState<string | null>(null)

    // Debounced search
    const debouncedSearch = useDebounce(searchQuery, 300)

    // Fetch user info
    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await fetch('/api/me')
                const data = await response.json()
                if (data.success) {
                    setUser(data.user)
                }
            } catch (error) {
                console.error('Error fetching user:', error)
            } finally {
                setLoadingUser(false)
            }
        }
        fetchUser()
    }, [])

    // Fetch all products on mount
    useEffect(() => {
        const fetchProducts = async () => {
            setLoadingProducts(true)
            try {
                const response = await fetch('/api/products')
                const data = await response.json()
                if (data.success) {
                    const productsWithStock = data.data.map((product: any) => {
                        const totalStock = product.stocks?.reduce((sum: number, stock: any) => sum + stock.quantity, 0) || 0
                        const totalReserved = product.stocks?.reduce((sum: number, stock: any) => sum + stock.reserved, 0) || 0
                        const availableStock = totalStock - totalReserved

                        return {
                            id: product.id,
                            code: product.code,
                            name: product.name,
                            image: product.image,
                            sellingPrice: Number(product.sellingPrice),
                            costPrice: Number(product.costPrice || 0),
                            stock: totalStock,
                            availableStock,
                        }
                    })
                    setProducts(productsWithStock)
                    setFilteredProducts(productsWithStock)
                }
            } catch (error) {
                console.error('Error fetching products:', error)
                toast.error('Erro ao carregar produtos')
            } finally {
                setLoadingProducts(false)
            }
        }
        fetchProducts()
    }, [])

    // Filter products based on search
    useEffect(() => {
        if (!debouncedSearch.trim()) {
            setFilteredProducts(products)
            return
        }

        const searchTerm = debouncedSearch.toLowerCase()
        const filtered = products.filter(product =>
            product.name.toLowerCase().includes(searchTerm) ||
            product.code.toLowerCase().includes(searchTerm)
        )
        setFilteredProducts(filtered)
    }, [debouncedSearch, products])

    // Add product to cart
    const addToCart = useCallback((product: Product) => {
        if (product.availableStock <= 0) {
            toast.error('Produto sem estoque disponível')
            return
        }

        setCart(prevCart => {
            const existingItem = prevCart.find(item => item.id === product.id)
            if (existingItem) {
                if (existingItem.quantity >= product.availableStock) {
                    toast.error('Estoque insuficiente')
                    return prevCart
                }
                return prevCart.map(item =>
                    item.id === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                )
            }
            return [...prevCart, { ...product, quantity: 1 }]
        })
        toast.success(`${product.name} adicionado ao carrinho`)
    }, [])

    // Update quantity
    const updateQuantity = useCallback((productId: string, delta: number) => {
        setCart(prevCart => {
            const item = prevCart.find(i => i.id === productId)
            if (!item) return prevCart

            const newQuantity = item.quantity + delta
            if (newQuantity <= 0) {
                return prevCart.filter(i => i.id !== productId)
            }
            if (newQuantity > item.availableStock) {
                toast.error(`Estoque máximo: ${item.availableStock}`)
                return prevCart
            }

            return prevCart.map(i =>
                i.id === productId
                    ? { ...i, quantity: newQuantity }
                    : i
            )
        })
    }, [])

    // Remove from cart
    const removeFromCart = useCallback((productId: string) => {
        setCart(prevCart => prevCart.filter(item => item.id !== productId))
        toast.success('Item removido do carrinho')
    }, [])

    // Calculate totals
    const subtotal = cart.reduce((sum, item) => sum + (item.sellingPrice * item.quantity), 0)
    const total = subtotal

    // Calculate profit (for admin only)
    const profit = cart.reduce((sum, item) => {
        const itemProfit = (item.sellingPrice - (item.costPrice || 0)) * item.quantity
        return sum + itemProfit
    }, 0)

    // Handle checkout
    const handleCheckout = async (selectedPaymentMethod: PaymentMethod) => {
        if (cart.length === 0) {
            toast.error('Carrinho vazio')
            return
        }

        try {
            // Map payment method to API format
            const apiPaymentMethod = selectedPaymentMethod === 'M_PESA' ? 'DIGITAL_WALLET' :
                selectedPaymentMethod === 'MULTICAIXA' ? 'DEBIT_CARD' :
                selectedPaymentMethod === 'BANK_TRANSFER' ? 'BANK_TRANSFER' :
                'CASH'

            const response = await fetch('/api/pos/checkout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    customerId: customerId || null,
                    items: cart.map(item => ({
                        productId: item.id,
                        quantity: item.quantity,
                        unitPrice: item.sellingPrice,
                    })),
                    paymentMethod: apiPaymentMethod,
                    discount: 0,
                }),
            })

            const data = await response.json()

            if (data.success) {
                toast.success(`Venda ${data.orderNumber} finalizada com sucesso! 🎉`)
                
                // Clear cart and reset
                setCart([])
                setPaymentMethod(selectedPaymentMethod)
                setCustomerId(null)
                setSearchQuery("")
                setShowPaymentPopover(false)

                // Refresh products to update stock
                const productsResponse = await fetch('/api/products')
                const productsData = await productsResponse.json()
                if (productsData.success) {
                    const productsWithStock = productsData.data.map((product: any) => {
                        const totalStock = product.stocks?.reduce((sum: number, stock: any) => sum + stock.quantity, 0) || 0
                        const totalReserved = product.stocks?.reduce((sum: number, stock: any) => sum + stock.reserved, 0) || 0
                        const availableStock = totalStock - totalReserved

                        return {
                            id: product.id,
                            code: product.code,
                            name: product.name,
                            image: product.image,
                            sellingPrice: Number(product.sellingPrice),
                            costPrice: Number(product.costPrice || 0),
                            stock: totalStock,
                            availableStock,
                        }
                    })
                    setProducts(productsWithStock)
                    setFilteredProducts(productsWithStock)
                }
            } else {
                toast.error(data.error || 'Erro ao processar venda')
            }
        } catch (error) {
            console.error('Checkout error:', error)
            toast.error('Erro ao processar venda')
        }
    }

    // Get product initial for placeholder
    const getProductInitial = (name: string) => {
        return name.charAt(0).toUpperCase()
    }

    // Get stock badge color
    const getStockBadgeColor = (stock: number) => {
        if (stock === 0) return "bg-red-500/20 text-red-400"
        if (stock < 10) return "bg-orange-500/20 text-orange-400"
        return "bg-green-500/20 text-green-400"
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="grid grid-cols-1 lg:grid-cols-3 h-screen overflow-hidden">
                {/* LEFT PANEL: Product Selection (2/3 width) */}
                <div className="lg:col-span-2 flex flex-col bg-white overflow-hidden">
                    {/* Search Bar */}
                    <div className="p-4 border-b bg-white sticky top-0 z-10">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <Input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Buscar por nome ou código de barras..."
                                className="pl-10 h-12 text-lg"
                                autoFocus
                            />
                        </div>
                    </div>

                    {/* Product Grid */}
                    <div className="flex-1 overflow-y-auto p-4">
                        {loadingProducts ? (
                            <div className="flex items-center justify-center h-full">
                                <div className="text-gray-400">Carregando produtos...</div>
                            </div>
                        ) : filteredProducts.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                <ShoppingCart className="w-16 h-16 mb-4" />
                                <p className="text-lg">Nenhum produto encontrado</p>
                                <p className="text-sm">Tente buscar por nome ou código</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {filteredProducts.map((product) => (
                                    <button
                                        key={product.id}
                                        onClick={() => addToCart(product)}
                                        disabled={product.availableStock <= 0}
                                        className="group relative bg-white border-2 border-gray-200 rounded-md overflow-hidden hover:ring-2 hover:ring-sky-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {/* Product Image */}
                                        <div className="w-full h-24 bg-gray-100 relative overflow-hidden">
                                            {product.image ? (
                                                <img
                                                    src={product.image}
                                                    alt={product.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-sky-100 to-sky-200">
                                                    <span className="text-2xl font-bold text-sky-600">
                                                        {getProductInitial(product.name)}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Product Info */}
                                        <div className="p-3">
                                            <h3 className="font-semibold text-sm text-gray-900 line-clamp-2 mb-1">
                                                {product.name}
                                            </h3>
                                            <p className="font-bold text-lg text-sky-600 mb-2">
                                                AOA {product.sellingPrice.toLocaleString('pt-AO')}
                                            </p>
                                            <Badge
                                                variant="outline"
                                                className={`text-xs ${getStockBadgeColor(product.availableStock)}`}
                                            >
                                                Estoque: {product.availableStock}
                                            </Badge>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT PANEL: Cart & Checkout (1/3 width) */}
                <div className="lg:sticky lg:top-0 lg:h-screen bg-gray-50 border-l flex flex-col overflow-hidden">
                    <div className="flex-1 flex flex-col overflow-hidden">
                        {/* Cart Header */}
                        <div className="p-4 border-b bg-white">
                            <h2 className="text-xl font-bold text-gray-900">Carrinho de Compras</h2>
                        </div>

                        {/* Customer Selection */}
                        <div className="px-4 pt-4">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    // TODO: Implement customer selection dialog
                                    toast.info('Seleção de cliente em desenvolvimento')
                                }}
                                className="w-full justify-start"
                            >
                                <UserPlus className="w-4 h-4 mr-2" />
                                + Adicionar Cliente
                            </Button>
                        </div>

                        {/* Cart Items List */}
                        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
                            {cart.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                    <ShoppingCart className="w-16 h-16 mb-4" />
                                    <p className="text-sm">Carrinho vazio</p>
                                </div>
                            ) : (
                                cart.map((item) => (
                                    <Card key={item.id} className="overflow-hidden">
                                        <CardContent className="p-3">
                                            <div className="flex gap-3">
                                                {/* Thumbnail */}
                                                <div className="w-16 h-16 bg-gray-100 rounded-md flex-shrink-0 overflow-hidden">
                                                    {item.image ? (
                                                        <img
                                                            src={item.image}
                                                            alt={item.name}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-sky-100 to-sky-200">
                                                            <span className="text-lg font-bold text-sky-600">
                                                                {getProductInitial(item.name)}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Item Info */}
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-semibold text-sm text-gray-900 truncate mb-1">
                                                        {item.name}
                                                    </h4>
                                                    <p className="text-xs text-gray-500 mb-2">
                                                        AOA {item.sellingPrice.toLocaleString('pt-AO')} cada
                                                    </p>

                                                    {/* Quantity Controls */}
                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            className="h-7 w-7"
                                                            onClick={() => updateQuantity(item.id, -1)}
                                                        >
                                                            <Minus className="w-3 h-3" />
                                                        </Button>
                                                        <span className="text-sm font-semibold w-8 text-center">
                                                            {item.quantity}
                                                        </span>
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            className="h-7 w-7"
                                                            onClick={() => updateQuantity(item.id, 1)}
                                                            disabled={item.quantity >= item.availableStock}
                                                        >
                                                            <Plus className="w-3 h-3" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-7 w-7 ml-auto text-red-500 hover:text-red-700"
                                                            onClick={() => removeFromCart(item.id)}
                                                        >
                                                            <Trash2 className="w-3 h-3" />
                                                        </Button>
                                                    </div>

                                                    {/* Subtotal */}
                                                    <p className="text-xs text-gray-600 mt-1">
                                                        Subtotal: AOA {(item.sellingPrice * item.quantity).toLocaleString('pt-AO')}
                                                    </p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))
                            )}
                        </div>

                        {/* Order Summary */}
                        <div className="border-t bg-white p-4 space-y-4">
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base">Resumo do Pedido</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    <div className="flex justify-between text-sm text-gray-600">
                                        <span>Subtotal:</span>
                                        <span>AOA {subtotal.toLocaleString('pt-AO')}</span>
                                    </div>
                                    <div className="flex justify-between items-center pt-2 border-t">
                                        <span className="text-lg font-semibold">Total:</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-2xl font-bold text-gray-900">
                                                AOA {total.toLocaleString('pt-AO')}
                                            </span>
                                            {/* Admin Profit Tooltip */}
                                            {user?.role === 'ADMIN' && profit > 0 && (
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <button className="text-sky-600 hover:text-sky-700">
                                                            <Info className="w-4 h-4" />
                                                        </button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Lucro nesta venda: AOA {profit.toLocaleString('pt-AO')}</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Checkout Button */}
                            <Popover open={showPaymentPopover} onOpenChange={setShowPaymentPopover}>
                                <PopoverTrigger asChild>
                                    <Button
                                        size="lg"
                                        className="w-full bg-sky-600 hover:bg-sky-700 text-white text-lg font-semibold h-14"
                                        disabled={cart.length === 0}
                                    >
                                        Pagar AOA {total.toLocaleString('pt-AO')}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-80 p-4" align="end">
                                    <div className="space-y-3">
                                        <h3 className="font-semibold text-lg mb-4">Selecione o Método de Pagamento</h3>
                                        <div className="grid grid-cols-2 gap-3">
                                            <Button
                                                variant={paymentMethod === 'M_PESA' ? 'default' : 'outline'}
                                                className={`h-16 ${paymentMethod === 'M_PESA' ? 'bg-sky-600 hover:bg-sky-700' : ''}`}
                                                onClick={() => {
                                                    setPaymentMethod('M_PESA')
                                                    setShowPaymentPopover(false)
                                                    handleCheckout('M_PESA')
                                                }}
                                            >
                                                M-Pesa
                                            </Button>
                                            <Button
                                                variant={paymentMethod === 'MULTICAIXA' ? 'default' : 'outline'}
                                                className={`h-16 ${paymentMethod === 'MULTICAIXA' ? 'bg-sky-600 hover:bg-sky-700' : ''}`}
                                                onClick={() => {
                                                    setPaymentMethod('MULTICAIXA')
                                                    setShowPaymentPopover(false)
                                                    handleCheckout('MULTICAIXA')
                                                }}
                                            >
                                                Multicaixa
                                            </Button>
                                            <Button
                                                variant={paymentMethod === 'CASH' ? 'default' : 'outline'}
                                                className={`h-16 ${paymentMethod === 'CASH' ? 'bg-sky-600 hover:bg-sky-700' : ''}`}
                                                onClick={() => {
                                                    setPaymentMethod('CASH')
                                                    setShowPaymentPopover(false)
                                                    handleCheckout('CASH')
                                                }}
                                            >
                                                Dinheiro
                                            </Button>
                                            <Button
                                                variant={paymentMethod === 'BANK_TRANSFER' ? 'default' : 'outline'}
                                                className={`h-16 ${paymentMethod === 'BANK_TRANSFER' ? 'bg-sky-600 hover:bg-sky-700' : ''}`}
                                                onClick={() => {
                                                    setPaymentMethod('BANK_TRANSFER')
                                                    setShowPaymentPopover(false)
                                                    handleCheckout('BANK_TRANSFER')
                                                }}
                                            >
                                                Transferência
                                            </Button>
                                        </div>
                                    </div>
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
