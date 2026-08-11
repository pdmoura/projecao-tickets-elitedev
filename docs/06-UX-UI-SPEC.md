# Especificação de UX / UI

## 1. Tese visual

**Direção:** programação de cinema independente + bilhete de entrada impresso.

A interface deve parecer uma versão digital contemporânea de:

- uma programação de cinema independente;
- um livreto de programação cultural;
- um cartaz impresso;
- um bilhete físico de entrada.

Ela **não** deve parecer:

- um clone da Netflix;
- um portfólio genérico escuro baseado em TMDb;
- um template SaaS com gradiente roxo/azul;
- um dashboard montado com componentes de card padrão.

## 2. Direção explicitamente rejeitada

Um projeto pessoal anterior usando TMDb utilizava:

- vermelho + preto;
- hero escuro full-bleed;
- composição cinematográfica em estilo streaming.

Essa direção não é reutilizada intencionalmente porque é extremamente comum em projetos de catálogo de filmes e pode visualmente se transformar em uma imitação de serviço de streaming.

Somente padrões de interação já validados são reaproveitados.

## 3. Padrões de interação mantidos da experiência anterior

### Grid responsivo de cards

Usar CSS Grid com uma estratégia no estilo auto-fill/minmax para que os cards de evento/filme se reorganizem naturalmente entre diferentes larguras de viewport.

### Overlay de informação no pôster

Informações podem aparecer sobre o pôster durante a interação ou em regiões fixas cuidadosamente desenhadas, mas a composição deve continuar editorial e orientada a ingressos, e não a reprodução de mídia.

### Skeleton loading

Usar skeletons de pôster/card durante o carregamento de catálogo/eventos para evitar saltos de layout e evitar depender apenas de spinners genéricos como feedback de carregamento.

### Header sticky com blur

O header permanece disponível durante a navegação, com blur/transparência de fundo de forma contida.

### Colapso de navegação/filtros no mobile

Filtros/ações secundárias são recolhidos em um padrão de hambúrguer/drawer/sheet em viewports pequenos.

## 4. Princípios visuais

### 4.1 Superfícies de papel

Preferir fundos off-white quentes/com aparência de papel em vez de branco puro universal ou preto escuro.

Direção sugerida, não tokens congelados:

```text
Paper      #F3EEE3
Paper Alt  #E8E0D2
Ink        #1D1D1A
Muted Ink  #666158
Accent     ocre / oliva / cobalto / ferrugem suaves (escolher um deliberadamente)
Rule       tinta escura com baixa opacidade
```

Evitar usar vermelho saturado típico de streaming como accent dominante.

### 4.2 Tipografia

Usar hierarquia editorial forte:

- fonte display/editorial expressiva para títulos principais, se a escolha de licença/pacote for prática;
- sans-serif altamente legível para controles de interface e metadados densos;
- acento tabular/monoespaçado pode ser usado de forma contida para seriais de ingresso/códigos manuais.

Não usar variedade excessiva de fontes.

### 4.3 Bordas e linhas

Preferir recursos de layout impresso:

- separadores finos;
- blocos contornados;
- detalhes de perfuração/tracejado no ingresso;
- alinhamento tipográfico forte;

em vez de colocar toda informação dentro de cards arredondados com sombra.

### 4.4 Raios/sombras

Usar com moderação. Alguns controles/cards podem ser arredondados, mas o sistema não deve assumir como padrão grandes cards SaaS de 16–24px com sombras profundas em todos os lugares.

## 5. Descoberta pública de eventos

### Desktop

- masthead/header editorial;
- busca disponível com destaque;
- grid responsivo de pôsteres dos eventos;
- metadados da sessão claramente associados a cada pôster;
- preço e data são mais importantes do que ações típicas de streaming.

### Hierarquia do card

1. pôster/arte;
2. título do evento/filme;
3. data/horário;
4. local;
5. preço.

Um overlay opcional pode apresentar metadados, preservando o título/informação da sessão fora do pôster ou em uma área de legenda com aparência impressa.

### Mobile

- grid de 1–2 colunas, dependendo da largura mínima prática dos cards;
- header compacto e sticky;
- filtros/navegação em drawer;
- áreas de toque confortáveis;
- nenhuma informação crítica dependente de hover.

## 6. Detalhe do evento

A página deve responder rapidamente:

- O que está em cartaz?
- Quando?
- Onde?
- Quanto custa?
- Há assentos disponíveis?
- Como escolher os assentos?

Usar a arte do filme como atmosfera, e não como um hero de serviço de streaming que empurra a logística da sessão para abaixo da dobra.

## 7. Mapa de assentos

### Estrutura visual

```text
                   TELA
            ─────────────────

      A   ○ ○ ○ ○ ○ ○ ○ ○
      B   ○ ○ ○ ○ ○ ○ ○ ○
      C   ○ ○ ● ● ○ ○ ○ ○
      D   ○ ○ ○ ○ ○ ○ ○ ○

          ○ Disponível
          ● Vendido
          ◉ Selecionado
```

O glyph/componente exato será desenhado de forma acessível; o estado não deve depender apenas de cor.

### UX do polling

Não mostrar um loader global chamativo a cada 7 segundos.

