/**
 * ============================================================
 * SISTEMA KANBAN SIMPLES - GESTÃO DE TAREFAS COTIDIANAS
 * ============================================================
 * 
 * Tecnologias: HTML5, CSS3 e JavaScript Puro (Vanilla JS).
 * Persistência: LocalStorage do navegador.
 * 
 * REGRAS DE NEGÓCIO:
 * 1. 3 Quadros Fixos (A Fazer, Em Execução e Finalizado) + Quadros Customizáveis.
 * 2. Suporte a categorias para cada tarefa.
 * 3. Tarefas finalizadas não podem sofrer alteração de status nem ser arrastadas.
 * 4. Tarefas com prazo vencido exigem nota/justificativa para serem finalizadas.
 */

// Chaves de armazenamento no LocalStorage
const STORAGE_KEY_TAREFAS = 'kanban_tarefas_v1';
const STORAGE_KEY_COLUNAS = 'kanban_colunas_v1';

// Colunas padrão e fixas do sistema
const COLUNAS_PADRAO = [
  { id: 'a-fazer', titulo: 'A Fazer', fixa: true, cor: '#f59e0b' },
  { id: 'em-execucao', titulo: 'Em Execução', fixa: true, cor: '#3b82f6' },
  { id: 'finalizado', titulo: 'Finalizado', fixa: true, cor: '#10b981' }
];

// Estado global da aplicação em memória
let tarefas = [];
let colunas = [];

// Variável de controle para finalização de tarefa vencida
let tarefaPendenteFinalizacaoId = null;

// ============================================================
// INICIALIZAÇÃO
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  carregarColunas();
  carregarTarefas();
  configurarEventosUI();
  renderizarQuadroCompleto();
});

// ============================================================
// CARREGAMENTO E PERSISTÊNCIA (COLUNAS E TAREFAS)
// ============================================================

/**
 * Carrega a lista de colunas do LocalStorage. Se não houver, usa as 3 fixas.
 */
function carregarColunas() {
  const dados = localStorage.getItem(STORAGE_KEY_COLUNAS);
  if (dados) {
    try {
      colunas = JSON.parse(dados);
    } catch (e) {
      console.error('Erro ao ler colunas:', e);
      colunas = [...COLUNAS_PADRAO];
    }
  } else {
    colunas = [...COLUNAS_PADRAO];
    salvarColunas();
  }
}

function salvarColunas() {
  localStorage.setItem(STORAGE_KEY_COLUNAS, JSON.stringify(colunas));
}

/**
 * Carrega as tarefas salvas no LocalStorage ou inicializa com exemplos didáticos.
 */
function carregarTarefas() {
  const dados = localStorage.getItem(STORAGE_KEY_TAREFAS);
  if (dados) {
    try {
      tarefas = JSON.parse(dados);
    } catch (e) {
      console.error('Erro ao ler tarefas:', e);
      tarefas = [];
    }
  } else {
    // Dados iniciais de demonstração
    const hoje = new Date().toISOString().split('T')[0];
    const ontem = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const amanha = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    tarefas = [
      {
        id: '1',
        titulo: 'Introdução ao Antigravity',
        descricao: 'Apresentar a ferramenta e o fluxo de trabalho aos alunos.',
        categoria: 'Estudo',
        prazo: amanha,
        status: 'a-fazer',
        justificativa: '',
        concluidaForaDoPrazo: false
      },
      {
        id: '2',
        titulo: 'Construir o Dashboard de Métricas',
        descricao: 'Gerar KPIs de tarefas e gráfico de distribuição por categoria.',
        categoria: 'Projetos',
        prazo: hoje,
        status: 'em-execucao',
        justificativa: '',
        concluidaForaDoPrazo: false
      },
      {
        id: '3',
        titulo: 'Configuração dos Navegadores',
        descricao: 'Checar ambiente inicial dos computadores da aula.',
        categoria: 'Trabalho',
        prazo: ontem,
        status: 'finalizado',
        justificativa: 'Atividade concluída com atraso devido à manutenção de rede.',
        concluidaForaDoPrazo: true
      }
    ];
    salvarTarefas();
  }
}

