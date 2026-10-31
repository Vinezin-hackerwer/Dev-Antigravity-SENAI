/**
 * ============================================================
 * SCRIPT DO DASHBOARD DE MÉTRICAS E INDICADORES
 * ============================================================
 * 
 * Responsável por:
 * 1. Ler as tarefas do LocalStorage
 * 2. Calcular os KPIs (concluídas, em execução, pendentes e fora do prazo)
 * 3. Gerar o gráfico de tarefas por categoria usando a API Canvas 2D nativa
 * 4. Renderizar o detalhamento em barras de progresso
 */

const STORAGE_KEY_TAREFAS = 'kanban_tarefas_v1';

// Paleta de cores para cada categoria
const CORES_CATEGORIAS = {
  'Trabalho': '#2563eb',
  'Estudo': '#f59e0b',
  'Pessoal': '#ec4899',
  'Projetos': '#6366f1',
  'Geral': '#64748b'
};

document.addEventListener('DOMContentLoaded', () => {
  const tarefas = carregarTarefas();
  calcularEExibirKPIs(tarefas);
  renderizarGraficoCategorias(tarefas);
  renderizarDetalhamentoCategorias(tarefas);
});

/**
 * Lê as tarefas armazenadas no LocalStorage.
 */
function carregarTarefas() {
  const dados = localStorage.getItem(STORAGE_KEY_TAREFAS);
  if (!dados) return [];
  try {
    return JSON.parse(dados);
  } catch (e) {
    console.error('Erro ao ler tarefas para o dashboard:', e);
    return [];
  }
}

/**
 * Calcula os totais e atualiza os cards de indicadores na tela.
 */
function calcularEExibirKPIs(tarefas) {
  // 1. Tarefas Concluídas
  const concluidas = tarefas.filter(t => t.status === 'finalizado');
  
  // 2. Tarefas Em Execução
  const emExecucao = tarefas.filter(t => t.status === 'em-execucao');
  
  // 3. Tarefas Pendentes (tudo que não está em execução nem finalizado)
  const pendentes = tarefas.filter(t => t.status !== 'finalizado' && t.status !== 'em-execucao');

  // 4. Concluídas Fora do Prazo (tarefas finalizadas marcadas como atrasadas ou com justificativa)
  const foraDoPrazo = concluidas.filter(t => t.concluidaForaDoPrazo === true || (t.justificativa && t.justificativa.trim() !== ''));

  // Atualiza os elementos no DOM
  document.getElementById('kpi-concluidas').textContent = concluidas.length;
  document.getElementById('kpi-execucao').textContent = emExecucao.length;
  document.getElementById('kpi-pendentes').textContent = pendentes.length;
  document.getElementById('kpi-fora-prazo').textContent = foraDoPrazo.length;
}

/**
 * Agrupa o número de tarefas por categoria.
 */
function agruparPorCategoria(tarefas) {
  const contagem = {
    'Trabalho': 0,
    'Estudo': 0,
    'Pessoal': 0,
    'Projetos': 0,
    'Geral': 0
  };

  tarefas.forEach(t => {
    const cat = t.categoria || 'Geral';
    if (contagem[cat] !== undefined) {
      contagem[cat]++;
    } else {
      contagem[cat] = (contagem[cat] || 0) + 1;
    }
  });

  return contagem;
}

/**
 * Desenha um gráfico de barras moderno e responsivo usando a API Canvas 2D nativa.
 * Dispensando bibliotecas externas (ideal para ensino didático de Web Standards).
 */
