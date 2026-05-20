# Configuração do Supabase

## Opção 1: Usar Supabase como banco de dados (alternativa ao Render PostgreSQL)

### Passos para Configuração

1. **Criar projeto no Supabase**
   - Acesse [supabase.com](https://supabase.com)
   - Crie um novo projeto
   - Anote as credenciais de conexão

2. **Executar o schema SQL**
   - No painel do Supabase, vá em "SQL Editor"
   - Execute o script `backend/supabase-schema.sql`

3. **Configurar variáveis de ambiente no Render**
   Atualize as variáveis de ambiente no backend (Render):
   ```
   SPRING_DATASOURCE_URL=jdbc:postgresql://seu-projeto.supabase.co:5432/postgres
   SPRING_DATASOURCE_USERNAME=postgres
   SPRING_DATASOURCE_PASSWORD=sua-senha-do-supabase
   ```

## Opção 2: Continuar com PostgreSQL do Render

O arquivo `render.yaml` já configura automaticamente um banco PostgreSQL no Render, 
então você não precisa usar o Supabase se preferir a solução integrada.

## Schema do Banco

O arquivo `backend/supabase-schema.sql` contém a estrutura completa do banco com:
- Tabela `aluno` - Cadastro de alunos
- Tabela `escola` - Cadastro de escolas
- Tabela `pagamento` - Registro de pagamentos
- Tabela `comissao_formatura` - Comissões de formatura
- Tabela `observacao_aluno` - Observações sobre alunos
