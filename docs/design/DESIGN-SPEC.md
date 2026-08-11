# Projeção — Especificação de Design

## 1. Objetivo

Este documento traduz a direção visual aprovada da Projeção em orientações de implementação para React, Next.js, TypeScript e Tailwind CSS.

Ele complementa `docs/06-UX-UI-SPEC.md`.

Os documentos de produto, funcional e arquitetura continuam sendo a autoridade sobre o escopo de negócio.

## 2. Conceito de design

A Projeção é um produto moderno de ingressos de cinema influenciado por:

- programação de cinema independente;
- layouts editoriais;
- ingressos impressos;
- papel e tinta;
- comunicação de cinema guiada por pôsteres.

Ela não deve parecer:

- Netflix;
- clone de streaming;
- dashboard SaaS genérico;
- aplicação genérica de startup gerada por IA.

## 3. Estruturas específicas por papel

### 3.1 Estrutura cliente/público

Objetivos principais:
- descobrir sessões;
- entender os detalhes da sessão;
- selecionar assentos;
- pagar;
- acessar/compartilhar ingressos.

Características:
- fundo claro em tom de papel;
- hierarquia editorial;
- conteúdo guiado por pôsteres;
- header/navegação simples;
- sem sidebar de backoffice.

Evite navegação de cliente que sugira:
- relatórios;
- administração de configurações;
- gerenciamento de filmes;
- gerenciamento de locais.

### 3.2 Estrutura do organizador

Objetivos principais:
- visualizar sessões próprias;
- criar uma nova sessão;
- pesquisar/selecionar um filme do TMDb;
- configurar/revisar/publicar.

Características:
- produtiva e estruturada;
- ainda utiliza o mesmo sistema de marca;
- navegação mínima.

Navegação sugerida para o MVP:
- `Minhas sessões`
- `Nova sessão`

O filtro entre rascunhos/publicadas pode existir dentro de `Minhas sessões`.

Não transforme a área do organizador em um SaaS de analytics.

### 3.3 Estrutura da portaria

Objetivos principais:
- selecionar a sessão atual;
- escanear QR;
- digitar manualmente o código do ingresso;
- entender o resultado da validação;
- processar imediatamente a próxima pessoa.

Características:
- superfície operacional escura;
- altíssima clareza de status;
- navegação mínima;
- alvos grandes;
- área da câmera dominante.

Nenhuma ação pode liberar acesso sem validar um ingresso.

## 4. Descoberta pública

Use um grid responsivo.

Comportamento CSS recomendado:

```css
grid-template-columns: repeat(auto-fill, minmax(var(--card-min), 1fr));
```

Os cards devem comunicar a sessão, não apenas o filme:

- pôster;
- título;
- data;
- horário;
- local;
- preço.

O overlay do pôster pode revelar informações secundárias, mas não reproduza comportamento de hover típico de streaming.

Use skeleton cards durante o carregamento.

## 5. Detalhe da sessão

Referência:
- `customer/event-detail-and-seat-selection.png`

Hierarquia:

1. identidade do filme/sessão;
2. data/horário;
3. local/sala;
4. metadados úteis do filme;
5. informações de preço/capacidade da sessão;
6. CTA principal: seleção de assentos.

A página deve parecer uma programação de cinema, e não uma página de detalhes de streaming.

## 6. Seleção de assentos

Referência:
- `customer/event-detail-and-seat-selection.png`

### Estados

Apenas:

- `AVAILABLE`
- `SELECTED`
- `SOLD`

Sem `HELD`.

### Layout

Desktop:
- contexto do evento/sessão;
- mapa de assentos;
- legenda;
- resumo da seleção;
- total;
- CTA claro para continuar.

Mobile:
- priorizar contexto do evento e mapa;
- o resumo pode recolher ou mover para baixo;
- preservar alvos de toque suficientemente grandes.

### Comportamento do polling

Enquanto a página de assentos estiver montada:

