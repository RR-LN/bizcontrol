import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { cookies } from "next/headers"

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

        const body = await request.json()
        const {
            code,
            name,
            description,
            categoryId,
            supplierId,
            costPrice,
            sellingPrice,
            taxRate,
            minStockLevel,
            image,
            initialStock,
            warehouseId,
        } = body

        // Validate required fields
        if (!code || !name || !sellingPrice) {
            return NextResponse.json(
                { error: "Código, nome e preço de venda são obrigatórios" },
                { status: 400 }
            )
        }

        // Check if product code already exists
        const existingProduct = await prisma.product.findUnique({
            where: { code },
        })

        if (existingProduct) {
            return NextResponse.json(
                { error: "Já existe um produto com este código" },
                { status: 400 }
            )
        }

        // Get default warehouse if not provided
        let targetWarehouseId = warehouseId
        if (!targetWarehouseId) {
            const defaultWarehouse = await prisma.warehouse.findFirst({
                where: { isActive: true },
            })
            targetWarehouseId = defaultWarehouse?.id
        }

        // Create product with stock in a transaction
        const result = await prisma.$transaction(async (tx) => {
            // Create product
            const product = await tx.product.create({
                data: {
                    code,
                    name,
                    description: description || null,
                    categoryId: categoryId || null,
                    supplierId: supplierId || null,
                    costPrice: costPrice ? parseFloat(costPrice) : 0,
                    sellingPrice: parseFloat(sellingPrice),
                    taxRate: taxRate ? parseFloat(taxRate) : 0,
                    minStockLevel: minStockLevel ? parseInt(minStockLevel) : 0,
                    image: image || null,
                    isActive: true,
                    trackInventory: true,
                    createdById: user.id,
                },
            })

            // Create initial stock if warehouse exists and initialStock is provided
            if (targetWarehouseId && initialStock && parseInt(initialStock) > 0) {
                await tx.stock.create({
                    data: {
                        productId: product.id,
                        warehouseId: targetWarehouseId,
                        quantity: parseInt(initialStock),
                        reserved: 0,
                    },
                })

                // Log stock movement
                await tx.stockMovement.create({
                    data: {
                        productId: product.id,
                        type: 'IN',
                        quantity: parseInt(initialStock),
                        reason: 'Estoque inicial',
                        userId: user.id,
                    },
                })
            }

            return product
        })

        return NextResponse.json({
            success: true,
            data: result,
            message: "Produto criado com sucesso",
        })
    } catch (error: any) {
        console.error('Error creating product:', error)
        return NextResponse.json(
            { error: error.message || "Erro ao criar produto" },
            { status: 500 }
        )
    }
}

export async function GET() {
    try {
        const products = await prisma.product.findMany({
            where: {
                isActive: true,
            },
            include: {
                category: true,
                supplier: true,
                stocks: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        })

        return NextResponse.json({
            success: true,
            data: products,
        })
    } catch (error) {
        console.error('Error fetching products:', error)
        return NextResponse.json(
            { error: "Erro ao buscar produtos" },
            { status: 500 }
        )
    }
}
