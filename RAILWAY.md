# Backend no Railway

Este repositorio esta preparado para subir o backend no Railway usando a pasta `backend`.

## Servicos no Railway

1. Crie um projeto no Railway a partir do GitHub.
2. Adicione um banco PostgreSQL no mesmo projeto.
3. No servico do backend, configure o `Root Directory` como `backend`.
4. O Railway deve usar `backend/Dockerfile` e `backend/railway.json`.

## Variaveis obrigatorias no backend

No servico do backend, configure:

```txt
APP_AUTH_USERNAME=treventtos@gmail.com
APP_AUTH_PASSWORD=sua-senha-do-sistema
```

O PostgreSQL do Railway fornece `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD` e `PGDATABASE`.
O backend usa essas variaveis automaticamente.

Se essas variaveis nao aparecerem no servico do backend, conecte o PostgreSQL ao backend pelo painel do Railway ou copie as variaveis do servico PostgreSQL para o backend.

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

Se `/health` nao abrir, veja os logs do servico no Railway. Os erros mais comuns sao:

- faltou adicionar PostgreSQL no projeto;
- faltou `APP_AUTH_USERNAME` ou `APP_AUTH_PASSWORD`;
- o backend foi criado com `Root Directory` errado;
- o servico nao esta usando o `Dockerfile`.

## Frontend

Depois que o backend estiver online, configure o frontend com:

```txt
NEXT_PUBLIC_API_URL=https://SEU-BACKEND.up.railway.app
```
