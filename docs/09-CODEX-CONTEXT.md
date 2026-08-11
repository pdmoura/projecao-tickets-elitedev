# Contexto de Implementação para o Codex

## Sobre este artefato

Este documento foi criado antes da implementação e usado como contexto persistente para o desenvolvimento assistido por IA com o Codex.

Seu objetivo é manter a implementação alinhada às decisões de produto, arquitetura, segurança, UX e escopo documentadas neste repositório.

As decisões abaixo foram definidas deliberadamente antes da delegação das tarefas de implementação ao agente de código. Espera-se que o Codex execute dentro desses limites, em vez de redesenhar o produto de forma independente.

Este arquivo é versionado intencionalmente como parte da documentação do processo de desenvolvimento e uso de IA no desafio.

## Missão

Construir uma plataforma full-stack de sessões de cinema e ingressos polida, mas deliberadamente limitada em escopo, para um desafio técnico de sete dias. O avaliador valoriza raciocínio, fluxos completos, correção e documentação mais do que volume de funcionalidades.

## Escopo do produto

- Catálogo de filmes apoiado pela TMDb para organizadores.
- O organizador cria uma sessão física de cinema.
- A sessão possui data/horário, local, sala, mapa retangular gerado de assentos e um preço por assento.
- O cliente navega por sessões publicadas, escolhe assentos, conclui pagamento simulado determinístico e recebe ingressos.
- O ingresso possui QR seguro, código manual e link de compartilhamento.
- O usuário de portaria seleciona um evento e valida por QR da câmera ou código manual.
- Resultado da validação: `VALID`, `INVALID`, `ALREADY_USED`, `WRONG_EVENT`.

Não adicionar shows, ingressos de pista, setores, pagamento real, reembolsos, recuperação de senha, e-mail, WebSockets, holds temporários de assento, analytics, microservices ou funcionalidades não relacionadas, a menos que isso seja solicitado explicitamente.

## Stack

- TypeScript
- Next.js App Router + React
- PostgreSQL
- Prisma
- Better Auth por trás de um adapter customizado da aplicação
- Zod
- Tailwind
- Vitest; Playwright de forma seletiva

## Arquitetura

Usar um monólito modular.

A lógica de domínio/negócio pertence a `src/modules/*`, e não a componentes React grandes ou route handlers gigantes.

Módulos-alvo:

```text
auth
catalog
events
seats
reservations
payments
tickets
checkin
```

## Regra de autenticação — NÃO VIOLAR

`better-auth` não deve ser importado por nenhum módulo fora de `src/modules/auth/**` (exceto o bootstrap mínimo de rota/cliente do framework, caso seja estruturalmente necessário e ainda pertença ao design do módulo de auth).

Todo código de servidor da aplicação usa o adapter público de auth exportado de:

```text
src/modules/auth/index.ts
```

Interface obrigatória:

```ts
getSession(req)
requireUser(req)
requireRole(req, role)
requireOwner(req, resourceOwnerId)
```

Normalizar objetos de sessão/usuário do fornecedor para tipos de auth pertencentes à aplicação.

Preferir imports restritos via ESLint para garantir esse limite.

## Autorização

Nunca confiar em botões ocultos/roteamento client-side como autorização.

- criar evento -> `ORGANIZER`
- atualizar/publicar evento -> `ORGANIZER` + proprietário do recurso
- checkout/ingressos privados -> `CUSTOMER`
- check-in -> `GATE`

## TMDb

Somente código de catálogo no servidor conversa com as credenciais da TMDb.

Métodos locais do catálogo:

```ts
searchMovies(query)
getMovieDetails(movieId)
getMovieVideos(movieId)
```

Normalizar DTOs da TMDb. Persistir um snapshot do filme quando o organizador usar um filme, para que eventos publicados não dependam da TMDb ao vivo.

Ao selecionar um filme no fluxo do organizador, mostrar um modal com detalhes e trailer quando houver um vídeo adequado. Não ter trailer é um estado válido e não bloqueante.

## Modelo de assentos

Persistir apenas:

```text
AVAILABLE
SOLD
```

NÃO existe estado `HELD`.

A página de assentos faz polling da disponibilidade atual aproximadamente a cada 7 segundos enquanto estiver montada.

Requisitos do merge do polling:

- preservar assentos selecionados localmente se o remoto ainda estiver `AVAILABLE`;
- se um assento selecionado se tornar `SOLD`, remover apenas esse assento e avisar o usuário;
- não redefinir toda a seleção;
- limpar o ciclo de vida de intervalo/requisição ao desmontar;
- interromper polling ao seguir para o checkout.

O polling melhora a UX apenas. Ele não garante estoque.

## Correção do checkout

Backend/banco de dados é autoritativo.

Dois compradores concorrentes nunca podem comprar com sucesso o mesmo assento do evento.

