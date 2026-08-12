# Projeção

> cinema que acontece

Plataforma full-stack para criar sessões de cinema, vender assentos marcados e validar ingressos digitais. O foco do MVP é o ciclo completo: organização da sessão, compra transacional, ticket seguro e check-in de uso único.

<p align="center">
  <img src="docs/media/projecao-home.webp" alt="Página inicial do Projeção" width="100%" />
</p>

Este projeto foi desenvolvido para o Desafio Elite Dev da Verzel. Tenho 24 anos, sou desenvolvedor júnior e estou perto de concluir a faculdade. Um amigo já tinha me pedido algo parecido, mas eu não consegui desenvolver na época por falta de tempo. O desafio foi uma oportunidade de finalmente explorar a ideia com mais cuidado: quis entregar algo funcional, com identidade própria, e deixar uma base que possa evoluir depois.

## Demo publicada

- URL: [projecao-tickets.vercel.app](https://projecao-tickets.vercel.app)

## Demonstração

### Validação na Portaria

O fluxo mostra uma credencial válida sendo utilizada e uma segunda tentativa retornando ingresso já utilizado.

[▶ Ver demonstração da Portaria no mobile](docs/media/projecao-gate-mobile-highlight.mp4)

### Visão geral

[▶ Ver uma demonstração rápida da aplicação](docs/media/projecao-desktop-highlight.mp4)

## Fluxo rápido de avaliação

1. Acesse a programação e abra uma sessão futura.
2. Entre como cliente, escolha um ou mais assentos e conclua com o cartão aprovado.
3. Abra **Meus ingressos**, confira o QR e o código manual; opcionalmente gere um link de compartilhamento.
4. Entre como portaria, selecione a mesma sessão e valide o QR ou código. A primeira leitura é `VALID`; a segunda é `ALREADY_USED`. Um ingresso de outra sessão retorna `WRONG_EVENT`; uma credencial inválida, `INVALID`.
5. Para uma recusa determinística, tente outra compra com o cartão de recusa. A resposta é `402 PAYMENT_DECLINED` e o assento continua disponível.

## Contas de demonstração

Todas as contas seed usam a senha `ProjecaoDemo2026!`.

| Papel | E-mail | Destino após login |
|---|---|---|
| Organizador | `organizador@projecao.local` | `/organizer` |
| Cliente 1 | `cliente1@projecao.local` | `/` |
| Cliente 2 | `cliente2@projecao.local` | `/` |
| Portaria | `portaria@projecao.local` | `/gate` |

## Funcionalidades

- Descoberta e busca de sessões futuras publicadas.
- Seleção de assentos com polling aproximado de 7 segundos, sem `HELD`.
- Checkout transacional PostgreSQL: uma compra concorrente vence e conflitos retornam `409 SEAT_UNAVAILABLE`.
- Simulador de pagamento determinístico e sem persistência de cartão/CVV.
- Ingresso por assento, QR opaco, código manual e visual de bilhete impresso.
- Compartilhamento por token rotacionável, sem transferir a propriedade do ingresso.
- Check-in manual ou por câmera com `VALID`, `INVALID`, `ALREADY_USED` e `WRONG_EVENT`.
- Criação, edição de rascunho e publicação de sessões pelo organizador usando o catálogo TMDb server-side.

## Stack

- Node.js 24, pnpm 11.1.3
- Next.js 16.3, React 19, TypeScript estrito e Tailwind CSS 4
- PostgreSQL, Prisma 7 e Better Auth
- Vitest e Playwright

## Arquitetura

O projeto é um monólito modular. Páginas e Route Handlers mantêm a composição HTTP/UI; regras de domínio vivem em `src/modules/**`.

```text
app / componentes
        ↓
 módulos de domínio (auth, catalog, events, seats, checkout, tickets, check-in)
        ↓
 Prisma + PostgreSQL / serviços externos server-side
```

O único limite público de autenticação é `src/modules/auth/index.ts`. Nenhum outro módulo importa `better-auth` diretamente. A TMDb também fica restrita ao módulo server-side de catálogo; eventos publicados usam snapshots persistidos.

## Configuração local

### Pré-requisitos

- Node.js `>=24.0.0 <25`
- pnpm `11.1.3`
- Duas bases PostgreSQL locais isoladas: uma de desenvolvimento e outra de testes

### Variáveis de ambiente

Copie `.env.example` para `.env.local` e preencha apenas valores locais. Nunca versione esse arquivo.

| Variável | Finalidade |
|---|---|
| `APP_URL` | URL pública da aplicação local, por exemplo `http://localhost:3000` |
| `DATABASE_URL` | Conexão de runtime para o banco de desenvolvimento |
| `DIRECT_URL` | Conexão direta para migrations e tooling Prisma |
| `TEST_DATABASE_URL` | Banco PostgreSQL local isolado para integrações |
| `BETTER_AUTH_SECRET` | Segredo de sessão do Better Auth |
| `BETTER_AUTH_URL` | URL canônica usada pelo Better Auth |
| `TMDB_ACCESS_TOKEN` | API Read Access Token da TMDb, usado somente no servidor |
| `TICKET_CREDENTIAL_ENCRYPTION_KEY` | Base64 que representa exatamente 32 bytes para AES-256-GCM |

### Banco local com Docker

O Compose sobe somente o PostgreSQL; a aplicação continua rodando no host.

```bash
docker compose up -d
docker compose ps
```

O banco de desenvolvimento fica em `localhost:55432` (usuário, senha e banco: `projecao`, `projecao` e `projecao_t02`). A inicialização cria também `projecao_t02_test` para os testes de integração.

Para parar o banco, use `docker compose down`. Use `docker compose down -v` somente se quiser apagar os dados locais.

Também é possível usar um PostgreSQL instalado localmente: basta apontar `DATABASE_URL`, `DIRECT_URL` e `TEST_DATABASE_URL` para duas bases isoladas equivalentes.

### Instalação, migration e seed

```bash
pnpm install
pnpm db:migrate:deploy
pnpm db:seed
pnpm dev
```

`DIRECT_URL` é usado para migrations/tooling; `DATABASE_URL`, para o runtime. Antes de executar os testes de integração, aplique a mesma migration na base apontada por `TEST_DATABASE_URL`, sem reutilizar a base de desenvolvimento.

### Regras temporais

- Customer vê e compra somente sessões `PUBLISHED` futuras. Em `now >= startsAt`, a venda encerra e o checkout também rejeita a operação no servidor com `EVENT_ALREADY_STARTED`.
- Gate pode validar qualquer sessão `PUBLISHED` selecionada, sem usar `startsAt` como janela de admissão. Uma evolução futura pode adicionar uma janela explícita de admissão.
- Organizador edita ou exclui sessões sem histórico transacional conforme as regras atuais. Com histórico, a sessão fica somente leitura; uma sessão passada não volta para o futuro.

## Pagamento simulado

| Cartão | Resultado |
|---|---|
| `4242 4242 4242 4242` | Aprovado |
| `4000 0000 0000 0002` | Recusado com `402 PAYMENT_DECLINED` |

Validade futura e CVV são usados apenas durante a simulação. Número completo do cartão e CVV não são armazenados.

O checkout depende de um contrato `PaymentProvider`, implementado agora por `SimulatedPaymentProvider`. Isso deixa espaço para trocar o provedor no futuro sem acoplar o domínio a um gateway real.

## Consistência e segurança

- O polling só melhora a UX; o banco é a autoridade de disponibilidade.
- Checkout adquire locks PostgreSQL `FOR UPDATE` em ordem determinística, atualiza assentos condicionalmente e cria reserva, pagamento e tickets em uma transação curta.
- O token do QR tem 256 bits de CSPRNG e só é persistido como SHA-256; uma cópia AES-256-GCM permite reabrir o mesmo QR sem armazenar o token em texto puro.
- Código manual e token de compartilhamento são credenciais separadas. O share token é armazenado apenas como hash e cada nova geração invalida o link anterior.
- O check-in consome o ingresso com compare-and-set atômico; leituras concorrentes terminam em exatamente um `VALID` e um `ALREADY_USED`.

O scanner usa `BarcodeDetector` quando o navegador suporta a API e faz fallback para `jsQR`; o campo de código manual continua disponível.

Detalhes e trade-offs estão em [docs/03-TECHNICAL-ARCHITECTURE.md](docs/03-TECHNICAL-ARCHITECTURE.md), [docs/08-ARCHITECTURE-DECISIONS.md](docs/08-ARCHITECTURE-DECISIONS.md) e [docs/13-SECURITY-CONCURRENCY-CHECKLIST.md](docs/13-SECURITY-CONCURRENCY-CHECKLIST.md).

## TMDb

O organizador pesquisa e visualiza detalhes/trailer por endpoints internos. A credencial da TMDb não chega ao navegador e a ausência de trailer é um estado válido. No momento da criação, o filme é persistido como `MovieSnapshot`, portanto eventos publicados continuam renderizando sem uma chamada TMDb ao vivo.

Leituras de busca, descoberta, tendências, gêneros, detalhes e vídeos usam cache server-side com TTL e retry transitório. A página seguinte do catálogo pode ser buscada antecipadamente sem bloquear a resposta atual.

Este produto usa a API TMDb, mas não é endossado nem certificado pela TMDb.

## Testes e quality gate

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm test:integration
pnpm test:e2e
pnpm build
git diff --check
```

Os testes cobrem papéis e ownership, boundary do Better Auth, catálogo mockado, checkout aprovado/recusado, conflitos e concorrência real com PostgreSQL, criptografia/QR, tickets, rotação de share, quatro resultados de check-in e o caminho E2E de descoberta até a seleção inicial de assento.

## Deploy

O demo publicado usa [Vercel](https://projecao-tickets.vercel.app) e Neon PostgreSQL. O runtime usa `DATABASE_URL`; migrations usam `DIRECT_URL` e devem ser aplicadas de forma controlada com `pnpm db:migrate:deploy`. Depois, execute `pnpm db:seed`. O seed é idempotente e nunca roda durante `next build` ou automaticamente em todo deploy.

Para Vercel, configure `APP_URL`, `DATABASE_URL`, `DIRECT_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `TICKET_CREDENTIAL_ENCRYPTION_KEY` e, para o fluxo de organizador/TMDb, `TMDB_ACCESS_TOKEN`. Não use `TEST_DATABASE_URL` em produção.

## Limitações conhecidas

- Pagamento é uma simulação determinística; não há adquirente real.
- Não há reserva temporária (`HELD`), WebSocket, e-mail, cancelamento, reembolso ou recuperação de senha.
- A leitura por câmera depende de HTTPS, permissão da câmera e suporte do navegador a `BarcodeDetector`; o código manual continua disponível em todos os casos.
- `/privacy` e `/terms` são páginas institucionais simples deste demo; não substituem orientação jurídica.

## Uso de IA

O registro de ferramentas, contribuições e revisão humana está em [docs/10-AI-USAGE-LOG.md](docs/10-AI-USAGE-LOG.md). A documentação de produto, arquitetura, decisões e critérios de aceite permanece versionada em [docs/](docs/00-INDEX.md).
