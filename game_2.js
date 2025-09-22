// Game state
let gameState = {
    currentPage: 'welcome',
    currentQuestion: 0,
    teams: [
        { name: 'Đội 1', points: 500, bet: 0, hasAnswered: false },
        { name: 'Đội 2', points: 500, bet: 0, hasAnswered: false },
        { name: 'Đội 3', points: 500, bet: 0, hasAnswered: false },
        { name: 'Đội 5', points: 500, bet: 0, hasAnswered: false },
        { name: 'Đội 6', points: 500, bet: 0, hasAnswered: false },
        { name: 'Đội 7', points: 500, bet: 0, hasAnswered: false }
    ],
    questionResults: [], // Lưu kết quả từng câu hỏi alert
    questions: [
        {
            minBet: Math.floor(Math.random() * 51) + 50, // 50-100
            correct: 0 // Chiến lược chiến tranh đặc biệt
        },
        {
            minBet: Math.floor(Math.random() * 51) + 50,
            correct: 0 // Trực thăng vận và thiết xa vận
        },
        {
            minBet: Math.floor(Math.random() * 51) + 50,
            correct: 0 // Sẽ được cập nhật
        },
        {
            minBet: Math.floor(Math.random() * 51) + 50,
            correct: 0 // Sẽ được cập nhật
        },
        {
            minBet: Math.floor(Math.random() * 51) + 50,
            correct: 0 // Sẽ được cập nhật
        },
        {
            minBet: Math.floor(Math.random() * 51) + 50,
            correct: 0 // Sẽ được cập nhật
        },
        {
            minBet: Math.floor(Math.random() * 51) + 50,
            correct: 0 // Sẽ được cập nhật
        }
    ],
    bettingTimer: null,
    bettingTimeLeft: 30,
    answeringTeamIndex: -1,
    currentTurnOrder: []
};

// Function to save question results
function saveQuestionResult(teamName, isCorrect, betAmount) {
    const result = {
        questionNumber: gameState.currentQuestion + 1,
        teamName: teamName,
        isCorrect: isCorrect,
        betAmount: betAmount,
        teamScores: gameState.teams.map(team => ({
            name: team.name,
            points: team.points
        }))
    };
    gameState.questionResults.push(result);
    console.log('Saved result for question', result.questionNumber, ':', result);
}

// Page navigation functions
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    document.getElementById(pageId).classList.add('active');
    gameState.currentPage = pageId;
    updateGameStatus();
}

function showWelcome() {
    showPage('welcomePage');
}

function showRules() {
    showPage('rulesPage');
}

function startGame() {
    gameState.currentQuestion = 0;
    resetTeamsForNewQuestion();
    showBettingPage();
}

function updateGameStatus() {
    const statusElement = document.getElementById('gameStatus');
    switch(gameState.currentPage) {
        case 'welcome':
            statusElement.textContent = 'Chào mừng đến với Game 2: Đặt Cược Trí Tuệ';
            break;
        case 'rules':
            statusElement.textContent = 'Luật chơi';
            break;
        case 'betting':
            statusElement.textContent = `Vòng đặt cược - Câu ${gameState.currentQuestion + 1}/7`;
            break;
        case 'question':
            statusElement.textContent = `Đang trả lời câu hỏi ${gameState.currentQuestion + 1}/7`;
            break;
        case 'results':
            statusElement.textContent = 'Kết quả cuối game';
            break;
    }
}

// Betting phase
function showBettingPage() {
    if (gameState.currentQuestion >= gameState.questions.length) {
        showResults();
        return;
    }

    showPage('bettingPage');
    
    const currentQ = gameState.questions[gameState.currentQuestion];
    document.getElementById('currentQuestionNum').textContent = gameState.currentQuestion + 1;
    document.getElementById('minBet').textContent = currentQ.minBet;
    
    renderTeamsGrid();
    startBettingTimer();
}

function renderTeamsGrid() {
    const grid = document.getElementById('teamsGrid');
    grid.innerHTML = '';
    
    gameState.teams.forEach((team, index) => {
        const teamCard = document.createElement('div');
        teamCard.className = 'team-card';
        
        const currentQ = gameState.questions[gameState.currentQuestion];
        const maxBet = Math.min(team.points, team.points); // Can bet all points
        
        teamCard.innerHTML = `
            <div class="team-name">${team.name}</div>
            <div class="team-points">${team.points} điểm</div>
            <input type="number" 
                   class="bet-input" 
                   id="bet${index}" 
                   min="${Math.min(currentQ.minBet, team.points)}" 
                   max="${maxBet}"
                   value="${Math.min(currentQ.minBet, team.points)}"
                   ${team.points < currentQ.minBet ? 'disabled' : ''}>
            <div style="font-size: 0.9em; color: #666;">
                Min: ${Math.min(currentQ.minBet, team.points)} - Max: ${maxBet}
            </div>
        `;
        
        if (team.points < currentQ.minBet) {
            teamCard.innerHTML += '<div style="color: red; font-size: 0.9em;">Không đủ điểm đặt cược</div>';
        }
        
        grid.appendChild(teamCard);
    });
}