- buscar disponibilidade aproximadamente a cada 7 segundos;
- fazer merge da disponibilidade remota;
- preservar seleções locais válidas.

Se o assento selecionado `E7` passar a estar vendido:

- remover `E7`;
- preservar `E8`, `E9` etc.;
- exibir uma notificação inline visível;
- não resetar o mapa inteiro.

Não sugerir visualmente que existe reserva garantida.

## 7. Checkout

Referência:
- `customer/checkout-and-payment-states.png`

### Objetivo

Pagamento simulado por cartão, focado e determinístico.

Exibir:

- sessão;
- assentos selecionados;
- valor;
- formulário de cartão;
- CTA de pagamento.

Comunicar claramente que a disponibilidade dos assentos é verificada novamente na finalização.

Não informar que os assentos ficam reservados por uma quantidade de minutos.

### Estados de resultado

#### Aprovado
- sucesso claro;
- direcionar o usuário para `Meus ingressos`;
- não exigir/alegar envio por e-mail.

#### Recusado
- recusa clara;
- permitir nova tentativa com valores de teste simulados documentados.

#### `409 SEAT_UNAVAILABLE`
- identificar assentos afetados quando possível;
- explicar que o mapa será atualizado;
- direcionar o usuário para escolher outros assentos.

## 8. Ingresso digital

Referência:
- `customer/ticket-and-shared-ticket.png`

O ingresso é um elemento de assinatura visual do produto.

Exibir:

- título do filme/sessão;
- data/horário;
- local/sala;
- assento;
- QR;
- código manual do ingresso;
- ação de compartilhar.

Use uma composição de ingresso impresso com perfuração sutil.

Requisitos do QR:
- forte contraste preto/branco;
- área de respiro suficiente;
- nenhum overlay decorativo que prejudique a leitura.

Evite exibir códigos redundantes que confundam o usuário.

## 9. Ingresso compartilhado

Referência:
- `customer/ticket-and-shared-ticket.png`

A visualização compartilhada deve ser mais simples que a estrutura do cliente autenticado.

Explique:

- o link exibe o ingresso;
- a propriedade continua com o comprador;
- o QR continua sendo a mesma credencial consumível do ingresso.

Não exponha navegação de conta/backoffice sem relação com essa tela.

## 10. Organizador — sessões

Referência:
- `organizer/sessions-and-configuration.png`

Exibir:

- sessões próprias;
- status rascunho/publicada;
- data/horário;
- local/sala;
- ação de editar/gerenciar;
- CTA de nova sessão.

Informações úteis sobre assentos/capacidade são aceitáveis.

Não adicionar:
- dashboard de receita;
- dashboard genérico de KPI;
- relatórios;
- configurações avançadas.

## 11. Organizador — seleção via TMDb

Referência:
- `organizer/tmdb-movie-selection.png`

Fluxo:

```text
Pesquisar no TMDb
→ Resultados
→ Selecionar filme
→ Detalhes/trailer
→ Usar este filme
→ Continuar criação da sessão
```

O grid de resultados deve continuar responsivo e guiado por pôsteres.

Preview do trailer:
- aparece durante a seleção do filme;
- usa os dados de vídeo disponíveis do TMDb;
- ausência de trailer é um estado tratado com elegância;
- ausência de vídeo nunca bloqueia a criação da sessão.

## 12. Scanner da portaria

Referências:
- `gate/gate-scanner-desktop.png`
- `gate/gate-flow-mobile.png`

Ordem de prioridade:

1. contexto da sessão atual;
2. scanner;
3. alternativa manual por código;
4. feedback operacional recente apenas se for útil.

A alternativa manual é **digitação do código do ingresso**, não liberação manual de entrada.

## 13. Estados de resultado da portaria

Referências:
- `gate/gate-results-desktop.png`
- `gate/gate-flow-mobile.png`

### VALID

Exibir:
- ícone grande de confirmação;
- `VÁLIDO`;
- `Acesso liberado`;
- informações da sessão/ingresso/assento;
- `Escanear próximo ingresso`.

