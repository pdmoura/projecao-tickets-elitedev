# Matriz de Rastreabilidade de Requisitos

Esta matriz relaciona os requisitos fornecidos no desafio ao comportamento planejado do produto e à cobertura de aceite. Atualize `Status de implementação` durante o desenvolvimento.

Legenda:

- **Obrigatório** — solicitado explicitamente pelo desafio.
- **Opcional** — diferencial previsto no desafio.
- **Escolhido** — decisão opcional/de produto incluída intencionalmente.
- **Fora** — explicitamente não planejado para a V1.

| ID | Requisito | Classe | Solução planejada | Principais docs/testes | Status de implementação |
|---|---|---|---|---|---|
| FE-01 | Navegar por eventos publicados com data, local e preço | Obrigatório | Grid público responsivo de eventos + detalhe do evento | Functional §2; AC-004 | TODO |
| FE-02 | Buscar eventos publicados | Interpretação obrigatória | Busca textual por título | Functional §2 | TODO |
| FE-03 | Organizador cria/gerencia eventos | Obrigatório | `Minhas sessões` do organizador + criar/editar/publicar | Functional §6; AC-001/003 | TODO |
| FE-04 | Mapa de assentos ou fluxo por quantidade | Obrigatório | Mapa de assentos de cinema | Functional §3 | TODO |
| FE-05 | Confirmação de pagamento | Obrigatório | Simulador determinístico `APPROVED` | Functional §4; AC-008 | TODO |
| FE-06 | Recusa de pagamento | Obrigatório | Simulador determinístico `DECLINED` | Functional §4; AC-011 | TODO |
| FE-07 | Meus ingressos | Obrigatório | Lista/detalhe de ingressos do cliente | Functional §5 | TODO |
| FE-08 | QR no ingresso | Obrigatório | QR derivado de credencial opaca de validação | Functional §5; Architecture §10 | TODO |
| FE-09 | Tela de validação da portaria | Obrigatório | UI focada em scanner/resultado | Functional §7 | TODO |
| FE-10 | Resultados válido/inválido/já utilizado/evento errado | Obrigatório | Resultados de domínio `VALID`, `INVALID`, `ALREADY_USED`, `WRONG_EVENT` | Functional §7; AC-016–020 | TODO |
| FE-11 | Leitura de QR pela câmera | Obrigatório | Scanner usando câmera do navegador | Functional §7; AC-022 | TODO |
| FE-12 | Alternativa por código manual | Obrigatório | Código manual amigável para humanos | Functional §7 | TODO |
| BE-01 | API externa Ticketmaster ou TMDb | Obrigatório | TMDb v3 por meio do módulo de catálogo no servidor | Architecture §6 | TODO |
| BE-02 | Três papéis de autenticação | Obrigatório | `ORGANIZER`/`CUSTOMER`/`GATE` | Architecture §4–5 | TODO |
| BE-03 | Armazenar eventos/reservas/ingressos | Obrigatório | Modelo de domínio em PostgreSQL | Domain Model | TODO |
| BE-04 | Impedir venda duplicada do mesmo assento | Obrigatório | Checkout atômico + constraints do banco | Architecture §7–8; AC-009/010 | TODO |
| BE-05 | QR não pode ser forjado | Obrigatório | Token opaco de alta entropia + armazenamento por hash | Architecture §10; AC-015 | TODO |
| BE-06 | Compartilhar ingresso por link gerado | Obrigatório | Token aleatório de compartilhamento separado | Functional §5; AC-014 | TODO |
| BE-07 | Mesmo ingresso não pode ser validado duas vezes | Obrigatório | Check-in atômico de uso único | Architecture §11; AC-017/018 | TODO |
| BE-08 | Cobrança simulada | Obrigatório | `PaymentSimulator` determinístico | Architecture §9 | TODO |
| TECH-01 | Frontend React | Obrigatório | React via Next.js | Architecture §2 | TODO |
| TECH-02 | Backend Node/Python/Java | Obrigatório | Servidor Node/Next.js | Architecture §2 | TODO |
| TECH-03 | Banco de dados à escolha | Obrigatório | PostgreSQL + Prisma | Architecture §2 | TODO |
| NFR-01 | 7 dias corridos | Restrição obrigatória | Plano final priorizará primeiro uma fatia vertical completa | Product §6/9 | N/A |
| NFR-02 | README detalhado de configuração | Obrigatório | `11-README-OUTLINE.md` -> README raiz | README Outline | TODO |
| NFR-03 | Mencionar falhas/limitações conhecidas | Obrigatório | Seção de limitações conhecidas | README Outline | TODO |
| NFR-04 | Seed de organizador | Obrigatório | Seed | Functional §8; AC-024 | TODO |
| NFR-05 | Seed de dois clientes | Obrigatório | Seed | Functional §8; AC-024 | TODO |
| NFR-06 | Seed de usuário de portaria | Obrigatório | Seed | Functional §8; AC-024 | TODO |
| NFR-07 | Seed de >=1 evento publicado com ingressos disponíveis | Obrigatório | Seed | Functional §8; AC-024 | TODO |
| NFR-08 | Repositório público no GitHub | Obrigatório | Processo de entrega do repositório | Plano final/README | TODO |
| NFR-09 | Commits descritivos durante a semana | Obrigatório | Commit por funcionalidade/milestone coerente | Plano final | TODO |
| AI-01 | Explicar ferramentas/partes feitas com IA | Solicitação obrigatória | Registro de Uso de IA | `10-AI-USAGE-LOG-TEMPLATE.md` | TODO |
| AI-02 | Explicar o que foi feito sem IA | Solicitação obrigatória | Registro de Uso de IA | AI Usage Log | TODO |
| AI-03 | Versionar specs/artefatos de contexto | Incentivado | Commit do pacote `/docs` | Esta pasta | TODO |
| OPT-01 | Busca/filtro de eventos | Opcional/parcialmente obrigatório | Busca básica obrigatória; filtros avançados somente se houver tempo | Functional §2 | TODO |
| OPT-02 | Dashboard/painel do organizador | Opcional | `Minhas sessões` leve, sem dashboard de analytics | Functional §6 | TODO |
| OPT-03 | Cancelamento/devolução ao estoque | Opcional | Fora da V1 inicial | Product §7 | OUT |
| OPT-04 | Mapa de assentos em tempo real | Opcional | Polling de aprox. 7s, não WebSocket | ADR-004 | ALTERNATIVA ESCOLHIDA |
| OPT-05 | Docker Compose | Opcional | PostgreSQL local via Compose | Architecture §14 | TODO |
| OPT-06 | Testes | Opcional | Testes de invariantes críticos do domínio | Acceptance Tests | TODO |
| OPT-07 | Deploy | Opcional +1 ponto | Alvo Vercel + Postgres gerenciado | Architecture §2/14 | TODO |
| EXTRA-01 | Preview de trailer da TMDb | Diferencial escolhido | Modal de seleção do organizador usando vídeos do filme | Functional §6.3; ADR-011 | TODO |
| EXTRA-02 | Merge do polling preserva seleção | UX escolhida | Merge a cada 7s + notificação | Functional §3; AC-005–007 | TODO |
| EXTRA-03 | Adapter de isolamento do Better Auth | Arquitetura escolhida | Somente `modules/auth` depende do fornecedor | Architecture §4; ADR-003 | TODO |
| EXTRA-04 | Identidade editorial de cinema independente | Design escolhido | Papel/editorial/bilhete impresso | UX/UI Spec; ADR-010 | TODO |

## Notas de cobertura

### Ambiguidade no enunciado do desafio: busca
A lista obrigatória de front-end menciona explicitamente navegação e busca, enquanto busca/filtros avançados aparece entre os opcionais. Esta especificação trata **busca básica por título como obrigatória** e filtros avançados como opcionais.

### Ambiguidade no enunciado do desafio: painel do organizador
Um dashboard rico do organizador é opcional, mas criação/gerenciamento de eventos é obrigatório. A V1, portanto, inclui uma superfície mínima de gerenciamento `Minhas sessões`, sem analytics desnecessários.

### Escolha do catálogo externo
Somente a TMDb é necessária porque o enunciado permite Ticketmaster **ou** TMDb. Usar ambas ampliaria o escopo sem fortalecer o ciclo principal do ingresso o suficiente para justificar o custo.