function salvarTarefas() {
  localStorage.setItem(STORAGE_KEY_TAREFAS, JSON.stringify(tarefas));
}

// ============================================================
// VALIDAÇÃO DE DATAS E FORMATOS
// ============================================================

/**
 * Verifica se uma data AAAA-MM-DD é estritamente anterior ao dia de hoje.
 */
function isPrazoVencido(dataPrazoStr) {
  if (!dataPrazoStr) return false;
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const [ano, mes, dia] = dataPrazoStr.split('-').map(Number);
  const dataPrazo = new Date(ano, mes - 1, dia);

  return dataPrazo < hoje;
}

function formatarDataBR(dataPrazoStr) {
  if (!dataPrazoStr) return '';
  const [ano, mes, dia] = dataPrazoStr.split('-');
  return `${dia}/${mes}/${ano}`;
}

// ============================================================
// RENDERIZAÇÃO DO QUADRO (COLUNAS E CARDS)
// ============================================================

/**
 * Renderiza todo o quadro Kanban (colunas dinâmicas e seus cards).
 */
function renderizarQuadroCompleto() {
  const container = document.getElementById('kanban-board');
  container.innerHTML = '';

  // Popula o select de status no modal de tarefas
  atualizarSelectColunasNoModal();

  colunas.forEach(coluna => {
    // Criação da coluna
    const colElemento = document.createElement('section');
    colElemento.className = 'column';
    colElemento.dataset.status = coluna.id;

    // Cabeçalho da coluna com cor personalizada
    const headerElemento = document.createElement('div');
    headerElemento.className = 'column-header';
    headerElemento.style.backgroundColor = coluna.cor || '#475569';

    // Tarefas pertencentes a esta coluna
    const tarefasDestaColuna = tarefas.filter(t => t.status === coluna.id);

    headerElemento.innerHTML = `
      <div class="column-title-box">
        <h2>${escapeHTML(coluna.titulo)}</h2>
      </div>
      <div class="column-actions">
        <span class="task-count" id="count-${coluna.id}">${tarefasDestaColuna.length}</span>
        ${!coluna.fixa ? `
          <button type="button" class="btn-delete-col" title="Excluir Coluna" onclick="excluirColuna('${coluna.id}')">✕</button>
        ` : ''}
      </div>
    `;

    // Lista de cards onde ocorre o drop
    const listaElemento = document.createElement('div');
    listaElemento.className = 'task-list';
    listaElemento.id = `list-${coluna.id}`;

    // Adiciona os cards da coluna
    tarefasDestaColuna.forEach(tarefa => {
      listaElemento.appendChild(criarCardElemento(tarefa));
    });

    colElemento.appendChild(headerElemento);
    colElemento.appendChild(listaElemento);
    container.appendChild(colElemento);

    // Configura os eventos de arrastar e soltar (drop zone)
    configurarZonaDrop(colElemento, listaElemento, coluna.id);
  });
}

/**
 * Cria o elemento visual de um card de tarefa.
 */
