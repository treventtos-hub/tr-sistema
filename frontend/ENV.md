# Variáveis de Ambiente - Frontend

## Desenvolvimento
Crie um arquivo `.env` localmente com:
```
NEXT_PUBLIC_API_URL=http://localhost:8081
```

## Produção (Vercel)
Configure a variável de ambiente no painel da Vercel:
- `NEXT_PUBLIC_API_URL`: URL da API backend em produção
  - Exemplo: `https://api.treventtos.com.br`
  - Ou a URL do Render: `https://seu-backend.onrender.com`

## Observação
A variável deve começar com `NEXT_PUBLIC_` para estar disponível no navegador.
