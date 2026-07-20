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

## 🔄 Fluxo do Sistema

### Fluxo disponível pela interface

```text
CSV / XLS / XLSX
        ↓
POST /api/imports/upload
        ↓
Leitura e detecção do formato
        ↓
Normalização → validação → deduplicação
        ↓
Artefato temporário no banco
        ↓
Preview e indicadores
```

### Confirmação disponível pela API

```text
previewToken + idempotencyKey
        ↓
POST /api/imports/confirm
        ↓
Validação e consumo atômico
        ↓
ImportConfirmation
        ↓
Histórico de importações
```

### Limite atual

O endpoint de confirmação **não chama** `PersistencePlanner` nem `PersistenceEngine`. Confirmar registra o aceite, mas não cria ou atualiza lojas, indústrias, promotores e visitas. `ImportService.importFile` e o módulo de persistência existem, porém não estão conectados à interface ou ao endpoint atual.

## 🗄️ Estrutura do Banco

| Modelo | Responsabilidade |
| --- | --- |
| `User` | Usuário `ADMIN` ou `SUPERVISOR`; sem relações atuais |
| `Supervisor` | Responsável por vários promotores |
| `Promoter` | Promotor ligado ao supervisor e às visitas |
| `Industry` | Indústria com código único |
| `Store` | Loja com código único |
| `Operation` | Operação mensal; mês e ano são únicos em conjunto |
| `Visit` | Relaciona operação, promotor, loja e indústria |
| `Import` | Tentativa de importação e estado |
| `ImportFile` | Metadados e hash único do arquivo |
| `ImportPreviewArtifact` | Snapshot temporário, token em hash e expiração |
| `ImportConfirmation` | Confirmação idempotente de um artefato |
| `SyncLog` | Log genérico sem relações atuais |

### Enums

- `UserRole`: `ADMIN`, `SUPERVISOR`.
- `VisitStatus`: `PLANEJADA`, `REALIZADA`, `CANCELADA`.
- `OperationStatus`: `PLANNING`, `OPEN`, `IN_PROGRESS`, `FINISHED`, `CANCELLED`, `ARCHIVED`.

## 🔌 APIs

### App Router

| Método | Rota | Comportamento implementado |
| --- | --- | --- |
| `GET` | `/api/dashboard` | Retorna KPIs agregados |
| `POST` | `/api/imports/upload` | Recebe arquivo em Base64 e gera preview |
| `POST` | `/api/imports/confirm` | Confirma token com chave UUID idempotente |
| `GET` | `/api/operations` | Lista com `page`, `limit`, `status` e `search` |
| `POST` | `/api/operations` | Cria operação |
| `PUT` | `/api/operations?id={id}` | Atualiza operação |
| `DELETE` | `/api/operations?id={id}` | Exclui operação |
| `GET` | `/api/operations/{id}` | Consulta operação |
| `POST` | `/api/operations/{id}?action=duplicate` | Duplica para `newMonth` e `newYear` |
| `POST` | `/api/operations/{id}?action=close` | Altera para `FINISHED` |
| `POST` | `/api/operations/{id}?action=archive` | Altera para `ARCHIVED` |
| `POST` | `/api/operations/{id}?action=reopen` | Reabre como `OPEN` |
| `POST` | `/api/operations/{id}?action=generate-visits` | Gera visitas |
| `POST` | `/api/operations/{id}?action=statistics` | Retorna estatísticas |
| `GET` | `/api/stores` | Lista com `search`, `chain`, `city` e `state` |
| `POST` | `/api/stores` | Cria loja |
| `PUT` | `/api/stores?id={id}` | Atualiza loja |
| `DELETE` | `/api/stores?id={id}` | Exclui loja |
| `GET` | `/api/promotores` | Lista promotores e supervisores |
| `POST` | `/api/promotores` | Cria promotor |
| `PUT` | `/api/{id}` | Atualiza promotor |
| `DELETE` | `/api/{id}` | Exclui promotor |

> A rota genérica `/api/{id}` manipula promotores. Não existe `/api/promotores/{id}`.

### Pages Router legado

| Método | Rota | Comportamento implementado |
| --- | --- | --- |
| `GET` | `/api/analytics` | Lista visitas e calcula métricas; aceita `operationId`, `startDate` e `endDate` |

Outros métodos enviados a `/api/analytics` recebem `405 Method Not Allowed`.

## 📈 Dashboards

| Rota | Conteúdo disponível |
| --- | --- |
| `/dashboard` | KPIs, visitas, operações ativas, alertas, importações e ranking |
| `/dashboard/operacoes` | Métricas, cobertura e filtros de operações |
| `/dashboard/visitas` | Execução, atrasos, cobertura, filtros e tabela |
| `/dashboard/importacoes` | Histórico e totais por estado de importação |
| `/dashboard/imports` | Upload, processamento e preview |
| `/dashboard/promotores` | Total, busca, filtros e equipe |

