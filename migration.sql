CREATE TABLE IF NOT EXISTS registros_ponto (
  id SERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  data DATE NOT NULL,
  hora_entrada TEXT NOT NULL,
  hora_almoco_saida TEXT,
  hora_almoco_retorno TEXT,
  hora_saida TEXT NOT NULL,
  minutos_trabalhados INTEGER NOT NULL,
  minutos_saldo INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (nome, data)
);
