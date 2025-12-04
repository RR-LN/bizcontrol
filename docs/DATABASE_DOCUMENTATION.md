# Documentação do Banco de Dados: BizControl 360

## 1. Visão Geral
*   **Sistema de Banco de Dados:** SQLite (fornecido pelo Prisma ORM).
*   **ORM/Ferramenta de Gestão:** Prisma ORM.
*   **Descrição Geral:** O banco de dados é o núcleo do BizControl 360, armazenando toda a informação crítica de produtos, vendas, usuários, movimentações de estoque, transações financeiras e fechamentos de caixa. O sistema oferece uma solução completa para gestão empresarial com funcionalidades de controle de acesso, inventário, vendas, finanças e relatórios operacionais.

## 2. Modelo de Dados (Schema)
*   Esta seção detalha cada tabela do banco de dados, organizadas por módulos funcionais.

### MÓDULO: GERENCIAMENTO DE USUÁRIOS E AUTENTICAÇÃO

#### Tabela: `users`
*   **Propósito:** Armazena os dados de autenticação e perfil de todos os usuários do sistema, incluindo informações de segurança e atividades.
*   **Colunas:**

| Nome da Coluna | Tipo de Dado | Restrições | Descrição |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY` | Identificador único do usuário. |
| `email` | `STRING` | `UNIQUE`, `NOT NULL` | Email de login do usuário. |
| `password` | `STRING` | `NOT NULL` | Senha criptografada do usuário. |
| `firstName` | `STRING?` | | Primeiro nome do usuário. |
| `lastName` | `STRING?` | | Sobrenome do usuário. |
| `phone` | `STRING?` | | Telefone de contato do usuário. |
| `role` | `ENUM('ADMIN', 'MANAGER', 'OPERATOR', 'VIEWER')` | `NOT NULL` | Papel do usuário no sistema. |
| `isActive` | `BOOLEAN` | `DEFAULT true` | Status de ativação do usuário. |
| `isLocked` | `BOOLEAN` | `DEFAULT false` | Indica se a conta está bloqueada. |
| `lockedUntil` | `DATETIME?` | | Data/hora até quando a conta permanece bloqueada. |
| `failedLoginAttempts` | `INTEGER` | `DEFAULT 0` | Número de tentativas de login fracassadas. |
| `lastLogin` | `DATETIME?` | | Data/hora do último login bem-sucedido. |
| `passwordChangedAt` | `DATETIME?` | | Data da última alteração de senha. |
| `twoFactorEnabled` | `BOOLEAN` | `DEFAULT false` | Habilita autenticação de dois fatores. |
| `twoFactorSecret` | `STRING?` | | Segredo para autenticação 2FA. |
| `backupCodes` | `STRING?` | | Códigos de backup para recuperação de conta. |
| `createdAt` | `DATETIME` | `DEFAULT NOW()` | Data e hora de criação do registro. |
| `updatedAt` | `DATETIME` | `UPDATED_AT` | Data e hora da última atualização. |

#### Tabela: `user_activities`
*   **Propósito:** Registra todas as atividades dos usuários para auditoria e segurança.
*   **Colunas:**

| Nome da Coluna | Tipo de Dado | Restrições | Descrição |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY` | Identificador único da atividade. |
| `userId` | `UUID` | `FOREIGN KEY` | Referência ao usuário que executou a ação. |
| `actionType` | `ENUM('LOGIN', 'LOGOUT', 'PASSWORD_CHANGE', 'PROFILE_UPDATE', 'FAILED_LOGIN')` | `NOT NULL` | Tipo de atividade executada. |
| `ipAddress` | `STRING?` | | Endereço IP da atividade. |
| `userAgent` | `STRING?` | | Informações do navegador/dispositivo. |
| `details` | `STRING?` | | Detalhes adicionais da atividade. |
| `timestamp` | `DATETIME` | `DEFAULT NOW()` | Data e hora da atividade. |

#### Tabela: `user_permissions`
*   **Propósito:** Define permissões granulares por módulo para cada usuário.
*   **Colunas:**