function startBettingTimer() {
    gameState.bettingTimeLeft = 30;
    const timerElement = document.getElementById('bettingTimer');
    const confirmBtn = document.getElementById('confirmBetsBtn');
    
    confirmBtn.disabled = true;
    confirmBtn.textContent = '⏰ Chờ hết giờ...';
    
    gameState.bettingTimer = setInterval(() => {
        gameState.bettingTimeLeft--;
        timerElement.textContent = gameState.bettingTimeLeft;
        
        if (gameState.bettingTimeLeft <= 0) {
            clearInterval(gameState.bettingTimer);
            confirmBtn.disabled = false;
            confirmBtn.textContent = '✅ Xác nhận cược';
            timerElement.textContent = '0';
            timerElement.style.color = '#28a745';
        }
    }, 1000);
}

function confirmBets() {
    clearInterval(gameState.bettingTimer);
    
    // Collect all bets
    gameState.teams.forEach((team, index) => {
        const betInput = document.getElementById(`bet${index}`);
        if (betInput && !betInput.disabled) {
            team.bet = parseInt(betInput.value) || 0;
        } else {
            team.bet = 0;
        }
    });
    
    // Create turn order based on bet amounts (highest to lowest)
    let bettingTeams = [];
    gameState.teams.forEach((team, index) => {
        if (team.bet > 0) {
            bettingTeams.push({ index: index, bet: team.bet });
        }
    });
    
    // Sort by bet amount (highest first)
    bettingTeams.sort((a, b) => b.bet - a.bet);
    
    // Create turn order
    gameState.currentTurnOrder = bettingTeams.map(team => team.index);
    
    gameState.answeringTeamIndex = 0; // Index in turn order
    showQuestionPage();
}

// Question phase
function showQuestionPage() {
    const questionPageId = `question${gameState.currentQuestion + 1}Page`;
    showPage(questionPageId);
    
    if (gameState.currentTurnOrder.length === 0) {
        // No one bet, skip to next question
        nextQuestion();
        return;
    }
    
    const currentTeamIndex = gameState.currentTurnOrder[gameState.answeringTeamIndex];
    const currentTeam = gameState.teams[currentTeamIndex];
    const questionNumber = gameState.currentQuestion + 1;
    
    // Update team and bet info for current question page
    document.getElementById(`answeringTeam${questionNumber}`).textContent = currentTeam.name;
    document.getElementById(`betAmount${questionNumber}`).textContent = currentTeam.bet;
    
    // Hide next question button
    document.getElementById(`nextQuestion${questionNumber}Btn`).style.display = 'none';
}

// New functions for correct/wrong answers
function answerCorrect(questionNum) {
    const currentTeamIndex = gameState.currentTurnOrder[gameState.answeringTeamIndex];
    const currentTeam = gameState.teams[currentTeamIndex];
    
    // Show the correct answer
    const correctAnswerDiv = document.querySelector(`#question${questionNum}Page .correct-answer`);
    correctAnswerDiv.classList.add('show');
    
    // Disable answer buttons
    const correctBtn = document.querySelector(`#question${questionNum}Page .btn-correct`);
    const wrongBtn = document.querySelector(`#question${questionNum}Page .btn-wrong`);
    correctBtn.disabled = true;
    wrongBtn.disabled = true;
    
    // Current team gets double the bet
    currentTeam.points += currentTeam.bet;
    currentTeam.hasAnswered = true;
    
    // Lưu kết quả câu hỏi
    saveQuestionResult(currentTeam.name, true, currentTeam.bet);
    
    let message = `${currentTeam.name} trả lời đúng! +${currentTeam.bet} điểm (tổng: ${currentTeam.points})\n\n`;
    
    // Chỉ trừ điểm các đội đã trả lời sai trước đó
    let wrongTeams = [];
    gameState.currentTurnOrder.forEach((teamIndex, turnIndex) => {
        if (turnIndex < gameState.answeringTeamIndex && gameState.teams[teamIndex].hasAnswered) {
            wrongTeams.push(gameState.teams[teamIndex].name);
        }
    });
    
    if (wrongTeams.length > 0) {
        message += "Các đội đã trả lời sai bị trừ điểm:\n";
        wrongTeams.forEach(teamName => {
            const team = gameState.teams.find(t => t.name === teamName);
            message += `${teamName}: -${team.bet} điểm (tổng: ${team.points})\n`;
        });
    }
    
    setTimeout(() => {
        alert(message);
        
        // Hiển thị thông báo chuyển đổi
        const transitionDiv = document.querySelector(`#question${questionNum}Page .transition-message`);
        if (transitionDiv) {
            transitionDiv.textContent = '⏱️ Đang chuyển sang vòng đặt cược tiếp theo...';
            transitionDiv.classList.add('show');
        }
        
        // Tự động chuyển sang câu tiếp theo sau 3 giây
        setTimeout(() => {
            nextQuestion();
        }, 3000);
    }, 1000);
}

