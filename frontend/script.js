const TOTAL_QUESTIONS = 10;
const TOTAL_TIME = 50;

let quote = "";
let quizQuote = "";
let missingWord = "";
let options = [];
let selected = null;
let score = 0;
let timer = TOTAL_TIME;
let questionCount = 0;
let gameOver = false;
let countdownInterval = null;

// DOM Elements
const timerEl = document.getElementById("timer");
const scoreEl = document.getElementById("score");
const questionCountEl = document.getElementById("question-count");
const quizQuoteEl = document.getElementById("quiz-quote");
const optionsEl = document.getElementById("options");
const statusEl = document.getElementById("status");
const gameOverSection = document.getElementById("game-over");
const gameSection = document.getElementById("game-section");
const finalScoreEl = document.getElementById("final-score");
const gameOverMessageEl = document.getElementById("game-over-message");
const playAgainBtn = document.getElementById("play-again");
const startScreen = document.getElementById("start-screen");
const startBtn = document.getElementById("start-btn");
const darkToggleBtn = document.getElementById("dark-toggle");

const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);
const normalize = (s) => s.toLowerCase().replace(/[^a-z]/g, "");

// Fetch a random quote and set up the question
async function fetchQuote() {
  let quoteData = null;
  let words = [];
  quizQuoteEl.textContent = "Loading...";
  optionsEl.innerHTML = "";

  while (true) {
    const res = await fetch("https://dummyjson.com/quotes/random");
    const data = await res.json();
    words = data.quote.split(" ").filter((word) => word.length > 3);
    if (words.length >= 4) {
      quoteData = data;
      break;
    }
  }

  quote = quoteData.quote;
  const wordList = quote.split(" ");
  const wordToRemove = words[Math.floor(Math.random() * words.length)];
  missingWord = wordToRemove.replace(/[^a-zA-Z]/g, "");

  quizQuote = wordList
    .map((w) => (normalize(w) === normalize(wordToRemove) ? "____" : w))
    .join(" ");

  options = await generateOptions(wordToRemove);

  renderQuote(quoteData.author);
}

// Generate answer options
async function generateOptions(correctWord) {
  const distractors = new Set();
  distractors.add(correctWord.toLowerCase());

  while (distractors.size < 4) {
    const res = await fetch("https://dummyjson.com/quotes/random");
    const data = await res.json();
    const words = data.quote.split(" ").filter((w) => w.length > 3);
    if (words.length) {
      const randomWord = words[Math.floor(Math.random() * words.length)];
      distractors.add(randomWord.toLowerCase());
    }
  }

  return Array.from(distractors)
    .map(capitalize)
    .sort(() => 0.5 - Math.random());
}

// Render question and options
function renderQuote(author = "") {
  timerEl.textContent = timer;
  scoreEl.textContent = score;
  questionCountEl.textContent = questionCount + 1;
  quizQuoteEl.textContent = `"${quizQuote}"` + (author ? ` — ${author}` : "");
  statusEl.textContent = "";
  statusEl.className = "status";
  selected = null;

  optionsEl.innerHTML = "";
  options.forEach((opt) => {
    const btn = document.createElement("button");
    btn.textContent = opt;
    btn.addEventListener("click", () => handleSelect(opt, btn));
    optionsEl.appendChild(btn);
  });
}

// Handle user selecting an option
function handleSelect(option, btn) {
  selected = option;
  const buttons = optionsEl.querySelectorAll("button");
  buttons.forEach((b) => (b.disabled = true));

  const correct = normalize(option) === normalize(missingWord);

  if (correct) {
    statusEl.className = "status correct";
    score++;
    btn.classList.add("correct"); // green for correct choice
  } else {
    statusEl.className = "status wrong";

    // Highlight the correct answer in green
    buttons.forEach((b) => {
      if (normalize(b.textContent) === normalize(missingWord)) {
        b.classList.add("correct");
      }
    });

    // Mark the chosen wrong one in red
    btn.classList.add("wrong");
  }

  // Auto-advance after 1.5 seconds
  setTimeout(() => {
    if (questionCount + 1 >= TOTAL_QUESTIONS) {
      endGame("completed");
    } else {
      questionCount++;
      fetchQuote();
    }
  }, 1500);
}

// End the game
function endGame(reason) {
  gameOver = true;
  clearInterval(countdownInterval);
  gameSection.classList.add("hidden");
  gameOverSection.classList.remove("hidden");

  if (reason === "timeout") {
    gameOverMessageEl.textContent = "⏱️ Time's up!";
  } else {
    gameOverMessageEl.textContent = "✅ All questions completed!";
  }

  finalScoreEl.textContent = `Final Score: ${score} / ${TOTAL_QUESTIONS}`;
}

// Reset game and restart timer
function resetGame() {
  score = 0;
  timer = TOTAL_TIME;
  questionCount = 0;
  gameOver = false;

  gameSection.classList.remove("hidden");
  gameOverSection.classList.add("hidden");

  fetchQuote();
  startTimer();
}

// Start the countdown timer
function startTimer() {
  if (countdownInterval) {
    clearInterval(countdownInterval);
  }

  countdownInterval = setInterval(() => {
    if (gameOver) {
      clearInterval(countdownInterval);
    } else if (timer > 0) {
      timer--;
      timerEl.textContent = timer;

      // Red warning if time < 10s
      if (timer <= 10) {
        timerEl.classList.add("timer-warning");
      } else {
        timerEl.classList.remove("timer-warning");
      }

    } else {
      clearInterval(countdownInterval);
      endGame("timeout");
    }
  }, 1000);
}

// Event Listeners
playAgainBtn.addEventListener("click", () => {
  gameOverSection.classList.add("hidden");
  startScreen.classList.remove("hidden");
});

startBtn.addEventListener("click", () => {
  startScreen.classList.add("hidden");
  resetGame();
});

// ✅ Dark mode setup
if (localStorage.getItem("dark-mode") === "enabled") {
  document.body.classList.add("dark");
  darkToggleBtn.textContent = "☀️ Light Mode";
} else {
  darkToggleBtn.textContent = "🌙 Dark Mode";
}

darkToggleBtn.addEventListener("click", () => {
  document.body.classList.toggle("dark");

  if (document.body.classList.contains("dark")) {
    localStorage.setItem("dark-mode", "enabled");
    darkToggleBtn.textContent = "☀️ Light Mode";
  } else {
    localStorage.setItem("dark-mode", "disabled");
    darkToggleBtn.textContent = "🌙 Dark Mode";
  }
});