| Nome da Coluna | Tipo de Dado | Restrições | Descrição |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY` | Identificador único da permissão. |
| `userId` | `UUID` | `FOREIGN KEY` | Referência ao usuário. |
| `module` | `STRING` | `NOT NULL` | Nome do módulo do sistema. |
| `permission` | `STRING` | `NOT NULL` | Tipo de permissão (ex: read, write, delete). |

#### Tabela: `user_sessions`
*   **Propósito:** Gerencia sessões ativas dos usuários no sistema.
*   **Colunas:**

| Nome da Coluna | Tipo de Dado | Restrições | Descrição |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY` | Identificador único da sessão. |
| `userId` | `UUID` | `FOREIGN KEY` | Referência ao usuário da sessão. |
| `sessionKey` | `STRING` | `UNIQUE` | Chave única da sessão. |
| `ipAddress` | `STRING?` | | Endereço IP da sessão. |
| `userAgent` | `STRING?` | | Informações do dispositivo. |
| `lastActivity` | `DATETIME` | `DEFAULT NOW()` | Última atividade na sessão. |
| `createdAt` | `DATETIME` | `DEFAULT NOW()` | Data e hora de criação da sessão. |

### MÓDULO: GERENCIAMENTO DE INVENTÁRIO

#### Tabela: `suppliers`
*   **Propósito:** Armazena informações dos fornecedores de produtos.
*   **Colunas:**

| Nome da Coluna | Tipo de Dado | Restrições | Descrição |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY` | Identificador único do fornecedor. |
| `name` | `STRING` | `NOT NULL` | Nome do fornecedor. |
| `code` | `STRING?` | | Código interno do fornecedor. |
| `contactPerson` | `STRING?` | | Nome da pessoa de contato. |
| `email` | `STRING?` | | Email do fornecedor. |
| `phone` | `STRING?` | | Telefone do fornecedor. |
| `address` | `STRING?` | | Endereço completo. |
| `city` | `STRING?` | | Cidade do fornecedor. |
| `country` | `STRING?` | | País do fornecedor. |
| `notes` | `STRING?` | | Observações adicionais. |
| `isActive` | `BOOLEAN` | `DEFAULT true` | Status de ativação. |
| `createdAt` | `DATETIME` | `DEFAULT NOW()` | Data de criação. |
| `updatedAt` | `DATETIME` | `UPDATED_AT` | Data da última atualização. |

#### Tabela: `warehouses`
*   **Propósito:** Define os depósitos/almoxarifados do sistema.
*   **Colunas:**

| Nome da Coluna | Tipo de Dado | Restrições | Descrição |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY` | Identificador único do depósito. |
| `name` | `STRING` | `NOT NULL` | Nome do depósito. |
| `code` | `STRING` | `UNIQUE` | Código único do depósito. |
| `address` | `STRING?` | | Endereço do depósito. |
| `phone` | `STRING?` | | Telefone do depósito. |
| `isActive` | `BOOLEAN` | `DEFAULT true` | Status de ativação. |
| `notes` | `STRING?` | | Observações do depósito. |
| `createdAt` | `DATETIME` | `DEFAULT NOW()` | Data de criação. |
| `updatedAt` | `DATETIME` | `UPDATED_AT` | Data da última atualização. |

#### Tabela: `warehouse_zones`
*   **Propósito:** Organiza zonas dentro de cada depósito.
*   **Colunas:**

| Nome da Coluna | Tipo de Dado | Restrições | Descrição |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY` | Identificador único da zona. |
| `warehouseId` | `UUID` | `FOREIGN KEY` | Referência ao depósito. |
| `name` | `STRING` | `NOT NULL` | Nome da zona. |
| `code` | `STRING` | `NOT NULL` | Código da zona (único por depósito). |
| `description` | `STRING?` | | Descrição da zona. |

#### Tabela: `warehouse_locations`
*   **Propósito:** Define localizações específicas dentro das zonas (rua, estante, prateleira, bin).
*   **Colunas:**

| Nome da Coluna | Tipo de Dado | Restrições | Descrição |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY` | Identificador único da localização. |
| `zoneId` | `UUID` | `FOREIGN KEY` | Referência à zona do depósito. |
| `aisle` | `STRING` | `NOT NULL` | Identificação da rua. |
| `rack` | `STRING` | `NOT NULL` | Identificação da estante. |
| `shelf` | `STRING` | `NOT NULL` | Identificação da prateleira. |
| `bin` | `STRING` | `NOT NULL` | Identificação do bin/box. |
| `isActive` | `BOOLEAN` | `DEFAULT true` | Status de ativação. |

#### Tabela: `categories`
*   **Propósito:** Organiza produtos em categorias hierárquicas.
*   **Colunas:**

