# MK9 Analytics

O **MK9 Analytics** é uma plataforma corporativa web de alta performance projetada para centralizar, validar e gerenciar operações de trade marketing e execução de campo. O sistema relaciona operações mensais, roteiros de visitas, promotores, supervisores, pontos de venda (lojas) e indústrias, fornecendo relatórios executivos em tempo real e um pipeline transacional seguro para importação de planilhas operacionais.

---

## 📊 Visão Geral

Nas operações de trade marketing, a fragmentação dos dados em planilhas dispersas (CSV e Excel) e a falta de visibilidade em tempo real comprometem o acompanhamento da equipe de campo. O MK9 Analytics resolve esse problema centralizando toda a operação em uma estrutura relacional confiável.

A plataforma automatiza a consolidação de métricas operacionais — calculando volumes de visitas planejadas, executadas, pendências, atrasos e taxa de cobertura — e oferece um pipeline de ingestão de dados resiliente com validação rigorosa, preview temporário auditável e confirmação idempotente para evitar duplicidades.

---

## 🚀 Funcionalidades

### 📈 Centro de Operações & Dashboards Executive
- **Métricas Globais em Tempo Real**: Indicadores consolidados de operações ativas, visitas planejadas, realizadas, pendentes, taxa de cobertura global (%) e data do último processamento de dados.
- **Desempenho de Visitas**: Gráficos e indicadores comparativos de execução por status (*Realizada*, *Planejada*, *Cancelada*).
- **Atenção Operacional**: Sistema automatizado de alertas para identificar gargalos como operações com cobertura crítica (< 50%), visitas com datas vencidas e falhas na ingestão de arquivos.
- **Ranking de Promotores**: Classificação dinâmica da equipe de campo com base no volume e percentual de visitas concluídas.

### 📋 Gestão de Operações & Visitas
- **Ciclo de Vida de Operações**: Controle total sobre operações mensais (*Planning*, *Open*, *In Progress*, *Finished*, *Cancelled*, *Archived*).
- **Ações Operacionais**: Criação, atualização, exclusão, duplicação de estruturas para novos meses/anos, fechamento, arquivamento, reabertura e geração de roteiros de visitas.
- **Acompanhamento de Visitas**: Filtros multicritério por promotor, supervisor, operação, status e intervalo de datas.
- **Gestão de Equipes**: Cadastro e filtragem de promotores por nome, estado (UF) e supervisor responsável.

### 📥 Pipeline de Importação de Planilhas (CSV / Excel)
- **Upload Flexível**: Suporte para drag-and-drop e envio de arquivos nos formatos `.csv`, `.xls` e `.xlsx`.
- **Parsing Robustos**: Leitores dedicados (PapaParse e SheetJS) com detecção automática de cabeçalhos, encodings e delimitadores.
- **Validação & Normalização**: Sanitização de dados linha a linha com separação explicada de registros válidos e rejeitados.
- **Preview Auditável com TTL**: Persistência temporária do artefato de preview (`ImportPreviewArtifact`) com tempo de vida de 30 minutos e entrega do token de acesso em hash SHA-256.
- **Confirmação Idempotente**: Proteção contra reprocessamento ou requisições duplicadas via chave de idempotência (`idempotencyKey`).

---

## 🧰 Stack Tecnológica

| Camada | Tecnologia | Descrição / Versão |
| :--- | :--- | :--- |
| **Framework Web** | Next.js 16 | App Router, Server Components e Route Handlers (v16.2.10) |
| **Biblioteca UI** | React 19 | React 19.2.4 com suporte completo a Server/Client Components |
| **Linguagem** | TypeScript | Tipagem estática rigorosa em modo `strict` (v5.x) |
| **Estilização** | Tailwind CSS v4 | Estilização moderna e responsiva com `@tailwindcss/postcss` |
| **Componentes** | Radix UI / base-ui | Componentes acessíveis baseados nos padrões shadcn/ui |
| **Ícones** | Lucide React | Biblioteca de ícones vetoriais modernos |
| **ORM** | Prisma ORM | Prisma Client & CLI v6.19.3 |
| **Banco de Dados** | PostgreSQL | Compatível com Neon Serverless Postgres via `DATABASE_URL` |
| **Validação** | Zod | Validação e parsing de schemas e dados de entrada (v4.4.3) |
| **Formulários** | React Hook Form | Integração com `@hookform/resolvers` |
| **Parsing de Dados** | PapaParse / SheetJS | Leitura e processamento de arquivos CSV e planilhas Excel |
| **Feedback UI** | Sonner | Notificações e toasts informativos |
| **Gráficos** | Recharts | Visualização de dados operacionais (v3.9.2) |
| **Bundler** | Turbopack | Compilação e suporte para ambiente de desenvolvimento rápido |

