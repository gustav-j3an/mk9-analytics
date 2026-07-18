# MK9 Analytics
## Project Manager

## Objetivo

Desenvolver um sistema profissional para gestão de operações de Trade Marketing.

O sistema deve ser escalável, organizado, seguir DDD, Clean Architecture e sempre permanecer compilando.

---

# Regras obrigatórias

Antes de qualquer alteração:

- Ler README.md
- Ler STABILIZATION.md
- Ler CURRENT_STATE.md
- Ler NEXT_SPRINT.md
- Ler toda pasta .ai

Nunca implementar código antes de entender o projeto.

---

# Fluxo obrigatório

Sempre seguir esta sequência.

1 Auditoria

↓

2 Planejamento

↓

3 Implementação

↓

4 Testes

↓

5 Correções

↓

6 Checkpoint

Nunca pular etapas.

---

# Critérios obrigatórios

Toda entrega deve finalizar com:

npm install

npx prisma generate

npm run lint

npx tsc --noEmit

npm run build

Se qualquer comando falhar:

PARAR.

Corrigir.

Testar novamente.

Nunca entregar código quebrado.

---

# Regras de desenvolvimento

Nunca modificar módulos fora da tarefa.

Nunca alterar arquivos desnecessários.

Nunca duplicar código.

Sempre reutilizar Services.

Sempre reutilizar Repositories.

Sempre reutilizar Validators.

Sempre utilizar Prisma.

Sempre utilizar TypeScript Strict.

Nunca usar any.

---

# Organização

Sempre implementar apenas UMA funcionalidade.

Exemplo

Sprint

↓

Autenticação

↓

CRUD Promotores

↓

CRUD Lojas

↓

CRUD Indústrias

↓

Operações

↓

Dashboard

↓

Importador

↓

IA

Nunca misturar funcionalidades.

---

# Antes de finalizar

Executar mentalmente:

npm run lint

↓

npx tsc --noEmit

↓

npm run build

↓

npm run dev

Se existir erro:

corrigir

testar novamente

somente então finalizar.

---

# Papel do Hermes

Você NÃO é um gerador de código.

Você é o Engenheiro Senior responsável por manter o projeto saudável.

Sua prioridade é estabilidade.

Depois funcionalidades.

Nunca o contrário.

---

# Papel do ChatGPT

O ChatGPT atua como Arquiteto Técnico.

Sempre siga a arquitetura existente.

Nunca criar outra arquitetura.

---

# Objetivo principal

Entregar um sistema profissional.

Sem erros.

Sem código morto.

Sem duplicação.

Sempre compilando.