# Conciliação de visitas

O módulo mantém evidências de checklist separadas das visitas planejadas. A
correspondência automática exige uma única visita para
`operationId + date + storeId + industryId`. Sugestões com data diferente
nunca são vinculadas automaticamente.

O schema atual de `Store` e os layouts importados não possuem CNPJ. O
resolvedor está preparado para usar nome, bandeira, cidade e UF; CNPJ só poderá
ser usado como evidência forte quando esse dado passar a existir no cadastro e
no checklist. Nenhuma associação é inferida a partir de um CNPJ ausente.

## Segurança administrativa

Ainda não existe sessão autenticada no projeto. Por isso, as mutações de alias,
reprocessamento e revisão retornam `403 ADMIN_AUTH_REQUIRED` fora de
`NODE_ENV=development`. O papel salvo em `User.role` não é usado como prova
de autenticação e nenhuma chave administrativa é enviada ao frontend.

## Regras propostas para a próxima sprint

- Até 8 visitas por promotor/dia: capacidade normal.
- De 9 a 10 visitas: alerta de capacidade.
- Acima de 10 visitas: alerta crítico.
- O limite deverá ser configurável por operação.
- Editar um roteiro `APROVADO` deverá criar uma nova versão `RASCUNHO`.
- A versão anterior continuará `APROVADA` enquanto a nova estiver em revisão.
- Ao aprovar a nova versão, a anterior deverá mudar para `SUBSTITUÍDA`.
