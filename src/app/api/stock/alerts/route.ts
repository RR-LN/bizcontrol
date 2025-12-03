import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { cookies } from "next/headers"

export async function GET() {
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
                { error: "Acesso negado. Apenas Admin e Manager podem visualizar alertas de estoque." },
                { status: 403 }
            )
        }

        // Get all products with their stock
        const products = await prisma.product.findMany({
            where: {
                isActive: true,
                trackInventory: true,
            },
            include: {
                stocks: {
                    select: {
                        quantity: true,
                        reserved: true,
                    },
                },
                supplier: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                    },
                },
            },
        })

        // Filter and map products with critical stock
        const criticalStockAlerts = products
            .map(product => {
                // Calculate total stock
                const totalStock = product.stocks.reduce((sum, stock) => sum + stock.quantity, 0)
                const totalReserved = product.stocks.reduce((sum, stock) => sum + stock.reserved, 0)
                const availableStock = totalStock - totalReserved

                return {
                    id: product.id,
                    code: product.code,
                    name: product.name,
                    quantity: totalStock,
                    availableStock,
                    reserved: totalReserved,
                    reorderPoint: product.minStockLevel,
                    supplierName: product.supplier?.name || 'Sem fornecedor',
                    supplierEmail: product.supplier?.email || null,
                    supplierPhone: product.supplier?.phone || null,
                    supplierId: product.supplier?.id || null,
                    image: product.image,
                    // Calculate severity (how far below reorder point)
                    severity: product.minStockLevel - totalStock,
                }
            })
            // Filter only products at or below reorder point
            .filter(item => item.quantity <= item.reorderPoint)
            // Sort by severity (most critical first)
            .sort((a, b) => {
                // First by severity (higher severity = more urgent)
                if (b.severity !== a.severity) {
                    return b.severity - a.severity
                }
                // Then by quantity (lower quantity = more urgent)
                return a.quantity - b.quantity
            })

        return NextResponse.json({
            success: true,
            data: criticalStockAlerts,
            count: criticalStockAlerts.length,
            message: criticalStockAlerts.length > 0
                ? `${criticalStockAlerts.length} produto(s) com estoque crítico`
                : 'Nenhum produto com estoque crítico',
        })
    } catch (error: any) {
        console.error('Stock alerts error:', error)
        return NextResponse.json(
            { error: error.message || "Erro ao buscar alertas de estoque" },
            { status: 500 }
        )
    }
}
