# Registro de Uso de IA

Usei bastante ChatGPT e Codex neste desafio. Comecei conversando sobre os requisitos e dividindo o trabalho em etapas menores. Depois o fluxo foi bem prático: conversar, implementar, executar, encontrar problemas, ajustar e testar de novo.

A IA ajudou a entender partes do desafio, discutir a arquitetura, gerar partes iniciais do código, revisar diffs, escrever e ampliar testes, encontrar bugs e melhorar a UX. Ela também foi útil para revisar a documentação e para pensar em casos que eu não tinha lembrado de primeira, como concorrência na compra, check-in duplicado, separação de credenciais e responsividade mobile.

Nem toda sugestão serviu como estava. Algumas decisões foram mudadas depois de testar o projeto, e apareceram bugs e regressões durante o desenvolvimento. Eu revisei as propostas, conferi o comportamento no código e nos testes e decidi o que fazia sentido manter. Um exemplo foi separar a janela de venda da portaria: `startsAt` encerra a compra, mas não representa uma janela de admissão no modelo atual.

Os principais aprendizados foram entender melhor transações e concorrência para não vender o mesmo assento duas vezes, a diferença entre esconder uma ação no frontend e realmente protegê-la no servidor, e a necessidade de manter token de validação, código manual e token de compartilhamento como coisas diferentes. Também aprendi mais sobre hash e criptografia de credenciais, integração externa somente no servidor, cache e retry, scanner com fallback e como detalhes pequenos de UX podem causar regressões em telas mobile.

Não tratei a IA como substituta das decisões do projeto. O escopo, a direção visual, as escolhas finais e a revisão do resultado ficaram sob minha responsabilidade. O código assistido foi revisado com lint, typecheck, testes, leitura de diff e exercício dos fluxos relevantes.