| Nome da Coluna | Tipo de Dado | Restrições | Descrição |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY` | Identificador único da categoria. |
| `name` | `STRING` | `UNIQUE` | Nome único da categoria. |
| `description` | `STRING?` | | Descrição da categoria. |
| `parentId` | `UUID?` | `FOREIGN KEY` | Categoria pai para hierarquia. |
| `createdAt` | `DATETIME` | `DEFAULT NOW()` | Data de criação. |
| `updatedAt` | `DATETIME` | `UPDATED_AT` | Data da última atualização. |

#### Tabela: `products`
*   **Propósito:** Catálogo completo de produtos do sistema com informações financeiras e de controle de estoque.
*   **Colunas:**

| Nome da Coluna | Tipo de Dado | Restrições | Descrição |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY` | Identificador único do produto. |
| `code` | `STRING` | `UNIQUE` | Código interno do produto. |
| `name` | `STRING` | `NOT NULL` | Nome do produto. |
| `description` | `STRING?` | | Descrição detalhada do produto. |
| `type` | `ENUM('SIMPLE', 'VARIABLE', 'COMPOSITE', 'SERVICE')` | `DEFAULT SIMPLE` | Tipo de produto. |
| `categoryId` | `UUID?` | `FOREIGN KEY` | Categoria do produto. |
| `supplierId` | `UUID?` | `FOREIGN KEY` | Fornecedor principal. |
| `sku` | `STRING?` | `UNIQUE` | Código SKU único. |
| `barcode` | `STRING?` | `UNIQUE` | Código de barras. |
| `image` | `STRING?` | | URL da imagem do produto. |
| `costPrice` | `DECIMAL` | `DEFAULT 0` | Preço de custo do produto. |
| `sellingPrice` | `DECIMAL` | `NOT NULL` | Preço de venda. |
| `taxRate` | `DECIMAL` | `DEFAULT 0` | Taxa de imposto aplicada. |
| `minStockLevel` | `INTEGER` | `DEFAULT 0` | Nível mínimo de estoque. |
| `maxStockLevel` | `INTEGER?` | | Nível máximo de estoque. |
| `reorderPoint` | `INTEGER` | `DEFAULT 0` | Ponto de reposição automática. |
| `reorderQuantity` | `INTEGER` | `DEFAULT 0` | Quantidade para reposição. |
| `isActive` | `BOOLEAN` | `DEFAULT true` | Status de ativação. |
| `trackInventory` | `BOOLEAN` | `DEFAULT true` | Controlar estoque do produto. |
| `allowBackorder` | `BOOLEAN` | `DEFAULT false` | Permitir vendas sem estoque. |
| `createdById` | `UUID` | `FOREIGN KEY` | Usuário que criou o produto. |
| `updatedById` | `UUID?` | `FOREIGN KEY` | Usuário que atualizou o produto. |
| `createdAt` | `DATETIME` | `DEFAULT NOW()` | Data de criação. |
| `updatedAt` | `DATETIME` | `UPDATED_AT` | Data da última atualização. |

#### Tabela: `stocks`
*   **Propósito:** Controla quantidades de produtos em cada depósito.
*   **Colunas:**

| Nome da Coluna | Tipo de Dado | Restrições | Descrição |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY` | Identificador único do estoque. |
| `productId` | `UUID` | `FOREIGN KEY` | Referência ao produto. |
| `warehouseId` | `UUID` | `FOREIGN KEY` | Referência ao depósito. |
| `quantity` | `INTEGER` | `DEFAULT 0` | Quantidade disponível. |
| `reserved` | `INTEGER` | `DEFAULT 0` | Quantidade reservada. |
| `updatedAt` | `DATETIME` | `UPDATED_AT` | Data da última atualização. |

#### Tabela: `stock_movements`
*   **Propósito:** Registra todas as movimentações de estoque para auditoria.
*   **Colunas:**

| Nome da Coluna | Tipo de Dado | Restrições | Descrição |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY` | Identificador único da movimentação. |
| `productId` | `UUID` | `FOREIGN KEY` | Referência ao produto movimentado. |
| `type` | `STRING` | `NOT NULL` | Tipo: IN, OUT, ADJUSTMENT, TRANSFER. |
| `quantity` | `INTEGER` | `NOT NULL` | Quantidade movimentada. |
| `reason` | `STRING?` | | Motivo da movimentação. |
| `reference` | `STRING?` | | Referência externa (pedido, nota, etc.). |
| `userId` | `UUID` | `FOREIGN KEY` | Usuário que executou a movimentação. |
| `createdAt` | `DATETIME` | `DEFAULT NOW()` | Data da movimentação. |

