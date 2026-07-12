# MK9 Analytics

Sistema interno de gestão de operações de trade marketing da MK9 — substitui os fluxos de planilhas Excel para controle de promotores, indústrias, lojas, rotas, visitas e faturamento.

## Stack

- Next.js 16 (App Router) + React 19
- Tailwind CSS 4 + Shadcn/UI
- Prisma 6 + PostgreSQL (Docker)

## Módulos

- **Dashboard** — indicadores da operação atual (visitas planejadas, realizadas, % execução)
- **Promotores** — cadastro e gestão dos promotores de campo
- **Indústrias** — clientes/indústrias atendidas
- **Lojas** — pontos de venda
- **Rotas** — roteiros de visita dos promotores
- **Operações** — controle mensal/periódico das campanhas
- **Importações** — importação de planilhas legadas (roteiros, checklists)
- **Configurações** — parâmetros do sistema

## Rodando localmente

\`\`\`bash
docker-compose up -d
npm install
npx prisma migrate dev
npm run dev
\`\`\`

Abra http://localhost:3000

## Roadmap

- Integração com Google Drive (importação automática de planilhas)
- Integração com WhatsApp (notificações de visita)