---

## 🏗️ Arquitetura

O projeto utiliza a estrutura do Next.js App Router integrada com arquitetura modular orientada a domínios de negócio (`modules/`). As páginas em Server Components realizam a busca direta via serviços de dashboard ou repositórios Prisma, enquanto as APIs tratam das mutações e validações de regras.

```text
mk9-analytics/
├── prisma/
│   ├── migrations/             # Histórico de migrações do banco de dados
│   ├── schema.prisma           # Modelos de dados e enums
│   └── seed.ts                 # Script de povoamento inicial idempotente
├── src/
│   ├── app/                    # App Router: Páginas, layouts e APIs (Route Handlers)
│   │   ├── api/                # Endpoints HTTP REST (operations, stores, promotores, imports, dashboard)
│   │   └── dashboard/          # Telas do painel administrativo e relatórios
│   ├── components/             # Componentes de interface do usuário
│   │   ├── dashboard/          # Componentes visuais do dashboard
│   │   ├── imports/            # Formulários e tabelas de importação
│   │   ├── layout/             # Sidebar, Header, AppShell e navegação
│   │   ├── operations/         # Cards e tabelas de operações
│   │   ├── ui/                 # Primitivas de UI (button, card, dialog, table, dropzone, etc.)
│   │   └── visits/             # Tabelas e resumos de visitas
│   ├── lib/                    # Configurações de infraestrutura (Prisma Client, formatadores e temas)
│   └── modules/                # Módulos de domínio da aplicação
│       ├── dashboard/          # Agregadores de dados e KPIs
│       ├── imports/            # Parsing, validação, preview e confirmação de planilhas
│       ├── operations/         # Regras de negócio e gestão de operações
│       ├── persistence/        # Planejador e motor de gravação no banco
│       ├── promoters/          # Gestão de promotores
│       ├── stores/             # Gestão de lojas
│       └── visits/             # Regras e relatórios de visitas de campo
```

---

## 🔄 Fluxo do Sistema

O pipeline de ingestão e processamento de dados operacionais no MK9 Analytics segue o fluxo transacional abaixo:

```text
[ Envio de Arquivo ] (CSV / Excel via Dropzone)
        ↓
[ Validação & Parsing ] (Leitura em memória, normalização e cálculo de Hashes SHA-256)
        ↓
[ Preview Auditável ] (Geração do ImportPreviewArtifact com TTL de 30 minutos)
        ↓
[ Confirmação Idempotente ] (Validação de token e idempotencyKey via ImportConfirmation)
        ↓
[ Persistência no Banco ] (Sincronização via PersistenceEngine / Models Prisma)
        ↓
[ Atualização dos Dashboards ] (Recálculo automático de estatísticas e métricas de cobertura)
```

---

## 🗄️ Estrutura do Banco de Dados

A camada de persistência é construída sobre o **PostgreSQL** através do **Prisma ORM**. Abaixo estão os principais modelos configurados no `schema.prisma`:

| Modelo | Descrição |
| :--- | :--- |
| **`User`** | Usuários com permissões de acesso ao sistema (`ADMIN`, `SUPERVISOR`). |
| **`Supervisor`** | Responsáveis pelas equipes de campo e acompanhamento dos promotores. |
| **`Promoter`** | Promotores de vendas associados a um supervisor e responsáveis pelas visitas. |
| **`Industry`** | Indústrias/marcas atendidas nas operações (possui código único). |
| **`Store`** | Pontos de venda / lojas com identificação de rede, cidade e estado. |
| **`Operation`** | Operações mensais de trade marketing (restrição única por mês/ano e datas de vigência). |
| **`Visit`** | Visitas agendadas e executadas, relacionando promotor, loja, indústria e operação. |
| **`Import`** | Registro mestre das sessões de importação realizadas. |
| **`ImportFile`** | Registro dos arquivos processados por importação com hash SHA-256 e número de linhas. |
| **`ImportPreviewArtifact`**| Artefato temporário com o payload extraído, linhas válidas/rejeitadas e expiração. |
| **`ImportConfirmation`** | Registro de confirmação idempotente para garantia de não-duplicação. |
| **`SyncLog`** | Registro auditável de logs de sincronização e ações do sistema. |

