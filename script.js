// Safe stub so inline onclick calls don't throw before real Game initializes
if (!window.game) {
  window.game = {
    _isStub: true,
    goBack() { console.warn("Game not ready yet (goBack ignored)"); },
    goForward() { console.warn("Game not ready yet (goForward ignored)"); },
    submitTextAnswer() { console.warn("Game not ready yet (submit ignored)"); }
  };
}

// ========================================
// CONFIGURATION & DATA
// ========================================

const CONFIG = {
  STORAGE_KEYS: {
    PROGRESS: "office-progress",
    ANSWERS: "office-answers",
    HINTS_USED: "office-hints-used",
    HINTS_SHOWN: "office-hints-shown",
    PLAYER_NAMES: "office-player-names",
    START_TIME: "office-start-time",
    COMPLETION_TIME: "office-completion-time"
  },
  CONFETTI_COUNT: 100,
  ANIMATION_DURATION: 1200,
  MAX_HINTS: 3,
  PERFORMANCE_TIMES: { EXCELLENT: 5, GOOD: 10, AVERAGE: 15 } // added to avoid undefined access
};

const GAME_DATA = {
  clues: [
    {
      type: "mission-name",
      title: "🚀 The Last DCC Mission",
      content: "Welcome to the ultimate challenge!",
      action: { text: "Begin", handler: "nextClue" }
    },
    {
      type: "name-collection",
      title: "📝 Team Registration",
      content: "",
      instruction: "Enter your team name.",
      action: { text: "Submit Name", handler: "nextClue" }
    },
    {
      type: "welcome",
      title: "🚀 Operation Last Call",
      content: "The Message must be delivered, but the means to do so is missing. Your <strong>MISSION</strong>: locate the asset hidden within this <strong>office</strong> floor before time runs out. The fate of this operation—and legacy—depends on you.",
      action: { text: "Start Mission", handler: "nextClue" }
    },
    {
      type: "puzzle",
      key: "puzzle-boost",
      title: "Every great mission starts with energy",
      content: "",
      hint: "Grab a cup? stronger is better.",
      answer: ["222"],
      inputPlaceholder: "sequence that fuels this mission"
    },
    {
      type: "puzzle",
      key: "puzzle-sequence",
      title: "",
      content: "The transformation unit on this floor is no mere vehicle—it is the lifeblood of the messaging system, the silent force keeping the world connected.",
      hint: "Find the rocket",
      answer: ["apollo", "APOLLO"],
      inputPlaceholder: "Type the force that powers the system "
    },
    {
      type: "puzzle",
      key: "puzzle-frame",
      title: "Four Urban Dwellings",
      content: "I’m neither alive nor do I speak, Yet I reveal the truths you seek. Frozen in time, I hold the clue, Can you find the answer hidden in view?",
      answer: ["3222"],
      inputPlaceholder: "Type your Answer"
    },
    {
      type: "welcome",
      title: "you have unlocked the messaging system",
      content: "Please click the link below to deliver your message to DCC",
      url: "https://example.com/send-message" // Add the URL here
    },
  ]
};

// ========================================
// GAME STATE MANAGEMENT
// ========================================

