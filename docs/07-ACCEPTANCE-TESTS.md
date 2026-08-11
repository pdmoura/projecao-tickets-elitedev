# Critérios de Aceite e Matriz de Testes

## 1. Filosofia de testes

Priorizar testes em torno dos invariantes do domínio e dos fluxos visíveis ao avaliador, em vez de perseguir uma porcentagem de cobertura.

Os bugs de maior valor a evitar são:

- vender o mesmo assento duas vezes;
- emitir ingresso após pagamento recusado;
- contornar autorização de papel/propriedade;
- forjar/adivinhar credenciais de ingresso;
- consumir um ingresso no evento errado;
- validar o mesmo ingresso duas vezes;
- perder assentos selecionados por causa do comportamento de merge do polling.

---

## 2. Cenários de aceite do produto

### AC-001 — organizador consegue criar uma sessão a partir da TMDb

**Dado** um organizador autenticado  
**Quando** ele busca um filme, seleciona, visualiza detalhes/trailer, define os campos obrigatórios da sessão e salva  
**Então** a aplicação cria um evento pertencente ao organizador usando um snapshot persistido do filme.

### AC-002 — ausência de trailer não bloqueia

**Dado** um filme sem resultado utilizável de trailer  
**Quando** o organizador o seleciona  
**Então** o preview mostra um fallback e ainda permite `Usar este filme`.

### AC-003 — organizador não pode editar evento de outro organizador

**Dado** o organizador A e um evento pertencente ao organizador B  
**Quando** o organizador A tenta uma requisição direta de mutação  
**Então** o servidor retorna proibido e nenhum dado é alterado.

### AC-004 — cliente vê apenas eventos publicados disponíveis para navegação

Eventos em rascunho não são expostos pelo fluxo normal de descoberta do cliente.

### AC-005 — mapa de assentos faz polling sem redefinir seleção válida

**Dado** A1 e A2 selecionados localmente  
**Quando** o polling retorna ambos ainda `AVAILABLE`  
**Então** ambos permanecem selecionados.

### AC-006 — polling remove apenas o assento selecionado que acabou de ser vendido

**Dado** A1 e A2 selecionados  
**Quando** o próximo polling informa A2 como `SOLD`  
**Então** A2 é removido, A1 permanece selecionado e o usuário é informado de que A2 ficou indisponível.

### AC-007 — polling é interrompido ao sair da página de assentos

Nenhum intervalo/requisição de polling continua após desmontar a tela/navegar para o checkout.

### AC-008 — um cliente compra um assento disponível

Um checkout aprovado e bem-sucedido produz reserva/pagamento/ingresso confirmados e marca o assento como `SOLD`.

### AC-009 — venda duplicada é impossível

**Dado** duas tentativas concorrentes de checkout aprovado para o mesmo assento disponível  
**Então** exatamente uma é bem-sucedida e a outra recebe `SEAT_UNAVAILABLE`/409 (ou conflito equivalente explicitamente documentado), sem ingresso duplicado.

### AC-010 — checkout de múltiplos assentos é atômico

Se o cliente solicitar A1+A2 e A2 não puder ser adquirido, o sistema não deve deixar uma compra parcial bem-sucedida acidentalmente, a menos que compra parcial tenha sido explicitamente projetada (não foi nesta especificação).

### AC-011 — pagamento recusado mantém estoque disponível

Um pagamento determinístico recusado pelo simulador não emite ingresso válido e não deixa assentos como `SOLD`.

### AC-012 — checkout trata conflito tardio de assento

Se um assento selecionado se tornar `SOLD` enquanto o cliente estiver no checkout, o submit retorna 409; a UI explica o conflito e busca novamente o mapa/dados atuais imediatamente.

### AC-013 — cliente não pode ler endpoint privado de ingresso de outro cliente

Manipulação direta de ID não deve expor o ingresso de outro cliente por APIs autenticadas restritas ao proprietário.

### AC-014 — link de compartilhamento funciona sem transferir propriedade

