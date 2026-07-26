# Banco de Horas

App simples para lançar chegada, saída para almoço, volta do almoço e saída,
calculando automaticamente o saldo do banco de horas (comparado a uma jornada
de 8h/dia). Sem login — cada pessoa digita o nome uma vez e o app lembra no
próprio celular.

## 1. Configurar o banco (Neon)

1. No painel do Neon, copie a **connection string** (pooled connection).
2. Abra o SQL editor do Neon e rode o conteúdo do arquivo `schema.sql`
   (cria a tabela `registros_ponto`).

## 2. Rodar localmente (para testar)

```bash
npm install
cp .env.example .env
# edite o .env e cole sua DATABASE_URL do Neon
npm start
```

Acesse `http://localhost:3000` no navegador.

## 3. Colocar no ar para acessar pelo celular

Como o app precisa ficar acessível pela internet (cada pessoa acessa do
próprio celular), você precisa hospedar o `server.js` em algum serviço.
Opções gratuitas fáceis:

### Render.com
1. Suba este projeto num repositório do GitHub.
2. No Render, crie um **Web Service** apontando para o repositório.
   - Build command: `npm install`
   - Start command: `npm start`
3. Em "Environment", adicione a variável `DATABASE_URL` com a connection
   string do Neon.
4. Após o deploy, você recebe uma URL tipo `https://seu-app.onrender.com`
   — é esse link que cada pessoa abre no navegador do celular.

### Railway.app
Mesmo processo: conecta o repositório, define `DATABASE_URL` nas variáveis
de ambiente, e ele detecta o `npm start` automaticamente.

Depois de no ar, cada pessoa pode "Adicionar à tela de início" no navegador
do celular (Chrome/Safari) para abrir como se fosse um app.

## Como funciona o cálculo

- Horas trabalhadas = (saída − entrada) − (volta do almoço − saída do almoço)
- Saldo do dia = horas trabalhadas − 8h
- O saldo total é a soma dos saldos diários (pode ser positivo ou negativo)

Se algum dia não tiver pausa de almoço, é só deixar os campos de almoço em
branco.

## Estrutura dos arquivos

```
server.js          → API (Express + PostgreSQL)
schema.sql          → script para criar a tabela no Neon
public/index.html   → tela do app
public/app.js        → lógica do front-end
public/style.css     → estilo (mobile-first)
.env.example         → modelo de variáveis de ambiente
```
