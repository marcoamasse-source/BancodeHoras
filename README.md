# Banco de Horas - API

API simples em Node/Express para controle de ponto e banco de horas.

## Pré-requisitos
- Node.js 18+
- PostgreSQL

## Instalação
1. Copie `.env.example` para `.env` e ajuste `DATABASE_URL`.
2. Instale dependências:

   npm install

3. Crie a tabela:

   psql "$DATABASE_URL" -f migration.sql

4. Inicie:

   npm run dev  # para desenvolvimento
   npm start    # produção

## Endpoints principais
- POST /api/registros
- GET  /api/registros?nome=...&mes=YYYY-MM
- GET  /api/saldo?nome=...
- DELETE /api/registros/:id

## Observações
- Variável `JORNADA_PADRAO_MIN` define jornada padrão em minutos (480 = 8h).
- O projeto já contém `server.js` na branch `main`.

## Próximos passos sugeridos
- Criar um front-end em `public/` ou integrar com uma UI.
- Adicionar CI (GitHub Actions) para testes e lint.
- Abrir um Pull Request desta branch (`feature/setup`) para `main`.