Uma URL válida de compartilhamento renderiza a apresentação do ingresso pretendido, mas o proprietário subjacente permanece inalterado.

### AC-015 — token de QR é opaco

A credencial de segurança do QR não pode ser derivada incrementando IDs de ingresso/evento.

### AC-016 — check-in válido

Ingresso não utilizado para o evento selecionado retorna `VALID` e define o timestamp de uso atomicamente.

### AC-017 — segundo check-in

O mesmo ingresso após validação bem-sucedida retorna `ALREADY_USED` e não sobrescreve inesperadamente a semântica do uso original.

### AC-018 — check-in concorrente

Duas tentativas concorrentes de portaria para o mesmo ingresso não utilizado resultam em um `VALID` e um `ALREADY_USED`, nunca dois `VALID`.

### AC-019 — check-in em evento errado

Um ingresso genuíno e não utilizado de outro evento retorna `WRONG_EVENT` e permanece não utilizado.

### AC-020 — credencial inválida

Token/código manual desconhecido retorna `INVALID` e não altera nenhum ingresso.

### AC-021 — papel de portaria obrigatório

Cliente/organizador chamando diretamente o endpoint de check-in recebe proibido.

### AC-022 — alternativa à câmera

Se a câmera for negada/indisponível, a validação por código manual continua utilizável.

### AC-023 — evento criado sobrevive a falha da TMDb

O detalhe de um evento previamente criado renderiza a partir do snapshot local quando a TMDb estiver indisponível.

### AC-024 — seed permite demonstração pelo avaliador

Um banco recém-semeado fornece organizador documentado, dois clientes, usuário de portaria e pelo menos um evento publicado com assentos disponíveis.

---

## 3. Prioridades de testes automatizados

### P0 — deve automatizar

1. aplicação dos papéis de auth em endpoints representativos;
2. aplicação da propriedade do organizador;
3. sucesso do checkout aprovado;
4. checkout recusado não emite ingresso;
5. proteção contra compra concorrente/duplicada de assento;
6. check-in de ingresso válido;
7. repetição do check-in do ingresso;
8. não consumo em evento errado;
9. proteção de check-in concorrente;
10. fluxo de token/código inválido.

### P1 — deveria automatizar

11. função pura/reducer de merge do polling do mapa de assentos;
12. validação de publicação do evento;
13. semântica de proprietário/apresentação do token de compartilhamento;
14. normalização/fallback da TMDb com respostas externas mockadas;
15. cálculo/serialização de preço.

### P2 — E2E se o cronograma permitir

- organizador cria e publica evento;
- cliente conclui compra aprovada e visualiza ingresso;
- portaria valida manualmente e depois valida novamente;
- cliente vê recuperação de conflito de assento.

---

## 4. Orientação para testes de concorrência

Não “testar” concorrência chamando o endpoint duas vezes em sequência.

Para compra de assento e validação na portaria, construir testes que iniciem requisições/promises concorrentes contra o mesmo estado inicial do recurso e verificar os resultados dos invariantes.

A implementação pode exigir um banco PostgreSQL real de teste para comportamento significativo de concorrência, em vez de um mock em memória.

---

## 5. Roteiro manual para o avaliador

O README deve fornecer um roteiro de demonstração de cinco minutos:

1. Abrir o deploy.
2. Entrar como cliente 1.
3. Comprar assento com pagamento de teste aprovado.
4. Abrir o ingresso gerado.
5. Copiar código manual ou usar o QR em um segundo dispositivo/aba.
6. Entrar como portaria.
7. Selecionar o evento correspondente.
8. Validar -> `VALID`.
9. Validar o mesmo código novamente -> `ALREADY_USED`.
10. Selecionar outro evento e testar um ingresso genuíno não utilizado -> `WRONG_EVENT`.
11. Entrar como cliente 2 e usar pagamento de teste recusado -> `DECLINED`.

Se o teste da câmera de QR exigir HTTPS/acesso a dispositivo, documentar o método mais fácil de avaliação e a alternativa manual.
