# Projeção — Decisões de Design

Este arquivo registra as decisões visuais intencionais por trás do MVP da Projeção.

## DD-01 — Evitar a estética típica de TMDb / clone de streaming

### Decisão

Não usar o padrão comum de:

- paleta preto/vermelho;
- hero escuro full-bleed;
- trilhos horizontais de pôsteres;
- interações de reprodução típicas de streaming;
- hierarquia visual semelhante à Netflix.

### Por quê

O produto não é um serviço de streaming. É uma plataforma para criar, comprar e validar ingressos de sessões físicas de cinema.

Uma linguagem visual semelhante a streaming faria o produto parecer genérico e entraria em conflito com o pedido explícito do desafio para evitar AI slop.

---

## DD-02 — Programação de cinema independente + ingresso impresso

### Decisão

O conceito visual é:

> programação de cinema independente + ingresso impresso

### Por quê

Isso conecta o sistema visual diretamente a:

- evento físico;
- programação/agendamento;
- pôsteres;
- entrada;
- lugar;
- experiência coletiva de cinema.

Assim, o produto tem uma razão clara para ter a aparência que tem.

---

## DD-03 — Tipografia editorial

### Decisão

Usar:

- Playfair Display para ênfase editorial/display;
- IBM Plex Sans para a interface da aplicação;
- IBM Plex Mono para códigos e metadados com aparência serial.

### Por quê

A combinação cria uma separação clara entre:

- conteúdo cultural/editorial;
- interface operacional;
- informações de ingresso/código.

---

## DD-04 — Interface pública em tons de papel

### Decisão

Usar superfícies em off-white quente/tons de papel, tipografia quase preta e um destaque em ocre.

### Por quê

Isso sustenta o conceito de programa impresso sem comprometer a usabilidade contemporânea.

A paleta evita deliberadamente a convenção vermelho/preto típica de streaming.

---

## DD-05 — Estrutura escura para portaria/check-in

### Decisão

A portaria/check-in usa uma estrutura operacional escura separada.

### Por quê

A portaria tem necessidades fundamentalmente diferentes da descoberta pública ou da criação pelo organizador.

Ela exige:

- leitura repetida e rápida;
- feedback de status em grande destaque;
- alto contraste visual;
- reconhecimento à distância;
- uso operacional focado.

Por isso, o modo escuro é contextual, e não uma referência estética a streaming.

---

## DD-06 — Telas específicas para cada status de check-in

### Decisão

Tratar os quatro resultados do domínio como telas/estados visualmente distintos:

- `VALID`
- `INVALID`
- `ALREADY_USED`
- `WRONG_EVENT`

### Por quê

Um toast discreto é insuficiente na entrada de um cinema.

O operador deve saber imediatamente:

- se a entrada está liberada;
- por que foi negada;
- qual é a próxima ação.

O status não pode ser comunicado apenas por cor.

---

## DD-07 — Grid em vez de trilhos de streaming

### Decisão

A descoberta pública usa um grid responsivo em vez de trilhos horizontais de streaming.

### Por quê

O produto apresenta sessões agendadas, não uma biblioteca infinita de conteúdo.

Um grid responsivo facilita comparar data, local, preço e informações da sessão.

A implementação pode usar um padrão CSS Grid com `auto-fill/minmax`.

---

## DD-08 — Ingresso como objeto de assinatura visual

### Decisão

O ingresso digital se parece visualmente com um ingresso físico bem projetado.

### Por quê

O ingresso é a ponte entre:

- compra;
- compartilhamento;
- entrada física.

Perfuração sutil, tipografia de código e tratamento de papel reforçam o domínio sem prejudicar a leitura do QR.

---

## DD-09 — Simplicidade operacional acima de sofisticação falsa

### Decisão

Não adicionar controles visuais para funcionalidades fora do MVP.

Exemplos:

- relatórios;
- dashboards de analytics;
- configurações extensas;
- watchlists;
- liberação manual sem ingresso;
- UI de provedor de pagamento real;
- contador de reserva temporária de assento.

### Por quê

Um mockup não deve fazer o escopo de implementação crescer acidentalmente.

O desafio valoriza um fluxo completo e intencional mais do que amplitude incompleta.

---

## DD-10 — Polling de assentos refletido como atualização calma de UX

### Decisão

Quando o polling informar que um assento selecionado foi vendido em outro lugar:

- preservar os outros assentos selecionados;
- remover apenas o assento afetado;
- explicar o que mudou.

### Por quê

A interface deve refletir a arquitetura real:

- polling melhora a atualização da informação;
- checkout/banco garantem a consistência;
- não existe estado `HELD`.

---

## DD-11 — Trailer do TMDb na seleção do organizador

### Decisão

Quando o organizador seleciona um filme durante a criação, mostrar detalhes do filme e um trailer/vídeo disponível antes de `Usar este filme`.

### Por quê

É um diferencial de UX útil e diretamente relacionado ao domínio.

Ajuda o organizador a confirmar o filme selecionado sem adicionar escopo não relacionado.

A ausência de trailer continua sendo um estado válido.

---

## DD-12 — Mockups são referências, não autoridade sobre o produto

### Decisão

As especificações escritas de produto/arquitetura têm prioridade sobre microcopy residual nas imagens.

### Por quê

Artefatos visuais gerados podem conter textos de iterações antigas.

A implementação não deve interpretar:

- `Relatórios`;
- `Configurações`;
- `Esqueci minha senha`;
- confirmação por e-mail;
- reservas temporárias de assento;

como requisitos, a menos que estejam respaldados pelo MVP escrito.