function criarCardElemento(tarefa) {
  const card = document.createElement('article');
  card.className = 'task-card';
  card.id = `task-${tarefa.id}`;
  card.dataset.id = tarefa.id;
  card.dataset.status = tarefa.status;

  // REQUISITO: Tarefas no status 'finalizado' são bloqueadas para movimentação
  const isFinalizada = tarefa.status === 'finalizado';
  card.setAttribute('draggable', isFinalizada ? 'false' : 'true');
  if (isFinalizada) card.classList.add('card-bloqueado');

  const vencida = isPrazoVencido(tarefa.prazo);
  const classePrazo = vencida ? 'vencido' : 'em-dia';
  const textoPrazo = vencida ? `Venceu em: ${formatarDataBR(tarefa.prazo)}` : `Prazo: ${formatarDataBR(tarefa.prazo)}`;
  const classeCategoria = `categoria-${(tarefa.categoria || 'geral').toLowerCase()}`;

  card.innerHTML = `
    <div class="task-card-top">
      <span class="badge-categoria ${classeCategoria}">${escapeHTML(tarefa.categoria || 'Geral')}</span>
      ${isFinalizada ? '<span title="Concluída e Bloqueada">🔒</span>' : ''}
    </div>

    <h4 class="task-card-title">${escapeHTML(tarefa.titulo)}</h4>
    ${tarefa.descricao ? `<p class="task-card-desc">${escapeHTML(tarefa.descricao)}</p>` : ''}
    
    <div class="task-card-meta">
      <span class="badge-prazo ${classePrazo}">📅 ${textoPrazo}</span>
    </div>

    ${tarefa.justificativa ? `
      <div class="task-card-nota">
        <strong>Justificativa de atraso:</strong><br>${escapeHTML(tarefa.justificativa)}
      </div>
    ` : ''}

    <div class="task-actions">
      ${!isFinalizada ? `
        <button type="button" class="btn-icon btn-finish" title="Finalizar Tarefa" onclick="tentarFinalizarTarefa('${tarefa.id}')">✓ Finalizar</button>
        <button type="button" class="btn-icon" title="Editar" onclick="abrirModalEdicao('${tarefa.id}')">✏️ Editar</button>
      ` : `
        <span style="font-size:0.75rem; color:#10b981; font-weight:600; align-self:center;">Concluída</span>
      `}
      <button type="button" class="btn-icon btn-delete" title="Excluir" onclick="excluirTarefa('${tarefa.id}')">🗑️ Excluir</button>
    </div>
  `;

  if (!isFinalizada) {
    card.addEventListener('dragstart', handleDragStart);
    card.addEventListener('dragend', handleDragEnd);
  }

  return card;
}

/**
 * Atualiza o dropdown de status no formulário com todas as colunas existentes.
 */
function atualizarSelectColunasNoModal() {
  const select = document.getElementById('tarefa-status');
  if (!select) return;

  select.innerHTML = '';
  colunas.forEach(col => {
    const opt = document.createElement('option');
    opt.value = col.id;
    opt.textContent = col.titulo;
    select.appendChild(opt);
  });
}

function escapeHTML(texto) {
  if (!texto) return '';
  const div = document.createElement('div');
  div.textContent = texto;
  return div.innerHTML;
}

// ============================================================
// DRAG AND DROP (ARRASTAR E SOLTAR)
// ============================================================

let idTarefaArrastada = null;

function handleDragStart(e) {
  idTarefaArrastada = this.dataset.id;
  e.dataTransfer.setData('text/plain', idTarefaArrastada);
  this.classList.add('dragging');
}

function handleDragEnd() {
  this.classList.remove('dragging');
  document.querySelectorAll('.task-list').forEach(list => list.classList.remove('drag-over'));
}

function configurarZonaDrop(colunaElemento, listaElemento, statusDestino) {
  listaElemento.addEventListener('dragover', (e) => {
    e.preventDefault();
    listaElemento.classList.add('drag-over');
  });

  listaElemento.addEventListener('dragleave', () => {
    listaElemento.classList.remove('drag-over');
  });

  listaElemento.addEventListener('drop', (e) => {
    e.preventDefault();
    listaElemento.classList.remove('drag-over');

    const tarefaId = e.dataTransfer.getData('text/plain') || idTarefaArrastada;
    if (!tarefaId) return;

    moverTarefa(tarefaId, statusDestino);
  });
}

// ============================================================
// REGRAS DE TRANSIÇÃO E FINALIZAÇÃO
// ============================================================

/**
 * Altera o status de uma tarefa aplicando as regras de negócio.
 */
