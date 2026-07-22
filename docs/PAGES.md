# Páginas do MK9 Analytics

Este documento descreve somente as rotas atualmente implementadas no App Router. Todas as páginas administrativas usam o layout responsivo compartilhado, breadcrumb, pesquisa global e suporte aos temas claro e escuro.

| Rota | Finalidade |
| --- | --- |
| `/dashboard` | Visão consolidada de operações, cadastros, visitas, pendências e importações. |
| `/dashboard/operacoes` | Listagem, filtros e gestão das operações. |
| `/dashboard/operacoes/nova` | Cadastro de operação. |
| `/dashboard/operacoes/[id]` | Resumo e dados relacionados de uma operação. |
| `/dashboard/operacoes/[id]/editar` | Edição de operação. |
| `/dashboard/roteiros` | Planejamento e visualização administrativa de roteiros. |
| `/dashboard/conciliacao` | Diagnóstico e tratamento das evidências conciliadas ou pendentes. |
| `/dashboard/visitas` | Consulta das visitas persistidas. |
| `/dashboard/importacoes` | Upload, preview e confirmação de importações. |
| `/dashboard/imports` | Histórico técnico de importações. |
| `/dashboard/promotores` | Listagem e gestão de promotores. |
| `/dashboard/promotores/novo` | Cadastro de promotor. |
| `/dashboard/promotores/[id]` | Dados, produtividade e relacionamentos do promotor. |
| `/dashboard/promotores/[id]/editar` | Edição de promotor. |
| `/dashboard/promotores/[id]/roteiro` | Roteiro semanal individual. |
| `/dashboard/lojas` | Listagem e gestão de lojas. |
| `/dashboard/lojas/nova` | Cadastro de loja. |
| `/dashboard/lojas/[id]` | Detalhes e histórico da loja. |
| `/dashboard/lojas/[id]/editar` | Edição de loja. |
| `/dashboard/industrias` | Listagem e gestão de indústrias. |
| `/dashboard/industrias/nova` | Cadastro de indústria. |
| `/dashboard/industrias/[id]` | Detalhes e relacionamentos da indústria. |
| `/dashboard/industrias/[id]/editar` | Edição de indústria. |

## Estados globais

- `loading.tsx`: skeleton durante transições e carregamento inicial.
- `not-found.tsx`: página 404 com retorno ao dashboard.
- `error.tsx`: limite de erro 500 com tentativa de recuperação.
- Toasts: feedback não bloqueante no canto superior direito.
- Confirmações: diálogo explícito para ações destrutivas.
- Pesquisa global: operações, promotores, lojas e indústrias, a partir de dois caracteres.

## Responsividade e acessibilidade

A sidebar se transforma em drawer em telas menores; tabelas preservam leitura com rolagem horizontal; filtros se reorganizam verticalmente. Controles globais possuem nomes acessíveis, foco visível e animações respeitam `prefers-reduced-motion`.