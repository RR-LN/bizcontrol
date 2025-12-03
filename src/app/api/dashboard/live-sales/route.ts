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

        // Check if user is ADMIN
        if (user.role !== 'ADMIN') {
            return NextResponse.json(
                { error: "Acesso negado. Apenas Admin pode visualizar vendas ao vivo." },
                { status: 403 }
            )
        }

        // Calculate 10 minutes ago
        const tenMinutesAgo = new Date()
        tenMinutesAgo.setMinutes(tenMinutesAgo.getMinutes() - 10)

        // Fetch recent sales
        const recentSales = await prisma.order.findMany({
            where: {
                createdAt: {
                    gte: tenMinutesAgo
                },
                status: {
                    in: ['APPROVED', 'COMPLETED']
                }
            },
            include: {
                customer: {
                    select: {
                        name: true
                    }
                },
                items: {
                    select: {
                        id: true
                    }
                },
                transactions: {
                    select: {
                        paymentMethod: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: 20
        })

        // Format data
        const formattedSales = recentSales.map(sale => ({
            id: sale.id,
            orderNumber: sale.orderNumber,
            totalAmount: Number(sale.totalAmount),
            paymentMethod: sale.transactions[0]?.paymentMethod || 'UNKNOWN',
            customerName: sale.customer?.name || 'Cliente não identificado',
            itemsCount: sale.items.length,
            createdAt: sale.createdAt,
        }))

        return NextResponse.json({
            success: true,
            data: formattedSales,
            count: formattedSales.length,
            timeRange: '10 minutos',
        })
    } catch (error: any) {
        console.error('Live sales error:', error)
        return NextResponse.json(
            { error: error.message || "Erro ao buscar vendas ao vivo" },
            { status: 500 }
        )
    }
}
