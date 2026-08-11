# Checklist de Segurança e Concorrência

Este é um checklist focado no desafio, não um programa completo de segurança de produção. Ele se concentra nos modos de ataque/falha mais relevantes para os requisitos.

## 1. Limite de autenticação

- [ ] Imports de `better-auth` estão restritos a `src/modules/auth/**` / superfície mínima de integração pertencente à aplicação.
- [ ] `getSession`, `requireUser`, `requireRole`, `requireOwner` retornam/operam sobre tipos pertencentes à aplicação.
- [ ] Nenhuma rota confia em papel fornecido pelo cliente.
- [ ] Comportamento de logout/invalidação de sessão funciona.
- [ ] Credenciais de seed são apenas para demonstração e estão claramente documentadas.

## 2. Autorização

- [ ] Cliente não consegue chamar endpoints de mutação do organizador.
- [ ] Portaria não consegue chamar endpoints de mutação do organizador.
- [ ] Organizador não consegue chamar check-in da portaria como uma ação autorizada de portaria.
- [ ] Organizador A não consegue editar/publicar evento do organizador B.
- [ ] Cliente A não consegue acessar ingresso privado do cliente B alterando o ID.
- [ ] Endpoint de ingresso compartilhado é protegido pelo token de compartilhamento, e não por ID de ingresso adivinhável.

## 3. Validação de entrada

- [ ] Todos os payloads de mutação são validados no servidor.
- [ ] Preço do evento é positivo e armazenado em centavos inteiros.
- [ ] Dimensões do mapa de assentos possuem limites para evitar geração acidentalmente enorme.
- [ ] Horário de início do evento é validado para publicação.
- [ ] IDs dos assentos no checkout pertencem ao evento solicitado.
- [ ] IDs de assento duplicados em uma mesma requisição de checkout são rejeitados/normalizados com segurança.
- [ ] Strings de busca e IDs são tratados sem risco de SQL injection bruto.

## 4. Concorrência de assentos

### Ameaça
Dois clientes veem `A7 AVAILABLE` e compram simultaneamente.

### Proteção obrigatória
- [ ] Banco de dados/transação é autoritativo.
- [ ] Aquisição condicional de assento ou constraint única equivalente impede venda duplicada.
- [ ] Checkout de múltiplos assentos faz rollback se o conjunto completo solicitado não puder ser adquirido.
- [ ] Teste de concorrência usa requisições/transações realmente concorrentes.
- [ ] Cliente recebe `409 SEAT_UNAVAILABLE` em conflito tardio.
- [ ] Cliente faz refetch imediato e explica quais assentos mudaram.

### O que NÃO é proteção
- Polling a cada ~7s **não** impede venda acima do estoque.
- Desabilitar um assento no React **não** impede venda acima do estoque.

## 5. Ciclo de vida do polling

- [ ] Ativo somente enquanto a tela de assentos estiver montada.
- [ ] Limpar intervalo ao desmontar.
- [ ] Abortar/ignorar requisições obsoletas, se necessário.
- [ ] Evitar intervalos sobrepostos se uma requisição durar mais do que o intervalo.
- [ ] Merge preserva seleção local válida.
- [ ] Assento selecionado que se torna `SOLD` é removido e o usuário é avisado.
- [ ] Polling para ao seguir para o checkout.

## 6. Simulador de pagamento

- [ ] Fluxos aprovado/recusado são determinísticos.
- [ ] Número completo do cartão/CVV não são persistidos.
- [ ] Valores brutos de pagamento não são escritos em logs.
- [ ] Pagamento recusado não pode deixar assento `SOLD`/ingresso.
- [ ] Cliente não pode forçar `APPROVED` enviando um campo de status de pagamento.
- [ ] Servidor calcula o total a partir do preço autoritativo do evento/assento, e não do total fornecido pelo cliente.

## 7. Segurança das credenciais do ingresso

### Token de validação do QR

- [ ] Gerado usando aleatoriedade criptograficamente segura.
- [ ] Entropia suficiente (por exemplo, token aleatório de 256 bits).
- [ ] ID do ingresso/ID do evento isoladamente não é a credencial.
- [ ] Persistir hash do token quando for prático.
- [ ] Comparar hash derivado durante a consulta.
- [ ] Não expor hash armazenado nas APIs.
- [ ] Evitar registrar token bruto em logs.

### Código manual

- [ ] Aleatório/imprevisível o suficiente para o contexto do desafio.
- [ ] Constraint única no banco.
- [ ] Normalizado de forma consistente (maiúsculas/minúsculas/hífens) antes da consulta.
- [ ] Considerar rate limiting leve se for trivial adicionar.

### Token de compartilhamento

- [ ] Separado do token de validação do QR.
- [ ] Aleatório/imprevisível.
- [ ] Armazenado por hash quando for prático.
- [ ] Não concede acesso no nível da conta.
- [ ] Compartilhamento não altera o proprietário.

## 8. Concorrência de check-in

### Ameaça
Duas portarias escaneiam simultaneamente o mesmo ingresso ainda não utilizado.

### Proteção obrigatória
- [ ] Resultado `VALID` e transição de `usedAt` acontecem atomicamente.
- [ ] Exatamente uma requisição concorrente pode retornar `VALID`.
- [ ] A outra requisição retorna `ALREADY_USED`.
- [ ] Verificações de `WRONG_EVENT` não consomem ingresso.
- [ ] Verificações `INVALID` não alteram outros ingressos.
- [ ] `usedAt` anterior não é sobrescrito silenciosamente por leituras repetidas.
- [ ] Teste de integração de concorrência usa comportamento real do banco de dados.

## 9. API externa

- [ ] Segredo/token de acesso da TMDb fica apenas no servidor.
- [ ] Navegador nunca recebe credencial do servidor.
- [ ] Erros da TMDb são mapeados para `CATALOG_UNAVAILABLE`/mensagens seguras.
- [ ] Páginas de eventos existentes não exigem TMDb ao vivo.
- [ ] Embed de trailer usa somente sites/tipos de vídeo conhecidos e suportados; sem injeção arbitrária de HTML não confiável.
- [ ] URLs externas de imagem/vídeo são tratadas conforme a configuração de conteúdo/segurança do framework.

## 10. Base da aplicação web

- [ ] Segredos excluídos do Git; `.env.example` contém apenas nomes.
- [ ] Configuração de cookies/sessão em produção apropriada para HTTPS.
- [ ] Nenhum stack trace sensível é enviado aos usuários.
- [ ] Logs do servidor não imprimem cookies/tokens de auth.
- [ ] Proteções de CSRF/sessão seguem a semântica da integração Better Auth/Next.
- [ ] Página pública de ingresso compartilhado expõe apenas informações necessárias do ingresso.
- [ ] Headers de segurança/CSP considerados caso a configuração de embed do trailer exija fontes de frame.

## 11. Casos de abuso/borda que vale verificar manualmente

- [ ] checkout com ID de assento de outro evento;
- [ ] checkout com o mesmo ID de assento repetido;
- [ ] checkout com preço/total fabricado;
- [ ] editar evento usando ID de outro organizador;
- [ ] solicitar evento em rascunho por endpoint público;
- [ ] escanear ingresso válido no evento errado e depois no evento correto;
- [ ] escanear ingresso usado no evento correto;
- [ ] QR/token manual malformado;
- [ ] comportamento de evento expirado/cancelado conforme realmente implementado/documentado;
- [ ] link compartilhado depois que o ingresso foi usado (deve mostrar estado verdadeiro se o estado for exibido).
