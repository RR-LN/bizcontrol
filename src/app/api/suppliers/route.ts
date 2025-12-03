import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
    try {
        const suppliers = await prisma.supplier.findMany({
            where: {
                isActive: true,
            },
            orderBy: {
                name: 'asc',
            },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
            },
        })

        return NextResponse.json({
            success: true,
            data: suppliers,
        })
    } catch (error) {
        console.error('Error fetching suppliers:', error)
        return NextResponse.json(
            { error: "Erro ao buscar fornecedores" },
            { status: 500 }
        )
    }
}
