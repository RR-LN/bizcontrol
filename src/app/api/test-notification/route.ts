import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST(request: Request) {
    try {
        // Check authentication
        const cookieStore = await cookies()
        const userSession = cookieStore.get('user_session')

        if (!userSession) {
            return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
        }

        const user = JSON.parse(userSession.value)

        if (user.role !== 'ADMIN') {
            return NextResponse.json({ error: "Apenas admin pode enviar testes" }, { status: 403 })
        }

        const body = await request.json()
        const { phone } = body

        if (!phone) {
            return NextResponse.json({ error: "Número de telefone é obrigatório" }, { status: 400 })
        }

        // Send test WhatsApp message
        const apiKey = process.env.WAPI_API_KEY
        const phoneNumberId = process.env.WAPI_PHONE_NUMBER_ID

        if (!apiKey || !phoneNumberId) {
            return NextResponse.json({ error: "WAPI não configurado" }, { status: 500 })
        }

        const cleanPhone = phone.replace(/\D/g, '')

        const testMessage = `🧪 *TESTE DE NOTIFICAÇÃO*\n\n` +
            `Este é um teste do sistema de notificações do BizControl 360.\n\n` +
            `✅ Se você recebeu esta mensagem, as notificações estão funcionando corretamente!\n\n` +
            `Configurado por: ${user.email}\n` +
            `Data: ${new Date().toLocaleString('pt-BR')}`

        const response = await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}/messages`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                messaging_product: 'whatsapp',
                to: cleanPhone,
                type: 'text',
                text: {
                    body: testMessage
                }
            })
        })

        const data = await response.json()

        if (!response.ok) {
            console.error('WAPI error:', data)
            return NextResponse.json({
                success: false,
                error: data.error?.message || 'Erro ao enviar mensagem'
            }, { status: 400 })
        }

        return NextResponse.json({
            success: true,
            message: 'Notificação de teste enviada com sucesso!'
        })
    } catch (error: any) {
        console.error('Test notification error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
