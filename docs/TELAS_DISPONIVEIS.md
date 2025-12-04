# Telas Disponíveis - BizControl 360

## 📊 Resumo Geral

**Total de Telas**: **12 telas principais**

O sistema BizControl 360 possui **12 telas** distribuídas entre páginas públicas, autenticação e módulos funcionais do sistema.

---

## 🏠 Telas Públicas

### 1. **Home/Landing** - `/`
- **Arquivo**: `src/app/page.tsx`
- **Propósito**: Página inicial com apresentação do sistema
- **Acesso**: Público
- **Funcionalidades**:
  - Apresentação do BizControl 360
  - Recursos e funcionalidades
  - Call-to-actions (Login/Demo)
  - Badges de tecnologias

---

## 🔐 Telas de Autenticação

### 2. **Login** - `/login`
- **Arquivo**: `src/app/login/page.tsx`
- **Propósito**: Autenticação de usuários
- **Acesso**: Público
- **Funcionalidades**:
  - Formulário de login moderno
  - Validação em tempo real
  - Credenciais de demonstração
  - Redirecionamento por role
  - Interface dark/glassmorphism

---

## 📊 Módulo Dashboard (Admin)

### 3. **Dashboard Principal** - `/dashboard`
- **Arquivo**: `src/app/dashboard/page.tsx`
- **Propósito**: Painel administrativo com KPIs
- **Acesso**: Administradores
- **Funcionalidades**:
  - KPIs em tempo real (vendas, lucro, pedidos, estoque)
  - Gráficos de performance de vendas
  - Feed de vendas ao vivo
  - Alertas de estoque crítico
  - Top produtos vendidos
  - Movimentações recentes
  - Notificações sonoras

---

## 🛒 Módulo Ponto de Venda

### 4. **Ponto de Venda** - `/point-of-sale`
- **Arquivo**: `src/app/point-of-sale/page.tsx`
- **Propósito**: Interface de vendas
- **Acesso**: Operadores, Administradores
- **Funcionalidades**:
  - Busca de produtos em tempo real
  - Carrinho de compras intuitivo
  - Controle de quantidades
  - Múltiplos métodos de pagamento
  - Cálculo automático de totais
  - Validação de estoque
  - Processamento de venda

---

## 📦 Módulo Produtos

### 5. **Lista de Produtos** - `/products`
- **Arquivo**: `src/app/products/page.tsx`
- **Propósito**: Gestão completa de produtos
- **Acesso**: Administradores, Gerentes
- **Funcionalidades**:
  - Listagem de produtos com filtros
  - Pesquisa avançada
  - Ações em lote
  - Visualização detalhada

### 6. **Novo Produto** - `/products/new`
- **Arquivo**: `src/app/products/new/page.tsx`
- **Propósito**: Criação de novos produtos
- **Acesso**: Administradores, Gerentes
- **Funcionalidades**:
  - Formulário completo de produto
  - Upload de imagens
  - Seleção de categoria/fornecedor
  - Configuração de preços e estoque
  - Validação de dados

---

## 📦 Módulo Estoque

### 7. **Controle de Estoque** - `/stock`
- **Arquivo**: `src/app/stock/page.tsx`
- **Propósito**: Visualização geral do estoque
- **Acesso**: Administradores, Gerentes
- **Funcionalidades**:
  - Visão geral por depósito
  - Níveis de estoque
  - Status de produtos
  - Relatórios de inventário

### 8. **Alertas de Estoque** - `/stock/alerts`
- **Arquivo**: `src/app/stock/alerts/page.tsx`
- **Propósito**: Produtos com estoque baixo
- **Acesso**: Administradores, Gerentes
- **Funcionalidades**:
  - Lista de produtos críticos
  - Níveis mínimos e atuais
  - Sugestões de reposição
  - Ações de compra rápida

### 9. **Ajustes de Estoque** - `/stock/adjust`
- **Arquivo**: `src/app/stock/adjust/page.tsx`
- **Propósito**: Ajustes manuais de estoque
- **Acesso**: Administradores, Gerentes
- **Funcionalidades**:
  - Formulário de ajuste
  - Seleção de produtos
  - Motivos de ajuste
  - Registro de auditoria

### 10. **Movimentações** - `/stock/movements`
- **Arquivo**: `src/app/stock/movements/page.tsx`
- **Propósito**: Histórico de movimentações
- **Acesso**: Administradores, Gerentes
- **Funcionalidades**:
  - Log completo de entradas/saídas
  - Filtros por período/produto
  - Detalhes de cada movimento
  - Relatórios de auditoria

---

## 💰 Módulo Financeiro

### 11. **Fechamento de Caixa** - `/cash-closing`
- **Arquivo**: `src/app/cash-closing/page.tsx`
- **Propósito**: Fechamento de caixa cego
- **Acesso**: Administradores, Gerentes
- **Funcionalidades**:
  - Interface de contagem cega
  - Comparação com sistema
  - Registro de diferenças
  - Alertas para gestão
  - Relatórios de divergências

---

## ⚙️ Módulo Configurações

### 12. **Configurações de Notificações** - `/settings/notifications`
- **Arquivo**: `src/app/settings/notifications/page.tsx`
- **Propósito**: Configuração do sistema
- **Acesso**: Administradores
- **Funcionalidades**:
  - Configurações de alertas
  - Notificações por email/WhatsApp
  - Configurações gerais do sistema
  - Integrações externas

---

## 🔄 Fluxo de Navegação

### Por Tipo de Usuário

#### **ADMINISTRADOR**
```
/ → /login → /dashboard → [todas as telas]
```

#### **GERENTE**
```
/ → /login → /stock → /products → /cash-closing
```

#### **OPERADOR**
```
/ → /login → /point-of-sale → /products (visualização)
```

### Navegação Principal
```
Home (/)
    ↓
Login (/login)
    ↓
Redirecionamento por Role
    ↓
Dashboard (/dashboard) - ADMIN
Stock (/stock) - MANAGER
POS (/point-of-sale) - OPERATOR
```

---

## 🎨 Padrões de Interface

### Componentes Reutilizáveis
- **Headers padronizados** com navegação
- **Tabelas responsivas** para dados
- **Formulários consistentes** com validação
- **Cards informativos** para KPIs
- **Modais para ações** rápidas

### Design System
- **TailwindCSS** para styling
- **Radix UI** para componentes base
- **Dark theme** como padrão
- **Ícones Lucide** consistentes
- **Responsividade** mobile-first

---

## 📱 Responsividade

### Breakpoints
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

### Adaptações por Tela
- **POS**: Interface otimizada para touch
- **Dashboard**: Layout em grid responsivo
- **Tabelas**: Scroll horizontal em mobile
- **Forms**: Campos adaptados para mobile

---

**Total: 12 telas principais**  
**Última Atualização**: Dezembro 2024