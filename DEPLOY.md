# Deploy Vercel + Render + Supabase

Este projeto esta preparado para:

- Frontend Next.js na Vercel, com root directory `frontend`
- Backend Spring Boot no Render, com root directory `backend`
- Banco PostgreSQL no Supabase

## 1. Supabase

Crie um projeto no Supabase e copie os dados de conexao do banco.

Para o Render, use preferencialmente a URL JDBC do pooler em modo Transaction:

```txt
SPRING_DATASOURCE_URL=jdbc:postgresql://HOST_DO_POOLER:6543/postgres?prepareThreshold=0
SPRING_DATASOURCE_USERNAME=postgres.PROJECT_REF
SPRING_DATASOURCE_PASSWORD=SENHA_DO_BANCO
```

O parametro `prepareThreshold=0` evita problemas comuns do driver PostgreSQL com pooler em modo Transaction.

## 2. Render Backend

Crie um Web Service no Render apontando para o repositorio.

Configuracao recomendada:

```txt
Root Directory: backend
Runtime: Docker
Health Check Path: /health
```

Variaveis de ambiente no Render:

```txt
SPRING_DATASOURCE_URL=jdbc:postgresql://HOST_DO_POOLER:6543/postgres?prepareThreshold=0
SPRING_DATASOURCE_USERNAME=postgres.PROJECT_REF
SPRING_DATASOURCE_PASSWORD=SENHA_DO_BANCO
APP_AUTH_USERNAME=email-de-login
APP_AUTH_PASSWORD=senha-do-sistema
```

O Render define `PORT` automaticamente. O backend ja usa essa porta por `server.port=${PORT:8081}`.

Depois do deploy, teste:

```txt
https://SEU_BACKEND.onrender.com/health
```

## 3. Vercel Frontend

Importe o mesmo repositorio na Vercel.

Configuracao recomendada:

```txt
Root Directory: frontend
Framework Preset: Next.js
Install Command: npm ci
Build Command: npm run build
```

Variavel de ambiente na Vercel:

```txt
NEXT_PUBLIC_API_URL=https://SEU_BACKEND.onrender.com
```

Importante: em Next.js, variaveis `NEXT_PUBLIC_*` entram no bundle durante o build. Se trocar a URL da API, faca novo deploy na Vercel.

## 4. Login

O login do sistema usa as variaveis do Render:

```txt
APP_AUTH_USERNAME
APP_AUTH_PASSWORD
```

Use esses mesmos valores na tela de login do frontend.

## 5. Checklist rapido

Antes de publicar:

```bash
cd frontend
npm run lint
npm run build
```

No Render, confirme que `/health` responde.

Na Vercel, confirme que `NEXT_PUBLIC_API_URL` aponta para a URL final do Render, sem barra no final.
