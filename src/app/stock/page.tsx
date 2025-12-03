"use client"

export default function StockPage() {
    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <h1 className="text-2xl font-bold text-gray-900">
                        📦 Gestão de Stock
                    </h1>
                    <p className="text-sm text-gray-600">Controle de inventário (Manager)</p>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
                    <div className="text-6xl mb-4">📦</div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Página de Stock</h2>
                    <p className="text-gray-600">Área exclusiva para Managers - Em desenvolvimento</p>
                </div>
            </main>
        </div>
    )
}