---

## 🔌 APIs

O sistema disponibiliza rotas API REST padronizadas via Next.js Route Handlers:

### 📥 Importações
- `POST /api/imports/upload` — Envia arquivo codificado em base64, executa parsing/validação e retorna a prévia dos dados com token de preview.
- `POST /api/imports/confirm` — Confirma a gravação dos dados da prévia garantindo idempotência.

### 📋 Operações
- `GET /api/operations` — Lista operações paginadas com suporte a busca e filtro por status (`page`, `limit`, `status`, `search`).
- `POST /api/operations` — Cadastra uma nova operação de trade marketing.
- `PUT /api/operations?id={id}` — Atualiza os dados de uma operação.
- `DELETE /api/operations?id={id}` — Remove uma operação do sistema.
- `GET /api/operations/[id]` — Obtém os detalhes completos de uma operação.
- `POST /api/operations/[id]?action={action}` — Executa ações específicas na operação (`duplicate`, `close`, `archive`, `reopen`, `generate-visits`, `statistics`).

### 🏪 Lojas
- `GET /api/stores` — Lista lojas com paginação e filtros por busca, rede, cidade e UF (`page`, `limit`, `search`, `chain`, `city`, `state`).
- `POST /api/stores` — Cadastra uma nova loja.
- `PUT /api/stores?id={id}` — Atualiza dados de uma loja existente.
- `DELETE /api/stores?id={id}` — Remove uma loja.

### 👤 Promotores
- `GET /api/promotores` — Lista todos os promotores cadastrados com seus respectivos supervisores.
- `POST /api/promotores` — Cria um novo promotor no sistema.
- `PUT /api/[id]` — Atualiza dados de um promotor existente pelo ID.
- `DELETE /api/[id]` — Exclui um promotor pelo ID.

### 📊 Dashboard
- `GET /api/dashboard` — Retorna todas as estatísticas e indicadores consolidados para a visão executiva.

---

## 💻 Dashboards Disponíveis

1. **Centro de Operações (`/dashboard`)**:
   - Visão executiva consolidada com métricas gerais.
   - Distribuição de visitas por status e barra de progresso.
   - Lista de operações ativas e atalhos rápidos.
   - Bloco de atenção crítica (baixa cobertura, pendências vencidas, falhas).
   - Ranking da equipe de promotores por execução.

2. **Gestão de Operações (`/dashboard/operacoes`)**:
   - Painel analítico de cobertura de visitas e operações ativas.
   - Filtros dinâmicos por cliente e status do ciclo de vida.
   - Tabela detalhada com contagem de lojas, promotores, visitas e percentual de cobertura.

3. **Acompanhamento de Visitas (`/dashboard/visitas`)**:
   - Resumo numérico com totais de visitas planejadas, executadas, pendentes e atrasadas.
   - Barra de filtros avançados por promotor, supervisor, operação, status e datas.
   - Tabela de acompanhamento com identificação completa do roteiro.

4. **Histórico de Importações (`/dashboard/importacoes`)**:
   - Indicadores de total de importações, taxa de sucesso e contagem de registros processados.
   - Tabela histórica detalhando arquivos enviados, datas e status de confirmação.

5. **Nova Importação (`/dashboard/imports`)**:
   - Interface com Dropzone interativa para upload de planilhas.
   - Listagem em tempo real dos últimos uploads registrados.

6. **Equipe de Promotores (`/dashboard/promotores`)**:
   - Visualização da equipe de campo com filtro dinâmico por busca de nome, estado (UF) e supervisor responsável.

---

## 🛠️ Como Executar

### Pré-requisitos
- **Node.js**: Versão 20.x ou superior.
- **npm**: Versão 10.x ou superior.
- **PostgreSQL**: Instância local ou remota (ex: Neon Database).

### 1. Clonar o repositório e instalar dependências

```bash
git clone https://github.com/seu-usuario/mk9-analytics.git
cd mk9-analytics
npm install
```

### 2. Configurar variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto com a URL de conexão do PostgreSQL:

```env
DATABASE_URL="postgresql://usuario:senha@localhost:5432/mk9_analytics?sslmode=disable"
```