### MÓDULO: GERENCIAMENTO DE PEDIDOS E VENDAS

#### Tabela: `customers`
*   **Propósito:** Base de dados de clientes para vendas e relacionamento.
*   **Colunas:**

| Nome da Coluna | Tipo de Dado | Restrições | Descrição |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY` | Identificador único do cliente. |
| `name` | `STRING` | `NOT NULL` | Nome completo do cliente. |
| `email` | `STRING?` | | Email do cliente. |
| `phone` | `STRING?` | | Telefone do cliente. |
| `address` | `STRING?` | | Endereço completo. |
| `city` | `STRING?` | | Cidade do cliente. |
| `country` | `STRING?` | | País do cliente. |
| `taxId` | `STRING?` | | CPF/CNPJ do cliente. |
| `notes` | `STRING?` | | Observações do cliente. |
| `isActive` | `BOOLEAN` | `DEFAULT true` | Status de ativação. |
| `createdAt` | `DATETIME` | `DEFAULT NOW()` | Data de criação. |
| `updatedAt` | `DATETIME` | `UPDATED_AT` | Data da última atualização. |

#### Tabela: `orders`
*   **Propósito:** Registra pedidos de venda com status e valores financeiros.
*   **Colunas:**

| Nome da Coluna | Tipo de Dado | Restrições | Descrição |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY` | Identificador único do pedido. |
| `orderNumber` | `STRING` | `UNIQUE` | Número único do pedido. |
| `customerId` | `UUID?` | `FOREIGN KEY` | Cliente associated ao pedido. |
| `status` | `ENUM('DRAFT', 'PENDING', 'APPROVED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURNED')` | `DEFAULT DRAFT` | Status atual do pedido. |
| `paymentStatus` | `ENUM('PENDING', 'PARTIAL', 'PAID', 'REFUNDED', 'CANCELLED')` | `DEFAULT PENDING` | Status do pagamento. |
| `subtotal` | `DECIMAL` | `DEFAULT 0` | Subtotal sem impostos e descontos. |
| `discountAmount` | `DECIMAL` | `DEFAULT 0` | Valor do desconto aplicado. |
| `discountPercent` | `DECIMAL` | `DEFAULT 0` | Percentual de desconto. |
| `taxAmount` | `DECIMAL` | `DEFAULT 0` | Valor total dos impostos. |
| `shippingCost` | `DECIMAL` | `DEFAULT 0` | Custo de frete/envio. |
| `totalAmount` | `DECIMAL` | `DEFAULT 0` | Valor total do pedido. |
| `notes` | `STRING?` | | Observações do pedido. |
| `createdById` | `UUID` | `FOREIGN KEY` | Usuário que criou o pedido. |
| `approvedById` | `UUID?` | `FOREIGN KEY` | Usuário que aprovou o pedido. |
| `approvedAt` | `DATETIME?` | | Data de aprovação. |
| `createdAt` | `DATETIME` | `DEFAULT NOW()` | Data de criação. |
| `updatedAt` | `DATETIME` | `UPDATED_AT` | Data da última atualização. |

#### Tabela: `order_items`
*   **Propósito:** Detalha os produtos incluidos em cada pedido.
*   **Colunas:**

| Nome da Coluna | Tipo de Dado | Restrições | Descrição |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY` | Identificador único do item. |
| `orderId` | `UUID` | `FOREIGN KEY` | Referência ao pedido. |
| `productId` | `UUID` | `FOREIGN KEY` | Produto incluido no pedido. |
| `quantity` | `INTEGER` | `DEFAULT 1` | Quantidade do produto. |
| `unitPrice` | `DECIMAL` | `NOT NULL` | Preço unitário de venda. |
| `unitCost` | `DECIMAL` | `DEFAULT 0` | Custo unitário do produto. |
| `discountPercent` | `DECIMAL` | `DEFAULT 0` | Percentual de desconto no item. |
| `taxPercent` | `DECIMAL` | `DEFAULT 0` | Percentual de imposto no item. |
| `totalPrice` | `DECIMAL` | `NOT NULL` | Preço total do item. |
| `notes` | `STRING?` | | Observações do item. |

### MÓDULO: TRANSAÇÕES E PAGAMENTOS

#### Tabela: `transactions`
*   **Propósito:** Registra todas as transações financeiras do sistema.
*   **Colunas:**

| Nome da Coluna | Tipo de Dado | Restrições | Descrição |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY` | Identificador único da transação. |
| `orderId` | `UUID` | `FOREIGN KEY` | Pedido associated à transação. |
| `paymentMethod` | `ENUM('CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'BANK_TRANSFER', 'DIGITAL_WALLET', 'PIX', 'OTHER')` | `NOT NULL` | Método de pagamento utilizado. |
| `amount` | `DECIMAL` | `NOT NULL` | Valor da transação. |
| `status` | `ENUM('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED', 'CANCELLED')` | `DEFAULT PENDING` | Status da transação. |
| `reference` | `STRING?` | | Referência externa da transação. |
| `receiptUrl` | `STRING?` | | URL do comprovante/ receipt. |
| `notes` | `STRING?` | | Observações da transação. |
| `processedById` | `UUID` | `FOREIGN KEY` | Usuário que processou a transação. |
| `processedAt` | `DATETIME` | `DEFAULT NOW()` | Data de processamento. |
| `createdAt` | `DATETIME` | `DEFAULT NOW()` | Data de criação. |

