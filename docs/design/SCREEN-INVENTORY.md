# Projeção — Inventário de Telas do MVP

Este inventário define as superfícies visuais necessárias para o MVP. Ele não adiciona funcionalidades além das especificações do produto.

## 1. Público / Cliente

### C01 — Descoberta de eventos

Objetivo:
- navegar pelas sessões publicadas;
- pesquisar eventos publicados;
- entender rapidamente data, local, horário e preço.

Estados importantes:
- carregamento / skeleton;
- com conteúdo;
- sem resultados;
- erro de API/aplicação.

### C02 — Detalhe da sessão

Objetivo:
- entender a sessão selecionada;
- exibir informações do filme e detalhes específicos da sessão;
- iniciar a seleção de assentos.

Referência:
- `customer/event-detail-and-seat-selection.png`

### C03 — Seleção de assentos

Objetivo:
- selecionar um ou mais assentos disponíveis;
- entender assentos selecionados e total;
- reagir com segurança às atualizações de polling.

Estados dos assentos:
- `AVAILABLE`
- `SELECTED`
- `SOLD`

Comportamento em conflito de polling:
- se um assento selecionado se tornar vendido remotamente, remover apenas esse assento;
- preservar todas as seleções locais ainda válidas;
- exibir uma notificação clara.

Referência:
- `customer/event-detail-and-seat-selection.png`

### C04 — Checkout / pagamento

Objetivo:
- revisar sessão e assentos;
- concluir o pagamento simulado determinístico por cartão;
- comunicar que a disponibilidade é revalidada quando o pagamento é finalizado.

Referência:
- `customer/checkout-and-payment-states.png`

### C05 — Pagamento aprovado

Objetivo:
- confirmar compra bem-sucedida;
- direcionar o cliente para `Meus ingressos`.

Não exigir nem sugerir envio por e-mail.

### C06 — Pagamento recusado

Objetivo:
- explicar claramente a recusa do pagamento simulado;
- permitir comportamento de nova tentativa determinístico.

### C07 — Assento indisponível / HTTP 409

Objetivo:
- explicar `SEAT_UNAVAILABLE`;
- identificar assentos indisponíveis quando possível;
- direcionar o cliente de volta para a seleção de assentos atualizada.

### C08 — Meus ingressos

Objetivo:
- listar ingressos pertencentes ao cliente autenticado;
- abrir um ingresso.

### C09 — Ingresso digital

Objetivo:
- apresentar QR;
- exibir código manual do ingresso;
- exibir metadados da sessão;
- permitir compartilhamento.

Referência:
- `customer/ticket-and-shared-ticket.png`

### C10 — Ingresso compartilhado

Objetivo:
- permitir visualização pública por meio de um share token;
- deixar claro que o compartilhamento não transfere propriedade.

Referência:
- `customer/ticket-and-shared-ticket.png`

---

## 2. Organizador

### O01 — Minhas sessões

Objetivo:
- mostrar sessões pertencentes ao organizador;
- diferenciar sessões em rascunho e publicadas;
- criar/editar/gerenciar sessões relevantes.

Nenhum dashboard de analytics é necessário.

Referência:
- `organizer/sessions-and-configuration.png`

### O02 — Busca de filmes no TMDb

Objetivo:
- pesquisar o catálogo externo de filmes durante a criação da sessão;
- escolher um filme de origem.

Referência:
- `organizer/tmdb-movie-selection.png`

### O03 — Detalhes do filme + trailer

Objetivo:
- visualizar o filme selecionado;
- mostrar trailer/vídeo disponível;
- confirmar `Usar este filme`.

Ausência de trailer é um estado válido e não bloqueante.

Referência:
- `organizer/tmdb-movie-selection.png`

### O04 — Configuração da sessão

Objetivo:
- definir data;
- horário;
- dados de local/sala suportados pelo MVP;
- configuração de capacidade/assentos;
- preço;
- metadados relevantes da sessão.

Referência:
- `organizer/sessions-and-configuration.png`

### O05 — Revisar e publicar

Objetivo:
- visualizar a sessão antes da publicação;
- confirmar detalhes importantes;
- publicar.

---

## 3. Portaria / Check-in

### G01 — Seleção de sessão

Objetivo:
- selecionar a sessão que está sendo validada no momento.

### G02 — Scanner

Objetivo:
- escanear QR usando a câmera;
- oferecer digitação manual do código do ingresso como alternativa.

Sem liberação manual de acesso sem um ingresso válido.

Referências:
- `gate/gate-scanner-desktop.png`
- `gate/gate-flow-mobile.png`

### G03 — VALID

Objetivo:
- mostrar de forma inequívoca que a entrada está liberada;
- exibir informações úteis de ingresso/sessão/assento;
- continuar imediatamente para a próxima leitura.

### G04 — INVALID

Objetivo:
- comunicar ingresso ilegível/desconhecido/inválido;
- oferecer próxima leitura ou tentativa manual.

### G05 — ALREADY_USED

Objetivo:
- comunicar validação anterior;
- exibir horário/operador da validação anterior quando disponível;
- nunca consumir o ingresso novamente.

### G06 — WRONG_EVENT

Objetivo:
- mostrar que o ingresso pertence a outra sessão;
- comparar claramente a sessão atual com a sessão do ingresso quando útil;
- nunca consumir o ingresso.

Referências:
- `gate/gate-results-desktop.png`
- `gate/gate-flow-mobile.png`

---

## 4. Autenticação

### A01 — Login

Objetivo:
- autenticar as contas seed disponibilizadas ao avaliador;
- suportar os três papéis pelo mesmo ponto de entrada de autenticação.

Referência:
- `auth/login.png`

Recuperação de senha não faz parte do MVP, mesmo que alguma microcopy residual de mockup sugira isso.

---

## 5. Prioridade responsiva

Superfícies de maior prioridade no mobile:

- descoberta de eventos;
- detalhe da sessão;
- seleção de assentos;
- ingresso digital;
- ingresso compartilhado;
- scanner da portaria;
- todos os estados de resultado da portaria.

Os fluxos do organizador devem continuar utilizáveis em telas menores, mas desktop/tablet é a principal superfície de avaliação.

---

## 6. Estados globais da UI

Quando aplicável, as telas devem suportar:

- carregamento;
- vazio;
- sucesso;
- erro;
- não autenticado/sem permissão;
- não encontrado;
- falha de rede/serviço externo.

Não crie telas decorativas para estados que podem ser representados claramente inline.
