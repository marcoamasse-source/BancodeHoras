require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Jornada padrão em minutos (8 horas). Pode ajustar via .env se quiser.
const JORNADA_PADRAO_MIN = Number(process.env.JORNADA_PADRAO_MIN || 8 * 60);

if (!process.env.DATABASE_URL) {
  console.warn('[aviso] DATABASE_URL não definida. Configure o .env antes de usar em produção.');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // necessário para o Neon
});

// ---- helpers ----

// Converte "HH:MM" (ou "HH:MM:SS") em minutos desde 00:00
function horaParaMinutos(hora) {
  if (!hora) return null;
  const [h, m] = hora.split(':').map(Number);
  return h * 60 + m;
}

function calcularMinutos({ hora_entrada, hora_almoco_saida, hora_almoco_retorno, hora_saida }) {
  const entrada = horaParaMinutos(hora_entrada);
  const saida = horaParaMinutos(hora_saida);
  if (entrada == null || saida == null) {
    throw new Error('Hora de entrada e hora de saída são obrigatórias.');
  }
  if (saida <= entrada) {
    throw new Error('Hora de saída deve ser depois da hora de entrada.');
  }

  let minutosAlmoco = 0;
  const almocoSaida = horaParaMinutos(hora_almoco_saida);
  const almocoRetorno = horaParaMinutos(hora_almoco_retorno);
  if (almocoSaida != null && almocoRetorno != null) {
    if (almocoRetorno <= almocoSaida) {
      throw new Error('Volta do almoço deve ser depois da saída para o almoço.');
    }
    minutosAlmoco = almocoRetorno - almocoSaida;
  }

  const minutosTrabalhados = (saida - entrada) - minutosAlmoco;
  const minutosSaldo = minutosTrabalhados - JORNADA_PADRAO_MIN;
  return { minutosTrabalhados, minutosSaldo };
}

function formatarMinutos(min) {
  const sinal = min < 0 ? '-' : '';
  const abs = Math.abs(min);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  return `${sinal}${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

// ---- rotas ----

// Cria ou atualiza (upsert) o registro do dia para uma pessoa
app.post('/api/registros', async (req, res) => {
  const { nome, data, hora_entrada, hora_almoco_saida, hora_almoco_retorno, hora_saida } = req.body;

  if (!nome || !data || !hora_entrada || !hora_saida) {
    return res.status(400).json({ erro: 'nome, data, hora_entrada e hora_saida são obrigatórios.' });
  }

  try {
    const { minutosTrabalhados, minutosSaldo } = calcularMinutos({
      hora_entrada, hora_almoco_saida, hora_almoco_retorno, hora_saida
    });

    const result = await pool.query(
      `INSERT INTO registros_ponto
        (nome, data, hora_entrada, hora_almoco_saida, hora_almoco_retorno, hora_saida, minutos_trabalhados, minutos_saldo)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       ON CONFLICT (nome, data) DO UPDATE SET
        hora_entrada = EXCLUDED.hora_entrada,
        hora_almoco_saida = EXCLUDED.hora_almoco_saida,
        hora_almoco_retorno = EXCLUDED.hora_almoco_retorno,
        hora_saida = EXCLUDED.hora_saida,
        minutos_trabalhados = EXCLUDED.minutos_trabalhados,
        minutos_saldo = EXCLUDED.minutos_saldo
       RETURNING *`,
      [nome, data, hora_entrada, hora_almoco_saida || null, hora_almoco_retorno || null, hora_saida, minutosTrabalhados, minutosSaldo]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.message && !err.code) {
      // erro de validação (calcularMinutos)
      return res.status(400).json({ erro: err.message });
    }
    console.error(err);
    res.status(500).json({ erro: 'Erro ao salvar registro.' });
  }
});

// Lista registros de uma pessoa (opcionalmente filtrando por mês: ?mes=2026-07)
app.get('/api/registros', async (req, res) => {
  const { nome, mes } = req.query;
  if (!nome) return res.status(400).json({ erro: 'Informe o parâmetro nome.' });

  try {
    let query = 'SELECT * FROM registros_ponto WHERE nome = $1';
    const params = [nome];

    if (mes) {
      query += ` AND to_char(data, 'YYYY-MM') = $2`;
      params.push(mes);
    }
    query += ' ORDER BY data DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao buscar registros.' });
  }
});

// Saldo total do banco de horas de uma pessoa
app.get('/api/saldo', async (req, res) => {
  const { nome } = req.query;
  if (!nome) return res.status(400).json({ erro: 'Informe o parâmetro nome.' });

  try {
    const result = await pool.query(
      'SELECT COALESCE(SUM(minutos_saldo),0) AS total_min FROM registros_ponto WHERE nome = $1',
      [nome]
    );
    const totalMin = Number(result.rows[0].total_min);
    res.json({ minutos: totalMin, formatado: formatarMinutos(totalMin) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao calcular saldo.' });
  }
});

// Remove um registro
app.delete('/api/registros/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM registros_ponto WHERE id = $1', [req.params.id]);
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao excluir registro.' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