### MÓDULO: FECHAMENTO DE CAIXA

#### Tabela: `cash_closings`
*   **Propósito:** Gerencia fechamentos de caixa cego para controle financeiro e auditoria.
*   **Colunas:**

| Nome da Coluna | Tipo de Dado | Restrições | Descrição |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY` | Identificador único do fechamento. |
| `userId` | `UUID` | `FOREIGN KEY` | Usuário que realizó o fechamento. |
| `cashCounted` | `DECIMAL` | `NOT NULL` | Valor em dinheiro contado. |
| `cardCounted` | `DECIMAL` | `NOT NULL` | Valor em cartão contado. |
| `pixCounted` | `DECIMAL` | `NOT NULL` | Valor em PIX contado. |
| `totalCounted` | `DECIMAL` | `NOT NULL` | Total contado pelo operador. |
| `cashExpected` | `DECIMAL` | `NOT NULL` | Valor em dinheiro esperado do sistema. |
| `cardExpected` | `DECIMAL` | `NOT NULL` | Valor em cartão esperado do sistema. |
| `pixExpected` | `DECIMAL` | `NOT NULL` | Valor em PIX esperado do sistema. |
| `totalExpected` | `DECIMAL` | `NOT NULL` | Total esperado do sistema. |
| `cashDifference` | `DECIMAL` | `NOT NULL` | Diferença em dinheiro (sobra/falta). |
| `cardDifference` | `DECIMAL` | `NOT NULL` | Diferença em cartão. |
| `pixDifference` | `DECIMAL` | `NOT NULL` | Diferença em PIX. |
| `totalDifference` | `DECIMAL` | `NOT NULL` | Diferença total. |
| `notes` | `STRING?` | | Observações do operador. |
| `status` | `STRING` | `DEFAULT "CLOSED"` | Status: CLOSED, REVIEWED, FLAGGED. |
| `hasAlert` | `BOOLEAN` | `DEFAULT false` | Alerta para diferença significativa. |
| `alertReviewedBy` | `STRING?` | | Usuário que revisou o alerta. |
| `alertReviewedAt` | `DATETIME?` | | Data da revisão do alerta. |
| `closingDate` | `DATETIME` | `DEFAULT NOW()` | Data do fechamento. |
| `createdAt` | `DATETIME` | `DEFAULT NOW()` | Data de criação. |

### MÓDULO: CONFIGURAÇÕES DO SISTEMA

#### Tabela: `settings`
*   **Propósito:** Armazena configurações globais do sistema.
*   **Colunas:**

| Nome da Coluna | Tipo de Dado | Restrições | Descrição |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY` | Identificador único da configuração. |
| `key` | `STRING` | `UNIQUE` | Chave única da configuração. |
| `value` | `STRING` | `NOT NULL` | Valor da configuração. |
| `description` | `STRING?` | | Descrição da configuração. |
| `updatedAt` | `DATETIME` | `UPDATED_AT` | Data da última atualização. |
| `createdAt` | `DATETIME` | `DEFAULT NOW()` | Data de criação. |

## 3. Relacionamentos (Relacionamentos entre Tabelas)

### Relacionamentos Principais:

