# Especificação Funcional

## 1. Comportamento global

### 1.1 Estado de autenticação

A aplicação suporta estados autenticado e não autenticado. Usuários autenticados possuem exatamente um papel de aplicação para o seed/domínio do desafio:

- `ORGANIZER`
- `CUSTOMER`
- `GATE`

A autorização deve ser aplicada no servidor. Ocultar elementos da UI é apenas uma medida de usabilidade, não uma barreira de segurança.

### 1.2 Comportamento de erros

Erros apresentados ao usuário devem ser acionáveis. Evite expor erros brutos do banco de dados, Prisma, Better Auth ou TMDb.

Categorias esperadas:

- erro de validação;
- autenticação necessária;
- ação proibida;
- não encontrado;
- conflito de assento;
- pagamento recusado;
- catálogo externo indisponível;
- erro inesperado do servidor.

Toda página/ação assíncrona deve oferecer estados razoáveis de carregamento, vazio e falha.

---

## 2. Descoberta pública/de eventos pelo cliente

### 2.1 Página de eventos

Objetivo: navegar por sessões que estejam `PUBLISHED` e ainda sejam relevantes para os clientes.

Exibe no mínimo:

- pôster;
- título do filme/sessão;
- data e horário local;
- local;
- preço inicial/por assento;
- sinal de disponibilidade quando útil.

Comportamento:

- grid responsivo de cards com estratégia auto-fill/minmax;
- busca textual por título;
- skeletons de carregamento;
- mensagem de estado vazio quando nenhum resultado corresponder;
- header sticky com blur de fundo;
- filtros/navegação mobile recolhidos em menu/drawer compacto.

### 2.2 Detalhe do evento

Exibe:

- pôster/backdrop armazenado do filme como apoio visual;
- título da sessão/filme;
- snapshot da sinopse;
- data/horário;
- local e sala;
- preço do ingresso;
- resumo de disponibilidade de assentos;
- CTA para escolher assentos.

Não faça o detalhe do evento parecer uma página de reprodução de streaming. A logística da sessão é a informação principal.

---

## 3. Seleção de assentos

### 3.1 Carregamento inicial

Quando montada, a página carrega do backend a disponibilidade atual do evento/assentos.

Estados de assento expostos à UI:

- `AVAILABLE`
- `SOLD`

Estado apenas local da UI:

- `SELECTED`

Não existe estado persistido `HELD`.

### 3.2 Polling

Enquanto a tela de seleção de assentos permanecer montada:

- refazer a busca de disponibilidade aproximadamente a cada 7 segundos;
- evitar sobreposição desnecessária de requisições de polling;
- interromper/limpar o polling ao desmontar;
- interromper o polling quando a navegação seguir para o checkout.

### 3.3 Semântica do merge

A resposta do polling deve ser mesclada com a seleção local, em vez de redefinir todo o estado local.

Para cada assento selecionado:

- se o servidor ainda informar `AVAILABLE`, mantê-lo selecionado;
- se o servidor informar `SOLD`, removê-lo da seleção e avisar ao usuário qual assento ficou indisponível.

Exemplo de notificação:

> O assento A7 foi comprado por outro cliente e removido da sua seleção.

O restante da seleção permanece intacto.

### 3.4 Resumo

A página de assentos mostra:

- rótulos dos assentos selecionados;
- quantidade;
- preço por assento;
- total;
- CTA para seguir ao checkout.

O CTA do checkout fica desabilitado quando nenhum assento estiver selecionado.

---

## 4. Checkout e simulador de pagamento

### 4.1 Entrada no checkout

O checkout recebe um ID de evento e os identificadores dos assentos selecionados. O servidor deve revalidar se o evento pode ser comprado e se os assentos solicitados pertencem àquele evento.

### 4.2 Comportamento do pagamento

O pagamento é simulado e determinístico.

A implementação final deve documentar pelo menos:

- um número/valor de teste aprovado;
- um número/valor de teste recusado.

Nenhum processamento real de cartão acontece.

Entradas do simulador que pareçam sensíveis, como número completo do cartão/CVV, não são persistidas.

### 4.3 Fluxo de pagamento aprovado

A aprovação isoladamente não é suficiente. O servidor deve adquirir os assentos solicitados atomicamente como parte da transação/processo de checkout.

Uma resposta de sucesso significa:

- os assentos passaram para `SOLD` exatamente uma vez;
- a reserva existe;
- os itens da reserva existem;
- o registro de pagamento está `APPROVED`;
- existe um ingresso por assento comprado;
- credenciais seguras dos ingressos foram geradas.

### 4.4 Fluxo de pagamento recusado

Resultado esperado:

- estado visível de `pagamento recusado`;
- nenhum ingresso válido emitido;
- assentos continuam disponíveis para compra;
- nenhum falso estado de sucesso apresentado ao usuário.

### 4.5 Conflito de assento

Se um ou mais assentos ficarem indisponíveis depois que o cliente sair da página de assentos, o checkout retorna:

- HTTP `409 Conflict`;
- código de erro estável e legível por máquina, recomendado: `SEAT_UNAVAILABLE`;
- rótulos/IDs dos assentos em conflito quando for seguro e útil.

Comportamento do cliente:

1. mostrar uma mensagem clara;
2. buscar imediatamente os dados atuais dos assentos;
3. remover assentos indisponíveis;
4. orientar o usuário a escolher substitutos ou atualizar a UI de seleção;
5. não tentar o pagamento novamente automaticamente.

O polling é uma otimização de UX. O `409`/operação atômica é a garantia de consistência.

---

## 5. Meus ingressos

### 5.1 Lista de ingressos

O cliente vê os ingressos que possui, agrupados ou ordenados pelo próximo evento.

