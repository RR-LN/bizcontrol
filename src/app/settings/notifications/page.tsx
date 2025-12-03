"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import toast, { Toaster } from "react-hot-toast"

export default function NotificationSettingsPage() {
    const router = useRouter()
    const [user, setUser] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [testing, setTesting] = useState(false)

    // Settings
    const [adminWhatsApp, setAdminWhatsApp] = useState("")
    const [notifyHighSales, setNotifyHighSales] = useState(false)
    const [highSalesThreshold, setHighSalesThreshold] = useState("1000")
    const [notifyCriticalStock, setNotifyCriticalStock] = useState(true)

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const response = await fetch('/api/me')
                if (!response.ok) {
                    router.push('/login')
                    return
                }
                const data = await response.json()

                if (data.user.role !== 'ADMIN') {
                    toast.error('Apenas admin pode acessar configurações')
                    router.push('/dashboard')
                    return
                }

                setUser(data.user)
                await loadSettings()
            } catch (error) {
                router.push('/login')
            } finally {
                setLoading(false)
            }
        }

        checkAuth()
    }, [router])

    const loadSettings = async () => {
        try {
            const response = await fetch('/api/settings')
            const data = await response.json()

            if (data.success) {
                const settings = data.data
                setAdminWhatsApp(settings.admin_whatsapp || "")
                setNotifyHighSales(settings.notify_high_sales === 'true')
                setHighSalesThreshold(settings.high_sales_threshold || "1000")
                setNotifyCriticalStock(settings.notify_critical_stock !== 'false')
            }
        } catch (error) {
            console.error('Load settings error:', error)
        }
    }

    const saveSetting = async (key: string, value: string) => {
        try {
            await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key, value })
            })
        } catch (error) {
            console.error('Save setting error:', error)
            throw error
        }
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            await Promise.all([
                saveSetting('admin_whatsapp', adminWhatsApp),
                saveSetting('notify_high_sales', notifyHighSales.toString()),
                saveSetting('high_sales_threshold', highSalesThreshold),
                saveSetting('notify_critical_stock', notifyCriticalStock.toString())
            ])

            toast.success('Configurações salvas com sucesso!')
        } catch (error) {
            toast.error('Erro ao salvar configurações')
        } finally {
            setSaving(false)
        }
    }

    const handleTestNotification = async () => {
        if (!adminWhatsApp.trim()) {
            toast.error('Digite um número de WhatsApp primeiro')
            return
        }

        setTesting(true)
        try {
            const response = await fetch('/api/test-notification', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: adminWhatsApp })
            })

            const data = await response.json()

            if (data.success) {
                toast.success('Notificação de teste enviada! Verifique seu WhatsApp.')
            } else {
                toast.error(data.error || 'Erro ao enviar notificação de teste')
            }
        } catch (error) {
            toast.error('Erro ao enviar notificação de teste')
        } finally {
            setTesting(false)
        }
    }

    if (loading) {
        return <LoadingSkeleton />
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Toaster position="top-right" />

            {/* Header */}
            <header className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center space-x-4">
                        <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">🔔 Configurações de Notificações</h1>
                            <p className="text-sm text-gray-600">Configure quando e como receber alertas</p>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* WhatsApp Number */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">📱 Número do WhatsApp</h2>
                    <p className="text-sm text-gray-600 mb-4">
                        Número que receberá notificações importantes do sistema
                    </p>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Número (com código do país)
                            </label>
                            <input
                                type="tel"
                                value={adminWhatsApp}
                                onChange={(e) => setAdminWhatsApp(e.target.value)}
                                placeholder="+244 999 999 999"
                                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-lg font-mono"
                            />
                            <p className="text-xs text-gray-500 mt-2">
                                Exemplo: +244999999999 (código do país + número sem espaços)
                            </p>
                        </div>

                        <button
                            onClick={handleTestNotification}
                            disabled={testing || !adminWhatsApp.trim()}
                            className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                            {testing ? (
                                <>
                                    <svg className="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Enviando...
                                </>
                            ) : (
                                <>
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                    </svg>
                                    Enviar Notificação de Teste
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Notification Preferences */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">⚙️ Preferências de Notificação</h2>

                    <div className="space-y-6">
                        {/* Critical Stock */}
                        <div className="flex items-start">
                            <div className="flex items-center h-5">
                                <input
                                    type="checkbox"
                                    checked={notifyCriticalStock}
                                    onChange={(e) => setNotifyCriticalStock(e.target.checked)}
                                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                            </div>
                            <div className="ml-3">
                                <label className="font-medium text-gray-900">
                                    📦 Notificar Estoque Crítico
                                </label>
                                <p className="text-sm text-gray-600">
                                    Receba alerta quando produtos atingirem estoque mínimo
                                </p>
                            </div>
                        </div>

                        {/* High Sales */}
                        <div className="border-t border-gray-200 pt-6">
                            <div className="flex items-start mb-4">
                                <div className="flex items-center h-5">
                                    <input
                                        type="checkbox"
                                        checked={notifyHighSales}
                                        onChange={(e) => setNotifyHighSales(e.target.checked)}
                                        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                </div>
                                <div className="ml-3">
                                    <label className="font-medium text-gray-900">
                                        💰 Notificar Vendas Altas
                                    </label>
                                    <p className="text-sm text-gray-600">
                                        Receba alerta quando uma venda ultrapassar um valor específico
                                    </p>
                                </div>
                            </div>

                            {notifyHighSales && (
                                <div className="ml-8">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Valor mínimo (AOA)
                                    </label>
                                    <input
                                        type="number"
                                        value={highSalesThreshold}
                                        onChange={(e) => setHighSalesThreshold(e.target.value)}
                                        min="0"
                                        step="100"
                                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                                    />
                                    <p className="text-xs text-gray-500 mt-2">
                                        Será notificado quando uma venda for igual ou maior que este valor
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Info Box */}
                <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-blue-800">Sobre as Notificações</h3>
                            <div className="mt-2 text-sm text-blue-700">
                                <ul className="list-disc list-inside space-y-1">
                                    <li>As notificações são enviadas via WhatsApp</li>
                                    <li>Você receberá alertas em tempo real</li>
                                    <li>Configure o número do WAPI no arquivo .env</li>
                                    <li>Teste sempre após salvar as configurações</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Save Button */}
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full py-4 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg font-bold text-lg hover:from-green-700 hover:to-green-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg"
                >
                    {saving ? (
                        <>
                            <svg className="animate-spin h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Salvando...
                        </>
                    ) : (
                        <>
                            <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                            </svg>
                            Salvar Configurações
                        </>
                    )}
                </button>
            </main>
        </div>
    )
}

function LoadingSkeleton() {
    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="h-8 bg-gray-200 rounded animate-pulse w-64"></div>
                </div>
            </header>
            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white rounded-xl p-6">
                    <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
                </div>
            </main>
        </div>
    )
}
