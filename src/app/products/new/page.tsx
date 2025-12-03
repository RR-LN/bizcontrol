"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"

interface Category {
    id: string
    name: string
    description: string | null
}

interface Supplier {
    id: string
    name: string
    email: string | null
    phone: string | null
}

export default function NewProductPage() {
    const router = useRouter()
    const fileInputRef = useRef<HTMLInputElement>(null)

    const [loading, setLoading] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [categories, setCategories] = useState<Category[]>([])
    const [suppliers, setSuppliers] = useState<Supplier[]>([])
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    // Form fields
    const [code, setCode] = useState("")
    const [name, setName] = useState("")
    const [description, setDescription] = useState("")
    const [categoryId, setCategoryId] = useState("")
    const [supplierId, setSupplierId] = useState("")
    const [costPrice, setCostPrice] = useState("")
    const [sellingPrice, setSellingPrice] = useState("")
    const [taxRate, setTaxRate] = useState("0")
    const [minStockLevel, setMinStockLevel] = useState("0")
    const [initialStock, setInitialStock] = useState("")
    const [imageUrl, setImageUrl] = useState("")
    const [imagePreview, setImagePreview] = useState("")
    const [isDragging, setIsDragging] = useState(false)

    useEffect(() => {
        fetchCategories()
        fetchSuppliers()
    }, [])

    const fetchCategories = async () => {
        try {
            const response = await fetch('/api/categories')
            const data = await response.json()
            if (data.success) {
                setCategories(data.data)
            }
        } catch (error) {
            console.error('Error fetching categories:', error)
        }
    }

    const fetchSuppliers = async () => {
        try {
            const response = await fetch('/api/suppliers')
            const data = await response.json()
            if (data.success) {
                setSuppliers(data.data)
            }
        } catch (error) {
            console.error('Error fetching suppliers:', error)
        }
    }

    const handleImageUpload = async (file: File) => {
        if (!file) return

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
        if (!allowedTypes.includes(file.type)) {
            setMessage({ type: 'error', text: 'Tipo de arquivo não permitido. Use JPG, PNG ou WebP.' })
            return
        }

        // Validate file size (5MB)
        if (file.size > 5 * 1024 * 1024) {
            setMessage({ type: 'error', text: 'Arquivo muito grande. Tamanho máximo: 5MB' })
            return
        }

        // Show preview
        const reader = new FileReader()
        reader.onloadend = () => {
            setImagePreview(reader.result as string)
        }
        reader.readAsDataURL(file)

        // Upload to Cloudinary
        setUploading(true)
        try {
            const formData = new FormData()
            formData.append('file', file)

            const response = await fetch('/api/upload-image', {
                method: 'POST',
                body: formData,
            })

            const data = await response.json()

            if (data.success) {
                setImageUrl(data.url)
                setMessage({ type: 'success', text: 'Imagem enviada com sucesso!' })
            } else {
                setMessage({ type: 'error', text: data.error || 'Erro ao enviar imagem' })
                setImagePreview("")
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Erro ao enviar imagem' })
            setImagePreview("")
        } finally {
            setUploading(false)
        }
    }

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            handleImageUpload(file)
        }
    }

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(true)
    }

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)

        const file = e.dataTransfer.files[0]
        if (file) {
            handleImageUpload(file)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setMessage(null)
        setLoading(true)

        try {
            const response = await fetch('/api/products', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    code,
                    name,
                    description,
                    categoryId: categoryId || null,
                    supplierId: supplierId || null,
                    costPrice,
                    sellingPrice,
                    taxRate,
                    minStockLevel,
                    initialStock,
                    image: imageUrl || null,
                }),
            })

            const data = await response.json()

            if (data.success) {
                setMessage({ type: 'success', text: 'Produto criado com sucesso!' })
                // Reset form
                setTimeout(() => {
                    router.push('/products')
                }, 2000)
            } else {
                setMessage({ type: 'error', text: data.error || 'Erro ao criar produto' })
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Erro ao criar produto. Tente novamente.' })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-bold text-gray-900">Novo Produto</h1>
                        <button
                            onClick={() => router.back()}
                            className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
                        >
                            ← Voltar
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Message */}
                {message && (
                    <div className={`mb-6 p-4 rounded-lg ${message.type === 'success'
                            ? 'bg-green-50 border border-green-200 text-green-800'
                            : 'bg-red-50 border border-red-200 text-red-800'
                        }`}>
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Info Card */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Informações Básicas</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Código do Produto *
                                </label>
                                <input
                                    type="text"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value)}
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Ex: PROD001"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Nome do Produto *
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Ex: Coca-Cola 350ml"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Descrição
                                </label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows={3}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Descrição detalhada do produto..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Categoria
                                </label>
                                <select
                                    value={categoryId}
                                    onChange={(e) => setCategoryId(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="">Selecione uma categoria</option>
                                    {categories.map((cat) => (
                                        <option key={cat.id} value={cat.id}>
                                            {cat.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Fornecedor
                                </label>
                                <select
                                    value={supplierId}
                                    onChange={(e) => setSupplierId(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="">Selecione um fornecedor</option>
                                    {suppliers.map((sup) => (
                                        <option key={sup.id} value={sup.id}>
                                            {sup.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Pricing Card */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Preços</h2>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Preço de Custo (AOA)
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={costPrice}
                                    onChange={(e) => setCostPrice(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="0.00"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Preço de Venda (AOA) *
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={sellingPrice}
                                    onChange={(e) => setSellingPrice(e.target.value)}
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="0.00"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Taxa de Imposto (%)
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={taxRate}
                                    onChange={(e) => setTaxRate(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="0"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Stock Card */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Estoque</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Estoque Mínimo
                                </label>
                                <input
                                    type="number"
                                    value={minStockLevel}
                                    onChange={(e) => setMinStockLevel(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="0"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Estoque Inicial
                                </label>
                                <input
                                    type="number"
                                    value={initialStock}
                                    onChange={(e) => setInitialStock(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="0"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Image Upload Card */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Imagem do Produto</h2>

                        {/* Upload Area */}
                        <div
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${isDragging
                                    ? 'border-blue-500 bg-blue-50'
                                    : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
                                }`}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/jpeg,image/jpg,image/png,image/webp"
                                onChange={handleFileSelect}
                                className="hidden"
                            />

                            {uploading ? (
                                <div className="flex flex-col items-center">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                                    <p className="text-gray-600">Enviando imagem...</p>
                                </div>
                            ) : imagePreview ? (
                                <div className="flex flex-col items-center">
                                    <img
                                        src={imagePreview}
                                        alt="Preview"
                                        className="max-h-64 rounded-lg mb-4 object-contain"
                                    />
                                    <p className="text-sm text-green-600 font-medium">✓ Imagem carregada</p>
                                    <p className="text-xs text-gray-500 mt-1">Clique para alterar</p>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center">
                                    <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <p className="text-gray-600 mb-1">Arraste e solte uma imagem ou clique para selecionar</p>
                                    <p className="text-sm text-gray-500">JPG, PNG ou WebP (máx. 5MB)</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end space-x-4">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading || uploading}
                            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all font-semibold shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Salvando...
                                </>
                            ) : (
                                'Salvar Produto'
                            )}
                        </button>
                    </div>
                </form>
            </main>
        </div>
    )
}