class GameState {
  constructor() {
    this.currentClue = parseInt(localStorage.getItem(CONFIG.STORAGE_KEYS.PROGRESS)) || 0;
    this.savedAnswers = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.ANSWERS) || "{}");
    this.hintsUsed = parseInt(localStorage.getItem(CONFIG.STORAGE_KEYS.HINTS_USED)) || 0;
    this.hintsShown = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.HINTS_SHOWN) || "{}");
    this.playerNames = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.PLAYER_NAMES) || "[]");
    this.startTime = localStorage.getItem(CONFIG.STORAGE_KEYS.START_TIME);
    this.completionTime = localStorage.getItem(CONFIG.STORAGE_KEYS.COMPLETION_TIME);
    this.app = document.getElementById("app");
  }

  saveProgress() {
    localStorage.setItem(CONFIG.STORAGE_KEYS.PROGRESS, this.currentClue);
  }

  saveAnswer(key, value) {
    this.savedAnswers[key] = value;
    localStorage.setItem(CONFIG.STORAGE_KEYS.ANSWERS, JSON.stringify(this.savedAnswers));
  }

  savePlayerNames(names) {
    this.playerNames = names;
    console.log("Saving player names:", names); // Debugging log
    localStorage.setItem(CONFIG.STORAGE_KEYS.PLAYER_NAMES, JSON.stringify(names));
    console.log("Player names saved to localStorage:", localStorage.getItem(CONFIG.STORAGE_KEYS.PLAYER_NAMES)); // Debugging log
  }

  getPlayerNames() {
    return this.playerNames;
  }

  useHint(puzzleKey) {
    if (this.hintsUsed < CONFIG.MAX_HINTS) {
      this.hintsUsed++;
      this.hintsShown[puzzleKey] = true;
      localStorage.setItem(CONFIG.STORAGE_KEYS.HINTS_USED, this.hintsUsed);
      localStorage.setItem(CONFIG.STORAGE_KEYS.HINTS_SHOWN, JSON.stringify(this.hintsShown));
      return true;
    }
    return false;
  }

  isHintShown(puzzleKey) {
    return this.hintsShown[puzzleKey] === true;
  }

  getHintsRemaining() {
    return CONFIG.MAX_HINTS - this.hintsUsed;
  }

  canUseHint() {
    return this.hintsUsed < CONFIG.MAX_HINTS;
  }

  reset() {
    localStorage.removeItem(CONFIG.STORAGE_KEYS.PROGRESS);
    localStorage.removeItem(CONFIG.STORAGE_KEYS.ANSWERS);
    localStorage.removeItem(CONFIG.STORAGE_KEYS.HINTS_USED);
    localStorage.removeItem(CONFIG.STORAGE_KEYS.HINTS_SHOWN);
    localStorage.removeItem(CONFIG.STORAGE_KEYS.PLAYER_NAMES);
    localStorage.removeItem(CONFIG.STORAGE_KEYS.START_TIME);
    localStorage.removeItem(CONFIG.STORAGE_KEYS.COMPLETION_TIME);
    this.currentClue = 0;
    this.savedAnswers = {};
    this.hintsUsed = 0;
    this.hintsShown = {};
    this.playerNames = [];
    this.startTime = null;
    this.completionTime = null;
  }

  getCurrentClue() {
    return GAME_DATA.clues[this.currentClue];
  }

  canGoBack() {
    const currentClue = this.getCurrentClue();
    // Prevent going back from statistics screen
    if (currentClue && currentClue.type === "statistics") {
      return false;
    }
    return this.currentClue > 0;
  }

  canGoForward() {
    return this.currentClue < GAME_DATA.clues.length - 1;
  }

  nextClue() {
    if (this.canGoForward()) {
      this.currentClue++;
      this.saveProgress();
    }
  }

  prevClue() {
    if (this.canGoBack()) {
      this.currentClue--;
      this.saveProgress();
    }
  }

  // Timer methods
  startTimer() {
    if (!this.startTime) {
      this.startTime = new Date().toISOString();
      localStorage.setItem(CONFIG.STORAGE_KEYS.START_TIME, this.startTime);
    }
  }

  completeGame() {
    if (this.startTime && !this.completionTime) {
      this.completionTime = new Date().toISOString();
      localStorage.setItem(CONFIG.STORAGE_KEYS.COMPLETION_TIME, this.completionTime);
    }
  }

  getGameDuration() {
    if (!this.startTime) return null;
    
    const endTime = this.completionTime ? new Date(this.completionTime) : new Date();
    const startTime = new Date(this.startTime);
    const durationMs = endTime - startTime;
    const durationMinutes = Math.round(durationMs / (1000 * 60));
    
    return {
      minutes: durationMinutes,
      formatted: this.formatDuration(durationMs)
    };
  }

  formatDuration(durationMs) {
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((durationMs % (1000 * 60)) / 1000);

    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  }

  getPerformanceRating() {
    const duration = this.getGameDuration();
    if (!duration) return null;

    const minutes = duration.minutes;
    
    if (minutes <= CONFIG.PERFORMANCE_TIMES.EXCELLENT) {
      return {
        level: "🏆 EXCELLENT",
        message: "Lightning fast! You're a true treasure hunting master!",
        color: "#FFD700"
      };
    } else if (minutes <= CONFIG.PERFORMANCE_TIMES.GOOD) {
      return {
        level: "🥈 GOOD",
        message: "Well done! You solved the mysteries efficiently!",
        color: "#C0C0C0"
      };
    } else if (minutes <= CONFIG.PERFORMANCE_TIMES.AVERAGE) {
      return {
        level: "🥉 AVERAGE",
        message: "Great job! You took your time to solve everything carefully!",
        color: "#CD7F32"
      };
    } else {
      return {
        level: "🌟 EXPLORER",
        message: "Excellent! You thoroughly explored every clue and mystery!",
        color: "#9370DB"
      };
    }
  }
}

