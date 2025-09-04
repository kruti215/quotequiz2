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
let selectedCategory = "";

// DOM Elements
const timerEl = document.getElementById("timer");
const scoreEl = document.getElementById("score");
const questionCountEl = document.getElementById("question-count");
const quizQuoteEl = document.getElementById("quiz-quote");
const optionsEl = document.getElementById("options");
const statusEl = document.getElementById("status");
const nextBtn = document.getElementById("next-btn");
const gameOverSection = document.getElementById("game-over");
const gameSection = document.getElementById("game-section");
const finalScoreEl = document.getElementById("final-score");
const gameOverMessageEl = document.getElementById("game-over-message");
const playAgainBtn = document.getElementById("play-again");
const startScreen = document.getElementById("start-screen");
const startBtn = document.getElementById("start-btn");
const categorySelect = document.getElementById("category-select");
const shareBtn = document.getElementById("share-score");
const shareStatus = document.getElementById("share-status");

// Utility Functions
const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);
const normalize = (s) => s.toLowerCase().replace(/[^a-z]/g, "");

// Fetch a random quote and setup the question
async function fetchQuote() {
  let quoteData = null;
  let words = [];

  while (true) {
    let url = "https://api.quotable.io/random";
    if (selectedCategory) {
      url += `?tags=${selectedCategory}`;
    }

    const res = await fetch(url);
    const data = await res.json();

    words = data.content.split(" ").filter((word) => word.length > 3);
    if (words.length >= 4) {
      quoteData = data;
      break;
    }
  }

  quote = quoteData.content;
  const wordList = quote.split(" ");
  const wordToRemove = words[Math.floor(Math.random() * words.length)];
  missingWord = wordToRemove.replace(/[^a-zA-Z]/g, "");

  quizQuote = wordList
    .map((w) => (normalize(w) === normalize(wordToRemove) ? "____" : w))
    .join(" ");

  options = await generateOptions(wordToRemove);

  renderQuote();
}

// Generate multiple choice options
async function generateOptions(correctWord) {
  const distractors = new Set();
  distractors.add(correctWord.toLowerCase());

  while (distractors.size < 4) {
    let url = "https://api.quotable.io/random";
    if (selectedCategory) {
      url += `?tags=${selectedCategory}`;
    }

    const res = await fetch(url);
    const data = await res.json();
    const words = data.content.split(" ").filter((w) => w.length > 3);
    if (words.length) {
      const randomWord = words[Math.floor(Math.random() * words.length)];
      distractors.add(randomWord.toLowerCase());
    }
  }

  return Array.from(distractors)
    .map(capitalize)
    .sort(() => 0.5 - Math.random());
}

// Render the quote and options
function renderQuote() {
  timerEl.textContent = timer;
  scoreEl.textContent = score;
  questionCountEl.textContent = questionCount + 1;
  quizQuoteEl.textContent = `"${quizQuote}"`;
  statusEl.textContent = "";
  statusEl.className = "status";
  nextBtn.disabled = true;
  selected = null;

  optionsEl.innerHTML = "";
  options.forEach((opt) => {
    const btn = document.createElement("button");
    btn.textContent = opt;
    btn.addEventListener("click", () => handleSelect(opt, btn));
    optionsEl.appendChild(btn);
  });
}

// Handle answer selection
function handleSelect(option, btn) {
  selected = option;
  const buttons = optionsEl.querySelectorAll("button");
  buttons.forEach((b) => (b.disabled = true));

  if (normalize(option) === normalize(missingWord)) {
    statusEl.textContent = "Correct!";
    statusEl.className = "status correct";
    score++;
  } else {
    statusEl.textContent = `Wrong! — Correct: ${capitalize(missingWord)}`;
    statusEl.className = "status wrong";

    // Highlight correct answer
    buttons.forEach((b) => {
      if (normalize(b.textContent) === normalize(missingWord)) {
        b.classList.add("selected");
      }
    });
  }

  btn.classList.add("selected");
  nextBtn.disabled = false;
}

// Load next question or end the game
function nextQuote() {
  if (questionCount + 1 >= TOTAL_QUESTIONS) {
    endGame("completed");
  } else {
    questionCount++;
    fetchQuote();
  }
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

// Reset the game state
function resetGame() {
  score = 0;
  timer = TOTAL_TIME;
  questionCount = 0;
  gameOver = false;
  gameOverSection.classList.add("hidden");
  gameSection.classList.remove("hidden");
  shareStatus.textContent = "";

  fetchQuote();
  startTimer();
}

// Start countdown timer
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

      // Red timer warning
      if (timer <= 10) {
        timerEl.style.color = "red";
        timerEl.style.fontWeight = "bold";
      } else {
        timerEl.style.color = "";
        timerEl.style.fontWeight = "";
      }

    } else {
      clearInterval(countdownInterval);
      endGame("timeout");
    }
  }, 1000);
}

// Event listeners
nextBtn.addEventListener("click", nextQuote);
playAgainBtn.addEventListener("click", () => {
  gameOverSection.classList.add("hidden");
  startScreen.classList.remove("hidden");
});
startBtn.addEventListener("click", () => {
  selectedCategory = categorySelect.value;
  startScreen.classList.add("hidden");
  resetGame();
});

// Share Score
shareBtn.addEventListener("click", () => {
  const text = `🎉 I scored ${score}/${TOTAL_QUESTIONS} in the Quote Quiz! Can you beat me?`;
  const url = window.location.href;

  if (navigator.share) {
    navigator
      .share({
        title: "Quote Quiz Score",
        text: text,
        url: url,
      })
      .then(() => {
        shareStatus.textContent = "✅ Shared successfully!";
      })
      .catch(() => {
        shareStatus.textContent = "❌ Share cancelled.";
      });
  } else {
    // Fallback: copy to clipboard
    navigator.clipboard.writeText(`${text} ${url}`).then(() => {
      shareStatus.textContent = "✅ Score copied to clipboard!";
    }).catch(() => {
      shareStatus.textContent = "❌ Failed to copy score.";
    });
  }
});

// Dark Mode Toggle
const darkToggleBtn = document.getElementById("dark-toggle");

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
