# Projeção — Handoff de Design

Este diretório contém o handoff visual aprovado para o MVP da Projeção.

Os artefatos de design são referências de implementação para a aplicação em React / Next.js. Eles definem a direção de marca estabelecida, a hierarquia visual, a composição principal das telas, as estruturas específicas de cada papel, os padrões de interação e os estados importantes da interface.

Eles **não** definem o escopo do produto de forma independente.

## Ordem de autoridade

Quando houver divergência entre as fontes, use esta prioridade:

1. Documentação de produto, funcional, arquitetura, domínio, API, aceite e segurança em `docs/`
2. Especificações de design deste diretório
3. Mockups visuais aprovados nas pastas por papel
4. Microcopy residual visível dentro das imagens dos mockups

Um artefato visual nunca deve ser usado para introduzir uma funcionalidade que contradiga ou ultrapasse o MVP descrito por escrito.

## Referências visuais aprovadas

### Cliente

- `customer/event-detail-and-seat-selection.png`
- `customer/checkout-and-payment-states.png`
- `customer/ticket-and-shared-ticket.png`

### Organizador

- `organizer/sessions-and-configuration.png`
- `organizer/tmdb-movie-selection.png`

### Portaria / Check-in

- `gate/gate-scanner-desktop.png`
- `gate/gate-results-desktop.png`
- `gate/gate-flow-mobile.png`

### Autenticação

- `auth/login.png`

## Assets da marca

Os assets prontos para implementação ficam em:

- `public/brand/logo.svg`
- `public/brand/logo-mark.svg`
- `public/brand/favicon.svg`

## Microcopy residual dos mockups

Alguns mockups gerados ainda podem conter rótulos ou controles de iterações anteriores.

Exemplos que **não** devem se tornar funcionalidades do MVP, a menos que estejam explicitamente respaldados pelas especificações escritas:

- relatórios ou analytics;
- áreas genéricas de configurações/backoffice;
- recuperação de senha;
- envio por e-mail;
- watchlists/favoritos;
- reserva temporária de assentos ou contadores regressivos;
- liberação manual de acesso sem um ingresso válido;
- navegação não relacionada ao papel de cliente ou organizador.

Durante a implementação, remova ou reescreva esse conteúdo residual em vez de expandir o escopo do produto.

## Intenção de design

A Projeção deve transmitir:

> programação de cinema independente + ingresso impresso

Ela não deve transmitir:

> Netflix, clone de streaming, dashboard SaaS genérico ou template de startup gerado por IA.

A interface deve continuar contemporânea, acessível, responsiva e realista de implementar com React, Next.js, TypeScript, Tailwind CSS, HTML, CSS e SVG.
