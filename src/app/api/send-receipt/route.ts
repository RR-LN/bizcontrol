import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { cookies } from "next/headers"

interface SendReceiptRequest {
    orderId: string
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

        // Parse request
        const body: SendReceiptRequest = await request.json()
        const { orderId, customerPhone, customerEmail } = body

        if (!orderId) {
            return NextResponse.json(
                { error: "ID do pedido é obrigatório" },
                { status: 400 }
            )
        }

        // Fetch order details for logging
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                items: {
                    include: {
                        product: true
                    }
                },
                customer: true,
            }
        })

        if (!order) {
            return NextResponse.json(
                { error: "Pedido não encontrado" },
                { status: 404 }
            )
        }

        // ============================================
        // MOCK MODE - Development only
        // ============================================
        // In production, replace this with real integrations
        // (WAPI WhatsApp API, SendGrid Email, etc.)

        console.log('\n╔═══════════════════════════════════════════════════════════╗')
        console.log('║          📧 RECIBO GERADO (MODO DESENVOLVIMENTO)          ║')
        console.log('╠═══════════════════════════════════════════════════════════╣')
        console.log(`║ Pedido:        ${order.orderNumber}`)
        console.log(`║ Total:         AOA ${Number(order.totalAmount).toLocaleString('pt-AO')}`)
        console.log(`║ Cliente:       ${order.customer?.name || 'Não identificado'}`)
        console.log(`║ Telefone:      ${customerPhone || 'Não fornecido'}`)
        console.log(`║ Email:         ${customerEmail || 'Não fornecido'}`)
        console.log(`║ Operador:      ${user.email}`)
        console.log('╠═══════════════════════════════════════════════════════════╣')
        console.log('║ ITENS:')
        order.items.forEach((item, index) => {
            const itemTotal = Number(item.totalPrice).toLocaleString('pt-AO')
            console.log(`║  ${index + 1}. ${item.product.name} x${item.quantity} = AOA ${itemTotal}`)
        })
        console.log('╚═══════════════════════════════════════════════════════════╝\n')

        // Return mock success
        return NextResponse.json({
            success: true,
            mock: true,
            whatsappSent: false,
            emailSent: false,
            adminNotified: false,
            message: `Recibo gerado em modo desenvolvimento. Verifique o console para detalhes do pedido ${order.orderNumber}.`
        })

    } catch (error: any) {
        console.error('[SEND-RECEIPT] Error:', error)
        return NextResponse.json(
            { error: error.message || "Erro ao processar recibo" },
            { status: 500 }
        )
    }
}