### INVALID

Exibir:
- ícone grande de erro;
- `INVÁLIDO`;
- motivo claro quando conhecido;
- código escaneado/manual quando útil;
- próxima ação.

### ALREADY_USED

Exibir:
- tratamento grande de alerta/relógio;
- `JÁ UTILIZADO`;
- horário da validação anterior;
- informações de operador/portaria quando disponíveis;
- não sugerir que uma nova entrada é possível.

### WRONG_EVENT

Exibir:
- alerta claro;
- sessão atual versus sessão do ingresso quando útil;
- declaração explícita de que o ingresso pertence a outra sessão;
- não consumir o ingresso.

## 14. Autenticação

Referência:
- `auth/login.png`

Mantenha o login focado:

- e-mail;
- senha;
- entrar.

Controles residuais como recuperação de senha ou “lembrar conta” não são requisitos do MVP.

O mesmo login pode direcionar usuários de acordo com o papel semeado.

## 15. Componentes

Componentes reutilizáveis prováveis:

- `BrandLogo`
- `AppHeader`
- `OrganizerNav`
- `GateShell`
- `SessionCard`
- `MoviePosterCard`
- `SkeletonCard`
- `StatusBadge`
- `Seat`
- `SeatMap`
- `SeatLegend`
- `SelectionSummary`
- `PaymentForm`
- `TicketCard`
- `QrDisplay`
- `ManualTicketCode`
- `GateScanner`
- `ValidationResult`
- `InlineNotice`
- `Dialog`
- `MobileDrawer`

Não crie abstrações antes que pelo menos dois casos de uso concretos as justifiquem.

## 16. Comportamento responsivo

### Público/cliente

Mobile:
- recolher ações secundárias de navegação/filtros;
- empilhar o detalhe da sessão;
- manter o mapa de assentos seguro horizontalmente ou responsivo sem criar alvos minúsculos;
- o ingresso deve ocupar quase toda a largura disponível;
- manter o QR escaneável.

### Organizador

Prioridade para desktop/tablet.

No mobile:
- preservar o fluxo de criação;
- empilhar formulários e previews;
- evitar tabelas extremamente densas.

### Portaria

Mobile é uma superfície operacional de primeira classe.

Scanner/resultados devem caber sem obrigar o operador a procurar a ação principal.

## 17. Acessibilidade

Obrigatório:

- controles acessíveis por teclado;
- focus rings visíveis;
- labels semânticos;
- status com texto + ícone + cor;
- contraste suficiente;
- evitar significado de assento apenas por cor quando possível;
- estrutura lógica de headings;
- alvos de toque adequados;
- compatibilidade com reduced motion.

## 18. Orientações de implementação

Use:

- HTML semântico;
- tokens/propriedades customizadas com Tailwind;
- CSS Grid/Flexbox;
- assets SVG de `public/brand/`;
- APIs padrão de câmera do navegador / integração com biblioteca.

Evite:
- canvas/WebGL para UI decorativa;
- frameworks pesados de animação sem justificativa;
- layouts desktop-only baseados em posicionamento absoluto;
- dimensões de imagem hardcoded que quebrem com conteúdo responsivo.

## 19. Microcopy residual dos mockups

As imagens continuam sendo referências aprovadas mesmo quando pequenos textos estiverem desatualizados.

Se um controle visual entrar em conflito com:
- `01-PRODUCT-SPEC`;
- `02-FUNCTIONAL-SPEC`;
- `03-TECHNICAL-ARCHITECTURE`;
- `04-DOMAIN-MODEL`;
- `05-API-CONTRACTS`;
- `07-ACCEPTANCE-TESTS`;
- `08-ARCHITECTURE-DECISIONS`;
- `12-REQUIREMENTS-TRACEABILITY`;
- `13-SECURITY-CONCURRENCY-CHECKLIST`;

a especificação escrita tem prioridade.

Não aumente o escopo de implementação para corresponder a texto desatualizado de mockup.
