const socket = io();
const ui = {
    joinPage: document.getElementById("join-page"), waitingPage: document.getElementById("waiting-page"), quizPage: document.getElementById("quiz-page"), finishedPage: document.getElementById("finished-page"),
    joinError: document.getElementById("join-error"), welcomeMessage: document.getElementById("welcome-message"), quizTitle: document.getElementById("quiz-title-display"),
    questionText: document.getElementById("question-text"), questionImage: document.getElementById("question-image"), optionsContainer: document.getElementById("options-container"),
    timerDisplay: document.getElementById("timer-display"), questionScoreDisplay: document.getElementById("question-score-display"), scoreDisplay: document.getElementById("score-display"),
    feedbackContainer: document.getElementById("feedback-container"), feedbackText: document.getElementById("feedback-text"), feedbackScore: document.getElementById("feedback-score"),
    finalScore: document.getElementById("final-score"), playerCount: document.getElementById("player-count-display")
};
let timerInterval;

function showPage(pageId) {
    ["join-page", "waiting-page", "quiz-page", "finished-page"].forEach(id => document.getElementById(id).classList.add("hide"));
    document.getElementById(pageId).classList.remove("hide");
}

document.getElementById("join-form").addEventListener("submit", e => {
    e.preventDefault();
    const name = document.getElementById("name-input").value.trim();
    const joinCode = document.getElementById("joincode-input").value.trim().toUpperCase();
    if (name && joinCode) socket.emit("join", { name, branch: document.getElementById("branch-input").value.trim(), year: document.getElementById("year-input").value.trim(), joinCode });
});

socket.on("joined", ({ name }) => { ui.welcomeMessage.textContent = `Welcome, ${name}!`; showPage("waiting-page"); });
socket.on("quizState", state => { ui.quizTitle.textContent = state.quizName || "QuizCraft"; });
socket.on("playerCount", count => { ui.playerCount.textContent = `Players: ${count}`; });
socket.on("error", ({ message }) => { ui.joinError.textContent = message; ui.joinError.classList.remove("hide"); });
socket.on("quizStarted", state => { ui.quizTitle.textContent = state.quizName; showPage("quiz-page"); socket.emit("requestNextQuestion"); });

socket.on("question", ({ question, index }) => {
    ui.feedbackContainer.classList.add("hide");
    ui.questionText.textContent = `${index + 1}. ${question.text}`;
    ui.questionScoreDisplay.textContent = `Points: ${question.score} / -${question.negativeScore}`;
    ui.questionImage.src = question.imageUrl ? question.imageUrl : "";
    question.imageUrl ? ui.questionImage.classList.remove("hide") : ui.questionImage.classList.add("hide");

    ui.optionsContainer.innerHTML = "";
    JSON.parse(question.options).forEach((optionText, optionIndex) => {
        const button = document.createElement("button");
        button.className = "p-4 rounded-lg text-left text-lg font-semibold transition-all duration-300 border-2 bg-black/20 border-transparent hover:bg-yellow-500/20 hover:border-yellow-500 hover:text-yellow-300";
        button.textContent = optionText;
        button.onclick = () => submitAnswer(optionIndex);
        ui.optionsContainer.appendChild(button);
    });

    clearInterval(timerInterval);
    let timeLeft = question.timeLimit;
    ui.timerDisplay.textContent = `${timeLeft}s`;
    timerInterval = setInterval(() => {
        timeLeft--;
        ui.timerDisplay.textContent = `${timeLeft}s`;
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            if (!ui.optionsContainer.querySelector('button:disabled')) submitAnswer(null);
            setTimeout(() => socket.emit("requestNextQuestion"), 1200);
        }
    }, 1000);
});

socket.on("answerResult", ({ isCorrect, scoreChange, correctOptionIndex, selectedOptionIndex, score }) => {
    ui.scoreDisplay.textContent = score;
    ui.feedbackContainer.classList.remove("hide");
    ui.feedbackText.textContent = isCorrect ? "Correct!" : "Wrong!";
    ui.feedbackText.className = isCorrect ? "text-2xl font-bold text-green-400" : "text-2xl font-bold text-red-400";
    ui.feedbackScore.textContent = `Score: ${scoreChange > 0 ? "+" : ""}${scoreChange}`;
    ui.optionsContainer.querySelectorAll("button").forEach((button, index) => {
        if (index === correctOptionIndex) button.className = "p-4 rounded-lg text-left text-lg font-semibold border-2 bg-green-600/80 border-transparent";
        else if (index === selectedOptionIndex) button.className = "p-4 rounded-lg text-left text-lg font-semibold border-2 bg-red-600/80 border-transparent";
        else button.className = "p-4 rounded-lg text-left text-lg font-semibold border-2 bg-black/20 opacity-60 border-transparent";
    });
});

socket.on("quizFinished", ({ score }) => { ui.finalScore.textContent = score; showPage("finished-page"); });
function submitAnswer(optionIndex) {
    ui.optionsContainer.querySelectorAll("button").forEach(btn => btn.disabled = true);
    socket.emit("submitAnswer", { optionIndex });
}
