# Contratos Iniciais de API

> Estes contratos são um guia de implementação, não uma promessa de que toda rota deva usar exatamente estes caminhos. Preserve a semântica e o comportamento estável de erros caso a nomenclatura das rotas mude.

## 1. Convenções

### Sucesso em JSON

Preferir respostas diretas do recurso ou um wrapper consistente. Evitar aninhamento desnecessário.

### Erro em JSON

Formato recomendado:

```json
{
  "error": {
    "code": "SEAT_UNAVAILABLE",
    "message": "Um ou mais assentos selecionados não estão mais disponíveis.",
    "details": {
      "seats": ["A7"]
    }
  }
}
```

`code` é estável para a lógica do cliente. `message` pode ser localizado/refinado.

### Mapeamento HTTP

```text
400 VALIDATION_ERROR
401 AUTH_REQUIRED
403 FORBIDDEN
404 RESOURCE_NOT_FOUND
409 SEAT_UNAVAILABLE / conflito de estado de negócio
422 validação semântica opcional, se usada de forma consistente
502/503 CATALOG_UNAVAILABLE
500 erro interno inesperado
```

---

## 2. Autenticação

O Better Auth é responsável pelo endpoint de integração com o framework dentro do módulo de auth/rota Next.js, mas nenhum módulo de domínio chama o Better Auth diretamente.

O código de servidor da aplicação usa:

```ts
getSession(req)
requireUser(req)
requireRole(req, role)
requireOwner(req, resourceOwnerId)
```

A UI pode usar uma facade de cliente de auth exportada pelo módulo de autenticação caso sejam necessários hooks client-side de login/logout/sessão. Preservar o mesmo princípio de isolamento do fornecedor.

---

## 3. Catálogo

### `GET /api/catalog/movies?query={text}&page={n}`

Auth: `ORGANIZER` recomendado, porque a busca no catálogo existe para criação de eventos; não é necessário torná-la pública.

Resposta:

```json
{
  "items": [
    {
      "externalId": 157336,
      "title": "Interstellar",
      "releaseDate": "2014-11-05",
      "posterUrl": "...",
      "overview": "..."
    }
  ],
  "page": 1,
  "totalPages": 3
}
```

### `GET /api/catalog/movies/{externalId}`

Retorna detalhe normalizado do filme.

### `GET /api/catalog/movies/{externalId}/videos`

Retorna candidatos de vídeo úteis normalizados ou um trailer selecionado.

Resposta recomendada:

```json
{
  "trailer": {
    "site": "YouTube",
    "key": "...",
    "name": "Official Trailer"
  }
}
```

ou:

```json
{ "trailer": null }
```

A ausência de trailer é um estado normal de sucesso.

---

## 4. Eventos

### `GET /api/events`

Descoberta pública/de eventos pelo cliente.

Exemplos de query:

```text
?search=interstellar
```

Expor apenas eventos publicados apropriados para navegação, a menos que um endpoint específico do organizador seja usado.

### `GET /api/events/{eventId}`

Retorna detalhes públicos do evento.

### `GET /api/organizer/events`

Auth: `ORGANIZER`.

Retorna os eventos do organizador atual.

### `POST /api/organizer/events`

Auth: `ORGANIZER`.

Exemplo de requisição:

```json
{
  "movie": {
    "externalId": 157336,
    "source": "TMDB"
  },
  "startsAt": "2026-08-20T23:00:00.000Z",
  "venueName": "Cine Elite",
  "roomName": "Sala 2",
  "rows": 8,
  "seatsPerRow": 10,
  "priceCents": 3500
}
```

O servidor resolve/valida o filme da TMDb e persiste o snapshot necessário para o evento.

### `PATCH /api/organizer/events/{eventId}`

Auth: `ORGANIZER` + proprietário.

### `POST /api/organizer/events/{eventId}/publish`

Auth: `ORGANIZER` + proprietário.

Resposta: evento atualizado ou erro `409`/de validação caso não possa ser publicado.

---

## 5. Disponibilidade de assentos

### `GET /api/events/{eventId}/seats`

Usado no carregamento inicial do mapa de assentos e no polling de ~7s.

Resposta:

```json
{
  "eventId": "...",
  "version": "optional-cache-or-update-marker",
  "seats": [
    {
      "id": "...",
      "label": "A1",
      "row": "A",
      "number": 1,
      "status": "AVAILABLE"
    },
    {
      "id": "...",
      "label": "A2",
      "row": "A",
      "number": 2,
      "status": "SOLD"
    }
  ]
}
```

