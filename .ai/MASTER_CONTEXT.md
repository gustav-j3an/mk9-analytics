# MK9 Analytics - MASTER_CONTEXT.md

# VISÃO GERAL

Projeto:
MK9 Analytics

Versão:
0.3.x

Objetivo:

Desenvolver uma plataforma profissional para gestão de operações de Trade Marketing.

O sistema deverá controlar:

- Operações
- Promotores
- Supervisores
- Lojas
- Indústrias
- Visitas
- Checklists
- Fotos
- Dashboard Executivo
- Relatórios
- Google Drive
- WhatsApp
- n8n
- Inteligência Artificial

Este projeto deve ser tratado como um software comercial.

Nunca criar soluções temporárias.

Sempre pensar em escalabilidade.

---

# STACK

Framework

- Next.js 16

Linguagem

- TypeScript

ORM

- Prisma

Banco

- PostgreSQL

Validação

- Zod

Estilo

- Tailwind CSS

Componentes

- Shadcn/UI

Arquitetura

- DDD

- Clean Architecture

Automação

- n8n

Versionamento

- Git

---

# PRINCÍPIOS

Sempre seguir:

DDD

Clean Architecture

SOLID

KISS

DRY

Não criar código duplicado.

Não criar lógica repetida.

Sempre reutilizar Services.

Sempre reutilizar Repositories.

Sempre reutilizar Validators.

---

# ESTRUTURA

src/

modules/

dashboard/

imports/

operations/

stores/

promoters/

industries/

visits/

reports/

shared/

Cada módulo deve possuir:

components/

services/

repositories/

hooks/

validators/

schemas/

types/

utils/

constants/

Nunca fugir desse padrão.

---

# PAPÉIS

Administrador

Pode tudo.

Supervisor

Gerencia sua equipe.

Promotor

Executa visitas.

Nunca misturar permissões.

---

# REGRAS DE NEGÓCIO

Promotor não pode visitar duas lojas no mesmo horário.

Uma visita pertence a:

Operação

Loja

Promotor

Indústria

Supervisor

Uma operação pertence a um mês.

Não pode existir duas operações iguais para o mesmo mês.

Toda visita deve possuir status.

PLANEJADA

REALIZADA

CANCELADA

Toda alteração importante deve ser registrada.

---

# IMPORTAÇÃO

O sistema deverá importar:

Excel

CSV

Google Sheets

Google Drive

n8n

Toda importação deve:

Validar

Normalizar

Detectar duplicidade

Persistir

Gerar histórico

Gerar Log

Nunca importar diretamente para o banco.

Sempre validar antes.

---

# DASHBOARD

O dashboard deverá mostrar:

Operação Atual

Promotores

Lojas

Indústrias

Cobertura

Pendências

Conflitos

Ranking

Produtividade

Frequência

Custos

Lucro

Mapa

Tempo Médio

Indicadores

Nunca usar dados fictícios.

Sempre buscar dados reais.

---

# AUTENTICAÇÃO

Administrador

Supervisor

Promotor

Toda API deve estar protegida.

Toda página privada deve possuir autenticação.

Nunca deixar endpoints públicos.

---

# QUALIDADE

Antes de finalizar qualquer tarefa executar:

npm install

npx prisma generate

npx prisma migrate status

npm run lint

npx tsc --noEmit

npm run build

npm run dev

Se qualquer comando falhar:

PARAR.

Corrigir.

Testar novamente.

Nunca entregar código quebrado.

---

# PADRÃO DE CÓDIGO

Nunca usar:

any

require()

Código duplicado

Funções enormes

Arquivos gigantes

Sempre usar:

TypeScript Strict

Interfaces

Tipos

Enums

Services

Repositories

Validação com Zod

---

# COMO TRABALHAR

Sempre seguir:

Auditoria

↓

Planejamento

↓

Implementação

↓

Testes

↓

Correção

↓

Checkpoint

Nunca implementar várias funcionalidades juntas.

Sempre terminar uma sprint antes da próxima.

---

# COMANDOS DE VALIDAÇÃO

npm install

npx prisma generate

npx prisma migrate status

npm run lint

npx tsc --noEmit

npm run build

npm run dev

---

# CHECKPOINT

Ao finalizar:

git add .

git commit -m "Sprint X concluída"

Nunca finalizar sem checkpoint.

---

# OBJETIVO FINAL

Construir um sistema profissional para Trade Marketing.

O projeto deve ser:

Escalável

Seguro

Modular

Performático

Bem documentado

Sem código duplicado

Sem erros

Sempre compilando.

# PAPEL DOS AGENTES

## ChatGPT

Responsável por:

- Arquitetura
- Planejamento
- Revisão técnica
- Estratégia
- Roadmap
- Priorização
- Qualidade do projeto
- Análise de código
- Prompts para Hermes

Nunca implementa várias funcionalidades ao mesmo tempo.

Sempre divide o trabalho em pequenas missões.

---

## Hermes

Responsável por:

- Implementar código
- Corrigir bugs
- Refatorar
- Criar APIs
- Criar componentes
- Criar Services
- Criar Repositories
- Atualizar documentação

Antes de finalizar deve garantir:

Build OK

Lint OK

TypeScript OK

Prisma OK

Nunca entregar código quebrado.

---

## Usuário (Product Owner)

Responsável por:

- Definir requisitos
- Validar funcionalidades
- Testar localmente
- Aprovar cada sprint
- Fazer checkpoints no Git