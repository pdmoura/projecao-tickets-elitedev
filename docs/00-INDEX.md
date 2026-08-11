# Desafio Elite Dev — Índice da Documentação

> Pacote de documentação de trabalho para o desafio da Plataforma de Eventos e Ingressos.
>
> **Status:** especificação pré-implementação. O plano final de implementação ainda não foi incluído intencionalmente.

## Objetivo

Esta pasta existe para tornar explícito o processo de engenharia antes da escrita do código. Ela registra o escopo do produto, regras de domínio, limites arquiteturais, decisões de UX, contratos de API e critérios de aceite, para que ferramentas de implementação como o Codex executem decisões já tomadas em vez de defini-las implicitamente.

## Documentos

1. **01-PRODUCT-SPEC.md** — objetivo do produto, atores, escopo, não escopo e definição de sucesso.
2. **02-FUNCTIONAL-SPEC.md** — fluxos de usuário, comportamento por tela, estados e regras de negócio.
3. **03-TECHNICAL-ARCHITECTURE.md** — stack, estrutura de monólito modular, limite de autenticação, consistência de dados, segurança e decisões de integração.
4. **04-DOMAIN-MODEL.md** — entidades, relacionamentos, máquinas de estado, invariantes e constraints propostas no nível do Prisma.
5. **05-API-CONTRACTS.md** — contratos HTTP internos iniciais, erros e convenções de payload.
6. **06-UX-UI-SPEC.md** — direção visual de cinema independente/bilhete impresso, comportamento responsivo e fluxo de trailer da TMDb.
7. **07-ACCEPTANCE-TESTS.md** — critérios de aceite e matriz de testes de maior valor.
8. **08-ARCHITECTURE-DECISIONS.md** — registro em estilo ADR das principais escolhas e trade-offs.
9. **09-CODEX-CONTEXT.md** — limites concisos de implementação destinados a serem fornecidos ao Codex antes dos prompts por tarefa.
10. **10-AI-USAGE-LOG-TEMPLATE.md** — template pronto para o repositório para documentar o uso de IA durante o desafio.
11. **11-README-OUTLINE.md** — estrutura do README final para preencher durante a implementação.
12. **12-REQUIREMENTS-TRACEABILITY.md** — matriz de cobertura requisito por requisito em relação ao desafio.
13. **13-SECURITY-CONCURRENCY-CHECKLIST.md** — checklist focado de segurança e verificação de condições de corrida.
14. **14-OFFICIAL-REFERENCES.md** — links para a documentação técnica primária usada durante a preparação da especificação.

## Precedência das fontes de verdade

Se dois documentos parecerem entrar em conflito, use esta ordem:

1. Enunciado do desafio fornecido pelo avaliador.
2. `08-ARCHITECTURE-DECISIONS.md` para decisões explicitamente congeladas.
3. `03-TECHNICAL-ARCHITECTURE.md` para limites técnicos.
4. `02-FUNCTIONAL-SPEC.md` para comportamento visível ao usuário.
5. `05-API-CONTRACTS.md` para os formatos iniciais dos endpoints.
6. Detalhes de implementação, que podem evoluir desde que o comportamento acima seja preservado.

## Decisões congeladas nesta etapa

- Experiência focada em cinema usando a TMDb como catálogo externo.
- Sessões com assentos marcados; sem fluxo de pista/entrada geral na V1.
- Monólito modular com Next.js + React + TypeScript.
- PostgreSQL + Prisma.
- Better Auth isolado por trás de `src/modules/auth/index.ts`.
- Sem WebSocket e sem estado temporário de assento `HELD`.
- Polling do mapa de assentos aproximadamente a cada 7 segundos enquanto a página estiver montada.
- Checkout atômico continua sendo a fonte de verdade para disponibilidade de assentos.
- Pagamentos simulados determinísticos.
- Token criptográfico opaco para validação por QR e token separado para compartilhamento.
- Validação atômica e de uso único do ingresso.
- Identidade visual: programação de cinema independente + bilhete impresso; explicitamente não semelhante à Netflix e não SaaS genérico.
- Seleção de filme pelo organizador inclui preview do trailer da TMDb quando disponível.

## Ainda não congelado

Os itens abaixo podem ser refinados sem invalidar este pacote:

- Nome do produto e logo.
- Valores HEX exatos das cores e fontes.
- Escolhas exatas de biblioteca de componentes, se houver.
- Nomenclatura exata das URLs quando a semântica equivalente for preservada.
- Nomes exatos dos campos do Prisma, desde que o significado e as constraints do domínio permaneçam iguais.
- Provedor final do banco de dados em produção.
- Sequenciamento exato das tarefas e cronograma de implementação de sete dias.

## Handoff de design

Referências visuais e especificações de design prontas para implementação:

- `design/README.md`
- `design/BRAND-SPEC.md`
- `design/DESIGN-SPEC.md`
- `design/SCREEN-INVENTORY.md`
- `design/DESIGN-DECISIONS.md`
- `design/UI-TOKENS.md`

As referências visuais aprovadas estão agrupadas por papel do usuário em:

- `design/customer/`
- `design/organizer/`
- `design/gate/`
- `design/auth/`

As especificações escritas de produto e arquitetura continuam sendo autoritativas sobre textos residuais ou controles visíveis nas imagens dos mockups.
