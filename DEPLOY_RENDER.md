# Deploy no Render com Supabase

## Servicos

O arquivo `render.yaml` cria dois servicos:

- `tr-sistema-backend`: Spring Boot via Docker.
- `tr-sistema-frontend`: Next.js via Node.

## Variaveis do backend

Configure no Render:

```env
DB_URL=jdbc:postgresql://HOST_SUPABASE:5432/postgres?sslmode=require
DB_USERNAME=postgres
DB_PASSWORD=SENHA_DO_SUPABASE
APP_CORS_ALLOWED_ORIGINS=https://URL_DO_FRONTEND_ONRENDER
JPA_DDL_AUTO=update
```

## Variaveis do frontend

Configure no Render:

```env
NEXT_PUBLIC_API_URL=https://URL_DO_BACKEND_ONRENDER
```

## Primeiro acesso

Ao abrir o frontend publicado, crie o primeiro usuario na tela de login.
Depois que existir um usuario, novos usuarios so podem ser criados por alguem logado.
