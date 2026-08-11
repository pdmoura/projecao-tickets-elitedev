# Estrutura do README Final

> Esta é uma estrutura para o README na raiz do repositório. Preencha com a implementação real conforme o projeto evoluir. Não declare funcionalidades que não foram implementadas.

# [Nome do Produto]

Descrição do produto em uma frase.

## Demo ao vivo

- URL: [preencher]

## Contas de demonstração

| Papel | E-mail | Senha |
|---|---|---|
| Organizador | [seed] | [seed] |
| Cliente 1 | [seed] | [seed] |
| Cliente 2 | [seed] | [seed] |
| Portaria | [seed] | [seed] |

## Fluxo rápido de avaliação

Uma sequência curta que permita ao avaliador verificar compra -> ingresso -> check-in -> já utilizado -> pagamento recusado.

## Screenshots

Recomendado:

1. descoberta de eventos;
2. seleção de filme/trailer pelo organizador;
3. mapa de assentos;
4. ingresso digital com estilo impresso;
5. estado `VALID`/`ALREADY_USED` na portaria.

## Problema e direção do produto

Explicar por que a implementação foca em sessões de cinema e no ciclo de vida completo.

## Funcionalidades

Separar funcionalidades obrigatórias implementadas de extras opcionais.

## Stack técnica

Listar versões/ferramentas reais a partir dos arquivos de pacotes/deploy.

## Arquitetura

Explicar o monólito modular e apontar para `docs/03-TECHNICAL-ARCHITECTURE.md`.

Incluir um diagrama conciso.

## Principais decisões técnicas

Resumir/apontar para `docs/08-ARCHITECTURE-DECISIONS.md`, especialmente:

- limite do adapter do Better Auth;
- polling vs WebSocket/`HELD`;
- aquisição atômica de assentos;
- simulador de pagamento determinístico;
- tokens QR seguros;
- check-in atômico e de uso único;
- snapshot da TMDb;
- escolha de identidade visual.

## Configuração local

### Requisitos

- versão do Node
- Docker/Docker Compose, se usado

### Variáveis de ambiente

Fornecer campos do `.env.example` sem segredos.

### Instalação

```bash
[comandos reais]
```

### Banco de dados

```bash
[comando Docker]
[comando Prisma migrate]
[comando de seed]
```

### Executar

```bash
[comando de desenvolvimento]
```

## Simulador de pagamento

Listar claramente os valores determinísticos de aprovação/recusa.

## Modelo do banco de dados

Descrição breve/link para o modelo de domínio.

## Como funciona a consistência dos assentos

Explicar:

- polling é apenas UX;
- não existe estado `HELD`;
- checkout atômico protege o estoque;
- recuperação de `409`.

## Segurança e validação dos ingressos

Explicar:

- credencial QR opaca e aleatória;
- armazenamento por hash;
- código manual separado;
- credencial de compartilhamento separada;
- consumo atômico e de uso único.

Não revelar segredos reais.

## Integração com TMDb

Explicar proxy/normalização no servidor, snapshot e preview de trailer.

Incluir atribuição obrigatória da TMDb, se aplicável ao produto final de acordo com os termos/documentação vigentes da TMDb.

## Testes

Mostrar comandos reais e quais comportamentos críticos estão cobertos.

## Deploy

Descrever plataforma/configuração real do banco e quaisquer observações.

## Limitações conhecidas

Ser explícito. Bons candidatos são apenas limitações realmente presentes, por exemplo: sem hold temporário de assentos, sem reembolsos, sem provedor real de pagamento.

## O que eu faria a seguir

Possíveis melhorias futuras, priorizadas e tecnicamente plausíveis.

## Uso de IA

Apontar para `docs/10-AI-USAGE-LOG-TEMPLATE.md` depois de renomeá-lo/preenchê-lo como registro final de uso de IA.

Explicar como a IA acelerou o trabalho e onde o julgamento humano alterou/rejeitou sugestões.

## Artefatos do projeto

Apontar para docs/specs/ADRs versionados com o repositório.

## Licença / observação do desafio

Adicionar somente se apropriado.
