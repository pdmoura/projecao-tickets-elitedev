# Projeção — Especificação de Marca

## 1. Marca

**Nome:** Projeção  
**Tagline:** cinema que acontece

## 2. Racional da marca

O nome **Projeção** remete diretamente ao ato que está no centro da experiência do cinema: um filme sendo projetado e vivido coletivamente dentro de uma sala.

A marca é posicionada de forma intencional em torno de **presença, programação, lugar e entrada**, e não de streaming ou consumo sob demanda.

A identidade visual combina:

- programação de cinema independente;
- linguagem editorial;
- ingressos impressos;
- papel, tinta, margens, numeração e pequenos detalhes de registro;
- usabilidade contemporânea de produto digital.

O resultado deve parecer culturalmente consciente e autoral, sem virar uma caricatura retrô.

## 3. Personalidade da marca

A Projeção deve parecer:

- editorial;
- humana;
- cultural;
- independente;
- confiante;
- precisa;
- acolhedora;
- contemporânea.

Ela não deve parecer:

- corporativa;
- futurista sem necessidade;
- centrada em streaming;
- excessivamente luxuosa;
- infantilmente lúdica;
- um template genérico de IA/SaaS.

## 4. Sistema de logo

Assets aprovados para implementação:

- `public/brand/logo.svg` — wordmark principal
- `public/brand/logo-mark.svg` — marca compacta
- `public/brand/favicon.svg` — favicon / marca pequena da aplicação

### Wordmark principal

Use o wordmark completo `projeção` em:

- header público;
- autenticação;
- estrutura do organizador;
- estrutura da portaria/check-in quando houver espaço.

### Marca compacta

Use a marca compacta quando o wordmark completo não for prático:

- favicon;
- superfícies mobile muito estreitas;
- pequenos pontos de identidade;
- footer ou navegação compacta.

### Princípios de uso da logo

- preserve uma área de respiro ao redor da marca;
- não estique nem distorça;
- não adicione sombras projetadas;
- não altere as cores arbitrariamente;
- não recrie o wordmark com texto genérico quando o SVG estiver disponível;
- prefira os tratamentos aprovados de tinta/neutro e cor de destaque.

## 5. Filosofia de cores

As experiências pública e do organizador usam superfícies quentes em tons de papel e tipografia escura semelhante a tinta.

A experiência da portaria/check-in usa deliberadamente uma estrutura operacional escura, porque prioriza leitura rápida, alto contraste de status e uso contínuo em contexto de entrada.

A cor de destaque é um ocre/dourado quente, em vez do vermelho típico de serviços de streaming.

Consulte `UI-TOKENS.md` para os tokens de implementação.

## 6. Tipografia

Famílias tipográficas principais:

- **Playfair Display** — títulos editoriais/display
- **IBM Plex Sans** — interface e corpo de texto
- **IBM Plex Mono** — códigos, identificadores de ingresso e metadados com aparência serial

### Uso

**Playfair Display**
- título de página;
- título do filme/sessão;
- ênfase de marca/editorial;
- alguns títulos grandes de destaque.

**IBM Plex Sans**
- navegação;
- labels;
- corpo de texto;
- botões;
- formulários;
- interface operacional.

**IBM Plex Mono**
- códigos manuais de ingresso;
- identificadores de validação;
- informações compactas de série/metadados;
- identificadores técnicos de status quando apropriado.

## 7. Motivos visuais

Motivos permitidos incluem:

- superfícies de papel;
- bordas sutis;
- perfuração de ingresso;
- tipografia de código/serial;
- alinhamento editorial;
- pequenos pontos de registro ou marcas de destaque contidas;
- espaçamento inspirado em programas impressos;
- composição guiada por pôsteres.

Evite:

- grandes heros cinematográficos em vermelho/preto;
- branding baseado em botão de play;
- clichês de pipoca/câmera;
- glassmorphism em toda a interface;
- sombras excessivas;
- cards de dashboard sem significado;
- gráficos decorativos.

## 8. Voz da marca

A copy deve ser:

- curta;
- calma;
- clara;
- útil;
- humana;
- direta.

Feedback operacional, especialmente na portaria, deve priorizar compreensão acima de personalidade.

Exemplos:

- `Pagamento aprovado`
- `Este assento não está mais disponível`
- `Ingresso já utilizado`
- `Este ingresso pertence a outra sessão`

Evite linguagem excessivamente publicitária dentro de fluxos funcionais.

## 9. Acessibilidade

A expressão da marca nunca deve reduzir a usabilidade.

Mantenha:

- contraste forte de texto;
- tamanhos de fonte legíveis;
- estados de foco visíveis;
- comunicação de status além da cor;
- área de respiro e contraste suficientes para QR Code;
- alvos de toque adequados para uso operacional em mobile.
