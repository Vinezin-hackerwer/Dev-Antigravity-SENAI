/**
 * Jokenpô (Pedra, Papel e Tesoura)
 * Implementação limpa em JavaScript puro (Vanilla JS)
 */
"use strict";

(() => {
  /* ==========================================================================
     Constantes e Configurações de Regras
     ========================================================================== */
  const CHOICES = ["pedra", "papel", "tesoura"];

  const LABELS = {
    pedra: "Pedra",
    papel: "Papel",
    tesoura: "Tesoura"
  };

  const ICONS = {
    pedra: "✊",
    papel: "✋",
    tesoura: "✌️"
  };

  // Mapeamento: cada chave vence o valor correspondente
  const WINNING_RULES = {
    pedra: "tesoura",
    papel: "pedra",
    tesoura: "papel"
  };

  // Mapeamento de atalhos de teclado (teclas 1, 2 e 3)
  const KEY_MAPPINGS = {
    "1": "pedra",
    "2": "papel",
    "3": "tesoura"
  };

  const STORAGE_KEY = "jokenpo_game_state_v1";
  const MAX_HISTORY_ITEMS = 5;

  /* ==========================================================================
     Estado Centralizado da Aplicação
     ========================================================================== */
  const gameState = {
    playerScore: 0,
    computerScore: 0,
    draws: 0,
    mode: "free", // "free" | "bestOf3" | "bestOf5"
    history: [],
    isAnimating: false,
    matchOver: false
  };

  /* ==========================================================================
     Elementos do DOM (Cache)
     ========================================================================== */
  const elements = {
    modeSelect: document.getElementById("mode-select"),
    playerScore: document.getElementById("player-score"),
    computerScore: document.getElementById("computer-score"),
    drawScore: document.getElementById("draw-score"),
    playerHand: document.getElementById("player-hand"),
    computerHand: document.getElementById("computer-hand"),
    playerChoiceText: document.getElementById("player-choice-text"),
    computerChoiceText: document.getElementById("computer-choice-text"),
    gameMessage: document.getElementById("game-message"),
    matchBanner: document.getElementById("match-banner"),
    matchWinnerText: document.getElementById("match-winner-text"),
    btnPlayAgain: document.getElementById("btn-play-again"),
    btnResetScore: document.getElementById("btn-reset-score"),
    choicesContainer: document.getElementById("choices-container"),
    choiceButtons: document.querySelectorAll(".btn-choice"),
    historyList: document.getElementById("history-list")
  };

  /* ==========================================================================
     Persistência com LocalStorage (com tratamento de exceção)
     ========================================================================== */
  function saveState() {
    try {
      const dataToSave = {
        playerScore: gameState.playerScore,
        computerScore: gameState.computerScore,
        draws: gameState.draws,
        mode: gameState.mode,
        history: gameState.history
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    } catch (error) {
      console.warn("Não foi possível salvar o estado no localStorage:", error);
    }
  }

  function loadState() {
    try {
      const savedData = localStorage.getItem(STORAGE_KEY);
      if (!savedData) return;

      const parsed = JSON.parse(savedData);
      gameState.playerScore = Number(parsed.playerScore) || 0;
      gameState.computerScore = Number(parsed.computerScore) || 0;
      gameState.draws = Number(parsed.draws) || 0;
      gameState.mode = parsed.mode || "free";
      gameState.history = Array.isArray(parsed.history) ? parsed.history : [];
    } catch (error) {
      console.warn("Não foi possível carregar o estado do localStorage:", error);
    }
  }

  /* ==========================================================================
     Lógica do Jogo
     ========================================================================== */
  // Sorteia aleatoriamente a jogada do computador
  function getComputerChoice() {
    const randomIndex = Math.floor(Math.random() * CHOICES.length);
    return CHOICES[randomIndex];
  }

  // Determina o vencedor da rodada consultando a tabela de regras
  function determineWinner(playerChoice, computerChoice) {
    if (playerChoice === computerChoice) {
      return "draw";
    }
    return WINNING_RULES[playerChoice] === computerChoice ? "win" : "lose";
  }

  // Atualiza a pontuação de acordo com o resultado
  function updateScore(result) {
    if (result === "win") {
      gameState.playerScore += 1;
    } else if (result === "lose") {
      gameState.computerScore += 1;
    } else {
      gameState.draws += 1;
    }
  }

  // Verifica se o modo atual tem uma condição de vitória atingida
  function checkMatchOver() {
    let targetWins = null;

    if (gameState.mode === "bestOf3") {
      targetWins = 2; // Primeiro a 2 vitórias
    } else if (gameState.mode === "bestOf5") {
      targetWins = 3; // Primeiro a 3 vitórias
    }

    if (!targetWins) return null;

    if (gameState.playerScore >= targetWins) {
      return "player";
    }
    if (gameState.computerScore >= targetWins) {
      return "computer";
    }

    return null;
  }

  // Registra a rodada no histórico (mantém até 5 registros)
  function recordHistory(playerChoice, computerChoice, result) {
    const roundItem = {
      id: Date.now(),
      playerChoice,
      computerChoice,
      result,
      timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    };

    gameState.history.unshift(roundItem);

    if (gameState.history.length > MAX_HISTORY_ITEMS) {
      gameState.history.pop();
    }
  }

  /* ==========================================================================
     Renderização e Interface do Usuário (UI)
     ========================================================================== */
  function renderScores() {
    elements.playerScore.textContent = gameState.playerScore;
    elements.computerScore.textContent = gameState.computerScore;
    elements.drawScore.textContent = gameState.draws;
  }

  function renderHistory() {
    if (gameState.history.length === 0) {
      elements.historyList.innerHTML = '<li class="history-empty">Nenhuma rodada disputada ainda.</li>';
      return;
    }

    const labelsResult = {
      win: "Vitória",
      lose: "Derrota",
      draw: "Empate"
    };

    elements.historyList.innerHTML = gameState.history
      .map(item => {
        const pEmoji = ICONS[item.playerChoice];
        const cEmoji = ICONS[item.computerChoice];
        const resultLabel = labelsResult[item.result];

        return `
          <li class="history-item ${item.result}">
            <span>Você ${pEmoji} vs ${cEmoji} Computador</span>
            <span class="history-badge ${item.result}">${resultLabel}</span>
          </li>
        `;
      })
      .join("");
  }

  function setControlsDisabled(disabled) {
    elements.choiceButtons.forEach(btn => {
      btn.disabled = disabled;
    });
    elements.modeSelect.disabled = disabled;
  }

  function renderResult(playerChoice, computerChoice, result) {
    // Atualiza as mãos com as escolhas reais
    elements.playerHand.textContent = ICONS[playerChoice];
    elements.computerHand.textContent = ICONS[computerChoice];
    elements.playerChoiceText.textContent = LABELS[playerChoice];
    elements.computerChoiceText.textContent = LABELS[computerChoice];

    // Remove classes anteriores de status
    elements.gameMessage.classList.remove("status-win", "status-lose", "status-draw");

    // Configura a mensagem da rodada
    if (result === "win") {
      elements.gameMessage.textContent = `Você venceu! ${LABELS[playerChoice]} vence ${LABELS[computerChoice]}.`;
      elements.gameMessage.classList.add("status-win");
    } else if (result === "lose") {
      elements.gameMessage.textContent = `Você perdeu! ${LABELS[computerChoice]} vence ${LABELS[playerChoice]}.`;
      elements.gameMessage.classList.add("status-lose");
    } else {
      elements.gameMessage.textContent = `Empate! Ambos escolheram ${LABELS[playerChoice]}.`;
      elements.gameMessage.classList.add("status-draw");
    }

    // Verifica se a partida terminou pelo modo selecionado
    const matchWinner = checkMatchOver();
    if (matchWinner) {
      gameState.matchOver = true;
      elements.matchBanner.classList.remove("hidden");

      if (matchWinner === "player") {
        elements.matchWinnerText.textContent = `🎉 Parabéns! Você conquistou a vitória da partida (${elements.modeSelect.options[elements.modeSelect.selectedIndex].text})!`;
      } else {
        elements.matchWinnerText.textContent = `😔 O Computador venceu a disputa da partida. Tente novamente!`;
      }

      setControlsDisabled(true);
      elements.btnPlayAgain.focus();
    } else {
      setControlsDisabled(false);
    }
  }

  /* ==========================================================================
     Execução da Rodada com Animação (Jo... Ken... Pô!)
     ========================================================================== */
  function playRound(playerChoice) {
    if (gameState.isAnimating || gameState.matchOver) return;

    gameState.isAnimating = true;
    setControlsDisabled(true);

    // Prepara o palco para a contagem
    elements.playerHand.textContent = "✊";
    elements.computerHand.textContent = "✊";
    elements.playerHand.classList.add("hand-animating-player");
    elements.computerHand.classList.add("hand-animating-computer");
    elements.playerChoiceText.textContent = "Preparando...";
    elements.computerChoiceText.textContent = "Preparando...";
    elements.gameMessage.classList.remove("status-win", "status-lose", "status-draw");

    // Sequência de contagem: ~1.5s no total
    elements.gameMessage.textContent = "Jo...";

    setTimeout(() => {
      elements.gameMessage.textContent = "Ken...";
    }, 500);

    setTimeout(() => {
      elements.gameMessage.textContent = "Pô!";
    }, 1000);

    setTimeout(() => {
      // Remove animação de balanço
      elements.playerHand.classList.remove("hand-animating-player");
      elements.computerHand.classList.remove("hand-animating-computer");

      const computerChoice = getComputerChoice();
      const result = determineWinner(playerChoice, computerChoice);

      updateScore(result);
      recordHistory(playerChoice, computerChoice, result);
      renderScores();
      renderHistory();
      saveState();

      gameState.isAnimating = false;
      renderResult(playerChoice, computerChoice, result);
    }, 1500);
  }

  /* ==========================================================================
     Reinicialização e Reset
     ========================================================================== */
  function resetRoundDisplay() {
    elements.playerHand.textContent = "✊";
    elements.computerHand.textContent = "✊";
    elements.playerChoiceText.textContent = "Aguardando...";
    elements.computerChoiceText.textContent = "Aguardando...";
    elements.gameMessage.classList.remove("status-win", "status-lose", "status-draw");
    elements.gameMessage.textContent = "Escolha uma jogada para iniciar!";
    elements.matchBanner.classList.add("hidden");
  }

  // Reinicia o confronto atual no modo de jogo mantendo o fluxo
  function playAgain() {
    gameState.playerScore = 0;
    gameState.computerScore = 0;
    gameState.draws = 0;
    gameState.matchOver = false;

    renderScores();
    resetRoundDisplay();
    setControlsDisabled(false);
    saveState();
  }

  // Zera totalmente o placar, histórico e armazenamento
  function resetGame() {
    gameState.playerScore = 0;
    gameState.computerScore = 0;
    gameState.draws = 0;
    gameState.history = [];
    gameState.matchOver = false;

    renderScores();
    renderHistory();
    resetRoundDisplay();
    setControlsDisabled(false);
    saveState();
  }

  /* ==========================================================================
     Configuração de Eventos
     ========================================================================== */
  function setupEventListeners() {
    // Delegação de eventos para os botões de escolha
    elements.choicesContainer.addEventListener("click", event => {
      const button = event.target.closest(".btn-choice");
      if (!button || button.disabled) return;

      const choice = button.dataset.choice;
      if (CHOICES.includes(choice)) {
        playRound(choice);
      }
    });

    // Entrada pelo teclado (teclas 1, 2 e 3)
    document.addEventListener("keydown", event => {
      // Não intercepta se o usuário estiver focando no select
      if (event.target.tagName === "SELECT") return;

      const choice = KEY_MAPPINGS[event.key];
      if (choice) {
        event.preventDefault();
        playRound(choice);
      }
    });

    // Mudança de modo de jogo
    elements.modeSelect.addEventListener("change", event => {
      gameState.mode = event.target.value;
      // Ao trocar de modo, reiniciamos a partida para aplicar as novas regras com justiça
      playAgain();
    });

    // Botões de ação
    elements.btnResetScore.addEventListener("click", resetGame);
    elements.btnPlayAgain.addEventListener("click", playAgain);
  }

  /* ==========================================================================
     Inicialização do Jogo
     ========================================================================== */
  function init() {
    loadState();
    elements.modeSelect.value = gameState.mode;
    renderScores();
    renderHistory();
    setupEventListeners();
  }

  // Executa na montagem do script
  init();
})();

