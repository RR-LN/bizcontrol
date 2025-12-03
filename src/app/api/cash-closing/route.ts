import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { cookies } from "next/headers"

/**
 * API de Fechamento de Caixa Cego
 * 
 * ANTI-FRAUDE: Operador não vê valores do sistema antes de contar
 * 
 * Fluxo:
 * 1. Operador conta dinheiro físico
 * 2. Digita valores SEM ver o que o sistema registrou
 * 3. Sistema compara e mostra diferença
 * 4. Se diferença > R$ 5,00 → alerta para admin
 */

interface CashClosingRequest {
    cashCounted: number    // Dinheiro contado pelo operador
    cardCounted: number    // Cartão contado pelo operador
    pixCounted: number     // PIX contado pelo operador
    notes?: string         // Observações opcionais
}

export async function POST(request: Request) {
    try {
        // ============================================
        // 1. AUTENTICAÇÃO
        // ============================================
        const cookieStore = await cookies()
        const userSession = cookieStore.get('user_session')

        if (!userSession) {
            return NextResponse.json(
                { error: "Não autenticado" },
                { status: 401 }
            )
        }

        const user = JSON.parse(userSession.value)

        // ============================================
        // 2. VALIDAR DADOS DO OPERADOR
        // ============================================
        const body: CashClosingRequest = await request.json()
        const { cashCounted, cardCounted, pixCounted, notes } = body

        if (cashCounted === undefined || cardCounted === undefined || pixCounted === undefined) {
            return NextResponse.json(
                { error: "Todos os valores são obrigatórios" },
                { status: 400 }
            )
        }

        // Total contado pelo operador
        const totalCounted = cashCounted + cardCounted + pixCounted

        // ============================================
        // 3. BUSCAR VALORES REAIS DO SISTEMA (HOJE)
        // ============================================
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const tomorrow = new Date(today)
        tomorrow.setDate(tomorrow.getDate() + 1)

        // Buscar todas as transações de hoje
        const transactions = await prisma.transaction.findMany({
            where: {
                createdAt: {
                    gte: today,
                    lt: tomorrow
                },
                status: 'COMPLETED'
            }
        })

        // Calcular valores esperados por método de pagamento
        let cashExpected = 0
        let cardExpected = 0
        let pixExpected = 0

        transactions.forEach(transaction => {
            const amount = Number(transaction.amount)

            switch (transaction.paymentMethod) {
                case 'CASH':
                    cashExpected += amount
                    break
                case 'CREDIT_CARD':
                case 'DEBIT_CARD':
                    cardExpected += amount
                    break
                case 'PIX':
                case 'DIGITAL_WALLET':
                    pixExpected += amount
                    break
                default:
                    // Outros métodos vão para "outros"
                    break
            }
        })

        const totalExpected = cashExpected + cardExpected + pixExpected

        // ============================================
        // 4. CALCULAR DIFERENÇAS
        // ============================================
        const cashDifference = cashCounted - cashExpected
        const cardDifference = cardCounted - cardExpected
        const pixDifference = pixCounted - pixExpected
        const totalDifference = totalCounted - totalExpected

        // ============================================
        // 5. VERIFICAR SE PRECISA ALERTA
        // ============================================
        // Alerta se diferença total > R$ 5,00 (em módulo)
        const hasAlert = Math.abs(totalDifference) > 5.00

        // ============================================
        // 6. REGISTRAR FECHAMENTO NO BANCO
        // ============================================
        const cashClosing = await prisma.cashClosing.create({
            data: {
                userId: user.id,

                // Valores contados (CEGO)
                cashCounted,
                cardCounted,
                pixCounted,
                totalCounted,

                // Valores esperados (SISTEMA)
                cashExpected,
                cardExpected,
                pixExpected,
                totalExpected,

                // Diferenças
                cashDifference,
                cardDifference,
                pixDifference,
                totalDifference,

                // Observações
                notes: notes || null,

                // Status e alerta
                status: 'CLOSED',
                hasAlert,
            },
            include: {
                user: {
                    select: {
                        name: true,
                        email: true
                    }
                }
            }
        })

        // ============================================
        // 7. LOG DE AUDITORIA
        // ============================================
        console.log('\n╔═══════════════════════════════════════════════════════════╗')
        console.log('║          💰 FECHAMENTO DE CAIXA CEGO                      ║')
        console.log('╠═══════════════════════════════════════════════════════════╣')
        console.log(`║ Operador:      ${user.name}`)
        console.log(`║ Data/Hora:     ${new Date().toLocaleString('pt-BR')}`)
        console.log('╠═══════════════════════════════════════════════════════════╣')
        console.log('║ VALORES CONTADOS (OPERADOR):')
        console.log(`║   Dinheiro:    R$ ${cashCounted.toFixed(2)}`)
        console.log(`║   Cartão:      R$ ${cardCounted.toFixed(2)}`)
        console.log(`║   PIX:         R$ ${pixCounted.toFixed(2)}`)
        console.log(`║   TOTAL:       R$ ${totalCounted.toFixed(2)}`)
        console.log('╠═══════════════════════════════════════════════════════════╣')
        console.log('║ VALORES ESPERADOS (SISTEMA):')
        console.log(`║   Dinheiro:    R$ ${cashExpected.toFixed(2)}`)
        console.log(`║   Cartão:      R$ ${cardExpected.toFixed(2)}`)
        console.log(`║   PIX:         R$ ${pixExpected.toFixed(2)}`)
        console.log(`║   TOTAL:       R$ ${totalExpected.toFixed(2)}`)
        console.log('╠═══════════════════════════════════════════════════════════╣')
        console.log('║ DIFERENÇAS:')
        console.log(`║   Dinheiro:    R$ ${cashDifference.toFixed(2)} ${cashDifference > 0 ? '(SOBRA)' : cashDifference < 0 ? '(FALTA)' : '(OK)'}`)
        console.log(`║   Cartão:      R$ ${cardDifference.toFixed(2)} ${cardDifference > 0 ? '(SOBRA)' : cardDifference < 0 ? '(FALTA)' : '(OK)'}`)
        console.log(`║   PIX:         R$ ${pixDifference.toFixed(2)} ${pixDifference > 0 ? '(SOBRA)' : pixDifference < 0 ? '(FALTA)' : '(OK)'}`)
        console.log(`║   TOTAL:       R$ ${totalDifference.toFixed(2)} ${totalDifference > 0 ? '(SOBRA)' : totalDifference < 0 ? '(FALTA)' : '(OK)'}`)
        console.log('╠═══════════════════════════════════════════════════════════╣')
        console.log(`║ ALERTA:        ${hasAlert ? '🚨 SIM - Diferença > R$ 5,00' : '✅ NÃO'}`)
        if (notes) {
            console.log(`║ Observações:   ${notes}`)
        }
        console.log('╚═══════════════════════════════════════════════════════════╝\n')

        // ============================================
        // 8. RETORNAR RESULTADO
        // ============================================
        return NextResponse.json({
            success: true,
            data: {
                id: cashClosing.id,

                // Valores contados
                cashCounted,
                cardCounted,
                pixCounted,
                totalCounted,

                // Valores esperados (agora o operador pode ver)
                cashExpected,
                cardExpected,
                pixExpected,
                totalExpected,

                // Diferenças
                cashDifference,
                cardDifference,
                pixDifference,
                totalDifference,

                // Status
                hasAlert,
                status: cashClosing.status,
                closedBy: cashClosing.user.name,
                closedAt: cashClosing.createdAt
            }
        })

    } catch (error: any) {
        console.error('[CASH-CLOSING] Error:', error)
        return NextResponse.json(
            { error: error.message || "Erro ao processar fechamento de caixa" },
            { status: 500 }
        )
    }
}

/**
 * GET - Buscar histórico de fechamentos
 */
export async function GET(request: Request) {
    try {
        // Autenticação
        const cookieStore = await cookies()
        const userSession = cookieStore.get('user_session')

        if (!userSession) {
            return NextResponse.json(
                { error: "Não autenticado" },
                { status: 401 }
            )
        }

        const user = JSON.parse(userSession.value)

        // Apenas ADMIN pode ver todos os fechamentos
        if (user.role !== 'ADMIN') {
            return NextResponse.json(
                { error: "Acesso negado" },
                { status: 403 }
            )
        }

        // Buscar últimos 30 fechamentos
        const closings = await prisma.cashClosing.findMany({
            take: 30,
            orderBy: {
                createdAt: 'desc'
            },
            include: {
                user: {
                    select: {
                        name: true,
                        email: true
                    }
                }
            }
        })

        return NextResponse.json({
            success: true,
            data: closings
        })

    } catch (error: any) {
        console.error('[CASH-CLOSING] Error:', error)
        return NextResponse.json(
            { error: error.message || "Erro ao buscar fechamentos" },
            { status: 500 }
        )
    }
}
