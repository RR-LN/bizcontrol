import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { cookies } from "next/headers"

interface AdjustmentRequest {
    productId: string
    newQuantity: number
    reason: string
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

        // Check if user is ADMIN or MANAGER
        if (user.role !== 'ADMIN' && user.role !== 'MANAGER') {
            return NextResponse.json(
                { error: "Acesso negado. Apenas Admin e Manager podem ajustar estoque." },
                { status: 403 }
            )
        }

        // Parse request body
        const body: AdjustmentRequest = await request.json()
        const { productId, newQuantity, reason } = body

        // Validate input
        if (!productId || newQuantity === undefined || !reason) {
            return NextResponse.json(
                { error: "Dados incompletos. Produto, quantidade e motivo são obrigatórios." },
                { status: 400 }
            )
        }

        if (newQuantity < 0) {
            return NextResponse.json(
                { error: "Quantidade não pode ser negativa" },
                { status: 400 }
            )
        }

        // Execute adjustment in a transaction
        const result = await prisma.$transaction(async (tx) => {
            // Get product with stock
            const product = await tx.product.findUnique({
                where: { id: productId },
                include: { stocks: true }
            })

            if (!product) {
                throw new Error("Produto não encontrado")
            }

            // Calculate current total stock
            const currentStock = product.stocks.reduce((sum, stock) => sum + stock.quantity, 0)
            const difference = newQuantity - currentStock

            // Update stock (assuming single warehouse for now)
            if (product.stocks.length === 0) {
                throw new Error("Produto não possui registro de estoque")
            }

            // Update the first stock record (or create logic to handle multiple warehouses)
            const stockToUpdate = product.stocks[0]

            await tx.stock.update({
                where: { id: stockToUpdate.id },
                data: {
                    quantity: newQuantity
                }
            })

            // Create stock movement record
            await tx.stockMovement.create({
                data: {
                    productId: product.id,
                    type: 'ADJUSTMENT',
                    quantity: Math.abs(difference),
                    reason: `Ajuste de Estoque: ${reason}`,
                    reference: `ADJ-${Date.now()}`,
                    userId: user.id,
                }
            })

            return {
                productId: product.id,
                productName: product.name,
                previousStock: currentStock,
                newStock: newQuantity,
                difference,
            }
        })

        return NextResponse.json({
            success: true,
            message: "Estoque ajustado com sucesso",
            data: result,
        })
    } catch (error: any) {
        console.error('Stock adjustment error:', error)
        return NextResponse.json(
            { error: error.message || "Erro ao ajustar estoque" },
            { status: 500 }
        )
    }
}