// ========================================
// UI RENDERING COMPONENTS
// ========================================

class UIRenderer {
  static createProgressBar(current, total, gameState) {
    return `<p><i>Step ${current + 1} of ${total}</i></p>`;
  }

  static createBackButton() {
    return `
      <button onclick="game.goBack()" class="back-button">
        ⬅ Back
      </button>
    `;
  }

  // ---------- New shared helpers ----------
  static buildInstruction(instruction) {
    return instruction ? `<p style="text-align:center;">${instruction}</p>` : '';
  }

  static buildHintSection(clue, hintsRemaining, canUseHint, isHintShown) {
    if (!clue.hint) return '';
    let label;
    let disabled = '';
    if (isHintShown) {
      label = '✅ Hint revealed';
      disabled = ' disabled';
    } else if (canUseHint) {
      label = `💡 Need a hint? (${hintsRemaining} left)`;
    } else {
      label = '💡 No more hints available';
      disabled = ' disabled';
    }
    const visibility = isHintShown ? '' : ' class="hidden"';
    return `
      <div style="text-align:center; margin: 1rem 0;">
        <button onclick="game.toggleHint()" id="hint-button" class="hint-button"${disabled}>
          ${label}
        </button>
      </div>
      <p id="hint-text" style="text-align:center; font-style: italic; color: #666; margin-bottom: 1rem;"${visibility}>
        ${clue.hint}
      </p>
    `;
  }

  static puzzleShell({ clue, body, hintSection = '', instruction = '' }) {
    return `
      <h2 style="text-align:center;">${clue.title}</h2>
      <p style="text-align:center;">${clue.content}</p>
      ${hintSection}
      ${instruction}
      ${body}
    `;
  }
  // ---------- End shared helpers ----------

  static createWelcomeScreen(clue) {
    const link = clue.url
      ? `<p style="margin-top:1rem;"><a href="${clue.url}" target="_blank" rel="noopener" style="color:#3366ee; font-weight:bold; text-decoration:underline;">Open Messaging System 🔗</a></p>`
      : '';
    const actionButton = clue.action
      ? `<button onclick="game.goForward()">${clue.action.text || "Continue"}</button>`
      : (clue.url ? '' : `<button onclick="game.goForward()">Continue</button>`);
    return `
      <h1>${clue.title}</h1>
      <p>${clue.content}</p>
      ${link}
      ${actionButton}
    `;
  }

  static createNameCollection(clue, teamName = "Enter your team name...") {
    return `
      <h2>${clue.title}</h2>
      <p>${clue.content}</p>
      <input id="team-name" type="text" placeholder="${teamName}" style="width: 100%; padding: 0.5rem; font-size: 1rem; border-radius: 0.5rem; border: 1px solid #aaa; margin-bottom: 1rem;" />
      <br/>
      <button onclick="game.saveTeamName()">Unlock Mission</button>
      <div id="name-error" style="color: red; margin-top: 0.5rem; display: none;"></div>
    `;
  }

