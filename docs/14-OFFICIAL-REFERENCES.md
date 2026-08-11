# Referências Técnicas Oficiais

Estas são as referências primárias verificadas durante a preparação da especificação. Verifique-as novamente de acordo com as versões presentes no lockfile final antes de implementar detalhes sensíveis à versão.

## Better Auth

- Integração com Next.js: https://better-auth.com/docs/integrations/next
- Uso básico: https://better-auth.com/docs/basic-usage
- API de servidor: https://better-auth.com/docs/concepts/api
- Gerenciamento de sessão: https://better-auth.com/docs/concepts/session-management
- Conceitos de banco de dados: https://www.better-auth.com/docs/concepts/database

## Next.js

- App Router: https://nextjs.org/docs/app
- Route Handlers: https://nextjs.org/docs/app/getting-started/route-handlers
- Referência de `route.ts`: https://nextjs.org/docs/app/api-reference/file-conventions/route

## API TMDb v3

- Primeiros passos: https://developer.themoviedb.org/docs/getting-started
- Busca de filmes: https://developer.themoviedb.org/reference/search-movie
- Detalhes do filme: https://developer.themoviedb.org/reference/movie-details
- Vídeos do filme: https://developer.themoviedb.org/reference/movie-videos

## Prisma

- Transações: https://www.prisma.io/docs/orm/prisma-client/queries/transactions
- IDs compostos e constraints únicas: https://www.prisma.io/docs/orm/prisma-client/special-fields-and-types/working-with-composite-ids-and-constraints
- Referência de erros: https://www.prisma.io/docs/orm/reference/error-reference

## Observação

Este pacote de documentação evita deliberadamente acoplar a implementação a detalhes internos não documentados das bibliotecas. Por exemplo, o contrato de autenticação usado pela aplicação é nosso próprio adapter; o formato da API do Better Auth fica restrito à implementação de auth.