### 3. Executar as migrações do banco de dados

```bash
npx prisma migrate dev
```

### 4. Povoar o banco de dados (Seed)

O projeto possui um script de seed idempotente que configura um usuário Admin, supervisores, promotores, indústrias, lojas, operações e visitas de teste:

```bash
npm run db:seed
```

### 5. Iniciar o ambiente de desenvolvimento

```bash
npm run dev
```

Acesse a aplicação em `http://localhost:3000`. Opcionalmente, você pode abrir o Prisma Studio para visualizar o banco de dados em `http://localhost:5555`:

```bash
npm run db:studio
```

### 6. Gerar a compilação de produção

```bash
npm run build
npm run start
```

---

## 📁 Estrutura das Pastas

```text
src/
├── app/                  # App Router do Next.js (layouts, páginas e API Route Handlers)
├── components/           # Componentes visuais organizados por módulo (ui, layout, operations, visits, imports)
├── lib/                  # Inicialização de clientes globais (Prisma, temas e utilitários)
└── modules/              # Lógica de negócio isolada por domínio:
    ├── dashboard/        # Serviços agregadores de KPIs e estatísticas
    ├── imports/          # Leitura de planilhas, parsers, validação, preview e confirmação
    ├── operations/       # Regras de negócio, cálculo de estatísticas e ações em operações
    ├── persistence/      # Planejamento e engine de gravação transacional no banco
    ├── promoters/        # Serviços e tipos relacionados aos promotores
    ├── stores/           # Serviços e tratamento de dados de lojas
    └── visits/           # Repositórios e serviços do acompanhamento de visitas
```

---

## 🖼️ Screenshots

*Placeholders para visualização da interface do MK9 Analytics:*

| Centro de Operações | Gestão de Visitas |
| :---: | :---: |
| ![Centro de Operações](https://via.placeholder.com/800x450.png?text=Dashboard+Executivo+-+MK9+Analytics) | ![Gestão de Visitas](https://via.placeholder.com/800x450.png?text=Acompanhamento+de+Visitas+-+MK9+Analytics) |

| Nova Importação | Gestão de Operações |
| :---: | :---: |
| ![Nova Importação](https://via.placeholder.com/800x450.png?text=Pipeline+de+Importação+-+MK9+Analytics) | ![Gestão de Operações](https://via.placeholder.com/800x450.png?text=Gestão+de+Operações+-+MK9+Analytics) |

---

## 📌 Roadmap

### Funcionalidades Implementadas ✅
- [x] Dashboard executivo com métricas consolidadas de visitas, cobertura e alertas.
- [x] Pipeline completo de upload e parsing de planilhas CSV e Excel (`.xls`, `.xlsx`).
- [x] Sistema de preview temporário auditável com expiração (TTL de 30 minutos) e tokens SHA-256.
- [x] Confirmação de importação com garantia de idempotência.
- [x] APIs REST para CRUD de operações, lojas e promotores.
- [x] Ações avançadas em operações (duplicação, fechamento, arquivamento e geração de visitas).
- [x] Seeding idempotente para ambiente de desenvolvimento.

### Funcionalidades Futuras 🔮
- [ ] Conexão direta entre a confirmação da prévia e o `PersistenceEngine` para gravação automática nas tabelas de domínio.
- [ ] Interfaces visuais no frontend para criação e edição nativa de Lojas e Indústrias.
- [ ] Módulo de Checklists dinâmicos para preenchimento durante as visitas.
- [ ] Anexo de fotos comprovatórias das visitas com armazenamento em nuvem.
- [ ] Autenticação avançada de usuários e controle de acesso baseado em papéis (`UserRole`).
- [ ] Notificações operacionais automatizadas via WhatsApp e relatórios em PDF.

---

## 🤝 Contribuição

Contribuições são super bem-vindas! Para contribuir com o projeto:

1. Faça um **Fork** do repositório.
2. Crie uma **Branch** para a sua funcionalidade (`git checkout -b feature/sua-feature`).
3. Commit suas alterações (`git commit -m 'feat: Adiciona nova funcionalidade'`).
4. Faça o **Push** para a branch (`git push origin feature/sua-feature`).
5. Abra um **Pull Request**.

---

## 📄 Licença

Este projeto está licenciado sob a licença **MIT** — consulte o arquivo `LICENSE` para obter mais detalhes.
