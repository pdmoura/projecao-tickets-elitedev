# Projeção — Tokens de UI

Estes tokens representam a direção visual aprovada. Valores exatos de implementação podem ser ajustados levemente por contraste, renderização do navegador ou acessibilidade, mas as relações semânticas devem permanecer estáveis.

## 1. Tokens de cor

| Token | Valor | Uso |
|---|---|---|
| `--background` | `#FAF8F3` | Fundo principal da aplicação em tom de papel |
| `--surface` | `#FFFFFF` | Cards, formulários e painéis principais |
| `--surface-secondary` | `#F1EEE6` | Áreas secundárias em papel/neutro |
| `--text-primary` | `#141414` | Texto principal em tom de tinta |
| `--text-secondary` | `#57534E` | Copy secundária e metadados |
| `--border` | `#E2DED6` | Bordas padrão do tema claro |
| `--accent` | `#D4A017` | Cor de destaque principal da Projeção |
| `--accent-hover` | `#B88C10` | Tratamento hover/pressionado do destaque |
| `--success` | `#16816A` | Sucesso em contextos claros |
| `--warning` | `#B87500` | Alerta em contextos claros |
| `--error` | `#C83F43` | Erro em contextos claros |
| `--available-seat` | `#E6E2D6` | Assento disponível |
| `--selected-seat` | `#D4A017` | Assento selecionado |
| `--sold-seat` | `#1E1E1E` | Assento vendido/indisponível |

### Portaria / estrutura operacional escura

Tokens semânticos sugeridos para a estrutura escura:

| Token | Valor sugerido | Uso |
|---|---|---|
| `--gate-bg` | `#091018` | Fundo principal da portaria |
| `--gate-surface` | `#111922` | Painéis operacionais |
| `--gate-surface-raised` | `#151E28` | Superfícies elevadas de scanner/resultado |
| `--gate-border` | `#2A3440` | Bordas do tema escuro |
| `--gate-text` | `#F5F5F4` | Texto principal em modo escuro |
| `--gate-muted` | `#A8ADB4` | Texto secundário em modo escuro |
| `--gate-valid` | `#45C853` | Válido / entrada liberada |
| `--gate-invalid` | `#EF4444` | Inválido |
| `--gate-used` | `#F5A623` | Já utilizado |
| `--gate-wrong-event` | `#F0A800` | Alerta de evento incorreto |

Não dependa apenas da cor para comunicar status. Sempre combine cor com:

- ícone;
- título do status;
- texto explicativo.

## 2. Tokens de tipografia

### Famílias

```css
--font-display: "Playfair Display", serif;
--font-ui: "IBM Plex Sans", sans-serif;
--font-code: "IBM Plex Mono", monospace;
```

### Escala sugerida

| Token | Tamanho sugerido | Peso | Família |
|---|---:|---:|---|
| `display` | 56–72px desktop | 700 | Playfair Display |
| `h1` | 40–56px | 700 | Playfair Display |
| `h2` | 30–40px | 700 | Playfair Display |
| `h3` | 20–24px | 600 | IBM Plex Sans |
| `body` | 16px | 400 | IBM Plex Sans |
| `body-strong` | 16px | 600 | IBM Plex Sans |
| `small` | 14px | 400 | IBM Plex Sans |
| `label` | 12–14px | 500/600 | IBM Plex Sans |
| `code` | 14–18px | 400/500 | IBM Plex Mono |

A implementação responsiva pode usar `clamp()` para tamanhos de display.

## 3. Espaçamento

Use uma escala contida derivada de 4px:

```text
4
8
12
16
20
24
32
40
48
64
80
```

Prefira espaçamento generoso entre seções e espaçamento interno mais compacto em formulários.

## 4. Raio

A identidade não deve se tornar excessivamente baseada em pills/cards.

Sugestão:

```text
controles pequenos: 6–8px
inputs/botões: 8px
cards/painéis: 10–12px
painéis operacionais grandes do scanner: 12–16px
```

A perfuração do ingresso é um tratamento visual separado e não deve ser simulada com cantos excessivamente arredondados.

## 5. Bordas

As bordas são uma parte importante da linguagem impressa/editorial.

Prefira:

- bordas neutras de 1px;
- separadores estruturais;
- divisor tracejado/perfurado ocasional em ingressos;
- bordas de destaque apenas para estados selecionados/importantes.

## 6. Sombras

Use sombras com moderação.

Estrutura pública/clara:
- elevação sutil apenas quando necessário;
- evite fazer todo painel parecer flutuante.

Ingresso:
- uma sombra contida que remeta a papel físico é aceitável.

Portaria:
- use contraste e bordas mais do que sombra;
- glow de status pode ser usado com cuidado quando melhorar o reconhecimento operacional imediato.

## 7. Botões

### Primário

- fundo na cor de destaque em estrutura clara;
- forte contraste de texto;
- um CTA primário claro por tarefa principal.

### Secundário

- superfície neutra;
- borda;
- sem preenchimento desnecessário.

### Destrutivo/erro

- semântica de erro apenas para estados realmente destrutivos ou de falha.

CTAs dos resultados da portaria podem usar a cor do status atual quando isso melhorar a clareza operacional imediata.

## 8. Formulários

- labels explícitos;
- estado de foco forte;
- validação inline clara;
- não usar apenas placeholder como label;
- nenhum dado simulado de cartão deve sugerir processamento financeiro real.

## 9. Assentos

Apenas três estados visuais:

```text
AVAILABLE
SELECTED
SOLD
```

Não existe estado visual nem de domínio `HELD`.

O estado do assento deve continuar reconhecível além da cor sempre que possível, usando preenchimento/borda/comportamento desabilitado.

## 10. Movimento

Movimento deve ser contido e funcional.

Permitido:

- fade/slide sutil em dialogs;
- transição curta de skeleton para conteúdo;
- pequena transição de status;
- feedback compatível com reduced motion.

Evite:
- transições cinematográficas entre páginas;
- parallax;
- animação decorativa em loop;
- movimento que reduza a velocidade da operação da portaria.

## 11. Princípios responsivos

- use breakpoints orientados pelo conteúdo;
- preserve comprimentos de linha legíveis;
- use grids responsivos com `auto-fill/minmax` para descoberta de sessões;
- recolha filtros/navegação secundária no mobile;
- o ingresso deve continuar fácil de escanear em telas pequenas;
- no mobile, a portaria prioriza scanner/resultado primeiro e navegação depois.
