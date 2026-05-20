# Deploy online

Este projeto esta preparado para rodar em uma VPS com Docker Compose, usando:

- `sistema.treventtos.com.br` para o frontend
- `api.treventtos.com.br` para a API
- PostgreSQL em container persistente
- Caddy para HTTPS automatico

## DNS

No painel do dominio, crie registros `A` apontando para o IP publico da VPS:

```txt
sistema.treventtos.com.br -> IP_DA_VPS
api.treventtos.com.br     -> IP_DA_VPS
www.treventtos.com.br     -> IP_DA_VPS
treventtos.com.br         -> IP_DA_VPS
```

## Arquivo de ambiente

No servidor, copie `.env.prod.example` para `.env` e configure:

```bash
cp .env.prod.example .env
nano .env
```

Configure as variáveis no `.env`:

```txt
APP_DOMAIN=treventtos.com.br
ACME_EMAIL=seu-email@treventtos.com.br

POSTGRES_DB=trcrm
POSTGRES_USER=trcrm
POSTGRES_PASSWORD=senha-segura-do-banco

APP_AUTH_USERNAME=seu-email@treventtos.com.br
APP_AUTH_PASSWORD=senha-segura-do-sistema
```

## Subir

```bash
docker compose -f docker-compose.prod.yml --env-file .env up -d --build
```

## Ver logs

```bash
docker compose -f docker-compose.prod.yml --env-file .env logs -f
```

## Backup do banco no servidor

```bash
docker compose -f docker-compose.prod.yml --env-file .env exec postgres \
  pg_dump -U trcrm -d trcrm -Fc -f /tmp/trcrm.dump
docker cp $(docker compose -f docker-compose.prod.yml --env-file .env ps -q postgres):/tmp/trcrm.dump ./trcrm.dump
```

## Autenticação

O sistema já possui autenticação implementada usando Basic Auth. Use as credenciais configuradas no `.env` para fazer login no frontend.

## Atualizar o sistema

Para atualizar o sistema após mudanças no código:

```bash
docker compose -f docker-compose.prod.yml --env-file .env pull
docker compose -f docker-compose.prod.yml --env-file .env up -d --build
```
