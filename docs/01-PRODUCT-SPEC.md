# Especificação do Produto

## 1. Resumo do produto

Construir uma plataforma full-stack de eventos e ingressos focada em **sessões especiais de cinema**. Um organizador seleciona um filme na TMDb, cria e publica uma sessão local, define horário, local, sala, mapa de assentos e preço, e os clientes podem descobrir a sessão, escolher lugares, concluir um pagamento simulado e receber ingressos digitais seguros. A equipe de portaria valida os ingressos por leitura de QR ou por código manual.

O produto deve demonstrar um fluxo completo de ponta a ponta, em vez de ampla cobertura de funcionalidades.

## 2. Intenção do produto

O desafio não é reproduzir uma plataforma comercial de ingressos. A implementação deve tomar algumas decisões deliberadas e executá-las bem, principalmente em relação a:

- modelagem de domínio;
- autorização;
- consistência do estoque de assentos;
- tratamento de estados de pagamento;
- emissão segura de ingressos;
- validação de uso único;
- UX específica por papel;
- tratamento de erros;
- documentação de trade-offs.

## 3. Posicionamento do produto

**Conceito de trabalho:** uma programação digital para sessões de cinema independente/especial, com linguagem visual inspirada em programas culturais impressos e bilhetes de entrada.

Isso é intencionalmente diferente de um clone de serviço de streaming. A TMDb é usada como catálogo de conteúdo, mas o produto é sobre **comparecer a uma sessão física**, e não assistir mídia online.

## 4. Atores principais

### 4.1 Cliente

Objetivos:

- descobrir sessões publicadas;
- buscar por título do filme/sessão;
- visualizar data, local e preço;
- escolher assentos disponíveis;
- pagar pelo simulador;
- acessar ingressos comprados;
- exibir QR/código manual;
- compartilhar um ingresso por link gerado.

### 4.2 Organizador

Objetivos:

- buscar no catálogo de filmes da TMDb;
- inspecionar detalhes e trailer antes de escolher o título de origem;
- criar uma sessão a partir desse filme;
- definir dados específicos da sessão;
- editar sessões próprias;
- publicar sessões;
- visualizar informações básicas de gerenciamento do evento.

### 4.3 Portaria

Objetivos:

- escolher o evento que está sendo validado;
- escanear um QR com a câmera do dispositivo;
- digitar manualmente um código como alternativa;
- receber um resultado de validação grande e inequívoco;
- seguir rapidamente para o próximo participante.

## 5. Jornadas principais de ponta a ponta

### Jornada A — compra pelo cliente

1. O cliente entra na conta.
2. O cliente abre os eventos publicados.
3. O cliente busca/seleciona uma sessão.
4. O cliente vê os detalhes do filme/sessão.
5. O cliente abre o mapa de assentos.
6. O cliente seleciona um ou mais assentos disponíveis.
7. O cliente segue para o checkout.
8. O simulador de pagamento retorna `APPROVED` ou `DECLINED` de forma determinística.
9. Se aprovado e os assentos ainda puderem ser adquiridos atomicamente, reserva/pagamento/ingressos são persistidos.
10. O cliente abre `Meus ingressos` e vê o QR/código manual do ingresso.
11. O cliente pode gerar/copiar um link de compartilhamento.

### Jornada B — criação pelo organizador

1. O organizador entra na conta.
2. O organizador abre `Minhas sessões`.
3. O organizador escolhe `Nova sessão`.
4. O organizador busca na TMDb.
5. O organizador seleciona um resultado de filme.
6. A aplicação carrega detalhes e vídeos da TMDb.
7. Se existir um trailer adequado, ele é exibido em um modal de preview.
8. O organizador confirma `Usar este filme`.
9. O organizador define data/horário, local, sala, mapa de assentos e preço.
10. O organizador salva um rascunho.
11. O organizador publica a sessão.
12. A sessão publicada passa a ficar visível para os clientes.

### Jornada C — validação na portaria

1. O usuário de portaria entra na conta.
2. O usuário de portaria seleciona o evento ativo.
3. O usuário de portaria escaneia o QR ou digita o código manual.
4. O backend valida e consome atomicamente o ingresso quando ele é válido.
5. A UI mostra exatamente um dos seguintes estados:
   - `VALID`;
   - `INVALID`;
   - `ALREADY_USED`;
   - `WRONG_EVENT`.
