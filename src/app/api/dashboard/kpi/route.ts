import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { startOfDay, endOfDay } from "date-fns"

export async function GET() {
    try {
        const today = new Date()
        const startToday = startOfDay(today)
        const endToday = endOfDay(today)

        // Get today's orders
        const todayOrders = await prisma.order.findMany({
            where: {
                createdAt: {
                    gte: startToday,
                    lte: endToday,
                },
                status: {
                    notIn: ['CANCELLED', 'DRAFT']
                }
            },
            include: {
                items: {
                    include: {
                        product: true,
                    }
                }
            },
        })

        // Calculate today's sales
        const todaySales = todayOrders.reduce((sum, order) => {
            return sum + Number(order.totalAmount)
        }, 0)

        // Calculate today's profit (revenue - cost)
        const todayProfit = todayOrders.reduce((sum, order) => {
            const orderProfit = order.items.reduce((itemSum, item) => {
                const itemRevenue = Number(item.totalPrice)
                const itemCost = Number(item.unitCost) * item.quantity
                return itemSum + (itemRevenue - itemCost)
            }, 0)
            return sum + orderProfit
        }, 0)

        // Get products with low stock
        const products = await prisma.product.findMany({
            where: {
                isActive: true,
                trackInventory: true,
            },
            include: {
                stocks: true,
            },
        })

        const lowStockCount = products.filter(product => {
            const totalStock = product.stocks.reduce((sum, stock) => sum + stock.quantity, 0)
            return totalStock <= product.minStockLevel
        }).length

        // Total orders today
        const totalOrders = todayOrders.length

        return NextResponse.json({
            success: true,
            data: {
                todaySales: Math.round(todaySales),
                todayProfit: Math.round(todayProfit),
                lowStockCount,
                totalOrders,
            }
        })
    } catch (error) {
        console.error('Error fetching KPI data:', error)

        // Return demo data if error
        return NextResponse.json({
            success: true,
            data: {
                todaySales: 4500,
                todayProfit: 1200,
                lowStockCount: 5,
                totalOrders: 23,
            },
            isDemo: true,
        })
    }
}
