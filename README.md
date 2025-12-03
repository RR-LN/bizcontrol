# BizControl 360 🚀

Sistema ERP completo para micro e pequenas empresas com foco em **controle anti-fraude** e **inteligência de negócio**.

## 🎯 Funcionalidades Principais

- **Gestão Inteligente de Estoque**
  - Alertas automáticos de estoque crítico
  - Rastreabilidade total (quem mexeu, quando, por quê)
  - Cadastro com fotos e código de barras

- **Ponto de Venda (POS) Ultra-rápido**
  - Checkout em 15 segundos
  - Cálculo de lucro em tempo real
  - Múltiplos métodos de pagamento

- **Anti-Fraude Avançado**
  - Fechamento de caixa cego
  - Logs de auditoria completos
  - Hierarquia de permissões (4 níveis)

- **Inteligência Financeira**
  - Dashboard ao vivo com notificações sonoras
  - Análise de produtos mais/menos lucrativos
  - Recibo digital via WhatsApp/Email

- **Notificações em Tempo Real**
  - Vendas instantâneas no dashboard do admin
  - Alertas no celular via WhatsApp Business

## 🛠️ Tecnologias

- **Frontend:** Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend:** Prisma ORM, SQLite (dev) / PostgreSQL (prod)
- **APIs:** WAPI, SendGrid, Twilio (WhatsApp)
- **Deploy:** Vercel (1-click)

## 📦 Instalação (5 minutos)

```bash
# 1. Clone
git clone https://github.com/seu-usuario/bizcontrol-360.git

# 2. Instale dependências
cd bizcontrol-360
npm install

# 3. Configure variáveis
cp .env.example .env
# Edite o arquivo .env

# 4. Prepare banco
npx prisma generate
npx prisma db push
npx tsx prisma/seed.ts

# 5. Execute
npm run dev
# Acesse http://localhost:3000
```

## 🔑 Credenciais Padrão (Dev)

| Role | Email | Senha |
|------|-------|-------|
| **Admin** | admin@bizcontrol.com | admin123 |
| **Manager** | manager@bizcontrol.com | manager123 |
| **Operator** | operator@bizcontrol.com | operator123 |
