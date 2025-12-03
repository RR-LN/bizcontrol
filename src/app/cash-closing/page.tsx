"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { toast } from "react-hot-toast"
import {
    DollarSign,
    CreditCard,
    Smartphone,
    AlertTriangle,
    CheckCircle2,
    Lock,
    Calculator,
    FileText
} from "lucide-react"

/**
 * FECHAMENTO DE CAIXA CEGO
 * 
 * Sistema anti-fraude:
 * - Operador NÃO vê valores do sistema
 * - Conta dinheiro físico e digita
 * - Sistema compara e mostra diferença
 * - Alerta admin se diferença > R$ 5,00
 */

interface ClosingResult {
    cashCounted: number
    cardCounted: number
    pixCounted: number
    totalCounted: number
    cashExpected: number
    cardExpected: number
    pixExpected: number
    totalExpected: number
    cashDifference: number
    cardDifference: number
    pixDifference: number
    totalDifference: number
    hasAlert: boolean
    closedBy: string
    closedAt: string
}

export default function CashClosingPage() {
    const router = useRouter()

    // Estado do formulário (valores contados pelo operador)
    const [cashCounted, setCashCounted] = useState<string>("")
    const [cardCounted, setCardCounted] = useState<string>("")
    const [pixCounted, setPixCounted] = useState<string>("")
    const [notes, setNotes] = useState<string>("")

    // Estado do resultado
    const [result, setResult] = useState<ClosingResult | null>(null)
    const [loading, setLoading] = useState(false)
    const [showResult, setShowResult] = useState(false)

    /**
     * Formatar valor para moeda (R$)
     */
    const formatCurrency = (value: number): string => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value)
    }

    /**
     * Calcular total contado
     */
    const getTotalCounted = (): number => {
        const cash = parseFloat(cashCounted) || 0
        const card = parseFloat(cardCounted) || 0
        const pix = parseFloat(pixCounted) || 0
        return cash + card + pix
    }

    /**
     * Validar formulário
     */
    const validateForm = (): boolean => {
        if (!cashCounted || !cardCounted || !pixCounted) {
            toast.error("Preencha todos os campos de valores")
            return false
        }

        const cash = parseFloat(cashCounted)
        const card = parseFloat(cardCounted)
        const pix = parseFloat(pixCounted)

        if (isNaN(cash) || isNaN(card) || isNaN(pix)) {
            toast.error("Digite valores numéricos válidos")
            return false
        }

        if (cash < 0 || card < 0 || pix < 0) {
            toast.error("Valores não podem ser negativos")
            return false
        }

        return true
    }

    /**
     * Confirmar fechamento de caixa
     */
    const handleSubmit = async () => {
        if (!validateForm()) return

        setLoading(true)

        try {
            const response = await fetch('/api/cash-closing', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    cashCounted: parseFloat(cashCounted),
                    cardCounted: parseFloat(cardCounted),
                    pixCounted: parseFloat(pixCounted),
                    notes: notes || undefined
                })
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Erro ao processar fechamento')
            }

            // Mostrar resultado
            setResult(data.data)
            setShowResult(true)

            // Toast de sucesso
            if (data.data.hasAlert) {
                toast.error(`⚠️ Diferença detectada: ${formatCurrency(Math.abs(data.data.totalDifference))}`)
            } else {
                toast.success('✅ Caixa fechado com sucesso!')
            }

        } catch (error: any) {
            console.error('Error:', error)
            toast.error(error.message || 'Erro ao fechar caixa')
        } finally {
            setLoading(false)
        }
    }

    /**
     * Resetar formulário
     */
    const handleReset = () => {
        setCashCounted("")
        setCardCounted("")
        setPixCounted("")
        setNotes("")
        setResult(null)
        setShowResult(false)
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 lg:p-8">
            <div className="max-w-4xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                            <Lock className="w-8 h-8 text-primary" />
                            Fechamento de Caixa Cego
                        </h1>
                        <p className="text-slate-500 mt-1">
                            Sistema anti-fraude: conte o dinheiro sem ver os valores do sistema
                        </p>
                    </div>
                    <Button variant="outline" onClick={() => router.push('/dashboard')}>
                        Voltar
                    </Button>
                </div>

                {/* Alerta de Segurança */}
                <Card className="border-blue-500/50 bg-blue-50 dark:bg-blue-950/20">
                    <CardHeader>
                        <div className="flex items-start gap-3">
                            <div className="h-10 w-10 rounded-full bg-blue-600 text-white grid place-items-center flex-shrink-0">
                                <Lock className="w-5 h-5" />
                            </div>
                            <div>
                                <CardTitle className="text-blue-700 dark:text-blue-400">
                                    🔒 Contagem Cega Ativada
                                </CardTitle>
                                <CardDescription className="text-blue-600 dark:text-blue-300 mt-1">
                                    Você NÃO verá os valores registrados pelo sistema até confirmar o fechamento.
                                    Conte o dinheiro físico e digite os valores abaixo.
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                </Card>

                {!showResult ? (
                    /* Formulário de Contagem */
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Calculator className="w-5 h-5" />
                                Conte e Digite os Valores
                            </CardTitle>
                            <CardDescription>
                                Informe quanto você contou de cada forma de pagamento
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">

                            {/* Campo: Dinheiro */}
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-medium">
                                    <DollarSign className="w-4 h-4 text-green-600" />
                                    Dinheiro (Espécie)
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                                        R$
                                    </span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={cashCounted}
                                        onChange={(e) => setCashCounted(e.target.value)}
                                        placeholder="0.00"
                                        className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-lg font-semibold"
                                    />
                                </div>
                            </div>

                            {/* Campo: Cartão */}
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-medium">
                                    <CreditCard className="w-4 h-4 text-blue-600" />
                                    Cartão (Crédito/Débito)
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                                        R$
                                    </span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={cardCounted}
                                        onChange={(e) => setCardCounted(e.target.value)}
                                        placeholder="0.00"
                                        className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-lg font-semibold"
                                    />
                                </div>
                            </div>

                            {/* Campo: PIX */}
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-medium">
                                    <Smartphone className="w-4 h-4 text-purple-600" />
                                    PIX / Carteira Digital
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                                        R$
                                    </span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={pixCounted}
                                        onChange={(e) => setPixCounted(e.target.value)}
                                        placeholder="0.00"
                                        className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-lg font-semibold"
                                    />
                                </div>
                            </div>

                            <Separator />

                            {/* Total Contado */}
                            <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                                        Total Contado:
                                    </span>
                                    <span className="text-2xl font-bold text-primary">
                                        {formatCurrency(getTotalCounted())}
                                    </span>
                                </div>
                            </div>

                            {/* Campo: Observações */}
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-medium">
                                    <FileText className="w-4 h-4" />
                                    Observações (Opcional)
                                </label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Ex: Faltou troco, cliente devolveu produto, etc."
                                    rows={3}
                                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                                />
                            </div>

                        </CardContent>
                        <CardFooter className="flex gap-3">
                            <Button
                                onClick={handleSubmit}
                                disabled={loading}
                                className="flex-1"
                                size="lg"
                            >
                                {loading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                                        Processando...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="w-4 h-4 mr-2" />
                                        Confirmar Fechamento
                                    </>
                                )}
                            </Button>
                            <Button
                                variant="outline"
                                onClick={handleReset}
                                disabled={loading}
                            >
                                Limpar
                            </Button>
                        </CardFooter>
                    </Card>

                ) : (
                    /* Resultado do Fechamento */
                    <Card className={result.hasAlert ? "border-red-500 border-2" : "border-green-500 border-2"}>
                        <CardHeader>
                            <div className="flex items-center gap-3">
                                <div className={`h-12 w-12 rounded-full grid place-items-center ${result.hasAlert
                                        ? 'bg-red-600 text-white animate-pulse'
                                        : 'bg-green-600 text-white'
                                    }`}>
                                    {result.hasAlert ? (
                                        <AlertTriangle className="w-6 h-6" />
                                    ) : (
                                        <CheckCircle2 className="w-6 h-6" />
                                    )}
                                </div>
                                <div>
                                    <CardTitle className={result.hasAlert ? "text-red-700 dark:text-red-400" : "text-green-700 dark:text-green-400"}>
                                        {result.hasAlert ? '⚠️ Diferença Detectada' : '✅ Caixa Fechado com Sucesso'}
                                    </CardTitle>
                                    <CardDescription>
                                        Fechado por {result.closedBy} em {new Date(result.closedAt).toLocaleString('pt-BR')}
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">

                            {/* Comparação de Valores */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                                {/* Dinheiro */}
                                <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 space-y-2">
                                    <div className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400">
                                        <DollarSign className="w-4 h-4" />
                                        Dinheiro
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-sm">
                                            <span>Contado:</span>
                                            <span className="font-semibold">{formatCurrency(result.cashCounted)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span>Sistema:</span>
                                            <span className="font-semibold">{formatCurrency(result.cashExpected)}</span>
                                        </div>
                                        <Separator />
                                        <div className={`flex justify-between text-sm font-bold ${result.cashDifference === 0 ? 'text-green-600' :
                                                result.cashDifference > 0 ? 'text-blue-600' : 'text-red-600'
                                            }`}>
                                            <span>Diferença:</span>
                                            <span>{formatCurrency(result.cashDifference)}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Cartão */}
                                <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 space-y-2">
                                    <div className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400">
                                        <CreditCard className="w-4 h-4" />
                                        Cartão
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-sm">
                                            <span>Contado:</span>
                                            <span className="font-semibold">{formatCurrency(result.cardCounted)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span>Sistema:</span>
                                            <span className="font-semibold">{formatCurrency(result.cardExpected)}</span>
                                        </div>
                                        <Separator />
                                        <div className={`flex justify-between text-sm font-bold ${result.cardDifference === 0 ? 'text-green-600' :
                                                result.cardDifference > 0 ? 'text-blue-600' : 'text-red-600'
                                            }`}>
                                            <span>Diferença:</span>
                                            <span>{formatCurrency(result.cardDifference)}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* PIX */}
                                <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 space-y-2">
                                    <div className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400">
                                        <Smartphone className="w-4 h-4" />
                                        PIX
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-sm">
                                            <span>Contado:</span>
                                            <span className="font-semibold">{formatCurrency(result.pixCounted)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span>Sistema:</span>
                                            <span className="font-semibold">{formatCurrency(result.pixExpected)}</span>
                                        </div>
                                        <Separator />
                                        <div className={`flex justify-between text-sm font-bold ${result.pixDifference === 0 ? 'text-green-600' :
                                                result.pixDifference > 0 ? 'text-blue-600' : 'text-red-600'
                                            }`}>
                                            <span>Diferença:</span>
                                            <span>{formatCurrency(result.pixDifference)}</span>
                                        </div>
                                    </div>
                                </div>

                            </div>

                            <Separator />

                            {/* Total Geral */}
                            <div className={`rounded-lg p-6 ${result.hasAlert
                                    ? 'bg-red-50 dark:bg-red-950/20 border-2 border-red-500'
                                    : 'bg-green-50 dark:bg-green-950/20 border-2 border-green-500'
                                }`}>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-lg font-medium">Total Contado:</span>
                                        <span className="text-2xl font-bold">{formatCurrency(result.totalCounted)}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-lg font-medium">Total Sistema:</span>
                                        <span className="text-2xl font-bold">{formatCurrency(result.totalExpected)}</span>
                                    </div>
                                    <Separator />
                                    <div className="flex justify-between items-center">
                                        <span className="text-xl font-bold">Diferença Total:</span>
                                        <div className="text-right">
                                            <div className={`text-3xl font-bold ${result.totalDifference === 0 ? 'text-green-600' :
                                                    result.totalDifference > 0 ? 'text-blue-600' : 'text-red-600'
                                                }`}>
                                                {formatCurrency(Math.abs(result.totalDifference))}
                                            </div>
                                            <Badge variant={result.totalDifference === 0 ? "secondary" : result.totalDifference > 0 ? "default" : "destructive"}>
                                                {result.totalDifference === 0 ? 'Exato' : result.totalDifference > 0 ? 'Sobra' : 'Falta'}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Alerta */}
                            {result.hasAlert && (
                                <Card className="border-red-500 bg-red-50 dark:bg-red-950/20">
                                    <CardHeader>
                                        <CardTitle className="text-red-700 dark:text-red-400 flex items-center gap-2">
                                            <AlertTriangle className="w-5 h-5" />
                                            Alerta de Discrepância
                                        </CardTitle>
                                        <CardDescription className="text-red-600 dark:text-red-300">
                                            A diferença é maior que R$ 5,00. Um alerta foi enviado ao administrador para revisão.
                                        </CardDescription>
                                    </CardHeader>
                                </Card>
                            )}

                        </CardContent>
                        <CardFooter className="flex gap-3">
                            <Button
                                onClick={handleReset}
                                variant="outline"
                                className="flex-1"
                            >
                                Novo Fechamento
                            </Button>
                            <Button
                                onClick={() => router.push('/dashboard')}
                                className="flex-1"
                            >
                                Voltar ao Dashboard
                            </Button>
                        </CardFooter>
                    </Card>
                )}

            </div>
        </div>
    )
}
