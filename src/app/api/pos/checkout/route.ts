import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { cookies } from "next/headers"

interface CheckoutItem {
    productId: string
    quantity: number
    unitPrice: number
}

interface CheckoutRequest {
    customerId?: string | null
    items: CheckoutItem[]
    paymentMethod: 'CASH' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'BANK_TRANSFER' | 'DIGITAL_WALLET' | 'PIX' | 'OTHER'
    discount?: number
    notes?: string
    customerPhone?: string
    customerEmail?: string
}

export async function POST(request: Request) {
    try {
        // Check authentication
        const cookieStore = await cookies()
        const userSession = cookieStore.get('user_session')

        if (!userSession) {
            return NextResponse.json(
                { error: "Não autenticado" },
                { status: 401 }
            )
        }

        const user = JSON.parse(userSession.value)

        // Parse request body
        const body: CheckoutRequest = await request.json()
        const { customerId, items, paymentMethod, discount = 0, notes } = body

        // Validate items
        if (!items || items.length === 0) {
            return NextResponse.json(
                { error: "Nenhum item no carrinho" },
                { status: 400 }
            )
        }

        // Validate payment method
        const validPaymentMethods = ['CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'BANK_TRANSFER', 'DIGITAL_WALLET', 'PIX', 'OTHER']
        if (!validPaymentMethods.includes(paymentMethod)) {
            return NextResponse.json(
                { error: "Método de pagamento inválido" },
                { status: 400 }
            )
        }

        // Execute checkout in a transaction (all or nothing)
        const result = await prisma.$transaction(async (tx) => {
            // 1. Validate all products and check stock
            const validatedItems = []

            for (const item of items) {
                // Get product with stock
                const product = await tx.product.findUnique({
                    where: { id: item.productId },
                    include: {
                        stocks: true,
                    },
                })

                if (!product) {
                    throw new Error(`Produto ${item.productId} não encontrado`)
                }

                if (!product.isActive) {
                    throw new Error(`Produto ${product.name} está inativo`)
                }

                // Calculate total stock
                const totalStock = product.stocks.reduce((sum, stock) => sum + stock.quantity, 0)
                const totalReserved = product.stocks.reduce((sum, stock) => sum + stock.reserved, 0)
                const availableStock = totalStock - totalReserved

                if (availableStock < item.quantity) {
                    throw new Error(`Estoque insuficiente para ${product.name}. Disponível: ${availableStock}, Solicitado: ${item.quantity}`)
                }

                validatedItems.push({
                    product,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice || Number(product.sellingPrice),
                    unitCost: Number(product.costPrice),
                    taxPercent: Number(product.taxRate),
                })
            }

            // 2. Calculate totals
            let subtotal = 0
            let taxAmount = 0

            for (const item of validatedItems) {
                const itemTotal = item.unitPrice * item.quantity
                const itemTax = itemTotal * (item.taxPercent / 100)
                subtotal += itemTotal
                taxAmount += itemTax
            }

            const discountAmount = discount || 0
            const totalAmount = subtotal + taxAmount - discountAmount

            // 3. Generate order number
            const orderCount = await tx.order.count()
            const orderNumber = `ORD-${String(orderCount + 1).padStart(6, '0')}`

            // 4. Create order
            const order = await tx.order.create({
                data: {
                    orderNumber,
                    customerId: customerId || null,
                    status: 'APPROVED', // Set as APPROVED for completed sales
                    paymentStatus: 'PAID',
                    subtotal,
                    discountAmount,
                    discountPercent: 0,
                    taxAmount,
                    shippingCost: 0,
                    totalAmount,
                    notes: notes || null,
                    createdById: user.id,
                    approvedById: user.id,
                    approvedAt: new Date(),
                },
            })

            // 5. Create order items
            for (const item of validatedItems) {
                const itemTotalPrice = item.unitPrice * item.quantity

                await tx.orderItem.create({
                    data: {
                        orderId: order.id,
                        productId: item.product.id,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                        unitCost: item.unitCost,
                        discountPercent: 0,
                        taxPercent: item.taxPercent,
                        totalPrice: itemTotalPrice,
                        notes: null,
                    },
                })

                // 6. Update stock (deduct quantity)
                // Find stock with sufficient quantity
                let remainingQuantity = item.quantity

                for (const stock of item.product.stocks) {
                    if (remainingQuantity <= 0) break

                    const availableInThisStock = stock.quantity - stock.reserved

                    if (availableInThisStock > 0) {
                        const deductQuantity = Math.min(availableInThisStock, remainingQuantity)

                        await tx.stock.update({
                            where: { id: stock.id },
                            data: {
                                quantity: stock.quantity - deductQuantity,
                            },
                        })

                        remainingQuantity -= deductQuantity
                    }
                }

                // 7. Log stock movement
                await tx.stockMovement.create({
                    data: {
                        productId: item.product.id,
                        type: 'OUT',
                        quantity: item.quantity,
                        reason: `Venda POS #${orderNumber}`,
                        reference: order.id,
                        userId: user.id,
                    },
                })
            }

            // 8. Create transaction record
            await tx.transaction.create({
                data: {
                    orderId: order.id,
                    paymentMethod,
                    amount: totalAmount,
                    status: 'COMPLETED',
                    reference: orderNumber,
                    processedById: user.id,
                    processedAt: new Date(),
                },
            })

            return {
                orderNumber,
                orderId: order.id,
                total: totalAmount,
                subtotal,
                taxAmount,
                discountAmount,
            }
        })

        // Send receipt asynchronously (don't wait for it)
        const { customerPhone, customerEmail } = body
        if (customerPhone || customerEmail) {
            // Fire and forget - send receipt in background
            fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/send-receipt`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Cookie': request.headers.get('cookie') || '',
                },
                body: JSON.stringify({
                    orderId: result.orderId,
                    customerPhone,
                    customerEmail,
                }),
            }).catch(error => {
                console.error('Receipt send error (non-blocking):', error)
            })
        }

        return NextResponse.json({
            success: true,
            orderNumber: result.orderNumber,
            orderId: result.orderId,
            total: result.total,
            subtotal: result.subtotal,
            taxAmount: result.taxAmount,
            discountAmount: result.discountAmount,
            receiptSent: !!(customerPhone || customerEmail),
            message: "Venda realizada com sucesso",
        })
    } catch (error: any) {
        console.error('Checkout error:', error)

        // Return user-friendly error message
        return NextResponse.json(
            {
                error: error.message || "Erro ao processar venda",
                success: false,
            },
            { status: 400 }
        )
    }
}
