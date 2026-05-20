# Variaveis de ambiente - Frontend

## Desenvolvimento local

Crie `frontend/.env.local` com:

```txt
NEXT_PUBLIC_API_URL=http://localhost:8081
```

## Producao na Vercel

Configure no painel da Vercel:

```txt
NEXT_PUBLIC_API_URL=https://SEU_BACKEND.onrender.com
```

Passos:

1. Abra o projeto na Vercel.
2. Va em Settings > Environment Variables.
3. Adicione `NEXT_PUBLIC_API_URL`.
4. Marque Production, Preview e Development se quiser usar a mesma API nos tres ambientes.
5. Faca um novo deploy depois de alterar a variavel.

Variaveis `NEXT_PUBLIC_*` sao embutidas no build do Next.js. Por isso, trocar a URL da API exige novo deploy do frontend.
