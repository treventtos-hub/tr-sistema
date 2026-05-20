create table if not exists aluno (
  id bigserial primary key,
  nome text,
  nome_responsavel text,
  telefone_responsavel text,
  telefone text,
  escola text,
  turma text,
  categoria text,
  forma_pagamento text,
  baile boolean,
  kit_formatura boolean,
  placa_homenagem boolean,
  quantidade_placa_homenagem integer,
  placa_replica boolean,
  quantidade_placa_replica integer,
  valor_contrato double precision,
  valor_restante_contrato double precision,
  valor_mensal double precision,
  parcelas integer
);

create table if not exists escola (
  id bigserial primary key,
  nome_escola text,
  responsavel text,
  telefone_responsavel text,
  data_baile_formatura text,
  mes_inicio_pagamento text,
  data_limite_contrato text,
  quantidade_convites_contrato integer,
  quantidade_senhas_extras integer,
  valor_senha_extra double precision,
  valor_baile double precision,
  valor_kit_formatura double precision,
  valor_placa_replica double precision,
  valor_placa_homenagem double precision
);

create table if not exists pagamento (
  id bigserial primary key,
  aluno_id bigint references aluno(id) on delete cascade,
  nome_aluno text,
  valor double precision,
  numero_parcela integer,
  data_pagamento timestamp,
  descricao text
);

create table if not exists comissao_formatura (
  id bigserial primary key,
  escola_id bigint,
  nome_escola text,
  aluno_id bigint,
  nome_aluno text,
  nome_responsavel text,
  turma text,
  valor_contrato_original double precision,
  desconto double precision,
  valor_contrato_com_desconto double precision
);