function moverTarefa(id, novoStatus) {
  const tarefa = tarefas.find(t => t.id === id);
  if (!tarefa) return;

  // REGRA 1: Tarefa já finalizada nunca pode sair do status 'finalizado'
  if (tarefa.status === 'finalizado') {
    alert('Esta tarefa já foi concluída e não pode ter seu status alterado!');
    return;
  }

  if (tarefa.status === novoStatus) return;

  // REGRA 2: Se for mover para 'finalizado' e estiver vencida, exige justificativa
  if (novoStatus === 'finalizado') {
    if (isPrazoVencido(tarefa.prazo)) {
      solicitarJustificativa(tarefa.id);
      return;
    } else {
      tarefa.concluidaForaDoPrazo = false;
    }
  }

  tarefa.status = novoStatus;
  salvarTarefas();
  renderizarQuadroCompleto();
}

window.tentarFinalizarTarefa = function(id) {
  moverTarefa(id, 'finalizado');
};

function solicitarJustificativa(id) {
  tarefaPendenteFinalizacaoId = id;
  const modal = document.getElementById('modal-justificativa');
  document.getElementById('justificativa-texto').value = '';
  modal.classList.remove('hidden');
}

// ============================================================
// GERENCIAMENTO DE COLUNAS CUSTOMIZADAS
// ============================================================

window.excluirColuna = function(colunaId) {
  const coluna = colunas.find(c => c.id === colunaId);
  if (!coluna || coluna.fixa) {
    alert('As colunas padrão não podem ser removidas.');
    return;
  }

  const tarefasNaColuna = tarefas.filter(t => t.status === colunaId);
  if (tarefasNaColuna.length > 0) {
    const confirma = confirm(`Esta coluna contém ${tarefasNaColuna.length} tarefa(s). Se confirmar a exclusão, essas tarefas serão movidas para "A Fazer". Deseja continuar?`);
    if (!confirma) return;

    // Move as tarefas para 'a-fazer' antes de apagar
    tarefas.forEach(t => {
      if (t.status === colunaId) t.status = 'a-fazer';
    });
    salvarTarefas();
  }

  colunas = colunas.filter(c => c.id !== colunaId);
  salvarColunas();
  renderizarQuadroCompleto();
};

// ============================================================
// CRUD DE TAREFAS
// ============================================================

function abrirModalNovo() {
  document.getElementById('modal-titulo').textContent = 'Criar Nova Tarefa';
  document.getElementById('form-tarefa').reset();
  document.getElementById('tarefa-id').value = '';

  const hoje = new Date().toISOString().split('T')[0];
  document.getElementById('tarefa-prazo').value = hoje;
  document.getElementById('tarefa-categoria').value = 'Trabalho';

  const selectStatus = document.getElementById('tarefa-status');
  selectStatus.value = 'a-fazer';
  selectStatus.disabled = false;

  document.getElementById('modal-tarefa').classList.remove('hidden');
}

window.abrirModalEdicao = function(id) {
  const tarefa = tarefas.find(t => t.id === id);
  if (!tarefa) return;

  if (tarefa.status === 'finalizado') {
    alert('Tarefas concluídas não podem ser alteradas.');
    return;
  }

  document.getElementById('modal-titulo').textContent = 'Editar Tarefa';
  document.getElementById('tarefa-id').value = tarefa.id;
  document.getElementById('tarefa-titulo').value = tarefa.titulo;
  document.getElementById('tarefa-categoria').value = tarefa.categoria || 'Geral';
  document.getElementById('tarefa-descricao').value = tarefa.descricao || '';
  document.getElementById('tarefa-prazo').value = tarefa.prazo;
  
  const selectStatus = document.getElementById('tarefa-status');
  selectStatus.value = tarefa.status;
  selectStatus.disabled = false;

  document.getElementById('modal-tarefa').classList.remove('hidden');
};

window.excluirTarefa = function(id) {
  const confirma = confirm('Deseja realmente excluir esta tarefa?');
  if (!confirma) return;

  tarefas = tarefas.filter(t => t.id !== id);
  salvarTarefas();
  renderizarQuadroCompleto();
};

function fecharModais() {
  document.getElementById('modal-tarefa').classList.add('hidden');
  document.getElementById('modal-coluna').classList.add('hidden');
  document.getElementById('modal-justificativa').classList.add('hidden');
  tarefaPendenteFinalizacaoId = null;
}