As regras de merge do cliente estão definidas em `02-FUNCTIONAL-SPEC.md`.

---

## 6. Checkout

### `POST /api/checkout`

Auth: `CUSTOMER`.

Requisição:

```json
{
  "eventId": "evt_...",
  "seatIds": ["seat_1", "seat_2"],
  "payment": {
    "method": "SIMULATED_CARD",
    "cardNumber": "4111111111111111",
    "expiry": "12/30",
    "cvv": "123"
  }
}
```

Os dados do simulador são usados transitoriamente e não são armazenados como credenciais brutas de cartão.

Sucesso:

```json
{
  "reservationId": "res_...",
  "paymentStatus": "APPROVED",
  "tickets": [
    {
      "id": "ticket_public_id_if_needed",
      "seatLabel": "A1"
    }
  ]
}
```

Recomendação para recusa:

O status HTTP pode ser `402`, `409` ou uma resposta de negócio `200`, mas escolha uma convenção e documente. Recomendação para clareza neste desafio: reservar `409` para conflitos de assento; usar `402 Payment Required` ou `422` com `PAYMENT_DECLINED` para recusa determinística do simulador.

Exemplo:

```json
{
  "error": {
    "code": "PAYMENT_DECLINED",
    "message": "O pagamento simulado foi recusado."
  }
}
```

Conflito de assento:

```http
409 Conflict
```

```json
{
  "error": {
    "code": "SEAT_UNAVAILABLE",
    "message": "Um ou mais assentos não estão mais disponíveis.",
    "details": {
      "seatIds": ["seat_2"],
      "seatLabels": ["A2"]
    }
  }
}
```

---

## 7. Ingressos do cliente

### `GET /api/tickets`

Auth: `CUSTOMER`.

Retorna ingressos pertencentes ao cliente atual.

### `GET /api/tickets/{ticketId}`

Auth: `CUSTOMER` + proprietário.

Retorna dados de apresentação do ingresso e payload/URL do QR, conforme apropriado.

Não expor `validationTokenHash` nem `shareTokenHash`.

### `POST /api/tickets/{ticketId}/share`

Auth: `CUSTOMER` + proprietário.

Retorna/gera URL de compartilhamento.

```json
{
  "url": "https://app.example/tickets/shared/{opaqueShareToken}"
}
```

### `GET /api/shared-tickets/{shareToken}` ou loader equivalente no servidor da página

Acesso público por bearer link usando o token de compartilhamento.

Retorna apenas campos do ingresso seguros para apresentação.

---

## 8. Check-in da portaria

### `POST /api/check-in/qr`

Auth: `GATE`.

Requisição:

```json
{
  "eventId": "evt_...",
  "token": "opaque-qr-token"
}
```

### `POST /api/check-in/manual`

Auth: `GATE`.

Requisição:

```json
{
  "eventId": "evt_...",
  "code": "K7PX-4M2Q-W9DN"
}
```

### Formato de sucesso da validação

Sempre retornar um resultado de domínio que a UI consiga renderizar diretamente.

#### `VALID`

```json
{
  "result": "VALID",
  "ticket": {
    "seatLabel": "F12",
    "eventTitle": "Interstellar",
    "holderName": "Ana Demo"
  },
  "validatedAt": "2026-08-20T22:48:11.000Z"
}
```

#### `ALREADY_USED`

```json
{
  "result": "ALREADY_USED",
  "usedAt": "2026-08-20T22:48:11.000Z"
}
```

#### `WRONG_EVENT`

```json
{
  "result": "WRONG_EVENT",
  "ticketEvent": {
    "id": "evt_other",
    "title": "Another Screening"
  }
}
```

#### `INVALID`

```json
{
  "result": "INVALID"
}
```

Para esses resultados esperados da portaria, retornar HTTP `200` com um `result` de domínio costuma ser operacionalmente mais simples, porque `INVALID`/`WRONG_EVENT` são resultados esperados da leitura, e não necessariamente erros de transporte. Falhas de autenticação/autorização/servidor continuam usando status HTTP de erro.

---

## 9. Considerações de idempotência e retry

O checkout não deve ser repetido automaticamente pelo cliente após uma falha ambígua de rede, a menos que exista uma estratégia de idempotência.

Se houver tempo de implementação, introduzir uma chave de idempotência do checkout gerada pelo cliente para que um retry do navegador não consiga criar reservas bem-sucedidas duplicadas acidentalmente. Esse é um hardening opcional valioso, não um pré-requisito da V1, desde que o cliente do fluxo principal evite retries automáticos e as constraints centrais de unicidade dos assentos permaneçam seguras.