Cada card deve mostrar informação suficiente para identificar a sessão sem precisar abri-la.

### 5.2 Detalhe do ingresso

A apresentação do ingresso inclui:

- título do filme/sessão;
- data/horário;
- local/sala;
- assento;
- QR;
- código manual;
- estado atual quando apropriado;
- ação de compartilhar.

O ingresso digital deve se parecer visualmente com um bilhete de entrada, e não com um card SaaS genérico.

### 5.3 QR

O QR contém uma credencial opaca de validação ou uma URL de validação da aplicação contendo essa credencial. Ele não deve expor um ID incremental de ingresso como mecanismo de segurança.

### 5.4 Compartilhamento

A ação de compartilhar cria ou expõe uma URL com um token separado e impossível de adivinhar na prática.

A página pública de ingresso compartilhado:

- não expõe controles da conta do cliente;
- não implica transferência de propriedade;
- mostra apenas as informações necessárias para apresentar o ingresso;
- pode exibir o QR/código manual porque o compartilhamento tem explicitamente o objetivo de permitir que outra pessoa apresente o ingresso.

---

## 6. Gerenciamento de eventos pelo organizador

### 6.1 Minhas sessões

O organizador vê os próprios eventos com estados como:

- `DRAFT`;
- `PUBLISHED`;
- `CANCELLED`, caso seja modelado/utilizado.

Ações mínimas:

- criar;
- editar evento próprio;
- publicar rascunho válido.

Não é necessário dashboard de analytics.

### 6.2 Busca no catálogo

O organizador busca filmes por título através da API de catálogo da aplicação. O navegador não chama a TMDb diretamente com uma credencial secreta.

Os resultados devem mostrar:

- pôster;
- título;
- ano/data de lançamento;
- contexto conciso para diferenciar títulos parecidos.

### 6.3 Modal de seleção do filme + trailer

Quando o organizador seleciona um resultado de filme:

1. a aplicação carrega/usa os detalhes do filme;
2. a aplicação carrega os vídeos do filme na TMDb;
3. escolhe um trailer adequado quando disponível;
4. abre um modal com o preview do filme;
5. inclui apresentação embutida/link do trailer quando suportado;
6. oferece o CTA `Usar este filme`.

Ausência/falha do trailer não deve bloquear a criação do evento. Mostrar um fallback não bloqueante, como `Trailer indisponível`.

### 6.4 Formulário de criação do evento

Campos mínimos:

- filme de origem (fixo após a seleção, a menos que o organizador volte);
- data;
- horário de início;
- nome do local;
- nome da sala;
- dimensões/preset do mapa de assentos;
- preço do ingresso.

Entrada simples recomendada para o mapa de assentos:

- fileiras;
- assentos por fileira.

O sistema gera rótulos `A1...` etc. Não é necessário um editor visual de sala.

### 6.5 Regras de rascunho/publicação

O rascunho pode ser salvo antes que todos os requisitos de publicação estejam completos, se desejado.

A publicação exige todos os dados necessários para compra pelo cliente, incluindo horário de início futuro válido, preço positivo e capacidade gerada.

Sessões publicadas aparecem na descoberta pública/do cliente.

### 6.6 Propriedade

Todos os endpoints/ações de mutação do organizador devem validar ambos:

- papel de organizador;
- `event.organizerId === currentUser.id`.

---

## 7. Validação na portaria

### 7.1 Seleção do evento

O usuário de portaria seleciona qual evento está sendo validado no momento. Esse ID do evento selecionado é incluído nas chamadas de validação.

### 7.2 Scanner de QR

O fluxo principal usa leitura pela câmera quando as permissões do navegador/dispositivo permitirem.

A UI deve tratar:

- solicitação de permissão da câmera;
- permissão negada;
- estado sem suporte/sem câmera;
- leitura bem-sucedida;
- tentar novamente/próximo ingresso.

A entrada manual permanece disponível independentemente do estado da câmera.

### 7.3 Validação manual

O código manual deve ser amigável para humanos e razoavelmente curto, por exemplo caracteres maiúsculos agrupados. O formato exato pode variar.

### 7.4 Resultados de validação

#### `VALID`

O ingresso existe, pertence ao evento selecionado, está ativo e foi marcado como usado atomicamente por esta validação.

Exibir:

- resultado positivo forte;
- nome do participante/titular, se armazenado/apropriado;
- filme/sessão;
- assento;
- ação clara de `próximo ingresso`.

#### `INVALID`

A credencial/código não resolve para um ingresso utilizável.

Não expor se um token adivinhado está próximo de outro token válido.

#### `WRONG_EVENT`

O ingresso é genuíno, mas pertence a outro evento.

Mostrar claramente a incompatibilidade com o evento selecionado sem consumir o ingresso acidentalmente.

#### `ALREADY_USED`

O ingresso já foi consumido.

Se disponível, mostrar o timestamp da validação anterior como contexto operacional.

### 7.5 Consumo atômico

Duas requisições concorrentes para o mesmo ingresso ainda não usado nunca podem retornar `VALID` simultaneamente. Exatamente uma pode consumir o ingresso; tentativas subsequentes/concorrentes resolvem como `ALREADY_USED`.

---

## 8. Comportamento do seed

O seed deve incluir pelo menos:

- um organizador;
- dois clientes;
- um usuário de portaria;
- um evento futuro publicado;
- assentos disponíveis.

Dados adicionais recomendados no seed:

- segundo evento publicado para que `WRONG_EVENT` seja fácil de demonstrar;
- um ingresso já comprado para demonstração rápida de check-in;
- um ingresso já utilizado, se ajudar na avaliação imediata.

Todas as credenciais e caminhos de demonstração devem estar documentados no README.
