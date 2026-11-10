const welcomeScreen = document.querySelector("#welcome");
const quizScreen = document.querySelector("#quiz");
const resultsScreen = document.querySelector("#results");
const startButton = document.querySelector("#start-button");
const restartButton = document.querySelector("#restart-button");
const questionCount = document.querySelector("#question-count");
const questionCategory = document.querySelector("#question-category");
const questionText = document.querySelector("#question-text");
const optionsContainer = document.querySelector("#options");
const backButton = document.querySelector("#back-button");
const nextButton = document.querySelector("#next-button");
const progressTrack = document.querySelector(".progress-track");
const progressBar = document.querySelector("#progress-bar");
const errorMessage = document.querySelector("#error-message");

let questions = [];
let answers = {};
let currentIndex = 0;

function showError(message) {
  errorMessage.textContent = message;
  errorMessage.hidden = false;
}

function clearError() {
  errorMessage.hidden = true;
  errorMessage.textContent = "";
}

async function startQuiz() {
  clearError();
  startButton.disabled = true;
  try {
    const response = await fetch("/api/questions?shuffle=true");
    if (!response.ok) throw new Error("No pudimos cargar las preguntas. Inténtalo otra vez.");
    questions = await response.json();
    answers = {};
    currentIndex = 0;
    welcomeScreen.hidden = true;
    resultsScreen.hidden = true;
    quizScreen.hidden = false;
    renderQuestion();
  } catch (error) {
    showError(error.message);
  } finally {
    startButton.disabled = false;
  }
}

function renderQuestion() {
  const question = questions[currentIndex];
  const selectedIndex = answers[question.id];
  questionCount.innerHTML = `<strong>${String(currentIndex + 1).padStart(2, "0")}</strong> / ${String(questions.length).padStart(2, "0")}`;
  questionCategory.textContent = question.category;
  questionText.textContent = question.text;
  optionsContainer.replaceChildren();

  question.options.forEach((option, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `option${selectedIndex === index ? " selected" : ""}`;
    button.setAttribute("aria-pressed", String(selectedIndex === index));
    const letter = document.createElement("span");
    letter.className = "option-letter";
    letter.textContent = String.fromCharCode(65 + index);
    const text = document.createElement("span");
    text.className = "option-text";
    text.textContent = option;
    button.append(letter, text);
    button.addEventListener("click", () => {
      answers[question.id] = index;
      renderQuestion();
    });
    optionsContainer.append(button);
  });

  backButton.disabled = currentIndex === 0;
  nextButton.disabled = selectedIndex === undefined;
  const progress = ((currentIndex + 1) / questions.length) * 100;
  progressBar.style.width = `${progress}%`;
  progressTrack.setAttribute("aria-valuemax", String(questions.length));
  progressTrack.setAttribute("aria-valuenow", String(currentIndex + 1));
  nextButton.innerHTML = currentIndex === questions.length - 1
    ? 'Ver mi resultado <span aria-hidden="true">↗</span>'
    : 'Siguiente <span aria-hidden="true">→</span>';
}

async function submitQuiz() {
  clearError();
  nextButton.disabled = true;
  try {
    const response = await fetch("/api/score", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.detail || "No pudimos calcular el resultado.");
    renderResults(result);
  } catch (error) {
    showError(error.message);
    nextButton.disabled = false;
  }
}

function renderResults(result) {
  quizScreen.hidden = true;
  resultsScreen.hidden = false;
  const title = result.percentage === 100
    ? "¡Impresionante!"
    : result.percentage >= 70
      ? "¡Muy buen trabajo!"
      : result.percentage >= 40
        ? "¡Vas por buen camino!"
        : "¡Así se empieza!";
  document.querySelector("#result-emoji").textContent = result.percentage >= 70 ? "🎉" : "🌱";
  document.querySelector("#result-title").textContent = title;
  document.querySelector("#result-message").textContent = "Cada respuesta es una excusa para aprender algo nuevo.";
  document.querySelector("#score-value").textContent = `${result.score} / ${result.total}`;
  document.querySelector("#score-percent").textContent = `${result.percentage}% de aciertos`;

  const reviewList = document.querySelector("#review-list");
  reviewList.replaceChildren();
  for (const [index, item] of result.results.entries()) {
    const card = document.createElement("article");
    card.className = `review-item ${item.is_correct ? "correct" : "incorrect"}`;
    const questionRow = document.createElement("div");
    questionRow.className = "review-question";
    const icon = document.createElement("span");
    icon.className = "review-icon";
    icon.textContent = item.is_correct ? "✓" : "×";
    const text = document.createElement("p");
    text.textContent = `${String(index + 1).padStart(2, "0")}. ${item.question}`;
    questionRow.append(icon, text);

    const answer = document.createElement("div");
    answer.className = "review-answer";
    const selected = document.createElement("div");
    selected.textContent = `Tu respuesta: ${item.selected_option}`;
    const correct = document.createElement("div");
    const correctLabel = document.createElement("strong");
    correctLabel.textContent = `Respuesta correcta: ${item.correct_option}`;
    correct.append(correctLabel);
    const explanation = document.createElement("div");
    explanation.className = "review-explanation";
    explanation.textContent = item.explanation;
    answer.append(selected);
    if (!item.is_correct) answer.append(correct);
    answer.append(explanation);
    card.append(questionRow, answer);
    reviewList.append(card);
  }
  window.scrollTo({ top: 0, behavior: "smooth" });
}

startButton.addEventListener("click", startQuiz);
restartButton.addEventListener("click", () => {
  resultsScreen.hidden = true;
  welcomeScreen.hidden = false;
  clearError();
  window.scrollTo({ top: 0, behavior: "smooth" });
});
backButton.addEventListener("click", () => {
  if (currentIndex > 0) {
    currentIndex -= 1;
    renderQuestion();
  }
});
nextButton.addEventListener("click", () => {
  if (currentIndex < questions.length - 1) {
    currentIndex += 1;
    renderQuestion();
  } else {
    submitQuiz();
  }
});
