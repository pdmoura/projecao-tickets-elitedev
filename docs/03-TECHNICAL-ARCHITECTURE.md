# Arquitetura Técnica

## 1. Estilo de arquitetura

Usar um **monólito modular** em um único repositório Next.js.

```text
Navegador
  |
  v
Next.js App Router
  |-- UI pública/cliente
  |-- UI do organizador
  |-- UI da portaria
  |-- route handlers / operações de servidor
  |
  v
Módulos da aplicação
  |-- auth
  |-- catalog
  |-- events
  |-- seats
  |-- reservations
  |-- payments
  |-- tickets
  `-- checkin
  |
  v
Prisma
  |
  v
PostgreSQL

Módulo de catálogo ---> API TMDb
```

O objetivo é manter simplicidade de deploy sem concentrar todas as responsabilidades em route handlers/componentes.

## 2. Stack proposta

- TypeScript
- React
- Next.js App Router
- PostgreSQL
- Prisma ORM
- Better Auth por trás de um adapter pertencente à aplicação
- Zod para validação de entrada
- Tailwind CSS para primitives/layout de estilo
- biblioteca para geração de QR
- biblioteca de leitura de QR no navegador compatível com APIs de câmera
- Vitest para testes unitários/de integração
- Playwright para fluxos E2E selecionados, se houver tempo
- Docker Compose para PostgreSQL local
- deploy compatível com Vercel

## 3. Estrutura de diretórios

Estrutura-alvo; nomes exatos de arquivos podem evoluir, mas os limites dos módulos devem permanecer.

```text
src/
├── app/
│   ├── (public)/
│   │   ├── page.tsx
│   │   └── events/
│   │       └── [eventId]/page.tsx
│   ├── (auth)/
│   ├── organizer/
│   │   └── events/
│   ├── customer/
│   │   └── tickets/
│   ├── gate/
│   │   └── check-in/
│   └── api/
│       ├── auth/[...all]/route.ts
│       ├── catalog/
│       ├── events/
│       ├── checkout/
│       ├── tickets/
│       └── check-in/
│
├── modules/
│   ├── auth/
│   │   ├── index.ts              # ÚNICA porta de entrada pública de auth
│   │   ├── better-auth.ts        # implementação específica do fornecedor
│   │   ├── auth.types.ts
│   │   └── auth.errors.ts
│   ├── catalog/
│   │   ├── tmdb.client.ts
│   │   ├── catalog.service.ts
│   │   ├── catalog.schemas.ts
│   │   └── catalog.types.ts
│   ├── events/
│   ├── seats/
│   ├── reservations/
│   ├── payments/
│   ├── tickets/
│   └── checkin/
│
├── components/
│   ├── ui/
│   ├── movie/
│   ├── events/
│   ├── seats/
│   └── tickets/
│
├── lib/
│   ├── db/
│   ├── crypto/
│   ├── env/
│   └── http/
│
└── styles/

prisma/
├── schema.prisma
├── migrations/
└── seed.ts

