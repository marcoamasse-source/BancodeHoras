const API = '/api';

const telaNome = document.getElementById('telaNome');
const conteudo = document.getElementById('conteudo');
const usuarioAtualEl = document.getElementById('usuarioAtual');
const inputNome = document.getElementById('inputNome');
const btnSalvarNome = document.getElementById('btnSalvarNome');
const btnTrocarUsuario = document.getElementById('btnTrocarUsuario');

const formRegistro = document.getElementById('formRegistro');
const mensagemErro = document.getElementById('mensagemErro');
const saldoTotalEl = document.getElementById('saldoTotal');
const filtroMes = document.getElementById('filtroMes');
const listaRegistrosEl = document.getElementById('listaRegistros');

function nomeAtual() {
  return localStorage.getItem('banco_horas_nome');
}

function iniciar() {
  const nome = nomeAtual();
  const hoje = new Date().toISOString().slice(0, 10);
  document.getElementById('data').value = hoje;
  filtroMes.value = hoje.slice(0, 7);

  if (nome) {
    mostrarConteudo(nome);
  } else {
    telaNome.classList.remove('oculto');
    conteudo.classList.add('oculto');
  }
}

function mostrarConteudo(nome) {
  usuarioAtualEl.textContent = nome;
  telaNome.classList.add('oculto');
  conteudo.classList.remove('oculto');
  carregarSaldo();
  carregarRegistros();
}

btnSalvarNome.addEventListener('click', () => {
  const nome = inputNome.value.trim();
  if (!nome) return;
  localStorage.setItem('banco_horas_nome', nome);
  mostrarConteudo(nome);
});

btnTrocarUsuario.addEventListener('click', () => {
  localStorage.removeItem('banco_horas_nome');
  iniciar();
});

formRegistro.addEventListener('submit', async (e) => {
  e.preventDefault();
  mensagemErro.textContent = '';

  const payload = {
    nome: nomeAtual(),
    data: document.getElementById('data').value,
    hora_entrada: document.getElementById('entrada').value,
    hora_almoco_saida: document.getElementById('almocoSaida').value || null,
    hora_almoco_retorno: document.getElementById('almocoRetorno').value || null,
    hora_saida: document.getElementById('saida').value,
  };

  try {
    const resp = await fetch(`${API}/registros`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await resp.json();
    if (!resp.ok) throw new Error(data.erro || 'Erro ao salvar.');

    carregarSaldo();
    carregarRegistros();
  } catch (err) {
    mensagemErro.textContent = err.message;
  }
});

filtroMes.addEventListener('change', carregarRegistros);

async function carregarSaldo() {
  const resp = await fetch(`${API}/saldo?nome=${encodeURIComponent(nomeAtual())}`);
  const data = await resp.json();
  saldoTotalEl.textContent = data.formatado;
  saldoTotalEl.classList.toggle('negativo', data.minutos < 0);
}

async function carregarRegistros() {
  const mes = filtroMes.value;
  const resp = await fetch(`${API}/registros?nome=${encodeURIComponent(nomeAtual())}&mes=${mes}`);
  const registros = await resp.json();
  renderizarRegistros(registros);
}

function formatarMinutos(min) {
  const sinal = min < 0 ? '-' : '+';
  const abs = Math.abs(min);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  return `${sinal}${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function renderizarRegistros(registros) {
  listaRegistrosEl.innerHTML = '';

  if (registros.length === 0) {
    listaRegistrosEl.innerHTML = '<p class="legenda">Nenhum registro neste mês.</p>';
    return;
  }

  registros.forEach((r) => {
    const div = document.createElement('div');
    div.className = 'registro';

    const dataFormatada = new Date(r.data + 'T00:00:00').toLocaleDateString('pt-BR');
    const saldoClasse = r.minutos_saldo < 0 ? 'negativo' : 'positivo';

    div.innerHTML = `
      <div class="registro-info">
        <div class="registro-data">${dataFormatada}</div>
        <div class="registro-horas">${r.hora_entrada.slice(0,5)} - ${r.hora_saida.slice(0,5)}</div>
      </div>
      <div class="registro-saldo ${saldoClasse}">${formatarMinutos(r.minutos_saldo)}</div>
      <button class="registro-excluir" data-id="${r.id}">excluir</button>
    `;

    div.querySelector('.registro-excluir').addEventListener('click', async () => {
      await fetch(`${API}/registros/${r.id}`, { method: 'DELETE' });
      carregarSaldo();
      carregarRegistros();
    });

    listaRegistrosEl.appendChild(div);
  });
}

iniciar();
