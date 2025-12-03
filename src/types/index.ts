// User types
export type UserRole = 'ADMIN' | 'MANAGER' | 'OPERATOR' | 'VIEWER'

export interface User {
    id: string
    email: string
    firstName?: string | null
    lastName?: string | null
    phone?: string | null
    role: UserRole
    isActive: boolean
    createdAt: Date
    updatedAt: Date
}

// Product types
export type ProductType = 'SIMPLE' | 'VARIABLE' | 'COMPOSITE' | 'SERVICE'

export interface Product {
    id: string
    code: string
    name: string
    description?: string | null
    type: ProductType
    categoryId?: string | null
    supplierId?: string | null
    sku?: string | null
    barcode?: string | null
    image?: string | null
    costPrice: number
    sellingPrice: number
    taxRate: number
    minStockLevel: number
    maxStockLevel?: number | null
    isActive: boolean
    createdAt: Date
    updatedAt: Date
}

// Order types
export type OrderStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'RETURNED'
export type PaymentStatus = 'PENDING' | 'PARTIAL' | 'PAID' | 'REFUNDED' | 'CANCELLED'

export interface Order {
    id: string
    orderNumber: string
    customerId?: string | null
    status: OrderStatus
    paymentStatus: PaymentStatus
    subtotal: number
    discountAmount: number
    taxAmount: number
    shippingCost: number
    totalAmount: number
    notes?: string | null
    createdAt: Date
    updatedAt: Date
}

export interface OrderItem {
    id: string
    orderId: string
    productId: string
    quantity: number
    unitPrice: number
    unitCost: number
    discountPercent: number
    taxPercent: number
    totalPrice: number
}

// Transaction types
export type PaymentMethod = 'CASH' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'BANK_TRANSFER' | 'DIGITAL_WALLET' | 'PIX' | 'OTHER'
export type TransactionStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED' | 'CANCELLED'

export interface Transaction {
    id: string
    orderId: string
    paymentMethod: PaymentMethod
    amount: number
    status: TransactionStatus
    reference?: string | null
    receiptUrl?: string | null
    processedAt: Date
    createdAt: Date
}

// API Response types
export interface ApiResponse<T> {
    data: T
    message?: string
    success: boolean
}

export interface PaginatedResponse<T> {
    data: T[]
    total: number
    page: number
    pageSize: number
    totalPages: number
}
