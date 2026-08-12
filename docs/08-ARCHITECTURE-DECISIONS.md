# Registro de Decisões de Arquitetura

Este documento registra decisões que devem permanecer visíveis no Git porque o desafio valoriza explicitamente o raciocínio e os trade-offs.

---

## ADR-001 — Focar a V1 em sessões de cinema

**Status:** Aceita

### Contexto
O enunciado permite eventos baseados em shows ou filmes e aceita tanto mapa de assentos quanto ingressos por quantidade para pista/entrada geral.

### Decisão
Implementar sessões de cinema originadas da TMDb com um mapa de assentos de cinema gerado.

### Por quê
- Produz um domínio coerente em vez de suporte superficial a tipos de estoque não relacionados.
- Mapas de assentos expõem problemas relevantes de concorrência/integridade.
- A TMDb fornece busca/detalhes/vídeos de filmes adequados para a UX de criação do organizador.
- Preserva tempo para concluir todo o ciclo de compra/check-in.

### Rejeitado
- Suportar filmes e shows simultaneamente na V1.
- Ticketmaster + ingressos de pista por quantidade como experiência principal.

---

## ADR-002 — Monólito modular

**Status:** Aceita

### Decisão
Usar um único repositório Next.js TypeScript com módulos internos de domínio e PostgreSQL.

### Por quê
- minimiza overhead de deploy/configuração;
- ainda demonstra separação entre frontend/backend/domínio;
- evita adicionar CORS, múltiplos limites de auth e dois deploys sem valor de produto.

### Rejeitado
Frontend Vite separado + serviço Express/FastAPI para este desafio.

---

## ADR-003 — Better Auth por trás do nosso próprio adapter

**Status:** Aceita

### Decisão
Better Auth só é acessado por meio de `src/modules/auth/index.ts` e de arquivos de implementação específicos do fornecedor dentro desse módulo.

O restante da aplicação usa:

```ts
getSession(req)
requireUser(req)
requireRole(req, role)
requireOwner(req, resourceOwnerId)
```

### Por quê
Autenticação é uma capacidade da aplicação; Better Auth é uma implementação de infraestrutura substituível. Uma migração de provedor não deve exigir reescrever módulos não relacionados.

### Consequência
Adicionar enforcement via lint/limite de imports, se for prático.

### Rejeitado
Importar helpers do Better Auth diretamente dentro do código de eventos/ingressos/check-in.

---

## ADR-004 — Polling em vez de WebSocket; sem estado HELD

**Status:** Aceita

### Decisão
O mapa de assentos refaz a busca de disponibilidade aproximadamente a cada 7 segundos enquanto estiver montado. Ele mescla o estado remoto com a seleção local. Não existe hold temporário persistido de assento.

O checkout continua validando/adquirindo estoque atomicamente.

### Por quê
- polling é suficiente para manter a UI razoavelmente atualizada na escala do desafio;
- infraestrutura WebSocket/SSE não melhora a garantia de correção;
- `HELD` introduz expiração, limpeza e complexidade de sessões abandonadas;
- atomicidade no banco continua necessária independentemente do transporte em tempo real.

### UX obrigatória
Se um assento selecionado localmente se tornar `SOLD`, remover apenas esse assento e avisar o cliente.

### Comportamento obrigatório no checkout
Conflito tardio -> HTTP `409` `SEAT_UNAVAILABLE`, mensagem clara e refetch imediato.

---

## ADR-005 — Simulador de pagamento determinístico

**Status:** Aceita

### Decisão
Usar entradas explícitas do simulador para aprovação e recusa.

### Por quê
- o avaliador consegue reproduzir os dois fluxos obrigatórios instantaneamente;
- os testes são determinísticos;
- integração com provedor real agrega pouco valor ao problema de domínio alvo.

### Rejeitado
Sucesso/falha aleatórios e processamento real de pagamento em produção.