As atualizações em segundo plano acontecem discretamente.

Se um assento selecionado se tornar `SOLD`:

- remover visualmente o estado selecionado;
- marcá-lo como `SOLD`;
- mostrar toast/aviso inline conciso identificando o assento;
- manter todas as seleções não afetadas.

### Transição para o checkout

Quando o usuário seguir ao checkout, não mostrar countdown nem falsa garantia de reserva. Uma nota curta pode informar que a disponibilidade dos assentos será confirmada ao concluir a compra.

## 8. Checkout

Manter o checkout visualmente focado:

- resumo do evento;
- assentos escolhidos;
- total;
- formulário do simulador;
- submit.

Para o desafio, tornar o comportamento do simulador fácil de descobrir sem poluir a tela, por exemplo com uma pequena nota `Pagamento de teste` contendo valores aprovados/recusados.

O conflito de assento `409` deve oferecer ação direta de recuperação.

## 9. Ingresso digital

O ingresso é um dos principais artefatos visuais do produto.

Referências de design:

- proporções de bilhete de entrada;
- separador perfurado/tracejado;
- serial/código manual com aparência impressa;
- número do assento em destaque;
- QR posicionado como elemento funcional central;
- tipografia de data/horário/sala inspirada em canhotos de ingresso;
- mínimo chrome de conta ao redor do próprio ingresso.

Estrutura de exemplo:

```text
┌─────────────────────────────────┐
│ INTERSTELLAR             ADMIT 1│
│                                 │
│ 20 AUG 2026    20:00            │
│ CINE ELITE     SALA 2           │
│                                 │
│              SEAT               │
│               F12               │
│                                 │
│ - - - - - - - - - - - - - - - │
│                                 │
│            [ QR ]               │
│                                 │
│        K7PX-4M2Q-W9DN           │
└─────────────────────────────────┘
```

## 10. Experiência do organizador

A UI do organizador pode ser mais utilitária do que as páginas públicas/do cliente, mas deve compartilhar o mesmo sistema editorial.

Não usar sidebar/dashboard genérico de analytics, a menos que seja necessário para navegação.

### Busca no catálogo

O grid de resultados de filmes mantém os padrões responsivos de card/skeleton.

### Modal do filme selecionado

Ao selecionar um filme:

- exibir título/pôster/detalhes do filme;
- carregar candidato de trailer por meio da API de catálogo da aplicação;
- mostrar trailer quando disponível;
- mostrar fallback não bloqueante quando ausente;
- CTA: `Usar este filme`.

O trailer existe para ajudar o organizador a confirmar o título antes de montar a sessão, e não como funcionalidade de entretenimento para clientes.

## 11. Experiência da portaria

A tela de portaria é deliberadamente diferente de um dashboard de gerenciamento.

Prioridades de design:

- mínimo de decisões;
- grande área do scanner;
- evento selecionado sempre visível;
- alternativa de código manual visível;
- resultado da validação domina a tela;
- alto contraste;
- mínimo de rolagem;
- retorno rápido ao próximo ingresso.

### Hierarquia dos resultados

`VALID`, `INVALID`, `ALREADY_USED`, `WRONG_EVENT` devem ser distinguíveis por:

- texto;
- ícone/forma;
- layout;
- cor como reforço secundário.

Não depender apenas de verde/vermelho.

## 12. Estados de carregamento/vazio/erro

Toda superfície principal possui estados intencionais:

### Carregamento do catálogo
Grid de skeletons de pôster.

### Nenhum resultado no catálogo
Mensagem útil `Nenhum filme encontrado para ...`.

### TMDb indisponível
O organizador vê erro temporário do catálogo e opção de tentar novamente; eventos existentes permanecem inalterados.

### Nenhum evento publicado
Estado vazio editorial, não um dashboard quebrado.

### Câmera negada
Explicar o problema de permissão e oferecer imediatamente a entrada manual.

### Trailer indisponível
Manter a seleção do filme utilizável.

### Conflito de assento
Identificar os assentos indisponíveis e oferecer recuperação.

## 13. Base de acessibilidade

- botões/links semânticos;
- operação por teclado;
- estado de foco visível;
- labels de formulário;
- informação de QR/código manual possui equivalente textual;
- estados dos assentos não dependem somente de cor;
- contraste adequado;
- interações compatíveis com redução de movimento;
- gerenciamento de foco em modal;
- mensagens para permissões/falhas do scanner.

## 14. Checklist anti-slop de design

Antes de considerar uma página concluída, verificar:

- Esta página parece ter sido desenhada para o usuário/tarefa em questão ou parece um dashboard genérico?
- Existe uma hierarquia tipográfica deliberada?
- Estamos usando cards porque a informação realmente funciona como card, e não por padrão?
- Alguém poderia confundir isso com Netflix olhando apenas um screenshot? Se sim, revisar.
- Alguém poderia confundir isso com um template administrativo SaaS genérico? Se sim, revisar.
- A logística da sessão está mais destacada do que a arte decorativa do filme?
- O ingresso parece um ingresso desenhado intencionalmente?
- A tela de portaria otimiza velocidade e certeza em vez de profundidade de navegação?