A rota `/` redireciona para `/dashboard`. A sidebar contém links para lojas, indústrias e configurações, mas essas páginas não existem no App Router atual.

## 🚀 Como Executar

### Pré-requisitos

- Node.js compatível com Next.js 16 e npm.
- PostgreSQL local ou remoto.
- Docker Desktop apenas para o banco local.

### Instalação

```bash
npm install
```

O `postinstall` gera o Prisma Client automaticamente.

### PostgreSQL local

```bash
docker compose up -d db
```

Crie o arquivo `.env`:

```dotenv
DATABASE_URL="postgresql://mk9_user:mk9_super_password123@localhost:5433/mk9_analytics?schema=public"
```

O PostgreSQL 15 fica em `localhost:5433`. O n8n opcional inicia com `docker compose up -d`.

### Neon Postgres

```dotenv
DATABASE_URL="postgresql://USUARIO:SENHA@HOST-POOLER/NOME_DO_BANCO?sslmode=require"
```

Não versione credenciais. O projeto usa Prisma, não `@neondatabase/serverless`. O `.env.example` atual está vazio; `DATABASE_URL` é a variável exigida.

### Migrações e seed

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

`db:migrate` usa `prisma migrate dev`. Em implantação, use `npx prisma migrate deploy`.

> **Atenção:** o seed executa `visit.deleteMany({})` antes de recriar visitas. Não o rode onde dados existentes precisem ser preservados.

### Desenvolvimento e produção

```bash
npm run dev
```

Acesse `http://localhost:3000`.

```bash
npm run build
npm start
```

| Script | Finalidade |
| --- | --- |
| `dev` | Servidor de desenvolvimento |
| `build` | Build de produção |
| `start` | Servidor de produção |
| `lint` | ESLint |
| `db:generate` | Prisma Client |
| `db:migrate` | Migration de desenvolvimento |
| `db:studio` | Prisma Studio |
| `db:seed` | Seed |

Os testes usam `node:test`, mas não há script `test` no `package.json`.

## 📁 Estrutura das Pastas

| Pasta | Responsabilidade real |
| --- | --- |
| `src/app` | App Router, layouts, páginas e APIs |
| `src/pages/api` | API legada de analytics |
| `src/components` | Layout, dashboards e UI |
| `src/lib` | Prisma, helpers, formatadores e tema |
| `src/modules/imports` | Parsing, preview e confirmação |
| `src/modules/mapping` | Mapeamento dos dados |
| `src/modules/persistence` | Planejamento e persistência transacional |
| `src/modules/operations` | CRUD, validação e planejamento |
| `src/modules/visits` | Consultas e métricas |
| `src/modules/stores` | CRUD de lojas |
| `src/modules/dashboard` | KPIs |
| `src/modules/shared` | Normalização |
| `prisma` | Schema, migrations e seed |
| `public` | Assets estáticos |
| `docker` e `n8n` | Infraestrutura local |
| `scripts` | Scripts PowerShell |
| `docs` | Documentação de implantação |

Os módulos `checklists`, `google-drive`, `industries`, `promoters`, `reports`, `routes` e `whatsapp` são majoritariamente scaffolds sem funcionalidade implementada.

## 🖼️ Screenshots

O repositório ainda não contém capturas.

### Centro de Operações

> Placeholder: `docs/screenshots/dashboard.png`

### Preview de importação

> Placeholder: `docs/screenshots/import-preview.png`

### Acompanhamento de visitas

> Placeholder: `docs/screenshots/visits.png`

## 🧭 Roadmap

Lacunas observáveis no código atual:

- Conectar confirmação, `PersistencePlanner` e `PersistenceEngine`.
- Chamar `/api/imports/confirm` pela interface.
- Persistir `ImportFile` no fluxo atual.
- Criar páginas de lojas, indústrias e configurações.
- Trocar `/api/{id}` por rota explícita de promotores.
- Implementar autenticação e autorização; hoje há somente modelo e seed de `User`.
- Implementar ou remover scaffolds sem funcionalidade.
- Conectar foto e checklist das visitas, hoje indisponíveis.
- Adicionar script npm para os testes.
- Adicionar screenshots reais.

## 🤝 Contribuição

1. Crie uma branch focada.
2. Implemente e documente a alteração.
3. Execute:

   ```bash
   npm run lint
   npx tsc --noEmit
   npm run build
   ```

4. Inclua migration ao alterar o schema Prisma.
5. Atualize testes ao alterar imports, mapping ou persistence.
6. Abra um pull request com impacto e validação.

Não versione `.env`, URLs de conexão, senhas ou tokens.

## 📄 Licença

Não há arquivo `LICENSE` nem licença no `package.json`. Até que uma licença seja adicionada, o projeto não deve ser apresentado como MIT ou como software open source.