  static createTextPuzzle(clue, hintsRemaining, canUseHint, isHintShown) {
    const hintSection = this.buildHintSection(clue, hintsRemaining, canUseHint, isHintShown);
    const body = `
      <input id="answer" type="text" placeholder="${clue.inputPlaceholder}" />
      <br/>
      <button onclick="game.submitTextAnswer('${clue.key}')">Submit</button>
      <div id="text-success-message" class="success-message hidden"></div>
    `;
    return this.puzzleShell({
      clue,
      body,
      hintSection
    });
  }

  static createNumberPuzzle(clue, hintsRemaining, canUseHint, isHintShown) {
    const hintSection = this.buildHintSection(clue, hintsRemaining, canUseHint, isHintShown);
    const instruction = this.buildInstruction(clue.instruction);

    let body;
    if (clue.format === 'split-6') {
      body = `
        <div class="number-input-container">
          <div class="number-group">
            <input type="number" id="n1" min="0" max="9" maxlength="1" class="number-input" oninput="game.handleNumberInput(1)">
            <input type="number" id="n2" min="0" max="9" maxlength="1" class="number-input" oninput="game.handleNumberInput(2)">
            <input type="number" id="n3" min="0" max="9" maxlength="1" class="number-input" oninput="game.handleNumberInput(3)">
          </div>
          <span class="number-separator">-</span>
          <div class="number-group">
            <input type="number" id="n4" min="0" max="9" maxlength="1" class="number-input" oninput="game.handleNumberInput(4)">
            <input type="number" id="n5" min="0" max="9" maxlength="1" class="number-input" oninput="game.handleNumberInput(5)">
            <input type="number" id="n6" min="0" max="9" maxlength="1" class="number-input" oninput="game.handleNumberInput(6)">
          </div>
        </div>
        <div id="unlock-message" class="unlock-message hidden"></div>
      `;
    } else {
      body = `
        <div style="text-align:center; margin: 1rem 0;">
          <input type="number" id="number-answer" min="0"
            style="padding: 0.6rem; font-size: 1.2rem; border-radius: 0.5rem; border: 1px solid #aaa; text-align: center; width: 100px;"
            placeholder="Enter number" />
          <br/><br/>
          <button onclick="game.submitNumberAnswer('${clue.key}')">Submit</button>
        </div>
        <div id="number-success-message" class="success-message hidden"></div>
      `;
    }

    return this.puzzleShell({
      clue,
      body,
      hintSection,
      instruction
    });
  }

  static createFinalScreen(clue, playerNames, gameStats) {
    const namesDisplay = playerNames.length > 0 
      ? `<p class="player-names">🎖️ <strong>Congratulations to our brave explorers:</strong><br>${playerNames.map(name => `<span class="player-name">${name.trim()}</span>`).join(', ')}</p>`
      : '';

    return `
      <div class="certificate">
        <div class="decorative-flower top-left">🌻</div>
        <div class="decorative-flower top-right">🌻</div>
        <h1 class="certificate-title">${clue.title}</h1>
        <p class="certificate-content">${clue.content}</p>
        <div style="background: linear-gradient(45deg, #ffd700, #ffed4e); padding: 1.5rem; margin: 1.5rem 0; border-radius: 1rem; border: 3px solid #ffa500; box-shadow: 0 4px 15px rgba(255, 215, 0, 0.3);">
          <h2 style="margin: 0; color: #8b4513; font-size: 1.8rem; text-shadow: 2px 2px 4px rgba(0,0,0,0.1);">
            🎉 TREASURE!! 🎉
          </h2>
          <p style="margin: 0.5rem 0 0 0; color: #8b4513; font-size: 1.3rem; font-weight: bold; text-shadow: 1px 1px 2px rgba(0,0,0,0.1);">
            ${clue.treasureReveal}
          </p>
        </div>
        ${namesDisplay}
        <p class="certificate-closing">${clue.closing}</p>
        <div style="text-align: center; margin: 2rem 0;">
          <button onclick="game.goForward()" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; padding: 1rem 2rem; border-radius: 2rem; font-size: 1.1rem; font-weight: bold; cursor: pointer; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4); transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
            Continue ➡
          </button>
        </div>
      </div>
    `;
  }
}