// ============================================================
// CONFIGURAÇÃO DOS EVENTOS DA UI
// ============================================================

function configurarEventosUI() {
  // Modal de Nova Tarefa
  document.getElementById('btn-nova-tarefa').addEventListener('click', abrirModalNovo);
  document.getElementById('btn-fechar-modal').addEventListener('click', fecharModais);
  document.getElementById('btn-cancelar-modal').addEventListener('click', fecharModais);

  // Submissão do Formulário de Tarefa
  document.getElementById('form-tarefa').addEventListener('submit', (e) => {
    e.preventDefault();

    const id = document.getElementById('tarefa-id').value;
    const titulo = document.getElementById('tarefa-titulo').value.trim();
    const categoria = document.getElementById('tarefa-categoria').value;
    const descricao = document.getElementById('tarefa-descricao').value.trim();
    const prazo = document.getElementById('tarefa-prazo').value;
    const statusDesejado = document.getElementById('tarefa-status').value;

    if (!titulo || !prazo) {
      alert('Preencha os campos obrigatórios.');
      return;
    }

    if (id) {
      // Edição
      const tarefa = tarefas.find(t => t.id === id);
      if (tarefa) {
        tarefa.titulo = titulo;
        tarefa.categoria = categoria;
        tarefa.descricao = descricao;
        tarefa.prazo = prazo;

        if (tarefa.status !== statusDesejado) {
          fecharModais();
          moverTarefa(tarefa.id, statusDesejado);
          return;
        }
      }
    } else {
      // Cadastro Novo
      const novaTarefa = {
        id: Date.now().toString(),
        titulo: titulo,
        categoria: categoria,
        descricao: descricao,
        prazo: prazo,
        status: statusDesejado,
        justificativa: '',
        concluidaForaDoPrazo: false
      };

      if (novaTarefa.status === 'finalizado' && isPrazoVencido(prazo)) {
        novaTarefa.concluidaForaDoPrazo = true;
        tarefas.push(novaTarefa);
        fecharModais();
        solicitarJustificativa(novaTarefa.id);
        return;
      }

      tarefas.push(novaTarefa);
    }

    salvarTarefas();
    renderizarQuadroCompleto();
    fecharModais();
  });

  // Modal de Nova Coluna
  document.getElementById('btn-nova-coluna').addEventListener('click', () => {
    document.getElementById('form-coluna').reset();
    document.getElementById('modal-coluna').classList.remove('hidden');
  });

  document.getElementById('btn-fechar-modal-coluna').addEventListener('click', fecharModais);
  document.getElementById('btn-cancelar-modal-coluna').addEventListener('click', fecharModais);

  document.getElementById('form-coluna').addEventListener('submit', (e) => {
    e.preventDefault();
    const nome = document.getElementById('coluna-titulo').value.trim();
    const cor = document.getElementById('coluna-cor').value;

    if (!nome) return;

    // Gera um ID simples e legível baseado no nome
    const novoId = 'col-' + Date.now();

    colunas.push({
      id: novoId,
      titulo: nome,
      fixa: false,
      cor: cor
    });

    salvarColunas();
    renderizarQuadroCompleto();
    fecharModais();
  });

  // Modal de Justificativa de Tarefa Vencida
  document.getElementById('btn-cancelar-justificativa').addEventListener('click', fecharModais);
  
  document.getElementById('form-justificativa').addEventListener('submit', (e) => {
    e.preventDefault();

    const justificativa = document.getElementById('justificativa-texto').value.trim();
    if (!justificativa) {
      alert('A justificativa é obrigatória para finalizar tarefas vencidas!');
      return;
    }

    if (tarefaPendenteFinalizacaoId) {
      const tarefa = tarefas.find(t => t.id === tarefaPendenteFinalizacaoId);
      if (tarefa) {
        tarefa.justificativa = justificativa;
        tarefa.status = 'finalizado';
        tarefa.concluidaForaDoPrazo = true; // Marca indicador de atraso
        salvarTarefas();
        renderizarQuadroCompleto();
      }
    }

    fecharModais();
  });
}
