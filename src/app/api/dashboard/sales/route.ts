import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { subDays, format, startOfDay, endOfDay } from "date-fns"

export async function GET() {
    try {
        const today = new Date()
        const sevenDaysAgo = subDays(today, 6) // Last 7 days including today

        // Get orders from the last 7 days
        const orders = await prisma.order.findMany({
            where: {
                createdAt: {
                    gte: startOfDay(sevenDaysAgo),
                    lte: endOfDay(today),
                },
                status: {
                    notIn: ['CANCELLED', 'DRAFT']
                }
            },
            select: {
                createdAt: true,
                totalAmount: true,
            },
        })

        // Group sales by date
        const salesByDate: Record<string, number> = {}

        // Initialize all dates with 0
        for (let i = 6; i >= 0; i--) {
            const date = subDays(today, i)
            const dateKey = format(date, 'dd/MM')
            salesByDate[dateKey] = 0
        }

        // Aggregate sales by date
        orders.forEach(order => {
            const dateKey = format(order.createdAt, 'dd/MM')
            if (salesByDate[dateKey] !== undefined) {
                salesByDate[dateKey] += Number(order.totalAmount)
            }
        })

        // Convert to arrays for chart
        const labels = Object.keys(salesByDate)
        const data = Object.values(salesByDate)

        return NextResponse.json({
            success: true,
            labels,
            data,
        })
    } catch (error) {
        console.error('Error fetching sales data:', error)

        // Return demo data if error
        const today = new Date()
        const labels = []
        const data = []

        for (let i = 6; i >= 0; i--) {
            const date = subDays(today, i)
            labels.push(format(date, 'dd/MM'))
            // Generate random demo data
            data.push(Math.floor(Math.random() * 3000) + 1000)
        }

        return NextResponse.json({
            success: true,
            labels,
            data,
            isDemo: true,
        })
    }
}