// ========================================
// CONFETTI EFFECTS SYSTEM=================
// ========================================
// ========================================
class ConfettiSystem {
  constructor() {
    this.ensureCanvas();
    this.ctx = this.canvas.getContext("2d");
    this.particles = [];
    this.isActive = false;
    this.resizeCanvas();
    window.addEventListener("resize", () => this.resizeCanvas());
  }

  ensureCanvas() {
    this.canvas = document.getElementById("confetti-canvas");
    if (!this.canvas) {
      this.canvas = document.createElement("canvas");
      this.canvas.id = "confetti-canvas";
      Object.assign(this.canvas.style, {
        position: "fixed",
        inset: "0",
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: "999"
      });
      document.body.appendChild(this.canvas);
    }
  }

  resizeCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  launch() {
    this.particles = [];
    for (let i = 0; i < CONFIG.CONFETTI_COUNT; i++) {
      this.particles.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height - this.canvas.height,
        r: Math.random() * 6 + 4,
        d: Math.random() * 50,
        color: `hsl(${Math.random() * 360}, 70%, 50%)`,
        tilt: Math.random() * 10 - 10,
        tiltAngleIncremental: Math.random() * 0.07 + 0.05,
        tiltAngle: 0,
      });
    }
    this.isActive = true;
    this.animate();
  }

  animate() {
    if (!this.isActive) return;

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.particles.forEach((particle) => {
      this.ctx.beginPath();
      this.ctx.lineWidth = particle.r;
      this.ctx.strokeStyle = particle.color;
      this.ctx.moveTo(
        particle.x + particle.tilt + particle.r / 2,
        particle.y
      );
      this.ctx.lineTo(
        particle.x + particle.tilt,
        particle.y + particle.tilt + particle.r / 2
      );
      this.ctx.stroke();
    });

    this.updateParticles();
    requestAnimationFrame(() => this.animate());
  }

  updateParticles() {
    this.particles.forEach((particle) => {
      particle.tiltAngle += particle.tiltAngleIncremental;
      particle.y += (Math.cos(particle.d) + 3 + particle.r / 2) / 2;
      particle.tilt = Math.sin(particle.tiltAngle) * 15;

      if (particle.y > this.canvas.height) {
        particle.x = Math.random() * this.canvas.width;
        particle.y = -10;
      }
    });
  }

  stop() {
    this.isActive = false;
  }
}
// ========================================
// MAIN GAME CONTROLLER====================
// ========================================
// ========================================
class Game {
  constructor() {
    this.state = new GameState();
    this.confetti = new ConfettiSystem();
    this.render();
  }

  // --- helper to add Continue CTA (avoids duplicates) ---
  ensureContinueButton() {
    if (!document.getElementById("continue-button")) {
      const container = document.createElement("div");
      container.style.textAlign = "center";
      container.style.marginTop = "1rem";
      container.innerHTML = `<button id="continue-button" onclick="game.goForward()" style="padding:0.7rem 1.4rem; border-radius:1.5rem; font-weight:bold; cursor:pointer;">Continue ➡</button>`;
      const app = document.getElementById("app");
      // try to insert after success message if present
      const successMsg = document.querySelector("#text-success-message, #number-success-message, #unlock-message");
      if (successMsg && successMsg.parentElement) {
        successMsg.parentElement.appendChild(container);
      } else if (app) {
        app.appendChild(container);
      }
    }
  }