function answerWrong(questionNum) {
    const currentTeamIndex = gameState.currentTurnOrder[gameState.answeringTeamIndex];
    const currentTeam = gameState.teams[currentTeamIndex];
    
    // Current team loses their bet and mark as answered incorrectly
    currentTeam.points -= currentTeam.bet;
    currentTeam.hasAnswered = true;
    
    setTimeout(() => {
        alert(`${currentTeam.name} trả lời sai! -${currentTeam.bet} điểm (tổng: ${currentTeam.points})`);
        
        // Move to next team in turn order
        gameState.answeringTeamIndex++;
        if (gameState.answeringTeamIndex < gameState.currentTurnOrder.length) {
            // Next team's turn
            setTimeout(() => {
                showQuestionPage();
            }, 1500);
        } else {
            // Không còn đội nào, lưu kết quả là không ai đúng
            saveQuestionResult('Không ai', false, 0);
            
            // Tự động chuyển sang câu tiếp theo
            setTimeout(() => {
                nextQuestion();
            }, 3000);
        }
    }, 1000);
}

function nextQuestion() {
    gameState.currentQuestion++;
    resetTeamsForNewQuestion();
    
    if (gameState.currentQuestion >= gameState.questions.length) {
        showResults();
    } else {
        showBettingPage();
    }
}

function resetTeamsForNewQuestion() {
    gameState.teams.forEach(team => {
        team.bet = 0;
        team.hasAnswered = false;
    });
    gameState.answeringTeamIndex = -1;
    gameState.currentTurnOrder = [];
}

// Results phase answerWrong
function showResults() {
    showPage('resultsPage');
    
    // Sort teams by points (descending)
    const sortedTeams = [...gameState.teams].sort((a, b) => b.points - a.points);
    
    const leaderboard = document.getElementById('leaderboard');
    leaderboard.innerHTML = '';
    
    sortedTeams.forEach((team, index) => {
        const rankItem = document.createElement('div');
        rankItem.className = 'rank-item';
        
        let medal = '';
        switch(index) {
            case 0: medal = '🥇'; break;
            case 1: medal = '🥈'; break;
            case 2: medal = '🥉'; break;
            default: medal = `${index + 1}.`; break;
        }
        
        rankItem.innerHTML = `
            <div class="rank-number">${medal}</div>
            <div class="rank-team">${team.name}</div>
            <div class="rank-points">${team.points} điểm</div>
        `;
        
        leaderboard.appendChild(rankItem);
    });
}

function resetGame() {
    gameState = {
        currentPage: 'welcome',
        currentQuestion: 0,
        teams: [
            { name: 'Đội 1', points: 500, bet: 0, hasAnswered: false },
            { name: 'Đội 2', points: 500, bet: 0, hasAnswered: false },
            { name: 'Đội 3', points: 500, bet: 0, hasAnswered: false },
            { name: 'Đội 5', points: 500, bet: 0, hasAnswered: false },
            { name: 'Đội 6', points: 500, bet: 0, hasAnswered: false },
            { name: 'Đội 7', points: 500, bet: 0, hasAnswered: false }
        ],
        questions: gameState.questions.map(q => ({
            ...q,
            minBet: Math.floor(Math.random() * 31) + 10
        })),
        bettingTimer: null,
        bettingTimeLeft: 30,
        answeringTeamIndex: -1,
        currentTurnOrder: []
    };
    
    showWelcome();
}

// Initialize game
document.addEventListener('DOMContentLoaded', function() {
    showWelcome();
});