Se um ou mais assentos solicitados não puderem ser adquiridos no checkout:

```text
HTTP 409
code: SEAT_UNAVAILABLE
```

O cliente mostra uma mensagem clara e busca novamente a disponibilidade imediatamente.

Um checkout bem-sucedido de múltiplos assentos deve ser atômico: nenhuma compra parcial acidental.

## Simulador de pagamento

Valores de teste determinísticos para aprovação e recusa. Não usar aleatoriedade.

Não persistir número completo do cartão simulado/CVV.

Pagamento recusado não pode produzir ingresso válido nem consumir assentos.

## Segurança do ingresso

Usar geração aleatória criptográfica do Node para um token de validação de alta entropia.

Não usar IDs incrementais como segurança do QR.

Armazenar hash do token de validação (por exemplo SHA-256), e não o token bruto, quando for prático.

Gerar um código manual separado e amigável para humanos.

Gerar um token aleatório separado para compartilhamento; compartilhar não transfere propriedade.

Nunca retornar hashes de token por APIs do cliente.

## Correção do check-in

O usuário de portaria envia evento selecionado + token de QR/código manual.

Resultados:

```text
VALID
INVALID
ALREADY_USED
WRONG_EVENT
```

`VALID` deve marcar atomicamente o ingresso como utilizado.

Duas leituras concorrentes -> exatamente uma `VALID`; a outra `ALREADY_USED`.

`WRONG_EVENT` não deve consumir o ingresso.

## Direção visual — NÃO USAR STREAMING/SaaS COMO PADRÃO

O objetivo é:

```text
programação de cinema independente
+
bilhete de entrada impresso
+
tipografia editorial
+
superfícies em tons de papel
```

Evitar:

- paleta vermelho/preto semelhante à Netflix;
- hero escuro full-bleed de streaming como identidade principal;
- dashboard SaaS genérico azul/roxo;
- cards de KPI desnecessários;
- tratamento padrão de cards/sombras em todos os lugares.

Padrões de interação reutilizáveis:

- grid responsivo de pôsteres/eventos com auto-fill/minmax;
- overlay de informações no pôster;
- skeleton loading;
- header sticky com blur;
- filtros/navegação recolhidos no mobile.

UX específica por papel:

- cliente = descoberta visual e compra de ingressos;
- organizador = criação/gerenciamento eficiente, mantendo linguagem editorial;
- portaria = interface extremamente focada em scanner/resultado.

O ingresso digital deve se parecer claramente com um bilhete/canhoto impresso desenhado intencionalmente.

## Códigos de erro

Preferir erros de domínio estáveis, como:

```text
AUTH_REQUIRED
FORBIDDEN
RESOURCE_NOT_FOUND
VALIDATION_ERROR
SEAT_UNAVAILABLE
PAYMENT_DECLINED
CATALOG_UNAVAILABLE
```

`INVALID`/`WRONG_EVENT`/`ALREADY_USED` da portaria podem ser resultados normais de domínio em vez de falhas de transporte.

## Prioridades de testes

Automatizar invariantes do domínio antes de testes cosméticos:

1. verificações de papel;
2. propriedade do organizador;
3. checkout aprovado;
4. checkout recusado sem ingresso;
5. compra concorrente de assento;
6. check-in válido;
7. repetição de check-in;
8. não consumo em evento errado;
9. check-in concorrente;
10. lógica de merge do polling de assentos.

## Seed

Deve incluir:

- 1 organizador;
- 2 clientes;
- 1 usuário de portaria;
- >=1 evento futuro publicado com assentos disponíveis.

Preferir um segundo evento e ingresso de demonstração pré-emitido para tornar a avaliação de `WRONG_EVENT`/check-in rápida.

## Comportamento de engenharia esperado do Codex

Antes de alterar código para uma tarefa:

1. inspecionar a implementação existente e os documentos relevantes;
2. preservar os limites dos módulos;
3. declarar suposições quando o código não corresponder à documentação;
4. implementar a menor alteração completa;
5. adicionar/atualizar testes para comportamento de domínio alterado;
6. executar verificações relevantes;
7. evitar refactors não relacionados;
8. atualizar a documentação quando o comportamento ou um trade-off deliberado mudar.

Não adicionar silenciosamente dependências importantes ou padrões arquiteturais. Explicar por que uma nova dependência é necessária no resumo da alteração.

## Definição de pronto para uma tarefa

Uma tarefa não está pronta apenas porque a UI renderiza. Ela está pronta quando:

- o happy path funciona;
- o caminho de erro definido funciona;
- a autorização é aplicada no servidor;
- existe validação relevante;
- o invariante crítico possui teste quando apropriado;
- lint/typecheck/testes relevantes à alteração passam;
- a documentação permanece correta.
