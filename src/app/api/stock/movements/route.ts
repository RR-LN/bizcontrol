import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { cookies } from "next/headers"

export async function GET(request: Request) {
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

        // Parse query parameters
        const { searchParams } = new URL(request.url)
        const productId = searchParams.get('productId')
        const userId = searchParams.get('userId')
        const type = searchParams.get('type')
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '50')

        // Calculate pagination
        const skip = (page - 1) * limit

        // Calculate date 30 days ago
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        // Build where clause based on filters and user role
        const where: any = {
            createdAt: {
                gte: thirtyDaysAgo
            }
        }

        // Role-based filtering
        if (user.role === 'OPERATOR') {
            // OPERATOR can only see their own movements
            where.userId = user.id
        } else if (user.role === 'MANAGER') {
            // MANAGER can see movements from their store/warehouse
            // For now, allowing all movements (can be restricted by warehouse later)
            // where.product.warehouse = user.warehouseId
        }
        // ADMIN sees everything (no additional filter)

        // Apply optional filters
        if (productId) {
            where.productId = productId
        }

        if (userId) {
            // Only ADMIN and MANAGER can filter by other users
            if (user.role === 'ADMIN' || user.role === 'MANAGER') {
                where.userId = userId
            }
        }

        if (type) {
            where.type = type.toUpperCase()
        }

        // Fetch movements with pagination
        const [movements, total] = await Promise.all([
            prisma.stockMovement.findMany({
                where,
                include: {
                    product: {
                        select: {
                            id: true,
                            code: true,
                            name: true,
                            image: true,
                        }
                    },
                    user: {
                        select: {
                            id: true,
                            email: true,
                            firstName: true,
                            lastName: true,
                            role: true,
                        }
                    }
                },
                orderBy: {
                    createdAt: 'desc'
                },
                skip,
                take: limit,
            }),
            prisma.stockMovement.count({ where })
        ])

        // Format response
        const formattedMovements = movements.map(movement => ({
            id: movement.id,
            type: movement.type,
            quantity: movement.quantity,
            reason: movement.reason,
            reference: movement.reference,
            createdAt: movement.createdAt,
            product: {
                id: movement.product.id,
                code: movement.product.code,
                name: movement.product.name,
                image: movement.product.image,
            },
            user: {
                id: movement.user.id,
                name: `${movement.user.firstName || ''} ${movement.user.lastName || ''}`.trim() || movement.user.email,
                email: movement.user.email,
                role: movement.user.role,
            }
        }))

        // Calculate pagination info
        const totalPages = Math.ceil(total / limit)
        const hasNextPage = page < totalPages
        const hasPrevPage = page > 1

        return NextResponse.json({
            success: true,
            data: formattedMovements,
            pagination: {
                page,
                limit,
                total,
                totalPages,
                hasNextPage,
                hasPrevPage,
            },
            filters: {
                productId: productId || null,
                userId: userId || null,
                type: type || null,
                dateRange: '30 days',
            }
        })
    } catch (error: any) {
        console.error('Stock movements error:', error)
        return NextResponse.json(
            { error: error.message || "Erro ao buscar movimentações de estoque" },
            { status: 500 }
        )
    }
}
