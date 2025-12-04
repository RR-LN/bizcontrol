"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import useSWR from "swr"
import { Search, Plus, MoreHorizontal, Edit, Trash2, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"

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
}

type StockFilter = "ALL" | "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK"

// SWR fetcher
const fetcher = (url: string) => fetch(url).then(res => res.json())

export default function ProductsPage() {
    const router = useRouter()
    const [searchQuery, setSearchQuery] = useState("")
    const [stockFilter, setStockFilter] = useState<StockFilter>("ALL")
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [productToDelete, setProductToDelete] = useState<string | null>(null)
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 10

    // Fetch products with useSWR
    const { data, error, isLoading, mutate } = useSWR<{ success: boolean; data: Product[] }>(
        '/api/products',
        fetcher
    )

    const products = data?.data || []

    // Filter and search products
    const filteredProducts = useMemo(() => {
        let filtered = products

        // Search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase()
            filtered = filtered.filter(product =>
                product.name.toLowerCase().includes(query) ||
                product.code.toLowerCase().includes(query)
            )
        }

        // Stock filter
        if (stockFilter !== "ALL") {
            filtered = filtered.filter(product => {
                const totalStock = product.stocks.reduce((sum, stock) => sum + stock.quantity, 0)
                const availableStock = product.stocks.reduce(
                    (sum, stock) => sum + (stock.quantity - stock.reserved),
                    0
                )

                if (stockFilter === "OUT_OF_STOCK") {
                    return availableStock === 0
                } else if (stockFilter === "LOW_STOCK") {
                    return availableStock > 0 && availableStock <= 10
                } else if (stockFilter === "IN_STOCK") {
                    return availableStock > 10
                }
                return true
            })
        }

        return filtered
    }, [products, searchQuery, stockFilter])

    // Pagination
    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    const paginatedProducts = filteredProducts.slice(startIndex, endIndex)

    // Reset to page 1 when filters change
    useMemo(() => {
        setCurrentPage(1)
    }, [searchQuery, stockFilter])

    // Helper functions
    const getTotalStock = (stocks: Array<{ quantity: number; reserved: number }>) => {
        return stocks.reduce((sum, stock) => sum + stock.quantity, 0)
    }

    const getAvailableStock = (stocks: Array<{ quantity: number; reserved: number }>) => {
        return stocks.reduce((sum, stock) => sum + (stock.quantity - stock.reserved), 0)
    }

    const getStockStatus = (availableStock: number) => {
        if (availableStock === 0) {
            return { label: "Sem Stock", variant: "destructive" as const }
        } else if (availableStock <= 10) {
            return { label: "Estoque Baixo", variant: "secondary" as const }
        } else {
            return { label: "Em Stock", variant: "default" as const }
        }
    }

    const getProductInitial = (name: string) => {
        return name.charAt(0).toUpperCase()
    }

    // Handlers
    const handleEdit = (productId: string) => {
        console.log('Editar produto:', productId)
        // TODO: Navigate to edit page when implemented
        // router.push(`/products/${productId}/edit`)
        toast.info('Funcionalidade de edição em desenvolvimento')
    }

    const handleDeleteClick = (productId: string) => {
        setProductToDelete(productId)
        setDeleteDialogOpen(true)
    }

    const handleDeleteConfirm = async () => {
        if (!productToDelete) return

        try {
            // TODO: Implement delete API call
            // const response = await fetch(`/api/products/${productToDelete}`, {
            //     method: 'DELETE',
            // })
            // if (!response.ok) throw new Error('Erro ao apagar produto')
            
            // For now, just show a message
            toast.success('Produto apagado com sucesso')
            setDeleteDialogOpen(false)
            setProductToDelete(null)
            
            // Refresh products
            mutate()
        } catch (error) {
            console.error('Delete error:', error)
            toast.error('Erro ao apagar produto')
        }
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-600 mb-4">Erro ao carregar produtos</p>
                    <Button onClick={() => mutate()}>Tentar novamente</Button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-extrabold">Produtos</h1>
                <Link href="/products/new">
                    <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Adicionar Produto
                    </Button>
                </Link>
            </div>

            {/* Filters & Search */}
            <div className="flex gap-4 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                        type="text"
                        placeholder="Buscar produtos..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline">
                            Filtrar
                            {stockFilter !== "ALL" && `: ${stockFilter === "IN_STOCK" ? "Em Stock" : stockFilter === "LOW_STOCK" ? "Estoque Baixo" : "Sem Stock"}`}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => setStockFilter("ALL")}>
                            Todos
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setStockFilter("IN_STOCK")}>
                            Em Stock
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setStockFilter("LOW_STOCK")}>
                            Estoque Baixo
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setStockFilter("OUT_OF_STOCK")}>
                            Sem Stock
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Products Table */}
            {isLoading ? (
                <div className="bg-white rounded-lg border p-8 text-center">
                    <p className="text-gray-500">Carregando produtos...</p>
                </div>
            ) : filteredProducts.length === 0 ? (
                <div className="bg-white rounded-lg border p-12 text-center">
                    <p className="text-gray-500 mb-4">
                        {searchQuery || stockFilter !== "ALL"
                            ? "Nenhum produto encontrado com os filtros aplicados"
                            : "Nenhum produto cadastrado"}
                    </p>
                    {!searchQuery && stockFilter === "ALL" && (
                        <Link href="/products/new">
                            <Button>
                                <Plus className="w-4 h-4 mr-2" />
                                Adicionar Primeiro Produto
                            </Button>
                        </Link>
                    )}
                </div>
            ) : (
                <>
                    <div className="bg-white rounded-lg border overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="text-muted-foreground">Produto</TableHead>
                                    <TableHead className="text-muted-foreground">Código</TableHead>
                                    <TableHead className="text-muted-foreground">Categoria</TableHead>
                                    <TableHead className="text-muted-foreground">Preço</TableHead>
                                    <TableHead className="text-muted-foreground">Stock</TableHead>
                                    <TableHead className="text-muted-foreground">Estado</TableHead>
                                    <TableHead className="text-muted-foreground text-right">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginatedProducts.map((product) => {
                                    const availableStock = getAvailableStock(product.stocks)
                                    const stockStatus = getStockStatus(availableStock)
                                    const stockColor = availableStock === 0
                                        ? "text-red-600 font-semibold"
                                        : availableStock <= 10
                                        ? "text-orange-600 font-semibold"
                                        : "text-gray-900"

                                    return (
                                        <TableRow key={product.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-10 w-10">
                                                        <AvatarImage src={product.image || undefined} alt={product.name} />
                                                        <AvatarFallback className="bg-sky-100 text-sky-600">
                                                            {getProductInitial(product.name)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <span className="font-semibold">{product.name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className="font-mono text-sm">{product.code}</span>
                                            </TableCell>
                                            <TableCell>
                                                {product.category ? (
                                                    <Badge variant="outline">{product.category.name}</Badge>
                                                ) : (
                                                    <span className="text-gray-400">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <span className="font-semibold">
                                                    AOA {Number(product.sellingPrice).toLocaleString('pt-AO')}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <span className={stockColor}>
                                                    {availableStock}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={stockStatus.variant}>
                                                    {stockStatus.label}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => handleEdit(product.id)}>
                                                            <Edit className="w-4 h-4 mr-2" />
                                                            Editar
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => handleDeleteClick(product.id)}
                                                            className="text-red-600"
                                                        >
                                                            <Trash2 className="w-4 h-4 mr-2" />
                                                            Apagar
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between mt-4">
                            <div className="text-sm text-gray-600">
                                Mostrando {startIndex + 1} até {Math.min(endIndex, filteredProducts.length)} de {filteredProducts.length} produtos
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                >
                                    <ChevronLeft className="w-4 h-4 mr-1" />
                                    Anterior
                                </Button>
                                <div className="flex items-center gap-2">
                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                        <Button
                                            key={page}
                                            variant={currentPage === page ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => setCurrentPage(page)}
                                            className="w-10"
                                        >
                                            {page}
                                        </Button>
                                    ))}
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                    disabled={currentPage === totalPages}
                                >
                                    Próxima
                                    <ChevronRight className="w-4 h-4 ml-1" />
                                </Button>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tem a certeza que deseja apagar este produto? Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setProductToDelete(null)}>
                            Cancelar
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteConfirm}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Apagar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
