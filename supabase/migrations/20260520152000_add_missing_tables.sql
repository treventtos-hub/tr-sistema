create table if not exists demanda (
  id bigserial primary key,
  titulo text,
  aluno text,
  departamento text,
  responsavel text,
  prazo text,
  prioridade text,
  status text
);

create table if not exists demanda_comentarios (
  demanda_id bigint references demanda(id) on delete cascade,
  comentario text
);

create table if not exists demanda_anexos (
  demanda_id bigint references demanda(id) on delete cascade,
  anexo text
);

create table if not exists observacao_aluno (
  id bigserial primary key,
  aluno_id bigint references aluno(id) on delete cascade,
  texto varchar(2000),
  data_criacao timestamp
);
