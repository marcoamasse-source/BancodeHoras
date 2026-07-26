-- Rode este script uma vez no seu banco Neon (SQL editor do Neon ou via psql)

CREATE TABLE IF NOT EXISTS registros_ponto (
  id SERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  data DATE NOT NULL,
  hora_entrada TIME NOT NULL,
  hora_almoco_saida TIME,
  hora_almoco_retorno TIME,
  hora_saida TIME NOT NULL,
  minutos_trabalhados INTEGER NOT NULL,
  minutos_saldo INTEGER NOT NULL,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Evita lançar duas vezes o mesmo dia para a mesma pessoa
CREATE UNIQUE INDEX IF NOT EXISTS idx_registro_unico
  ON registros_ponto (nome, data);

CREATE INDEX IF NOT EXISTS idx_registros_nome ON registros_ponto (nome);