*   **Usuários e Atividades**: A tabela `user_activities` possui `userId` que referencia `users.id`, registrando todas as ações dos usuários.
*   **Usuários e Permissões**: A tabela `user_permissions` possui `userId` que referencia `users.id`, definindo permissões granulares.
*   **Usuários e Sessões**: A tabela `user_sessions` possui `userId` que referencia `users.id`, gerenciando sessões ativas.
*   **Usuários e Produtos**: A tabela `products` possui `createdById` e `updatedById` que referenciam `users.id`, rastreando quem criou/alterou produtos.
*   **Usuários e Movimentações**: A tabela `stock_movements` possui `userId` que referencia `users.id`, identificando quem executou movimentações.
*   **Usuários e Pedidos**: A tabela `orders` possui `createdById` e `approvedById` que referenciam `users.id`, rastreando criação e aprovação.
*   **Usuários e Transações**: A tabela `transactions` possui `processedById` que referencia `users.id`, identificando quem processou pagamentos.
*   **Usuários e Fechamentos**: A tabela `cash_closings` possui `userId` que referencia `users.id`, rastreando fechamentos de caixa.

*   **Categorias Hierárquicas**: A tabela `categories` possui `parentId` que referencia `categories.id`, criando uma estrutura hierárquica.
*   **Produtos e Categorias**: A tabela `products` possui `categoryId` que referencia `categories.id`, organizando produtos por categoria.
*   **Produtos e Fornecedores**: A tabela `products` possui `supplierId` que referencia `suppliers.id`, associando produtos a fornecedores.
*   **Produtos e Estoque**: A tabela `stocks` possui `productId` que referencia `products.id`, controlando quantidades por produto.
*   **Produtos e Movimentações**: A tabela `stock_movements` possui `productId` que referencia `products.id`, rastreando movimentações de produtos.
*   **Produtos e Itens de Pedido**: A tabela `order_items` possui `productId` que referencia `products.id`, definindo produtos vendidos.

*   **Depósitos e Zonas**: A tabela `warehouse_zones` possui `warehouseId` que referencia `warehouses.id`, organizando zonas por depósito.
*   **Zonas e Localizações**: A tabela `warehouse_locations` possui `zoneId` que referencia `warehouse_zones.id`, definindo localizações específicas.
*   **Depósitos e Estoque**: A tabela `stocks` possui `warehouseId` que referencia `warehouses.id`, controlando estoque por depósito.

*   **Clientes e Pedidos**: A tabela `orders` possui `customerId` que referencia `customers.id`, associando pedidos a clientes.
*   **Pedidos e Itens**: A tabela `order_items` possui `orderId` que referencia `orders.id`, detalhando produtos por pedido.
*   **Pedidos e Transações**: A tabela `transactions` possui `orderId` que referencia `orders.id`, associando pagamentos a pedidos.

## 4. Enums e Tipos Personalizados

*   **UserRole**: `('ADMIN', 'MANAGER', 'OPERATOR', 'VIEWER')`
    *   Define os níveis de acesso dos usuários no sistema.

*   **UserActivityType**: `('LOGIN', 'LOGOUT', 'PASSWORD_CHANGE', 'PROFILE_UPDATE', 'FAILED_LOGIN')`
    *   Tipos de atividades auditadas para segurança.

*   **ProductType**: `('SIMPLE', 'VARIABLE', 'COMPOSITE', 'SERVICE')`
    *   Classificação dos tipos de produtos no catálogo.

*   **OrderStatus**: `('DRAFT', 'PENDING', 'APPROVED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURNED')`
    *   Estados do ciclo de vida de pedidos.

*   **PaymentStatus**: `('PENDING', 'PARTIAL', 'PAID', 'REFUNDED', 'CANCELLED')`
    *   Status dos pagamentos relacionados aos pedidos.

*   **PaymentMethod**: `('CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'BANK_TRANSFER', 'DIGITAL_WALLET', 'PIX', 'OTHER')`
    *   Métodos de pagamento aceitos no sistema.

*   **TransactionStatus**: `('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED', 'CANCELLED')`
    *   Estados das transações financeiras.

## 5. Observações Técnicas

*   **Indices**: As tabelas possuem índices otimizados para consultas frequentes em campos como `userId`, `productId`, `orderId`, datas e status.
*   **Integridade Referencial**: Todas as relações foreign key possuem cascata DELETE para manter consistência dos dados.
*   **Audit Trail**: O sistema mantém um histórico completo de atividades, alterações de produtos e movimentações de estoque.
*   **Segurança**: Senhas são armazenadas de forma criptografada e o sistema implementa controle de tentativas de login.
*   **Flexibilidade**: O esquema permite extensões futuras com campos opcionais e estrutura modular.