6. O usuário de portaria segue para o próximo ingresso.

## 6. Escopo funcional do MVP

### Obrigatório na V1

- Autenticação por e-mail/senha.
- Três papéis: organizador, cliente e portaria.
- Rotas/ações protegidas no servidor.
- Busca de filmes na TMDb através do backend da aplicação.
- Snapshot dos detalhes do filme armazenado quando ele for usado em um evento.
- Preview de trailer no fluxo de criação do organizador quando disponível.
- Criação/edição/publicação de eventos pertencentes ao organizador.
- Descoberta/busca de eventos publicados.
- Página de detalhes do evento.
- Mapa de assentos gerado.
- Polling de disponibilidade enquanto o mapa de assentos estiver montado.
- Seleção local preservada durante o merge do polling quando possível.
- Pagamento simulado determinístico aprovado/recusado.
- Aquisição atômica de assentos.
- Persistência de reserva.
- Criação segura de ingresso.
- `Meus ingressos`.
- QR Code.
- Código manual do ingresso.
- Link compartilhável do ingresso.
- Leitura de QR pela câmera.
- Alternativa manual de validação na portaria.
- Consumo atômico e de uso único do ingresso.
- Dados de seed.
- Estados de erro.
- Testes automatizados básicos para invariantes do domínio.
- README claro.
- Repositório público no Git.
- Deploy, se viável, porque melhora diretamente a experiência de avaliação.

## 7. Não escopo explícito da V1

- Estoque de pista/entrada geral.
- Mapas de evento por setores.
- Integração com catálogo de shows/concertos.
- Revenda de ingressos.
- Transferência de propriedade do ingresso.
- Recuperação de senha.
- Envio por e-mail.
- Processamento real de pagamento.
- Processamento de reembolso.
- Cupons/promoções.
- Relatórios financeiros.
- Analytics avançado do organizador.
- Aplicativo mobile nativo.
- WebSockets/SSE.
- Holds temporários de assentos/countdowns.
- Editor visual complexo de local/sala.
- Microservices.

Uma funcionalidade só deve ser adicionada depois que todo o fluxo obrigatório estiver funcionando e testado.

## 8. Regras do produto

1. Apenas organizadores criam/gerenciam eventos.
2. Organizadores podem gerenciar somente eventos de sua propriedade.
3. Clientes podem comprar apenas eventos futuros publicados que tenham assentos disponíveis.
4. O mapa de assentos no cliente é consultivo; a disponibilidade no backend é autoritativa.
5. Um assento físico de um evento pode ser vendido no máximo uma vez.
6. Pagamento recusado não emite ingressos utilizáveis.
7. Os ingressos não contêm identificador previsível que possa ser usado para forjar outro ingresso.
8. Compartilhar um ingresso não transfere sua propriedade.
9. Um ingresso válido pode ser consumido apenas uma vez.
10. Um ingresso válido do evento A deve retornar `WRONG_EVENT` quando apresentado no evento B.
11. Um token/código ausente ou desconhecido retorna `INVALID` sem vazar detalhes sensíveis.
12. Falha da TMDb não deve invalidar eventos já criados a partir de snapshots armazenados.

## 9. Definição de sucesso

O projeto é bem-sucedido quando um avaliador consegue clonar ou abrir o deploy e, usando as contas de seed documentadas, concluir estas demonstrações sem intervenção do desenvolvedor:

- organizador cria/publica uma sessão a partir da TMDb;
- cliente compra um assento disponível por meio de um pagamento aprovado;
- cliente vê e compartilha o ingresso resultante;
- portaria valida o ingresso como `VALID`;
- o mesmo ingresso imediatamente valida como `ALREADY_USED`;
- um ingresso válido de outro evento retorna `WRONG_EVENT`;
- um cartão de teste conhecido para recusa produz uma falha de pagamento visível sem emitir ingresso;
- um conflito concorrente/tardio de assento produz uma experiência clara de `409`, em vez de vender acima do estoque.
