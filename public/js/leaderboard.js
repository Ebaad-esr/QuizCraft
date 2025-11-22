const socket = io();
const body = document.getElementById("leaderboard-body");
const nameEl = document.getElementById("leaderboard-quiz-name");
socket.on("connect", () => socket.emit("getLeaderboard"));
socket.on("leaderboardUpdate", ({ results, quizName }) => {
    nameEl.textContent = quizName || "QuizCraft";
    body.innerHTML = results.map((r, i) => `<tr class="border-b border-gray-700"><td class="p-4 text-2xl font-bold ${["text-yellow-400","text-gray-300","text-yellow-600"][i]||""}">${i+1}</td><td class="p-4 text-xl">${r.name}</td><td class="p-4 text-xl font-bold text-yellow-400">${r.score}</td></tr>`).join("");
});
