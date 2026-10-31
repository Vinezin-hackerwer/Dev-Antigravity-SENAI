# Quadro Kanban e Dashboard de Produtividade

Sistema completo de gerenciamento de tarefas desenvolvido com **HTML5, CSS3 e JavaScript Puro (Vanilla JS)**, sem necessidade de banco de dados externo ou bibliotecas pesadas. Os dados são persistidos via `LocalStorage` do navegador.

---

## 🚀 Funcionalidades

### 1. Quadro Kanban Dinâmico
- **3 Quadros Fixos:** `A Fazer`, `Em Execução` e `Finalizado` (não podem ser excluídos).
- **Quadros Customizados:** Possibilidade de criar novas colunas personalizadas (ex: *Em Revisão*, *Aguardando Fornecedor*, etc.) com seleção de cor.
- **Categorias de Tarefas:** Cada tarefa possui uma categoria associada (`Trabalho`, `Estudo`, `Pessoal`, `Projetos`, `Geral`) com identificador visual por cores.
- **Drag and Drop Nativo:** Movimentação fluida de tarefas entre as colunas via HTML5 Drag and Drop API.
- **Regras de Negócio e Segurança:**
  - 🔒 **Tarefas Concluídas:** Uma vez no status *Finalizado*, a tarefa é travada: não pode ser arrastada nem alterada.
  - ⚠️ **Tarefas Vencidas:** Ao finalizar uma tarefa com prazo expirado, o sistema exige uma **justificativa obrigatória** de encerramento em atraso.

### 2. Página de Dashboard e Métricas
Disponível através do link **"📊 Dashboard"** na barra de navegação superior:
- **Tarefas Concluídas:** Total de entregas finalizadas.
- **Tarefas Em Execução:** Atividades em andamento no momento.
- **Tarefas Pendentes:** Atividades a fazer ou em colunas aguardando início.
- **Tarefas Concluídas Fora do Prazo:** Atividades finalizadas após a data de vencimento.
- **Gráfico de Tarefas por Categoria:** Gráfico de barras interativo desenhado diretamente em HTML5 `<canvas>` via JavaScript 2D nativo, sem necessidade de internet ou dependências externas.
- **Detalhamento Percentual:** Barras de progresso com a distribuição relativa de cada categoria.

---

## 📁 Estrutura do Projeto

- [index.html](file:///c:/Users/Aluno/Desktop/Aluno/30.10/index.html): Página principal do Quadro Kanban.
- [dashboard.html](file:///c:/Users/Aluno/Desktop/Aluno/30.10/dashboard.html): Página de métricas e gráficos.
- [style.css](file:///c:/Users/Aluno/Desktop/Aluno/30.10/style.css): Estilos compartilhados (tema moderno, layout responsivo e modais).
- [script.js](file:///c:/Users/Aluno/Desktop/Aluno/30.10/script.js): Lógica do Kanban (CRUD, drag and drop, regras de negócio e colunas).
- [dashboard.js](file:///c:/Users/Aluno/Desktop/Aluno/30.10/dashboard.js): Cálculos dos indicadores e desenho do gráfico no Canvas.

---

## 🖥️ Como Executar

Por ser um projeto web em padrões puros (HTML, CSS e JS), não há compilação ou instalação necessária.

### Opção 1: Abrir diretamente no Navegador
- Dê um duplo clique no arquivo `index.html` ou `dashboard.html` no Explorador de Arquivos para abrir no seu navegador preferido (Google Chrome, Microsoft Edge, etc.).

### Opção 2: Servidor Local (Opcional)
Se preferir rodar com um servidor HTTP simples via terminal, execute no PowerShell dentro da pasta do projeto:

```powershell
# Com Python:
python -m http.server 3000

# Ou com Node.js:
npx serve .
```
E acesse: `http://localhost:3000`
