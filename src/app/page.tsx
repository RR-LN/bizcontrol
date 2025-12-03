import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold text-gray-900 mb-4">
            BizControl <span className="text-blue-600">360</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            O seu negócio, sob controle total
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/login"
              className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Entrar
            </Link>
            <Link
              href="/demo"
              className="px-8 py-3 bg-white text-blue-600 border-2 border-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
            >
              Ver Demo
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <FeatureCard
            title="📦 Gestão de Inventário"
            description="Controle completo do seu estoque com alertas inteligentes e rastreabilidade total"
          />
          <FeatureCard
            title="💰 Ponto de Venda"
            description="Interface rápida para vendas com cálculo automático de lucros e múltiplos pagamentos"
          />
          <FeatureCard
            title="📊 Analytics em Tempo Real"
            description="Dashboard com insights financeiros e relatórios de performance"
          />
          <FeatureCard
            title="👥 Gestão de Usuários"
            description="Controle de acesso baseado em funções com segurança avançada"
          />
          <FeatureCard
            title="💳 Transações Modernas"
            description="Suporte a todos métodos de pagamento com recibos digitais"
          />
          <FeatureCard
            title="🔒 Segurança Total"
            description="Autenticação 2FA, logs de auditoria e proteção contra fraudes"
          />
        </div>

        <div className="mt-24 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Tecnologias Modernas
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Desenvolvido com Next.js 14, TypeScript e PostgreSQL
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <TechBadge>Next.js 14</TechBadge>
            <TechBadge>TypeScript</TechBadge>
            <TechBadge>PostgreSQL</TechBadge>
            <TechBadge>Prisma ORM</TechBadge>
            <TechBadge>TailwindCSS</TechBadge>
            <TechBadge>NextAuth.js</TechBadge>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow border border-gray-100">
      <h3 className="text-xl font-semibold text-gray-900 mb-3">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}

function TechBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
      {children}
    </span>
  );
}
