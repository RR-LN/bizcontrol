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

        // Check if user has permission (OPERATOR, MANAGER, or ADMIN)
        if (!['OPERATOR', 'MANAGER', 'ADMIN'].includes(user.role)) {
            return NextResponse.json(
                { error: "Acesso negado. Apenas Operadores, Managers e Administradores podem buscar produtos." },
                { status: 403 }
            )
        }

        // Get query parameter
        const { searchParams } = new URL(request.url)
        const query = searchParams.get('query')

        if (!query || query.trim().length === 0) {
            return NextResponse.json({
                success: true,
                data: [],
            })
        }

        const searchTerm = query.trim().toLowerCase()

        // Search products by code or name
        const products = await prisma.product.findMany({
            where: {
                isActive: true,
                OR: [
                    {
                        code: {
                            contains: searchTerm,
                        },
                    },
                    {
                        name: {
                            contains: searchTerm,
                        },
                    },
                ],
            },
            include: {
                stocks: {
                    select: {
                        quantity: true,
                        reserved: true,
                    },
                },
            },
            take: 20, // Get 20 to allow for sorting
        })

        // Calculate total stock for each product
        const productsWithStock = products.map(product => {
            const totalStock = product.stocks.reduce((sum, stock) => sum + stock.quantity, 0)
            const totalReserved = product.stocks.reduce((sum, stock) => sum + stock.reserved, 0)
            const availableStock = totalStock - totalReserved

            return {
                id: product.id,
                code: product.code,
                name: product.name,
                sellingPrice: Number(product.sellingPrice),
                stock: totalStock,
                availableStock,
            }
        })

        // Sort: Exact code match first, then exact name match, then alphabetically
        const sortedProducts = productsWithStock.sort((a, b) => {
            // Exact code match first
            const aCodeExact = a.code.toLowerCase() === searchTerm
            const bCodeExact = b.code.toLowerCase() === searchTerm
            if (aCodeExact && !bCodeExact) return -1
            if (!aCodeExact && bCodeExact) return 1

            // Code starts with query
            const aCodeStarts = a.code.toLowerCase().startsWith(searchTerm)
            const bCodeStarts = b.code.toLowerCase().startsWith(searchTerm)
            if (aCodeStarts && !bCodeStarts) return -1
            if (!aCodeStarts && bCodeStarts) return 1

            // Exact name match
            const aNameExact = a.name.toLowerCase() === searchTerm
            const bNameExact = b.name.toLowerCase() === searchTerm
            if (aNameExact && !bNameExact) return -1
            if (!aNameExact && bNameExact) return 1

            // Name starts with query
            const aNameStarts = a.name.toLowerCase().startsWith(searchTerm)
            const bNameStarts = b.name.toLowerCase().startsWith(searchTerm)
            if (aNameStarts && !bNameStarts) return -1
            if (!aNameStarts && bNameStarts) return 1

            // Alphabetically by code
            return a.code.localeCompare(b.code)
        })

        // Limit to 10 results for performance
        const limitedResults = sortedProducts.slice(0, 10)

        return NextResponse.json({
            success: true,
            data: limitedResults,
        })
    } catch (error: any) {
        console.error('POS search error:', error)
        return NextResponse.json(
            { error: error.message || "Erro ao buscar produtos" },
            { status: 500 }
        )
    }
}
