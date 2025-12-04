# Documentação Completa da Aplicação: BizControl 360

## 📋 Índice

1. [Visão Geral](#1-visão-geral)
2. [Arquitetura da Aplicação](#2-arquitetura-da-aplicação)
3. [Estrutura do Projeto](#3-estrutura-do-projeto)
4. [API Endpoints](#4-api-endpoints)
5. [Frontend - Páginas e Componentes](#5-frontend---páginas-e-componentes)
6. [Lógica de Negócio](#6-lógica-de-negócio)
7. [Configuração e Setup](#7-configuração-e-setup)
8. [Diretrizes de Desenvolvimento](#8-diretrizes-de-desenvolvimento)
9. [Deploy e Ambiente](#9-deploy-e-ambiente)
10. [Recursos Técnicos](#10-recursos-técnicos)

---

## 1. Visão Geral

### 1.1 Descrição do Sistema

O **BizControl 360** é um sistema ERP (Enterprise Resource Planning) moderno e completo, desenvolvido especificamente para pequenas e médias empresas. O sistema oferece uma solução integrada para gestão empresarial, combinando funcionalidades de inventário, vendas, finanças e relatórios operacionais em uma interface intuitiva e eficiente.

### 1.2 Características Principais

- **🎯 Foco**: Gestão empresarial completa e simplificada
- **🔧 Tecnologia**: Next.js 16, TypeScript, Prisma ORM
- **💾 Banco de Dados**: SQLite (desenvolvimento) / PostgreSQL (produção)
- **🎨 Interface**: Modern, responsive, dark/light theme
- **📱 Mobile-First**: Design responsivo para todos os dispositivos
- **⚡ Performance**: Otimizado com React Query e caching inteligente

### 1.3 Módulos Principais

1. **Gestão de Usuários e Autenticação**
2. **Controle de Inventário**
3. **Ponto de Venda (POS)**
4. **Gestão de Pedidos e Vendas**
5. **Relatórios e Analytics**
6. **Fechamento de Caixa**
7. **Configurações do Sistema**

---

## 2. Arquitetura da Aplicação

### 2.1 Stack Tecnológico

```
Frontend:          Next.js 16 (React 19) + TypeScript
Backend:           Next.js API Routes + Prisma ORM
Database:          SQLite (dev) / PostgreSQL (prod)
Styling:           TailwindCSS + Radix UI
State Management:  React Query + Zustand
Authentication:    NextAuth.js (custom implementation)
Charts:            Recharts
Notifications:     Sonner + Toast
Forms:             React Hook Form + Zod
HTTP Client:       Axios
Deployment:        Vercel (recomendado)
```

### 2.2 Padrões Arquiteturais

#### **Frontend (Client-Side)**
- **App Router**: Utiliza o novo sistema de roteamento do Next.js 13+
- **Server Components**: Componentes servidor quando apropriado
- **Client Components**: Interatividade no cliente
- **Custom Hooks**: Lógica reutilizável encapsulada

#### **Backend (API Routes)**
- **RESTful API**: Endpoints organizados por recurso
- **Prisma ORM**: Abstração de banco de dados type-safe
- **Transações**: Atomicidade para operações críticas
- **Validação**: Zod schemas para validação de dados

#### **Database Layer**
- **Prisma Client**: Cliente TypeScript gerado automaticamente
- **Migrations**: Versionamento de schema de banco
- **Seed Data**: Dados iniciais para desenvolvimento

### 2.3 Fluxo de Dados

```
User Interface → API Routes → Prisma Client → Database
     ↓
React Query Cache ← Response Processing ← Data Serialization
```

---

## 3. Estrutura do Projeto

### 3.1 Diretórios Principais

```
bizcontrol-360/
├── docs/                    # Documentação
├── prisma/                  # Schema e migrations do banco
│   ├── schema.prisma        # Definição do modelo de dados
│   ├── seed.ts              # Dados iniciais
│   └── dev.db              # Banco SQLite (desenvolvimento)
├── public/                  # Assets estáticos
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── api/            # API Routes
│   │   ├── (auth)/         # Rotas de autenticação
│   │   ├── dashboard/      # Painel administrativo
│   │   ├── point-of-sale/  # Interface POS
│   │   ├── products/       # Gestão de produtos
│   │   ├── stock/          # Controle de estoque
│   │   └── ...
│   ├── components/         # Componentes reutilizáveis
│   │   ├── ui/            # Componentes de interface base
│   │   └── providers.tsx  # Context providers
│   ├── lib/               # Utilitários e configurações
│   ├── hooks/             # Custom hooks
│   └── types/             # Definições TypeScript
├── .env.example            # Variáveis de ambiente
├── package.json            # Dependências e scripts
└── tailwind.config.js      # Configuração Tailwind
```

### 3.2 Padrões de Nomenclatura

- **Arquivos**: camelCase para arquivos de código
- **Componentes**: PascalCase
- **Hooks**: use prefix (useHookName)
- **API Routes**: kebab-case para URLs
- **Database**: snake_case para tabelas/campos

---

## 4. API Endpoints

### 4.1 Autenticação

#### POST `/api/auth/login`
**Propósito**: Autenticar usuário no sistema
```typescript
// Request Body
{
  email: string;
  password: string;
}

// Response
{
  success: boolean;
  user: {
    id: string;
    email: string;
    role: 'ADMIN' | 'MANAGER' | 'OPERATOR' | 'VIEWER';
    name: string;
  };
  redirectUrl: string;
}
```

#### POST `/api/logout`
**Propósito**: Desconectar usuário do sistema

#### GET `/api/me`
**Propósito**: Obter informações do usuário atual

### 4.2 Dashboard e Analytics

#### GET `/api/dashboard/kpi`
**Propósito**: Métricas principais do dashboard
```typescript
// Response
{
  success: boolean;
  data: {
    todaySales: number;
    todayProfit: number;
    lowStockCount: number;
    totalOrders: number;
  };
}
```

#### GET `/api/dashboard/sales`
**Propósito**: Dados para gráfico de vendas (7 dias)

#### GET `/api/dashboard/top-products`
**Propósito**: Produtos mais vendidos

#### GET `/api/dashboard/live-sales`
**Propósito**: Vendas em tempo real (real-time updates)

### 4.3 Ponto de Venda (POS)

#### POST `/api/pos/checkout`
**Propósito**: Processar venda completa
```typescript
// Request Body
{
  customerId?: string | null;
  items: {
    productId: string;
    quantity: number;
    unitPrice: number;
  }[];
  paymentMethod: 'CASH' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'BANK_TRANSFER' | 'DIGITAL_WALLET' | 'PIX' | 'OTHER';
  discount?: number;
  notes?: string;
}
```

#### GET `/api/pos/search`
**Propósito**: Buscar produtos para POS

### 4.4 Gestão de Produtos

#### GET `/api/products`
**Propósito**: Listar todos os produtos
- **Query Parameters**: `page`, `limit`, `search`, `category`

#### POST `/api/products`
**Propósito**: Criar novo produto

#### GET `/api/products/[id]`
**Propósito**: Obter produto específico

#### PUT `/api/products/[id]`
**Propósito**: Atualizar produto

#### DELETE `/api/products/[id]`
**Propósito**: Excluir produto

### 4.5 Controle de Estoque

#### GET `/api/stock/alerts`
**Propósito**: Produtos com estoque baixo

#### GET `/api/stock/movements`
**Propósito**: Histórico de movimentações

#### POST `/api/stock/adjust`
**Propósito**: Ajustar estoque manualmente

### 4.6 Gestão Financeira

#### POST `/api/cash-closing`
**Propósito**: Fechamento de caixa

#### POST `/api/send-receipt`
**Propósito**: Enviar comprovante por email/WhatsApp

### 4.7 Configurações

#### GET `/api/settings`
**Propósito**: Obter configurações do sistema

#### PUT `/api/settings`
**Propósito**: Atualizar configurações

---

## 5. Frontend - Páginas e Componentes

### 5.1 Estrutura de Páginas

#### **Landing Page** (`/`)
- Apresentação do sistema
- Recursos e funcionalidades
- Call-to-actions para login/demo

#### **Autenticação** (`/login`)
- Formulário de login moderno
- Validação em tempo real
- Credenciais de demonstração
- Redirecionamento baseado em role

#### **Dashboard** (`/dashboard`)
**Usuários**: Administradores
**Funcionalidades**:
- KPIs em tempo real
- Gráficos de vendas
- Feed de vendas ao vivo
- Alertas de estoque
- Top produtos
- Movimentações recentes

#### **Ponto de Venda** (`/point-of-sale`)
**Usuários**: Operadores
**Funcionalidades**:
- Busca de produtos
- Carrinho de compras
- Múltiplos métodos de pagamento
- Cálculo automático de totais
- Validação de estoque

#### **Gestão de Produtos** (`/products`)
**Usuários**: Administradores, Gerentes
**Funcionalidades**:
- Listagem com filtros
- Formulário de criação/edição
- Upload de imagens
- Gestão de categorias e fornecedores

#### **Controle de Estoque** (`/stock`)
**Usuários**: Gerentes, Administradores
**Funcionalidades**:
- Visualização por depósito
- Movimentações
- Alertas de reposição
- Ajustes manuais

### 5.2 Componentes UI

#### **Componentes Base** (`src/components/ui/`)
- `button.tsx` - Botões estilizados
- `input.tsx` - Campos de entrada
- `card.tsx` - Containers de conteúdo
- `dialog.tsx` - Modais
- `table.tsx` - Tabelas de dados
- `badge.tsx` - Etiquetas e status
- `tooltip.tsx` - Dicas contextuais
- `popover.tsx` - Popovers
- `avatar.tsx` - Avatars de usuário
- `skeleton.tsx` - Estados de carregamento

#### **Componentes de Negócio**
- `NotificationBell.tsx` - Notificações do sistema
- `StockAlertToast.tsx` - Alertas de estoque
- Providers (QueryClient, Theme, Auth)

### 5.3 Hooks Personalizados

#### `useDebounce`
```typescript
// Previne requisições excessivas durante busca
const debouncedSearch = useDebounce(searchQuery, 300)
```

#### Outros Hooks
- `useAuth` - Gerenciamento de autenticação
- `useCart` - Estado do carrinho POS
- `useStock` - Operações de estoque
- `useDashboard` - Dados do dashboard

### 5.4 Sistema de Estado

#### **React Query**
- Cache inteligente de dados
- Sincronização automática
- Estados de loading/error
- Refetch em background

#### **Zustand** (preparado para uso futuro)
- Estado global leve
- Para dados compartilhados entre componentes

---

## 6. Lógica de Negócio

### 6.1 Fluxos Principais

#### **Processo de Venda (POS)**
```
1. Busca de Produto → 
2. Adição ao Carrinho → 
3. Cálculo de Totais → 
4. Seleção de Pagamento → 
5. Validação de Estoque → 
6. Processamento da Venda → 
7. Atualização de Estoque → 
8. Registro de Transação → 
9. Envio de Comprovante
```

#### **Gestão de Estoque**
```
Entrada: Compra/Recebimento → 
Atualização de Quantidade → 
Registro de Movimento → 
Verificação de Níveis → 
Geração de Alertas

Saída: Venda/Transferência → 
Dedução de Quantidade → 
Registro de Movimento → 
Verificação de Reposição
```

#### **Fechamento de Caixa**
```
Contagem Física (CEGO) → 
Comparação com Sistema → 
Cálculo de Diferenças → 
Registro de Divergências → 
Alertas para Gestão
```

### 6.2 Regras de Negócio

#### **Controle de Acesso**
- **ADMIN**: Acesso total ao sistema
- **MANAGER**: Gestão de estoque e relatórios
- **OPERATOR**: Operações de venda (POS)
- **VIEWER**: Apenas visualização

#### **Gestão de Estoque**
- Validação antes de cada venda
- Movimento automático de saída
- Alertas automáticos por níveis mínimos
- Auditoria completa de movimentações

#### **Processamento de Pagamentos**
- Suporte a múltiplos métodos
- Validação de valores
- Registro de transações
- Geração de comprovantes

### 6.3 Validações e Consistência

#### **Validações de Produto**
- Código único obrigatório
- Preço de venda >= preço de custo
- Controle de estoque opcional
- Categorização hierárquica

#### **Validações de Venda**
- Carrinho não vazio
- Estoque suficiente
- Pagamento válido
- Cliente opcional

---

## 7. Configuração e Setup

### 7.1 Pré-requisitos

- **Node.js**: 18+ (recomendado 20+)
- **npm/yarn**: Gerenciador de pacotes
- **Git**: Controle de versão
- **VS Code**: Editor recomendado

### 7.2 Instalação

```bash
# 1. Clonar repositório
git clone [repository-url]
cd bizcontrol-360

# 2. Instalar dependências
npm install

# 3. Configurar ambiente
cp .env.example .env

# 4. Configurar banco de dados
npx prisma generate
npx prisma db push
npm run db:seed

# 5. Executar em desenvolvimento
npm run dev
```

### 7.3 Variáveis de Ambiente

```env
# Database
DATABASE_URL="file:./prisma/dev.db"

# NextAuth
NEXTAUTH_SECRET="sua-chave-secreta-aleatoria"
NEXTAUTH_URL="http://localhost:3000"

# Cloudinary (Upload de Imagens)
CLOUDINARY_CLOUD_NAME="seu-cloud-name"
CLOUDINARY_API_KEY="sua-api-key"
CLOUDINARY_API_SECRET="sua-api-secret"

# WhatsApp API (WAPI)
WAPI_API_KEY="seu-token-whatsapp"
WAPI_PHONE_NUMBER_ID="seu-phone-id"
ADMIN_WHATSAPP_NUMBER="+244999999999"

# SendGrid (Email)
SENDGRID_API_KEY="sua-sendgrid-api-key"
SENDGRID_FROM_EMAIL="noreply@bizcontrol360.com"
```

### 7.4 Scripts Disponíveis

```json
{
  "dev": "next dev --turbopack",
  "build": "next build",
  "start": "next start",
  "lint": "eslint",
  "db:generate": "prisma generate",
  "db:push": "prisma db push",
  "db:migrate": "prisma migrate dev",
  "db:studio": "prisma studio",
  "db:seed": "tsx prisma/seed.ts"
}
```

---

## 8. Diretrizes de Desenvolvimento

### 8.1 Padrões de Código

#### **TypeScript**
- Sempre usar tipos explícitos
- Interface para props de componentes
- Tipos para API responses
- Evitar `any` sempre que possível

#### **Componentes React**
```typescript
// Exemplo de componente bem estruturado
interface ComponentProps {
  title: string;
  variant?: 'primary' | 'secondary';
}

export function Component({ title, variant = 'primary' }: ComponentProps) {
  return (
    <div className={`component component--${variant}`}>
      {title}
    </div>
  )
}
```

#### **API Routes**
```typescript
// Estrutura padrão de API route
export async function GET(request: Request) {
  try {
    // Validação de parâmetros
    // Lógica de negócio
    // Resposta padronizada
    
    return NextResponse.json({
      success: true,
      data: result
    })
  } catch (error) {
    return NextResponse.json(
      { error: "Mensagem de erro" },
      { status: 400 }
    )
  }
}
```

### 8.2 Estrutura de Commits

```
tipo(scope): descrição breve

descrição mais detalhada se necessário

- Item 1
- Item 2
- Item 3
```

**Tipos**:
- `feat`: Nova funcionalidade
- `fix`: Correção de bug
- `docs`: Documentação
- `style`: Formatação (sem mudança lógica)
- `refactor`: Refatoração
- `test`: Adição de testes
- `chore`: Tarefas de build/deploy

### 8.3 Performance

#### **Frontend**
- Lazy loading de componentes
- Memoização com React.memo
- Debounce para buscas
- React Query para cache

#### **Backend**
- Paginação para listagens
- Índices no banco de dados
- Transações para atomicidade
- Caching de queries frequentes

### 8.4 Segurança

#### **Autenticação**
- Hashing de senhas com bcrypt
- Sessões seguras com cookies
- Validação de tokens
- Controle de tentativas de login

#### **Dados**
- Sanitização de inputs
- Validação de dados
- SQL injection prevention (Prisma)
- XSS protection

---

## 9. Deploy e Ambiente

### 9.1 Ambiente de Desenvolvimento

#### **Configuração Local**
```bash
# Banco SQLite para desenvolvimento
DATABASE_URL="file:./prisma/dev.db"

# Servidor local
npm run dev
# http://localhost:3000
```

#### **Ferramentas de Desenvolvimento**
- **Prisma Studio**: Interface visual do banco
- **React DevTools**: Debug de componentes
- **Next.js DevTools**: Análise de performance

### 9.2 Ambiente de Produção

#### **Banco de Dados PostgreSQL**
```env
# Produção
DATABASE_URL="postgresql://user:password@host:5432/database"
```

#### **Variáveis de Produção**
- NEXTAUTH_URL: URL do domínio
- NEXTAUTH_SECRET: Chave secreta forte
- DATABASE_URL: PostgreSQL production
- Keys de serviços externos

### 9.3 Deploy no Vercel

#### **Configuração Automática**
1. Conectar repositório no Vercel
2. Variáveis de ambiente configuradas
3. Build automático
4. Deploy contínuo

#### **Build Settings**
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm install"
}
```

### 9.4 Monitoramento

#### **Logs**
- Erros de API
- Performance de queries
- Autenticação e segurança
- Operações de negócio

#### **Métricas**
- Tempo de resposta das APIs
- Uso de memória
- Performance do banco
- Atividade dos usuários

---

## 10. Recursos Técnicos

### 10.1 Dependências Principais

#### **Core Framework**
- `next@16.0.5` - Framework React
- `react@19.2.0` - Biblioteca UI
- `typescript@5` - Tipagem estática

#### **Backend & Database**
- `prisma@6.1.0` - ORM TypeScript
- `@prisma/client@6.1.0` - Cliente do banco
- `bcryptjs@2.4.3` - Hashing de senhas

#### **UI & Styling**
- `tailwindcss@4` - CSS framework
- `@radix-ui/*` - Componentes acessíveis
- `lucide-react@0.468.0` - Ícones
- `class-variance-authority@0.7.1` - Variantes de estilo

#### **Estado & Dados**
- `@tanstack/react-query@5.64.2` - Server state
- `swr@2.3.7` - Data fetching
- `zustand@5.0.2` - Client state

#### **Charts & Analytics**
- `recharts@2.15.4` - Gráficos React
- `date-fns@4.1.0` - Manipulação de datas

#### **Forms & Validation**
- `react-hook-form@7.54.2` - Formulários
- `@hookform/resolvers@3.9.1` - Validação
- `zod@3.24.1` - Schema validation

#### **Notificações & UX**
- `sonner@2.0.7` - Toast notifications
- `react-hot-toast@2.6.0` - Notificações alternativas
- `next-themes@0.4.6` - Tema escuro/claro

### 10.2 Ferramentas de Desenvolvimento

#### **Code Quality**
- `eslint@9` - Linting
- `eslint-config-next@16.0.5` - Configuração Next.js
- `@typescript-eslint/*` - TypeScript linting

#### **Build & Deploy**
- `tsx@4.20.6` - TypeScript execution
- `tw-animate-css@1.4.0` - Animações

### 10.3 Estrutura de Tipos

#### **Tipos de Base**
```typescript
// Tipos comuns
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
```

#### **Tipos de Domínio**
```typescript
// User, Product, Order, etc. (veja types/index.ts)
```

### 10.4 Extensibilidade

#### **Novos Módulos**
1. Criar tabela no Prisma schema
2. Gerar tipos TypeScript
3. Implementar API routes
4. Criar componentes UI
5. Adicionar páginas
6. Atualizar navegação

#### **Integrações**
- APIs de pagamento
- Sistemas de ERP externos
- WhatsApp Business API
- Serviços de email
- Cloud storage

---

## 📞 Suporte e Contato

### Documentação Adicional
- **Banco de Dados**: `docs/DATABASE_DOCUMENTATION.md`
- **README**: `README.md`
- **Prisma**: https://prisma.io/docs
- **Next.js**: https://nextjs.org/docs

### Desenvolvimento
- **Ambiente**: Desenvolvimento local com SQLite
- **Produção**: PostgreSQL recomendado
- **Deploy**: Vercel (configuração automática)

### Status do Projeto
- ✅ Funcionalidades core implementadas
- ✅ Interface moderna e responsiva
- ✅ Sistema de autenticação
- ✅ Gestão de estoque
- ✅ Ponto de venda
- 🔄 Expansões futuras planejadas

---

**Última Atualização**: Dezembro 2024  
**Versão**: 1.0.0  
**Mantenido por**: Equipe de Desenvolvimento