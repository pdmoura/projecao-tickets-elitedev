# Matriz de Rastreabilidade de Requisitos

Status consolidado após T12. A cobertura detalhada está nos testes unitários, de integração e E2E do repositório.

| ID | Requisito | Evidência principal | Status |
|---|---|---|---|
| FE-01 | Navegar por eventos publicados com data, local e preço | `src/app/page.tsx`, `tests/e2e/home.spec.ts` | Implementado |
| FE-02 | Buscar eventos publicados | `src/modules/events/**`, `tests/integration/events.test.ts` | Implementado |
| FE-03 | Organizador cria/gerencia eventos | `src/app/organizer/**`, `tests/integration/organizer-events.test.ts` | Implementado |
| FE-04 | Mapa de assentos | `src/components/seat-map.tsx`, `tests/unit/seat-selection.test.ts` | Implementado |
| FE-05 | Confirmação de pagamento | `src/modules/checkout/**`, `tests/integration/checkout.test.ts` | Implementado |
| FE-06 | Recusa de pagamento | `SimulatedPaymentProvider`, `tests/unit/payment-simulator.test.ts` | Implementado |
| FE-07 | Meus ingressos | `src/app/tickets/**`, `tests/integration/tickets.test.ts` | Implementado |
| FE-08 | QR no ingresso | `src/modules/tickets/**`, `tests/unit/ticket-credentials.test.ts` | Implementado |
| FE-09 | Tela de validação da portaria | `src/app/gate/page.tsx`, `src/components/gate-check-in.tsx` | Implementado |
| FE-10 | Quatro resultados de check-in | `src/modules/check-in/**`, `tests/integration/check-in.test.ts` | Implementado |
| FE-11 | Leitura QR pela câmera | `src/components/qr-camera-scanner.tsx`, `tests/unit/qr-camera-scanner.test.ts` | Implementado com fallback manual |
| FE-12 | Alternativa por código manual | `src/app/api/check-in/manual/route.ts`, testes de check-in | Implementado |
| BE-01 | Integração externa TMDb | `src/modules/catalog/**`, `tests/unit/catalog.test.ts` | Implementado |
| BE-02 | Três papéis de autenticação | `src/modules/auth/**`, `tests/integration/auth.test.ts` | Implementado |
| BE-03 | Eventos, reservas e ingressos persistidos | `prisma/schema.prisma`, migration inicial | Implementado |
| BE-04 | Impedir venda duplicada | `src/modules/checkout/checkout.repository.ts`, testes concorrentes | Implementado |
| BE-05 | QR não forjável | `ticket-credentials.ts`, testes de crypto | Implementado |
| BE-06 | Compartilhar ingresso por link | `share-credentials.ts`, `tests/integration/tickets.test.ts` | Implementado |
| BE-07 | Não validar duas vezes | `src/modules/check-in/**`, teste concorrente | Implementado |
| BE-08 | Cobrança simulada | `src/modules/checkout/**` | Implementado |
| TECH-01 | Frontend React | Next.js App Router | Implementado |
| TECH-02 | Backend Node | Route Handlers Next.js | Implementado |
| TECH-03 | Banco de dados | PostgreSQL + Prisma | Implementado |
| NFR-01 | Escopo de sete dias | `docs/15-IMPLEMENTATION-PLAN.md` | Planejado e executado por milestones |
| NFR-02 | README de configuração | `README.md` | Implementado |
| NFR-03 | Limitações conhecidas | `README.md` | Implementado |
| NFR-04–06 | Seed de organizer, dois customers e gate | `prisma/seed.ts`, `tests/integration/auth.test.ts` | Implementado |
| NFR-07 | Evento seed publicado com assentos | `prisma/seed.ts`, `tests/integration/events.test.ts` | Implementado |
| NFR-08 | Repositório público no GitHub | [pdmoura/projecao-tickets-elitedev](https://github.com/pdmoura/projecao-tickets-elitedev) | Implementado |
| NFR-09 | Commits descritivos | Histórico Git | Implementado |
| AI-01–03 | Transparência sobre IA e specs versionadas | `docs/09-CODEX-CONTEXT.md`, `docs/10-AI-USAGE-LOG.md` | Implementado |
| OPT-01 | Busca básica | Busca por título no catálogo público | Implementado |
| OPT-02 | Área leve do organizador | `src/app/organizer/**` | Implementado |
| OPT-03 | Cancelamento/reembolso | Fora do MVP | Fora de escopo |
| OPT-04 | Atualização de assentos | Polling de ~7s em `seat-polling.ts` | Alternativa escolhida |
| OPT-05 | Docker Compose | `compose.yml`, somente PostgreSQL local | Implementado |
| OPT-06 | Testes | Vitest + Playwright | Implementado |
| OPT-07 | Deploy | [Vercel](https://projecao-tickets.vercel.app) | Implementado; atualização deste commit depende de push/deploy posterior |
| EXTRA-01 | Trailer TMDb | Modal de seleção do organizador | Implementado |
| EXTRA-02 | Merge do polling | `mergeSeatAvailability`, testes unitários | Implementado |
| EXTRA-03 | Adapter Better Auth | Boundary ESLint + teste de import | Implementado |
| EXTRA-04 | Identidade editorial | tokens, assets e revisão visual | Implementado |

## Notas de encerramento

- A matriz não substitui os testes automatizados nem a revisão manual de câmera em um dispositivo compatível.
- A publicação e o bootstrap controlado do ambiente de produção continuam ações operacionais separadas do código versionado.
