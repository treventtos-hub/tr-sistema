# Backend no Railway

Este repositorio esta preparado para subir o backend no Railway usando o `Dockerfile` da raiz.

## Servicos no Railway

1. Crie um projeto no Railway a partir do GitHub.
2. Adicione um banco PostgreSQL no mesmo projeto.
3. No servico do backend, confirme que o Railway esta usando o `Dockerfile` da raiz.

## Variaveis obrigatorias no backend

No servico do backend, configure:

```txt
APP_AUTH_USERNAME=treventtos@gmail.com
APP_AUTH_PASSWORD=sua-senha-do-sistema
```

O PostgreSQL do Railway fornece `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD` e `PGDATABASE`.
O backend usa essas variaveis automaticamente.

## Healthcheck

O Railway pode verificar:

```txt
/health
```

Essa rota nao exige login e deve retornar:

```json
{"status":"ok"}
```

## Teste da API

Depois do deploy, abra:

```txt
https://SEU-BACKEND.up.railway.app/health
```

Para acessar as demais rotas, use o login e senha configurados.

## Frontend

Depois que o backend estiver online, configure o frontend com:

```txt
NEXT_PUBLIC_API_URL=https://SEU-BACKEND.up.railway.app
```
