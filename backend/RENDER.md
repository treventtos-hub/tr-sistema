# Deploy no Render

## Configuração

O backend está configurado para deploy no Render usando Docker.

## Passos para Deploy

1. **Conectar repositório GitHub**
   - Acesse [dashboard.render.com](https://dashboard.render.com)
   - Clique em "New" -> "Web Service"
   - Conecte o repositório `treventtos-hub/tr-sistema`
   - Selecione o arquivo `render.yaml` no diretório `backend/`

2. **Variáveis de Ambiente**
   O `render.yaml` já configura as variáveis de banco automaticamente.
   Você só precisa configurar manualmente:
   - `APP_AUTH_USERNAME`: E-mail para autenticação do sistema
   - `APP_AUTH_PASSWORD`: Senha para autenticação do sistema

3. **Banco de Dados**
   O Render criará automaticamente um banco PostgreSQL conforme configurado no `render.yaml`.

## URL do Backend
Após o deploy, o backend estará disponível em:
```
https://tr-sistema-backend.onrender.com
```

## Atualizar Frontend
Após obter a URL do backend, atualize a variável `NEXT_PUBLIC_API_URL` na Vercel.