### Evolução técnica
O checkout usa um `PaymentProvider` mínimo, hoje implementado pelo simulador determinístico: `4242 4242 4242 4242` aprova e `4000 0000 0000 0002` recusa. Um futuro gateway pode implementar o mesmo contrato sem levar detalhes do provedor ao checkout. Tokenização no frontend, webhooks, idempotência do gateway, estados assíncronos, referências de cobrança e reembolso/cancelamento não são implementados neste desafio.

---

## ADR-006 — Token QR opaco com armazenamento por hash

**Status:** Aceita

### Decisão
A validação do ingresso usa uma credencial aleatória de alta entropia. Armazenar seu hash, e não um ID público previsível do ingresso como segredo de segurança.

### Por quê
- impede enumeração/forja trivial;
- é fácil de revogar e validar contra estado do servidor;
- consulta ao banco já é necessária para verificar uso/evento.

### Rejeitado
JSON/ID de ingresso sem assinatura no QR; JWT apenas para evitar consulta ao banco.

---

## ADR-007 — Credenciais separadas para validação e compartilhamento

**Status:** Aceita

### Decisão
O compartilhamento usa um token aleatório distinto do token de validação.

### Por quê
Visualizar um ingresso compartilhado e validar entrada são capacidades diferentes. Credenciais independentes reduzem acoplamento e permitem futura rotação/revogação.

### Esclarecimento
Compartilhar não transfere propriedade.

---

## ADR-008 — Check-in atômico e de uso único

**Status:** Aceita

### Decisão
Uma requisição válida da portaria faz atomicamente a transição de um ingresso não utilizado para utilizado. Requisições de evento errado e inválidas nunca o consomem.

### Por quê
Dois dispositivos de portaria podem ler a mesma credencial quase simultaneamente. Uma sequência de ler-e-depois-escrever não é suficiente.

---

## ADR-009 — Snapshot dos dados externos do filme

**Status:** Aceita

### Decisão
Persistir os campos do filme necessários ao evento quando o organizador seleciona um título da TMDb.

### Por quê
- eventos existentes renderizam mesmo se a TMDb estiver lenta/fora do ar;
- evita acoplar páginas públicas a limites/disponibilidade externos;
- preserva o que o organizador selecionou no momento da criação do evento.

---

## ADR-010 — Evitar identidade visual de clone de streaming

**Status:** Aceita

### Contexto
Um projeto anterior com TMDb usava vermelho/preto, hero escuro full-bleed e visualmente se aproximava da Netflix, um padrão comum em projetos com APIs de filmes.

### Decisão
Usar uma direção editorial de programação de cinema independente + bilhete impresso, com tons de papel e tipografia forte.

Manter somente padrões úteis de interação do trabalho anterior:

- grids responsivos auto-fill/minmax;
- overlay de informações no pôster;
- skeleton loading;
- header sticky com blur;
- filtros/navegação recolhidos no mobile.

### Rejeitado
Reutilizar a paleta vermelho/preto anterior ou construir um dashboard SaaS genérico.

---

## ADR-011 — Preview de trailer pertence à seleção de filme do organizador

**Status:** Aceita

### Decisão
Ao selecionar um filme, solicitar os vídeos do filme na TMDb e mostrar um trailer adequado no modal de confirmação quando disponível.

### Por quê
Isso aumenta a confiança de que o organizador selecionou o título correto e cria um detalhe de UX distintivo, mas relevante ao domínio.

### Modo de falha
Trailer indisponível não bloqueia o fluxo.

---

## ADR-012 — Correção do negócio acima de pureza de ORM

**Status:** Aceita

### Decisão
Usar Prisma para persistência normal. Se um update condicional crítico/invariante de concorrência ficar mais claro ou seguro usando uma transação com SQL bruto cuidadosamente limitado, isso é aceitável e deve ser documentado/testado.

### Por quê
O requisito é que assentos/ingressos permaneçam corretos sob concorrência, e não que toda instrução seja gerada pelo ORM.
