# Deploy online

Este projeto esta preparado para rodar em uma VPS com Docker Compose, usando:

- `sistema.treventtos.com.br` para o frontend
- `api.treventtos.com.br` para a API
- PostgreSQL em container persistente
- Caddy para HTTPS automatico

## DNS

No painel do dominio, crie registros `A` apontando para o IP publico da VPS:

```txt
sistema.treventtos.com.br -> 54.232.119.62
api.treventtos.com.br     -> 54.232.119.62
www.treventtos.com.br     -> 54.232.119.62
treventtos.com.br         -> 54.232.119.62
```

## Arquivo de ambiente

No servidor, copie `.env.prod.example` para `.env` e troque a senha:

```bash
cp .env.prod.example .env
nano .env
```

No `.env`, configure tambem o login do sistema:

```txt
APP_AUTH_USERNAME=treventtos@gmail.com
APP_AUTH_PASSWORD=sua-senha-do-sistema
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

## Observacao importante

O sistema ainda nao tem login/senha. Antes de colocar dados reais de alunos em um link publico,
o recomendado e adicionar autenticacao.
