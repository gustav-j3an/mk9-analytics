# MK9 Analytics

Plataforma web de gestão operacional para operações de Trade Marketing, projetada para coordenadores, supervisores e equipe operacional. O sistema centraliza o controle de operações, clientes, lojas, promotores, roteiros, frequências, visitas, evidências, conciliação, importações e dashboards gerenciais.

![MK9 Analytics Dashboard](https://via.placeholder.com/800x400/text:MK9+Analytics+Dashboard)

## Objetivos

- Centralizar dados operacionais de trade marketing em uma única plataforma
- Automatizar a coleta, validação e consolidação de dados de campo
- Fornecer visibilidade em tempo real sobre o desempenho de operações e promotores
- Garantir conformidade através de reconciliação inteligente de evidências
- Reduzir esforço manual em processos de importação e validação de dados
- Oferecer insights acionáveis por meio de dashboards interativos

## Principais Funcionalidades

✅ **Gestão de Operações**
- CRUD completo de operações por mês/ano
- Validação de período com Zod
- Ações: duplicar, fechar, arquivar, reabrir operações
- Geração automática de visitas a partir de promotores, lojas e indústrias

✅ **Cadastros Operacionais**
- CRUD de lojas (filtros por rede, cidade, UF)
- Listagem e criação de promotores
- Gestão de indústrias com código único

✅ **Importação de Planilhas**
- Suporte a `.csv`, `.xls`, `.xlsx`
- Detecção automática de cabeçalhos e tipo de planilha
- Normalização, validação linha a campo e deduplicação por conteúdo
- Preview de até 50 registros com totais de válidos, inválidos e duplicados
- Artefato persistido com hash SHA-256 do arquivo, dados e token
- Token armazenado apenas como hash com expiração de 30 minutos
- Confirmação idempotente protegida contra reutilização e concorrência
- Histórico e indicadores de tentativas de importação

✅ **Motor de Persistência**
- Planejamento transacional de gravação
- Engine de persistência com comparação e gravação atômica
- Mapeamento de linhas normalizadas para entidades de domínio

✅ **Motor de Roteiros**
- Geração automática de roteiros baseado em operações
- Alocação de promotores por loja e frequência
- Validação de sobreposições e conflitos de horário

✅ **Reconciliação Inteligente**
- Comparação automática entre visitas planejadas e evidências recebidas
- Classificação de matches:
  - ✅ `MATCHED`: Evidência corresponde exatamente à visita planejada
  - ⚠️ `DATE_MISMATCH`: Mesma loja/promotor/indústria, mas data diferente
  - ⚠️ `STORE_NOT_FOUND`: Loja na evidência não encontrada na operação
  - ⚠️ `UNPLANNED`: Evidência não corresponde a nenhuma visita planejada
  - ⚠️ `AMBIGUOUS`: Evidência corresponde a múltiplas visitas possíveis
- Sistema de aliases para flexibilização de匹配
- Diagnóstico detalhado de discrepâncias
- Reprocessamento seletivo de evidências

✅ **Dashboards Gerenciais**
- **Dashboard Principal**: KPIs executivos, visitas, operações ativas, alertas críticos, importações recentes, ranking de promotores
- **Operações**: Métricas de cobertura, filtros por operação, visualização de atrasos
- **Visitas**: Execução vs. planejado, atrasos, cobertura por promotor, filtros avançados
- **Importações**: Histórico completo, totais por estado de importação, retry de falhas
- **Promotores**: Equipe completa, busca, filtros por supervisor e operação
- **Reconciliação**: Painel de reconciliação com filtros por operação, status e tipo de discrepância

Todas as páginas possuem:
- Layout responsivo com sidebar recolhível
- Filtros interativos (operações, datas, promotores)
- Exportação de dados para CSV
- Visualizações gráficas com atualização em tempo real
- Indicadores de performance com metas configuráveis

## Arquitetura

### Frontend
- **Next.js 16.2.10** com App Router e React Server Components
- **React 19.2** em modo estrito
- **Tailwind CSS 4** para estilização utility-first
- **shadcn/ui** como biblioteca de componentes baseada em Radix UI
- **Lucide React** para ícones
- Arquitetura baseada em features com separação clara de responsabilidades

### Backend
- **Node.js** com TypeScript 5 em modo `strict`
- **Prisma ORM 6.19** como camada de acesso a dados
- **PostgreSQL** (via Neon) como banco de dados principal
- Arquitetura em camadas:
  - **Route Handlers**: Contrato HTTP e validação de entrada
  - **Serviços**: Casos de uso, validação de negócio, transações
  - **Repositórios**: Acesso ao banco via Prisma
  - **Mappers**: Transformação de linhas normalizadas para entidades de domínio
  - **Persistence Engine**: Planejamento e execução transacional de gravações
  - **Mapping Engine**: Normalização e validação de dados de importação

### Banco de Dados
- **PostgreSQL** hospedado no Neon
- Schema Prisma com modelos para:
  - `User` (ADMIN/SUPERVISOR)
  - `Supervisor`
  - `Promoter`
  - `Industry` (código único)
  - `Store` (código único)
  - `Operation` (mês/ano únicos)
  - `Visit` (relaciona operação, promotor, loja, indústria)
  - `Import` (tentativa de importação e estado)
  - `ImportFile` (metadados e hash único)
  - `ImportPreviewArtifact` (snapshot temporário, token em hash, expiração)
  - `ImportConfirmation` (confirmação idempotente)
  - `SyncLog` (log genérico)
- Enums: `UserRole`, `VisitStatus`, `OperationStatus`

### Infraestrutura
- **Vercel** para deploy de produção
- **Docker Compose** para ambiente local (PostgreSQL 15 + n8n opcional)
- **SheetJS** (`xlsx`) e **Papa Parse** para processamento de planilhas
- **Zod 4** para validação de esquema
- **ESLint 9** com configuração flat format
- **TypeScript Compiler** e **Node.js Test Runner** para qualidade

## Stack

| Categoria | Tecnologia |
|-----------|------------|
| Framework | Next.js 16.2.10 (App Router) |
| Linguagem | TypeScript 5 (modo strict) |
| Frontend | React 19.2, Tailwind CSS 4, shadcn/ui, Lucide React |
| Backend | Node.js, Prisma ORM 6.19 |
| Banco de Dados | PostgreSQL (Neon) |
| Processamento de Planilhas | SheetJS (xlsx), Papa Parse |
| Validação | Zod 4 |
| Qualidade | ESLint 9, TypeScript Compiler |
| Deploy | Vercel |
| Infra Local | Docker Compose (PostgreSQL 15, n8n opcional) |

## Fluxo do Sistema

```mermaid
flowchart TD
    A[Upload de Planilha] --> B[Leitura e Detecção de Formato]
    B --> C[Normalização → Validação → Deduplicação]
    C --> D[Geração de Artefato Temporário]
    D --> E[Preview com Indicadores]
    E --> F[Confirmação Idempotente]
    F --> G[Consumo Atômico pelo Motor de Persistência]
    G --> H[Atualização de Entidades: Lojas, Indústrias, Promotores, Visitas]
    H --> I[Registro de Confirmação]
    I --> J[Atualização do Histórico de Importações]
    J --> K[Atualização dos Dashboards e Indicadores]
    L[Reconciliação Inteligente] --> M[Classificação de Evidências]
    M --> N[Geração de Diagnóstico]
    N --> O[Opção de Reprocessamento]
    O --> P[Atualização de Status das Visitas]
    P --> Q[Refeição dos Indicadores de Conformidade]
```

## Importadores

### AO QUADRADO
- **Layout**: Colunas fixas para data, loja, promotor, indústria, produto, quantidade, valor
- **Detecção**: Identificado por cabeçalhos específicos como `DATA_VISITA`, `COD_LOJA`, `COD_PROMOTOR`
- **Normalização**: Converte datas para ISO, padroniza códigos removendo zeros à esquerda, padroniza textos (trim, uppercase)
- **Validação**: Verifica existência de lojas/promotores/indústrias, validade de datas, valores numéricos positivos

### KING CHECKLIST
- **Layout**: Colunas para data, loja, promotor, checklist de itens (sim/não/NA), observações
- **Detecção**: Identificado por padrões como `CHECKLIST_ITEM_1`, `CHECKLIST_ITEM_2`
- **Normalização**: Converte sim/não para booleanos, padroniza textos, trata campos vazios como NA
- **Validação**: Verifica conformidade mínima de itens obrigatórios, validade de datas

### ROTEIRO PROMOTORES
- **Layout**: Colunas para data, promotor, loja, horário de início/fim, atividades realizadas
- **Detecção**: Identificado por sequências de horários e sequências de lojas por promotor
- **Normalização**: Converte horários para formato 24h, padroniza códigos, calcula duração das visitas
- **Validação**: Verifica sobreposição de horários para mesmo promotor, validade de datas, sequência lógica de lojas

## Reconciliação

O módulo de reconciliação compara evidências coletadas em campo com visitas planejadas na operação.

### Tipos de Match
- **MATCHED**: Evidência corresponde exatamente a visita planejada (loja, promotor, data, indústria)
- **DATE_MISMATCH**: Mesma loja/promotor/indústria, mas data diferente
- **STORE_NOT_FOUND**: Loja mencionada na evidência não existe na operação
- **UNPLANNED**: Evidência não corresponde a nenhuma visita planejada na operação
- **AMBIGUOUS**: Evidência corresponde a múltiplas visitas possíveis (ex: mesmo promotor visitou várias lojas no mesmo dia)

### Recursos Avançados
- **Aliases**: Sistema de apelidos para flexibilizar匹配 (ex: "RUA DAS FLORES" = "AV. FLORES")
- **Diagnóstico**: Relatório detalhado mostrando motivo de cada mismatch e sugestões de correção
- **Reprocessamento**: Permite corrigir evidências e reprocessar apenas os itens afetados

## Dashboard

### Páginas Implementadas
- **`/`** → Redireciona para `/dashboard`
- **`/dashboard`**: Visão executiva com KPIs gerais, tendências, alertas críticos
- **`/dashboard/operacoes`**: Métricas por operação (cobertura, adesão, pontualidade)
- **`/dashboard/visitas`**: Análise detalhada de visitas (realizadas vs. planejadas, atrasos, cobertura geográfica)
- **`/dashboard/importacoes`**: Histórico de importações, taxas de sucesso, erros por tipo
- **`/dashboard/promotores`**: Performance individual e por equipe, ranking de produtividade
- **`/dashboard/reconciliacao`**: Painel de reconciliação com filtros por operação, status e tipo de discrepância

Todas as páginas possuem:
- Layout responsivo com sidebar recolhível
- Filtros interativos (operações, datas, promotores)
- Exportação de dados para CSV
- Visualizações gráficas com atualização em tempo real
- Indicadores de performance com metas configuráveis

## Estrutura do Projeto

```
src/
├── app/                    # Páginas, layouts e APIs (App Router)
├── components/             # Layout, dashboards e UI
├── lib/                    # Prisma, helpers, formatadores e tema
├── modules/
│   ├── dashboard/          # KPIs
│   ├── imports/            # Parsing, preview e confirmação
│   ├── mapping/            # Mapeamento de domínio
│   ├── operations/         # Regras e planejamento
│   ├── persistence/        # Gravação transacional
│   ├── stores/             # CRUD de lojas
│   ├── visits/             # Consultas e métricas
│   └── shared/             # Normalização
prisma/
├── migrations/
├── schema.prisma
└── seed.ts
public/                     # Assets estáticos
docker/                     # Infraestrutura local (Docker Compose)
n8n/                        # Workflows n8n (opcional)
scripts/                    # Scripts PowerShell
docs/                       # Documentação de implantação
```

## Instalação

### Pré-requisitos
- Node.js ≥18.x (compatível com Next.js 16.2.10)
- PostgreSQL ≥15 (local via Docker ou remoto via Neon)
- Git

### Instalação
```bash
# Clone o repositório
git clone https://github.com/seu-usuario/mk9-analytics.git
cd mk9-analytics

# Instale dependências
npm install

# Gere o Prisma Client (executa automaticamente no postinstall)
npx prisma generate

# Configure o banco de dados
# Copie o exemplo de variáveis de ambiente
cp .env.example .env

# Edite o .env com suas credenciais do PostgreSQL
# Exemplo para Docker local:
# DATABASE_URL="postgresql://mk9_user:***@localhost:5433/mk9_analytics?schema=public"
# Exemplo para Neon:
# DATABASE_URL="postgresql://user:***@host.pooler.supabase.com:5432/db?sslmode=require"

# Execute as migrações
npx prisma migrate dev --name init

# Popule o banco com dados iniciais (opcional para desenvolvimento)
npx prisma db seed

# Inicie o servidor de desenvolvimento
npm run dev
```

### Variáveis de Ambiente
| Variável | Descrição | Obrigatório |
|----------|-----------|-------------|
| `DATABASE_URL` | String de conexão PostgreSQL | Sim |
| `NEXTAUTH_SECRET` | Chave secreta para NextAuth (se aplicável) | Não |
| `NEXTAUTH_URL` | URL base da aplicação | Não (padrão: `http://localhost:3000`) |
| `IMPORT_TOKEN_EXPIRY_MINUTES` | Tempo de expiração do token de preview | Não (padrão: `30`) |
| `MAX_UPLOAD_SIZE_MB` | Limite de tamanho para upload de arquivos | Não (padrão: `10`) |

## Configuração

### Banco de Dados Neon
1. Crie um projeto no [Neon](https://neon.tech)
2. Obtenha a string de conexão do dashboard
3. Configure no arquivo `.env`:
   ```env
   DATABASE_URL="postgresql://user:***@host.neon.tech/dbname?sslmode=require"
   ```

### Prisma
- O Prisma Client é gerado automaticamente durante `npm install`
- Para regenerar manualmente: `npx prisma generate`
- Para aplicar novas migrações: `npx prisma migrate dev`
- Para visualizar o banco: `npx prisma studio`

### Vercel
1. Conecte seu repositório GitHub ao Vercel
2. Configure as variáveis de ambiente no painel do Vercel
3. O Vercel detectará automaticamente o projeto Next.js e iniciará o build

## Testes

### Executando Testes
```bash
# Linting
npm run lint

# Verificação de tipos TypeScript
npx tsc --noEmit

# Build de produção
npm run build

# Testes unitários e de integração
npm test
```

> **Nota**: O projeto utiliza o runner de testes nativo do Node.js. Os testes estão localizados em `__tests__` dentro de cada módulo.

## Deploy

### Vercel (Recomendado)
1. Faça fork deste repositório no GitHub
2. Conecte seu repositório ao [Vercel](https://vercel.com)
3. Configure as variáveis de ambiente no painel da Vercel
4. O Vercel detectará automaticamente o projeto Next.js e iniciará o build

### Docker (Ambiente de Produção)
```bash
# Construa a imagem
docker build -t mk9-analytics .

# Execute o container
docker run -p 3000:3000 \
  -e DATABASE_URL="sua_connection_string" \
  -e NEXTAUTH_SECRET="***" \
  mk9-analytics
```

### Pipeline de Deploy
1. Desenvolvedor cria feature branch a partir de `main`
2. Implementa feature e abre Pull Request
3. CI executa: `lint → test → build`
4. Após aprovação, merge em `main` dispara deploy automático no Vercel
5. Vercel cria preview para PRs e atualização de produção para merges em `main`

## Roadmap

### ✅ Concluído (Versão Atual)
- Estabilização completa do código-base
- Migração para ESLint flat format
- Correções de sintaxe TypeScript crítica
- Remoção de casts desnecessários `as any`
- Todos os comandos de desenvolvimento executam sem erros:
  `npm install` → `npx prisma generate` → `npx tsc --noEmit` → `npm run lint` → `npm run build` → `npm run dev`
- Funcionalidades core implementadas:
  - Gestão de operações e cadastros
  - Importação de planilhas com preview e validação
  - Motor de persistência e roteiros
  - Reconciliação inteligente com classificação de mismatches
  - Dashboards gerenciais completos

### 🚧 Em Desenvolvimento
- **Autenticação e Autorização**: Implementação completa de papéis e permissões (RBAC)
- **Integração com n8n**: Workflows de automação para notificações e sincronização
- **API Pública**: Documentação e versionamento da API REST
- **Testes End-to-End**: Cypress para fluxos críticos de usuário
- **Otimização de Performance**: Paginação avançada e caching de consultas pesadas

### 📋 Próximas Melhorias
- Internacionalização (i18n) para apoio a múltiplos idiomas
- Relatórios exportáveis em PDF e Excel
- Integração com provedores de armazenamento de arquivos (AWS S3, Google Cloud Storage)
- Dashboard de auditoria com trilha de alterações
- Sistema de notificações em tempo real (WebSockets)
- Otimização de consultas com índices avançados de consultas com índices avançados no PostgreSQL
- Implementação de webhooks para integrações externas

## Boas Práticas

### Padrões de Código
- **TypeScript Strict Mode**: Nenhum `any` permitido sem justificativa explícita
- **Componentização**: Componentes reutilizáveis em `components/ui` e específicos em `components/[feature]`
- **Separação de Concerns**: Camadas bem definidas (routes → services → repositories → mappers)
- **Tratamento de Erros**: Centralizado com logging estruturado e mensagens amigáveis ao usuário
- **Validação**: Zod para validação de entrada em todas as fronteiras (API, services, components)
- **Formatação**: Prettier configurado + ESLint com regras de qualidade e boas práticas

### Organização
- **Git Flow**:
  - `main`: Código de produção estável
  - `develop`: Branch de integração para próximas releases
  - `feature/*`: Novas funcionalidades
  - `bugfix/*`: Correções de problemas
  - `release/*`: Preparação de release
- **Commits**: Mensagens descritivas no formato `type(scope): subject`
  - Ex: `feat(imports): add king checklist parser`
- **Pull Requests**:
  - Descrição clara do problema e solução
  - Checklist de testes realizados
  - Screenshots para mudanças de UI
  - Aprovação mínima de 1 revisor

### Qualidade
- **Zero Tolerance a Warnings**: Build falha se houver qualquer warning de lint ou TypeScript
- **Code Review**: Foco em legibilidade, manutenibilidade e aderência às boas práticas
- **Testes**: Cobertura mínima de 80% para unidades críticas (services, utils)
- **Documentação**: Atualização simultânea de código e documentação (README, comentários inline)

## Licença

Este projeto está licenciado sob a [Licença MIT](LICENSE).

© 2024 MK9 Analytics. Todos os direitos reservados.