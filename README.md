# MK9 Analytics

Plataforma web para centralizar o acompanhamento de operações de trade marketing. O sistema relaciona operações mensais, visitas, promotores, supervisores, lojas e indústrias e oferece validação e preview para planilhas CSV e Excel.

> **Estado atual:** dashboards, APIs operacionais e preview de importações estão implementados. A confirmação idempotente do preview é registrada, mas ainda não aciona a persistência dos dados operacionais.

## 📊 Visão Geral

O MK9 Analytics substitui consultas dispersas a planilhas por uma visão consolidada da execução de campo. A aplicação calcula volume planejado, execução, pendências, atrasos e cobertura a partir das visitas armazenadas no PostgreSQL.

Na entrada de dados, arquivos são lidos, normalizados, validados e deduplicados antes da geração de uma amostra auditável. O preview permanece no servidor por 30 minutos; o token original é entregue ao cliente uma vez e somente seu hash é persistido.

## ✨ Funcionalidades

### Operações e cadastros

- CRUD de operações por API, com paginação, busca e filtro por status.
- Validação de período, mês e ano com Zod.
- Restrição de uma operação por combinação de mês e ano.
- Ações para duplicar, fechar, arquivar e reabrir operações.
- Geração de visitas a partir de promotores, lojas e indústrias.
- CRUD de lojas por API, com filtros por busca, rede, cidade e UF.
- Listagem e criação de promotores por API.
- Atualização e exclusão de promotores pela rota dinâmica existente.

### Importação de planilhas

- Seleção ou arraste de arquivos `.csv`, `.xls` e `.xlsx`.
- Estratégias específicas de leitura para CSV e Excel.
- Detecção de cabeçalhos e do tipo de planilha.
- Normalização, validação e erros por linha e campo.
- Deduplicação pelo conteúdo normalizado completo.
- Preview de até 50 registros e totais válidos, inválidos e duplicados.
- Artefato persistido com hashes SHA-256 do arquivo, dados e token.
- Token armazenado somente como hash e expiração em 30 minutos.
- Confirmação idempotente protegida contra reutilização e concorrência.
- Histórico e indicadores de tentativas de importação.

### Dashboards

- Resumo executivo de operações e visitas.
- Visitas planejadas, realizadas, pendentes e atrasadas.
- Cobertura geral e por operação.
- Ranking de promotores por visitas realizadas.
- Pontos de atenção e importações recentes.
- Filtros de operações, visitas e promotores.
- Layout responsivo com sidebar recolhível e menu móvel.

## 🧰 Stack Tecnológica

| Camada | Tecnologias realmente utilizadas |
| --- | --- |
| Aplicação | Next.js 16.2.10, App Router, React 19.2, React Server Components |
| Linguagem | TypeScript 5 em modo `strict` |
| Interface | Tailwind CSS 4, shadcn/ui, Radix UI, Lucide React |
| Validação | Zod 4 |
| Dados | PostgreSQL e Prisma ORM 6.19 |
| Banco remoto | Neon Postgres via `DATABASE_URL` pooled |
| Planilhas | SheetJS (`xlsx`) e Papa Parse |
| Infraestrutura local | Docker Compose, PostgreSQL 15 e n8n |
| Qualidade | ESLint 9, Node.js Test Runner e TypeScript Compiler |
| Desenvolvimento | Next.js Dev Server com Turbopack |

O Compose configura n8n, mas não há workflows integrados. Também não há Neon Auth, Data API ou outro serviço Neon além do PostgreSQL.

## 🏗️ Arquitetura

O App Router concentra páginas, layouts e Route Handlers. Server Components consultam serviços de dashboard ou o Prisma; APIs delegam regras a serviços e repositórios.

```text
src/
├── app/                    # Páginas, layouts e APIs
├── pages/api/              # Endpoint legado
├── components/             # Layout, dashboards e UI
├── lib/                    # Prisma, formatadores e tema
└── modules/
    ├── dashboard/          # KPIs
    ├── imports/            # Parsing, preview e confirmação
    ├── mapping/            # Mapeamento de domínio
    ├── operations/         # Regras e planejamento
    ├── persistence/        # Gravação transacional
    ├── stores/
    ├── visits/
    └── shared/

prisma/
├── migrations/
├── schema.prisma
└── seed.ts
```

| Camada | Responsabilidade |
| --- | --- |
| Páginas e componentes | Renderização, navegação, filtros e upload |
| Route Handlers | Contrato HTTP e respostas |
| Serviços | Casos de uso, validação, cálculos e transações |
| Repositórios | Acesso ao banco com Prisma |
| Mapping | Linhas normalizadas para candidatos de domínio |
| Persistence | Comparação e gravação atômica |
| Prisma | Schema, migrations e cliente PostgreSQL |