tests/
├── integration/
├── unit/
└── e2e/
```

## 4. Limite de autenticação

### 4.1 Regra rígida

`better-auth` não deve ser importado fora do módulo de implementação de autenticação.

O restante da aplicação importa apenas:

```ts
import {
  getSession,
  requireUser,
  requireRole,
  requireOwner,
} from "@/modules/auth";
```

### 4.2 Contrato público obrigatório do adapter

`src/modules/auth/index.ts` expõe:

```ts
getSession(req)
requireUser(req)
requireRole(req, role)
requireOwner(req, resourceOwnerId)
```

Semântica:

- `getSession(req)` — retorna sessão normalizada da aplicação ou `null`.
- `requireUser(req)` — retorna usuário/sessão autenticado e normalizado; caso contrário, lança um erro de autenticação da aplicação.
- `requireRole(req, role)` — autentica e exige o papel exato/aceito da aplicação.
- `requireOwner(req, resourceOwnerId)` — autentica e verifica se o usuário atual é proprietário do recurso alvo.

O adapter pode mapear internamente o formato de sessão/usuário do Better Auth para um tipo pertencente à aplicação.

### 4.3 Por que isso existe

Better Auth é infraestrutura. Os módulos da aplicação devem depender do contrato de autenticação/autorização do produto, e não de APIs do fornecedor.

Uma futura migração para `bcrypt + JWT` manual ou outro provedor deve exigir principalmente a reescrita do módulo de auth, e não de todos os módulos de domínio.

### 4.4 Aplicação da regra

Preferir uma regra de imports restritos no ESLint para que imports de `better-auth` fora de `src/modules/auth/**` falhem no lint/CI.

## 5. Autorização

Verificações no servidor são obrigatórias no limite da operação.

Exemplos:

```text
criar evento      -> ORGANIZER
editar evento     -> ORGANIZER + proprietário
publicar evento   -> ORGANIZER + proprietário
checkout           -> CUSTOMER
meus ingressos     -> CUSTOMER + registros próprios
check-in            -> GATE
```

Guards de rota no cliente e controles ocultos melhoram a UX, mas não são confiáveis para autorização.

## 6. Integração com TMDb

### 6.1 Limite

O navegador chama a API/serviço da aplicação. Apenas o código de catálogo no servidor conversa com a TMDb usando credenciais.

```text
Navegador -> /api/catalog/... -> módulo de catálogo -> TMDb
```

### 6.2 Capacidades obrigatórias do catálogo

- `searchMovies(query)`
- `getMovieDetails(movieId)`
- `getMovieVideos(movieId)`

A API v3 da TMDb expõe operações de busca de filmes, detalhes de filmes e `/movie/{movie_id}/videos`. Armazenar apenas os campos necessários para este produto.

### 6.3 Normalização

Não espalhar os tipos de resposta da TMDb por toda a base de código. Mapeá-los para DTOs locais de catálogo.

### 6.4 Snapshot

Quando um organizador usa um filme em um evento, persistir o snapshot relevante do filme dentro dos dados pertencentes ao evento ou em um modelo dedicado de snapshot. Eventos já criados devem renderizar sem uma requisição ao vivo para a TMDb.

## 7. Modelo de consistência de assentos

### 7.1 Estados persistidos

A V1 persiste:

- `AVAILABLE`
- `SOLD`

Não existe estado `HELD`.

### 7.2 Polling

A página de assentos faz polling aproximadamente a cada 7 segundos enquanto estiver montada. O polling:

- existe para manter a UX mais atualizada;
- não é um lock;
- deve preservar estado local compatível dos assentos selecionados;
- deve remover e notificar quando um assento selecionado se tornar `SOLD`;
- é interrompido ao navegar para o checkout/desmontar.

### 7.3 Autoridade

A transação/escrita condicional no PostgreSQL é autoritativa.

Dois compradores solicitando o mesmo assento devem resultar em exatamente uma aquisição bem-sucedida.

### 7.4 Conflito no checkout

Retornar HTTP `409` com código de erro estável da aplicação quando o estoque solicitado não puder ser adquirido.

## 8. Limites transacionais

Um checkout bem-sucedido deve preservar semântica de tudo-ou-nada para o estado persistente da compra.

Transação conceitual:

1. validar evento/cliente/requisição;
2. obter/confirmar o resultado do simulador de pagamento;
3. adquirir atomicamente todos os assentos solicitados;
4. criar reserva;
5. criar itens da reserva;
6. criar registro de pagamento `APPROVED`;
7. criar ingressos e credenciais seguras;
8. commit.

Se nem todos os assentos solicitados puderem ser adquiridos, nenhuma compra/ingresso bem-sucedido deve ser confirmado.

Um pagamento recusado não deve adquirir assentos.

## 9. Simulação de pagamento

Implementar uma abstração/serviço `PaymentSimulator` para que o comportamento de pagamento fique isolado da orquestração do checkout.

Propriedades:

- entradas determinísticas;
- fluxos `APPROVED` e `DECLINED`;
- nenhuma transação financeira externa;
- nunca persistir CVV/número completo do cartão simulado;
- registros de pagamento armazenam status, valor, nome do provedor e uma referência segura do simulador.

## 10. Segurança do ingresso

### 10.1 Token de validação

Gerar um token aleatório de alta entropia usando primitivas criptográficas do Node.

O cliente/ingresso recebe a credencial opaca em texto bruto.

O banco armazena um hash unidirecional, como SHA-256, da credencial em vez de depender de um ID de ingresso previsível.

### 10.2 Código manual

Gerar um código único separado e amigável para humanos. Ele pode resolver um ingresso como alternativa na portaria, mas deve ser longo/aleatório o suficiente para resistir a tentativas casuais de adivinhação. Rate limiting/proteção contra tentativas manuais é um hardening opcional útil.

### 10.3 Token de compartilhamento

Usar um token aleatório/credencial com hash separado para compartilhamento do ingresso. Não reutilizar a credencial de validação como mecanismo de autorização do compartilhamento.

## 11. Consistência do check-in

O check-in do ingresso é uma operação no estilo compare-and-set.

Um resultado `VALID` exige que a mesma operação/transação faça a transição do ingresso não utilizado para usado. Duas tentativas concorrentes não podem ser bem-sucedidas simultaneamente.

Condição conceitual sugerida:

```text
update ticket
set usedAt = now
where ticket = X
  and usedAt is null
  and eventId = selectedEvent
```

Interpretar cuidadosamente o resultado do update para diferenciar `WRONG_EVENT`, `ALREADY_USED` e `INVALID` sem consumir o ingresso errado.

Registrar tentativas/resultados de validação em `TicketValidation` quando apropriado.

## 12. Modelo de erros

Usar códigos de erro da aplicação independentes de erros do fornecedor/banco.

Exemplos recomendados:

```text
AUTH_REQUIRED
FORBIDDEN
RESOURCE_NOT_FOUND
VALIDATION_ERROR
EVENT_NOT_PUBLISHED
SEAT_UNAVAILABLE
PAYMENT_DECLINED
CATALOG_UNAVAILABLE
TICKET_INVALID
TICKET_ALREADY_USED
TICKET_WRONG_EVENT
```

Mapear erros para status HTTP de forma consistente.

## 13. Configuração de ambiente

Variáveis esperadas podem incluir:

```text
DATABASE_URL
BETTER_AUTH_SECRET
BETTER_AUTH_URL
TMDB_ACCESS_TOKEN
APP_URL
```

As variáveis exatas do Better Auth seguem a integração escolhida. Validar valores de ambiente obrigatórios na inicialização/uso do servidor.

Nenhum segredo deve ser commitado no Git.

## 14. Desenvolvimento local

Recomendado:

```text
Docker Compose -> PostgreSQL
Prisma migrate -> schema
Prisma seed    -> contas do avaliador/eventos de demonstração
Next dev       -> aplicação
```

O README deve incluir os comandos exatos.

## 15. Observabilidade/debugging

Manter logs leves, mas úteis:

- contexto de falha do catálogo externo sem segredos;
- conflito/código de erro do checkout;
- falhas inesperadas de check-in;
- nenhum token bruto seguro de QR/compartilhamento em logs com padrão de produção.

## 16. Referências técnicas verificadas antes da implementação

- documentação de integração Next.js e API de servidor/sessão do Better Auth;
- documentação de Route Handlers do Next.js App Router;
- documentação da TMDb v3 para busca/detalhes/vídeos de filmes;
- documentação do Prisma para transações e constraints únicas compostas.

Essas referências devem ser verificadas novamente quando a implementação começar caso as versões dos pacotes sejam diferentes das versões do lockfile final.