  render() {
    const clue = this.state.getCurrentClue();
    const progress = UIRenderer.createProgressBar(this.state.currentClue, GAME_DATA.clues.length, this.state);
    const backButton = this.state.canGoBack() ? UIRenderer.createBackButton() : "";
    let content = "";

    switch (clue.type) {
      case "mission-name":
        content = UIRenderer.createWelcomeScreen(clue);
        break;
      case "welcome":
        content = UIRenderer.createWelcomeScreen(clue);
        break;
      case "name-collection":
        content = UIRenderer.createNameCollection(clue);
        break;
      case "puzzle":
        content = UIRenderer.createTextPuzzle(clue, this.state.getHintsRemaining(), this.state.canUseHint(), this.state.isHintShown(clue.key));
        break;
      case "number-puzzle":
        content = UIRenderer.createNumberPuzzle(clue, this.state.getHintsRemaining(), this.state.canUseHint(), this.state.isHintShown(clue.key));
        break;
      case "final":
        this.state.completeGame();
        const gameStats = {
          duration: this.state.getGameDuration(),
            performance: this.state.getPerformanceRating(),
            hintsUsed: this.state.hintsUsed,
        };
        content = UIRenderer.createFinalScreen(clue, this.state.getPlayerNames(), gameStats);
        break;
    }

    if (!content) {
      console.error("No content rendered for clue type: ", clue.type);
      this.state.app.innerHTML = "<p>Error: Unable to render content.</p>";
      return;
    }

    this.state.app.innerHTML = `
      <div>
        ${progress}
        ${content}
        ${backButton}
      </div>
    `;
    this.restoreInputs(clue);
  }

  // ----- Added methods -----
  goForward() {
    this.state.nextClue();
    this.render();
  }

  goBack() {
    this.state.prevClue();
    this.render();
  }

  getClueByKey(key) {
    return GAME_DATA.clues.find(c => c.key === key);
  }

  saveTeamName() {
    const input = document.getElementById("team-name");
    const err = document.getElementById("name-error");
    if (!input) return;
    const name = input.value.trim();
    if (!name) {
      if (err) {
        err.textContent = "Please enter a team name";
        err.style.display = "block";
      }
      return;
    }
    if (err) err.style.display = "none";
    this.state.savePlayerNames([name]);
    this.goForward();
  }

  submitTextAnswer(key) {
    const input = document.getElementById("answer");
    if (!input) return;
    const val = input.value.trim();
    const clue = this.getClueByKey(key);
    if (!clue || !clue.answer) return;
    const isCorrect = clue.answer.map(a => a.toLowerCase()).includes(val.toLowerCase());
    if (isCorrect) {
      this.state.saveAnswer(key, val);
      const msg = document.getElementById("text-success-message");
      if (msg) {
        msg.textContent = "✅ Correct!";
        msg.classList.remove("hidden");
      }
      input.disabled = true;
      const submitBtn = input.parentElement.querySelector("button[onclick^='game.submitTextAnswer']");
      if (submitBtn) submitBtn.disabled = true;
      this.ensureContinueButton(); // user advances manually
    } else {
      input.classList.add("shake");
      setTimeout(() => input.classList.remove("shake"), 400);
    }
  }

  submitNumberAnswer(key) {
    const input = document.getElementById("number-answer");
    if (!input) return;
    const val = input.value.trim();
    const clue = this.getClueByKey(key);
    if (!clue || !clue.answer) return;
    const isCorrect = clue.answer.includes(val);
    if (isCorrect) {
      this.state.saveAnswer(key, val);
      const msg = document.getElementById("number-success-message");
      if (msg) {
        msg.textContent = "✅ Correct!";
        msg.classList.remove("hidden");
      }
      input.disabled = true;
      const submitBtn = input.parentElement.querySelector("button[onclick^='game.submitNumberAnswer']");
      if (submitBtn) submitBtn.disabled = true;
      this.ensureContinueButton();
    } else {
      input.classList.add("shake");
      setTimeout(() => input.classList.remove("shake"), 400);
    }
  }

