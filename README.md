# TR Sistema - Sistema de Gestão de Formaturas

Sistema completo para cadastro de alunos, escolas e gestão financeira de formaturas, desenvolvido com Next.js (frontend) e Spring Boot (backend).

## 🚀 Tecnologias

### Frontend
- Next.js 16.2.6 (App Router)
- React 19
- TypeScript
- Tailwind CSS 4
- Autenticação Basic Auth

### Backend
- Spring Boot 4.0.6
- Java 17
- PostgreSQL
- Spring Data JPA
- Basic Auth Filter

## 📋 Funcionalidades

- Cadastro de alunos com formações de pagamento
- Gestão de escolas e turmas
- Controle financeiro e pagamentos
- Sistema de comissões de formatura
- Painel interno de tarefas
- Autenticação de usuários

## 🛠️ Opções de Deploy

### Opção 1: VPS com Docker Compose (Recomendado para produção)

Veja instruções completas em [`DEPLOY.md`](./DEPLOY.md)

- Frontend: `sistema.treventtos.com.br`
- Backend: `api.treventtos.com.br`
- Banco: PostgreSQL em container
- HTTPS automático via Caddy

### Opção 2: Vercel + Render + Supabase (Nuvem)

#### Frontend - Vercel
1. Conecte o repositório no [Vercel](https://vercel.com)
2. Configure a variável `NEXT_PUBLIC_API_URL` com a URL do backend
3. Deploy automático ao fazer push no GitHub

Veja [`frontend/vercel.json`](./frontend/vercel.json) e [`frontend/ENV.md`](./frontend/ENV.md)

#### Backend - Render
1. Conecte o repositório no [Render](https://render.com)
2. Use o arquivo [`backend/render.yaml`](./backend/render.yaml) para configuração automática
3. Configure as variáveis `APP_AUTH_USERNAME` e `APP_AUTH_PASSWORD`

Veja [`backend/RENDER.md`](./backend/RENDER.md)

#### Banco de Dados - Supabase ou Render PostgreSQL
- **Supabase**: Veja [`backend/SUPABASE.md`](./backend/SUPABASE.md)
- **Render PostgreSQL**: Já configurado automaticamente no `render.yaml`

## 🔧 Desenvolvimento Local

### Pré-requisitos
- Node.js 24+
- Java 17
- PostgreSQL 13+

### Backend
```bash
cd backend
./mvnw spring-boot:run
```
O backend estará rodando em `http://localhost:8081`

### Frontend
```bash
cd frontend
npm install
npm run dev
```
O frontend estará rodando em `http://localhost:3000`

### Variáveis de Ambiente (Desenvolvimento)

Crie um arquivo `frontend/.env`:
```
NEXT_PUBLIC_API_URL=http://localhost:8081
```

## 📦 Estrutura do Projeto

```
tr-sistema/
├── frontend/          # Next.js App
│   ├── app/          # Páginas e componentes
│   ├── public/       # Arquivos estáticos
│   └── package.json
├── backend/          # Spring Boot API
│   ├── src/
│   │   └── main/
│   │       ├── java/com/tr/backend/
│   │       │   ├── controller/
│   │       │   ├── model/
│   │       │   ├── repository/
│   │       │   └── config/
│   │       └── resources/
│   │           └── application.properties
│   ├── pom.xml
│   └── supabase-schema.sql
├── docker-compose.prod.yml
└── DEPLOY.md
```

## 🔐 Autenticação

O sistema usa Basic Auth para proteção. Configure as credenciais:

- **Desenvolvimento**: Em `application.properties`
- **Produção (VPS)**: Em `.env` como `APP_AUTH_USERNAME` e `APP_AUTH_PASSWORD`
- **Produção (Render)**: Como variáveis de ambiente no painel do Render

## 📊 Schema do Banco

O schema SQL está disponível em [`backend/supabase-schema.sql`](./backend/supabase-schema.sql)

Tabelas principais:
- `aluno` - Cadastro de alunos
- `escola` - Cadastro de escolas
- `pagamento` - Registro de pagamentos
- `comissao_formatura` - Comissões
- `observacao_aluno` - Observações sobre alunos

## 🚦 Status do Projeto

✅ Frontend funcionando com Next.js 16
✅ Backend com Spring Boot 4
✅ Autenticação implementada
✅ Deploy configurado para VPS/Vercel+Render
✅ Schema do banco completo

## 📝 Licença

Propriedade da TR Eventos
