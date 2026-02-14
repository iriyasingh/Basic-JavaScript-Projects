let board = ["", "", "", "", "", "", "", "", ""];
let gameOver = false;
let playerName = "Player";
let difficulty = "medium";

let playerScore = 0,
    computerScore = 0,
    drawScore = 0;

// Tournament state
const ROUNDS_LIMIT = 5;
let roundsPlayed = 0;

// Hint state: user requested initial label as "💡 Hint (1)"
let hintsUsed = 0;          // how many hints actually used
const MAX_HINTS = 3;
let nextHintNumber = 1;     // number shown on the button initially

// Turn & timer state
let currentTurn = "X"; // "X" (player) or "O" (computer)
const TURN_TIME = 15; // seconds per turn
let timeLeft = TURN_TIME;
let timerInterval = null;

// ---------- DOMContentLoaded ----------
document.addEventListener("DOMContentLoaded", () => {
    // DOM refs
    const cells = document.querySelectorAll(".cell");
    const message = document.getElementById("message");
    const playerScoreEl = document.getElementById("playerScore");
    const computerScoreEl = document.getElementById("computerScore");
    const drawScoreEl = document.getElementById("drawScore");

    const namePage = document.getElementById("name-page");
    const levelsPage = document.getElementById("levels-page");
    const gamePage = document.getElementById("game-page");
    const homePage = document.getElementById("home-page");
    const playerNameInput = document.getElementById("playerNameInput");
    const floatingBg = document.getElementById("floating-bg");

    const restartBtn = document.getElementById("restartBtn");
    const gameBackBtn = document.getElementById("gameBack");

    // add celebration container
    const confettiContainer = document.createElement("div");
    confettiContainer.id = "celebration-container";
    gamePage.appendChild(confettiContainer);

    // ---------- WebAudio (in-page, no external files) ----------
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    const audioCtx = new AudioCtx();

    function playClick() {
        const now = audioCtx.currentTime;
        const g = audioCtx.createGain();
        const o = audioCtx.createOscillator();
        o.type = "square";
        o.frequency.setValueAtTime(1000, now);
        g.gain.setValueAtTime(0.0001, now);
        g.gain.exponentialRampToValueAtTime(0.12, now + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
        o.connect(g).connect(audioCtx.destination);
        o.start(now);
        o.stop(now + 0.14);
    }

    function playWin() {
        const now = audioCtx.currentTime;
        const g = audioCtx.createGain();
        g.gain.setValueAtTime(0.0001, now);
        g.gain.linearRampToValueAtTime(0.6, now + 0.06);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 2.2);
        g.connect(audioCtx.destination);
        [440, 660, 880].forEach((f, i) => {
            const o = audioCtx.createOscillator();
            o.type = "sine";
            o.frequency.setValueAtTime(f * (1 + i * 0.02), now);
            o.connect(g);
            o.start(now + i * 0.05);
            o.stop(now + 2.1);
        });
    }

    function playLose() {
        const now = audioCtx.currentTime;
        const g = audioCtx.createGain();
        g.gain.setValueAtTime(0.0001, now);
        g.gain.linearRampToValueAtTime(0.5, now + 0.05);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 2.0);
        g.connect(audioCtx.destination);
        const o = audioCtx.createOscillator();
        o.type = "sawtooth";
        o.frequency.setValueAtTime(600, now);
        o.frequency.exponentialRampToValueAtTime(120, now + 1.6);
        o.connect(g);
        o.start(now);
        o.stop(now + 2.0);
    }

    function playDraw() {
        const now = audioCtx.currentTime;
        const g = audioCtx.createGain();
        const o = audioCtx.createOscillator();
        o.type = "sine";
        o.frequency.setValueAtTime(520, now);
        g.gain.setValueAtTime(0.0001, now);
        g.gain.linearRampToValueAtTime(0.18, now + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);
        o.connect(g).connect(audioCtx.destination);
        o.start(now);
        o.stop(now + 0.65);
    }

    // ---------- Timer display (insert below scoreboard) ----------
    const scoreTable = document.getElementById("scoreTable");
    if (scoreTable) {
        const timerContainer = document.createElement("div");
        timerContainer.id = "timerContainer";
        timerContainer.style.marginTop = "12px";
        timerContainer.style.textAlign = "center";
        timerContainer.innerHTML = `<strong>Time Remaining:</strong> <span id="timerDisplay">${TURN_TIME}s</span>`;
        scoreTable.parentNode.insertBefore(timerContainer, scoreTable.nextSibling);
    }

    // ---------- Inject Hint button next to Restart ----------
    // (some HTML versions had a hint button already; we ensure one exists)
    let hintBtn = document.getElementById("hintBtn");
    if (!hintBtn) {
        hintBtn = document.createElement("button");
        hintBtn.id = "hintBtn";
        hintBtn.textContent = `💡 Hint (${nextHintNumber})`; // initial as requested
        hintBtn.style.marginLeft = "8px";
        hintBtn.style.padding = "10px 18px";
        hintBtn.style.borderRadius = "8px";
        hintBtn.style.cursor = "pointer";
        hintBtn.style.background = "dodgerblue";
        hintBtn.style.color = "white";
        hintBtn.addEventListener("mouseenter", () => (hintBtn.style.background = "deepskyblue"));
        hintBtn.addEventListener("mouseleave", () => (hintBtn.style.background = "dodgerblue"));
        // insert after restart button (if exists) else append to container
        if (restartBtn && restartBtn.parentNode) restartBtn.parentNode.insertBefore(hintBtn, restartBtn.nextSibling);
        else document.body.appendChild(hintBtn);
    }

    // ---------- Floating X/O creation (keeps original design) ----------
    function createFloatingXO(count = 36) {
        if (!floatingBg) return;
        floatingBg.innerHTML = "";
        for (let i = 0; i < count; i++) {
            const s = document.createElement("span");
            s.className = "xo-float";
            s.textContent = Math.random() > 0.5 ? "X" : "O";
            s.style.left = Math.random() * 100 + "vw";
            s.style.top = Math.random() * 100 + "vh";
            s.style.fontSize = 16 + Math.random() * 84 + "px";
            s.style.animationDuration = 8 + Math.random() * 12 + "s";
            s.style.animationDelay = Math.random() * -10 + "s";
            s.style.opacity = (0.25 + Math.random() * 0.6).toString();
            floatingBg.appendChild(s);
        }
    }
    createFloatingXO();

    // ---------- Navigation helpers ----------
    function showOnly(pageEl) {
        [homePage, namePage, levelsPage, gamePage].forEach(p => {
            if (!p) return;
            p.classList.toggle("hidden", p !== pageEl);
        });
    }
    showOnly(homePage);

    // Home start
    const homeStartBtn = document.getElementById("homeStart");
    if (homeStartBtn) {
        homeStartBtn.addEventListener("click", () => {
            // unlock audio (some browsers require user interaction)
            if (audioCtx.state === "suspended") audioCtx.resume();
            playClick();
            showOnly(namePage);
            setTimeout(() => playerNameInput && playerNameInput.focus(), 100);
        });
    }

    // Name page navigation
    const nameNext = document.getElementById("nameNext");
    if (nameNext) {
        nameNext.addEventListener("click", () => {
            playClick();
            if (playerNameInput && playerNameInput.value.trim() !== "") {
                playerName = playerNameInput.value.trim();
            }
            showOnly(levelsPage);
        });
    }

    const nameBack = document.getElementById("nameBack");
    if (nameBack) nameBack.addEventListener("click", () => { playClick(); showOnly(homePage); });

    const levelsBack = document.getElementById("levelsBack");
    if (levelsBack) levelsBack.addEventListener("click", () => { playClick(); showOnly(namePage); });

    if (gameBackBtn) {
        gameBackBtn.addEventListener("click", () => {
            playClick();
            restart(true);
            showOnly(levelsPage);
        });
    }

    if (restartBtn) {
        restartBtn.addEventListener("click", () => {
            playClick();
            restart(true); // restart round immediately
        });
    }

    // Difficulty selection
    document.querySelectorAll(".level-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            playClick();
            difficulty = btn.dataset.level || "medium";
            const header = document.getElementById("playerNameHeader");
            if (header) header.textContent = playerName;
            document.querySelectorAll(".level-btn").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            showOnly(gamePage);
            startTournament();
        });
    });

    // ---------- Hint button handling ----------
    hintBtn.addEventListener("click", () => {
        // unlock audio if needed
        if (audioCtx.state === "suspended") audioCtx.resume();
        playClick();

        // if used all hints
        if (hintsUsed >= MAX_HINTS) {
            message.textContent = "NO MORE HINTS LEFT BUDDY!! 🙂";
            return;
        }

        // use a hint
        hintsUsed++;
        // show the hint visually
        showHintForCurrentPlayer();

        // update button label: user wanted "Hint (1)" style initially
        // nextHintNumber increments on each usage up to MAX_HINTS
        nextHintNumber = Math.min(nextHintNumber + 1, MAX_HINTS);
        hintBtn.textContent = `💡 Hint (${Math.min(nextHintNumber, MAX_HINTS)})`;

        // keep label at (MAX_HINTS) when last used
        if (hintsUsed >= MAX_HINTS) {
            hintBtn.textContent = `💡 Hint (${MAX_HINTS})`;
        }
    });

    // ---------- Game core ----------
    function startGame() {
        updateScoreboard();
        resetBoardUI();
        currentTurn = "X";
        message.textContent = `${playerName}'s turn`;
        startTurn(currentTurn);
    }

    function startTournament() {
        roundsPlayed = 0;
        playerScore = 0;
        computerScore = 0;
        drawScore = 0;
        hintsUsed = 0;
        nextHintNumber = 1;
        hintBtn.textContent = `💡 Hint (${nextHintNumber})`;
        updateScoreboard();
        restart(true);
        startGame();
    }

    function startTurn(player) {
        clearTimer();
        currentTurn = player;
        timeLeft = TURN_TIME;
        updateTimerDisplay();
        timerInterval = setInterval(() => {
            timeLeft--;
            updateTimerDisplay();
            if (timeLeft <= 0) {
                clearTimer();
                handleTimeExpired();
            }
        }, 1000);

        if (!gameOver) {
            message.textContent = player === "X" ? `${playerName}'s turn` : `Luna's turn`;
        }
    }

    function clearTimer() {
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
    }

    function updateTimerDisplay() {
        const timerDisplay = document.getElementById("timerDisplay");
        if (timerDisplay) timerDisplay.textContent = `${timeLeft}s`;
    }

    function handleTimeExpired() {
        if (gameOver) return;
        if (currentTurn === "X") {
            message.textContent = "⏰ Time's up — Luna's turn!";
            setTimeout(() => {
                if (!gameOver) computerMove();
            }, 300);
        } else {
            message.textContent = "⏰ Luna took too long — your turn!";
            startTurn("X");
        }
    }

    // cell click behaviour
    cells.forEach(cell => {
        cell.addEventListener("click", async () => {
            if (gameOver) return;
            const idx = parseInt(cell.getAttribute("data-index"), 10);
            if (isNaN(idx)) return;
            if (board[idx] === "") {
                if (currentTurn !== "X") return;
                if (audioCtx.state === "suspended") audioCtx.resume();
                playClick();
                board[idx] = "X";
                cell.textContent = "X";
                cell.classList.add("taken", "x");

                clearTimer();

                if (checkWinner("X")) {
                    handleRoundEnd("X");
                    return;
                }
                if (isDraw()) {
                    handleRoundEnd("draw");
                    return;
                }

                // short pause then AI move
                await new Promise(r => setTimeout(r, 450));
                computerMove();
            }
        });
    });

    function computerMove() {
        if (gameOver) return;
        startTurn("O");

        setTimeout(() => {
            if (gameOver) return;
            const empty = board.map((v, i) => (v === "" ? i : null)).filter(v => v !== null);
            if (empty.length === 0) return;

            let move = null;
            if (difficulty === "easy") {
                move = empty[Math.floor(Math.random() * empty.length)];
            } else if (difficulty === "hard") {
                move = findBestMove("O") || findBestMove("X") || (board[4] === "" ? 4 : null);
                if (move == null) {
                    const corners = [0, 2, 6, 8].filter(i => board[i] === "");
                    if (corners.length) move = corners[Math.floor(Math.random() * corners.length)];
                }
                if (move == null) move = empty[Math.floor(Math.random() * empty.length)];
            } else {
                // medium
                move = findBestMove("O") || findBestMove("X") || empty[Math.floor(Math.random() * empty.length)];
            }

            if (move == null) move = empty[Math.floor(Math.random() * empty.length)];

            board[move] = "O";
            const cell = document.querySelector(`.cell[data-index='${move}']`);
            if (cell) {
                cell.textContent = "O";
                cell.classList.add("taken", "o");
            }

            clearTimer();

            if (checkWinner("O")) {
                handleRoundEnd("O");
                return;
            }
            if (isDraw()) {
                handleRoundEnd("draw");
                return;
            }

            startTurn("X");
        }, 450);
    }

    function findBestMove(symbol) {
        const patterns = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8],
            [0, 3, 6], [1, 4, 7], [2, 5, 8],
            [0, 4, 8], [2, 4, 6]
        ];
        for (let p of patterns) {
            const vals = p.map(i => board[i]);
            if (vals.filter(v => v === symbol).length === 2 && vals.includes("")) {
                return p[vals.indexOf("")];
            }
        }
        return null;
    }

    function isDraw() {
        return board.every(c => c !== "");
    }

    function checkWinner(symbol) {
        const patterns = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8],
            [0, 3, 6], [1, 4, 7], [2, 5, 8],
            [0, 4, 8], [2, 4, 6]
        ];
        return patterns.some(p => board[p[0]] === symbol && board[p[1]] === symbol && board[p[2]] === symbol);
    }

    function updateScoreboard() {
        if (playerScoreEl) playerScoreEl.textContent = playerScore;
        if (computerScoreEl) computerScoreEl.textContent = computerScore;
        if (drawScoreEl) drawScoreEl.textContent = drawScore;
    }

    // restart / reset
    function restart(fullReset = false) {
        board = ["", "", "", "", "", "", "", "", ""];
        gameOver = false;
        cells.forEach(c => {
            c.textContent = "";
            c.classList.remove("taken", "x", "o", "hint", "win");
            c.style.outline = "";
        });
        message.textContent = fullReset ? "" : `${playerName}'s turn`;
        clearTimer();
        startTurn("X");
    }

    function resetBoardUI() {
        board = ["", "", "", "", "", "", "", "", ""];
        gameOver = false;
        cells.forEach(c => {
            c.textContent = "";
            c.classList.remove("taken", "x", "o", "hint", "win");
            c.style.outline = "";
        });
    }

    function handleRoundEnd(winner) {
        gameOver = true;
        clearTimer();

        if (winner === "X") {
            message.textContent = `🎉 ${playerName} Wins!`;
            playerScore++;
            playWin();
            celebrate();
        } else if (winner === "O") {
            message.textContent = "😈 Luna Wins!";
            computerScore++;
            playLose();
            aiDisappointment();
        } else {
            message.textContent = "Oops, It's a Draw!";
            drawScore++;
            playDraw();
        }

        updateScoreboard();
        roundsPlayed++;

        if (roundsPlayed >= ROUNDS_LIMIT) {
            setTimeout(() => {
                announceTournamentWinnerAndReset();
            }, 900);
        } else {
            setTimeout(() => {
                restart(true);
            }, 1000);
        }
    }

    function announceTournamentWinnerAndReset() {
        let finalMsg = "";
        if (playerScore > computerScore) finalMsg = `🏆 ${playerName} wins the Best of ${ROUNDS_LIMIT}!`;
        else if (computerScore > playerScore) finalMsg = `🏆 Luna wins the Best of ${ROUNDS_LIMIT}!`;
        else finalMsg = `It's a tie after ${ROUNDS_LIMIT} rounds!`;

        message.textContent = finalMsg;
        if (playerScore > computerScore) playWin();
        else if (computerScore > playerScore) playLose();
        else playDraw();

        setTimeout(() => {
            roundsPlayed = 0;
            playerScore = 0;
            computerScore = 0;
            drawScore = 0;
            hintsUsed = 0;
            nextHintNumber = 1;
            hintBtn.textContent = `💡 Hint (${nextHintNumber})`;
            updateScoreboard();
            restart(true);
            message.textContent = `${playerName}, new tournament started!`;
        }, 2200);
    }

    function celebrate() {
        for (let i = 0; i < 20; i++) {
            const span = document.createElement("span");
            span.textContent = ["🎉", "🎊", "🎈", "✨", "🥳", "🎀", "🔥", "🤩"][Math.floor(Math.random() * 8)];
            span.style.position = "absolute";
            span.style.left = 10 + Math.random() * 80 + "vw";
            span.style.top = "-50px";
            span.style.fontSize = 18 + Math.random() * 30 + "px";
            span.style.animation = `fall ${1.5 + Math.random()}s linear forwards`;
            confettiContainer.appendChild(span);
            setTimeout(() => span.remove(), 2000);
        }
    }

    function aiDisappointment() {
        const boardEl = document.getElementById("board");
        if (!boardEl) return;
        boardEl.style.animation = "shake 0.5s";
        setTimeout(() => (boardEl.style.animation = ""), 500);
    }

    // ---------- Hint functionality ----------
    function clearHintHighlights() {
        document.querySelectorAll(".cell.hint").forEach(h => h.classList.remove("hint"));
    }

    function showHintForCurrentPlayer() {
        if (gameOver) return;
        clearHintHighlights();

        const symbol = currentTurn;
        // try win for current player
        let hintIndex = findBestMove(symbol);
        // or block opponent
        if (hintIndex == null) hintIndex = findBestMove(symbol === "X" ? "O" : "X");

        // fallback preferences: center, corners, edges
        if (hintIndex == null) {
            const prefer = [4, 0, 2, 6, 8, 1, 3, 5, 7];
            hintIndex = prefer.find(i => board[i] === "");
        }

        if (hintIndex == null) return;

        const cell = document.querySelector(`.cell[data-index='${hintIndex}']`);
        if (!cell) return;

        // highlight briefly
        cell.classList.add("hint");
        setTimeout(() => {
            cell.classList.remove("hint");
        }, 1600);
    }

    // ---------- Initial start ----------
    updateScoreboard();
    startGame();

}); // end DOMContentLoaded