  handleNumberInput(idx) {
    const el = document.getElementById("n" + idx);
    if (!el) return;
    if (el.value.length > 1) el.value = el.value.slice(-1);
    if (el.value && idx < 6) {
      const next = document.getElementById("n" + (idx + 1));
      if (next) next.focus();
    }
    const digits = [];
    for (let i = 1; i <= 6; i++) {
      const d = document.getElementById("n" + i);
      digits.push(d ? d.value : "");
    }
    if (digits.every(d => d !== "")) {
      const code = digits.join("");
      const msg = document.getElementById("unlock-message");
      const clue = GAME_DATA.clues.find(c => c.format === "split-6");
      if (clue && clue.answer && clue.answer.includes(code)) {
        if (msg) {
          msg.textContent = "✅ Code accepted!";
          msg.classList.remove("hidden");
        }
        this.state.saveAnswer(clue.key, code);
        // lock inputs
        for (let i = 1; i <= 6; i++) {
          const box = document.getElementById("n" + i);
          if (box) box.disabled = true;
        }
        this.ensureContinueButton();
      } else if (msg) {
        msg.textContent = "❌ Incorrect code";
        msg.classList.remove("hidden");
      }
    }
  }

  restoreInputs(clue) {
    if (!clue) return;
    // Text puzzle restore & lock if already solved
    if (clue.type === "puzzle") {
      const saved = this.state.savedAnswers[clue.key];
      if (saved) {
        const input = document.getElementById("answer");
        if (input) {
          input.value = saved;
          // If answer still valid, lock & show success + continue
          if (clue.answer && clue.answer.map(a => a.toLowerCase()).includes(saved.toLowerCase())) {
            input.disabled = true;
            const msg = document.getElementById("text-success-message");
            if (msg) {
              msg.textContent = "✅ Correct!";
              msg.classList.remove("hidden");
            }
            const submitBtn = input.parentElement.querySelector("button[onclick^='game.submitTextAnswer']");
            if (submitBtn) submitBtn.disabled = true;
            this.ensureContinueButton();
          }
        }
      }
    }
    // Split 6 number puzzle
    if (clue.type === "number-puzzle" && clue.format === "split-6") {
      const saved = this.state.savedAnswers[clue.key];
      if (saved && saved.length === 6) {
        let allBoxesPresent = true;
        for (let i = 1; i <= 6; i++) {
          const box = document.getElementById("n" + i);
            if (box) {
              box.value = saved[i - 1];
              box.disabled = true;
            } else {
              allBoxesPresent = false;
            }
        }
        if (allBoxesPresent) {
          const msg = document.getElementById("unlock-message");
          if (msg) {
            msg.textContent = "✅ Code accepted!";
            msg.classList.remove("hidden");
          }
          this.ensureContinueButton();
        }
      }
    }
    // Single number answer puzzle restore & lock
    if (clue.type === "number-puzzle" && clue.format !== "split-6") {
      const saved = this.state.savedAnswers[clue.key];
      if (saved) {
        const input = document.getElementById("number-answer");
        if (input) {
          input.value = saved;
          if (clue.answer && clue.answer.includes(saved)) {
            input.disabled = true;
            const msg = document.getElementById("number-success-message");
            if (msg) {
              msg.textContent = "✅ Correct!";
              msg.classList.remove("hidden");
            }
            const submitBtn = input.parentElement.querySelector("button[onclick^='game.submitNumberAnswer']");
            if (submitBtn) submitBtn.disabled = true;
            this.ensureContinueButton();
          }
        }
      }
    }
  }
}

// ---------- SAFE INITIALIZATION ----------
(function initGameWhenReady() {
  function start() {
    if (!document.getElementById("app")) {
      const appDiv = document.createElement("div");
      appDiv.id = "app";
      document.body.appendChild(appDiv);
    }
    // Replace stub with real instance
    window.game = new Game();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
// ----------------------------------------