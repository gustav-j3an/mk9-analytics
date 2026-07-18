# MK9 Analytics
# PROJECT_VISION.md

Versão: 1.0
Status: Documento de Visão do Produto
Responsável: Product Owner

---

# VISÃO

O MK9 Analytics será uma plataforma SaaS completa para gestão de operações de Trade Marketing.

Seu objetivo é automatizar todo o fluxo operacional de uma empresa de promotores, desde o cadastro de clientes até a execução das visitas em campo, geração de indicadores estratégicos e integração com Inteligência Artificial.

O sistema deverá substituir planilhas Excel, processos manuais e controles descentralizados.

O foco é produtividade, controle operacional, escalabilidade e inteligência de negócio.

---

# OBJETIVO PRINCIPAL

Construir o sistema mais completo para gestão de Trade Marketing do Brasil.

O software deverá permitir controlar:

- Operações
- Clientes
- Indústrias
- Redes
- Lojas
- Supervisores
- Promotores
- Visitas
- Checklists
- Fotos
- Pesquisas
- Rupturas
- Estoques
- Share
- Relatórios
- Dashboard Executivo
- Custos
- Lucro
- Integrações
- Inteligência Artificial

Tudo em uma única plataforma.

---

# PERFIS DE USUÁRIO

Administrador

Possui acesso total.

Pode criar usuários.

Pode criar operações.

Pode importar planilhas.

Pode editar qualquer informação.

Pode acessar todos os dashboards.

Pode visualizar indicadores financeiros.

---

Supervisor

Gerencia sua equipe.

Visualiza somente sua operação.

Acompanha promotores.

Recebe alertas.

Valida visitas.

Consulta indicadores.

---

Promotor

Visualiza apenas suas lojas.

Recebe roteiro diário.

Executa checklists.

Envia fotos.

Registra ruptura.

Informa estoque.

Realiza pesquisas.

Finaliza visita.

---

Cliente

Visualiza somente suas operações.

Acompanha indicadores.

Baixa relatórios.

Visualiza fotos.

Consulta histórico.

---

# MÓDULOS DO SISTEMA

## Dashboard Executivo

Painel principal.

Indicadores em tempo real.

Cobertura.

Pendências.

Conflitos.

Visitas.

Ranking.

Performance.

Lucro.

Custos.

Mapa.

---

## Operações

Criar operação.

Duplicar operação.

Fechar operação.

Arquivar.

Copiar mês anterior.

Gerenciar vigência.

---

## Clientes

Cadastro completo.

CNPJ.

Contratos.

Operações.

Histórico.

---

## Indústrias

Cadastro.

Produtos.

Metas.

Share.

KPIs.

---

## Redes

Cadastro.

Agrupamento de lojas.

Indicadores.

---

## Lojas

Cadastro.

Geolocalização.

Rede.

Cidade.

UF.

Supervisor.

Promotor.

Histórico.

---

## Promotores

Cadastro.

Documentação.

Contato.

Escala.

Agenda.

Performance.

Histórico.

GPS.

---

## Supervisores

Cadastro.

Equipe.

Regiões.

Indicadores.

---

## Visitas

Planejamento.

Execução.

Check-in.

Check-out.

GPS.

Fotos.

Tempo.

Pendências.

Cancelamentos.

---

## Checklists

Perguntas.

Categorias.

Respostas.

Obrigatoriedade.

Fotos.

Peso.

Pontuação.

---

## Relatórios

PDF.

Excel.

Dashboard.

Indicadores.

Clientes.

Operações.

Financeiro.

---

## Financeiro

Custos.

Receitas.

Margem.

Lucro.

Rentabilidade.

Comparativos.

---

## IA

Sugestão automática de roteiros.

Distribuição inteligente.

Identificação de conflitos.

Previsão de cobertura.

Análise de produtividade.

Resumo executivo.

Geração automática de relatórios.

Chat interno com IA.

---

# DASHBOARD

O Dashboard deverá mostrar:

Operação Atual

Quantidade de Promotores

Quantidade de Supervisores

Quantidade de Lojas

Quantidade de Indústrias

Quantidade de Clientes

Visitas Planejadas

Visitas Realizadas

Pendências

Cobertura

Conflitos

Tempo Médio

Ranking

Top Promotores

Top Supervisores

Mapa de Cobertura

Indicadores Financeiros

Lucro

Custo Operacional

---

# IMPORTAÇÃO

O sistema deverá importar:

Excel

CSV

Google Sheets

Google Drive

n8n

API

ERP

CRM

Toda importação deverá:

Validar dados

Normalizar

Eliminar duplicidade

Registrar histórico

Registrar logs

Possuir rollback

Nunca gravar diretamente no banco sem validação.

---

# MOBILE

O promotor utilizará:

Celular Android

PWA

Modo Offline

Sincronização automática

GPS

Fotos

Checklists

Assinatura digital

---

# INTEGRAÇÕES

Google Maps

Google Drive

Google Sheets

WhatsApp

n8n

Power BI

API REST

Webhook

SMTP

---

# SEGURANÇA

Autenticação.

Autorização.

JWT.

Refresh Token.

Logs.

Auditoria.

Controle por perfil.

Proteção de APIs.

LGPD.

Backup automático.

---

# INTELIGÊNCIA OPERACIONAL

O sistema deverá ser capaz de:

Detectar lojas descobertas.

Detectar conflitos.

Detectar excesso de visitas.

Detectar baixa produtividade.

Sugerir redistribuição.

Calcular necessidade de promotores.

Simular custos.

Simular lucro.

Gerar insights automaticamente.

---

# DIFERENCIAIS

O MK9 Analytics deverá possuir diferenciais que poucos sistemas oferecem.

Planejamento automático.

Distribuição inteligente.

Painéis executivos.

IA integrada.

Automação completa.

Integração com Google.

Integração com WhatsApp.

Importação inteligente.

Motor de validação.

Histórico completo.

Análise financeira.

Mapa operacional.

Gestão completa da operação.

---

# PADRÕES DE QUALIDADE

Todo código deve seguir:

DDD

Clean Architecture

SOLID

DRY

KISS

TypeScript Strict

Prisma

Zod

Shadcn UI

Tailwind

Nunca utilizar código duplicado.

Nunca quebrar a arquitetura existente.

Nunca entregar código sem testes de compilação.

---

# CRITÉRIOS DE ACEITAÇÃO

Toda entrega deve finalizar com sucesso em:

npm install

npx prisma generate

npx prisma migrate status

npm run lint

npx tsc --noEmit

npm run build

npm run dev

Se qualquer comando falhar:

Parar imediatamente.

Corrigir.

Testar novamente.

Somente finalizar quando tudo estiver funcionando.

---

# VISÃO DE LONGO PRAZO

O MK9 Analytics deverá evoluir para uma plataforma SaaS multiempresa.

Cada cliente possuirá seu próprio ambiente.

O sistema permitirá:

Múltiplas empresas.

Múltiplos contratos.

Múltiplas operações simultâneas.

Aplicativo mobile.

Portal do cliente.

Portal do promotor.

Portal do supervisor.

Portal administrativo.

API pública.

Marketplace de integrações.

Módulo de BI.

Machine Learning.

Assistente de IA especializado em Trade Marketing.

---

# MISSÃO DO PROJETO

Criar uma plataforma profissional, escalável e inteligente que se torne referência nacional em gestão de operações de Trade Marketing, permitindo que empresas substituam planilhas e processos manuais por uma solução moderna, automatizada e orientada por dados.