function renderizarGraficoCategorias(tarefas) {
  const canvas = document.getElementById('graficoCategorias');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const dados = agruparPorCategoria(tarefas);

  const categorias = Object.keys(dados);
  const valores = Object.values(dados);
  const maxValor = Math.max(...valores, 1); // Evita divisão por zero

  // Limpa o canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Dimensões do gráfico
  const paddingEsquerda = 60;
  const paddingBaixo = 45;
  const paddingCima = 30;
  const paddingDireita = 30;

  const larguraGrafico = canvas.width - paddingEsquerda - paddingDireita;
  const alturaGrafico = canvas.height - paddingCima - paddingBaixo;

  const numBarras = categorias.length;
  const larguraBarra = Math.min(55, (larguraGrafico / numBarras) * 0.6);
  const espacamento = larguraGrafico / numBarras;

  // Linha de base horizontal (Eixo X)
  ctx.beginPath();
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1;
  ctx.moveTo(paddingEsquerda, canvas.height - paddingBaixo);
  ctx.lineTo(canvas.width - paddingDireita, canvas.height - paddingBaixo);
  ctx.stroke();

  // Linhas guia de grade suaves
  const linhasGuia = 4;
  ctx.fillStyle = '#94a3b8';
  ctx.font = '12px Segoe UI, sans-serif';
  ctx.textAlign = 'right';

  for (let i = 0; i <= linhasGuia; i++) {
    const yVal = Math.round((maxValor / linhasGuia) * i);
    const yPos = (canvas.height - paddingBaixo) - (alturaGrafico / linhasGuia) * i;

    // Linha pontilhada
    ctx.beginPath();
    ctx.strokeStyle = '#f1f5f9';
    ctx.moveTo(paddingEsquerda, yPos);
    ctx.lineTo(canvas.width - paddingDireita, yPos);
    ctx.stroke();

    // Rótulo numérico no eixo Y
    ctx.fillText(yVal.toString(), paddingEsquerda - 10, yPos + 4);
  }

  // Desenho das barras
  categorias.forEach((cat, index) => {
    const valor = dados[cat];
    const alturaBarra = (valor / maxValor) * (alturaGrafico - 10);
    const x = paddingEsquerda + (index * espacamento) + (espacamento - larguraBarra) / 2;
    const y = (canvas.height - paddingBaixo) - alturaBarra;

    const cor = CORES_CATEGORIAS[cat] || '#64748b';

    // Barra com cantos arredondados no topo
    ctx.fillStyle = cor;
    desenharBarraArredondada(ctx, x, y, larguraBarra, alturaBarra, 5);

    // Texto com a quantidade no topo da barra
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 13px Segoe UI, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(valor.toString(), x + larguraBarra / 2, y - 8);

    // Nome da categoria abaixo do eixo X
    ctx.fillStyle = '#475569';
    ctx.font = '12px Segoe UI, sans-serif';
    ctx.fillText(cat, x + larguraBarra / 2, canvas.height - paddingBaixo + 20);
  });
}

/**
 * Função auxiliar para desenhar retângulo com cantos superiores arredondados no Canvas.
 */
function desenharBarraArredondada(ctx, x, y, width, height, radius) {
  if (height <= 0) return;
  ctx.beginPath();
  ctx.moveTo(x, y + height);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height);
  ctx.closePath();
  ctx.fill();
}

/**
 * Renderiza uma lista explicativa com barras de progresso percentuais das categorias.
 */
function renderizarDetalhamentoCategorias(tarefas) {
  const container = document.getElementById('category-breakdown');
  if (!container) return;

  container.innerHTML = '';
  const dados = agruparPorCategoria(tarefas);
  const totalTarefas = tarefas.length;

  Object.entries(dados).forEach(([cat, qtd]) => {
    const porcentagem = totalTarefas > 0 ? Math.round((qtd / totalTarefas) * 100) : 0;
    const cor = CORES_CATEGORIAS[cat] || '#64748b';

    const item = document.createElement('div');
    item.className = 'breakdown-item';
    item.innerHTML = `
      <div class="breakdown-header">
        <span>${cat}</span>
        <span>${qtd} tarefa(s) (${porcentagem}%)</span>
      </div>
      <div class="progress-bar-bg">
        <div class="progress-bar-fill" style="width: ${porcentagem}%; background-color: ${cor};"></div>
      </div>
    `;
    container.appendChild(item);
  });
}

